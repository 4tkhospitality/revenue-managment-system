/**
 * ISO 3166-1 alpha-2 country codes with names
 * Used in onboarding and hotel management
 */
export const COUNTRIES = [
    { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
    { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
    { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
    { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
    { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
    { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
    { code: 'KH', name: 'Campuchia', flag: '🇰🇭' },
    { code: 'LA', name: 'Laos', flag: '🇱🇦' },
    { code: 'MM', name: 'Myanmar', flag: '🇲🇲' },
    { code: 'JP', name: 'Japan', flag: '🇯🇵' },
    { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
    { code: 'CN', name: 'China', flag: '🇨🇳' },
    { code: 'TW', name: 'Taiwan', flag: '🇹🇼' },
    { code: 'HK', name: 'Hong Kong', flag: '🇭🇰' },
    { code: 'IN', name: 'India', flag: '🇮🇳' },
    { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰' },
    { code: 'MV', name: 'Maldives', flag: '🇲🇻' },
    { code: 'AE', name: 'UAE', flag: '🇦🇪' },
    { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
    { code: 'QA', name: 'Qatar', flag: '🇶🇦' },
    { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺' },
    { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦' },
    { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
    { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
    { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
    { code: 'CL', name: 'Chile', flag: '🇨🇱' },
    { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
    { code: 'PE', name: 'Peru', flag: '🇵🇪' },
    { code: 'GB', name: 'Anh', flag: '🇬🇧' },
    { code: 'FR', name: 'France', flag: '🇫🇷' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪' },
    { code: 'IT', name: 'Italy', flag: '🇮🇹' },
    { code: 'ES', name: 'Spain', flag: '🇪🇸' },
    { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
    { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
    { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
    { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
    { code: 'AT', name: 'Austria', flag: '🇦🇹' },
    { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
    { code: 'NO', name: 'Na Uy', flag: '🇳🇴' },
    { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
    { code: 'FI', name: 'Finland', flag: '🇫🇮' },
    { code: 'GR', name: 'Greece', flag: '🇬🇷' },
    { code: 'HR', name: 'Croatia', flag: '🇭🇷' },
    { code: 'CZ', name: 'Czech', flag: '🇨🇿' },
    { code: 'PL', name: 'Ba Lan', flag: '🇵🇱' },
    { code: 'RU', name: 'Nga', flag: '🇷🇺' },
    { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
    { code: 'MA', name: 'Morocco', flag: '🇲🇦' },
    { code: 'ZA', name: 'Nam Phi', flag: '🇿🇦' },
    { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
    { code: 'TZ', name: 'Tanzania', flag: '🇹🇿' },
    { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
    { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
] as const

export type CountryCode = typeof COUNTRIES[number]['code']

/**
 * Get country name by code
 */
export function getCountryName(code: string): string {
    return COUNTRIES.find(c => c.code === code)?.name || code
}

/**
 * Get country with flag by code
 */
export function getCountryDisplay(code: string): string {
    const country = COUNTRIES.find(c => c.code === code)
    return country ? `${country.flag} ${country.name}` : code
}
