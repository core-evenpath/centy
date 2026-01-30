'use server';

import { db } from '@/lib/firebase-admin';
import { unstable_cache } from 'next/cache';

import {
    INDUSTRIES as CODE_INDUSTRIES,
    BUSINESS_FUNCTIONS as CODE_FUNCTIONS,
    SPECIALIZATIONS as CODE_SPECIALIZATIONS
} from '@/lib/business-taxonomy/industries';
import { COUNTRY_OVERRIDES as CODE_OVERRIDES } from '@/lib/business-taxonomy/country-overrides';
import {
    TaxonomyIndustry,
    TaxonomyFunction,
    TaxonomySpecialization,
    TaxonomyCountryOverride,
    ResolvedFunction,
    SelectedBusinessCategory
} from '@/lib/business-taxonomy/types';

// Helper to serialize Timestamps
function serializeTimestamps<T>(obj: T): T {
    if (obj === null || obj === undefined) return obj;

    if (Array.isArray(obj)) {
        return obj.map(item => serializeTimestamps(item)) as any;
    }

    if (typeof obj === 'object') {
        // Check if it's a Firestore Timestamp
        if ('_seconds' in obj && '_nanoseconds' in obj) {
            return new Date((obj as any)._seconds * 1000).toISOString() as any;
        }

        // Check for toDate method (Firestore Timestamp instance)
        if (typeof (obj as any).toDate === 'function') {
            return (obj as any).toDate().toISOString() as any;
        }

        // Recursively process object properties
        const result: any = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                result[key] = serializeTimestamps((obj as any)[key]);
            }
        }
        return result as T;
    }

    return obj;
}

export const getIndustries = unstable_cache(
    async (): Promise<TaxonomyIndustry[]> => {
        try {
            if (!db) {
                console.warn('[Taxonomy] No DB, using code fallback');
                return CODE_INDUSTRIES.map((ind, i) => ({
                    ...ind,
                    isActive: true,
                    sortOrder: i + 1
                }));
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
                return CODE_INDUSTRIES.map((ind, i) => ({
                    ...ind,
                    isActive: true,
                    sortOrder: i + 1
                }));
            }

            return snapshot.docs.map(doc => serializeTimestamps({
                industryId: doc.id,
                ...doc.data()
            } as TaxonomyIndustry));
        } catch (error) {
            console.error('[Taxonomy] Error fetching industries:', error);
            return CODE_INDUSTRIES.map((ind, i) => ({
                ...ind,
                isActive: true,
                sortOrder: i + 1
            }));
        }
    },
    ['taxonomy-industries'],
    { revalidate: 300, tags: ['taxonomy'] }
);

