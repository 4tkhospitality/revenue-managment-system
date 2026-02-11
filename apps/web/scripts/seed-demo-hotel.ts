// scripts/seed-demo-hotel.ts
// Run with: npx ts-node --skip-project scripts/seed-demo-hotel.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEMO_HOTEL_NAME = 'Demo Hotel';

async function main() {
    console.log('🏨 Seeding Demo Hotel...\n');

    // Check if demo hotel exists
    let demoHotel = await prisma.hotel.findFirst({
        where: { name: DEMO_HOTEL_NAME },
    });

    if (demoHotel) {
        console.log('✅ Demo Hotel already exists:', demoHotel.hotel_id);
    } else {
        // Create demo hotel
        demoHotel = await prisma.hotel.create({
            data: {
                name: DEMO_HOTEL_NAME,
                timezone: 'Asia/Ho_Chi_Minh',
                capacity: 50,
                currency: 'VND',
            },
        });
        console.log('✅ Created Demo Hotel:', demoHotel.hotel_id);
    }

    // Seed OTA channels for demo hotel
    const existingChannels = await prisma.oTAChannel.count({
        where: { hotel_id: demoHotel.hotel_id },
    });

    if (existingChannels === 0) {
        const channels = [
            { name: 'Agoda', code: 'agoda', commission: 20, calc_type: 'ADDITIVE' as const },
            { name: 'Booking.com', code: 'booking', commission: 18, calc_type: 'PROGRESSIVE' as const },
            { name: 'Traveloka', code: 'traveloka', commission: 17, calc_type: 'PROGRESSIVE' as const },
            { name: 'Expedia', code: 'expedia', commission: 17, calc_type: 'SINGLE_DISCOUNT' as const },
            { name: 'CTRIP', code: 'ctrip', commission: 18, calc_type: 'PROGRESSIVE' as const },
        ];

        for (const channel of channels) {
            await prisma.oTAChannel.create({
                data: {
                    hotel_id: demoHotel.hotel_id,
                    ...channel,
                    is_active: true,
                },
            });
        }
        console.log(`✅ Created ${channels.length} OTA channels for Demo Hotel`);
    } else {
        console.log(`✅ Demo Hotel already has ${existingChannels} OTA channels`);
    }

    console.log('\n🎉 Done! Demo Hotel is ready.');
    console.log('   Hotel ID:', demoHotel.hotel_id);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
