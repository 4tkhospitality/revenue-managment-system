# Phase 04: UI Components

**Status:** ⬜ Pending  
**Dependencies:** Phase 03 (API)  
**Estimated Time:** 2 hours

---

## Objective

Tạo các React components cho 4 tabs của Pricing module.

---

## Tasks

### 4.1. Tab Container
- [ ] Create `TabContainer.tsx` - Tab navigation (4 tabs)

### 4.2. Room Types Tab
- [ ] Create `RoomTypesTab.tsx`
- [ ] Table with: Name, Description, NET Price
- [ ] Add/Edit modal with thousand separator input
- [ ] Delete confirmation

### 4.3. OTA Config Tab
- [ ] Create `OTAConfigTab.tsx`
- [ ] Table with: Name, Code, Commission, Calc Type, Active
- [ ] Add/Edit modal
- [ ] Toggle active status

### 4.4. Promotions Tab
- [ ] Create `PromotionsTab.tsx`
- [ ] Select OTA channel dropdown
- [ ] List active campaigns
- [ ] Add promotion button → PromotionPickerModal
- [ ] Show validation errors/warnings

### 4.5. Promotion Picker Modal
- [ ] Create `PromotionPickerModal.tsx`
- [ ] Group by: Seasonal, Essential, Targeted
- [ ] Show subcategory for Targeted
- [ ] Input discount percentage
- [ ] Stacking rules displayed

### 4.6. Overview Tab
- [ ] Create `OverviewTab.tsx`
- [ ] Matrix table: Rows = Room Types, Cols = OTA Channels
- [ ] Cell = BAR price
- [ ] Color coding (high = red, low = green)
- [ ] Export CSV button

### 4.7. Trace Panel
- [ ] Create `AgodaTracePanel.tsx`
- [ ] Show step-by-step calculation
- [ ] Collapsible/expandable

### 4.8. Shared Components
- [ ] `PriceInput.tsx` - Input with thousand separator
- [ ] `PercentInput.tsx` - Input with % suffix

---

## Files to Create

```
apps/web/components/pricing/
├── TabContainer.tsx
├── RoomTypesTab.tsx
├── OTAConfigTab.tsx
├── PromotionsTab.tsx
├── OverviewTab.tsx
├── PromotionPickerModal.tsx
├── AgodaTracePanel.tsx
├── PriceInput.tsx
└── PercentInput.tsx
```

---

## UI Patterns (RMS Theme)

### Card Style
```tsx
<div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-6">
  {/* content */}
</div>
```

### Header Style
```tsx
<header 
  className="rounded-2xl px-6 py-4 text-white flex items-center justify-between shadow-sm"
  style={{ background: 'linear-gradient(to right, #1E3A8A, #102A4C)' }}
>
  <div>
    <h1 className="text-lg font-semibold">💰 Tính giá OTA</h1>
    <p className="text-white/70 text-sm">Quản lý giá hiển thị trên các kênh OTA</p>
  </div>
</header>
```

### Tab Navigation
```tsx
<div className="flex gap-2 border-b border-slate-200">
  {tabs.map(tab => (
    <button
      key={tab.id}
      className={`px-4 py-2 -mb-px ${
        activeTab === tab.id 
          ? 'border-b-2 border-blue-600 text-blue-600 font-medium'
          : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      {tab.label}
    </button>
  ))}
</div>
```

### Matrix Table
```tsx
<table className="w-full border-collapse">
  <thead>
    <tr className="bg-slate-50">
      <th className="p-3 text-left border">Hạng phòng</th>
      {channels.map(ch => (
        <th key={ch.id} className="p-3 text-center border">{ch.name}</th>
      ))}
    </tr>
  </thead>
  <tbody>
    {roomTypes.map(rt => (
      <tr key={rt.id}>
        <td className="p-3 border font-medium">{rt.name}</td>
        {channels.map(ch => (
          <td 
            key={ch.id} 
            className={`p-3 border text-center ${getColorClass(matrix[`${rt.id}:${ch.id}`].bar)}`}
          >
            {formatVND(matrix[`${rt.id}:${ch.id}`].bar)}
          </td>
        ))}
      </tr>
    ))}
  </tbody>
</table>
```

---

## Test Criteria

- [ ] All 4 tabs render correctly
- [ ] CRUD operations work from UI
- [ ] Thousand separator displays correctly
- [ ] Matrix refreshes when data changes
- [ ] Export CSV downloads file
- [ ] Responsive on mobile

---

**Next Phase:** [phase-05-pages.md](phase-05-pages.md)

