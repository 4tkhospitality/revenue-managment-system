// Script to delete ALL data from database using raw SQL
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteAllData() {
    console.log('🗑️  Đang xóa toàn bộ dữ liệu...\n');

    // Delete in correct order (foreign key dependencies)
    const tables = [
        'pricing_decisions',
        'price_recommendations',
        'demand_forecast',
        'features_daily',
        'daily_otb',
        'reservations_raw',
        'import_jobs',
    ];

    for (const table of tables) {
        try {
            const result = await prisma.$executeRawUnsafe(`DELETE FROM ${table}`);
            console.log(`   ✅ ${table}: ${result} records deleted`);
        } catch (e: any) {
            console.log(`   ⚠️ ${table}: ${e.message || 'skipped'}`);
        }
    }

    console.log('\n📊 Xóa hoàn tất!');
    console.log('💡 Bây giờ anh có thể import dữ liệu mới tại /upload');
}

deleteAllData()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
