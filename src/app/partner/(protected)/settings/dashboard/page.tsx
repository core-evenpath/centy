// src/app/partner/(protected)/settings/dashboard/page.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { getPartnerProfileAction } from '@/actions/get-partner-profile';
import { getBusinessPersonaAction, chatWithPersonaManagerAction } from '@/actions/business-persona-actions';
import BusinessPersonaBuilder from '@/components/partner/settings/BusinessPersonaBuilder';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertCircle,
  Building2,
  RefreshCw,
  Edit3,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Bot,
  Send,
  User,
  Phone,
  Mail,
  MapPin,
  Globe,
  Package,
  Loader2,
  HelpCircle,
  X,
  MessageCircle,
  Pencil,
  Plus,
  ChevronRight,
  Heart,
  Languages,
  CreditCard,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Partner } from '@/lib/types';
import type { SetupProgress, BusinessPersona } from '@/lib/business-persona-types';

// Message interface for chat
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Loading Skeleton
function LoadingSkeleton() {
  return (
    <div className="h-full flex flex-col bg-white">
      <div className="border-b border-slate-200 px-6 py-4">
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex-1 overflow-auto p-6 space-y-6 max-w-4xl mx-auto w-full">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  );
}

// Error State
function ErrorState({ message, partnerId, onRetry }: { message: string; partnerId?: string; onRetry: () => void }) {
  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Failed to Load</h3>
          <p className="text-slate-500 mb-4 max-w-sm text-sm">{message}</p>
          <Button onClick={onRetry} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}

// Section Card Component
function DataSection({
  title,
  icon: Icon,
  isComplete,
  onEdit,
  children,
  emptyMessage,
  isEmpty
}: {
  title: string;
  icon: any;
  isComplete?: boolean;
  onEdit: () => void;
  children: React.ReactNode;
  emptyMessage?: string;
  isEmpty?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center",
            isComplete ? "bg-green-50" : "bg-slate-50"
          )}>
            {isComplete ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <Icon className="w-5 h-5 text-slate-500" />
            )}
          </div>
          <h3 className="font-medium text-slate-900">{title}</h3>
        </div>
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </button>
      </div>
      <div className="px-5 py-4">
        {isEmpty ? (
          <p className="text-sm text-slate-400 italic">{emptyMessage || 'Not configured yet'}</p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

// Data Item Component
function DataItem({ label, value, icon: Icon }: { label: string; value?: string | null; icon?: any }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      {Icon && <Icon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />}
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm text-slate-700">{value}</p>
      </div>
    </div>
  );
}

// Floating AI Assistant
function AIAssistant({
  isOpen,
  onClose,
  partnerId,
  persona,
  onDataUpdate
}: {
  isOpen: boolean;
  onClose: () => void;
  partnerId: string;
  persona: BusinessPersona;
  onDataUpdate: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi! I can help you update your business data. Just tell me what you'd like to change.`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await chatWithPersonaManagerAction(partnerId, [...messages, userMsg], persona);
      if (result.success && result.response) {
        setMessages(prev => [...prev, { role: 'assistant', content: result.response! }]);
        if (result.dataUpdated) {
          onDataUpdate();
        }
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, something went wrong. Please try again." }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: "An error occurred." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-white">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <span className="font-medium text-sm">AI Assistant</span>
          <Badge className="bg-white/20 text-white border-0 text-[10px]">Centy</Badge>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex gap-2", m.role === 'user' ? "flex-row-reverse" : "")}>
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs",
                m.role === 'user' ? "bg-slate-200" : "bg-slate-900 text-white"
              )}>
                {m.role === 'user' ? <User className="w-3.5 h-3.5 text-slate-600" /> : <Sparkles className="w-3.5 h-3.5" />}
              </div>
              <div className={cn(
                "px-3 py-2 rounded-xl max-w-[80%] text-sm",
                m.role === 'user' ? "bg-slate-100 text-slate-900" : "bg-slate-900 text-white"
              )}>
                {m.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              </div>
              <div className="px-3 py-2 rounded-xl bg-slate-100 text-sm text-slate-500">Typing...</div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-slate-100">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask me to update anything..."
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
            className="text-sm"
          />
          <Button onClick={() => handleSend()} disabled={isLoading || !input.trim()} size="icon" className="bg-slate-900 hover:bg-slate-800">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Main Page Component
export default function SettingsDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [setupProgress, setSetupProgress] = useState<SetupProgress | null>(null);
  const [businessPersona, setBusinessPersona] = useState<BusinessPersona | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showManualEdit, setShowManualEdit] = useState(false);
  const [showAI, setShowAI] = useState(false);

  const partnerId = user?.customClaims?.partnerId;

  const fetchData = async (showLoading = true) => {
    if (!partnerId) {
      setError("Partner ID not found");
      setLoading(false);
      return;
    }

    if (showLoading) setLoading(true);
    setError(null);

    try {
      const [profileResult, personaResult] = await Promise.all([
        getPartnerProfileAction(partnerId),
        getBusinessPersonaAction(partnerId),
      ]);

      if (profileResult.success && profileResult.partner) {
        setPartner(profileResult.partner);
      } else {
        setError(profileResult.message || 'Failed to load profile');
      }

      if (personaResult.success) {
        setSetupProgress(personaResult.setupProgress || null);
        setBusinessPersona(personaResult.persona || null);
      }
    } catch (err: any) {
      setError('An unexpected error occurred.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) fetchData();
  }, [partnerId, authLoading]);

  if (authLoading || loading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} partnerId={partnerId} onRetry={fetchData} />;
  if (!partner) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No organization profile found.</p>
        </div>
      </div>
    );
  }

  // Manual Edit Mode
  if (showManualEdit) {
    return (
      <div className="h-full flex flex-col bg-slate-50">
        <div className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <button
              onClick={() => setShowManualEdit(false)}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            {setupProgress && (
              <Badge variant={setupProgress.overallPercentage >= 80 ? 'default' : 'secondary'} className={cn(setupProgress.overallPercentage >= 80 && 'bg-green-600')}>
                {setupProgress.overallPercentage}% Complete
              </Badge>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto">
            <BusinessPersonaBuilder
              partnerId={partnerId!}
              mode="settings"
              onComplete={() => { setShowManualEdit(false); fetchData(); }}
            />
          </div>
        </div>
      </div>
    );
  }

  const identity = businessPersona?.identity;
  const personality = businessPersona?.personality;
  const knowledge = businessPersona?.knowledge;
  const businessName = identity?.name || partner?.businessName || 'Your Business';
  const completeness = setupProgress?.overallPercentage || 0;

  // Format operating hours
  const getHoursDisplay = () => {
    if (identity?.operatingHours?.isOpen24x7) return 'Open 24/7';
    if (identity?.operatingHours?.appointmentOnly) return 'By Appointment Only';
    if (identity?.operatingHours?.onlineAlways) return 'Online 24/7';
    if (identity?.operatingHours?.schedule) return 'Custom Schedule';
    return null;
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <Link href="/partner/settings" className="text-slate-400 hover:text-slate-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Business Data</h1>
              <p className="text-sm text-slate-500">Information that powers your AI agents</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <div className={cn(
                "w-2 h-2 rounded-full",
                completeness >= 80 ? "bg-green-500" : completeness >= 40 ? "bg-amber-500" : "bg-slate-300"
              )} />
              <span className="text-slate-600">{completeness}% complete</span>
            </div>
            <button
              onClick={() => setShowManualEdit(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              Edit All
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-4">

          {/* Business Identity */}
          <DataSection
            title="Business Identity"
            icon={Building2}
            isComplete={setupProgress?.basicInfo}
            onEdit={() => setShowManualEdit(true)}
            isEmpty={!identity?.name && !identity?.industry?.name && !personality?.description}
            emptyMessage="Add your business name, industry, and description"
          >
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-slate-900">{businessName}</h2>
              {identity?.industry?.name && (
                <p className="text-sm text-slate-500 flex items-center gap-1.5">
                  {identity.industry.icon && <span>{identity.industry.icon}</span>}
                  {identity.industry.name}
                </p>
              )}
              {personality?.description && (
                <p className="text-sm text-slate-600 mt-3 leading-relaxed">{personality.description}</p>
              )}
              {personality?.tagline && (
                <p className="text-sm text-slate-500 italic mt-2">"{personality.tagline}"</p>
              )}
            </div>
          </DataSection>

          {/* Contact Information */}
          <DataSection
            title="Contact Information"
            icon={Phone}
            isComplete={setupProgress?.contactInfo}
            onEdit={() => setShowManualEdit(true)}
            isEmpty={!identity?.phone && !identity?.email && !identity?.website && !identity?.address?.city}
            emptyMessage="Add phone, email, website, and address"
          >
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1">
              <DataItem label="Phone" value={identity?.phone} icon={Phone} />
              <DataItem label="WhatsApp" value={identity?.whatsapp} icon={MessageCircle} />
              <DataItem label="Email" value={identity?.email} icon={Mail} />
              <DataItem label="Website" value={identity?.website} icon={Globe} />
              {identity?.address && (
                <DataItem
                  label="Location"
                  value={[identity.address.city, identity.address.state].filter(Boolean).join(', ')}
                  icon={MapPin}
                />
              )}
            </div>
          </DataSection>

          {/* Operating Hours */}
          <DataSection
            title="Operating Hours"
            icon={Clock}
            isComplete={setupProgress?.operatingHours}
            onEdit={() => setShowManualEdit(true)}
            isEmpty={!getHoursDisplay()}
            emptyMessage="Set your business hours"
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium",
                identity?.operatingHours?.isOpen24x7 ? "bg-green-100 text-green-700" :
                identity?.operatingHours?.appointmentOnly ? "bg-purple-100 text-purple-700" :
                "bg-blue-100 text-blue-700"
              )}>
                {getHoursDisplay()}
              </div>
              {identity?.operatingHours?.specialNote && (
                <span className="text-sm text-slate-500">{identity.operatingHours.specialNote}</span>
              )}
            </div>
          </DataSection>

          {/* Brand Voice */}
          <DataSection
            title="Brand Voice & Style"
            icon={Heart}
            isComplete={setupProgress?.brandPersonality}
            onEdit={() => setShowManualEdit(true)}
            isEmpty={!personality?.voiceTone?.length && !personality?.uniqueSellingPoints?.length}
            emptyMessage="Define your brand's tone and unique selling points"
          >
            <div className="space-y-4">
              {personality?.voiceTone && personality.voiceTone.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 mb-2">Voice Tone</p>
                  <div className="flex flex-wrap gap-2">
                    {personality.voiceTone.map(tone => (
                      <span key={tone} className="px-3 py-1 bg-slate-100 rounded-full text-sm text-slate-700 capitalize">
                        {tone}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {personality?.uniqueSellingPoints && personality.uniqueSellingPoints.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 mb-2">Unique Selling Points</p>
                  <div className="flex flex-wrap gap-2">
                    {personality.uniqueSellingPoints.map((usp, i) => (
                      <span key={i} className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm">
                        {usp}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {personality?.languagePreference && personality.languagePreference.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 mb-2">Languages</p>
                  <p className="text-sm text-slate-700">{personality.languagePreference.join(', ')}</p>
                </div>
              )}
            </div>
          </DataSection>

          {/* Products & Services */}
          <DataSection
            title="Products & Services"
            icon={Package}
            isComplete={setupProgress?.productsServices}
            onEdit={() => setShowManualEdit(true)}
            isEmpty={!knowledge?.productsOrServices?.length}
            emptyMessage="Add your products or services"
          >
            <div className="space-y-3">
              {knowledge?.productsOrServices?.slice(0, 5).map(product => (
                <div key={product.id} className="flex items-start justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{product.name}</p>
                    {product.description && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{product.description}</p>
                    )}
                  </div>
                  {product.priceRange && (
                    <span className="text-sm text-slate-600 font-medium">{product.priceRange}</span>
                  )}
                </div>
              ))}
              {knowledge?.productsOrServices && knowledge.productsOrServices.length > 5 && (
                <p className="text-xs text-slate-400">+{knowledge.productsOrServices.length - 5} more products</p>
              )}
            </div>
          </DataSection>

          {/* FAQs */}
          <DataSection
            title="Frequently Asked Questions"
            icon={HelpCircle}
            isComplete={setupProgress?.faqs}
            onEdit={() => setShowManualEdit(true)}
            isEmpty={!knowledge?.faqs?.length}
            emptyMessage="Add FAQs to help your AI answer common questions"
          >
            <div className="space-y-3">
              {knowledge?.faqs?.slice(0, 4).map(faq => (
                <div key={faq.id} className="py-2 border-b border-slate-100 last:border-0">
                  <p className="text-sm font-medium text-slate-900">{faq.question}</p>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{faq.answer}</p>
                </div>
              ))}
              {knowledge?.faqs && knowledge.faqs.length > 4 && (
                <p className="text-xs text-slate-400">+{knowledge.faqs.length - 4} more FAQs</p>
              )}
            </div>
          </DataSection>

          {/* Payment Methods */}
          {knowledge?.acceptedPayments && knowledge.acceptedPayments.length > 0 && (
            <DataSection
              title="Accepted Payments"
              icon={CreditCard}
              isComplete={true}
              onEdit={() => setShowManualEdit(true)}
            >
              <div className="flex flex-wrap gap-2">
                {knowledge.acceptedPayments.map(payment => (
                  <span key={payment} className="px-3 py-1 bg-slate-100 rounded-full text-sm text-slate-700">
                    {payment}
                  </span>
                ))}
              </div>
            </DataSection>
          )}

          {/* Policies */}
          {knowledge?.policies && knowledge.policies.length > 0 && (
            <DataSection
              title="Business Policies"
              icon={FileText}
              isComplete={true}
              onEdit={() => setShowManualEdit(true)}
            >
              <div className="space-y-2">
                {knowledge.policies.slice(0, 3).map(policy => (
                  <div key={policy.id} className="py-2 border-b border-slate-100 last:border-0">
                    <p className="text-sm font-medium text-slate-900 capitalize">{policy.type.replace('_', ' ')}</p>
                    <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{policy.content}</p>
                  </div>
                ))}
              </div>
            </DataSection>
          )}

        </div>
      </div>

      {/* AI Assistant Button */}
      <button
        onClick={() => setShowAI(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-slate-900 text-white rounded-full shadow-lg hover:bg-slate-800 transition-all hover:scale-105 flex items-center justify-center z-40"
      >
        <Bot className="w-6 h-6" />
      </button>

      {/* AI Assistant Panel */}
      {businessPersona && (
        <AIAssistant
          isOpen={showAI}
          onClose={() => setShowAI(false)}
          partnerId={partnerId!}
          persona={businessPersona}
          onDataUpdate={() => fetchData(false)}
        />
      )}
    </div>
  );
}
