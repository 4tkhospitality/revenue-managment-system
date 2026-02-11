/**
 * Test script: Run OTB backfill directly (no auth needed)
 * Usage: npx tsx scripts/test-backfill.ts
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    // Demo Hotel ID
    const hotelId = '159fe315-79a0-48a3-adac-f47d4f56b748';

    console.log('=== OTB Backfill Test ===');

    // 1. Check current state
    const existingSnapshots = await prisma.dailyOTB.findMany({
        where: { hotel_id: hotelId },
        select: { as_of_date: true },
        distinct: ['as_of_date'],
        orderBy: { as_of_date: 'asc' }
    });
    console.log(`\nBEFORE: ${existingSnapshots.length} distinct as_of_dates`);
    existingSnapshots.forEach(s => console.log(`  - ${s.as_of_date.toISOString().split('T')[0]}`));

    // 2. Get data range
    const range = await prisma.reservationsRaw.aggregate({
        where: { hotel_id: hotelId },
        _min: { booking_date: true, arrival_date: true },
        _max: { booking_date: true, departure_date: true },
    });
    console.log(`\nData range:`);
    console.log(`  booking_date: ${range._min.booking_date?.toISOString().split('T')[0]} → ${range._max.booking_date?.toISOString().split('T')[0]}`);
    console.log(`  stay_date: ${range._min.arrival_date?.toISOString().split('T')[0]} → ${range._max.departure_date?.toISOString().split('T')[0]}`);

    // 3. Generate monthly end-of-month dates
    const months = await prisma.$queryRaw`
        SELECT (date_trunc('month', d) + interval '1 month' - interval '1 day')::date as eom
        FROM generate_series(${range._min.booking_date}::date, ${range._max.booking_date}::date, '1 month'::interval) d
        ORDER BY d ASC
    `;
    console.log(`\nWill build ${months.length} monthly snapshots:`);
    months.forEach(m => console.log(`  - ${m.eom.toISOString().split('T')[0]}`));

    // 4. Build each snapshot
    const stayDateFrom = new Date(range._min.arrival_date);
    stayDateFrom.setDate(stayDateFrom.getDate() - 7);
    const stayDateTo = new Date(range._max.departure_date);
    stayDateTo.setDate(stayDateTo.getDate() + 7);

    let built = 0, skipped = 0;

    for (const { eom } of months) {
        const cutoffEndExcl = new Date(eom);
        cutoffEndExcl.setDate(cutoffEndExcl.getDate() + 1);
        const snapshotDate = new Date(eom);
        snapshotDate.setHours(0, 0, 0, 0);

        // Count active reservations as-of this date
        const count = await prisma.$queryRaw`
            SELECT COUNT(DISTINCT r.reservation_id) as cnt
            FROM reservations_raw r
            JOIN import_jobs j ON j.job_id = r.job_id AND j.hotel_id = r.hotel_id
            WHERE r.hotel_id = ${hotelId}::uuid
              AND COALESCE(r.book_time, r.booking_date::timestamp) < ${cutoffEndExcl}
              AND (r.cancel_time IS NULL OR r.cancel_time >= ${cutoffEndExcl})
              AND r.arrival_date < ${stayDateTo}::date
              AND r.departure_date > ${stayDateFrom}::date
        `;

        const activeCount = Number(count[0].cnt);

        if (activeCount === 0) {
            console.log(`  ${eom.toISOString().split('T')[0]}: 0 active reservations → skip`);
            skipped++;
            continue;
        }

        // Delete old and rebuild
        await prisma.dailyOTB.deleteMany({
            where: { hotel_id: hotelId, as_of_date: snapshotDate }
        });

        // Use raw SQL for the actual OTB build (simplified version)
        const result = await prisma.$executeRaw`
            INSERT INTO daily_otb (hotel_id, as_of_date, stay_date, rooms_otb, revenue_otb)
            SELECT 
                ${hotelId}::uuid,
                ${snapshotDate}::date,
                d::date as stay_date,
                COALESCE(SUM(r.rooms), 0) as rooms_otb,
                COALESCE(SUM(r.revenue / GREATEST(1, r.departure_date - r.arrival_date)), 0) as revenue_otb
            FROM (
                SELECT DISTINCT ON (r.reservation_id)
                    r.reservation_id, r.arrival_date, r.departure_date, r.rooms, r.revenue
                FROM reservations_raw r
                JOIN import_jobs j ON j.job_id = r.job_id AND j.hotel_id = r.hotel_id
                WHERE r.hotel_id = ${hotelId}::uuid
                  AND COALESCE(r.book_time, r.booking_date::timestamp) < ${cutoffEndExcl}
                  AND (r.cancel_time IS NULL OR r.cancel_time >= ${cutoffEndExcl})
                ORDER BY r.reservation_id, COALESCE(j.snapshot_ts, j.created_at) DESC
            ) r
            CROSS JOIN generate_series(r.arrival_date, r.departure_date - 1, '1 day'::interval) d
            WHERE d::date BETWEEN ${stayDateFrom}::date AND ${stayDateTo}::date
            GROUP BY d::date
            ON CONFLICT (hotel_id, as_of_date, stay_date) DO UPDATE SET
                rooms_otb = EXCLUDED.rooms_otb,
                revenue_otb = EXCLUDED.revenue_otb
        `;

        console.log(`  ${eom.toISOString().split('T')[0]}: ${activeCount} reservations → ${result} stay_dates built`);
        built++;
    }

    // Also build today's snapshot
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCutoff = new Date(today);
    todayCutoff.setDate(todayCutoff.getDate() + 1);

    await prisma.dailyOTB.deleteMany({
        where: { hotel_id: hotelId, as_of_date: today }
    });

    const todayResult = await prisma.$executeRaw`
        INSERT INTO daily_otb (hotel_id, as_of_date, stay_date, rooms_otb, revenue_otb)
        SELECT 
            ${hotelId}::uuid,
            ${today}::date,
            d::date as stay_date,
            COALESCE(SUM(r.rooms), 0) as rooms_otb,
            COALESCE(SUM(r.revenue / GREATEST(1, r.departure_date - r.arrival_date)), 0) as revenue_otb
        FROM (
            SELECT DISTINCT ON (r.reservation_id)
                r.reservation_id, r.arrival_date, r.departure_date, r.rooms, r.revenue
            FROM reservations_raw r
            JOIN import_jobs j ON j.job_id = r.job_id AND j.hotel_id = r.hotel_id
            WHERE r.hotel_id = ${hotelId}::uuid
              AND COALESCE(r.book_time, r.booking_date::timestamp) < ${todayCutoff}
              AND (r.cancel_time IS NULL OR r.cancel_time >= ${todayCutoff})
            ORDER BY r.reservation_id, COALESCE(j.snapshot_ts, j.created_at) DESC
        ) r
        CROSS JOIN generate_series(r.arrival_date, r.departure_date - 1, '1 day'::interval) d
        WHERE d::date BETWEEN ${stayDateFrom}::date AND ${stayDateTo}::date
        GROUP BY d::date
        ON CONFLICT (hotel_id, as_of_date, stay_date) DO UPDATE SET
            rooms_otb = EXCLUDED.rooms_otb,
            revenue_otb = EXCLUDED.revenue_otb
    `;
    console.log(`  TODAY ${today.toISOString().split('T')[0]}: ${todayResult} stay_dates built`);
    built++;

    // 5. Check final state
    const afterSnapshots = await prisma.dailyOTB.findMany({
        where: { hotel_id: hotelId },
        select: { as_of_date: true },
        distinct: ['as_of_date'],
        orderBy: { as_of_date: 'asc' }
    });
    console.log(`\nAFTER: ${afterSnapshots.length} distinct as_of_dates`);
    afterSnapshots.forEach(s => console.log(`  - ${s.as_of_date.toISOString().split('T')[0]}`));

    console.log(`\n✅ Done! Built ${built} snapshots, skipped ${skipped}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
