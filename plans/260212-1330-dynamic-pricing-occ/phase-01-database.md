# Phase 01: Database Schema (Rev.2) ✅
Status: ✅ Complete (2026-02-12)
Dependencies: None

## Objective
Tạo 3 models mới. **BA Fix #2:** SeasonConfig KHÔNG có bar_multiplier.

## Models

### SeasonConfig (**no bar_multiplier**)
```prisma
model SeasonConfig {
  id          String   @id @default(uuid()) @db.Uuid
  hotel_id    String   @db.Uuid
  name        String   // "Normal Season", "High Season", "Holiday"
  code        String   // "NORMAL", "HIGH", "HOLIDAY"
  date_ranges Json     // [{"start":"2026-05-01","end":"2026-10-31"}]
  priority    Int      @default(0) // Holiday(3) > High(2) > Normal(1)
  is_active   Boolean  @default(true)
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  hotel       Hotel    @relation(fields: [hotel_id], references: [hotel_id], onDelete: Cascade)
  net_rates   SeasonNetRate[]

  @@unique([hotel_id, code])
  @@index([hotel_id])
  @@map("season_configs")
}
```

### OccTierConfig
```prisma
model OccTierConfig {
  id          String   @id @default(uuid()) @db.Uuid
  hotel_id    String   @db.Uuid
  tier_index  Int      // 0, 1, 2, 3
  label       String   // "0-35%", "35-65%", "65-85%", ">85%"
  occ_min     Float    // [0, 1]
  occ_max     Float    // [0, 1]
  multiplier  Float    // 1.0, 1.10, 1.20, 1.30
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  hotel       Hotel    @relation(fields: [hotel_id], references: [hotel_id], onDelete: Cascade)

  @@unique([hotel_id, tier_index])
  @@index([hotel_id])
  @@map("occ_tier_configs")
}
```

### SeasonNetRate
```prisma
model SeasonNetRate {
  id              String       @id @default(uuid()) @db.Uuid
  hotel_id        String       @db.Uuid
  season_id       String       @db.Uuid
  room_type_id    String       @db.Uuid
  net_rate        Decimal      @db.Decimal(12, 2)
  created_at      DateTime     @default(now())
  updated_at      DateTime     @updatedAt

  season          SeasonConfig @relation(fields: [season_id], references: [id], onDelete: Cascade)
  room_type       RoomType     @relation(fields: [room_type_id], references: [id], onDelete: Cascade)

  @@unique([season_id, room_type_id])
  @@index([hotel_id])
  @@map("season_net_rates")
}
```

## Steps
- [ ] Add 3 models to `schema.prisma`
- [ ] Add Hotel relations: `season_configs`, `occ_tier_configs`
- [ ] Add RoomType relation: `season_net_rates`
- [ ] Run `npx prisma migrate dev --name dynamic_pricing_occ`
- [ ] Verify migration

---
Next: [phase-02-backend.md](./phase-02-backend.md)
