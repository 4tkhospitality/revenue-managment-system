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

export interface BasicValidationResult {
    valid: boolean;
    totalRows: number;
    errorCount: number;
    issues: ValidationIssue[]; // Limited to first 5 for free tier
}

export interface AuditStats {
    totalRows: number;
    failCount: number;
    warningCount: number;
    infoCount: number;
    completeness: number;
    dateRange: { from: string; to: string } | null;
    anomalyCount: number;
    pickupPatterns: number;
}

export interface AuditResult {
    valid: boolean;
    issues: ValidationIssue[];
    stats: AuditStats;
    recommendations: string[];
}

// ─── Basic Validation (Free Tier) ────────────────────────────────
// Quick check: counts rows, finds FAIL-level errors only
export async function basicValidation(
    hotelId?: string
): Promise<BasicValidationResult> {
    const resolvedHotelId = hotelId || await getActiveHotelId();
    if (!resolvedHotelId) {
        return {
            valid: false,
            totalRows: 0,
            errorCount: 1,
            issues: [{ severity: 'FAIL', code: 'NO_HOTEL', message: 'Không tìm thấy khách sạn' }],
        };
    }

    // Count rows
    const totalRows = await prisma.dailyOTB.count({
        where: { hotel_id: resolvedHotelId },
    });

    if (totalRows === 0) {
        return {
            valid: true,
            totalRows: 0,
            errorCount: 0,
            issues: [{ severity: 'INFO', code: 'NO_DATA', message: 'Chưa có dữ liệu OTB' }],
        };
    }

    // Quick FAIL check: negative values only
    const negativeRooms = await prisma.dailyOTB.count({
        where: { hotel_id: resolvedHotelId, rooms_otb: { lt: 0 } },
    });

    const negativeRevenue = await prisma.dailyOTB.count({
        where: { hotel_id: resolvedHotelId, revenue_otb: { lt: 0 } },
    });

    const errorCount = negativeRooms + negativeRevenue;
    const issues: ValidationIssue[] = [];

    if (negativeRooms > 0) {
        issues.push({
            severity: 'FAIL',
            code: 'NEGATIVE_ROOMS',
            message: `Có ${negativeRooms} dòng có rooms_otb âm`,
        });
    }

    if (negativeRevenue > 0) {
        issues.push({
            severity: 'FAIL',
            code: 'NEGATIVE_REVENUE',
            message: `Có ${negativeRevenue} dòng có revenue_otb âm`,
        });
    }

    return {
        valid: errorCount === 0,
        totalRows,
        errorCount,
        issues: issues.slice(0, 5), // Free tier: max 5 issues shown
    };
}