export const getBusinessFunctions = unstable_cache(
    async (industryId?: string): Promise<TaxonomyFunction[]> => {
        try {
            if (!db) {
                let functions = CODE_FUNCTIONS;
                if (industryId) {
                    functions = functions.filter(f => f.industryId === industryId);
                }
                return functions.map((f, i) => ({
                    ...f,
                    isActive: true,
                    sortOrder: i + 1
                }));
            }

            let query: FirebaseFirestore.Query = db
                .collection('systemTaxonomy')
                .doc('businessFunctions')
                .collection('items')
                .where('isActive', '==', true);

            if (industryId) {
                query = query.where('industryId', '==', industryId);
            }

            // In-memory sort if composite index is missing or for query performance
            // Fallback to sorting in memory if needed, but here we try orderBy
            // If this fails due to index, we catch error. 
            // Ideally we just get all and sort in memory if filter is complex

            // Note: The previous implementation did in-memory sort. 
            // We can try orderBy('sortOrder') but if it fails we should handle it.
            // However, with single field equality + sort, it should be fine or require index.
            // We added index earlier!
            query = query.orderBy('sortOrder');

            const snapshot = await query.get();

            if (snapshot.empty) {
                let functions = CODE_FUNCTIONS;
                if (industryId) {
                    functions = functions.filter(f => f.industryId === industryId);
                }
                return functions.map((f, i) => ({
                    ...f,
                    isActive: true,
                    sortOrder: i + 1
                }));
            }

            return snapshot.docs.map(doc => serializeTimestamps({
                functionId: doc.id,
                ...doc.data()
            } as TaxonomyFunction));
        } catch (error) {
            console.error('[Taxonomy] Error fetching functions:', error);
            // Fallback
            let functions = CODE_FUNCTIONS;
            if (industryId) {
                functions = functions.filter(f => f.industryId === industryId);
            }
            return functions.map((f, i) => ({
                ...f,
                isActive: true,
                sortOrder: i + 1
            }));
        }
    },
    ['taxonomy-functions'],
    { revalidate: 300, tags: ['taxonomy'] }
);

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

            return snapshot.docs.map(doc => serializeTimestamps({
                overrideId: doc.id,
                ...doc.data()
            } as TaxonomyCountryOverride));
        } catch (error) {
            console.error('[Taxonomy] Error fetching overrides:', error);
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

export async function getResolvedFunctionsForIndustry(
    industryId: string,
    countryCode: string
): Promise<ResolvedFunction[]> {
    const [functions, overrides, industries] = await Promise.all([
        getBusinessFunctions(industryId),
        getCountryOverrides(countryCode),
        getIndustries()
    ]);

    const industry = industries.find(i => i.industryId === industryId);
    const industryName = industry?.name || 'Unknown';

    const overridesMap = new Map<string, string>();
    overrides.forEach(o => {
        overridesMap.set(o.functionId, o.localLabel);
    });

    return functions.map(func => ({
        ...func,
        displayLabel: overridesMap.get(func.functionId) || func.name,
        industryName,
        isLocalized: overridesMap.has(func.functionId)
    }));
}

export async function getAllResolvedFunctions(
    countryCode: string
): Promise<ResolvedFunction[]> {
    const [functions, overrides, industries] = await Promise.all([
        getBusinessFunctions(),
        getCountryOverrides(countryCode),
        getIndustries()
    ]);

    const industriesMap = new Map<string, string>();
    industries.forEach(i => industriesMap.set(i.industryId, i.name));

    const overridesMap = new Map<string, TaxonomyCountryOverride>();
    overrides.forEach(o => overridesMap.set(o.functionId, o));

    return functions.map(func => {
        const override = overridesMap.get(func.functionId);
        return {
            ...func,
            displayLabel: override?.localLabel || func.name,
            industryName: industriesMap.get(func.industryId) || 'Unknown',
            isLocalized: !!override
        };
    });
}

export async function searchFunctions(
    query: string,
    countryCode: string
): Promise<ResolvedFunction[]> {
    const searchLower = query.toLowerCase().trim();
    if (!searchLower) return [];

    const allFunctions = await getAllResolvedFunctions(countryCode);
    const [overrides] = await Promise.all([getCountryOverrides(countryCode)]);

    const overridesMap = new Map<string, TaxonomyCountryOverride>();
    overrides.forEach(o => overridesMap.set(o.functionId, o));

    return allFunctions.filter(func => {
        if (func.displayLabel.toLowerCase().includes(searchLower)) return true;
        if (func.name.toLowerCase().includes(searchLower)) return true;
        if (func.keywords?.some(k => k.toLowerCase().includes(searchLower))) return true;
        if (func.googlePlacesTypes?.some(t => t.toLowerCase().includes(searchLower))) return true;

        const override = overridesMap.get(func.functionId);
        if (override?.aliases?.some(a => a.toLowerCase().includes(searchLower))) return true;

        return false;
    });
}

export async function toSelectedCategories(
    functionIds: string[],
    countryCode: string
): Promise<SelectedBusinessCategory[]> {
    const [functions, overrides, industries] = await Promise.all([
        getBusinessFunctions(),
        getCountryOverrides(countryCode),
        getIndustries()
    ]);

    const functionsMap = new Map<string, TaxonomyFunction>();
    functions.forEach(f => functionsMap.set(f.functionId, f));

    const overridesMap = new Map<string, string>();
    overrides.forEach(o => overridesMap.set(o.functionId, o.localLabel));

    return functionIds
        .map(functionId => {
            const func = functionsMap.get(functionId);
            if (!func) return null;

            return {
                industryId: func.industryId,
                functionId,
                label: overridesMap.get(functionId) || func.name,
                googlePlacesTypes: func.googlePlacesTypes || [],
            };
        })
        .filter((c): c is SelectedBusinessCategory => c !== null);
}

export async function findFunctionInfo(
    functionId: string,
    countryCode: string
): Promise<{
    industry: TaxonomyIndustry | undefined;
    function: TaxonomyFunction | undefined;
    displayLabel: string;
}> {
    const [functions, overrides, industries] = await Promise.all([
        getBusinessFunctions(),
        getCountryOverrides(countryCode),
        getIndustries()
    ]);

    const func = functions.find(f => f.functionId === functionId);
    const industry = func ? industries.find(i => i.industryId === func.industryId) : undefined;
    const override = overrides.find(o => o.functionId === functionId);

    return {
        industry,
        function: func,
        displayLabel: override?.localLabel || func?.name || ''
    };
}

export async function getIndustryById(
    industryId: string
): Promise<TaxonomyIndustry | undefined> {
    const industries = await getIndustries();
    return industries.find(i => i.industryId === industryId);
}

export async function getFunctionById(
    functionId: string
): Promise<TaxonomyFunction | undefined> {
    const functions = await getBusinessFunctions();
    return functions.find(f => f.functionId === functionId);
}
