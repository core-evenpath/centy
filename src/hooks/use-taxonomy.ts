'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    getIndustriesAction,
    getBusinessFunctionsAction,
    getResolvedFunctionsAction
} from '@/actions/taxonomy-actions';
import type { TaxonomyIndustry, TaxonomyFunction, ResolvedFunction } from '@/services/taxonomy-service';

export function useTaxonomyIndustries() {
    const [industries, setIndustries] = useState<TaxonomyIndustry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getIndustriesAction()
            .then(result => {
                if (result.success && result.industries) {
                    setIndustries(result.industries);
                } else {
                    setError(result.error || 'Failed to load industries');
                }
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
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
        }
    }, [industryId, fetchFunctions]);

    return { functions, loading, error, refetch: fetchFunctions };
}

export function useResolvedFunctions(industryId: string | undefined, countryCode: string) {
    const [functions, setFunctions] = useState<ResolvedFunction[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!industryId) {
            setFunctions([]);
            return;
        }

        setLoading(true);
        getResolvedFunctionsAction(industryId, countryCode)
            .then(result => {
                if (result.success && result.functions) {
                    setFunctions(result.functions);
                }
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [industryId, countryCode]);

    return { functions, loading, error };
}
