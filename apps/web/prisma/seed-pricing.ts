// V01.2: Seed Agoda Promotion Catalog
// Run with: npx ts-node prisma/seed-pricing.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const AGODA_PROMOTIONS = [
    // A) SEASONAL (max 1 per OTA)
    {
        id: 'agoda-seasonal-double-day',
        vendor: 'agoda',
        name: 'Double Day Sale',
        group_type: 'SEASONAL' as const,
        sub_category: null,
        default_pct: 15,
        allow_stack: true,
        max_one_in_group: true,
        max_one_per_subcategory: false,
    },
    {
        id: 'agoda-seasonal-payday',
        vendor: 'agoda',
        name: 'Payday Sale',
        group_type: 'SEASONAL' as const,
        sub_category: null,
        default_pct: 12,
        allow_stack: true,
        max_one_in_group: true,
        max_one_per_subcategory: false,
    },
    {
        id: 'agoda-seasonal-night-owl',
        vendor: 'agoda',
        name: 'Night Owl Sale',
        group_type: 'SEASONAL' as const,
        sub_category: null,
        default_pct: 10,
        allow_stack: true,
        max_one_in_group: true,
        max_one_per_subcategory: false,
    },
    {
        id: 'agoda-seasonal-summer',
        vendor: 'agoda',
        name: 'Summer Vibes',
        group_type: 'SEASONAL' as const,
        sub_category: null,
        default_pct: 15,
        allow_stack: true,
        max_one_in_group: true,
        max_one_per_subcategory: false,
    },
    {
        id: 'agoda-seasonal-abroad',
        vendor: 'agoda',
        name: 'Deals Abroad',
        group_type: 'SEASONAL' as const,
        sub_category: null,
        default_pct: 12,
        allow_stack: true,
        max_one_in_group: true,
        max_one_per_subcategory: false,
    },

    // B) ESSENTIAL (stackable)
    {
        id: 'agoda-essential-early-bird',
        vendor: 'agoda',
        name: 'Early Bird',
        group_type: 'ESSENTIAL' as const,
        sub_category: null,
        default_pct: 10,
        allow_stack: true,
        max_one_in_group: false,
        max_one_per_subcategory: false,
    },
    {
        id: 'agoda-essential-last-minute',
        vendor: 'agoda',
        name: 'Last-Minute',
        group_type: 'ESSENTIAL' as const,
        sub_category: null,
        default_pct: 8,
        allow_stack: true,
        max_one_in_group: false,
        max_one_per_subcategory: false,
    },
    {
        id: 'agoda-essential-long-stay',
        vendor: 'agoda',
        name: 'Long Stay',
        group_type: 'ESSENTIAL' as const,
        sub_category: null,
        default_pct: 15,
        allow_stack: true,
        max_one_in_group: false,
        max_one_per_subcategory: false,
    },
    {
        id: 'agoda-essential-occupancy',
        vendor: 'agoda',
        name: 'Occupancy Promotion',
        group_type: 'ESSENTIAL' as const,
        sub_category: null,
        default_pct: 10,
        allow_stack: true,
        max_one_in_group: false,
        max_one_per_subcategory: false,
    },
    {
        id: 'agoda-essential-customized',
        vendor: 'agoda',
        name: 'Customized',
        group_type: 'ESSENTIAL' as const,
        sub_category: null,
        default_pct: null, // User sets
        allow_stack: true,
        max_one_in_group: false,
        max_one_per_subcategory: false,
    },

    // C) TARGETED (max 1 per subcategory)
    {
        id: 'agoda-targeted-vip-silver',
        vendor: 'agoda',
        name: 'VIP Silver',
        group_type: 'TARGETED' as const,
        sub_category: 'LOYALTY',
        default_pct: 5,
        allow_stack: true,
        max_one_in_group: false,
        max_one_per_subcategory: true,
    },
    {
        id: 'agoda-targeted-vip-gold',
        vendor: 'agoda',
        name: 'VIP Gold',
        group_type: 'TARGETED' as const,
        sub_category: 'LOYALTY',
        default_pct: 10,
        allow_stack: true,
        max_one_in_group: false,
        max_one_per_subcategory: true,
    },
    {
        id: 'agoda-targeted-vip-platinum',
        vendor: 'agoda',
        name: 'VIP Platinum',
        group_type: 'TARGETED' as const,
        sub_category: 'LOYALTY',
        default_pct: 15,
        allow_stack: true,
        max_one_in_group: false,
        max_one_per_subcategory: true,
    },
    {
        id: 'agoda-targeted-mobile',
        vendor: 'agoda',
        name: 'Mobile Users',
        group_type: 'TARGETED' as const,
        sub_category: 'PLATFORM',
        default_pct: 8,
        allow_stack: true,
        max_one_in_group: false,
        max_one_per_subcategory: true,
    },
    {
        id: 'agoda-targeted-geo',
        vendor: 'agoda',
        name: 'Country/Geo Target',
        group_type: 'TARGETED' as const,
        sub_category: 'GEOGRAPHY',
        default_pct: 10,
        allow_stack: true,
        max_one_in_group: false,
        max_one_per_subcategory: true,
    },
    {
        id: 'agoda-targeted-package',
        vendor: 'agoda',
        name: 'Package / Bundle',
        group_type: 'TARGETED' as const,
        sub_category: 'PRODUCT',
        default_pct: 12,
        allow_stack: true,
        max_one_in_group: false,
        max_one_per_subcategory: true,
    },
    {
        id: 'agoda-targeted-beds',
        vendor: 'agoda',
        name: 'Beds Network',
        group_type: 'TARGETED' as const,
        sub_category: 'BEDS_NETWORK',
        default_pct: 10,
        allow_stack: true,
        max_one_in_group: false,
        max_one_per_subcategory: true,
    },
];

