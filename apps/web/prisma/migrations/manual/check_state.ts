// Fix migration: Step 3 failed, need to complete enum swap
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
    // First, check what tables exist
    const tables = await prisma.$queryRawUnsafe(`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename ILIKE '%ubscri%'`);
    console.log('Tables found:', tables);

    // Check current enum state
    const enums = await prisma.$queryRawUnsafe(`SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PlanTier') ORDER BY enumsortorder`);
    console.log('Current PlanTier values:', enums);

    // Check old enum
    try {
        const oldEnums = await prisma.$queryRawUnsafe(`SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PlanTier_old') ORDER BY enumsortorder`);
        console.log('PlanTier_old values:', oldEnums);
    } catch { console.log('PlanTier_old does not exist'); }

    // Check subscription data
    try {
        const subs = await prisma.$queryRawUnsafe(`SELECT plan, COUNT(*)::int as cnt FROM public."Subscription" GROUP BY plan`);
        console.log('Subscriptions:', subs);
    } catch (e: any) {
        console.log('Query with public schema failed, trying without:', e.message?.substring(0, 60));
        // List all schemas
        const schemas = await prisma.$queryRawUnsafe(`SELECT DISTINCT schemaname FROM pg_tables WHERE tablename ILIKE '%ubscri%'`);
        console.log('Subscription table schemas:', schemas);
    }

    await prisma.$disconnect();
}

run().catch(e => { console.error('Error:', e.message); process.exit(1); });
