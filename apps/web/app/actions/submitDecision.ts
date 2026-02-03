'use server'

import prisma from '../../lib/prisma';
import { revalidatePath } from 'next/cache';

export async function submitDecision(
    hotelId: string,
    stayDate: Date,
    asOfDate: Date,
    action: 'accept' | 'override',
    finalPrice: number,
    reason?: string // Optional? Plan said "Reason Required for Override"
) {
    if (action === 'override' && !reason) {
        throw new Error("Reason is required for Override");
    }

    // Fetch Recommendation to link (optional V01 Requirement 5)
    // "link id optional".
    // We can infer context from (hotel, asOf, stay).

    // Get current system price for logging
    // In real app, fetch from Rec table.
    // optimization: pass in params? No, secure by fetching.
    const rec = await prisma.priceRecommendations.findFirst({
        where: {
            hotel_id: hotelId,
            as_of_date: asOfDate,
            stay_date: stayDate
        }
    });

    const systemPrice = rec?.recommended_price || 0;

    await prisma.pricingDecision.create({
        data: {
            hotel_id: hotelId,
            user_id: "system_user", // Placeholder for V01 Auth
            as_of_date: asOfDate,
            stay_date: stayDate,
            action: action, // Enum 'accept' | 'override'
            system_price: systemPrice,
            final_price: finalPrice,
            reason: reason || null,
            decided_at: new Date()
        }
    });

    try {
        revalidatePath('/dashboard');
    } catch (e) {
        // revalidatePath may fail in some contexts, safe to ignore
        console.warn('revalidatePath failed:', e);
    }
    return { success: true };
}
