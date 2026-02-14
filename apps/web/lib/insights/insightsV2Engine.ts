/**
 * InsightsPanel V2 Engine — Server-side computation
 * Spec: insights-v2-spec.md v1.2-final
 *
 * KEY INVARIANTS (from spec §11):
 * - pickup_net_tX = from FeaturesDaily (OTB diff, ALREADY NET)
 * - pickup_gross_7d / cancel_7d = from ReservationsRaw (GROSS)
 * - ⛔ NEVER: pickup_net_t7 - cancel_7d (double-subtract)
 * - Key scope: hotel-level (hotel_id, stay_date), NO room_code
 * - Pricing hint: compare TWO PricingDecision records over time
 */

// ── Types ──────────────────────────────────────────────────────────
// Confidence
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ConfidenceDimensions {
    pickup: ConfidenceLevel;
    forecast: ConfidenceLevel;
    segment: ConfidenceLevel;
}

// Per-card confidence mapping (spec §3)
export type InsightType =
    | 'top3'
    | 'compression_danger'
    | 'compression_hot'
    | 'revenue_opportunity'
    | 'pace_stly'
    | 'pickup_acceleration'
    | 'cancel_tier1'
    | 'cancel_tier2'
    | 'segment_mix';

// Insight card output
export interface InsightCard {
    type: InsightType;
    severity: 'danger' | 'hot' | 'info' | 'warning' | 'success';
    title: string;
    what: string;
    soWhat: string;
    doThis: string;
    impact: string;
    confidence: ConfidenceLevel;
    stayDates?: string[];
    score?: number;
    reasons?: string[];
    pricingHint?: string;
}

// Input data types
export interface DayData {
    stayDate: Date;
    roomsOtb: number;
    revenueOtb: number;
    // FeaturesDaily
    pickupNetT3: number | null;
    pickupNetT7: number | null;
    paceVsLy: number | null;
    remainingSupply: number | null;
    revenueOtbFeature: number | null;
    stlyRevenueOtb: number | null;
    // DemandForecast
    forecastDemand: number | null;
    // PriceRecommendations
    recommendedPrice: number | null;
    expectedRevenue: number | null;
    upliftPct: number | null;
    currentPrice: number | null;
}

export interface CancelData {
    cancelRate30d: number;       // ratio
    pickupGross7d: number;      // from ReservationsRaw
    cancel7d: number;           // from ReservationsRaw
    topCancelSegment: string | null;
}

export interface SegmentData {
    segmentName: string;
    roomCount: number;
    pct: number;
}

export interface PricingHintData {
    stayDate: Date;
    latestFinalPrice: number;
    prevFinalPrice: number;
    latestDecidedAt: Date;
}

export interface InsightsV2Input {
    hotelCapacity: number;
    days: DayData[];               // Per-day data (next 7-30d)
    cancelData: CancelData | null;
    segments: SegmentData[];       // For segment mix
    pricingHints: PricingHintData[]; // For pricing change detection
    confidenceDims: ConfidenceDimensions;
    // Configurable parameters (spec §8)
    config: InsightsConfig;
}

export interface InsightsConfig {
    floorOcc: number;         // default 0.50
    hotOcc: number;           // default 0.85
    paceGapThreshold: number; // default -15
    accelCap: number;         // default 2.0
    cLow: number;             // default 0.30
    cHigh: number;            // default 0.95
    uLow: number;             // default 0.00
    uHigh: number;            // default 0.25
    scoringWeights: [number, number, number]; // [C, A, U] default [0.45, 0.25, 0.30]
    commissionRange: [number, number]; // default [0.15, 0.18]
    walkCostPerGuest: number; // default 500000
    oversellEnabled: boolean; // default false
    eps: number;              // default 0.1
}

export const DEFAULT_CONFIG: InsightsConfig = {
    floorOcc: 0.50,
    hotOcc: 0.85,
    paceGapThreshold: -15,
    accelCap: 2.0,
    cLow: 0.30,
    cHigh: 0.95,
    uLow: 0.00,
    uHigh: 0.25,
    scoringWeights: [0.45, 0.25, 0.30],
    commissionRange: [0.15, 0.18],
    walkCostPerGuest: 500000,
    oversellEnabled: false,
    eps: 0.1,
};

// ── Helpers ────────────────────────────────────────────────────────
const nfVND = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 });
const nfPct = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });

