/* eslint-disable @typescript-eslint/no-unused-vars */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding database...')

    try {
        // 1. Create Hotel
        const hotel = await prisma.hotel.upsert({
            where: { hotel_id: '00000000-0000-0000-0000-000000000001' }, // Dummy UUID
            update: {},
            create: {
                hotel_id: '00000000-0000-0000-0000-000000000001',
                name: 'Hotel California',
                capacity: 100,
                currency: 'USD',
                timezone: 'America/Los_Angeles'
            }
        })
        console.log(`✅ Hotel: ${hotel.name} (${hotel.hotel_id})`)

        // 2. Create User
        const user = await prisma.user.upsert({
            where: { email: 'gm@hotelcalifornia.com' },
            update: {},
            create: {
                email: 'gm@hotelcalifornia.com',
                role: 'manager',
                hotel_id: hotel.hotel_id
            }
        })
        console.log(`✅ User: ${user.email}`)

        // 3. Create Super Admin
        const admin = await prisma.user.upsert({
            where: { email: 'phan.le@vleisure.com' },
            update: { role: 'super_admin' },
            create: {
                email: 'phan.le@vleisure.com',
                role: 'super_admin',
                name: 'Phan Le',
                hotel_id: hotel.hotel_id
            }
        })
        console.log(`✅ Super Admin: ${admin.email}`)

    } catch (e) {
        console.error(e)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

main()
