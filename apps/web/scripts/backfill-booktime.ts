import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('=== Backfill book_time ===');

    // Count NULL book_time records
    const countResult = await prisma.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(*)::int AS count 
        FROM reservations_raw 
        WHERE book_time IS NULL AND booking_date IS NOT NULL
    `;
    const nullCount = countResult[0]?.count ?? 0;
    console.log(`Records with NULL book_time: ${nullCount}`);

    if (nullCount === 0) {
        console.log('✅ No records need backfill!');
        return;
    }

    // Backfill book_time: booking_date at VN midnight → UTC (subtract 7 hours)
    const updated = await prisma.$executeRaw`
        UPDATE reservations_raw 
        SET book_time = (booking_date::timestamp - INTERVAL '7 hours') 
        WHERE book_time IS NULL AND booking_date IS NOT NULL
    `;
    console.log(`✅ book_time updated: ${updated} rows`);

    // Backfill cancel_time for cancelled records
    const cancelUpdated = await prisma.$executeRaw`
        UPDATE reservations_raw 
        SET cancel_time = (cancel_date::timestamp - INTERVAL '7 hours') 
        WHERE cancel_time IS NULL AND cancel_date IS NOT NULL AND status = 'cancelled'
    `;
    console.log(`✅ cancel_time updated: ${cancelUpdated} rows`);

    // Verify
    const verifyResult = await prisma.$queryRaw<Array<{ null_count: number; total: number }>>`
        SELECT 
            COUNT(*) FILTER (WHERE book_time IS NULL)::int AS null_count,
            COUNT(*)::int AS total
        FROM reservations_raw
    `;
    console.log(`\nVerification: ${verifyResult[0]?.null_count} / ${verifyResult[0]?.total} still NULL`);
}

main()
    .then(() => prisma.$disconnect())
    .catch((e) => {
        console.error(e);
        prisma.$disconnect();
        process.exit(1);
    });
