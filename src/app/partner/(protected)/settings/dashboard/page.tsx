// src/app/partner/(protected)/settings/dashboard/page.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getPartnerProfileAction } from '@/actions/get-partner-profile';
import { getBusinessPersonaAction, chatWithPersonaManagerAction } from '@/actions/business-persona-actions';
import BusinessPersonaBuilder from '@/components/partner/settings/BusinessPersonaBuilder';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  Building2,
  RefreshCw,
  Edit,
  Sparkles,
  CheckCircle,
  Clock,
  ArrowRight,
  Bot,
  Send,
  User,
  Phone,
  Mail,
  MapPin,
  Globe,
  Package,
  Loader2,
  Lightbulb,
  HelpCircle,
  ChevronRight,
  Database,
  ArrowLeft,
} from 'lucide-react';
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
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-slate-200 animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-5 w-48 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-64 bg-slate-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
      <div className="h-[500px] bg-slate-200 rounded-lg animate-pulse" />
    </div>
  );
}

// Error State
function ErrorState({ message, partnerId, onRetry }: { message: string; partnerId?: string; onRetry: () => void }) {
  return (
    <div className="bg-white rounded-lg border border-red-200 p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-6 h-6 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">Failed to Load</h3>
      <p className="text-sm text-slate-500 mb-4">{message}</p>
      {partnerId && (
        <p className="text-xs text-slate-400 mb-4 font-mono">Partner ID: {partnerId}</p>
      )}
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Try Again
      </button>
    </div>
  );
}

// Quick Action Card Component
function QuickActionCard({
  icon: Icon,
  title,
  description,
  isComplete,
  onClick,
}: {
  icon: any;
  title: string;
  description: string;
  isComplete?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-4 rounded-lg border text-left transition-all group",
        isComplete
          ? "bg-emerald-50 border-emerald-200"
          : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
          isComplete ? "bg-emerald-100" : "bg-slate-100 group-hover:bg-slate-200"
        )}>
          {isComplete ? (
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          ) : (
            <Icon className="w-5 h-5 text-slate-600" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium text-sm text-slate-900 flex items-center gap-2">
            {title}
            <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
          </div>
          <div className="text-xs text-slate-500 mt-0.5">{description}</div>
        </div>
      </div>
    </button>
  );
}

