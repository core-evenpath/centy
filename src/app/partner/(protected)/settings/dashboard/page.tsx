// src/app/partner/(protected)/settings/dashboard/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getPartnerProfileAction } from '@/actions/get-partner-profile';
import PartnerProfile from '@/components/partner/PartnerProfile';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Building2, RefreshCw } from 'lucide-react';
import type { Partner } from '@/lib/types';

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Skeleton className="h-14 w-14 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Skeleton */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between mb-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-6 w-12" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="h-3 w-64 mt-2" />
        </CardContent>
      </Card>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>

      {/* Info Cards Skeleton */}
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between py-3 border-b last:border-0">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  partnerId?: string;
  onRetry: () => void;
}

function ErrorState({ message, partnerId, onRetry }: ErrorStateProps) {
  return (
    <Card className="border-destructive/50">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center py-6">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold text-destructive mb-2">
            Failed to Load Profile
          </h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            {message}
          </p>
          {partnerId && (
            <p className="text-xs text-muted-foreground mb-4 font-mono bg-muted px-2 py-1 rounded">
              Partner ID: {partnerId}
            </p>
          )}
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center py-8">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
            <Building2 className="w-7 h-7 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Organization Profile</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Your organization profile hasn't been set up yet. Contact your administrator
            to complete your workspace configuration.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SettingsDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const partnerId = user?.customClaims?.partnerId;

  const fetchPartnerProfile = async () => {
    if (!partnerId) {
      setError("Partner ID not found in user profile");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await getPartnerProfileAction(partnerId);

      if (result.success && result.partner) {
        setPartner(result.partner);
      } else {
        setError(result.message || 'Failed to load profile');
      }
    } catch (err: any) {
      console.error('Error fetching partner profile:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchPartnerProfile();
    }
  }, [partnerId, authLoading]);

  if (authLoading || loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        partnerId={partnerId}
        onRetry={fetchPartnerProfile}
      />
    );
  }

  if (!partner) {
    return <EmptyState />;
  }

  return <PartnerProfile partner={partner} />;
}
