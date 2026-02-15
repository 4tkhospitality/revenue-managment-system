/**
 * Phase 01: Cancel Forecast Engine — Unit Tests
 * 
 * Tests pure functions: daysToLeadBucket, smoothRate, clampRate,
 * getConfidence, getSeasonLabel, getExpectedCancelRooms.
 * 
 * Run: npx tsx tests/cancel-forecast.test.ts
 */

import {
    daysToLeadBucket,
    smoothRate,
    clampRate,
    getConfidence,
    getSeasonLabel,
    getExpectedCancelRooms,
    seasonCodeToLabel,
    type CancelRateBucket,
    type SeasonDateRange,
} from '../lib/engine/cancelForecast';

// ─── Test Helpers ────────────────────────────────────────────────────────────

let pass = 0;
let fail = 0;

function test(name: string, fn: () => void) {
    try {
        fn();
        console.log(`✅ PASS: ${name}`);
        pass++;
    } catch (e: any) {
        console.log(`❌ FAIL: ${name}`);
        console.log(`   ${e.message}`);
        fail++;
        process.exitCode = 1;
    }
}

function assertEqual<T>(actual: T, expected: T, msg: string) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`${msg}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
    }
}

function assertApprox(actual: number, expected: number, epsilon: number, msg: string) {
    if (Math.abs(actual - expected) > epsilon) {
        throw new Error(`${msg}\nExpected: ~${expected} (±${epsilon})\nActual: ${actual}`);
    }
}

function assertInRange(actual: number, min: number, max: number, msg: string) {
    if (actual < min || actual > max) {
        throw new Error(`${msg}\nExpected: [${min}, ${max}]\nActual: ${actual}`);
    }
}

// ─── Test Data ───────────────────────────────────────────────────────────────

const SEASONS: SeasonDateRange[] = [
    { code: 'HOLIDAY', label: 'peak', start: '12-20', end: '01-10', priority: 3 },
    { code: 'HIGH', label: 'shoulder', start: '06-01', end: '08-31', priority: 2 },
    { code: 'NORMAL', label: 'off_peak', start: '01-11', end: '05-31', priority: 1 },
];

function makeBucket(overrides: Partial<CancelRateBucket>): CancelRateBucket {
    return {
        hotel_id: 'hotel-1',
        booking_lead_bucket: '0-3d',
        dow: 0,
        season_label: 'default',
        segment: 'ALL',
        cancel_rate: 0.1,
        raw_rate: 0.1,
        total_rooms: 250,
        cancelled_rooms: 25,
        confidence: 'high',
        mapping_version: 'v1',
        ...overrides,
    };
}

function makeDate(dateStr: string): Date {
    return new Date(dateStr + 'T00:00:00Z');
}

// ─── Test Suite ──────────────────────────────────────────────────────────────

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🧪 Phase 01: Cancel Forecast Engine Tests');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// ── daysToLeadBucket ────────────────────────────────

console.log('--- daysToLeadBucket ---');

test('0 days → 0-3d', () => {
    assertEqual(daysToLeadBucket(0), '0-3d', 'bucket');
});

test('3 days → 0-3d', () => {
    assertEqual(daysToLeadBucket(3), '0-3d', 'bucket');
});

test('4 days → 4-7d', () => {
    assertEqual(daysToLeadBucket(4), '4-7d', 'bucket');
});

test('7 days → 4-7d', () => {
    assertEqual(daysToLeadBucket(7), '4-7d', 'bucket');
});

test('14 days → 8-14d', () => {
    assertEqual(daysToLeadBucket(14), '8-14d', 'bucket');
});

test('30 days → 15-30d', () => {
    assertEqual(daysToLeadBucket(30), '15-30d', 'bucket');
});

test('60 days → 31-60d', () => {
    assertEqual(daysToLeadBucket(60), '31-60d', 'bucket');
});

test('90 days → 61d+', () => {
    assertEqual(daysToLeadBucket(90), '61d+', 'bucket');
});

// ── smoothRate ──────────────────────────────────────

console.log('\n--- smoothRate (Bayesian) ---');

test('Empty bucket → uses parent rate', () => {
    const result = smoothRate(0, 0, 0.2);
    assertApprox(result, 0.2, 0.01, 'Should return parent rate when sample=0');
});

test('Large sample dominates parent', () => {
    const result = smoothRate(0.3, 1000, 0.1); // 1000 rooms at 30%, parent 10%
    assertApprox(result, 0.296, 0.01, 'Large sample should dominate');
});

test('Small sample blends toward parent', () => {
    const result = smoothRate(0.5, 5, 0.1); // 5 rooms at 50%, parent 10%
    // blended = (0.5*5 + 0.1*20) / (5+20) = (2.5 + 2) / 25 = 0.18
    assertApprox(result, 0.18, 0.01, 'Small sample should blend toward parent');
});

test('Rate clamped at 0.8', () => {
    const result = smoothRate(0.95, 100, 0.9);
    assertInRange(result, 0, 0.8, 'Should be clamped at 0.8 max');
});

test('Rate clamped at 0', () => {
    const result = smoothRate(-0.1, 100, -0.05);
    assertInRange(result, 0, 0.8, 'Should be clamped at 0 min');
});

// ── clampRate ───────────────────────────────────────

console.log('\n--- clampRate ---');

test('Normal rate passes through', () => {
    assertEqual(clampRate(0.3), 0.3, 'Should pass through');
});

test('Negative clamped to 0', () => {
    assertEqual(clampRate(-0.1), 0, 'Should clamp to 0');
});

test('Above 0.8 clamped', () => {
    assertEqual(clampRate(0.9), 0.8, 'Should clamp to 0.8');
});

// ── getConfidence ───────────────────────────────────

console.log('\n--- getConfidence ---');

test('200+ rooms → high', () => {
    assertEqual(getConfidence(200), 'high', 'Should be high');
});

test('500 rooms → high', () => {
    assertEqual(getConfidence(500), 'high', 'Should be high');
});

test('100 rooms → medium', () => {
    assertEqual(getConfidence(100), 'medium', 'Should be medium');
});

test('50 rooms → medium', () => {
    assertEqual(getConfidence(50), 'medium', 'Should be medium');
});

test('49 rooms → low', () => {
    assertEqual(getConfidence(49), 'low', 'Should be low');
});

test('0 rooms → low', () => {
    assertEqual(getConfidence(0), 'low', 'Should be low');
});

// ── getSeasonLabel ──────────────────────────────────

console.log('\n--- getSeasonLabel ---');

test('Dec 25 → peak (holiday)', () => {
    assertEqual(getSeasonLabel(makeDate('2026-12-25'), SEASONS), 'peak', 'Should be peak');
});

test('Jan 5 → peak (holiday wrap-around)', () => {
    assertEqual(getSeasonLabel(makeDate('2026-01-05'), SEASONS), 'peak', 'Should be peak (wrap)');
});

test('Jul 15 → shoulder (high season)', () => {
    assertEqual(getSeasonLabel(makeDate('2026-07-15'), SEASONS), 'shoulder', 'Should be shoulder');
});

test('Mar 15 → off_peak (normal)', () => {
    assertEqual(getSeasonLabel(makeDate('2026-03-15'), SEASONS), 'off_peak', 'Should be off_peak');
});

test('No seasons → default', () => {
    assertEqual(getSeasonLabel(makeDate('2026-06-01'), []), 'default', 'Should be default');
});

// ── seasonCodeToLabel ───────────────────────────────

console.log('\n--- seasonCodeToLabel ---');

test('HOLIDAY → peak', () => {
    assertEqual(seasonCodeToLabel('HOLIDAY'), 'peak', 'Should map');
});

test('HIGH → shoulder', () => {
    assertEqual(seasonCodeToLabel('HIGH'), 'shoulder', 'Should map');
});

test('NORMAL → off_peak', () => {
    assertEqual(seasonCodeToLabel('NORMAL'), 'off_peak', 'Should map');
});

test('unknown → off_peak (default)', () => {
    assertEqual(seasonCodeToLabel('SPECIAL'), 'off_peak', 'Should default');
});

// ── getExpectedCancelRooms ──────────────────────────

console.log('\n--- getExpectedCancelRooms ---');

test('Zero rooms → 0 expected cancel', () => {
    const result = getExpectedCancelRooms(
        makeDate('2026-06-15'), makeDate('2026-06-10'),
        0, 'OTA', [], []
    );
    assertEqual(result.expectedCxl, 0, 'Should be 0');
    assertEqual(result.fallback_level, 0, 'Level 0 for zero rooms');
});

test('Exact bucket match (level 0)', () => {
    const stats = [
        makeBucket({
            booking_lead_bucket: '4-7d',
            dow: 1, // Monday
            season_label: 'shoulder',
            segment: 'OTA',
            cancel_rate: 0.25,
            total_rooms: 300,
        }),
    ];
    // stayDate=Mon Jun 15, asOfDate=Jun 10 → 5 days → bucket '4-7d', dow=1
    const result = getExpectedCancelRooms(
        makeDate('2026-06-15'), // Monday
        makeDate('2026-06-10'),
        100, 'OTA', stats, SEASONS
    );
    assertEqual(result.expectedCxl, 25, 'Should be 25 rooms');
    assertEqual(result.rate, 0.25, 'Rate should be 0.25');
    assertEqual(result.fallback_level, 0, 'Level 0 = exact match');
});

test('Fallback to ALL segment (level 1)', () => {
    const stats = [
        makeBucket({
            booking_lead_bucket: '4-7d',
            dow: 1,
            season_label: 'shoulder',
            segment: 'ALL',
            cancel_rate: 0.20,
        }),
    ];
    const result = getExpectedCancelRooms(
        makeDate('2026-06-15'),
        makeDate('2026-06-10'),
        100, 'OTA', stats, SEASONS
    );
    assertEqual(result.expectedCxl, 20, 'Should be 20 rooms (ALL segment)');
    assertEqual(result.fallback_level, 1, 'Level 1 = ALL segment');
});

test('Fallback to default season (level 2)', () => {
    const stats = [
        makeBucket({
            booking_lead_bucket: '4-7d',
            dow: 1,
            season_label: 'default',
            segment: 'OTA',
            cancel_rate: 0.18,
        }),
    ];
    const result = getExpectedCancelRooms(
        makeDate('2026-06-15'),
        makeDate('2026-06-10'),
        100, 'OTA', stats, SEASONS
    );
    assertEqual(result.expectedCxl, 18, 'Should be 18 rooms');
    assertEqual(result.fallback_level, 2, 'Level 2 = default season');
});

test('Fallback to global average (level 4)', () => {
    const stats = [
        makeBucket({
            booking_lead_bucket: '61d+',
            dow: 5,
            season_label: 'peak',
            segment: 'AGENT',
            cancel_rate: 0.10,
            total_rooms: 500,
            cancelled_rooms: 50,
        }),
    ];
    // No match for this lead/dow/season/segment combo
    const result = getExpectedCancelRooms(
        makeDate('2026-06-15'),
        makeDate('2026-06-10'),
        100, 'OTA', stats, SEASONS
    );
    assertEqual(result.fallback_level, 4, 'Level 4 = global avg');
    assertEqual(result.expectedCxl, 10, 'Global: 50/500 = 10%');
});

test('Hard default when no stats at all (level 5)', () => {
    const result = getExpectedCancelRooms(
        makeDate('2026-06-15'),
        makeDate('2026-06-10'),
        100, 'OTA', [], SEASONS
    );
    assertEqual(result.fallback_level, 5, 'Level 5 = hard default');
    assertEqual(result.rate, 0.15, 'Default rate is 15%');
    assertEqual(result.expectedCxl, 15, 'Should be 15 rooms');
});

test('expected_cxl ∈ [0, rooms_otb] (acceptance test #1)', () => {
    const stats = [
        makeBucket({ cancel_rate: 0.8, booking_lead_bucket: '0-3d', dow: 0 }),
    ];
    const result = getExpectedCancelRooms(
        makeDate('2026-06-14'), // Sunday
        makeDate('2026-06-14'),
        10, 'ALL', stats, []
    );
    assertInRange(result.expectedCxl, 0, 10, 'expected_cxl bounded by rooms_otb');
});

test('expected_cxl for high cancel rate still bounded', () => {
    const stats = [
        makeBucket({
            cancel_rate: 0.8, // max
            booking_lead_bucket: '0-3d',
            dow: 1,
            season_label: 'shoulder',
            segment: 'OTA',
        }),
    ];
    const result = getExpectedCancelRooms(
        makeDate('2026-06-15'), makeDate('2026-06-14'),
        50, 'OTA', stats, SEASONS
    );
    assertInRange(result.expectedCxl, 0, 50, 'Must not exceed rooms_otb');
    assertEqual(result.expectedCxl, 40, '50 * 0.8 = 40');
});

// ── Acceptance Tests ────────────────────────────────

console.log('\n--- Acceptance Tests (cross-phase invariants) ---');

test('AT#1: expected_cxl ∈ [0, rooms_otb] for various inputs', () => {
    for (const rooms of [0, 1, 5, 50, 200]) {
        const result = getExpectedCancelRooms(
            makeDate('2026-07-01'), makeDate('2026-06-01'),
            rooms, 'OTA', [], SEASONS
        );
        assertInRange(result.expectedCxl, 0, rooms, `AT#1 for rooms=${rooms}`);
    }
});

test('AT#6: Fallback chain terminates (never returns null)', () => {
    // No data, no seasons → should still return a result
    const result = getExpectedCancelRooms(
        makeDate('2026-12-25'), makeDate('2026-12-01'),
        100, 'UNKNOWN', [], []
    );
    if (result.expectedCxl === undefined || result.rate === undefined) {
        throw new Error('Fallback chain returned undefined!');
    }
    assertInRange(result.rate, 0, 0.8, 'Rate should be valid');
});

// ── Summary ─────────────────────────────────────────

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`🎉 ${pass} passed, ${fail} failed (${pass + fail} total)`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