// ─── Full Audit Report (Paid Tier) ────────────────────────────────
// Detailed analysis: completeness, outliers, pickup patterns, recommendations
export async function auditReport(
    hotelId?: string,
    asOfDate?: Date
): Promise<AuditResult> {
    const resolvedHotelId = hotelId || await getActiveHotelId();
    if (!resolvedHotelId) {
        return {
            valid: false,
            issues: [{ severity: 'FAIL', code: 'NO_HOTEL', message: 'No active hotel found' }],
            stats: { totalRows: 0, failCount: 1, warningCount: 0, infoCount: 0, completeness: 0, dateRange: null, anomalyCount: 0, pickupPatterns: 0 },
            recommendations: [],
        };
    }

    const hotel = await prisma.hotel.findUnique({
        where: { hotel_id: resolvedHotelId },
        select: { capacity: true, name: true },
    });

    if (!hotel) {
        return {
            valid: false,
            issues: [{ severity: 'FAIL', code: 'HOTEL_NOT_FOUND', message: 'Hotel not found' }],
            stats: { totalRows: 0, failCount: 1, warningCount: 0, infoCount: 0, completeness: 0, dateRange: null, anomalyCount: 0, pickupPatterns: 0 },
            recommendations: [],
        };
    }

    const capacity = hotel.capacity;
    const issues: ValidationIssue[] = [];
    let anomalyCount = 0;
    let pickupPatterns = 0;

    // Fetch all OTB rows
    const whereClause: Record<string, unknown> = { hotel_id: resolvedHotelId };
    if (asOfDate) whereClause.as_of_date = asOfDate;

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
            issues: [{ severity: 'INFO', code: 'NO_DATA', message: 'No OTB data found' }],
            stats: { totalRows: 0, failCount: 0, warningCount: 0, infoCount: 1, completeness: 0, dateRange: null, anomalyCount: 0, pickupPatterns: 0 },
            recommendations: ['Nhập dữ liệu đặt phòng để bắt đầu phân tích'],
        };
    }

    // Full invariant checks
    for (const row of otbRows) {
        const stayStr = row.stay_date.toISOString().split('T')[0];
        const asOfStr = row.as_of_date.toISOString().split('T')[0];

        if (row.rooms_otb < 0) {
            issues.push({
                severity: 'FAIL',
                code: 'NEGATIVE_ROOMS',
                message: `rooms_otb = ${row.rooms_otb} (âm — lỗi dữ liệu)`,
                stay_date: stayStr,
                as_of_date: asOfStr,
                value: row.rooms_otb,
            });
            anomalyCount++;
        }

        const revenue = Number(row.revenue_otb);
        if (revenue < 0) {
            issues.push({
                severity: 'FAIL',
                code: 'NEGATIVE_REVENUE',
                message: `revenue_otb = ${revenue.toLocaleString()} (âm — lỗi dữ liệu)`,
                stay_date: stayStr,
                as_of_date: asOfStr,
                value: revenue,
            });
            anomalyCount++;
        }

        if (row.stay_date < row.as_of_date) {
            issues.push({
                severity: 'WARNING',
                code: 'PAST_STAY_DATE',
                message: `stay_date ${stayStr} < as_of_date ${asOfStr} (dữ liệu lịch sử)`,
                stay_date: stayStr,
                as_of_date: asOfStr,
            });
        }

        if (row.rooms_otb > capacity) {
            issues.push({
                severity: 'WARNING',
                code: 'EXCEEDS_CAPACITY',
                message: `rooms_otb ${row.rooms_otb} > capacity ${capacity} (overbooking?)`,
                stay_date: stayStr,
                as_of_date: asOfStr,
                value: row.rooms_otb,
            });
            anomalyCount++;
        }
    }

    // Pickup pattern analysis
    if (!asOfDate) {
        const asOfDates = [...new Set(otbRows.map(r => r.as_of_date.toISOString().split('T')[0]))].sort();
        if (asOfDates.length >= 2) {
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
                            message: `Pickup bất thường |${pickup}| > 30% capacity ngày ${stayStr}`,
                            stay_date: stayStr,
                            as_of_date: latest,
                            value: pickup,
                        });
                        pickupPatterns++;
                    }
                }
            }
        }
    }

    // Completeness check
    const latestAsOf = otbRows[0].as_of_date;
    const latestRows = otbRows.filter(r => r.as_of_date.getTime() === latestAsOf.getTime());
    const stayDatesSet = new Set(latestRows.map(r => r.stay_date.toISOString().split('T')[0]));

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
            message: `Chỉ ${completeness}% stay_dates có dữ liệu (${foundDays}/${expectedDays})`,
        });
    }

    // Date range
    const allStayDates = otbRows.map(r => r.stay_date.toISOString().split('T')[0]).sort();
    const dateRange = allStayDates.length > 0
        ? { from: allStayDates[0], to: allStayDates[allStayDates.length - 1] }
        : null;

    // Summary
    const failCount = issues.filter(i => i.severity === 'FAIL').length;
    const warningCount = issues.filter(i => i.severity === 'WARNING').length;
    const infoCount = issues.filter(i => i.severity === 'INFO').length;

    // Recommendations
    const recommendations: string[] = [];
    if (failCount > 0) {
        recommendations.push('Sửa lỗi dữ liệu âm trước khi sử dụng phân tích');
    }
    if (completeness < 80) {
        recommendations.push('Bổ sung thêm dữ liệu cho các ngày còn thiếu');
    }
    if (pickupPatterns > 3) {
        recommendations.push('Kiểm tra lại các ngày có pickup bất thường');
    }
    if (anomalyCount === 0 && completeness >= 80) {
        recommendations.push('Dữ liệu đạt chuẩn! Sẵn sàng cho phân tích và dự báo');
    }

    return {
        valid: failCount === 0,
        issues: issues.slice(0, 100),
        stats: {
            totalRows: otbRows.length,
            failCount,
            warningCount,
            infoCount,
            completeness,
            dateRange,
            anomalyCount,
            pickupPatterns,
        },
        recommendations,
    };
}

// ─── Legacy wrapper (for backward compatibility) ────────────────────
export interface ValidationResult {
    valid: boolean;
    issues: ValidationIssue[];
    stats: {
        totalRows: number;
        failCount: number;
        warningCount: number;
        infoCount: number;
        completeness: number;
        dateRange: { from: string; to: string } | null;
    };
}

export async function validateOTBData(
    hotelId?: string,
    asOfDate?: Date
): Promise<ValidationResult> {
    const result = await auditReport(hotelId, asOfDate);
    return {
        valid: result.valid,
        issues: result.issues,
        stats: {
            totalRows: result.stats.totalRows,
            failCount: result.stats.failCount,
            warningCount: result.stats.warningCount,
            infoCount: result.stats.infoCount,
            completeness: result.stats.completeness,
            dateRange: result.stats.dateRange,
        },
    };
}
