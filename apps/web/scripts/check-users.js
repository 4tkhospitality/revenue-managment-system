
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const totalUsers = await prisma.user.count();
        const inactiveUsersCount = await prisma.user.count({
            where: { is_active: false },
        });

        console.log(`📊 TOTAL USERS: ${totalUsers}`);
        console.log(`🔒 INACTIVE (LOCKED) USERS: ${inactiveUsersCount}`);

        if (inactiveUsersCount > 0) {
            console.log('\n--- List of Inactive Users ---');
            const inactiveUsers = await prisma.user.findMany({
                where: { is_active: false },
                select: { email: true, name: true, role: true, is_active: true, created_at: true },
                take: 10,
            });
            console.table(inactiveUsers);
        } else {
            console.log('\n✅ No locked users found.');
        }

        // Also list top 5 active users just to be sure
        console.log('\n--- Top 5 Active Users ---');
        const activeUsers = await prisma.user.findMany({
            where: { is_active: true },
            select: { email: true, name: true, role: true },
            take: 5,
            orderBy: { created_at: 'desc' }
        });
        console.table(activeUsers);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
