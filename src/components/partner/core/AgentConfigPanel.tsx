"use client";

import React, { useState, useEffect } from 'react';
import {
    EssentialAgent,
    AgentRole,
    AgentTone,
    AgentStyle,
    AgentLength,
    ResponseRule,
} from '@/lib/partnerhub-types';
import { usePartnerHub } from '@/hooks/use-partnerhub';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { getBusinessPersonaAction } from '@/actions/business-persona-actions';
import { cn } from '@/lib/utils';
import {
    ArrowLeft,
    Bot,
    Zap,
    Sparkles,
    MessageSquare,
    AlertTriangle,
    Play,
    Save,
    Plus,
    X,
    FileText,
    Info,
    Building2,
    Trash2,
    Settings,
    Shield,
    Target,
    Calendar,
    Check,
    ExternalLink,
    Volume2,
    HeadphonesIcon,
    TrendingUp,
    Megaphone,
} from 'lucide-react';
import type { BusinessPersona } from '@/lib/business-persona-types';

interface AgentConfigPanelProps {
    agent: EssentialAgent;
    onBack: () => void;
    onSave?: (agent: EssentialAgent) => void;
    onTest?: () => void;
}

type ConfigTab = 'personality' | 'documents' | 'rules' | 'escalation' | 'advanced';

const TONE_OPTIONS: { value: AgentTone; label: string; description: string }[] = [
    { value: 'professional', label: 'Professional', description: 'Business-appropriate' },
    { value: 'friendly', label: 'Friendly', description: 'Warm and approachable' },
    { value: 'empathetic', label: 'Empathetic', description: 'Understanding tone' },
    { value: 'casual', label: 'Casual', description: 'Relaxed and informal' },
    { value: 'creative', label: 'Creative', description: 'Expressive style' },
];

const STYLE_OPTIONS: { value: AgentStyle; label: string; description: string }[] = [
    { value: 'formal', label: 'Formal', description: 'Professional language, no contractions' },
    { value: 'conversational', label: 'Conversational', description: 'Natural, like messaging a colleague' },
    { value: 'casual', label: 'Casual', description: 'Relaxed, may use informal expressions' },
];

const LENGTH_OPTIONS: { value: AgentLength; label: string; example: string }[] = [
    { value: 'brief', label: 'Brief', example: '1-2 sentences' },
    { value: 'moderate', label: 'Moderate', example: '2-4 sentences' },
    { value: 'detailed', label: 'Detailed', example: 'Full explanations' },
];

const AGENT_ICONS = {
    [AgentRole.CUSTOMER_CARE]: HeadphonesIcon,
    [AgentRole.SALES_ASSISTANT]: TrendingUp,
    [AgentRole.MARKETING_COMMS]: Megaphone,
    [AgentRole.CUSTOM]: Bot,
};

