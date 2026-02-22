/**
 * Country Detection — 3-tier chain
 * 
 * 1. X-Vercel-IP-Country header (zero latency, prod-ready)
 * 2. ipapi.co fallback (gated by ENABLE_IP_GEO_FALLBACK env)
 * 3. Locale → country mapping (best-effort)
 * 
 * All results validated: uppercase 2-letter ISO 3166-1 alpha-2 or null.
 */

const COUNTRY_RE = /^[A-Z]{2}$/;

/** Best-effort mapping from BCP-47 locale to ISO country code */
const LOCALE_TO_COUNTRY: Record<string, string> = {
    vi: 'VN',
    th: 'TH',
    id: 'ID',
    ms: 'MY',
    ja: 'JP',
    ko: 'KR',
    zh: 'CN',
    fr: 'FR',
    de: 'DE',
    es: 'ES',
    pt: 'PT',
    it: 'IT',
    ru: 'RU',
    ar: 'AE',
    hi: 'IN',
};

function isValidCountry(code: string | null | undefined): code is string {
    return !!code && COUNTRY_RE.test(code);
}

/**
 * Detect user country from request headers + locale.
 * Returns uppercase 2-letter ISO code or null.
 */
export async function detectCountry(
    headers: Headers,
    googleLocale?: string | null,
): Promise<string | null> {
    // ── Tier 1: Vercel geo header (zero latency) ────────────────────
    const vercelCountry = headers.get('x-vercel-ip-country')?.toUpperCase();
    if (isValidCountry(vercelCountry)) {
        console.log(`[GEO] Detected country from Vercel header: ${vercelCountry}`);
        return vercelCountry;
    }

    // ── Tier 2: ipapi.co fallback (gated by env) ────────────────────
    if (process.env.ENABLE_IP_GEO_FALLBACK === 'true') {
        const forwarded = headers.get('x-forwarded-for');
        const ip = forwarded?.split(',')[0]?.trim();
        if (ip && ip !== '::1' && ip !== '127.0.0.1') {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 600);
                const res = await fetch(`https://ipapi.co/${ip}/country/`, {
                    signal: controller.signal,
                });
                clearTimeout(timeout);
                if (res.ok) {
                    const code = (await res.text()).trim().toUpperCase();
                    if (isValidCountry(code)) {
                        console.log(`[GEO] Detected country from ipapi: ${code} (IP: ${ip})`);
                        return code;
                    }
                }
            } catch (err) {
                // Timeout or network error — silently fall through
                console.warn(`[GEO] ipapi fallback failed:`, err instanceof Error ? err.message : err);
            }
        }
    }

    // ── Tier 3: Locale → country mapping (best-effort) ──────────────
    if (googleLocale) {
        const lang = googleLocale.split('-')[0]?.toLowerCase();
        const mapped = lang ? LOCALE_TO_COUNTRY[lang] : null;
        if (isValidCountry(mapped)) {
            console.log(`[GEO] Mapped locale "${googleLocale}" → ${mapped}`);
            return mapped;
        }
    }

    console.log(`[GEO] Could not detect country`);
    return null;
}
