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
}

export async function ingestCancellationXml(
    hotelId: string,
    xmlContent: string,
    fileName: string
): Promise<IngestCancellationResult> {
    // Calculate file hash for idempotency
    const fileHash = crypto.createHash("md5").update(xmlContent).digest("hex")

    // Check for duplicate import
    const existingJob = await prisma.importJob.findFirst({
        where: {
            hotel_id: hotelId,
            file_hash: fileHash,
            import_type: "CANCELLATION",
        },
    })

    if (existingJob) {
        return {
            success: false,
            error: `File này đã được import trước đó (Job ID: ${existingJob.job_id})`,
        }
    }

    // Create import job
    const job = await prisma.importJob.create({
        data: {
            hotel_id: hotelId,
            import_type: "CANCELLATION",
            file_name: fileName,
            file_hash: fileHash,
            status: "processing",
        },
    })

    try {
        // Parse XML
        const { asOfDate, records } = parseCancellationXml(xmlContent)

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

        // Insert cancellation records with normalized keys (V01.1)
        const cancellationData = records.map((record) => ({
            hotel_id: hotelId,
            job_id: job.job_id,
            folio_num: record.folioNum,
            folio_num_norm: normalizeKey(record.folioNum), // V01.1: Normalized key
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
            room_code_norm: normalizeKey(record.roomCode), // V01.1: Normalized key
            guest_name: record.guestName,
            match_status: 'unmatched' as const, // V01.1: Default status
        }))

        await prisma.cancellationRaw.createMany({
            data: cancellationData,
            skipDuplicates: true,
        })

        // V01.1: Run bridge to match cancellations to reservations
        const savedCancellations = await prisma.cancellationRaw.findMany({
            where: {
                job_id: job.job_id
            }
        })

        let bridgeResult: IngestCancellationResult['bridgeResult'] = undefined
        if (savedCancellations.length > 0) {
            const result = await bridgeCancellations(hotelId, savedCancellations)
            bridgeResult = {
                matched: result.matched,
                unmatched: result.unmatched,
                ambiguous: result.ambiguous,
                conflicts: result.conflicts
            }
        }

        // Update job status
        await prisma.importJob.update({
            where: { job_id: job.job_id },
            data: {
                status: "completed",
                total_rows: records.length,
                finished_at: new Date(),
            },
        })

        // Invalidate stats cache
        invalidateStatsCache()

        return {
            success: true,
            jobId: job.job_id,
            recordCount: records.length,
            asOfDate: asOfDate.toISOString().split("T")[0],
            bridgeResult,
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

        return {
            success: false,
            jobId: job.job_id,
            error: errorMessage,
        }
    }
}
