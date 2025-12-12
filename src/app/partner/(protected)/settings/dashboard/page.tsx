// src/app/partner/(protected)/settings/dashboard/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getPartnerProfileAction } from '@/actions/get-partner-profile';
import { getBusinessPersonaAction } from '@/actions/business-persona-actions';
import PartnerProfile from '@/components/partner/PartnerProfile';
import BusinessPersonaBuilder from '@/components/partner/settings/BusinessPersonaBuilder';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  Building2,
  RefreshCw,
  Settings,
  Eye,
  Edit,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import type { Partner } from '@/lib/types';
import type { SetupProgress } from '@/lib/business-persona-types';

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

      {/* Builder Skeleton */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
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

// Quick completion card for incomplete profiles
function SetupPromptCard({
  progress,
  onStartSetup
}: {
  progress: SetupProgress;
  onStartSetup: () => void;
}) {
  const completedSteps = [
    progress.basicInfo,
    progress.contactInfo,
    progress.operatingHours,
    progress.businessDescription
  ].filter(Boolean).length;

  const totalSteps = 4;
  const percentage = progress.overallPercentage;

  if (percentage >= 80) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-800">Profile Almost Complete!</h3>
              <p className="text-sm text-green-700">
                Your business profile is {percentage}% complete. Great job!
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={onStartSetup}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0">
      <CardContent className="py-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5" />
              <h3 className="font-semibold text-lg">Complete Your Business Profile</h3>
            </div>
            <p className="text-indigo-100 mb-4">
              Help AI better represent your business. Takes about 5 minutes.
            </p>

            {/* Progress indicators */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm font-medium">{percentage}%</span>
            </div>

            {/* What's pending */}
            <div className="flex flex-wrap gap-2">
              {!progress.basicInfo && (
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  <Clock className="w-3 h-3 mr-1" /> Business Info
                </Badge>
              )}
              {!progress.contactInfo && (
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  <Clock className="w-3 h-3 mr-1" /> Contact Details
                </Badge>
              )}
              {!progress.operatingHours && (
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  <Clock className="w-3 h-3 mr-1" /> Operating Hours
                </Badge>
              )}
            </div>
          </div>

          <Button
            size="lg"
            variant="secondary"
            onClick={onStartSetup}
            className="bg-white text-indigo-600 hover:bg-indigo-50"
          >
            Complete Setup
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SettingsDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [setupProgress, setSetupProgress] = useState<SetupProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'view' | 'edit'>('view');

  const partnerId = user?.customClaims?.partnerId;

  const fetchData = async () => {
    if (!partnerId) {
      setError("Partner ID not found in user profile");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch both partner profile and persona progress
      const [profileResult, personaResult] = await Promise.all([
        getPartnerProfileAction(partnerId),
        getBusinessPersonaAction(partnerId),
      ]);

      if (profileResult.success && profileResult.partner) {
        setPartner(profileResult.partner);
      } else {
        setError(profileResult.message || 'Failed to load profile');
      }

      if (personaResult.success && personaResult.setupProgress) {
        setSetupProgress(personaResult.setupProgress);

        // Auto-switch to edit mode if profile is very incomplete
        if (personaResult.setupProgress.overallPercentage < 30) {
          setActiveTab('edit');
        }
      }

    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchData();
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
        onRetry={fetchData}
      />
    );
  }

  if (!partner) {
    return <EmptyState />;
  }

  const showSetupPrompt = setupProgress && setupProgress.overallPercentage < 80;

  return (
    <div className="space-y-6">
      {/* Setup Prompt for Incomplete Profiles */}
      {showSetupPrompt && activeTab === 'view' && (
        <SetupPromptCard
          progress={setupProgress}
          onStartSetup={() => setActiveTab('edit')}
        />
      )}

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'view' | 'edit')}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="view" className="gap-2">
              <Eye className="w-4 h-4" />
              View Profile
            </TabsTrigger>
            <TabsTrigger value="edit" className="gap-2">
              <Edit className="w-4 h-4" />
              Edit Profile
            </TabsTrigger>
          </TabsList>

          {setupProgress && (
            <Badge
              variant={setupProgress.overallPercentage >= 80 ? 'default' : 'secondary'}
              className={setupProgress.overallPercentage >= 80 ? 'bg-green-500' : ''}
            >
              {setupProgress.overallPercentage}% Complete
            </Badge>
          )}
        </div>

        <TabsContent value="view" className="mt-0">
          <PartnerProfile partner={partner} />
        </TabsContent>

        <TabsContent value="edit" className="mt-0">
          <BusinessPersonaBuilder
            partnerId={partnerId!}
            mode="settings"
            onComplete={() => {
              setActiveTab('view');
              fetchData(); // Refresh data
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
