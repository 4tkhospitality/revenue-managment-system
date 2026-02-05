const { PrismaClient } = require('@prisma/client');

async function listHotels() {
    const prisma = new PrismaClient();
    try {
        const hotels = await prisma.hotel.findMany({
            select: { hotel_id: true, name: true }
        });
        console.log('All hotels:');
        hotels.forEach(h => {
            console.log(`  - ${h.name}: ${h.hotel_id}`);
        });
    } finally {
        await prisma.$disconnect();
    }
}

listHotels();
