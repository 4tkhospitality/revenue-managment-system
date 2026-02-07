import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// TEMPORARY DEBUG API (Public)
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const search = searchParams.get('search')

    // Handle Search
    if (search) {
        const users = await prisma.user.findMany({
            where: {
                email: { contains: search, mode: 'insensitive' }
            },
            select: { id: true, email: true, is_active: true, role: true }
        })
        return NextResponse.json({ count: users.length, users })
    }

    if (!email) {
        return NextResponse.json({ error: 'Email required' })
    }

    const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, is_active: true, role: true }
    })

    if (!user) {
        return NextResponse.json({ error: 'User not found' })
    }

    // Check for delete action
    const action = searchParams.get('action')
    if (action === 'delete') {
        try {
            await prisma.user.delete({ where: { email } })
            return NextResponse.json({ message: 'User permanently deleted' })
        } catch (e: any) {
            return NextResponse.json({ error: e.message })
        }
    }

    // Force fix
    const updated = await prisma.user.update({
        where: { email },
        data: { is_active: true },
        select: { id: true, email: true, is_active: true }
    })

    return NextResponse.json({
        before: user,
        after: updated,
        message: 'Fixed user status'
    })
}
