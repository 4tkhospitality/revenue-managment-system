# RMS Audit Bundle (Source Code & Signals)
**Date**: 2026-02-07
**Purpose**: Source of truth for Code-Level Audit & Logic Verification.

---

## Part A: 5 Core Source Files

### 1. `app/actions/ingestCSV.ts` (Validation & Import Logic)
```typescript
'use server'

import prisma from '../../lib/prisma';
import { CSVUtils } from '../../lib/csv';
import { DateUtils } from '../../lib/date';
import { HashUtils } from '../../lib/hash';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { invalidateStatsCache } from '../../lib/cachedStats';

const STRICT_MODE = true; // Reject job on unknown status

export async function ingestCSV(formData: FormData) {
    const file = formData.get('file') as File;
    const hotelId = formData.get('hotelId') as string;

    if (!file || !hotelId) {
        throw new Error("Missing file or hotelId");
    }

    // 1. Compute Hash
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileHash = HashUtils.computeFileHash(buffer);

    // 2. Check Idempotency
    const existingJob = await prisma.importJob.findFirst({
        where: {
            hotel_id: hotelId,
            file_hash: fileHash
        }
    });

    if (existingJob) {
        if (existingJob.status === 'completed') {
            return { success: false, message: "File already processed", error: "DUPLICATE_FILE" };
        }
    }

    // 3. Create Job
    const job = await prisma.importJob.create({
        data: {
            hotel_id: hotelId,
            file_name: file.name,
            file_hash: fileHash,
            status: 'processing'
        }
    });

    try {
        // 4. Parse CSV
        const csvContent = buffer.toString('utf-8');
        const rows = await CSVUtils.parseString(csvContent);
        const validRows = [];

        // 5. Validation Loop
        for (const [index, row] of rows.entries()) {
            const line = index + 2; // header is 1

            // Normalize Status
            const rawStatus = row.status?.trim().toLowerCase();
            let status: 'booked' | 'cancelled';

            if (rawStatus === 'booked' || rawStatus === 'confirmed') status = 'booked';
            else if (rawStatus === 'cancelled' || rawStatus === 'canceled') status = 'cancelled';
            else {
                if (STRICT_MODE) throw new Error(`Line ${line}: Unknown status '${rawStatus}'`);
                console.warn(`Line ${line}: Unknown status '${rawStatus}', skipping.`);
                continue;
            }

            // Parse Dates
            const bookingDate = DateUtils.parseDate(row.booking_date);
            const arrivalDate = DateUtils.parseDate(row.arrival_date);
            const departureDate = DateUtils.parseDate(row.departure_date);
            const cancelDate = row.cancel_date ? DateUtils.parseDate(row.cancel_date) : null;

            if (!bookingDate || !arrivalDate || !departureDate) {
                throw new Error(`Line ${line}: Invalid dates`);
            }

            // Logical Validations
            if (!DateUtils.isBefore(arrivalDate, departureDate)) {
                // arrival >= departure -> Invalid stay
                throw new Error(`Line ${line}: Arrival must be before Departure`);
            }

            const rooms = parseInt(row.rooms || '0');
            const revenue = parseFloat(row.revenue || '0');

            if (rooms <= 0) throw new Error(`Line ${line}: Rooms must be > 0`);
            if (revenue < 0) throw new Error(`Line ${line}: Revenue cannot be negative`);

            if (status === 'cancelled' && !cancelDate) {
                console.warn(`Line ${line}: Cancelled booking missing cancel_date`);
            }

            validRows.push({
                hotel_id: hotelId,
                job_id: job.job_id,
                reservation_id: row.reservation_id,
                booking_date: bookingDate,
                arrival_date: arrivalDate,
                departure_date: departureDate,
                rooms: rooms,
                revenue: revenue,
                status: status,
                cancel_date: cancelDate
            });
        }

        // 6. Bulk Insert
        await prisma.reservationsRaw.createMany({
            data: validRows,
            skipDuplicates: true
        });

        // 7. Complete Job
        await prisma.importJob.update({
            where: { job_id: job.job_id },
            data: { status: 'completed', finished_at: new Date() }
        });

        invalidateStatsCache();
        try { revalidatePath('/dashboard'); } catch (e) {}
        return { success: true, jobId: job.job_id, count: validRows.length };

    } catch (err: any) {
        await prisma.importJob.update({
            where: { job_id: job.job_id },
            data: {
                status: 'failed',
                error_summary: err.message || "Unknown Error",
                finished_at: new Date()
            }
        });
        return { success: false, message: err.message };
    }
}
```

