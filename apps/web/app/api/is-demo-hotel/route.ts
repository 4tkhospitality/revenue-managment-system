// API to check if current hotel is Demo Hotel
import { NextResponse } from 'next/server';
import { getActiveHotelId, isDemoHotel } from '@/lib/pricing/get-hotel';
import { auth } from '@/lib/auth';

export async function GET() {
    const hotelId = await getActiveHotelId();

    // Check user role
    let role: string | undefined;
    try {
        const session = await auth();
        role = session?.user?.role;
    } catch {
        // ignore
    }

    if (!hotelId) {
        return NextResponse.json({ isDemo: false, role, error: 'No hotel selected' });
    }

    const isDemo = await isDemoHotel(hotelId);
    return NextResponse.json({ isDemo, hotelId, role });
}
