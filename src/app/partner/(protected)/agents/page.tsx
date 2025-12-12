"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { usePartnerHub } from '@/hooks/use-partnerhub';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { useToast } from '@/hooks/use-toast';
import { getBusinessPersonaAction } from '@/actions/business-persona-actions';
import { cn } from '@/lib/utils';
import {
    Bot,
    Zap,
    Sparkles,
    Settings,
    Play,
    MessageCircle,
    FileText,
    Shield,
    Building2,
    CheckCircle2,
    Sliders,
    ToggleLeft,
    ToggleRight,
    Clock,
    Phone,
    Globe,
    Lightbulb,
    ArrowUpRight,
    Mail,
    MapPin,
    Plus,
    Star,
    Wand2,
    ChevronRight,
    Trash2,
    Copy,
    MoreVertical,
    Briefcase,
    Users,
    HeadphonesIcon,
    TrendingUp,
    Megaphone,
} from 'lucide-react';
import { AgentRole, EssentialAgent } from '@/lib/partnerhub-types';
import AgentConfigPanel from '@/components/partner/core/AgentConfigPanel';
import AgentTestPanel from '@/components/partner/core/AgentTestPanel';
import type { BusinessPersona, IndustryCategory } from '@/lib/business-persona-types';
import {
    getAgentTemplatesForIndustry,
    getCustomAgentSuggestionsForIndustry,
    getAgentTemplate,
    createBlankCustomAgent,
    mapVoiceTonesToAgentTones,
    BASE_AGENT_TEMPLATES,
    AgentTemplate,
} from '@/lib/business-type-agents';

// Agent visual info mapping
const AGENT_VISUALS = {
    [AgentRole.CUSTOMER_CARE]: {
        icon: HeadphonesIcon,
        color: 'blue',
        gradient: 'from-blue-500 to-blue-600',
        bgLight: 'bg-blue-50',
        bgDark: 'bg-blue-500',
        text: 'text-blue-600',
        border: 'border-blue-200',
        ring: 'ring-blue-500/20',
    },
    [AgentRole.SALES_ASSISTANT]: {
        icon: TrendingUp,
        color: 'amber',
        gradient: 'from-amber-500 to-orange-500',
        bgLight: 'bg-amber-50',
        bgDark: 'bg-amber-500',
        text: 'text-amber-600',
        border: 'border-amber-200',
        ring: 'ring-amber-500/20',
    },
    [AgentRole.MARKETING_COMMS]: {
        icon: Megaphone,
        color: 'purple',
        gradient: 'from-purple-500 to-pink-500',
        bgLight: 'bg-purple-50',
        bgDark: 'bg-purple-500',
        text: 'text-purple-600',
        border: 'border-purple-200',
        ring: 'ring-purple-500/20',
    },
    [AgentRole.CUSTOM]: {
        icon: Bot,
        color: 'slate',
        gradient: 'from-indigo-500 to-violet-500',
        bgLight: 'bg-indigo-50',
        bgDark: 'bg-indigo-500',
        text: 'text-indigo-600',
        border: 'border-indigo-200',
        ring: 'ring-indigo-500/20',
    },
};

type PageView = 'list' | 'configure' | 'create';

