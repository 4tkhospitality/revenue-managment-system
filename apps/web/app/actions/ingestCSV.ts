'use server'

import prisma from '../../lib/prisma';
import { CSVUtils } from '../../lib/csv';
import { DateUtils } from '../../lib/date';
import { HashUtils } from '../../lib/hash';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { invalidateStatsCache } from '../../lib/cachedStats';

const STRICT_MODE = true; // Reject job on unknown status

export async function ingestCSV(formData: FormData) {
    const file = formData.get('file') as File;
    const hotelId = formData.get('hotelId') as string;

    if (!file || !hotelId) {
        throw new Error("Missing file or hotelId");
    }

    // 1. Compute Hash
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileHash = HashUtils.computeFileHash(buffer);

    // 2. Check Idempotency
    const existingJob = await prisma.importJob.findFirst({
        where: {
            hotel_id: hotelId,
            file_hash: fileHash
        }
    });

    if (existingJob) {
        if (existingJob.status === 'completed') {
            return { success: false, message: "File already processed", error: "DUPLICATE_FILE" };
        }
        // If failed, allow retry (create new job or reuse? Plan says retry = create new job)
    }

    // 3. Create Job
    const job = await prisma.importJob.create({
        data: {
            hotel_id: hotelId,
            file_name: file.name,
            file_hash: fileHash,
            status: 'processing'
        }
    });

    try {
        // 4. Parse CSV
        const csvContent = buffer.toString('utf-8');
        const rows = await CSVUtils.parseString(csvContent);
        const validRows = [];

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
                // arrival >= departure -> Invalid stay
                throw new Error(`Line ${line}: Arrival must be before Departure`);
            }

            const rooms = parseInt(row.rooms || '0');
            const revenue = parseFloat(row.revenue || '0');

            if (rooms <= 0) throw new Error(`Line ${line}: Rooms must be > 0`);
            if (revenue < 0) throw new Error(`Line ${line}: Revenue cannot be negative`);

            if (status === 'cancelled' && !cancelDate) {
                console.warn(`Line ${line}: Cancelled booking missing cancel_date`);
                // Allow? Plan says warn.
            }

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
                cancel_date: cancelDate
            });
        }

        // 6. Bulk Insert
        // Note: createMany is supported in Prisma with Postgres
        await prisma.reservationsRaw.createMany({
            data: validRows,
            skipDuplicates: true // In case ID repeats in same file? Or let it crash per design?
            // Design says "Append-only" but unique constraint exists (hotel, res, job).
            // If duplicated within file, duplicate key error.
            // Let's assume CSV is unique per res_id effectively.
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
