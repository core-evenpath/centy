// src/components/partner/templates/StockRecommendationEditor.tsx
"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, Sparkles, FileText, MessageSquare, Brain, Plus, Check, ChevronDown, ChevronUp, AlertCircle, Info, Users, Lock, Database, TrendingUp, Calendar, Save, Loader2, Phone, User, X } from 'lucide-react';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { useToast } from '@/hooks/use-toast';
import { saveTradingPickAction } from '@/actions/trading-pick-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { sendSmsCampaignAction } from '@/actions/sms-actions';
import { sendWhatsAppCampaignAction } from '@/actions/whatsapp-actions';
import type { Contact, ContactGroup, TradingPick } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import Image from 'next/image';

const STOCK_DATABASE: Record<string, any> = {
  'NVDA': { 
    companyName: 'NVIDIA Corporation', 
    sector: 'Semiconductors / AI Hardware',
    currentPrice: '$192.57',
    aiThesis: [
      'Q2 2026 revenue hit $46.7B (up 56% YoY) with Blackwell Data Center revenue up 17% sequentially',
      'Maintaining ~75% market share in AI accelerator market with growth visibility through next decade',
      'Blackwell architecture delivering 30x faster inference vs prior generations with superior energy efficiency',
      'OpenAI strategic partnership: $100B commitment for 10+ gigawatts of AI infrastructure, could generate $300-500B revenue',
      'Cantor Fitzgerald street-high price target of $300 (55% upside) - top pick in AI hardware space'
    ],
    aiRisks: [
      'Stock trading at $192.57 vs $300 target - recent 40%+ pullback from highs creates entry opportunity',
      'U.S. export restrictions impacting China sales (previously significant revenue contributor)',
      'Circular deal structure with OpenAI raises questions about long-term accounting treatment',
      'High expectations priced in - EPS needs to hit $8 (2026), $11 (2027), $50 (2030) to justify valuations'
    ]
  },
  'AAPL': {
    companyName: 'Apple Inc.',
    sector: 'Technology / Consumer Electronics',
    currentPrice: '$227.50',
    aiThesis: [
      'Services revenue growing 15% YoY, now 25% of total revenue with 90%+ gross margins',
      'iPhone 16 cycle showing strong momentum with AI features driving upgrades',
      'Wearables and Home segment reached $40B annual run rate',
      'China showing signs of stabilization after multi-quarter decline'
    ],
    aiRisks: [
      'China regulatory risks and competition from local brands',
      'High PE ratio of 35x vs historical average of 18x',
      'Hardware refresh cycles slowing as devices last longer',
      'App Store revenue under regulatory pressure in EU and US'
    ]
  },
  'TSLA': {
    companyName: 'Tesla, Inc.',
    sector: 'Automotive / Clean Energy',
    currentPrice: '$262.90',
    aiThesis: [
      'Full Self-Driving revenue potential of $10B+ annually once approved',
      'Cybertruck ramping production with 1M+ reservations',
      'Energy storage business growing 50%+ YoY, underappreciated by market',
      'Cost reductions from new manufacturing techniques improving margins'
    ],
    aiRisks: [
      'Valuation assumes robotaxi success which faces regulatory hurdles',
      'Competition intensifying in EV market, especially from Chinese manufacturers',
      'CEO distraction concerns with multiple company involvement',
      'Demand uncertainty in key markets as EV subsidies phase out'
    ]
  }
};

interface FormData {
  ticker: string;
  companyName: string;
  sector: string;
  action: 'buy' | 'sell' | 'hold' | '';
  thesis: string;
  priceTarget: string;
  currentPrice: string;
  timeframe: string;
  riskLevel: 'low' | 'medium' | 'high' | '';
  keyRisks: string;
  catalysts: string;
}

interface AIsuggestions {
  thesis: string[];
  risks: string[];
}

interface StockRecommendationEditorProps {
  onSave?: (data: Omit<TradingPick, 'id' | 'partnerId'>, id?: string) => Promise<boolean>;
  onBack?: () => void;
  initialData?: TradingPick | null;
}

