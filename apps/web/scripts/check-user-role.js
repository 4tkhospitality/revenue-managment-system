const { PrismaClient } = require('@prisma/client');

async function checkUser() {
    const prisma = new PrismaClient();
    try {
        const user = await prisma.user.findUnique({
            where: { email: 'phan.le@vleisure.com' },
            select: { id: true, role: true, is_active: true, email: true }
        });
        console.log('User phan.le@vleisure.com:', JSON.stringify(user, null, 2));

        // Also check ngocphan99@gmail.com
        const user2 = await prisma.user.findUnique({
            where: { email: 'ngocphan99@gmail.com' },
            select: { id: true, role: true, is_active: true, email: true }
        });
        console.log('User ngocphan99@gmail.com:', JSON.stringify(user2, null, 2));
    } finally {
        await prisma.$disconnect();
    }
}

checkUser();
