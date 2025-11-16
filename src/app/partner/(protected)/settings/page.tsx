"use client";

import { useAuth } from '@/hooks/use-auth';
import { AIModelSelector } from '@/components/settings/ai-model-selector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings, Sparkles } from 'lucide-react';

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="container max-w-4xl py-8 space-y-8">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!user?.customClaims?.partnerId) {
    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">
              Please log in to access settings.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account and AI configuration
          </p>
        </div>
      </div>

      <AIModelSelector 
        partnerId={user.customClaims.partnerId} 
        userId={user.uid} 
      />

      {/* Future settings sections can go here */}
      {/* <AccountSettings /> */}
      {/* <BillingSettings /> */}
      {/* <IntegrationSettings /> */}
    </div>
  );
}