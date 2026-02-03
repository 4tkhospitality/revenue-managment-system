const { PrismaClient } = require('@prisma/client');

async function checkData() {
    const prisma = new PrismaClient();

    try {
        console.log('=== DATABASE STATUS CHECK ===\n');

        // Count all tables
        const reservations = await prisma.reservationsRaw.count();
        const dailyOTB = await prisma.dailyOTB.count();
        const importJobs = await prisma.importJob.count();
        const forecast = await prisma.demandForecast.count();
        const priceRecs = await prisma.priceRecommendations.count();
        const features = await prisma.featuresDaily.count();
        const hotels = await prisma.hotel.count();

        console.log('Table Counts:');
        console.log('  reservations_raw:', reservations);
        console.log('  daily_otb:', dailyOTB);
        console.log('  import_jobs:', importJobs);
        console.log('  demand_forecast:', forecast);
        console.log('  price_recommendations:', priceRecs);
        console.log('  features_daily:', features);
        console.log('  hotels:', hotels);

        // Check recent reservations
        console.log('\n--- Recent Reservations (5 latest) ---');
        const recentRes = await prisma.reservationsRaw.findMany({
            orderBy: { booking_date: 'desc' },
            take: 5,
            select: {
                reservation_id: true,
                booking_date: true,
                arrival_date: true,
                rooms: true,
                revenue: true,
                status: true
            }
        });
        console.log(recentRes);

        // Check import jobs
        console.log('\n--- Import Jobs ---');
        const jobs = await prisma.importJob.findMany({
            orderBy: { created_at: 'desc' },
            take: 5,
            select: {
                job_id: true,
                file_name: true,
                status: true,
                error_summary: true,
                created_at: true
            }
        });
        console.log(jobs);

        // Check hotel
        console.log('\n--- Hotels ---');
        const hotelsData = await prisma.hotel.findMany();
        console.log(hotelsData);

        // Dashboard uses hotelId from env
        const dashHotelId = process.env.DEFAULT_HOTEL_ID || '123e4567-e89b-12d3-a456-426614174000';
        console.log('\n--- Dashboard Hotel ID ---');
        console.log('Using:', dashHotelId);

        // Check if reservations use this hotel
        const resWithHotel = await prisma.reservationsRaw.findFirst({
            where: { hotel_id: dashHotelId }
        });
        console.log('Reservations with this hotel_id:', resWithHotel ? 'YES' : 'NO');

        // Check actual hotel IDs in reservations
        const hotelIds = await prisma.reservationsRaw.groupBy({
            by: ['hotel_id'],
            _count: { hotel_id: true }
        });
        console.log('\n--- Hotel IDs in Reservations ---');
        console.log(hotelIds);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkData();
