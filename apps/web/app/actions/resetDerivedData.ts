'use server';

import prisma from '@/lib/prisma';

/**
 * Reset all derived data for a hotel.
 * This clears: daily_otb, features_daily, demand_forecast, price_recommendations, pricing_decisions
 * It KEEPS: reservations_raw (raw data is preserved)
 */
export async function resetDerivedData(hotelId: string): Promise<{ success: boolean; message: string; deleted: Record<string, number> }> {
    if (!hotelId) {
        throw new Error('Hotel ID is required');
    }

    try {
        // Delete in correct order (foreign key dependencies)
        const deletedPricingDecisions = await prisma.pricingDecision.deleteMany({
            where: { hotel_id: hotelId }
        });

        const deletedPriceRecommendations = await prisma.priceRecommendations.deleteMany({
            where: { hotel_id: hotelId }
        });

        const deletedDemandForecast = await prisma.demandForecast.deleteMany({
            where: { hotel_id: hotelId }
        });

        const deletedFeaturesDaily = await prisma.featuresDaily.deleteMany({
            where: { hotel_id: hotelId }
        });

        const deletedDailyOtb = await prisma.dailyOTB.deleteMany({
            where: { hotel_id: hotelId }
        });

        const deleted = {
            pricing_decisions: deletedPricingDecisions.count,
            price_recommendations: deletedPriceRecommendations.count,
            demand_forecast: deletedDemandForecast.count,
            features_daily: deletedFeaturesDaily.count,
            daily_otb: deletedDailyOtb.count,
        };

        const totalDeleted = Object.values(deleted).reduce((a, b) => a + b, 0);

        return {
            success: true,
            message: `Deleted ${totalDeleted} records. Raw data has been preserved.`,
            deleted
        };
    } catch (error) {
        console.error('Reset error:', error);
        throw new Error('Unable to reset data. Please try again.');
    }
}
