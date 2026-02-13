# Phase 04: Event Logging + Usage Roll-up
Status: ⬜ Pending
Sprint: S1
Dependencies: Phase 01

## Objective
Log meaningful billable events to ProductEvent. **Quota-critical events increment UsageMonthly inline** (real-time enforcement). Daily cron is reconciliation only.

## Meaningful Events (only these, no spam)

| Event Type | Trigger | Dedup Rule |
|------------|---------|------------|
| `import_success` | Import completed | Per import job |
| `export_success` | Export completed | Per export action |
| `export_blocked` | Export blocked by quota | 1/session |
| `playbook_open` | Playbook tab opened | 1/session |
| `upgrade_click` | Upgrade CTA clicked | Each click |
| `create_hotel_attempt` | Tried to create 2nd hotel | Each attempt |
| `invite_attempt_blocked` | Invite blocked by seat limit | Each attempt |
| `paywall_view` | Saw paywall/upgrade modal | 1/session |
| `dashboard_view_session` | Dashboard page viewed | 1/session (trial bonus) |
| `pricing_tab_session_view` | Pricing tab viewed | 1/session (trial bonus) |
| `pricing_quote_run` | Ran price calculation | Max 10/day/hotel |

## Implementation Steps

### Event Logger

1. [ ] Create `lib/plg/events.ts`
   - `logEvent(userId, hotelId, eventType, eventData?)` → insert ProductEvent
   - `logSessionEvent(userId, hotelId, eventType, sessionId)` → dedup by session
   - Session dedup: check if event with same `session_id` exists in last 30 min

2. [ ] Create session ID utility
   - Client-side: `getSessionId()` → read/create from sessionStorage
   - Pass as header `X-Session-Id` to API calls

3. [ ] Integrate event logging into existing code
   - Import success → log in `app/api/data/import/route.ts`
   - Export success/blocked → log in export routes
   - Dashboard view → log client-side via `useEffect`
   - Pricing tab → log client-side via `useEffect`

### Inline Quota Increment (Issue A fix)

4. [ ] Create `lib/plg/usage.ts` with `incrementUsage(hotelId, field)`
   - **Quota-critical events** MUST increment `UsageMonthly` inline at the route:
     - `import_success` → `incrementUsage(hotelId, 'imports')`
     - `export_success` → `incrementUsage(hotelId, 'exports')`
     - `seat_added` → `incrementUsage(hotelId, 'active_users')`
   - Uses `prisma.usageMonthly.upsert()` with atomic increment:
     ```ts
     prisma.usageMonthly.upsert({
       where: { hotel_id_month: { hotel_id, month: startOfMonth } },
       create: { hotel_id, month: startOfMonth, imports: 1 },
       update: { imports: { increment: 1 } }
     })
     ```
   - Wrapped in same transaction as the billable action
   - `getUsage(hotelId, month?)` → read UsageMonthly
   - `getCurrentMonthUsage(hotelId)` → convenience wrapper
   - `isNearLimit(hotelId, quotaKey)` → returns true if ≥ 80%

### Usage Reconciliation Cron (not primary enforcement)

5. [ ] Create `app/api/cron/usage-rollup/route.ts`
   - Runs daily via Vercel cron
   - **Purpose**: reconciliation only (fix drift, not primary quota source)
   - **Idempotent**: upsert on `@@unique([hotel_id, month])`
   - **Incremental**: scan events from `last_rollup_at → now`
   - Compares event count vs UsageMonthly counter → fix if drifted
   - Updates `last_rollup_at` after each hotel

6. [ ] Add cron config to `vercel.json`
   ```json
   { "crons": [{ "path": "/api/cron/usage-rollup", "schedule": "0 2 * * *" }] }
   ```

## Files to Create
- `lib/plg/events.ts` — Event logger
- `lib/plg/usage.ts` — Usage queries
- `app/api/cron/usage-rollup/route.ts` — Daily cron (idempotent + incremental)

## Files to Modify
- `app/api/data/import/route.ts` — Log import events + `incrementUsage('imports')`
- `app/api/pricing/export/route.ts` — Log export events + `incrementUsage('exports')`
- `vercel.json` — Add cron schedule

## Test Criteria
- [ ] Events logged to ProductEvent with correct dedup (session_id)
- [ ] **Import route increments UsageMonthly.imports inline** (not waiting for cron)
- [ ] **Export route increments UsageMonthly.exports inline**
- [ ] Cron reconciliation corrects drift if any
- [ ] `getUsage()` returns correct counts
- [ ] `isNearLimit()` returns true at 80%

---
Next Phase: [Phase 05 — PLG UI](./phase-05-plg-ui.md)
