/**
 * Comprehensive Test Suite — RMS Core Modules
 * 
 * Tests pure utility functions without database/mocking:
 * 1. DateUtils       — parseDate, calcNights, isActiveAt, eachDay
 * 2. Normalize       — normalizeKey, normalizedEquals
 * 3. LadderUtils     — applyLadder, roundPrice
 * 4. Pricing Engine  — calcBarFromNet, calcNetFromBar, formatVND
 * 5. Pricing Validators — validatePromotions, canAddPromotion
 * 6. API Auth Coverage  — structural check
 * 
 * Usage: npx tsx --tsconfig tsconfig.json scripts/test-core-modules.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { DateUtils } from '../lib/date';
import { normalizeKey, normalizedEquals } from '../lib/normalize';
import { LadderUtils, LADDER_STEPS } from '../lib/ladder';
import { calcBarFromNet, calcNetFromBar, formatVND, parseVND } from '../lib/pricing/engine';
import { validatePromotions, canAddPromotion, getMaxDiscountCap } from '../lib/pricing/validators';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ═══════════════════════════════════════════════
// Mini Test Framework
// ═══════════════════════════════════════════════

let totalPassed = 0;
let totalFailed = 0;

function suite(name: string) {
    console.log(`\n── ${name} ──`);
}

function test(name: string, fn: () => void) {
    try {
        fn();
        console.log(`  ✅ ${name}`);
        totalPassed++;
    } catch (e: any) {
        console.log(`  ❌ ${name}`);
        console.log(`     → ${e.message}`);
        totalFailed++;
    }
}

function assert(condition: boolean, msg: string = 'Assertion failed') {
    if (!condition) throw new Error(msg);
}

function assertEqual<T>(actual: T, expected: T, msg?: string) {
    if (actual !== expected) {
        throw new Error(msg || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}

function assertClose(actual: number, expected: number, tolerance: number = 1) {
    if (Math.abs(actual - expected) > tolerance) {
        throw new Error(`Expected ~${expected} ±${tolerance}, got ${actual}`);
    }
}

// ═══════════════════════════════════════════════
console.log('\n🧪 RMS Core Module Tests\n' + '═'.repeat(40));

// ─── 1. DateUtils ───

suite('DateUtils — parseDate');

test('parses valid ISO date', () => {
    const d = DateUtils.parseDate('2025-06-15');
    assert(d !== null);
    assertEqual(d!.getFullYear(), 2025);
});

test('returns null for empty string', () => {
    assertEqual(DateUtils.parseDate(''), null);
});

test('returns null for invalid date', () => {
    assertEqual(DateUtils.parseDate('not-a-date'), null);
});

suite('DateUtils — calcNights');

test('3-night stay', () => {
    assertEqual(DateUtils.calcNights(new Date('2025-06-10'), new Date('2025-06-13')), 3);
});

test('1-night stay', () => {
    assertEqual(DateUtils.calcNights(new Date('2025-06-10'), new Date('2025-06-11')), 1);
});

test('same-day = 0 nights', () => {
    const d = new Date('2025-06-10');
    assertEqual(DateUtils.calcNights(d, d), 0);
});

suite('DateUtils — isActiveAt');

test('booking before asOf, no cancel → ACTIVE', () => {
    assert(DateUtils.isActiveAt(new Date('2025-01-01'), null, new Date('2025-06-15')));
});

test('booking after asOf → INACTIVE', () => {
    assert(!DateUtils.isActiveAt(new Date('2025-07-01'), null, new Date('2025-06-15')));
});

test('cancelled before asOf → INACTIVE', () => {
    assert(!DateUtils.isActiveAt(new Date('2025-01-01'), new Date('2025-06-10'), new Date('2025-06-15')));
});

test('cancelled ON asOf → INACTIVE', () => {
    assert(!DateUtils.isActiveAt(new Date('2025-01-01'), new Date('2025-06-15'), new Date('2025-06-15')));
});

test('cancelled after asOf → ACTIVE', () => {
    assert(DateUtils.isActiveAt(new Date('2025-01-01'), new Date('2025-07-01'), new Date('2025-06-15')));
});

suite('DateUtils — eachDay');

test('iterates 3 days', () => {
    const days = [...DateUtils.eachDay(new Date('2025-06-10'), new Date('2025-06-12'))];
    assertEqual(days.length, 3);
});

test('single day = 1', () => {
    const d = new Date('2025-06-10');
    assertEqual([...DateUtils.eachDay(d, d)].length, 1);
});

// ─── 2. Normalize ───

suite('normalizeKey');

test('uppercase + strips dashes', () => {
    assertEqual(normalizeKey('FO-12345 '), 'FO12345');
});

test('strips underscores/spaces', () => {
    assertEqual(normalizeKey(' abc-DEF_123'), 'ABCDEF123');
});

test('null → null', () => { assertEqual(normalizeKey(null), null); });
test('undefined → null', () => { assertEqual(normalizeKey(undefined), null); });
test('empty → null', () => { assertEqual(normalizeKey(''), null); });

suite('normalizedEquals');

test('same key, different format → true', () => {
    assert(normalizedEquals('FO-12345', 'fo12345'));
});

test('different keys → false', () => {
    assert(!normalizedEquals('FO-12345', 'FO-99999'));
});

test('null vs null → false', () => { assert(!normalizedEquals(null, null)); });

// ─── 3. LadderUtils ───

suite('LadderUtils — applyLadder');

test('generates steps for 1M VND', () => {
    const prices = LadderUtils.applyLadder(1_000_000);
    assert(prices.length > 0);
    assert(prices.length <= LADDER_STEPS.length);
});

test('all positive integers', () => {
    for (const p of LadderUtils.applyLadder(1_000_000)) {
        assert(p > 0 && p === Math.ceil(p));
    }
});

test('prices are unique', () => {
    const prices = LadderUtils.applyLadder(1_000_000);
    assertEqual(new Set(prices).size, prices.length);
});

test('includes base price', () => {
    assert(LadderUtils.applyLadder(1_000_000).includes(1_000_000));
});

test('0 base → empty', () => {
    assertEqual(LadderUtils.applyLadder(0).length, 0);
});

suite('LadderUtils — roundPrice');

test('rounds 1500.5 → 1501', () => {
    assertEqual(LadderUtils.roundPrice(1500.5), 1501);
});

// ─── 4. Pricing Engine ───

suite('Pricing Engine — calcBarFromNet (Progressive)');

test('NET=1M, commission=18%, no discounts', () => {
    const r = calcBarFromNet(1_000_000, 18, [], 'PROGRESSIVE');
    assertClose(r.barRaw, 1_219_512.2, 1);
    assertEqual(r.bar, 1_220_000); // CEIL_1000
});

test('NET=1M, commission=18%, 10% discount', () => {
    const d = [{ id: '1', name: 'T', percent: 10, group: 'ESSENTIAL' as const }];
    const r = calcBarFromNet(1_000_000, 18, d, 'PROGRESSIVE');
    assertEqual(r.bar, 1_356_000);
});

test('commission=100% → error', () => {
    assertEqual(calcBarFromNet(1_000_000, 100, [], 'PROGRESSIVE').bar, 0);
});

suite('Pricing Engine — calcBarFromNet (Additive)');

test('NET=1M, 18% commission, 10%+5% discounts', () => {
    const d = [
        { id: '1', name: 'D1', percent: 10, group: 'ESSENTIAL' as const },
        { id: '2', name: 'D2', percent: 5, group: 'TARGETED' as const },
    ];
    const r = calcBarFromNet(1_000_000, 18, d, 'ADDITIVE');
    assertEqual(r.bar, 1_435_000);
});

test('additive total=100% → error', () => {
    const d = [
        { id: '1', name: 'D1', percent: 50, group: 'ESSENTIAL' as const },
        { id: '2', name: 'D2', percent: 50, group: 'TARGETED' as const },
    ];
    assertEqual(calcBarFromNet(1_000_000, 18, d, 'ADDITIVE').bar, 0);
});

suite('Pricing Engine — Roundtrip NET↔BAR');

test('NET→BAR→NET preserves value (±rounding)', () => {
    const d = [{ id: '1', name: 'T', percent: 10, group: 'ESSENTIAL' as const }];
    const bar = calcBarFromNet(1_000_000, 18, d, 'PROGRESSIVE');
    const net = calcNetFromBar(bar.bar, 18, d, 'PROGRESSIVE');
    assert(net.net >= 1_000_000, `Roundtrip NET ${net.net} >= 1M`);
    assertClose(net.net, 1_000_000, 10_000);
});

suite('Pricing Engine — Rounding Rules');

test('CEIL_1000', () => {
    assertEqual(calcBarFromNet(1_000_000, 18, [], 'PROGRESSIVE', 'CEIL_1000').bar % 1000, 0);
});

test('ROUND_100', () => {
    assertEqual(calcBarFromNet(1_000_000, 18, [], 'PROGRESSIVE', 'ROUND_100').bar % 100, 0);
});

test('NONE preserves raw', () => {
    const r = calcBarFromNet(1_000_000, 18, [], 'PROGRESSIVE', 'NONE');
    assertEqual(r.bar, r.barRaw);
});

suite('Pricing Engine — formatVND / parseVND');

test('roundtrips 1,234,567', () => {
    assertEqual(parseVND(formatVND(1_234_567)), 1_234_567);
});

// ─── 5. Pricing Validators ───

suite('Pricing Validators — validatePromotions');

test('empty + valid commission → valid', () => {
    assert(validatePromotions([], 18).isValid);
});

test('commission=100% → error', () => {
    assert(!validatePromotions([], 100).isValid);
});

test('2× SEASONAL → error', () => {
    const d = [
        { id: '1', name: 'S1', percent: 10, group: 'SEASONAL' as const },
        { id: '2', name: 'S2', percent: 15, group: 'SEASONAL' as const },
    ];
    assert(!validatePromotions(d, 18).isValid);
});

test('1 SEASONAL + 1 ESSENTIAL → valid', () => {
    const d = [
        { id: '1', name: 'S1', percent: 10, group: 'SEASONAL' as const },
        { id: '2', name: 'E1', percent: 5, group: 'ESSENTIAL' as const },
    ];
    assert(validatePromotions(d, 18).isValid);
});

test('Agoda: total>80% → error', () => {
    const d = [
        { id: '1', name: 'D1', percent: 50, group: 'ESSENTIAL' as const },
        { id: '2', name: 'D2', percent: 35, group: 'TARGETED' as const },
    ];
    assert(!validatePromotions(d, 18, 'agoda').isValid);
});

test('Booking: total>80% → valid (no cap)', () => {
    const d = [
        { id: '1', name: 'D1', percent: 50, group: 'ESSENTIAL' as const },
        { id: '2', name: 'D2', percent: 35, group: 'TARGETED' as const },
    ];
    const r = validatePromotions(d, 18, 'booking');
    assertEqual(r.errors.filter(e => e.includes('vượt quá')).length, 0);
});

suite('Pricing Validators — canAddPromotion');

test('add first SEASONAL → valid', () => {
    assert(canAddPromotion([], { id: '1', name: 'S', percent: 10, group: 'SEASONAL' }).isValid);
});

test('add 2nd SEASONAL → error', () => {
    const ex = [{ id: '1', name: 'S1', percent: 10, group: 'SEASONAL' as const }];
    assert(!canAddPromotion(ex, { id: '2', name: 'S2', percent: 15, group: 'SEASONAL' }).isValid);
});

suite('Pricing Validators — getMaxDiscountCap');

test('Agoda = 80', () => { assertEqual(getMaxDiscountCap('agoda'), 80); });
test('Booking = null', () => { assertEqual(getMaxDiscountCap('booking'), null); });
test('Unknown = null', () => { assertEqual(getMaxDiscountCap('xyz'), null); });

// ─── 6. API Auth Coverage ───

suite('API Auth Coverage');

const noAuthAllowed = ['api/auth', 'api/public'];
// These routes use alternative auth (not auth() or getActiveHotelId):
// - api/cron/* uses CRON_SECRET Bearer token
// - api/settings, api/import-jobs rely on middleware session check only
const altAuthPatterns = ['api/cron'];
const apiDir = path.resolve(__dirname, '../app/api');

function scanRoutes(dir: string, out: { file: string; hasAuth: boolean; exempt: boolean; altAuth: boolean }[] = []) {
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, item.name);
        if (item.isDirectory()) scanRoutes(full, out);
        else if (item.name === 'route.ts') {
            const content = fs.readFileSync(full, 'utf-8');
            const rel = path.relative(path.resolve(__dirname, '../app'), full).replace(/\\/g, '/');
            out.push({
                file: rel,
                hasAuth: /auth\(\)|getActiveHotelId\(\)|getServerSession/.test(content),
                exempt: noAuthAllowed.some(p => rel.includes(p)),
                altAuth: altAuthPatterns.some(p => rel.startsWith(p)) ||
                    /CRON_SECRET|authorization|Bearer/.test(content),
            });
        }
    }
    return out;
}

const routes = scanRoutes(apiDir);
for (const r of routes) {
    if (r.exempt) {
        test(`${r.file}: exempted`, () => { assert(true); });
    } else if (r.altAuth && !r.hasAuth) {
        test(`${r.file}: alt auth (cron/middleware)`, () => { assert(true); });
    } else {
        test(`${r.file}: has auth`, () => {
            assert(r.hasAuth, `Missing auth in ${r.file}`);
        });
    }
}
test(`Total API routes: ${routes.length}`, () => { assert(routes.length > 5); });

// ═══════════════════════════════════════════════
// Results
// ═══════════════════════════════════════════════

console.log('\n' + '═'.repeat(40));
console.log(`\n🧪 Results: ${totalPassed + totalFailed} tests`);
console.log(`   ✅ ${totalPassed} passed`);
if (totalFailed > 0) console.log(`   ❌ ${totalFailed} FAILED`);
console.log('');
process.exit(totalFailed > 0 ? 1 : 0);
