
// src/app/partner/(protected)/ideabox/view/[id]/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { TradingPick } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, Edit, Send, Loader2, TrendingUp, DollarSign, Calendar, Shield,
  AlertTriangle, Zap, Server, BarChart3, Tag, Image as ImageIcon
} from 'lucide-react';

const DetailItem = ({ label, value, className }: { label: string, value: React.ReactNode, className?: string }) => (
  <div className={className}>
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <div className="text-base text-gray-900 font-semibold mt-1">{value}</div>
  </div>
);

const Section = ({ title, icon, children }: { title: string, icon: React.ElementType, children: React.ReactNode }) => {
  const Icon = icon;
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-3">
          <Icon className="w-5 h-5 text-blue-600" />
          {title}
        </h2>
      </div>
      <div className="p-6 space-y-4">
        {children}
      </div>
    </div>
  );
};


export default function ViewIdeaPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { currentWorkspace } = useMultiWorkspaceAuth();
  const [idea, setIdea] = useState<TradingPick | null>(null);
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
          setIdea({ id: docSnap.id, ...docSnap.data() } as TradingPick);
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

  if (!idea) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 mb-4">Could not find the requested stock recommendation.</p>
        <Button onClick={() => router.push('/partner/ideabox')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Ideabox
        </Button>
      </div>
    );
  }

  const actionColor = idea.action === 'buy' ? 'text-green-600' : idea.action === 'sell' ? 'text-red-600' : 'text-yellow-600';
  const riskColor = idea.riskLevel === 'high' ? 'text-red-600' : idea.riskLevel === 'medium' ? 'text-yellow-600' : 'text-green-600';

  return (
    <div className="overflow-y-auto h-full p-6 bg-gray-50/50">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="outline" onClick={() => router.push('/partner/ideabox')} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Ideabox
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="outline">
              <Send className="w-4 h-4 mr-2" />
              Broadcast
            </Button>
            <Button asChild>
              <Link href={`/partner/ideabox/edit/${idea.id}`}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Link>
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Main Info Card */}
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <Badge variant="outline" className="mb-2">{idea.sector}</Badge>
                <h1 className="text-4xl font-bold text-gray-900">{idea.companyName} ({idea.ticker})</h1>
              </div>
              <div className="text-right">
                <p className={`text-3xl font-bold ${actionColor}`}>{idea.action.toUpperCase()}</p>
                <p className="text-sm text-gray-500">Recommendation</p>
              </div>
            </div>
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6">
              <DetailItem label="Price Target" value={idea.priceTarget} />
              <DetailItem label="Current Price" value={idea.currentPrice || 'N/A'} />
              <DetailItem label="Timeframe" value={idea.timeframe} />
              <DetailItem label="Risk Level" value={<span className={`capitalize ${riskColor}`}>{idea.riskLevel}</span>} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Section title="Investment Thesis" icon={TrendingUp}>
                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                  {idea.thesis}
                </div>
              </Section>

              <Section title="Key Risks" icon={AlertTriangle}>
                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                  {idea.keyRisks}
                </div>
              </Section>
            </div>

            <div className="space-y-6">
              <Section title="Image Card" icon={ImageIcon}>
                {idea.imageUrl ? (
                  <Image src={idea.imageUrl} alt={`${idea.ticker} Recommendation Card`} width={400} height={225} className="w-full h-auto rounded-lg shadow-md" />
                ) : (
                  <p className="text-sm text-gray-500">No image was generated for this idea.</p>
                )}
              </Section>

              <Section title="Catalysts & Market" icon={BarChart3}>
                <DetailItem label="Potential Catalysts" value={idea.catalysts || 'Not specified'} />
                <DetailItem label="Market Context" value={idea.marketContext || 'Not specified'} />
                <DetailItem label="Sector Trends" value={idea.sectorTrends || 'Not specified'} />
              </Section>

              <Section title="Metadata" icon={Server}>
                <DetailItem label="Idea Type" value={<Badge variant="secondary">{idea.ideaType}</Badge>} />
                <DetailItem label="Created At" value={idea.createdAt ? new Date((idea.createdAt as any).toDate()).toLocaleString() : 'N/A'} />
                <DetailItem label="Last Updated" value={idea.updatedAt ? new Date((idea.updatedAt as any).toDate()).toLocaleString() : 'N/A'} />
              </Section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
