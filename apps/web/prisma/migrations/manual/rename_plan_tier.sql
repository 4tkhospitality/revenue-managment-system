-- Migration: Rename PlanTier enum values
-- Date: 2026-02-10
-- Maps: FREE→STANDARD, STARTER→SUPERIOR, GROWTH→DELUXE, PRO→SUITE

-- Step 1: Add new enum values
ALTER TYPE "PlanTier" ADD VALUE IF NOT EXISTS 'STANDARD';
ALTER TYPE "PlanTier" ADD VALUE IF NOT EXISTS 'SUPERIOR';
ALTER TYPE "PlanTier" ADD VALUE IF NOT EXISTS 'DELUXE';
ALTER TYPE "PlanTier" ADD VALUE IF NOT EXISTS 'SUITE';

-- Step 2: Migrate existing data to new values
UPDATE "Subscription" SET plan = 'STANDARD' WHERE plan = 'FREE';
UPDATE "Subscription" SET plan = 'SUPERIOR' WHERE plan = 'STARTER';
UPDATE "Subscription" SET plan = 'DELUXE' WHERE plan = 'GROWTH';
UPDATE "Subscription" SET plan = 'SUITE' WHERE plan = 'PRO';

-- Step 3: Rename the enum type (Postgres trick: create new, swap, drop old)
-- Since Postgres doesn't support removing values from enums directly,
-- we create a new enum, migrate the column, then drop the old one.

ALTER TYPE "PlanTier" RENAME TO "PlanTier_old";

CREATE TYPE "PlanTier" AS ENUM ('STANDARD', 'SUPERIOR', 'DELUXE', 'SUITE');

ALTER TABLE "Subscription" 
  ALTER COLUMN plan TYPE "PlanTier" USING plan::text::"PlanTier",
  ALTER COLUMN plan SET DEFAULT 'STANDARD'::"PlanTier";

DROP TYPE "PlanTier_old";
