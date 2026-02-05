// V01.2: OTA Promotion Catalogs (Static)
// This is a reference for the UI - actual data comes from DB

import type { PromotionCatalogItem, PromotionGroup } from './types';

// =============================================================================
// AGODA PROMOTIONS
// Stacking: Seasonal + Essential + Targeted (additive within limits)
// =============================================================================
export const AGODA_PROMOTIONS: PromotionCatalogItem[] = [
    // A) SEASONAL (max 1 per OTA)
    {
        id: 'agoda-seasonal-double-day',
        vendor: 'agoda',
        name: 'Double Day Sale',
        groupType: 'SEASONAL',
        defaultPct: 15,
        allowStack: true,
        maxOneInGroup: true,
        maxOnePerSubcategory: false,
    },
    {
        id: 'agoda-seasonal-payday',
        vendor: 'agoda',
        name: 'Payday Sale',
        groupType: 'SEASONAL',
        defaultPct: 12,
        allowStack: true,
        maxOneInGroup: true,
        maxOnePerSubcategory: false,
    },
    {
        id: 'agoda-seasonal-night-owl',
        vendor: 'agoda',
        name: 'Night Owl Sale',
        groupType: 'SEASONAL',
        defaultPct: 10,
        allowStack: true,
        maxOneInGroup: true,
        maxOnePerSubcategory: false,
    },
    {
        id: 'agoda-seasonal-summer',
        vendor: 'agoda',
        name: 'Summer Vibes',
        groupType: 'SEASONAL',
        defaultPct: 15,
        allowStack: true,
        maxOneInGroup: true,
        maxOnePerSubcategory: false,
    },
    {
        id: 'agoda-seasonal-abroad',
        vendor: 'agoda',
        name: 'Deals Abroad',
        groupType: 'SEASONAL',
        defaultPct: 12,
        allowStack: true,
        maxOneInGroup: true,
        maxOnePerSubcategory: false,
    },

    // B) ESSENTIAL (stackable)
    {
        id: 'agoda-essential-early-bird',
        vendor: 'agoda',
        name: 'Early Bird',
        groupType: 'ESSENTIAL',
        defaultPct: 10,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: false,
    },
    {
        id: 'agoda-essential-last-minute',
        vendor: 'agoda',
        name: 'Last-Minute',
        groupType: 'ESSENTIAL',
        defaultPct: 8,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: false,
    },
    {
        id: 'agoda-essential-long-stay',
        vendor: 'agoda',
        name: 'Long Stay',
        groupType: 'ESSENTIAL',
        defaultPct: 15,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: false,
    },
    {
        id: 'agoda-essential-occupancy',
        vendor: 'agoda',
        name: 'Occupancy Promotion',
        groupType: 'ESSENTIAL',
        defaultPct: 10,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: false,
    },
    {
        id: 'agoda-essential-customized',
        vendor: 'agoda',
        name: 'Customized',
        groupType: 'ESSENTIAL',
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: false,
    },

    // C) TARGETED (max 1 per subcategory)
    {
        id: 'agoda-targeted-vip-silver',
        vendor: 'agoda',
        name: 'VIP Silver',
        groupType: 'TARGETED',
        subCategory: 'LOYALTY',
        defaultPct: 5,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true,
    },
    {
        id: 'agoda-targeted-vip-gold',
        vendor: 'agoda',
        name: 'VIP Gold',
        groupType: 'TARGETED',
        subCategory: 'LOYALTY',
        defaultPct: 10,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true,
    },
    {
        id: 'agoda-targeted-vip-platinum',
        vendor: 'agoda',
        name: 'VIP Platinum',
        groupType: 'TARGETED',
        subCategory: 'LOYALTY',
        defaultPct: 15,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true,
    },
    {
        id: 'agoda-targeted-mobile',
        vendor: 'agoda',
        name: 'Mobile Users',
        groupType: 'TARGETED',
        subCategory: 'PLATFORM',
        defaultPct: 8,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true,
    },
    {
        id: 'agoda-targeted-geo',
        vendor: 'agoda',
        name: 'Country/Geo Target',
        groupType: 'TARGETED',
        subCategory: 'GEOGRAPHY',
        defaultPct: 10,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true,
    },
    {
        id: 'agoda-targeted-package',
        vendor: 'agoda',
        name: 'Package / Bundle',
        groupType: 'TARGETED',
        subCategory: 'PRODUCT',
        defaultPct: 12,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true,
    },
    {
        id: 'agoda-targeted-beds',
        vendor: 'agoda',
        name: 'Beds Network',
        groupType: 'TARGETED',
        subCategory: 'BEDS_NETWORK',
        defaultPct: 10,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true,
    },
];

