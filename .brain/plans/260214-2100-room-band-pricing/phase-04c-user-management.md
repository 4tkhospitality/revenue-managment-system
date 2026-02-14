# Phase 04c: Frontend — User & Organization Management
Status: ⬜ Pending
Dependencies: Phase 03 (API)

## Objective
Update team page to show org-level membership. Add plan context to seat counter.

## Multi-Hotel Architecture (Cách 2 — Organization)

```
Organization
├── Subscription (1 per org — plan + band + quotas)
├── Hotels[]     (each has capacity for KPI)
├── OrgMembers[] (user ↔ org, has org_role: OWNER/ADMIN/MEMBER)
│     └── HotelUser[] (existing — per-hotel role: admin/manager/viewer)
```

### Key Rules:
- `OrgMember` = membership in the organization (billing/admin level)
- `HotelUser` = access to specific hotel (operational level)
- Seat quota (`max_users`) counts **OrgMembers**, not HotelUsers
- Non-Suite: 1 hotel per org (maxProperties = 1)
- Suite: ∞ hotels per org, members access all hotels (P0) or per-hotel (P1 future)

## Current State (already implemented ✅)
Team page (`settings/team/page.tsx`) has:
- `seats.current/seats.max` counter → **keep, update label**
- Hard block when `!seats.available` → invite button disabled → **keep**
- Warning: "Đã đạt giới hạn thành viên cho gói {plan}" → **enhance**

> ⚠️ **CRITICAL — Seat Counting Source:**
> `seats.current` **MUST** count `OrgMembers` (not `HotelUsers`).
> Current code likely counts HotelUsers for the active hotel.
> With Suite multi-hotel, counting HotelUsers would under-count (users appear in multiple hotels).
>
> **Fix:** Team API should query `prisma.orgMember.count({ where: { org_id } })`.
> `seats.max` comes from `entitlements.limits.maxUsers` (unchanged — not scaled by band).

## Changes

### 1. Page title: "Team" → "Thành viên Organization"
```
Before: "Quản lý team"
After:  "Thành viên • Sunset Hotels (Deluxe)"
```

### 2. Seat counter with plan + band context
```
Before: "2/3 thành viên"
After:  "Thành viên: 2/3 (Deluxe • R80)"
```

### 3. Enhanced limit warning
```
Before: "Đã đạt giới hạn thành viên cho gói Superior."
After:  "Đã đạt giới hạn thành viên cho gói Superior.
         Quota Users giới hạn theo gói (tier), không theo số phòng (band)."
```

### 4. Upgrade CTA when at limit
```
[Nâng cấp gói để thêm thành viên →] → links to /pricing-plans
```

### 5. Member list shows org role + hotel access
```
┌─────────────────────────────────────────┐
│ 👤 Ngọc Phát          OWNER  | All hotels │
│ 👤 Thanh Hà           ADMIN  | All hotels │
│ 👤 Minh Tuấn          MEMBER | Demo Hotel │
└─────────────────────────────────────────┘
```

### 6. Hotel list (for Suite orgs with multiple hotels)
Only visible for Suite or when org has >1 hotel:
```
┌─────────────────────────────────────────┐
│ 🏨 Hotels (2/∞)                         │
│                                         │
│  Sunset Sanato     65 phòng  [Quản lý] │
│  Demo Hotel        270 phòng [Quản lý] │
│                                         │
│  [+ Thêm khách sạn]                    │
└─────────────────────────────────────────┘
```
- "Thêm khách sạn" button:
  - Suite: enabled
  - Non-Suite: disabled with tooltip "Nâng cấp Suite để thêm khách sạn"
  - Enforce: `currentHotels.length < maxProperties`

## Implementation Steps
1. [ ] Update page title to show org name + plan
2. [ ] Add plan/band label to seat counter
3. [ ] Enhance limit warning with explanatory text
4. [ ] Add upgrade CTA button
5. [ ] Update member list to show org_role
6. [ ] Add hotel list section (Suite multi-hotel)
7. [ ] Wire to /api/organization endpoint
8. [ ] Verify invite flow still works

---
Next: [phase-05-compliance.md](file:///c:/Apps/Antigravity/revenue-management-system/.brain/plans/260214-2100-room-band-pricing/phase-05-compliance.md)
