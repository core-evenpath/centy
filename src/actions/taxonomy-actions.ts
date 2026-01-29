'use server';

import {
    getIndustries,
    getBusinessFunctions,
    getCountryOverrides,
    getResolvedFunctionsForIndustry,
    getAllResolvedFunctions,
    searchFunctions,
    toSelectedCategories,
    findFunctionInfo,
    getIndustryById,
    getFunctionById
} from '@/services/taxonomy-service';

import {
    type TaxonomyIndustry,
    type TaxonomyFunction,
    type TaxonomyCountryOverride,
    type ResolvedFunction,
    type SelectedBusinessCategory
} from '@/lib/business-taxonomy/types';

export async function getIndustriesAction(): Promise<{
    success: boolean;
    industries?: TaxonomyIndustry[];
    error?: string;
}> {
    try {
        const industries = await getIndustries();
        return { success: true, industries };
    } catch (error: any) {
        console.error('[TaxonomyAction] getIndustries error:', error);
        return { success: false, error: error.message };
    }
}

export async function getBusinessFunctionsAction(industryId?: string): Promise<{
    success: boolean;
    functions?: TaxonomyFunction[];
    error?: string;
}> {
    try {
        const functions = await getBusinessFunctions(industryId);
        return { success: true, functions };
    } catch (error: any) {
        console.error('[TaxonomyAction] getBusinessFunctions error:', error);
        return { success: false, error: error.message };
    }
}

export async function getResolvedFunctionsAction(
    industryId: string,
    countryCode: string
): Promise<{
    success: boolean;
    functions?: ResolvedFunction[];
    error?: string;
}> {
    try {
        const functions = await getResolvedFunctionsForIndustry(industryId, countryCode);
        return { success: true, functions };
    } catch (error: any) {
        console.error('[TaxonomyAction] getResolvedFunctions error:', error);
        return { success: false, error: error.message };
    }
}

export async function getAllResolvedFunctionsAction(
    countryCode: string
): Promise<{
    success: boolean;
    functions?: ResolvedFunction[];
    error?: string;
}> {
    try {
        const functions = await getAllResolvedFunctions(countryCode);
        return { success: true, functions };
    } catch (error: any) {
        console.error('[TaxonomyAction] getAllResolvedFunctions error:', error);
        return { success: false, error: error.message };
    }
}

export async function searchFunctionsAction(
    query: string,
    countryCode: string
): Promise<{
    success: boolean;
    functions?: ResolvedFunction[];
    error?: string;
}> {
    try {
        const functions = await searchFunctions(query, countryCode);
        return { success: true, functions };
    } catch (error: any) {
        console.error('[TaxonomyAction] searchFunctions error:', error);
        return { success: false, error: error.message };
    }
}

export async function toSelectedCategoriesAction(
    functionIds: string[],
    countryCode: string
): Promise<{
    success: boolean;
    categories?: SelectedBusinessCategory[];
    error?: string;
}> {
    try {
        const categories = await toSelectedCategories(functionIds, countryCode);
        return { success: true, categories };
    } catch (error: any) {
        console.error('[TaxonomyAction] toSelectedCategories error:', error);
        return { success: false, error: error.message };
    }
}

export async function findFunctionInfoAction(
    functionId: string,
    countryCode: string
): Promise<{
    success: boolean;
    data?: {
        industry: TaxonomyIndustry | undefined;
        function: TaxonomyFunction | undefined;
        displayLabel: string;
    };
    error?: string;
}> {
    try {
        const data = await findFunctionInfo(functionId, countryCode);
        return { success: true, data };
    } catch (error: any) {
        console.error('[TaxonomyAction] findFunctionInfo error:', error);
        return { success: false, error: error.message };
    }
}
