/**
 * Complete Countries List with Regional Mapping
 * 
 * This provides all countries for UI dropdown selection.
 * Region codes enable regional heuristics for defaults.
 */

import { CountryCode } from './types';

export interface Country {
    countryCode: string;
    name: string;
    flag: string;
    regionCode: string;
    active: boolean;
}

export interface Region {
    regionCode: string;
    name: string;
    description: string;
}

export interface RegionalHeuristics {
    regionCode: string;
    communicationDefaults: {
        primary: 'whatsapp' | 'email' | 'sms';
        secondary: 'whatsapp' | 'email' | 'sms';
    };
    aiTone: 'friendly' | 'professional' | 'formal';
    mobileFirst: boolean;
    complianceSensitivity: 'low' | 'medium' | 'high';
}

/**
 * All Regions
 */
export const REGIONS: Region[] = [
    { regionCode: 'NA', name: 'North America', description: 'English-speaking, high digital adoption' },
    { regionCode: 'EU', name: 'Europe', description: 'GDPR-heavy, formal business environment' },
    { regionCode: 'UK', name: 'United Kingdom', description: 'Commonwealth standards, formal communication' },
    { regionCode: 'LATAM', name: 'Latin America', description: 'WhatsApp-first, conversational commerce' },
    { regionCode: 'MENA', name: 'Middle East & North Africa', description: 'Multilingual, high WhatsApp usage' },
    { regionCode: 'SA', name: 'South Asia', description: 'Mobile-first, multichannel' },
    { regionCode: 'SEA', name: 'Southeast Asia', description: 'Messaging-heavy, mobile-first commerce' },
    { regionCode: 'EA', name: 'East Asia', description: 'Digital-first, local platform preferences' },
    { regionCode: 'ANZ', name: 'Australia & New Zealand', description: 'English-speaking, Western business norms' },
    { regionCode: 'SSA', name: 'Sub-Saharan Africa', description: 'Mobile-money, WhatsApp-heavy' },
    { regionCode: 'CIS', name: 'CIS / Eastern Europe', description: 'Telegram-heavy, growing digital adoption' },
];

/**
 * Regional Heuristics - Soft Defaults
 */
export const REGIONAL_HEURISTICS: RegionalHeuristics[] = [
    {
        regionCode: 'NA',
        communicationDefaults: { primary: 'email', secondary: 'sms' },
        aiTone: 'professional',
        mobileFirst: false,
        complianceSensitivity: 'medium',
    },
    {
        regionCode: 'EU',
        communicationDefaults: { primary: 'email', secondary: 'whatsapp' },
        aiTone: 'formal',
        mobileFirst: false,
        complianceSensitivity: 'high',
    },
    {
        regionCode: 'UK',
        communicationDefaults: { primary: 'email', secondary: 'whatsapp' },
        aiTone: 'professional',
        mobileFirst: false,
        complianceSensitivity: 'high',
    },
    {
        regionCode: 'LATAM',
        communicationDefaults: { primary: 'whatsapp', secondary: 'email' },
        aiTone: 'friendly',
        mobileFirst: true,
        complianceSensitivity: 'low',
    },
    {
        regionCode: 'MENA',
        communicationDefaults: { primary: 'whatsapp', secondary: 'email' },
        aiTone: 'professional',
        mobileFirst: true,
        complianceSensitivity: 'medium',
    },
    {
        regionCode: 'SA',
        communicationDefaults: { primary: 'whatsapp', secondary: 'email' },
        aiTone: 'friendly',
        mobileFirst: true,
        complianceSensitivity: 'medium',
    },
    {
        regionCode: 'SEA',
        communicationDefaults: { primary: 'whatsapp', secondary: 'email' },
        aiTone: 'friendly',
        mobileFirst: true,
        complianceSensitivity: 'low',
    },
    {
        regionCode: 'EA',
        communicationDefaults: { primary: 'email', secondary: 'sms' },
        aiTone: 'formal',
        mobileFirst: true,
        complianceSensitivity: 'medium',
    },
    {
        regionCode: 'ANZ',
        communicationDefaults: { primary: 'email', secondary: 'sms' },
        aiTone: 'professional',
        mobileFirst: false,
        complianceSensitivity: 'medium',
    },
    {
        regionCode: 'SSA',
        communicationDefaults: { primary: 'whatsapp', secondary: 'sms' },
        aiTone: 'friendly',
        mobileFirst: true,
        complianceSensitivity: 'low',
    },
    {
        regionCode: 'CIS',
        communicationDefaults: { primary: 'email', secondary: 'whatsapp' },
        aiTone: 'professional',
        mobileFirst: false,
        complianceSensitivity: 'medium',
    },
];

