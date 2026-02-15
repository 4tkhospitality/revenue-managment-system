# Plan: Analytics Layer P1 + P2

Created: 2026-02-15T19:05:00+07:00
Status: 🟡 In Progress

## Overview

Tiếp nối Analytics Roadmap (P0 hoàn thành), implement 2 phase còn lại:
- **P1**: Statistical Cancellation Forecast — dự đoán `expected_cxl_rooms` per stay_date bằng thống kê historical cancel rates
- **P2**: ML-based Demand Forecast + Price Optimization — thay thế heuristic `runForecast.ts` bằng pickup-based ML model

## Current State (P0 — ✅ Complete)

| Feature | Status | Files |
|---------|--------|-------|
| STLY Layer | ✅ | `buildFeaturesDaily.ts`, `features_daily.stly_*` |
| Pace T-x (T30/15/7/5/3) | ✅ | `buildFeaturesDaily.ts`, `PaceTable.tsx` |
| Remaining Supply | ✅ | `features_daily.remaining_supply`, `SupplyChart.tsx` |
| Guardrails (min/max/step) | ✅ | `engine.ts`, `guardrails.test.ts` |
| Heuristic Forecast | ✅ | `runForecast.ts` (pickup_avg v02) |
| Daily Action Engine | ✅ | `dailyAction.ts` (rule-based OCC + PI) |

## Tech Stack

- Frontend: Next.js 16 + TypeScript + Recharts
- Backend: Next.js Server Actions + API Routes
- Database: PostgreSQL 16 (Supabase) + Prisma 5
- Testing: Vitest (existing: `pricing-golden.test.ts`, `guardrails.test.ts`)

## Phases

| Phase | Name | Status | Priority |
|-------|------|--------|----------|
| 01 | Cancel Rate Statistics Engine | ⬜ Pending | P1 |
| 02 | Integrate Cancel Forecast into Pipeline | ⬜ Pending | P1 |
| 03 | Cancel Forecast UI (Dashboard) | ⬜ Pending | P1 |
| 04 | Pickup-based Demand Model | ⬜ Pending | P2 |
| 05 | Price Optimization Engine | ⬜ Pending | P2 |
| 06 | ML Dashboard & Controls | ⬜ Pending | P2 |

## Quick Commands

- Start Phase 1: `/code phase-01`
- Check progress: `/next`
- Save context: `/save-brain`
