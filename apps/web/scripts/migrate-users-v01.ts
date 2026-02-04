// Migration script: Create HotelUser records for existing users
// Run with: npx tsx scripts/migrate-users-v01.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting V01 User Migration...\n');

    // Step 1: Get all users with hotel_id (legacy assignment)
    const usersWithHotel = await prisma.user.findMany({
        where: {
            hotel_id: { not: null }
        },
        select: {
            id: true,
            email: true,
            hotel_id: true,
            role: true,
        }
    });

    console.log(`📊 Found ${usersWithHotel.length} users with legacy hotel_id\n`);

    // Step 2: Create HotelUser records
    let created = 0;
    let skipped = 0;

    for (const user of usersWithHotel) {
        // Check if HotelUser already exists
        const existing = await prisma.hotelUser.findUnique({
            where: {
                user_id_hotel_id: {
                    user_id: user.id,
                    hotel_id: user.hotel_id!,
                }
            }
        });

        if (existing) {
            console.log(`⏭️  Skipped: ${user.email} (already has HotelUser record)`);
            skipped++;
            continue;
        }

        // Create HotelUser with hotel_admin role
        await prisma.hotelUser.create({
            data: {
                user_id: user.id,
                hotel_id: user.hotel_id!,
                role: 'hotel_admin',  // Existing users become hotel_admin
                is_primary: true,
            }
        });

        console.log(`✅ Created: ${user.email} → hotel_admin (primary)`);
        created++;
    }

    console.log(`\n📈 Migration Summary:`);
    console.log(`   - Created: ${created} HotelUser records`);
    console.log(`   - Skipped: ${skipped} (already existed)`);

    // Step 3: Set super_admin by email
    const superAdminEmail = process.env.ADMIN_EMAIL || 'phan.le@vleisure.com';

    const superAdmin = await prisma.user.updateMany({
        where: { email: superAdminEmail },
        data: { role: 'super_admin' }
    });

    if (superAdmin.count > 0) {
        console.log(`\n👑 Set super_admin: ${superAdminEmail}`);
    } else {
        console.log(`\n⚠️  super_admin email not found: ${superAdminEmail}`);
    }

    // Step 4: Set all other users to viewer (neutral global role)
    const updated = await prisma.user.updateMany({
        where: {
            email: { not: superAdminEmail },
            role: { not: 'super_admin' }
        },
        data: { role: 'viewer' }
    });

    console.log(`📝 Set ${updated.count} users to global role: viewer`);

    console.log('\n✅ Migration complete!');
}

main()
    .catch((e) => {
        console.error('❌ Migration failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
