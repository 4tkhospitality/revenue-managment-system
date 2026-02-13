// ════════════════════════════════════════════════════════════════════
// Shared — RBAC Authorization Guard
// Every hotel-scoped route MUST call requireHotelAccess() first
// ════════════════════════════════════════════════════════════════════

import prisma from '@/lib/prisma';
import { AuthorizationError } from './errors';

/**
 * Check if a user has access to a hotel via HotelUser membership.
 * Throws AuthorizationError if no active membership found.
 * Returns the HotelUser record on success.
 */
export async function requireHotelAccess(userId: string, hotelId: string) {
    const membership = await prisma.hotelUser.findUnique({
        where: {
            user_id_hotel_id: { user_id: userId, hotel_id: hotelId },
        },
        select: { id: true, role: true, is_active: true },
    });

    if (!membership || !membership.is_active) {
        throw new AuthorizationError('You do not have access to this hotel');
    }

    return membership;
}

/**
 * Check if a user has a specific role for a hotel.
 */
export async function requireHotelRole(
    userId: string,
    hotelId: string,
    requiredRoles: string[],
) {
    const membership = await requireHotelAccess(userId, hotelId);
    if (!requiredRoles.includes(membership.role)) {
        throw new AuthorizationError(`Requires role: ${requiredRoles.join(' or ')}`);
    }
    return membership;
}
