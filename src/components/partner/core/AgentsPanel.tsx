"use client";

import React, { useState, useMemo } from 'react';
import { usePartnerHub } from '@/hooks/use-partnerhub';
import {
    AgentRole,
    EssentialAgent,
} from '@/lib/partnerhub-types';
import { cn } from '@/lib/utils';
import {
    Bot,
    Zap,
    Sparkles,
    Settings,
    Play,
    MessageCircle,
    ChevronRight,
    CheckCircle2,
    Circle,
    HelpCircle,
    FileText
} from 'lucide-react';

interface AgentsPanelProps {
    onTestAgent?: (agentId: string) => void;
    onConfigureAgent?: (agent: EssentialAgent) => void;
}

const DEFAULT_AGENTS: Omit<EssentialAgent, 'id' | 'partnerId' | 'createdAt' | 'updatedAt'>[] = [
    {
        role: AgentRole.CUSTOMER_CARE,
        name: 'Customer Support',
        description: 'Answers questions from your existing customers',
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
        bgLight: 'bg-blue-50',
        bgDark: 'bg-blue-500',
        text: 'text-blue-600',
        border: 'border-blue-200',
        examples: [
            '"Where is my order?"',
            '"How do I return this?"',
            '"I need help with..."'
        ],
        whatItDoes: 'Handles support questions, checks order status, explains policies, and escalates complex issues to your team.',
    },
    [AgentRole.SALES_ASSISTANT]: {
        icon: Zap,
        color: 'amber',
        bgLight: 'bg-amber-50',
        bgDark: 'bg-amber-500',
        text: 'text-amber-600',
        border: 'border-amber-200',
        examples: [
            '"What do you sell?"',
            '"How much does it cost?"',
            '"Tell me about..."'
        ],
        whatItDoes: 'Answers questions about your products/services, shares pricing, and identifies potential customers for follow-up.',
    },
    [AgentRole.MARKETING_COMMS]: {
        icon: Sparkles,
        color: 'purple',
        bgLight: 'bg-purple-50',
        bgDark: 'bg-purple-500',
        text: 'text-purple-600',
        border: 'border-purple-200',
        examples: [
            'Birthday messages',
            'Special offers',
            'New arrival alerts'
        ],
        whatItDoes: 'Sends personalized messages for birthdays, promotions, and updates to keep customers engaged.',
    },
};

export default function AgentsPanel({ onTestAgent, onConfigureAgent }: AgentsPanelProps) {
    const { documents, customAgents, partnerId } = usePartnerHub();
    const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

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
                businessName: 'Your Business',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
        });
    }, [customAgents, partnerId]);

    const getSetupProgress = (agent: EssentialAgent) => {
        let completed = 0;
        let total = 3;

        if (agent.businessName && agent.businessName !== 'Your Business') completed++;
        if (agent.useAllDocuments || agent.attachedDocumentIds.length > 0) completed++;
        if (agent.responseRules.length > 0 || agent.neverSay.length > 0) completed++;

        return { completed, total };
    };

    const getDocumentCount = (agent: EssentialAgent) => {
        if (agent.useAllDocuments) return documents.length;
        return agent.attachedDocumentIds.length;
    };

    return (
        <div className="flex-1 overflow-auto p-4 md:p-6">
            <div className="max-w-4xl mx-auto space-y-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <HelpCircle className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="font-medium text-gray-900">What are AI Assistants?</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                These are different "personalities" your AI uses depending on the situation.
                                Each one is optimized for a specific type of conversation. Click on any assistant to customize it for your business.
                            </p>
                        </div>
                    </div>
                </div>

                {essentialAgents.map((agent) => {
                    const info = AGENT_INFO[agent.role];
                    const Icon = info.icon;
                    const progress = getSetupProgress(agent);
                    const isExpanded = expandedAgent === agent.id;
                    const docCount = getDocumentCount(agent);

                    return (
                        <div
                            key={agent.id}
                            className={cn(
                                "bg-white rounded-xl border transition-all",
                                isExpanded ? `${info.border} shadow-md` : "border-gray-200 hover:border-gray-300"
                            )}
                        >
                            <div
                                className="p-4 cursor-pointer"
                                onClick={() => setExpandedAgent(isExpanded ? null : agent.id)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", info.bgLight)}>
                                        <Icon className={cn("w-6 h-6", info.text)} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                                            <span className={cn(
                                                "text-xs px-2 py-0.5 rounded-full",
                                                agent.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                                            )}>
                                                {agent.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-0.5">{agent.description}</p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
                                            <FileText className="w-3.5 h-3.5" />
                                            <span>{docCount} doc{docCount !== 1 ? 's' : ''}</span>
                                        </div>
                                        <div className="hidden sm:flex items-center gap-1">
                                            {[...Array(progress.total)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={cn(
                                                        "w-2 h-2 rounded-full",
                                                        i < progress.completed ? info.bgDark : "bg-gray-200"
                                                    )}
                                                />
                                            ))}
                                        </div>
                                        <ChevronRight className={cn(
                                            "w-5 h-5 text-gray-400 transition-transform",
                                            isExpanded && "rotate-90"
                                        )} />
                                    </div>
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="px-4 pb-4 border-t border-gray-100">
                                    <div className="pt-4 grid sm:grid-cols-2 gap-4">
                                        <div>
                                            <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                                                What it handles
                                            </h4>
                                            <p className="text-sm text-gray-600">{info.whatItDoes}</p>

                                            <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 mt-4">
                                                Example messages it responds to
                                            </h4>
                                            <div className="space-y-1">
                                                {info.examples.map((ex, i) => (
                                                    <div key={i} className="flex items-center gap-2 text-sm text-gray-500">
                                                        <MessageCircle className="w-3.5 h-3.5 text-gray-300" />
                                                        {ex}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                                                Setup checklist
                                            </h4>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-sm">
                                                    {agent.businessName && agent.businessName !== 'Your Business' ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                    ) : (
                                                        <Circle className="w-4 h-4 text-gray-300" />
                                                    )}
                                                    <span className={agent.businessName && agent.businessName !== 'Your Business' ? 'text-gray-700' : 'text-gray-400'}>
                                                        Add business info & FAQs
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    {agent.useAllDocuments || agent.attachedDocumentIds.length > 0 ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                    ) : (
                                                        <Circle className="w-4 h-4 text-gray-300" />
                                                    )}
                                                    <span className={agent.useAllDocuments || agent.attachedDocumentIds.length > 0 ? 'text-gray-700' : 'text-gray-400'}>
                                                        Connect documents ({docCount} connected)
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    {agent.responseRules.length > 0 || agent.neverSay.length > 0 ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                    ) : (
                                                        <Circle className="w-4 h-4 text-gray-300" />
                                                    )}
                                                    <span className={agent.responseRules.length > 0 || agent.neverSay.length > 0 ? 'text-gray-700' : 'text-gray-400'}>
                                                        Set response guidelines
                                                    </span>
                                                </div>
                                            </div>

                                            {agent.role === AgentRole.CUSTOMER_CARE && !agent.useAllDocuments && agent.attachedDocumentIds.length === 0 && (
                                                <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                                                    <p className="text-xs text-amber-700">
                                                        💡 Tip: Connect documents so this assistant can answer questions about your policies, FAQs, etc.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onConfigureAgent?.(agent);
                                            }}
                                            className={cn(
                                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                                info.bgLight, info.text
                                            )}
                                        >
                                            <Settings className="w-4 h-4" />
                                            Configure
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onTestAgent?.(agent.id);
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                                        >
                                            <Play className="w-4 h-4" />
                                            Test it
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}