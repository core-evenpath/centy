'use server';

import { db } from '@/lib/firebase-admin';
import { unstable_cache } from 'next/cache';

// Fallback imports (code-based)
import {
    INDUSTRIES as CODE_INDUSTRIES,
    BUSINESS_FUNCTIONS as CODE_FUNCTIONS,
    SPECIALIZATIONS as CODE_SPECIALIZATIONS
} from '@/lib/business-taxonomy/industries';
import { COUNTRY_OVERRIDES as CODE_OVERRIDES } from '@/lib/business-taxonomy/country-overrides';

// Types
export interface TaxonomyIndustry {
    industryId: string;
    name: string;
    description?: string;
    iconName: string;
    isActive: boolean;
    sortOrder: number;
}

export interface TaxonomyFunction {
    functionId: string;
    industryId: string;
    name: string;
    description?: string;
    googlePlacesTypes?: string[];
    keywords?: string[];
    isActive: boolean;
    sortOrder: number;
}

export interface TaxonomyCountryOverride {
    overrideId: string;
    functionId: string;
    countryCode: string;
    localLabel: string;
    aliases?: string[];
}

export interface ResolvedFunction extends TaxonomyFunction {
    displayLabel: string;
    industryName: string;
    isLocalized: boolean;
}

/**
 * Get all active industries
 * Tries Firestore first, falls back to code
 */
export const getIndustries = unstable_cache(
    async (): Promise<TaxonomyIndustry[]> => {
        try {
            // Check if DB is initialized
            if (!db) {
                console.warn('[Taxonomy] No DB, using code fallback');
                return CODE_INDUSTRIES.map((ind, i) => ({ ...ind, isActive: true, sortOrder: i }));
            }

            const snapshot = await db
                .collection('systemTaxonomy')
                .doc('industries')
                .collection('items')
                .where('isActive', '==', true)
                .orderBy('sortOrder')
                .get();

            if (snapshot.empty) {
                console.warn('[Taxonomy] Firestore industries empty, using code fallback');
                return CODE_INDUSTRIES.map((ind, i) => ({ ...ind, isActive: true, sortOrder: i }));
            }

            return snapshot.docs.map(doc => ({
                industryId: doc.id,
                ...doc.data()
            } as TaxonomyIndustry));
        } catch (error) {
            console.error('[Taxonomy] Firestore error getting industries, using code fallback:', error);
            return CODE_INDUSTRIES.map((ind, i) => ({ ...ind, isActive: true, sortOrder: i }));
        }
    },
    ['taxonomy-industries'],
    { revalidate: 300, tags: ['taxonomy'] }
);

/**
 * Get business functions
 * Optional industryId filter
 */
export const getBusinessFunctions = unstable_cache(
    async (industryId?: string): Promise<TaxonomyFunction[]> => {
        try {
            if (!db) {
                let functions = CODE_FUNCTIONS.map((func, i) => ({ ...func, isActive: true, sortOrder: i }));
                if (industryId) {
                    functions = functions.filter(f => f.industryId === industryId);
                }
                return functions;
            }

            let query: FirebaseFirestore.Query = db
                .collection('systemTaxonomy')
                .doc('businessFunctions')
                .collection('items');

            if (industryId) {
                query = query.where('industryId', '==', industryId);
            }

            // Note: Compound queries might require index if we sort by sortOrder
            // For now, let's just get them and sort in memory if needed, or rely on default order
            const snapshot = await query.get();

            if (snapshot.empty) {
                let functions = CODE_FUNCTIONS.map((func, i) => ({ ...func, isActive: true, sortOrder: i }));
                if (industryId) {
                    functions = functions.filter(f => f.industryId === industryId);
                }
                return functions;
            }

            const functions = snapshot.docs.map(doc => ({
                functionId: doc.id,
                ...doc.data()
            } as TaxonomyFunction));

            // Sort by sortOrder in memory to avoid complex index requirements for simple queries
            return functions.sort((a, b) => a.sortOrder - b.sortOrder);

        } catch (error) {
            console.error('[Taxonomy] Firestore error getting functions, using code fallback:', error);
            let functions = CODE_FUNCTIONS.map((func, i) => ({ ...func, isActive: true, sortOrder: i }));
            if (industryId) {
                functions = functions.filter(f => f.industryId === industryId);
            }
            return functions;
        }
    },
    ['taxonomy-functions'],
    { revalidate: 300, tags: ['taxonomy'] }
);

/**
 * Get country overrides
 * Optional countryCode filter
 */
export const getCountryOverrides = unstable_cache(
    async (countryCode?: string): Promise<TaxonomyCountryOverride[]> => {
        try {
            if (!db) {
                let overrides = CODE_OVERRIDES;
                if (countryCode) {
                    overrides = overrides.filter(o => o.countryCode === countryCode);
                }
                return overrides;
            }

            let query: FirebaseFirestore.Query = db
                .collection('systemTaxonomy')
                .doc('countryOverrides')
                .collection('items');

            if (countryCode) {
                query = query.where('countryCode', '==', countryCode);
            }

            const snapshot = await query.get();

            if (snapshot.empty) {
                let overrides = CODE_OVERRIDES;
                if (countryCode) {
                    overrides = overrides.filter(o => o.countryCode === countryCode);
                }
                return overrides;
            }

            return snapshot.docs.map(doc => ({
                overrideId: doc.id,
                ...doc.data()
            } as TaxonomyCountryOverride));
        } catch (error) {
            console.error('[Taxonomy] Firestore error getting overrides, using code fallback:', error);
            let overrides = CODE_OVERRIDES;
            if (countryCode) {
                overrides = overrides.filter(o => o.countryCode === countryCode);
            }
            return overrides;
        }
    },
    ['taxonomy-overrides'],
    { revalidate: 300, tags: ['taxonomy'] }
);

/**
 * Get resolved functions for an industry with localization
 */
export async function getResolvedFunctionsForIndustry(
    industryId: string,
    countryCode: string
): Promise<ResolvedFunction[]> {
    // Parallel fetch functions and overrides (and industries to get the name)
    const [functions, overrides, industries] = await Promise.all([
        getBusinessFunctions(industryId),
        getCountryOverrides(countryCode),
        getIndustries()
    ]);

    const industry = industries.find(i => i.industryId === industryId);
    const industryName = industry ? industry.name : 'Unknown Industry';

    // Create a map for quick lookup of overrides by functionId
    const overridesMap = new Map<string, string>();
    overrides.forEach(o => {
        overridesMap.set(o.functionId, o.localLabel);
    });

    // Map functions to ResolvedFunctions
    return functions.map(func => {
        const overrideLabel = overridesMap.get(func.functionId);

        return {
            ...func,
            displayLabel: overrideLabel || func.name,
            industryName,
            isLocalized: !!overrideLabel
        };
    });
}
