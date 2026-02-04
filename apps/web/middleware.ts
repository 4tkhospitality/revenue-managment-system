import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"

// Cookie name for active hotel
const ACTIVE_HOTEL_COOKIE = 'rms_active_hotel'

// Routes that don't require authentication
const publicRoutes = ["/auth/login", "/api/auth"]

// Routes that don't require hotel access
const noHotelRoutes = ["/admin", "/api/admin", "/blocked", "/no-hotel-access", "/select-hotel", "/onboarding"]

// Role hierarchy for permission checks
const ROLE_RANK: Record<string, number> = {
    viewer: 0,
    manager: 1,
    hotel_admin: 2,
    super_admin: 3,
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // 1. Allow public routes
    if (publicRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.next()
    }

    // 2. Allow static files
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/favicon") ||
        pathname.startsWith("/logo") ||
        pathname.includes(".")
    ) {
        return NextResponse.next()
    }

    // 3. Get session
    const session = await auth()

    // 4. Not logged in -> redirect to login
    if (!session?.user) {
        const loginUrl = new URL("/auth/login", request.url)
        loginUrl.searchParams.set("callbackUrl", pathname)
        return NextResponse.redirect(loginUrl)
    }

    // 5. Blocked user check (Redline #7)
    if (session.user.isActive === false) {
        return NextResponse.redirect(new URL("/blocked", request.url))
    }

    // 6. Super admin bypass - no hotel check needed
    if (session.user.isAdmin || session.user.role === 'super_admin') {
        // Remove onboarding redirect for super_admin
        if (pathname.startsWith("/onboarding")) {
            return NextResponse.redirect(new URL("/dashboard", request.url))
        }
        return NextResponse.next()
    }

    // 7. Admin routes = super_admin only
    if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
        return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    // 8. Check if route requires hotel access
    const requiresHotel = !noHotelRoutes.some(route => pathname.startsWith(route))

    if (requiresHotel) {
        const accessibleHotels = session.user.accessibleHotels || []

        // Must have at least one hotel assigned
        if (accessibleHotels.length === 0) {
            return NextResponse.redirect(new URL("/no-hotel-access", request.url))
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
    if (pathname.startsWith('/pricing')) return roleIndex >= 1      // manager+
    if (pathname.startsWith('/dashboard')) return roleIndex >= 0    // viewer+

    return true
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
}
