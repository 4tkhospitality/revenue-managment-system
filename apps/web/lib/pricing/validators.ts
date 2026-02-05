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
        errors.push('Commission phải nhỏ hơn 100%');
    }

    // Rule 2: Max 1 SEASONAL
    const seasonals = active.filter(d => d.group === 'SEASONAL');
    if (seasonals.length > 1) {
        errors.push(`Chỉ được chọn 1 Seasonal promotion (đang chọn ${seasonals.length})`);
    }

    // Rule 3: Max 1 TARGETED per subcategory
    const targeteds = active.filter(d => d.group === 'TARGETED');
    const subcategoryGroups = groupBy(targeteds, 'subCategory');

    Object.entries(subcategoryGroups).forEach(([subcat, items]) => {
        if (items.length > 1 && subcat) {
            errors.push(`Chỉ được chọn 1 Targeted trong nhóm ${subcat} (đang chọn ${items.length})`);
        }
    });

    // Rule 4: Total discount <= cap (only for vendors with a cap)
    const totalDiscount = active.reduce((sum, d) => sum + d.percent, 0);
    if (maxDiscountCap !== null) {
        if (totalDiscount > maxDiscountCap) {
            errors.push(`Tổng giảm giá vượt quá ${maxDiscountCap}% (hiện tại: ${totalDiscount}%)`);
        } else if (totalDiscount > maxDiscountCap - 10) {
            warnings.push(`Tổng giảm giá gần đạt giới hạn (${totalDiscount}% / ${maxDiscountCap}%)`);
        }
    }

    // Rule 5: Warn if commission + discount approaching limits
    const effectiveReduction = commission + totalDiscount;
    if (effectiveReduction > 90) {
        warnings.push(`Tổng Commission + Discount = ${effectiveReduction}% (khuyến nghị < 90%)`);
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
            errors.push(`Không thể thêm ${newPromo.name}: đã có Seasonal "${existingSeasonals[0].name}"`);
        }
    }

    // Check TARGETED subcategory
    if (newPromo.group === 'TARGETED' && newPromo.subCategory) {
        const sameSubcat = existing.filter(
            d => d.group === 'TARGETED' && d.subCategory === newPromo.subCategory
        );
        if (sameSubcat.length >= 1) {
            errors.push(`Không thể thêm ${newPromo.name}: đã có Targeted "${sameSubcat[0].name}" trong nhóm ${newPromo.subCategory}`);
        }
    }

    // Check total discount (only for vendors with a cap)
    if (maxDiscountCap !== null) {
        const currentTotal = existing.reduce((sum, d) => sum + d.percent, 0);
        const newTotal = currentTotal + newPromo.percent;
        if (newTotal > maxDiscountCap) {
            errors.push(`Tổng giảm giá sẽ vượt ${maxDiscountCap}% (${currentTotal}% + ${newPromo.percent}% = ${newTotal}%)`);
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
