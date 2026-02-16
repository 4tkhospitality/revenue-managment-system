// ════════════════════════════════════════════════════════════════════
// Admin API – Dynamic Pricing Config
// GET    /api/admin/pricing-config             — list configs
// PUT    /api/admin/pricing-config             — upsert config + audit
// DELETE /api/admin/pricing-config?id=...      — soft-deactivate
// ════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { PricingConfigType } from '@prisma/client';

// ── Validation helpers ──────────────────────────────────────────────

function validateConfig(body: Record<string, unknown>): string | null {
    const { config_type, tier, room_band, term_months, amount_vnd, percent, multiplier, scope, hotel_id } = body;

    if (!config_type || !['BASE_PRICE', 'BAND_MULTIPLIER', 'TERM_DISCOUNT'].includes(config_type as string)) {
        return 'config_type must be BASE_PRICE, BAND_MULTIPLIER, or TERM_DISCOUNT';
    }

    // Validate per config_type
    switch (config_type) {
        case 'BASE_PRICE':
            if (!tier) return 'BASE_PRICE requires tier';
            if (amount_vnd == null || typeof amount_vnd !== 'number' || amount_vnd < 0)
                return 'BASE_PRICE requires amount_vnd >= 0';
            if (room_band || term_months != null || percent != null || multiplier != null)
                return 'BASE_PRICE must not have room_band, term_months, percent, or multiplier';
            break;
        case 'BAND_MULTIPLIER':
            if (!room_band) return 'BAND_MULTIPLIER requires room_band';
            if (multiplier == null || typeof multiplier !== 'number' || multiplier <= 0)
                return 'BAND_MULTIPLIER requires multiplier > 0';
            if (tier || term_months != null || amount_vnd != null || percent != null)
                return 'BAND_MULTIPLIER must not have tier, term_months, amount_vnd, or percent';
            break;
        case 'TERM_DISCOUNT':
            if (term_months == null || ![1, 3, 6, 12].includes(term_months as number))
                return 'TERM_DISCOUNT requires term_months (1, 3, 6, or 12)';
            if (percent == null || typeof percent !== 'number' || percent < 0 || percent > 99)
                return 'TERM_DISCOUNT requires percent 0–99';
            if (tier || room_band || amount_vnd != null || multiplier != null)
                return 'TERM_DISCOUNT must not have tier, room_band, amount_vnd, or multiplier';
            break;
    }

    // Validate scope
    if (scope === 'HOTEL' && !hotel_id) return 'scope HOTEL requires hotel_id';
    if (scope !== 'HOTEL' && hotel_id) return 'hotel_id only allowed when scope=HOTEL';

    return null; // valid
}

// ── GET: List configs ───────────────────────────────────────────────

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const mode = req.nextUrl.searchParams.get('mode') || 'active';
    const now = new Date();

    try {
        if (mode === 'all') {
            // Admin view: return all configs (past, active, future) grouped
            const configs = await prisma.pricingConfig.findMany({
                orderBy: [{ config_type: 'asc' }, { priority: 'desc' }, { effective_from: 'desc' }],
            });
            return NextResponse.json(configs);
        }

        // Default: only active configs
        const configs = await prisma.pricingConfig.findMany({
            where: {
                effective_from: { lte: now },
                OR: [
                    { effective_to: null },
                    { effective_to: { gt: now } },
                ],
            },
            orderBy: [{ config_type: 'asc' }, { scope: 'desc' }, { priority: 'desc' }, { updated_at: 'desc' }],
        });
        return NextResponse.json(configs);
    } catch (error) {
        console.error('[Pricing Config] GET error:', error);
        return NextResponse.json([], { status: 200 });
    }
}

// ── PUT: Create or update config ────────────────────────────────────

export async function PUT(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const validationError = validateConfig(body);
    if (validationError) {
        return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const {
        id, config_type, tier, room_band, term_months,
        amount_vnd, percent, multiplier,
        effective_from, effective_to,
        scope, hotel_id, priority, label,
    } = body;

    try {
        const result = await prisma.$transaction(async (tx) => {
            let config;
            const data = {
                config_type: config_type as PricingConfigType,
                tier: tier || null,
                room_band: room_band || null,
                term_months: term_months ?? null,
                amount_vnd: amount_vnd ?? null,
                percent: percent ?? null,
                multiplier: multiplier ?? null,
                // datetime-local sends "2026-02-16T16:20" without timezone
                // new Date() would parse this as UTC, but user is in UTC+7 → 7h ahead = "Scheduled"
                // Fix: append Vietnam timezone offset
                effective_from: effective_from
                    ? new Date(String(effective_from).includes('+') || String(effective_from).endsWith('Z')
                        ? effective_from  // already has timezone info
                        : effective_from + ':00+07:00')  // append Vietnam TZ
                    : new Date(),
                effective_to: effective_to
                    ? new Date(String(effective_to).includes('+') || String(effective_to).endsWith('Z')
                        ? effective_to
                        : effective_to + ':00+07:00')
                    : null,
                scope: scope || 'GLOBAL',
                hotel_id: hotel_id || null,
                priority: priority ?? 0,
                label: label || null,
                updated_by: session.user!.id,
            };

            if (id) {
                // UPDATE existing
                const existing = await tx.pricingConfig.findUnique({ where: { id } });
                if (!existing) throw new Error('Config not found');

                config = await tx.pricingConfig.update({
                    where: { id },
                    data,
                });

                // Audit log: track changed fields
                const changedFields: string[] = [];
                for (const key of Object.keys(data) as (keyof typeof data)[]) {
                    const oldVal = String((existing as Record<string, unknown>)[key] ?? '');
                    const newVal = String(data[key] ?? '');
                    if (oldVal !== newVal && key !== 'updated_by') {
                        changedFields.push(key);
                        await tx.pricingConfigAudit.create({
                            data: {
                                config_id: id,
                                action: 'PRICING_CONFIG_UPDATED',
                                field_changed: key,
                                old_value: oldVal,
                                new_value: newVal,
                                changed_by: session.user!.id,
                            },
                        });
                    }
                }
            } else {
                // CREATE new
                config = await tx.pricingConfig.create({ data });
                await tx.pricingConfigAudit.create({
                    data: {
                        config_id: config.id,
                        action: 'PRICING_CONFIG_CREATED',
                        changed_by: session.user!.id,
                        note: `Created ${config_type} config`,
                    },
                });
            }

            return config;
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('[Pricing Config] PUT error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal error' },
            { status: 500 }
        );
    }
}

// ── DELETE: Soft-deactivate (set effective_to = now) ────────────────

export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    try {
        const result = await prisma.$transaction(async (tx) => {
            const existing = await tx.pricingConfig.findUnique({ where: { id } });
            if (!existing) throw new Error('Config not found');

            const updated = await tx.pricingConfig.update({
                where: { id },
                data: { effective_to: new Date(), updated_by: session.user!.id },
            });

            await tx.pricingConfigAudit.create({
                data: {
                    config_id: id,
                    action: 'PRICING_CONFIG_DELETED',
                    field_changed: 'effective_to',
                    old_value: existing.effective_to?.toISOString() || 'null',
                    new_value: new Date().toISOString(),
                    changed_by: session.user!.id,
                    note: 'Soft-deactivated',
                },
            });

            return updated;
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('[Pricing Config] DELETE error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal error' },
            { status: 500 }
        );
    }
}
