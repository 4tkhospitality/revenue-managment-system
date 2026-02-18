import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

// Band → maximum rooms allowed
const BAND_MAX_ROOMS: Record<string, number> = {
    R30: 30,
    R80: 80,
    R150: 150,
    R300P: 9999,
};

export async function POST(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { name, capacity, currency, timezone, country, companyEmail, phone, basePrice, priceFloor, priceCeiling } = body

        // Validation
        if (!name || !capacity || !currency || !timezone || !country || !phone) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            )
        }

        // --- Revenue Protection: enforce capacity ≤ purchased band max ---
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
        });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Find orphan payment (completed, no hotel_id) to get purchased band
        const orphanPayment = await prisma.paymentTransaction.findFirst({
            where: {
                user_id: user.id,
                hotel_id: null,
                status: 'COMPLETED',
            },
            orderBy: { created_at: 'desc' },
            select: {
                purchased_room_band: true,
            },
        });

        // Determine max capacity: from purchased band, or default to 30 (free tier)
        const purchasedBand = orphanPayment?.purchased_room_band || 'R30';
        const maxRooms = BAND_MAX_ROOMS[purchasedBand] ?? 30;

        // ENFORCE: capacity cannot exceed purchased band
        const effectiveCapacity = Math.min(parseInt(capacity), maxRooms);
        if (parseInt(capacity) > maxRooms) {
            console.log(`[Onboarding] ⚠️ Capacity capped: requested=${capacity}, max=${maxRooms} (band=${purchasedBand})`);
        }

        // Create hotel with ENFORCED capacity
        const hotel = await prisma.hotel.create({
            data: {
                name,
                capacity: effectiveCapacity,
                currency,
                timezone,
                country,
                phone,
                company_email: companyEmail,
                default_base_rate: basePrice,
                min_rate: priceFloor,
                max_rate: priceCeiling,
            },
        })

        // Link user to hotel + save phone
        await prisma.user.update({
            where: { email: session.user.email },
            data: {
                hotel_id: hotel.hotel_id,
                ...(phone ? { phone } : {}),
            },
        })

        // Create HotelUser link (owner role)
        await prisma.hotelUser.upsert({
            where: {
                user_id_hotel_id: {
                    user_id: user.id,
                    hotel_id: hotel.hotel_id,
                },
            },
            update: { role: 'hotel_admin', is_primary: true },
            create: {
                user_id: user.id,
                hotel_id: hotel.hotel_id,
                role: 'hotel_admin',
                is_primary: true,
            },
        })

        return NextResponse.json({ success: true, hotelId: hotel.hotel_id, maxRooms, effectiveCapacity })
    } catch (error) {
        console.error("Onboarding error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

