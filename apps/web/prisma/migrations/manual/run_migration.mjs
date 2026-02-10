// Temporary migration script — run with: node prisma/migrations/manual/run_migration.mjs
import pg from 'pg';
const { Client } = pg;

const DIRECT_URL = process.env.DIRECT_URL ||
    "postgresql://postgres.mqxyvcmjkwlcmtkxpymb:JJQMsbqnlODHQzIz@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres";

const client = new Client({ connectionString: DIRECT_URL, ssl: { rejectUnauthorized: false } });

async function run() {
    await client.connect();
    console.log('Connected to database');

    // Step 1: Add new enum values (safe with IF NOT EXISTS)
    const addValues = [
        `ALTER TYPE "PlanTier" ADD VALUE IF NOT EXISTS 'STANDARD'`,
        `ALTER TYPE "PlanTier" ADD VALUE IF NOT EXISTS 'SUPERIOR'`,
        `ALTER TYPE "PlanTier" ADD VALUE IF NOT EXISTS 'DELUXE'`,
        `ALTER TYPE "PlanTier" ADD VALUE IF NOT EXISTS 'SUITE'`,
    ];
    for (const sql of addValues) {
        try {
            await client.query(sql);
            console.log('OK:', sql.substring(0, 60));
        } catch (e) {
            console.log('SKIP (already exists):', e.message);
        }
    }

    // Step 2: Migrate data
    const updates = [
        `UPDATE "Subscription" SET plan = 'STANDARD' WHERE plan = 'FREE'`,
        `UPDATE "Subscription" SET plan = 'SUPERIOR' WHERE plan = 'STARTER'`,
        `UPDATE "Subscription" SET plan = 'DELUXE' WHERE plan = 'GROWTH'`,
        `UPDATE "Subscription" SET plan = 'SUITE' WHERE plan = 'PRO'`,
    ];
    for (const sql of updates) {
        const res = await client.query(sql);
        console.log(`OK: ${sql.substring(0, 50)}... (${res.rowCount} rows)`);
    }

    // Step 3: Swap enum type
    await client.query(`ALTER TYPE "PlanTier" RENAME TO "PlanTier_old"`);
    console.log('OK: Renamed PlanTier -> PlanTier_old');

    await client.query(`CREATE TYPE "PlanTier" AS ENUM ('STANDARD', 'SUPERIOR', 'DELUXE', 'SUITE')`);
    console.log('OK: Created new PlanTier enum');

    await client.query(`ALTER TABLE "Subscription" ALTER COLUMN plan TYPE "PlanTier" USING plan::text::"PlanTier", ALTER COLUMN plan SET DEFAULT 'STANDARD'::"PlanTier"`);
    console.log('OK: Migrated column type + default');

    await client.query(`DROP TYPE "PlanTier_old"`);
    console.log('OK: Dropped PlanTier_old');

    // Verify
    const check = await client.query(`SELECT plan, COUNT(*) FROM "Subscription" GROUP BY plan`);
    console.log('\nFinal state:');
    console.table(check.rows);

    await client.end();
    console.log('\nMigration complete!');
}

run().catch(e => { console.error('MIGRATION FAILED:', e); process.exit(1); });
