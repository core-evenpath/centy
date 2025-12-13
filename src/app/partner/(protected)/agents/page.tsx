"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { usePartnerHub } from '@/hooks/use-partnerhub';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { useToast } from '@/hooks/use-toast';
import { getBusinessPersonaAction } from '@/actions/business-persona-actions';
import { cn } from '@/lib/utils';
import {
    Bot,
    Settings,
    Building2,
    Plus,
    ChevronRight,
    ExternalLink,
    Briefcase,
    Clock,
    Phone,
    Mail,
    Info,
} from 'lucide-react';
import { AgentRole, EssentialAgent } from '@/lib/partnerhub-types';
import AgentConfigPanel from '@/components/partner/core/AgentConfigPanel';
import AgentTestPanel from '@/components/partner/core/AgentTestPanel';
import AgentsPanel from '@/components/partner/core/AgentsPanel';
import type { BusinessPersona, IndustryCategory } from '@/lib/business-persona-types';
import {
    getAgentTemplatesForIndustry,
    getCustomAgentSuggestionsForIndustry,
    createBlankCustomAgent,
    mapVoiceTonesToAgentTones,
    BASE_AGENT_TEMPLATES,
    AgentTemplate,
} from '@/lib/business-type-agents';

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
                    ...template, // Ensure default fields exist
                    ...(existingAgent as unknown as Partial<EssentialAgent>), // Override with saved data
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
        const customMappedAgents = customAgents
            .filter(a => a.type === 'custom' || a.id.startsWith('custom-'))
            .map(profile => ({
                id: profile.id,
                partnerId: profile.partnerId,
                role: AgentRole.CUSTOM,
                name: profile.name,
                description: profile.description,
                avatar: profile.avatar || 'Bot',
                isCustomAgent: true,
                businessName: businessPersona?.identity?.name || 'Your Business',
                tones: ['professional'] as any,
                style: 'conversational' as any,
                responseLength: 'moderate' as any,
                useAllDocuments: false,
                attachedDocumentIds: profile.knowledgeDocIds || [],
                responseRules: [],
                neverSay: [],
                alwaysInclude: [],
                escalationSettings: BASE_AGENT_TEMPLATES[AgentRole.CUSTOM]?.escalationSettings || BASE_AGENT_TEMPLATES[AgentRole.CUSTOMER_CARE].escalationSettings,
                conversationCount: profile.usageCount || 0,
                messageCount: 0,
                isActive: profile.isActive,
                isDefault: profile.isDefault,
                temperature: profile.temperature,
                createdAt: profile.createdAt instanceof Date ? profile.createdAt : new Date(),
                updatedAt: profile.updatedAt instanceof Date ? profile.updatedAt : new Date(),
            } as EssentialAgent));

        return [...templateAgents, ...customMappedAgents];
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
        if (!name.trim()) {
            toast({ variant: 'destructive', title: 'Name Required', description: 'Please enter a name for your agent.' });
            return;
        }

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
                                    ? `Configured for ${businessPersona.identity.industry.name}`
                                    : 'AI assistants for customer conversations'
                                }
                            </p>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
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
                            "rounded-lg border overflow-hidden",
                            hasBusinessProfile
                                ? "bg-white border-slate-200"
                                : "bg-amber-50 border-amber-200"
                        )}>
                            <div className="p-4">
                                <div className="flex items-start gap-4">
                                    <div className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                                        hasBusinessProfile ? "bg-slate-100" : "bg-amber-100"
                                    )}>
                                        <Building2 className={cn(
                                            "w-5 h-5",
                                            hasBusinessProfile ? "text-slate-600" : "text-amber-600"
                                        )} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h2 className={cn(
                                                    "font-medium",
                                                    hasBusinessProfile ? "text-slate-900" : "text-amber-900"
                                                )}>
                                                    {hasBusinessProfile ? 'Business Profile Connected' : 'Set Up Your Business Profile'}
                                                </h2>
                                                <p className={cn(
                                                    "text-sm mt-0.5",
                                                    hasBusinessProfile ? "text-slate-500" : "text-amber-700"
                                                )}>
                                                    {hasBusinessProfile
                                                        ? `Agents are configured for "${businessName}" (${businessPersona?.identity?.industry?.name || 'General'}).`
                                                        : 'Your agents need business information to respond accurately.'
                                                    }
                                                </p>

                                                {/* Quick Business Info Preview */}
                                                {hasBusinessProfile && (
                                                    <div className="flex flex-wrap gap-2 mt-3">
                                                        {businessPersona?.identity?.industry?.name && (
                                                            <span className="inline-flex items-center gap-1.5 text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
                                                                <Briefcase className="w-3 h-3" />
                                                                {businessPersona.identity.industry.name}
                                                            </span>
                                                        )}
                                                        {businessPhone && (
                                                            <span className="inline-flex items-center gap-1.5 text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
                                                                <Phone className="w-3 h-3" />
                                                                {businessPhone}
                                                            </span>
                                                        )}
                                                        {businessPersona?.identity?.email && (
                                                            <span className="inline-flex items-center gap-1.5 text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
                                                                <Mail className="w-3 h-3" />
                                                                {businessPersona.identity.email}
                                                            </span>
                                                        )}
                                                        {businessHours?.isOpen24x7 ? (
                                                            <span className="inline-flex items-center gap-1.5 text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
                                                                <Clock className="w-3 h-3" />
                                                                Open 24/7
                                                            </span>
                                                        ) : businessHours?.appointmentOnly ? (
                                                            <span className="inline-flex items-center gap-1.5 text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
                                                                <Clock className="w-3 h-3" />
                                                                By Appointment
                                                            </span>
                                                        ) : businessHours?.onlineAlways ? (
                                                            <span className="inline-flex items-center gap-1.5 text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
                                                                <Clock className="w-3 h-3" />
                                                                Online 24/7
                                                            </span>
                                                        ) : businessHours?.schedule ? (
                                                            <span className="inline-flex items-center gap-1.5 text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">
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
                                                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0",
                                                    hasBusinessProfile
                                                        ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                                        : "bg-amber-600 text-white hover:bg-amber-700"
                                                )}
                                            >
                                                <Settings className="w-4 h-4" />
                                                {hasBusinessProfile ? 'Edit' : 'Set Up'}
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recommended Agents Section */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-medium text-slate-700">
                                    Recommended Agents
                                </h2>
                                <span className="text-xs text-slate-500">
                                    {standardAgents.filter(a => a.isActive).length} of {standardAgents.length} active
                                </span>
                            </div>

                            <AgentsPanel
                                agents={standardAgents}
                                onConfigureAgent={handleConfigureAgent}
                                onTestAgent={(agent) => setTestingAgent(agent)}
                                onToggleActive={handleToggleActive}
                            />
                        </div>

                        {/* Custom Agents Section */}
                        {(userCustomAgents.length > 0 || customAgentSuggestions.length > 0) && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-sm font-medium text-slate-700">
                                        Custom Agents
                                    </h2>
                                    {userCustomAgents.length > 0 && (
                                        <span className="text-xs text-slate-500">
                                            {userCustomAgents.filter(a => a.isActive).length} of {userCustomAgents.length} active
                                        </span>
                                    )}
                                </div>

                                {/* Existing custom agents */}
                                {userCustomAgents.length > 0 && (
                                    <AgentsPanel
                                        agents={userCustomAgents}
                                        onConfigureAgent={handleConfigureAgent}
                                        onTestAgent={(agent) => setTestingAgent(agent)}
                                        onToggleActive={handleToggleActive}
                                        onDeleteAgent={handleDeleteAgent}
                                        isCustomSection
                                    />
                                )}

                                {/* Suggested custom agents */}
                                {customAgentSuggestions.length > 0 && (
                                    <div className="mt-4">
                                        <p className="text-xs text-slate-500 mb-2">
                                            Suggested for your industry:
                                        </p>
                                        <div className="grid sm:grid-cols-2 gap-2">
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
                                                    className="flex items-center gap-3 p-3 bg-white border border-dashed border-slate-300 rounded-lg hover:border-slate-400 hover:bg-slate-50 transition-all text-left group"
                                                >
                                                    <div className="w-9 h-9 rounded-lg bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center flex-shrink-0 transition-colors">
                                                        <Plus className="w-4 h-4 text-slate-500" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-slate-700">
                                                            {suggestion.name}
                                                        </p>
                                                        <p className="text-xs text-slate-500 truncate">
                                                            {suggestion.description}
                                                        </p>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-slate-400" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Create from scratch CTA */}
                                {userCustomAgents.length === 0 && customAgentSuggestions.length === 0 && (
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        className="w-full flex items-center justify-center gap-3 p-5 bg-white border border-dashed border-slate-300 rounded-lg hover:border-slate-400 hover:bg-slate-50 transition-all"
                                    >
                                        <Plus className="w-5 h-5 text-slate-400" />
                                        <span className="text-slate-600 font-medium">Create a custom agent</span>
                                    </button>
                                )}
                            </div>
                        )}

                        {/* How It Works Section */}
                        <div className="bg-white rounded-lg border border-slate-200 p-5">
                            <h3 className="font-medium text-slate-900 mb-4">How Agents Work</h3>
                            <div className="grid sm:grid-cols-3 gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-700 font-medium text-sm">
                                        1
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">Customer Message</p>
                                        <p className="text-xs text-slate-500 mt-0.5">Via WhatsApp, web chat, or other channels</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-700 font-medium text-sm">
                                        2
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">Agent Generates Reply</p>
                                        <p className="text-xs text-slate-500 mt-0.5">Using your business info & documents</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-700 font-medium text-sm">
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
    const [error, setError] = useState<string | null>(null);

    const handleCreate = async () => {
        if (!name.trim()) {
            setError('Please enter a name for your agent');
            return;
        }
        setError(null);
        setIsCreating(true);
        await onCreate(name.trim(), description.trim(), template || undefined);
        setIsCreating(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
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
                            Agent Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                if (error) setError(null);
                            }}
                            placeholder="e.g., Appointment Scheduler"
                            className={cn(
                                "w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent",
                                error ? "border-red-300" : "border-slate-200"
                            )}
                            autoFocus
                        />
                        {error && (
                            <p className="text-xs text-red-600 mt-1">{error}</p>
                        )}
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
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none"
                        />
                    </div>

                    {template?.useCases && template.useCases.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Use Cases
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                                {template.useCases.map((useCase, i) => (
                                    <span
                                        key={i}
                                        className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-600"
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
                                        className="w-full text-left p-3 border border-slate-200 rounded-lg hover:border-slate-300 hover:bg-slate-50 transition-colors"
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
                        className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