### 2. `app/actions/buildDailyOTB.ts` (Time-Travel OTB Builder)
```typescript
'use server';

import prisma from '../../lib/prisma';
import { revalidatePath } from 'next/cache';
import { Decimal } from '@prisma/client/runtime/library';

function calculateRevenuePerNight(totalRevenue: number | Decimal, nights: number, nightIndex: number): number {
    const total = typeof totalRevenue === 'number' ? totalRevenue : Number(totalRevenue);
    if (nights <= 0) return total;
    const revenuePerNight = Math.floor(total / nights);
    const remainder = total - (revenuePerNight * nights);
    if (nightIndex === nights - 1) {
        return revenuePerNight + remainder;
    }
    return revenuePerNight;
}

export async function buildDailyOTB(params?: any): Promise<any> {
    const hotelId = params?.hotelId || process.env.DEFAULT_HOTEL_ID;
    const asOfTs = params?.asOfTs || new Date();
    const snapshotDate = new Date(asOfTs);
    snapshotDate.setHours(0, 0, 0, 0);

    const stayDateFrom = params?.stayDateFrom || new Date('2020-01-01');
    const stayDateTo = params?.stayDateTo || new Date('2030-12-31');

    try {
        // V01.1: Time-Travel Query
        const reservations = await prisma.reservationsRaw.findMany({
            where: {
                hotel_id: hotelId,
                OR: [
                    { book_time: { lte: asOfTs } },
                    { book_time: null, booking_date: { lte: asOfTs } }
                ],
                AND: {
                    OR: [
                        { cancel_time: null },
                        { cancel_time: { gt: asOfTs } }
                    ]
                }
            },
            select: {
                reservation_id: true,
                arrival_date: true,
                departure_date: true,
                rooms: true,
                revenue: true,
            },
        });

        if (reservations.length === 0) return { success: false, error: 'No active reservations' };

        // ⚠️ CRITICAL: No deduplication logic here!
        const stayDateMap = new Map<string, { rooms: number; revenue: number }>();

        for (const res of reservations) {
            const arrival = new Date(res.arrival_date);
            const departure = new Date(res.departure_date);
            const nights = Math.ceil((departure.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24));

            for (let i = 0; i < nights; i++) {
                const stayDate = new Date(arrival);
                stayDate.setDate(stayDate.getDate() + i);

                if (stayDate < stayDateFrom || stayDate > stayDateTo) continue;

                const dateKey = stayDate.toISOString().split('T')[0];
                const revenueForNight = calculateRevenuePerNight(res.revenue, nights, i);
                const existing = stayDateMap.get(dateKey) || { rooms: 0, revenue: 0 };
                
                stayDateMap.set(dateKey, {
                    rooms: existing.rooms + res.rooms,
                    revenue: existing.revenue + revenueForNight,
                });
            }
        }

        const otbRows = Array.from(stayDateMap.entries())
            .map(([dateKey, data]) => ({
                hotel_id: hotelId,
                as_of_date: snapshotDate,
                stay_date: new Date(dateKey),
                rooms_otb: data.rooms,
                revenue_otb: data.revenue,
            }));

        await prisma.dailyOTB.deleteMany({
            where: { hotel_id: hotelId, as_of_date: snapshotDate },
        });

        await prisma.dailyOTB.createMany({ data: otbRows });
        
        return { success: true, daysBuilt: otbRows.length };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
```

### 3. `lib/pricing/engine.ts` (Math Core)
```typescript
import type { CalcType, CalcResult, DiscountItem } from './types';
import { validatePromotions, formatVND } from './validators';

export function calcBarFromNet(
    net: number,
    commission: number,     // % (0-100)
    discounts: DiscountItem[],
    calcType: CalcType,
    roundingRule: 'CEIL_1000' | 'ROUND_100' | 'NONE' = 'CEIL_1000',
    vendor: string = 'agoda'
): CalcResult {
    // 1. Validations
    if (commission >= 100) return { ...errorResult };

    // 2. Gross up
    const commissionDecimal = commission / 100;
    const gross = net / (1 - commissionDecimal);

    // 3. Discount Reverse
    let bar: number;
    if (calcType === 'PROGRESSIVE') {
        let multiplier = 1;
        discounts.forEach((d) => { multiplier *= (1 - d.percent / 100); });
        bar = gross / multiplier;
    } else {
        const totalDiscount = discounts.reduce((sum, d) => sum + d.percent, 0);
        if (totalDiscount >= 100) return { ...errorResult };
        bar = gross / (1 - totalDiscount / 100);
    }

    // 4. Rounding
    let finalBar = bar;
    if (roundingRule === 'CEIL_1000') {
        finalBar = Math.ceil(bar / 1000) * 1000;
    } else if (roundingRule === 'ROUND_100') {
        finalBar = Math.round(bar / 100) * 100;
    } else {
        finalBar = Math.round(bar);
    }

    return { bar: finalBar, barRaw: bar, net, commission, ...rest };
}
```