export default function AgentsPage() {
    const { documents, customAgents, partnerId, saveEssentialAgent, deleteAgent } = usePartnerHub();
    const { currentWorkspace } = useMultiWorkspaceAuth();
    const { toast } = useToast();
    const [pageView, setPageView] = useState<PageView>('list');
    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
    const [testingAgent, setTestingAgent] = useState<EssentialAgent | null>(null);
    const [businessPersona, setBusinessPersona] = useState<BusinessPersona | null>(null);
    const [loadingPersona, setLoadingPersona] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creatingFromTemplate, setCreatingFromTemplate] = useState<AgentTemplate | null>(null);

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

    // Get industry category from business persona
    const industryCategory: IndustryCategory = useMemo(() => {
        return businessPersona?.identity?.industry?.category || 'other';
    }, [businessPersona]);

    // Get industry-specific agent templates
    const industryAgentTemplates = useMemo(() => {
        return getAgentTemplatesForIndustry(industryCategory);
    }, [industryCategory]);

    // Get custom agent suggestions for the industry
    const customAgentSuggestions = useMemo(() => {
        return getCustomAgentSuggestionsForIndustry(industryCategory);
    }, [industryCategory]);

    // Build essential agents from templates + saved configurations
    const essentialAgents: EssentialAgent[] = useMemo(() => {
        // Map industry templates to EssentialAgents
        const templateAgents = industryAgentTemplates.map((template) => {
            const id = `essential-${template.role}`;
            const existingAgent = customAgents.find(a => a.id === id);

            if (existingAgent) {
                // Use saved agent with template defaults as fallback
                return {
                    ...existingAgent,
                    id,
                } as EssentialAgent;
            }

            // Create new agent from template
            return {
                id,
                partnerId: partnerId || 'current',
                role: template.role as AgentRole,
                name: template.name,
                description: template.description,
                avatar: template.avatar,
                businessName: businessPersona?.identity?.name || 'Your Business',
                tones: businessPersona?.personality?.voiceTone
                    ? mapVoiceTonesToAgentTones(businessPersona.personality.voiceTone)
                    : template.tones,
                style: template.style,
                responseLength: template.responseLength,
                useAllDocuments: template.role === AgentRole.SALES_ASSISTANT,
                attachedDocumentIds: [],
                responseRules: [],
                neverSay: [],
                alwaysInclude: [],
                escalationSettings: template.escalationSettings,
                leadSettings: template.leadSettings,
                campaignSettings: template.campaignSettings,
                conversationCount: 0,
                messageCount: 0,
                isActive: true,
                isDefault: false,
                isCustomAgent: false,
                temperature: 0.7,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as EssentialAgent;
        });

        // Add any custom agents the user has created
        const userCustomAgents = customAgents.filter(a =>
            a.isCustomAgent || a.role === AgentRole.CUSTOM
        );

        return [...templateAgents, ...userCustomAgents];
    }, [industryAgentTemplates, customAgents, partnerId, businessPersona]);

    const selectedAgent = selectedAgentId ? essentialAgents.find(a => a.id === selectedAgentId) : null;

    const handleConfigureAgent = (agent: EssentialAgent) => {
        setSelectedAgentId(agent.id);
        setPageView('configure');
    };

    const handleSaveAgent = async (updatedAgent: EssentialAgent) => {
        const result = await saveEssentialAgent(updatedAgent);
        if (result.success) {
            toast({ title: 'Agent Saved', description: 'Your changes have been saved successfully.' });
        } else {
            toast({ variant: 'destructive', title: 'Save Failed', description: result.error || 'Failed to save agent configuration.' });
        }
    };

    const handleToggleActive = async (agent: EssentialAgent, isActive: boolean) => {
        const updated = { ...agent, isActive, updatedAt: new Date() };
        const result = await saveEssentialAgent(updated);
        if (!result.success) {
            toast({ variant: 'destructive', title: 'Update Failed', description: result.error || 'Failed to update agent status.' });
        }
    };

    const handleCreateCustomAgent = async (name: string, description: string, template?: AgentTemplate) => {
        const baseTemplate = template || createBlankCustomAgent();
        const newAgent: EssentialAgent = {
            id: `custom-${Date.now()}`,
            partnerId: partnerId || 'current',
            role: AgentRole.CUSTOM,
            name: name,
            description: description,
            avatar: 'Bot',
            businessName: businessPersona?.identity?.name || 'Your Business',
            tones: businessPersona?.personality?.voiceTone
                ? mapVoiceTonesToAgentTones(businessPersona.personality.voiceTone)
                : baseTemplate.tones,
            style: baseTemplate.style,
            responseLength: baseTemplate.responseLength,
            useAllDocuments: false,
            attachedDocumentIds: [],
            responseRules: [],
            neverSay: [],
            alwaysInclude: [],
            escalationSettings: baseTemplate.escalationSettings,
            conversationCount: 0,
            messageCount: 0,
            isActive: true,
            isDefault: false,
            isCustomAgent: true,
            temperature: 0.7,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await saveEssentialAgent(newAgent);
        if (result.success) {
            toast({ title: 'Agent Created', description: `${name} has been created successfully.` });
            setShowCreateModal(false);
            setCreatingFromTemplate(null);
            // Open configure panel for the new agent
            setSelectedAgentId(newAgent.id);
            setPageView('configure');
        } else {
            toast({ variant: 'destructive', title: 'Creation Failed', description: result.error || 'Failed to create agent.' });
        }
    };

    const handleDeleteAgent = async (agent: EssentialAgent) => {
        if (!agent.isCustomAgent) {
            toast({ variant: 'destructive', title: 'Cannot Delete', description: 'Default agents cannot be deleted.' });
            return;
        }

        if (deleteAgent) {
            const result = await deleteAgent(agent.id);
            if (result.success) {
                toast({ title: 'Agent Deleted', description: `${agent.name} has been removed.` });
            } else {
                toast({ variant: 'destructive', title: 'Delete Failed', description: result.error || 'Failed to delete agent.' });
            }
        }
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

    // Separate standard and custom agents
    const standardAgents = essentialAgents.filter(a => !a.isCustomAgent);
    const userCustomAgents = essentialAgents.filter(a => a.isCustomAgent);

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

            {/* Create Agent Modal */}
            {showCreateModal && (
                <CreateAgentModal
                    onClose={() => { setShowCreateModal(false); setCreatingFromTemplate(null); }}
                    onCreate={handleCreateCustomAgent}
                    template={creatingFromTemplate}
                    suggestions={customAgentSuggestions}
                />
            )}

            <div className="h-full flex flex-col bg-slate-50">
                {/* Header */}
                <div className="bg-white border-b border-slate-200 px-6 py-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-semibold text-slate-900">AI Agents</h1>
                            <p className="text-slate-500 text-sm mt-0.5">
                                {hasBusinessProfile && businessPersona?.identity?.industry?.name
                                    ? `Agents configured for ${businessPersona.identity.industry.name}`
                                    : 'Specialized AI assistants for your inbox and customer conversations'
                                }
                            </p>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Create Agent
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    <div className="p-6 space-y-6 max-w-5xl mx-auto">

                        {/* Business Context Banner */}
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
                                                        ? `Agents are configured for "${businessName}" (${businessPersona?.identity?.industry?.name || 'General Business'}).`
                                                        : 'Your agents need business information to respond accurately. Set up your profile in Settings first.'
                                                    }
                                                </p>

                                                {/* Quick Business Info Preview */}
                                                {hasBusinessProfile && (
                                                    <div className="flex flex-wrap gap-3 mt-3">
                                                        {businessPersona?.identity?.industry?.name && (
                                                            <span className="inline-flex items-center gap-1.5 text-xs bg-white/60 px-2.5 py-1 rounded-full text-emerald-700">
                                                                <Briefcase className="w-3 h-3" />
                                                                {businessPersona.identity.industry.name}
                                                            </span>
                                                        )}
                                                        {businessPhone && (
                                                            <span className="inline-flex items-center gap-1.5 text-xs bg-white/60 px-2.5 py-1 rounded-full text-emerald-700">
                                                                <Phone className="w-3 h-3" />
                                                                {businessPhone}
                                                            </span>
                                                        )}
                                                        {businessPersona?.identity?.email && (
                                                            <span className="inline-flex items-center gap-1.5 text-xs bg-white/60 px-2.5 py-1 rounded-full text-emerald-700">
                                                                <Mail className="w-3 h-3" />
                                                                {businessPersona.identity.email}
                                                            </span>
                                                        )}
                                                        {businessHours?.isOpen24x7 ? (
                                                            <span className="inline-flex items-center gap-1.5 text-xs bg-white/60 px-2.5 py-1 rounded-full text-emerald-700">
                                                                <Clock className="w-3 h-3" />
                                                                Open 24/7
                                                            </span>
                                                        ) : businessHours?.appointmentOnly ? (
                                                            <span className="inline-flex items-center gap-1.5 text-xs bg-white/60 px-2.5 py-1 rounded-full text-emerald-700">
                                                                <Clock className="w-3 h-3" />
                                                                By Appointment
                                                            </span>
                                                        ) : businessHours?.onlineAlways ? (
                                                            <span className="inline-flex items-center gap-1.5 text-xs bg-white/60 px-2.5 py-1 rounded-full text-emerald-700">
                                                                <Clock className="w-3 h-3" />
                                                                Online 24/7
                                                            </span>
                                                        ) : businessHours?.schedule ? (
                                                            <span className="inline-flex items-center gap-1.5 text-xs bg-white/60 px-2.5 py-1 rounded-full text-emerald-700">
                                                                <Clock className="w-3 h-3" />
                                                                Hours configured
                                                            </span>
                                                        ) : null}
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
                                    ? 'Agent settings are pre-configured based on your business type. Customize them as needed.'
                                    : 'Complete your business profile so agents can accurately represent your business.'
                                }
                            </div>
                        </div>

                        {/* Recommended Agents Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Star className="w-4 h-4 text-amber-500" />
                                    <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
                                        Recommended for {businessPersona?.identity?.industry?.name || 'Your Business'}
                                    </h2>
                                </div>
                                <span className="text-xs text-slate-500">
                                    {standardAgents.filter(a => a.isActive).length} of {standardAgents.length} active
                                </span>
                            </div>

                            <div className="grid gap-4">
                                {standardAgents.map((agent) => (
                                    <AgentCard
                                        key={agent.id}
                                        agent={agent}
                                        visuals={AGENT_VISUALS[agent.role] || AGENT_VISUALS[AgentRole.CUSTOM]}
                                        docCount={getDocumentCount(agent)}
                                        onConfigure={() => handleConfigureAgent(agent)}
                                        onTest={() => setTestingAgent(agent)}
                                        onToggleActive={(isActive) => handleToggleActive(agent, isActive)}
                                        onDelete={undefined}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Custom Agents Section */}
                        {(userCustomAgents.length > 0 || customAgentSuggestions.length > 0) && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Wand2 className="w-4 h-4 text-indigo-500" />
                                        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
                                            Custom Agents
                                        </h2>
                                    </div>
                                    {userCustomAgents.length > 0 && (
                                        <span className="text-xs text-slate-500">
                                            {userCustomAgents.filter(a => a.isActive).length} of {userCustomAgents.length} active
                                        </span>
                                    )}
                                </div>

                                {/* Existing custom agents */}
                                {userCustomAgents.length > 0 && (
                                    <div className="grid gap-4">
                                        {userCustomAgents.map((agent) => (
                                            <AgentCard
                                                key={agent.id}
                                                agent={agent}
                                                visuals={AGENT_VISUALS[AgentRole.CUSTOM]}
                                                docCount={getDocumentCount(agent)}
                                                onConfigure={() => handleConfigureAgent(agent)}
                                                onTest={() => setTestingAgent(agent)}
                                                onToggleActive={(isActive) => handleToggleActive(agent, isActive)}
                                                onDelete={() => handleDeleteAgent(agent)}
                                                isCustom
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Suggested custom agents */}
                                {customAgentSuggestions.length > 0 && (
                                    <div className="mt-4">
                                        <p className="text-xs text-slate-500 mb-3">
                                            Suggested for your industry:
                                        </p>
                                        <div className="grid sm:grid-cols-2 gap-3">
                                            {customAgentSuggestions.map((suggestion, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => {
                                                        setCreatingFromTemplate({
                                                            ...createBlankCustomAgent(),
                                                            id: `suggestion-${idx}`,
                                                            name: suggestion.name,
                                                            description: suggestion.description,
                                                            useCases: suggestion.useCases,
                                                        } as AgentTemplate);
                                                        setShowCreateModal(true);
                                                    }}
                                                    className="flex items-center gap-3 p-3 bg-white border border-dashed border-slate-300 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/50 transition-all text-left group"
                                                >
                                                    <div className="w-10 h-10 rounded-lg bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center flex-shrink-0 transition-colors">
                                                        <Plus className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-slate-700 group-hover:text-indigo-700">
                                                            {suggestion.name}
                                                        </p>
                                                        <p className="text-xs text-slate-500 truncate">
                                                            {suggestion.description}
                                                        </p>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Create from scratch CTA */}
                                {userCustomAgents.length === 0 && customAgentSuggestions.length === 0 && (
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        className="w-full flex items-center justify-center gap-3 p-6 bg-white border-2 border-dashed border-slate-300 rounded-xl hover:border-indigo-400 hover:bg-indigo-50/50 transition-all"
                                    >
                                        <Plus className="w-5 h-5 text-slate-400" />
                                        <span className="text-slate-600 font-medium">Create a custom agent from scratch</span>
                                    </button>
                                )}
                            </div>
                        )}

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

// ============================================================================
// AGENT CARD COMPONENT
// ============================================================================

interface AgentCardProps {
    agent: EssentialAgent;
    visuals: typeof AGENT_VISUALS[AgentRole.CUSTOMER_CARE];
    docCount: number;
    onConfigure: () => void;
    onTest: () => void;
    onToggleActive: (isActive: boolean) => void;
    onDelete?: () => void;
    isCustom?: boolean;
}

function AgentCard({
    agent,
    visuals,
    docCount,
    onConfigure,
    onTest,
    onToggleActive,
    onDelete,
    isCustom,
}: AgentCardProps) {
    const Icon = visuals.icon;

    return (
        <div
            className={cn(
                "bg-white rounded-2xl border-2 overflow-hidden transition-all hover:shadow-lg",
                agent.isActive ? visuals.border : "border-slate-200 opacity-75"
            )}
        >
            <div className="p-5">
                <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br",
                        agent.isActive ? visuals.gradient : "from-slate-400 to-slate-500"
                    )}>
                        <Icon className="w-7 h-7 text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-semibold text-slate-900">{agent.name}</h3>
                                    {isCustom && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                                            Custom
                                        </span>
                                    )}
                                    {/* Active Toggle */}
                                    <button
                                        onClick={() => onToggleActive(!agent.isActive)}
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
                                    onClick={onTest}
                                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <Play className="w-4 h-4" />
                                    Test
                                </button>
                                <button
                                    onClick={onConfigure}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                                        `bg-gradient-to-r ${visuals.gradient} text-white hover:shadow-md`
                                    )}
                                >
                                    <Sliders className="w-4 h-4" />
                                    Configure
                                </button>
                                {isCustom && onDelete && (
                                    <button
                                        onClick={onDelete}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete agent"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Best For & Use Cases - only for standard agents */}
                        {!isCustom && agent.role !== AgentRole.CUSTOM && (
                            <div className="mt-4 grid sm:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                        Best for
                                    </h4>
                                    <p className={cn("text-sm font-medium", visuals.text)}>
                                        {BASE_AGENT_TEMPLATES[agent.role]?.bestFor || 'General customer interactions'}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                        Handles
                                    </h4>
                                    <div className="flex flex-wrap gap-1.5">
                                        {(BASE_AGENT_TEMPLATES[agent.role]?.useCases || []).slice(0, 3).map((useCase, i) => (
                                            <span
                                                key={i}
                                                className={cn(
                                                    "text-xs px-2 py-0.5 rounded-full",
                                                    visuals.bgLight, visuals.text
                                                )}
                                            >
                                                {useCase}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className={cn("px-5 py-3 border-t flex items-center justify-between", visuals.bgLight)}>
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
}

// ============================================================================
// CREATE AGENT MODAL
// ============================================================================

interface CreateAgentModalProps {
    onClose: () => void;
    onCreate: (name: string, description: string, template?: AgentTemplate) => void;
    template?: AgentTemplate | null;
    suggestions: { name: string; description: string; useCases: string[] }[];
}

function CreateAgentModal({ onClose, onCreate, template, suggestions }: CreateAgentModalProps) {
    const [name, setName] = useState(template?.name || '');
    const [description, setDescription] = useState(template?.description || '');
    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = async () => {
        if (!name.trim()) return;
        setIsCreating(true);
        await onCreate(name.trim(), description.trim(), template || undefined);
        setIsCreating(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-900">
                        {template ? `Create "${template.name}"` : 'Create Custom Agent'}
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                        {template
                            ? 'Customize this agent for your specific needs'
                            : 'Build an agent tailored to your requirements'
                        }
                    </p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Agent Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Appointment Scheduler"
                            className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What does this agent help with?"
                            rows={3}
                            className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                        />
                    </div>

                    {template?.useCases && template.useCases.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Suggested Use Cases
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {template.useCases.map((useCase, i) => (
                                    <span
                                        key={i}
                                        className="text-xs px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700"
                                    >
                                        {useCase}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quick suggestions if no template */}
                    {!template && suggestions.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Or start from a suggestion:
                            </label>
                            <div className="space-y-2">
                                {suggestions.slice(0, 3).map((suggestion, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            setName(suggestion.name);
                                            setDescription(suggestion.description);
                                        }}
                                        className="w-full text-left p-3 border border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors"
                                    >
                                        <p className="text-sm font-medium text-slate-700">{suggestion.name}</p>
                                        <p className="text-xs text-slate-500">{suggestion.description}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={!name.trim() || isCreating}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isCreating ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Plus className="w-4 h-4" />
                                Create Agent
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
