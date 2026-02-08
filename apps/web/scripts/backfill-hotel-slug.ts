/**
 * Backfill script: Generate slugs for existing hotels
 * Run once after migration: npx tsx scripts/backfill-hotel-slug.ts
 */
import { PrismaClient } from '@prisma/client'
import { generateSlug } from '../lib/utils/slug'

const prisma = new PrismaClient()

async function main() {
    console.log('🔍 Finding hotels without slugs...')

    const hotels = await prisma.hotel.findMany({
        where: { slug: null },
        select: { hotel_id: true, name: true },
    })

    console.log(`📊 Found ${hotels.length} hotels to update`)

    let updated = 0
    let errors = 0

    for (const hotel of hotels) {
        try {
            const slug = generateSlug(hotel.name)

            await prisma.hotel.update({
                where: { hotel_id: hotel.hotel_id },
                data: { slug },
            })

            console.log(`✅ ${hotel.name} → ${slug}`)
            updated++
        } catch (error) {
            console.error(`❌ Failed to update ${hotel.name}:`, error)
            errors++
        }
    }

    console.log(`\n🎉 Done! Updated: ${updated}, Errors: ${errors}`)
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
