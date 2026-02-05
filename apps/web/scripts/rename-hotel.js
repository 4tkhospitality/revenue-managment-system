const { PrismaClient } = require('@prisma/client');

async function renameHotel() {
    const prisma = new PrismaClient();
    try {
        // Rename Sunset Sanato to Demo Hotel
        const updated = await prisma.hotel.update({
            where: { hotel_id: '123e4567-e89b-12d3-a456-426614174000' },
            data: { name: 'Demo Hotel' }
        });
        console.log('✅ Renamed hotel to:', updated.name);

        // List all hotels for verification
        const hotels = await prisma.hotel.findMany({
            select: { hotel_id: true, name: true }
        });
        console.log('\nAll hotels now:');
        hotels.forEach(h => console.log(`  - ${h.name} (${h.hotel_id})`));

    } finally {
        await prisma.$disconnect();
    }
}

renameHotel();
