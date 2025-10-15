// src/components/partner/templates/StockRecommendationEditor.tsx
"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowRight, Send, Sparkles, Upload, FileText, MessageSquare, Brain, Plus, Check, ChevronDown, ChevronUp, AlertCircle, Info, Users, Lock, Database, TrendingUp, Calendar, Save, Loader2, Phone, User, X } from 'lucide-react';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { useToast } from '@/hooks/use-toast';
import { saveTradingPickAction } from '@/actions/trading-pick-actions';
import { Button } from '@/components/ui/button';
import { sendSmsCampaignAction } from '@/actions/sms-actions';
import { sendWhatsAppCampaignAction } from '@/actions/whatsapp-actions';
import type { Contact, ContactGroup, Campaign } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
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
    ],
    aiCatalysts: [
      'Multi-trillion dollar global AI infrastructure buildout still in early innings',
      'Intel collaboration announced September 2025 for custom data center and PC products across markets',
      'Sovereign AI deals in Middle East and Taiwan offsetting China headwinds',
      'Becoming de facto AI infrastructure company - quarterbacking the entire industry buildout'
    ]
  },
  'AAPL': { 
    companyName: 'Apple Inc.', 
    sector: 'Consumer Electronics / Technology',
    currentPrice: '$178.23',
    aiThesis: [
      'iPhone 15 cycle performing stronger than expected with 8% unit growth globally',
      'Services revenue at $85B annual run-rate with industry-leading 70% gross margins',
      'Vision Pro launching spatial computing category - 200k units sold in first quarter',
      'Massive cash flow generation of $110B annually enabling $90B in buybacks',
      'Ecosystem lock-in with 2B active devices creates unmatched pricing power'
    ],
    aiRisks: [
      'iPhone revenue still represents 52% of total - high product concentration risk',
      'China regulatory challenges and rising competition from Huawei resurgence',
      'Vision Pro adoption slower than hoped - only 200k units vs 1M target',
      'Services growth slowing to 9% YoY from previous 20%+ growth rates'
    ],
    aiCatalysts: [
      'iPhone 16 launch September with breakthrough AI features - potential supercycle',
      'India manufacturing expansion reducing China dependency significantly',
      'Strategic AI partnership with Google Gemini just announced',
      'Services attach rate improving steadily - now 30% of revenue vs 20% in 2020'
    ]
  },
  'TSLA': { 
    companyName: 'Tesla, Inc.', 
    sector: 'Electric Vehicles / Clean Energy',
    currentPrice: '$242.84',
    aiThesis: [
      'Cybertruck production ramping successfully - 125k reservations worth $12.5B',
      'Energy storage business growing 150% YoY to $6B annual run-rate',
      'FSD (Full Self-Driving) version 12 showing dramatic improvements in capability',
      'Operating margins recovering to 18% after price war impact bottomed out',
      'Gigafactory Mexico starting production H2 2024 - adds 1M unit annual capacity'
    ],
    aiRisks: [
      'EV price war intensifying globally - BYD aggressively cutting prices in China',
      'Cybertruck production delays and early quality issues being reported',
      'Musk distraction concerns with X (Twitter) and political activities',
      'Competition from legacy automakers ramping EV production significantly'
    ],
    aiCatalysts: [
      'Model 2 ($25k affordable EV) unveiling at shareholder meeting June 2024',
      'FSD licensing deals with other automakers being actively negotiated',
      'Optimus humanoid robot demo at AI Day - potential $20B+ TAM opportunity',
      'European sales rebounding strongly with new Model 3 Highland version'
    ]
  }
};

