# Phase 01: Database Schema

**Status:** ⬜ Pending  
**Dependencies:** None  
**Estimated Time:** 30 mins

---

## Objective

Thêm 5 tables mới và 2 enums vào Prisma schema để lưu trữ dữ liệu pricing module.

---

## Tasks

### 1.1. Add Enums to schema.prisma
- [ ] Add `CalcType` enum (PROGRESSIVE, ADDITIVE)
- [ ] Add `PromotionGroup` enum (SEASONAL, ESSENTIAL, TARGETED)

### 1.2. Add Models to schema.prisma
- [ ] Add `RoomType` model (hotel_id, name, net_price)
- [ ] Add `OTAChannel` model (hotel_id, code, commission, calc_type)
- [ ] Add `PromotionCatalog` model (vendor, name, group_type, rules)
- [ ] Add `CampaignInstance` model (hotel_id, ota_channel_id, promo_id, discount_pct)
- [ ] Add `PricingSetting` model (hotel_id, currency, rounding_rule, max_cap)

### 1.3. Add Relations to Hotel model
- [ ] Add `room_types RoomType[]`
- [ ] Add `ota_channels OTAChannel[]`
- [ ] Add `pricing_settings PricingSetting?`

### 1.4. Run Migration
- [ ] `npx prisma migrate dev --name add_pricing_module`
- [ ] Verify tables created in Supabase

### 1.5. Seed Promotion Catalog
- [ ] Create `prisma/seed-pricing.ts`
- [ ] Add Agoda promotions (17 items)
- [ ] Run seed: `npx prisma db seed`

---

## Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | MODIFY | Add 2 enums + 5 models |
| `prisma/seed-pricing.ts` | NEW | Seed PromotionCatalog |
| `package.json` | MODIFY | Add seed script |

---

## Code Snippets

### Enums
```prisma
enum CalcType {
  PROGRESSIVE
  ADDITIVE
}

enum PromotionGroup {
  SEASONAL
  ESSENTIAL
  TARGETED
}
```

### RoomType Model
```prisma
model RoomType {
  id          String   @id @default(cuid())
  hotel_id    String
  hotel       Hotel    @relation(fields: [hotel_id], references: [hotel_id])
  
  name        String
  description String?
  net_price   Float    // NET base price
  
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  @@index([hotel_id])
  @@unique([hotel_id, name])
}
```

---

## Test Criteria

- [ ] Migration runs without errors
- [ ] Tables visible in Supabase Dashboard
- [ ] PromotionCatalog has 17 Agoda records
- [ ] `npx prisma studio` shows new tables

---

## Rollback

```bash
# If migration fails
npx prisma migrate reset
# Then restore from previous schema
```

---

**Next Phase:** [phase-02-lib.md](phase-02-lib.md)

