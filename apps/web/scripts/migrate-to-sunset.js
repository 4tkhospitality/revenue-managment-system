// Just migrate OTB - reservations already done
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DEMO_HOTEL_ID = '00000000-0000-0000-0000-000000000001';
const SUNSET_HOTEL_ID = '82423729-fb42-45ad-be9e-4e163600998d';

async function migrateOTB() {
    console.log('\n=== MIGRATING OTB DATA ===\n');

    // 1. Check OTB state
    const demoOtb = await prisma.dailyOTB.count({ where: { hotel_id: DEMO_HOTEL_ID } });
    const sunsetOtb = await prisma.dailyOTB.count({ where: { hotel_id: SUNSET_HOTEL_ID } });
    console.log('Before:');
    console.log(`  Demo OTB: ${demoOtb}`);
    console.log(`  Sunset OTB: ${sunsetOtb}`);

    if (demoOtb === 0) {
        console.log('\n⚠️ No Demo OTB to migrate. Running rebuild...');
        return;
    }

    // 2. Delete existing Sunset OTB (if any)
    if (sunsetOtb > 0) {
        console.log('\n🗑️ Clearing existing Sunset OTB...');
        await prisma.dailyOTB.deleteMany({ where: { hotel_id: SUNSET_HOTEL_ID } });
    }

    // 3. Move Demo OTB to Sunset
    console.log('\n📦 Moving Demo OTB → Sunset...');
    const result = await prisma.dailyOTB.updateMany({
        where: { hotel_id: DEMO_HOTEL_ID },
        data: { hotel_id: SUNSET_HOTEL_ID }
    });
    console.log(`  ✓ Moved ${result.count} OTB records`);

    // 4. Also migrate features if any
    console.log('\n📦 Moving features_daily...');
    try {
        await prisma.featuresDaily.deleteMany({ where: { hotel_id: SUNSET_HOTEL_ID } });
        const featResult = await prisma.featuresDaily.updateMany({
            where: { hotel_id: DEMO_HOTEL_ID },
            data: { hotel_id: SUNSET_HOTEL_ID }
        });
        console.log(`  ✓ Moved ${featResult.count} feature records`);
    } catch (e) {
        console.log('  (no data to migrate)');
    }

    // 5. Migrate forecasts
    console.log('\n📦 Moving demand_forecast...');
    try {
        await prisma.demandForecast.deleteMany({ where: { hotel_id: SUNSET_HOTEL_ID } });
        const fcResult = await prisma.demandForecast.updateMany({
            where: { hotel_id: DEMO_HOTEL_ID },
            data: { hotel_id: SUNSET_HOTEL_ID }
        });
        console.log(`  ✓ Moved ${fcResult.count} forecast records`);
    } catch (e) {
        console.log('  (no data to migrate)');
    }

    // 6. Final state
    console.log('\n=== FINAL STATE ===');
    const finalDemoOtb = await prisma.dailyOTB.count({ where: { hotel_id: DEMO_HOTEL_ID } });
    const finalSunsetOtb = await prisma.dailyOTB.count({ where: { hotel_id: SUNSET_HOTEL_ID } });
    const sunsetRes = await prisma.reservationsRaw.count({ where: { hotel_id: SUNSET_HOTEL_ID } });
    console.log('Sunset Sanato:');
    console.log(`  Reservations: ${sunsetRes}`);
    console.log(`  OTB records: ${finalSunsetOtb}`);
    console.log('Demo Hotel:');
    console.log(`  OTB records: ${finalDemoOtb}`);

    console.log('\n✅ Done! Refresh dashboard to see data.\n');
}

migrateOTB()
    .then(() => prisma.$disconnect())
    .catch(e => {
        console.error('Error:', e);
        prisma.$disconnect();
        process.exit(1);
    });
