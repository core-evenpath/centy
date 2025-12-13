// src/app/partner/(protected)/settings/dashboard/page.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { getPartnerProfileAction } from '@/actions/get-partner-profile';
import { getBusinessPersonaAction, chatWithPersonaManagerAction } from '@/actions/business-persona-actions';
import BusinessPersonaBuilder from '@/components/partner/settings/BusinessPersonaBuilder';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  AlertCircle,
  Building2,
  RefreshCw,
  Edit,
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
  Lightbulb,
  HelpCircle,
  ChevronRight,
  Database,
  ArrowRight,
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
    <div className="h-full flex flex-col bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex-1 overflow-auto p-6 space-y-6 max-w-5xl mx-auto w-full">
        <Skeleton className="h-32 rounded-lg" />
        <div className="grid lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-[500px] rounded-lg" />
          <Skeleton className="h-[500px] rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// Error State
function ErrorState({ message, partnerId, onRetry }: { message: string; partnerId?: string; onRetry: () => void }) {
  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Failed to Load Profile</h3>
          <p className="text-slate-500 mb-4 max-w-sm">{message}</p>
          {partnerId && (
            <p className="text-xs text-slate-400 mb-4 font-mono bg-slate-100 px-2 py-1 rounded inline-block">
              Partner ID: {partnerId}
            </p>
          )}
          <Button onClick={onRetry} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        </div>
      </div>
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
  color = 'slate'
}: {
  icon: any;
  title: string;
  description: string;
  isComplete?: boolean;
  onClick: () => void;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-4 rounded-xl border bg-white text-left transition-all group hover:shadow-sm",
        isComplete ? "border-green-200 hover:border-green-300" : "border-slate-200 hover:border-slate-300"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
          isComplete ? "bg-green-100" : "bg-slate-100 group-hover:bg-slate-200"
        )}>
          {isComplete ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <Icon className="w-5 h-5 text-slate-600" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium text-sm text-slate-900 flex items-center gap-2">
            {title}
            <ChevronRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-slate-400" />
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
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden h-full flex flex-col">
      <div className="px-5 py-4 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-slate-900 flex items-center gap-2">
            <Database className="w-4 h-4 text-slate-500" />
            Data Summary
          </h3>
          {progress && (
            <Badge variant={progress.overallPercentage >= 80 ? 'default' : 'secondary'}
              className={cn("text-xs", progress.overallPercentage >= 80 && 'bg-green-600')}>
              {progress.overallPercentage}%
            </Badge>
          )}
        </div>
        {progress && (
          <Progress value={progress.overallPercentage} className="h-1.5 mt-3" />
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-5 space-y-4">
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

          <Separator />

          {/* Contact Info */}
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-slate-400 uppercase tracking-wide">Contact</h5>
            {identity?.phone && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{identity.phone}</span>
              </div>
            )}
            {identity?.email && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate">{identity.email}</span>
              </div>
            )}
            {identity?.website && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate">{identity.website}</span>
              </div>
            )}
            {identity?.address?.city && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{identity.address.city}{identity.address.state ? `, ${identity.address.state}` : ''}</span>
              </div>
            )}
            {!identity?.phone && !identity?.email && !identity?.website && !identity?.address?.city && (
              <p className="text-xs text-slate-400 italic">No contact info added yet</p>
            )}
          </div>

          <Separator />

          {/* Operating Hours */}
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-slate-400 uppercase tracking-wide">Hours</h5>
            {identity?.operatingHours?.isOpen24x7 ? (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-3.5 h-3.5 text-green-500" />
                <span className="text-green-600 font-medium">Open 24/7</span>
              </div>
            ) : identity?.operatingHours?.appointmentOnly ? (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-3.5 h-3.5 text-purple-500" />
                <span className="text-purple-600 font-medium">By Appointment</span>
              </div>
            ) : identity?.operatingHours?.onlineAlways ? (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-blue-600 font-medium">Online 24/7</span>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Hours not set</p>
            )}
          </div>

          <Separator />

          {/* Brand Voice */}
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-slate-400 uppercase tracking-wide">Brand Voice</h5>
            {personality?.voiceTone && personality.voiceTone.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {personality.voiceTone.map(tone => (
                  <Badge key={tone} variant="outline" className="text-xs capitalize">
                    {tone}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No voice tone set</p>
            )}
          </div>

          {/* USPs */}
          {personality?.uniqueSellingPoints && personality.uniqueSellingPoints.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h5 className="text-xs font-medium text-slate-400 uppercase tracking-wide">Selling Points</h5>
                <div className="flex flex-wrap gap-1">
                  {personality.uniqueSellingPoints.slice(0, 5).map((usp, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {usp}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Products/Services */}
          {knowledge?.productsOrServices && knowledge.productsOrServices.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h5 className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Products ({knowledge.productsOrServices.length})
                </h5>
                <div className="space-y-1">
                  {knowledge.productsOrServices.slice(0, 3).map(product => (
                    <div key={product.id} className="text-sm flex items-center gap-2 text-slate-600">
                      <Package className="w-3 h-3 text-slate-400" />
                      <span className="truncate">{product.name}</span>
                      {product.priceRange && (
                        <span className="text-xs text-slate-400 ml-auto">{product.priceRange}</span>
                      )}
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
              <Separator />
              <div className="space-y-2">
                <h5 className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  FAQs ({knowledge.faqs.length})
                </h5>
                <div className="space-y-1">
                  {knowledge.faqs.slice(0, 2).map(faq => (
                    <div key={faq.id} className="text-xs text-slate-500">
                      <HelpCircle className="w-3 h-3 inline mr-1" />
                      {faq.question.length > 40 ? faq.question.slice(0, 40) + '...' : faq.question}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// AI Manager Chat Interface
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
    { icon: Building2, text: "Update my business name", prompt: "I want to update my business name" },
    { icon: Phone, text: "Add contact details", prompt: "Help me add my contact information including phone, email and address" },
    { icon: Clock, text: "Set operating hours", prompt: "I want to set my operating hours" },
    { icon: Package, text: "Add a product/service", prompt: "I want to add a new product or service to my profile" },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium">Business Data Assistant</h3>
              <Badge className="bg-white/20 text-white border-0 text-[10px]">
                Powered by Centy
              </Badge>
            </div>
            <p className="text-slate-300 text-xs mt-0.5">
              Chat to manage your business data
            </p>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-3",
                  m.role === 'user' ? "flex-row-reverse" : ""
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                  m.role === 'user' ? "bg-slate-200" : "bg-slate-900 text-white"
                )}>
                  {m.role === 'user' ? <User className="w-4 h-4 text-slate-600" /> : <Sparkles className="w-4 h-4" />}
                </div>
                <div className={cn(
                  "p-3 rounded-xl max-w-[85%] text-sm",
                  m.role === 'user'
                    ? "bg-slate-100 text-slate-900 rounded-tr-sm"
                    : "bg-slate-900 text-white rounded-tl-sm"
                )}>
                  {m.content.split('\n').map((line, j) => (
                    <p key={j} className={j > 0 ? "mt-2" : ""}>{line}</p>
                  ))}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                </div>
                <div className="p-3 rounded-xl rounded-tl-sm bg-slate-100 text-sm text-slate-600">
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
        </ScrollArea>

        {/* Quick Suggestions */}
        {messages.length < 4 && !isLoading && (
          <div className="border-t border-slate-100 bg-slate-50 p-3">
            <p className="text-xs text-slate-500 mb-2">Quick actions:</p>
            <div className="grid grid-cols-2 gap-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(s.prompt)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  <s.icon className="w-3.5 h-3.5 text-slate-500" />
                  <span className="truncate text-slate-600">{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-slate-200 bg-white p-3">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Tell me what you'd like to update..."
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              disabled={isLoading}
              className="bg-slate-50 border-slate-200"
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
      setError("Partner ID not found in user profile");
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
      setError('An unexpected error occurred. Please try again.');
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
      <div className="h-full flex flex-col bg-slate-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Organization Profile</h3>
            <p className="text-slate-500 max-w-sm">
              Your organization profile hasn't been set up yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Manual Edit Mode
  if (showManualEdit) {
    return (
      <div className="h-full flex flex-col bg-slate-50">
        <div className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <button
              onClick={() => setShowManualEdit(false)}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Business Data
            </button>
            {setupProgress && (
              <Badge
                variant={setupProgress.overallPercentage >= 80 ? 'default' : 'secondary'}
                className={cn("text-xs", setupProgress.overallPercentage >= 80 && 'bg-green-600')}
              >
                {setupProgress.overallPercentage}% Complete
              </Badge>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <div className="p-6 max-w-5xl mx-auto">
            <BusinessPersonaBuilder
              partnerId={partnerId!}
              mode="settings"
              onComplete={() => {
                setShowManualEdit(false);
                fetchData();
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  const businessName = businessPersona?.identity?.name || partner?.businessName || 'Your Business';
  const completeness = setupProgress?.overallPercentage || 0;

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-4">
            <Link
              href="/partner/settings"
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Settings
            </Link>
            <div className="h-4 w-px bg-slate-200" />
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Business Data</h1>
              <p className="text-slate-500 text-sm mt-0.5">
                {businessName !== 'Your Business' ? `Manage data for ${businessName}` : 'Configure the data that powers your AI agents'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowManualEdit(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Manual Edit
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6 max-w-5xl mx-auto">

          {/* Progress Banner */}
          <div className={cn(
            "rounded-xl border overflow-hidden",
            completeness >= 80 ? "bg-green-50 border-green-200" : "bg-slate-900 border-slate-700"
          )}>
            <div className="p-5">
              <div className="flex items-center gap-5">
                {/* Progress Ring */}
                <div className="relative w-16 h-16 flex-shrink-0">
                  <svg className="w-16 h-16 -rotate-90">
                    <circle
                      cx="32" cy="32" r="28"
                      fill="none"
                      stroke={completeness >= 80 ? "rgba(22,163,74,0.2)" : "rgba(255,255,255,0.2)"}
                      strokeWidth="6"
                    />
                    <circle
                      cx="32" cy="32" r="28"
                      fill="none"
                      stroke={completeness >= 80 ? "#16a34a" : "white"}
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${completeness * 1.76} 176`}
                    />
                  </svg>
                  <span className={cn(
                    "absolute inset-0 flex items-center justify-center text-lg font-bold",
                    completeness >= 80 ? "text-green-700" : "text-white"
                  )}>
                    {completeness}%
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h2 className={cn(
                    "font-semibold text-lg",
                    completeness >= 80 ? "text-green-900" : "text-white"
                  )}>
                    {completeness >= 80 ? 'Your Business Data is Ready!' : 'Complete Your Business Data'}
                  </h2>
                  <p className={cn(
                    "text-sm mt-1",
                    completeness >= 80 ? "text-green-700" : "text-slate-300"
                  )}>
                    {completeness >= 80
                      ? 'Your AI agents have enough information to represent your business effectively.'
                      : 'Add more information to help your AI agents serve customers better.'
                    }
                  </p>
                </div>

                {completeness < 80 && (
                  <button
                    onClick={() => setShowManualEdit(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-slate-900 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors"
                  >
                    Add Data
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
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

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* AI Manager - Takes 2 columns */}
            <div className="lg:col-span-2 h-[500px]">
              {businessPersona && (
                <AIManagerChat
                  partnerId={partnerId!}
                  persona={businessPersona}
                  onDataUpdate={() => fetchData(false)}
                />
              )}
            </div>

            {/* Profile Sidebar */}
            <div className="h-[500px]">
              <ProfileSidebar persona={businessPersona} progress={setupProgress} />
            </div>
          </div>

          {/* Tips Section */}
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                <Lightbulb className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h4 className="font-medium text-amber-900">Tips for Better AI Responses</h4>
                <p className="text-sm text-amber-700 mt-1">
                  The more complete your business data, the better your AI agents can represent your business. Try adding detailed FAQs, product descriptions with pricing, and your brand voice preferences.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
