// src/app/partner/(protected)/settings/dashboard/page.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
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
  Eye,
  Edit,
  Sparkles,
  CheckCircle2,
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
  MessageSquare,
  Loader2,
  Lightbulb,
  Zap,
  Target,
  HelpCircle,
  CreditCard,
  Languages,
  Heart,
  Settings2,
  ChevronRight,
  PenLine,
  FileText,
  PlayCircle,
  Wand2,
  Shield,
  Star,
  Calendar,
  Database,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-0">
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-2xl" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Skeleton className="h-[600px] rounded-xl" />
        </div>
        <Skeleton className="h-[600px] rounded-xl" />
      </div>
    </div>
  );
}

// Error State
function ErrorState({ message, partnerId, onRetry }: { message: string; partnerId?: string; onRetry: () => void }) {
  return (
    <Card className="border-destructive/50">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center py-6">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold text-destructive mb-2">Failed to Load Profile</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">{message}</p>
          {partnerId && (
            <p className="text-xs text-muted-foreground mb-4 font-mono bg-muted px-2 py-1 rounded">
              Partner ID: {partnerId}
            </p>
          )}
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Quick Action Card Component
function QuickActionCard({
  icon: Icon,
  title,
  description,
  isComplete,
  onClick,
  color = 'indigo'
}: {
  icon: any;
  title: string;
  description: string;
  isComplete?: boolean;
  onClick: () => void;
  color?: string;
}) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:border-indigo-400',
    green: 'bg-green-50 text-green-600 border-green-200 hover:border-green-400',
    purple: 'bg-purple-50 text-purple-600 border-purple-200 hover:border-purple-400',
    amber: 'bg-amber-50 text-amber-600 border-amber-200 hover:border-amber-400',
    blue: 'bg-blue-50 text-blue-600 border-blue-200 hover:border-blue-400',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "p-3 rounded-xl border-2 text-left transition-all group",
        isComplete ? "bg-green-50 border-green-300" : colors[color]
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
          isComplete ? "bg-green-100" : `bg-${color}-100`
        )}>
          {isComplete ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <Icon className="w-5 h-5" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium text-sm text-gray-900 flex items-center gap-2">
            {title}
            <ChevronRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{description}</div>
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
    <Card className="h-full border-2 overflow-hidden">
      <CardHeader className="bg-gradient-to-br from-slate-50 to-slate-100/50 border-b pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="w-4 h-4 text-slate-600" />
            Business Data Summary
          </CardTitle>
          {progress && (
            <Badge variant={progress.overallPercentage >= 80 ? 'default' : 'secondary'}
              className={progress.overallPercentage >= 80 ? 'bg-green-500' : ''}>
              {progress.overallPercentage}%
            </Badge>
          )}
        </div>
        {progress && (
          <Progress value={progress.overallPercentage} className="h-1.5 mt-2" />
        )}
      </CardHeader>
      <ScrollArea className="h-[calc(100%-80px)]">
        <CardContent className="pt-4 space-y-4">
          {/* Business Name & Industry */}
          <div>
            <h3 className="font-semibold text-lg">{identity?.name || 'Your Business'}</h3>
            {identity?.industry?.name && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <span>{identity.industry.icon}</span>
                {identity.industry.name}
              </p>
            )}
          </div>

          {/* Description */}
          {personality?.description && (
            <div>
              <p className="text-sm text-muted-foreground line-clamp-3">{personality.description}</p>
            </div>
          )}

          <Separator />

          {/* Contact Info */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Contact</h4>
            {identity?.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{identity.phone}</span>
              </div>
            )}
            {identity?.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="truncate">{identity.email}</span>
              </div>
            )}
            {identity?.website && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="truncate">{identity.website}</span>
              </div>
            )}
            {identity?.address?.city && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{identity.address.city}{identity.address.state ? `, ${identity.address.state}` : ''}</span>
              </div>
            )}
            {!identity?.phone && !identity?.email && !identity?.website && !identity?.address?.city && (
              <p className="text-xs text-muted-foreground italic">No contact info added yet</p>
            )}
          </div>

          <Separator />

          {/* Operating Hours */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Hours</h4>
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
              <p className="text-xs text-muted-foreground italic">Hours not set</p>
            )}
            {identity?.operatingHours?.specialNote && (
              <p className="text-xs text-muted-foreground">{identity.operatingHours.specialNote}</p>
            )}
          </div>

          <Separator />

          {/* Brand Voice */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Brand Voice</h4>
            {personality?.voiceTone && personality.voiceTone.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {personality.voiceTone.map(tone => (
                  <Badge key={tone} variant="outline" className="text-xs capitalize">
                    {tone}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">No voice tone set</p>
            )}
          </div>

          {/* USPs */}
          {personality?.uniqueSellingPoints && personality.uniqueSellingPoints.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Unique Selling Points</h4>
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
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Products & Services ({knowledge.productsOrServices.length})
                </h4>
                <div className="space-y-1">
                  {knowledge.productsOrServices.slice(0, 3).map(product => (
                    <div key={product.id} className="text-sm flex items-center gap-2">
                      <Package className="w-3 h-3 text-muted-foreground" />
                      <span className="truncate">{product.name}</span>
                      {product.priceRange && (
                        <span className="text-xs text-muted-foreground ml-auto">{product.priceRange}</span>
                      )}
                    </div>
                  ))}
                  {knowledge.productsOrServices.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{knowledge.productsOrServices.length - 3} more
                    </p>
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
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  FAQs ({knowledge.faqs.length})
                </h4>
                <div className="space-y-1">
                  {knowledge.faqs.slice(0, 2).map(faq => (
                    <div key={faq.id} className="text-xs text-muted-foreground">
                      <HelpCircle className="w-3 h-3 inline mr-1" />
                      {faq.question.length > 40 ? faq.question.slice(0, 40) + '...' : faq.question}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Languages */}
          {personality?.languagePreference && personality.languagePreference.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Languages</h4>
                <p className="text-sm">{personality.languagePreference.join(', ')}</p>
              </div>
            </>
          )}

          {/* Payment Methods */}
          {knowledge?.acceptedPayments && knowledge.acceptedPayments.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Payments</h4>
                <p className="text-sm">{knowledge.acceptedPayments.join(', ')}</p>
              </div>
            </>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  );
}

// AI Manager Chat Interface - Enhanced
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
    { icon: HelpCircle, text: "Add an FAQ", prompt: "Help me add a frequently asked question" },
    { icon: Heart, text: "Set brand voice", prompt: "Help me configure my brand voice and tone" },
    { icon: PlayCircle, text: "Simulate conversation", prompt: "Simulate a conversation with a customer interested in my main product" },
    { icon: Lightbulb, text: "Review my profile", prompt: "Review my profile and suggest improvements" },
  ];

  return (
    <Card className="h-full flex flex-col border-2 border-indigo-100 overflow-hidden">
      {/* Header */}
      <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white pb-4 border-b-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shadow-lg ring-2 ring-white/30">
            <Bot className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              Business Data Assistant
              <Badge variant="secondary" className="bg-white/20 text-white border-0 text-[10px]">
                Powered by Gemini
              </Badge>
            </CardTitle>
            <CardDescription className="text-indigo-100">
              Manage the data that powers your AI agents
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      {/* Chat Messages */}
      <CardContent className="flex-1 overflow-hidden p-0 flex flex-col bg-gradient-to-b from-slate-50/50 to-white">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 max-w-2xl mx-auto">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-3 animate-in fade-in slide-in-from-bottom-2",
                  m.role === 'user' ? "flex-row-reverse" : ""
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                  m.role === 'user' ? "bg-slate-200" : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
                )}>
                  {m.role === 'user' ? <User className="w-4 h-4 text-slate-600" /> : <Sparkles className="w-4 h-4" />}
                </div>
                <div className={cn(
                  "p-3 rounded-2xl max-w-[85%] text-sm shadow-sm",
                  m.role === 'user'
                    ? "bg-white text-gray-900 rounded-tr-sm border"
                    : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-tl-sm"
                )}>
                  {m.content.split('\n').map((line, j) => (
                    <p key={j} className={j > 0 ? "mt-2" : ""}>{line}</p>
                  ))}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                </div>
                <div className="p-3 rounded-2xl rounded-tl-sm bg-indigo-50 text-sm text-indigo-700 border border-indigo-100">
                  <span className="flex items-center gap-2">
                    <span className="animate-pulse">Thinking</span>
                    <span className="flex gap-1">
                      <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
          <div className="border-t bg-slate-50/80 p-3">
            <p className="text-xs text-muted-foreground mb-2 px-1">Quick actions:</p>
            <div className="grid grid-cols-2 gap-2">
              {suggestions.slice(0, 4).map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(s.prompt)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                >
                  <s.icon className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="truncate">{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t bg-white p-3">
          <div className="flex gap-2 max-w-2xl mx-auto">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Tell me what you'd like to update..."
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              disabled={isLoading}
              className="bg-slate-50 border-slate-200 focus-visible:ring-indigo-500"
            />
            <Button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              size="icon"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shrink-0 shadow-md"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
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
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center py-8">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
              <Building2 className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Organization Profile</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Your organization profile hasn't been set up yet.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Manual Edit Mode
  if (showManualEdit) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setShowManualEdit(false)}
            className="gap-2"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            Back to Business Data
          </Button>
          {setupProgress && (
            <Badge
              variant={setupProgress.overallPercentage >= 80 ? 'default' : 'secondary'}
              className={setupProgress.overallPercentage >= 80 ? 'bg-green-500' : ''}
            >
              {setupProgress.overallPercentage}% Complete
            </Badge>
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

  const userInitial = user?.displayName?.charAt(0)?.toUpperCase() ||
                      user?.email?.charAt(0)?.toUpperCase() ||
                      'U';
  const userRole = user?.customClaims?.role;

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Main AI Manager Interface
  return (
    <div className="space-y-6">
      {/* Account Info Bar */}
      <Card className="border-slate-200">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-primary/20">
                <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || 'User'} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium text-sm">{user?.displayName || 'Workspace User'}</div>
                <div className="text-xs text-muted-foreground">{user?.email}</div>
              </div>
            </div>
            <Separator orientation="vertical" className="hidden sm:block h-8" />
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Badge variant={userRole === 'partner_admin' ? 'default' : 'secondary'} className="text-xs">
                  {userRole === 'partner_admin' ? 'Admin' : 'Member'}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Joined {formatDate(user?.metadata?.creationTime)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                <span className="font-mono">{partnerId?.substring(0, 8)}...</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hero Header - Business Data */}
      <Card className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white border-0 overflow-hidden relative">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,white)]" />
        <CardContent className="py-6 relative">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shadow-lg ring-2 ring-white/30">
                <Database className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  Business Data
                  <Badge variant="secondary" className="bg-white/20 text-white border-0 text-[10px]">
                    Powers AI Agents
                  </Badge>
                </h1>
                <p className="text-indigo-100 text-sm mt-0.5">
                  This data is used by your AI agents to understand and represent your business
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Progress Ring */}
              <div className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-2">
                <div className="relative w-10 h-10">
                  <svg className="w-10 h-10 -rotate-90">
                    <circle
                      cx="20" cy="20" r="16"
                      fill="none"
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="4"
                    />
                    <circle
                      cx="20" cy="20" r="16"
                      fill="none"
                      stroke="white"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={`${(setupProgress?.overallPercentage || 0) * 1.005} 100`}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                    {setupProgress?.overallPercentage || 0}%
                  </span>
                </div>
                <div className="text-sm">
                  <div className="font-medium">Completeness</div>
                  <div className="text-indigo-200 text-xs">
                    {(setupProgress?.overallPercentage || 0) >= 80 ? 'Ready for AI!' : 'More data needed'}
                  </div>
                </div>
              </div>

              <Button
                variant="secondary"
                onClick={() => setShowManualEdit(true)}
                className="bg-white/20 hover:bg-white/30 text-white border-0"
              >
                <Edit className="w-4 h-4 mr-2" />
                Manual Edit
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickActionCard
          icon={Building2}
          title="Business Info"
          description="Name, industry, description"
          isComplete={setupProgress?.basicInfo}
          onClick={() => setShowManualEdit(true)}
          color="indigo"
        />
        <QuickActionCard
          icon={Phone}
          title="Contact Details"
          description="Phone, email, location"
          isComplete={setupProgress?.contactInfo}
          onClick={() => setShowManualEdit(true)}
          color="green"
        />
        <QuickActionCard
          icon={Clock}
          title="Operating Hours"
          description="When you're available"
          isComplete={setupProgress?.operatingHours}
          onClick={() => setShowManualEdit(true)}
          color="amber"
        />
        <QuickActionCard
          icon={Package}
          title="Products & FAQs"
          description="Offerings and questions"
          isComplete={setupProgress?.productsServices && setupProgress?.faqs}
          onClick={() => setShowManualEdit(true)}
          color="purple"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* AI Manager - Takes 2 columns */}
        <div className="lg:col-span-2 h-[600px]">
          {businessPersona && (
            <AIManagerChat
              partnerId={partnerId!}
              persona={businessPersona}
              onDataUpdate={() => fetchData(false)}
            />
          )}
        </div>

        {/* Profile Sidebar */}
        <div className="h-[600px]">
          <ProfileSidebar persona={businessPersona} progress={setupProgress} />
        </div>
      </div>

      {/* Tips Section */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <Lightbulb className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="font-medium text-amber-900">Why Business Data Matters</h4>
              <p className="text-sm text-amber-700 mt-1">
                The more complete your business data, the better your AI agents can represent your business to customers. Try adding:
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline" className="bg-white/50 text-amber-800 border-amber-300">
                  Contact details & hours
                </Badge>
                <Badge variant="outline" className="bg-white/50 text-amber-800 border-amber-300">
                  Products & services
                </Badge>
                <Badge variant="outline" className="bg-white/50 text-amber-800 border-amber-300">
                  FAQs for common questions
                </Badge>
                <Badge variant="outline" className="bg-white/50 text-amber-800 border-amber-300">
                  Brand voice & tone
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
