/**
 * ISO 3166-1 alpha-2 country codes with names
 * Used in onboarding and hotel management
 */
export const COUNTRIES = [
    { code: 'VN', name: 'Việt Nam', flag: '🇻🇳' },
    { code: 'TH', name: 'Thái Lan', flag: '🇹🇭' },
    { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
    { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
    { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
    { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
    { code: 'KH', name: 'Campuchia', flag: '🇰🇭' },
    { code: 'LA', name: 'Lào', flag: '🇱🇦' },
    { code: 'MM', name: 'Myanmar', flag: '🇲🇲' },
    { code: 'JP', name: 'Nhật Bản', flag: '🇯🇵' },
    { code: 'KR', name: 'Hàn Quốc', flag: '🇰🇷' },
    { code: 'CN', name: 'Trung Quốc', flag: '🇨🇳' },
    { code: 'TW', name: 'Đài Loan', flag: '🇹🇼' },
    { code: 'HK', name: 'Hồng Kông', flag: '🇭🇰' },
    { code: 'IN', name: 'Ấn Độ', flag: '🇮🇳' },
    { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰' },
    { code: 'MV', name: 'Maldives', flag: '🇲🇻' },
    { code: 'AE', name: 'UAE', flag: '🇦🇪' },
    { code: 'SA', name: 'Ả Rập Xê Út', flag: '🇸🇦' },
    { code: 'QA', name: 'Qatar', flag: '🇶🇦' },
    { code: 'TR', name: 'Thổ Nhĩ Kỳ', flag: '🇹🇷' },
    { code: 'AU', name: 'Úc', flag: '🇦🇺' },
    { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
    { code: 'US', name: 'Hoa Kỳ', flag: '🇺🇸' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦' },
    { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
    { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
    { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
    { code: 'CL', name: 'Chile', flag: '🇨🇱' },
    { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
    { code: 'PE', name: 'Peru', flag: '🇵🇪' },
    { code: 'GB', name: 'Anh', flag: '🇬🇧' },
    { code: 'FR', name: 'Pháp', flag: '🇫🇷' },
    { code: 'DE', name: 'Đức', flag: '🇩🇪' },
    { code: 'IT', name: 'Ý', flag: '🇮🇹' },
    { code: 'ES', name: 'Tây Ban Nha', flag: '🇪🇸' },
    { code: 'PT', name: 'Bồ Đào Nha', flag: '🇵🇹' },
    { code: 'NL', name: 'Hà Lan', flag: '🇳🇱' },
    { code: 'BE', name: 'Bỉ', flag: '🇧🇪' },
    { code: 'CH', name: 'Thụy Sĩ', flag: '🇨🇭' },
    { code: 'AT', name: 'Áo', flag: '🇦🇹' },
    { code: 'SE', name: 'Thụy Điển', flag: '🇸🇪' },
    { code: 'NO', name: 'Na Uy', flag: '🇳🇴' },
    { code: 'DK', name: 'Đan Mạch', flag: '🇩🇰' },
    { code: 'FI', name: 'Phần Lan', flag: '🇫🇮' },
    { code: 'GR', name: 'Hy Lạp', flag: '🇬🇷' },
    { code: 'HR', name: 'Croatia', flag: '🇭🇷' },
    { code: 'CZ', name: 'Czech', flag: '🇨🇿' },
    { code: 'PL', name: 'Ba Lan', flag: '🇵🇱' },
    { code: 'RU', name: 'Nga', flag: '🇷🇺' },
    { code: 'EG', name: 'Ai Cập', flag: '🇪🇬' },
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
