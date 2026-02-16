import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

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

        // Create hotel
        const hotel = await prisma.hotel.create({
            data: {
                name,
                capacity,
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
                    user_id: (await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } }))!.id,
                    hotel_id: hotel.hotel_id,
                },
            },
            update: { role: 'hotel_admin', is_primary: true },
            create: {
                user_id: (await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } }))!.id,
                hotel_id: hotel.hotel_id,
                role: 'hotel_admin',
                is_primary: true,
            },
        })

        return NextResponse.json({ success: true, hotelId: hotel.hotel_id })
    } catch (error) {
        console.error("Onboarding error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