export default function StockRecommendationEditor({ 
  onSave, 
  onBack, 
  initialData = null 
}: StockRecommendationEditorProps) {
  const router = useRouter();
  const { currentWorkspace, user } = useMultiWorkspaceAuth();
  const { toast } = useToast();
  const [expandedSection, setExpandedSection] = useState<number>(1);
  const [autoFilled, setAutoFilled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(initialData?.imageUrl || null);
  
  const [formData, setFormData] = useState<FormData>({
    ticker: initialData?.ticker || '',
    companyName: initialData?.companyName || '',
    sector: initialData?.sector || '',
    action: initialData?.action || '',
    thesis: initialData?.thesis || '',
    priceTarget: initialData?.priceTarget || '',
    currentPrice: initialData?.currentPrice || '',
    timeframe: initialData?.timeframe || '',
    riskLevel: initialData?.riskLevel || '',
    keyRisks: initialData?.keyRisks || '',
    catalysts: initialData?.catalysts || '',
  });

  const [aiSuggestions, setAiSuggestions] = useState<AIsuggestions>({ thesis: [], risks: [] });
  const [selectedSuggestions, setSelectedSuggestions] = useState<{ thesis: number[], risks: number[] }>({ thesis: [], risks: [] });

  useEffect(() => {
    const ticker = formData.ticker.toUpperCase().trim();
    if (ticker && STOCK_DATABASE[ticker]) {
      const stockData = STOCK_DATABASE[ticker];
      setFormData(prev => ({
        ...prev,
        companyName: stockData.companyName,
        sector: stockData.sector,
        currentPrice: stockData.currentPrice
      }));
      setAiSuggestions({ thesis: stockData.aiThesis, risks: stockData.aiRisks });
      setAutoFilled(true);
    } else {
      setAutoFilled(false);
      setAiSuggestions({ thesis: [], risks: [] });
    }
  }, [formData.ticker]);

  const updateField = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSuggestion = (type: 'thesis' | 'risks', index: number) => {
    setSelectedSuggestions(prev => ({
      ...prev,
      [type]: prev[type].includes(index)
        ? prev[type].filter(i => i !== index)
        : [...prev[type], index]
    }));
  };

  const isStepComplete = (step: number): boolean => {
    switch(step) {
      case 1: return !!(formData.ticker && formData.companyName && formData.sector);
      case 2: return !!formData.action && (formData.thesis.length > 0 || selectedSuggestions.thesis.length > 0);
      case 3: return !!(formData.priceTarget && formData.timeframe && formData.riskLevel);
      case 4: return !!(formData.keyRisks.length > 0 || selectedSuggestions.risks.length > 0) && !!formData.catalysts;
      default: return false;
    }
  };
  
  const canAccessSection = (section: number): boolean => {
    for (let i = 1; i < section; i++) {
      if (!isStepComplete(i)) return false;
    }
    return true;
  };
  
  const allStepsComplete = useMemo(() => {
    return isStepComplete(1) && isStepComplete(2) && isStepComplete(3) && isStepComplete(4);
  }, [formData, selectedSuggestions]);

  // Contact selection state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactGroups, setContactGroups] = useState<ContactGroup[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<any[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isRecipientPopoverOpen, setIsRecipientPopoverOpen] = useState(false);
  const [platform, setPlatform] = useState<'whatsapp' | 'sms'>('whatsapp');

  useEffect(() => {
    if (!currentWorkspace?.partnerId) return;

    const contactsRef = collection(db, `partners/${currentWorkspace.partnerId}/contacts`);
    const groupsRef = collection(db, `partners/${currentWorkspace.partnerId}/contactGroups`);

    const unsubContacts = onSnapshot(query(contactsRef), (snapshot) => {
      setContacts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contact)));
    });
    const unsubGroups = onSnapshot(query(groupsRef), (snapshot) => {
      setContactGroups(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContactGroup)));
    });

    return () => { unsubContacts(); unsubGroups(); };
  }, [currentWorkspace?.partnerId]);

  const handleSendCampaign = async (channel: 'sms' | 'whatsapp') => {
    if (!currentWorkspace?.partnerId) return;
    if (selectedRecipients.length === 0) {
      toast({ title: "No recipients selected", variant: "destructive" });
      return;
    }
    
    setIsSending(true);

    try {
      const finalThesis = [
        ...selectedSuggestions.thesis.map(i => aiSuggestions.thesis[i]),
        formData.thesis
      ].filter(Boolean).join('\n\n');

      const message = `📈 New Stock Pick: ${formData.ticker} (${formData.action.toUpperCase()})\n\nThesis:\n${finalThesis}\n\nTarget: ${formData.priceTarget}\nRisk: ${formData.riskLevel.toUpperCase()}`;
      
      const recipients = selectedRecipients.map(r => ({
        id: r.id,
        name: r.name,
        type: r.contactCount !== undefined ? 'group' : 'contact'
      }));

      const action = channel === 'sms' ? sendSmsCampaignAction : sendWhatsAppCampaignAction;
      const result = await action({
        partnerId: currentWorkspace.partnerId,
        message,
        recipients,
        mediaUrl: generatedImageUrl || undefined,
      });

      if (result.success) {
        toast({ title: "Success!", description: `Campaign sent via ${channel.toUpperCase()}` });
        if (!initialData?.id) {
            await handleSaveAsIdea(true);
        }
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveAsIdea = async (calledFromSend: boolean = false) => {
    if (!currentWorkspace?.partnerId) return;
    setIsSaving(true);
    
    try {
      const finalThesis = [
        ...selectedSuggestions.thesis.map(i => aiSuggestions.thesis[i]),
        formData.thesis
      ].filter(Boolean).join('\n\n');

      const selectedRiskTexts = selectedSuggestions.risks.map(i => aiSuggestions.risks[i]);

      const pickData: Omit<TradingPick, 'id'> = {
        ticker: formData.ticker.toUpperCase(),
        companyName: formData.companyName,
        sector: formData.sector,
        action: formData.action as 'buy' | 'sell' | 'hold',
        thesis: finalThesis,
        priceTarget: formData.priceTarget,
        currentPrice: formData.currentPrice,
        timeframe: formData.timeframe,
        riskLevel: formData.riskLevel as 'low' | 'medium' | 'high',
        keyRisks: [formData.keyRisks, ...selectedRiskTexts].filter(Boolean).join('\n'),
        catalysts: formData.catalysts,
        marketContext: '',
        sectorTrends: '',
        ideaType: 'stock-recommendation',
        partnerId: currentWorkspace.partnerId,
        imageUrl: generatedImageUrl || undefined,
      };

      if (onSave) {
        const success = await onSave(pickData, initialData?.id);
        if (success && !calledFromSend) {
            router.push('/partner/ideabox');
        }
      } else {
        const result = await saveTradingPickAction({
            partnerId: currentWorkspace.partnerId,
            pickData,
            pickId: initialData?.id
        });
        if (result.success) {
            toast({ title: 'Idea Saved!', description: 'Your stock recommendation has been saved.' });
            if(!calledFromSend) router.push('/partner/ideabox');
        } else {
            throw new Error(result.message);
        }
      }
    } catch (error: any) {
        if(!calledFromSend) {
          toast({ title: "Save failed", description: error.message, variant: "destructive" });
        }
        console.error("Save failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRecipientSelect = (recipient: any) => {
    setSelectedRecipients(prev => {
      if (prev.some(r => r.id === recipient.id)) {
        return prev.filter(r => r.id !== recipient.id);
      }
      return [...prev, recipient];
    });
  };

  const availableRecipients = useMemo(() => [
    ...contactGroups.map(g => ({ ...g, type: 'group' })),
    ...contacts.map(c => ({ ...c, type: 'contact' }))
  ], [contacts, contactGroups]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 font-medium">
          <ArrowLeft className="w-4 h-4" />
          Back to Ideabox
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {initialData ? 'Edit' : 'Create'} Stock Recommendation
          </h1>
          <p className="text-gray-600">Fill in each section. AI will help you along the way with smart suggestions.</p>
        </div>

        <div className="space-y-4">
          {/* Step 1: Basic Info */}
          <div className={`bg-white rounded-2xl shadow-sm border-2 transition-all ${ expandedSection === 1 ? 'border-blue-500 shadow-lg' : isStepComplete(1) ? 'border-green-200' : 'border-gray-200' }`}>
            <button onClick={() => setExpandedSection(expandedSection === 1 ? 0 : 1)} className="w-full p-6 flex items-center justify-between hover:bg-gray-50 rounded-t-2xl transition-colors">
              <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${ isStepComplete(1) ? 'bg-green-600' : 'bg-blue-600' } text-white`}>
                      {isStepComplete(1) ? <Check className="w-6 h-6" /> : "1"}
                  </div>
                  <div className="text-left">
                      <h3 className="text-lg font-bold text-gray-900">Basic Information</h3>
                      {isStepComplete(1) && expandedSection !== 1 && <div className="flex items-center gap-3 mt-1"><span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">{formData.ticker}</span><span className="text-sm text-gray-600">{formData.companyName}</span></div>}
                  </div>
              </div>
              <ChevronDown className={`w-6 h-6 text-gray-400 transition-transform ${expandedSection === 1 ? 'rotate-180' : ''}`} />
            </button>
            {expandedSection === 1 && (
              <div className="px-6 pb-6 pt-2 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Ticker</label>
                        <Input value={formData.ticker} onChange={(e) => updateField('ticker', e.target.value)} placeholder="e.g., NVDA" />
                        {autoFilled && <p className="text-xs text-green-600 mt-1">Auto-filled details!</p>}
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Company Name</label>
                        <Input value={formData.companyName} onChange={(e) => updateField('companyName', e.target.value)} placeholder="e.g., NVIDIA Corporation" />
                    </div>
                </div>
                <div className="mt-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Sector</label>
                    <Input value={formData.sector} onChange={(e) => updateField('sector', e.target.value)} placeholder="e.g., Semiconductors / AI Hardware" />
                </div>
              </div>
            )}
          </div>

          {/* Step 2: AI Training & Research */}
          <div className={`bg-white rounded-2xl shadow-sm border-2 transition-all ${ expandedSection === 2 ? 'border-blue-500 shadow-lg' : isStepComplete(2) ? 'border-green-200' : 'border-gray-200' } ${!canAccessSection(2) ? 'opacity-60' : ''}`}>
            <button onClick={() => canAccessSection(2) && setExpandedSection(expandedSection === 2 ? 0 : 2)} disabled={!canAccessSection(2)} className="w-full p-6 flex items-center justify-between hover:bg-gray-50 rounded-t-2xl transition-colors disabled:cursor-not-allowed disabled:hover:bg-white">
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${ isStepComplete(2) ? 'bg-green-600' : canAccessSection(2) ? 'bg-blue-600' : 'bg-gray-400' } text-white`}>
                        {isStepComplete(2) ? <Check className="w-6 h-6" /> : "2"}
                    </div>
                    <div className="text-left">
                        <h3 className="text-lg font-bold text-gray-900">AI Training & Research</h3>
                        {isStepComplete(2) && expandedSection !== 2 && <p className="text-sm text-gray-600 mt-1">Source material provided for AI context.</p>}
                    </div>
                </div>
                <ChevronDown className={`w-6 h-6 text-gray-400 transition-transform ${expandedSection === 2 ? 'rotate-180' : ''}`} />
            </button>
            {expandedSection === 2 && (
              <div className="px-6 pb-6 pt-2 border-t border-gray-200 space-y-4">
                  <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Paste Research (Articles, Transcripts, etc.)</label>
                      <Textarea placeholder="Paste any relevant text here for the AI to learn from..." rows={8} />
                  </div>
                  <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                      <hr className="flex-1" /> OR <hr className="flex-1" />
                  </div>
                  <Button variant="outline" className="w-full"><FileText className="w-4 h-4 mr-2" /> Upload Documents (.pdf, .txt, .docx)</Button>
              </div>
            )}
          </div>

          {/* ... other steps ... */}

        </div>
      </div>
    </div>
  );
}
