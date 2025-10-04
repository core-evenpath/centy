// src/app/partner/(protected)/settings/dashboard/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../../hooks/use-auth';
import { getPartnerProfileAction } from '../../../../../actions/get-partner-profile';
import PartnerProfile from '../../../../../components/partner/PartnerProfile';
import { Skeleton } from '../../../../../components/ui/skeleton';
import { Card, CardContent } from '../../../../../components/ui/card';
import { AlertCircle } from 'lucide-react';
import type { Partner } from '../../../../../lib/types';

export default function SettingsDashboardPage() {
    const { user, loading: authLoading } = useAuth();
    const [partner, setPartner] = useState<Partner | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchPartnerProfile() {
            if (authLoading) return;
            
            if (!user?.customClaims?.partnerId) {
                setError("Partner ID not found in user profile");
                setLoading(false);
                return;
            }

            try {
                console.log('Fetching partner profile for:', user.customClaims.partnerId);
                const result = await getPartnerProfileAction(user.customClaims.partnerId);
                
                if (result.success && result.partner) {
                    setPartner(result.partner);
                    setError(null);
                } else {
                    setError(result.message);
                }
            } catch (err: any) {
                console.error('Error fetching partner profile:', err);
                setError('Failed to load partner profile');
            } finally {
                setLoading(false);
            }
        }

        fetchPartnerProfile();
    }, [user, authLoading]);

    if (authLoading || loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-32 w-full" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent className="flex items-center gap-3 p-6">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                    <div>
                        <h3 className="font-semibold text-red-700">Profile Load Error</h3>
                        <p className="text-red-600">{error}</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Partner ID: {user?.customClaims?.partnerId || 'Not found'}
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!partner) {
        return (
            <Card>
                <CardContent className="flex items-center gap-3 p-6">
                    <AlertCircle className="w-8 h-8 text-yellow-500" />
                    <div>
                        <h3 className="font-semibold">No Profile Found</h3>
                        <p className="text-muted-foreground">
                            Your partner profile could not be located.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return <PartnerProfile partner={partner} />;
}
