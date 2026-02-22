// V01.4: OTA Promotion Catalogs (Static)
// This is a reference for the UI - actual data comes from DB

import type { PromotionCatalogItem, PromotionGroup, CommissionBooster } from './types';

// =============================================================================
// AGODA COMMISSION BOOSTERS (Marketing Programs)
// These INCREASE effective commission (cost), not discounts
// All 3 can stack (bundle) per Agoda Partner Hub
// =============================================================================
export const AGODA_BOOSTERS: CommissionBooster[] = [
    {
        id: 'agoda-agp-basic',
        name: 'AGP Basic',
        program: 'AGP',
        boostPct: 10,
        tier: 'basic',
        enabled: false,
    },
    {
        id: 'agoda-agp-standard',
        name: 'AGP Standard',
        program: 'AGP',
        boostPct: 12,
        tier: 'standard',
        enabled: false,
    },
    {
        id: 'agoda-agp-premium',
        name: 'AGP Premium',
        program: 'AGP',
        boostPct: 15,
        tier: 'premium',
        enabled: false,
    },
    {
        id: 'agoda-agx',
        name: 'AGX (Growth Express)',
        program: 'AGX',
        boostPct: 5,
        enabled: false,
    },
    {
        id: 'agoda-sl',
        name: 'Sponsored Listing',
        program: 'SL',
        boostPct: 5,
        isVariable: true,
        enabled: false,
    },
];

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
// Categories: PORTFOLIO + TARGETED_RATE + GENIUS + CAMPAIGN
// Rules: Max 3 discounts, TARGETED ❌ TARGETED, TARGETED ❌ CAMPAIGN
// =============================================================================

// Booking.com commission booster (Preferred Partner)
export const BOOKING_BOOSTERS: CommissionBooster[] = [
    {
        id: 'booking-preferred',
        name: 'Preferred Partner',
        program: 'PREFERRED',
        boostPct: 0,
        isVariable: true, // User inputs %
        enabled: false,
    },
];

// =============================================================================
// EXPEDIA COMMISSION BOOSTERS (Marketing Programs)
// Accelerator: extra commission → higher sort order (pay-per-stay)
// B2B Uplift: +5% commission for EPS/TAAP channel bookings
// =============================================================================
export const EXPEDIA_BOOSTERS: CommissionBooster[] = [
    {
        id: 'expedia-accelerator',
        name: 'Accelerator',
        program: 'ACCELERATOR',
        boostPct: 5,
        isVariable: true, // Hotel chooses % boost
        enabled: false,
    },
    {
        id: 'expedia-b2b-uplift',
        name: 'B2B EPS/TAAP Uplift',
        program: 'ACCELERATOR',
        boostPct: 5,
        enabled: false,
    },
];

