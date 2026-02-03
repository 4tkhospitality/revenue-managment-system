'use server';

import prisma from '../../lib/prisma';
import { revalidatePath } from 'next/cache';

/**
 * Build Daily OTB (On The Books) from ReservationsRaw
 * 
 * Aggregates reservations by stay_date to create daily OTB snapshot.
 * 
 * Flow:
 * 1. Get all active (booked, not cancelled) reservations
 * 2. Expand each reservation to individual room-nights
 * 3. Aggregate by stay_date → rooms_otb, revenue_otb
 * 4. Upsert into daily_otb table
 */
export async function buildDailyOTB() {
    const hotelId = process.env.DEFAULT_HOTEL_ID;
    if (!hotelId) {
        throw new Error('DEFAULT_HOTEL_ID chưa được cấu hình trong .env');
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
        // Get all active reservations (booked, not cancelled)
        const reservations = await prisma.reservationsRaw.findMany({
            where: {
                hotel_id: hotelId,
                status: 'booked',
            },
            select: {
                reservation_id: true,
                arrival_date: true,
                departure_date: true,
                rooms: true,
                revenue: true,
            },
        });

        if (reservations.length === 0) {
            return {
                success: false,
                error: 'No active reservations found to build OTB',
            };
        }

        // Build room-night map: stay_date → { rooms, revenue }
        const stayDateMap = new Map<string, { rooms: number; revenue: number }>();

        for (const res of reservations) {
            const arrival = new Date(res.arrival_date);
            const departure = new Date(res.departure_date);
            const nights = Math.ceil((departure.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24));

            // Revenue per night = total revenue / nights
            const revenuePerNight = nights > 0 ? Number(res.revenue) / nights : Number(res.revenue);

            // For each night from arrival to departure-1
            for (let i = 0; i < nights; i++) {
                const stayDate = new Date(arrival);
                stayDate.setDate(stayDate.getDate() + i);
                const dateKey = stayDate.toISOString().split('T')[0];

                const existing = stayDateMap.get(dateKey) || { rooms: 0, revenue: 0 };
                stayDateMap.set(dateKey, {
                    rooms: existing.rooms + res.rooms,
                    // revenuePerNight already includes all rooms for that booking
                    // Don't multiply by res.rooms again!
                    revenue: existing.revenue + revenuePerNight,
                });
            }
        }

        // Convert to array and sort
        const otbRows = Array.from(stayDateMap.entries())
            .filter(([dateKey]) => new Date(dateKey) >= today) // Only future dates
            .map(([dateKey, data]) => ({
                hotel_id: hotelId,
                as_of_date: today,
                stay_date: new Date(dateKey),
                rooms_otb: data.rooms,
                revenue_otb: data.revenue,
            }))
            .sort((a, b) => a.stay_date.getTime() - b.stay_date.getTime());

        if (otbRows.length === 0) {
            return {
                success: false,
                error: 'No future stay dates found in reservations',
            };
        }

        // Delete old OTB for today (if rebuilding)
        await prisma.dailyOTB.deleteMany({
            where: {
                hotel_id: hotelId,
                as_of_date: today,
            },
        });

        // Insert new OTB rows
        await prisma.dailyOTB.createMany({
            data: otbRows,
        });

        // Revalidate dashboard
        revalidatePath('/dashboard');
        revalidatePath('/data');

        return {
            success: true,
            daysBuilt: otbRows.length,
            totalRoomsOtb: otbRows.reduce((sum, r) => sum + r.rooms_otb, 0),
            message: `Built OTB for ${otbRows.length} stay dates`,
        };
    } catch (error) {
        console.error('buildDailyOTB error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Quick action to rebuild all OTB data
 */
export async function rebuildAllOTB() {
    return buildDailyOTB();
}
