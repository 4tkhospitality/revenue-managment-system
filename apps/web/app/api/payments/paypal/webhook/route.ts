/**
 * PayPal Webhook Handler — API Route
 *
 * POST /api/payments/paypal/webhook
 *
 * GLC-01: Handles all subscribed PayPal events
 * GLC-02: Uses raw body for signature verification
 * P1: Re-fetches subscription details before applying changes
 */

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyWebhookSignature, getSubscriptionDetails } from '@/lib/payments/paypal';
import { applySubscriptionChange, downgradeToStandard } from '@/lib/payments/activation';
import { trackEvent } from '@/lib/payments/trackEvent';

interface PayPalWebhookEvent {
    id: string;
    event_type: string;
    resource: {
        id: string;
        status?: string;
        billing_agreement_id?: string;
        amount?: { total: string; currency: string };
        custom_id?: string; // hotelId embedded in PayPal plan
    };
    create_time: string;
}

export async function POST(req: Request) {
    try {
        // 1. Read raw body BEFORE parsing (GLC-02)
        const rawBody = await req.text();

        // 2. Verify webhook signature
        const isValid = await verifyWebhookSignature({
            rawBody,
            headers: {
                'paypal-transmission-id': req.headers.get('paypal-transmission-id'),
                'paypal-transmission-sig': req.headers.get('paypal-transmission-sig'),
                'paypal-transmission-time': req.headers.get('paypal-transmission-time'),
                'paypal-cert-url': req.headers.get('paypal-cert-url'),
                'paypal-auth-algo': req.headers.get('paypal-auth-algo'),
            },
        });

        if (!isValid) {
            console.warn('[PayPal Webhook] Invalid signature');
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const event: PayPalWebhookEvent = JSON.parse(rawBody);
        const subscriptionId = event.resource.id || event.resource.billing_agreement_id;

        if (!subscriptionId) {
            return NextResponse.json({ ok: true }); // Not a subscription event
        }

        // 3. Idempotency check: has this event been processed? (GLC-03/04)
        const existingTx = await prisma.paymentTransaction.findFirst({
            where: {
                gateway: 'PAYPAL',
                gateway_event_id: event.id,
            },
        });

        if (existingTx) {
            console.log('[PayPal Webhook] Duplicate event, skipping:', event.id);
            return NextResponse.json({ ok: true, status: 'duplicate' });
        }

        // 4. Find subscription by external_subscription_id
        const subscription = await prisma.subscription.findFirst({
            where: { external_subscription_id: subscriptionId },
        });

        if (!subscription || !subscription.hotel_id) {
            console.warn('[PayPal Webhook] No subscription found for:', subscriptionId);
            return NextResponse.json({ ok: true }); // Not our subscription
        }

        const hotelId = subscription.hotel_id;

        // 5. Handle events (GLC-01)
        switch (event.event_type) {
            case 'BILLING.SUBSCRIPTION.ACTIVATED': {
                // P1: Re-fetch from PayPal API
                const paypalSub = await getSubscriptionDetails(subscriptionId);
                const periodEnd = paypalSub.billing_info.next_billing_time
                    ? new Date(paypalSub.billing_info.next_billing_time)
                    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

                await prisma.$transaction(async (tx) => {
                    await tx.paymentTransaction.create({
                        data: {
                            hotel_id: hotelId,
                            user_id: 'system',
                            gateway: 'PAYPAL',
                            order_id: `PP-ACT-${Date.now()}`,
                            gateway_transaction_id: subscriptionId,
                            gateway_event_id: event.id,
                            amount: 0,
                            currency: 'USD',
                            status: 'COMPLETED',
                            completed_at: new Date(),
                            provider_customer_ref: paypalSub.subscriber?.email_address,
                            raw_payload: event as any,
                            description: 'PayPal subscription activated',
                        },
                    });

                    await applySubscriptionChange(tx, hotelId, 'system', {
                        periodStart: new Date(),
                        periodEnd,
                        provider: 'PAYPAL',
                        plan: subscription.plan,
                        roomBand: subscription.room_band,
                        externalSubscriptionId: subscriptionId,
                    });
                });
                break;
            }

            case 'PAYMENT.SALE.COMPLETED': {
                // Renewal payment — extend period
                const paypalSub = await getSubscriptionDetails(subscriptionId);
                const periodEnd = paypalSub.billing_info.next_billing_time
                    ? new Date(paypalSub.billing_info.next_billing_time)
                    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

                const saleAmount = event.resource.amount
                    ? parseFloat(event.resource.amount.total)
                    : 0;

                await prisma.$transaction(async (tx) => {
                    await tx.paymentTransaction.create({
                        data: {
                            hotel_id: hotelId,
                            user_id: 'system',
                            gateway: 'PAYPAL',
                            order_id: `PP-RENEW-${Date.now()}`,
                            gateway_transaction_id: `${subscriptionId}-${event.id}`,
                            gateway_event_id: event.id,
                            amount: saleAmount,
                            currency: event.resource.amount?.currency || 'USD',
                            status: 'COMPLETED',
                            completed_at: new Date(),
                            provider_customer_ref: paypalSub.subscriber?.email_address,
                            raw_payload: event as any,
                            description: 'PayPal renewal payment',
                        },
                    });

                    await applySubscriptionChange(tx, hotelId, 'system', {
                        periodStart: new Date(),
                        periodEnd,
                        provider: 'PAYPAL',
                        plan: subscription.plan,
                        roomBand: subscription.room_band,
                        externalSubscriptionId: subscriptionId,
                    });
                });
                break;
            }

            case 'BILLING.SUBSCRIPTION.CANCELLED':
            case 'BILLING.SUBSCRIPTION.EXPIRED': {
                await prisma.$transaction(async (tx) => {
                    await tx.paymentTransaction.create({
                        data: {
                            hotel_id: hotelId,
                            user_id: 'system',
                            gateway: 'PAYPAL',
                            order_id: `PP-CANCEL-${Date.now()}`,
                            gateway_event_id: event.id,
                            amount: 0,
                            currency: 'USD',
                            status: 'COMPLETED',
                            completed_at: new Date(),
                            raw_payload: event as any,
                            description: `PayPal subscription ${event.event_type.split('.').pop()?.toLowerCase()}`,
                        },
                    });

                    await downgradeToStandard(tx, hotelId, `PayPal ${event.event_type}`);
                });
                break;
            }

            case 'BILLING.SUBSCRIPTION.SUSPENDED': {
                await prisma.$transaction(async (tx) => {
                    await tx.paymentTransaction.create({
                        data: {
                            hotel_id: hotelId,
                            user_id: 'system',
                            gateway: 'PAYPAL',
                            order_id: `PP-SUSPEND-${Date.now()}`,
                            gateway_event_id: event.id,
                            amount: 0,
                            currency: 'USD',
                            status: 'COMPLETED',
                            completed_at: new Date(),
                            raw_payload: event as any,
                            description: 'PayPal subscription suspended',
                        },
                    });

                    await tx.subscription.update({
                        where: { hotel_id: hotelId },
                        data: { status: 'PAST_DUE' },
                    });

                    await tx.auditLog.create({
                        data: {
                            action: 'SUBSCRIPTION_CHANGED',
                            entity_type: 'subscription',
                            entity_id: subscription.id,
                            actor_id: 'system',
                            hotel_id: hotelId,
                            metadata: {
                                status: 'PAST_DUE',
                                reason: 'PayPal BILLING.SUBSCRIPTION.SUSPENDED',
                            },
                        },
                    });
                });
                break;
            }

            default:
                console.log('[PayPal Webhook] Unhandled event type:', event.event_type);
        }

        return NextResponse.json({ ok: true });
    } catch (err: unknown) {
        // GLC-04: Catch unique violation
        if (
            err &&
            typeof err === 'object' &&
            'code' in err &&
            (err as { code: string }).code === 'P2002'
        ) {
            console.log('[PayPal Webhook] Duplicate transaction, returning 200');
            return NextResponse.json({ ok: true, status: 'duplicate' });
        }
        console.error('[PayPal Webhook] Error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