export const BOOKING_COM_PROMOTIONS: PromotionCatalogItem[] = [
    // ─── A) TARGETED RATES — Mobile & Country (mutual exclusive within sub) ──
    {
        id: 'booking-mobile-rate',
        vendor: 'booking',
        name: 'Mobile Rate',
        groupType: 'TARGETED',
        subCategory: 'TARGETED_RATE',
        defaultPct: 10,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true, // Mobile OR Country, not both
        stackBehavior: 'STACKABLE',
    },
    {
        id: 'booking-country-rate',
        vendor: 'booking',
        name: 'Country Rate',
        groupType: 'TARGETED',
        subCategory: 'TARGETED_RATE',
        defaultPct: 10,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true,
        stackBehavior: 'STACKABLE',
    },
    {
        id: 'booking-business-bookers',
        vendor: 'booking',
        name: 'Business Bookers',
        groupType: 'TARGETED',
        subCategory: 'BUSINESS_BOOKERS',
        defaultPct: 10,
        allowStack: false, // Exclusive — blocks ALL other discounts
        maxOneInGroup: false,
        maxOnePerSubcategory: true,
        stackBehavior: 'EXCLUSIVE',
    },

    // ─── B) GENIUS — Loyalty Program (max 1 level, stacks with everything) ──
    {
        id: 'booking-genius-level1',
        vendor: 'booking',
        name: 'Genius Level 1',
        groupType: 'GENIUS',
        subCategory: 'GENIUS',
        defaultPct: 10,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true, // Only 1 Genius level
        stackBehavior: 'STACKABLE',
    },
    {
        id: 'booking-genius-level2',
        vendor: 'booking',
        name: 'Genius Level 2',
        groupType: 'GENIUS',
        subCategory: 'GENIUS',
        defaultPct: 15,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true,
        stackBehavior: 'STACKABLE',
    },
    {
        id: 'booking-genius-level3',
        vendor: 'booking',
        name: 'Genius Level 3',
        groupType: 'GENIUS',
        subCategory: 'GENIUS',
        defaultPct: 20,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true,
        stackBehavior: 'STACKABLE',
    },

    // ─── C) PORTFOLIO DEALS — Engine picks highest only (HIGHEST_WINS) ──
    {
        id: 'booking-basic-deal',
        vendor: 'booking',
        name: 'Basic Deal',
        groupType: 'PORTFOLIO',
        defaultPct: 10,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: false,
        stackBehavior: 'HIGHEST_WINS',
    },
    {
        id: 'booking-secret-deal',
        vendor: 'booking',
        name: 'Secret Deal',
        groupType: 'PORTFOLIO',
        defaultPct: 10,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: false,
        stackBehavior: 'HIGHEST_WINS',
    },
    {
        id: 'booking-early-booker',
        vendor: 'booking',
        name: 'Early Booker Deal',
        groupType: 'PORTFOLIO',
        subCategory: 'TIMING',
        defaultPct: 15,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true, // Early Booker OR Last Minute
        stackBehavior: 'HIGHEST_WINS',
    },
    {
        id: 'booking-last-minute',
        vendor: 'booking',
        name: 'Last Minute Deal',
        groupType: 'PORTFOLIO',
        subCategory: 'TIMING',
        defaultPct: 15,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true,
        stackBehavior: 'HIGHEST_WINS',
    },
    {
        id: 'booking-free-nights',
        vendor: 'booking',
        name: 'Free Nights Deal',
        groupType: 'PORTFOLIO',
        subCategory: 'FREE_NIGHTS',
        defaultPct: 25, // Stay 4 Pay 3 = 1-(3/4) = 25%
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true,
        stackBehavior: 'HIGHEST_WINS',
        isFreeNights: true,
        freeNightsStay: 4,
        freeNightsPay: 3,
    },

    // ─── D) CAMPAIGN / EXCLUSIVE DEALS ──
    {
        id: 'booking-campaign-getaway',  // Must match seed-pricing.ts / DB
        vendor: 'booking',
        name: 'Getaway Deal',
        groupType: 'CAMPAIGN',
        defaultPct: 20,
        allowStack: false,
        maxOneInGroup: true,
        maxOnePerSubcategory: false,
        stackBehavior: 'ONLY_WITH_GENIUS', // "can be combined with Genius discounts, but no others"
    },
    {
        id: 'booking-campaign-late-escape',  // Must match seed-pricing.ts / DB
        vendor: 'booking',
        name: 'Late Escape Deal',
        groupType: 'CAMPAIGN',
        defaultPct: 15,
        allowStack: false,
        maxOneInGroup: true,
        maxOnePerSubcategory: false,
        stackBehavior: 'ONLY_WITH_GENIUS', // BA confirmed: Campaign Deals stack with Genius
    },
    {
        id: 'booking-black-friday',
        vendor: 'booking',
        name: 'Black Friday Deal',
        groupType: 'CAMPAIGN',
        defaultPct: 20,
        allowStack: false,
        maxOneInGroup: true,
        maxOnePerSubcategory: false,
        stackBehavior: 'EXCLUSIVE',
    },
    {
        id: 'booking-campaign-early-2026',  // Must match seed-pricing.ts / DB
        vendor: 'booking',
        name: 'Early 2026 Deal',
        groupType: 'CAMPAIGN',
        defaultPct: 15,
        allowStack: false,
        maxOneInGroup: true,
        maxOnePerSubcategory: false,
        stackBehavior: 'ONLY_WITH_GENIUS', // BA confirmed: stacks with Genius only
    },
    {
        id: 'booking-deep-deal-of-day',  // Must match seed-pricing.ts / DB
        vendor: 'booking',
        name: 'Deal of the Day',
        groupType: 'CAMPAIGN',
        subCategory: 'DEEP',
        defaultPct: 25,
        allowStack: false,
        maxOneInGroup: true,
        maxOnePerSubcategory: false,
        stackBehavior: 'EXCLUSIVE', // Deep Deal: blocks ALL including Genius
    },
    {
        id: 'booking-deep-limited-time',  // Was missing from catalog!
        vendor: 'booking',
        name: 'Limited-time Deal',
        groupType: 'CAMPAIGN',
        subCategory: 'DEEP',
        defaultPct: 30,
        allowStack: false,
        maxOneInGroup: true,
        maxOnePerSubcategory: false,
        stackBehavior: 'EXCLUSIVE', // Deep Deal: blocks ALL including Genius
    },
];

