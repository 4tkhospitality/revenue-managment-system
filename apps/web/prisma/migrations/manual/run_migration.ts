// Migration script using Prisma Client
// Run with: npx tsx prisma/migrations/manual/run_migration.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
    console.log('Connected to database via Prisma');

    // Step 1: Add new enum values
    const addValues = [
        `ALTER TYPE "PlanTier" ADD VALUE IF NOT EXISTS 'STANDARD'`,
        `ALTER TYPE "PlanTier" ADD VALUE IF NOT EXISTS 'SUPERIOR'`,
        `ALTER TYPE "PlanTier" ADD VALUE IF NOT EXISTS 'DELUXE'`,
        `ALTER TYPE "PlanTier" ADD VALUE IF NOT EXISTS 'SUITE'`,
    ];
    for (const sql of addValues) {
        try {
            await prisma.$executeRawUnsafe(sql);
            console.log('OK:', sql.substring(0, 60));
        } catch (e: any) {
            console.log('SKIP:', e.message?.substring(0, 80));
        }
    }

    // Step 2: Migrate data
    const updates = [
        { sql: `UPDATE "Subscription" SET plan = 'STANDARD' WHERE plan = 'FREE'`, from: 'FREE', to: 'STANDARD' },
        { sql: `UPDATE "Subscription" SET plan = 'SUPERIOR' WHERE plan = 'STARTER'`, from: 'STARTER', to: 'SUPERIOR' },
        { sql: `UPDATE "Subscription" SET plan = 'DELUXE' WHERE plan = 'GROWTH'`, from: 'GROWTH', to: 'DELUXE' },
        { sql: `UPDATE "Subscription" SET plan = 'SUITE' WHERE plan = 'PRO'`, from: 'PRO', to: 'SUITE' },
    ];
    for (const { sql, from, to } of updates) {
        try {
            const count = await prisma.$executeRawUnsafe(sql);
            console.log(`OK: ${from} -> ${to} (${count} rows)`);
        } catch (e: any) {
            console.log(`SKIP ${from}->${to}: ${e.message?.substring(0, 80)}`);
        }
    }

    // Step 3: Swap enum type (remove old values)
    try {
        await prisma.$executeRawUnsafe(`ALTER TYPE "PlanTier" RENAME TO "PlanTier_old"`);
        console.log('OK: Renamed PlanTier -> PlanTier_old');

        await prisma.$executeRawUnsafe(`CREATE TYPE "PlanTier" AS ENUM ('STANDARD', 'SUPERIOR', 'DELUXE', 'SUITE')`);
        console.log('OK: Created new PlanTier enum');

        await prisma.$executeRawUnsafe(`ALTER TABLE "Subscription" ALTER COLUMN plan TYPE "PlanTier" USING plan::text::"PlanTier", ALTER COLUMN plan SET DEFAULT 'STANDARD'::"PlanTier"`);
        console.log('OK: Migrated column + default');

        await prisma.$executeRawUnsafe(`DROP TYPE "PlanTier_old"`);
        console.log('OK: Dropped PlanTier_old');
    } catch (e: any) {
        console.error('Step 3 error:', e.message);
    }

    // Verify
    const rows = await prisma.$queryRawUnsafe(`SELECT plan, COUNT(*) as cnt FROM "Subscription" GROUP BY plan`);
    console.log('\nFinal state:', rows);

    await prisma.$disconnect();
    console.log('Migration complete!');
}

run().catch(e => { console.error('FAILED:', e); process.exit(1); });
