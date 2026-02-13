/**
 * lib/cancellationBridge.ts
 * V01.1: Cancellation Bridge - Sync cancellation data to reservations
 * 
 * Key features:
 * - Match cancellations to reservations using normalized keys
 * - Detect ambiguous matches (take:2 strategy)
 * - Handle conflicts and DQ issues
 * - Transactional updates
 */

import prisma from '@/lib/prisma';
import { normalizeKey } from '@/lib/normalize';
import { Prisma } from '@prisma/client';

// ============================================================================
// Types - Using Prisma GetPayload for proper typing
// ============================================================================

// Infer model types from Prisma
type ReservationsRaw = Prisma.ReservationsRawGetPayload<object>;
type CancellationRaw = Prisma.CancellationRawGetPayload<object>;

export type MatchStatus =
    | 'matched'
    | 'unmatched'
    | 'ambiguous'
    | 'conflict'
    | 'dq_issue'
    | 'unsupported_partial'
    | 'already_matched';

export interface MatchResult {
    status: MatchStatus;
    reservation: ReservationsRaw | null;
    notes?: string;
}

export interface BridgeResult {
    matched: number;
    unmatched: number;
    ambiguous: number;
    conflicts: number;
    dqIssues: number;
    partial: number;
    alreadyMatched: number;
    details: Array<{
        cancellationId: string;
        status: MatchStatus;
        reservationId?: string;
        notes?: string;
    }>;
}

// ============================================================================
// Main Bridge Functions
// ============================================================================

/**
 * Bridge cancellations to reservations
 * Called after importing cancellation XML
 * 
 * OPTIMIZED: Uses batch queries instead of per-record queries
 * to avoid N+1 problem with remote DB (Supabase)
 */