// =============================================================================
// EXPEDIA PROMOTIONS
// Stacking: NONE — each deal creates a separate rate plan, only 1 applies per booking
// Engine mode: SINGLE_DISCOUNT (pick highest eligible deal)
// =============================================================================
export const EXPEDIA_PROMOTIONS: PromotionCatalogItem[] = [
    // ─── DEALS ─── Each is standalone, doesn't stack with others
    {
        id: 'expedia-same-day',
        vendor: 'expedia',
        name: 'Same Day Deal',
        groupType: 'ESSENTIAL',
        defaultPct: 20,
        allowStack: false,
        maxOneInGroup: false,
        maxOnePerSubcategory: false,
    },
    {
        id: 'expedia-early-booker',
        vendor: 'expedia',
        name: 'Early Booker Deal',
        groupType: 'ESSENTIAL',
        defaultPct: 15,
        allowStack: false,
        maxOneInGroup: false,
        maxOnePerSubcategory: false,
    },
    {
        id: 'expedia-multi-night',
        vendor: 'expedia',
        name: 'Multi-Night Deal',
        groupType: 'ESSENTIAL',
        defaultPct: 10,
        allowStack: false,
        maxOneInGroup: false,
        maxOnePerSubcategory: false,
    },
    {
        id: 'expedia-member-only',
        vendor: 'expedia',
        name: 'Member Only Deal',
        groupType: 'TARGETED',
        subCategory: 'MEMBER',
        defaultPct: 10,
        allowStack: false,
        maxOneInGroup: false,
        maxOnePerSubcategory: false,
    },
    {
        id: 'expedia-mobile-rate',
        vendor: 'expedia',
        name: 'Mobile Rate',
        groupType: 'TARGETED',
        subCategory: 'MOBILE',
        defaultPct: 10,
        allowStack: false,
        maxOneInGroup: false,
        maxOnePerSubcategory: false,
    },
    {
        id: 'expedia-package-rate',
        vendor: 'expedia',
        name: 'Package Rate',
        groupType: 'TARGETED',
        subCategory: 'PACKAGE',
        defaultPct: 18,
        allowStack: false,
        maxOneInGroup: false,
        maxOnePerSubcategory: false,
    },
];

