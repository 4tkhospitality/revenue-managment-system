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
        throw new Error("Missing file or hotelId");
    }

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
            message: `Đã đạt giới hạn import (${limitCheck.limit}/tháng). Nâng cấp gói để import thêm.`,
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
            rows = parseExcelToRows(buffer) as unknown as Record<string, string>[];
        } else {
            const csvContent = buffer.toString('utf-8');
            rows = await CSVUtils.parseString(csvContent);
        }
        const validRows = [];
        const seenResIds = new Set<string>(); // Duplicate detection within file

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
                book_time: bookTime,       // NEW: local midnight as UTC
                cancel_time: cancelTime,   // NEW: local midnight as UTC
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
        await prisma.importJob.update({
            where: { job_id: job.job_id },
            data: {
                status: 'failed',
                error_summary: err.message || "Unknown Error",
                finished_at: new Date()
            }
        });

        return { success: false, message: err.message };
    }
}