function formatVND(n: number): string {
    if (Math.abs(n) >= 1_000_000_000) return `${nf1.format(n / 1_000_000_000)} Tỷ₫`;
    if (Math.abs(n) >= 1_000_000) return `${nfVND.format(n / 1_000_000)}M₫`;
    return `${nfVND.format(n)}₫`;
}

function formatDate(d: Date): string {
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${days[d.getDay()]} ${day}/${month}`;
}

function clamp01(v: number): number {
    return Math.max(0, Math.min(1, v));
}

function getCardConfidence(
    type: InsightType,
    dims: ConfidenceDimensions
): ConfidenceLevel {
    // Spec §3: per-card confidence mapping
    const levelOrder: Record<ConfidenceLevel, number> = { HIGH: 2, MEDIUM: 1, LOW: 0 };
    const minLevel = (...levels: ConfidenceLevel[]): ConfidenceLevel => {
        const min = Math.min(...levels.map(l => levelOrder[l]));
        return min === 0 ? 'LOW' : min === 1 ? 'MEDIUM' : 'HIGH';
    };

    switch (type) {
        case 'top3':
        case 'compression_danger':
        case 'compression_hot':
        case 'revenue_opportunity':
        case 'pace_stly':
            return minLevel(dims.pickup, dims.forecast);
        case 'segment_mix':
            return dims.segment;
        case 'cancel_tier1':
        case 'cancel_tier2':
            return minLevel(dims.pickup, dims.segment);
        case 'pickup_acceleration':
            return dims.pickup;
        default:
            return minLevel(dims.pickup, dims.forecast);
    }
}

const kzMap: Record<ConfidenceLevel, number> = { LOW: 0.4, MEDIUM: 0.7, HIGH: 1.0 };

// ── P0-2: Compression Dates ───────────────────────────────────────
function generateCompressionInsights(
    days7: DayData[],
    capacity: number,
    config: InsightsConfig,
    dims: ConfidenceDimensions,
): InsightCard[] {
    const cards: InsightCard[] = [];

    for (const day of days7) {
        const occ = day.roomsOtb / capacity;
        const remaining = capacity - day.roomsOtb;
        const paceGap = day.paceVsLy;
        const dateStr = formatDate(day.stayDate);

        // DANGER: low occ OR pace far behind STLY
        if (occ < config.floorOcc || (paceGap != null && paceGap < config.paceGapThreshold)) {
            const occPct = Math.round(occ * 100);
            const rnGap = Math.round(capacity * config.floorOcc - day.roomsOtb);
            const conf = getCardConfidence('compression_danger', dims);
            const adr = day.roomsOtb > 0 ? day.revenueOtb / day.roomsOtb : 0;

            // Impact estimate with guardrail
            const fillTarget = Math.round(rnGap * 0.5);
            const impactEst = fillTarget * adr * 0.92; // assume 8% discount avg

            const reasons: string[] = [];
            if (occ < config.floorOcc) reasons.push(`OCC ${occPct}% < ${Math.round(config.floorOcc * 100)}%`);
            if (paceGap != null && paceGap < config.paceGapThreshold) reasons.push(`pace ▼${Math.round(Math.abs(paceGap))}pt vs STLY`);
            if (day.pickupNetT7 != null && day.pickupNetT7 < 2) reasons.push('pickup T7 yếu');

            cards.push({
                type: 'compression_danger',
                severity: 'danger',
                title: `DANGER — ${dateStr}`,
                what: `Mới đặt ${occPct}% phòng${paceGap != null ? ` — thua cùng kỳ năm trước ${Math.abs(Math.round(paceGap))} điểm` : ''}. Còn thiếu khoảng ${Math.max(0, rnGap)} đêm phòng mới đạt mức an toàn`,
                soWhat: 'Ngày này đang bán chậm hơn mức cần thiết — nếu không kích cầu sớm, phòng sẽ bỏ trống',
                doThis: conf === 'LOW'
                    ? 'Cần thêm dữ liệu để đưa ra khuyến nghị cụ thể — hãy upload thêm booking'
                    : `Giảm giá 8–15% trên các kênh bán chính để thu hút thêm booking`,
                impact: conf === 'LOW'
                    ? 'Chưa đủ dữ liệu để ước tính'
                    : `Nếu lấp được 50% phòng đang thiếu → thu thêm khoảng ${formatVND(impactEst)}`,
                confidence: conf,
                stayDates: [day.stayDate.toISOString()],
                reasons,
            });
        }
        // HOT: high occ OR low remaining
        else if (occ > config.hotOcc || remaining < capacity * 0.5) {
            const occPct = Math.round(occ * 100);
            const conf = getCardConfidence('compression_hot', dims);
            const adr = day.roomsOtb > 0 ? day.revenueOtb / day.roomsOtb : 0;
            const uplift = day.upliftPct ?? 0.10;

            const impactEst = remaining * adr * uplift;
            const accelBonus = (day.pickupNetT3 != null && day.pickupNetT7 != null && day.pickupNetT7 > 0)
                ? day.pickupNetT3 / Math.max(day.pickupNetT7, config.eps)
                : null;

            const reasons: string[] = [`OCC ${occPct}%`, `Còn ${remaining} RN`];
            if (day.pickupNetT7 != null) reasons.push(`pickup +${Math.round(day.pickupNetT7)}/ngày`);
            if (accelBonus != null && accelBonus > 1.3) reasons.push('pickup đang tăng tốc');

            cards.push({
                type: 'compression_hot',
                severity: 'hot',
                title: `HOT — ${dateStr}`,
                what: `Đã đặt ${occPct}% phòng, chỉ còn ${remaining} phòng trống${day.pickupNetT7 != null ? `. Đang nhận thêm khoảng ${Math.round(day.pickupNetT7)} booking mỗi ngày` : ''}`,
                soWhat: 'Nhu cầu cao hơn số phòng còn lại — đây là cơ hội tốt để tăng giá bán',
                doThis: conf === 'LOW'
                    ? 'Cần thêm dữ liệu để đưa ra khuyến nghị cụ thể — hãy upload thêm booking'
                    : `Tăng giá 10–20%, ưu tiên bán qua kênh ít phí hoa hồng (website, đặt trực tiếp)`,
                impact: conf === 'LOW'
                    ? 'Chưa đủ dữ liệu để ước tính'
                    : `Nếu tăng giá ${Math.round(uplift * 100)}% cho phòng còn lại → thu thêm khoảng ${formatVND(impactEst)}`,
                confidence: conf,
                stayDates: [day.stayDate.toISOString()],
                reasons,
            });
        }
    }

    return cards;
}

// ── P0-3: Revenue Opportunity ─────────────────────────────────────
function generateRevenueOpportunity(
    days30: DayData[],
    capacity: number,
    dims: ConfidenceDimensions,
): InsightCard | null {
    const conf = getCardConfidence('revenue_opportunity', dims);
    const totalRemaining = days30.reduce((s, d) => s + Math.max(0, capacity - d.roomsOtb), 0);

    if (totalRemaining === 0) return null;

    // Use PriceRec aggregate when available, fallback to ADR × remaining
    const hasRecs = days30.some(d => d.expectedRevenue != null);
    let revenueEstimate: number;
    let upliftTotal: number;
    let impactStr: string;

    if (hasRecs && conf !== 'LOW') {
        revenueEstimate = days30.reduce((s, d) => s + (d.expectedRevenue ?? 0), 0);
        const baseline = days30.reduce((s, d) => {
            const rem = Math.max(0, capacity - d.roomsOtb);
            const curPrice = d.currentPrice ?? (d.roomsOtb > 0 ? d.revenueOtb / d.roomsOtb : 0);
            return s + rem * curPrice;
        }, 0);
        upliftTotal = revenueEstimate - baseline;
        const upliftPct = baseline > 0 ? (upliftTotal / baseline * 100) : 0;
        impactStr = `Uplift +${nf1.format(upliftPct)}% (~+${formatVND(upliftTotal)}) nếu áp dụng PriceRec`;
    } else {
        // Fallback: remaining × ADR
        const avgAdr = days30.reduce((s, d) => {
            return s + (d.roomsOtb > 0 ? d.revenueOtb / d.roomsOtb : 0);
        }, 0) / Math.max(days30.length, 1);
        revenueEstimate = totalRemaining * avgAdr;
        upliftTotal = 0;
        impactStr = conf === 'LOW'
            ? `~${formatVND(revenueEstimate)} (ước tính sơ — range rộng)`
            : `~${formatVND(revenueEstimate)} (dựa ADR hiện tại)`;
    }

    // Count days without forecast
    const noForecastDays = days30.filter(d => d.forecastDemand == null).length;

    // GM-friendly impact string
    let gmImpact: string;
    if (hasRecs && conf !== 'LOW') {
        gmImpact = `Nếu áp dụng giá khuyến nghị, doanh thu tăng thêm khoảng ${formatVND(upliftTotal)} (+${nf1.format(upliftTotal > 0 && revenueEstimate > 0 ? (upliftTotal / (revenueEstimate - upliftTotal) * 100) : 0)}%)`;
    } else {
        gmImpact = conf === 'LOW'
            ? `Ước tính sơ bộ khoảng ${formatVND(revenueEstimate)} — cần thêm dữ liệu để chính xác hơn`
            : `Nếu bán hết phòng trống với giá trung bình hiện tại → thu thêm khoảng ${formatVND(revenueEstimate)}`;
    }

    return {
        type: 'revenue_opportunity',
        severity: 'info',
        title: 'Doanh thu tiềm năng — 30 ngày tới',
        what: `Trong 30 ngày tới, khách sạn còn ${nfVND.format(totalRemaining)} đêm phòng chưa có ai đặt`,
        soWhat: noForecastDays > 0
            ? `Có ${noForecastDays} ngày hệ thống chưa tính được dự báo nhu cầu — cần thêm dữ liệu`
            : 'Hệ thống đã tính được dự báo nhu cầu cho toàn bộ 30 ngày — đủ thông tin để ra quyết định giá',
        doThis: conf === 'LOW'
            ? 'Hãy upload thêm dữ liệu booking để hệ thống đưa ra khuyến nghị chi tiết hơn'
            : noForecastDays > 0
                ? `Tập trung vào ${nfVND.format(noForecastDays)} ngày chưa có dự báo — đẩy mạnh bán qua website và khách hàng thân thiết`
                : `Vào tab Giá đề xuất, chọn những ngày có giá khuyến nghị tăng hơn 5% so với hiện tại → duyệt và áp dụng`,
        impact: gmImpact,
        confidence: conf,
    };
}

// ── P0-4: Pace vs STLY + Volume/Rate ─────────────────────────────
function generatePaceInsight(
    days30: DayData[],
    capacity: number,
    dims: ConfidenceDimensions,
): InsightCard | null {
    const conf = getCardConfidence('pace_stly', dims);

    // Need STLY data to compute
    const daysWithStly = days30.filter(d => d.paceVsLy != null && d.stlyRevenueOtb != null);
    if (daysWithStly.length < 5) return null;

    const totalRN = days30.reduce((s, d) => s + d.roomsOtb, 0);
    const totalRevenue = days30.reduce((s, d) => s + d.revenueOtb, 0);

    // STLY totals
    const stlyRN = daysWithStly.reduce((s, d) => s + (d.roomsOtb - (d.paceVsLy ?? 0)), 0);
    const stlyRevenue = daysWithStly.reduce((s, d) => s + Number(d.stlyRevenueOtb ?? 0), 0);

    const rnDelta = totalRN - stlyRN;
    const adrCurrent = totalRN > 0 ? totalRevenue / totalRN : 0;
    const adrStly = stlyRN > 0 ? stlyRevenue / stlyRN : 0;

    // Volume vs Rate decomposition (spec §5 P0-4)
    const deltaVolume = (totalRN - stlyRN) * adrStly;
    const deltaRate = (adrCurrent - adrStly) * totalRN;
    const driver = Math.abs(deltaVolume) > Math.abs(deltaRate) ? 'volume' : 'rate';

    const isAhead = rnDelta >= 0;
    const rnPctChange = stlyRN > 0 ? Math.round((rnDelta / stlyRN) * 100) : 0;
    const adrPctChange = adrStly > 0 ? Math.round(((adrCurrent - adrStly) / adrStly) * 100) : 0;

    const revPar = totalRevenue / (capacity * days30.length);
    const stlyRevPar = stlyRevenue / (capacity * daysWithStly.length);
    const revParPct = stlyRevPar > 0 ? Math.round(((revPar - stlyRevPar) / stlyRevPar) * 100) : 0;

    return {
        type: 'pace_stly',
        severity: isAhead ? 'success' : 'warning',
        title: `So với cùng kỳ năm trước: ${isAhead ? 'tốt hơn' : 'kém hơn'} ${Math.abs(rnDelta)} đêm phòng`,
        what: `Đã đặt ${nfVND.format(totalRN)} đêm phòng (năm trước: ${nfVND.format(stlyRN)}, ${rnPctChange >= 0 ? '+' : ''}${rnPctChange}%). Giá trung bình: ${formatVND(adrCurrent)} (năm trước: ${formatVND(adrStly)}, ${adrPctChange >= 0 ? '+' : ''}${adrPctChange}%)`,
        soWhat: `Doanh thu ${isAhead ? 'tăng' : 'giảm'} chủ yếu vì ${driver === 'rate' ? 'giá bán thay đổi' : 'lượng booking thay đổi'}`,
        doThis: conf === 'LOW'
            ? 'Cần thêm dữ liệu để đưa ra khuyến nghị chi tiết — hãy upload thêm booking'
            : isAhead
                ? driver === 'rate'
                    ? 'Giữ nguyên chiến lược giá, đề xuất khách nâng hạng phòng để tăng doanh thu'
                    : 'Lượng đặt tốt, giá có thể tăng thêm — xem xét điều chỉnh giá bán'
                : driver === 'volume'
                    ? `Cần thêm ${Math.abs(rnDelta)} đêm phòng để bằng năm trước — tăng quảng cáo hoặc giảm giá các kênh yếu`
                    : `Giá bán đang thấp hơn năm trước — hạn chế giảm giá sâu, xem lại chiến lược giá`,
        impact: `Doanh thu trên mỗi phòng: ${revParPct >= 0 ? 'tăng' : 'giảm'} ${Math.abs(revParPct)}% so với cùng kỳ`,
        confidence: conf,
    };
}

// ── P1-1: Pickup Acceleration ─────────────────────────────────────
function generatePickupAcceleration(
    days7: DayData[],
    pricingHints: PricingHintData[],
    config: InsightsConfig,
    dims: ConfidenceDimensions,
): InsightCard | null {
    const conf = getCardConfidence('pickup_acceleration', dims);

    // Need sufficient pickup data
    const withPickup = days7.filter(d => d.pickupNetT3 != null && d.pickupNetT7 != null);
    if (withPickup.length < 3) return null;

    const avgT3 = withPickup.reduce((s, d) => s + (d.pickupNetT3 ?? 0), 0) / withPickup.length;
    const avgT7 = withPickup.reduce((s, d) => s + (d.pickupNetT7 ?? 0), 0) / withPickup.length;
    const accel = avgT3 / Math.max(avgT7, config.eps);

    // Skip if stable (spec: else → skip card)
    if (accel >= 0.5 && accel <= 1.5) return null;

    const isAccelerating = accel > 1.5;

    // Pricing hint: check if any stay_date had price change in last 3d
    const pricingHintTag = pricingHints.length > 0
        ? pricingHints.some(h => {
            const delta = Math.abs(h.latestFinalPrice - h.prevFinalPrice) / Math.max(h.prevFinalPrice, 1);
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
            return delta >= 0.05 && h.latestDecidedAt >= threeDaysAgo;
        })
        : false;

    const accelPct = Math.round((accel - 1) * 100);
    const avgAdr = days7.reduce((s, d) => s + (d.roomsOtb > 0 ? d.revenueOtb / d.roomsOtb : 0), 0)
        / Math.max(days7.length, 1);
    const impactRN = Math.abs(avgT3 - avgT7) * 7;
    const impactVND = impactRN * avgAdr;

    return {
        type: 'pickup_acceleration',
        severity: isAccelerating ? 'hot' : 'warning',
        title: isAccelerating ? 'Booking đang TĂNG TỐC' : 'Booking đang GIẢM TỐC',
        what: `3 ngày gần nhất: ${avgT3 >= 0 ? '+' : ''}${nf1.format(avgT3)} phòng/ngày. Trung bình 7 ngày: ${avgT7 >= 0 ? '+' : ''}${nf1.format(avgT7)} phòng/ngày (chênh lệch ${accelPct >= 0 ? '+' : ''}${accelPct}%)`,
        soWhat: isAccelerating
            ? 'Khách đặt phòng nhiều hơn bình thường — có thể do sự kiện, mùa cao điểm, hoặc nhu cầu cuối giờ'
            : 'Lượng đặt phòng đang giảm so với tuần trước — cần theo dõi sát và chuẩn bị phương án',
        doThis: conf === 'LOW'
            ? 'Hãy upload thêm dữ liệu booking để hệ thống đưa ra khuyến nghị cụ thể hơn'
            : isAccelerating
                ? 'Không cần chạy khuyến mãi trong 7 ngày tới — nhu cầu tự nhiên đang tốt'
                : 'Cân nhắc kích cầu — xem lại giá các ngày có ít booking',
        impact: conf === 'LOW'
            ? 'Chưa đủ dữ liệu để ước tính'
            : isAccelerating
                ? `Nếu giữ giá tốt, tránh mất khoảng ${formatVND(impactVND)} doanh thu`
                : `Cần bù khoảng ${formatVND(impactVND)} doanh thu so với tuần trước`,
        confidence: conf,
        pricingHint: pricingHintTag ? 'Lưu ý: có thay đổi giá gần đây, có thể ảnh hưởng đến lượng booking' : undefined,
    };
}

// ── P1-2: Cancel 2-Tier ───────────────────────────────────────────
function generateCancelInsight(
    cancelData: CancelData | null,
    config: InsightsConfig,
    dims: ConfidenceDimensions,
): InsightCard[] {
    if (!cancelData) return [];
    const cards: InsightCard[] = [];

    // Tier 1: ALWAYS show
    const confTier1 = getCardConfidence('cancel_tier1', dims);
    const netPickup = cancelData.pickupGross7d - cancelData.cancel7d;
    const cancelPct = Math.round(cancelData.cancelRate30d * 100 * 10) / 10;

    cards.push({
        type: 'cancel_tier1',
        severity: cancelData.cancelRate30d > 0.15 ? 'warning' : 'info',
        title: `Tỷ lệ hủy phòng 30 ngày: ${cancelPct}%`,
        what: `Tuần qua: nhận ${cancelData.pickupGross7d} booking mới, bị hủy ${cancelData.cancel7d} → thực tế tăng ${netPickup} đêm phòng${cancelData.topCancelSegment ? `. Kênh hủy nhiều nhất: ${cancelData.topCancelSegment}` : ''}`,
        soWhat: cancelData.cancelRate30d > 0.15
            ? 'Tỷ lệ hủy đang cao — đang mất đáng kể doanh thu mỗi tuần'
            : 'Tỷ lệ hủy ở mức bình thường — tiếp tục theo dõi',
        doThis: confTier1 === 'LOW'
            ? 'Cần bổ sung dữ liệu kênh bán để phân tích nguyên nhân hủy chi tiết hơn'
            : cancelData.cancelRate30d > 0.15
                ? 'Xem lại chính sách hủy phòng — cân nhắc yêu cầu đặt cọc hoặc phí hủy phòng'
                : 'Chưa cần hành động — tiếp tục theo dõi hàng tuần',
        impact: `Mỗi tuần mất ${cancelData.cancel7d} đêm phòng vì bị hủy`,
        confidence: confTier1,
    });

    // Tier 2: Oversell suggestion — only if ALL conditions met
    const confTier2 = getCardConfidence('cancel_tier2', dims);
    if (confTier2 === 'HIGH' && config.oversellEnabled) {
        const recoverRN = Math.round(cancelData.cancel7d * 4 * 0.8); // monthly estimate
        const recoverVND = recoverRN * config.walkCostPerGuest * 0.5; // conservative

        cards.push({
            type: 'cancel_tier2',
            severity: 'info',
            title: 'Cơ hội: Bán vượt công suất',
            what: `Vì tỷ lệ hủy ${cancelPct}%, có thể nhận thêm 5–8% booking cho những ngày đã đặt trên 80% phòng`,
            soWhat: 'Tận dụng xu hướng hủy phòng để tối ưu doanh thu — rủi ro khách bị chuyển phòng rất thấp',
            doThis: `Cho phép nhận thêm 5–8% booking vượt công suất vào những ngày đã đặt trên 80% phòng`,
            impact: `Thu hồi được khoảng ${nfVND.format(recoverRN)} đêm phòng/tháng = +${formatVND(recoverVND)}. Chi phí rủi ro nếu phải chuyển khách: ${formatVND(config.walkCostPerGuest)}/khách`,
            confidence: 'MEDIUM',
        });
    }

    return cards;
}

// ── P1-3: Segment Mix ─────────────────────────────────────────────
function generateSegmentMix(
    segments: SegmentData[],
    days30: DayData[],
    config: InsightsConfig,
    dims: ConfidenceDimensions,
): InsightCard | null {
    const conf = getCardConfidence('segment_mix', dims);
    if (segments.length === 0) return null;

    const totalRooms = segments.reduce((s, seg) => s + seg.roomCount, 0);
    if (totalRooms === 0) return null;

    // Detect OTA-heavy mix
    const otaSegments = segments.filter(s =>
        /ota|booking\.com|agoda|expedia|traveloka/i.test(s.segmentName)
    );
    const otaRooms = otaSegments.reduce((s, seg) => s + seg.roomCount, 0);
    const otaPct = otaRooms / totalRooms;

    if (otaPct <= 0.55) return null; // Not OTA-heavy, skip

    const avgAdr = days30.reduce((s, d) => s + (d.roomsOtb > 0 ? d.revenueOtb / d.roomsOtb : 0), 0)
        / Math.max(days30.length, 1);
    const shiftPct = 0.10; // 10% shift target
    const avgCommission = (config.commissionRange[0] + config.commissionRange[1]) / 2;
    const leakageSaved = otaRooms * shiftPct * avgAdr * avgCommission;
    const annualSaved = leakageSaved * 12;

    // Top segments breakdown
    const topSegments = [...segments].sort((a, b) => b.pct - a.pct).slice(0, 4);
    const segmentBreakdown = topSegments.map(s => `${s.segmentName} ${Math.round(s.pct * 100)}%`).join(', ');

    return {
        type: 'segment_mix',
        severity: 'info',
        title: `${Math.round(otaPct * 100)}% booking đến từ kênh OTA (Booking.com, Agoda...)`,
        what: `Phân bổ kênh bán: ${segmentBreakdown}`,
        soWhat: 'Đang trả nhiều phí hoa hồng cho OTA — có cơ hội chuyển khách sang đặt trực tiếp để giảm chi phí',
        doThis: conf === 'LOW'
            ? 'Cần bổ sung dữ liệu kênh bán để phân tích chính xác hơn'
            : 'Đảm bảo giá website luôn tốt nhất + chạy ưu đãi cho khách đặt trực tiếp và khách hàng thân thiết',
        impact: conf === 'LOW'
            ? 'Chưa đủ dữ liệu kênh bán để ước tính'
            : `Nếu chuyển được 10% booking từ OTA sang đặt trực tiếp → tiết kiệm khoảng ${formatVND(annualSaved)}/năm tiền hoa hồng`,
        confidence: conf,
    };
}

// ── P0-1: Top 3 Actions Scoring ───────────────────────────────────
function scoreAndRankTop3(
    allCards: InsightCard[],
    days7: DayData[],
    capacity: number,
    config: InsightsConfig,
    dims: ConfidenceDimensions,
): InsightCard[] {
    // Score each day's compression insights based on spec formula
    const scoredCards = allCards
        .filter(c => c.type === 'compression_danger' || c.type === 'compression_hot')
        .map(card => {
            const stayDate = card.stayDates?.[0];
            if (!stayDate) return { ...card, score: 0 };

            const day = days7.find(d => d.stayDate.toISOString() === stayDate);
            if (!day) return { ...card, score: 0 };

            const occ = day.roomsOtb / capacity;
            const accel = (day.pickupNetT3 != null && day.pickupNetT7 != null)
                ? day.pickupNetT3 / Math.max(day.pickupNetT7, config.eps)
                : 1.0;
            const uplift = day.upliftPct ?? 0;
            const kz = kzMap[card.confidence];

            // Normalize (spec §5 P0-1)
            const Cz = clamp01((occ - config.cLow) / (config.cHigh - config.cLow));
            const Az = clamp01((accel - 1.0) / (config.accelCap - 1.0));
            const Uz = card.confidence === 'LOW' ? 0 : clamp01((uplift - config.uLow) / (config.uHigh - config.uLow));

            const [wC, wA, wU] = config.scoringWeights;
            let score = (wC * Cz + wA * Az + wU * Uz) * kz;

            // Bonuses
            if (occ > config.hotOcc || (capacity - day.roomsOtb) < capacity * 0.5) score += 0.05;
            if (occ < 0.45 || (day.paceVsLy != null && day.paceVsLy < config.paceGapThreshold)) score += 0.05;

            return { ...card, score };
        });

    // Sort with tie-break (spec §10)
    scoredCards.sort((a, b) => {
        const scoreDiff = (b.score ?? 0) - (a.score ?? 0);
        if (Math.abs(scoreDiff) >= 0.02) return scoreDiff;

        // Tie-break
        const confA = a.confidence;
        if (confA === 'LOW') {
            // LOW conf: prefer closer dates
            const dateA = a.stayDates?.[0] ?? '';
            const dateB = b.stayDates?.[0] ?? '';
            return dateA.localeCompare(dateB);
        }
        // MED/HIGH: prefer higher impact (score is already a proxy)
        return scoreDiff !== 0 ? scoreDiff : (a.stayDates?.[0] ?? '').localeCompare(b.stayDates?.[0] ?? '');
    });

    return scoredCards.slice(0, 3).map(card => ({
        ...card,
        type: 'top3' as InsightType,
    }));
}

// ── MAIN ENGINE ───────────────────────────────────────────────────
export function generateInsightsV2(input: InsightsV2Input): {
    top3: InsightCard[];
    compression: InsightCard[];
    otherInsights: InsightCard[];
} {
    const { hotelCapacity, days, cancelData, segments, pricingHints, confidenceDims, config } = input;

    if (days.length === 0) {
        return { top3: [], compression: [], otherInsights: [] };
    }

    const days7 = days.filter(d => {
        const diff = (d.stayDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= 7;
    });
    const days30 = days.filter(d => {
        const diff = (d.stayDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= 30;
    });

    // P0-2: Compression dates
    const compressionCards = generateCompressionInsights(days7, hotelCapacity, config, confidenceDims);

    // P0-3: Revenue opportunity
    const revenueCard = generateRevenueOpportunity(days30, hotelCapacity, confidenceDims);

    // P0-4: Pace vs STLY
    const paceCard = generatePaceInsight(days30, hotelCapacity, confidenceDims);

    // P1-1: Pickup acceleration
    const accelCard = generatePickupAcceleration(days7, pricingHints, config, confidenceDims);

    // P1-2: Cancel tiers
    const cancelCards = generateCancelInsight(cancelData, config, confidenceDims);

    // P1-3: Segment mix
    const segmentCard = generateSegmentMix(segments, days30, config, confidenceDims);

    // P0-1: Top 3 Actions (scored from compression dates)
    const top3 = scoreAndRankTop3(compressionCards, days7, hotelCapacity, config, confidenceDims);

    // Other insights (non-top3)
    const otherInsights: InsightCard[] = [];
    if (revenueCard) otherInsights.push(revenueCard);
    if (paceCard) otherInsights.push(paceCard);
    if (accelCard) otherInsights.push(accelCard);
    cancelCards.forEach(c => otherInsights.push(c));
    if (segmentCard) otherInsights.push(segmentCard);

    return { top3, compression: compressionCards, otherInsights };
}

// ── Confidence Calculator ─────────────────────────────────────────
export function calculateConfidence(
    pickupHistoryCount: number,
    forecastSource: string,
    segmentMappedPct: number, // 0-1
): ConfidenceDimensions {
    // Pickup
    let pickup: ConfidenceLevel;
    if (pickupHistoryCount >= 5) pickup = 'HIGH';
    else if (pickupHistoryCount >= 2) pickup = 'MEDIUM';
    else pickup = 'LOW';

    // Forecast
    let forecast: ConfidenceLevel;
    if (forecastSource === 'statistical' || forecastSource === 'computed') forecast = 'HIGH';
    else if (forecastSource === 'heuristic' || forecastSource === 'single' || forecastSource === 'fallback') forecast = 'MEDIUM';
    else forecast = 'LOW';

    // Segment
    let segment: ConfidenceLevel;
    if (segmentMappedPct >= 0.80) segment = 'HIGH';
    else if (segmentMappedPct >= 0.50) segment = 'MEDIUM';
    else segment = 'LOW';

    return { pickup, forecast, segment };
}
