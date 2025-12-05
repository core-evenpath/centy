"use client";

import React, { useState } from 'react';
import {
    EssentialAgent,
    AgentRole,
    AgentTone,
    AgentStyle,
    AgentLength,
    ResponseRule,
    ChatContextType
} from '@/lib/partnerhub-types';
import { usePartnerHub } from '@/hooks/use-partnerhub';
import { cn } from '@/lib/utils';
import {
    ArrowLeft,
    Bot,
    Zap,
    Sparkles,
    User,
    BookOpen,
    MessageSquare,
    AlertTriangle,
    Play,
    Save,
    Plus,
    X,
    FileText,
    Check,
    Trash2,
    GripVertical
} from 'lucide-react';

interface AgentConfigPanelProps {
    agent: EssentialAgent;
    onBack: () => void;
    onSave?: (agent: EssentialAgent) => void;
    onTest?: () => void;
}

type ConfigTab = 'identity' | 'knowledge' | 'rules' | 'escalation' | 'test';

const TONE_OPTIONS: { value: AgentTone; label: string }[] = [
    { value: 'professional', label: 'Professional' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'empathetic', label: 'Empathetic' },
    { value: 'casual', label: 'Casual' },
    { value: 'formal', label: 'Formal' },
    { value: 'creative', label: 'Creative' },
    { value: 'consultative', label: 'Consultative' },
];

const STYLE_OPTIONS: { value: AgentStyle; label: string }[] = [
    { value: 'formal', label: 'Formal' },
    { value: 'conversational', label: 'Conversational' },
    { value: 'casual', label: 'Casual' },
];

const LENGTH_OPTIONS: { value: AgentLength; label: string }[] = [
    { value: 'brief', label: 'Brief' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'detailed', label: 'Detailed' },
];

