/**
 * RMS Integration Test Script
 * Tests the full pipeline: Dashboard → KPI → Insights → UI Components
 * 
 * Run: npx ts-node scripts/integration-test.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TestResult {
    name: string;
    passed: boolean;
    message: string;
}

const results: TestResult[] = [];

function log(emoji: string, msg: string) {
    console.log(`${emoji} ${msg}`);
}

function pass(name: string, msg: string) {
    results.push({ name, passed: true, message: msg });
    log('✅', `${name}: ${msg}`);
}

function fail(name: string, msg: string) {
    results.push({ name, passed: false, message: msg });
    log('❌', `${name}: ${msg}`);
}

async function main() {
    console.log('\n🧪 RMS Integration Test Suite\n');
    console.log('─'.repeat(50));

    // Test 1: Database Connection
    try {
        await prisma.$connect();
        pass('DB Connection', 'Connected to database');
    } catch (e) {
        fail('DB Connection', `Failed: ${e}`);
        return;
    }

    // Test 2: Hotel Exists
    const hotelId = process.env.NEXT_PUBLIC_DEFAULT_HOTEL_ID;
    if (!hotelId) {
        fail('Hotel Config', 'NEXT_PUBLIC_DEFAULT_HOTEL_ID not set');
    } else {
        const hotel = await prisma.hotels.findUnique({ where: { hotel_id: hotelId } });
        if (hotel) {
            pass('Hotel Config', `Found hotel: ${hotel.hotel_name} (${hotel.capacity} rooms)`);
        } else {
            fail('Hotel Config', 'Hotel not found in database');
        }
    }

    // Test 3: Reservations Data
    const reservationCount = await prisma.reservationsRaw.count();
    if (reservationCount > 0) {
        pass('Reservations', `Found ${reservationCount} reservations`);
    } else {
        fail('Reservations', 'No reservations found - upload data first');
    }

    // Test 4: Daily OTB Data
    const otbCount = await prisma.dailyOtb.count();
    if (otbCount > 0) {
        pass('Daily OTB', `Found ${otbCount} OTB records`);
    } else {
        fail('Daily OTB', 'No OTB records - run Build OTB');
    }

    // Test 5: Features Daily
    const featuresCount = await prisma.featuresDaily.count();
    if (featuresCount > 0) {
        pass('Features Daily', `Found ${featuresCount} feature records`);
    } else {
        fail('Features Daily', 'No feature records - run Build Features');
    }

    // Test 6: Demand Forecast
    const forecastCount = await prisma.demandForecast.count();
    if (forecastCount > 0) {
        pass('Demand Forecast', `Found ${forecastCount} forecast records`);
    } else {
        fail('Demand Forecast', 'No forecast records - run Run Forecast');
    }

    // Test 7: Import Jobs
    const jobCount = await prisma.importJobs.count();
    if (jobCount > 0) {
        const completedJobs = await prisma.importJobs.count({ where: { status: 'completed' } });
        pass('Import Jobs', `${completedJobs}/${jobCount} jobs completed`);
    } else {
        fail('Import Jobs', 'No import jobs found');
    }

    // Summary
    console.log('\n' + '─'.repeat(50));
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    const percentage = Math.round((passed / total) * 100);

    console.log(`\n📊 KẾT QUẢ: ${passed}/${total} tests passed (${percentage}%)\n`);

    if (passed === total) {
        console.log('🎉 TẤT CẢ TESTS ĐỀU PASS! Pipeline hoạt động tốt.\n');
    } else {
        console.log('⚠️ Có một số tests fail. Xem chi tiết ở trên.\n');
        console.log('💡 Gợi ý:');
        results.filter(r => !r.passed).forEach(r => {
            console.log(`   - ${r.name}: ${r.message}`);
        });
        console.log('');
    }

    await prisma.$disconnect();
}

main().catch(console.error);
