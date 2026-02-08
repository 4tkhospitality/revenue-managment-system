/**
 * POST /api/events
 * Log ProductEvent for funnel tracking
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { event_type, event_data, hotel_id } = body

        if (!event_type || typeof event_type !== 'string') {
            return NextResponse.json(
                { error: 'event_type is required' },
                { status: 400 }
            )
        }

        await prisma.productEvent.create({
            data: {
                user_id: session.user.id,
                hotel_id: hotel_id || null,
                event_type,
                event_data: event_data || null,
            },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[API] Event logging error:', error)
        return NextResponse.json(
            { error: 'Failed to log event' },
            { status: 500 }
        )
    }
}
