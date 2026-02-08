const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Connecting to database...');

    // Delete in correct order due to foreign key constraints

    // 1. Delete reservations first (has FK to import_jobs)
    const reservations = await prisma.reservationsRaw.deleteMany({});
    console.log(`✅ Deleted ${reservations.count} reservations`);

    // 2. Delete cancellations (has FK to import_jobs)
    const cancellations = await prisma.cancellationRaw.deleteMany({});
    console.log(`✅ Deleted ${cancellations.count} cancellations`);

    // 3. Now safe to delete import jobs
    const jobs = await prisma.importJob.deleteMany({});
    console.log(`✅ Deleted ${jobs.count} import jobs`);

    console.log('\nDone! You can now re-upload files.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
