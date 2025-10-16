
// src/components/partner/templates/StockRecommendationEditor.tsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Send, Sparkles, Upload, FileText, MessageSquare, Brain, Plus, Check, ChevronDown, ChevronUp, AlertCircle, Info, Users, Lock, Database, TrendingUp, Calendar, Save, Loader2, Phone, User, X } from 'lucide-react';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { sendSmsCampaignAction } from '@/actions/sms-actions';
import { sendWhatsAppCampaignAction } from '@/actions/whatsapp-actions';
import type { Contact, ContactGroup, Campaign, TradingPick } from '@/lib/types';
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

interface StockRecommendationEditorProps {
  initialData?: TradingPick | null;
  onSave: (data: Omit<TradingPick, 'id' | 'partnerId'>, existingId?: string) => Promise<boolean>;
  onBack: () => void;
}

export default function StockRecommendationEditor({ initialData, onSave, onBack }: StockRecommendationEditorProps) {
  const [formData, setFormData] = useState<Omit<TradingPick, 'id'| 'partnerId'>>({
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
  const existingIdeaId = initialData?.id;

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
      if(initialData.ticker) {
        handleTickerChange(initialData.ticker, true);
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

  const handleTickerChange = useCallback((value: string, isInitialLoad = false) => {
    const upperTicker = value.toUpperCase();
    updateField('ticker', upperTicker);
    
    if (STOCK_DATABASE[upperTicker] && !isInitialLoad) {
      const stockData = STOCK_DATABASE[upperTicker];
      setFormData(prev => ({
        ...prev,
        ticker: upperTicker,
        companyName: stockData.companyName,
        sector: stockData.sector,
        currentPrice: stockData.currentPrice
      }));
      
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
      if(!isInitialLoad){
        setAutoFilled(false);
        setAiSuggestions({ thesis: [], risks: [], catalysts: [] });
      }
    }
  }, [formData]);

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
    setExpandedSection(expandedSection === section ? null : section);
  };

  const isStepComplete = (step: number) => {
    switch(step) {
      case 1: return !!(formData.ticker && formData.companyName && formData.sector);
      case 2: return true; // AI Training is optional
      case 3: return !!(formData.thesis && formData.action);
      case 4: return !!(formData.priceTarget && formData.timeframe);
      case 5: return !!(formData.keyRisks && formData.catalysts);
      default: return false;
    }
  };

  const allStepsComplete = useMemo(() => {
    return [1, 3, 4, 5].every(isStepComplete);
  }, [formData]);

  const timeframeOptions = [
    { value: 'short', label: 'Short-term', example: '1-2 weeks', icon: '⚡' },
    { value: 'medium', label: 'Medium-term', example: '1-6 months', icon: '📈' },
    { value: 'long', label: 'Long-term', example: '6-24 months', icon: '🎯' }
  ];

  const handleSaveDraft = async () => {
    setIsSaving(true);
    const success = await onSave(formData, existingIdeaId);
    setIsSaving(false);
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
  }, [allStepsComplete, generatedImageUrl, isGeneratingImage]);


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
      
      // 1. Create the Campaign document in Firestore
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
        recipients: {
          contacts: selectedRecipients.filter(r => r.type === 'contact').map(r => r.name),
          groups: selectedRecipients.filter(r => r.type === 'group').map(r => r.name),
        },
      });
      console.log('Campaign document created with ID:', campaignRef.id);

      // 2. Call the correct action based on platform
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

  const renderSection = (sectionNumber: number, title: string, subtitle: string, children: React.ReactNode) => {
    const isComplete = isStepComplete(sectionNumber);
    const isExpanded = expandedSection === sectionNumber;

    return (
      <div className={`bg-white rounded-2xl shadow-sm border-2 transition-all ${
        isExpanded 
          ? 'border-blue-500 shadow-lg' 
          : isComplete
          ? 'border-green-200'
          : 'border-gray-200'
      }`}>
        <button
          onClick={() => toggleSection(sectionNumber)}
          className="w-full p-6 flex items-center justify-between hover:bg-gray-50 rounded-t-2xl transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
              isComplete
                ? 'bg-green-600 text-white'
                : isExpanded
                ? 'bg-blue-600 text-white'
                : 'bg-gray-300 text-gray-600'
            }`}>
              {isComplete ? <Check className="w-6 h-6" /> : sectionNumber}
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
              {!isExpanded && (
                <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
              )}
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-6 h-6 text-gray-400" />
          ) : (
            <ChevronDown className="w-6 h-6 text-gray-400" />
          )}
        </button>
        {isExpanded && (
          <div className="px-6 pb-6 pt-2 border-t border-gray-200">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateX(10px); } to { opacity: 1; transform: translateX(0); } }
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
      `}</style>
      
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 font-medium">
        <ArrowLeft className="w-4 h-4" />
        Back to Ideabox
      </button>

      <div className="space-y-4">
        {renderSection(1, "Step 1: Basic Information", "Enter ticker to auto-fill details.", 
          <>
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200 my-6">
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
              {/* Other inputs for Step 1 */}
            </div>
          </>
        )}
        
        {renderSection(2, "Step 2: AI Training & Research", "Optional: Provide context for the AI agent.",
            <>
                <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200 my-6">
                  <Brain className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-purple-900">
                    <strong>Train the AI:</strong> Provide any research documents, articles, or notes. The AI will use this material to answer client questions about your recommendation.
                  </div>
                </div>
                {/* AI training form fields */}
            </>
        )}

        {renderSection(3, "Step 3: Investment Thesis", "Define the core recommendation and reasoning.",
          <>
            <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200 my-6">
              <Sparkles className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
              <div className="text-sm text-purple-900">
                <strong>This is the most important part!</strong> Everything you write here trains your AI agent. When clients ask "Why this stock?", the AI will use your thesis to answer.
              </div>
            </div>
            <div className="space-y-6">
              {/* Thesis form fields */}
            </div>
          </>
        )}
        
        {renderSection(4, "Step 4: Price Target & Timeline", "Set expectations for the investment.",
          <>
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200 my-6">
              <TrendingUp className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <strong>Set clear expectations:</strong> Clients need to know the target price and how long they should hold. Be specific!
              </div>
            </div>
            {/* Price target form fields */}
          </>
        )}
        
        {renderSection(5, "Step 5: Risks & Catalysts", "Outline potential risks and upside drivers.",
          <>
            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200 my-6">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-900">
                <strong>Be transparent about risks!</strong> When clients ask "What could go wrong?", honest answers build trust. AI will use this to address their concerns properly.
              </div>
            </div>
            {/* Risk/Catalyst form fields */}
          </>
        )}

        {/* Step 6: Review & Send */}
        {allStepsComplete && (
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
                                      <CommandItem key={group.id} onSelect={() => handleRecipientSelect({ ...group, type: 'group' })} className="cursor-pointer">
                                        <Check className={cn("mr-2 h-4 w-4", selectedRecipients.some(r => r.id === group.id) ? "opacity-100" : "opacity-0")} />
                                        <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                                        <div className="flex-1">{group.name}</div>
                                        <div className="text-xs text-muted-foreground">{group.contactCount}</div>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                  <CommandGroup heading="Contacts">
                                    {contacts.map(contact => (
                                      <CommandItem key={contact.id} onSelect={() => handleRecipientSelect({ ...contact, type: 'contact' })} className="cursor-pointer">
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
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Mobile Preview</label>
                  <div className="relative mx-auto border-gray-900 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl">
                    <div className="rounded-[2rem] overflow-hidden w-full h-full bg-white">
                      <div className="p-4 space-y-4">
                        {isGeneratingImage ? (
                          <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                          </div>
                        ) : generatedImageUrl ? (
                          <Image src={generatedImageUrl} alt="Generated stock pick" width={1200} height={675} className="w-full rounded-lg" data-ai-hint="stock chart" />
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
                <Button onClick={handleSendBroadcast} disabled={isSending || !generatedImageUrl || selectedRecipients.length === 0} className="w-full flex-1">
                  {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  {isSending ? 'Sending...' : `Send to ${selectedRecipients.reduce((acc, r) => acc + (r.contactCount || 1), 0)} recipients`}
                </Button>
              </div>

              <div className="flex justify-end mt-6">
                <Button onClick={handleSaveDraft} variant="outline" disabled={isSending || isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  {isSaving ? 'Saving...' : 'Save as Idea'}
                </Button>
              </div>
          </div>
        )}
      </div>
    </>
  );
}
