# Plan: Pace & Pickup → Dashboard Tab 2
Created: 2026-02-13 23:03
Status: 🟡 In Progress

## Overview
Merge /analytics page (734 LOC) into Dashboard Tab 2 "Phân tích" using Option B (Hybrid).
P0 launch uses client-side computed metrics (ADR, Occ%, RevPAR) without backend changes.

## Tech Stack
- Frontend: Next.js 16 + Recharts + Lucide
- Backend: Existing `/api/analytics/features` (no changes in P0)
- Database: Existing FeaturesDaily + DailyOTB tables

## Locked Decisions
D1-D10 documented in implementation_plan.md

## Phases

| Phase | Name | Status | Progress |
|-------|------|--------|----------|
| 01 | Componentize + P0 Metrics | ⬜ Pending | 0% |
| 02 | Rewire Dashboard Tab 2 | ⬜ Pending | 0% |
| 03 | Redirect /analytics | ⬜ Pending | 0% |
| 04 | UUPM Polish | ⬜ Pending | 0% |
| 05 | Gross/Net + Cancel Trend (P1) | ⬜ Pending | 0% |

## Quick Commands
- Start Phase 1: `/code phase-01`
- Check progress: `/next`
- Save context: `/save-brain`