/**
 * Complete list of all countries for UI dropdown
 * Organized alphabetically with region codes
 */
export const ALL_COUNTRIES: Country[] = [
    // North America
    { countryCode: 'US', name: 'United States', flag: '🇺🇸', regionCode: 'NA', active: true },
    { countryCode: 'CA', name: 'Canada', flag: '🇨🇦', regionCode: 'NA', active: true },
    { countryCode: 'MX', name: 'Mexico', flag: '🇲🇽', regionCode: 'LATAM', active: true },

    // Europe
    { countryCode: 'GB', name: 'United Kingdom', flag: '🇬🇧', regionCode: 'UK', active: true },
    { countryCode: 'DE', name: 'Germany', flag: '🇩🇪', regionCode: 'EU', active: true },
    { countryCode: 'FR', name: 'France', flag: '🇫🇷', regionCode: 'EU', active: true },
    { countryCode: 'IT', name: 'Italy', flag: '🇮🇹', regionCode: 'EU', active: true },
    { countryCode: 'ES', name: 'Spain', flag: '🇪🇸', regionCode: 'EU', active: true },
    { countryCode: 'NL', name: 'Netherlands', flag: '🇳🇱', regionCode: 'EU', active: true },
    { countryCode: 'BE', name: 'Belgium', flag: '🇧🇪', regionCode: 'EU', active: true },
    { countryCode: 'CH', name: 'Switzerland', flag: '🇨🇭', regionCode: 'EU', active: true },
    { countryCode: 'AT', name: 'Austria', flag: '🇦🇹', regionCode: 'EU', active: true },
    { countryCode: 'SE', name: 'Sweden', flag: '🇸🇪', regionCode: 'EU', active: true },
    { countryCode: 'NO', name: 'Norway', flag: '🇳🇴', regionCode: 'EU', active: true },
    { countryCode: 'DK', name: 'Denmark', flag: '🇩🇰', regionCode: 'EU', active: true },
    { countryCode: 'FI', name: 'Finland', flag: '🇫🇮', regionCode: 'EU', active: true },
    { countryCode: 'IE', name: 'Ireland', flag: '🇮🇪', regionCode: 'EU', active: true },
    { countryCode: 'PT', name: 'Portugal', flag: '🇵🇹', regionCode: 'EU', active: true },
    { countryCode: 'PL', name: 'Poland', flag: '🇵🇱', regionCode: 'EU', active: true },
    { countryCode: 'CZ', name: 'Czech Republic', flag: '🇨🇿', regionCode: 'EU', active: true },
    { countryCode: 'GR', name: 'Greece', flag: '🇬🇷', regionCode: 'EU', active: true },
    { countryCode: 'HU', name: 'Hungary', flag: '🇭🇺', regionCode: 'EU', active: true },
    { countryCode: 'RO', name: 'Romania', flag: '🇷🇴', regionCode: 'EU', active: true },

    // CIS / Eastern Europe
    { countryCode: 'RU', name: 'Russia', flag: '🇷🇺', regionCode: 'CIS', active: true },
    { countryCode: 'UA', name: 'Ukraine', flag: '🇺🇦', regionCode: 'CIS', active: true },
    { countryCode: 'KZ', name: 'Kazakhstan', flag: '🇰🇿', regionCode: 'CIS', active: true },
    { countryCode: 'BY', name: 'Belarus', flag: '🇧🇾', regionCode: 'CIS', active: true },

    // Middle East & North Africa
    { countryCode: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', regionCode: 'MENA', active: true },
    { countryCode: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', regionCode: 'MENA', active: true },
    { countryCode: 'QA', name: 'Qatar', flag: '🇶🇦', regionCode: 'MENA', active: true },
    { countryCode: 'KW', name: 'Kuwait', flag: '🇰🇼', regionCode: 'MENA', active: true },
    { countryCode: 'BH', name: 'Bahrain', flag: '🇧🇭', regionCode: 'MENA', active: true },
    { countryCode: 'OM', name: 'Oman', flag: '🇴🇲', regionCode: 'MENA', active: true },
    { countryCode: 'EG', name: 'Egypt', flag: '🇪🇬', regionCode: 'MENA', active: true },
    { countryCode: 'JO', name: 'Jordan', flag: '🇯🇴', regionCode: 'MENA', active: true },
    { countryCode: 'LB', name: 'Lebanon', flag: '🇱🇧', regionCode: 'MENA', active: true },
    { countryCode: 'IL', name: 'Israel', flag: '🇮🇱', regionCode: 'MENA', active: true },
    { countryCode: 'TR', name: 'Turkey', flag: '🇹🇷', regionCode: 'MENA', active: true },
    { countryCode: 'MA', name: 'Morocco', flag: '🇲🇦', regionCode: 'MENA', active: true },
    { countryCode: 'TN', name: 'Tunisia', flag: '🇹🇳', regionCode: 'MENA', active: true },
    { countryCode: 'DZ', name: 'Algeria', flag: '🇩🇿', regionCode: 'MENA', active: true },

    // South Asia
    { countryCode: 'IN', name: 'India', flag: '🇮🇳', regionCode: 'SA', active: true },
    { countryCode: 'PK', name: 'Pakistan', flag: '🇵🇰', regionCode: 'SA', active: true },
    { countryCode: 'BD', name: 'Bangladesh', flag: '🇧🇩', regionCode: 'SA', active: true },
    { countryCode: 'LK', name: 'Sri Lanka', flag: '🇱🇰', regionCode: 'SA', active: true },
    { countryCode: 'NP', name: 'Nepal', flag: '🇳🇵', regionCode: 'SA', active: true },

    // Southeast Asia
    { countryCode: 'SG', name: 'Singapore', flag: '🇸🇬', regionCode: 'SEA', active: true },
    { countryCode: 'MY', name: 'Malaysia', flag: '🇲🇾', regionCode: 'SEA', active: true },
    { countryCode: 'ID', name: 'Indonesia', flag: '🇮🇩', regionCode: 'SEA', active: true },
    { countryCode: 'TH', name: 'Thailand', flag: '🇹🇭', regionCode: 'SEA', active: true },
    { countryCode: 'VN', name: 'Vietnam', flag: '🇻🇳', regionCode: 'SEA', active: true },
    { countryCode: 'PH', name: 'Philippines', flag: '🇵🇭', regionCode: 'SEA', active: true },
    { countryCode: 'MM', name: 'Myanmar', flag: '🇲🇲', regionCode: 'SEA', active: true },

    // East Asia
    { countryCode: 'CN', name: 'China', flag: '🇨🇳', regionCode: 'EA', active: true },
    { countryCode: 'JP', name: 'Japan', flag: '🇯🇵', regionCode: 'EA', active: true },
    { countryCode: 'KR', name: 'South Korea', flag: '🇰🇷', regionCode: 'EA', active: true },
    { countryCode: 'TW', name: 'Taiwan', flag: '🇹🇼', regionCode: 'EA', active: true },
    { countryCode: 'HK', name: 'Hong Kong', flag: '🇭🇰', regionCode: 'EA', active: true },

    // Australia & New Zealand
    { countryCode: 'AU', name: 'Australia', flag: '🇦🇺', regionCode: 'ANZ', active: true },
    { countryCode: 'NZ', name: 'New Zealand', flag: '🇳🇿', regionCode: 'ANZ', active: true },

    // Latin America
    { countryCode: 'BR', name: 'Brazil', flag: '🇧🇷', regionCode: 'LATAM', active: true },
    { countryCode: 'AR', name: 'Argentina', flag: '🇦🇷', regionCode: 'LATAM', active: true },
    { countryCode: 'CL', name: 'Chile', flag: '🇨🇱', regionCode: 'LATAM', active: true },
    { countryCode: 'CO', name: 'Colombia', flag: '🇨🇴', regionCode: 'LATAM', active: true },
    { countryCode: 'PE', name: 'Peru', flag: '🇵🇪', regionCode: 'LATAM', active: true },
    { countryCode: 'VE', name: 'Venezuela', flag: '🇻🇪', regionCode: 'LATAM', active: true },
    { countryCode: 'EC', name: 'Ecuador', flag: '🇪🇨', regionCode: 'LATAM', active: true },
    { countryCode: 'UY', name: 'Uruguay', flag: '🇺🇾', regionCode: 'LATAM', active: true },
    { countryCode: 'PY', name: 'Paraguay', flag: '🇵🇾', regionCode: 'LATAM', active: true },
    { countryCode: 'BO', name: 'Bolivia', flag: '🇧🇴', regionCode: 'LATAM', active: true },
    { countryCode: 'CR', name: 'Costa Rica', flag: '🇨🇷', regionCode: 'LATAM', active: true },
    { countryCode: 'PA', name: 'Panama', flag: '🇵🇦', regionCode: 'LATAM', active: true },
    { countryCode: 'GT', name: 'Guatemala', flag: '🇬🇹', regionCode: 'LATAM', active: true },
    { countryCode: 'DO', name: 'Dominican Republic', flag: '🇩🇴', regionCode: 'LATAM', active: true },
    { countryCode: 'PR', name: 'Puerto Rico', flag: '🇵🇷', regionCode: 'LATAM', active: true },

    // Sub-Saharan Africa
    { countryCode: 'ZA', name: 'South Africa', flag: '🇿🇦', regionCode: 'SSA', active: true },
    { countryCode: 'NG', name: 'Nigeria', flag: '🇳🇬', regionCode: 'SSA', active: true },
    { countryCode: 'KE', name: 'Kenya', flag: '🇰🇪', regionCode: 'SSA', active: true },
    { countryCode: 'GH', name: 'Ghana', flag: '🇬🇭', regionCode: 'SSA', active: true },
    { countryCode: 'TZ', name: 'Tanzania', flag: '🇹🇿', regionCode: 'SSA', active: true },
    { countryCode: 'UG', name: 'Uganda', flag: '🇺🇬', regionCode: 'SSA', active: true },
    { countryCode: 'ET', name: 'Ethiopia', flag: '🇪🇹', regionCode: 'SSA', active: true },
    { countryCode: 'RW', name: 'Rwanda', flag: '🇷🇼', regionCode: 'SSA', active: true },
    { countryCode: 'SN', name: 'Senegal', flag: '🇸🇳', regionCode: 'SSA', active: true },
    { countryCode: 'CI', name: 'Côte d\'Ivoire', flag: '🇨🇮', regionCode: 'SSA', active: true },
];

/**
 * Get countries sorted alphabetically by name
 */
export function getCountriesSorted(): Country[] {
    return [...ALL_COUNTRIES].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Get countries grouped by region
 */
export function getCountriesByRegion(): Record<string, Country[]> {
    const grouped: Record<string, Country[]> = {};
    for (const country of ALL_COUNTRIES) {
        if (!grouped[country.regionCode]) {
            grouped[country.regionCode] = [];
        }
        grouped[country.regionCode].push(country);
    }
    return grouped;
}

/**
 * Get country by code
 */
export function getCountryByCode(code: string): Country | undefined {
    return ALL_COUNTRIES.find(c => c.countryCode === code);
}

/**
 * Get region by code
 */
export function getRegionByCode(code: string): Region | undefined {
    return REGIONS.find(r => r.regionCode === code);
}

/**
 * Get regional heuristics for a country
 */
export function getRegionalHeuristics(countryCode: string): RegionalHeuristics | undefined {
    const country = getCountryByCode(countryCode);
    if (!country) return undefined;
    return REGIONAL_HEURISTICS.find(h => h.regionCode === country.regionCode);
}

/**
 * Map old country codes to new format
 * UK -> GB for ISO compliance
 */
export function normalizeCountryCode(code: string): string {
    const mapping: Record<string, string> = {
        'UK': 'GB',
        'GLOBAL': 'GLOBAL',
    };
    return mapping[code] || code;
}

/**
 * Get display name for country code
 */
export function getCountryDisplayName(code: string): string {
    if (code === 'GLOBAL') return 'Global (Default)';
    const country = getCountryByCode(normalizeCountryCode(code));
    return country ? `${country.flag} ${country.name}` : code;
}
