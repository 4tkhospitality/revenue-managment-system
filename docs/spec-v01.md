# RMS – VERSION 01 (MVP)

## SCOPE LOCK – ĐIỀU KIỆN BẤT DI BẤT DỊCH
✅ CÓ LÀM (V01)
- PMS-agnostic CSV Import
- Daily OTB Time-Travel (as_of_date)
- RMS Feature Engine (pickup, pace, supply)
- Forecast Remaining Demand
- Rule-based Pricing Optimization
- Recommendation Dashboard
- Accept / Override + Decision Log
- Excel Export để GM upload giá thủ công

❌ KHÔNG LÀM (V01)
- Không PMS (no booking lifecycle, no room assignment)
- Không Channel Manager
- Không OTA XML / webhook
- Không Rate Plan / Room Type dimension
- Không Reinforcement Learning
- Không Comp-set scraping
- Không LOS optimization

## MỤC TIÊU SẢN PHẨM (V01)
Trong 14 ngày pilot, GM/RM có thể:
- Upload file PMS
- Xem pickup & demand rõ ràng hơn PMS
- Nhận giá gợi ý dễ hiểu
- Quyết định nhanh: Accept / Override

## 2. INPUT CHUẨN – PMS AGNOSTIC
### 2.1 File duy nhất: reservations.csv
### 2.2 Schema (BẮT BUỘC)
- reservation_id (string)
- booking_date (date)
- arrival_date (date)
- departure_date (date)
- rooms (int)
- revenue (number)
- status (enum: booked / cancelled)
- cancel_date (date, nullable)

## 3. DATA MODEL (V01)
Tables:
- hotels
- users
- reservations_raw (append-only)
- daily_otb
- features_daily
- demand_forecast
- price_recommendations
- pricing_decisions
- model_runs

Grain: (hotel_id, as_of_date, stay_date)

## 4. PIPELINE TỔNG THỂ (DAILY BATCH)
CSV Import -> reservations_raw -> daily_otb -> features_daily -> demand_forecast -> price_recommendations -> Dashboard

## 5. MODULE DESIGN
(Chi tiết xem prompt gốc hoặc workflow Plan)

## 7. TECH STACK PROPOSED (PIVOTED)
- **Full-stack**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Supabase/Neon/Local)
- **ORM**: Prisma
- **ML/Math**: JS Heuristics / Simple Regression (ml-regression)
- **Hosting**: Vercel
- **Jobs**: Next.js Server Actions + Cron
