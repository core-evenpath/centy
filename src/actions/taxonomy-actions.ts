'use server';

import {
    getIndustries,
    getBusinessFunctions,
    getCountryOverrides,
    getResolvedFunctionsForIndustry,
    TaxonomyIndustry,
    TaxonomyFunction,
    ResolvedFunction
} from '@/services/taxonomy-service';

export async function getIndustriesAction(): Promise<{
    success: boolean;
    industries?: TaxonomyIndustry[];
    error?: string;
}> {
    try {
        const industries = await getIndustries();
        return { success: true, industries };
    } catch (error: any) {
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
        return { success: false, error: error.message };
    }
}
