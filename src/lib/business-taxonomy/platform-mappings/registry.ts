/**
 * Platform Mapping Registry
 *
 * Central registry for resolving business functions to platform-specific categories.
 */

import type {
    PlatformId,
    PlatformConfig,
    PlatformCategory,
    ResolvedPlatformCategory,
} from './types';
import WHATSAPP_CONFIG, { getWhatsAppIndustryFallback } from './whatsapp';
// Import directly from industries to avoid circular dependency
import { BUSINESS_FUNCTIONS, INDUSTRIES } from '../industries';

// Helper functions to avoid circular dependency with index.ts
function getFunctionById(functionId: string) {
    return BUSINESS_FUNCTIONS.find(f => f.functionId === functionId);
}

function getIndustryById(industryId: string) {
    return INDUSTRIES.find(i => i.industryId === industryId);
}

// Platform registry - add new platforms here
const PLATFORM_REGISTRY: Record<string, PlatformConfig> = {
    whatsapp: WHATSAPP_CONFIG,
    // google: GOOGLE_CONFIG,
    // telegram: TELEGRAM_CONFIG,
};

/**
 * Get list of supported platforms
 */
export function getSupportedPlatforms(): { id: PlatformId; name: string }[] {
    return Object.entries(PLATFORM_REGISTRY).map(([id, config]) => ({
        id: id as PlatformId,
        name: config.name,
    }));
}

/**
 * Get platform configuration by ID
 */
export function getPlatformConfig(platformId: PlatformId): PlatformConfig | undefined {
    return PLATFORM_REGISTRY[platformId];
}

/**
 * Get platform categories for a specific business function
 *
 * @param functionId - The business function ID
 * @param platformId - The platform to get categories for
 * @returns Resolved platform categories or null if not found
 */
export function getPlatformCategoriesForFunction(
    functionId: string,
    platformId: PlatformId
): ResolvedPlatformCategory | null {
    const config = PLATFORM_REGISTRY[platformId];
    if (!config) return null;

    const func = getFunctionById(functionId);
    if (!func) return null;

    // Look for direct mapping
    const mapping = config.mappings.find(m => m.functionId === functionId);

    if (mapping) {
        const categories = mapping.primary
            .map(id => config.categories.find(c => c.categoryId === id))
            .filter((c): c is PlatformCategory => c !== undefined);

        return {
            functionId,
            functionLabel: func.name,
            platformId,
            platformCategories: categories,
            confidence: mapping.confidence,
            isFallback: false,
        };
    }

    // Try industry-level fallback
    if (config.fallbackStrategy === 'industry') {
        const industryFallback = getIndustryFallback(func.industryId, platformId);

        if (industryFallback.length > 0) {
            const categories = industryFallback
                .map(id => config.categories.find(c => c.categoryId === id))
                .filter((c): c is PlatformCategory => c !== undefined);

            return {
                functionId,
                functionLabel: func.name,
                platformId,
                platformCategories: categories,
                confidence: 'fallback',
                isFallback: true,
            };
        }
    }

    return null;
}

/**
 * Get industry-level fallback categories for a platform
 */
function getIndustryFallback(industryId: string, platformId: PlatformId): string[] {
    switch (platformId) {
        case 'whatsapp':
            return getWhatsAppIndustryFallback(industryId);
        // Add other platforms as needed
        default:
            return [];
    }
}

/**
 * Get all platform mappings for a function across all platforms
 *
 * @param functionId - The business function ID
 * @returns Record of platform IDs to resolved categories
 */
export function getAllPlatformMappings(functionId: string): Record<PlatformId, ResolvedPlatformCategory | null> {
    const result: Record<string, ResolvedPlatformCategory | null> = {};

    for (const platformId of Object.keys(PLATFORM_REGISTRY) as PlatformId[]) {
        result[platformId] = getPlatformCategoriesForFunction(functionId, platformId);
    }

    return result as Record<PlatformId, ResolvedPlatformCategory | null>;
}

/**
 * Search platform categories by label
 *
 * @param platformId - The platform to search in
 * @param query - Search query
 * @returns Matching platform categories
 */
export function searchPlatformCategories(
    platformId: PlatformId,
    query: string
): PlatformCategory[] {
    const config = PLATFORM_REGISTRY[platformId];
    if (!config) return [];

    const lowerQuery = query.toLowerCase();
    return config.categories.filter(c =>
        c.label.toLowerCase().includes(lowerQuery) ||
        c.categoryId.toLowerCase().includes(lowerQuery)
    );
}

/**
 * Check if a category ID is valid for a platform
 *
 * @param platformId - The platform
 * @param categoryId - The category ID to validate
 * @returns True if category exists for platform
 */
export function isValidPlatformCategory(
    platformId: PlatformId,
    categoryId: string
): boolean {
    const config = PLATFORM_REGISTRY[platformId];
    if (!config) return false;
    return config.categories.some(c => c.categoryId === categoryId);
}

/**
 * Get all categories for a platform
 *
 * @param platformId - The platform
 * @returns All categories for the platform
 */
export function getPlatformCategories(platformId: PlatformId): PlatformCategory[] {
    const config = PLATFORM_REGISTRY[platformId];
    if (!config) return [];
    return config.categories;
}

/**
 * Get top-level (parent) categories for a platform
 *
 * @param platformId - The platform
 * @returns Top-level categories only
 */
export function getTopLevelCategories(platformId: PlatformId): PlatformCategory[] {
    const config = PLATFORM_REGISTRY[platformId];
    if (!config) return [];
    return config.categories.filter(c => !c.parentId);
}

/**
 * Get child categories for a parent category
 *
 * @param platformId - The platform
 * @param parentId - Parent category ID
 * @returns Child categories
 */
export function getChildCategories(
    platformId: PlatformId,
    parentId: string
): PlatformCategory[] {
    const config = PLATFORM_REGISTRY[platformId];
    if (!config) return [];
    return config.categories.filter(c => c.parentId === parentId);
}
