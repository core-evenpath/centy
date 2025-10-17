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
import { Loader2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

function EditIdeaPage() {
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
      setLoading(true);
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
    if (!currentWorkspace?.partnerId) {
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
      pickId: existingId || (id as string),
    });

    if (result.success) {
      toast({
        title: "Idea Updated!",
        description: "Your changes have been saved successfully.",
      });
      router.push(`/partner/ideabox/view/${existingId || id}`);
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
      <div className="flex flex-col items-center justify-center h-full p-6 bg-gradient-to-br from-gray-50 to-gray-100/50">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <span className="text-gray-600 font-medium">Loading editor...</span>
        <p className="text-sm text-gray-500 mt-2">Please wait while we fetch your idea</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 bg-gradient-to-br from-gray-50 to-gray-100/50">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <p className="text-xl font-semibold text-gray-900 mb-2">Error Loading Idea</p>
        <p className="text-gray-600 mb-6">{error}</p>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => router.push('/partner/ideabox')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Ideabox
          </Button>
          <Button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!initialData) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 bg-gradient-to-br from-gray-50 to-gray-100/50">
        <AlertTriangle className="w-16 h-16 text-gray-400 mb-4" />
        <p className="text-xl font-semibold text-gray-900 mb-2">Idea Not Found</p>
        <p className="text-gray-600 mb-6">Could not find the requested stock recommendation.</p>
        <Button onClick={() => router.push('/partner/ideabox')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Ideabox
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full">
      <StockRecommendationEditor 
        initialData={initialData}
        onSave={handleSave}
        onBack={() => router.push(`/partner/ideabox/view/${id}`)}
      />
    </div>
  );
}

export default EditIdeaPage;