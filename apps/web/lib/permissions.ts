import { UserRole } from "@prisma/client"

// Role hierarchy ranking for permission checks
export const ROLE_RANK: Record<UserRole, number> = {
    viewer: 0,
    manager: 1,
    hotel_admin: 2,
    super_admin: 3,
}

/**
 * Check if user has minimum required role
 */
export function hasMinRole(userRole: UserRole, requiredRole: UserRole): boolean {
    return ROLE_RANK[userRole] >= ROLE_RANK[requiredRole]
}

/**
 * Check if user has exact role
 */
export function hasRole(userRole: UserRole, role: UserRole): boolean {
    return userRole === role
}

/**
 * Check if user is super_admin
 */
export function isSuperAdmin(role: UserRole): boolean {
    return role === 'super_admin'
}

/**
 * Check if user is at least hotel_admin
 */
export function isHotelAdmin(role: UserRole): boolean {
    return hasMinRole(role, 'hotel_admin')
}

/**
 * Check if user is at least manager
 */
export function isManager(role: UserRole): boolean {
    return hasMinRole(role, 'manager')
}

// Cookie name for active hotel
export const ACTIVE_HOTEL_COOKIE = 'rms_active_hotel'

// Route permission requirements
export const ROUTE_PERMISSIONS: Record<string, UserRole> = {
    '/admin': 'super_admin',
    '/settings': 'hotel_admin',
    '/data': 'manager',
    '/upload': 'manager',
    '/pricing': 'manager',
    '/dashboard': 'viewer',
}

/**
 * Get minimum required role for a route
 */
export function getRoutePermission(pathname: string): UserRole {
    for (const [route, role] of Object.entries(ROUTE_PERMISSIONS)) {
        if (pathname.startsWith(route)) {
            return role
        }
    }
    return 'viewer' // Default for unknown routes
}

/**
 * Check if route requires hotel access
 */
export function requiresHotelAccess(pathname: string): boolean {
    // Admin routes don't require hotel (super_admin sees all)
    if (pathname.startsWith('/admin')) return false
    if (pathname.startsWith('/api/admin')) return false
    if (pathname.startsWith('/auth')) return false
    if (pathname.startsWith('/blocked')) return false
    if (pathname.startsWith('/no-hotel-access')) return false
    if (pathname.startsWith('/select-hotel')) return false

    // All other routes require hotel access
    return true
}
