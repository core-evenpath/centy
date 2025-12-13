// src/app/partner/(protected)/settings/page.tsx
"use client";

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Building2,
  Users,
  Shield,
  Mail,
  Calendar,
  ChevronRight,
  ChevronDown,
  UserCircle,
  Clock,
  Bot,
  Sparkles,
  ArrowRight,
  Phone,
  MapPin,
  Package,
  HelpCircle,
  Heart,
  CreditCard,
  FileText,
  Globe,
  MessageCircle,
  Pencil,
  CheckCircle2,
  Send,
  User,
  Loader2,
  X,
  Settings,
  Briefcase,
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getPartnerProfileAction } from '@/actions/get-partner-profile';
import { getBusinessPersonaAction, chatWithPersonaManagerAction } from '@/actions/business-persona-actions';
import BusinessPersonaBuilder from '@/components/partner/settings/BusinessPersonaBuilder';
import { cn } from '@/lib/utils';
import type { Partner } from '@/lib/types';
import type { BusinessPersona, SetupProgress } from '@/lib/business-persona-types';

// Message interface for chat
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  );
}

// Data Section Component
function DataSection({
  title,
  icon: Icon,
  isComplete,
  onEdit,
  children,
  emptyMessage,
  isEmpty,
  defaultOpen = true
}: {
  title: string;
  icon: any;
  isComplete?: boolean;
  onEdit: () => void;
  children: React.ReactNode;
  emptyMessage?: string;
  isEmpty?: boolean;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center",
            isComplete ? "bg-green-50" : "bg-slate-100"
          )}>
            {isComplete ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <Icon className="w-5 h-5 text-slate-500" />
            )}
          </div>
          <span className="font-medium text-slate-900">{title}</span>
          {isEmpty && <Badge variant="outline" className="text-xs text-amber-600 border-amber-200 bg-amber-50">Needs data</Badge>}
        </div>
        <div className="flex items-center gap-2">
          <span
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </span>
          <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform", isOpen && "rotate-180")} />
        </div>
      </button>
      {isOpen && (
        <div className="px-5 pb-5 pt-2 border-t border-slate-100">
          {isEmpty ? (
            <p className="text-sm text-slate-400 py-2">{emptyMessage || 'No data added yet'}</p>
          ) : (
            children
          )}
        </div>
      )}
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

