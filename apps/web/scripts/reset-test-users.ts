/**
 * Reset Test Users Script
 * Xóa tất cả users và hotel_users NGOẠI TRỪ admin email
 * Usage: npx tsx scripts/reset-test-users.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Email admin được giữ lại
const PROTECTED_EMAIL = 'phan.le@vleisure.com'

async function main() {
    console.log('🔍 Finding test users to reset...')
    console.log(`⚠️  Protected email: ${PROTECTED_EMAIL}`)

    // Find users to delete (NOT the protected email)
    const usersToDelete = await prisma.user.findMany({
        where: {
            email: { not: PROTECTED_EMAIL },
        },
        select: { id: true, email: true },
    })

    console.log(`\n📊 Found ${usersToDelete.length} users to delete:`)
    usersToDelete.forEach((u) => console.log(`   - ${u.email}`))

    if (usersToDelete.length === 0) {
        console.log('✅ No test users to delete.')
        return
    }

    // Confirm
    console.log('\n⚠️  This will DELETE these users and their hotel associations!')
    console.log('Press Ctrl+C within 3 seconds to cancel...')
    await new Promise((resolve) => setTimeout(resolve, 3000))

    const userIds = usersToDelete.map((u) => u.id)

    // Delete in order to respect foreign keys
    console.log('\n🗑️  Deleting...')

    // 1. Delete HotelUser associations
    const deletedHotelUsers = await prisma.hotelUser.deleteMany({
        where: { user_id: { in: userIds } },
    })
    console.log(`   ✅ Deleted ${deletedHotelUsers.count} hotel_users`)

    // 2. Delete ProductEvents
    const deletedEvents = await prisma.productEvent.deleteMany({
        where: { user_id: { in: userIds } },
    })
    console.log(`   ✅ Deleted ${deletedEvents.count} product_events`)

    // 3. Delete Accounts (OAuth links)
    const deletedAccounts = await prisma.account.deleteMany({
        where: { userId: { in: userIds } },
    })
    console.log(`   ✅ Deleted ${deletedAccounts.count} accounts`)

    // 4. Delete Sessions
    const deletedSessions = await prisma.session.deleteMany({
        where: { userId: { in: userIds } },
    })
    console.log(`   ✅ Deleted ${deletedSessions.count} sessions`)

    // 5. Delete Users
    const deletedUsers = await prisma.user.deleteMany({
        where: { id: { in: userIds } },
    })
    console.log(`   ✅ Deleted ${deletedUsers.count} users`)

    console.log('\n🎉 Done! All test users have been reset.')
    console.log('💡 Now login with any email (except admin) to test /welcome flow.')
    console.log('⚠️  IMPORTANT: Clear browser cookies or use incognito for testing!')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
