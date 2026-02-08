/**
 * Demo Hotel System
 * - Creates personal demo hotels for new users
 * - Converts demo hotels to real hotels (purges sample data)
 */
import prisma from '@/lib/prisma'
import { generateSlug } from '@/lib/utils/slug'

const DEMO_HOTEL_TEMPLATE = {
    name: 'Demo Hotel',
    capacity: 50,
    currency: 'VND' as const,
    timezone: 'Asia/Ho_Chi_Minh',
}

/**
 * Create a personal demo hotel for a new user
 * User becomes hotel_admin + is_primary (Owner)
 */
export async function createPersonalDemoHotel(userId: string): Promise<{
    hotelId: string
    hotelName: string
}> {
    // Generate unique slug for demo hotel
    const slug = generateSlug(`demo-${Date.now()}`)

    // Create hotel + assign user as owner in transaction
    const result = await prisma.$transaction(async (tx) => {
        // 1. Create demo hotel
        const hotel = await tx.hotel.create({
            data: {
                ...DEMO_HOTEL_TEMPLATE,
                slug,
                is_demo: true,
                demo_owner_id: userId,
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            },
        })

        // 2. Create HotelUser with hotel_admin + is_primary (Owner)
        await tx.hotelUser.create({
            data: {
                user_id: userId,
                hotel_id: hotel.hotel_id,
                role: 'hotel_admin',
                is_primary: true,
            },
        })

        // 3. Create FREE subscription
        await tx.subscription.create({
            data: {
                hotel_id: hotel.hotel_id,
                plan: 'FREE',
                status: 'ACTIVE',
                max_users: 1,
                max_properties: 1,
                max_imports_month: 3,
                max_exports_day: 1,
                max_export_rows: 30,
                included_rate_shops_month: 0,
                data_retention_months: 6,
            },
        })

        return hotel
    })

    // TODO: Seed sample data with data_source='SAMPLE' (separate function)
    // await seedDemoData(result.hotel_id)

    return {
        hotelId: result.hotel_id,
        hotelName: result.name,
    }
}

/**
 * Convert demo hotel to real hotel
 * Purges all sample data and clears demo flags
 */
export async function convertDemoToReal(hotelId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
        // Verify hotel exists and is demo
        const hotel = await tx.hotel.findUnique({
            where: { hotel_id: hotelId },
            select: { is_demo: true },
        })

        if (!hotel || !hotel.is_demo) {
            throw new Error('Hotel not found or not a demo hotel')
        }

        // Purge all SAMPLE data tables
        // Note: data_source column needs to exist on these tables for full purge
        // For now, we delete ALL data from demo hotel (safest approach)
        await tx.reservationsRaw.deleteMany({
            where: { hotel_id: hotelId },
        })

        await tx.cancellationRaw.deleteMany({
            where: { hotel_id: hotelId },
        })

        await tx.dailyOTB.deleteMany({
            where: { hotel_id: hotelId },
        })

        await tx.featuresDaily.deleteMany({
            where: { hotel_id: hotelId },
        })

        await tx.priceRecommendations.deleteMany({
            where: { hotel_id: hotelId },
        })

        await tx.importJob.deleteMany({
            where: { hotel_id: hotelId },
        })

        // Clear demo flags
        await tx.hotel.update({
            where: { hotel_id: hotelId },
            data: {
                is_demo: false,
                demo_owner_id: null,
                expires_at: null,
            },
        })
    })
}

/**
 * Get shared Demo Hotel (the original one for viewing)
 * This is different from personal demo hotels
 */
export async function getSharedDemoHotel(): Promise<{
    hotelId: string
    hotelName: string
} | null> {
    const demoHotel = await prisma.hotel.findFirst({
        where: {
            name: 'Demo Hotel',
            is_demo: false, // Shared demo is NOT marked as is_demo (it's real data for viewing)
        },
        select: {
            hotel_id: true,
            name: true,
        },
    })

    return demoHotel
        ? { hotelId: demoHotel.hotel_id, hotelName: demoHotel.name }
        : null
}

/**
 * Assign user as viewer to shared Demo Hotel
 * Used for "Try Demo" flow without creating personal hotel
 */
export async function assignToSharedDemo(userId: string): Promise<{
    hotelId: string
    hotelName: string
} | null> {
    const sharedDemo = await getSharedDemoHotel()
    if (!sharedDemo) return null

    // Upsert to avoid duplicate errors
    await prisma.hotelUser.upsert({
        where: {
            user_id_hotel_id: {
                user_id: userId,
                hotel_id: sharedDemo.hotelId,
            },
        },
        create: {
            user_id: userId,
            hotel_id: sharedDemo.hotelId,
            role: 'viewer',
            is_primary: false,
        },
        update: {}, // No update needed if exists
    })

    return sharedDemo
}
