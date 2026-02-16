/**
 * GET /api/admin/debug-payments?email=xxx
 * Debug: show payment state for a user
 * 
 * POST /api/admin/debug-payments
 * Fix: reset payment hotel_id to null (make it orphan again)
 * Body: { paymentId: string }
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
    const session = await auth()
    if (!session?.user?.isAdmin) {
        return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    const email = request.nextUrl.searchParams.get('email')
    if (!email) {
        return NextResponse.json({ error: 'email param required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, role: true, is_active: true }
    })

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const payments = await prisma.paymentTransaction.findMany({
        where: { user_id: user.id },
        orderBy: { created_at: 'desc' },
    })

    const hotelUsers = await prisma.hotelUser.findMany({
        where: { user_id: user.id },
        include: { hotel: { select: { hotel_id: true, name: true, is_demo: true } } }
    })

    return NextResponse.json({
        user,
        payments: payments.map(p => ({
            id: p.id,
            status: p.status,
            hotel_id: p.hotel_id,
            purchased_tier: p.purchased_tier,
            purchased_room_band: p.purchased_room_band,
            amount: Number(p.amount),
            currency: p.currency,
            gateway: p.gateway,
            completed_at: p.completed_at,
            created_at: p.created_at,
        })),
        hotelUsers: hotelUsers.map(hu => ({
            hotel_id: hu.hotel_id,
            hotel_name: hu.hotel.name,
            is_demo: hu.hotel.is_demo,
            role: hu.role,
            is_primary: hu.is_primary,
        })),
    })
}

export async function POST(request: NextRequest) {
    const session = await auth()
    if (!session?.user?.isAdmin) {
        return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }

    const { paymentId } = await request.json()
    if (!paymentId) {
        return NextResponse.json({ error: 'paymentId required' }, { status: 400 })
    }

    // Reset hotel_id to null (make it orphan)
    const updated = await prisma.paymentTransaction.update({
        where: { id: paymentId },
        data: { hotel_id: null },
        select: { id: true, hotel_id: true, status: true, user_id: true }
    })

    console.log(`[DEBUG] Reset payment ${paymentId} hotel_id to null`)

    return NextResponse.json({ success: true, payment: updated })
}
