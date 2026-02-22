'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { invalidateStatsCache } from '@/lib/cachedStats';

/**
 * Clear all import job history for a hotel
 * This allows re-uploading the same files after data reset
 * 
 * ⚠️ WARNING: This deletes ALL data for the hotel!
 * - Reservations
 * - Cancellations  
 * - Import Jobs (history)
 * 
 * Use this when you want to start fresh.
 */
export async function clearImportHistory(hotelId: string) {
    try {
        // Step 1: Delete all reservations for this hotel
        const deletedReservations = await prisma.reservationsRaw.deleteMany({
            where: { hotel_id: hotelId }
        });

        // Step 2: Delete all cancellations for this hotel
        const deletedCancellations = await prisma.cancellationRaw.deleteMany({
            where: { hotel_id: hotelId }
        });

        // Step 3: Now safe to delete import jobs
        const deletedJobs = await prisma.importJob.deleteMany({
            where: { hotel_id: hotelId }
        });

        // Clear in-memory stats cache (prevents stale KPI data after reset)
        invalidateStatsCache();

        revalidatePath('/data');
        revalidatePath('/upload');
        revalidatePath('/dashboard');

        return {
            success: true,
            message: `Deleted: ${deletedReservations.count} reservations, ${deletedCancellations.count} cancellations, ${deletedJobs.count} jobs`,
            deleted: {
                reservations: deletedReservations.count,
                cancellations: deletedCancellations.count,
                jobs: deletedJobs.count
            }
        };
    } catch (error) {
        console.error('[clearImportHistory] Error:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
