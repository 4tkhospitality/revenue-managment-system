'use server';

import prisma from '../../lib/prisma';
import { getActiveHotelId } from '../../lib/pricing/get-hotel';

// ─── Types ──────────────────────────────────────────────────
export type ValidationSeverity = 'FAIL' | 'WARNING' | 'INFO';

export interface ValidationIssue {
    severity: ValidationSeverity;
    code: string;
    message: string;
    stay_date?: string;
    as_of_date?: string;
    value?: number;
}

export interface ValidationStats {
    totalRows: number;
    failCount: number;
    warningCount: number;
    infoCount: number;
    completeness: number; // % of stay_dates with data
    dateRange: { from: string; to: string } | null;
}

export interface ValidationResult {
    valid: boolean; // false if any FAIL issues
    issues: ValidationIssue[];
    stats: ValidationStats;
}

// ─── Main Validation ────────────────────────────────────────
export async function validateOTBData(
    hotelId?: string,
    asOfDate?: Date
): Promise<ValidationResult> {
    const resolvedHotelId = hotelId || await getActiveHotelId();
    if (!resolvedHotelId) {
        return {
            valid: false,
            issues: [{ severity: 'FAIL', code: 'NO_HOTEL', message: 'No active hotel found' }],
            stats: { totalRows: 0, failCount: 1, warningCount: 0, infoCount: 0, completeness: 0, dateRange: null },
        };
    }

    // Get hotel capacity for outlier checks
    const hotel = await prisma.hotel.findUnique({
        where: { hotel_id: resolvedHotelId },
        select: { capacity: true, name: true },
    });

    if (!hotel) {
        return {
            valid: false,
            issues: [{ severity: 'FAIL', code: 'HOTEL_NOT_FOUND', message: 'Hotel not found in database' }],
            stats: { totalRows: 0, failCount: 1, warningCount: 0, infoCount: 0, completeness: 0, dateRange: null },
        };
    }

    const capacity = hotel.capacity;
    const issues: ValidationIssue[] = [];

    // ── 1. Fetch all OTB rows (optionally filtered by as_of_date) ──
    const whereClause: Record<string, unknown> = { hotel_id: resolvedHotelId };
    if (asOfDate) {
        whereClause.as_of_date = asOfDate;
    }

    const otbRows = await prisma.dailyOTB.findMany({
        where: whereClause as any,
        select: {
            as_of_date: true,
            stay_date: true,
            rooms_otb: true,
            revenue_otb: true,
        },
        orderBy: [{ as_of_date: 'desc' }, { stay_date: 'asc' }],
    });

    if (otbRows.length === 0) {
        return {
            valid: true,
            issues: [{ severity: 'INFO', code: 'NO_DATA', message: 'No OTB data found for this hotel' }],
            stats: { totalRows: 0, failCount: 0, warningCount: 0, infoCount: 1, completeness: 0, dateRange: null },
        };
    }

    // ── 2. Invariant checks ──
    for (const row of otbRows) {
        const stayStr = row.stay_date.toISOString().split('T')[0];
        const asOfStr = row.as_of_date.toISOString().split('T')[0];

        // 2a. rooms_otb >= 0
        if (row.rooms_otb < 0) {
            issues.push({
                severity: 'FAIL',
                code: 'NEGATIVE_ROOMS',
                message: `rooms_otb = ${row.rooms_otb} (negative — data corruption)`,
                stay_date: stayStr,
                as_of_date: asOfStr,
                value: row.rooms_otb,
            });
        }

        // 2b. revenue_otb >= 0
        const revenue = Number(row.revenue_otb);
        if (revenue < 0) {
            issues.push({
                severity: 'FAIL',
                code: 'NEGATIVE_REVENUE',
                message: `revenue_otb = ${revenue.toLocaleString()} (negative — data corruption)`,
                stay_date: stayStr,
                as_of_date: asOfStr,
                value: revenue,
            });
        }

        // 2c. stay_date < as_of_date → WARNING (historical/actualized data)
        if (row.stay_date < row.as_of_date) {
            issues.push({
                severity: 'WARNING',
                code: 'PAST_STAY_DATE',
                message: `stay_date ${stayStr} < as_of_date ${asOfStr} (historical/actualized)`,
                stay_date: stayStr,
                as_of_date: asOfStr,
            });
        }

        // 2d. rooms_otb > capacity → outlier (overbooking or data error)
        if (row.rooms_otb > capacity) {
            issues.push({
                severity: 'WARNING',
                code: 'EXCEEDS_CAPACITY',
                message: `rooms_otb ${row.rooms_otb} > capacity ${capacity} (overbooking or data error)`,
                stay_date: stayStr,
                as_of_date: asOfStr,
                value: row.rooms_otb,
            });
        }
    }

    // ── 3. Outlier detection: unusual single-day pickup ──
    // Group by as_of_date to compare consecutive snapshots
    if (!asOfDate) {
        const asOfDates = [...new Set(otbRows.map(r => r.as_of_date.toISOString().split('T')[0]))].sort();
        if (asOfDates.length >= 2) {
            // Check the 2 most recent as_of_dates for huge pickup swings
            const latest = asOfDates[asOfDates.length - 1];
            const prev = asOfDates[asOfDates.length - 2];

            const latestMap = new Map<string, number>();
            const prevMap = new Map<string, number>();

            for (const r of otbRows) {
                const asOfStr = r.as_of_date.toISOString().split('T')[0];
                const stayStr = r.stay_date.toISOString().split('T')[0];
                if (asOfStr === latest) latestMap.set(stayStr, r.rooms_otb);
                if (asOfStr === prev) prevMap.set(stayStr, r.rooms_otb);
            }

            for (const [stayStr, rooms] of latestMap) {
                const prevRooms = prevMap.get(stayStr);
                if (prevRooms !== undefined) {
                    const pickup = rooms - prevRooms;
                    if (Math.abs(pickup) > 0.3 * capacity) {
                        issues.push({
                            severity: 'WARNING',
                            code: 'UNUSUAL_PICKUP',
                            message: `Single-day pickup |${pickup}| > 30% capacity (${Math.round(0.3 * capacity)}) for stay_date ${stayStr}`,
                            stay_date: stayStr,
                            as_of_date: latest,
                            value: pickup,
                        });
                    }
                }
            }
        }
    }

    // ── 4. Completeness check ──
    // For the latest as_of_date: what % of expected stay_dates have data?
    const latestAsOf = otbRows[0].as_of_date; // already sorted desc
    const latestRows = otbRows.filter(r => r.as_of_date.getTime() === latestAsOf.getTime());

    const stayDatesSet = new Set(latestRows.map(r => r.stay_date.toISOString().split('T')[0]));

    // Expected range: from as_of_date to as_of_date + 365
    const asOfMs = latestAsOf.getTime();
    const dayMs = 86400000;
    let expectedDays = 0;
    let foundDays = 0;

    for (let d = 0; d <= 365; d++) {
        const dt = new Date(asOfMs + d * dayMs).toISOString().split('T')[0];
        expectedDays++;
        if (stayDatesSet.has(dt)) foundDays++;
    }

    const completeness = expectedDays > 0 ? Math.round((foundDays / expectedDays) * 100) : 0;

    if (completeness < 50) {
        issues.push({
            severity: 'WARNING',
            code: 'LOW_COMPLETENESS',
            message: `Only ${completeness}% of expected stay_dates have OTB data (${foundDays}/${expectedDays})`,
        });
    }

    // ── 5. Date range info ──
    const allStayDates = otbRows.map(r => r.stay_date.toISOString().split('T')[0]).sort();
    const dateRange = allStayDates.length > 0
        ? { from: allStayDates[0], to: allStayDates[allStayDates.length - 1] }
        : null;

    // ── Summary ──
    const failCount = issues.filter(i => i.severity === 'FAIL').length;
    const warningCount = issues.filter(i => i.severity === 'WARNING').length;
    const infoCount = issues.filter(i => i.severity === 'INFO').length;

    return {
        valid: failCount === 0,
        issues: issues.slice(0, 100), // Cap at 100 to avoid huge payloads
        stats: {
            totalRows: otbRows.length,
            failCount,
            warningCount,
            infoCount,
            completeness,
            dateRange,
        },
    };
}