// =============================================================================
// BOOKING.COM PROMOTIONS (V01.6 - 2-Layer Architecture)
// Engine groupType: TARGETED | GENIUS | PORTFOLIO | CAMPAIGN
// Reference: Partner Hub stacking matrix + Extranet UI
// =============================================================================
const BOOKING_COM_PROMOTIONS = [
    // =========================================================================
    // A) TARGETED RATES — Mobile, Country, Business Bookers
    // =========================================================================
    {
        id: 'booking-mobile-rate',
        vendor: 'booking',
        name: 'Mobile Rate',
        description: 'Become a top pick for customers on their mobile phones',
        group_type: 'TARGETED' as const,
        sub_category: 'PLATFORM',
        default_pct: 10,
        allow_stack: true,
        max_one_in_group: false,
        max_one_per_subcategory: true,
    },
    {
        id: 'booking-country-rate',
        vendor: 'booking',
        name: 'Country Rate',
        description: 'Reach customers and increase revenue from a specific region',
        group_type: 'TARGETED' as const,
        sub_category: 'GEOGRAPHY',
        default_pct: 10,
        allow_stack: true,
        max_one_in_group: false,
        max_one_per_subcategory: true,
    },
    {
        id: 'booking-business-bookers',
        vendor: 'booking',
        name: 'Business Bookers',
        description: 'Attract corporate travelers with exclusive rates',
        group_type: 'TARGETED' as const,
        sub_category: 'BUSINESS_BOOKERS',
        default_pct: 10,
        allow_stack: false, // ⚠️ EXCLUSIVE — blocks ALL other discounts
        max_one_in_group: false,
        max_one_per_subcategory: true,
    },

    // =========================================================================
    // B) GENIUS (LOYALTY) — Booking.com loyalty program tiers
    // Always stacks with everything (even EXCLUSIVE campaigns)
    // =========================================================================
    {
        id: 'booking-genius-level1',
        vendor: 'booking',
        name: 'Genius Level 1',
        description: 'Discount for frequent Booking.com travelers',
        group_type: 'GENIUS' as const,
        sub_category: 'GENIUS',
        default_pct: 10,
        allow_stack: true,
        max_one_in_group: false,
        max_one_per_subcategory: true,
    },
    {
        id: 'booking-genius-level2',
        vendor: 'booking',
        name: 'Genius Level 2',
        description: 'Premium discount for VIP travelers',
        group_type: 'GENIUS' as const,
        sub_category: 'GENIUS',
        default_pct: 15,
        allow_stack: true,
        max_one_in_group: false,
        max_one_per_subcategory: true,
    },
    {
        id: 'booking-genius-level3',
        vendor: 'booking',
        name: 'Genius Level 3',
        description: 'Maximum discount for super VIP travelers',
        group_type: 'GENIUS' as const,
        sub_category: 'GENIUS',
        default_pct: 20,
        allow_stack: true,
        max_one_in_group: false,
        max_one_per_subcategory: true,
    },

    // =========================================================================
    // C) PORTFOLIO DEALS — Engine picks highest only (HIGHEST_WINS)
    // =========================================================================
    {
        id: 'booking-basic-deal',
        vendor: 'booking',
        name: 'Basic Deal',
        description: 'Customize a deal to suit your needs',
        group_type: 'PORTFOLIO' as const,
        sub_category: 'PORTFOLIO',
        default_pct: 10,
        allow_stack: true,
        max_one_in_group: false,
        max_one_per_subcategory: false,
    },
    {
        id: 'booking-last-minute',
        vendor: 'booking',
        name: 'Last-minute Deal',
        description: 'Fill any empty rooms you have left',
        group_type: 'PORTFOLIO' as const,
        sub_category: 'TIMING',
        default_pct: 10,
        allow_stack: true,
        max_one_in_group: false,
        max_one_per_subcategory: true,
    },
    {
        id: 'booking-early-booker',
        vendor: 'booking',
        name: 'Early Booker Deal',
        description: 'Be better prepared with more of your bookings made earlier',
        group_type: 'PORTFOLIO' as const,
        sub_category: 'TIMING',
        default_pct: 10,
        allow_stack: true,
        max_one_in_group: false,
        max_one_per_subcategory: true,
    },
    {
        id: 'booking-secret-deal',
        vendor: 'booking',
        name: 'Secret Deal',
        description: 'Closed user group discount',
        group_type: 'PORTFOLIO' as const,
        sub_category: 'SECRET',
        default_pct: 10,
        allow_stack: true,
        max_one_in_group: false,
        max_one_per_subcategory: true,
    },
    {
        id: 'booking-free-nights',
        vendor: 'booking',
        name: 'Free Nights Deal',
        description: 'Stay X nights, Pay Y (e.g. Stay 4 Pay 3)',
        group_type: 'PORTFOLIO' as const,
        sub_category: 'FREE_NIGHTS',
        default_pct: 25,
        allow_stack: true,
        max_one_in_group: false,
        max_one_per_subcategory: true,
    },

    // =========================================================================
    // D) CAMPAIGN / EXCLUSIVE DEALS — Seasonal + Deep Deals
    // =========================================================================
    {
        id: 'booking-campaign-early-2026',
        vendor: 'booking',
        name: 'Early 2026 Deal',
        description: 'Secure advance bookings and get the new year off to a strong start',
        group_type: 'CAMPAIGN' as const,
        sub_category: 'CAMPAIGN',
        default_pct: 20,
        allow_stack: false,
        max_one_in_group: true,
        max_one_per_subcategory: true,
    },
    {
        id: 'booking-campaign-getaway',
        vendor: 'booking',
        name: 'Getaway Deals',
        description: 'Boost visibility during peak travel seasons',
        group_type: 'CAMPAIGN' as const,
        sub_category: 'CAMPAIGN',
        default_pct: 15,
        allow_stack: false,
        max_one_in_group: true,
        max_one_per_subcategory: true,
    },
    {
        id: 'booking-campaign-late-escape',
        vendor: 'booking',
        name: 'Late Escape Deals',
        description: 'End of season promotional campaign',
        group_type: 'CAMPAIGN' as const,
        sub_category: 'CAMPAIGN',
        default_pct: 15,
        allow_stack: false,
        max_one_in_group: true,
        max_one_per_subcategory: true,
    },
    {
        id: 'booking-deep-limited-time',
        vendor: 'booking',
        name: 'Limited-time Deal',
        description: 'Boost your property in search results for 48 hours',
        group_type: 'CAMPAIGN' as const,
        sub_category: 'DEEP',
        default_pct: 30,
        allow_stack: false,
        max_one_in_group: true,
        max_one_per_subcategory: true,
    },
    {
        id: 'booking-deep-deal-of-day',
        vendor: 'booking',
        name: 'Deal of the Day',
        description: '24h flash sale with maximum visibility',
        group_type: 'CAMPAIGN' as const,
        sub_category: 'DEEP',
        default_pct: 15,
        allow_stack: false,
        max_one_in_group: true,
        max_one_per_subcategory: true,
    },
];

