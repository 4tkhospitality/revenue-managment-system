const { PrismaClient } = require('@prisma/client');

async function fixDemoHotelRole() {
    const prisma = new PrismaClient();
    try {
        // Find user
        const user = await prisma.user.findFirst({
            where: { email: 'ngocphan99@gmail.com' }
        });

        if (!user) {
            console.log('User not found');
            return;
        }

        console.log('User ID:', user.id);

        // Find hotel user record
        const hotelUser = await prisma.hotelUser.findFirst({
            where: { user_id: user.id }
        });

        console.log('Current HotelUser:', hotelUser);

        if (hotelUser) {
            // Update role to manager so they can access /pricing
            await prisma.hotelUser.update({
                where: { id: hotelUser.id },
                data: { role: 'manager' }
            });
            console.log('✅ Updated role to manager');
        }

    } finally {
        await prisma.$disconnect();
    }
}

fixDemoHotelRole();
