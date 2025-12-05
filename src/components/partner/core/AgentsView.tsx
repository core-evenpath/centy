"use client";

import React, { useState, useMemo } from 'react';
import { usePartnerHub } from '@/hooks/use-partnerhub';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    Bot,
    Zap,
    Sparkles,
    Play,
    Settings2,
    FileText,
    ChevronRight,
    MessageCircle,
    CheckCircle2,
    AlertCircle,
    ToggleLeft,
    ToggleRight,
    ExternalLink
} from 'lucide-react';
import { AgentRole, EssentialAgent, ChatContextType, ProcessingStatus } from '@/lib/partnerhub-types';
import { ScrollArea } from '@/components/ui/scroll-area';
import AgentConfigPanel from '@/components/partner/core/AgentConfigPanel';
import { saveEssentialAgentAction } from '@/actions/partnerhub-actions';
import { toast } from 'sonner';

const DEFAULT_AGENTS: Omit<EssentialAgent, 'id' | 'partnerId' | 'createdAt' | 'updatedAt'>[] = [
    {
        role: AgentRole.CUSTOMER_CARE,
        name: 'Customer Support',
        description: 'Answers questions from existing customers using your uploaded documents',
        avatar: 'Bot',
        businessName: '',
        tones: ['professional', 'empathetic'],
        style: 'conversational',
        responseLength: 'moderate',
        useAllDocuments: true,
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
            escalationMessage: "Let me connect you with a team member who can help.",
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
        description: 'Helps potential customers learn about your products and services',
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
            escalationMessage: "I'd be happy to have someone reach out to you!",
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
        description: 'Creates and sends personalized messages, birthday wishes, and promotions',
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

const AGENT_STYLES = {
    [AgentRole.CUSTOMER_CARE]: {
        icon: Bot,
        gradient: 'from-blue-500 to-cyan-500',
        bgLight: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-600',
        ringColor: 'ring-blue-500/20',
        useCases: ['FAQs & Help', 'Order Status', 'Account Issues'],
    },
    [AgentRole.SALES_ASSISTANT]: {
        icon: Zap,
        gradient: 'from-amber-500 to-orange-500',
        bgLight: 'bg-amber-50',
        borderColor: 'border-amber-200',
        textColor: 'text-amber-600',
        ringColor: 'ring-amber-500/20',
        useCases: ['Product Info', 'Pricing', 'Lead Capture'],
    },
    [AgentRole.MARKETING_COMMS]: {
        icon: Sparkles,
        gradient: 'from-violet-500 to-purple-500',
        bgLight: 'bg-violet-50',
        borderColor: 'border-violet-200',
        textColor: 'text-violet-600',
        ringColor: 'ring-violet-500/20',
        useCases: ['Birthdays', 'Promotions', 'Updates'],
    },
};

export default function AgentsView() {
    const router = useRouter();
    const { documents, customAgents, partnerId, switchContext } = usePartnerHub();
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
    const [savingId, setSavingId] = useState<string | null>(null);

    const completedDocs = useMemo(() =>
        documents.filter(d => d.status === ProcessingStatus.COMPLETED).length,
        [documents]
    );

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
                businessName: '',
                createdAt: new Date(),
                updatedAt: new Date(),
            };
        });
    }, [customAgents, partnerId]);

    const selectedAgent = selectedAgentId ? essentialAgents.find(a => a.id === selectedAgentId) : null;

    const getDocumentCount = (agent: EssentialAgent) => {
        if (agent.useAllDocuments) return completedDocs;
        return agent.attachedDocumentIds.filter(id =>
            documents.some(d => d.id === id && d.status === ProcessingStatus.COMPLETED)
        ).length;
    };

    const getSetupStatus = (agent: EssentialAgent) => {
        const hasBusinessName = agent.businessName && agent.businessName.trim() !== '';
        const hasDocuments = agent.useAllDocuments ? completedDocs > 0 : agent.attachedDocumentIds.length > 0;

        if (hasBusinessName && hasDocuments) return 'configured';
        if (hasDocuments) return 'partial';
        return 'basic';
    };

    const handleSaveAgent = async (updatedAgent: EssentialAgent) => {
        if (!partnerId) {
            toast.error('No partner ID found');
            return;
        }

        setSavingId(updatedAgent.id);
        try {
            const result = await saveEssentialAgentAction(partnerId, updatedAgent);
            if (result.success) {
                toast.success('Agent saved successfully');
            } else {
                toast.error(result.error || 'Failed to save agent');
            }
        } catch (error) {
            toast.error('Failed to save agent');
        } finally {
            setSavingId(null);
        }
    };

    const handleTestAgent = (agent: EssentialAgent) => {
        switchContext({
            type: ChatContextType.AGENT,
            id: agent.id,
            name: agent.name,
            description: agent.description,
        });
        router.push('/partner/inbox');
    };

    const handleToggleActive = async (agent: EssentialAgent, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!partnerId) return;

        const updatedAgent = { ...agent, isActive: !agent.isActive };
        setSavingId(agent.id);
        try {
            const result = await saveEssentialAgentAction(partnerId, updatedAgent);
            if (result.success) {
                toast.success(updatedAgent.isActive ? 'Agent activated' : 'Agent deactivated');
            }
        } catch (error) {
            toast.error('Failed to update agent');
        } finally {
            setSavingId(null);
        }
    };

    if (selectedAgent) {
        return (
            <AgentConfigPanel
                agent={selectedAgent}
                onBack={() => setSelectedAgentId(null)}
                onSave={handleSaveAgent}
                onTest={() => handleTestAgent(selectedAgent)}
            />
        );
    }

    return (
        <div className="h-full flex flex-col">
            <ScrollArea className="flex-1">
                <div className="p-5 space-y-4 max-w-4xl">
                    <div className="mb-6">
                        <p className="text-sm text-slate-500">
                            These AI assistants are ready to help your customers. They use your uploaded documents to answer questions accurately.
                            {completedDocs === 0 && (
                                <span className="text-amber-600 ml-1">
                                    Upload documents in the Documents tab to make them smarter.
                                </span>
                            )}
                        </p>
                    </div>

                    {essentialAgents.map((agent) => {
                        const style = AGENT_STYLES[agent.role];
                        const Icon = style.icon;
                        const docCount = getDocumentCount(agent);
                        const status = getSetupStatus(agent);
                        const isSaving = savingId === agent.id;

                        return (
                            <div
                                key={agent.id}
                                className={cn(
                                    "bg-white rounded-2xl border overflow-hidden transition-all hover:shadow-lg",
                                    agent.isActive ? style.borderColor : "border-slate-200 opacity-75"
                                )}
                            >
                                <div className="p-5">
                                    <div className="flex items-start gap-4">
                                        <div className={cn(
                                            "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br shadow-lg",
                                            style.gradient
                                        )}>
                                            <Icon className="w-7 h-7 text-white" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <div className="flex items-center gap-2.5">
                                                        <h3 className="font-semibold text-slate-900 text-lg">{agent.name}</h3>
                                                        <button
                                                            onClick={(e) => handleToggleActive(agent, e)}
                                                            disabled={isSaving}
                                                            className={cn(
                                                                "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full transition-colors",
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
                                                    <p className="text-sm text-slate-500 mt-1">{agent.description}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 mt-4">
                                                <div className={cn(
                                                    "flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg",
                                                    style.bgLight
                                                )}>
                                                    <FileText className={cn("w-4 h-4", style.textColor)} />
                                                    <span className={cn("font-medium", style.textColor)}>
                                                        {docCount} {docCount === 1 ? 'document' : 'documents'}
                                                    </span>
                                                </div>

                                                {status === 'configured' && (
                                                    <div className="flex items-center gap-1.5 text-sm text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        <span className="font-medium">Configured</span>
                                                    </div>
                                                )}

                                                {status === 'basic' && docCount === 0 && (
                                                    <div className="flex items-center gap-1.5 text-sm text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg">
                                                        <AlertCircle className="w-4 h-4" />
                                                        <span className="font-medium">Needs documents</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap gap-2 mt-4">
                                                {style.useCases.map((useCase, i) => (
                                                    <span
                                                        key={i}
                                                        className="text-xs px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md"
                                                    >
                                                        {useCase}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 px-5 py-3 bg-slate-50/50 flex items-center justify-between">
                                    <button
                                        onClick={() => handleTestAgent(agent)}
                                        disabled={!agent.isActive}
                                        className={cn(
                                            "flex items-center gap-2 text-sm font-medium transition-colors",
                                            agent.isActive
                                                ? "text-slate-600 hover:text-slate-900"
                                                : "text-slate-400 cursor-not-allowed"
                                        )}
                                    >
                                        <Play className="w-4 h-4" />
                                        Test in Inbox
                                        <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
                                    </button>

                                    <button
                                        onClick={() => setSelectedAgentId(agent.id)}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                            style.bgLight,
                                            style.textColor,
                                            "hover:opacity-80"
                                        )}
                                    >
                                        <Settings2 className="w-4 h-4" />
                                        Configure
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    <div className="mt-8 p-5 bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl border border-slate-200">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center">
                                <MessageCircle className="w-5 h-5 text-slate-500" />
                            </div>
                            <div>
                                <h4 className="font-medium text-slate-700">How agents work</h4>
                                <p className="text-sm text-slate-500 mt-1">
                                    When customers message you, AI routes their question to the right assistant.
                                    The assistant searches your documents for relevant information and crafts a helpful response.
                                    Complex issues are escalated to your team automatically.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}