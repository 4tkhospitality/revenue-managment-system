// API to check if current hotel is Demo Hotel
import { NextResponse } from 'next/server';
import { getActiveHotelId, isDemoHotel } from '@/lib/pricing/get-hotel';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
    const hotelId = await getActiveHotelId();

    // Check user role — resolve hotel-specific role from accessibleHotels
    let role: string | undefined;
    let isAdmin = false;
    try {
        const session = await auth();
        isAdmin = !!(session?.user as any)?.isAdmin;
        // Prefer hotel-specific role from accessibleHotels (HotelUser table)
        const accessibleHotels = (session?.user as any)?.accessibleHotels || [];
        const hotelEntry = hotelId
            ? accessibleHotels.find((h: any) => h.hotelId === hotelId)
            : accessibleHotels[0];
        role = hotelEntry?.role || session?.user?.role || 'viewer';
        // super_admin is stored in User.role, so also check isAdmin
        if (isAdmin) role = 'super_admin';
    } catch {
        // ignore
    }

    if (!hotelId) {
        return NextResponse.json({ isDemo: false, role, isAdmin, plan: 'STANDARD', error: 'No hotel selected' });
    }

    const isDemo = await isDemoHotel(hotelId);

    // Fetch plan tier from subscription
    let plan = 'STANDARD';
    try {
        const sub = await prisma.subscription.findFirst({
            where: { hotel_id: hotelId },
            select: { plan: true },
        });
        if (sub?.plan) plan = sub.plan;
    } catch {
        // ignore — default STANDARD
    }

    return NextResponse.json({ isDemo, hotelId, role, isAdmin, plan });
}

