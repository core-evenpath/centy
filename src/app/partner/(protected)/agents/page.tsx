"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { usePartnerHub } from '@/hooks/use-partnerhub';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { getBusinessPersonaAction } from '@/actions/business-persona-actions';
import { cn } from '@/lib/utils';
import {
    Bot,
    Zap,
    Sparkles,
    Settings,
    Play,
    MessageCircle,
    ChevronRight,
    FileText,
    Users,
    TrendingUp,
    Shield,
    Target,
    ArrowRight,
    Building2,
    ExternalLink,
    CheckCircle2,
    AlertCircle,
    Sliders,
    ToggleLeft,
    ToggleRight,
    Clock,
    Phone,
    Globe,
    Lightbulb,
    ArrowUpRight,
} from 'lucide-react';
import { AgentRole, EssentialAgent } from '@/lib/partnerhub-types';
import AgentConfigPanel from '@/components/partner/core/AgentConfigPanel';
import AgentTestPanel from '@/components/partner/core/AgentTestPanel';
import type { BusinessPersona } from '@/lib/business-persona-types';

const DEFAULT_AGENTS: Omit<EssentialAgent, 'id' | 'partnerId' | 'createdAt' | 'updatedAt'>[] = [
    {
        role: AgentRole.CUSTOMER_CARE,
        name: 'Customer Support',
        description: 'Handles questions from existing customers',
        avatar: 'Bot',
        businessName: '',
        tones: ['professional', 'empathetic'],
        style: 'conversational',
        responseLength: 'moderate',
        useAllDocuments: false,
        attachedDocumentIds: [],
        responseRules: [],
        neverSay: [],
        alwaysInclude: [],
        escalationSettings: {
            onHumanRequest: true,
            humanRequestKeywords: ['human', 'person', 'agent', 'manager'],
            onFrustration: true,
            frustrationThreshold: 3,
            onNoAnswer: true,
            noAnswerAttempts: 2,
            onSensitiveTopics: true,
            sensitiveTopics: ['refund', 'complaint', 'legal'],
            escalationMessage: "Let me connect you with a team member who can help you better.",
        },
        conversationCount: 0,
        messageCount: 0,
        isActive: true,
        isDefault: false,
        temperature: 0.7,
    },
    {
        role: AgentRole.SALES_ASSISTANT,
        name: 'Sales Assistant',
        description: 'Helps potential customers learn about your offerings',
        avatar: 'Zap',
        businessName: '',
        tones: ['friendly', 'professional'],
        style: 'conversational',
        responseLength: 'moderate',
        useAllDocuments: true,
        attachedDocumentIds: [],
        responseRules: [],
        neverSay: [],
        alwaysInclude: [],
        escalationSettings: {
            onHumanRequest: true,
            humanRequestKeywords: ['human', 'person', 'call me'],
            onFrustration: false,
            frustrationThreshold: 3,
            onNoAnswer: true,
            noAnswerAttempts: 2,
            onSensitiveTopics: false,
            sensitiveTopics: [],
            escalationMessage: "I'd be happy to have someone from our team reach out to you!",
        },
        leadSettings: {
            askBudget: false,
            budgetQuestion: '',
            askAuthority: false,
            authorityQuestion: '',
            askNeed: true,
            needQuestion: 'What are you looking for today?',
            askTimeline: false,
            timelineQuestion: '',
            hotLeadAction: 'notify_email',
            warmLeadAction: 'add_pipeline',
            coldLeadAction: 'nurture',
            products: [],
        },
        conversationCount: 0,
        messageCount: 0,
        isActive: true,
        isDefault: false,
        temperature: 0.7,
    },
    {
        role: AgentRole.MARKETING_COMMS,
        name: 'Marketing & Outreach',
        description: 'Sends birthday wishes, promotions, and updates',
        avatar: 'Sparkles',
        businessName: '',
        tones: ['friendly', 'creative'],
        style: 'casual',
        responseLength: 'brief',
        useAllDocuments: false,
        attachedDocumentIds: [],
        responseRules: [],
        neverSay: [],
        alwaysInclude: [],
        escalationSettings: {
            onHumanRequest: true,
            humanRequestKeywords: ['unsubscribe', 'stop'],
            onFrustration: false,
            frustrationThreshold: 3,
            onNoAnswer: false,
            noAnswerAttempts: 2,
            onSensitiveTopics: false,
            sensitiveTopics: [],
            escalationMessage: "",
        },
        campaignSettings: {
            enableBirthday: true,
            birthdayDaysBefore: 0,
            birthdayChannel: 'whatsapp',
            birthdayIncludeOffer: false,
            enableAnniversary: false,
            enableWelcome: true,
            enableThankYou: false,
            holidays: [],
            brandColors: ['#4F46E5'],
            imageStyle: 'modern',
            includeLogo: true,
            maxMessagesPerMonth: 4,
            quietHoursStart: '21:00',
            quietHoursEnd: '08:00',
            requireApprovalOver: 100,
        },
        conversationCount: 0,
        messageCount: 0,
        isActive: true,
        isDefault: false,
        temperature: 0.7,
    },
];

