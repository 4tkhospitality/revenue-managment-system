const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        // Check Sunset Sanato setup
        const hotel = await prisma.hotel.findFirst({
            where: { name: { contains: 'Sunset', mode: 'insensitive' } },
            select: {
                hotel_id: true,
                name: true,
                capacity: true,
                default_base_rate: true,
                min_rate: true,
                max_rate: true,
            }
        });

        if (!hotel) {
            console.log('❌ Hotel not found');
            return;
        }

        console.log('\n📊 HOTEL CONFIG:');
        console.log('='.repeat(50));
        console.table({
            name: hotel.name,
            capacity: hotel.capacity,
            default_base_rate: hotel.default_base_rate ? Number(hotel.default_base_rate) : 'NOT SET ⚠️',
            min_rate: hotel.min_rate ? Number(hotel.min_rate) : 'NOT SET',
            max_rate: hotel.max_rate ? Number(hotel.max_rate) : 'NOT SET',
        });

        // Check OTB data
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const otbCount = await prisma.dailyOTB.count({
            where: {
                hotel_id: hotel.hotel_id,
                stay_date: { gte: today }
            }
        });

        console.log(`\n📈 OTB Data (from today): ${otbCount} records`);

        // Check features_daily
        const featuresCount = await prisma.featuresDaily.count({
            where: {
                hotel_id: hotel.hotel_id,
                stay_date: { gte: today }
            }
        });

        console.log(`📊 Features Daily (from today): ${featuresCount} records`);

        // Check if any pricing decisions exist
        const decisionsCount = await prisma.pricingDecision.count({
            where: { hotel_id: hotel.hotel_id }
        });

        console.log(`📋 Pricing Decisions: ${decisionsCount} records`);

        // Sample OTB data
        const sampleOTB = await prisma.dailyOTB.findMany({
            where: { hotel_id: hotel.hotel_id, stay_date: { gte: today } },
            orderBy: { stay_date: 'asc' },
            take: 3,
        });

        if (sampleOTB.length > 0) {
            console.log('\n🔍 Sample OTB (next 3 days):');
            console.table(sampleOTB.map(o => ({
                stay_date: o.stay_date.toISOString().split('T')[0],
                rooms_otb: o.rooms_otb,
                revenue_otb: Number(o.revenue_otb),
            })));
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
