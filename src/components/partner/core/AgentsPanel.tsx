"use client";

import React, { useState, useMemo } from 'react';
import { usePartnerHub } from '@/hooks/use-partnerhub';
import {
    AgentRole,
    EssentialAgent,
    ChatContextType
} from '@/lib/partnerhub-types';
import { cn } from '@/lib/utils';
import {
    Bot,
    Zap,
    Sparkles,
    MessageCircle,
    FileText,
    Star,
    Settings,
    Play,
    BarChart3,
    ChevronRight,
    Shield,
    Send,
    Plus,
    Check
} from 'lucide-react';

interface AgentsPanelProps {
    onTestAgent?: (agentId: string) => void;
    onConfigureAgent?: (agent: EssentialAgent) => void;
}

// Default agent configurations for auto-creation
const DEFAULT_AGENTS: Omit<EssentialAgent, 'id' | 'partnerId' | 'createdAt' | 'updatedAt'>[] = [
    {
        role: AgentRole.CUSTOMER_CARE,
        name: 'Customer Care',
        description: 'Handle support inquiries from existing customers',
        avatar: 'Bot',
        businessName: '',
        tones: ['professional', 'empathetic'],
        style: 'conversational',
        responseLength: 'moderate',
        useAllDocuments: true,
        attachedDocumentIds: [],
        responseRules: [],
        neverSay: ['competitor names', 'unauthorized discounts', 'legal advice'],
        alwaysInclude: ['offer to help with anything else'],
        escalationSettings: {
            onHumanRequest: true,
            humanRequestKeywords: ['talk to human', 'speak to person', 'agent please', 'real person'],
            onFrustration: true,
            frustrationThreshold: 3,
            onNoAnswer: true,
            noAnswerAttempts: 2,
            onSensitiveTopics: true,
            sensitiveTopics: ['billing dispute', 'legal', 'complaint'],
            escalationMessage: "I want to make sure you get the best help possible. Let me connect you with a team member who can assist you further.",
        },
        conversationCount: 0,
        messageCount: 0,
        isActive: true,
        isDefault: true,
        temperature: 0.3,
    },
    {
        role: AgentRole.SALES_ASSISTANT,
        name: 'Sales Assistant',
        description: 'Qualify leads and help prospects find the right solution',
        avatar: 'Zap',
        businessName: '',
        tones: ['friendly', 'consultative'],
        style: 'conversational',
        responseLength: 'moderate',
        useAllDocuments: false,
        attachedDocumentIds: [],
        responseRules: [],
        neverSay: ['exact pricing without approval', 'competitor comparisons'],
        alwaysInclude: ['ask qualifying questions', 'offer demo or consultation'],
        escalationSettings: {
            onHumanRequest: true,
            humanRequestKeywords: ['talk to sales', 'sales team', 'speak to someone'],
            onFrustration: false,
            frustrationThreshold: 5,
            onNoAnswer: true,
            noAnswerAttempts: 3,
            onSensitiveTopics: false,
            sensitiveTopics: [],
            escalationMessage: "I'd love to connect you with our sales team for a personalized conversation. They can answer all your questions.",
        },
        leadSettings: {
            askBudget: true,
            budgetQuestion: "Do you have a budget range in mind for this?",
            askAuthority: true,
            authorityQuestion: "Who else would be involved in this decision?",
            askNeed: true,
            needQuestion: "What specific problem are you trying to solve?",
            askTimeline: true,
            timelineQuestion: "When are you looking to have this in place?",
            hotLeadAction: 'notify_email',
            warmLeadAction: 'add_pipeline',
            coldLeadAction: 'add_newsletter',
            products: [],
        },
        conversationCount: 0,
        messageCount: 0,
        isActive: true,
        isDefault: false,
        temperature: 0.5,
    },
    {
        role: AgentRole.MARKETING_COMMS,
        name: 'Marketing & Comms',
        description: 'Create campaigns, occasion greetings, and branded visuals',
        avatar: 'Sparkles',
        businessName: '',
        tones: ['creative', 'friendly'],
        style: 'casual',
        responseLength: 'moderate',
        useAllDocuments: false,
        attachedDocumentIds: [],
        responseRules: [],
        neverSay: ['offensive content', 'misleading claims'],
        alwaysInclude: ['brand voice consistency'],
        escalationSettings: {
            onHumanRequest: true,
            humanRequestKeywords: ['marketing team'],
            onFrustration: false,
            frustrationThreshold: 5,
            onNoAnswer: false,
            noAnswerAttempts: 3,
            onSensitiveTopics: false,
            sensitiveTopics: [],
            escalationMessage: "Let me connect you with our marketing team for this request.",
        },
        campaignSettings: {
            enableBirthday: true,
            birthdayDaysBefore: 1,
            birthdayChannel: 'whatsapp',
            birthdayIncludeOffer: true,
            enableAnniversary: false,
            enableWelcome: false,
            enableThankYou: false,
            holidays: [],
            brandColors: ['#4F46E5', '#10B981'],
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

export default function AgentsPanel({ onTestAgent, onConfigureAgent }: AgentsPanelProps) {
    const { documents, switchContext, customAgents, partnerId } = usePartnerHub();
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

    // Merge default agents with custom agents from Firestore
    const essentialAgents: EssentialAgent[] = useMemo(() => {
        return DEFAULT_AGENTS.map((defaultAgent) => {
            const id = `essential-${defaultAgent.role}`;
            // Find matching agent in customAgents (which are fetched from Firestore)
            const existingAgent = customAgents.find(a => a.id === id);

            if (existingAgent) {
                // Merge existing agent data
                // We cast to EssentialAgent because we know we saved it as such
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

    const getAgentIcon = (avatar: string) => {
        switch (avatar) {
            case 'Zap': return Zap;
            case 'Sparkles': return Sparkles;
            default: return Bot;
        }
    };

    const getAgentColors = (role: AgentRole) => {
        switch (role) {
            case AgentRole.CUSTOMER_CARE:
                return {
                    bg: 'bg-blue-500',
                    bgLight: 'bg-blue-50',
                    text: 'text-blue-600',
                    border: 'border-blue-200',
                    ring: 'ring-blue-500/20',
                };
            case AgentRole.SALES_ASSISTANT:
                return {
                    bg: 'bg-amber-500',
                    bgLight: 'bg-amber-50',
                    text: 'text-amber-600',
                    border: 'border-amber-200',
                    ring: 'ring-amber-500/20',
                };
            case AgentRole.MARKETING_COMMS:
                return {
                    bg: 'bg-purple-500',
                    bgLight: 'bg-purple-50',
                    text: 'text-purple-600',
                    border: 'border-purple-200',
                    ring: 'ring-purple-500/20',
                };
        }
    };

    const getAgentEmoji = (role: AgentRole) => {
        switch (role) {
            case AgentRole.CUSTOMER_CARE: return '🤖';
            case AgentRole.SALES_ASSISTANT: return '⚡';
            case AgentRole.MARKETING_COMMS: return '✨';
        }
    };

    const handleTestAgent = (agent: EssentialAgent) => {
        switchContext({
            type: ChatContextType.AGENT,
            id: agent.id,
            name: agent.name,
            description: agent.description,
        });
        onTestAgent?.(agent.id);
    };

    return (
        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-gray-50 to-slate-100/50 animate-in fade-in duration-300">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <span className="text-3xl">🤖</span> AI Agents
                        </h2>
                        <p className="text-gray-500 mt-1">
                            Three intelligent agents that work from day one, with zero configuration required.
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            // TODO: Open custom agent creation modal
                            alert('Custom Agent creation coming soon! 🚧\n\nFor now, configure the three essential agents to fit your needs.');
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg text-sm font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        Create Custom Agent
                    </button>
                </div>

                {/* Philosophy Banner */}
                <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-[1px]">
                    <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-6">
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center">
                                <Sparkles className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 mb-1">Works from Day One</h3>
                                <p className="text-sm text-gray-600">
                                    Your agents are already active and ready to help. Upload documents to make them smarter,
                                    or customize their behavior for a personalized experience.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-full">
                                    <Check className="w-3 h-3" /> Level 0 Active
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Agent Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {essentialAgents.map((agent) => {
                        const Icon = getAgentIcon(agent.avatar);
                        const colors = getAgentColors(agent.role);
                        const emoji = getAgentEmoji(agent.role);
                        const attachedDocs = agent.useAllDocuments
                            ? documents.length
                            : agent.attachedDocumentIds.length;

                        return (
                            <div
                                key={agent.id}
                                className={cn(
                                    "group bg-white rounded-2xl border shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden",
                                    colors.border,
                                    selectedAgentId === agent.id && `ring-2 ${colors.ring}`
                                )}
                            >
                                {/* Card Header */}
                                <div className={cn("px-6 pt-6 pb-4", colors.bgLight)}>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={cn(
                                            "w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg",
                                            colors.bg
                                        )}>
                                            <Icon className="w-7 h-7" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {agent.isActive && (
                                                <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                                    Active
                                                </span>
                                            )}
                                            {agent.isDefault && (
                                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                                                    Default
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <span>{emoji}</span> {agent.name}
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {agent.description}
                                    </p>
                                </div>

                                {/* Stats */}
                                <div className="px-6 py-4 border-t border-gray-100">
                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div>
                                            <div className={cn("flex items-center justify-center gap-1 text-sm font-semibold", colors.text)}>
                                                <FileText className="w-3.5 h-3.5" />
                                                {attachedDocs}
                                            </div>
                                            <div className="text-xs text-gray-500">documents</div>
                                        </div>
                                        <div>
                                            <div className={cn("flex items-center justify-center gap-1 text-sm font-semibold", colors.text)}>
                                                <MessageCircle className="w-3.5 h-3.5" />
                                                {agent.conversationCount}
                                            </div>
                                            <div className="text-xs text-gray-500">chats</div>
                                        </div>
                                        <div>
                                            <div className={cn("flex items-center justify-center gap-1 text-sm font-semibold", colors.text)}>
                                                <Star className="w-3.5 h-3.5" />
                                                {agent.rating?.toFixed(1) || '—'}
                                            </div>
                                            <div className="text-xs text-gray-500">rating</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Role-specific stats */}
                                {agent.role === AgentRole.MARKETING_COMMS && (
                                    <div className="px-6 py-3 bg-purple-50/50 border-t border-purple-100">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-purple-600 flex items-center gap-1">
                                                <Send className="w-3 h-3" /> 0 broadcasts
                                            </span>
                                            <span className="text-purple-600 flex items-center gap-1">
                                                🎂 0 greetings sent
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {agent.role === AgentRole.SALES_ASSISTANT && (
                                    <div className="px-6 py-3 bg-amber-50/50 border-t border-amber-100">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-amber-600 flex items-center gap-1">
                                                🔥 0 hot leads
                                            </span>
                                            <span className="text-amber-600 flex items-center gap-1">
                                                🟡 0 warm leads
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => onConfigureAgent?.(agent)}
                                            className={cn(
                                                "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl transition-all",
                                                "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                                            )}
                                        >
                                            <Settings className="w-4 h-4" />
                                            Configure
                                        </button>
                                        <button
                                            onClick={() => handleTestAgent(agent)}
                                            className={cn(
                                                "flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl transition-all",
                                                colors.bg, "text-white hover:opacity-90"
                                            )}
                                        >
                                            <Play className="w-4 h-4" />
                                            Test
                                        </button>
                                        <button
                                            className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                                        >
                                            <BarChart3 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Routing Info */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                            <Shield className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-2">Smart Message Routing</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Incoming messages are automatically routed to the right agent based on contact status and message intent.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl">
                                    <Bot className="w-5 h-5 text-blue-500" />
                                    <div>
                                        <div className="font-medium text-blue-900">Customers</div>
                                        <div className="text-xs text-blue-600">→ Customer Care</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl">
                                    <Zap className="w-5 h-5 text-amber-500" />
                                    <div>
                                        <div className="font-medium text-amber-900">Prospects</div>
                                        <div className="text-xs text-amber-600">→ Sales Assistant</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-xl">
                                    <Sparkles className="w-5 h-5 text-purple-500" />
                                    <div>
                                        <div className="font-medium text-purple-900">Campaigns</div>
                                        <div className="text-xs text-purple-600">→ Marketing & Comms</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                            Configure <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Quick Tips */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                        <div className="text-2xl mb-2">📚</div>
                        <h4 className="font-medium text-gray-900 text-sm mb-1">Upload Documents</h4>
                        <p className="text-xs text-gray-600">Add FAQs, policies, and guides to make your agents smarter.</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
                        <div className="text-2xl mb-2">🎯</div>
                        <h4 className="font-medium text-gray-900 text-sm mb-1">Test Thoroughly</h4>
                        <p className="text-xs text-gray-600">Try different scenarios before going live with customers.</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                        <div className="text-2xl mb-2">⚙️</div>
                        <h4 className="font-medium text-gray-900 text-sm mb-1">Customize Rules</h4>
                        <p className="text-xs text-gray-600">Add response rules and escalation triggers for edge cases.</p>
                    </div>
                </div>

            </div>
        </div>
    );
}
