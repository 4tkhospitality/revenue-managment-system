# Phase 01: DB Migration
Status: ⬜ Pending
Dependencies: None

## Objective
Add RoomBand enum, Organization tenant model, and migrate Subscription ownership from hotel to org.

## ⚡ Preflight Checklist (run before migration)

- [ ] **Ensure `gen_random_uuid()`** — script uses this in DO block. On Postgres <13 needs `pgcrypto`:
  ```sql
  CREATE EXTENSION IF NOT EXISTS "pgcrypto";
  -- Postgres 13+ has gen_random_uuid() built-in, but safe to run anyway
  ```
- [ ] **Backup database** before running migration
- [ ] **Verify current data**: `SELECT COUNT(*) FROM hotels; SELECT COUNT(*) FROM subscriptions;`

## Part A: RoomBand Pricing Fields

```prisma
enum RoomBand {
  R30     // ≤ 30 rooms
  R80     // 31–80 rooms
  R150    // 81–150 rooms
  R300P   // 151–300+ rooms
}
```

Add to Subscription:
```prisma
room_band          RoomBand  @default(R30)
capacity_snapshot   Int       @default(0)
price_multiplier    Float     @default(1.0)
```

## Part B: Organization Model (Cách 2)

### New Tables

```prisma
model Organization {
  id          String   @id @default(uuid()) @db.Uuid
  name        String
  slug        String?  // NOT @unique — see Note below
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  hotels       Hotel[]
  members      OrgMember[]
  subscription Subscription?

  @@map("organizations")
}

enum OrgRole {
  OWNER     // Manage billing, invite/remove members, add hotels
  ADMIN     // Manage hotels, invite members
  MEMBER    // Access assigned hotels
}

model OrgMember {
  id         String       @id @default(uuid()) @db.Uuid
  org_id     String       @db.Uuid
  user_id    String       @db.Uuid
  role       OrgRole      @default(MEMBER)
  created_at DateTime     @default(now())

  organization Organization @relation(fields: [org_id], references: [id], onDelete: Cascade)
  user         User         @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@unique([org_id, user_id])
  @@index([user_id])
  @@map("org_members")
}
```

### Modify Existing Tables

#### Hotel — add org_id FK
```prisma
model Hotel {
  // ... existing fields
  org_id  String?  @db.Uuid  // nullable initially, required after migration
  organization  Organization?  @relation(fields: [org_id], references: [id])
}
```

#### Subscription — add org_id (keep hotel_id deprecated)
```prisma
model Subscription {
  // KEEP hotel_id as optional (backward compat during migration)
  hotel_id  String?  @db.Uuid  // @deprecated — will remove in future
  
  // ADD org_id as new ownership
  org_id   String?  @unique @db.Uuid  // nullable initially, required after migration
  organization  Organization?  @relation(fields: [org_id], references: [id], onDelete: Cascade)
  
  // ... rest unchanged + new room_band fields
}
```

#### User — add org_members relation
```prisma
model User {
  // ... existing fields
  org_members  OrgMember[]
}
```

---

## ⚠️ Data Migration Script (CTE-Based — Safe)

> **CRITICAL:** Previous version mapped by `name` which is dangerous (duplicates, spacing).
> This version uses CTE with `hotel_id` as the deterministic key.

