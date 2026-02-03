import prisma from '@/lib/prisma';
import { ingestCSV } from '@/app/actions/ingestCSV';
import { buildDailyOTB } from '@/app/actions/buildDailyOTB';
import { buildFeatures } from '@/app/actions/buildFeatures';
import { runForecast } from '@/app/actions/runForecast';
import { runPricingEngine } from '@/app/actions/runPricingEngine';
import { DateUtils } from '@/lib/date';

async function runTest() {
    console.log("🚀 Starting Integration Test...");

    const hotelId = 'test-hotel-01'; // Ensure this hotel exists or mocked.
    const asOfDate = new Date('2025-01-01T00:00:00Z'); // normalized midnight

    // 0. Ensure Hotel Exists (Or seed it just in case, skipping for now assuming seed ran)
    // Actually, ingest requires hotelId relative to Prisma. 
    // If seed.py didn't run or different DB, this might fail.
    // Let's create a Hotel if not exists.
    // 0. Ensure Hotel Exists
    const hotel = await prisma.hotel.upsert({
        where: { hotel_id: hotelId },
        update: {},
        create: { hotel_id: hotelId, name: "Test Hotel Integration", capacity: 50, currency: "USD" }
    });
    console.log(`✅ Hotel Ready: ${hotel.hotel_id}`);

    // 1. Ingest CSV
    console.log("📦 Step 1: Ingesting CSV...");
    const csvData = `reservation_id,booking_date,arrival_date,departure_date,rooms,revenue,status
    RES-001,2024-12-01,2025-01-05,2025-01-08,1,300,booked
    RES-002,2024-12-20,2025-01-05,2025-01-06,2,200,booked`;

    // Convert to File/FormData
    const blob = new Blob([csvData], { type: 'text/csv' });
    const file = new File([blob], "integration_test.csv", { type: "text/csv" });
    const formData = new FormData();
    formData.append("file", file);
    formData.append("hotelId", hotelId);

    // Note: React Server Actions called directly might need context mocking or run via API.
    // In script mode, we can invoke directly if 'use server' allows.
    // If 'use server' directives block execution in script, we might need to mock or strip.
    // Assuming standard Next.js environment, direct import might work IF running inside Next context.
    // If running via `ts-node`, server actions might fail due to headers/cookies missing.
    // For this Script, let's call logic libraries or accept that Server Actions might fail without Mock Headers.
    // BUT! Our code is mostly logic in libs, only Actions wrap them.
    // Let's TRY calling Actions.

    // IDEMPOTENCY: ingestCSV uses Hash. If we run twice, it errors "Duplicate".
    // Let's randomize content slightly or clear ImportJob table for Test.
    await prisma.importJob.deleteMany({ where: { hotel_id: hotelId } });
    await prisma.reservationsRaw.deleteMany({ where: { hotel_id: hotelId } });

    const ingestRes = await ingestCSV(formData);
    if (!ingestRes.success) throw new Error(`Ingest Failed: ${ingestRes.message}`);
    console.log("✅ Ingest Done:", ingestRes);

    // 2. Build OTB
    console.log("📦 Step 2: Build Daily OTB...");
    const otbRes = await buildDailyOTB(hotelId, asOfDate);
    console.log("✅ OTB Done:", otbRes);

    // 3. Build Features
    console.log("📦 Step 3: Build Features...");
    const featRes = await buildFeatures(hotelId, asOfDate);
    console.log("✅ Features Done:", featRes);

    // 4. Run Forecast
    console.log("📦 Step 4: Forecast Engine...");
    const fcRes = await runForecast(hotelId, asOfDate);
    console.log("✅ Forecast Done:", fcRes);

    // 5. Run Pricing
    console.log("📦 Step 5: Pricing Engine...");
    const priceRes = await runPricingEngine(hotelId, asOfDate);
    console.log("✅ Pricing Done:", priceRes);

    // 6. Verify Output
    const recs = await prisma.priceRecommendations.findMany({
        where: { hotel_id: hotelId, as_of_date: asOfDate }
    });

    console.log("📋 Final Recommendations:");
    console.table(recs.map((r: any) => ({
        date: r.stay_date.toISOString().split('T')[0],
        rec: r.recommended_price,
        uplift: (r.uplift_pct * 100).toFixed(0) + '%'
    })));


    console.log("🚀 INTEGRATION TEST SUCCESS!");
}

runTest()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
