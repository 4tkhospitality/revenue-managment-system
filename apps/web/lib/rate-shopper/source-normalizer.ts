/**
 * Rate Shopper — OTA Source Normalizer
 *
 * Normalizes OTA source names from SerpApi responses to canonical forms.
 * Google Hotels returns inconsistent names (e.g., "Agoda.com" vs "Agoda").
 *
 * @see spec §18b POC-4, Key Decision #12
 */

// ──────────────────────────────────────────────────
// Normalize Map (expand after POC-4 results)
// ──────────────────────────────────────────────────

const NORMALIZE_MAP: Record<string, string> = {
    // Agoda variants
    'agoda.com': 'Agoda',
    'agoda': 'Agoda',

    // Booking.com variants
    'booking.com': 'Booking.com',
    'booking': 'Booking.com',

    // Expedia variants
    'expedia.com': 'Expedia',
    'expedia': 'Expedia',
    'hotels.com': 'Hotels.com (Expedia)',

    // Traveloka
    'traveloka.com': 'Traveloka',
    'traveloka': 'Traveloka',

    // Trip.com / Ctrip
    'trip.com': 'Trip.com',
    'ctrip': 'Trip.com',
    'ctrip.com': 'Trip.com',

    // Google
    'google': 'Google',
    'google.com': 'Google',

    // Trivago
    'trivago': 'Trivago',
    'trivago.com': 'Trivago',

    // Official
    'official site': 'Official Site',
    'official website': 'Official Site',
};

/**
 * Normalize an OTA source name from SerpApi to a canonical form.
 * Case-insensitive lookup; returns trimmed original if no mapping found.
 *
 * @param source - Raw source string from SerpApi (e.g., "Agoda.com")
 * @returns Normalized source name (e.g., "Agoda")
 */
export function normalizeOTASource(source: string): string {
    if (!source) return 'Unknown';
    const key = source.trim().toLowerCase();
    return NORMALIZE_MAP[key] ?? source.trim();
}

/**
 * Count unique normalized sources from a list of raw source strings.
 */
export function countUniqueSources(sources: string[]): number {
    const normalized = new Set(sources.map(normalizeOTASource));
    return normalized.size;
}
