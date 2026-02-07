// V01.2: Pricing API Helper - Get active hotel ID
import { cookies } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

const ACTIVE_HOTEL_COOKIE = 'rms_active_hotel';

// Demo Hotel - used for new users who haven't been assigned to a hotel yet
export const DEMO_HOTEL_NAME = 'Demo Hotel';
const DEMO_HOTEL_DEFAULTS = {
    name: DEMO_HOTEL_NAME,
    timezone: 'Asia/Ho_Chi_Minh',
    capacity: 50,
    currency: 'VND',
};

/**
 * Get or create Demo Hotel
 * This hotel is used as default for new users without hotel assignment
 */
export async function getOrCreateDemoHotel(): Promise<string> {
    // Check if demo hotel exists
    let demoHotel = await prisma.hotel.findFirst({
        where: { name: DEMO_HOTEL_NAME },
    });

    if (!demoHotel) {
        // Create demo hotel
        demoHotel = await prisma.hotel.create({
            data: DEMO_HOTEL_DEFAULTS,
        });
        console.log('[Pricing] Created Demo Hotel:', demoHotel.hotel_id);
    }

    return demoHotel.hotel_id;
}

/**
 * Check if a hotel ID belongs to Demo Hotel
 */
export async function isDemoHotel(hotelId: string): Promise<boolean> {
    const hotel = await prisma.hotel.findUnique({
        where: { hotel_id: hotelId },
        select: { name: true },
    });
    return hotel?.name === DEMO_HOTEL_NAME;
}

/**
 * Get active hotel ID from cookie or session
 * Priority: cookie > session's first accessible hotel > demo hotel
 */
export async function getActiveHotelId(): Promise<string | null> {
    // 1. Try cookie first
    const cookieStore = await cookies();
    const cookieHotelId = cookieStore.get(ACTIVE_HOTEL_COOKIE)?.value;

    if (cookieHotelId) {
        // Validate the cookie hotel still exists in the database
        const hotelExists = await prisma.hotel.findUnique({
            where: { hotel_id: cookieHotelId },
            select: { hotel_id: true },
        });
        if (hotelExists) {
            return cookieHotelId;
        }
        // Cookie points to a deleted hotel — fall through to other methods
        console.warn('[Pricing] Cookie hotel_id not found in DB:', cookieHotelId);
    }

    // 2. Fallback to session's accessible hotels
    try {
        const session = await auth();
        const accessibleHotels = session?.user?.accessibleHotels || [];

        if (accessibleHotels.length > 0) {
            // Validate that session hotel IDs still exist in DB
            const primaryHotel = accessibleHotels.find(h => h.isPrimary);
            const candidateId = primaryHotel?.hotelId || accessibleHotels[0].hotelId;

            const hotelExists = await prisma.hotel.findUnique({
                where: { hotel_id: candidateId },
                select: { hotel_id: true },
            });

            if (hotelExists) {
                return candidateId;
            }

            // Primary/first hotel deleted — try other hotels in the list
            for (const h of accessibleHotels) {
                if (h.hotelId === candidateId) continue;
                const exists = await prisma.hotel.findUnique({
                    where: { hotel_id: h.hotelId },
                    select: { hotel_id: true },
                });
                if (exists) return h.hotelId;
            }

            console.warn('[Pricing] All session hotels not found in DB, falling back to Demo Hotel');
        }

        // 3. User is logged in but has no valid hotel assignment -> use Demo Hotel
        if (session?.user) {
            const demoHotelId = await getOrCreateDemoHotel();
            return demoHotelId;
        }
    } catch (error) {
        console.error('[Pricing] Error getting session:', error);
    }

    return null;
}

/**
 * Check if user is authenticated (has valid session)
 */
export async function isAuthenticated(): Promise<boolean> {
    try {
        const session = await auth();
        return !!session?.user;
    } catch {
        return false;
    }
}


