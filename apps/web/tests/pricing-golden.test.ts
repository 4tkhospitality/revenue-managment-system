/**
 * Phase 00: Golden Dataset Tests for Pricing Engine/Service
 * 
 * Tests engine pure functions directly (NO DB, NO service layer).
 * These are snapshot tests: output MUST be identical before/after refactor.
 * 
 * Run: npx tsx tests/pricing-golden.test.ts
 * 
 * 6 golden cases:
 * 1. Agoda progressive + multiple discounts + timing conflict
 * 2. Booking exclusive + Genius
 * 3. Expedia single-discount (highest wins)
 * 4. Trip.com same-box dedup
 * 5. Any case × OCC multiplier 1.20
 * 6. Reverse calc regression (bar → net roundtrip)
 */

import {
    calcBarFromNet,
    calcNetFromBar,
    resolveTimingConflicts,
    resolveVendorStacking,
    calcEffectiveDiscount,
    computeDisplay,
    applyOccAdjustment,
    normalizeVendorCode,
} from '../lib/pricing/engine';
import type { DiscountItem, CalcType } from '../lib/pricing/types';

// ── Test Helpers (same pattern as guardrails.test.ts) ────────────

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
    try {
        fn();
        passed++;
        console.log(`✅ PASS: ${name}`);
    } catch (e: any) {
        failed++;
        console.log(`❌ FAIL: ${name}`);
        console.log(`   ${e.message}`);
        process.exitCode = 1;
    }
}

