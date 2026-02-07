'use server';

import prisma from '../../lib/prisma';
import { getActiveHotelId } from '../../lib/pricing/get-hotel';

/**
 * Get active hotel ID and latest booking date.
 * Uses getActiveHotelId() (cookie → session → fallback) instead of auto-detect.
 */
export async function getActiveHotelData(): Promise<{
    hotelId: string | null;
    latestBookingDate: Date | null;
}> {
    // 1. Get hotel from active context (cookie/session/fallback)
    const hotelId = await getActiveHotelId();

    if (!hotelId) {
        return { hotelId: null, latestBookingDate: null };
    }

    // 2. Find latest booking_date for this hotel
    const latestBooking = await prisma.reservationsRaw.aggregate({
        where: { hotel_id: hotelId },
        _max: { booking_date: true },
    });

    return {
        hotelId,
        latestBookingDate: latestBooking._max.booking_date || null,
    };
}
