// src/app/partner/(protected)/ideabox/create/page.tsx
"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { useToast } from '@/hooks/use-toast';
import StockRecommendationEditor from '@/components/partner/templates/StockRecommendationEditor';
import { saveTradingPickAction } from '@/actions/trading-pick-actions';
import type { TradingPick } from '@/lib/types';

export default function CreateIdeaPage() {
  const router = useRouter();
  const { currentWorkspace, user } = useMultiWorkspaceAuth();
  const { toast } = useToast();

  const handleSave = async (data: Omit<TradingPick, 'id' | 'partnerId'>) => {
    if (!currentWorkspace?.partnerId || !user?.customClaims?.token) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Cannot save. Workspace context is missing.",
      });
      return false;
    }

    const result = await saveTradingPickAction({
      partnerId: currentWorkspace.partnerId,
      pickData: data,
    });

    if (result.success) {
      toast({
        title: "Idea Saved!",
        description: "Your new recommendation has been saved to your Ideabox.",
      });
      router.push('/partner/ideabox');
      return true;
    } else {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: result.message,
      });
      return false;
    }
  };

  return (
    <StockRecommendationEditor 
      onSave={handleSave}
      onBack={() => router.push('/partner/ideabox')}
    />
  );
}
