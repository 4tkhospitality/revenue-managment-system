// V01.2: Pricing Validators
// Validate promotion stacking rules

import type { DiscountItem, ValidationResult, PromotionGroup } from './types';

const MAX_DISCOUNT_CAP_AGODA = 80; // Agoda max total discount

// Vendor-specific max discount caps
// null = no limit
const VENDOR_MAX_DISCOUNT: Record<string, number | null> = {
    agoda: 80,
    booking: null, // Booking.com has no published max discount limit
    traveloka: null,
    expedia: null,
    ctrip: null,
};

/**
 * Get max discount cap for a vendor
 */
export function getMaxDiscountCap(vendor: string): number | null {
    return VENDOR_MAX_DISCOUNT[vendor] ?? null;
}

/**
 * Validate promotion combinations
 */
export function validatePromotions(
    discounts: DiscountItem[],
    commission: number,
    vendor: string = 'agoda'
): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const active = discounts.filter(d => d.percent > 0);
    const maxDiscountCap = getMaxDiscountCap(vendor);

    // Rule 1: Commission < 100%
    if (commission >= 100) {
        errors.push('Commission must be less than 100%');
    }

    // Rule 2: Max 1 SEASONAL
    const seasonals = active.filter(d => d.group === 'SEASONAL');
    if (seasonals.length > 1) {
        errors.push(`Only 1 Seasonal promotion allowed (currently selected: ${seasonals.length})`);
    }

    // Rule 3: Max 1 TARGETED per subcategory
    const targeteds = active.filter(d => d.group === 'TARGETED');
    const subcategoryGroups = groupBy(targeteds, 'subCategory');

    Object.entries(subcategoryGroups).forEach(([subcat, items]) => {
        if (items.length > 1 && subcat) {
            errors.push(`Only 1 Targeted rate per group ${subcat} allowed (currently selected: ${items.length})`);
        }
    });

    // Rule 4: Total discount <= cap (only for vendors with a cap)
    const totalDiscount = active.reduce((sum, d) => sum + d.percent, 0);
    if (maxDiscountCap !== null) {
        if (totalDiscount > maxDiscountCap) {
            errors.push(`Total discount exceeds ${maxDiscountCap}% (current: ${totalDiscount}%)`);
        } else if (totalDiscount > maxDiscountCap - 10) {
            warnings.push(`Total discount near limit (${totalDiscount}% / ${maxDiscountCap}%)`);
        }
    }

    // Rule 5: Warn if commission + discount approaching limits
    const effectiveReduction = commission + totalDiscount;
    if (effectiveReduction > 90) {
        warnings.push(`Total Commission + Discount = ${effectiveReduction}% (recommended < 90%)`);
    }

    // Rule 6: Early Bird + Last-Minute non-stacking warning (V01.3)
    const EARLY_BIRD_PATTERN = /early.?bird|early.?booker/i;
    const LAST_MINUTE_PATTERN = /last.?minute/i;
    const hasEarlyBird = active.some(d => EARLY_BIRD_PATTERN.test(d.name));
    const hasLastMinute = active.some(d => LAST_MINUTE_PATTERN.test(d.name));
    if (hasEarlyBird && hasLastMinute) {
        if (vendor === 'booking') {
            // Booking.com: BLOCK (Early Booker ❌ Last Minute per matrix)
            errors.push('Early Booker Deal ❌ Last Minute Deal - cannot combine (different booking windows)');
        } else {
            warnings.push(
                'Early Bird + Last-Minute are usually NOT stackable due to different booking windows. ' +
                'System applies highest discount only. Stack only when application dates overlap.'
            );
        }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // BOOKING.COM — PDF STACKING MATRIX RULES
    // Source: partner.booking.com "How discounts on rates and promotions stack"
    // ══════════════════════════════════════════════════════════════════════════
    if (vendor === 'booking') {
        // Categorize active discounts per PDF matrix groups
        const genius = active.filter(d => d.subCategory === 'GENIUS');
        const targetedRates = active.filter(d => d.subCategory === 'TARGETED_RATE');
        const businessBookers = active.filter(d => d.subCategory === 'BUSINESS_BOOKERS');
        const allTargeted = active.filter(d => d.group === 'TARGETED'); // Genius + Mobile/Country + BusinessBookers
        const exclusivePromos = active.filter(d => d.group === 'CAMPAIGN'); // Campaign + Deal of the Day
        const portfolioPromos = active.filter(d => d.group === 'PORTFOLIO'); // Early/Last/Basic/Secret/FreeNights

        // ── B1: Max 3 APPLIED discounts ──
        // Applied = max 1 Genius + max 1 Targeted Rate + max 1 Promotion (highest wins)
        // Config can have more enabled, but engine applies ≤3. Warn if enabled > 3.
        const appliedCount =
            Math.min(genius.length, 1) +
            Math.min(targetedRates.length, 1) +
            Math.min(portfolioPromos.length + exclusivePromos.length, 1);
        if (appliedCount > 3) {
            // Shouldn't happen given the category caps, but safety check
            errors.push(`Maximum 3 discounts can be applied (Genius + Targeted Rate + Promotion)`);
        }

        // ── B2: Mobile Rate ❌ Country Rate (mutual exclusive) ──
        if (targetedRates.length > 1) {
            errors.push('Mobile Rate ❌ Country Rate - cannot combine');
        }

        // ── B3: Business Bookers ❌ ALL (exclusive rate) ──
        if (businessBookers.length > 0 && active.length > businessBookers.length) {
            const others = active.filter(d => d.subCategory !== 'BUSINESS_BOOKERS').map(d => d.name).join(', ');
            errors.push(
                `Business Bookers is an exclusive rate - does not stack with: ${others}`
            );
        }

        // ── B4: Campaign / Deal of the Day ❌ ALL (exclusive promo) ──
        // Per PDF: Campaign and Deal of Day don't stack with ANY targeted rates OR any other promotions
        if (exclusivePromos.length > 0) {
            const exclusiveName = exclusivePromos[0].name;
            // Check vs targeted rates (including Genius)
            if (allTargeted.length > 0) {
                const targetedNames = allTargeted.map(d => d.name).join(', ');
                errors.push(
                    `${exclusiveName} ❌ ${targetedNames} — Campaign/Deal of Day does not stack with Targeted Rates`
                );
            }
            // Check vs other promotions
            if (portfolioPromos.length > 0) {
                const promoNames = portfolioPromos.map(d => d.name).join(', ');
                errors.push(
                    `${exclusiveName} ❌ ${promoNames} — Campaign/Deal of Day does not stack with other promotions`
                );
            }
            // Check vs other exclusive promos
            if (exclusivePromos.length > 1) {
                errors.push(
                    `Only 1 Campaign/Deal of Day allowed (currently selected: ${exclusivePromos.map(d => d.name).join(', ')})`
                );
            }
        }

        // ── B5: Portfolio promotions DON'T stack (hatched in PDF) ──
        // Config ALLOWS multiple enabled (GM runs many deals for different conditions).
        // Engine picks only 1 — highest effective % wins.
        if (portfolioPromos.length > 1) {
            const sorted = [...portfolioPromos].sort((a, b) => b.percent - a.percent);
            const winner = sorted[0];
            const names = portfolioPromos.map(d => `${d.name} (${d.percent}%)`).join(', ');
            warnings.push(
                `${portfolioPromos.length} promotions enabled: ${names}. ` +
                `Promotions do not stack - only "${winner.name}" (${winner.percent}%) is applied (highest wins).`
            );
        }

        // ── B6: Max 1 Genius level ──
        if (genius.length > 1) {
            errors.push(`Only 1 Genius level allowed (currently selected: ${genius.length})`);
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Validate a single promotion can be added
 */
export function canAddPromotion(
    existing: DiscountItem[],
    newPromo: DiscountItem,
    vendor: string = 'agoda'
): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const maxDiscountCap = getMaxDiscountCap(vendor);

    // Check if adding would exceed SEASONAL limit
    if (newPromo.group === 'SEASONAL') {
        const existingSeasonals = existing.filter(d => d.group === 'SEASONAL');
        if (existingSeasonals.length >= 1) {
            errors.push(`Cannot add ${newPromo.name}: Seasonal "${existingSeasonals[0].name}" already exists`);
        }
    }

    // Check TARGETED subcategory
    if (newPromo.group === 'TARGETED' && newPromo.subCategory) {
        const sameSubcat = existing.filter(
            d => d.group === 'TARGETED' && d.subCategory === newPromo.subCategory
        );
        if (sameSubcat.length >= 1) {
            errors.push(`Cannot add ${newPromo.name}: Targeted "${sameSubcat[0].name}" already exists in group ${newPromo.subCategory}`);
        }
    }

    // Check total discount (only for vendors with a cap)
    if (maxDiscountCap !== null) {
        const currentTotal = existing.reduce((sum, d) => sum + d.percent, 0);
        const newTotal = currentTotal + newPromo.percent;
        if (newTotal > maxDiscountCap) {
            errors.push(`Total discount would exceed ${maxDiscountCap}% (${currentTotal}% + ${newPromo.percent}% = ${newTotal}%)`);
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}

// Helper function
function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((result, item) => {
        const groupKey = String(item[key] || 'UNKNOWN');
        if (!result[groupKey]) {
            result[groupKey] = [];
        }
        result[groupKey].push(item);
        return result;
    }, {} as Record<string, T[]>);
}
