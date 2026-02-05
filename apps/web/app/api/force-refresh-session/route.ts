import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'

/**
 * Force refresh session - clears auth cookies to force re-login
 * This is needed when user's hotel assignments changed after login
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    // First check if user actually has hotels in DB now
    if (email) {
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                hotel_users: {
                    include: { hotel: true }
                }
            }
        })

        if (!user || user.hotel_users.length === 0) {
            // User really has no hotels, don't force refresh
            return NextResponse.json({
                success: false,
                message: 'User has no hotels assigned in database',
                redirectTo: '/no-hotel-access'
            })
        }

        // User HAS hotels - clear session to force fresh login
        const cookieStore = await cookies()

        // Clear all auth-related cookies
        const authCookies = [
            'next-auth.session-token',
            '__Secure-next-auth.session-token',
            'next-auth.csrf-token',
            '__Secure-next-auth.csrf-token',
            'next-auth.callback-url',
            '__Secure-next-auth.callback-url',
            'rms_active_hotel'
        ]

        // Create response that clears cookies and redirects
        const response = NextResponse.redirect(new URL('/auth/login', request.url))

        authCookies.forEach(name => {
            response.cookies.set(name, '', {
                maxAge: 0,
                path: '/',
            })
        })

        return response
    }

    return NextResponse.json({
        error: 'Email parameter required',
        usage: '/api/force-refresh-session?email=user@example.com'
    })
}
