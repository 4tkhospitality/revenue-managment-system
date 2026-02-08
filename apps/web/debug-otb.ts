// Full debug: Check both reservations AND daily_otb
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const hotelId = '82423729-fb42-45ad-be9e-4e163600998d';

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 DEBUG: RESERVATIONS vs OTB');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // 1. Check reservations_raw
    const resStats = await prisma.reservationsRaw.aggregate({
        where: { hotel_id: hotelId },
        _count: true,
        _min: { arrival_date: true, booking_date: true },
        _max: { arrival_date: true, booking_date: true, departure_date: true },
    });

    console.log('📋 RESERVATIONS_RAW:');
    console.log(`   Total records: ${resStats._count}`);
    console.log(`   Booking Date:  ${resStats._min.booking_date?.toISOString().split('T')[0]} → ${resStats._max.booking_date?.toISOString().split('T')[0]}`);
    console.log(`   Arrival Date:  ${resStats._min.arrival_date?.toISOString().split('T')[0]} → ${resStats._max.arrival_date?.toISOString().split('T')[0]}`);
    console.log(`   Departure:     ... → ${resStats._max.departure_date?.toISOString().split('T')[0]}`);

    // 2. Check daily_otb
    const otbStats = await prisma.dailyOTB.aggregate({
        where: { hotel_id: hotelId },
        _count: true,
        _min: { stay_date: true, as_of_date: true },
        _max: { stay_date: true, as_of_date: true },
    });

    console.log('\n📊 DAILY_OTB:');
    console.log(`   Total records: ${otbStats._count}`);
    console.log(`   As-Of Date:    ${otbStats._min.as_of_date?.toISOString().split('T')[0]} → ${otbStats._max.as_of_date?.toISOString().split('T')[0]}`);
    console.log(`   Stay Date:     ${otbStats._min.stay_date?.toISOString().split('T')[0]} → ${otbStats._max.stay_date?.toISOString().split('T')[0]}`);

    // 3. Sample latest OTB records
    const latestOtb = await prisma.dailyOTB.findMany({
        where: { hotel_id: hotelId },
        orderBy: [{ as_of_date: 'desc' }, { stay_date: 'desc' }],
        take: 5,
        select: { as_of_date: true, stay_date: true, rooms_otb: true }
    });

    console.log('\n🎯 LATEST OTB RECORDS (Top 5):');
    latestOtb.forEach(r => {
        console.log(`   as_of: ${r.as_of_date.toISOString().split('T')[0]} | stay: ${r.stay_date.toISOString().split('T')[0]} | rooms: ${r.rooms_otb}`);
    });

    // 4. Check if Feb 2026 arrivals exist in reservations
    const feb2026Res = await prisma.reservationsRaw.count({
        where: {
            hotel_id: hotelId,
            arrival_date: { gte: new Date('2026-02-01') }
        }
    });
    console.log(`\n❓ Reservations with arrival >= Feb 2026: ${feb2026Res}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
