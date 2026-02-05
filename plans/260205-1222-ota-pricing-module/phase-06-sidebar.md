# Phase 06: Sidebar & Navigation

**Status:** ⬜ Pending  
**Dependencies:** Phase 05 (Pages)  
**Estimated Time:** 15 mins

---

## Objective

Thêm menu item "Tính giá OTA" vào Sidebar.

---

## Tasks

### 6.1. Update Sidebar
- [ ] Add Calculator icon import from Lucide
- [ ] Add `/pricing` to navItems array
- [ ] Position after "Dữ liệu", before "Cài đặt"

### 6.2. Verify Navigation
- [ ] Click navigates to /pricing
- [ ] Active state highlights correctly
- [ ] Mobile menu works

---

## Files to Modify

| File | Action |
|------|--------|
| `components/dashboard/Sidebar.tsx` | MODIFY |

---

## Code Changes

### Before
```tsx
const navItems = [
  { href: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/upload', label: 'Tải lên', icon: Upload },
  { href: '/data', label: 'Dữ liệu', icon: Database },
  { href: '/settings', label: 'Cài đặt', icon: Settings },
  { href: '/guide', label: 'Hướng dẫn', icon: BookOpen },
];
```

### After
```tsx
import { Calculator } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/upload', label: 'Tải lên', icon: Upload },
  { href: '/data', label: 'Dữ liệu', icon: Database },
  { href: '/pricing', label: 'Tính giá OTA', icon: Calculator }, // NEW
  { href: '/settings', label: 'Cài đặt', icon: Settings },
  { href: '/guide', label: 'Hướng dẫn', icon: BookOpen },
];
```

---

## Test Criteria

- [ ] "Tính giá OTA" appears in sidebar
- [ ] Icon displays correctly
- [ ] Click navigates to /pricing
- [ ] Active state works
- [ ] Mobile hamburger menu includes new item

---

**Next Phase:** [phase-07-testing.md](phase-07-testing.md)

