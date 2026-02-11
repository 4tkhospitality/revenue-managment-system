// Seed Expedia Promotions + Update calc_type to SINGLE_DISCOUNT
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const EXPEDIA_PROMOTIONS = [
    {
        id: 'expedia-same-day',
        vendor: 'expedia',
        name: 'Same Day Deal',
        group_type: 'ESSENTIAL' as const,
        default_pct: 20,
        allow_stack: false,
        max_one_in_group: false,
        max_one_per_subcategory: false,
    },
    {
        id: 'expedia-early-booker',
        vendor: 'expedia',
        name: 'Early Booker Deal',
        group_type: 'ESSENTIAL' as const,
        default_pct: 15,
        allow_stack: false,
        max_one_in_group: false,
        max_one_per_subcategory: false,
    },
    {
        id: 'expedia-multi-night',
        vendor: 'expedia',
        name: 'Multi-Night Deal',
        group_type: 'ESSENTIAL' as const,
        default_pct: 10,
        allow_stack: false,
        max_one_in_group: false,
        max_one_per_subcategory: false,
    },
    {
        id: 'expedia-member-only',
        vendor: 'expedia',
        name: 'Member Only Deal',
        group_type: 'TARGETED' as const,
        sub_category: 'MEMBER',
        default_pct: 10,
        allow_stack: false,
        max_one_in_group: false,
        max_one_per_subcategory: false,
    },
    {
        id: 'expedia-mobile-rate',
        vendor: 'expedia',
        name: 'Mobile Rate',
        group_type: 'TARGETED' as const,
        sub_category: 'MOBILE',
        default_pct: 10,
        allow_stack: false,
        max_one_in_group: false,
        max_one_per_subcategory: false,
    },
    {
        id: 'expedia-package-rate',
        vendor: 'expedia',
        name: 'Package Rate',
        group_type: 'TARGETED' as const,
        sub_category: 'PACKAGE',
        default_pct: 18,
        allow_stack: false,
        max_one_in_group: false,
        max_one_per_subcategory: false,
    },
];

async function main() {
    console.log('=== Seeding Expedia Promotions ===');

    for (const promo of EXPEDIA_PROMOTIONS) {
        await prisma.promotionCatalog.upsert({
            where: { id: promo.id },
            update: { ...promo },
            create: { ...promo },
        });
        console.log(`  ✓ ${promo.id}: ${promo.name}`);
    }

    // Update Expedia channels calc_type to SINGLE_DISCOUNT
    const updated = await prisma.oTAChannel.updateMany({
        where: { code: 'expedia' },
        data: { calc_type: 'SINGLE_DISCOUNT' },
    });
    console.log(`\n=== Updated ${updated.count} Expedia channel(s) calc_type → SINGLE_DISCOUNT ===`);

    console.log('\n✅ Done!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
