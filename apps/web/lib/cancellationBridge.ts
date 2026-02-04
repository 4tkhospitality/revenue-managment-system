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

    for (const cancellation of cancellations) {
        const matchResult = await processCancellation(hotelId, cancellation);

        // Update counters
        switch (matchResult.status) {
            case 'matched':
                result.matched++;
                break;
            case 'unmatched':
                result.unmatched++;
                break;
            case 'ambiguous':
                result.ambiguous++;
                break;
            case 'conflict':
                result.conflicts++;
                break;
            case 'dq_issue':
                result.dqIssues++;
                break;
            case 'unsupported_partial':
                result.partial++;
                break;
            case 'already_matched':
                result.alreadyMatched++;
                break;
        }

        result.details.push({
            cancellationId: cancellation.id,
            status: matchResult.status,
            reservationId: matchResult.reservation?.id,
            notes: matchResult.notes
        });
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
// Internal Functions
// ============================================================================

/**
 * Process a single cancellation
 */
async function processCancellation(
    hotelId: string,
    cancellation: CancellationRaw
): Promise<MatchResult> {
    // Step 1: Find matching reservation
    const matchResult = await findMatchingReservation(hotelId, cancellation);

    if (matchResult.status !== 'matched' || !matchResult.reservation) {
        // Update cancellation with match status
        await prisma.cancellationRaw.update({
            where: { id: cancellation.id },
            data: {
                match_status: matchResult.status,
                match_notes: matchResult.notes
            }
        });
        return matchResult;
    }

    const reservation = matchResult.reservation;

    // Step 2: Check for partial cancellation (V01.1 scope: only full cancel)
    const reservationNights = Math.ceil(
        (reservation.departure_date.getTime() - reservation.arrival_date.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (cancellation.nights < reservationNights) {
        const result: MatchResult = {
            status: 'unsupported_partial',
            reservation: null,
            notes: `Partial cancel: ${cancellation.nights}/${reservationNights} nights`
        };
        await prisma.cancellationRaw.update({
            where: { id: cancellation.id },
            data: {
                match_status: result.status,
                match_notes: result.notes
            }
        });
        return result;
    }

    // Step 3: Data quality check - cancel_time should be after book_time
    const effectiveBookTime = reservation.book_time ??
        new Date(new Date(reservation.booking_date).setHours(0, 0, 0, 0));

    if (cancellation.cancel_time < effectiveBookTime) {
        const result: MatchResult = {
            status: 'dq_issue',
            reservation: null,
            notes: `cancel_time (${cancellation.cancel_time.toISOString()}) < book_time (${effectiveBookTime.toISOString()})`
        };
        await prisma.cancellationRaw.update({
            where: { id: cancellation.id },
            data: {
                match_status: result.status,
                match_notes: result.notes
            }
        });
        return result;
    }

    // Step 4: Check for conflict (if cancel_time already set with different value)
    if (reservation.cancel_time !== null) {
        const existingTime = reservation.cancel_time.getTime();
        const incomingTime = cancellation.cancel_time.getTime();

        if (existingTime === incomingTime) {
            // Same value - idempotent, no-op
            const result: MatchResult = {
                status: 'already_matched',
                reservation: reservation,
                notes: 'Same cancel_time already set'
            };
            await prisma.cancellationRaw.update({
                where: { id: cancellation.id },
                data: {
                    matched_reservation_id: reservation.id,
                    matched_at: new Date(),
                    match_status: 'matched',
                    match_notes: 'Already matched (idempotent)'
                }
            });
            return result;
        } else {
            // Different value - conflict
            const result: MatchResult = {
                status: 'conflict',
                reservation: null,
                notes: `Existing: ${reservation.cancel_time.toISOString()}, Incoming: ${cancellation.cancel_time.toISOString()}`
            };
            await prisma.cancellationRaw.update({
                where: { id: cancellation.id },
                data: {
                    match_status: result.status,
                    match_notes: result.notes
                }
            });
            return result;
        }
    }

    // Step 5: Apply the bridge - transactional update
    await prisma.$transaction([
        // Update reservation with cancel info
        prisma.reservationsRaw.update({
            where: { id: reservation.id },
            data: {
                cancel_time: cancellation.cancel_time,
                cancel_date: cancellation.cancel_time, // Also set legacy field
                cancel_reason: null, // Not available in XML
                cancel_source: 'import',
                status: 'cancelled'
            }
        }),
        // Update cancellation with match tracking
        prisma.cancellationRaw.update({
            where: { id: cancellation.id },
            data: {
                matched_reservation_id: reservation.id,
                matched_at: new Date(),
                match_status: 'matched',
                match_notes: null
            }
        })
    ]);

    return {
        status: 'matched',
        reservation: reservation
    };
}

/**
 * Find matching reservation for a cancellation
 * Uses take:2 strategy to detect ambiguous matches
 */
async function findMatchingReservation(
    hotelId: string,
    cancellation: CancellationRaw
): Promise<MatchResult> {
    const folioNorm = cancellation.folio_num_norm || normalizeKey(cancellation.folio_num);
    const roomCodeNorm = cancellation.room_code_norm || normalizeKey(cancellation.room_code);

    // Query TOP 2 candidates to detect ambiguity
    const candidates = await prisma.reservationsRaw.findMany({
        where: {
            hotel_id: hotelId,
            reservation_id_norm: folioNorm,
            arrival_date: cancellation.arrival_date,
            // Optional: room_code filter for more precise matching
            ...(roomCodeNorm && { room_code_norm: roomCodeNorm })
        },
        orderBy: [
            { last_modified_time: 'desc' },
            { book_time: 'desc' },
            { loaded_at: 'desc' }
        ],
        take: 2  // MUST be 2 to detect ambiguity
    });

    if (candidates.length === 0) {
        // Try without room_code filter
        if (roomCodeNorm) {
            const candidatesWithoutRoom = await prisma.reservationsRaw.findMany({
                where: {
                    hotel_id: hotelId,
                    reservation_id_norm: folioNorm,
                    arrival_date: cancellation.arrival_date
                },
                orderBy: [
                    { last_modified_time: 'desc' },
                    { book_time: 'desc' },
                    { loaded_at: 'desc' }
                ],
                take: 2
            });

            if (candidatesWithoutRoom.length === 0) {
                return { status: 'unmatched', reservation: null };
            }

            return evaluateCandidates(candidatesWithoutRoom);
        }

        return { status: 'unmatched', reservation: null };
    }

    return evaluateCandidates(candidates);
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
