'use server';

import prisma from '../../lib/prisma';

/**
 * Analytics Layer Phase 0.5: Data Validation Guardrails
 * 
 * Validates OTB data quality before building features:
 * - stay_date < as_of_date → WARNING (should not happen in runtime)
 * - rooms_otb > capacity → FLAG overbooking
 * - ADR outliers (> P99 of last 30 days)
 * 
 * Returns quality badges for API responses
 */

export interface ValidationResult {
    isValid: boolean;
    warnings: ValidationWarning[];
    stats: ValidationStats;
}

export interface ValidationWarning {
    type: 'PAST_STAY_DATE' | 'OVERBOOKING' | 'ADR_OUTLIER' | 'MISSING_DATA' | 'STLY_MISSING';
    severity: 'info' | 'warning' | 'error';
    message: string;
    count?: number;
    details?: Record<string, any>;
}

export interface ValidationStats {
    totalDays: number;
    validDays: number;
    overbookedDays: number;
    adrOutlierDays: number;
    stlyMatchedDays: number;
    dataCompleteness: number; // 0-1
}

/**
 * Validate OTB data for a hotel within a date range
 */
export async function validateOTBData(
    hotelId: string,
    asOfDate: Date,
    stayDateFrom?: Date,
    stayDateTo?: Date
): Promise<ValidationResult> {
    const warnings: ValidationWarning[] = [];

    // Get hotel capacity
    const hotel = await prisma.hotel.findUnique({
        where: { hotel_id: hotelId },
        select: { capacity: true, name: true }
    });

    if (!hotel) {
        return {
            isValid: false,
            warnings: [{
                type: 'MISSING_DATA',
                severity: 'error',
                message: 'Hotel not found'
            }],
            stats: {
                totalDays: 0,
                validDays: 0,
                overbookedDays: 0,
                adrOutlierDays: 0,
                stlyMatchedDays: 0,
                dataCompleteness: 0
            }
        };
    }

    // Default range: as_of_date to +180 days
    const from = stayDateFrom || asOfDate;
    const to = stayDateTo || new Date(asOfDate.getTime() + 180 * 24 * 60 * 60 * 1000);

    // Get OTB data
    const otbData = await prisma.dailyOTB.findMany({
        where: {
            hotel_id: hotelId,
            as_of_date: asOfDate,
            stay_date: { gte: from, lte: to }
        },
        orderBy: { stay_date: 'asc' }
    });

    if (otbData.length === 0) {
        return {
            isValid: false,
            warnings: [{
                type: 'MISSING_DATA',
                severity: 'error',
                message: `No OTB data found for as_of_date ${asOfDate.toISOString().split('T')[0]}`
            }],
            stats: {
                totalDays: 0,
                validDays: 0,
                overbookedDays: 0,
                adrOutlierDays: 0,
                stlyMatchedDays: 0,
                dataCompleteness: 0
            }
        };
    }

    // Validation checks
    let overbookedDays = 0;
    let adrOutlierDays = 0;
    let pastStayDates = 0;
    const OVERBOOKING_THRESHOLD = 1.2; // D9: > 120% capacity

    // Calculate P99 ADR from last 30 days
    const thirtyDaysAgo = new Date(asOfDate);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const historicalADRs = await prisma.dailyOTB.findMany({
        where: {
            hotel_id: hotelId,
            as_of_date: { gte: thirtyDaysAgo, lte: asOfDate },
            rooms_otb: { gt: 0 }
        },
        select: { revenue_otb: true, rooms_otb: true }
    });

    const adrs = historicalADRs.map(d =>
        Number(d.revenue_otb) / d.rooms_otb
    ).filter(adr => adr > 0 && isFinite(adr)).sort((a, b) => a - b);

    const p99Index = Math.floor(adrs.length * 0.99);
    const p99ADR = adrs[p99Index] || Infinity;

    // Check each day
    for (const day of otbData) {
        // Check: stay_date < as_of_date (D2: WARNING)
        if (day.stay_date < asOfDate) {
            pastStayDates++;
        }

        // Check: overbooking > 120% capacity (D9)
        const occupancy = day.rooms_otb / hotel.capacity;
        if (occupancy > OVERBOOKING_THRESHOLD) {
            overbookedDays++;
        }

        // Check: ADR outlier > P99
        if (day.rooms_otb > 0) {
            const adr = Number(day.revenue_otb) / day.rooms_otb;
            if (adr > p99ADR) {
                adrOutlierDays++;
            }
        }
    }

    // Generate warnings
    if (pastStayDates > 0) {
        warnings.push({
            type: 'PAST_STAY_DATE',
            severity: 'warning',
            message: `${pastStayDates} stay dates are before as_of_date (will be excluded from runtime)`,
            count: pastStayDates
        });
    }

    if (overbookedDays > 0) {
        warnings.push({
            type: 'OVERBOOKING',
            severity: 'warning',
            message: `${overbookedDays} days have rooms_otb > ${Math.round(OVERBOOKING_THRESHOLD * 100)}% capacity`,
            count: overbookedDays,
            details: { threshold: OVERBOOKING_THRESHOLD, capacity: hotel.capacity }
        });
    }

    if (adrOutlierDays > 0) {
        warnings.push({
            type: 'ADR_OUTLIER',
            severity: 'info',
            message: `${adrOutlierDays} days have ADR above P99 (${Math.round(p99ADR).toLocaleString()})`,
            count: adrOutlierDays,
            details: { p99ADR: Math.round(p99ADR) }
        });
    }

    // Calculate expected days in range
    const expectedDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
    const dataCompleteness = otbData.length / expectedDays;

    return {
        isValid: warnings.filter(w => w.severity === 'error').length === 0,
        warnings,
        stats: {
            totalDays: otbData.length,
            validDays: otbData.length - pastStayDates,
            overbookedDays,
            adrOutlierDays,
            stlyMatchedDays: 0, // Will be populated by buildFeaturesDaily
            dataCompleteness: Math.min(1, dataCompleteness)
        }
    };
}

/**
 * Get data quality badge for display
 */
export function getQualityBadge(validation: ValidationResult): {
    color: 'green' | 'yellow' | 'red';
    label: string;
    icon: string;
} {
    const errorCount = validation.warnings.filter(w => w.severity === 'error').length;
    const warningCount = validation.warnings.filter(w => w.severity === 'warning').length;

    if (errorCount > 0 || validation.stats.dataCompleteness < 0.5) {
        return { color: 'red', label: 'Poor', icon: '⚠️' };
    }

    if (warningCount > 0 || validation.stats.dataCompleteness < 0.8) {
        return { color: 'yellow', label: 'Fair', icon: '🟡' };
    }

    return { color: 'green', label: 'Good', icon: '✅' };
}
