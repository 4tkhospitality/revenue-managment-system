// Debug script to analyze OTB data and test buildFeatures
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debug() {
    try {
        console.log('=== DEBUG BUILD FEATURES ===\n');

        // 1. Check OTB data
        const totalOTB = await prisma.dailyOTB.count();
        console.log('1. Total daily_otb rows:', totalOTB);

        // 2. Get distinct as_of_dates
        const asOfDates = await prisma.$queryRaw`
            SELECT as_of_date, COUNT(*) as cnt 
            FROM daily_otb 
            GROUP BY as_of_date 
            ORDER BY as_of_date DESC 
            LIMIT 10
        `;
        console.log('\n2. Latest as_of_dates:');
        asOfDates.forEach(d => {
            console.log(`   ${d.as_of_date.toISOString().slice(0, 10)}: ${d.cnt} rows`);
        });

        // 3. Get active hotel
        const hotel = await prisma.hotel.findFirst({
            where: {
                name: { contains: 'Sunset' }
            },
            select: { hotel_id: true, name: true, capacity: true }
        });
        console.log('\n3. Active hotel:', hotel?.name, '| ID:', hotel?.hotel_id?.slice(0, 8) + '...');
        console.log('   Capacity:', hotel?.capacity);

        if (!hotel) {
            console.log('ERROR: Hotel not found!');
            return;
        }

        // 4. Check OTB for this hotel
        const hotelOTB = await prisma.dailyOTB.count({
            where: { hotel_id: hotel.hotel_id }
        });
        console.log('\n4. OTB rows for this hotel:', hotelOTB);

        // 5. Check latest as_of_date for this hotel
        const latest = await prisma.dailyOTB.findFirst({
            where: { hotel_id: hotel.hotel_id },
            orderBy: { as_of_date: 'desc' },
            select: { as_of_date: true }
        });
        console.log('5. Latest as_of_date:', latest?.as_of_date?.toISOString().slice(0, 10));

        if (latest) {
            // 6. Check rows with stay_date >= as_of_date (future dates)
            const futureRows = await prisma.dailyOTB.count({
                where: {
                    hotel_id: hotel.hotel_id,
                    as_of_date: latest.as_of_date,
                    stay_date: { gte: latest.as_of_date }
                }
            });
            console.log('6. OTB rows where stay_date >= as_of_date:', futureRows);

            // 7. Sample stay_dates
            const sample = await prisma.dailyOTB.findMany({
                where: {
                    hotel_id: hotel.hotel_id,
                    as_of_date: latest.as_of_date
                },
                select: { stay_date: true, rooms_otb: true },
                take: 5,
                orderBy: { stay_date: 'asc' }
            });
            console.log('\n7. Sample OTB data for latest as_of_date:');
            sample.forEach(s => {
                console.log(`   stay: ${s.stay_date.toISOString().slice(0, 10)}, rooms: ${s.rooms_otb}`);
            });
        }

        // 8. Check features_daily
        const features = await prisma.featuresDaily.count();
        console.log('\n8. Total features_daily rows:', features);

        // 9. Check demand_forecast
        const forecasts = await prisma.demandForecast.count();
        console.log('9. Total demand_forecast rows:', forecasts);

        console.log('\n=== END DEBUG ===');
    } catch (err) {
        console.error('ERROR:', err);
    } finally {
        await prisma.$disconnect();
    }
}

debug();
