"use server"

import prisma from "@/lib/prisma"
import { parseCancellationXml } from "@/lib/parseCancellationXml"
import { normalizeKey } from "@/lib/normalize"
import { bridgeCancellations, BridgeResult } from "@/lib/cancellationBridge"
import { invalidateStatsCache } from "@/lib/cachedStats"
import crypto from "crypto"

interface IngestCancellationResult {
    success: boolean
    jobId?: string
    recordCount?: number
    asOfDate?: string
    error?: string
    // V01.1: Bridge results
    bridgeResult?: {
        matched: number
        unmatched: number
        ambiguous: number
        conflicts: number
    }
    // Performance timings
    timings?: {
        total: number
        breakdown: Record<string, number>
    }
}

export async function ingestCancellationXml(
    hotelId: string,
    xmlContent: string,
    fileName: string
): Promise<IngestCancellationResult> {
    const totalStart = Date.now()
    const timings: Record<string, number> = {}

    console.log(`\n========== [CANCEL] ${fileName} ==========`)
    console.log(`[CANCEL] File size: ${(xmlContent.length / 1024).toFixed(1)} KB`)
    console.log(`[CANCEL] Hotel ID: ${hotelId}`)

    // 0. Validate hotel exists — fallback to Demo Hotel if not
    let step0Start = Date.now()
    let validHotelId = hotelId;
    const hotelExists = await prisma.hotel.findUnique({
        where: { hotel_id: hotelId },
        select: { hotel_id: true },
    });
    if (!hotelExists) {
        const { getOrCreateDemoHotel } = await import('@/lib/pricing/get-hotel');
        validHotelId = await getOrCreateDemoHotel();
        console.warn(`[CANCEL] Hotel ${hotelId} not found, fallback to Demo: ${validHotelId}`);
    }
    timings['0_validate_hotel'] = Date.now() - step0Start

    // 1. Calculate file hash for idempotency
    let step1Start = Date.now()
    const fileHash = crypto.createHash("md5").update(xmlContent).digest("hex")
    timings['1_compute_hash'] = Date.now() - step1Start

    // 2. Check for duplicate import
    let step2Start = Date.now()
    const existingJob = await prisma.importJob.findFirst({
        where: {
            hotel_id: validHotelId,
            file_hash: fileHash,
            import_type: "CANCELLATION",
        },
    })
    timings['2_check_duplicate'] = Date.now() - step2Start

    if (existingJob) {
        console.log(`[CANCEL] ⚠️ DUPLICATE FILE - already processed`)
        console.log(`[CANCEL] Total time: ${Date.now() - totalStart}ms (rejected)`)
        return {
            success: false,
            error: `File này đã được import trước đó (Job ID: ${existingJob.job_id})`,
        }
    }

    // 3. Create import job
    let step3Start = Date.now()
    const job = await prisma.importJob.create({
        data: {
            hotel_id: validHotelId,
            import_type: "CANCELLATION",
            file_name: fileName,
            file_hash: fileHash,
            status: "processing",
        },
    })
    timings['3_create_job'] = Date.now() - step3Start

    try {
        // 4. Parse XML
        let step4Start = Date.now()
        const { asOfDate, records } = parseCancellationXml(xmlContent)
        timings['4_parse_xml'] = Date.now() - step4Start

        if (records.length === 0) {
            await prisma.importJob.update({
                where: { job_id: job.job_id },
                data: {
                    status: "failed",
                    error_summary: "Không tìm thấy dữ liệu hủy phòng trong file",
                },
            })
            return {
                success: false,
                jobId: job.job_id,
                error: "Không tìm thấy dữ liệu hủy phòng trong file",
            }
        }

        console.log(`[CANCEL] Parsed ${records.length} cancellations`)

        // 5. Transform data
        let step5Start = Date.now()
        const cancellationData = records.map((record) => ({
            hotel_id: validHotelId,
            job_id: job.job_id,
            folio_num: record.folioNum,
            folio_num_norm: normalizeKey(record.folioNum),
            arrival_date: record.arrivalDate,
            cancel_time: record.cancelTime,
            as_of_date: asOfDate,
            nights: record.nights,
            rate_amount: record.rateAmount,
            total_revenue: record.totalRevenue,
            channel: record.channel,
            sale_group: record.saleGroup,
            room_type: record.roomType,
            room_code: record.roomCode,
            room_code_norm: normalizeKey(record.roomCode),
            guest_name: record.guestName,
            match_status: 'unmatched' as const,
        }))
        timings['5_transform_data'] = Date.now() - step5Start

        // 6. Insert to database
        let step6Start = Date.now()
        await prisma.cancellationRaw.createMany({
            data: cancellationData,
            skipDuplicates: true,
        })
        timings['6_db_insert'] = Date.now() - step6Start

        // 7. V01.1: Run bridge to match cancellations to reservations
        let step7Start = Date.now()
        const savedCancellations = await prisma.cancellationRaw.findMany({
            where: {
                job_id: job.job_id
            }
        })
        timings['7_fetch_saved'] = Date.now() - step7Start

        let bridgeResult: IngestCancellationResult['bridgeResult'] = undefined
        if (savedCancellations.length > 0) {
            let step8Start = Date.now()
            const result = await bridgeCancellations(validHotelId, savedCancellations)
            bridgeResult = {
                matched: result.matched,
                unmatched: result.unmatched,
                ambiguous: result.ambiguous,
                conflicts: result.conflicts
            }
            timings['8_bridge_matching'] = Date.now() - step8Start
        }

        // 9. Update job status
        let step9Start = Date.now()
        await prisma.importJob.update({
            where: { job_id: job.job_id },
            data: {
                status: "completed",
                total_rows: records.length,
                finished_at: new Date(),
            },
        })
        timings['9_complete_job'] = Date.now() - step9Start

        // 10. Invalidate caches and revalidate
        let step10Start = Date.now()
        invalidateStatsCache()
        const { revalidatePath } = await import('next/cache')
        revalidatePath('/data')
        revalidatePath('/dashboard')
        timings['10_invalidate_cache'] = Date.now() - step10Start

        // Log all timings
        const totalTime = Date.now() - totalStart
        console.log(`\n[CANCEL] ✅ SUCCESS - ${records.length} records`)
        console.log(`[CANCEL] Bridge: ${bridgeResult?.matched || 0} matched, ${bridgeResult?.unmatched || 0} unmatched`)
        console.log(`[CANCEL] -------- TIMING BREAKDOWN --------`)
        Object.entries(timings).forEach(([step, ms]) => {
            const pct = ((ms / totalTime) * 100).toFixed(1)
            console.log(`[CANCEL]   ${step}: ${ms}ms (${pct}%)`)
        })
        console.log(`[CANCEL] --------------------------------`)
        console.log(`[CANCEL] TOTAL: ${totalTime}ms`)
        console.log(`[CANCEL] Speed: ${(records.length / (totalTime / 1000)).toFixed(1)} records/sec`)
        console.log(`==========================================\n`)

        return {
            success: true,
            jobId: job.job_id,
            recordCount: records.length,
            asOfDate: asOfDate.toISOString().split("T")[0],
            bridgeResult,
            timings: {
                total: totalTime,
                breakdown: timings
            }
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error"

        await prisma.importJob.update({
            where: { job_id: job.job_id },
            data: {
                status: "failed",
                error_summary: errorMessage,
                finished_at: new Date(),
            },
        })

        const totalTime = Date.now() - totalStart
        console.log(`[CANCEL] ❌ FAILED after ${totalTime}ms: ${errorMessage}`)

        return {
            success: false,
            jobId: job.job_id,
            error: errorMessage,
        }
    }
}
