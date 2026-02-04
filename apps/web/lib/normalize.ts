/**
 * lib/normalize.ts
 * V01.1: Normalization utility for stable key matching
 * 
 * Used by Cancellation Bridge to normalize reservation_id, folio_num, room_code
 * for reliable matching between reservations_raw and cancellations_raw.
 */

/**
 * Normalize a key for matching:
 * - Convert to uppercase
 * - Trim whitespace
 * - Remove all non-alphanumeric characters
 * 
 * @example
 * normalizeKey("FO-12345 ")  // Returns "FO12345"
 * normalizeKey(" abc-DEF_123") // Returns "ABCDEF123"
 * normalizeKey(null)          // Returns null
 */
export function normalizeKey(value: string | null | undefined): string | null {
    if (!value) return null;

    return value
        .toUpperCase()
        .trim()
        .replace(/[^A-Z0-9]/g, '');
}

/**
 * Normalize an array of keys
 */
export function normalizeKeys(values: (string | null | undefined)[]): (string | null)[] {
    return values.map(normalizeKey);
}

/**
 * Compare two values after normalization
 * Returns true if both normalize to the same value
 */
export function normalizedEquals(a: string | null | undefined, b: string | null | undefined): boolean {
    const normA = normalizeKey(a);
    const normB = normalizeKey(b);

    if (!normA || !normB) return false;
    return normA === normB;
}
