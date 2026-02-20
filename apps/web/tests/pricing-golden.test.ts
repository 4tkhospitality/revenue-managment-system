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
    applyGuardrails,
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
    { id: 'tripcom-early-bird', name: 'Early Bird', percent: 12, group: 'ESSENTIAL', subCategory: 'DEAL_BOX' },
    { id: 'tripcom-basic-deal', name: 'Basic Deal', percent: 10, group: 'ESSENTIAL', subCategory: 'DEAL_BOX' },
    { id: 'tripcom-mobile-rate', name: 'Mobile Rate', percent: 15, group: 'TARGETED', subCategory: 'TARGETING' },
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

// ── Test 4: Trip.com 7-box dedup ────────────────────────────────

test('4. Trip.com: 7-box dedup — pick highest per box, stack across boxes', () => {
    // tripDiscounts: Early Bird 12% (box 1) + Basic Deal 10% (box 1) + Mobile Rate 15% (box 2)
    // Box 1: Early Bird 12% wins (Basic Deal 10% dropped)
    // Box 2: Mobile Rate 15% (only item)
    // Result: 2 winners from 2 different boxes
    const { resolved, rule, removedCount, ignored } = resolveVendorStacking('trip', tripDiscounts);

    assertEqual(rule, 'trip.com: 7-box additive', 'rule');
    assertEqual(removedCount, 1, 'should remove 1 (Basic Deal from same box 1)');
    assertEqual(resolved.length, 2, 'should keep 2 (1 per box)');

    // Early Bird wins box 1
    const box1 = resolved.find(d => d.id === 'tripcom-early-bird');
    if (!box1) throw new Error('Early Bird should survive box 1 dedup');
    assertEqual(box1.percent, 12, 'Early Bird 12% wins box 1');

    // Mobile Rate wins box 2
    const box2 = resolved.find(d => d.id === 'tripcom-mobile-rate');
    if (!box2) throw new Error('Mobile Rate should survive box 2');

    // Basic Deal should be in ignored
    const dropped = ignored.find(i => i.id === 'tripcom-basic-deal');
    if (!dropped || !dropped.reason.includes('box 1')) {
        throw new Error(`Basic Deal should be dropped from box 1, got: ${dropped?.reason}`);
    }
});

