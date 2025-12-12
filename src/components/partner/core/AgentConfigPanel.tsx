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
    ChevronDown,
    ChevronUp,
    Trash2,
    MessageCircle,
    Settings,
    Sliders,
    Shield,
    Target,
    Calendar,
    CheckCircle2,
    ExternalLink,
    Volume2,
    Clock,
} from 'lucide-react';
import type { BusinessPersona } from '@/lib/business-persona-types';

interface AgentConfigPanelProps {
    agent: EssentialAgent;
    onBack: () => void;
    onSave?: (agent: EssentialAgent) => void;
    onTest?: () => void;
}

type ConfigTab = 'personality' | 'documents' | 'rules' | 'escalation' | 'advanced';

const TONE_OPTIONS: { value: AgentTone; label: string; emoji: string }[] = [
    { value: 'professional', label: 'Professional', emoji: '👔' },
    { value: 'friendly', label: 'Friendly', emoji: '😊' },
    { value: 'empathetic', label: 'Empathetic', emoji: '💙' },
    { value: 'casual', label: 'Casual', emoji: '✌️' },
    { value: 'creative', label: 'Creative', emoji: '✨' },
];

const STYLE_OPTIONS: { value: AgentStyle; label: string; description: string }[] = [
    { value: 'formal', label: 'Formal', description: 'Professional language, no contractions' },
    { value: 'conversational', label: 'Conversational', description: 'Natural, like messaging a friend' },
    { value: 'casual', label: 'Casual', description: 'Relaxed, may use emoji' },
];