// =============================================================================
// TRAVELOKA PROMOTIONS (Progressive + Channel Rate)
// Reference: partner.traveloka.com
// =============================================================================
const TRAVELOKA_PROMOTIONS = [
    // =========================================================================
    // CHANNEL RATE - Traveloka-specific discount layer
    // =========================================================================
    {
        id: 'traveloka-channel-rate',
        vendor: 'traveloka',
        name: 'Channel Rate',
        description: 'Traveloka platform discount (applied before campaigns)',
        group_type: 'ESSENTIAL' as const,
        sub_category: 'CHANNEL',
        default_pct: 10,
        allow_stack: true,
        max_one_in_group: false,
        max_one_per_subcategory: true,
    },

    // =========================================================================
    // CAMPAIGN - Traveloka promotional campaigns
    // =========================================================================
    {
        id: 'traveloka-campaign-flash-sale',
        vendor: 'traveloka',
        name: 'Flash Sale',
        description: 'Limited time deep discount campaign',
        group_type: 'SEASONAL' as const,
        sub_category: 'CAMPAIGN',
        default_pct: 30,
        allow_stack: true,
        max_one_in_group: false,
        max_one_per_subcategory: true,
    },
    {
        id: 'traveloka-campaign-weekend',
        vendor: 'traveloka',
        name: 'Weekend Deals',
        description: 'Special weekend promotional rates',
        group_type: 'SEASONAL' as const,
        sub_category: 'CAMPAIGN',
        default_pct: 15,
        allow_stack: true,
        max_one_in_group: false,
        max_one_per_subcategory: true,
    },
    {
        id: 'traveloka-campaign-payday',
        vendor: 'traveloka',
        name: 'Payday Deals',
        description: 'Monthly payday promotional campaign',
        group_type: 'SEASONAL' as const,
        sub_category: 'CAMPAIGN',
        default_pct: 20,
        allow_stack: true,
        max_one_in_group: false,
        max_one_per_subcategory: true,
    },

    // =========================================================================
    // ESSENTIAL - Basic deals
    // =========================================================================
    {
        id: 'traveloka-early-bird',
        vendor: 'traveloka',
        name: 'Early Bird',
        description: 'Book 14+ days in advance',
        group_type: 'ESSENTIAL' as const,
        sub_category: null,
        default_pct: 10,
        allow_stack: true,
        max_one_in_group: false,
        max_one_per_subcategory: false,
    },
    {
        id: 'traveloka-last-minute',
        vendor: 'traveloka',
        name: 'Last Minute',
        description: 'Same day or next day booking',
        group_type: 'ESSENTIAL' as const,
        sub_category: null,
        default_pct: 15,
        allow_stack: true,
        max_one_in_group: false,
        max_one_per_subcategory: false,
    },
    {
        id: 'traveloka-long-stay',
        vendor: 'traveloka',
        name: 'Long Stay',
        description: 'Stay 5+ nights discount',
        group_type: 'ESSENTIAL' as const,
        sub_category: null,
        default_pct: 12,
        allow_stack: true,
        max_one_in_group: false,
        max_one_per_subcategory: false,
    },

    // =========================================================================
    // TARGETED - User segment targeting
    // =========================================================================
    {
        id: 'traveloka-mobile-rate',
        vendor: 'traveloka',
        name: 'Mobile Rate',
        description: 'Exclusive discount for Traveloka app users',
        group_type: 'TARGETED' as const,
        sub_category: 'PLATFORM',
        default_pct: 10,
        allow_stack: true,
        max_one_in_group: false,
        max_one_per_subcategory: true,
    },
    {
        id: 'traveloka-member-rate',
        vendor: 'traveloka',
        name: 'Member Rate',
        description: 'Exclusive discount for Traveloka members',
        group_type: 'TARGETED' as const,
        sub_category: 'LOYALTY',
        default_pct: 8,
        allow_stack: true,
        max_one_in_group: false,
        max_one_per_subcategory: true,
    },
    {
        id: 'traveloka-geo-rate',
        vendor: 'traveloka',
        name: 'Country Rate',
        description: 'Target specific markets',
        group_type: 'TARGETED' as const,
        sub_category: 'GEOGRAPHY',
        default_pct: 10,
        allow_stack: true,
        max_one_in_group: false,
        max_one_per_subcategory: true,
    },
];