const AGENT_INFO = {
    [AgentRole.CUSTOMER_CARE]: {
        icon: Bot,
        color: 'blue',
        gradient: 'from-blue-500 to-blue-600',
        bgLight: 'bg-blue-50',
        bgDark: 'bg-blue-500',
        text: 'text-blue-600',
        border: 'border-blue-200',
        ring: 'ring-blue-500/20',
        useCases: [
            'Order status inquiries',
            'Return & refund questions',
            'Product troubleshooting',
            'Account issues',
        ],
        bestFor: 'Inbox conversations with existing customers',
    },
    [AgentRole.SALES_ASSISTANT]: {
        icon: Zap,
        color: 'amber',
        gradient: 'from-amber-500 to-orange-500',
        bgLight: 'bg-amber-50',
        bgDark: 'bg-amber-500',
        text: 'text-amber-600',
        border: 'border-amber-200',
        ring: 'ring-amber-500/20',
        useCases: [
            'Product/service questions',
            'Pricing inquiries',
            'Feature comparisons',
            'Booking appointments',
        ],
        bestFor: 'Converting inquiries into customers',
    },
    [AgentRole.MARKETING_COMMS]: {
        icon: Sparkles,
        color: 'purple',
        gradient: 'from-purple-500 to-pink-500',
        bgLight: 'bg-purple-50',
        bgDark: 'bg-purple-500',
        text: 'text-purple-600',
        border: 'border-purple-200',
        ring: 'ring-purple-500/20',
        useCases: [
            'Birthday wishes',
            'Promotional messages',
            'New arrival alerts',
            'Re-engagement',
        ],
        bestFor: 'Automated outreach campaigns',
    },
};

type PageView = 'list' | 'configure';

