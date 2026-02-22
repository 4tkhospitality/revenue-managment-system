'use server'

import prisma from '../../lib/prisma';
import { CSVUtils } from '../../lib/csv';
import { DateUtils } from '../../lib/date';
import { HashUtils } from '../../lib/hash';
import { parseExcelToRows } from '../../lib/excel';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { invalidateStatsCache } from '../../lib/cachedStats';
import { checkLimit } from '../../lib/tier/checkFeature';

const STRICT_MODE = true; // Reject job on unknown status

/**
 * Option A: Convert a date to local midnight (Asia/Ho_Chi_Minh) stored as UTC.
 * VN = UTC+7, so local midnight = UTC 17:00 previous day.
 * Example: booking_date "2026-01-15" → book_time "2026-01-14T17:00:00Z"
 */
function toLocalMidnightUTC(date: Date, tzOffsetHours: number = 7): Date {
    const d = new Date(date);
    // Set to midnight of the date in UTC, then subtract timezone offset
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCHours(d.getUTCHours() - tzOffsetHours);
    return d;
}

export async function ingestCSV(formData: FormData) {
    const file = formData.get('file') as File;
    const hotelId = formData.get('hotelId') as string;

    if (!file || !hotelId) {
        console.error(`[UPLOAD CSV] ❌ Missing params — file: ${!!file}, hotelId: "${hotelId}"`);
        throw new Error("Missing file or hotelId");
    }

    console.log(`[UPLOAD CSV] 📋 Start — hotelId: "${hotelId}", file: "${file.name}", size: ${file.size} bytes`);

    // ═══ TIER GATING: Check import limit ═══
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const importsThisMonth = await prisma.importJob.count({
        where: { hotel_id: hotelId, created_at: { gte: startOfMonth } },
    });
    const limitCheck = await checkLimit(hotelId, 'imports_month', importsThisMonth);
    if (!limitCheck.allowed) {
        return {
            success: false,
            message: `Import limit reached (${limitCheck.limit}/month). Upgrade your plan to import more.`,
            error: 'LIMIT_EXCEEDED',
        };
    }
    // ═══ END TIER GATING ═══

    // 1. Compute Hash
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileHash = HashUtils.computeFileHash(buffer);

    // 2. Check Idempotency (with retry policy for failed jobs)
    const existingJob = await prisma.importJob.findFirst({
        where: {
            hotel_id: hotelId,
            file_hash: fileHash
        }
    });

    let job: any;

    if (existingJob) {
        if (existingJob.status === 'completed') {
            return { success: false, message: "File already processed", error: "DUPLICATE_FILE" };
        }
        if (existingJob.status === 'processing') {
            return { success: false, message: "File is still being processed", error: "STILL_PROCESSING" };
        }
        if (existingJob.status === 'failed') {
            // Retry: clean up old data, reuse same job
            await prisma.reservationsRaw.deleteMany({ where: { job_id: existingJob.job_id } });
            await prisma.importJob.update({
                where: { job_id: existingJob.job_id },
                data: { status: 'processing', error_summary: null, finished_at: null }
            });
            job = existingJob;
        }
    }

    // ═══ VALIDATE HOTEL EXISTS ═══
    const hotelExists = await prisma.hotel.findUnique({
        where: { hotel_id: hotelId },
        select: { hotel_id: true },
    });
    if (!hotelExists) {
        console.error(`[UPLOAD CSV] ❌ Hotel NOT FOUND — hotelId: "${hotelId}" (full ID)`);
        return {
            success: false,
            message: `Hotel not found (ID: ${hotelId.slice(0, 8)}...). Please refresh the page and try again.`,
            error: 'HOTEL_NOT_FOUND',
        };
    }
    console.log(`[UPLOAD CSV] ✅ Hotel validated — hotelId: "${hotelId.slice(0, 8)}..."`);
    // ═══ END VALIDATE ═══

    // 3. Create Job (only if no existing job to reuse)
    if (!job) {
        job = await prisma.importJob.create({
            data: {
                hotel_id: hotelId,
                file_name: file.name,
                file_hash: fileHash,
                status: 'processing',
                snapshot_ts: new Date(), // Default snapshot = now
            }
        });
    }

    try {
        // 4. Parse CSV or Excel
        const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
        let rows: Record<string, string>[];

        if (isExcel) {
            rows = await parseExcelToRows(buffer) as unknown as Record<string, string>[];
        } else {
            const csvContent = buffer.toString('utf-8');
            rows = await CSVUtils.parseString(csvContent);
        }
        const validRows = [];
        const seenResIds = new Set<string>(); // Duplicate detection within file

        // Segment inference based on company_name/source (matching ingestXML.ts logic)
        function inferSegment(accountName: string | null | undefined): string {
            if (!accountName || accountName.trim() === '') return 'DIRECT';
            const norm = accountName.toUpperCase().trim();
            if (norm.includes('AGODA')) return 'OTA';
            if (norm.includes('BOOKING')) return 'OTA';
            if (norm.includes('CTRIP') || norm.includes('TRIP.COM')) return 'OTA';
            if (norm.includes('EXPEDIA')) return 'OTA';
            if (norm.includes('TRAVELOKA')) return 'OTA';
            if (norm.includes('HOTELS.COM')) return 'OTA';
            if (norm.includes('HOSTELWORLD')) return 'OTA';
            if (norm === 'UNKNOWN') return 'UNKNOWN';
            return 'AGENT';
        }

        // 5. Validation Loop
        for (const [index, row] of rows.entries()) {
            const line = index + 2; // header is 1

            // Normalize Status
            const rawStatus = row.status?.trim().toLowerCase();
            let status: 'booked' | 'cancelled';

            if (rawStatus === 'booked' || rawStatus === 'confirmed') status = 'booked';
            else if (rawStatus === 'cancelled' || rawStatus === 'canceled') status = 'cancelled';
            else {
                if (STRICT_MODE) throw new Error(`Line ${line}: Unknown status '${rawStatus}'`);
                console.warn(`Line ${line}: Unknown status '${rawStatus}', skipping.`);
                continue;
            }

            // Parse Dates
            const bookingDate = DateUtils.parseDate(row.booking_date);
            const arrivalDate = DateUtils.parseDate(row.arrival_date);
            const departureDate = DateUtils.parseDate(row.departure_date);
            const cancelDate = row.cancel_date ? DateUtils.parseDate(row.cancel_date) : null;

            if (!bookingDate || !arrivalDate || !departureDate) {
                throw new Error(`Line ${line}: Invalid dates`);
            }

            // Logical Validations
            if (!DateUtils.isBefore(arrivalDate, departureDate)) {
                throw new Error(`Line ${line}: Arrival must be before Departure`);
            }

            const rooms = parseInt(row.rooms || '0');
            const revenue = Math.round(parseFloat(row.revenue || '0')); // VND integer guardrail

            if (rooms <= 0) throw new Error(`Line ${line}: Rooms must be > 0`);
            if (revenue < 0) throw new Error(`Line ${line}: Revenue cannot be negative`);

            // P0: Reject cancelled rows missing cancel_date (strict policy)
            if (status === 'cancelled' && !cancelDate) {
                throw new Error(`Line ${line}: Cancelled booking MUST have cancel_date`);
            }

            // P1: Detect duplicate reservation_id within same CSV
            if (row.reservation_id && seenResIds.has(row.reservation_id)) {
                throw new Error(`Line ${line}: Duplicate reservation_id '${row.reservation_id}' in same file`);
            }
            if (row.reservation_id) seenResIds.add(row.reservation_id);

            // P0: Map date → timestamp for OTB time-travel (Option A: local midnight → UTC)
            const bookTime = toLocalMidnightUTC(bookingDate);
            const cancelTime = cancelDate ? toLocalMidnightUTC(cancelDate) : null;

            // GM Reporting dimension fields
            const companyName = row.company_name?.trim() || null;
            const accountNorm = companyName
                ? companyName.toUpperCase().trim().replace(/\s+/g, ' ')
                : null;
            const nightsVal = row.nights ? parseInt(row.nights) : null;
            const roomNightsVal = row.room_nights ? parseInt(row.room_nights) : null;
            const paxVal = row.pax ? parseInt(row.pax) : null;
            const rateVal = row.rate_per_room_night ? Math.round(parseFloat(row.rate_per_room_night)) : null;

            validRows.push({
                hotel_id: hotelId,
                job_id: job.job_id,
                reservation_id: row.reservation_id,
                booking_date: bookingDate,
                arrival_date: arrivalDate,
                departure_date: departureDate,
                rooms: rooms,
                revenue: revenue,
                status: status,
                cancel_date: cancelDate,
                book_time: bookTime,       // local midnight as UTC
                cancel_time: cancelTime,   // local midnight as UTC
                // --- Source/Account (ClientName) ---
                company_name: companyName,
                account_name_norm: accountNorm,
                segment: inferSegment(companyName),
                // --- Room Type ---
                room_code: row.room_type?.trim() || null,
                // --- Guest / Group ---
                guest_group_name: row.guest_name?.trim() || null,
                // --- Sales Rep ---
                salesperson_name: row.salesperson?.trim() || null,
                // --- Revenue/Rate ---
                net_rate_per_room_night: rateVal,
                // --- Quantities ---
                pax: paxVal,
                room_nights: roomNightsVal,
                nights: nightsVal,
                // --- Clerk ---
                create_clerk: row.create_clerk?.trim() || null,
            });
        }

        // 6. Bulk Insert (no skipDuplicates — Step 3 catches dupes explicitly)
        await prisma.reservationsRaw.createMany({
            data: validRows,
        });

        // 7. Complete Job
        await prisma.importJob.update({
            where: { job_id: job.job_id },
            data: { status: 'completed', finished_at: new Date() }
        });

        // 7.1 Invalidate stats cache
        invalidateStatsCache();

        try {
            revalidatePath('/dashboard');
        } catch (e) {
            // Ignore revalidate error in script/test context
        }
        return { success: true, jobId: job.job_id, count: validRows.length };

    } catch (err: any) {
        // 8. Fail Job
        const errorMessage = err.message || "Unknown Error";

        // Translate known errors to friendly messages
        let friendlyMessage = errorMessage;
        if (errorMessage.includes('Foreign key constraint failed')) {
            friendlyMessage = 'Invalid hotel. Please refresh the page and try again.';
        } else if (errorMessage.includes('Unique constraint failed')) {
            friendlyMessage = 'Duplicate data. Please check that the file does not contain previously imported records.';
        } else if (errorMessage.includes('Connection')) {
            friendlyMessage = 'Database connection lost. Please try again shortly.';
        }

        console.error(`[UPLOAD CSV] ❌ FAILED: ${errorMessage}`);

        await prisma.importJob.update({
            where: { job_id: job.job_id },
            data: {
                status: 'failed',
                error_summary: friendlyMessage,
                finished_at: new Date()
            }
        });

        return { success: false, message: friendlyMessage };
    }
}
