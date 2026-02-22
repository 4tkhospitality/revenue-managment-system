// ─── Shared Analytics Types ──────────────────────────────────
export interface AnalyticsRow {
    stay_date: string;
    dow: number | null;
    is_weekend: boolean | null;
    rooms_otb: number;
    revenue_otb: number;
    stly_rooms_otb: number | null;
    stly_revenue_otb: number | null;
    pickup_t30: number | null;
    pickup_t15: number | null;
    pickup_t7: number | null;
    pickup_t5: number | null;
    pickup_t3: number | null;
    pace_vs_ly: number | null;
    remaining_supply: number | null;
    stly_is_approx: boolean | null;
    dod_delta: number | null;
    dod_delta_rev: number | null;
    // Cancel Forecast (Phase 03)
    expected_cxl: number | null;
    net_remaining: number | null;
    cxl_rate_used: number | null;
    cxl_confidence: string | null;
}

export interface EnrichedRow extends AnalyticsRow {
    adr: number | null;     // revenue_otb / rooms_otb — null when rooms_otb === 0 (D9)
    occ_pct: number;        // (rooms_otb / capacity) × 100
    rev_par: number;        // revenue_otb / capacity
}

export interface DateToWatch {
    stay_date: string;
    dow: string;
    score: number;
    category: 'under_pace' | 'tight_supply' | 'mixed';
    impact: string;
    rooms_otb: number;
    revenue_otb: number;
    vs_ly: number | null;
    remaining_supply: number;
}

export interface AnalyticsKpi {
    occ7: number;
    occ14: number;
    occ30: number;
    pace7: number | null;
    pace30: number | null;
    totalPickup7d: number;
    totalPickup1d: number;
    netPickupDOD: number | null;
    topChangeDay: { stay_date: string; delta: number } | null;
}

export interface AnalyticsQuality {
    totalRows: number;
    withT7: number;
    withSTLY: number;
    approxSTLY: number;
    completeness: number;
    stlyCoverage: number;
    columnAvailability: {
        hasT30: boolean;
        hasT15: boolean;
        hasT7: boolean;
        hasT5: boolean;
        hasT3: boolean;
    };
}

export interface AnalyticsData {
    hotelName: string;
    capacity: number;
    asOfDate: string;
    asOfDates: string[];
    rows: AnalyticsRow[];
    kpi: AnalyticsKpi;
    quality: AnalyticsQuality;
    datesToWatch: DateToWatch[];
    // OTB-only fallback warning
    warning?: 'NO_FEATURES_FOR_DATE';
    hint?: string;
    latestAvailable?: string | null;
}

export type ViewMode = 'rooms' | 'revenue';

// ─── Helper: enrich rows with computed metrics ──────────────
export function enrichRows(rows: AnalyticsRow[], capacity: number): EnrichedRow[] {
    return rows.map(r => ({
        ...r,
        adr: r.rooms_otb > 0 ? r.revenue_otb / r.rooms_otb : null,       // D9: N/A when 0 rooms
        occ_pct: capacity > 0 ? (r.rooms_otb / capacity) * 100 : 0,
        rev_par: capacity > 0 ? r.revenue_otb / capacity : 0,
    }));
}

// ─── Format helpers ─────────────────────────────────────────
export function formatRevenue(val: number): string {
    if (Math.abs(val) >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
    if (Math.abs(val) >= 1_000) return `${Math.round(val / 1_000)}k`;
    return String(Math.round(val));
}

export function formatCurrency(val: number): string {
    return new Intl.NumberFormat('vi-VN').format(Math.round(val));
}

export const DOW_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

// ─── KPI Tooltip definitions ────────────────────────────────
export const KPI_TOOLTIPS: Record<string, string> = {
    'Occ 7d': 'Average occupancy for next 7 upcoming stay dates\n= Σ(rooms_otb) / (7 × capacity) × 100',
    'Occ 14d': 'Average occupancy for next 14 stay dates',
    'Occ 30d': 'Average occupancy for next 30 stay dates',
    'Pace 7d': 'Compare current OTB total vs same time last year\nfor next 7 stay dates. Positive = ahead of pace.',
    'Pace 30d': 'Compare current OTB total vs same time last year\nfor next 30 stay dates.',
    'Pickup 7d': 'Total additional rooms booked (net) in last 7 days.\nIncludes new bookings − cancellations.',
    'Avg ADR': 'Average room rate (Average Daily Rate)\n= Total Revenue / Total Rooms (7d ahead)',
    'Net DOD': 'OTB change from yesterday to today\nfor entire currently displayed horizon.',
};
