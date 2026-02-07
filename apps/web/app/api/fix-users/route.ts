import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// TEMPORARY: Fix all users with is_active=false
// DELETE THIS FILE AFTER USE
export async function GET() {
    const session = await auth()

    // Only super admin
    if (!session?.user?.isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Show current state
    const users = await prisma.user.findMany({
        select: { id: true, email: true, role: true, is_active: true }
    })

    return NextResponse.json({ users })
}

export async function POST() {
    const session = await auth()

    if (!session?.user?.isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fix all users
    const result = await prisma.user.updateMany({
        where: { is_active: false },
        data: { is_active: true }
    })

    const users = await prisma.user.findMany({
        select: { id: true, email: true, role: true, is_active: true }
    })

    return NextResponse.json({ fixed: result.count, users })
}
