'use server'

import prisma from '../../lib/prisma';
import { parseCrystalReportXML, ParsedReservation } from '../../lib/xmlParser';
import { HashUtils } from '../../lib/hash';
import { revalidatePath } from 'next/cache';
import { invalidateStatsCache } from '../../lib/cachedStats';

/**
 * Ingest Crystal Reports XML file (Booked or Cancelled report)
 */
export async function ingestXML(formData: FormData) {
    const file = formData.get('file') as File;
    const hotelId = formData.get('hotelId') as string;
    const reportType = formData.get('reportType') as 'booked' | 'cancelled';

    if (!file || !hotelId || !reportType) {
        return { success: false, message: "Missing file, hotelId, or reportType" };
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

    if (existingJob?.status === 'completed') {
        return { success: false, message: "File already processed", error: "DUPLICATE_FILE" };
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
        // 4. Parse XML
        const xmlContent = buffer.toString('utf-8');
        const parseResult = parseCrystalReportXML(xmlContent, reportType);

        if (!parseResult.success) {
            throw new Error(parseResult.error || 'Failed to parse XML');
        }

        if (parseResult.reservations.length === 0) {
            throw new Error('No reservations found in XML file');
        }

        // 5. Convert to database format
        // bookingDate should now come from XML @BookedDate field
        // Fallback to today's date only if still empty
        const today = new Date().toISOString().split('T')[0];

        const validRows = parseResult.reservations.map((r: ParsedReservation) => {
            const bookingDateStr = r.bookingDate || today;
            return {
                hotel_id: hotelId,
                job_id: job.job_id,
                reservation_id: r.confirmNum,
                booking_date: new Date(bookingDateStr),
                arrival_date: new Date(r.arrivalDate),
                departure_date: new Date(r.departureDate),
                rooms: r.rooms,
                revenue: r.revenue,
                status: r.status,
                cancel_date: r.status === 'cancelled' ? new Date(bookingDateStr) : null,
                company_name: r.companyName || null, // OTA/Agent from XML
            };
        });

        // 6. Insert
        await prisma.reservationsRaw.createMany({
            data: validRows,
            skipDuplicates: true
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

        return {
            success: true,
            jobId: job.job_id,
            count: validRows.length,
            reportDate: parseResult.reportDate,
            reportType: parseResult.reportType
        };

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
