/**
 * API: User Locale Preference
 *
 * PATCH /api/user/locale
 * Body: { locale: "en" | "vi" }
 *
 * Saves to User.locale in DB and syncs the rms_locale cookie.
 * The cookie acts as cache for Edge middleware (no DB access).
 */
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import {
    localeSchema,
    LOCALE_COOKIE_NAME,
    LOCALE_COOKIE_MAX_AGE,
    SUPPORTED_LOCALES,
} from '@/lib/i18n';

export async function PATCH(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const parsed = localeSchema.safeParse(body.locale);

        if (!parsed.success) {
            return NextResponse.json(
                { error: `Invalid locale. Supported: ${SUPPORTED_LOCALES.join(', ')}` },
                { status: 400 }
            );
        }

        const locale = parsed.data;

        // Try to update DB (source of truth), but don't fail if column missing
        try {
            await prisma.user.update({
                where: { id: session.user.id },
                data: { locale },
            });
        } catch (dbErr) {
            console.warn('[API] Could not persist locale to DB (column may not exist yet):', dbErr);
            // Continue — cookie will still work for middleware
        }

        // Sync cookie (cache for middleware) — always succeeds
        const response = NextResponse.json({
            ok: true,
            locale,
        });

        response.cookies.set(LOCALE_COOKIE_NAME, locale, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: LOCALE_COOKIE_MAX_AGE,
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('[API] PATCH /api/user/locale error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