export default function AgentConfigPanel({ agent, onBack, onSave, onTest }: AgentConfigPanelProps) {
    const { documents } = usePartnerHub();
    const { currentWorkspace } = useMultiWorkspaceAuth();

    const [activeTab, setActiveTab] = useState<ConfigTab>('personality');
    const [editedAgent, setEditedAgent] = useState<EssentialAgent>(agent);
    const [hasChanges, setHasChanges] = useState(false);
    const [saving, setSaving] = useState(false);
    const [businessPersona, setBusinessPersona] = useState<BusinessPersona | null>(null);
    const [loadingPersona, setLoadingPersona] = useState(true);

    // Load business persona
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

    const updateAgent = (updates: Partial<EssentialAgent>) => {
        setEditedAgent(prev => ({ ...prev, ...updates }));
        setHasChanges(true);
    };

    const Icon = AGENT_ICONS[agent.role] || Bot;

    const tabs: { id: ConfigTab; label: string; icon: React.ReactNode }[] = [
        { id: 'personality', label: 'Personality', icon: <MessageSquare className="w-4 h-4" /> },
        { id: 'documents', label: 'Knowledge', icon: <FileText className="w-4 h-4" /> },
        { id: 'rules', label: 'Rules', icon: <Settings className="w-4 h-4" /> },
        { id: 'escalation', label: 'Escalation', icon: <Shield className="w-4 h-4" /> },
        ...(agent.role === AgentRole.SALES_ASSISTANT ? [{ id: 'advanced' as ConfigTab, label: 'Lead Capture', icon: <Target className="w-4 h-4" /> }] : []),
        ...(agent.role === AgentRole.MARKETING_COMMS ? [{ id: 'advanced' as ConfigTab, label: 'Campaigns', icon: <Calendar className="w-4 h-4" /> }] : []),
    ];

    const handleSave = async () => {
        setSaving(true);
        const updatedAgent = {
            ...editedAgent,
            updatedAt: new Date(),
        };
        await onSave?.(updatedAgent);
        setSaving(false);
        setHasChanges(false);
    };

    const addResponseRule = () => {
        const newRule: ResponseRule = {
            id: Date.now().toString(),
            triggerKeywords: [],
            response: '',
            escalateAfter: false,
        };
        updateAgent({ responseRules: [...editedAgent.responseRules, newRule] });
    };

    const updateResponseRule = (id: string, updates: Partial<ResponseRule>) => {
        updateAgent({
            responseRules: editedAgent.responseRules.map(rule =>
                rule.id === id ? { ...rule, ...updates } : rule
            ),
        });
    };

    const removeResponseRule = (id: string) => {
        updateAgent({ responseRules: editedAgent.responseRules.filter(rule => rule.id !== id) });
    };

    return (
        <div className="h-full flex flex-col bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-4 md:px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onBack}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-500" />
                        </button>
                        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-slate-900">{agent.name}</h1>
                            <p className="text-sm text-slate-500">{agent.description}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onTest}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <Play className="w-4 h-4" />
                            <span className="hidden sm:inline">Test</span>
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!hasChanges || saving}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                                hasChanges
                                    ? "bg-slate-900 text-white hover:bg-slate-800"
                                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                            )}
                        >
                            {saving ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save Changes'}</span>
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mt-4 overflow-x-auto pb-1 -mb-px">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 whitespace-nowrap transition-colors",
                                activeTab === tab.id
                                    ? "text-slate-900 border-slate-900 bg-slate-50"
                                    : "text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50"
                            )}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 md:p-6">
                <div className="max-w-3xl mx-auto space-y-6">

                    {/* Business Context Banner */}
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                                <Building2 className="w-5 h-5 text-slate-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="font-medium text-slate-900">
                                            Business: {businessPersona?.identity?.name || 'Not configured'}
                                        </p>
                                        <p className="text-sm text-slate-500 mt-0.5">
                                            Agent uses your business profile for context
                                        </p>
                                    </div>
                                    <a
                                        href="/partner/settings/dashboard"
                                        className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 whitespace-nowrap"
                                    >
                                        <Settings className="w-4 h-4" />
                                        Edit
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PERSONALITY TAB */}
                    {activeTab === 'personality' && (
                        <div className="space-y-6">
                            {/* Tone Selection */}
                            <div className="bg-white rounded-lg border border-slate-200 p-5">
                                <div className="flex items-center gap-2 mb-1">
                                    <Volume2 className="w-4 h-4 text-slate-700" />
                                    <h3 className="font-semibold text-slate-900">Voice & Tone</h3>
                                </div>
                                <p className="text-sm text-slate-500 mb-4">
                                    Select 1-3 personality traits that match your brand.
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {TONE_OPTIONS.map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => {
                                                const tones = editedAgent.tones.includes(option.value)
                                                    ? editedAgent.tones.filter(t => t !== option.value)
                                                    : editedAgent.tones.length < 3
                                                        ? [...editedAgent.tones, option.value]
                                                        : editedAgent.tones;
                                                updateAgent({ tones });
                                            }}
                                            className={cn(
                                                "flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-medium border transition-all text-left",
                                                editedAgent.tones.includes(option.value)
                                                    ? "bg-slate-900 border-slate-900 text-white"
                                                    : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                                            )}
                                        >
                                            <div>
                                                <span className="block">{option.label}</span>
                                                <span className={cn(
                                                    "block text-xs mt-0.5",
                                                    editedAgent.tones.includes(option.value) ? "text-slate-300" : "text-slate-400"
                                                )}>
                                                    {option.description}
                                                </span>
                                            </div>
                                            {editedAgent.tones.includes(option.value) && (
                                                <Check className="w-4 h-4 flex-shrink-0" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Style Selection */}
                            <div className="bg-white rounded-lg border border-slate-200 p-5">
                                <h3 className="font-semibold text-slate-900 mb-4">Communication Style</h3>
                                <div className="space-y-2">
                                    {STYLE_OPTIONS.map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => updateAgent({ style: option.value })}
                                            className={cn(
                                                "w-full p-4 rounded-lg border text-left transition-all",
                                                editedAgent.style === option.value
                                                    ? "bg-slate-50 border-slate-900"
                                                    : "bg-white border-slate-200 hover:border-slate-300"
                                            )}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className={cn(
                                                        "font-medium",
                                                        editedAgent.style === option.value ? "text-slate-900" : "text-slate-700"
                                                    )}>
                                                        {option.label}
                                                    </p>
                                                    <p className="text-sm text-slate-500 mt-0.5">{option.description}</p>
                                                </div>
                                                {editedAgent.style === option.value && (
                                                    <div className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center">
                                                        <Check className="w-3 h-3 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Response Length */}
                            <div className="bg-white rounded-lg border border-slate-200 p-5">
                                <h3 className="font-semibold text-slate-900 mb-4">Response Length</h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {LENGTH_OPTIONS.map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => updateAgent({ responseLength: option.value })}
                                            className={cn(
                                                "p-4 rounded-lg border text-center transition-all",
                                                editedAgent.responseLength === option.value
                                                    ? "bg-slate-900 border-slate-900 text-white"
                                                    : "bg-white border-slate-200 hover:border-slate-300"
                                            )}
                                        >
                                            <p className="font-medium">{option.label}</p>
                                            <p className={cn(
                                                "text-xs mt-1",
                                                editedAgent.responseLength === option.value ? "text-slate-300" : "text-slate-500"
                                            )}>
                                                {option.example}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* DOCUMENTS TAB */}
                    {activeTab === 'documents' && (
                        <div className="space-y-6">
                            <div className="bg-white rounded-lg border border-slate-200 p-5">
                                <div className="flex items-center gap-2 mb-1">
                                    <FileText className="w-4 h-4 text-slate-700" />
                                    <h3 className="font-semibold text-slate-900">Knowledge Base</h3>
                                </div>
                                <p className="text-sm text-slate-500 mb-4">
                                    Select which documents this agent can reference when responding.
                                </p>

                                {/* Use All Documents Toggle */}
                                <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors mb-4">
                                    <input
                                        type="checkbox"
                                        checked={editedAgent.useAllDocuments}
                                        onChange={(e) => updateAgent({ useAllDocuments: e.target.checked })}
                                        className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-slate-500"
                                    />
                                    <div>
                                        <p className="font-medium text-slate-900">Use all documents</p>
                                        <p className="text-sm text-slate-500">
                                            Agent will search all {documents.length} uploaded documents
                                        </p>
                                    </div>
                                </label>

                                {/* Individual Document Selection */}
                                {!editedAgent.useAllDocuments && (
                                    <div className="space-y-2 max-h-64 overflow-auto">
                                        {documents.length === 0 ? (
                                            <div className="text-center py-8 text-slate-500">
                                                <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                                                <p className="text-sm">No documents uploaded yet</p>
                                                <a href="/partner/documents" className="text-sm text-slate-700 hover:underline font-medium">
                                                    Upload documents
                                                </a>
                                            </div>
                                        ) : (
                                            documents.map(doc => (
                                                <label
                                                    key={doc.id}
                                                    className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={editedAgent.attachedDocumentIds.includes(doc.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                updateAgent({
                                                                    attachedDocumentIds: [...editedAgent.attachedDocumentIds, doc.id]
                                                                });
                                                            } else {
                                                                updateAgent({
                                                                    attachedDocumentIds: editedAgent.attachedDocumentIds.filter(id => id !== doc.id)
                                                                });
                                                            }
                                                        }}
                                                        className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-slate-500"
                                                    />
                                                    <FileText className="w-4 h-4 text-slate-400" />
                                                    <span className="text-sm text-slate-700 truncate">{doc.name}</span>
                                                </label>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* RULES TAB */}
                    {activeTab === 'rules' && (
                        <div className="space-y-6">
                            {/* Never Say */}
                            <div className="bg-white rounded-lg border border-slate-200 p-5">
                                <h3 className="font-semibold text-slate-900 mb-1">Phrases to avoid</h3>
                                <p className="text-sm text-slate-500 mb-4">Words or phrases your agent should never use</p>

                                <div className="space-y-2">
                                    {editedAgent.neverSay.map((item, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={item}
                                                onChange={(e) => {
                                                    const updated = [...editedAgent.neverSay];
                                                    updated[index] = e.target.value;
                                                    updateAgent({ neverSay: updated });
                                                }}
                                                placeholder="e.g., competitor names, specific phrases..."
                                                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-sm"
                                            />
                                            <button
                                                onClick={() => {
                                                    updateAgent({ neverSay: editedAgent.neverSay.filter((_, i) => i !== index) });
                                                }}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => updateAgent({ neverSay: [...editedAgent.neverSay, ''] })}
                                        className="text-sm text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add phrase
                                    </button>
                                </div>
                            </div>

                            {/* Always Include */}
                            <div className="bg-white rounded-lg border border-slate-200 p-5">
                                <h3 className="font-semibold text-slate-900 mb-1">Required mentions</h3>
                                <p className="text-sm text-slate-500 mb-4">Things your agent should mention when relevant</p>

                                <div className="space-y-2">
                                    {editedAgent.alwaysInclude.map((item, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={item}
                                                onChange={(e) => {
                                                    const updated = [...editedAgent.alwaysInclude];
                                                    updated[index] = e.target.value;
                                                    updateAgent({ alwaysInclude: updated });
                                                }}
                                                placeholder="e.g., contact info, website link..."
                                                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-sm"
                                            />
                                            <button
                                                onClick={() => {
                                                    updateAgent({ alwaysInclude: editedAgent.alwaysInclude.filter((_, i) => i !== index) });
                                                }}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => updateAgent({ alwaysInclude: [...editedAgent.alwaysInclude, ''] })}
                                        className="text-sm text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add phrase
                                    </button>
                                </div>
                            </div>

                            {/* Custom Response Rules */}
                            <div className="bg-white rounded-lg border border-slate-200 p-5">
                                <h3 className="font-semibold text-slate-900 mb-1">Custom response rules</h3>
                                <p className="text-sm text-slate-500 mb-4">Trigger specific responses for certain keywords</p>

                                <div className="space-y-4">
                                    {editedAgent.responseRules.map((rule) => (
                                        <div key={rule.id} className="bg-slate-50 rounded-lg p-4">
                                            <div className="flex items-start justify-between gap-2 mb-3">
                                                <div className="flex-1">
                                                    <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">
                                                        Trigger keywords
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={rule.triggerKeywords.join(', ')}
                                                        onChange={(e) => updateResponseRule(rule.id, {
                                                            triggerKeywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                                                        })}
                                                        placeholder="discount, promo, coupon"
                                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-sm"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => removeResponseRule(rule.id)}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded mt-5"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">
                                                    Response
                                                </label>
                                                <textarea
                                                    value={rule.response}
                                                    onChange={(e) => updateResponseRule(rule.id, { response: e.target.value })}
                                                    placeholder="Your response text..."
                                                    rows={2}
                                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-sm"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        onClick={addResponseRule}
                                        className="text-sm text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add rule
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ESCALATION TAB */}
                    {activeTab === 'escalation' && (
                        <div className="space-y-6">
                            <div className="bg-white rounded-lg border border-slate-200 p-4">
                                <div className="flex items-start gap-3">
                                    <Shield className="w-5 h-5 text-slate-600 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-slate-900">Human handoff triggers</p>
                                        <p className="text-sm text-slate-500 mt-0.5">
                                            Configure when the agent should escalate to your team.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
                                <label className="flex items-start gap-3 cursor-pointer p-4 hover:bg-slate-50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={editedAgent.escalationSettings.onHumanRequest}
                                        onChange={(e) => updateAgent({
                                            escalationSettings: {
                                                ...editedAgent.escalationSettings,
                                                onHumanRequest: e.target.checked
                                            }
                                        })}
                                        className="w-4 h-4 mt-0.5 text-slate-900 rounded border-slate-300 focus:ring-slate-500"
                                    />
                                    <div>
                                        <p className="font-medium text-slate-900">Customer requests human</p>
                                        <p className="text-sm text-slate-500">When they say "speak to a person", "human", etc.</p>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 cursor-pointer p-4 hover:bg-slate-50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={editedAgent.escalationSettings.onFrustration}
                                        onChange={(e) => updateAgent({
                                            escalationSettings: {
                                                ...editedAgent.escalationSettings,
                                                onFrustration: e.target.checked
                                            }
                                        })}
                                        className="w-4 h-4 mt-0.5 text-slate-900 rounded border-slate-300 focus:ring-slate-500"
                                    />
                                    <div>
                                        <p className="font-medium text-slate-900">Customer frustration detected</p>
                                        <p className="text-sm text-slate-500">AI detects repeated questions or negative sentiment</p>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 cursor-pointer p-4 hover:bg-slate-50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={editedAgent.escalationSettings.onNoAnswer}
                                        onChange={(e) => updateAgent({
                                            escalationSettings: {
                                                ...editedAgent.escalationSettings,
                                                onNoAnswer: e.target.checked
                                            }
                                        })}
                                        className="w-4 h-4 mt-0.5 text-slate-900 rounded border-slate-300 focus:ring-slate-500"
                                    />
                                    <div>
                                        <p className="font-medium text-slate-900">Unable to answer</p>
                                        <p className="text-sm text-slate-500">After {editedAgent.escalationSettings.noAnswerAttempts} attempts without a good answer</p>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 cursor-pointer p-4 hover:bg-slate-50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={editedAgent.escalationSettings.onSensitiveTopics}
                                        onChange={(e) => updateAgent({
                                            escalationSettings: {
                                                ...editedAgent.escalationSettings,
                                                onSensitiveTopics: e.target.checked
                                            }
                                        })}
                                        className="w-4 h-4 mt-0.5 text-slate-900 rounded border-slate-300 focus:ring-slate-500"
                                    />
                                    <div>
                                        <p className="font-medium text-slate-900">Sensitive topics</p>
                                        <p className="text-sm text-slate-500">
                                            {editedAgent.escalationSettings.sensitiveTopics.length > 0
                                                ? editedAgent.escalationSettings.sensitiveTopics.join(', ')
                                                : 'No topics configured'}
                                        </p>
                                    </div>
                                </label>
                            </div>

                            <div className="bg-white rounded-lg border border-slate-200 p-5">
                                <h3 className="font-semibold text-slate-900 mb-1">Escalation message</h3>
                                <p className="text-sm text-slate-500 mb-3">What the agent says when handing off to your team</p>
                                <textarea
                                    value={editedAgent.escalationSettings.escalationMessage}
                                    onChange={(e) => updateAgent({
                                        escalationSettings: {
                                            ...editedAgent.escalationSettings,
                                            escalationMessage: e.target.value
                                        }
                                    })}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900 text-sm"
                                    placeholder="Let me connect you with a team member who can help..."
                                />
                            </div>
                        </div>
                    )}

                    {/* ADVANCED TAB - Sales Lead Capture */}
                    {activeTab === 'advanced' && agent.role === AgentRole.SALES_ASSISTANT && (
                        <div className="space-y-6">
                            <div className="bg-white rounded-lg border border-slate-200 p-4">
                                <div className="flex items-start gap-3">
                                    <Target className="w-5 h-5 text-slate-600 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-slate-900">Lead Qualification</p>
                                        <p className="text-sm text-slate-500 mt-0.5">
                                            Configure questions to qualify potential customers.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
                                <label className="flex items-start gap-3 cursor-pointer p-4 hover:bg-slate-50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={editedAgent.leadSettings?.askNeed}
                                        onChange={(e) => updateAgent({
                                            leadSettings: {
                                                ...editedAgent.leadSettings!,
                                                askNeed: e.target.checked
                                            }
                                        })}
                                        className="w-4 h-4 mt-0.5 text-slate-900 rounded border-slate-300 focus:ring-slate-500"
                                    />
                                    <div className="flex-1">
                                        <p className="font-medium text-slate-900">Ask about needs</p>
                                        <input
                                            type="text"
                                            value={editedAgent.leadSettings?.needQuestion || ''}
                                            onChange={(e) => updateAgent({
                                                leadSettings: {
                                                    ...editedAgent.leadSettings!,
                                                    needQuestion: e.target.value
                                                }
                                            })}
                                            placeholder="What are you looking for today?"
                                            className="mt-2 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                                        />
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 cursor-pointer p-4 hover:bg-slate-50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={editedAgent.leadSettings?.askBudget}
                                        onChange={(e) => updateAgent({
                                            leadSettings: {
                                                ...editedAgent.leadSettings!,
                                                askBudget: e.target.checked
                                            }
                                        })}
                                        className="w-4 h-4 mt-0.5 text-slate-900 rounded border-slate-300 focus:ring-slate-500"
                                    />
                                    <div>
                                        <p className="font-medium text-slate-900">Ask about budget</p>
                                        <p className="text-sm text-slate-500">Understand their spending capacity</p>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 cursor-pointer p-4 hover:bg-slate-50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={editedAgent.leadSettings?.askTimeline}
                                        onChange={(e) => updateAgent({
                                            leadSettings: {
                                                ...editedAgent.leadSettings!,
                                                askTimeline: e.target.checked
                                            }
                                        })}
                                        className="w-4 h-4 mt-0.5 text-slate-900 rounded border-slate-300 focus:ring-slate-500"
                                    />
                                    <div>
                                        <p className="font-medium text-slate-900">Ask about timeline</p>
                                        <p className="text-sm text-slate-500">When they need the product/service</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* ADVANCED TAB - Marketing Campaigns */}
                    {activeTab === 'advanced' && agent.role === AgentRole.MARKETING_COMMS && (
                        <div className="space-y-6">
                            <div className="bg-white rounded-lg border border-slate-200 p-4">
                                <div className="flex items-start gap-3">
                                    <Calendar className="w-5 h-5 text-slate-600 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-slate-900">Campaign Settings</p>
                                        <p className="text-sm text-slate-500 mt-0.5">
                                            Configure automated messages for special occasions.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
                                <label className="flex items-start gap-3 cursor-pointer p-4 hover:bg-slate-50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={editedAgent.campaignSettings?.enableBirthday}
                                        onChange={(e) => updateAgent({
                                            campaignSettings: {
                                                ...editedAgent.campaignSettings!,
                                                enableBirthday: e.target.checked
                                            }
                                        })}
                                        className="w-4 h-4 mt-0.5 text-slate-900 rounded border-slate-300 focus:ring-slate-500"
                                    />
                                    <div>
                                        <p className="font-medium text-slate-900">Birthday wishes</p>
                                        <p className="text-sm text-slate-500">Send personalized birthday messages</p>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 cursor-pointer p-4 hover:bg-slate-50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={editedAgent.campaignSettings?.enableWelcome}
                                        onChange={(e) => updateAgent({
                                            campaignSettings: {
                                                ...editedAgent.campaignSettings!,
                                                enableWelcome: e.target.checked
                                            }
                                        })}
                                        className="w-4 h-4 mt-0.5 text-slate-900 rounded border-slate-300 focus:ring-slate-500"
                                    />
                                    <div>
                                        <p className="font-medium text-slate-900">Welcome messages</p>
                                        <p className="text-sm text-slate-500">Greet new contacts automatically</p>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 cursor-pointer p-4 hover:bg-slate-50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={editedAgent.campaignSettings?.enableThankYou}
                                        onChange={(e) => updateAgent({
                                            campaignSettings: {
                                                ...editedAgent.campaignSettings!,
                                                enableThankYou: e.target.checked
                                            }
                                        })}
                                        className="w-4 h-4 mt-0.5 text-slate-900 rounded border-slate-300 focus:ring-slate-500"
                                    />
                                    <div>
                                        <p className="font-medium text-slate-900">Thank you messages</p>
                                        <p className="text-sm text-slate-500">After purchases or interactions</p>
                                    </div>
                                </label>
                            </div>

                            <div className="bg-white rounded-lg border border-slate-200 p-5">
                                <h3 className="font-semibold text-slate-900 mb-4">Quiet Hours</h3>
                                <p className="text-sm text-slate-500 mb-3">Don't send messages during these hours</p>
                                <div className="flex items-center gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">From</label>
                                        <input
                                            type="time"
                                            value={editedAgent.campaignSettings?.quietHoursStart || '21:00'}
                                            onChange={(e) => updateAgent({
                                                campaignSettings: {
                                                    ...editedAgent.campaignSettings!,
                                                    quietHoursStart: e.target.value
                                                }
                                            })}
                                            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">To</label>
                                        <input
                                            type="time"
                                            value={editedAgent.campaignSettings?.quietHoursEnd || '08:00'}
                                            onChange={(e) => updateAgent({
                                                campaignSettings: {
                                                    ...editedAgent.campaignSettings!,
                                                    quietHoursEnd: e.target.value
                                                }
                                            })}
                                            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
