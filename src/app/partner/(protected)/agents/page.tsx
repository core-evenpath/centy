"use client";

import React, { useState, useMemo } from 'react';
import { usePartnerHub } from '@/hooks/use-partnerhub';
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
    FileText,
    ArrowLeft,
    Users,
    TrendingUp,
    Clock,
    Shield,
    Target,
    Brain
} from 'lucide-react';
import { AgentRole, EssentialAgent } from '@/lib/partnerhub-types';
import AgentConfigPanel from '@/components/partner/core/AgentConfigPanel';
import AgentTestPanel from '@/components/partner/core/AgentTestPanel';

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
        gradient: 'from-blue-500 to-blue-600',
        bgLight: 'bg-blue-50',
        bgDark: 'bg-blue-500',
        text: 'text-blue-600',
        border: 'border-blue-200',
        examples: [
            'Where is my order?',
            'How do I return this?',
            'I need help with my account'
        ],
        capabilities: [
            { icon: MessageCircle, text: 'Answer support questions' },
            { icon: FileText, text: 'Reference your documents' },
            { icon: Shield, text: 'Handle complaints professionally' },
            { icon: Users, text: 'Escalate to human when needed' },
        ],
        whatItDoes: 'Handles support questions, checks order status, explains policies, and knows when to escalate complex issues to your team.',
    },
    [AgentRole.SALES_ASSISTANT]: {
        icon: Zap,
        color: 'amber',
        gradient: 'from-amber-500 to-orange-500',
        bgLight: 'bg-amber-50',
        bgDark: 'bg-amber-500',
        text: 'text-amber-600',
        border: 'border-amber-200',
        examples: [
            'What do you sell?',
            'How much does it cost?',
            'Tell me about your services'
        ],
        capabilities: [
            { icon: Target, text: 'Qualify leads automatically' },
            { icon: MessageCircle, text: 'Answer product questions' },
            { icon: TrendingUp, text: 'Share pricing & packages' },
            { icon: Users, text: 'Capture contact info' },
        ],
        whatItDoes: 'Answers questions about your products/services, shares pricing information, and identifies potential customers for follow-up.',
    },
    [AgentRole.MARKETING_COMMS]: {
        icon: Sparkles,
        color: 'purple',
        gradient: 'from-purple-500 to-pink-500',
        bgLight: 'bg-purple-50',
        bgDark: 'bg-purple-500',
        text: 'text-purple-600',
        border: 'border-purple-200',
        examples: [
            '🎂 Birthday messages',
            '🎁 Special offers',
            '📢 New arrival alerts'
        ],
        capabilities: [
            { icon: Sparkles, text: 'Send birthday wishes' },
            { icon: Target, text: 'Promote special offers' },
            { icon: Clock, text: 'Scheduled campaigns' },
            { icon: Users, text: 'Personalized outreach' },
        ],
        whatItDoes: 'Sends personalized messages for birthdays, promotions, and updates to keep your customers engaged and coming back.',
    },
};

type PageView = 'list' | 'configure';