export async function bridgeCancellations(
    hotelId: string,
    cancellations: CancellationRaw[]
): Promise<BridgeResult> {
    const result: BridgeResult = {
        matched: 0,
        unmatched: 0,
        ambiguous: 0,
        conflicts: 0,
        dqIssues: 0,
        partial: 0,
        alreadyMatched: 0,
        details: []
    };

    if (cancellations.length === 0) return result;

    // ---- BATCH STEP 1: Collect all folio_num_norms and arrival_dates ----
    const folioNorms = new Set<string>();
    const arrivalDates = new Set<string>();

    for (const c of cancellations) {
        const norm = c.folio_num_norm || normalizeKey(c.folio_num);
        if (norm) folioNorms.add(norm);
        if (c.arrival_date) arrivalDates.add(c.arrival_date.toISOString());
    }

    // ---- BATCH STEP 2: Single query to fetch ALL potential matches ----
    const allCandidates = folioNorms.size > 0
        ? await prisma.reservationsRaw.findMany({
            where: {
                hotel_id: hotelId,
                reservation_id_norm: { in: Array.from(folioNorms) },
                arrival_date: { in: Array.from(arrivalDates).map(d => new Date(d)) },
            },
            orderBy: [
                { last_modified_time: 'desc' },
                { book_time: 'desc' },
                { loaded_at: 'desc' }
            ],
        })
        : [];

    // ---- BATCH STEP 3: Index candidates for fast in-memory lookup ----
    // Key: "folioNorm|arrivalISO" → candidates[]
    const candidateIndex = new Map<string, ReservationsRaw[]>();
    for (const res of allCandidates) {
        const key = `${res.reservation_id_norm}|${res.arrival_date.toISOString()}`;
        if (!candidateIndex.has(key)) {
            candidateIndex.set(key, []);
        }
        candidateIndex.get(key)!.push(res);
    }

    // ---- BATCH STEP 4: Process each cancellation in-memory ----
    const cancellationUpdates: Prisma.PrismaPromise<unknown>[] = [];
    const reservationUpdates: Prisma.PrismaPromise<unknown>[] = [];

    for (const cancellation of cancellations) {
        const folioNorm = cancellation.folio_num_norm || normalizeKey(cancellation.folio_num);
        const roomCodeNorm = cancellation.room_code_norm || normalizeKey(cancellation.room_code);
        const arrivalKey = cancellation.arrival_date?.toISOString() || '';

        // Lookup candidates from index
        const lookupKey = `${folioNorm}|${arrivalKey}`;
        let candidates = candidateIndex.get(lookupKey) || [];

        // Filter by room_code if available
        if (roomCodeNorm && candidates.length > 0) {
            const withRoom = candidates.filter(c => c.room_code_norm === roomCodeNorm);
            if (withRoom.length > 0) {
                candidates = withRoom;
            }
            // If no match with room filter, fall through to all candidates
        }

        // Take top 2 for ambiguity detection
        const top2 = candidates.slice(0, 2);

        // Evaluate match result
        const matchResult = processMatchInMemory(cancellation, top2);

        // Update counters
        switch (matchResult.status) {
            case 'matched': result.matched++; break;
            case 'unmatched': result.unmatched++; break;
            case 'ambiguous': result.ambiguous++; break;
            case 'conflict': result.conflicts++; break;
            case 'dq_issue': result.dqIssues++; break;
            case 'unsupported_partial': result.partial++; break;
            case 'already_matched': result.alreadyMatched++; break;
        }

        result.details.push({
            cancellationId: cancellation.id,
            status: matchResult.status,
            reservationId: matchResult.reservation?.id,
            notes: matchResult.notes
        });

        // Queue DB updates (batched)
        if (matchResult.status === 'matched' && matchResult.reservation) {
            const reservation = matchResult.reservation;

            // V02: Cascade cancel to ALL room-type rows for this booking
            // Case A: cancellation has room_code → partial cancel (only that room type)
            // Case B: cancellation has no room_code → full booking cancel (all lines)
            const cascadeWhere: Prisma.ReservationsRawWhereInput = {
                hotel_id: hotelId,
                reservation_id_norm: reservation.reservation_id_norm,
                arrival_date: reservation.arrival_date,
                // Guardrail: only cancel rows booked before the cancel event
                book_time: cancellation.cancel_time
                    ? { lte: cancellation.cancel_time }
                    : undefined,
            };

            // If cancellation specifies a room_code, only cancel that room type
            if (roomCodeNorm) {
                cascadeWhere.room_code_norm = roomCodeNorm;
            }

            // Update all matching reservation rows (cascade)
            reservationUpdates.push(
                prisma.reservationsRaw.updateMany({
                    where: cascadeWhere,
                    data: {
                        cancel_time: cancellation.cancel_time,
                        cancel_date: cancellation.cancel_time,
                        cancel_reason: null,
                        cancel_source: 'import',
                        status: 'cancelled'
                    }
                })
            );

            // Update cancellation
            cancellationUpdates.push(
                prisma.cancellationRaw.update({
                    where: { id: cancellation.id },
                    data: {
                        matched_reservation_id: reservation.id,
                        matched_at: new Date(),
                        match_status: 'matched',
                        match_notes: null
                    }
                })
            );
        } else if (matchResult.status === 'already_matched' && matchResult.reservation) {
            cancellationUpdates.push(
                prisma.cancellationRaw.update({
                    where: { id: cancellation.id },
                    data: {
                        matched_reservation_id: matchResult.reservation.id,
                        matched_at: new Date(),
                        match_status: 'matched',
                        match_notes: 'Already matched (idempotent)'
                    }
                })
            );
        } else {
            cancellationUpdates.push(
                prisma.cancellationRaw.update({
                    where: { id: cancellation.id },
                    data: {
                        match_status: matchResult.status,
                        match_notes: matchResult.notes
                    }
                })
            );
        }
    }

    // ---- BATCH STEP 5: Execute all updates in a single transaction ----
    if (cancellationUpdates.length > 0 || reservationUpdates.length > 0) {
        await prisma.$transaction([...reservationUpdates, ...cancellationUpdates]);
    }

    return result;
}

