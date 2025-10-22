
"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ArrowRight, Send, Sparkles, Upload, FileText, MessageSquare, Brain, Plus, Check, ChevronDown, ChevronUp, AlertCircle, Info, Users, Lock, Database, TrendingUp, Calendar, Save, Loader2, Phone, User, X, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { collection, query, onSnapshot } from 'firebase/firestore';

import { useToast } from '@/hooks/use-toast';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { generateStockPickImage } from '@/ai/flows/generate-stock-pick-image-flow';
import { saveTradingPickAction } from '@/actions/trading-pick-actions';
import { Button } from '@/components/ui/button';
import { sendSmsCampaignAction } from '@/actions/sms-actions';
import { sendWhatsAppCampaignAction } from '@/actions/whatsapp-actions';
import type { Contact, ContactGroup, TradingPick } from '@/lib/types';
import { db } from '@/lib/firebase';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogPortal, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

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
  marketContext: string;
  sectorTrends: string;
  analystNotes: string;
}

interface AIsuggestions {
  thesis: string[];
  catalysts?: string[];
  risks: string[];
}

interface TrainingDataState {
  source: 'mission-control' | 'upload' | null;
  uploadedFiles: File[];
  missionControlSelection: string[];
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
  const user = useAuth();
  const router = useRouter();
  const { currentWorkspace } = useMultiWorkspaceAuth();
  const { toast } = useToast();
  const [expandedSection, setExpandedSection] = useState<number>(1);
  const [autoFilled, setAutoFilled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(initialData?.imageUrl || null);
  const [ideaId, setIdeaId] = useState<string | undefined>(initialData?.id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  interface ICompanyData {
    companyTicker: string;
    companyName: string;
    sector: string;
    aiThesis: string[];
    aiRisks: string[];
    aiCatalysts: string[];
    currentPrice: string | null;
  }

  // code to fetch the list of tickers from saved docs
  const [fetchedTickers, setFetchedTickers] = useState<string[]>([]);
  interface IThesisDoc {
    url: string;
    name?: string;
    thesisInfo: {
      text: string
    }[]
  }
  const [actualDocuments, setactualDocuments] = useState<IThesisDoc[]>([]);

  const listTickers = useCallback((docs: IThesisDoc[]) => {
    setFetchedTickers((docs ?? []).flatMap(doc =>
      (doc.thesisInfo ?? []).map(thesis =>
        JSON.parse((thesis.text ?? '{}'))?.companyTicker
      ).filter(ticker => typeof ticker === "string")));
  }, [])

  const fetchDocs = useCallback(async () => {
    const response = await fetch('/api/thesis-docs/list', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.user?.customClaims?.token ?? ""}`
      },
    })

    const json = await response.json();
    if (json.success) {
      setactualDocuments(json.data ?? []);
      const tickers = listTickers(json.data);
    }
  }, []);
  // call fetchDocs on load
  useEffect(() => {
    fetchDocs();
  }, [])

  // New state for confirmation modal
  const [showDataModal, setShowDataModal] = useState(false);
  const [fetchedStockData, setFetchedStockData] = useState<ICompanyData | null>(null);
  const [isFetchingStockData, setIsFetchingStockData] = useState(false);

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
    marketContext: initialData?.marketContext || '',
    sectorTrends: initialData?.sectorTrends || '',
    analystNotes: initialData?.analystNotes || '',
  });

  const [trainingData, setTrainingData] = useState<TrainingDataState>({
    source: null,
    uploadedFiles: [],
    missionControlSelection: []
  });

  const [aiSuggestions, setAiSuggestions] = useState<AIsuggestions>(
    { thesis: [], catalysts: [], risks: [] });
  const [selectedSuggestions, setSelectedSuggestions] = useState<{ thesis: number[], risks: number[] }>({ thesis: [], risks: [] });

  const fetchStockData = useCallback(async (ticker: string) => {
    try {
      setIsFetchingStockData(true);
      setFetchedStockData(null);

      const response = await fetch(`/api/thesis-docs/gen_ideabox?query=${ticker}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.user?.customClaims?.token ?? ""}`
        },
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        toast({
          variant: "destructive",
          title: 'Error',
          description: result.error ?? "Sorry, we seem to have run into an error while getting the response"
        });
      } else if (result.success) {
        const stockDataJson: ICompanyData | null = JSON.parse(result.result)?.companyData;
        toast({
          title: 'Done',
          description: 'Responded'
        });
        if (stockDataJson) {
          setFetchedStockData(stockDataJson);
          setFormData({
            ticker: stockDataJson.companyTicker,
            companyName: stockDataJson.companyName,
            sector: stockDataJson.sector,
            action: "",
            thesis: stockDataJson.aiThesis.join("\n"),
            catalysts: stockDataJson.aiCatalysts.join("\n"),
            keyRisks: stockDataJson.aiRisks.join("\n"),
            currentPrice: "",
            priceTarget: "",
            timeframe: "",
            analystNotes: "",
            marketContext: "",
            riskLevel: "",
            sectorTrends: "",
          });
          return stockDataJson;
        }
        // setAiResponse(result.result);
        // setChatInput("");
      } else {
        toast({
          variant: "destructive",
          title: 'Error',
          description: result.error ?? "Sorry, we seem to have run into an error while getting the response"
        });
      }

    } catch (e) {
      console.error("Error with RAG", e);
      toast({
        variant: "destructive",
        title: "Cannot RAG",
        description: `${e}`
      });
      return null;
    } finally {
      setIsFetchingStockData(false);
    }
  }, [])

  // Debounce effect for fetching stock data
  useEffect(() => {
    const ticker = formData.ticker.trim().toUpperCase();
    if (ticker.length < 1 || ticker.length > 5) {
      setIsFetchingStockData(false);
      return;
    }

    setIsFetchingStockData(true);
    const handler = setTimeout(async () => {
      try {
        const stockData = await fetchStockData(ticker);
        if (stockData && stockData.companyName) {
          setFetchedStockData(stockData);
          setShowDataModal(true);
        }
      } catch (error) {
        console.error("Failed to fetch stock data:", error);
      } finally {
        setIsFetchingStockData(false);
      }
    }, 1000); // 1-second debounce

    return () => {
      clearTimeout(handler);
      setIsFetchingStockData(false);
    };
  }, [formData.ticker]);

  const embedFetchedData = () => {
    if (fetchedStockData) {
      setFormData(prev => ({
        ...prev,
        companyName: fetchedStockData?.companyName,
        sector: fetchedStockData?.sector,
        currentPrice: fetchedStockData?.currentPrice ?? "-",
      }));
      setAiSuggestions({
        thesis: fetchedStockData?.aiThesis,
        catalysts: fetchedStockData?.aiCatalysts,
        risks: fetchedStockData?.aiRisks,
      });
      setShowDataModal(false);
    }
  };

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    setTrainingData(prev => ({
      ...prev,
      uploadedFiles: [...prev.uploadedFiles, ...newFiles]
    }));

    toast({
      title: "Files Added",
      description: `${newFiles.length} file(s) added for training data.`
    });
  };

  const removeUploadedFile = (index: number) => {
    setTrainingData(prev => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.filter((_, i) => i !== index)
    }));
  };

  const isStepComplete = (step: number): boolean => {
    switch (step) {
      case 1: return !!(formData.ticker && formData.companyName);
      case 2: return trainingData.source !== null && (
        (trainingData.source === 'mission-control' && trainingData.missionControlSelection.length > 0) ||
        (trainingData.source === 'upload' && trainingData.uploadedFiles.length > 0)
      );
      case 3: return (formData.thesis.length > 0 || selectedSuggestions.thesis.length > 0);
      case 4: return !!(formData.priceTarget && formData.timeframe && formData.riskLevel);
      case 5: return true;
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
    return isStepComplete(1) && isStepComplete(2) && isStepComplete(3) && isStepComplete(4) && isStepComplete(5);
  }, [formData, selectedSuggestions, trainingData]);

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

  const assemblePickData = () => {
    const finalThesis = [
      ...selectedSuggestions.thesis.map(i => aiSuggestions.thesis[i]),
      formData.thesis
    ].filter(Boolean).join('\n\n');

    const selectedRiskTexts = selectedSuggestions.risks.map(i => aiSuggestions.risks[i]);

    return {
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
      marketContext: formData.marketContext,
      sectorTrends: formData.sectorTrends,
      ideaType: 'stock-recommendation',
      partnerId: currentWorkspace!.partnerId,
      imageUrl: generatedImageUrl || undefined,
      analystNotes: formData.analystNotes,
    };
  };

  const handleSaveAndGetId = async (): Promise<string | undefined> => {
    if (ideaId) return ideaId;
    if (!currentWorkspace?.partnerId) return undefined;

    setIsSaving(true);
    try {
      const pickData = assemblePickData();
      const result = await saveTradingPickAction({
        partnerId: currentWorkspace.partnerId,
        pickData,
        pickId: ideaId,
      });

      if (result.success && result.pickId) {
        setIdeaId(result.pickId);
        toast({ title: 'Idea Saved!', description: 'Your draft has been saved.' });
        return result.pickId;
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({ title: "Draft save failed", description: error.message, variant: "destructive" });
      return undefined;
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateImage = async () => {
    setIsGeneratingImage(true);
    try {
      const pickData = assemblePickData();
      const imageResult = await generateStockPickImage(pickData);
      if (imageResult.imageUrl) {
        setGeneratedImageUrl(imageResult.imageUrl);
        toast({ title: "Image Generated!", description: "Visual card created for your recommendation." });
      } else {
        throw new Error("Image generation failed to return a URL.");
      }
    } catch (error: any) {
      toast({ title: "Image Generation Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleSendCampaign = async (channel: 'sms' | 'whatsapp') => {
    if (!currentWorkspace?.partnerId) return;
    if (selectedRecipients.length === 0) {
      toast({ title: "No recipients selected", variant: "destructive" });
      return;
    }

    setIsSending(true);

    try {
      const currentIdeaId = await handleSaveAndGetId();
      if (!currentIdeaId) {
        throw new Error("Failed to save the idea before sending. Please try again.");
      }

      const finalThesis = [
        ...selectedSuggestions.thesis.map(i => aiSuggestions.thesis[i]),
        formData.thesis
      ].filter(Boolean).join('\n\n');

      const message = `📈 New Stock Pick: ${formData.ticker} (${formData.action.toUpperCase()})\n\nThesis:\n${finalThesis}\n\nTarget: ${formData.priceTarget}\nTimeframe: ${formData.timeframe}\nRisk: ${formData.riskLevel.toUpperCase()}`;

      const allNumbers = new Set<string>();
      for (const recipient of selectedRecipients) {
        if (recipient.type === 'contact' && recipient.phone) {
          allNumbers.add(recipient.phone);
        } else if (recipient.type === 'group') {
          const groupContacts = contacts.filter(c => c.groups?.includes(recipient.name) && c.phone);
          groupContacts.forEach(c => allNumbers.add(c.phone));
        }
      }

      const response = await fetch('/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: channel,
          numbers: Array.from(allNumbers),
          message,
          ideaId: currentIdeaId,
          partnerId: currentWorkspace.partnerId,
          mediaUrl: generatedImageUrl || undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({ title: "Success!", description: result.message });
      } else {
        throw new Error(result.message || 'Failed to send campaign');
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveAsDraft = async (calledFromSend: boolean = false) => {
    if (!currentWorkspace?.partnerId) return;
    setIsSaving(true);

    try {
      const pickData = assemblePickData();

      if (onSave) {
        const success = await onSave(pickData, ideaId);
        if (success && !calledFromSend) {
          router.push('/partner/ideabox');
        }
      } else {
        const result = await saveTradingPickAction({
          partnerId: currentWorkspace.partnerId,
          pickData,
          pickId: ideaId
        });
        if (result.success) {
          if (result.pickId && !ideaId) setIdeaId(result.pickId);
          toast({ title: 'Idea Saved!', description: 'Your stock recommendation has been saved.' });
          if (!calledFromSend) router.push('/partner/ideabox');
        } else {
          throw new Error(result.message);
        }
      }
    } catch (error: any) {
      if (!calledFromSend) {
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

  const canSend = !isSending && selectedRecipients.length > 0 && (!!formData.thesis.trim() || selectedSuggestions.thesis.length > 0 || !!generatedImageUrl);

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>

      {onBack && (
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 font-medium">
          <ArrowLeft className="w-4 h-4" />
          Back to Ideabox
        </button>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {initialData ? 'Edit' : 'Create'} Stock Recommendation
          </h1>
          <p className="text-gray-600">Fill in each section. AI will help you along the way with smart suggestions.</p>
        </div>

        <div className="space-y-4">
          {/* Section 1: Basic Information */}
          <div className={`bg-white rounded-2xl shadow-sm border-2 transition-all ${expandedSection === 1
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
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg transition-all ${isStepComplete(1) ? 'bg-green-600' : expandedSection === 1 ? 'bg-blue-600' : 'bg-gray-300'
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
                    <strong>Quick tip:</strong> Just enter a ticker symbol. AI will fetch the latest data for you to confirm.
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Stock Ticker * <span className="text-gray-500 font-normal">(e.g., NVDA, AAPL, TSLA)</span>
                    </label>
                    <div className="relative">
                      <select
                        value={formData.ticker}
                        onChange={(e) => updateField('ticker', e.target.value)}
                        className="px-3 py-2 border rounded-md text-sm bg-background"
                      >
                        {fetchedTickers.map(ticker =>
                          <option key={ticker} value={ticker}>{ticker}</option>)}
                      </select>

                      {/* <input
                        type="text"
                        value={formData.ticker}
                        onChange={(e) => updateField('ticker', e.target.value)}
                        placeholder="Enter ticker symbol"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all"
                      /> */}
                      {isFetchingStockData && <Loader2 className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 animate-spin" />}
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
                        placeholder="e.g., NVIDIA Corporation"
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all ${autoFilled ? 'border-green-300 bg-green-50' : 'border-gray-300 focus:border-blue-500'
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
                        className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all ${autoFilled ? 'border-green-300 bg-green-50' : 'border-gray-300 focus:border-blue-500'
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
                      Next: Mission Control
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Section 2: Train Data */}
          <div className={`bg-white rounded-2xl shadow-sm border-2 transition-all ${!canAccessSection(2)
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
              className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-t-2xl disabled:cursor-not-allowed disabled:hover:bg-white"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg transition-all ${!canAccessSection(2)
                  ? 'bg-gray-200 text-gray-400'
                  : isStepComplete(2)
                    ? 'bg-green-600'
                    : expandedSection === 2
                      ? 'bg-blue-600'
                      : 'bg-gray-300 text-gray-600'
                  }`}>
                  {!canAccessSection(2) ? <Lock className="w-5 h-5" /> : isStepComplete(2) ? <Check className="w-6 h-6" /> : '2'}
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-gray-900">Step 2: Data Insights</h3>
                  {isStepComplete(2) && expandedSection !== 2 && (
                    <p className="text-sm text-gray-600 mt-1">
                      {trainingData.source === 'mission-control'
                        ? `${trainingData.missionControlSelection.length} items from Mission Control`
                        : `${trainingData.uploadedFiles.length} file(s) uploaded`}
                    </p>
                  )}
                  {!isStepComplete(2) && expandedSection !== 2 && canAccessSection(2) && (
                    <p className="text-sm text-gray-500 mt-1">Choose your training data source</p>
                  )}
                </div>
              </div>
              {canAccessSection(2) && (expandedSection === 2 ? <ChevronUp className="w-6 h-6 text-gray-400" /> : <ChevronDown className="w-6 h-6 text-gray-400" />)}
            </button>

            {expandedSection === 2 && (
              <div className="px-6 pb-6 pt-2 border-t border-gray-200">
                <div className="flex items-start gap-3 p-4 bg-indigo-50 rounded-lg border border-indigo-200 mb-6">
                  <Brain className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div className="text-sm text-indigo-900">
                    <strong>Train your AI agent:</strong> Choose to either use your existing master data from Mission Control or upload new files. This data will help the AI understand your analysis style and provide better recommendations.
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      Select Training Data Source *
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setTrainingData(prev => ({ ...prev, source: 'mission-control', uploadedFiles: [] }))}
                        className={`p-6 rounded-xl border-2 text-left transition-all ${trainingData.source === 'mission-control'
                          ? 'border-indigo-600 bg-indigo-50 shadow-md'
                          : 'border-gray-300 hover:border-gray-400'
                          }`}
                      >
                        <Database className="w-8 h-8 text-indigo-600 mb-3" />
                        <div className="font-semibold text-gray-900 mb-1">Mission Control</div>
                        <div className="text-xs text-gray-600">Use your existing master data and previous analysis</div>
                      </button>

                      <button
                        onClick={() => setTrainingData(prev => ({ ...prev, source: 'upload', missionControlSelection: [] }))}
                        className={`p-6 rounded-xl border-2 text-left transition-all ${trainingData.source === 'upload'
                          ? 'border-indigo-600 bg-indigo-50 shadow-md'
                          : 'border-gray-300 hover:border-gray-400'
                          }`}
                      >
                        <Upload className="w-8 h-8 text-indigo-600 mb-3" />
                        <div className="font-semibold text-gray-900 mb-1">Upload Files</div>
                        <div className="text-xs text-gray-600">Upload new documents, reports, or analysis files</div>
                      </button>
                    </div>
                  </div>

                  {trainingData.source === 'mission-control' && (
                    <div className="animate-fade-in">
                      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border-2 border-indigo-300">
                        <div className="flex items-center gap-2 mb-4">
                          <Database className="w-6 h-6 text-indigo-600" />
                          <div>
                            <h4 className="font-bold text-gray-900">Mission Control Data</h4>
                            <p className="text-xs text-gray-600">Select data sources to train your AI agent (Placeholder)</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {[
                            { id: 'historical-analysis', name: 'Historical Stock Analysis', count: 247 },
                            { id: 'market-reports', name: 'Market Research Reports', count: 89 },
                            { id: 'trading-patterns', name: 'Trading Pattern Data', count: 156 },
                            { id: 'sector-insights', name: 'Sector-Specific Insights', count: 73 },
                            { id: 'risk-assessments', name: 'Risk Assessment Models', count: 42 }
                          ].map((item) => (
                            <label
                              key={item.id}
                              className={`flex items-start gap-3 p-4 rounded-lg cursor-pointer transition-all ${trainingData.missionControlSelection.includes(item.id)
                                ? 'bg-indigo-100 border-2 border-indigo-500'
                                : 'bg-white border-2 border-gray-200 hover:border-indigo-300'
                                }`}
                            >
                              <input
                                type="checkbox"
                                checked={trainingData.missionControlSelection.includes(item.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setTrainingData(prev => ({
                                      ...prev,
                                      missionControlSelection: [...prev.missionControlSelection, item.id]
                                    }));
                                  } else {
                                    setTrainingData(prev => ({
                                      ...prev,
                                      missionControlSelection: prev.missionControlSelection.filter(id => id !== item.id)
                                    }));
                                  }
                                }}
                                className="mt-1 w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                              />
                              <div className="flex-1">
                                <span className="text-sm font-medium text-gray-900">{item.name}</span>
                                <span className="text-xs text-gray-500 ml-2">({item.count} records)</span>
                              </div>
                            </label>
                          ))}
                        </div>
                        {trainingData.missionControlSelection.length > 0 && (
                          <div className="mt-4 p-3 bg-white rounded-lg border border-indigo-200 flex items-center gap-2">
                            <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                            <p className="text-xs text-gray-700">
                              <strong>{trainingData.missionControlSelection.length}</strong> data source(s) selected for AI training
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {trainingData.source === 'upload' && (
                    <div className="animate-fade-in">
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border-2 border-purple-300">
                        <div className="flex items-center gap-2 mb-4">
                          <Upload className="w-6 h-6 text-purple-600" />
                          <div>
                            <h4 className="font-bold text-gray-900">Upload Training Files</h4>
                            <p className="text-xs text-gray-600">Upload documents, spreadsheets, or reports (Placeholder)</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <Button
                              variant="outline"
                              onClick={() => fileInputRef.current?.click()}
                              className="w-full"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Choose Files to Upload
                            </Button>
                            <input
                              ref={fileInputRef}
                              type="file"
                              multiple
                              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                              onChange={handleFileUpload}
                              className="hidden"
                            />
                            <p className="text-xs text-gray-500 mt-2">
                              Supported formats: PDF, Word, Excel, CSV, Text files
                            </p>
                          </div>

                          {trainingData.uploadedFiles.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-sm font-semibold text-gray-900">
                                Uploaded Files ({trainingData.uploadedFiles.length})
                              </p>
                              {trainingData.uploadedFiles.map((file, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200"
                                >
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <FileText className="w-5 h-5 text-purple-600 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-medium text-gray-900 truncate">
                                        {file.name}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {(file.size / 1024).toFixed(2)} KB
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => removeUploadedFile(index)}
                                    className="p-1 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    <X className="w-4 h-4 text-red-600" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {trainingData.uploadedFiles.length === 0 && (
                            <div className="p-8 border-2 border-dashed border-purple-300 rounded-lg text-center">
                              <Upload className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                              <p className="text-sm text-gray-600">No files uploaded yet</p>
                              <p className="text-xs text-gray-500 mt-1">Click the button above to select files</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {trainingData.source && (
                    <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                        <div className="text-sm text-yellow-900">
                          <strong>Note:</strong> This is a placeholder UI. Training data integration with the backend will be implemented in the next phase. For now, you can proceed with your selection to complete the workflow.
                        </div>
                      </div>
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

          {/* Section 3: Investment Thesis */}
          <div className={`bg-white rounded-2xl shadow-sm border-2 transition-all ${!canAccessSection(3)
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
              className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-t-2xl disabled:cursor-not-allowed disabled:hover:bg-white"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg transition-all ${!canAccessSection(3)
                  ? 'bg-gray-200 text-gray-400'
                  : isStepComplete(3)
                    ? 'bg-green-600'
                    : expandedSection === 3
                      ? 'bg-blue-600'
                      : 'bg-gray-300 text-gray-600'
                  }`}>
                  {!canAccessSection(3) ? <Lock className="w-5 h-5" /> : isStepComplete(3) ? <Check className="w-6 h-6" /> : '3'}
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
              {canAccessSection(3) && (expandedSection === 3 ? <ChevronUp className="w-6 h-6 text-gray-400" /> : <ChevronDown className="w-6 h-6 text-gray-400" />)}
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
                          onClick={() => updateField('action', action as 'buy' | 'sell' | 'hold' | '')}
                          className={`py-4 px-4 rounded-xl border-2 font-bold capitalize transition-all ${formData.action === action
                            ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-md scale-105'
                            : 'border-gray-300 text-gray-700 hover:border-gray-400'
                            }`}
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  </div>

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
                            className={`flex items-start gap-3 p-4 rounded-lg cursor-pointer transition-all ${selectedSuggestions.thesis.includes(index)
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

          {/* Section 4: Price Target & Timeline */}
          <div className={`bg-white rounded-2xl shadow-sm border-2 transition-all ${!canAccessSection(4)
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
              className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-t-2xl disabled:cursor-not-allowed disabled:hover:bg-white"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg transition-all ${!canAccessSection(4)
                  ? 'bg-gray-200 text-gray-400'
                  : isStepComplete(4)
                    ? 'bg-green-600'
                    : expandedSection === 4
                      ? 'bg-blue-600'
                      : 'bg-gray-300 text-gray-600'
                  }`}>
                  {!canAccessSection(4) ? <Lock className="w-5 h-5" /> : isStepComplete(4) ? <Check className="w-6 h-6" /> : '4'}
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-gray-900">Step 4: Price Target & Timeline</h3>
                  {isStepComplete(4) && expandedSection !== 4 && (
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-gray-600">Target: <strong className="text-gray-900">{formData.priceTarget}</strong></span>
                      <span className="text-sm text-gray-500">• {formData.timeframe}</span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium capitalize">{formData.riskLevel} Risk</span>
                    </div>
                  )}
                  {!isStepComplete(4) && expandedSection !== 4 && canAccessSection(4) && (
                    <p className="text-sm text-gray-500 mt-1">Set price expectations and holding period</p>
                  )}
                </div>
              </div>
              {canAccessSection(4) && (expandedSection === 4 ? <ChevronUp className="w-6 h-6 text-gray-400" /> : <ChevronDown className="w-6 h-6 text-gray-400" />)}
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
                          className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all ${autoFilled ? 'border-green-300 bg-green-50' : 'border-gray-300 focus:border-blue-500'
                            }`}
                        />
                        {autoFilled && <Sparkles className="w-5 h-5 text-green-600 absolute right-3 top-1/2 -translate-y-1/2" />}
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
                          className={`p-4 rounded-xl border-2 text-left transition-all ${formData.timeframe === option.value
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
                          onClick={() => updateField('riskLevel', option.value as 'low' | 'medium' | 'high' | '')}
                          className={`p-4 rounded-xl border-2 text-left transition-all ${formData.riskLevel === option.value
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

          {/* Section 5: Risks & Catalysts */}
          <div className={`bg-white rounded-2xl shadow-sm border-2 transition-all ${!canAccessSection(5)
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
              className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-t-2xl disabled:cursor-not-allowed disabled:hover:bg-white"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg transition-all ${!canAccessSection(5)
                  ? 'bg-gray-200 text-gray-400'
                  : isStepComplete(5)
                    ? 'bg-green-600'
                    : expandedSection === 5
                      ? 'bg-blue-600'
                      : 'bg-gray-300 text-gray-600'
                  }`}>
                  {!canAccessSection(5) ? <Lock className="w-5 h-5" /> : isStepComplete(5) ? <Check className="w-6 h-6" /> : '5'}
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-bold text-gray-900">Step 5: Advanced Analysis</h3>
                  {isStepComplete(5) && expandedSection !== 5 && (<p className="text-sm text-gray-600 mt-1">✓ Risks and upside drivers documented</p>
                  )}
                  {!isStepComplete(5) && expandedSection !== 5 && canAccessSection(5) && (
                    <p className="text-sm text-gray-500 mt-1">Add risks, catalysts, and analyst notes</p>
                  )}
                </div>
              </div>
              {canAccessSection(5) && (expandedSection === 5 ? <ChevronUp className="w-6 h-6 text-gray-400" /> : <ChevronDown className="w-6 h-6 text-gray-400" />)}
            </button>

            {expandedSection === 5 && (
              <div className="px-6 pb-6 pt-2 border-t border-gray-200">
                <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-300 mb-6">
                  <AlertCircle className="w-5 h-5 text-yellow-700 shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-900">
                    <strong>Be transparent about risks!</strong> When clients ask "What could go wrong?", honest answers build trust. AI will use this to address their concerns properly.
                  </div>
                </div>

                <div className="space-y-6">
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
                            className={`flex items-start gap-3 p-4 rounded-lg cursor-pointer transition-all ${selectedSuggestions.risks.includes(index)
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

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Additional Key Risks</label>
                    <textarea
                      value={formData.keyRisks}
                      onChange={(e) => updateField('keyRisks', e.target.value)}
                      placeholder="Describe any other potential risks or downsides..."
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Potential Catalysts / Upside Drivers</label>
                    <textarea
                      value={formData.catalysts}
                      onChange={(e) => updateField('catalysts', e.target.value)}
                      placeholder="What events or factors could drive the stock price up?"
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Broader Market Context</label>
                    <textarea
                      value={formData.marketContext}
                      onChange={(e) => updateField('marketContext', e.target.value)}
                      placeholder="e.g., 'Fed policy is expected to be dovish...'"
                      rows={2}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Sector-Specific Trends</label>
                    <textarea
                      value={formData.sectorTrends}
                      onChange={(e) => updateField('sectorTrends', e.target.value)}
                      placeholder="e.g., 'AI hardware demand is accelerating...'"
                      rows={2}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Internal Analyst Notes</label>
                    <textarea
                      value={formData.analystNotes}
                      onChange={(e) => updateField('analystNotes', e.target.value)}
                      placeholder="Internal notes visible only to your team..."
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                    />
                  </div>
                </div>

                {isStepComplete(5) && (
                  <div className="flex justify-end mt-6">
                    <button
                      onClick={() => { window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); }}
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
        </div>

        {/* Section 6: Review & Send */}
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
                          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                        </div>
                      ) : generatedImageUrl ? (
                        <Image src={generatedImageUrl} alt="Generated stock pick" width={300} height={200} className="w-full h-auto rounded-lg" />
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

              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Send className="w-5 h-5 text-blue-600" />
                  Send as Broadcast
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
                    <Tabs defaultValue={platform} onValueChange={(value) => setPlatform(value as 'whatsapp' | 'sms')} className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="whatsapp" className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" /> WhatsApp
                        </TabsTrigger>
                        <TabsTrigger value="sms" className="flex items-center gap-2">
                          <Phone className="w-4 h-4" /> SMS
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
                    <Popover open={isRecipientPopoverOpen} onOpenChange={setIsRecipientPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-expanded={isRecipientPopoverOpen} className="w-full justify-between h-10">
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
                      <PopoverContent className="w-[300px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search recipients..." />
                          <CommandList>
                            <CommandEmpty>No recipients found.</CommandEmpty>
                            <CommandGroup heading="Groups">
                              {contactGroups.map((group) => (
                                <CommandItem
                                  key={group.id}
                                  onSelect={() => handleRecipientSelect({ ...group, type: 'group' })}
                                  className="cursor-pointer"
                                >
                                  <Check className={cn("mr-2 h-4 w-4", selectedRecipients.some(r => r.id === group.id) ? "opacity-100" : "opacity-0")} />
                                  <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                                  <div className="flex-1">{group.name}</div>
                                  <div className="text-xs text-muted-foreground">{group.contactCount} contacts</div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                            <CommandGroup heading="Contacts">
                              {contacts.map((contact) => (
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
                <div className="flex gap-4">
                  <Button onClick={() => handleSendCampaign(platform)} disabled={!canSend} className="w-full flex-1">
                    {isSending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send to {selectedRecipients.length} recipients
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button variant="outline" onClick={() => handleSaveAsDraft(false)} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save as Idea
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Dialog open={isFetchingStockData}>
        <DialogTrigger />
        <DialogPortal>
          <DialogTitle title='Loading' />
          <DialogContent className="[&>button]:hidden">
            <DialogDescription >
              <div className='flex items-center justify-center'>
                <div className='text-lg text-red-400 text-semibold'>Loading</div>
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            </DialogDescription>
          </DialogContent>
        </DialogPortal>
      </Dialog>

    </>
  );
}