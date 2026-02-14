-- ═══════════════════════════════════════════════════════════════
-- Room Band Pricing — Data Migration Script
-- Run AFTER schema migration (prisma db push / migrate)
-- IDEMPOTENT: safe to rerun (skips already-migrated records)
-- ═══════════════════════════════════════════════════════════════

-- Preflight: ensure gen_random_uuid() is available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ═══════════════════════════════════════════════════════════════
-- Step 1: Create orgs from hotels using temp mapping table
-- ═══════════════════════════════════════════════════════════════

CREATE TEMP TABLE hotel_org_map (
  hotel_id UUID PRIMARY KEY,
  org_id   UUID NOT NULL
);

-- Insert orgs one by one, capturing the mapping
-- IDEMPOTENT: skip hotels that already have org_id (safe rerun)
DO $$
DECLARE
  h RECORD;
  new_org_id UUID;
  safe_slug TEXT;
BEGIN
  FOR h IN SELECT hotel_id, name, slug, created_at FROM hotels
           WHERE org_id IS NULL
  LOOP
    new_org_id := gen_random_uuid();

    -- Generate safe slug (append hotel_id prefix if slug is null or duplicate)
    IF h.slug IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM organizations WHERE slug = h.slug
    ) THEN
      safe_slug := h.slug;
    ELSE
      safe_slug := LEFT(h.hotel_id::text, 8) || '-' || COALESCE(h.slug, 'org');
    END IF;

    INSERT INTO organizations (id, name, slug, created_at, updated_at)
    VALUES (new_org_id, h.name, safe_slug, h.created_at, NOW());

    INSERT INTO hotel_org_map (hotel_id, org_id)
    VALUES (h.hotel_id, new_org_id);
  END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- Step 2: Link hotels to their org (via hotel_id, NOT name)
-- ═══════════════════════════════════════════════════════════════

UPDATE hotels h
SET org_id = m.org_id
FROM hotel_org_map m
WHERE h.hotel_id = m.hotel_id;

-- ═══════════════════════════════════════════════════════════════
-- Step 3: Migrate subscription ownership (hotel_id → org_id)
-- ═══════════════════════════════════════════════════════════════

-- IDEMPOTENT: only update subscriptions that don't have org_id yet
UPDATE subscriptions s
SET org_id = m.org_id
FROM hotel_org_map m
WHERE s.hotel_id = m.hotel_id
  AND s.org_id IS NULL;

-- ═══════════════════════════════════════════════════════════════
-- Step 4: Create OrgMember entries from existing HotelUser
-- ═══════════════════════════════════════════════════════════════

INSERT INTO org_members (id, org_id, user_id, role, created_at)
SELECT
  gen_random_uuid(),
  m.org_id,
  hu.user_id,
  CASE
    WHEN hu.role = 'hotel_admin' THEN 'OWNER'
    WHEN hu.role = 'manager'     THEN 'ADMIN'
    ELSE 'MEMBER'
  END::"OrgRole",
  hu.created_at
FROM hotel_users hu
JOIN hotel_org_map m ON hu.hotel_id = m.hotel_id
ON CONFLICT (org_id, user_id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- Step 5: Cleanup
-- ═══════════════════════════════════════════════════════════════

DROP TABLE hotel_org_map;

-- ═══════════════════════════════════════════════════════════════
-- Verification queries
-- ═══════════════════════════════════════════════════════════════

SELECT COUNT(*) AS orphan_hotels FROM hotels WHERE org_id IS NULL;
-- Expected: 0

SELECT COUNT(*) AS orphan_subs FROM subscriptions WHERE org_id IS NULL;
-- Expected: 0

SELECT COUNT(*) AS total_orgs FROM organizations;
SELECT COUNT(*) AS total_org_members FROM org_members;
