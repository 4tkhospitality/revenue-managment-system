'use server'

import prisma from '../../lib/prisma';
import { parseCrystalReportXML, ParsedReservation } from '../../lib/xmlParser';
import { HashUtils } from '../../lib/hash';
import { revalidatePath } from 'next/cache';
import { invalidateStatsCache } from '../../lib/cachedStats';

/**
 * Ingest Crystal Reports XML file (Booked or Cancelled report)
 * Performance logging enabled for optimization analysis
 */
export async function ingestXML(formData: FormData) {
    const totalStart = Date.now();
    const timings: Record<string, number> = {};

    const file = formData.get('file') as File;
    const hotelId = formData.get('hotelId') as string;
    const reportType = formData.get('reportType') as 'booked' | 'cancelled';

    if (!file || !hotelId || !reportType) {
        return { success: false, message: "Missing file, hotelId, or reportType" };
    }

    console.log(`\n========== [UPLOAD] ${file.name} ==========`);
    console.log(`[UPLOAD] File size: ${(file.size / 1024).toFixed(1)} KB`);
    console.log(`[UPLOAD] Report type: ${reportType}`);
    console.log(`[UPLOAD] Hotel ID: ${hotelId}`);

    // 0. Validate hotel exists — fallback to Demo Hotel if not
    let step0Start = Date.now();
    let validHotelId = hotelId;
    const hotelExists = await prisma.hotel.findUnique({
        where: { hotel_id: hotelId },
        select: { hotel_id: true },
    });
    if (!hotelExists) {
        // Fallback to Demo Hotel
        const { getOrCreateDemoHotel } = await import('../../lib/pricing/get-hotel');
        validHotelId = await getOrCreateDemoHotel();
        console.warn(`[UPLOAD] Hotel ${hotelId} not found, fallback to Demo: ${validHotelId}`);
    }
    timings['0_validate_hotel'] = Date.now() - step0Start;

    // 1. Compute Hash
    let step1Start = Date.now();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileHash = HashUtils.computeFileHash(buffer);
    timings['1_read_file_and_hash'] = Date.now() - step1Start;

    // 2. Check Idempotency
    let step2Start = Date.now();
    const existingJob = await prisma.importJob.findFirst({
        where: {
            hotel_id: validHotelId,
            file_hash: fileHash
        }
    });
    timings['2_check_duplicate'] = Date.now() - step2Start;

    if (existingJob?.status === 'completed') {
        console.log(`[UPLOAD] ⚠️ DUPLICATE FILE - already processed`);
        console.log(`[UPLOAD] Total time: ${Date.now() - totalStart}ms (rejected)`);
        return { success: false, message: "File already processed", error: "DUPLICATE_FILE" };
    }

    // 2.1 Clean up stale/failed jobs for this file (prevents unique constraint violation)
    if (existingJob) {
        console.log(`[UPLOAD] 🧹 Cleaning up stale job ${existingJob.job_id} (status: ${existingJob.status})`);
        // Delete any reservations linked to the failed job first
        await prisma.reservationsRaw.deleteMany({ where: { job_id: existingJob.job_id } });
        await prisma.importJob.delete({ where: { job_id: existingJob.job_id } });
    }

    // 3. Create Job
    let step3Start = Date.now();
    const job = await prisma.importJob.create({
        data: {
            hotel_id: validHotelId,
            file_name: file.name,
            file_hash: fileHash,
            status: 'processing'
        }
    });
    timings['3_create_job'] = Date.now() - step3Start;

    try {
        // 4. Parse XML
        let step4Start = Date.now();
        const xmlContent = buffer.toString('utf-8');
        const parseResult = parseCrystalReportXML(xmlContent, reportType);
        timings['4_parse_xml'] = Date.now() - step4Start;

        if (!parseResult.success) {
            throw new Error(parseResult.error || 'Failed to parse XML');
        }

        if (parseResult.reservations.length === 0) {
            throw new Error('No reservations found in XML file');
        }

        console.log(`[UPLOAD] Parsed ${parseResult.reservations.length} reservations`);

        // 5. Convert to database format (v2 — full GM dimensions)
        let step5Start = Date.now();
        const today = new Date().toISOString().split('T')[0];

        // Segment inference based on account name (ClientName)
        function inferSegment(accountName: string | null | undefined): string {
            if (!accountName) return 'UNKNOWN';
            const norm = accountName.toUpperCase().trim();
            if (norm.includes('AGODA')) return 'OTA';
            if (norm.includes('BOOKING')) return 'OTA';
            if (norm.includes('CTRIP') || norm.includes('TRIP.COM')) return 'OTA';
            if (norm.includes('EXPEDIA')) return 'OTA';
            if (norm.includes('TRAVELOKA')) return 'OTA';
            if (norm.includes('HOTELS.COM')) return 'OTA';
            if (norm.includes('HOSTELWORLD')) return 'OTA';
            if (norm === '' || norm === 'UNKNOWN') return 'UNKNOWN';
            return 'AGENT';
        }

        let crossCheckWarnings = 0;

        const validRows = parseResult.reservations.map((r: ParsedReservation) => {
            const bookingDateStr = r.bookingDate || today;

            // Cross-check: room_nights should equal rooms × nights
            const expectedRoomNights = r.rooms * r.nights;
            if (r.roomNights !== expectedRoomNights) {
                crossCheckWarnings++;
                console.warn(`[UPLOAD] ⚠️ Cross-check: ${r.confirmNum} room_type=${r.roomType} — Rnight=${r.roomNights} vs rooms×nights=${expectedRoomNights}`);
            }

            const companyName = r.companyName || null;
            const accountNorm = companyName
                ? companyName.toUpperCase().trim().replace(/\s+/g, ' ')
                : null;

            return {
                hotel_id: validHotelId,
                job_id: job.job_id,
                reservation_id: r.confirmNum,
                booking_date: new Date(bookingDateStr),
                arrival_date: new Date(r.arrivalDate),
                departure_date: new Date(r.departureDate),
                rooms: r.rooms,
                revenue: r.revenue,
                status: r.status,
                cancel_date: r.status === 'cancelled' ? new Date(bookingDateStr) : null,
                // --- Source/Account (ClientName) ---
                company_name: companyName,
                account_name_norm: accountNorm,
                segment: inferSegment(companyName),
                // --- Room Type ---
                room_code: r.roomType || null,
                // --- Guest / Group ---
                guest_group_name: r.guestName || null,
                // --- Sales Rep ---
                salesperson_name: r.salespersonName || null,
                // --- Revenue/Rate ---
                net_rate_per_room_night: r.ratePerRoomNight || null,
                // --- Quantities ---
                pax: r.pax || null,
                room_nights: r.roomNights || null,
                nights: r.nights || null,
                // --- Clerk ---
                create_clerk: r.createClerk || null,
            };
        });

        if (crossCheckWarnings > 0) {
            console.warn(`[UPLOAD] ⚠️ ${crossCheckWarnings} cross-check warnings (Rnight ≠ rooms×nights)`);
        }

        timings['5_transform_data'] = Date.now() - step5Start;

        // 6. Insert
        let step6Start = Date.now();
        await prisma.reservationsRaw.createMany({
            data: validRows,
            skipDuplicates: true
        });
        timings['6_db_insert'] = Date.now() - step6Start;

        // 7. Complete Job
        let step7Start = Date.now();
        await prisma.importJob.update({
            where: { job_id: job.job_id },
            data: { status: 'completed', finished_at: new Date() }
        });
        timings['7_complete_job'] = Date.now() - step7Start;

        // 7.1 Invalidate stats cache
        let step71Start = Date.now();
        invalidateStatsCache();
        timings['7.1_invalidate_cache'] = Date.now() - step71Start;

        try {
            let step8Start = Date.now();
            revalidatePath('/dashboard');
            revalidatePath('/data');
            timings['8_revalidate_paths'] = Date.now() - step8Start;
        } catch (e) {
            // Ignore revalidate error in script/test context
        }

        // Log all timings
        const totalTime = Date.now() - totalStart;
        console.log(`\n[UPLOAD] ✅ SUCCESS - ${validRows.length} records`);
        console.log(`[UPLOAD] -------- TIMING BREAKDOWN --------`);
        Object.entries(timings).forEach(([step, ms]) => {
            const pct = ((ms / totalTime) * 100).toFixed(1);
            console.log(`[UPLOAD]   ${step}: ${ms}ms (${pct}%)`);
        });
        console.log(`[UPLOAD] --------------------------------`);
        console.log(`[UPLOAD] TOTAL: ${totalTime}ms`);
        console.log(`[UPLOAD] Speed: ${(validRows.length / (totalTime / 1000)).toFixed(1)} records/sec`);
        console.log(`==========================================\n`);

        return {
            success: true,
            jobId: job.job_id,
            count: validRows.length,
            reportDate: parseResult.reportDate,
            reportType: parseResult.reportType,
            // Include timings for frontend display
            timings: {
                total: totalTime,
                breakdown: timings
            }
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

        const totalTime = Date.now() - totalStart;
        console.log(`[UPLOAD] ❌ FAILED after ${totalTime}ms: ${err.message}`);

        return { success: false, message: err.message };
    }
}