// =============================================================================
// BOOKING.COM PROMOTIONS
// Stacking: Progressive (discount on discounted price)
// Structure: GENIUS (Loyalty) + VISIBILITY (Mobile/Country) + TACTICAL (Timing)
// =============================================================================
export const BOOKING_COM_PROMOTIONS: PromotionCatalogItem[] = [
    // A) GENIUS - Loyalty Program (max 1 level)
    {
        id: 'booking-genius-level1',
        vendor: 'booking',
        name: 'Genius Level 1',
        groupType: 'TARGETED',
        subCategory: 'GENIUS',
        defaultPct: 10,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true, // Only 1 Genius level
    },
    {
        id: 'booking-genius-level2',
        vendor: 'booking',
        name: 'Genius Level 2',
        groupType: 'TARGETED',
        subCategory: 'GENIUS',
        defaultPct: 15,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true,
    },
    {
        id: 'booking-genius-level3',
        vendor: 'booking',
        name: 'Genius Level 3',
        groupType: 'TARGETED',
        subCategory: 'GENIUS',
        defaultPct: 20,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true,
    },

    // B) VISIBILITY - Platform & Geo targeting
    {
        id: 'booking-mobile-rate',
        vendor: 'booking',
        name: 'Mobile Rate',
        groupType: 'TARGETED',
        subCategory: 'PLATFORM',
        defaultPct: 10,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true,
    },
    {
        id: 'booking-country-rate',
        vendor: 'booking',
        name: 'Country Rate',
        groupType: 'TARGETED',
        subCategory: 'GEOGRAPHY',
        defaultPct: 10,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true,
    },

    // C) TACTICAL - Time-based promotions
    {
        id: 'booking-early-booker',
        vendor: 'booking',
        name: 'Early Booker Deal',
        groupType: 'SEASONAL',
        defaultPct: 15,
        allowStack: true,
        maxOneInGroup: true, // Only 1 tactical timing promo
        maxOnePerSubcategory: false,
    },
    {
        id: 'booking-last-minute',
        vendor: 'booking',
        name: 'Last Minute Deal',
        groupType: 'SEASONAL',
        defaultPct: 15,
        allowStack: true,
        maxOneInGroup: true,
        maxOnePerSubcategory: false,
    },
    {
        id: 'booking-secret-deal',
        vendor: 'booking',
        name: 'Secret Deal',
        groupType: 'ESSENTIAL',
        defaultPct: 10,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: false,
    },
    {
        id: 'booking-basic-deal',
        vendor: 'booking',
        name: 'Basic Deal',
        groupType: 'ESSENTIAL',
        defaultPct: 10,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: false,
    },
    {
        id: 'booking-free-nights',
        vendor: 'booking',
        name: 'Free Nights Deal',
        groupType: 'ESSENTIAL',
        subCategory: 'FREE_NIGHTS',
        defaultPct: 25, // e.g., Stay 4 Pay 3 = 25%
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true,
    },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

// Get all promotions for a vendor
export function getPromotionsByVendor(vendor: 'agoda' | 'booking'): PromotionCatalogItem[] {
    if (vendor === 'agoda') return AGODA_PROMOTIONS;
    if (vendor === 'booking') return BOOKING_COM_PROMOTIONS;
    return [];
}

// Get promotions by group for a vendor
export function getPromotionsByGroup(group: PromotionGroup, vendor?: string): PromotionCatalogItem[] {
    const all = vendor === 'booking'
        ? BOOKING_COM_PROMOTIONS
        : vendor === 'agoda'
            ? AGODA_PROMOTIONS
            : [...AGODA_PROMOTIONS, ...BOOKING_COM_PROMOTIONS];
    return all.filter(p => p.groupType === group);
}

// Get unique subcategories for a vendor
export function getTargetedSubcategories(vendor?: string): string[] {
    const promos = vendor === 'booking'
        ? BOOKING_COM_PROMOTIONS
        : vendor === 'agoda'
            ? AGODA_PROMOTIONS
            : [...AGODA_PROMOTIONS, ...BOOKING_COM_PROMOTIONS];

    const subcats = new Set<string>();
    promos
        .filter(p => p.groupType === 'TARGETED' && p.subCategory)
        .forEach(p => subcats.add(p.subCategory!));
    return Array.from(subcats);
}

// Group color mapping
export const GROUP_COLORS: Record<PromotionGroup, { bg: string; text: string; label: string }> = {
    SEASONAL: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Seasonal' },
    ESSENTIAL: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Essential' },
    TARGETED: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Targeted' },
};

// Vendor-specific group labels
export const VENDOR_GROUP_LABELS: Record<string, Record<PromotionGroup, string>> = {
    agoda: {
        SEASONAL: 'Seasonal (Theo mùa)',
        ESSENTIAL: 'Essential (Cơ bản)',
        TARGETED: 'Targeted (Mục tiêu)',
    },
    booking: {
        SEASONAL: 'Tactical (Thời điểm)',
        ESSENTIAL: 'Basic Deals',
        TARGETED: 'Genius & Visibility',
    },
};

