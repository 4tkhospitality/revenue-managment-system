const { PrismaClient } = require('@prisma/client');

async function simulateAuth() {
    const prisma = new PrismaClient();
    const email = 'ngocphan99@gmail.com';

    try {
        console.log('🔍 Simulating auth JWT callback for:', email);
        console.log('');

        // This is exactly what auth.ts does in JWT callback  
        const user = await prisma.user.findUnique({
            where: { email: email },
            include: {
                hotel_users: {
                    include: {
                        hotel: {
                            select: { hotel_id: true, name: true }
                        }
                    }
                }
            }
        });

        if (!user) {
            console.log('❌ USER NOT FOUND - this causes empty accessibleHotels');
            return;
        }

        console.log('✅ User found in DB');
        console.log('   - ID:', user.id);
        console.log('   - Email:', user.email);
        console.log('   - Role:', user.role);
        console.log('   - is_active:', user.is_active);
        console.log('');

        // Exactly how auth.ts maps hotelUsers
        const accessibleHotels = user.hotel_users.map(hu => ({
            hotelId: hu.hotel_id,
            hotelName: hu.hotel.name,
            role: hu.role,
            isPrimary: hu.is_primary,
        }));

        console.log('📦 accessibleHotels array:');
        console.log(JSON.stringify(accessibleHotels, null, 2));
        console.log('');
        console.log('Length:', accessibleHotels.length);

        if (accessibleHotels.length === 0) {
            console.log('');
            console.log('⚠️ PROBLEM: accessibleHotels is EMPTY!');
            console.log('   This means hotel_users relation returned 0 records.');
            console.log('');
            console.log('   Checking hotel_users table directly...');

            const hotelUsers = await prisma.hotelUser.findMany({
                where: { user_id: user.id }
            });
            console.log('   HotelUser records:', hotelUsers.length);
            console.log('   Records:', JSON.stringify(hotelUsers, null, 2));
        } else {
            console.log('');
            console.log('✅ Hotels properly linked! Middleware should allow access.');
        }

    } catch (error) {
        console.error('❌ ERROR in query:', error);
    } finally {
        await prisma.$disconnect();
    }
}

simulateAuth();
