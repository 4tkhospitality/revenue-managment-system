/**
 * PayPal Create Order — API Route (One-Time Payment)
 *
 * POST /api/payments/paypal/create-order
 * Body: { hotelId, tier, roomBand, billingCycle? }
 *
 * Creates a PayPal order with dynamic USD pricing.
 * User approves on PayPal → return to capture endpoint.
 * 
 * 🔧 VERBOSE LOGGING for live debugging — remove after stable
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { PlanTier, RoomBand } from '@prisma/client';
import { generateOrderId, PENDING_EXPIRY_MS } from '@/lib/payments/constants';
import { createPayPalOrder } from '@/lib/payments/paypal';
import { trackEvent } from '@/lib/payments/trackEvent';
import { getDynamicPrice } from '@/lib/plg/plan-config';

const TAG = '[PayPal Create Order]';

export async function POST(req: Request) {
    console.log(`${TAG} ━━━━━━━━━━ START ━━━━━━━━━━`);
    try {
        // 1. Auth check
        console.log(`${TAG} Step 1: Auth check...`);
        const session = await auth();
        if (!session?.user) {
            console.error(`${TAG} ❌ Unauthorized — no session`);
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = (session.user as { id: string }).id;
        console.log(`${TAG} ✅ Auth OK — userId: ${userId}`);

        // 2. Parse body
        console.log(`${TAG} Step 2: Parse body...`);
        const body = await req.json();
        const { hotelId, tier, roomBand, billingCycle = 'monthly' } = body as {
            hotelId?: string;
            tier: PlanTier;
            roomBand: RoomBand;
            billingCycle?: 'monthly' | '3-months';
        };
        console.log(`${TAG} ✅ Body: hotelId=${hotelId}, tier=${tier}, roomBand=${roomBand}, billingCycle=${billingCycle}`);

        if (!tier || !roomBand) {
            console.error(`${TAG} ❌ Missing required fields: tier=${tier}, roomBand=${roomBand}`);
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (tier === 'STANDARD') {
            console.error(`${TAG} ❌ Cannot purchase STANDARD tier`);
            return NextResponse.json({ error: 'Cannot purchase STANDARD tier' }, { status: 400 });
        }

        // 3. Provider switching block (skip if no hotel — pay-first flow)
        console.log(`${TAG} Step 3: Provider switching check...`);
        if (hotelId) {
            const currentSub = await prisma.subscription.findUnique({
                where: { hotel_id: hotelId },
            });
            console.log(`${TAG}   Current sub: status=${currentSub?.status}, provider=${currentSub?.external_provider}`);
            if (
                currentSub?.status === 'ACTIVE' &&
                currentSub.external_provider &&
                currentSub.external_provider !== 'PAYPAL'
            ) {
                console.error(`${TAG} ❌ Blocked by existing ${currentSub.external_provider} subscription`);
                return NextResponse.json(
                    { error: `You have an active subscription via ${currentSub.external_provider}. Please cancel first.` },
                    { status: 409 }
                );
            }
        } else {
            console.log(`${TAG}   No hotelId — pay-first flow, skipping provider check`);
        }

        // 4. Calculate USD price from VND dynamic price (ensures VND promotions apply to PayPal too)
        console.log(`${TAG} Step 4: Calculate USD price from VND dynamic price...`);
        const termMonths = billingCycle === '3-months' ? 3 : 1;

        // Get VND dynamic price (same price user sees on the pricing page)
        const dynamicResult = await getDynamicPrice(tier, roomBand, termMonths);
        const vndMonthlyPrice = dynamicResult.price; // Already includes base × band × discount
        console.log(`${TAG}   VND dynamic price: ${vndMonthlyPrice} VND/month (base=${dynamicResult.basePrice}, mult=${dynamicResult.multiplier}, discount=${dynamicResult.discountPercent}%)`);

        // Convert VND → USD using exchange rate
        const VND_TO_USD_RATE = 23_500; // 1 USD = 23,500 VND (PayPal rate is lower)
        const monthlyPriceUSD = Math.round((vndMonthlyPrice / VND_TO_USD_RATE) * 100) / 100;
        const amount = billingCycle === '3-months'
            ? Math.round(monthlyPriceUSD * 3 * 100) / 100
            : monthlyPriceUSD;

        // PayPal minimum is $1.00 — enforce floor
        const finalAmount = Math.max(amount, 1.00);
        console.log(`${TAG}   monthlyUSD: $${monthlyPriceUSD}, totalUSD: $${amount}, finalAmount: $${finalAmount} (${termMonths} month${termMonths > 1 ? 's' : ''})`);

        const orderId = generateOrderId(hotelId || userId);
        const expiresAt = new Date(Date.now() + PENDING_EXPIRY_MS);
        console.log(`${TAG}   orderId: ${orderId}, expiresAt: ${expiresAt.toISOString()}`);

        // 5. Auto-cancel existing PENDING PayPal orders
        console.log(`${TAG} Step 5: Cancel existing PENDING orders...`);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pendingWhere: any = hotelId
            ? { hotel_id: hotelId, status: 'PENDING', gateway: 'PAYPAL' }
            : { user_id: userId, hotel_id: null, status: 'PENDING', gateway: 'PAYPAL' };
        const existingPending = await prisma.paymentTransaction.findFirst({
            where: pendingWhere,
        });
        if (existingPending) {
            console.log(`${TAG}   Found existing PENDING tx: ${existingPending.id}, cancelling...`);
            await prisma.paymentTransaction.update({
                where: { id: existingPending.id },
                data: {
                    status: 'FAILED',
                    failed_at: new Date(),
                    failed_reason: existingPending.expires_at && existingPending.expires_at < new Date()
                        ? 'auto_expired'
                        : 'superseded_by_new_order',
                },
            });
            console.log(`${TAG}   ✅ Existing PENDING tx cancelled`);
        } else {
            console.log(`${TAG}   No existing PENDING tx found`);
        }

        // 6. Create PayPal order via API
        console.log(`${TAG} Step 6: Creating PayPal order via API...`);
        console.log(`${TAG}   Params: amount=$${finalAmount}, orderId=${orderId}, description=4TK Hospitality - ${tier} Plan (${termMonths} month${termMonths > 1 ? 's' : ''})`);
        const { paypalOrderId, approvalUrl } = await createPayPalOrder({
            orderId,
            amount: finalAmount,
            description: `4TK Hospitality - ${tier} Plan (${termMonths} month${termMonths > 1 ? 's' : ''})`,
            hotelId: hotelId || userId,
        });
        console.log(`${TAG}   ✅ PayPal order created: paypalOrderId=${paypalOrderId}`);
        console.log(`${TAG}   ✅ approvalUrl: ${approvalUrl}`);

        // 7. Save PENDING transaction
        console.log(`${TAG} Step 7: Saving PENDING transaction...`);
        const txData: Record<string, unknown> = {
            user_id: userId,
            gateway: 'PAYPAL',
            order_id: orderId,
            gateway_transaction_id: paypalOrderId,
            amount: finalAmount,
            currency: 'USD',
            status: 'PENDING',
            purchased_tier: tier,
            purchased_room_band: roomBand,
            expires_at: expiresAt,
            description: `PayPal one-time ${tier} - Band ${roomBand} - ${termMonths} months`,
        };
        if (hotelId) txData.hotel_id = hotelId;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await prisma.paymentTransaction.create({ data: txData as any });
        console.log(`${TAG}   ✅ PENDING transaction saved`);

        // 8. Track event
        trackEvent({
            event: 'payment_method_selected',
            userId,
            hotelId: hotelId || undefined,
            properties: { method: 'PAYPAL', mode: 'one-time', tier, roomBand, amount: finalAmount, currency: 'USD', billingCycle },
        });

        console.log(`${TAG} ━━━━━━━━━━ SUCCESS ━━━━━━━━━━`);
        return NextResponse.json({
            orderId,
            paypalOrderId,
            approvalUrl,
            amount: finalAmount,
            currency: 'USD',
            expiresAt: expiresAt.toISOString(),
        });
    } catch (err) {
        console.error(`${TAG} ━━━━━━━━━━ ERROR ━━━━━━━━━━`);
        console.error(`${TAG} Error type: ${err?.constructor?.name}`);
        console.error(`${TAG} Error message: ${err instanceof Error ? err.message : String(err)}`);
        console.error(`${TAG} Full error:`, err);
        if (err instanceof Error && err.stack) {
            console.error(`${TAG} Stack trace:`, err.stack);
        }

        // Return detailed error in dev/staging for debugging
        const errorMessage = err instanceof Error ? err.message : 'Internal server error';
        return NextResponse.json(
            { error: errorMessage, debug: process.env.NODE_ENV !== 'production' ? String(err) : undefined },
            { status: 500 }
        );
    }
}
