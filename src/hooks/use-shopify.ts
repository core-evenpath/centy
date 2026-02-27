'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ShopifyIntegrationConfig } from '@/lib/types-shopify';

export function useShopifyIntegration(partnerId: string | null) {
    const [config, setConfig] = useState<ShopifyIntegrationConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refetch = useCallback(() => {
        setLoading(true);
        setError(null);
    }, []);

    useEffect(() => {
        if (!partnerId || !db) {
            setLoading(false);
            setConfig(null);
            return;
        }

        setLoading(true);
        setError(null);

        const docRef = doc(db, `partners/${partnerId}/integrations`, 'shopify');

        const unsubscribe = onSnapshot(
            docRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.data() as ShopifyIntegrationConfig;
                    setConfig({ ...data, encryptedAccessToken: '[REDACTED]' });
                } else {
                    setConfig(null);
                }
                setLoading(false);
            },
            (err) => {
                console.error('❌ Shopify config listener error:', err);
                setError(err.message);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [partnerId]);

    return { config, loading, error, refetch };
}