export default function AgentConfigPanel({ agent, onBack, onSave, onTest }: AgentConfigPanelProps) {
    const { documents, switchContext } = usePartnerHub();
    const [activeTab, setActiveTab] = useState<ConfigTab>('identity');
    const [editedAgent, setEditedAgent] = useState<EssentialAgent>(agent);
    const [hasChanges, setHasChanges] = useState(false);

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
                return { bg: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-50' };
            case AgentRole.SALES_ASSISTANT:
                return { bg: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-50' };
            case AgentRole.MARKETING_COMMS:
                return { bg: 'bg-purple-500', text: 'text-purple-600', light: 'bg-purple-50' };
        }
    };

    const Icon = getAgentIcon();
    const colors = getAgentColors();

    const tabs: { id: ConfigTab; label: string; icon: React.ReactNode }[] = [
        { id: 'identity', label: 'Identity', icon: <User className="w-4 h-4" /> },
        { id: 'knowledge', label: 'Knowledge', icon: <BookOpen className="w-4 h-4" /> },
        { id: 'rules', label: 'Response Rules', icon: <MessageSquare className="w-4 h-4" /> },
        { id: 'escalation', label: 'Escalation', icon: <AlertTriangle className="w-4 h-4" /> },
        { id: 'test', label: 'Test', icon: <Play className="w-4 h-4" /> },
    ];

    const handleSave = () => {
        onSave?.(editedAgent);
        setHasChanges(false);
    };

    const handleTest = () => {
        switchContext({
            type: ChatContextType.AGENT,
            id: agent.id,
            name: agent.name,
            description: agent.description,
        });
        onTest?.();
    };

    const addResponseRule = () => {
        const newRule: ResponseRule = {
            id: `rule-${Date.now()}`,
            triggerKeywords: [],
            response: '',
            escalateAfter: false,
        };
        updateAgent({
            responseRules: [...editedAgent.responseRules, newRule],
        });
    };

    const updateResponseRule = (id: string, updates: Partial<ResponseRule>) => {
        updateAgent({
            responseRules: editedAgent.responseRules.map(rule =>
                rule.id === id ? { ...rule, ...updates } : rule
            ),
        });
    };

    const removeResponseRule = (id: string) => {
        updateAgent({
            responseRules: editedAgent.responseRules.filter(rule => rule.id !== id),
        });
    };

    return (
        <div className="flex-1 overflow-hidden flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white", colors.bg)}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-gray-900">{agent.name}</h1>
                                <p className="text-sm text-gray-500">{agent.description}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {hasChanges && (
                            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                                Unsaved changes
                            </span>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={!hasChanges}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                hasChanges
                                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            )}
                        >
                            <Save className="w-4 h-4" />
                            Save Changes
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mt-4 -mb-4 overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                                activeTab === tab.id
                                    ? `border-indigo-600 ${colors.text}`
                                    : "border-transparent text-gray-500 hover:text-gray-700"
                            )}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-3xl mx-auto space-y-6">

                    {/* Identity Tab */}
                    {activeTab === 'identity' && (
                        <>
                            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
                                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <User className="w-5 h-5 text-gray-400" />
                                    Identity
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Agent Name
                                        </label>
                                        <input
                                            type="text"
                                            value={editedAgent.name}
                                            onChange={e => updateAgent({ name: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">How the agent identifies itself</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Business Name
                                        </label>
                                        <input
                                            type="text"
                                            value={editedAgent.businessName}
                                            onChange={e => updateAgent({ businessName: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-gray-50"
                                            placeholder="Your Business Name"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Pulled from your profile</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Personality Tones
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {TONE_OPTIONS.map(tone => {
                                            const isSelected = editedAgent.tones.includes(tone.value);
                                            return (
                                                <button
                                                    key={tone.value}
                                                    onClick={() => {
                                                        if (isSelected) {
                                                            updateAgent({ tones: editedAgent.tones.filter(t => t !== tone.value) });
                                                        } else {
                                                            updateAgent({ tones: [...editedAgent.tones, tone.value] });
                                                        }
                                                    }}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-all border",
                                                        isSelected
                                                            ? `${colors.light} ${colors.text} border-current`
                                                            : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                                                    )}
                                                >
                                                    {isSelected && <Check className="w-3 h-3 inline mr-1" />}
                                                    {tone.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Response Style
                                        </label>
                                        <div className="flex gap-2">
                                            {STYLE_OPTIONS.map(style => (
                                                <button
                                                    key={style.value}
                                                    onClick={() => updateAgent({ style: style.value })}
                                                    className={cn(
                                                        "flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all border",
                                                        editedAgent.style === style.value
                                                            ? `${colors.light} ${colors.text} border-current`
                                                            : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                                                    )}
                                                >
                                                    {style.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Response Length
                                        </label>
                                        <div className="flex gap-2">
                                            {LENGTH_OPTIONS.map(length => (
                                                <button
                                                    key={length.value}
                                                    onClick={() => updateAgent({ responseLength: length.value })}
                                                    className={cn(
                                                        "flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all border",
                                                        editedAgent.responseLength === length.value
                                                            ? `${colors.light} ${colors.text} border-current`
                                                            : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                                                    )}
                                                >
                                                    {length.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Opening Message <span className="text-gray-400 font-normal">(optional)</span>
                                    </label>
                                    <textarea
                                        value={editedAgent.openingMessage || ''}
                                        onChange={e => updateAgent({ openingMessage: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                                        placeholder="Hello! I'm here to help you with any questions or concerns about your account or our services. How can I assist you today?"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Leave blank to use AI-generated greeting</p>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Knowledge Tab */}
                    {activeTab === 'knowledge' && (
                        <>
                            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
                                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-gray-400" />
                                    Knowledge Base
                                </h2>
                                <p className="text-sm text-gray-600">
                                    What documents should this agent use to answer questions?
                                </p>

                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200">
                                        <input
                                            type="radio"
                                            checked={editedAgent.useAllDocuments}
                                            onChange={() => updateAgent({ useAllDocuments: true })}
                                            className="w-4 h-4 text-indigo-600"
                                        />
                                        <div>
                                            <div className="font-medium text-gray-900">All Documents (Recommended)</div>
                                            <div className="text-sm text-gray-500">Agent will search all documents in Core Memory</div>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200">
                                        <input
                                            type="radio"
                                            checked={!editedAgent.useAllDocuments}
                                            onChange={() => updateAgent({ useAllDocuments: false })}
                                            className="w-4 h-4 text-indigo-600"
                                        />
                                        <div>
                                            <div className="font-medium text-gray-900">Selected Documents Only</div>
                                            <div className="text-sm text-gray-500">Agent will only use documents you specify</div>
                                        </div>
                                    </label>
                                </div>

                                {!editedAgent.useAllDocuments && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-medium text-gray-700">Attached Documents</h3>
                                            <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                                                <Plus className="w-4 h-4" /> Add Docs
                                            </button>
                                        </div>

                                        {documents.length === 0 ? (
                                            <div className="text-center py-8 text-gray-500">
                                                <FileText className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                                                <p className="text-sm">No documents uploaded yet</p>
                                                <p className="text-xs text-gray-400 mt-1">Go to Digital Assets to upload documents</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {documents.slice(0, 5).map(doc => {
                                                    const isAttached = editedAgent.attachedDocumentIds.includes(doc.id);
                                                    return (
                                                        <div
                                                            key={doc.id}
                                                            className={cn(
                                                                "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer",
                                                                isAttached
                                                                    ? `${colors.light} border-current ${colors.text}`
                                                                    : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                                                            )}
                                                            onClick={() => {
                                                                if (isAttached) {
                                                                    updateAgent({
                                                                        attachedDocumentIds: editedAgent.attachedDocumentIds.filter(id => id !== doc.id)
                                                                    });
                                                                } else {
                                                                    updateAgent({
                                                                        attachedDocumentIds: [...editedAgent.attachedDocumentIds, doc.id]
                                                                    });
                                                                }
                                                            }}
                                                        >
                                                            <FileText className="w-5 h-5 flex-shrink-0" />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium text-gray-900 truncate">{doc.name}</p>
                                                                <p className="text-xs text-gray-500">
                                                                    {(doc.size / 1024).toFixed(0)} KB • {doc.category}
                                                                </p>
                                                            </div>
                                                            {isAttached && <Check className="w-5 h-5" />}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-gray-300 transition-colors cursor-pointer">
                                            <Plus className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                            <p className="text-sm text-gray-600">Drop documents here or click to browse</p>
                                        </div>

                                        <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg text-amber-800">
                                            <span className="text-lg">💡</span>
                                            <p className="text-sm">Mark a document as "Primary" to prioritize it in responses</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Response Rules Tab */}
                    {activeTab === 'rules' && (
                        <>
                            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                                            <MessageSquare className="w-5 h-5 text-gray-400" />
                                            Quick Rules
                                        </h2>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Define how the agent should respond in specific situations
                                        </p>
                                    </div>
                                    <button
                                        onClick={addResponseRule}
                                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                                    >
                                        <Plus className="w-4 h-4" /> Add Rule
                                    </button>
                                </div>

                                {editedAgent.responseRules.length === 0 ? (
                                    <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                                        <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                                        <p className="text-sm text-gray-500">No custom rules yet</p>
                                        <button
                                            onClick={addResponseRule}
                                            className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                                        >
                                            Create your first rule
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {editedAgent.responseRules.map((rule, index) => (
                                            <div key={rule.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                                                        <span className="text-sm font-medium text-gray-700">Rule {index + 1}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => removeResponseRule(rule.id)}
                                                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                                                        When customer asks about:
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={rule.triggerKeywords.join(', ')}
                                                        onChange={e => updateResponseRule(rule.id, {
                                                            triggerKeywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean)
                                                        })}
                                                        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                                        placeholder="pricing, cost, how much"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                                                        Respond with:
                                                    </label>
                                                    <textarea
                                                        value={rule.response}
                                                        onChange={e => updateResponseRule(rule.id, { response: e.target.value })}
                                                        rows={3}
                                                        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
                                                        placeholder="Enter the specific response..."
                                                    />
                                                </div>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={rule.escalateAfter}
                                                        onChange={e => updateResponseRule(rule.id, { escalateAfter: e.target.checked })}
                                                        className="w-4 h-4 text-indigo-600 rounded"
                                                    />
                                                    <span className="text-sm text-gray-600">Escalate to human after this response</span>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Never Say / Always Include */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white rounded-xl border border-gray-200 p-6">
                                    <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                        <X className="w-4 h-4 text-red-500" /> Things to Never Say
                                    </h3>
                                    <div className="space-y-2">
                                        {editedAgent.neverSay.map((item, i) => (
                                            <div key={i} className="flex items-center gap-2 p-2 bg-red-50 rounded-lg text-sm text-red-700">
                                                <span className="flex-1">• {item}</span>
                                            </div>
                                        ))}
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                            placeholder="+ Add item..."
                                            onKeyDown={e => {
                                                if (e.key === 'Enter' && e.currentTarget.value) {
                                                    updateAgent({ neverSay: [...editedAgent.neverSay, e.currentTarget.value] });
                                                    e.currentTarget.value = '';
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="bg-white rounded-xl border border-gray-200 p-6">
                                    <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                        <Check className="w-4 h-4 text-green-500" /> Always Include
                                    </h3>
                                    <div className="space-y-2">
                                        {editedAgent.alwaysInclude.map((item, i) => (
                                            <div key={i} className="flex items-center gap-2 p-2 bg-green-50 rounded-lg text-sm text-green-700">
                                                <span className="flex-1">• {item}</span>
                                            </div>
                                        ))}
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                            placeholder="+ Add item..."
                                            onKeyDown={e => {
                                                if (e.key === 'Enter' && e.currentTarget.value) {
                                                    updateAgent({ alwaysInclude: [...editedAgent.alwaysInclude, e.currentTarget.value] });
                                                    e.currentTarget.value = '';
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Escalation Tab */}
                    {activeTab === 'escalation' && (
                        <>
                            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
                                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-gray-400" />
                                    Escalation Settings
                                </h2>
                                <p className="text-sm text-gray-600">
                                    When should the agent hand off to a human?
                                </p>

                                <div className="space-y-4">
                                    <label className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={editedAgent.escalationSettings.onHumanRequest}
                                            onChange={e => updateAgent({
                                                escalationSettings: {
                                                    ...editedAgent.escalationSettings,
                                                    onHumanRequest: e.target.checked
                                                }
                                            })}
                                            className="mt-0.5 w-4 h-4 text-indigo-600 rounded"
                                        />
                                        <div>
                                            <div className="font-medium text-gray-900">Customer explicitly requests a human</div>
                                            <div className="text-sm text-gray-500 mt-1">
                                                Keywords: {editedAgent.escalationSettings.humanRequestKeywords.join(', ')}
                                            </div>
                                        </div>
                                    </label>

                                    <label className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={editedAgent.escalationSettings.onFrustration}
                                            onChange={e => updateAgent({
                                                escalationSettings: {
                                                    ...editedAgent.escalationSettings,
                                                    onFrustration: e.target.checked
                                                }
                                            })}
                                            className="mt-0.5 w-4 h-4 text-indigo-600 rounded"
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900">Customer expresses frustration</div>
                                            <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                                                After
                                                <select
                                                    value={editedAgent.escalationSettings.frustrationThreshold}
                                                    onChange={e => updateAgent({
                                                        escalationSettings: {
                                                            ...editedAgent.escalationSettings,
                                                            frustrationThreshold: parseInt(e.target.value)
                                                        }
                                                    })}
                                                    className="px-2 py-1 border border-gray-200 rounded text-sm"
                                                >
                                                    {[2, 3, 4, 5].map(n => (
                                                        <option key={n} value={n}>{n}</option>
                                                    ))}
                                                </select>
                                                negative messages in a row
                                            </div>
                                        </div>
                                    </label>

                                    <label className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={editedAgent.escalationSettings.onNoAnswer}
                                            onChange={e => updateAgent({
                                                escalationSettings: {
                                                    ...editedAgent.escalationSettings,
                                                    onNoAnswer: e.target.checked
                                                }
                                            })}
                                            className="mt-0.5 w-4 h-4 text-indigo-600 rounded"
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium text-gray-900">Agent cannot find an answer</div>
                                            <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                                                After
                                                <select
                                                    value={editedAgent.escalationSettings.noAnswerAttempts}
                                                    onChange={e => updateAgent({
                                                        escalationSettings: {
                                                            ...editedAgent.escalationSettings,
                                                            noAnswerAttempts: parseInt(e.target.value)
                                                        }
                                                    })}
                                                    className="px-2 py-1 border border-gray-200 rounded text-sm"
                                                >
                                                    {[1, 2, 3, 4].map(n => (
                                                        <option key={n} value={n}>{n}</option>
                                                    ))}
                                                </select>
                                                attempts to answer from knowledge base
                                            </div>
                                        </div>
                                    </label>

                                    <label className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={editedAgent.escalationSettings.onSensitiveTopics}
                                            onChange={e => updateAgent({
                                                escalationSettings: {
                                                    ...editedAgent.escalationSettings,
                                                    onSensitiveTopics: e.target.checked
                                                }
                                            })}
                                            className="mt-0.5 w-4 h-4 text-indigo-600 rounded"
                                        />
                                        <div>
                                            <div className="font-medium text-gray-900">Sensitive topics detected</div>
                                            <div className="text-sm text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
                                                Topics:
                                                {editedAgent.escalationSettings.sensitiveTopics.map((topic, i) => (
                                                    <span key={i} className="px-2 py-0.5 bg-gray-200 rounded text-xs">
                                                        {topic}
                                                    </span>
                                                ))}
                                                <button className="text-indigo-600 text-xs font-medium">+ Add</button>
                                            </div>
                                        </div>
                                    </label>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Escalation Message
                                    </label>
                                    <textarea
                                        value={editedAgent.escalationSettings.escalationMessage}
                                        onChange={e => updateAgent({
                                            escalationSettings: {
                                                ...editedAgent.escalationSettings,
                                                escalationMessage: e.target.value
                                            }
                                        })}
                                        rows={3}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm resize-none"
                                        placeholder="I want to make sure you get the best help possible..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Notify Team Via
                                    </label>
                                    <div className="space-y-3">
                                        <label className="flex items-center gap-2">
                                            <input type="checkbox" checked className="w-4 h-4 text-indigo-600 rounded" readOnly />
                                            <span className="text-sm text-gray-700">In-app notification</span>
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" className="w-4 h-4 text-indigo-600 rounded" />
                                            <span className="text-sm text-gray-700">Email to:</span>
                                            <input
                                                type="email"
                                                value={editedAgent.escalationSettings.notifyEmail || ''}
                                                onChange={e => updateAgent({
                                                    escalationSettings: {
                                                        ...editedAgent.escalationSettings,
                                                        notifyEmail: e.target.value
                                                    }
                                                })}
                                                className="flex-1 px-3 py-1.5 border border-gray-200 rounded text-sm"
                                                placeholder="team@example.com"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Test Tab */}
                    {activeTab === 'test' && (
                        <>
                            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
                                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <Play className="w-5 h-5 text-gray-400" />
                                    Test Your Agent
                                </h2>
                                <p className="text-sm text-gray-600">
                                    Try conversations to see how your agent responds
                                </p>

                                <button
                                    onClick={handleTest}
                                    className={cn(
                                        "w-full flex items-center justify-center gap-2 py-4 rounded-xl font-medium text-white transition-all",
                                        colors.bg, "hover:opacity-90"
                                    )}
                                >
                                    <Play className="w-5 h-5" />
                                    Open Test Simulator
                                </button>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Test Scenarios</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {[
                                            "Where's my order?",
                                            "I want a refund",
                                            "Talk to a human",
                                            "Your service sucks",
                                            "How much does it cost?",
                                        ].map((scenario, i) => (
                                            <button
                                                key={i}
                                                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                                            >
                                                Try: "{scenario}"
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                </div>
            </div>
        </div>
    );
}
