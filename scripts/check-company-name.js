const { PrismaClient } = require('@prisma/client');

async function main() {
    const prisma = new PrismaClient();

    try {
        // Check company_name distribution
        const result = await prisma.$queryRaw`
            SELECT company_name, COUNT(*) as cnt 
            FROM reservations_raw 
            GROUP BY company_name 
            ORDER BY cnt DESC 
            LIMIT 10
        `;

        console.log('Company Name Distribution:');
        console.log(result);

        // Check sample records with company_name
        const samples = await prisma.reservationsRaw.findMany({
            take: 5,
            orderBy: { booking_date: 'desc' },
            select: {
                reservation_id: true,
                booking_date: true,
                company_name: true,
                revenue: true
            }
        });

        console.log('\nSample records:');
        console.log(samples);

    } finally {
        await prisma.$disconnect();
    }
}

main();
