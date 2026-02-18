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
 * 
 * Fallback chain:
 * 1. Cookie (validated: hotel exists + user has access)
 * 2. Session's accessible hotels (primary > first)
 * 3. Super Admin: first real hotel by created_at (skip Demo)
 * 4. Normal user: Demo Hotel (onboarding)
 * 5. Not logged in: null
 * 
 * NOTE: This function only READS, never sets cookies.
 * Cookies are set via /api/user/switch-hotel POST only.
 */
export async function getActiveHotelId(): Promise<string | null> {
    const TAG = '[getActiveHotelId]'
    let session: any = null;

    try {
        session = await auth();
    } catch (error) {
        console.error(TAG, 'Error getting session:', error);
        return null;
    }

    if (!session?.user) {
        console.log(TAG, '❌ No session user → return null')
        return null;
    }

    const isAdmin = session.user.isAdmin === true;
    const accessibleHotels = session.user.accessibleHotels || [];
    const userId = session.user.userId || session.user.id;
    console.log(TAG, `👤 email=${session.user.email} userId=${userId} isAdmin=${isAdmin} accessibleHotels=${JSON.stringify(accessibleHotels.map((h: any) => ({ id: h.hotelId, name: h.hotelName })))}`)

    // 1. Try cookie first (cookie = preference, validated against permissions)
    const cookieStore = await cookies();
    const cookieHotelId = cookieStore.get(ACTIVE_HOTEL_COOKIE)?.value;
    console.log(TAG, `🍪 Cookie rms_active_hotel = ${cookieHotelId || 'NOT SET'}`)

    if (cookieHotelId) {
        // Check hotel exists in DB
        const hotelExists = await prisma.hotel.findUnique({
            where: { hotel_id: cookieHotelId },
            select: { hotel_id: true, name: true },
        });
        console.log(TAG, `🏨 Cookie hotel exists in DB: ${hotelExists ? `YES (${(hotelExists as any).name})` : 'NO'}`)

        if (hotelExists) {
            // Validate user has access: check DB directly (JWT may be stale after onboarding)
            if (isAdmin) {
                console.log(TAG, `✅ RESULT: cookie hotel (admin bypass) → ${cookieHotelId}`)
                return cookieHotelId;
            }
            // Check HotelUser table directly — this is the source of truth
            const hotelUser = await prisma.hotelUser.findUnique({
                where: {
                    user_id_hotel_id: {
                        user_id: userId,
                        hotel_id: cookieHotelId,
                    },
                },
                select: { hotel_id: true },
            });
            console.log(TAG, `👤 HotelUser DB check: userId=${userId} hotelId=${cookieHotelId} → ${hotelUser ? 'HAS ACCESS' : 'NO ACCESS'}`)
            if (hotelUser) {
                console.log(TAG, `✅ RESULT: cookie hotel (DB validated) → ${cookieHotelId}`)
                return cookieHotelId;
            }
            console.warn(TAG, `⚠️ Cookie hotel ${cookieHotelId} NOT authorized (DB check) → falling through`);
        } else {
            console.warn(TAG, `⚠️ Cookie hotel ${cookieHotelId} NOT in DB → falling through`);
        }
    }

    // 2. Fallback to session's accessible hotels
    console.log(TAG, `📋 Fallback: accessibleHotels count = ${accessibleHotels.length}`)
    if (accessibleHotels.length > 0) {
        const primaryHotel = accessibleHotels.find((h: any) => h.isPrimary);
        const candidateId = primaryHotel?.hotelId || accessibleHotels[0].hotelId;
        console.log(TAG, `📋 Primary candidate: ${candidateId} (isPrimary=${!!primaryHotel})`)

        const hotelExists = await prisma.hotel.findUnique({
            where: { hotel_id: candidateId },
            select: { hotel_id: true },
        });

        if (hotelExists) {
            console.log(TAG, `✅ RESULT: session primary hotel → ${candidateId}`)
            return candidateId;
        }

        // Primary/first hotel deleted — try other hotels in the list
        for (const h of accessibleHotels) {
            if (h.hotelId === candidateId) continue;
            const exists = await prisma.hotel.findUnique({
                where: { hotel_id: h.hotelId },
                select: { hotel_id: true },
            });
            if (exists) {
                console.log(TAG, `✅ RESULT: session fallback hotel → ${h.hotelId}`)
                return h.hotelId;
            }
        }
    }

    // 3. Super Admin with no assigned hotels → first REAL hotel (not Demo)
    if (isAdmin) {
        const firstRealHotel = await prisma.hotel.findFirst({
            where: { name: { not: DEMO_HOTEL_NAME } },
            orderBy: { created_at: 'asc' },
            select: { hotel_id: true },
        });
        if (firstRealHotel) {
            console.log(TAG, `✅ RESULT: admin first real hotel → ${firstRealHotel.hotel_id}`)
            return firstRealHotel.hotel_id;
        }
    }

    // 4. Normal user with no valid hotels → Demo Hotel (onboarding)
    const demoHotelId = await getOrCreateDemoHotel();
    console.log(TAG, `⚠️ RESULT: FALLBACK TO DEMO HOTEL → ${demoHotelId}`)
    return demoHotelId;
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


