import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { parseCancellationXml } from "@/lib/parseCancellationXml"
import { normalizeKey } from "@/lib/normalize"
import { bridgeCancellations } from "@/lib/cancellationBridge"
import { invalidateStatsCache } from "@/lib/cachedStats"
import { serverLog } from "@/lib/logger"
import crypto from "crypto"

export async function POST(req: NextRequest) {
    const totalStart = Date.now()
    const timings: Record<string, number> = {}

    try {
        const formData = await req.formData()
        const file = formData.get('file') as File
        const hotelId = formData.get('hotelId') as string

        if (!file || !hotelId) {
            return NextResponse.json({ success: false, error: 'Missing file or hotelId' }, { status: 400 })
        }

        const xmlContent = await file.text()
        const fileName = file.name

        serverLog.info(`\n========== [CANCEL API] ${fileName} ==========`)
        serverLog.info(`[CANCEL API] File size: ${(xmlContent.length / 1024).toFixed(1)} KB`)
        serverLog.info(`[CANCEL API] Hotel ID: ${hotelId}`)

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
            console.warn(`[CANCEL API] Hotel ${hotelId} not found, fallback to Demo: ${validHotelId}`);
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
            serverLog.info(`[CANCEL API] ⚠️ DUPLICATE FILE - already processed`)
            return NextResponse.json({
                success: false,
                error: `File này đã được import trước đó (Job ID: ${existingJob.job_id})`,
            })
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
            serverLog.debug(`[CANCEL API] About to call parseCancellationXml...`)
            const { asOfDate, records } = parseCancellationXml(xmlContent)
            serverLog.debug(`[CANCEL API] parseCancellationXml returned ${records.length} records`)
            timings['4_parse_xml'] = Date.now() - step4Start

            if (records.length === 0) {
                await prisma.importJob.update({
                    where: { job_id: job.job_id },
                    data: {
                        status: "failed",
                        error_summary: "Không tìm thấy dữ liệu hủy phòng trong file",
                    },
                })
                return NextResponse.json({
                    success: false,
                    jobId: job.job_id,
                    error: "Không tìm thấy dữ liệu hủy phòng trong file",
                })
            }

            serverLog.info(`[CANCEL API] Parsed ${records.length} cancellations`)

            // 5. Transform data (same as ingestCancellationXml action)
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

            // 7. Fetch saved cancellations for bridging
            let step7Start = Date.now()
            const savedCancellations = await prisma.cancellationRaw.findMany({
                where: {
                    job_id: job.job_id
                }
            })
            timings['7_fetch_saved'] = Date.now() - step7Start

            // 8. Run bridge to match cancellations to reservations
            let bridgeResult: { matched: number; unmatched: number; ambiguous: number; conflicts: number } | undefined = undefined
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

            // 10. Invalidate caches
            let step10Start = Date.now()
            invalidateStatsCache()
            timings['10_invalidate_cache'] = Date.now() - step10Start

            // Log all timings
            const totalTime = Date.now() - totalStart
            serverLog.info(`\n[CANCEL API] ✅ SUCCESS - ${records.length} records`)
            serverLog.info(`[CANCEL API] Bridge: ${bridgeResult?.matched || 0} matched, ${bridgeResult?.unmatched || 0} unmatched`)
            serverLog.debug(`[CANCEL API] -------- TIMING BREAKDOWN --------`)
            Object.entries(timings).forEach(([step, ms]) => {
                const pct = ((ms / totalTime) * 100).toFixed(1)
                serverLog.debug(`[CANCEL API]   ${step}: ${ms}ms (${pct}%)`)
            })
            serverLog.debug(`[CANCEL API] Total: ${totalTime}ms`)

            return NextResponse.json({
                success: true,
                jobId: job.job_id,
                recordCount: records.length,
                asOfDate: asOfDate.toISOString().split('T')[0],
                bridgeResult,
                timings: {
                    total: totalTime,
                    breakdown: timings,
                },
            })

        } catch (parseError) {
            serverLog.error(`[CANCEL API] Parse/Process error:`, parseError)
            await prisma.importJob.update({
                where: { job_id: job.job_id },
                data: {
                    status: "failed",
                    error_summary: parseError instanceof Error ? parseError.message : "Unknown error",
                },
            })
            return NextResponse.json({
                success: false,
                jobId: job.job_id,
                error: parseError instanceof Error ? parseError.message : "Unknown error",
            })
        }

    } catch (error) {
        serverLog.error(`[CANCEL API] Error:`, error)
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        }, { status: 500 })
    }
}
