
"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowRight, Send, Sparkles, Upload, FileText, MessageSquare, Brain, Plus, Check, ChevronDown, ChevronUp, AlertCircle, Info, Users, Lock, Database, TrendingUp, Calendar, Save, Loader2, Phone, User, X, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { useToast } from '@/hooks/use-toast';
import { getStockData } from '@/ai/flows/get-stock-data-flow';
import { generateStockPickImage } from '@/ai/flows/generate-stock-pick-image-flow';
import type { StockDataOutput } from '@/ai/flows/get-stock-data-flow';
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
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

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
  const router = useRouter();
  const { currentWorkspace, user } = useMultiWorkspaceAuth();
  const { toast } = useToast();
  const [expandedSection, setExpandedSection] = useState<number>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(initialData?.imageUrl || null);
  const [ideaId, setIdeaId] = useState<string | undefined>(initialData?.id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New state for confirmation modal
  const [showDataModal, setShowDataModal] = useState(false);
  const [fetchedStockData, setFetchedStockData] = useState<StockDataOutput | null>(null);
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

  const [aiSuggestions, setAiSuggestions] = useState<AIsuggestions>({ thesis: [], risks: [] });
  const [selectedSuggestions, setSelectedSuggestions] = useState<{ thesis: number[], risks: number[] }>({ thesis: [], risks: [] });

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
        const stockData = await getStockData({ ticker });
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
        companyName: fetchedStockData.companyName,
        sector: fetchedStockData.sector,
        currentPrice: fetchedStockData.currentPrice,
      }));
      setAiSuggestions({
        thesis: fetchedStockData.investmentThesis,
        risks: fetchedStockData.keyRisks,
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
    switch(step) {
      case 1: return !!(formData.ticker && formData.companyName && formData.sector);
      case 2: return trainingData.source !== null && (
        (trainingData.source === 'mission-control' && trainingData.missionControlSelection.length > 0) ||
        (trainingData.source === 'upload' && trainingData.uploadedFiles.length > 0)
      );
      case 3: return !!formData.action && (formData.thesis.length > 0 || selectedSuggestions.thesis.length > 0);
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
                    <strong>Quick tip:</strong> Just enter a ticker symbol. AI will fetch the latest data for you to confirm.
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Stock Ticker * <span className="text-gray-500 font-normal">(e.g., NVDA, AAPL, TSLA)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.ticker}
                        onChange={(e) => updateField('ticker', e.target.value)}
                        placeholder="Enter ticker symbol"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                      {isFetchingStockData && <Loader2 className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 animate-spin" />}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => updateField('companyName', e.target.value)}
                      placeholder="e.g., NVIDIA Corporation"
                      className="w-full px-4 py-3 border-2 border-gray-300 bg-gray-50 rounded-xl transition-all"
                      readOnly
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Sector / Industry *
                    </label>
                    <input
                      type="text"
                      value={formData.sector}
                      onChange={(e) => updateField('sector', e.target.value)}
                      placeholder="e.g., Technology, Clean Energy"
                      className="w-full px-4 py-3 border-2 border-gray-300 bg-gray-50 rounded-xl transition-all"
                      readOnly
                    />
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
              className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-t-2xl disabled:cursor-not-allowed disabled:hover:bg-white"
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
                {/* Content for Section 2 */}
              </div>
            )}
          </div>
          
          {/* Section 3: Investment Thesis */}
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
              className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-t-2xl disabled:cursor-not-allowed disabled:hover:bg-white"
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
                {/* Content for Section 3 */}
              </div>
            )}
          </div>
          
          {/* Section 4: Price Target & Timeline */}
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
              className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-t-2xl disabled:cursor-not-allowed disabled:hover:bg-white"
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
                {/* Content for Section 4 */}
              </div>
            )}
          </div>
          
          {/* Section 5: Risks & Catalysts */}
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
              className="w-full px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition-colors rounded-t-2xl disabled:cursor-not-allowed disabled:hover:bg-white"
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
                {/* Content for Section 5 */}
              </div>
            )}
          </div>
        </div>

        {/* Section 6: Review & Send */}
        {allStepsComplete && (
          <div className="mt-8 space-y-6">
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Mobile Preview
                  </label>
                  <div className="relative mx-auto border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl">
                    <div className="w-[148px] h-[18px] bg-gray-800 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute"></div>
                    <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[124px] rounded-s-lg"></div>
                    <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[178px] rounded-s-lg"></div>
                    <div className="h-[64px] w-[3px] bg-gray-800 absolute -end-[17px] top-[142px] rounded-e-lg"></div>
                    <div className="rounded-[2rem] overflow-hidden w-full h-full bg-white">
                      <div className="p-4 space-y-4 overflow-y-auto h-full">
                        <Button 
                          onClick={handleGenerateImage} 
                          disabled={isGeneratingImage || !formData.ticker}
                          className="w-full"
                          variant="outline"
                          size="sm"
                        >
                          {isGeneratingImage ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <ImageIcon className="w-4 h-4 mr-2" />}
                          {isGeneratingImage ? 'Generating Image...' : generatedImageUrl ? 'Re-generate Image' : 'Generate Card Image'}
                        </Button>
                        
                        {isGeneratingImage ? (
                          <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-400"/>
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
                  {/* Broadcast form components would go here */}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog open={showDataModal} onOpenChange={setShowDataModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI-Fetched Stock Data</DialogTitle>
            <DialogDescription>
              We've fetched the following data for {formData.ticker}. Review and embed it into your form.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p><strong>Company:</strong> {fetchedStockData?.companyName}</p>
            <p><strong>Sector:</strong> {fetchedStockData?.sector}</p>
            <p><strong>Current Price:</strong> {fetchedStockData?.currentPrice}</p>
            <div>
              <strong>AI Thesis:</strong>
              <ul className="list-disc pl-5 mt-1 space-y-1 text-sm">
                {fetchedStockData?.investmentThesis.map((item, index) => <li key={index}>{item}</li>)}
              </ul>
            </div>
             <div>
              <strong>Key Risks:</strong>
              <ul className="list-disc pl-5 mt-1 space-y-1 text-sm">
                {fetchedStockData?.keyRisks.map((item, index) => <li key={index}>{item}</li>)}
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDataModal(false)}>Cancel</Button>
            <Button onClick={embedFetchedData}>Embed Data</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

    