export default function AgentsPage() {
    const { documents, customAgents, partnerId, saveEssentialAgent } = usePartnerHub();
    const [pageView, setPageView] = useState<PageView>('list');
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
    const [testingAgent, setTestingAgent] = useState<EssentialAgent | null>(null);

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

    const selectedAgent = selectedAgentId ? essentialAgents.find(a => a.id === selectedAgentId) : null;

    const getSetupProgress = (agent: EssentialAgent) => {
        let completed = 0;
        let total = 3;

        if (agent.businessName && agent.businessName !== 'Your Business') completed++;
        if (agent.useAllDocuments || agent.attachedDocumentIds.length > 0) completed++;
        if (agent.responseRules.length > 0 || agent.neverSay.length > 0) completed++;

        return { completed, total, percentage: Math.round((completed / total) * 100) };
    };

    const getDocumentCount = (agent: EssentialAgent) => {
        if (agent.useAllDocuments) return documents.length;
        return agent.attachedDocumentIds.length;
    };

    const handleConfigureAgent = (agent: EssentialAgent) => {
        setSelectedAgentId(agent.id);
        setPageView('configure');
    };

    const handleSaveAgent = async (updatedAgent: EssentialAgent) => {
        await saveEssentialAgent(updatedAgent);
    };

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
                <div className="bg-white border-b border-slate-200 px-6 py-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-semibold text-slate-900">AI Assistants</h1>
                            <p className="text-slate-500 text-sm mt-0.5">
                                Configure how your AI responds to different types of conversations
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    <div className="p-6 space-y-6">
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                                    <Brain className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold">How AI Assistants Work</h2>
                                    <p className="text-indigo-100 mt-1">
                                        Each assistant is optimized for specific conversations. They share your documents
                                        but have different personalities and goals. Configure each one to match your business style.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-4">
                            {essentialAgents.map((agent) => {
                                const info = AGENT_INFO[agent.role];
                                const Icon = info.icon;
                                const progress = getSetupProgress(agent);
                                const docCount = getDocumentCount(agent);

                                return (
                                    <div
                                        key={agent.id}
                                        className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
                                    >
                                        <div className="p-6">
                                            <div className="flex items-start gap-5">
                                                <div className={cn(
                                                    "w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br flex-shrink-0",
                                                    info.gradient
                                                )}>
                                                    <Icon className="w-8 h-8 text-white" />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div>
                                                            <div className="flex items-center gap-3">
                                                                <h3 className="text-lg font-semibold text-slate-900">{agent.name}</h3>
                                                                <span className={cn(
                                                                    "text-xs px-2.5 py-1 rounded-full font-medium",
                                                                    agent.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                                                                )}>
                                                                    {agent.isActive ? 'Active' : 'Inactive'}
                                                                </span>
                                                            </div>
                                                            <p className="text-slate-500 mt-1">{agent.description}</p>
                                                        </div>

                                                        <button
                                                            onClick={() => handleConfigureAgent(agent)}
                                                            className={cn(
                                                                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
                                                                `bg-gradient-to-r ${info.gradient} text-white hover:shadow-md`
                                                            )}
                                                        >
                                                            <Settings className="w-4 h-4" />
                                                            Configure
                                                        </button>
                                                    </div>

                                                    <div className="grid sm:grid-cols-2 gap-6 mt-6">
                                                        <div>
                                                            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                                                                What it does
                                                            </h4>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                {info.capabilities.map((cap, i) => (
                                                                    <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                                                                        <cap.icon className={cn("w-4 h-4 flex-shrink-0", info.text)} />
                                                                        <span>{cap.text}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                                                                Example messages
                                                            </h4>
                                                            <div className="space-y-1.5">
                                                                {info.examples.map((ex, i) => (
                                                                    <div key={i} className={cn(
                                                                        "text-sm px-3 py-1.5 rounded-lg",
                                                                        info.bgLight, info.text
                                                                    )}>
                                                                        "{ex}"
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className={cn("px-6 py-4 border-t", info.bgLight)}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-6">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center gap-1">
                                                            {[...Array(progress.total)].map((_, i) => (
                                                                <div
                                                                    key={i}
                                                                    className={cn(
                                                                        "w-2.5 h-2.5 rounded-full",
                                                                        i < progress.completed ? info.bgDark : "bg-slate-200"
                                                                    )}
                                                                />
                                                            ))}
                                                        </div>
                                                        <span className="text-sm text-slate-600 ml-2">
                                                            {progress.completed}/{progress.total} setup
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                                        <FileText className="w-4 h-4 text-slate-400" />
                                                        {docCount} document{docCount !== 1 ? 's' : ''} connected
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => setTestingAgent(agent)}
                                                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-white rounded-lg transition-colors"
                                                >
                                                    <Play className="w-4 h-4" />
                                                    Test
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 p-6">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                                    <HelpCircle className="w-5 h-5 text-slate-500" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900">Need a custom assistant?</h3>
                                    <p className="text-slate-500 text-sm mt-1">
                                        These three cover most business needs. If you need something specialized,
                                        you can customize any assistant's behavior in its settings.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}