// AI Assistant Panel
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
  persona: BusinessPersona | null;
  onDataUpdate: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi! I'm Centy, your AI assistant. I can help you update any of your business data - just tell me what you'd like to change!\n\nFor example:\n• "Update my business name to..."\n• "Add a new product called..."\n• "Set my hours to 9am-6pm"`
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
    if (!text.trim() || isLoading || !persona) return;

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
    <div className="fixed bottom-6 right-6 w-[380px] h-[520px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="font-medium text-sm">Centy AI Assistant</div>
            <div className="text-xs text-slate-300">Update your business data</div>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex gap-2", m.role === 'user' ? "flex-row-reverse" : "")}>
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                m.role === 'user' ? "bg-slate-200" : "bg-gradient-to-br from-slate-800 to-slate-900 text-white"
              )}>
                {m.role === 'user' ? <User className="w-3.5 h-3.5 text-slate-600" /> : <Sparkles className="w-3.5 h-3.5" />}
              </div>
              <div className={cn(
                "px-3 py-2 rounded-2xl max-w-[85%] text-sm whitespace-pre-wrap",
                m.role === 'user'
                  ? "bg-slate-900 text-white rounded-tr-md"
                  : "bg-slate-100 text-slate-800 rounded-tl-md"
              )}>
                {m.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              </div>
              <div className="px-3 py-2 rounded-2xl rounded-tl-md bg-slate-100 text-sm text-slate-500">
                Thinking...
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Quick Actions */}
      {messages.length < 3 && (
        <div className="px-3 pb-2">
          <div className="flex flex-wrap gap-1.5">
            {["Update business hours", "Add a product", "Change contact info"].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSend(suggestion)}
                className="text-xs px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-slate-100 bg-slate-50">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Tell me what to update..."
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            disabled={isLoading}
            className="text-sm bg-white"
          />
          <Button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            size="icon"
            className="bg-slate-900 hover:bg-slate-800 shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [teamCount, setTeamCount] = useState<number>(0);
  const [adminCount, setAdminCount] = useState<number>(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [businessPersona, setBusinessPersona] = useState<BusinessPersona | null>(null);
  const [setupProgress, setSetupProgress] = useState<SetupProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [showManualEdit, setShowManualEdit] = useState(false);
  const [showAI, setShowAI] = useState(false);

  const partnerId = user?.customClaims?.partnerId;
  const userRole = user?.customClaims?.role;

  const fetchData = async (showLoading = true) => {
    if (!partnerId) {
      setLoading(false);
      return;
    }

    if (showLoading) setLoading(true);

    try {
      const [profileResult, personaResult] = await Promise.all([
        getPartnerProfileAction(partnerId),
        getBusinessPersonaAction(partnerId),
      ]);

      if (profileResult.success && profileResult.partner) {
        setPartner(profileResult.partner);
      }

      if (personaResult.success) {
        setBusinessPersona(personaResult.persona || null);
        setSetupProgress(personaResult.setupProgress || null);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    async function fetchTeamStats() {
      if (!partnerId || !db) {
        setLoadingStats(false);
        return;
      }

      try {
        const teamMembersRef = collection(db, "teamMembers");
        const q = query(teamMembersRef, where("partnerId", "==", partnerId));
        const snapshot = await getDocs(q);

        let employees = 0;
        let admins = 0;

        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.role === 'partner_admin') admins++;
          else if (data.role === 'employee') employees++;
        });

        setTeamCount(employees);
        setAdminCount(admins);
      } catch (error) {
        console.error('Error fetching team stats:', error);
      } finally {
        setLoadingStats(false);
      }
    }

    if (!authLoading && partnerId) {
      fetchData();
      fetchTeamStats();
    } else if (!authLoading) {
      setLoading(false);
      setLoadingStats(false);
    }
  }, [partnerId, authLoading]);

  if (authLoading || loading) {
    return <LoadingSkeleton />;
  }

  if (!partnerId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center p-8">
          <UserCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Not Logged In</h3>
          <p className="text-slate-500 mb-4">Please log in to access settings.</p>
          <Link href="/partner/login" className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800">
            Sign In <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Manual Edit Mode
  if (showManualEdit) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button
              onClick={() => { setShowManualEdit(false); fetchData(); }}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors text-sm"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              Back to Settings
            </button>
            {setupProgress && (
              <Badge variant={setupProgress.overallPercentage >= 80 ? 'default' : 'secondary'} className={cn(setupProgress.overallPercentage >= 80 && 'bg-green-600')}>
                {setupProgress.overallPercentage}% Complete
              </Badge>
            )}
          </div>
        </div>
        <div className="max-w-4xl mx-auto p-6">
          <BusinessPersonaBuilder
            partnerId={partnerId!}
            mode="settings"
            onComplete={() => { setShowManualEdit(false); fetchData(); }}
          />
        </div>
      </div>
    );
  }

  const identity = businessPersona?.identity;
  const personality = businessPersona?.personality;
  const knowledge = businessPersona?.knowledge;
  const businessName = identity?.name || partner?.businessName || 'Your Business';
  const completeness = setupProgress?.overallPercentage || 0;

  const getHoursDisplay = () => {
    if (identity?.operatingHours?.isOpen24x7) return 'Open 24/7';
    if (identity?.operatingHours?.appointmentOnly) return 'By Appointment';
    if (identity?.operatingHours?.onlineAlways) return 'Online 24/7';
    if (identity?.operatingHours?.schedule) return 'Custom Hours';
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">Settings</h1>
                <p className="text-sm text-slate-500">Manage your business & workspace</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  completeness >= 80 ? "bg-green-500" : completeness >= 40 ? "bg-amber-500" : "bg-slate-300"
                )} />
                <span className="text-sm text-slate-600">{completeness}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">

        {/* Business Hero Card */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center text-2xl font-bold">
                {businessName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-semibold">{businessName}</h2>
                {identity?.industry?.name && (
                  <p className="text-slate-300 text-sm flex items-center gap-1.5 mt-0.5">
                    {identity.industry.icon && <span>{identity.industry.icon}</span>}
                    {identity.industry.name}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-3">
                  {identity?.phone && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {identity.phone}
                    </span>
                  )}
                  {identity?.email && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {identity.email}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowManualEdit(true)}
              className="px-4 py-2 bg-white text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors flex items-center gap-2"
            >
              <Pencil className="w-4 h-4" />
              Edit All
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
            <div>
              <p className="text-2xl font-semibold">{knowledge?.productsOrServices?.length || 0}</p>
              <p className="text-xs text-slate-400">Products</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">{knowledge?.faqs?.length || 0}</p>
              <p className="text-xs text-slate-400">FAQs</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">{teamCount + adminCount}</p>
              <p className="text-xs text-slate-400">Team</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">{completeness}%</p>
              <p className="text-xs text-slate-400">Complete</p>
            </div>
          </div>
        </div>

        {/* Business Data Section Label */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide">Business Data</h3>
          <p className="text-xs text-slate-400">This data powers your AI agents</p>
        </div>

        {/* Business Identity */}
        <DataSection
          title="Business Identity"
          icon={Building2}
          isComplete={setupProgress?.basicInfo}
          onEdit={() => setShowManualEdit(true)}
          isEmpty={!identity?.name && !personality?.description}
          emptyMessage="Add your business name, industry, and description"
        >
          <div className="space-y-2">
            {personality?.description && (
              <p className="text-sm text-slate-600 leading-relaxed">{personality.description}</p>
            )}
            {personality?.tagline && (
              <p className="text-sm text-slate-500 italic">"{personality.tagline}"</p>
            )}
          </div>
        </DataSection>

        {/* Contact Information */}
        <DataSection
          title="Contact & Location"
          icon={Phone}
          isComplete={setupProgress?.contactInfo}
          onEdit={() => setShowManualEdit(true)}
          isEmpty={!identity?.phone && !identity?.email && !identity?.website}
          emptyMessage="Add your contact details and location"
        >
          <div className="grid sm:grid-cols-2 gap-x-8">
            <DataItem label="Phone" value={identity?.phone} icon={Phone} />
            <DataItem label="WhatsApp" value={identity?.whatsapp} icon={MessageCircle} />
            <DataItem label="Email" value={identity?.email} icon={Mail} />
            <DataItem label="Website" value={identity?.website} icon={Globe} />
            {identity?.address?.city && (
              <DataItem label="Location" value={[identity.address.city, identity.address.state].filter(Boolean).join(', ')} icon={MapPin} />
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
          emptyMessage="Set when your business is available"
        >
          <div className="flex items-center gap-3">
            <span className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium",
              identity?.operatingHours?.isOpen24x7 ? "bg-green-100 text-green-700" :
              identity?.operatingHours?.appointmentOnly ? "bg-purple-100 text-purple-700" :
              "bg-blue-100 text-blue-700"
            )}>
              {getHoursDisplay()}
            </span>
            {identity?.operatingHours?.specialNote && (
              <span className="text-sm text-slate-500">{identity.operatingHours.specialNote}</span>
            )}
          </div>
        </DataSection>

        {/* Brand Voice */}
        <DataSection
          title="Brand Voice"
          icon={Heart}
          isComplete={setupProgress?.brandPersonality}
          onEdit={() => setShowManualEdit(true)}
          isEmpty={!personality?.voiceTone?.length}
          emptyMessage="Define how your brand communicates"
        >
          <div className="space-y-4">
            {personality?.voiceTone && personality.voiceTone.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {personality.voiceTone.map(tone => (
                  <span key={tone} className="px-3 py-1 bg-slate-100 rounded-full text-sm text-slate-700 capitalize">{tone}</span>
                ))}
              </div>
            )}
            {personality?.uniqueSellingPoints && personality.uniqueSellingPoints.length > 0 && (
              <div>
                <p className="text-xs text-slate-400 mb-2">Unique Selling Points</p>
                <div className="flex flex-wrap gap-2">
                  {personality.uniqueSellingPoints.map((usp, i) => (
                    <span key={i} className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-sm">{usp}</span>
                  ))}
                </div>
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
          <div className="space-y-2">
            {knowledge?.productsOrServices?.slice(0, 5).map(product => (
              <div key={product.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-slate-900">{product.name}</p>
                  {product.description && <p className="text-xs text-slate-500 line-clamp-1">{product.description}</p>}
                </div>
                {product.priceRange && <span className="text-sm text-slate-600">{product.priceRange}</span>}
              </div>
            ))}
            {knowledge?.productsOrServices && knowledge.productsOrServices.length > 5 && (
              <p className="text-xs text-slate-400 pt-2">+{knowledge.productsOrServices.length - 5} more</p>
            )}
          </div>
        </DataSection>

        {/* FAQs */}
        <DataSection
          title="FAQs"
          icon={HelpCircle}
          isComplete={setupProgress?.faqs}
          onEdit={() => setShowManualEdit(true)}
          isEmpty={!knowledge?.faqs?.length}
          emptyMessage="Add FAQs to help your AI answer common questions"
        >
          <div className="space-y-3">
            {knowledge?.faqs?.slice(0, 3).map(faq => (
              <div key={faq.id} className="py-2 border-b border-slate-100 last:border-0">
                <p className="text-sm font-medium text-slate-900">{faq.question}</p>
                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{faq.answer}</p>
              </div>
            ))}
            {knowledge?.faqs && knowledge.faqs.length > 3 && (
              <p className="text-xs text-slate-400">+{knowledge.faqs.length - 3} more FAQs</p>
            )}
          </div>
        </DataSection>

        {/* Payment & Policies (collapsed by default) */}
        {(knowledge?.acceptedPayments?.length || knowledge?.policies?.length) && (
          <>
            {knowledge?.acceptedPayments && knowledge.acceptedPayments.length > 0 && (
              <DataSection
                title="Payment Methods"
                icon={CreditCard}
                isComplete={true}
                onEdit={() => setShowManualEdit(true)}
                defaultOpen={false}
              >
                <div className="flex flex-wrap gap-2">
                  {knowledge.acceptedPayments.map(p => (
                    <span key={p} className="px-3 py-1 bg-slate-100 rounded-full text-sm text-slate-700">{p}</span>
                  ))}
                </div>
              </DataSection>
            )}
            {knowledge?.policies && knowledge.policies.length > 0 && (
              <DataSection
                title="Business Policies"
                icon={FileText}
                isComplete={true}
                onEdit={() => setShowManualEdit(true)}
                defaultOpen={false}
              >
                <div className="space-y-2">
                  {knowledge.policies.map(policy => (
                    <div key={policy.id} className="py-2 border-b border-slate-100 last:border-0">
                      <p className="text-sm font-medium text-slate-900 capitalize">{policy.type.replace('_', ' ')}</p>
                      <p className="text-sm text-slate-500 line-clamp-2">{policy.content}</p>
                    </div>
                  ))}
                </div>
              </DataSection>
            )}
          </>
        )}

        {/* Workspace Section */}
        <div className="pt-6">
          <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-4">Workspace</h3>

          {/* Account Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 border-2 border-slate-100">
                <AvatarImage src={user?.photoURL || undefined} />
                <AvatarFallback className="bg-slate-100 text-slate-600 font-semibold">
                  {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium text-slate-900">{user?.displayName || user?.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={userRole === 'partner_admin' ? 'default' : 'secondary'} className="text-xs">
                    {userRole === 'partner_admin' ? 'Admin' : 'Member'}
                  </Badge>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-500">{user?.email}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Team Links */}
          <div className="grid sm:grid-cols-2 gap-3">
            <Link href="/partner/settings/employees" className="group bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 hover:shadow-sm transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">Team Members</p>
                  <p className="text-xs text-slate-500">{loadingStats ? '...' : teamCount} members</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-400" />
              </div>
            </Link>
            <Link href="/partner/settings/admins" className="group bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 hover:shadow-sm transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                  <Shield className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">Administrators</p>
                  <p className="text-xs text-slate-500">{loadingStats ? '...' : adminCount} admins</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-400" />
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Floating AI Button */}
      <button
        onClick={() => setShowAI(true)}
        className={cn(
          "fixed bottom-6 right-6 h-14 bg-slate-900 text-white rounded-full shadow-lg hover:bg-slate-800 transition-all hover:scale-105 flex items-center gap-3 z-40",
          showAI ? "hidden" : "px-5"
        )}
      >
        <Bot className="w-5 h-5" />
        <span className="text-sm font-medium">Ask Centy to update</span>
      </button>

      {/* AI Assistant Panel */}
      <AIAssistant
        isOpen={showAI}
        onClose={() => setShowAI(false)}
        partnerId={partnerId!}
        persona={businessPersona}
        onDataUpdate={() => fetchData(false)}
      />
    </div>
  );
}