export default function StockRecommendationEditor({ initialData }: { initialData?: any }) {
  const [formData, setFormData] = useState({
    ticker: '',
    companyName: '',
    sector: '',
    action: 'buy',
    thesis: '',
    priceTarget: '',
    currentPrice: '',
    timeframe: '',
    timeframeType: 'short', // short, medium, long
    riskLevel: 'medium',
    keyRisks: '',
    catalysts: '',
    marketContext: '',
    sectorTrends: ''
  });

  const [expandedSection, setExpandedSection] = useState(1);
  const [expandedTraining, setExpandedTraining] = useState<Record<string, boolean>>({});
  const [autoFilled, setAutoFilled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{
    thesis: string[];
    risks: string[];
    catalysts: string[];
  }>({
    thesis: [],
    risks: [],
    catalysts: []
  });
  const [selectedSuggestions, setSelectedSuggestions] = useState<{
    thesis: number[];
    risks: number[];
    catalysts: number[];
  }>({
    thesis: [],
    risks: [],
    catalysts: []
  });

  // New state for campaign sending
  const [platform, setPlatform] = useState<'whatsapp' | 'sms'>('whatsapp');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactGroups, setContactGroups] = useState<ContactGroup[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<any[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isRecipientPopoverOpen, setIsRecipientPopoverOpen] = useState(false);

  const { currentWorkspace } = useMultiWorkspaceAuth();
  const { toast } = useToast();

  const partnerId = currentWorkspace?.partnerId;

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
      if(initialData.ticker) {
        handleTickerChange(initialData.ticker);
      }
    }
  }, [initialData]);

  // Fetch contacts and groups
  useEffect(() => {
    if (!partnerId) return;

    const contactsQuery = query(collection(db, `partners/${partnerId}/contacts`));
    const groupsQuery = query(collection(db, `partners/${partnerId}/contactGroups`));

    const unsubContacts = onSnapshot(contactsQuery, snapshot => {
      setContacts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contact)));
    });
    
    const unsubGroups = onSnapshot(groupsQuery, snapshot => {
      setContactGroups(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContactGroup)));
    });

    return () => {
      unsubContacts();
      unsubGroups();
    };
  }, [partnerId]);


  const updateField = (field: keyof typeof formData, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleTickerChange = (value: string) => {
    const upperTicker = value.toUpperCase();
    updateField('ticker', upperTicker);
    
    if (STOCK_DATABASE[upperTicker]) {
      const stockData = STOCK_DATABASE[upperTicker];
      setFormData({
        ...formData,
        ticker: upperTicker,
        companyName: stockData.companyName,
        sector: stockData.sector,
        currentPrice: stockData.currentPrice
      });
      
      setAiSuggestions({
        thesis: stockData.aiThesis || [],
        risks: stockData.aiRisks || [],
        catalysts: stockData.aiCatalysts || []
      });
      
      setSelectedSuggestions({
        thesis: [],
        risks: [],
        catalysts: []
      });
      
      setAutoFilled(true);
      setTimeout(() => setAutoFilled(false), 3000);
    } else {
      setAutoFilled(false);
      setAiSuggestions({ thesis: [], risks: [], catalysts: [] });
    }
  };

  const toggleSuggestion = (type: 'thesis' | 'risks' | 'catalysts', index: number) => {
    const currentSelections = [...selectedSuggestions[type]];
    const suggestionIndex = currentSelections.indexOf(index);
    
    if (suggestionIndex > -1) {
      currentSelections.splice(suggestionIndex, 1);
    } else {
      currentSelections.push(index);
    }
    
    setSelectedSuggestions({
      ...selectedSuggestions,
      [type]: currentSelections
    });
    
    updateTextFromSelections(type, currentSelections);
  };

  const updateTextFromSelections = (type: 'thesis' | 'risks' | 'catalysts', selections: number[]) => {
    const suggestions = aiSuggestions[type];
    const selectedText = selections
      .sort((a, b) => a - b)
      .map(i => `• ${suggestions[i]}`)
      .join('\n');
    
    if (type === 'thesis') {
      updateField('thesis', selectedText);
    } else if (type === 'risks') {
      updateField('keyRisks', selectedText);
    } else if (type === 'catalysts') {
      updateField('catalysts', selectedText);
    }
  };

  const toggleSection = (section: number) => {
    if (canAccessSection(section)) {
      setExpandedSection(expandedSection === section ? null : section);
    }
  };

  const toggleTraining = (section: string) => {
    setExpandedTraining({
      ...expandedTraining,
      [section]: !expandedTraining[section]
    });
  };

  const isStepComplete = (step: number) => {
    switch(step) {
      case 1: return !!(formData.ticker && formData.companyName && formData.sector);
      case 2: return !!(formData.thesis && formData.action);
      case 3: return !!(formData.priceTarget && formData.timeframe);
      case 4: return !!(formData.keyRisks && formData.catalysts);
      default: return false;
    }
  };

  const canAccessSection = (section: number) => {
    if (section === 1) return true;
    return isStepComplete(section - 1);
  };

  const allStepsComplete = isStepComplete(1) && isStepComplete(2) && isStepComplete(3) && isStepComplete(4);

  const timeframeOptions = [
    { value: 'short', label: 'Short-term', example: '1-2 weeks', icon: '⚡' },
    { value: 'medium', label: 'Medium-term', example: '1-6 months', icon: '📈' },
    { value: 'long', label: 'Long-term', example: '6-24 months', icon: '🎯' }
  ];

  const handleSaveRecommendation = async () => {
    if (!currentWorkspace?.partnerId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No active workspace selected.",
      });
      return;
    }

    if (!allStepsComplete) {
      toast({
        variant: "destructive",
        title: "Incomplete Form",
        description: "Please complete all steps before saving.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { ...pickData } = formData;
      const result = await saveTradingPickAction({
        partnerId: currentWorkspace.partnerId,
        pickData: pickData as any,
      });
      
      if (result.success) {
        toast({
          title: "Recommendation Saved",
          description: "Your stock pick has been saved successfully.",
        });
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: error.message || "An unexpected error occurred.",
      });
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

  const availableRecipients = useMemo(() => {
    return [
      ...contactGroups.map(g => ({ ...g, type: 'group' })),
      ...contacts.map(c => ({ ...c, type: 'contact' }))
    ];
  }, [contacts, contactGroups]);

  const handleGenerateImage = async () => {
    if (!formData.ticker) return;
  
    setIsGeneratingImage(true);
    setGeneratedImageUrl(null);
    toast({ title: 'Generating Image...', description: 'Please wait...' });
  
    try {
      const response = await fetch(`/api/generate-stock-card-image?${new URLSearchParams({
        ticker: formData.ticker,
        companyName: formData.companyName,
        action: formData.action,
      })}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate image from API.');
      }
  
      const data = await response.json();
      setGeneratedImageUrl(data.imageUrl);
      toast({ title: 'Image Generated!', description: 'You can now send your broadcast.' });
  
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Image Generation Failed', description: error.message, duration: 8000 });
    } finally {
      setIsGeneratingImage(false);
    }
  };
  
  useEffect(() => {
    if (allStepsComplete && !generatedImageUrl && !isGeneratingImage) {
      handleGenerateImage();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allStepsComplete]);


  const handleSendBroadcast = async () => {
    if (!partnerId || selectedRecipients.length === 0 || !generatedImageUrl) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please generate an image and select recipients before sending.',
      });
      return;
    }
  
    setIsSending(true);
    try {
      const textMessage = `📈 New Stock Pick: ${formData.ticker.toUpperCase()} (${formData.action.toUpperCase()})\n\nThesis: ${formData.thesis}\n\nTarget: ${formData.priceTarget}\nRisk: ${formData.riskLevel.toUpperCase()}`;
      
      // Create campaign document
      const campaignRef = await addDoc(collection(db, `partners/${partnerId}/campaigns`), {
        name: `Stock Pick: ${formData.ticker}`,
        partnerId: partnerId,
        message: textMessage,
        mediaUrl: generatedImageUrl,
        status: 'sent',
        sentCount: selectedRecipients.reduce((acc, r) => acc + (r.contactCount || 1), 0),
        engagementRate: 0,
        revenueGenerated: 0,
        createdAt: serverTimestamp(),
        recipients: selectedRecipients.map(r => ({
          id: r.id,
          name: r.name,
          type: r.contactCount !== undefined ? 'group' : 'contact'
        })),
      });
      console.log('Campaign document created with ID:', campaignRef.id);

      const campaignPayload = {
        partnerId,
        message: textMessage,
        recipients: selectedRecipients.map(r => ({
          id: r.id,
          name: r.name,
          type: r.contactCount !== undefined ? 'group' : 'contact'
        })),
        mediaUrl: generatedImageUrl,
      };
  
      let result;
      if (platform === 'whatsapp') {
        result = await sendWhatsAppCampaignAction(campaignPayload as any);
      } else {
        result = await sendSmsCampaignAction(campaignPayload);
      }
  
      if (result.success) {
        toast({ title: 'Broadcast Sent Successfully', description: result.message });
      } else {
        throw new Error(result.message || `Failed to send ${platform} broadcast.`);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Broadcast Failed',
        description: error.message || 'An unexpected error occurred.',
        duration: 8000
      });
    } finally {
      setIsSending(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Stock Recommendation</h1>
          <p className="text-gray-600">Fill in each section. AI will help you along the way with smart suggestions.</p>
        </div>

        {/* Accordion Sections */}
        <div className="space-y-4">
          
          {/* Section 1: Basic Info */}
          <div className={`bg-white rounded-2xl shadow-sm border-2 transition-all ${
            expandedSection === 1 
              ? 'border-blue-500 shadow-lg' 
              : isStepComplete(1)
              ? 'border-green-200'
              : 'border-gray-200'
          }`}>
            <button
              onClick={() => toggleSection(1)}
              className="w-full p-6 flex items-center justify-between hover:bg-gray-50 rounded-t-2xl transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  isStepComplete(1)
                    ? 'bg-green-600 text-white'
                    : expandedSection === 1
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {isStepComplete(1) ? <Check className="w-6 h-6" /> : '1'}
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-gray-900">Step 1: Basic Information</h3>
                  {isStepComplete(1) && expandedSection !== 1 && (
                    <div className="flex items-center gap-3 mt-1">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                        {formData.ticker}
                      </span>
                      <span className="text-sm text-gray-600">{formData.companyName}</span>
                      <span className="text-sm text-gray-500">• {formData.sector}</span>
                    </div>
                  )}
                  {!isStepComplete(1) && expandedSection !== 1 && (
                    <p className="text-sm text-gray-500 mt-1">Enter ticker symbol to get started</p>
                  )}
                </div>
              </div>
              {expandedSection === 1 ? (
                <ChevronUp className="w-6 h-6 text-gray-400" />
              ) : (
                <ChevronDown className="w-6 h-6 text-gray-400" />
              )}
            </button>

            {expandedSection === 1 && (
              <div className="px-6 pb-6 pt-2 border-t border-gray-200">
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200 mb-6">
                  <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <strong>Quick tip:</strong> Just enter the ticker symbol. For popular stocks like NVDA, AAPL, or TSLA, we'll automatically fill in the company name, sector, and current price for you!
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Stock Ticker * <span className="text-gray-500 font-normal">(e.g., NVDA, AAPL, TSLA)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.ticker}
                        onChange={(e) => handleTickerChange(e.target.value)}
                        placeholder="Start typing: NVDA, AAPL, TSLA..."
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-bold uppercase"
                      />
                      {autoFilled && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-green-600 animate-fade-in">
                          <Check className="w-5 h-5" />
                          <span className="text-sm font-medium">Auto-filled!</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Company Name *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.companyName}
                        onChange={(e) => updateField('companyName', e.target.value)}
                        placeholder="Full legal name"
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all ${
                          autoFilled ? 'border-green-300 bg-green-50' : 'border-gray-300 focus:border-blue-500'
                        }`}
                      />
                      {autoFilled && (
                        <button
                          onClick={() => setAutoFilled(false)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Sector / Industry *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.sector}
                        onChange={(e) => updateField('sector', e.target.value)}
                        placeholder="e.g., Technology, Clean Energy"
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all ${
                          autoFilled ? 'border-green-300 bg-green-50' : 'border-gray-300 focus:border-blue-500'
                        }`}
                      />
                      {autoFilled && (
                        <button
                          onClick={() => setAutoFilled(false)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">This helps AI match your recommendation with interested clients</p>
                  </div>
                </div>

                {isStepComplete(1) && (
                  <div className="flex justify-end mt-6">
                    <button
                      onClick={() => setExpandedSection(2)}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                    >
                      Next: Investment Thesis
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 2: Investment Thesis */}
          <div className={`bg-white rounded-2xl shadow-sm border-2 transition-all ${
            !canAccessSection(2)
              ? 'border-gray-200 opacity-60'
              : expandedSection === 2 
              ? 'border-blue-500 shadow-lg' 
              : isStepComplete(2)
              ? 'border-green-200'
              : 'border-gray-200'
          }`}>
            <button
              onClick={() => toggleSection(2)}
              disabled={!canAccessSection(2)}
              className="w-full p-6 flex items-center justify-between hover:bg-gray-50 rounded-t-2xl transition-colors disabled:cursor-not-allowed disabled:hover:bg-white"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  !canAccessSection(2)
                    ? 'bg-gray-200 text-gray-400'
                    : isStepComplete(2)
                    ? 'bg-green-600 text-white'
                    : expandedSection === 2
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {!canAccessSection(2) ? (
                    <Lock className="w-5 h-5" />
                  ) : isStepComplete(2) ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    '2'
                  )}
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-gray-900">Step 2: Investment Thesis</h3>
                  {isStepComplete(2) && expandedSection !== 2 && (
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        formData.action === 'buy' ? 'bg-green-100 text-green-700' :
                        formData.action === 'sell' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {formData.action.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-600">
                        {formData.thesis.slice(0, 60)}...
                      </span>
                    </div>
                  )}
                  {!isStepComplete(2) && expandedSection !== 2 && canAccessSection(2) && (
                    <p className="text-sm text-gray-500 mt-1">Why should someone invest in this stock?</p>
                  )}
                </div>
              </div>
              {canAccessSection(2) && (
                expandedSection === 2 ? (
                  <ChevronUp className="w-6 h-6 text-gray-400" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-gray-400" />
                )
              )}
            </button>

            {expandedSection === 2 && (
              <div className="px-6 pb-6 pt-2 border-t border-gray-200">
                <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200 mb-6">
                  <Sparkles className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-purple-900">
                    <strong>This is the most important part!</strong> Everything you write here trains your AI agent. When clients ask "Why this stock?", the AI will use your thesis to answer.
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      What's your recommendation? *
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {['buy', 'sell', 'hold'].map((action) => (
                        <button
                          key={action}
                          onClick={() => updateField('action', action)}
                          className={`py-4 px-4 rounded-xl border-2 font-bold capitalize transition-all ${
                            formData.action === action
                              ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md scale-105'
                              : 'border-gray-300 text-gray-700 hover:border-gray-400'
                          }`}
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* AI Suggestions */}
                  {aiSuggestions.thesis && aiSuggestions.thesis.length > 0 && (
                    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-5 border-2 border-purple-300">
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-6 h-6 text-purple-600" />
                        <div>
                          <h4 className="font-bold text-gray-900">AI-Generated Investment Points</h4>
                          <p className="text-xs text-gray-600">Check the points you agree with - they'll be added to your thesis automatically</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {aiSuggestions.thesis.map((suggestion, index) => (
                          <label
                            key={index}
                            className={`flex items-start gap-3 p-4 rounded-lg cursor-pointer transition-all ${
                              selectedSuggestions.thesis.includes(index)
                                ? 'bg-purple-100 border-2 border-purple-400'
                                : 'bg-white border-2 border-purple-200 hover:border-purple-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedSuggestions.thesis.includes(index)}
                              onChange={() => toggleSuggestion('thesis', index)}
                              className="w-5 h-5 text-purple-600 rounded mt-0.5 cursor-pointer"
                            />
                            <span className="text-sm text-gray-800 flex-1">{suggestion}</span>
                          </label>
                        ))}
                      </div>
                      <div className="mt-4 p-3 bg-white rounded-lg border border-purple-200">
                        <p className="text-xs text-gray-700">
                          <strong>💡 Smart Tip:</strong> Selected points ({selectedSuggestions.thesis.length} of {aiSuggestions.thesis.length}) will automatically appear in your thesis below. You can still edit them!
                        </p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Your Investment Thesis *
                    </label>
                    <p className="text-sm text-gray-600 mb-3">
                      {aiSuggestions.thesis && aiSuggestions.thesis.length > 0
                        ? 'Your selected points appear below. Feel free to edit, add more details, or write from scratch.'
                        : 'Explain why this is a good investment. What makes it compelling right now? What are the key drivers?'
                      }
                    </p>
                    <textarea
                      value={formData.thesis}
                      onChange={(e) => updateField('thesis', e.target.value)}
                      placeholder="Write your investment thesis here..."
                      rows={14}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Tip: Use bullet points (•) to organize your thoughts. This helps the AI give structured answers to clients.
                    </p>
                  </div>
                </div>

                {isStepComplete(2) && (
                  <div className="flex justify-end mt-6">
                    <button
                      onClick={() => setExpandedSection(3)}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                    >
                      Next: Price Target
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 3: Price & Timeline */}
          <div className={`bg-white rounded-2xl shadow-sm border-2 transition-all ${
            !canAccessSection(3)
              ? 'border-gray-200 opacity-60'
              : expandedSection === 3 
              ? 'border-blue-500 shadow-lg' 
              : isStepComplete(3)
              ? 'border-green-200'
              : 'border-gray-200'
          }`}>
            <button
              onClick={() => toggleSection(3)}
              disabled={!canAccessSection(3)}
              className="w-full p-6 flex items-center justify-between hover:bg-gray-50 rounded-t-2xl transition-colors disabled:cursor-not-allowed disabled:hover:bg-white"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  !canAccessSection(3)
                    ? 'bg-gray-200 text-gray-400'
                    : isStepComplete(3)
                    ? 'bg-green-600 text-white'
                    : expandedSection === 3
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {!canAccessSection(3) ? (
                    <Lock className="w-5 h-5" />
                  ) : isStepComplete(3) ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    '3'
                  )}
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-gray-900">Step 3: Price Target & Timeline</h3>
                  {isStepComplete(3) && expandedSection !== 3 && (
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-gray-600">
                        Target: <strong className="text-gray-900">{formData.priceTarget}</strong>
                      </span>
                      <span className="text-sm text-gray-500">• {formData.timeframe}</span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium capitalize">
                        {formData.riskLevel} Risk
                      </span>
                    </div>
                  )}
                  {!isStepComplete(3) && expandedSection !== 3 && canAccessSection(3) && (
                    <p className="text-sm text-gray-500 mt-1">Set price expectations and holding period</p>
                  )}
                </div>
              </div>
              {canAccessSection(3) && (
                expandedSection === 3 ? (
                  <ChevronUp className="w-6 h-6 text-gray-400" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-gray-400" />
                )
              )}
            </button>

            {expandedSection === 3 && (
              <div className="px-6 pb-6 pt-2 border-t border-gray-200">
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200 mb-6">
                  <TrendingUp className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <strong>Set clear expectations:</strong> Clients need to know the target price and how long they should hold. Be specific!
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Current Price <span className="text-gray-500 font-normal">(Reference)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.currentPrice}
                          onChange={(e) => updateField('currentPrice', e.target.value)}
                          placeholder="$45.20"
                          className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 text-lg font-semibold transition-all ${
                            formData.currentPrice && STOCK_DATABASE[formData.ticker] 
                              ? 'border-green-300 bg-green-50' 
                              : 'border-gray-300 focus:border-blue-500'
                          }`}
                        />
                        {formData.currentPrice && STOCK_DATABASE[formData.ticker] && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600">
                            <Sparkles className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      {formData.currentPrice && STOCK_DATABASE[formData.ticker] && (
                        <p className="text-xs text-green-600 mt-2">✓ Auto-filled with live price</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Price Target * <span className="text-gray-500 font-normal">(Your goal)</span>
                      </label>
                      <input
                        type="text"
                        value={formData.priceTarget}
                        onChange={(e) => updateField('priceTarget', e.target.value)}
                        placeholder="$65 or $60-75 range"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-semibold"
                      />
                      <p className="text-xs text-gray-500 mt-2">Single price or range works</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Expected Timeframe * <span className="text-gray-500 font-normal">(How long to hold?)</span>
                    </label>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {timeframeOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            updateField('timeframeType', option.value);
                            updateField('timeframe', option.example);
                          }}
                          className={`p-4 rounded-xl border-2 transition-all text-left ${
                            formData.timeframeType === option.value
                              ? 'border-blue-600 bg-blue-50 shadow-md'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <div className="text-2xl mb-2">{option.icon}</div>
                          <div className="font-bold text-gray-900 mb-1">{option.label}</div>
                          <div className="text-xs text-gray-600">{option.example}</div>
                        </button>
                      ))}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Or specify your own timeframe:
                      </label>
                      <input
                        type="text"
                        value={formData.timeframe}
                        onChange={(e) => updateField('timeframe', e.target.value)}
                        placeholder="e.g., 3-6 months, until Q2 earnings"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Risk Level <span className="text-gray-500 font-normal">(Be honest with clients)</span>
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'low', label: 'Low Risk', desc: 'Blue chip, stable', color: 'green' },
                        { value: 'medium', label: 'Medium Risk', desc: 'Growth, some volatility', color: 'yellow' },
                        { value: 'high', label: 'High Risk', desc: 'Speculative, volatile', color: 'red' }
                      ].map((risk) => (
                        <button
                          key={risk.value}
                          onClick={() => updateField('riskLevel', risk.value)}
                          className={`py-4 px-4 rounded-xl border-2 font-semibold transition-all text-left ${
                            formData.riskLevel === risk.value
                              ? 'border-blue-600 bg-blue-50 shadow-md'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <div className="text-gray-900 mb-1">{risk.label}</div>
                          <div className="text-xs text-gray-600">{risk.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {isStepComplete(3) && (
                  <div className="flex justify-end mt-6">
                    <button
                      onClick={() => setExpandedSection(4)}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                    >
                      Next: Risks & Catalysts
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 4: Risks & Catalysts */}
          <div className={`bg-white rounded-2xl shadow-sm border-2 transition-all ${
            !canAccessSection(4)
              ? 'border-gray-200 opacity-60'
              : expandedSection === 4 
              ? 'border-blue-500 shadow-lg' 
              : isStepComplete(4)
              ? 'border-green-200'
              : 'border-gray-200'
          }`}>
            <button
              onClick={() => toggleSection(4)}
              disabled={!canAccessSection(4)}
              className="w-full p-6 flex items-center justify-between hover:bg-gray-50 rounded-t-2xl transition-colors disabled:cursor-not-allowed disabled:hover:bg-white"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  !canAccessSection(4)
                    ? 'bg-gray-200 text-gray-400'
                    : isStepComplete(4)
                    ? 'bg-green-600 text-white'
                    : expandedSection === 4
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {!canAccessSection(4) ? (
                    <Lock className="w-5 h-5" />
                  ) : isStepComplete(4) ? (
                    <Check className="w-6 h-6" />
                  ) : (
                    '4'
                  )}
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-gray-900">Step 4: Risks & Catalysts</h3>
                  {isStepComplete(4) && expandedSection !== 4 && (
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-gray-600">
                        ✓ Risks and upside drivers documented
                      </span>
                    </div>
                  )}
                  {!isStepComplete(4) && expandedSection !== 4 && canAccessSection(4) && (
                    <p className="text-sm text-gray-500 mt-1">What could go wrong? What could go right?</p>
                  )}
                </div>
              </div>
              {canAccessSection(4) && (
                expandedSection === 4 ? (
                  <ChevronUp className="w-6 h-6 text-gray-400" />
                ) : (
                  <ChevronDown className="w-6 h-6 text-gray-400" />
                )
              )}
            </button>

            {expandedSection === 4 && (
              <div className="px-6 pb-6 pt-2 border-t border-gray-200">
                <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200 mb-6">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-900">
                    <strong>Be transparent about risks!</strong> When clients ask "What could go wrong?", honest answers build trust. AI will use this to address their concerns properly.
                  </div>
                </div>

                <div className="space-y-6">
                  {/* AI Risks */}
                  {aiSuggestions.risks && aiSuggestions.risks.length > 0 && (
                    <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-5 border-2 border-red-300">
                      <div className="flex items-center gap-2 mb-4">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                        <div>
                          <h4 className="font-bold text-gray-900">AI-Identified Risk Factors</h4>
                          <p className="text-xs text-gray-600">Select the risks that apply to your thesis</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {aiSuggestions.risks.map((suggestion, index) => (
                          <label
                            key={index}
                            className={`flex items-start gap-3 p-4 rounded-lg cursor-pointer transition-all ${
                              selectedSuggestions.risks.includes(index)
                                ? 'bg-red-100 border-2 border-red-400'
                                : 'bg-white border-2 border-red-200 hover:border-red-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedSuggestions.risks.includes(index)}
                              onChange={() => toggleSuggestion('risks', index)}
                              className="w-5 h-5 text-red-600 rounded mt-0.5 cursor-pointer"
                            />
                            <span className="text-sm text-gray-800 flex-1">{suggestion}</span>
                          </label>
                        ))}
                      </div>
                      <div className="mt-4 p-3 bg-white rounded-lg border border-red-200">
                        <p className="text-xs text-gray-700">
                          <strong>💡 Note:</strong> {selectedSuggestions.risks.length} risks selected. These will appear in your risk analysis below.
                        </p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Key Risks * <span className="text-gray-500 font-normal">(What could prevent success?)</span>
                    </label>
                    <p className="text-sm text-gray-600 mb-3">
                      {aiSuggestions.risks && aiSuggestions.risks.length > 0
                        ? 'Your selected risks appear below. Add more details or write additional risks.'
                        : 'List the main things that could go wrong: regulatory issues, competition, execution challenges, market conditions, etc.'
                      }
                    </p>
                    <textarea
                      value={formData.keyRisks}
                      onChange={(e) => updateField('keyRisks', e.target.value)}
                      placeholder="What could prevent this stock from reaching your target?&#10;&#10;Example:&#10;• Regulatory approval delays&#10;• Intense competition from Company X&#10;• Execution risk on product launch"
                      rows={10}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    />
                  </div>

                  {/* AI Catalysts */}
                  {aiSuggestions.catalysts && aiSuggestions.catalysts.length > 0 && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-300">
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-6 h-6 text-green-600" />
                        <div>
                          <h4 className="font-bold text-gray-900">AI-Identified Catalysts</h4>
                          <p className="text-xs text-gray-600">Select the events that could drive the stock higher</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {aiSuggestions.catalysts.map((suggestion, index) => (
                          <label
                            key={index}
                            className={`flex items-start gap-3 p-4 rounded-lg cursor-pointer transition-all ${
                              selectedSuggestions.catalysts.includes(index)
                                ? 'bg-green-100 border-2 border-green-400'
                                : 'bg-white border-2 border-green-200 hover:border-green-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedSuggestions.catalysts.includes(index)}
                              onChange={() => toggleSuggestion('catalysts', index)}
                              className="w-5 h-5 text-green-600 rounded mt-0.5 cursor-pointer"
                            />
                            <span className="text-sm text-gray-800 flex-1">{suggestion}</span>
                          </label>
                        ))}
                      </div>
                      <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
                        <p className="text-xs text-gray-700">
                          <strong>💡 Great!</strong> {selectedSuggestions.catalysts.length} catalysts selected. These will be added below.
                        </p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Catalysts & Upside Drivers * <span className="text-gray-500 font-normal">(What could accelerate gains?)</span>
                    </label>
                    <p className="text-sm text-gray-600 mb-3">
                      {aiSuggestions.catalysts && aiSuggestions.catalysts.length > 0
                        ? 'Your selected catalysts appear below. Add timing details or additional events.'
                        : 'What events or developments could push this stock higher? Earnings, product launches, partnerships, regulatory approvals, etc.'
                      }
                    </p>
                    <textarea
                      value={formData.catalysts}
                      onChange={(e) => updateField('catalysts', e.target.value)}
                      placeholder="What could drive the stock higher?&#10;&#10;Example:&#10;• Q2 earnings on May 15 - expect 20% beat&#10;• New product launch in June&#10;• Potential acquisition target"
                      rows={10}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    />
                  </div>
                </div>

                {isStepComplete(4) && (
                  <div className="flex justify-end mt-6">
                    <button
                      onClick={() => setExpandedSection(5)}
                      className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                    >
                      Review & Send
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 5: Review & Send */}
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
                
                {/* Send Controls */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Send className="w-5 h-5 text-blue-600" />
                        Send as Broadcast
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
                          <Tabs defaultValue="whatsapp" onValueChange={(value) => setPlatform(value as any)} className="w-full">
                              <TabsList className="grid w-full grid-cols-2">
                                  <TabsTrigger value="whatsapp" className="flex items-center gap-2"><MessageSquare /> WhatsApp</TabsTrigger>
                                  <TabsTrigger value="sms" className="flex items-center gap-2"><Phone /> SMS</TabsTrigger>
                              </TabsList>
                          </Tabs>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
                            <Popover open={isRecipientPopoverOpen} onOpenChange={setIsRecipientPopoverOpen}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={isRecipientPopoverOpen}
                                  className="w-full justify-between h-10"
                                >
                                  <div className="flex gap-1 flex-wrap items-center truncate">
                                    {selectedRecipients.length > 0 ? (
                                      selectedRecipients.map(r => (
                                        <Badge key={r.id} variant="secondary" className="mr-1">
                                          <div className="flex items-center">
                                            {r.type === 'group' ? <Users className="w-3 h-3 mr-1" /> : <User className="w-3 h-3 mr-1" />}
                                            {r.name}
                                          </div>
                                        </Badge>
                                      ))
                                    ) : (
                                      <span className="text-muted-foreground">Select...</span>
                                    )}
                                  </div>
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                  <CommandInput placeholder="Search recipients..." />
                                  <CommandList>
                                    <CommandEmpty>No recipients found.</CommandEmpty>
                                    <CommandGroup heading="Groups">
                                      {contactGroups.map(group => (
                                        <CommandItem
                                          key={group.id}
                                          onSelect={() => handleRecipientSelect({ ...group, type: 'group' })}
                                          className="cursor-pointer"
                                        >
                                          <Check className={cn("mr-2 h-4 w-4", selectedRecipients.some(r => r.id === group.id) ? "opacity-100" : "opacity-0")} />
                                          <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                                          <div className="flex-1">{group.name}</div>
                                          <div className="text-xs text-muted-foreground">{group.contactCount}</div>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                    <CommandGroup heading="Contacts">
                                      {contacts.map(contact => (
                                        <CommandItem
                                          key={contact.id}
                                          onSelect={() => handleRecipientSelect({ ...contact, type: 'contact' })}
                                          className="cursor-pointer"
                                        >
                                          <Check className={cn("mr-2 h-4 w-4", selectedRecipients.some(r => r.id === contact.id) ? "opacity-100" : "opacity-0")} />
                                          <User className="mr-2 h-4 w-4 text-muted-foreground" />
                                          <div className="flex-1">{contact.name}</div>
                                          <div className="text-xs text-muted-foreground">{contact.phone}</div>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                </div>

                {/* Mobile Preview */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Mobile Preview
                    </label>
                    <div className="relative mx-auto border-gray-900 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl">
                      <div className="h-[32px] w-[3px] bg-gray-800 absolute -left-[17px] top-[72px] rounded-l-lg"></div>
                      <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[124px] rounded-l-lg"></div>
                      <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[178px] rounded-l-lg"></div>
                      <div className="h-[64px] w-[3px] bg-gray-800 absolute -right-[17px] top-[142px] rounded-r-lg"></div>
                      <div className="rounded-[2rem] overflow-hidden w-full h-full bg-white">
                        <div className="p-4 space-y-4">
                          {isGeneratingImage ? (
                            <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg">
                              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                            </div>
                          ) : generatedImageUrl ? (
                            <Image src={generatedImageUrl} alt="Generated stock pick" width={1200} height={675} className="w-full rounded-lg" />
                          ) : (
                            <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg">
                              <Sparkles className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                          <p className="text-sm whitespace-pre-wrap">📈 New Stock Pick: {formData.ticker.toUpperCase()} ({formData.action.toUpperCase()})\n\nThesis: {formData.thesis}\n\nTarget: {formData.priceTarget}\nRisk: {formData.riskLevel.toUpperCase()}</p>
                        </div>
                      </div>
                    </div>
                </div>
                
                <div className="flex gap-4 mt-6">
                  <Button
                    onClick={handleSendBroadcast}
                    disabled={isSending || !generatedImageUrl || selectedRecipients.length === 0}
                    className="w-full flex-1"
                  >
                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    {isSending ? 'Sending...' : `Send to ${selectedRecipients.reduce((acc, r) => acc + (r.contactCount || 1), 0)} recipients`}
                  </Button>
                </div>

                <div className="flex justify-end mt-6">
                  <Button
                    onClick={handleSaveRecommendation}
                    variant="outline"
                    disabled={isSending || isSaving}
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    {isSaving ? 'Saving...' : 'Save as Idea'}
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
