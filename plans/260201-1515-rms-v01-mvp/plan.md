# Plan: RMS Version 01 (MVP) - PIVOTED
Created: 2026-02-01
Status: 🟡 In Progress
Stack: **Full-stack TypeScript (Next.js + Prisma)**

## Overview
Xây dựng hệ thống RMS lõi (Version 01) phục vụ pilot 14 ngày.
**PIVOT:** Chuyển từ Python/FastAPI sang **Next.js Full-stack** để tối ưu tốc độ dev, deployment và tính đồng bộ (Vibe Coding).

## Tech Stack
- **Framework**: Next.js 14+ (App Router).
- **Language**: TypeScript.
- **Database**: PostgreSQL + **Prisma ORM**.
- **Logic / ML**: JavaScript/TypeScript (Server Actions).
- **Hosting**: Vercel / Docker.

## Phases

| Phase | Name | Modules | Status |
|-------|------|---------|--------|
| 01 | **Foundation (Pivot)** | Clean up Python, Setup Prisma, Next.js | ✅ Complete |
| 02 | **Ingest & OTB** | CSV Parse, Prisma Schema, OTB Engine (JS) | ✅ Complete |
| 03 | **Features & Forecast** | Pickup, Heuristic Forecast | ✅ Complete |
| 04 | **Pricing & Decisions** | Ladder Logic, Decision Log | ✅ Complete |
| 05 | **User Interface** | Dashboard, Charts, Export | 🟡 In Progress |
| 06 | **Release & Handover** | Pilot & Docs | ⬜ Pending |

## Quick Commands
- Continue: `/code phase-01` (Will execute pivot tasks)
- Check progress: `/next`
