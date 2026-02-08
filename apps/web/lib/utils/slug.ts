/**
 * Generate URL-friendly slug from hotel name
 * Format: kebab-case + 4-char random suffix
 * Example: "Sunrise Beach Resort" → "sunrise-beach-resort-a7f2"
 */
export function generateSlug(name: string): string {
    // Remove accents/diacritics for Vietnamese names
    const normalized = name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')

    // Convert to kebab-case
    const kebab = normalized
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')

    // Add 4-char random suffix
    const suffix = Math.random().toString(36).substring(2, 6)

    return `${kebab}-${suffix}`
}

/**
 * Validate if a string is a valid slug format
 */
export function isValidSlug(slug: string): boolean {
    return /^[a-z0-9-]+$/.test(slug) && slug.length >= 3 && slug.length <= 100
}