// =============================================================================
// TRIP.COM / CTRIP PROMOTIONS (ADDITIVE Mode from 1/1/2024)
// Reference: ebooking.trip.com
// Note: Same "box" = pick 1, different boxes = stack (additive)
// =============================================================================
const TRIPCOM_PROMOTIONS = [
    // =========================================================================
    // REGULAR PROMOTIONS BOX - Pick 1 from this group
    // =========================================================================
    {
        id: 'tripcom-basic-deal',
        vendor: 'ctrip',
        name: 'Basic Deal',
        description: 'Standard discount for Trip.com users',
        group_type: 'ESSENTIAL' as const,
        sub_category: 'REGULAR',
        default_pct: 10,
        allow_stack: true, // Stacks with OTHER boxes, not same box
        max_one_in_group: false,
        max_one_per_subcategory: true, // Only 1 from REGULAR box
    },
    {
        id: 'tripcom-early-bird',
        vendor: 'ctrip',
        name: 'Early Bird',
        description: 'Book 14+ days in advance',
        group_type: 'ESSENTIAL' as const,
        sub_category: 'REGULAR',
        default_pct: 12,
        allow_stack: true,
        max_one_in_group: false,
        max_one_per_subcategory: true,
    },
    {
        id: 'tripcom-last-minute',
        vendor: 'ctrip',
        name: 'Last Minute',
        description: 'Fill rooms at last minute',
        group_type: 'ESSENTIAL' as const,
        sub_category: 'REGULAR',
        default_pct: 15,
        allow_stack: true,
        max_one_in_group: false,
        max_one_per_subcategory: true,
    },
    {
        id: 'tripcom-minimum-stay',
        vendor: 'ctrip',
        name: 'Minimum Stay',
        description: 'Discount for 3+ night stays',
        group_type: 'ESSENTIAL' as const,
        sub_category: 'REGULAR',
        default_pct: 10,
        allow_stack: true,
        max_one_in_group: false,
        max_one_per_subcategory: true,
    },
    {
        id: 'tripcom-offer-tonight',
        vendor: 'ctrip',
        name: 'Offer For Tonight',
        description: 'Same-day booking flash deal',
        group_type: 'ESSENTIAL' as const,
        sub_category: 'REGULAR',
        default_pct: 20,
        allow_stack: true,
        max_one_in_group: false,
        max_one_per_subcategory: true,
    },

    // =========================================================================
    // TARGETING DEALS BOX - Pick 1 from this group
    // =========================================================================
    {
        id: 'tripcom-mobile-rate',
        vendor: 'ctrip',
        name: 'Mobile Rate',
        description: 'Exclusive for Trip.com app users',
        group_type: 'TARGETED' as const,
        sub_category: 'TARGETING',
        default_pct: 10,
        allow_stack: true,
        max_one_in_group: false,
        max_one_per_subcategory: true, // Only 1 from TARGETING box
    },
    {
        id: 'tripcom-xpos',
        vendor: 'ctrip',
        name: 'XPOS Rate',
        description: 'Cross-border point of sale rate',
        group_type: 'TARGETED' as const,
        sub_category: 'TARGETING',
        default_pct: 8,
        allow_stack: true,
        max_one_in_group: false,
        max_one_per_subcategory: true,
    },
    {
        id: 'tripcom-tripplus',
        vendor: 'ctrip',
        name: 'TripPlus',
        description: 'Loyalty program member discount',
        group_type: 'TARGETED' as const,
        sub_category: 'TARGETING',
        default_pct: 10,
        allow_stack: true,
        max_one_in_group: false,
        max_one_per_subcategory: true,
    },

    // =========================================================================
    // CAMPAIGN BOX - Seasonal campaigns (standalone)
    // =========================================================================
    {
        id: 'tripcom-campaign-2026',
        vendor: 'ctrip',
        name: 'Trip.com 2026 Campaign',
        description: 'Seasonal promotional campaign',
        group_type: 'SEASONAL' as const,
        sub_category: 'CAMPAIGN',
        default_pct: 20,
        allow_stack: true,
        max_one_in_group: false,
        max_one_per_subcategory: true,
    },

    // =========================================================================
    // PACKAGE BOX - Bundle deals (standalone)
    // =========================================================================
    {
        id: 'tripcom-package',
        vendor: 'ctrip',
        name: 'Package Deal',
        description: 'Flight + Hotel bundle discount',
        group_type: 'ESSENTIAL' as const,
        sub_category: 'PACKAGE',
        default_pct: 15,
        allow_stack: true,
        max_one_in_group: false,
        max_one_per_subcategory: true,
    },
    {
        id: 'tripcom-geo-rate',
        vendor: 'ctrip',
        name: 'Country Rate',
        description: 'Target specific markets (China, Korea, etc)',
        group_type: 'TARGETED' as const,
        sub_category: 'GEOGRAPHY',
        default_pct: 10,
        allow_stack: true,
        max_one_in_group: false,
        max_one_per_subcategory: true,
    },
];

