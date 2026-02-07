# Phase 05: Recommendation Engine

**Status:** ⬜ Pending
**Dependencies:** Phase 04

## Objective

Xây dựng rule-based Recommendation Engine: Demand Strength, Alert Rules, Compression/Spike Signals, và Price Recommendations với guardrails.

## Implementation Steps

### A. Demand Analysis (`lib/rate-shopper/recommendation-engine.ts`)
1. [ ] `calculateDemandStrength(otbData)` — WEAK / NORMAL / STRONG (§12.3)
2. [ ] `evaluateAlerts(snapshot)` — OUT_OF_MARKET_HIGH/LOW + LOW_CONFIDENCE (§12.2)
3. [ ] `detectCompression(snapshot)` — sold_out_ratio + no_rate_ratio → MARKET_COMPRESSION (§13.1)
4. [ ] `detectSpike(todaySnapshot, yesterdaySnapshot)` — **day-over-day** ±8% median change → MARKET_SPIKE_UP/DOWN (§13.2). Query: `WHERE snapshot_date = CURRENT_DATE - 1 AND same check_in_date`

### B. Price Recommendation
5. [ ] `calculateRecommendation(snapshot, demandStrength, alerts)`:
   - Apply Decision Matrix (§12.4)
   - Respect guardrails: step_pct, max_change_pct, floor/ceiling
   - Apply cool_down logic
   - Handle LOW confidence → no strong recommendation
6. [ ] `generateReasonCodes(snapshot, demand, alerts)` — build JSON array of reason codes
7. [ ] `saveRecommendation(hotelId, recommendation)` — write to RateShopRecommendation table

### C. Integration with Snapshot Job
8. [ ] Update `MarketSnapshotJob` to trigger recommendation engine after snapshot upsert:
   - Calculate demand strength from features_daily
   - Run alerts + compression + spike (day-over-day)
   - Generate recommendation
   - Save all

## Files to Create/Modify

| File | Purpose |
|------|---------|
| `lib/rate-shopper/recommendation-engine.ts` | All recommendation logic |
| `lib/rate-shopper/jobs/snapshot-job.ts` | **Modify:** trigger recommendation after snapshot upsert |

## Test Criteria

- [ ] Demand strength correctly classifies WEAK/NORMAL/STRONG from OTB data
- [ ] OUT_OF_MARKET_HIGH triggers when price_gap_pct > threshold
- [ ] Compression alert fires when sold_out_ratio ≥ 0.4
- [ ] Spike detection works with day-over-day comparison (yesterday's snapshot)
- [ ] Guardrails enforce max_change_pct and floor/ceiling
- [ ] reason_codes JSON contains all applicable codes

---
**Next Phase:** [Phase 06 - Frontend UI](./phase-06-frontend.md)
