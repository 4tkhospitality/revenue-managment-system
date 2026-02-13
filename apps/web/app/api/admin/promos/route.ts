// Admin API – Promo Codes
// GET  /api/admin/promos — list all promo codes
// POST /api/admin/promos — create new promo code

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createPromoCode, listPromoCodes } from '@/lib/promo/promo';
import { audit } from '@/lib/shared/audit';

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const promos = await listPromoCodes();
        return NextResponse.json(promos);
    } catch (error) {
        console.error('[Admin Promos] GET error:', error);
        return NextResponse.json([], { status: 200 }); // graceful empty array
    }
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const promo = await createPromoCode(body);

    await audit('ADMIN_OVERRIDE', {
        actorId: session.user.id,
        entityType: 'promo_code',
        entityId: promo.id,
        metadata: { action: 'created', code: promo.code },
    });

    return NextResponse.json(promo, { status: 201 });
}

export async function PATCH(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const body = await req.json();
    const prisma = (await import('@/lib/prisma')).default;
    const updated = await prisma.promoCode.update({
        where: { id },
        data: {
            ...(body.is_active !== undefined && { is_active: body.is_active }),
            ...(body.description !== undefined && { description: body.description }),
            ...(body.maxRedemptions !== undefined && { max_redemptions: body.maxRedemptions }),
            ...(body.percentOff !== undefined && { percent_off: body.percentOff }),
        },
    });

    await audit('ADMIN_OVERRIDE', {
        actorId: session.user.id,
        entityType: 'promo_code',
        entityId: id,
        metadata: { action: 'updated', ...body },
    });

    return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const prisma = (await import('@/lib/prisma')).default;
    const deactivated = await prisma.promoCode.update({
        where: { id },
        data: { is_active: false },
    });

    await audit('ADMIN_OVERRIDE', {
        actorId: session.user.id,
        entityType: 'promo_code',
        entityId: id,
        metadata: { action: 'deactivated' },
    });

    return NextResponse.json(deactivated);
}
