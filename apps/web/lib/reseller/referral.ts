// ════════════════════════════════════════════════════════════════════
// Referral Link Handler — parse ?ref= param → set cookie 30d → auto-attribute on hotel creation
// ════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';

const REFERRAL_COOKIE = 'rms_referral';
const REFERRAL_COOKIE_DAYS = 30;

/**
 * Middleware-style function to handle referral codes from URL params.
 * Call this in middleware.ts or in a layout effect.
 * Sets a 30-day cookie with the reseller ref code.
 */
export function handleReferralParam(request: NextRequest, response: NextResponse): NextResponse {
    const refCode = request.nextUrl.searchParams.get('ref');
    if (refCode && refCode.length >= 3) {
        response.cookies.set(REFERRAL_COOKIE, refCode.toUpperCase(), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: REFERRAL_COOKIE_DAYS * 24 * 60 * 60,
            path: '/',
        });
    }
    return response;
}

/**
 * Get referral code from cookie.
 * Use this during hotel creation / onboarding to auto-attribute.
 */
export function getReferralCode(request: NextRequest): string | null {
    return request.cookies.get(REFERRAL_COOKIE)?.value ?? null;
}

/**
 * Clear referral cookie after attribution is created.
 */
export function clearReferralCookie(response: NextResponse): NextResponse {
    response.cookies.set(REFERRAL_COOKIE, '', { maxAge: 0, path: '/' });
    return response;
}
