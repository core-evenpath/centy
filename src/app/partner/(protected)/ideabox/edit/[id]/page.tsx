// src/app/partner/(protected)/ideabox/edit/[id]/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import StockRecommendationEditor from '@/components/partner/templates/StockRecommendationEditor';
import { saveTradingPickAction } from '@/actions/trading-pick-actions';
import type { TradingPick } from '@/lib/types';
import { Loader2 } from 'lucide-react';

export default function EditIdeaPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { currentWorkspace, user } = useMultiWorkspaceAuth();
  const { toast } = useToast();

  const [initialData, setInitialData] = useState<TradingPick | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !currentWorkspace?.partnerId) return;

    const fetchIdea = async () => {
      try {
        const docRef = doc(db, `partners/${currentWorkspace.partnerId}/tradingPicks`, id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setInitialData({ id: docSnap.id, ...docSnap.data() } as TradingPick);
        } else {
          setError("Idea not found.");
        }
      } catch (err) {
        setError("Failed to load idea.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchIdea();
  }, [id, currentWorkspace?.partnerId]);

  const handleSave = async (data: Omit<TradingPick, 'id' | 'partnerId'>, existingId?: string) => {
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
      pickId: existingId,
    });

    if (result.success) {
      toast({
        title: "Idea Updated!",
        description: "Your changes have been saved.",
      });
      router.push('/partner/ideabox');
      return true;
    } else {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: result.message,
      });
      return false;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading editor...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        <p>{error}</p>
        <Button onClick={() => router.push('/partner/ideabox')} className="mt-4">
          Back to Ideabox
        </Button>
      </div>
    );
  }

  return (
    <StockRecommendationEditor 
      initialData={initialData}
      onSave={handleSave}
      onBack={() => router.push('/partner/ideabox')}
    />
  );
}