// =============================================================================
// TRIP.COM / CTRIP PROMOTIONS
// 7-Box Model (per Trip.com Partner Center docs):
//   Box 1: Deal Box (pick 1) — Basic Deal, Early Bird, Last Minute, etc.
//   Box 2: Targeting (pick 1) — Mobile Rate, XPOS
//   Box 3: Package (pick 1)
//   Box 4: Campaign (pick 1) — exclusive by default (configurable)
//   Box 5: TripPlus (pick 1) — Member Program
//   Box 6: Smart Choice (pick 1)
//   Box 7: CoinPlus (pick 1) — priceImpact=false (coin-back, not price discount)
// Stacking: Additive across boxes, pick 1 within each box
// Engine mode: ADDITIVE (18% commission)
// =============================================================================
export const CTRIP_PROMOTIONS: PromotionCatalogItem[] = [
    // ─── Box 1: Deal Box (non-stackable within, stackable with other boxes) ───
    {
        id: 'tripcom-basic-deal',
        vendor: 'ctrip',
        name: 'Basic Deal',
        groupType: 'ESSENTIAL',
        subCategory: 'DEAL_BOX',
        defaultPct: 10,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true,
        tripBox: 1,
    },
    {
        id: 'tripcom-early-bird',
        vendor: 'ctrip',
        name: 'Early Bird',
        groupType: 'ESSENTIAL',
        subCategory: 'DEAL_BOX',
        defaultPct: 12,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true,
        tripBox: 1,
    },
    {
        id: 'tripcom-last-minute',
        vendor: 'ctrip',
        name: 'Last Minute',
        groupType: 'ESSENTIAL',
        subCategory: 'DEAL_BOX',
        defaultPct: 15,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true,
        tripBox: 1,
    },
    {
        id: 'tripcom-minimum-stay',
        vendor: 'ctrip',
        name: 'Minimum Stay',
        groupType: 'ESSENTIAL',
        subCategory: 'DEAL_BOX',
        defaultPct: 10,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true,
        tripBox: 1,
    },
    {
        id: 'tripcom-offer-tonight',
        vendor: 'ctrip',
        name: 'Offer For Tonight',
        groupType: 'ESSENTIAL',
        subCategory: 'DEAL_BOX',
        defaultPct: 20,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true,
        tripBox: 1,
    },
    {
        id: 'tripcom-new-property',
        vendor: 'ctrip',
        name: 'New Property Deal',
        groupType: 'ESSENTIAL',
        subCategory: 'DEAL_BOX',
        defaultPct: 15,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true,
        tripBox: 1,
    },

    // ─── Box 2: Targeting (non-stackable within) ───
    {
        id: 'tripcom-mobile-rate',
        vendor: 'ctrip',
        name: 'Mobile Rate',
        groupType: 'TARGETED',
        subCategory: 'TARGETING',
        defaultPct: 10,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true,
        tripBox: 2,
    },
    {
        id: 'tripcom-xpos',
        vendor: 'ctrip',
        name: 'XPOS Rate',
        groupType: 'TARGETED',
        subCategory: 'TARGETING',
        defaultPct: 8,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true,
        tripBox: 2,
    },

    // ─── Box 3: Package ───
    {
        id: 'tripcom-package',
        vendor: 'ctrip',
        name: 'Package Deal',
        groupType: 'ESSENTIAL',
        subCategory: 'PACKAGE',
        defaultPct: 15,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true,
        tripBox: 3,
    },

    // ─── Box 4: Campaign (exclusive by default, configurable via TRIP_CAMPAIGN_MODE) ───
    {
        id: 'tripcom-campaign-2026',
        vendor: 'ctrip',
        name: 'Trip.com 2026 Campaign',
        groupType: 'CAMPAIGN',
        defaultPct: 20,
        allowStack: false,
        maxOneInGroup: true,
        maxOnePerSubcategory: true,
        stackBehavior: 'EXCLUSIVE',
        tripBox: 4,
    },

    // ─── Box 5: TripPlus (Member Program) ───
    {
        id: 'tripcom-tripplus',
        vendor: 'ctrip',
        name: 'TripPlus',
        groupType: 'TARGETED',
        subCategory: 'TRIPPLUS',
        defaultPct: 10,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true,
        tripBox: 5,
    },

    // ─── Box 6: Smart Choice (Smart-C) ───
    {
        id: 'tripcom-smart-choice',
        vendor: 'ctrip',
        name: 'Smart Choice',
        groupType: 'TARGETED',
        subCategory: 'SMART_CHOICE',
        defaultPct: 8,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true,
        tripBox: 6,
    },

    // ─── Box 7: CoinPlus (coin-back reward, NOT price discount) ───
    {
        id: 'tripcom-coinplus',
        vendor: 'ctrip',
        name: 'CoinPlus',
        groupType: 'TARGETED',
        subCategory: 'COINPLUS',
        defaultPct: 5,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true,
        tripBox: 7,
        priceImpact: false, // Coin-back reward: shown as benefit but NOT subtracted from price
    },

    // ─── Geo Rate (standalone, stacks with all boxes) ───
    {
        id: 'tripcom-geo-rate',
        vendor: 'ctrip',
        name: 'Country Rate',
        groupType: 'TARGETED',
        subCategory: 'GEOGRAPHY',
        defaultPct: 10,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true,
        tripBox: 2, // Same box as targeting (Mobile/XPOS/Geo pick 1)
    },
];

