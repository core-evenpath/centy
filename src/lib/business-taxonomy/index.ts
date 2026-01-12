/**
 * Business Taxonomy - Main Export
 * 
 * This module provides the global business taxonomy with country-specific overrides.
 * Use this to get localized business function labels for different countries.
 */

export * from './types';
export * from './industries';
export * from './country-overrides';
export * from './countries';

import { Industry, BusinessFunction, CountryCode, ResolvedFunction, SelectedBusinessCategory } from './types';
import { INDUSTRIES, BUSINESS_FUNCTIONS, SPECIALIZATIONS } from './industries';
import { getFunctionOverride, hasCountryOverrides } from './country-overrides';
import { ALL_COUNTRIES, REGIONS, REGIONAL_HEURISTICS, getCountryByCode, getRegionalHeuristics, getCountriesSorted, Country } from './countries';

/**
 * Get all industries
 */
export function getIndustries(): Industry[] {
    return INDUSTRIES;
}

/**
 * Get industry by ID
 */
export function getIndustryById(industryId: string): Industry | undefined {
    return INDUSTRIES.find(i => i.industryId === industryId);
}

/**
 * Get all business functions for an industry
 */
export function getFunctionsByIndustry(industryId: string): BusinessFunction[] {
    return BUSINESS_FUNCTIONS.filter(f => f.industryId === industryId);
}

/**
 * Get a business function by ID
 */
export function getFunctionById(functionId: string): BusinessFunction | undefined {
    return BUSINESS_FUNCTIONS.find(f => f.functionId === functionId);
}

/**
 * Get resolved functions with localized labels for a specific country and industry
 */
export function getResolvedFunctions(industryId: string, countryCode: CountryCode): ResolvedFunction[] {
    const industry = getIndustryById(industryId);
    const functions = getFunctionsByIndustry(industryId);

    return functions.map(func => {
        const override = getFunctionOverride(func.functionId, countryCode);
        return {
            ...func,
            displayLabel: override?.localLabel || func.name,
            industryName: industry?.name || '',
            isLocalized: !!override,
        };
    });
}

/**
 * Get all resolved functions with localized labels for a specific country
 */
export function getAllResolvedFunctions(countryCode: CountryCode): ResolvedFunction[] {
    return BUSINESS_FUNCTIONS.map(func => {
        const industry = getIndustryById(func.industryId);
        const override = getFunctionOverride(func.functionId, countryCode);
        return {
            ...func,
            displayLabel: override?.localLabel || func.name,
            industryName: industry?.name || '',
            isLocalized: !!override,
        };
    });
}

/**
 * Search functions by label or keywords across all industries
 */
export function searchFunctions(query: string, countryCode: CountryCode): ResolvedFunction[] {
    const searchLower = query.toLowerCase().trim();
    if (!searchLower) return [];

    const allResolved = getAllResolvedFunctions(countryCode);

    return allResolved.filter(func => {
        // Check display label
        if (func.displayLabel.toLowerCase().includes(searchLower)) return true;
        // Check global name (even if overridden)
        if (func.name.toLowerCase().includes(searchLower)) return true;
        // Check keywords
        if (func.keywords?.some(k => k.toLowerCase().includes(searchLower))) return true;
        // Check Google Places types
        if (func.googlePlacesTypes.some(t => t.toLowerCase().includes(searchLower))) return true;
        // Check override aliases
        const override = getFunctionOverride(func.functionId, countryCode);
        if (override?.aliases?.some(a => a.toLowerCase().includes(searchLower))) return true;

        return false;
    });
}

/**
 * Convert selected function IDs to SelectedBusinessCategory objects
 */
export function toSelectedCategories(functionIds: string[], countryCode: CountryCode): SelectedBusinessCategory[] {
    return functionIds.map(functionId => {
        const func = getFunctionById(functionId);
        const industry = func ? getIndustryById(func.industryId) : undefined;
        const override = getFunctionOverride(functionId, countryCode);

        return {
            industryId: func?.industryId || '',
            functionId,
            label: override?.localLabel || func?.name || '',
            googlePlacesTypes: func?.googlePlacesTypes || [],
        };
    }).filter(c => c.industryId); // Remove invalid entries
}

/**
 * Find industry and function info for a given function ID
 */
export function findFunctionInfo(functionId: string, countryCode: CountryCode): {
    industry: Industry | undefined;
    function: BusinessFunction | undefined;
    displayLabel: string;
} {
    const func = getFunctionById(functionId);
    const industry = func ? getIndustryById(func.industryId) : undefined;
    const override = getFunctionOverride(functionId, countryCode);

    return {
        industry,
        function: func,
        displayLabel: override?.localLabel || func?.name || '',
    };
}

/**
 * Get country display info - supports all countries
 */
export function getCountryInfo(countryCode: CountryCode): { code: string; name: string; flag: string; hasOverrides: boolean } {
    if (countryCode === 'GLOBAL' || !countryCode) {
        return { code: 'GLOBAL', name: 'Global (Default)', flag: '🌍', hasOverrides: false };
    }
    const country = getCountryByCode(countryCode);
    if (country) {
        return {
            code: country.countryCode,
            name: country.name,
            flag: country.flag,
            hasOverrides: hasCountryOverrides(countryCode)
        };
    }
    return { code: countryCode, name: countryCode, flag: '🏳️', hasOverrides: false };
}

/**
 * Get all countries for dropdown (sorted alphabetically)
 * Includes "Global (Default)" option at the top
 */
export function getCountriesForDropdown(): { code: string; name: string; flag: string; hasOverrides: boolean }[] {
    const global = { code: 'GLOBAL', name: 'Global (Default)', flag: '🌍', hasOverrides: false };
    const countries = getCountriesSorted().map(c => ({
        code: c.countryCode,
        name: c.name,
        flag: c.flag,
        hasOverrides: hasCountryOverrides(c.countryCode),
    }));
    return [global, ...countries];
}

/**
 * Legacy compatibility: Convert new taxonomy to old format
 * This helps during migration from the old business-categories.ts
 */
export function toLegacyFormat(countryCode: CountryCode) {
    return INDUSTRIES.map(industry => ({
        id: industry.industryId,
        label: industry.name,
        iconName: industry.iconName,
        industryCategory: industry.industryId,
        subCategories: getFunctionsByIndustry(industry.industryId).map(func => {
            const override = getFunctionOverride(func.functionId, countryCode);
            return {
                id: func.functionId,
                label: override?.localLabel || func.name,
                googlePlacesTypes: func.googlePlacesTypes,
                keywords: [...(func.keywords || []), ...(override?.aliases || [])],
            };
        }),
    }));
}

