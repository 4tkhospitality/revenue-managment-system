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
// BOOKING.COM PROMOTIONS
// =============================================================================
const BOOKING_COM_PROMOTIONS = [
    // GENIUS - Loyalty Program
    {
        id: 'booking-genius-level1',
        vendor: 'booking',
        name: 'Genius Level 1',
        group_type: 'TARGETED' as const,
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
        group_type: 'TARGETED' as const,
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
        group_type: 'TARGETED' as const,
        sub_category: 'GENIUS',
        default_pct: 20,
        allow_stack: true,
        max_one_in_group: false,
        max_one_per_subcategory: true,
    },
    // VISIBILITY - Mobile & Country
    {
        id: 'booking-mobile-rate',
        vendor: 'booking',
        name: 'Mobile Rate',
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
        group_type: 'TARGETED' as const,
        sub_category: 'GEOGRAPHY',
        default_pct: 10,
        allow_stack: true,
        max_one_in_group: false,
        max_one_per_subcategory: true,
    },
    // TACTICAL - Time-based
    {
        id: 'booking-early-booker',
        vendor: 'booking',
        name: 'Early Booker Deal',
        group_type: 'SEASONAL' as const,
        sub_category: null,
        default_pct: 15,
        allow_stack: true,
        max_one_in_group: true,
        max_one_per_subcategory: false,
    },
    {
        id: 'booking-last-minute',
        vendor: 'booking',
        name: 'Last Minute Deal',
        group_type: 'SEASONAL' as const,
        sub_category: null,
        default_pct: 15,
        allow_stack: true,
        max_one_in_group: true,
        max_one_per_subcategory: false,
    },
    {
        id: 'booking-secret-deal',
        vendor: 'booking',
        name: 'Secret Deal',
        group_type: 'ESSENTIAL' as const,
        sub_category: null,
        default_pct: 10,
        allow_stack: true,
        max_one_in_group: false,
        max_one_per_subcategory: false,
    },
    {
        id: 'booking-basic-deal',
        vendor: 'booking',
        name: 'Basic Deal',
        group_type: 'ESSENTIAL' as const,
        sub_category: null,
        default_pct: 10,
        allow_stack: true,
        max_one_in_group: false,
        max_one_per_subcategory: false,
    },
    {
        id: 'booking-free-nights',
        vendor: 'booking',
        name: 'Free Nights Deal',
        group_type: 'ESSENTIAL' as const,
        sub_category: 'FREE_NIGHTS',
        default_pct: 25,
        allow_stack: true,
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

    console.log(`✅ Done! Total: ${AGODA_PROMOTIONS.length + BOOKING_COM_PROMOTIONS.length} promotions`);
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