// =============================================================================
// EXPEDIA PROMOTIONS (ISOLATED Mode - No Stacking)
// Reference: expediagroup.com/partner-central
// Note: Each promotion creates a SEPARATE rate plan, no stacking
// =============================================================================
const EXPEDIA_PROMOTIONS = [
    {
        id: 'expedia-member-only',
        vendor: 'expedia',
        name: 'Member Only Deal',
        description: 'Exclusive rate for Expedia members (min 10% off)',
        group_type: 'TARGETED' as const,
        sub_category: 'MEMBER',
        default_pct: 10,
        allow_stack: false, // ISOLATED - no stacking
        max_one_in_group: false,
        max_one_per_subcategory: true,
    },
    {
        id: 'expedia-mobile-rate',
        vendor: 'expedia',
        name: 'Mobile Rate',
        description: 'Exclusive for Expedia app users',
        group_type: 'TARGETED' as const,
        sub_category: 'PLATFORM',
        default_pct: 10,
        allow_stack: false, // ISOLATED
        max_one_in_group: false,
        max_one_per_subcategory: true,
    },
    {
        id: 'expedia-geo-rate',
        vendor: 'expedia',
        name: 'Point of Sale Rate',
        description: 'Target specific countries/markets',
        group_type: 'TARGETED' as const,
        sub_category: 'GEOGRAPHY',
        default_pct: 12,
        allow_stack: false, // ISOLATED
        max_one_in_group: false,
        max_one_per_subcategory: true,
    },
    {
        id: 'expedia-early-bird',
        vendor: 'expedia',
        name: 'Pay Now Rate',
        description: 'Book and pay in advance discount',
        group_type: 'ESSENTIAL' as const,
        sub_category: null,
        default_pct: 15,
        allow_stack: false, // ISOLATED
        max_one_in_group: false,
        max_one_per_subcategory: false,
    },
    {
        id: 'expedia-same-day',
        vendor: 'expedia',
        name: 'Same Day Deal',
        description: 'Last-minute same day booking rate',
        group_type: 'ESSENTIAL' as const,
        sub_category: null,
        default_pct: 20,
        allow_stack: false, // ISOLATED
        max_one_in_group: false,
        max_one_per_subcategory: false,
    },
    {
        id: 'expedia-package',
        vendor: 'expedia',
        name: 'Package Rate',
        description: 'Flight + Hotel bundle exclusive rate',
        group_type: 'ESSENTIAL' as const,
        sub_category: 'PACKAGE',
        default_pct: 18,
        allow_stack: false, // ISOLATED
        max_one_in_group: false,
        max_one_per_subcategory: true,
    },
    {
        id: 'expedia-reward-silver',
        vendor: 'expedia',
        name: 'Rewards Silver',
        description: 'Silver tier loyalty member rate',
        group_type: 'TARGETED' as const,
        sub_category: 'LOYALTY',
        default_pct: 10,
        allow_stack: false, // ISOLATED
        max_one_in_group: false,
        max_one_per_subcategory: true,
    },
    {
        id: 'expedia-reward-gold',
        vendor: 'expedia',
        name: 'Rewards Gold',
        description: 'Gold tier loyalty member rate',
        group_type: 'TARGETED' as const,
        sub_category: 'LOYALTY',
        default_pct: 15,
        allow_stack: false, // ISOLATED
        max_one_in_group: false,
        max_one_per_subcategory: true,
    },
];