function assertEqual<T>(actual: T, expected: T, msg: string) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`${msg}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
    }
}

function assertClose(actual: number, expected: number, tolerance: number, msg: string) {
    if (Math.abs(actual - expected) > tolerance) {
        throw new Error(`${msg}\nExpected: ${expected} ± ${tolerance}\nActual: ${actual}`);
    }
}

// ── Test Data ────────────────────────────────────────────────────

const agodaDiscounts: DiscountItem[] = [
    { id: '1', name: 'Early Bird 14', percent: 15, group: 'SEASONAL', subCategory: 'EARLY_BIRD' },
    { id: '2', name: 'Last Minute 3d', percent: 10, group: 'SEASONAL', subCategory: 'LAST_MINUTE' },
    { id: '3', name: 'Mobile Deal', percent: 8, group: 'TARGETED', subCategory: 'MOBILE' },
    { id: '4', name: 'Web Direct', percent: 5, group: 'TARGETED', subCategory: 'MOBILE' }, // same subcat as Mobile
];

const bookingExclusiveDiscounts: DiscountItem[] = [
    { id: '1', name: 'Black Friday', percent: 25, group: 'CAMPAIGN' },
    { id: '2', name: 'Summer Deal', percent: 20, group: 'CAMPAIGN' },
    { id: '3', name: 'Genius L1', percent: 10, group: 'GENIUS' },
    { id: '4', name: 'Genius L2', percent: 15, group: 'GENIUS' },
    { id: '5', name: 'Country Deal', percent: 12, group: 'PORTFOLIO' },
];

const expediaDiscounts: DiscountItem[] = [
    { id: '1', name: 'Deal A', percent: 20, group: 'PORTFOLIO' },
    { id: '2', name: 'Deal B', percent: 15, group: 'SEASONAL' },
    { id: '3', name: 'Deal C', percent: 10, group: 'TARGETED' },
];

const tripDiscounts: DiscountItem[] = [
    { id: '1', name: 'Flash Sale', percent: 12, group: 'SEASONAL', subCategory: 'FLASH' },
    { id: '2', name: 'Flash Sale 2', percent: 8, group: 'SEASONAL', subCategory: 'FLASH' }, // same box
    { id: '3', name: 'Member Deal', percent: 10, group: 'TARGETED', subCategory: 'MEMBER' },
];

// ── Test Suite ───────────────────────────────────────────────────

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🧪 Phase 00: Pricing Engine Golden Tests');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// ── Test 1: Agoda progressive + timing conflict + subcat dedup ──

test('1. Agoda: Progressive + timing conflict + subcat dedup', () => {
    // Step 1: resolveVendorStacking
    const { resolved: stacked, rule } = resolveVendorStacking('agoda', agodaDiscounts);

    // Agoda dedup: Mobile (8%) and Web Direct (5%) share subcat 'MOBILE' → keep Mobile (8%)
    // Both Early Bird and Last Minute stay (different subcats)
    assertEqual(rule, 'agoda: progressive + subcat dedup', 'rule');
    const mobileDeals = stacked.filter(d => d.subCategory === 'MOBILE');
    assertEqual(mobileDeals.length, 1, 'should dedup MOBILE subcat to 1');
    assertEqual(mobileDeals[0].percent, 8, 'should keep higher MOBILE deal');

    // Step 2: resolveTimingConflicts (Early Bird vs Last Minute)
    const { resolved: final, hadConflict, removed } = resolveTimingConflicts(stacked);
    assertEqual(hadConflict, true, 'should detect timing conflict');
    assertEqual(removed?.subCategory, 'LAST_MINUTE', 'should remove Last Minute (lower)');

    // Step 3: calcBarFromNet with PROGRESSIVE
    const result = calcBarFromNet(500_000, 18, final, 'PROGRESSIVE', 'CEIL_1000', 'agoda');
    // NET=500k, commission=18%, discounts: Early Bird 15% + Mobile 8%
    // gross = 500000 / (1 - 0.18) = 609756.097...
    // PROGRESSIVE: BAR = gross / [(1 - 0.15) × (1 - 0.08)] = gross / 0.782
    const expectedGross = 500000 / (1 - 0.18);
    const expectedBar = Math.ceil(expectedGross / (0.85 * 0.92) / 1000) * 1000;
    assertEqual(result.bar, expectedBar, `BAR should be ${expectedBar}`);

    // Step 4: calcEffectiveDiscount (PROGRESSIVE)
    const eff = calcEffectiveDiscount(final, 'PROGRESSIVE');
    assertClose(eff, (1 - 0.85 * 0.92) * 100, 0.01, 'effective discount %');

    // Step 5: computeDisplay
    const display = computeDisplay(result.bar, eff);
    // display = BAR × (1 - eff%)
    const expectedDisplay = Math.round(result.bar * (1 - eff / 100));
    assertEqual(display, expectedDisplay, 'display price');
});

// ── Test 2: Booking exclusive + Genius ──────────────────────────

test('2a. Booking: Deep Deal (EXCLUSIVE) blocks ALL including Genius', () => {
    // Deep Deal = stackBehavior EXCLUSIVE → blocks ALL
    const discounts: DiscountItem[] = [
        { id: '1', name: 'Deal of the Day', percent: 50, group: 'CAMPAIGN', stackBehavior: 'EXCLUSIVE' },
        { id: '2', name: 'Genius L2', percent: 15, group: 'GENIUS' },
        { id: '3', name: 'Mobile Rate', percent: 10, group: 'TARGETED', subCategory: 'MOBILE' },
        { id: '4', name: 'Basic Deal', percent: 10, group: 'PORTFOLIO' },
    ];
    const { resolved, rule, removedCount, ignored } = resolveVendorStacking('booking', discounts);

    // Deep Deal 50% EXCLUSIVE wins → only 1 discount
    assertEqual(resolved.length, 1, 'should keep only 1 discount');
    assertEqual(resolved[0].name, 'Deal of the Day', 'should keep Deal of the Day');
    assertEqual(removedCount, 3, 'should remove 3');

    // Genius should be blocked (EXCLUSIVE blocks Genius)
    const blockedGenius = ignored.find(i => i.name === 'Genius L2');
    if (!blockedGenius || !blockedGenius.reason.includes('EXCLUSIVE')) {
        throw new Error(`Genius should be blocked with EXCLUSIVE reason, got: ${blockedGenius?.reason}`);
    }
});

test('2b. Booking: Getaway (ONLY_WITH_GENIUS) stacks with Genius', () => {
    // Getaway = stackBehavior ONLY_WITH_GENIUS → stacks with Genius
    const discounts: DiscountItem[] = [
        { id: '1', name: 'Getaway Deal', percent: 15, group: 'CAMPAIGN', stackBehavior: 'ONLY_WITH_GENIUS' },
        { id: '2', name: 'Genius L2', percent: 15, group: 'GENIUS' },
        { id: '3', name: 'Genius L1', percent: 10, group: 'GENIUS' },
        { id: '4', name: 'Country Rate', percent: 10, group: 'TARGETED', subCategory: 'COUNTRY' },
    ];
    const { resolved, rule, ignored } = resolveVendorStacking('booking', discounts);

    // Getaway 15% + Genius L2 15% → eff = 1-(0.85*0.85) = 27.75%
    // vs no-campaign: Genius L2 15% + Country 10% → eff = 1-(0.85*0.90) = 23.5%
    // Getaway wins

    // Should keep Getaway + Genius L2
    assertEqual(resolved.length, 2, 'should keep 2 (Getaway + Genius)');
    const hasGetaway = resolved.some(d => d.name === 'Getaway Deal');
    const hasGeniusL2 = resolved.some(d => d.name === 'Genius L2');
    assertEqual(hasGetaway, true, 'should keep Getaway');
    assertEqual(hasGeniusL2, true, 'should keep Genius L2');

    // Country Rate should be blocked (TARGETED)
    const blockedCountry = ignored.find(i => i.name === 'Country Rate');
    if (!blockedCountry || !blockedCountry.reason.includes('TARGETED')) {
        throw new Error(`Country Rate should be blocked, got: ${blockedCountry?.reason}`);
    }
});

test('2c. Booking: Scenario comparison — best scenario wins', () => {
    // Mix of EXCLUSIVE + ONLY_WITH_GENIUS campaigns
    const discounts: DiscountItem[] = [
        { id: '1', name: 'Black Friday', percent: 25, group: 'CAMPAIGN', stackBehavior: 'EXCLUSIVE' },
        { id: '2', name: 'Getaway Deal', percent: 15, group: 'CAMPAIGN', stackBehavior: 'ONLY_WITH_GENIUS' },
        { id: '3', name: 'Genius L2', percent: 15, group: 'GENIUS' },
        { id: '4', name: 'Country Deal', percent: 12, group: 'PORTFOLIO' },
    ];
    const { resolved, rule, removedCount } = resolveVendorStacking('booking', discounts);

    // Scenarios:
    // S0 (no campaign): Genius 15% + Country 12% → eff = 1-(0.85*0.88) = 25.2%
    // S1 (Black Friday EXCLUSIVE): 25% → eff = 25%
    // S2 (Getaway + Genius): 15% + 15% → eff = 1-(0.85*0.85) = 27.75%
    // Winner: Getaway + Genius (27.75%)

    assertEqual(resolved.length, 2, 'should keep 2 (Getaway + Genius wins)');
    const hasGetaway = resolved.some(d => d.name === 'Getaway Deal');
    const hasGenius = resolved.some(d => d.name === 'Genius L2');
    assertEqual(hasGetaway, true, 'should keep Getaway');
    assertEqual(hasGenius, true, 'should keep Genius L2');
});

// ── Test 3: Expedia single-discount (highest wins) ─────────────

test('3. Expedia: No Member → highest discount wins (SINGLE_DISCOUNT)', () => {
    const { resolved, rule, removedCount } = resolveVendorStacking('expedia', expediaDiscounts);

    assertEqual(rule, 'expedia: single_discount (highest wins)', 'rule');
    assertEqual(resolved.length, 1, 'should keep only 1 discount');
    assertEqual(resolved[0].percent, 20, 'should keep highest (20%)');
    assertEqual(removedCount, 2, 'should remove 2');

    // Also verify calcBarFromNet with SINGLE_DISCOUNT calc type
    const result = calcBarFromNet(500_000, 15, expediaDiscounts, 'SINGLE_DISCOUNT', 'CEIL_1000', 'expedia');
    // SINGLE_DISCOUNT picks max(20, 15, 10) = 20%
    const expectedGross = 500000 / (1 - 0.15);
    const expectedBar = Math.ceil(expectedGross / (1 - 0.20) / 1000) * 1000;
    assertEqual(result.bar, expectedBar, `BAR should be ${expectedBar}`);
    assertEqual(result.totalDiscount, 20, 'totalDiscount should be 20 (highest)');
});

// ── Test 3b: Expedia with Member deal ──────────────────────────

test('3b. Expedia: Member deal stacks with best non-member', () => {
    const expediaWithMember: DiscountItem[] = [
        { id: '1', name: 'Same Day Deal', percent: 20, group: 'ESSENTIAL' },
        { id: '2', name: 'Multi-Night Deal', percent: 15, group: 'ESSENTIAL' },
        { id: '3', name: 'Member Only', percent: 10, group: 'TARGETED', subCategory: 'MEMBER' },
    ];
    const { resolved, rule, removedCount } = resolveVendorStacking('expedia', expediaWithMember);

    assertEqual(rule, 'expedia: member_plus_one', 'rule');
    assertEqual(resolved.length, 2, 'should keep 2 (Member + best non-member)');

    const hasMember = resolved.some(d => d.name === 'Member Only');
    const hasSameDay = resolved.some(d => d.name === 'Same Day Deal');
    assertEqual(hasMember, true, 'should keep Member Only');
    assertEqual(hasSameDay, true, 'should keep Same Day Deal (highest non-member)');
    assertEqual(removedCount, 1, 'should remove 1 (Multi-Night)');
});

// ── Test 4: Trip.com same-box dedup ────────────────────────────

test('4. Trip.com: Group-level dedup (best per PORTFOLIO/TARGETED)', () => {
    // Engine does group-level dedup: best per PORTFOLIO + best per TARGETED, SEASONAL=other passes through
    // tripDiscounts has: Flash Sale 12% (SEASONAL), Flash Sale 2 8% (SEASONAL), Member Deal 10% (TARGETED)
    // SEASONAL items go to 'other' (no dedup) → both kept
    // TARGETED picks best → Member Deal 10% kept
    // removedCount = 0 (no PORTFOLIO, TARGETED has 1 item, SEASONAL all kept)
    const { resolved, rule, removedCount } = resolveVendorStacking('trip', tripDiscounts);

    assertEqual(rule, 'trip.com: additive + group dedup', 'rule');
    assertEqual(removedCount, 0, 'should remove 0 (no group-level dupes)');
    assertEqual(resolved.length, 3, 'should keep all 3 (2 SEASONAL + 1 TARGETED)');

    // Member Deal kept
    const member = resolved.filter(d => d.subCategory === 'MEMBER');
    assertEqual(member.length, 1, 'should keep MEMBER');
});

test('4b. Trip.com: PORTFOLIO group dedup keeps highest only', () => {
    // Test actual group dedup with multiple PORTFOLIO items
    const tripWithPortfolio: DiscountItem[] = [
        { id: '1', name: 'Regular Promo A', percent: 15, group: 'PORTFOLIO' },
        { id: '2', name: 'Regular Promo B', percent: 10, group: 'PORTFOLIO' },
        { id: '3', name: 'Targeting Deal', percent: 12, group: 'TARGETED' },
    ];
    const { resolved, rule, removedCount } = resolveVendorStacking('trip', tripWithPortfolio);

    assertEqual(rule, 'trip.com: additive + group dedup', 'rule');
    assertEqual(removedCount, 1, 'should remove 1 (lower PORTFOLIO)');
    assertEqual(resolved.length, 2, 'should keep 2 (best PORTFOLIO + TARGETED)');

    const portfolio = resolved.filter(d => d.group === 'PORTFOLIO');
    assertEqual(portfolio.length, 1, 'should keep 1 PORTFOLIO');
    assertEqual(portfolio[0].percent, 15, 'should keep higher PORTFOLIO (15%)');
});

// ── Test 5: OCC multiplier × any case ─────────────────────────

test('5. OCC multiplier 1.20 × Agoda NET price', () => {
    const netBase = 500_000;
    const multiplier = 1.20;
    const adjustedNet = applyOccAdjustment(netBase, 'MULTIPLY', multiplier, 0);

    assertEqual(adjustedNet, 600_000, 'adjusted NET should be 600k');

    // Full pipeline: adjusted NET → BAR (Agoda, commission 18%, no discounts)
    const result = calcBarFromNet(adjustedNet, 18, [], 'PROGRESSIVE', 'CEIL_1000', 'agoda');
    const expectedGross = 600000 / (1 - 0.18);
    const expectedBar = Math.ceil(expectedGross / 1000) * 1000;
    assertEqual(result.bar, expectedBar, `BAR should be ${expectedBar}`);

    // Verify it's different from without multiplier
    const resultNoMult = calcBarFromNet(netBase, 18, [], 'PROGRESSIVE', 'CEIL_1000', 'agoda');
    const diff = result.bar - resultNoMult.bar;
    if (diff <= 0) throw new Error('OCC multiplier should increase BAR');
});

// ── Test 6: Reverse calc regression (BAR→NET roundtrip) ────────

test('6. Reverse calc regression: NET→BAR→NET roundtrip ≈ identity', () => {
    const originalNet = 500_000;
    const commission = 18;
    const discounts: DiscountItem[] = [
        { id: '1', name: 'Promo A', percent: 10, group: 'SEASONAL' },
        { id: '2', name: 'Promo B', percent: 5, group: 'TARGETED' },
    ];
    const calcType: CalcType = 'PROGRESSIVE';

    // Step 1: NET → BAR
    const forward = calcBarFromNet(originalNet, commission, discounts, calcType, 'NONE', 'agoda');

    // Step 2: BAR → NET
    const reverse = calcNetFromBar(forward.bar, commission, discounts, calcType, 'agoda');

    // Step 3: roundtrip should ≈ identity (within rounding tolerance)
    assertClose(reverse.net, originalNet, 1, 'reverse.net ≈ originalNet');

    // Also verify totalDiscount is consistent
    assertClose(forward.totalDiscount, reverse.totalDiscount, 0.01, 'totalDiscount should match');
});

// ── Bonus: Vendor code normalization ────────────────────────────

test('7. Vendor normalization: booking.com → booking, ctrip → trip', () => {
    assertEqual(normalizeVendorCode('booking.com'), 'booking', 'booking.com → booking');
    assertEqual(normalizeVendorCode('Booking'), 'booking', 'Booking → booking');
    assertEqual(normalizeVendorCode('ctrip'), 'trip', 'ctrip → trip');
    assertEqual(normalizeVendorCode('trip.com'), 'trip', 'trip.com → trip');
    assertEqual(normalizeVendorCode('Expedia'), 'expedia', 'Expedia → expedia');
    assertEqual(normalizeVendorCode(' Agoda '), 'agoda', 'trimmed Agoda → agoda');
    assertEqual(normalizeVendorCode('unknown_ota'), 'unknown_ota', 'unknown passes through');
});

// ── Phase 03 Tests ──────────────────────────────────────────────

// ── Test 8: Booking Genius L1 + L2 → only L2 ──────────────────

test('8. Booking: Genius L1 + L2 → only L2 (no stacking within Genius)', () => {
    const discounts: DiscountItem[] = [
        { id: '1', name: 'Genius Level 1', percent: 10, group: 'GENIUS' },
        { id: '2', name: 'Genius Level 2', percent: 15, group: 'GENIUS' },
        { id: '3', name: 'Mobile Deal', percent: 12, group: 'TARGETED', subCategory: 'MOBILE' },
    ];
    const { resolved, ignored, rule } = resolveVendorStacking('booking', discounts);

    // Genius: only L2 (highest) should survive
    const genius = resolved.filter(d => d.group === 'GENIUS');
    assertEqual(genius.length, 1, 'should keep only 1 Genius');
    assertEqual(genius[0].percent, 15, 'should keep L2 (15%)');

    // Mobile Deal should also survive (different group)
    const targeted = resolved.filter(d => d.group === 'TARGETED');
    assertEqual(targeted.length, 1, 'should keep Mobile Deal');

    // Genius L1 should be in ignored list
    const ignoredGenius = ignored.filter(i => i.id === '1');
    assertEqual(ignoredGenius.length, 1, 'Genius L1 should be in ignored');
    if (!ignoredGenius[0].reason.includes('cao hơn')) {
        throw new Error(`Ignored reason should mention "cao hơn", got: ${ignoredGenius[0].reason}`);
    }
});

// ── Test 9: Rounding tolerance (CEIL_1000 vs ROUND_100) ────────

test('9. Rounding tolerance: CEIL_1000 result ≤ ROUND_100 + 1000', () => {
    const net = 487_321; // Awkward number to test rounding
    const commission = 17;
    const discounts: DiscountItem[] = [
        { id: '1', name: 'Promo X', percent: 12, group: 'SEASONAL' },
        { id: '2', name: 'Promo Y', percent: 7, group: 'TARGETED' },
    ];

    const ceil1000 = calcBarFromNet(net, commission, discounts, 'PROGRESSIVE', 'CEIL_1000', 'agoda');
    const round100 = calcBarFromNet(net, commission, discounts, 'PROGRESSIVE', 'ROUND_100', 'agoda');
    const noRound = calcBarFromNet(net, commission, discounts, 'PROGRESSIVE', 'NONE', 'agoda');

    // CEIL_1000 should be ≥ NONE (rounds up to nearest 1000)
    if (ceil1000.bar < noRound.bar) {
        throw new Error(`CEIL_1000 (${ceil1000.bar}) should be >= NONE (${noRound.bar})`);
    }

    // CEIL_1000 − noRound should be < 1000 (max rounding delta)
    const delta = ceil1000.bar - noRound.bar;
    if (delta >= 1000) {
        throw new Error(`CEIL_1000 delta (${delta}) should be < 1000`);
    }

    // All 3 should have same totalDiscount (rounding doesn't affect discount%)
    assertClose(ceil1000.totalDiscount, round100.totalDiscount, 0.01, 'totalDiscount should match across rounding modes');
});

// ── Test 10: Booking Mobile + Country → ignored[] has reason ────

test('10. Booking: Mobile + Country → StackingResult.ignored[] has reason', () => {
    const discounts: DiscountItem[] = [
        { id: '1', name: 'Mobile Rate', percent: 15, group: 'TARGETED', subCategory: 'MOBILE' },
        { id: '2', name: 'Country Rate', percent: 10, group: 'TARGETED', subCategory: 'COUNTRY' },
    ];
    const result = resolveVendorStacking('booking', discounts);

    // Only highest Targeted should survive
    assertEqual(result.resolved.length, 1, 'should keep only 1 Targeted');
    assertEqual(result.resolved[0].name, 'Mobile Rate', 'should keep Mobile Rate (15%)');

    // Country Rate should be in ignored with human-readable reason
    assertEqual(result.ignored.length, 1, 'should have 1 ignored');
    assertEqual(result.ignored[0].id, '2', 'ignored should be Country Rate');
    if (!result.ignored[0].reason) {
        throw new Error('Ignored item should have a reason string');
    }
    // Reason should mention the winner name
    if (!result.ignored[0].reason.includes('Mobile Rate')) {
        throw new Error(`Reason should mention "Mobile Rate", got: ${result.ignored[0].reason}`);
    }
});

// ── Summary ─────────────────────────────────────────────────────

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`🎉 Golden tests: ${passed} passed, ${failed} failed`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
