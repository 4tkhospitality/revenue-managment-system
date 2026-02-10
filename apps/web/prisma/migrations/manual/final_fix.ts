// Final fix: drop default, swap type, re-set default, drop old enum
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
    console.log('Completing migration...');

    // Drop the old default first
    await prisma.$executeRawUnsafe(`ALTER TABLE public.subscriptions ALTER COLUMN plan DROP DEFAULT`);
    console.log('OK: Dropped old default');

    // Swap column type
    await prisma.$executeRawUnsafe(`ALTER TABLE public.subscriptions ALTER COLUMN plan TYPE "PlanTier" USING plan::text::"PlanTier"`);
    console.log('OK: Column type swapped');

    // Set new default
    await prisma.$executeRawUnsafe(`ALTER TABLE public.subscriptions ALTER COLUMN plan SET DEFAULT 'STANDARD'::"PlanTier"`);
    console.log('OK: New default set');

    // Drop old type
    await prisma.$executeRawUnsafe(`DROP TYPE IF EXISTS "PlanTier_old"`);
    console.log('OK: Dropped PlanTier_old');

    // Verify
    const rows = await prisma.$queryRawUnsafe(`SELECT plan, COUNT(*)::int as cnt FROM public.subscriptions GROUP BY plan`);
    console.log('\nFinal:', rows);

    const enums = await prisma.$queryRawUnsafe(`SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PlanTier') ORDER BY enumsortorder`);
    console.log('Enum:', enums);

    const old = await prisma.$queryRawUnsafe(`SELECT typname FROM pg_type WHERE typname = 'PlanTier_old'`);
    console.log('Old type exists:', (old as any[]).length > 0);

    await prisma.$disconnect();
    console.log('\n✅ Migration complete!');
}

run().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