export default function AgentsPage() {
    const { documents, customAgents, partnerId, saveEssentialAgent } = usePartnerHub();
    const { currentWorkspace } = useMultiWorkspaceAuth();
    const [pageView, setPageView] = useState<PageView>('list');
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
    const [testingAgent, setTestingAgent] = useState<EssentialAgent | null>(null);
    const [businessPersona, setBusinessPersona] = useState<BusinessPersona | null>(null);
    const [loadingPersona, setLoadingPersona] = useState(true);

    // Load business persona from settings
    useEffect(() => {
        async function loadPersona() {
            if (currentWorkspace?.partnerId) {
                setLoadingPersona(true);
                try {
                    const result = await getBusinessPersonaAction(currentWorkspace.partnerId);
                    if (result.success && result.persona) {
                        setBusinessPersona(result.persona);
                    }
                } catch (e) {
                    console.error('Failed to load business persona:', e);
                } finally {
                    setLoadingPersona(false);
                }
            }
        }
        loadPersona();
    }, [currentWorkspace?.partnerId]);

    const essentialAgents: EssentialAgent[] = useMemo(() => {
        return DEFAULT_AGENTS.map((defaultAgent) => {
            const id = `essential-${defaultAgent.role}`;
            const existingAgent = customAgents.find(a => a.id === id);

            if (existingAgent) {
                return {
                    ...defaultAgent,
                    ...existingAgent,
                    id,
                } as unknown as EssentialAgent;
            }

            return {
                ...defaultAgent,
                id,
                partnerId: partnerId || 'current',
                businessName: businessPersona?.identity?.name || 'Your Business',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
        });
    }, [customAgents, partnerId, businessPersona]);

    const selectedAgent = selectedAgentId ? essentialAgents.find(a => a.id === selectedAgentId) : null;

    const handleConfigureAgent = (agent: EssentialAgent) => {
        setSelectedAgentId(agent.id);
        setPageView('configure');
    };

    const handleSaveAgent = async (updatedAgent: EssentialAgent) => {
        await saveEssentialAgent(updatedAgent);
    };

    const handleToggleActive = async (agent: EssentialAgent, isActive: boolean) => {
        const updated = { ...agent, isActive, updatedAt: new Date() };
        await saveEssentialAgent(updated);
    };

    const getDocumentCount = (agent: EssentialAgent) => {
        if (agent.useAllDocuments) return documents.length;
        return agent.attachedDocumentIds.length;
    };

    // Check if business profile is set up
    const hasBusinessProfile = businessPersona?.identity?.name && businessPersona?.identity?.name !== '';
    const businessName = businessPersona?.identity?.name || 'Your Business';
    const businessPhone = businessPersona?.identity?.phone;
    const businessHours = businessPersona?.identity?.operatingHours;

    if (pageView === 'configure' && selectedAgent) {
        return (
            <AgentConfigPanel
                agent={selectedAgent}
                onBack={() => { setPageView('list'); setSelectedAgentId(null); }}
                onSave={handleSaveAgent}
                onTest={() => setTestingAgent(selectedAgent)}
            />
        );
    }

    return (
        <>
            {testingAgent && partnerId && (
                <AgentTestPanel
                    agent={testingAgent}
                    partnerId={partnerId}
                    onClose={() => setTestingAgent(null)}
                />
            )}
            <div className="h-full flex flex-col bg-slate-50">
                {/* Header */}
                <div className="bg-white border-b border-slate-200 px-6 py-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-semibold text-slate-900">AI Agents</h1>
                            <p className="text-slate-500 text-sm mt-0.5">
                                Specialized AI assistants for your inbox and customer conversations
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    <div className="p-6 space-y-6 max-w-5xl mx-auto">

                        {/* Business Context Banner - Links to Settings */}
                        <div className={cn(
                            "rounded-2xl border-2 overflow-hidden transition-all",
                            hasBusinessProfile
                                ? "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200"
                                : "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200"
                        )}>
                            <div className="p-5">
                                <div className="flex items-start gap-4">
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                                        hasBusinessProfile ? "bg-emerald-100" : "bg-amber-100"
                                    )}>
                                        <Building2 className={cn(
                                            "w-6 h-6",
                                            hasBusinessProfile ? "text-emerald-600" : "text-amber-600"
                                        )} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h2 className={cn(
                                                    "font-semibold",
                                                    hasBusinessProfile ? "text-emerald-900" : "text-amber-900"
                                                )}>
                                                    {hasBusinessProfile ? 'Business Context Connected' : 'Set Up Your Business Profile'}
                                                </h2>
                                                <p className={cn(
                                                    "text-sm mt-1",
                                                    hasBusinessProfile ? "text-emerald-700" : "text-amber-700"
                                                )}>
                                                    {hasBusinessProfile
                                                        ? `All agents use your business info from Settings. Currently representing "${businessName}".`
                                                        : 'Your agents need business information to respond accurately. Set up your profile in Settings first.'
                                                    }
                                                </p>

                                                {/* Quick Business Info Preview */}
                                                {hasBusinessProfile && (
                                                    <div className="flex flex-wrap gap-3 mt-3">
                                                        {businessPhone && (
                                                            <span className="inline-flex items-center gap-1.5 text-xs bg-white/60 px-2.5 py-1 rounded-full text-emerald-700">
                                                                <Phone className="w-3 h-3" />
                                                                {businessPhone}
                                                            </span>
                                                        )}
                                                        {businessHours?.isOpen24x7 && (
                                                            <span className="inline-flex items-center gap-1.5 text-xs bg-white/60 px-2.5 py-1 rounded-full text-emerald-700">
                                                                <Clock className="w-3 h-3" />
                                                                Open 24/7
                                                            </span>
                                                        )}
                                                        {businessPersona?.identity?.website && (
                                                            <span className="inline-flex items-center gap-1.5 text-xs bg-white/60 px-2.5 py-1 rounded-full text-emerald-700">
                                                                <Globe className="w-3 h-3" />
                                                                Website connected
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <a
                                                href="/partner/settings/dashboard"
                                                className={cn(
                                                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex-shrink-0",
                                                    hasBusinessProfile
                                                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                                        : "bg-amber-600 text-white hover:bg-amber-700"
                                                )}
                                            >
                                                <Settings className="w-4 h-4" />
                                                {hasBusinessProfile ? 'Edit in Settings' : 'Set Up Profile'}
                                                <ArrowUpRight className="w-3.5 h-3.5" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Info strip */}
                            <div className={cn(
                                "px-5 py-2.5 text-xs flex items-center gap-2 border-t",
                                hasBusinessProfile
                                    ? "bg-emerald-100/50 border-emerald-200/50 text-emerald-700"
                                    : "bg-amber-100/50 border-amber-200/50 text-amber-700"
                            )}>
                                <Lightbulb className="w-3.5 h-3.5" />
                                {hasBusinessProfile
                                    ? 'Business name, contact info, hours, and FAQs are automatically available to all agents.'
                                    : 'Complete your business profile so agents can accurately represent your business.'
                                }
                            </div>
                        </div>

                        {/* Agents Grid */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
                                    Available Agents
                                </h2>
                                <span className="text-xs text-slate-500">
                                    {essentialAgents.filter(a => a.isActive).length} of {essentialAgents.length} active
                                </span>
                            </div>

                            <div className="grid gap-4">
                                {essentialAgents.map((agent) => {
                                    const info = AGENT_INFO[agent.role];
                                    const Icon = info.icon;
                                    const docCount = getDocumentCount(agent);

                                    return (
                                        <div
                                            key={agent.id}
                                            className={cn(
                                                "bg-white rounded-2xl border-2 overflow-hidden transition-all hover:shadow-lg",
                                                agent.isActive ? info.border : "border-slate-200 opacity-75"
                                            )}
                                        >
                                            <div className="p-5">
                                                <div className="flex items-start gap-4">
                                                    {/* Icon */}
                                                    <div className={cn(
                                                        "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br",
                                                        agent.isActive ? info.gradient : "from-slate-400 to-slate-500"
                                                    )}>
                                                        <Icon className="w-7 h-7 text-white" />
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div>
                                                                <div className="flex items-center gap-3">
                                                                    <h3 className="text-lg font-semibold text-slate-900">{agent.name}</h3>
                                                                    {/* Active Toggle */}
                                                                    <button
                                                                        onClick={() => handleToggleActive(agent, !agent.isActive)}
                                                                        className={cn(
                                                                            "flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium transition-colors",
                                                                            agent.isActive
                                                                                ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                                                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                                                        )}
                                                                    >
                                                                        {agent.isActive ? (
                                                                            <>
                                                                                <ToggleRight className="w-3.5 h-3.5" />
                                                                                Active
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <ToggleLeft className="w-3.5 h-3.5" />
                                                                                Inactive
                                                                            </>
                                                                        )}
                                                                    </button>
                                                                </div>
                                                                <p className="text-slate-500 mt-1">{agent.description}</p>
                                                            </div>

                                                            {/* Actions */}
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => setTestingAgent(agent)}
                                                                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                                                >
                                                                    <Play className="w-4 h-4" />
                                                                    Test
                                                                </button>
                                                                <button
                                                                    onClick={() => handleConfigureAgent(agent)}
                                                                    className={cn(
                                                                        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                                                                        `bg-gradient-to-r ${info.gradient} text-white hover:shadow-md`
                                                                    )}
                                                                >
                                                                    <Sliders className="w-4 h-4" />
                                                                    Configure
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Best For & Use Cases */}
                                                        <div className="mt-4 grid sm:grid-cols-2 gap-4">
                                                            <div>
                                                                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                                                    Best for
                                                                </h4>
                                                                <p className={cn("text-sm font-medium", info.text)}>
                                                                    {info.bestFor}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                                                    Handles
                                                                </h4>
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {info.useCases.slice(0, 3).map((useCase, i) => (
                                                                        <span
                                                                            key={i}
                                                                            className={cn(
                                                                                "text-xs px-2 py-0.5 rounded-full",
                                                                                info.bgLight, info.text
                                                                            )}
                                                                        >
                                                                            {useCase}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Footer */}
                                            <div className={cn("px-5 py-3 border-t flex items-center justify-between", info.bgLight)}>
                                                <div className="flex items-center gap-4 text-sm text-slate-600">
                                                    <span className="flex items-center gap-1.5">
                                                        <FileText className="w-4 h-4 text-slate-400" />
                                                        {agent.useAllDocuments ? 'All' : docCount} documents
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <MessageCircle className="w-4 h-4 text-slate-400" />
                                                        {agent.tones.slice(0, 2).join(', ')} tone
                                                    </span>
                                                    {agent.escalationSettings.onHumanRequest && (
                                                        <span className="flex items-center gap-1.5">
                                                            <Shield className="w-4 h-4 text-slate-400" />
                                                            Escalation enabled
                                                        </span>
                                                    )}
                                                </div>
                                                {/* Role-specific indicator */}
                                                {agent.role === AgentRole.SALES_ASSISTANT && agent.leadSettings && (
                                                    <span className="text-xs px-2 py-1 rounded-full bg-amber-200/50 text-amber-700">
                                                        Lead qualification {agent.leadSettings.askNeed ? 'on' : 'off'}
                                                    </span>
                                                )}
                                                {agent.role === AgentRole.MARKETING_COMMS && agent.campaignSettings && (
                                                    <span className="text-xs px-2 py-1 rounded-full bg-purple-200/50 text-purple-700">
                                                        Campaigns {agent.campaignSettings.enableBirthday ? 'enabled' : 'disabled'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* How It Works Section */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6">
                            <h3 className="font-semibold text-slate-900 mb-4">How Agents Work with Your Inbox</h3>
                            <div className="grid sm:grid-cols-3 gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600 font-semibold text-sm">
                                        1
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">Customer Sends Message</p>
                                        <p className="text-xs text-slate-500 mt-0.5">Via WhatsApp, web chat, or other channels</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600 font-semibold text-sm">
                                        2
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">Agent Generates Reply</p>
                                        <p className="text-xs text-slate-500 mt-0.5">Using your business info & documents</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600 font-semibold text-sm">
                                        3
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">You Review & Send</p>
                                        <p className="text-xs text-slate-500 mt-0.5">Edit suggestions or send directly</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