async function main() {
    console.log('🌱 Seeding OTA Promotion Catalogs...\n');

    // Seed Agoda promotions
    console.log('📗 Seeding Agoda Promotions...');
    for (const promo of AGODA_PROMOTIONS) {
        await prisma.promotionCatalog.upsert({
            where: { id: promo.id },
            update: promo,
            create: promo,
        });
        console.log(`  ✓ ${promo.name}`);
    }
    console.log(`  → ${AGODA_PROMOTIONS.length} Agoda promotions\n`);

    // Seed Booking.com promotions
    console.log('📘 Seeding Booking.com Promotions...');
    for (const promo of BOOKING_COM_PROMOTIONS) {
        await prisma.promotionCatalog.upsert({
            where: { id: promo.id },
            update: promo,
            create: promo,
        });
        console.log(`  ✓ ${promo.name}`);
    }
    console.log(`  → ${BOOKING_COM_PROMOTIONS.length} Booking.com promotions\n`);

    // Seed Traveloka promotions
    console.log('📙 Seeding Traveloka Promotions...');
    for (const promo of TRAVELOKA_PROMOTIONS) {
        await prisma.promotionCatalog.upsert({
            where: { id: promo.id },
            update: promo,
            create: promo,
        });
        console.log(`  ✓ ${promo.name}`);
    }
    console.log(`  → ${TRAVELOKA_PROMOTIONS.length} Traveloka promotions\n`);

    // Seed Trip.com/Ctrip promotions
    console.log('📕 Seeding Trip.com/Ctrip Promotions...');
    for (const promo of TRIPCOM_PROMOTIONS) {
        await prisma.promotionCatalog.upsert({
            where: { id: promo.id },
            update: promo,
            create: promo,
        });
        console.log(`  ✓ ${promo.name}`);
    }
    console.log(`  → ${TRIPCOM_PROMOTIONS.length} Trip.com promotions\n`);

    // Seed Expedia promotions
    console.log('📒 Seeding Expedia Promotions...');
    for (const promo of EXPEDIA_PROMOTIONS) {
        await prisma.promotionCatalog.upsert({
            where: { id: promo.id },
            update: promo,
            create: promo,
        });
        console.log(`  ✓ ${promo.name}`);
    }
    console.log(`  → ${EXPEDIA_PROMOTIONS.length} Expedia promotions\n`);

    const total = AGODA_PROMOTIONS.length + BOOKING_COM_PROMOTIONS.length +
        TRAVELOKA_PROMOTIONS.length + TRIPCOM_PROMOTIONS.length +
        EXPEDIA_PROMOTIONS.length;
    console.log(`✅ Done! Total: ${total} promotions across 5 OTAs`);
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });


