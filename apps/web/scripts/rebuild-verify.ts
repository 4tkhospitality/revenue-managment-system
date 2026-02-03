// Rebuild OTB and verify the fix
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function rebuildAndVerify() {
    const hotelId = process.env.DEFAULT_HOTEL_ID!;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log('🔨 Rebuilding OTB with fixed calculation...\n');

    // Get all active reservations
    const reservations = await prisma.reservationsRaw.findMany({
        where: {
            hotel_id: hotelId,
            status: 'booked',
        },
        select: {
            reservation_id: true,
            arrival_date: true,
            departure_date: true,
            rooms: true,
            revenue: true,
        },
    });

    // Build room-night map with FIXED calculation
    const stayDateMap = new Map<string, { rooms: number; revenue: number }>();

    for (const res of reservations) {
        const arrival = new Date(res.arrival_date);
        const departure = new Date(res.departure_date);
        const nights = Math.ceil((departure.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24));

        // Revenue per night = total revenue / nights (already includes all rooms!)
        const revenuePerNight = nights > 0 ? Number(res.revenue) / nights : Number(res.revenue);

        for (let i = 0; i < nights; i++) {
            const stayDate = new Date(arrival);
            stayDate.setDate(stayDate.getDate() + i);
            const dateKey = stayDate.toISOString().split('T')[0];

            const existing = stayDateMap.get(dateKey) || { rooms: 0, revenue: 0 };
            stayDateMap.set(dateKey, {
                rooms: existing.rooms + res.rooms,
                // FIXED: Don't multiply by rooms again!
                revenue: existing.revenue + revenuePerNight,
            });
        }
    }

    // Delete old OTB
    await prisma.dailyOTB.deleteMany({
        where: { hotel_id: hotelId, as_of_date: today },
    });

    // Insert new OTB
    const otbRows = Array.from(stayDateMap.entries())
        .filter(([dateKey]) => new Date(dateKey) >= today)
        .map(([dateKey, data]) => ({
            hotel_id: hotelId,
            as_of_date: today,
            stay_date: new Date(dateKey),
            rooms_otb: data.rooms,
            revenue_otb: data.revenue,
        }));

    await prisma.dailyOTB.createMany({ data: otbRows });

    // Show results for Feb 3-10
    console.log('📊 FIXED Daily OTB for Feb 3-10:');
    const febData = otbRows
        .filter(r => r.stay_date >= new Date('2026-02-03') && r.stay_date <= new Date('2026-02-10'))
        .sort((a, b) => a.stay_date.getTime() - b.stay_date.getTime());

    for (const otb of febData) {
        const adr = otb.rooms_otb > 0 ? otb.revenue_otb / otb.rooms_otb : 0;
        console.log(`  ${otb.stay_date.toISOString().split('T')[0]} | ${otb.rooms_otb} rooms | ${otb.revenue_otb.toLocaleString()}đ | ADR: ${adr.toLocaleString()}đ`);
    }

    console.log('\n✅ OTB rebuilt with fixed revenue calculation!');
}

rebuildAndVerify()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
