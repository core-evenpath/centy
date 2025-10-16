// src/components/partner/templates/StockRecommendationEditor.tsx
"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, Sparkles, FileText, MessageSquare, Brain, Plus, Check, ChevronDown, ChevronUp, AlertCircle, Info, Users, Lock, Database, TrendingUp, Calendar, Save, Loader2, Phone, User, X } from 'lucide-react';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { useToast } from '@/hooks/use-toast';
import { saveTradingPickAction } from '@/actions/trading-pick-actions';
import { Button } from '@/components/ui/button';
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

// Stock database for auto-fill
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
  riskLevel: string;
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
  });

  const [aiSuggestions, setAiSuggestions] = useState<AIsuggestions>({ thesis: [], risks: [] });
  const [selectedSuggestions, setSelectedSuggestions] = useState<{ thesis: number[], risks: number[] }>({ thesis: [], risks: [] });

  // Auto-fill when ticker changes
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
    } else if (ticker) {
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
      case 4: return selectedSuggestions.risks.length > 0;
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
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [openContactsPopover, setOpenContactsPopover] = useState(false);
  const [openGroupsPopover, setOpenGroupsPopover] = useState(false);

  // Fetch contacts and groups
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
    if (selectedContacts.length === 0 && selectedGroups.length === 0) {
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
      
      const recipients = [
        ...selectedGroups.map(id => ({ id, type: 'group', name: contactGroups.find(g => g.id === id)?.name || '' })),
        ...selectedContacts.map(id => ({ id, type: 'contact', name: contacts.find(c => c.id === id)?.name || '' }))
      ];

      const action = channel === 'sms' ? sendSmsCampaignAction : sendWhatsAppCampaignAction;
      const result = await action({
        partnerId: currentWorkspace.partnerId,
        message,
        recipients,
        mediaUrl: generatedImageUrl || undefined,
      });

      if (result.success) {
        toast({ title: "Success!", description: `Campaign sent via ${channel.toUpperCase()}` });
        
        // Save the idea as well, if not already saved
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
        ticker: formData.ticker,
        companyName: formData.companyName,
        sector: formData.sector,
        action: formData.action,
        thesis: finalThesis,
        priceTarget: formData.priceTarget,
        currentPrice: formData.currentPrice,
        timeframe: formData.timeframe,
        riskLevel: formData.riskLevel,
        keyRisks: selectedRiskTexts.join('\n'), // Saving as a single string
        catalysts: '',
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
        // Fallback for direct use
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
      `}</style>
      
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
          {/* Accordion sections... */}
          {[1,2,3,4].map(stepNum => (
             <div key={stepNum} className={`bg-white rounded-2xl shadow-sm border-2 transition-all ${
                expandedSection === stepNum 
                  ? 'border-blue-500 shadow-lg' 
                  : isStepComplete(stepNum)
                  ? 'border-green-200'
                  : 'border-gray-200'
              } ${!canAccessSection(stepNum) ? 'opacity-60' : ''}`}>
                <button
                  onClick={() => canAccessSection(stepNum) && setExpandedSection(expandedSection === stepNum ? 0 : stepNum)}
                  disabled={!canAccessSection(stepNum)}
                  className="w-full p-6 flex items-center justify-between hover:bg-gray-50 rounded-t-2xl transition-colors disabled:cursor-not-allowed disabled:hover:bg-white"
                >
                  {/* ... Header content for each step */}
                </button>

                {expandedSection === stepNum && (
                  <div className="px-6 pb-6 pt-2 border-t border-gray-200">
                    {/* ... Form content for each step, which was removed and needs to be restored */}
                  </div>
                )}
             </div>
          ))}

          {/* Review & Send Section */}
          {allStepsComplete && (
            <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-lg border-2 border-green-500 p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                        <Check className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">Ready to Send!</h3>
                        <p className="text-gray-600">Review your recommendation and send it to your clients.</p>
                      </div>
                    </div>
                    {/* ... Rest of the Review and Send UI */}
                     <div className="flex justify-end mt-6">
                        <Button onClick={handleSaveAsIdea} disabled={isSaving}>
                            {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : <><Save className="w-4 h-4 mr-2" />Save as Idea</>}
                        </Button>
                    </div>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
