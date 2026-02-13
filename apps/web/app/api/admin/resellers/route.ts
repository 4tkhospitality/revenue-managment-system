// Admin API – Reseller Management
// GET    /api/admin/resellers         — list all
// POST   /api/admin/resellers         — create new
// PATCH  /api/admin/resellers?id=...  — update

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createReseller, listResellers, getReseller, updateReseller } from '@/lib/reseller/reseller';
import { audit } from '@/lib/shared/audit';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const id = req.nextUrl.searchParams.get('id');
        if (id) {
            const reseller = await getReseller(id);
            return NextResponse.json(reseller);
        }

        const resellers = await listResellers();
        return NextResponse.json(resellers);
    } catch (error) {
        console.error('[Admin Resellers] GET error:', error);
        return NextResponse.json([], { status: 200 });
    }
}

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const reseller = await createReseller(body);

    await audit('ADMIN_OVERRIDE', {
        actorId: session.user.id,
        entityType: 'reseller',
        entityId: reseller.id,
        metadata: { action: 'created', name: reseller.name },
    });

    return NextResponse.json(reseller, { status: 201 });
}

export async function PATCH(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const body = await req.json();
    const updated = await updateReseller(id, body);

    await audit('ADMIN_OVERRIDE', {
        actorId: session.user.id,
        entityType: 'reseller',
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

    const { deleteReseller } = await import('@/lib/reseller/reseller');
    const deleted = await deleteReseller(id);

    await audit('ADMIN_OVERRIDE', {
        actorId: session.user.id,
        entityType: 'reseller',
        entityId: id,
        metadata: { action: 'soft_deleted' },
    });

    return NextResponse.json(deleted);
}
