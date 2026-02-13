# Plan: Dashboard Restructure (Tabs + UUPM Polish)
Created: 2026-02-13T21:58:00+07:00
Status: 🟡 In Progress

## Overview
Restructure GM Dashboard từ 9+ section cuộn dọc thành 3 tabs: **Tổng quan** (quyết định nhanh), **Chi tiết** (drivers/mix/behavior), **Giá đề xuất** (action table). Kèm UI polish: emoji → Lucide icons, color discipline, sticky tab bar.

## Decisions (Confirmed)
| Decision | Choice | Reason |
|----------|--------|--------|
| Font | Inter/system (UI), Fira Code (mono only) | Hotel SaaS vibe, not dev-tool |
| Color | Blue #1E40AF + Amber #F59E0B | Amber = warning only, rest neutral |
| Tabs | Tổng quan / Chi tiết / Giá đề xuất | Matches GM workflow: scan → understand → act |
| Tab UX | Sticky bar + badges | Context always visible, action count |
| Tab 1 Table | 7 ngày tới + "Xem thêm" | Đủ để ra quyết định, không dài |
| Icons | Emoji → Lucide SVG | Enterprise feel, consistent sizing |

## Phases

| Phase | Name | Status | Est. Tasks |
|-------|------|--------|------------|
| 01 | DashboardTabs + Layout | ⬜ Pending | 6 |
| 02 | KPI Cards Merge + Polish | ⬜ Pending | 5 |
| 03 | Icon Cleanup (Emoji → Lucide) | ⬜ Pending | 8 |
| 04 | Tab Content Wiring + 7d Table | ⬜ Pending | 5 |
| 05 | Testing & Verification | ⬜ Pending | 6 |

## Quick Commands
- Start: `/code phase-01`
- Check progress: `/next`
