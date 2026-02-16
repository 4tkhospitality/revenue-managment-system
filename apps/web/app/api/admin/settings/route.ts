/**
 * Admin Settings API — System-level key-value settings
 *
 * GET  /api/admin/settings?key=paypal_mode   → Get single setting
 * GET  /api/admin/settings                    → Get all settings
 * PUT  /api/admin/settings                    → Upsert a setting
 * Body: { key: string, value: string }
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const url = new URL(req.url);
        const key = url.searchParams.get('key');

        if (key) {
            const setting = await prisma.systemSetting.findUnique({ where: { key } });
            return NextResponse.json({ key, value: setting?.value ?? null });
        }

        const settings = await prisma.systemSetting.findMany();
        const result: Record<string, string> = {};
        for (const s of settings) {
            result[s.key] = s.value;
        }
        return NextResponse.json(result);
    } catch (err) {
        console.error('[Admin Settings GET]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const userId = (session.user as { id: string }).id;

        const body = await req.json();
        const { key, value } = body as { key: string; value: string };

        if (!key || value === undefined) {
            return NextResponse.json({ error: 'Missing key or value' }, { status: 400 });
        }

        // Validate known keys
        const VALID_KEYS: Record<string, string[]> = {
            paypal_mode: ['subscription', 'one-time'],
        };

        if (VALID_KEYS[key] && !VALID_KEYS[key].includes(value)) {
            return NextResponse.json(
                { error: `Invalid value for ${key}. Must be one of: ${VALID_KEYS[key].join(', ')}` },
                { status: 400 }
            );
        }

        const setting = await prisma.systemSetting.upsert({
            where: { key },
            update: { value, updated_by: userId },
            create: { key, value, updated_by: userId },
        });

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: 'SETTING_CHANGED',
                entity_type: 'system_setting',
                entity_id: key,
                actor_id: userId,
                metadata: { key, value },
            },
        });

        return NextResponse.json({ ok: true, key: setting.key, value: setting.value });
    } catch (err) {
        console.error('[Admin Settings PUT]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
