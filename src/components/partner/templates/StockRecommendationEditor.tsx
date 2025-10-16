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
import type { Contact, ContactGroup } from '@/lib/types';
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
  dataSource: 'master' | 'custom';
  customDataDescription: string;
}

interface AIsuggestions {
  thesis: string[];
  risks: string[];
}

export default function StockRecommendationEditor() {
  const { currentWorkspace } = useMultiWorkspaceAuth();
  const { toast } = useToast();
  const [expandedSection, setExpandedSection] = useState<number>(1);
  const [autoFilled, setAutoFilled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    ticker: '',
    companyName: '',
    sector: '',
    action: '',
    thesis: '',
    priceTarget: '',
    currentPrice: '',
    timeframe: '',
    riskLevel: '',
    dataSource: 'master',
    customDataDescription: ''
  });

  const [aiSuggestions, setAiSuggestions] = useState<AIsuggestions>({
    thesis: [],
    risks: []
  });

  const [selectedSuggestions, setSelectedSuggestions] = useState<{
    thesis: number[];
    risks: number[];
  }>({
    thesis: [],
    risks: []
  });

  const [selectedRisks, setSelectedRisks] = useState<number[]>([]);

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
      setAiSuggestions({
        thesis: stockData.aiThesis,
        risks: stockData.aiRisks
      });
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
      case 1:
        return !!(formData.ticker && formData.companyName && formData.sector);
      case 2:
        // Data source step - always can proceed
        return true;
      case 3:
        return !!formData.action && (formData.thesis.length > 0 || selectedSuggestions.thesis.length > 0);
      case 4:
        return !!(formData.priceTarget && formData.timeframe && formData.riskLevel);
      case 5:
        return selectedSuggestions.risks.length > 0;
      default:
        return false;
    }
  };

  const canAccessSection = (section: number): boolean => {
    for (let i = 1; i < section; i++) {
      if (!isStepComplete(i)) return false;
    }
    return true;
  };

  const allStepsComplete = useMemo(() => {
    return isStepComplete(1) && isStepComplete(2) && isStepComplete(3) && isStepComplete(4) && isStepComplete(5);
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
      const fetchedContacts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Contact[];
      setContacts(fetchedContacts);
    });

    const unsubGroups = onSnapshot(query(groupsRef), (snapshot) => {
      const fetchedGroups = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ContactGroup[];
      setContactGroups(fetchedGroups);
    });

    return () => {
      unsubContacts();
      unsubGroups();
    };
  }, [currentWorkspace?.partnerId]);

  const handleSendCampaign = async (channel: 'sms' | 'whatsapp') => {
    if (!currentWorkspace?.partnerId) {
      toast({ title: "Error", description: "Partner ID not found", variant: "destructive" });
      return;
    }

    if (selectedContacts.length === 0 && selectedGroups.length === 0) {
      toast({ title: "No recipients", description: "Please select contacts or groups", variant: "destructive" });
      return;
    }

    setIsSending(true);

    try {
      const finalThesis = [
        ...selectedSuggestions.thesis.map(i => aiSuggestions.thesis[i]),
        formData.thesis
      ].filter(Boolean).join('\n\n');

      const message = `${formData.action.toUpperCase()} ${formData.ticker}\n\n${finalThesis}\n\nTarget: ${formData.priceTarget}\nTimeframe: ${formData.timeframe}\nRisk: ${formData.riskLevel}`;

      const result = channel === 'sms'
        ? await sendSmsCampaignAction({
            partnerId: currentWorkspace.partnerId,
            message,
            contactIds: selectedContacts,
            groupIds: selectedGroups,
            mediaUrl: generatedImageUrl || undefined,
          })
        : await sendWhatsAppCampaignAction({
            partnerId: currentWorkspace.partnerId,
            message,
            contactIds: selectedContacts,
            groupIds: selectedGroups,
            mediaUrl: generatedImageUrl || undefined,
          });

      if (result.success) {
        toast({ title: "Success!", description: `Campaign sent via ${channel.toUpperCase()}` });
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveAsDraft = async () => {
    if (!currentWorkspace?.partnerId) {
      toast({ title: "Error", description: "Partner ID not found", variant: "destructive" });
      return;
    }

    setIsSaving(true);

    try {
      const finalThesis = [
        ...selectedSuggestions.thesis.map(i => aiSuggestions.thesis[i]),
        formData.thesis
      ].filter(Boolean).join('\n\n');

      const selectedRiskTexts = selectedSuggestions.risks.map(i => aiSuggestions.risks[i]);

      const result = await saveTradingPickAction({
        partnerId: currentWorkspace.partnerId,
        ticker: formData.ticker,
        companyName: formData.companyName,
        sector: formData.sector,
        action: formData.action as 'buy' | 'sell' | 'hold',
        thesis: finalThesis,
        priceTarget: formData.priceTarget,
        currentPrice: formData.currentPrice,
        timeframe: formData.timeframe,
        riskLevel: formData.riskLevel,
        risks: selectedRiskTexts,
        imageUrl: generatedImageUrl || undefined,
        dataSource: formData.dataSource,
        customDataDescription: formData.dataSource === 'custom' ? formData.customDataDescription : undefined
      });

      if (result.success) {
        toast({ title: "Saved!", description: "Your stock pick has been saved" });
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Stock Recommendation</h1>
        <p className="text-gray-600">Follow these steps to create a professional stock recommendation with AI assistance.</p>
      </div>

      <div className="space-y-6">
        {/* Section 1: Basic Information */}
        <div className={`bg-white rounded-2xl shadow-sm border-2 transition-all ${
          expandedSection === 1 
            ? 'border-blue-500 shadow-lg' 
            : isStepComplete(1)
            ? 'border-green-500'
            : 'border-gray-200'
        }`}>
          <button
            onClick={() => setExpandedSection(expandedSection === 1 ? 0 : 1)}
            className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-t-2xl"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg transition-all ${
                isStepComplete(1) ? 'bg-green-600' : expandedSection === 1 ? 'bg-blue-600' : 'bg-gray-300'
              }`}>
                {isStepComplete(1) ? <Check className="w-6 h-6" /> : '1'}
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-gray-900">Step 1: Basic Information</h3>
                {isStepComplete(1) && expandedSection !== 1 && (
                  <p className="text-sm text-gray-600 mt-1">
                    {formData.ticker} - {formData.companyName}
                  </p>
                )}
                {!isStepComplete(1) && expandedSection !== 1 && (
                  <p className="text-sm text-gray-500 mt-1">Enter stock ticker and company details</p>
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

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Stock Ticker * <span className="text-gray-500 font-normal">(e.g., NVDA, AAPL, TSLA)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.ticker}
                    onChange={(e) => updateField('ticker', e.target.value.toUpperCase())}
                    placeholder="Enter ticker symbol"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all"
                  />
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
                      placeholder="e.g., NVIDIA Corporation"
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
                    Next: Data Source
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section 2: Data Source (NEW STEP) */}
        <div className={`bg-white rounded-2xl shadow-sm border-2 transition-all ${
          !canAccessSection(2)
            ? 'border-gray-200 opacity-60'
            : expandedSection === 2 
            ? 'border-blue-500 shadow-lg' 
            : isStepComplete(2)
            ? 'border-green-500'
            : 'border-gray-200'
        }`}>
          <button
            onClick={() => canAccessSection(2) && setExpandedSection(expandedSection === 2 ? 0 : 2)}
            disabled={!canAccessSection(2)}
            className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-t-2xl disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg transition-all ${
                !canAccessSection(2)
                  ? 'bg-gray-200 text-gray-400'
                  : isStepComplete(2)
                  ? 'bg-green-600'
                  : expandedSection === 2
                  ? 'bg-blue-600'
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
                <h3 className="text-lg font-bold text-gray-900">Step 2: AI Training Data</h3>
                {isStepComplete(2) && expandedSection !== 2 && (
                  <p className="text-sm text-gray-600 mt-1">
                    Using: <strong className="text-gray-900">{formData.dataSource === 'master' ? 'Company-wide data' : 'Custom data for this pick'}</strong>
                  </p>
                )}
                {!isStepComplete(2) && expandedSection !== 2 && canAccessSection(2) && (
                  <p className="text-sm text-gray-500 mt-1">Choose data source for AI recommendations</p>
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
                <Database className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <div className="text-sm text-purple-900">
                  Choose whether to use company-wide AI training data or provide custom data specific to this stock pick.
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Master Data Option */}
                  <button
                    onClick={() => updateField('dataSource', 'master')}
                    className={`p-6 border-2 rounded-xl text-left transition-all ${
                      formData.dataSource === 'master'
                        ? 'border-blue-600 bg-blue-50 shadow-md'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        formData.dataSource === 'master' ? 'bg-blue-600' : 'bg-gray-200'
                      }`}>
                        <Database className={`w-5 h-5 ${
                          formData.dataSource === 'master' ? 'text-white' : 'text-gray-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">Master Data (Company-wide)</h4>
                        <p className="text-sm text-gray-600">
                          Use your company's general AI training data and knowledge base
                        </p>
                      </div>
                      {formData.dataSource === 'master' && (
                        <Check className="w-5 h-5 text-blue-600 shrink-0" />
                      )}
                    </div>
                  </button>

                  {/* Custom Data Option */}
                  <button
                    onClick={() => updateField('dataSource', 'custom')}
                    className={`p-6 border-2 rounded-xl text-left transition-all ${
                      formData.dataSource === 'custom'
                        ? 'border-blue-600 bg-blue-50 shadow-md'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        formData.dataSource === 'custom' ? 'bg-blue-600' : 'bg-gray-200'
                      }`}>
                        <Brain className={`w-5 h-5 ${
                          formData.dataSource === 'custom' ? 'text-white' : 'text-gray-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">Custom Data (This Pick Only)</h4>
                        <p className="text-sm text-gray-600">
                          Train AI with specific data for this stock recommendation
                        </p>
                      </div>
                      {formData.dataSource === 'custom' && (
                        <Check className="w-5 h-5 text-blue-600 shrink-0" />
                      )}
                    </div>
                  </button>
                </div>

                {/* Custom Data Description Field */}
                {formData.dataSource === 'custom' && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Custom Training Data Description
                    </label>
                    <textarea
                      value={formData.customDataDescription}
                      onChange={(e) => updateField('customDataDescription', e.target.value)}
                      placeholder="Describe the custom data or analysis you want the AI to use for this specific pick..."
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      This information will be used to train the AI specifically for this stock recommendation
                    </p>
                  </div>
                )}
              </div>

              {isStepComplete(2) && (
                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setExpandedSection(3)}
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

        {/* Section 3: Investment Thesis (formerly Section 2) */}
        <div className={`bg-white rounded-2xl shadow-sm border-2 transition-all ${
          !canAccessSection(3)
            ? 'border-gray-200 opacity-60'
            : expandedSection === 3 
            ? 'border-blue-500 shadow-lg' 
            : isStepComplete(3)
            ? 'border-green-500'
            : 'border-gray-200'
        }`}>
          <button
            onClick={() => canAccessSection(3) && setExpandedSection(expandedSection === 3 ? 0 : 3)}
            disabled={!canAccessSection(3)}
            className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-t-2xl disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg transition-all ${
                !canAccessSection(3)
                  ? 'bg-gray-200 text-gray-400'
                  : isStepComplete(3)
                  ? 'bg-green-600'
                  : expandedSection === 3
                  ? 'bg-blue-600'
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
                <h3 className="text-lg font-bold text-gray-900">Step 3: Investment Thesis</h3>
                {isStepComplete(3) && expandedSection !== 3 && (
                  <p className="text-sm text-gray-600 mt-1">
                    <strong className="text-gray-900 capitalize">{formData.action}</strong> recommendation with {selectedSuggestions.thesis.length} key points
                  </p>
                )}
                {!isStepComplete(3) && expandedSection !== 3 && canAccessSection(3) && (
                  <p className="text-sm text-gray-500 mt-1">Build your investment case</p>
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
                              ? 'bg-blue-100 border-2 border-blue-500'
                              : 'bg-white border-2 border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedSuggestions.thesis.includes(index)}
                            onChange={() => toggleSuggestion('thesis', index)}
                            className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-900 flex-1">{suggestion}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Additional Thesis Points (Optional)
                  </label>
                  <textarea
                    value={formData.thesis}
                    onChange={(e) => updateField('thesis', e.target.value)}
                    placeholder="Add any additional points or context to your investment thesis..."
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                  />
                </div>
              </div>

              {isStepComplete(3) && (
                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setExpandedSection(4)}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    Next: Price Target & Timeline
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section 4: Price Target & Timeline (formerly Section 3) */}
        <div className={`bg-white rounded-2xl shadow-sm border-2 transition-all ${
          !canAccessSection(4)
            ? 'border-gray-200 opacity-60'
            : expandedSection === 4 
            ? 'border-blue-500 shadow-lg' 
            : isStepComplete(4)
            ? 'border-green-500'
            : 'border-gray-200'
        }`}>
          <button
            onClick={() => canAccessSection(4) && setExpandedSection(expandedSection === 4 ? 0 : 4)}
            disabled={!canAccessSection(4)}
            className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-t-2xl disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg transition-all ${
                !canAccessSection(4)
                  ? 'bg-gray-200 text-gray-400'
                  : isStepComplete(4)
                  ? 'bg-green-600'
                  : expandedSection === 4
                  ? 'bg-blue-600'
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
                <h3 className="text-lg font-bold text-gray-900">Step 4: Price Target & Timeline</h3>
                {isStepComplete(4) && expandedSection !== 4 && (
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
                {!isStepComplete(4) && expandedSection !== 4 && canAccessSection(4) && (
                  <p className="text-sm text-gray-500 mt-1">Set price expectations and holding period</p>
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
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200 mb-6">
                <TrendingUp className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <strong>Set clear expectations:</strong> Clients need to know the target price and how long they should hold. Be specific!
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Current Price <span className="text-gray-500 font-normal">(Reference)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.currentPrice}
                        onChange={(e) => updateField('currentPrice', e.target.value)}
                        placeholder="e.g., $192.57"
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all ${
                          autoFilled ? 'border-green-300 bg-green-50' : 'border-gray-300 focus:border-blue-500'
                        }`}
                      />
                      {autoFilled && (
                        <Sparkles className="w-5 h-5 text-green-600 absolute right-3 top-1/2 -translate-y-1/2" />
                      )}
                    </div>
                    {autoFilled && (
                      <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Auto-filled with live price
                      </p>
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
                      placeholder="e.g., 200 or 180-220"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                    <p className="text-xs text-gray-500 mt-1">Single price or range works</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Expected Timeframe * <span className="text-gray-500 font-normal">(How long to hold?)</span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'short-term', label: 'Short-term', sublabel: '1-2 weeks', icon: '⚡' },
                      { value: 'medium-term', label: 'Medium-term', sublabel: '1-6 months', icon: '📈' },
                      { value: 'long-term', label: 'Long-term', sublabel: '6-24 months', icon: '🎯' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateField('timeframe', option.value)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          formData.timeframe === option.value
                            ? 'border-blue-600 bg-blue-50 shadow-md'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="text-2xl mb-2">{option.icon}</div>
                        <div className="font-semibold text-gray-900">{option.label}</div>
                        <div className="text-xs text-gray-600">{option.sublabel}</div>
                      </button>
                    ))}
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm text-gray-600 mb-2">Or specify your own timeframe:</label>
                    <input
                      type="text"
                      value={formData.timeframe && !['short-term', 'medium-term', 'long-term'].includes(formData.timeframe) ? formData.timeframe : ''}
                      onChange={(e) => updateField('timeframe', e.target.value)}
                      placeholder="e.g., 1-6 months"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Risk Level <span className="text-gray-500 font-normal">(Be honest with clients)</span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'low', label: 'Low Risk', sublabel: 'Blue chip, stable' },
                      { value: 'medium', label: 'Medium Risk', sublabel: 'Growth, some volatility' },
                      { value: 'high', label: 'High Risk', sublabel: 'Speculative, volatile' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => updateField('riskLevel', option.value)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          formData.riskLevel === option.value
                            ? 'border-blue-600 bg-blue-50 shadow-md'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="font-semibold text-gray-900">{option.label}</div>
                        <div className="text-xs text-gray-600 mt-1">{option.sublabel}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {isStepComplete(4) && (
                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setExpandedSection(5)}
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

        {/* Section 5: Risks & Catalysts (formerly Section 4) */}
        <div className={`bg-white rounded-2xl shadow-sm border-2 transition-all ${
          !canAccessSection(5)
            ? 'border-gray-200 opacity-60'
            : expandedSection === 5 
            ? 'border-blue-500 shadow-lg' 
            : isStepComplete(5)
            ? 'border-green-500'
            : 'border-gray-200'
        }`}>
          <button
            onClick={() => canAccessSection(5) && setExpandedSection(expandedSection === 5 ? 0 : 5)}
            disabled={!canAccessSection(5)}
            className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-t-2xl disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg transition-all ${
                !canAccessSection(5)
                  ? 'bg-gray-200 text-gray-400'
                  : isStepComplete(5)
                  ? 'bg-green-600'
                  : expandedSection === 5
                  ? 'bg-blue-600'
                  : 'bg-gray-300 text-gray-600'
              }`}>
                {!canAccessSection(5) ? (
                  <Lock className="w-5 h-5" />
                ) : isStepComplete(5) ? (
                  <Check className="w-6 h-6" />
                ) : (
                  '5'
                )}
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-gray-900">Step 5: Risks & Catalysts</h3>
                {isStepComplete(5) && expandedSection !== 5 && (
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedSuggestions.risks.length} risk factors selected
                  </p>
                )}
                {!isStepComplete(5) && expandedSection !== 5 && canAccessSection(5) && (
                  <p className="text-sm text-gray-500 mt-1">Identify potential risks</p>
                )}
              </div>
            </div>
            {canAccessSection(5) && (
              expandedSection === 5 ? (
                <ChevronUp className="w-6 h-6 text-gray-400" />
              ) : (
                <ChevronDown className="w-6 h-6 text-gray-400" />
              )
            )}
          </button>

          {expandedSection === 5 && (
            <div className="px-6 pb-6 pt-2 border-t border-gray-200">
              <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-300 mb-6">
                <AlertCircle className="w-5 h-5 text-yellow-700 shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-900">
                  <strong>Be transparent about risks!</strong> When clients ask "What could go wrong?", honest answers build trust. AI will use this to address their concerns properly.
                </div>
              </div>

              {aiSuggestions.risks && aiSuggestions.risks.length > 0 && (
                <div className="bg-red-50 rounded-xl p-5 border-2 border-red-300">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                    <div>
                      <h4 className="font-bold text-gray-900">AI-Identified Risk Factors</h4>
                      <p className="text-xs text-gray-600">Select the risks that apply to your thesis</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {aiSuggestions.risks.map((risk, index) => (
                      <label
                        key={index}
                        className={`flex items-start gap-3 p-4 rounded-lg cursor-pointer transition-all ${
                          selectedSuggestions.risks.includes(index)
                            ? 'bg-red-100 border-2 border-red-500'
                            : 'bg-white border-2 border-gray-200 hover:border-red-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedSuggestions.risks.includes(index)}
                          onChange={() => toggleSuggestion('risks', index)}
                          className="mt-1 w-5 h-5 text-red-600 rounded focus:ring-2 focus:ring-red-500"
                        />
                        <span className="text-sm text-gray-900 flex-1">{risk}</span>
                      </label>
                    ))}
                  </div>
                  {selectedSuggestions.risks.length > 0 && (
                    <div className="mt-4 p-3 bg-white rounded-lg border border-red-200 flex items-center gap-2">
                      <Info className="w-4 h-4 text-red-600 shrink-0" />
                      <p className="text-xs text-gray-700">
                        <strong>Note:</strong> {selectedSuggestions.risks.length} risks selected. These will appear in your risk analysis below.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {isStepComplete(5) && (
                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => {
                      // Scroll to review section
                      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    Review & Send
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 6: Review & Send (formerly Step 5) */}
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
              
              {/* Mobile Preview */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Mobile Preview
                </label>
                <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl">
                  <div className="w-[148px] h-[18px] bg-gray-800 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute"></div>
                  <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[124px] rounded-s-lg"></div>
                  <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[178px] rounded-s-lg"></div>
                  <div className="h-[64px] w-[3px] bg-gray-800 absolute -end-[17px] top-[142px] rounded-e-lg"></div>
                  <div className="rounded-[2rem] overflow-hidden w-full h-full bg-white dark:bg-gray-800">
                    <div className="p-4 space-y-4 overflow-y-auto h-full">
                      {isGeneratingImage ? (
                        <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg">
                          <Loader2 className="w-8 h-8 animate-spin text-gray-400"/>
                        </div>
                      ) : generatedImageUrl ? (
                        <Image 
                          src={generatedImageUrl} 
                          alt="Stock recommendation" 
                          width={300} 
                          height={200} 
                          className="w-full h-auto rounded-lg"
                        />
                      ) : (
                        <div className="bg-blue-100 p-4 rounded-lg">
                          <p className="text-sm font-bold text-blue-900">{formData.action.toUpperCase()} {formData.ticker}</p>
                          <p className="text-xs text-blue-700 mt-1">{formData.companyName}</p>
                        </div>
                      )}
                      
                      <div className="text-sm space-y-2">
                        {selectedSuggestions.thesis.map((i, idx) => (
                          <p key={idx} className="text-gray-700">• {aiSuggestions.thesis[i]}</p>
                        ))}
                        {formData.thesis && <p className="text-gray-700">• {formData.thesis}</p>}
                      </div>
                      
                      <div className="bg-gray-100 p-3 rounded-lg text-xs space-y-1">
                        <p><strong>Target:</strong> {formData.priceTarget}</p>
                        <p><strong>Timeframe:</strong> {formData.timeframe}</p>
                        <p><strong>Risk:</strong> <span className="capitalize">{formData.riskLevel}</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Button
                    onClick={handleSaveAsDraft}
                    variant="outline"
                    disabled={isSaving}
                    className="flex-1"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save as Draft
                      </>
                    )}
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Send to Clients</h4>
                  
                  {/* Contact Selection */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <Popover open={openContactsPopover} onOpenChange={setOpenContactsPopover}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="justify-between">
                          <span className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Contacts
                          </span>
                          {selectedContacts.length > 0 && (
                            <Badge variant="secondary">{selectedContacts.length}</Badge>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search contacts..." />
                          <CommandList>
                            <CommandEmpty>No contacts found.</CommandEmpty>
                            <CommandGroup>
                              {contacts.map((contact) => (
                                <CommandItem
                                  key={contact.id}
                                  onSelect={() => {
                                    setSelectedContacts(prev =>
                                      prev.includes(contact.id)
                                        ? prev.filter(id => id !== contact.id)
                                        : [...prev, contact.id]
                                    );
                                  }}
                                >
                                  <div className={cn(
                                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                    selectedContacts.includes(contact.id)
                                      ? "bg-primary text-primary-foreground"
                                      : "opacity-50 [&_svg]:invisible"
                                  )}>
                                    <Check className="h-4 w-4" />
                                  </div>
                                  <span>{contact.name}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                    <Popover open={openGroupsPopover} onOpenChange={setOpenGroupsPopover}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="justify-between">
                          <span className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Groups
                          </span>
                          {selectedGroups.length > 0 && (
                            <Badge variant="secondary">{selectedGroups.length}</Badge>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search groups..." />
                          <CommandList>
                            <CommandEmpty>No groups found.</CommandEmpty>
                            <CommandGroup>
                              {contactGroups.map((group) => (
                                <CommandItem
                                  key={group.id}
                                  onSelect={() => {
                                    setSelectedGroups(prev =>
                                      prev.includes(group.id)
                                        ? prev.filter(id => id !== group.id)
                                        : [...prev, group.id]
                                    );
                                  }}
                                >
                                  <div className={cn(
                                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                    selectedGroups.includes(group.id)
                                      ? "bg-primary text-primary-foreground"
                                      : "opacity-50 [&_svg]:invisible"
                                  )}>
                                    <Check className="h-4 w-4" />
                                  </div>
                                  <span>{group.name}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Send Buttons */}
                  <Tabs defaultValue="sms" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="sms">
                        <Phone className="w-4 h-4 mr-2" />
                        SMS
                      </TabsTrigger>
                      <TabsTrigger value="whatsapp">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        WhatsApp
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="sms" className="mt-3">
                      <Button
                        onClick={() => handleSendCampaign('sms')}
                        disabled={isSending || (selectedContacts.length === 0 && selectedGroups.length === 0)}
                        className="w-full"
                      >
                        {isSending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Send via SMS
                          </>
                        )}
                      </Button>
                    </TabsContent>
                    <TabsContent value="whatsapp" className="mt-3">
                      <Button
                        onClick={() => handleSendCampaign('whatsapp')}
                        disabled={isSending || (selectedContacts.length === 0 && selectedGroups.length === 0)}
                        className="w-full"
                      >
                        {isSending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Send via WhatsApp
                          </>
                        )}
                      </Button>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}