// Profile Summary Sidebar
function ProfileSidebar({ persona, progress }: { persona: BusinessPersona | null; progress: SetupProgress | null }) {
  if (!persona) return null;

  const identity = persona.identity;
  const personality = persona.personality;
  const knowledge = persona.knowledge;

  return (
    <div className="bg-white rounded-lg border border-slate-200 h-full overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-slate-900 flex items-center gap-2 text-sm">
            <Database className="w-4 h-4 text-slate-500" />
            Data Summary
          </h3>
          {progress && (
            <span className={cn(
              "text-xs px-2 py-0.5 rounded font-medium",
              progress.overallPercentage >= 80
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-600"
            )}>
              {progress.overallPercentage}%
            </span>
          )}
        </div>
        {progress && (
          <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                progress.overallPercentage >= 80 ? "bg-emerald-500" : "bg-slate-400"
              )}
              style={{ width: `${progress.overallPercentage}%` }}
            />
          </div>
        )}
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Business Name & Industry */}
        <div>
          <h4 className="font-semibold text-slate-900">{identity?.name || 'Your Business'}</h4>
          {identity?.industry?.name && (
            <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
              <span>{identity.industry.icon}</span>
              {identity.industry.name}
            </p>
          )}
        </div>

        {/* Description */}
        {personality?.description && (
          <p className="text-sm text-slate-600 line-clamp-3">{personality.description}</p>
        )}

        <hr className="border-slate-100" />

        {/* Contact Info */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Contact</p>
          {identity?.phone && (
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{identity.phone}</span>
            </div>
          )}
          {identity?.email && (
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate">{identity.email}</span>
            </div>
          )}
          {identity?.website && (
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate">{identity.website}</span>
            </div>
          )}
          {identity?.address?.city && (
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{identity.address.city}{identity.address.state ? `, ${identity.address.state}` : ''}</span>
            </div>
          )}
          {!identity?.phone && !identity?.email && !identity?.website && !identity?.address?.city && (
            <p className="text-xs text-slate-400 italic">No contact info added</p>
          )}
        </div>

        <hr className="border-slate-100" />

        {/* Operating Hours */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Hours</p>
          {identity?.operatingHours?.isOpen24x7 ? (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-600 font-medium">Open 24/7</span>
            </div>
          ) : identity?.operatingHours?.appointmentOnly ? (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-600 font-medium">By Appointment</span>
            </div>
          ) : identity?.operatingHours?.onlineAlways ? (
            <div className="flex items-center gap-2 text-sm">
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-slate-600 font-medium">Online 24/7</span>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">Hours not set</p>
          )}
        </div>

        <hr className="border-slate-100" />

        {/* Brand Voice */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Brand Voice</p>
          {personality?.voiceTone && personality.voiceTone.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {personality.voiceTone.map(tone => (
                <span key={tone} className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 capitalize">
                  {tone}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No voice tone set</p>
          )}
        </div>

        {/* Products/Services */}
        {knowledge?.productsOrServices && knowledge.productsOrServices.length > 0 && (
          <>
            <hr className="border-slate-100" />
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Products & Services ({knowledge.productsOrServices.length})
              </p>
              <div className="space-y-1">
                {knowledge.productsOrServices.slice(0, 3).map(product => (
                  <div key={product.id} className="text-sm flex items-center gap-2 text-slate-700">
                    <Package className="w-3 h-3 text-slate-400" />
                    <span className="truncate">{product.name}</span>
                  </div>
                ))}
                {knowledge.productsOrServices.length > 3 && (
                  <p className="text-xs text-slate-400">+{knowledge.productsOrServices.length - 3} more</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* FAQs */}
        {knowledge?.faqs && knowledge.faqs.length > 0 && (
          <>
            <hr className="border-slate-100" />
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                FAQs ({knowledge.faqs.length})
              </p>
              <div className="space-y-1">
                {knowledge.faqs.slice(0, 2).map(faq => (
                  <div key={faq.id} className="text-xs text-slate-500">
                    <HelpCircle className="w-3 h-3 inline mr-1 text-slate-400" />
                    {faq.question.length > 40 ? faq.question.slice(0, 40) + '...' : faq.question}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// AI Manager Chat Interface - Professional Design
function AIManagerChat({
  partnerId,
  persona,
  onDataUpdate
}: {
  partnerId: string;
  persona: BusinessPersona;
  onDataUpdate: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello! I'm your Business Data Assistant. I help you manage the data that powers your AI agents.\n\nI can help you:\n- Update business details, contact info, and hours\n- Add products, services, and FAQs\n- Configure your brand voice and communication style\n\nThe more complete your business data, the better your AI agents can serve your customers!`
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
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "I'm sorry, I encountered an error. Please try again."
        }]);
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'assistant', content: "An unexpected error occurred." }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Suggestion prompts
  const suggestions = [
    { icon: Building2, text: "Update business name", prompt: "I want to update my business name" },
    { icon: Phone, text: "Add contact details", prompt: "Help me add my contact information" },
    { icon: Clock, text: "Set operating hours", prompt: "I want to set my operating hours" },
    { icon: Package, text: "Add a product/service", prompt: "I want to add a new product or service" },
    { icon: HelpCircle, text: "Add an FAQ", prompt: "Help me add a frequently asked question" },
    { icon: Lightbulb, text: "Review my profile", prompt: "Review my profile and suggest improvements" },
  ];

  return (
    <div className="bg-white rounded-lg border border-slate-200 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-900 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              Business Data Assistant
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 font-normal">
                Powered by Centy
              </span>
            </h3>
            <p className="text-slate-300 text-xs">
              Manage the data that powers your AI agents
            </p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-auto p-4 bg-slate-50">
        <div className="space-y-4 max-w-2xl mx-auto">
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-3",
                m.role === 'user' ? "flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                m.role === 'user' ? "bg-slate-200" : "bg-slate-800 text-white"
              )}>
                {m.role === 'user' ? <User className="w-4 h-4 text-slate-600" /> : <Sparkles className="w-4 h-4" />}
              </div>
              <div className={cn(
                "p-3 rounded-lg max-w-[85%] text-sm",
                m.role === 'user'
                  ? "bg-white text-slate-900 border border-slate-200"
                  : "bg-slate-800 text-white"
              )}>
                {m.content.split('\n').map((line, j) => (
                  <p key={j} className={j > 0 ? "mt-2" : ""}>{line}</p>
                ))}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              </div>
              <div className="p-3 rounded-lg bg-slate-100 text-sm text-slate-600 border border-slate-200">
                <span className="flex items-center gap-2">
                  <span>Thinking</span>
                  <span className="flex gap-1">
                    <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </div>

      {/* Quick Suggestions */}
      {messages.length < 4 && !isLoading && (
        <div className="border-t border-slate-200 bg-white p-3">
          <p className="text-xs text-slate-500 mb-2">Quick actions:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {suggestions.slice(0, 6).map((s, i) => (
              <button
                key={i}
                onClick={() => handleSend(s.prompt)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 transition-colors"
              >
                <s.icon className="w-3.5 h-3.5 text-slate-500" />
                <span className="truncate text-slate-700">{s.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-slate-200 bg-white p-3">
        <div className="flex gap-2 max-w-2xl mx-auto">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Tell me what you'd like to update..."
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm"
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className={cn(
              "px-4 py-2.5 rounded-lg font-medium text-white shrink-0 transition-colors",
              input.trim() && !isLoading
                ? "bg-slate-900 hover:bg-slate-800"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            )}
          >
            <Send className="w-4 h-4" />
          </button>
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

  const partnerId = user?.customClaims?.partnerId;

  const fetchData = async (showLoading = true) => {
    if (!partnerId) {
      setError("Partner ID not found");
      setLoading(false);
      return;
    }

    if (showLoading) {
      setLoading(true);
    }
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

      if (personaResult.success && personaResult.setupProgress) {
        setSetupProgress(personaResult.setupProgress);
        if (personaResult.persona) {
          setBusinessPersona(personaResult.persona);
        }
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError('An unexpected error occurred.');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchData();
    }
  }, [partnerId, authLoading]);

  if (authLoading || loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorState message={error} partnerId={partnerId} onRetry={fetchData} />;
  }

  if (!partner) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
        <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No Profile Found</h3>
        <p className="text-sm text-slate-500">Your organization profile hasn't been set up yet.</p>
      </div>
    );
  }

  // Manual Edit Mode
  if (showManualEdit) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowManualEdit(false)}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Business Data
          </button>
          {setupProgress && (
            <span className={cn(
              "text-xs px-2 py-1 rounded font-medium",
              setupProgress.overallPercentage >= 80
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-600"
            )}>
              {setupProgress.overallPercentage}% Complete
            </span>
          )}
        </div>
        <BusinessPersonaBuilder
          partnerId={partnerId!}
          mode="settings"
          onComplete={() => {
            setShowManualEdit(false);
            fetchData();
          }}
        />
      </div>
    );
  }

  // Main AI Manager Interface
  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">Business Data</h1>
              <p className="text-sm text-slate-500">
                This data powers your AI agents
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Progress */}
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-lg">
              <div className="relative w-10 h-10">
                <svg className="w-10 h-10 -rotate-90">
                  <circle
                    cx="20" cy="20" r="16"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="3"
                  />
                  <circle
                    cx="20" cy="20" r="16"
                    fill="none"
                    stroke={setupProgress?.overallPercentage && setupProgress.overallPercentage >= 80 ? "#10b981" : "#475569"}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${(setupProgress?.overallPercentage || 0) * 1.005} 100`}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-700">
                  {setupProgress?.overallPercentage || 0}%
                </span>
              </div>
              <div className="text-sm hidden sm:block">
                <div className="font-medium text-slate-700">Completeness</div>
                <div className="text-xs text-slate-500">
                  {(setupProgress?.overallPercentage || 0) >= 80 ? 'Ready for AI' : 'Add more data'}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowManualEdit(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span className="hidden sm:inline">Manual Edit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickActionCard
          icon={Building2}
          title="Business Info"
          description="Name, industry, description"
          isComplete={setupProgress?.basicInfo}
          onClick={() => setShowManualEdit(true)}
        />
        <QuickActionCard
          icon={Phone}
          title="Contact Details"
          description="Phone, email, location"
          isComplete={setupProgress?.contactInfo}
          onClick={() => setShowManualEdit(true)}
        />
        <QuickActionCard
          icon={Clock}
          title="Operating Hours"
          description="When you're available"
          isComplete={setupProgress?.operatingHours}
          onClick={() => setShowManualEdit(true)}
        />
        <QuickActionCard
          icon={Package}
          title="Products & FAQs"
          description="Offerings and questions"
          isComplete={setupProgress?.productsServices && setupProgress?.faqs}
          onClick={() => setShowManualEdit(true)}
        />
      </div>

      {/* Main Content Grid - AI Assistant Prominent */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* AI Manager - Takes 2 columns */}
        <div className="lg:col-span-2 h-[550px]">
          {businessPersona && (
            <AIManagerChat
              partnerId={partnerId!}
              persona={businessPersona}
              onDataUpdate={() => fetchData(false)}
            />
          )}
        </div>

        {/* Profile Sidebar */}
        <div className="h-[550px]">
          <ProfileSidebar persona={businessPersona} progress={setupProgress} />
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
            <Lightbulb className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h4 className="font-medium text-slate-900 text-sm">Why Business Data Matters</h4>
            <p className="text-sm text-slate-600 mt-1">
              The more complete your data, the better your AI agents can represent your business. Add contact details, products, and FAQs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
