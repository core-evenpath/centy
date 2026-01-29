'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    getIndustriesAction,
    getBusinessFunctionsAction,
    getResolvedFunctionsAction,
    getAllResolvedFunctionsAction,
    searchFunctionsAction,
    toSelectedCategoriesAction,
    findFunctionInfoAction
} from '@/actions/taxonomy-actions';

import {
    type TaxonomyIndustry,
    type TaxonomyFunction,
    type ResolvedFunction,
    type SelectedBusinessCategory
} from '@/lib/business-taxonomy/types';

export type { TaxonomyIndustry, TaxonomyFunction, ResolvedFunction, SelectedBusinessCategory };

export function useTaxonomyIndustries() {
    const [industries, setIndustries] = useState<TaxonomyIndustry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        getIndustriesAction()
            .then(result => {
                if (!mounted) return;
                if (result.success && result.industries) {
                    setIndustries(result.industries);
                } else {
                    setError(result.error || 'Failed to load industries');
                }
            })
            .catch(err => {
                if (mounted) setError(err.message);
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });

        return () => { mounted = false; };
    }, []);

    return { industries, loading, error };
}

export function useTaxonomyFunctions(industryId?: string) {
    const [functions, setFunctions] = useState<TaxonomyFunction[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchFunctions = useCallback(async (indId?: string) => {
        setLoading(true);
        setError(null);
        try {
            const result = await getBusinessFunctionsAction(indId);
            if (result.success && result.functions) {
                setFunctions(result.functions);
            } else {
                setError(result.error || 'Failed to load functions');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (industryId) {
            fetchFunctions(industryId);
        } else {
            setFunctions([]);
        }
    }, [industryId, fetchFunctions]);

    return { functions, loading, error, refetch: fetchFunctions };
}

export function useResolvedFunctions(industryId: string | null, countryCode: string) {
    const [functions, setFunctions] = useState<ResolvedFunction[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!industryId) {
            setFunctions([]);
            return;
        }

        let mounted = true;
        setLoading(true);

        getResolvedFunctionsAction(industryId, countryCode)
            .then(result => {
                if (!mounted) return;
                if (result.success && result.functions) {
                    setFunctions(result.functions);
                } else {
                    setError(result.error || 'Failed');
                }
            })
            .catch(err => {
                if (mounted) setError(err.message);
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });

        return () => { mounted = false; };
    }, [industryId, countryCode]);

    return { functions, loading, error };
}

export function useFunctionSearch(countryCode: string) {
    const [results, setResults] = useState<ResolvedFunction[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const search = useCallback(async (query: string) => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await searchFunctionsAction(query, countryCode);
            if (result.success && result.functions) {
                setResults(result.functions);
            } else {
                setError(result.error || 'Search failed');
                setResults([]);
            }
        } catch (err: any) {
            setError(err.message);
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, [countryCode]);

    const clear = useCallback(() => {
        setResults([]);
        setError(null);
    }, []);

    return { results, loading, error, search, clear };
}

export function useSelectedCategories(countryCode: string) {
    const [loading, setLoading] = useState(false);

    const convertToCategories = useCallback(async (
        functionIds: string[]
    ): Promise<SelectedBusinessCategory[]> => {
        if (functionIds.length === 0) return [];

        setLoading(true);
        try {
            const result = await toSelectedCategoriesAction(functionIds, countryCode);
            if (result.success && result.categories) {
                return result.categories;
            }
            return [];
        } catch (err) {
            console.error('Failed to convert categories:', err);
            return [];
        } finally {
            setLoading(false);
        }
    }, [countryCode]);

    return { convertToCategories, loading };
}

export function useTaxonomy(countryCode: string = 'GLOBAL') {
    const { industries, loading: industriesLoading, error: industriesError } = useTaxonomyIndustries();
    const { search, results: searchResults, loading: searchLoading, clear: clearSearch } = useFunctionSearch(countryCode);
    const { convertToCategories } = useSelectedCategories(countryCode);

    const [selectedIndustryId, setSelectedIndustryId] = useState<string | null>(null);
    const { functions: industryFunctions, loading: functionsLoading } = useResolvedFunctions(selectedIndustryId, countryCode);

    const loading = industriesLoading || functionsLoading || searchLoading;
    const error = industriesError;

    return {
        industries,
        industryFunctions,
        searchResults,
        loading,
        error,
        selectedIndustryId,
        setSelectedIndustryId,
        search,
        clearSearch,
        convertToCategories,
    };
}
