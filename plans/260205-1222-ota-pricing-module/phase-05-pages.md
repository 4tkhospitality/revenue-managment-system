# Phase 05: Pages & Layout

**Status:** ⬜ Pending  
**Dependencies:** Phase 04 (Components)  
**Estimated Time:** 30 mins

---

## Objective

Tạo route `/pricing` với layout và page chính.

---

## Tasks

### 5.1. Create Layout
- [ ] Create `app/pricing/layout.tsx`
- [ ] Import Sidebar component
- [ ] Match dashboard layout style

### 5.2. Create Main Page
- [ ] Create `app/pricing/page.tsx`
- [ ] Add header with title
- [ ] Add TabContainer with 4 tabs
- [ ] Handle tab state

### 5.3. Add Metadata
- [ ] Page title: "Tính giá OTA | RMS"
- [ ] SEO meta tags

---

## Files to Create

```
apps/web/app/pricing/
├── layout.tsx
└── page.tsx
```

---

## Code Snippets

### Layout
```tsx
// app/pricing/layout.tsx
import { Sidebar } from '@/components/dashboard/Sidebar';

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F7FB' }}>
      <Sidebar />
      <main className="lg:ml-64 flex-1 min-h-screen pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
```

### Page
```tsx
// app/pricing/page.tsx
'use client';

import { useState } from 'react';
import { TabContainer } from '@/components/pricing/TabContainer';
import { RoomTypesTab } from '@/components/pricing/RoomTypesTab';
import { OTAConfigTab } from '@/components/pricing/OTAConfigTab';
import { PromotionsTab } from '@/components/pricing/PromotionsTab';
import { OverviewTab } from '@/components/pricing/OverviewTab';

export default function PricingPage() {
  const [activeTab, setActiveTab] = useState('room-types');
  
  return (
    <div className="mx-auto max-w-[1400px] px-8 py-6 space-y-6">
      {/* Header */}
      <header 
        className="rounded-2xl px-6 py-4 text-white shadow-sm"
        style={{ background: 'linear-gradient(to right, #1E3A8A, #102A4C)' }}
      >
        <h1 className="text-lg font-semibold">💰 Tính giá OTA</h1>
        <p className="text-white/70 text-sm mt-1">
          Quản lý giá hiển thị trên các kênh OTA
        </p>
      </header>
      
      {/* Content */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm">
        <TabContainer activeTab={activeTab} onTabChange={setActiveTab} />
        
        <div className="p-6">
          {activeTab === 'room-types' && <RoomTypesTab />}
          {activeTab === 'ota-config' && <OTAConfigTab />}
          {activeTab === 'promotions' && <PromotionsTab />}
          {activeTab === 'overview' && <OverviewTab />}
        </div>
      </div>
    </div>
  );
}
```

---

## Test Criteria

- [ ] `/pricing` route accessible
- [ ] Layout matches dashboard style
- [ ] Tab navigation works
- [ ] All tabs render content
- [ ] Responsive on mobile

---

**Next Phase:** [phase-06-sidebar.md](phase-06-sidebar.md)

