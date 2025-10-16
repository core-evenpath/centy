// src/app/partner/(protected)/ideabox/create/page.tsx
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { useToast } from '@/hooks/use-toast';
import StockRecommendationEditor from '@/components/partner/templates/StockRecommendationEditor';
import { saveTradingPickAction } from '@/actions/trading-pick-actions';
import type { TradingPick } from '@/lib/types';
import { ArrowLeft, TrendingUp, BarChart3, Bell, MessageSquare, Calendar } from 'lucide-react';

const templateTypes = [
  {
    id: 'stock-recommendation',
    name: 'Stock Recommendation',
    icon: TrendingUp,
    description: 'Create buy/sell/hold recommendations with research',
    color: 'blue'
  },
  {
    id: 'market-update',
    name: 'Market Update',
    icon: BarChart3,
    description: 'Weekly/daily market commentary and analysis',
    color: 'purple'
  },
  {
    id: 'economic-alert',
    name: 'Economic Alert',
    icon: Bell,
    description: 'Fed decisions, economic data, policy changes',
    color: 'orange'
  },
  {
    id: 'quick-alert',
    name: 'Quick Alert',
    icon: MessageSquare,
    description: 'Breaking news, earnings alerts, urgent updates',
    color: 'red'
  },
  {
    id: 'event-invitation',
    name: 'Event Invitation',
    icon: Calendar,
    description: 'Webinars, seminars, client meetings',
    color: 'green'
  }
];

export default function CreateIdeaPage() {
  const router = useRouter();
  const { currentWorkspace, user } = useMultiWorkspaceAuth();
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const handleSave = async (data: Omit<TradingPick, 'id' | 'partnerId'>) => {
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

  const colorClasses: Record<string, { bg: string, border: string, icon: string }> = {
    blue: { bg: 'from-blue-50 to-indigo-50', border: 'border-blue-200 hover:border-blue-400', icon: 'bg-blue-600' },
    purple: { bg: 'from-purple-50 to-pink-50', border: 'border-purple-200 hover:border-purple-400', icon: 'bg-purple-600' },
    orange: { bg: 'from-orange-50 to-amber-50', border: 'border-orange-200 hover:border-orange-400', icon: 'bg-orange-600' },
    red: { bg: 'from-red-50 to-rose-50', border: 'border-red-200 hover:border-red-400', icon: 'bg-red-600' },
    green: { bg: 'from-green-50 to-emerald-50', border: 'border-green-200 hover:border-green-400', icon: 'bg-green-600' }
  };

  if (!selectedType) {
    return (
      <div className="p-6">
        <button onClick={() => router.push('/partner/ideabox')} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 font-medium">
          <ArrowLeft className="w-4 h-4" />
          Back to Ideabox
        </button>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Idea</h1>
          <p className="text-gray-600 mt-2">Choose a template type to get started.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {templateTypes.map((type) => {
            const Icon = type.icon;
            const colors = colorClasses[type.color] || colorClasses.blue;

            return (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`text-left p-6 rounded-xl border-2 hover:shadow-lg transition-all bg-gradient-to-br ${colors.bg} ${colors.border}`}
              >
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${colors.icon}`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{type.name}</h3>
                <p className="text-sm text-gray-600">{type.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (selectedType === 'stock-recommendation') {
    return (
      <StockRecommendationEditor 
        onSave={handleSave}
        onBack={() => setSelectedType(null)}
      />
    );
  }

  // Placeholder for other editors
  return (
    <div className="p-6">
       <button onClick={() => setSelectedType(null)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 font-medium">
        <ArrowLeft className="w-4 h-4" />
        Back to Idea Types
      </button>
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">Editor Not Available</h2>
        <p className="text-gray-600 mt-2">The editor for this idea type is not yet implemented.</p>
      </div>
    </div>
  );
}
