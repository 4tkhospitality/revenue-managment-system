// ════════════════════════════════════════════════════════════════════
// Commission — Ledger + Calculation + Payout Run
// ════════════════════════════════════════════════════════════════════

import prisma from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

// ── Calculate + Record Commission on Invoice Payment ─────────────

export async function recordCommission(
    invoiceId: string,
): Promise<{ amount: number; resellerId: string } | null> {
    // Get invoice + hotel's reseller attribution + contract
    const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
            hotel: {
                select: {
                    hotel_id: true,
                    reseller_attributions: {
                        where: { status: 'ACTIVE' },
                        include: {
                            reseller: {
                                include: {
                                    contracts: {
                                        where: { is_active: true },
                                        orderBy: { effective_from: 'desc' as const },
                                        take: 1,
                                    },
                                },
                            },
                        },
                        take: 1,
                    },
                },
            },
        },
    });

    if (!invoice) return null;

    const attribution = invoice.hotel.reseller_attributions[0];
    if (!attribution) return null; // No reseller → no commission

    const contract = attribution.reseller.contracts[0];
    if (!contract) return null; // No active contract → no commission

    const rate = Number(contract.commission_rate);
    const netAmount = Number(invoice.net_amount ?? invoice.amount);
    const commissionAmount = Math.round(netAmount * rate);

    await prisma.commissionLedger.create({
        data: {
            reseller_id: attribution.reseller_id,
            hotel_id: invoice.hotel.hotel_id,
            invoice_id: invoiceId,
            type: 'EARNED',
            amount: commissionAmount,
            rate: contract.commission_rate,
            description: `Invoice ${invoice.invoice_number} — ${rate * 100}%`,
        },
    });

    return { amount: commissionAmount, resellerId: attribution.reseller_id };
}

// ── Reverse Commission ──────────────────────────────────────────

export async function reverseCommission(
    invoiceId: string,
    reason: string,
): Promise<void> {
    const earned = await prisma.commissionLedger.findFirst({
        where: { invoice_id: invoiceId, type: 'EARNED' },
    });
    if (!earned) return;

    await prisma.commissionLedger.create({
        data: {
            reseller_id: earned.reseller_id,
            hotel_id: earned.hotel_id,
            invoice_id: invoiceId,
            type: 'REVERSED',
            amount: new Decimal(earned.amount).negated(),
            rate: earned.rate,
            description: `Reversed: ${reason}`,
        },
    });
}

// ── Get Reseller Balance ────────────────────────────────────────

export async function getResellerBalance(resellerId: string): Promise<number> {
    const result = await prisma.commissionLedger.aggregate({
        where: { reseller_id: resellerId, payout_item_id: null },
        _sum: { amount: true },
    });
    return Number(result._sum.amount ?? 0);
}

// ── Payout Run ──────────────────────────────────────────────────

export async function createPayoutRun(period: string) {
    // Get all resellers with unpaid balance
    const resellers = await prisma.commissionLedger.groupBy({
        by: ['reseller_id'],
        where: { payout_item_id: null },
        _sum: { amount: true },
        having: { amount: { _sum: { gt: 0 } } },
    });

    if (resellers.length === 0) return null;

    return prisma.payoutRun.create({
        data: {
            period,
            items: {
                create: resellers.map((r) => ({
                    reseller_id: r.reseller_id,
                    amount: r._sum.amount ?? 0,
                })),
            },
        },
        include: { items: true },
    });
}

export async function approvePayoutRun(
    payoutRunId: string,
    approverId: string,
) {
    return prisma.payoutRun.update({
        where: { id: payoutRunId },
        data: {
            status: 'APPROVED',
            approved_by: approverId,
            approved_at: new Date(),
        },
    });
}

export async function markPayoutPaid(payoutRunId: string) {
    return prisma.$transaction(async (tx) => {
        // Update payout run
        await tx.payoutRun.update({
            where: { id: payoutRunId },
            data: { status: 'PAID', paid_at: new Date() },
        });

        // Get payout items
        const items = await tx.payoutItem.findMany({
            where: { payout_run_id: payoutRunId },
        });

        // Link commission entries to payout items
        for (const item of items) {
            await tx.commissionLedger.updateMany({
                where: { reseller_id: item.reseller_id, payout_item_id: null },
                data: { payout_item_id: item.id },
            });
            await tx.payoutItem.update({
                where: { id: item.id },
                data: { status: 'PAID' },
            });
        }
    });
}
