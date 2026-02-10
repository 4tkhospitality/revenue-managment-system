// Fix migration Step 2+3: table is "subscriptions" (lowercase)
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
    console.log('Fixing migration...');

    // Step 2: Migrate data (column still uses PlanTier_old)
    const updates = [
        { sql: `UPDATE public.subscriptions SET plan = 'STANDARD' WHERE plan = 'FREE'`, label: 'FREE→STANDARD' },
        { sql: `UPDATE public.subscriptions SET plan = 'SUPERIOR' WHERE plan = 'STARTER'`, label: 'STARTER→SUPERIOR' },
        { sql: `UPDATE public.subscriptions SET plan = 'DELUXE' WHERE plan = 'GROWTH'`, label: 'GROWTH→DELUXE' },
        { sql: `UPDATE public.subscriptions SET plan = 'SUITE' WHERE plan = 'PRO'`, label: 'PRO→SUITE' },
    ];
    for (const { sql, label } of updates) {
        try {
            const count = await prisma.$executeRawUnsafe(sql);
            console.log(`OK: ${label} (${count} rows)`);
        } catch (e: any) {
            console.log(`SKIP ${label}: ${e.message?.substring(0, 80)}`);
        }
    }

    // Step 3: Swap column type to new PlanTier enum
    try {
        await prisma.$executeRawUnsafe(`ALTER TABLE public.subscriptions ALTER COLUMN plan TYPE "PlanTier" USING plan::text::"PlanTier", ALTER COLUMN plan SET DEFAULT 'STANDARD'::"PlanTier"`);
        console.log('OK: Column type swapped to new PlanTier');
    } catch (e: any) {
        console.error('Column swap error:', e.message?.substring(0, 120));
    }

    // Step 4: Drop old enum
    try {
        await prisma.$executeRawUnsafe(`DROP TYPE IF EXISTS "PlanTier_old"`);
        console.log('OK: Dropped PlanTier_old');
    } catch (e: any) {
        console.error('Drop old type error:', e.message?.substring(0, 80));
    }

    // Verify
    const rows = await prisma.$queryRawUnsafe(`SELECT plan, COUNT(*)::int as cnt FROM public.subscriptions GROUP BY plan`);
    console.log('\nFinal state:', rows);

    const enumCheck = await prisma.$queryRawUnsafe(`SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PlanTier') ORDER BY enumsortorder`);
    console.log('PlanTier values:', enumCheck);

    // Check if old type still exists
    const oldCheck = await prisma.$queryRawUnsafe(`SELECT typname FROM pg_type WHERE typname = 'PlanTier_old'`);
    console.log('PlanTier_old exists:', (oldCheck as any[]).length > 0);

    await prisma.$disconnect();
    console.log('\nMigration complete!');
}

run().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
