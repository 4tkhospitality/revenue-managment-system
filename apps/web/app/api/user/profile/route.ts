import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

/**
 * PATCH /api/user/profile — update current user's profile fields.
 * Currently supports: country (ISO 3166-1 alpha-2, nullable).
 */
export async function PATCH(request: NextRequest) {
    try {
        const session = await auth()
        const userId = (session?.user as any)?.userId || (session?.user as any)?.id

        if (!session?.user || !userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const updateData: Record<string, unknown> = {}

        // Country: validate ^[A-Z]{2}$ or null
        if (body.country !== undefined) {
            updateData.country = body.country === null
                ? null
                : (typeof body.country === 'string' && /^[A-Z]{2}$/.test(body.country))
                    ? body.country
                    : undefined
        }

        // Filter out undefined values (invalid input)
        const cleanData = Object.fromEntries(
            Object.entries(updateData).filter(([, v]) => v !== undefined)
        )

        if (Object.keys(cleanData).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: cleanData,
            select: { country: true },
        })

        return NextResponse.json({ success: true, country: user.country })
    } catch (error) {
        console.error('[API] Error updating user profile:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/**
 * GET /api/user/profile — get current user's profile.
 */
export async function GET() {
    try {
        const session = await auth()
        const userId = (session?.user as any)?.userId || (session?.user as any)?.id

        if (!session?.user || !userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { country: true, locale: true, name: true, email: true, phone: true },
        })

        return NextResponse.json(user || {})
    } catch (error) {
        console.error('[API] Error getting user profile:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
