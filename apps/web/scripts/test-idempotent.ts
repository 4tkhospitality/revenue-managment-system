/**
 * AC-6 Test: Pipeline Idempotency
 * Runs pricing engine 2× for the same hotel+asOfDate, then compares DB rows.
 * Usage: npx tsx scripts/test-idempotent.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Find the first hotel with features data
    const hotel = await prisma.hotel.findFirst({
        where: { is_demo: false },
        select: { hotel_id: true, name: true },
    });
    if (!hotel) {
        // fallback to any hotel
        const anyHotel = await prisma.hotel.findFirst({ select: { hotel_id: true, name: true } });
        if (!anyHotel) { console.log('❌ No hotels found'); process.exit(1); }
        Object.assign(hotel!, anyHotel);
    }

    const hotelId = hotel!.hotel_id;
    console.log(`🏨 Hotel: ${hotel!.name} (${hotelId})`);

    // Find latest as_of_date with features
    const latestFeature = await prisma.featuresDaily.findFirst({
        where: { hotel_id: hotelId },
        orderBy: { as_of_date: 'desc' },
        select: { as_of_date: true },
    });
    if (!latestFeature) { console.log('❌ No features data'); process.exit(1); }
    const asOfDate = latestFeature.as_of_date;
    console.log(`📅 as_of_date: ${asOfDate.toISOString().slice(0, 10)}`);

    // Import and run pricing engine
    const { runPricingEngine } = await import('../app/actions/runPricingEngine');

    // Run 1
    console.log('\n🔄 Run 1...');
    const r1 = await runPricingEngine(hotelId, asOfDate);
    console.log(`   → ${r1.count} recommendations`);

    // Snapshot after run 1
    const snap1 = await prisma.priceRecommendations.findMany({
        where: { hotel_id: hotelId, as_of_date: asOfDate },
        orderBy: { stay_date: 'asc' },
    });

    // Run 2
    console.log('🔄 Run 2...');
    const r2 = await runPricingEngine(hotelId, asOfDate);
    console.log(`   → ${r2.count} recommendations`);

    // Snapshot after run 2
    const snap2 = await prisma.priceRecommendations.findMany({
        where: { hotel_id: hotelId, as_of_date: asOfDate },
        orderBy: { stay_date: 'asc' },
    });

    // Compare
    console.log('\n📊 Comparing...');
    if (snap1.length !== snap2.length) {
        console.log(`❌ FAIL: Row count changed ${snap1.length} → ${snap2.length}`);
        process.exit(1);
    }

    let diffs = 0;
    for (let i = 0; i < snap1.length; i++) {
        const a = snap1[i];
        const b = snap2[i];
        const fields = ['current_price', 'recommended_price', 'action', 'delta_pct', 'reason_code', 'reason_text_vi'] as const;
        for (const f of fields) {
            const va = String(a[f]);
            const vb = String(b[f]);
            if (va !== vb) {
                console.log(`   ❌ ${a.stay_date.toISOString().slice(0, 10)}.${f}: "${va}" → "${vb}"`);
                diffs++;
            }
        }
    }

    if (diffs === 0) {
        console.log(`✅ AC-6 PASS: ${snap1.length} rows identical across 2 runs`);
    } else {
        console.log(`❌ AC-6 FAIL: ${diffs} field differences found`);
    }

    await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
