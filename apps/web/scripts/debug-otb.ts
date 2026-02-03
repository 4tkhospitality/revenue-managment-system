// Debug script to check OTB data for Feb 3-5
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugOTB() {
    console.log('🔍 Debugging OTB Revenue Anomaly\n');
    console.log('━'.repeat(60));

    // Get hotel ID
    const hotelId = process.env.DEFAULT_HOTEL_ID;
    console.log('Hotel ID:', hotelId);

    // 1. Check reservations with arrival in Feb 3-5
    console.log('\n📅 Reservations with arrival Feb 3-5, 2026:');
    const feb3to5 = await prisma.reservationsRaw.findMany({
        where: {
            hotel_id: hotelId,
            status: 'booked',
            arrival_date: {
                gte: new Date('2026-02-03'),
                lte: new Date('2026-02-05'),
            },
        },
        select: {
            reservation_id: true,
            arrival_date: true,
            departure_date: true,
            rooms: true,
            revenue: true,
        },
    });

    let total3to5Rooms = 0;
    let total3to5Revenue = 0;
    for (const r of feb3to5) {
        const nights = Math.ceil((new Date(r.departure_date).getTime() - new Date(r.arrival_date).getTime()) / (1000 * 60 * 60 * 24));
        console.log(`  ${r.reservation_id}: ${r.arrival_date.toISOString().split('T')[0]} → ${r.departure_date.toISOString().split('T')[0]} | ${r.rooms} rooms | ${Number(r.revenue).toLocaleString()}đ | ${nights} nights`);
        total3to5Rooms += r.rooms;
        total3to5Revenue += Number(r.revenue);
    }
    console.log(`  TOTAL: ${feb3to5.length} reservations, ${total3to5Rooms} rooms, ${total3to5Revenue.toLocaleString()}đ`);

    // 2. Check reservations with arrival in Feb 6-10
    console.log('\n📅 Reservations with arrival Feb 6-10, 2026:');
    const feb6to10 = await prisma.reservationsRaw.findMany({
        where: {
            hotel_id: hotelId,
            status: 'booked',
            arrival_date: {
                gte: new Date('2026-02-06'),
                lte: new Date('2026-02-10'),
            },
        },
        select: {
            reservation_id: true,
            arrival_date: true,
            departure_date: true,
            rooms: true,
            revenue: true,
        },
    });

    let total6to10Rooms = 0;
    let total6to10Revenue = 0;
    for (const r of feb6to10) {
        const nights = Math.ceil((new Date(r.departure_date).getTime() - new Date(r.arrival_date).getTime()) / (1000 * 60 * 60 * 24));
        console.log(`  ${r.reservation_id}: ${r.arrival_date.toISOString().split('T')[0]} → ${r.departure_date.toISOString().split('T')[0]} | ${r.rooms} rooms | ${Number(r.revenue).toLocaleString()}đ | ${nights} nights`);
        total6to10Rooms += r.rooms;
        total6to10Revenue += Number(r.revenue);
    }
    console.log(`  TOTAL: ${feb6to10.length} reservations, ${total6to10Rooms} rooms, ${total6to10Revenue.toLocaleString()}đ`);

    // 3. Check OTB data directly
    console.log('\n📊 Daily OTB for Feb 3-10:');
    const otbData = await prisma.dailyOTB.findMany({
        where: {
            hotel_id: hotelId,
            stay_date: {
                gte: new Date('2026-02-03'),
                lte: new Date('2026-02-10'),
            },
        },
        orderBy: { stay_date: 'asc' },
    });


    for (const otb of otbData) {
        const adr = otb.rooms_otb > 0 ? Number(otb.revenue_otb) / otb.rooms_otb : 0;
        console.log(`  ${otb.stay_date.toISOString().split('T')[0]} | ${otb.rooms_otb} rooms | ${Number(otb.revenue_otb).toLocaleString()}đ | ADR: ${adr.toLocaleString()}đ`);
    }

    // 4. Average Revenue per room calculation
    console.log('\n📈 ADR Comparison:');
    const adr3to5 = total3to5Rooms > 0 ? total3to5Revenue / total3to5Rooms : 0;
    const adr6to10 = total6to10Rooms > 0 ? total6to10Revenue / total6to10Rooms : 0;
    console.log(`  Feb 3-5 ADR: ${adr3to5.toLocaleString()}đ`);
    console.log(`  Feb 6-10 ADR: ${adr6to10.toLocaleString()}đ`);
    console.log(`  Ratio: ${adr6to10 > 0 ? (adr3to5 / adr6to10).toFixed(2) : 'N/A'}x`);
}

debugOTB()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