test('4b. Trip.com: Multiple boxes additive — box 1 + box 2 + box 5', () => {
    // 3 items from 3 different boxes → all kept
    const tripMultiBox: DiscountItem[] = [
        { id: 'tripcom-early-bird', name: 'Early Bird', percent: 12, group: 'ESSENTIAL', subCategory: 'DEAL_BOX' },
        { id: 'tripcom-mobile-rate', name: 'Mobile Rate', percent: 15, group: 'TARGETED', subCategory: 'TARGETING' },
        { id: 'tripcom-tripplus', name: 'TripPlus', percent: 10, group: 'TARGETED', subCategory: 'TRIPPLUS' },
    ];
    const { resolved, rule, removedCount } = resolveVendorStacking('trip', tripMultiBox);

    assertEqual(rule, 'trip.com: 7-box additive', 'rule');
    assertEqual(removedCount, 0, 'should remove 0 (all different boxes)');
    assertEqual(resolved.length, 3, 'should keep all 3 (boxes 1, 2, 5)');
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
    if (!ignoredGenius[0].reason.includes('higher')) {
        throw new Error(`Ignored reason should mention "higher", got: ${ignoredGenius[0].reason}`);
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

// ── Phase 04: Edge Case Tests ───────────────────────────────────

console.log('\n── Phase 04: Edge Cases ──────────────────\n');

// ── Test 11: Zero discounts → BAR = gross (no discount applied) ──

test('11. Zero discounts: BAR = NET / (1 - commission), no discount applied', () => {
    const result = calcBarFromNet(500_000, 18, [], 'PROGRESSIVE', 'CEIL_1000', 'agoda');
    const expectedGross = 500000 / (1 - 0.18);
    const expectedBar = Math.ceil(expectedGross / 1000) * 1000;
    assertEqual(result.bar, expectedBar, `BAR should be ${expectedBar}`);
    assertEqual(result.totalDiscount, 0, 'totalDiscount should be 0');

    // Reverse: NET from BAR with no discounts
    const reverse = calcNetFromBar(result.bar, 18, [], 'PROGRESSIVE', 'agoda');
    // NET should be close to original (within rounding delta from CEIL_1000)
    if (reverse.net < 500_000) {
        throw new Error(`Reverse NET (${reverse.net}) should be >= original (500000) since BAR was rounded up`);
    }
});

// ── Test 12: Commission = 0 → BAR = NET / discount factor only ──

test('12. Commission 0%: BAR = NET / discount factor (no commission markup)', () => {
    const discounts: DiscountItem[] = [
        { id: '1', name: 'Promo', percent: 10, group: 'SEASONAL' },
    ];
    const result = calcBarFromNet(500_000, 0, discounts, 'PROGRESSIVE', 'NONE', 'agoda');
    // No commission: gross = NET / 1.0 = 500k
    // PROGRESSIVE: BAR = 500000 / (1 - 0.10) = 555555.55...
    const expected = 500000 / (1 - 0.10);
    assertClose(result.bar, expected, 1, 'BAR with 0% commission');
    assertEqual(result.commission, 0, 'commission should be 0');
});

// ── Test 13: Commission near 100% → very high BAR ──

test('13. Commission 99%: yields very high BAR (boundary test)', () => {
    const result = calcBarFromNet(500_000, 99, [], 'PROGRESSIVE', 'NONE', 'agoda');
    // gross = 500000 / (1 - 0.99) = 500000 / 0.01 = 50,000,000
    const expected = 500000 / 0.01;
    assertClose(result.bar, expected, 1, 'BAR with 99% commission');
});

// ── Test 14: Commission = 100% → error ──

test('14. Commission 100%: returns error (calcNetFromBar)', () => {
    const result = calcNetFromBar(1_000_000, 100, [], 'PROGRESSIVE', 'agoda');
    assertEqual(result.validation.isValid, false, 'should be invalid');
    if (!result.validation.errors.some(e => e.includes('100'))) {
        throw new Error(`Should have error about commission >= 100%, got: ${result.validation.errors}`);
    }
});

// ── Test 15: Commission boosters increase effective commission ──

test('15. Commission boosters: base 18% + AGP 3% + AGX 2% = 23%', () => {
    const boosters: import('../lib/pricing/types').CommissionBooster[] = [
        { id: 'agp', name: 'Agoda Growth Program', program: 'AGP', boostPct: 3, enabled: true },
        { id: 'agx', name: 'Agoda Extra Boost', program: 'AGX', boostPct: 2, enabled: true },
        { id: 'disabled', name: 'Disabled Boost', program: 'SL', boostPct: 5, enabled: false },
    ];

    const resultWithBoosters = calcBarFromNet(500_000, 18, [], 'PROGRESSIVE', 'NONE', 'agoda', boosters);
    const resultWithout = calcBarFromNet(500_000, 18, [], 'PROGRESSIVE', 'NONE', 'agoda');

    // With boosters: gross = 500000 / (1 - 0.23) = 649350.649...
    const expectedGross = 500000 / (1 - 0.23);
    assertClose(resultWithBoosters.bar, expectedGross, 1, 'BAR with boosters');

    // Should be higher than without boosters
    if (resultWithBoosters.bar <= resultWithout.bar) {
        throw new Error('BAR with boosters should be > BAR without');
    }

    // effectiveCommission should be reported
    assertEqual(resultWithBoosters.effectiveCommission, 23, 'effectiveCommission should be 23');

    // Disabled booster should NOT count
    assertEqual(resultWithBoosters.boosters?.length, 2, 'should have 2 active boosters');
});

// ── Test 16: Guardrails — MIN_RATE clamp ──

test('16. Guardrails: MIN_RATE clamp (price below min → clamped up)', () => {
    const result = applyGuardrails(200_000, {
        min_rate: 500_000,
        max_rate: 2_000_000,
        max_step_change_pct: 0.2,
        rounding_rule: 'CEIL_1000',
    });
    assertEqual(result.primary_reason, 'MIN_RATE', 'primary_reason should be MIN_RATE');
    assertEqual(result.after_price, 500_000, 'should clamp to min_rate');
    assertEqual(result.clamped, true, 'should be clamped');
});

// ── Test 17: Guardrails — MAX_RATE clamp ──

test('17. Guardrails: MAX_RATE clamp (price above max → clamped down)', () => {
    const result = applyGuardrails(5_000_000, {
        min_rate: 500_000,
        max_rate: 2_000_000,
        max_step_change_pct: 0.2,
        rounding_rule: 'CEIL_1000',
    });
    assertEqual(result.primary_reason, 'MAX_RATE', 'primary_reason should be MAX_RATE');
    assertEqual(result.after_price, 2_000_000, 'should clamp to max_rate');
    assertEqual(result.clamped, true, 'should be clamped');
});

// ── Test 18: Guardrails — STEP_CAP (> 20% change from previous) ──

test('18. Guardrails: STEP_CAP limits price change to 20% from previous', () => {
    const result = applyGuardrails(1_500_000, {
        min_rate: 500_000,
        max_rate: 5_000_000,
        max_step_change_pct: 0.2,
        previous_bar: 1_000_000,
        rounding_rule: 'CEIL_1000',
    });
    // 1.5M is 50% above 1M → step-capped to 1M × 1.2 = 1.2M
    if (!result.reason_codes.includes('STEP_CAP')) {
        throw new Error(`Should have STEP_CAP reason, got: ${result.reason_codes}`);
    }
    // After step-cap + CEIL_1000 rounding, should be <= 1.2M
    if (result.after_price > 1_200_000) {
        throw new Error(`Price (${result.after_price}) should be <= 1,200,000 after step-cap`);
    }
});

// ── Test 19: Guardrails — MANUAL_OVERRIDE bypass with warnings ──

test('19. Guardrails: Manual override bypasses clamping, but adds warnings', () => {
    const result = applyGuardrails(200_000, {
        min_rate: 500_000,
        max_rate: 2_000_000,
        max_step_change_pct: 0.2,
        is_manual: true,
        enforce_guardrails_on_manual: false,
        rounding_rule: 'CEIL_1000',
    });
    assertEqual(result.primary_reason, 'MANUAL_OVERRIDE', 'should be MANUAL_OVERRIDE');
    assertEqual(result.clamped, false, 'should NOT be clamped (manual bypass)');
    assertEqual(result.after_price, 200_000, 'price should be unchanged');
    // Should still have warning about being outside min
    if (!result.warnings.includes('OUTSIDE_MIN')) {
        throw new Error(`Should warn about OUTSIDE_MIN, got: ${result.warnings}`);
    }
});

// ── Test 20: Guardrails — INVALID_NET (price <= 0) ──

test('20. Guardrails: INVALID_NET hard stop for price <= 0', () => {
    const result = applyGuardrails(-100_000, {
        min_rate: 500_000,
        max_rate: 2_000_000,
        max_step_change_pct: 0.2,
        rounding_rule: 'CEIL_1000',
    });
    assertEqual(result.primary_reason, 'INVALID_NET', 'should be INVALID_NET');
    assertEqual(result.after_price, 0, 'price should be 0 for invalid');
});

// ── Test 21: Additive calc mode (Trip.com full pipeline) ──

test('21. Trip.com ADDITIVE: BAR = NET / (1 - comm) / (1 - Σdᵢ)', () => {
    const discounts: DiscountItem[] = [
        { id: '1', name: 'Flash Sale', percent: 10, group: 'SEASONAL' },
        { id: '2', name: 'Member Deal', percent: 5, group: 'TARGETED', subCategory: 'MEMBER' },
    ];
    const result = calcBarFromNet(500_000, 15, discounts, 'ADDITIVE', 'CEIL_1000', 'trip');
    // Additive: totalDiscount = 10 + 5 = 15%
    // gross = 500000 / (1 - 0.15) = 588235.29...
    // BAR = gross / (1 - 0.15) = 588235.29 / 0.85 = 691,453.28...
    const expectedGross = 500000 / (1 - 0.15);
    const expectedBar = Math.ceil(expectedGross / (1 - 0.15) / 1000) * 1000;
    assertEqual(result.bar, expectedBar, `BAR should be ${expectedBar}`);
    assertEqual(result.totalDiscount, 15, 'totalDiscount should be 15 (additive sum)');

    // Effective discount should match additive sum
    const eff = calcEffectiveDiscount(discounts, 'ADDITIVE');
    assertEqual(eff, 15, 'ADDITIVE effective = sum = 15%');
});

// ── Test 22: OCC FIXED adjustment ──

test('22. OCC FIXED adjustment: NET + fixedAmount', () => {
    const adjusted = applyOccAdjustment(500_000, 'FIXED', 1, 100_000);
    assertEqual(adjusted, 600_000, 'FIXED: 500k + 100k = 600k');

    // Negative fixed = discount below base
    const negative = applyOccAdjustment(500_000, 'FIXED', 1, -50_000);
    assertEqual(negative, 450_000, 'FIXED negative: 500k - 50k = 450k');
});

// ── Test 23: computeDisplay edge cases ──

test('23. computeDisplay: 0% discount → display = BAR, 100% → display = 0', () => {
    assertEqual(computeDisplay(1_000_000, 0), 1_000_000, '0% discount → BAR unchanged');
    assertEqual(computeDisplay(1_000_000, 100), 0, '100% discount → 0');
    assertEqual(computeDisplay(1_000_000, 50), 500_000, '50% discount → half');
});

// ── Test 24: Unknown vendor → default (no dedup, pass-through) ──

test('24. Unknown vendor: all discounts pass through (no dedup)', () => {
    const discounts: DiscountItem[] = [
        { id: '1', name: 'Deal A', percent: 20, group: 'PORTFOLIO' },
        { id: '2', name: 'Deal B', percent: 15, group: 'PORTFOLIO' },
        { id: '3', name: 'Deal C', percent: 10, group: 'TARGETED' },
    ];
    const { resolved, rule, removedCount } = resolveVendorStacking('traveloka', discounts);

    assertEqual(rule, 'default (no vendor rules)', 'should use default rule');
    assertEqual(resolved.length, 3, 'all discounts should pass through');
    assertEqual(removedCount, 0, 'should remove 0');
});

// ── Test 25: Trip.com Campaign EXCLUSIVE blocks all other discounts ──

test('25. Trip.com: Campaign EXCLUSIVE blocks all non-campaign discounts', () => {
    const discounts: DiscountItem[] = [
        { id: 'tripcom-campaign-2026', name: 'Trip.com 2026 Campaign', percent: 20, group: 'CAMPAIGN' },
        { id: 'tripcom-early-bird', name: 'Early Bird', percent: 12, group: 'ESSENTIAL', subCategory: 'DEAL_BOX' },
        { id: 'tripcom-mobile-rate', name: 'Mobile Rate', percent: 15, group: 'TARGETED', subCategory: 'TARGETING' },
    ];
    const { resolved, rule, ignored, removedCount } = resolveVendorStacking('trip', discounts);

    assertEqual(rule, 'trip.com: 7-box + campaign exclusive', 'should use 7-box campaign exclusive rule');
    assertEqual(resolved.length, 1, 'should keep only campaign');
    assertEqual(resolved[0].name, 'Trip.com 2026 Campaign', 'should keep campaign');
    assertEqual(removedCount, 2, 'should remove 2');

    // Both non-campaigns should be in ignored
    assertEqual(ignored.length, 2, 'should have 2 ignored');
    const earlyBirdIgnored = ignored.find(i => i.id === 'tripcom-early-bird');
    if (!earlyBirdIgnored || !earlyBirdIgnored.reason.includes('Campaign')) {
        throw new Error(`Early Bird should be blocked by Campaign, got: ${earlyBirdIgnored?.reason}`);
    }
});

// ── Test 26: Trip.com tie-break determinism (same %) ──

test('26. Trip.com: Tie-break — same % in same box → stable pick by id asc', () => {
    const discounts: DiscountItem[] = [
        { id: 'tripcom-last-minute', name: 'Last Minute', percent: 15, group: 'ESSENTIAL', subCategory: 'DEAL_BOX' },
        { id: 'tripcom-early-bird', name: 'Early Bird', percent: 15, group: 'ESSENTIAL', subCategory: 'DEAL_BOX' },
    ];
    const { resolved, rule, removedCount } = resolveVendorStacking('trip', discounts);

    assertEqual(rule, 'trip.com: 7-box additive', 'rule');
    assertEqual(resolved.length, 1, 'should keep 1 from box 1');
    assertEqual(removedCount, 1, 'should remove 1');
    // Tie-break: same pct → id asc → 'tripcom-early-bird' < 'tripcom-last-minute'
    assertEqual(resolved[0].id, 'tripcom-early-bird', 'tie-break: early-bird wins by id asc');
});

// ── Test 27: Trip.com priceImpact=false (CoinPlus) ──

test('27. Trip.com: CoinPlus (priceImpact=false) is resolved but not a real discount', () => {
    // CoinPlus has priceImpact=false in catalog — engine resolves it
    // but the ADDITIVE calc should NOT include it in Σdiscount
    // (priceImpact filtering happens at service layer, not resolveVendorStacking)
    // This test verifies CoinPlus survives stacking resolution
    const discounts: DiscountItem[] = [
        { id: 'tripcom-early-bird', name: 'Early Bird', percent: 12, group: 'ESSENTIAL', subCategory: 'DEAL_BOX' },
        { id: 'tripcom-coinplus', name: 'CoinPlus', percent: 5, group: 'TARGETED', subCategory: 'COINPLUS' },
    ];
    const { resolved, rule, removedCount } = resolveVendorStacking('trip', discounts);

    assertEqual(rule, 'trip.com: 7-box additive', 'rule');
    assertEqual(resolved.length, 2, 'CoinPlus should survive stacking (different box)');
    assertEqual(removedCount, 0, 'should remove 0');

    const coinplus = resolved.find(d => d.id === 'tripcom-coinplus');
    if (!coinplus) throw new Error('CoinPlus should be in resolved list');
});

// ── Test 28: Trip.com unknown discount (no catalog match) ──

test('28. Trip.com: Unknown discount → box 99, still resolved', () => {
    const discounts: DiscountItem[] = [
        { id: 'tripcom-early-bird', name: 'Early Bird', percent: 12, group: 'ESSENTIAL', subCategory: 'DEAL_BOX' },
        { id: 'custom-unknown', name: 'Custom Promo', percent: 8, group: 'ESSENTIAL' },
    ];
    const { resolved, rule, removedCount } = resolveVendorStacking('trip', discounts);

    assertEqual(rule, 'trip.com: 7-box additive', 'rule');
    // Early Bird → box 1, Custom Promo → box 99 (unknown) — different boxes, both kept
    assertEqual(resolved.length, 2, 'unknown gets own box (99), both kept');
    assertEqual(removedCount, 0, 'should remove 0');
});

// ── Summary ─────────────────────────────────────────────────────

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`🎉 Golden tests: ${passed} passed, ${failed} failed`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
