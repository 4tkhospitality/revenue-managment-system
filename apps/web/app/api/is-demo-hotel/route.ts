// API to check if current hotel is Demo Hotel
import { NextResponse } from 'next/server';
import { getActiveHotelId, isDemoHotel } from '@/lib/pricing/get-hotel';

export async function GET() {
    const hotelId = await getActiveHotelId();

    if (!hotelId) {
        return NextResponse.json({ isDemo: false, error: 'No hotel selected' });
    }

    const isDemo = await isDemoHotel(hotelId);
    return NextResponse.json({ isDemo, hotelId });
}
