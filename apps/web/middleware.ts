import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"

// Cookie name for active hotel
const ACTIVE_HOTEL_COOKIE = 'rms_active_hotel'

// Routes that don't require authentication
const publicRoutes = ["/auth/login", "/api/auth"]

// API routes that should bypass middleware (handle auth themselves)
// This is needed because Prisma cannot run in Edge middleware
const apiBypassRoutes = ["/api/pricing", "/api/onboarding", "/api/invite"]

// Routes that don't require hotel access
const noHotelRoutes = ["/admin", "/api/admin", "/blocked", "/no-hotel-access", "/select-hotel", "/onboarding", "/api/onboarding", "/welcome", "/invite", "/api/invite", "/api/payments/pending-activation"]


// Role hierarchy for permission checks
const ROLE_RANK: Record<string, number> = {
    viewer: 0,
    manager: 1,
    hotel_admin: 2,
    super_admin: 3,
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // 0. Referral link: capture ?ref= param → set 30-day cookie (before any auth check)
    const refCode = request.nextUrl.searchParams.get('ref')
    let referralResponse: NextResponse | null = null
    if (refCode && refCode.length >= 3) {
        referralResponse = NextResponse.next()
        referralResponse.cookies.set('rms_referral', refCode.toUpperCase(), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60, // 30 days
            path: '/',
        })
    }

    // 1. Allow public routes
    if (publicRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.next()
    }

    // 1b. Allow API bypass routes (they handle auth themselves)
    // This avoids Edge runtime issues with Prisma
    if (apiBypassRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.next()
    }

    // 1. Skip middleware for public assets and APIs
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/static") ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/api/public") ||
        pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|css|js|woff|woff2|ttf|eot)$/)
    ) {
        return NextResponse.next()
    }

    // 3. Get session
    const session = await auth()

    // 4. Not logged in -> redirect to login (or 401 JSON for API routes)
    if (!session?.user) {
        console.log(`[MW] ❌ No session → redirect to login | path=${pathname}`)
        // API routes should return 401 JSON, not redirect
        if (pathname.startsWith('/api/')) {
            return NextResponse.json(
                { error: 'Unauthorized', message: 'Authentication required' },
                { status: 401 }
            )
        }
        const loginUrl = new URL("/auth/login", request.url)
        loginUrl.searchParams.set("callbackUrl", pathname)
        return NextResponse.redirect(loginUrl)
    }

    // DEBUG: Log every authenticated request with key session info
    const hotels = session.user.accessibleHotels || []
    console.log(`[MW] 👤 ${session.user.email} | path=${pathname} | role=${session.user.role} | isAdmin=${session.user.isAdmin} | hotels=${hotels.length} | active=${session.user.isActive}`)

    // 5. Super admin bypass - MUST be before blocked check so admin can't be locked out
    if (session.user.isAdmin || session.user.role === 'super_admin') {
        if (pathname.startsWith("/onboarding")) {
            console.log(`[MW] 🛡️ Admin blocked from /onboarding → redirect /dashboard`)
            return NextResponse.redirect(new URL("/dashboard", request.url))
        }
        console.log(`[MW] 🛡️ Admin bypass → allow through`)
        return NextResponse.next()
    }

    // 6. Blocked user check
    if (session.user.isActive === false) {

        if (pathname.startsWith('/blocked')) {
            return NextResponse.next()
        }
        return NextResponse.redirect(new URL("/blocked", request.url))
    }

    // 7. Admin routes = super_admin only
    if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
        return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    // 8. Check if route requires hotel access
    const requiresHotel = !noHotelRoutes.some(route => pathname.startsWith(route))

    if (requiresHotel) {
        const accessibleHotels = session.user.accessibleHotels || []

        // Must have at least one hotel assigned - redirect to welcome for onboarding
        // UNLESS user was just assigned to a hotel (cookie set by onboarding API)
        // In that case, the JWT hasn't been refreshed yet but the cookie is valid
        if (accessibleHotels.length === 0) {
            const activeHotelCookie = request.cookies.get(ACTIVE_HOTEL_COOKIE)?.value
            if (!activeHotelCookie) {
                console.log(`[MW] 🚫 No hotels + no cookie → redirect /welcome | email=${session.user.email}`)
                return NextResponse.redirect(new URL("/welcome", request.url))
            }
            console.log(`[MW] 🍪 No hotels BUT cookie exists → allow through | cookie=${activeHotelCookie}`)
            // Cookie exists - user was just assigned, allow through
            // The page-level auth (getActiveHotelId) will handle hotel resolution
            return NextResponse.next()
        }

        // Get active hotel from cookie
        const activeHotelId = request.cookies.get(ACTIVE_HOTEL_COOKIE)?.value

        // Must have activeHotelId set
        if (!activeHotelId) {
            // If only 1 hotel, auto-set cookie and proceed
            if (accessibleHotels.length === 1) {
                const response = NextResponse.redirect(new URL(pathname, request.url))
                response.cookies.set(ACTIVE_HOTEL_COOKIE, accessibleHotels[0].hotelId, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 60 * 60 * 24 * 30, // 30 days
                    path: '/', // IMPORTANT: Cookie must be sent to all paths including /api
                })
                return response
            }
            // Multiple hotels, need to pick
            return NextResponse.redirect(new URL("/select-hotel", request.url))
        }

        // Validate activeHotelId is in user's list
        const hotelAccess = accessibleHotels.find(h => h.hotelId === activeHotelId)

        if (!hotelAccess) {
            // Clear invalid cookie and redirect
            const response = NextResponse.redirect(new URL("/select-hotel", request.url))
            response.cookies.delete(ACTIVE_HOTEL_COOKIE)
            return response
        }

        // Check per-hotel role for route
        if (!hasRoutePermission(pathname, hotelAccess.role)) {
            return NextResponse.redirect(new URL("/unauthorized", request.url))
        }
    }

    return NextResponse.next()
}

// Route permission check based on per-hotel role
function hasRoutePermission(pathname: string, role: string): boolean {
    const roleIndex = ROLE_RANK[role] ?? 0

    if (pathname.startsWith('/settings')) return roleIndex >= 2    // hotel_admin+
    if (pathname.startsWith('/data')) return roleIndex >= 1         // manager+
    if (pathname.startsWith('/upload')) return roleIndex >= 1       // manager+
    if (pathname.startsWith('/pricing')) return roleIndex >= 0      // viewer+
    if (pathname.startsWith('/dashboard')) return roleIndex >= 0    // viewer+

    return true
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
}
