'use client';

import { useState, useEffect, useCallback } from 'react';
import { getShopifyConfig } from '@/actions/shopify-actions';
import type { ShopifyIntegrationConfig } from '@/lib/types-shopify';

export function useShopifyIntegration(partnerId: string | null) {
    const [config, setConfig] = useState<ShopifyIntegrationConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchConfig = useCallback(async () => {
        if (!partnerId) {
            setLoading(false);
            setConfig(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await getShopifyConfig(partnerId);
            if (result.success) {
                setConfig(result.config);
            } else {
                setError('Failed to load Shopify configuration');
            }
        } catch (err: any) {
            console.error('Error fetching Shopify config:', err);
            setError(err.message || 'Failed to load Shopify configuration');
        } finally {
            setLoading(false);
        }
    }, [partnerId]);

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    return { config, loading, error, refetch: fetchConfig };
}