/**
 * Bridge pending unmatched cancellations
 * Called after importing reservation report
 */
export async function bridgePendingCancellations(
    hotelId: string,
    fromDate?: Date
): Promise<BridgeResult> {
    // Find unmatched cancellations
    const pendingCancellations = await prisma.cancellationRaw.findMany({
        where: {
            hotel_id: hotelId,
            match_status: 'unmatched',
            ...(fromDate && { as_of_date: { gte: fromDate } })
        }
    });

    if (pendingCancellations.length === 0) {
        return {
            matched: 0,
            unmatched: 0,
            ambiguous: 0,
            conflicts: 0,
            dqIssues: 0,
            partial: 0,
            alreadyMatched: 0,
            details: []
        };
    }

    return bridgeCancellations(hotelId, pendingCancellations);
}

// ============================================================================
// Internal Functions (In-memory processing)
// ============================================================================

/**
 * Process match logic in-memory (no DB calls)
 */
function processMatchInMemory(
    cancellation: CancellationRaw,
    candidates: ReservationsRaw[]
): MatchResult {
    // No candidates found
    if (candidates.length === 0) {
        return { status: 'unmatched', reservation: null };
    }

    // Evaluate ambiguity
    const matchResult = evaluateCandidates(candidates);
    if (matchResult.status !== 'matched' || !matchResult.reservation) {
        return matchResult;
    }

    const reservation = matchResult.reservation;

    // Check for partial cancellation (V01.1 scope: only full cancel)
    const reservationNights = Math.ceil(
        (reservation.departure_date.getTime() - reservation.arrival_date.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (cancellation.nights < reservationNights) {
        return {
            status: 'unsupported_partial',
            reservation: null,
            notes: `Partial cancel: ${cancellation.nights}/${reservationNights} nights`
        };
    }

    // Data quality check - cancel_time should be after book_time
    const effectiveBookTime = reservation.book_time ??
        new Date(new Date(reservation.booking_date).setHours(0, 0, 0, 0));

    if (cancellation.cancel_time < effectiveBookTime) {
        return {
            status: 'dq_issue',
            reservation: null,
            notes: `cancel_time (${cancellation.cancel_time.toISOString()}) < book_time (${effectiveBookTime.toISOString()})`
        };
    }

    // Check for conflict (if cancel_time already set with different value)
    if (reservation.cancel_time !== null) {
        const existingTime = reservation.cancel_time.getTime();
        const incomingTime = cancellation.cancel_time.getTime();

        if (existingTime === incomingTime) {
            return {
                status: 'already_matched',
                reservation: reservation,
                notes: 'Same cancel_time already set'
            };
        } else {
            return {
                status: 'conflict',
                reservation: null,
                notes: `Existing: ${reservation.cancel_time.toISOString()}, Incoming: ${cancellation.cancel_time.toISOString()}`
            };
        }
    }

    // All checks passed → matched
    return {
        status: 'matched',
        reservation: reservation
    };
}

/**
 * Evaluate candidates list and return match result
 */
function evaluateCandidates(candidates: ReservationsRaw[]): MatchResult {
    if (candidates.length === 1) {
        return { status: 'matched', reservation: candidates[0] };
    }

    // 2 candidates: check if tie (ambiguous)
    const c0 = candidates[0];
    const c1 = candidates[1];

    const isTie =
        c0.last_modified_time?.getTime() === c1.last_modified_time?.getTime() &&
        c0.book_time?.getTime() === c1.book_time?.getTime() &&
        c0.loaded_at.getTime() === c1.loaded_at.getTime();

    if (isTie) {
        return {
            status: 'ambiguous',
            reservation: null,
            notes: `Multiple identical candidates: ${c0.id}, ${c1.id}`
        };
    }

    // Not a tie: pick first (highest priority by sort order)
    return { status: 'matched', reservation: candidates[0] };
}

