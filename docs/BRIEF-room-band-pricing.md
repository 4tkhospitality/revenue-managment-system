# 💡 BRIEF: Room Band Pricing (Tier × Size)

**Ngày tạo:** 2026-02-14
**Trạng thái:** ĐÃ CHỐT — sẵn sàng `/plan`

---

## 1. VẤN ĐỀ

UI pricing page cho chọn band số phòng (≤30 / 31–80 / 81–150 / 151–300+) nhưng backend **không dùng giá trị đó**. Feature gating + quota chỉ chạy theo `PlanTier` (STANDARD → SUITE). Gây "mâu thuẫn sản phẩm".

## 2. GIẢI PHÁP: Option B (Tier gate features + Band scale price & quota)

- **Feature gating**: giữ nguyên theo tier (`useTierAccess`, `requireFeature`)
- **Giá**: `BasePrice(plan) × Multiplier(room_band)`
- **Quota**: selected quotas scale theo band; seat-based quotas giữ nguyên

## 3. NGUYÊN TẮC: Tách Operational vs Billing

| Khái niệm | Dùng cho | Nguồn |
|---|---|---|
| **Operational Capacity** | KPI (Occ%, RevPAR, compression) | `Hotel.capacity` |
| **Billing Room Band** | Giá + quota | `Subscription.room_band` + `capacity_snapshot` |

→ Khai sai billing band **không làm dashboard sai** (dùng Hotel.capacity), nhưng sẽ đụng quota trần.

## 4. BAND THRESHOLDS

| Enum | Range | Multiplier |
|---|---|---|
| `R30` | ≤ 30 phòng | 1.0× |
| `R80` | 31–80 phòng | 1.3× |
| `R150` | 81–150 phòng | 1.6× |
| `R300P` | 151–300+ phòng | 2.0× |

Rounding: giá round 10.000đ, quota `ceil()`.

## 5. BẢNG GIÁ (BasePrice = band R30)

| Plan | R30 | R80 | R150 | R300P |
|---|---|---|---|---|
| **STANDARD** | Free | ❌ blocked | ❌ blocked | ❌ blocked |
| **SUPERIOR** | 990k | 1.290k | 1.580k | 1.980k |
| **DELUXE** | 1.990k | 2.590k | 3.180k | 3.980k |
| **SUITE** | 3.490k | 4.540k | 5.580k | 6.980k |

> STANDARD chỉ cho R30 (trial cho KS nhỏ). KS > 30 phòng buộc upgrade.

## 6. QUOTA SAU SCALE

### ✅ Scale theo band (cost drivers)

**SUPERIOR** (base → R30 / R80 / R150 / R300P):

| Quota | R30 | R80 | R150 | R300P |
|---|---|---|---|---|
| Imports/mo | 15 | 20 | 24 | 30 |
| Exports/day | 10 | 13 | 16 | 20 |
| Export rows | 90 | 117 | 144 | 180 |
| Retention | 12m | 16m | 20m | 24m |

**DELUXE** (exports ∞, chỉ scale imports/rate-shops/retention):

| Quota | R30 | R80 | R150 | R300P |
|---|---|---|---|---|
| Imports/mo | 50 | 65 | 80 | 100 |
| Rate shops/mo | 5 | 7 | 8 | 10 |
| Retention | 24m | 32m | 39m | 48m |

**SUITE**: giữ ∞ (enterprise, không cần scale).

### ❌ Giữ nguyên theo tier

- `max_users` (seat-based)
- `max_scenarios` (Superior/Deluxe đã ∞)
- `max_properties` (1 per sub; Suite ∞)

## 7. DB CHANGES (tối thiểu)

```prisma
enum RoomBand {
  R30
  R80
  R150
  R300P
}

// Add to Subscription:
room_band          RoomBand  @default(R30)
capacity_snapshot   Int       @default(0)
price_multiplier    Float     @default(1.0)
```

## 8. CODE CHANGES

| File | Thay đổi |
|---|---|
| `plan-config.ts` | `LIMIT_MAP` → `getScaledLimits(plan, band)` |
| `guard.ts` → `getQuotaInfo()` | Đọc `subscription.room_band`, apply multiplier |
| `useTierAccess()` | **Giữ nguyên** (feature gating không đổi) |
| Pricing page UI | Gửi selected band → lưu vào subscription |

## 9. POLICY "KHAI SAI"

| Check | Trigger | Hành động |
|---|---|---|
| KPI sanity | `rooms_sold > Hotel.capacity` | Banner đỏ: "Cập nhật số phòng" |
| Billing compliance | `derived_band > subscription.room_band` | Banner cảnh báo + quota bị giới hạn theo band đã mua |
| STANDARD guard | `Hotel.capacity > 30` | Block STANDARD, yêu cầu upgrade |

## 10. BƯỚC TIẾP THEO

→ `/plan` để tạo spec chi tiết (schema migration, API, UI flow)
→ `/code` implement