const LENGTH_OPTIONS: { value: AgentLength; label: string; example: string }[] = [
    { value: 'brief', label: 'Brief', example: '1-2 sentences' },
    { value: 'moderate', label: 'Moderate', example: '2-4 sentences' },
    { value: 'detailed', label: 'Detailed', example: 'Full explanations' },
];

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

    const getAgentIcon = () => {
        switch (agent.avatar) {
            case 'Zap': return Zap;
            case 'Sparkles': return Sparkles;
            default: return Bot;
        }
    };

    const getAgentColors = () => {
        switch (agent.role) {
            case AgentRole.CUSTOMER_CARE:
                return { bg: 'bg-blue-500', gradient: 'from-blue-500 to-blue-600', text: 'text-blue-600', light: 'bg-blue-50', border: 'border-blue-200' };
            case AgentRole.SALES_ASSISTANT:
                return { bg: 'bg-amber-500', gradient: 'from-amber-500 to-orange-500', text: 'text-amber-600', light: 'bg-amber-50', border: 'border-amber-200' };
            case AgentRole.MARKETING_COMMS:
                return { bg: 'bg-purple-500', gradient: 'from-purple-500 to-pink-500', text: 'text-purple-600', light: 'bg-purple-50', border: 'border-purple-200' };
        }
    };

    const Icon = getAgentIcon();
    const colors = getAgentColors();

    const tabs: { id: ConfigTab; label: string; icon: React.ReactNode }[] = [
        { id: 'personality', label: 'Personality', icon: <MessageSquare className="w-4 h-4" /> },
        { id: 'documents', label: 'Knowledge', icon: <FileText className="w-4 h-4" /> },
        { id: 'rules', label: 'Rules', icon: <Sliders className="w-4 h-4" /> },
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
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br", colors.gradient)}>
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
                                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
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
                <div className="flex gap-1 mt-4 overflow-x-auto pb-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors",
                                activeTab === tab.id
                                    ? `${colors.light} ${colors.text}`
                                    : "text-slate-500 hover:bg-slate-100"
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
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-4">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                <Building2 className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="font-medium text-indigo-900">
                                            Business Context: {businessPersona?.identity?.name || 'Not set'}
                                        </p>
                                        <p className="text-sm text-indigo-700 mt-0.5">
                                            This agent uses your business profile from Settings for name, contact info, hours, and FAQs.
                                        </p>
                                    </div>
                                    <a
                                        href="/partner/settings/dashboard"
                                        className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 whitespace-nowrap"
                                    >
                                        <Settings className="w-4 h-4" />
                                        Edit Profile
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
                            <div className="bg-white rounded-xl border border-slate-200 p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <Volume2 className={cn("w-5 h-5", colors.text)} />
                                    <h3 className="font-semibold text-slate-900">Voice & Tone</h3>
                                </div>
                                <p className="text-sm text-slate-500 mb-4">
                                    Select the personality traits that match your brand. Pick 1-3 options.
                                </p>
                                <div className="flex flex-wrap gap-2">
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
                                                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-all",
                                                editedAgent.tones.includes(option.value)
                                                    ? `${colors.light} ${colors.border} ${colors.text}`
                                                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                                            )}
                                        >
                                            <span>{option.emoji}</span>
                                            {option.label}
                                            {editedAgent.tones.includes(option.value) && (
                                                <CheckCircle2 className="w-4 h-4" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Style Selection */}
                            <div className="bg-white rounded-xl border border-slate-200 p-5">
                                <h3 className="font-semibold text-slate-900 mb-4">Communication Style</h3>
                                <div className="grid gap-3">
                                    {STYLE_OPTIONS.map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => updateAgent({ style: option.value })}
                                            className={cn(
                                                "p-4 rounded-xl border-2 text-left transition-all",
                                                editedAgent.style === option.value
                                                    ? `${colors.light} ${colors.border}`
                                                    : "bg-white border-slate-200 hover:border-slate-300"
                                            )}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className={cn(
                                                        "font-medium",
                                                        editedAgent.style === option.value ? colors.text : "text-slate-900"
                                                    )}>
                                                        {option.label}
                                                    </p>
                                                    <p className="text-sm text-slate-500 mt-0.5">{option.description}</p>
                                                </div>
                                                {editedAgent.style === option.value && (
                                                    <CheckCircle2 className={cn("w-5 h-5", colors.text)} />
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Response Length */}
                            <div className="bg-white rounded-xl border border-slate-200 p-5">
                                <h3 className="font-semibold text-slate-900 mb-4">Response Length</h3>
                                <div className="grid sm:grid-cols-3 gap-3">
                                    {LENGTH_OPTIONS.map(option => (
                                        <button
                                            key={option.value}
                                            onClick={() => updateAgent({ responseLength: option.value })}
                                            className={cn(
                                                "p-4 rounded-xl border-2 text-center transition-all",
                                                editedAgent.responseLength === option.value
                                                    ? `${colors.light} ${colors.border}`
                                                    : "bg-white border-slate-200 hover:border-slate-300"
                                            )}
                                        >
                                            <p className={cn(
                                                "font-medium",
                                                editedAgent.responseLength === option.value ? colors.text : "text-slate-900"
                                            )}>
                                                {option.label}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">{option.example}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* DOCUMENTS TAB */}
                    {activeTab === 'documents' && (
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl border border-slate-200 p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <FileText className={cn("w-5 h-5", colors.text)} />
                                    <h3 className="font-semibold text-slate-900">Knowledge Base</h3>
                                </div>
                                <p className="text-sm text-slate-500 mb-4">
                                    Select which documents this agent can reference when answering questions.
                                </p>

                                {/* Use All Documents Toggle */}
                                <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors mb-4">
                                    <input
                                        type="checkbox"
                                        checked={editedAgent.useAllDocuments}
                                        onChange={(e) => updateAgent({ useAllDocuments: e.target.checked })}
                                        className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
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
                                                <a href="/partner/documents" className="text-sm text-indigo-600 hover:underline">
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
                                                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
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
                            <div className="bg-white rounded-xl border border-slate-200 p-5">
                                <h3 className="font-semibold text-slate-900 mb-1">Things to NEVER say</h3>
                                <p className="text-sm text-slate-500 mb-4">Words or phrases your agent should avoid</p>

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
                                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                            />
                                            <button
                                                onClick={() => {
                                                    updateAgent({ neverSay: editedAgent.neverSay.filter((_, i) => i !== index) });
                                                }}
                                                className="p-2 text-slate-400 hover:text-red-500"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => updateAgent({ neverSay: [...editedAgent.neverSay, ''] })}
                                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add phrase to avoid
                                    </button>
                                </div>
                            </div>

                            {/* Always Include */}
                            <div className="bg-white rounded-xl border border-slate-200 p-5">
                                <h3 className="font-semibold text-slate-900 mb-1">Always include</h3>
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
                                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                            />
                                            <button
                                                onClick={() => {
                                                    updateAgent({ alwaysInclude: editedAgent.alwaysInclude.filter((_, i) => i !== index) });
                                                }}
                                                className="p-2 text-slate-400 hover:text-red-500"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => updateAgent({ alwaysInclude: [...editedAgent.alwaysInclude, ''] })}
                                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add required phrase
                                    </button>
                                </div>
                            </div>

                            {/* Custom Response Rules */}
                            <div className="bg-white rounded-xl border border-slate-200 p-5">
                                <h3 className="font-semibold text-slate-900 mb-1">Custom Response Rules</h3>
                                <p className="text-sm text-slate-500 mb-4">Trigger specific responses for certain keywords</p>

                                <div className="space-y-4">
                                    {editedAgent.responseRules.map((rule) => (
                                        <div key={rule.id} className="bg-slate-50 rounded-xl p-4">
                                            <div className="flex items-start justify-between gap-2 mb-3">
                                                <div className="flex-1">
                                                    <label className="block text-xs font-medium text-slate-500 mb-1.5">
                                                        When customer mentions:
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={rule.triggerKeywords.join(', ')}
                                                        onChange={(e) => updateResponseRule(rule.id, {
                                                            triggerKeywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                                                        })}
                                                        placeholder="discount, promo, coupon"
                                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => removeResponseRule(rule.id)}
                                                    className="p-1.5 text-slate-400 hover:text-red-500 mt-5"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                                                    Respond with:
                                                </label>
                                                <textarea
                                                    value={rule.response}
                                                    onChange={(e) => updateResponseRule(rule.id, { response: e.target.value })}
                                                    placeholder="Your exact response text..."
                                                    rows={2}
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        onClick={addResponseRule}
                                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add response rule
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ESCALATION TAB */}
                    {activeTab === 'escalation' && (
                        <div className="space-y-6">
                            <div className={cn("rounded-xl p-4 border-2", colors.light, colors.border)}>
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className={cn("w-5 h-5 mt-0.5", colors.text)} />
                                    <div>
                                        <p className="font-medium text-slate-900">When should your agent hand off to a human?</p>
                                        <p className="text-sm text-slate-500 mt-1">
                                            Configure when the agent should stop and notify your team.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-slate-50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={editedAgent.escalationSettings.onHumanRequest}
                                        onChange={(e) => updateAgent({
                                            escalationSettings: {
                                                ...editedAgent.escalationSettings,
                                                onHumanRequest: e.target.checked
                                            }
                                        })}
                                        className="w-5 h-5 mt-0.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                    />
                                    <div>
                                        <p className="font-medium text-slate-900">Customer asks for human</p>
                                        <p className="text-sm text-slate-500">When they say "speak to a person", "human", etc.</p>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-slate-50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={editedAgent.escalationSettings.onFrustration}
                                        onChange={(e) => updateAgent({
                                            escalationSettings: {
                                                ...editedAgent.escalationSettings,
                                                onFrustration: e.target.checked
                                            }
                                        })}
                                        className="w-5 h-5 mt-0.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                    />
                                    <div>
                                        <p className="font-medium text-slate-900">Customer seems frustrated</p>
                                        <p className="text-sm text-slate-500">AI detects repeated questions or negative sentiment</p>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-slate-50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={editedAgent.escalationSettings.onNoAnswer}
                                        onChange={(e) => updateAgent({
                                            escalationSettings: {
                                                ...editedAgent.escalationSettings,
                                                onNoAnswer: e.target.checked
                                            }
                                        })}
                                        className="w-5 h-5 mt-0.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                    />
                                    <div>
                                        <p className="font-medium text-slate-900">Agent can't answer</p>
                                        <p className="text-sm text-slate-500">After {editedAgent.escalationSettings.noAnswerAttempts} attempts without a good answer</p>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-slate-50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={editedAgent.escalationSettings.onSensitiveTopics}
                                        onChange={(e) => updateAgent({
                                            escalationSettings: {
                                                ...editedAgent.escalationSettings,
                                                onSensitiveTopics: e.target.checked
                                            }
                                        })}
                                        className="w-5 h-5 mt-0.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                    />
                                    <div>
                                        <p className="font-medium text-slate-900">Sensitive topics</p>
                                        <p className="text-sm text-slate-500">
                                            Topics: {editedAgent.escalationSettings.sensitiveTopics.length > 0
                                                ? editedAgent.escalationSettings.sensitiveTopics.join(', ')
                                                : 'None configured'}
                                        </p>
                                    </div>
                                </label>
                            </div>

                            <div className="bg-white rounded-xl border border-slate-200 p-5">
                                <h3 className="font-semibold text-slate-900 mb-1">Escalation Message</h3>
                                <p className="text-sm text-slate-500 mb-3">What the agent says when handing off</p>
                                <textarea
                                    value={editedAgent.escalationSettings.escalationMessage}
                                    onChange={(e) => updateAgent({
                                        escalationSettings: {
                                            ...editedAgent.escalationSettings,
                                            escalationMessage: e.target.value
                                        }
                                    })}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    placeholder="Let me connect you with a team member who can help..."
                                />
                            </div>
                        </div>
                    )}

                    {/* ADVANCED TAB - Sales Lead Capture */}
                    {activeTab === 'advanced' && agent.role === AgentRole.SALES_ASSISTANT && (
                        <div className="space-y-6">
                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-4">
                                <div className="flex items-start gap-3">
                                    <Target className="w-5 h-5 mt-0.5 text-amber-600" />
                                    <div>
                                        <p className="font-medium text-amber-900">Lead Qualification</p>
                                        <p className="text-sm text-amber-700 mt-1">
                                            Configure what questions to ask potential customers to qualify leads.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                                <h3 className="font-semibold text-slate-900">Qualification Questions</h3>

                                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-slate-50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={editedAgent.leadSettings?.askNeed}
                                        onChange={(e) => updateAgent({
                                            leadSettings: {
                                                ...editedAgent.leadSettings!,
                                                askNeed: e.target.checked
                                            }
                                        })}
                                        className="w-5 h-5 mt-0.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
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
                                            className="mt-2 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                        />
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-slate-50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={editedAgent.leadSettings?.askBudget}
                                        onChange={(e) => updateAgent({
                                            leadSettings: {
                                                ...editedAgent.leadSettings!,
                                                askBudget: e.target.checked
                                            }
                                        })}
                                        className="w-5 h-5 mt-0.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                    />
                                    <div>
                                        <p className="font-medium text-slate-900">Ask about budget</p>
                                        <p className="text-sm text-slate-500">Understand their spending capacity</p>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-slate-50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={editedAgent.leadSettings?.askTimeline}
                                        onChange={(e) => updateAgent({
                                            leadSettings: {
                                                ...editedAgent.leadSettings!,
                                                askTimeline: e.target.checked
                                            }
                                        })}
                                        className="w-5 h-5 mt-0.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
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
                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-4">
                                <div className="flex items-start gap-3">
                                    <Calendar className="w-5 h-5 mt-0.5 text-purple-600" />
                                    <div>
                                        <p className="font-medium text-purple-900">Campaign Settings</p>
                                        <p className="text-sm text-purple-700 mt-1">
                                            Configure automated messages for birthdays, welcome messages, and more.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                                <h3 className="font-semibold text-slate-900">Automated Messages</h3>

                                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-slate-50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={editedAgent.campaignSettings?.enableBirthday}
                                        onChange={(e) => updateAgent({
                                            campaignSettings: {
                                                ...editedAgent.campaignSettings!,
                                                enableBirthday: e.target.checked
                                            }
                                        })}
                                        className="w-5 h-5 mt-0.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                    />
                                    <div>
                                        <p className="font-medium text-slate-900">Birthday wishes</p>
                                        <p className="text-sm text-slate-500">Send personalized birthday messages</p>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-slate-50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={editedAgent.campaignSettings?.enableWelcome}
                                        onChange={(e) => updateAgent({
                                            campaignSettings: {
                                                ...editedAgent.campaignSettings!,
                                                enableWelcome: e.target.checked
                                            }
                                        })}
                                        className="w-5 h-5 mt-0.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                    />
                                    <div>
                                        <p className="font-medium text-slate-900">Welcome messages</p>
                                        <p className="text-sm text-slate-500">Greet new contacts automatically</p>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-slate-50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={editedAgent.campaignSettings?.enableThankYou}
                                        onChange={(e) => updateAgent({
                                            campaignSettings: {
                                                ...editedAgent.campaignSettings!,
                                                enableThankYou: e.target.checked
                                            }
                                        })}
                                        className="w-5 h-5 mt-0.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                    />
                                    <div>
                                        <p className="font-medium text-slate-900">Thank you messages</p>
                                        <p className="text-sm text-slate-500">After purchases or interactions</p>
                                    </div>
                                </label>
                            </div>

                            <div className="bg-white rounded-xl border border-slate-200 p-5">
                                <h3 className="font-semibold text-slate-900 mb-4">Quiet Hours</h3>
                                <p className="text-sm text-slate-500 mb-3">Don't send messages during these hours</p>
                                <div className="flex items-center gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">From</label>
                                        <input
                                            type="time"
                                            value={editedAgent.campaignSettings?.quietHoursStart || '21:00'}
                                            onChange={(e) => updateAgent({
                                                campaignSettings: {
                                                    ...editedAgent.campaignSettings!,
                                                    quietHoursStart: e.target.value
                                                }
                                            })}
                                            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">To</label>
                                        <input
                                            type="time"
                                            value={editedAgent.campaignSettings?.quietHoursEnd || '08:00'}
                                            onChange={(e) => updateAgent({
                                                campaignSettings: {
                                                    ...editedAgent.campaignSettings!,
                                                    quietHoursEnd: e.target.value
                                                }
                                            })}
                                            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
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
