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
        const { name, capacity, currency, timezone, companyEmail, basePrice, priceFloor, priceCeiling } = body

        // Validation
        if (!name || !capacity || !currency || !timezone) {
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
                company_email: companyEmail,
                default_base_rate: basePrice,
                min_rate: priceFloor,
                max_rate: priceCeiling,
            },
        })

        // Link user to hotel
        await prisma.user.update({
            where: { email: session.user.email },
            data: { hotel_id: hotel.hotel_id },
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
