// Check data in detail
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function run() {
    console.log('\n=== DETAILED CHECK ===\n');

    // Demo Hotel ID
    const demoHotelId = '00000000-0000-0000-0000-000000000001';

    // Sunset Hotel ID
    const sunsetHotelId = '82423729-fb42-45ad-be9e-4e163600998d';

    // Check reservations for Demo Hotel
    const demoReservations = await prisma.reservationsRaw.aggregate({
        where: { hotel_id: demoHotelId },
        _min: { arrival_date: true, booking_date: true },
        _max: { departure_date: true, booking_date: true },
        _count: true
    });
    console.log('Demo Hotel:');
    console.log('  Count:', demoReservations._count);
    if (demoReservations._min.booking_date) {
        console.log('  Booking range:', demoReservations._min.booking_date, '→', demoReservations._max.booking_date);
        console.log('  Stay range:', demoReservations._min.arrival_date, '→', demoReservations._max.departure_date);
    }

    // Check reservations for Sunset Hotel
    const sunsetReservations = await prisma.reservationsRaw.aggregate({
        where: { hotel_id: sunsetHotelId },
        _count: true
    });
    console.log('\nSunset Sanato:');
    console.log('  Count:', sunsetReservations._count);

    // Check if there are any import jobs pointing to wrong hotel
    const importJobs = await prisma.importJob.findMany({
        select: { job_id: true, hotel_id: true, file_name: true, status: true, created_at: true },
        orderBy: { created_at: 'desc' },
        take: 10
    });
    console.log('\nRecent Import Jobs:');
    for (const job of importJobs) {
        const hotelName = job.hotel_id === demoHotelId ? 'Demo' : job.hotel_id === sunsetHotelId ? 'Sunset' : 'Other';
        console.log(`  ${job.file_name} → ${hotelName} (${job.status})`);
    }

    // Check OTB data
    const demoOtb = await prisma.dailyOTB.count({ where: { hotel_id: demoHotelId } });
    const sunsetOtb = await prisma.dailyOTB.count({ where: { hotel_id: sunsetHotelId } });
    console.log('\nOTB Counts:');
    console.log('  Demo Hotel:', demoOtb);
    console.log('  Sunset Sanato:', sunsetOtb);
}

run()
    .then(() => prisma.$disconnect())
    .catch(e => {
        console.error(e);
        prisma.$disconnect();
        process.exit(1);
    });