### 4. `middleware.ts` (RBAC & Tenancy)
```typescript
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"

const ACTIVE_HOTEL_COOKIE = 'rms_active_hotel'
const noHotelRoutes = ["/admin", "/api/admin", "/select-hotel", "/onboarding"]

const ROLE_RANK: Record<string, number> = {
    viewer: 0, manager: 1, hotel_admin: 2, super_admin: 3,
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    
    // Auth Check
    const session = await auth()
    if (!session?.user) return NextResponse.redirect(new URL("/auth/login", request.url))

    // Validations & Redirects...
    // Tenant Check
    const requiresHotel = !noHotelRoutes.some(route => pathname.startsWith(route))

    if (requiresHotel) {
        const activeHotelId = request.cookies.get(ACTIVE_HOTEL_COOKIE)?.value
        const accessibleHotels = session.user.accessibleHotels || []
        
        // Security: Validate Cookie against Session Claims
        const hotelAccess = accessibleHotels.find(h => h.hotelId === activeHotelId)
        if (!hotelAccess) {
             return NextResponse.redirect(new URL("/select-hotel", request.url))
        }

        // RBAC Check
        if (!hasRoutePermission(pathname, hotelAccess.role)) {
            return NextResponse.redirect(new URL("/unauthorized", request.url))
        }
    }
    return NextResponse.next()
}
```

### 5. `prisma/schema.prisma` (Database)
Check `docs/specs/02_database_schema.md` or source code. Key constraints:
- `@@unique([hotel_id, reservation_id, job_id])` in `reservations_raw`.
- `otel_id` mandatory in all models.
- No RLS policies defined (handled in App layer).

---

## Part B: Policy Decisions (Signed off)

| Policy | Decision | Implementation Notes |
| :--- | :--- | :--- |
| **Revenue Type** | **NET** (Room Charge) | Engine calculates BAR from this NET. Taxes/Fees handled **outside** engine (Post-calc). |
| **Cut-off Time** | **Timestamp (UTC)** | `asOfTs` in V01.1 ensures global consistency. UI should convert Local Midnight → UTC Timestamp. |
| **Amendments** | **Latest Job Wins** | `buildDailyOTB` **MUST** be patched (Patch A) to deduplicate by `reservation_id`. |
| **Missing Cancel Date** | **Reject** | Strict mode enables. If data quality is low, fallback to `cancel_date = import_date`. |

---

## Part C: Expected Outputs (Simulated)

### 1. DailyOTB Logic (Time-Travel)
**Scenario**: Res #101 (2 nights, $200). Booked Jan 1. Cancelled Jan 3 (at 10:00).
- **Snapshot Jan 2 (Active)**:
    - Res #101 is Active (`book_time <= Jan 2`, `cancel_time > Jan 2`).
    - **Output**: 2 Rows (Stay Day 1, Stay Day 2). Revenue: $100/night.
- **Snapshot Jan 4 (Cancelled)**:
    - Res #101 is Inactive (`cancel_time <= Jan 4`).
    - **Output**: 0 Rows. (Correct pickup logic: OTB drops by $200).

### 2. Pricing Logic (Progressive vs Additive)
**Input**: Net $800,000. Comm 15%. Promo A (10%), Promo B (10%). Rounding CEIL_1000.
**Gross**: 800,000 / (1 - 0.15) = 941,176.
- **Progressive (Booking.com)**:
    - Step 1: 941,176 / (1 - 0.10) = 1,045,751
    - Step 2: 1,045,751 / (1 - 0.10) = 1,161,945
    - Round: **1,162,000**
- **Additive (Agoda)**:
    - Total Disc: 10% + 10% = 20%
    - Calc: 941,176 / (1 - 0.20) = 1,176,470
    - Round: **1,177,000**
> *Difference*: Agoda price is higher because discounts are summed (bigger denominator impact? No, bigger discount chunk means we need HIGHER bar to keep same Net). Wait. Additive: `Bar * (1 - 0.2) = Gross`. Progressive: `Bar * 0.9 * 0.9 = Bar * 0.81 = Gross`. 0.8 < 0.81. So Additive retains LESS, requiring HIGHER Bar. Math checks out.

### 3. Rate Shopper Caching
**Competitor**: "Comp A" (Token: `X123`).
**Scenario**:
1. **08:00**: Scan `check_in=2026-03-01`. DB Cache Miss. Call SerpApi. Save `expires_at=10:00`. Return Source: `LIVE`.
2. **09:30**: Scan `check_in=2026-03-01`. DB Cache Hit (`now < expires`). Return Source: `CACHE`.
3. **10:30**: Scan `check_in=2026-03-01`. DB Cache Stale (`now > expires`). Call SerpApi. Update Cache. Return Source: `LIVE`.