```sql
-- ═══════════════════════════════════════════════════════════════
-- Step 1: Create orgs from hotels using CTE (1:1 mapping via hotel_id)
-- ═══════════════════════════════════════════════════════════════

WITH new_orgs AS (
  INSERT INTO organizations (id, name, slug, created_at, updated_at)
  SELECT
    gen_random_uuid(),
    h.name,
    -- slug: use hotel slug if unique, else append hotel_id prefix to avoid dup
    CASE
      WHEN h.slug IS NOT NULL
           AND NOT EXISTS (
             SELECT 1 FROM hotels h2
             WHERE h2.slug = h.slug AND h2.hotel_id <> h.hotel_id
           )
      THEN h.slug
      ELSE LEFT(h.hotel_id::text, 8) || '-' || COALESCE(h.slug, 'org')
    END,
    h.created_at,
    NOW()
  FROM hotels h
  RETURNING id AS org_id, name, slug
)
-- We need to link back, so we use a temp mapping table instead:
SELECT 1; -- CTE placeholder, actual approach below

-- ═══════════════════════════════════════════════════════════════
-- Step 1 (actual): Use temp mapping table for deterministic linking
-- ═══════════════════════════════════════════════════════════════

-- Create temp mapping
CREATE TEMP TABLE hotel_org_map (
  hotel_id UUID PRIMARY KEY,
  org_id   UUID NOT NULL
);

-- Insert orgs one by one, capturing the mapping
-- ⚡ IDEMPOTENT: skip hotels that already have org_id (safe rerun)
DO $$
DECLARE
  h RECORD;
  new_org_id UUID;
  safe_slug TEXT;
BEGIN
  FOR h IN SELECT hotel_id, name, slug, created_at FROM hotels
           WHERE org_id IS NULL  -- ← idempotent guard
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

-- ⚡ IDEMPOTENT: only update subscriptions that don't have org_id yet
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
  END::org_role,
  hu.created_at
FROM hotel_users hu
JOIN hotel_org_map m ON hu.hotel_id = m.hotel_id
ON CONFLICT (org_id, user_id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- Step 5: Cleanup
-- ═══════════════════════════════════════════════════════════════

DROP TABLE hotel_org_map;

-- Verify: all hotels have org_id
SELECT COUNT(*) AS orphan_hotels FROM hotels WHERE org_id IS NULL;
-- Expected: 0

-- Verify: all subscriptions have org_id
SELECT COUNT(*) AS orphan_subs FROM subscriptions WHERE org_id IS NULL;
-- Expected: 0
```

## Implementation Steps
1. [ ] Add `RoomBand` enum to schema.prisma
2. [ ] Add 3 pricing fields to Subscription
3. [ ] Create `Organization` model (slug NOT @unique)
4. [ ] Create `OrgMember` model with `OrgRole` enum
5. [ ] Add `org_id` FK to Hotel (nullable)
6. [ ] Add `org_id` to Subscription (nullable), make `hotel_id` optional
7. [ ] Add `org_members` relation to User
8. [ ] Run `npx prisma migrate dev --name add-room-band-and-org`
9. [ ] Run data migration SQL script
10. [ ] Verify: 0 orphan hotels, 0 orphan subs
11. [ ] Run `npx prisma generate`

## Post-Migration: Enforce NOT NULL (Phase 01b — separate migration)

After data migration verifies 0 orphans, create a follow-up Prisma migration:
```prisma
// Make org_id required (no longer nullable)
model Hotel {
  org_id  String  @db.Uuid  // was String?
}
model Subscription {
  org_id  String  @unique @db.Uuid  // was String?
}
```
Run: `npx prisma migrate dev --name enforce-org-id-not-null`

> This enforces "1 org = 1 subscription" at DB level.

## Notes
- **Slug NOT @unique** on Organization → avoids migration failure on duplicates. Can add unique constraint later after data cleanup.
- **hotel_id stays on Subscription** as optional/deprecated → existing code that reads `subscription.hotel_id` won't crash during transition.
- **Mapping uses hotel_org_map temp table** → deterministic, no name-matching risk.
- **OrgMember dedup** via `ON CONFLICT` → safe if same user appears in multiple HotelUser rows for same org's hotels.
- **Script is idempotent** — `WHERE org_id IS NULL` guards on hotels and subscriptions. Safe to rerun.
- **`gen_random_uuid()`** — ensure pgcrypto extension or Postgres ≥13.

---
Next Phase: [phase-02-backend-logic.md](file:///c:/Apps/Antigravity/revenue-management-system/.brain/plans/260214-2100-room-band-pricing/phase-02-backend-logic.md)