// =============================================================================
// TRAVELOKA PROMOTIONS (TERA — Traveloka Extra Revenue Accelerator)
// Two types: Campaign (Traveloka-led) and Basic (hotel-customized)
// Stacking: ADDITIVE
//   - Campaign can stack with Basic promotions, NOT with other campaigns
//   - Basic can stack with other Basic promotions + up to 1 campaign
//   - Rate Channels (Mobile, Priority User) are separate — additive on top
//   - Promotion Stacking must be opted-in per promotion
// Engine mode: ADDITIVE (commission typically 18%)
// =============================================================================
export const TRAVELOKA_PROMOTIONS: PromotionCatalogItem[] = [
    // ─── Campaign Promotions (Traveloka-led, exclusive among campaigns) ───
    {
        id: 'traveloka-epic-sale',
        vendor: 'traveloka',
        name: 'Epic Sale',
        groupType: 'CAMPAIGN',
        subCategory: 'CAMPAIGN',
        defaultPct: 5,
        allowStack: true,           // Can stack with Basic
        maxOneInGroup: true,        // Only 1 campaign at a time
        maxOnePerSubcategory: true,
        stackBehavior: 'EXCLUSIVE', // Campaign doesn't stack with other campaigns
    },
    {
        id: 'traveloka-special-sale',
        vendor: 'traveloka',
        name: 'Special Sale',
        groupType: 'CAMPAIGN',
        subCategory: 'CAMPAIGN',
        defaultPct: 10,
        allowStack: true,
        maxOneInGroup: true,
        maxOnePerSubcategory: true,
        stackBehavior: 'EXCLUSIVE',
    },
    {
        id: 'traveloka-payday-sale',
        vendor: 'traveloka',
        name: 'Payday Sale',
        groupType: 'CAMPAIGN',
        subCategory: 'CAMPAIGN',
        defaultPct: 8,
        allowStack: true,
        maxOneInGroup: true,
        maxOnePerSubcategory: true,
        stackBehavior: 'EXCLUSIVE',
    },

    // ─── Basic Promotions (hotel-customized, stackable with each other) ───
    {
        id: 'traveloka-early-bird',
        vendor: 'traveloka',
        name: 'Early Bird',
        groupType: 'ESSENTIAL',
        subCategory: 'BASIC',
        defaultPct: 10,
        allowStack: true,           // Stacks with other basics + 1 campaign
        maxOneInGroup: false,
        maxOnePerSubcategory: false, // Multiple basics can coexist
    },
    {
        id: 'traveloka-last-minute',
        vendor: 'traveloka',
        name: 'Last Minute',
        groupType: 'ESSENTIAL',
        subCategory: 'BASIC',
        defaultPct: 15,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: false,
    },
    {
        id: 'traveloka-customized-deal',
        vendor: 'traveloka',
        name: 'Customized Deal',
        groupType: 'ESSENTIAL',
        subCategory: 'BASIC',
        defaultPct: 10,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: false,
    },
    {
        id: 'traveloka-extra-benefit',
        vendor: 'traveloka',
        name: 'Extra Benefit Promotion',
        groupType: 'ESSENTIAL',
        subCategory: 'BASIC',
        defaultPct: 5,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: false,
    },

    // ─── Targeting / Rate Channel (additive, pick 1 per sub) ───
    {
        id: 'traveloka-mobile-rate',
        vendor: 'traveloka',
        name: 'Mobile Exclusive',
        groupType: 'TARGETED',
        subCategory: 'MOBILE',
        defaultPct: 5,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true,
    },
    {
        id: 'traveloka-priority-user',
        vendor: 'traveloka',
        name: 'Silver Priority User',
        groupType: 'TARGETED',
        subCategory: 'PRIORITY',
        defaultPct: 5,
        allowStack: true,
        maxOneInGroup: false,
        maxOnePerSubcategory: true,
    },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

// Get all promotions for a vendor
export function getPromotionsByVendor(vendor: 'agoda' | 'booking' | 'expedia' | 'ctrip' | 'traveloka'): PromotionCatalogItem[] {
    if (vendor === 'agoda') return AGODA_PROMOTIONS;
    if (vendor === 'booking') return BOOKING_COM_PROMOTIONS;
    if (vendor === 'expedia') return EXPEDIA_PROMOTIONS;
    if (vendor === 'ctrip') return CTRIP_PROMOTIONS;
    if (vendor === 'traveloka') return TRAVELOKA_PROMOTIONS;
    return [];
}

// Look up stackBehavior from static catalog by promo ID
const _catalogMap = new Map<string, PromotionCatalogItem>();
[...AGODA_PROMOTIONS, ...BOOKING_COM_PROMOTIONS, ...EXPEDIA_PROMOTIONS, ...CTRIP_PROMOTIONS, ...TRAVELOKA_PROMOTIONS].forEach(p => _catalogMap.set(p.id, p));

export function getCatalogItem(promoId: string): PromotionCatalogItem | undefined {
    return _catalogMap.get(promoId);
}

// Get promotions by group for a vendor
export function getPromotionsByGroup(group: PromotionGroup, vendor?: string): PromotionCatalogItem[] {
    const all = vendor === 'booking'
        ? BOOKING_COM_PROMOTIONS
        : vendor === 'agoda'
            ? AGODA_PROMOTIONS
            : vendor === 'expedia'
                ? EXPEDIA_PROMOTIONS
                : vendor === 'traveloka'
                    ? TRAVELOKA_PROMOTIONS
                    : [...AGODA_PROMOTIONS, ...BOOKING_COM_PROMOTIONS, ...EXPEDIA_PROMOTIONS, ...TRAVELOKA_PROMOTIONS];
    return all.filter(p => p.groupType === group);
}

// Get unique subcategories for a vendor
export function getTargetedSubcategories(vendor?: string): string[] {
    const promos = vendor === 'booking'
        ? BOOKING_COM_PROMOTIONS
        : vendor === 'agoda'
            ? AGODA_PROMOTIONS
            : vendor === 'expedia'
                ? EXPEDIA_PROMOTIONS
                : vendor === 'traveloka'
                    ? TRAVELOKA_PROMOTIONS
                    : [...AGODA_PROMOTIONS, ...BOOKING_COM_PROMOTIONS, ...EXPEDIA_PROMOTIONS, ...TRAVELOKA_PROMOTIONS];

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
    GENIUS: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Genius' },
    PORTFOLIO: { bg: 'bg-teal-100', text: 'text-teal-700', label: 'Portfolio' },
    CAMPAIGN: { bg: 'bg-rose-100', text: 'text-rose-700', label: 'Campaign' },
};

// Unified group labels across ALL vendors (no per-vendor variation)
export const VENDOR_GROUP_LABELS: Record<string, Record<PromotionGroup, string>> = {
    agoda: {
        SEASONAL: 'Seasonal',
        ESSENTIAL: 'Essential',
        TARGETED: 'Targeted',
        GENIUS: 'Genius',
        PORTFOLIO: 'Portfolio',
        CAMPAIGN: 'Campaign',
    },
    booking: {
        SEASONAL: 'Seasonal',
        ESSENTIAL: 'Essential',
        TARGETED: 'Targeted',
        GENIUS: 'Genius',
        PORTFOLIO: 'Portfolio',
        CAMPAIGN: 'Campaign',
    },
    expedia: {
        SEASONAL: 'Seasonal',
        ESSENTIAL: 'Essential',
        TARGETED: 'Targeted',
        GENIUS: 'Genius',
        PORTFOLIO: 'Portfolio',
        CAMPAIGN: 'Campaign',
    },
    ctrip: {
        SEASONAL: 'Seasonal',
        ESSENTIAL: 'Essential',
        TARGETED: 'Targeted',
        GENIUS: 'Genius',
        PORTFOLIO: 'Portfolio',
        CAMPAIGN: 'Campaign',
    },
    traveloka: {
        SEASONAL: 'Seasonal',
        ESSENTIAL: 'Basic',
        TARGETED: 'Rate Channel',
        GENIUS: 'Genius',
        PORTFOLIO: 'Portfolio',
        CAMPAIGN: 'Campaign',
    },
};

