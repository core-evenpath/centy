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
import { getPartnerProfileAction } from '@/actions/get-partner-profile';
import { cn } from '@/lib/utils';
import {
    ArrowLeft,
    Bot,
    Zap,
    Sparkles,
    BookOpen,
    MessageSquare,
    AlertTriangle,
    Play,
    Save,
    Plus,
    X,
    FileText,
    Info,
    Building2,
    Clock,
    MapPin,
    Phone,
    Mail,
    Globe,
    HelpCircle,
    ChevronDown,
    ChevronUp,
    Lightbulb,
    Trash2,
    RefreshCw,
    MessageCircle,
    User,
    CheckCircle2
} from 'lucide-react';

interface AgentConfigPanelProps {
    agent: EssentialAgent;
    onBack: () => void;
    onSave?: (agent: EssentialAgent) => void;
    onTest?: () => void;
}

type ConfigTab = 'knowledge' | 'personality' | 'rules' | 'escalation';

interface FAQItem {
    id: string;
    question: string;
    answer: string;
}

interface ExampleInteraction {
    id: string;
    customerMessage: string;
    idealResponse: string;
    situation: string;
}

interface BusinessInfo {
    name: string;
    tagline: string;
    description: string;
    hours: string;
    address: string;
    phone: string;
    email: string;
    website: string;
}

const DEFAULT_FAQS: FAQItem[] = [
    { id: '1', question: 'What are your hours?', answer: '' },
    { id: '2', question: 'Where are you located?', answer: '' },
    { id: '3', question: 'Do you offer delivery?', answer: '' },
    { id: '4', question: 'What payment methods do you accept?', answer: '' },
    { id: '5', question: 'How can I contact you?', answer: '' },
];

const DEFAULT_INTERACTIONS: ExampleInteraction[] = [
    {
        id: '1',
        situation: 'Greeting',
        customerMessage: 'Hi, I have a question',
        idealResponse: ''
    },
    {
        id: '2',
        situation: 'Product inquiry',
        customerMessage: 'What products/services do you offer?',
        idealResponse: ''
    },
    {
        id: '3',
        situation: 'Pricing question',
        customerMessage: 'How much does it cost?',
        idealResponse: ''
    },
    {
        id: '4',
        situation: 'Complaint handling',
        customerMessage: "I'm not happy with my order",
        idealResponse: ''
    },
    {
        id: '5',
        situation: 'Closing',
        customerMessage: 'Thank you for your help',
        idealResponse: ''
    },
];

const TONE_OPTIONS: { value: AgentTone; label: string; description: string }[] = [
    { value: 'professional', label: 'Professional', description: 'Formal and business-like' },
    { value: 'friendly', label: 'Friendly', description: 'Warm and approachable' },
    { value: 'empathetic', label: 'Empathetic', description: 'Understanding and caring' },
    { value: 'casual', label: 'Casual', description: 'Relaxed and informal' },
];

const STYLE_OPTIONS: { value: AgentStyle; label: string; description: string }[] = [
    { value: 'formal', label: 'Formal', description: 'Proper grammar, no slang' },
    { value: 'conversational', label: 'Conversational', description: 'Natural, like texting a friend' },
    { value: 'casual', label: 'Casual', description: 'Very relaxed, uses emojis' },
];

const LENGTH_OPTIONS: { value: AgentLength; label: string; description: string }[] = [
    { value: 'brief', label: 'Brief', description: '1-2 sentences' },
    { value: 'moderate', label: 'Moderate', description: '2-4 sentences' },
    { value: 'detailed', label: 'Detailed', description: 'Full explanations' },
];

export default function AgentConfigPanel({ agent, onBack, onSave, onTest }: AgentConfigPanelProps) {
    const { documents } = usePartnerHub();
    const { currentWorkspace } = useMultiWorkspaceAuth();

    const [activeTab, setActiveTab] = useState<ConfigTab>('knowledge');
    const [editedAgent, setEditedAgent] = useState<EssentialAgent>(agent);
    const [hasChanges, setHasChanges] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loadingProfile, setLoadingProfile] = useState(false);

    const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
        name: agent.businessName || '',
        tagline: '',
        description: '',
        hours: '',
        address: '',
        phone: '',
        email: '',
        website: '',
    });

    const [faqs, setFaqs] = useState<FAQItem[]>(DEFAULT_FAQS);
    const [exampleInteractions, setExampleInteractions] = useState<ExampleInteraction[]>(DEFAULT_INTERACTIONS);
    const [expandedSections, setExpandedSections] = useState<string[]>(['business', 'faqs', 'interactions']);

    useEffect(() => {
        if (currentWorkspace?.partnerId) {
            loadPartnerProfile();
        }
    }, [currentWorkspace?.partnerId]);

    const loadPartnerProfile = async () => {
        if (!currentWorkspace?.partnerId) return;

        setLoadingProfile(true);
        try {
            const result = await getPartnerProfileAction(currentWorkspace.partnerId);
            if (result.success && result.partner) {
                const partner = result.partner;
                setBusinessInfo(prev => ({
                    ...prev,
                    name: partner.businessName || partner.name || prev.name,
                    phone: partner.phone || prev.phone,
                    email: partner.email || prev.email,
                    address: partner.location
                        ? `${partner.location.city}, ${partner.location.state}`
                        : prev.address,
                }));

                if (!editedAgent.businessName || editedAgent.businessName === 'Your Business') {
                    updateAgent({ businessName: partner.businessName || partner.name });
                }
            }
        } catch (error) {
            console.error('Failed to load partner profile:', error);
        } finally {
            setLoadingProfile(false);
        }
    };

    const updateAgent = (updates: Partial<EssentialAgent>) => {
        setEditedAgent(prev => ({ ...prev, ...updates }));
        setHasChanges(true);
    };

    const updateBusinessInfo = (field: keyof BusinessInfo, value: string) => {
        setBusinessInfo(prev => ({ ...prev, [field]: value }));
        setHasChanges(true);
        if (field === 'name') {
            updateAgent({ businessName: value });
        }
    };

    const updateFaq = (id: string, field: 'question' | 'answer', value: string) => {
        setFaqs(prev => prev.map(faq => faq.id === id ? { ...faq, [field]: value } : faq));
        setHasChanges(true);
    };

    const addFaq = () => {
        setFaqs(prev => [...prev, { id: Date.now().toString(), question: '', answer: '' }]);
        setHasChanges(true);
    };

    const removeFaq = (id: string) => {
        setFaqs(prev => prev.filter(faq => faq.id !== id));
        setHasChanges(true);
    };

    const updateInteraction = (id: string, field: keyof ExampleInteraction, value: string) => {
        setExampleInteractions(prev => prev.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
        setHasChanges(true);
    };

    const addInteraction = () => {
        setExampleInteractions(prev => [...prev, {
            id: Date.now().toString(),
            situation: '',
            customerMessage: '',
            idealResponse: ''
        }]);
        setHasChanges(true);
    };

    const removeInteraction = (id: string) => {
        setExampleInteractions(prev => prev.filter(item => item.id !== id));
        setHasChanges(true);
    };

    const toggleSection = (section: string) => {
        setExpandedSections(prev =>
            prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
        );
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
                return { bg: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-50', border: 'border-blue-200' };
            case AgentRole.SALES_ASSISTANT:
                return { bg: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-50', border: 'border-amber-200' };
            case AgentRole.MARKETING_COMMS:
                return { bg: 'bg-purple-500', text: 'text-purple-600', light: 'bg-purple-50', border: 'border-purple-200' };
        }
    };

    const Icon = getAgentIcon();
    const colors = getAgentColors();

    const tabs: { id: ConfigTab; label: string; icon: React.ReactNode; description: string }[] = [
        { id: 'knowledge', label: 'Knowledge', icon: <BookOpen className="w-4 h-4" />, description: 'What your AI knows' },
        { id: 'personality', label: 'Personality', icon: <MessageSquare className="w-4 h-4" />, description: 'How it talks' },
        { id: 'rules', label: 'Rules', icon: <FileText className="w-4 h-4" />, description: 'Special instructions' },
        { id: 'escalation', label: 'Escalation', icon: <AlertTriangle className="w-4 h-4" />, description: 'When to get human help' },
    ];

    const handleSave = async () => {
        setSaving(true);

        const faqContent = faqs
            .filter(f => f.question && f.answer)
            .map(f => `Q: ${f.question}\nA: ${f.answer}`)
            .join('\n\n');

        const interactionsContent = exampleInteractions
            .filter(i => i.customerMessage && i.idealResponse)
            .map(i => `[${i.situation || 'General'}]\nCustomer: ${i.customerMessage}\nIdeal Response: ${i.idealResponse}`)
            .join('\n\n');

        const knowledgeContext = `
BUSINESS INFORMATION:
Business Name: ${businessInfo.name}
${businessInfo.tagline ? `Tagline: ${businessInfo.tagline}` : ''}
${businessInfo.description ? `About: ${businessInfo.description}` : ''}
${businessInfo.hours ? `Hours: ${businessInfo.hours}` : ''}
${businessInfo.address ? `Location: ${businessInfo.address}` : ''}
${businessInfo.phone ? `Phone: ${businessInfo.phone}` : ''}
${businessInfo.email ? `Email: ${businessInfo.email}` : ''}
${businessInfo.website ? `Website: ${businessInfo.website}` : ''}

FREQUENTLY ASKED QUESTIONS:
${faqContent || 'No FAQs configured yet.'}

EXAMPLE INTERACTIONS (use these as guidance for tone and approach):
${interactionsContent || 'No example interactions configured yet.'}
        `.trim();

        const updatedAgent = {
            ...editedAgent,
            businessName: businessInfo.name,
            openingMessage: knowledgeContext,
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
        <div className="h-full flex flex-col bg-gray-50">
            <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onBack}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-500" />
                        </button>
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", colors.bg)}>
                            <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-gray-900">{agent.name}</h1>
                            <p className="text-sm text-gray-500">{agent.description}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onTest}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
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
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            )}
                        >
                            {saving ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            <span className="hidden sm:inline">{saving ? 'Saving...' : 'Save'}</span>
                        </button>
                    </div>
                </div>

                <div className="flex gap-1 mt-4 overflow-x-auto pb-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors",
                                activeTab === tab.id
                                    ? `${colors.light} ${colors.text}`
                                    : "text-gray-500 hover:bg-gray-100"
                            )}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-auto p-4 md:p-6">
                <div className="max-w-3xl mx-auto">
                    {activeTab === 'knowledge' && (
                        <div className="space-y-4">
                            <div className={cn("rounded-xl p-4", colors.light, colors.border, "border")}>
                                <div className="flex items-start gap-3">
                                    <Lightbulb className={cn("w-5 h-5 mt-0.5", colors.text)} />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            Teach your AI about your business
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            The more details you provide, the better your AI can help customers. We've pre-filled some info from your profile.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                <button
                                    onClick={() => toggleSection('business')}
                                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                                            <Building2 className="w-5 h-5 text-indigo-600" />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="font-medium text-gray-900">Business Details</h3>
                                            <p className="text-sm text-gray-500">Name, hours, location, contact</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {loadingProfile && (
                                            <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
                                        )}
                                        {expandedSections.includes('business') ? (
                                            <ChevronUp className="w-5 h-5 text-gray-400" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-gray-400" />
                                        )}
                                    </div>
                                </button>

                                {expandedSections.includes('business') && (
                                    <div className="px-4 pb-4 border-t border-gray-100">
                                        <div className="flex items-center justify-between mt-4 mb-3">
                                            <p className="text-xs text-gray-500">
                                                ✨ Auto-filled from your Business Profile
                                            </p>
                                            <button
                                                onClick={loadPartnerProfile}
                                                disabled={loadingProfile}
                                                className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                                            >
                                                <RefreshCw className={cn("w-3 h-3", loadingProfile && "animate-spin")} />
                                                Refresh
                                            </button>
                                        </div>
                                        <div className="grid gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Business Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={businessInfo.name}
                                                    onChange={(e) => updateBusinessInfo('name', e.target.value)}
                                                    placeholder="e.g., Joe's Pizza"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Tagline (optional)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={businessInfo.tagline}
                                                    onChange={(e) => updateBusinessInfo('tagline', e.target.value)}
                                                    placeholder="e.g., The best pizza in town since 1985"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    About Your Business
                                                </label>
                                                <textarea
                                                    value={businessInfo.description}
                                                    onChange={(e) => updateBusinessInfo('description', e.target.value)}
                                                    placeholder="Describe what you do, what makes you special..."
                                                    rows={3}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                />
                                            </div>

                                            <div className="grid sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        <Clock className="w-4 h-4 inline mr-1" />
                                                        Hours
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={businessInfo.hours}
                                                        onChange={(e) => updateBusinessInfo('hours', e.target.value)}
                                                        placeholder="e.g., Mon-Sat 9am-9pm"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        <MapPin className="w-4 h-4 inline mr-1" />
                                                        Address
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={businessInfo.address}
                                                        onChange={(e) => updateBusinessInfo('address', e.target.value)}
                                                        placeholder="e.g., 123 Main St, City"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid sm:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        <Phone className="w-4 h-4 inline mr-1" />
                                                        Phone
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={businessInfo.phone}
                                                        onChange={(e) => updateBusinessInfo('phone', e.target.value)}
                                                        placeholder="(555) 123-4567"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        <Mail className="w-4 h-4 inline mr-1" />
                                                        Email
                                                    </label>
                                                    <input
                                                        type="email"
                                                        value={businessInfo.email}
                                                        onChange={(e) => updateBusinessInfo('email', e.target.value)}
                                                        placeholder="hello@business.com"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        <Globe className="w-4 h-4 inline mr-1" />
                                                        Website
                                                    </label>
                                                    <input
                                                        type="url"
                                                        value={businessInfo.website}
                                                        onChange={(e) => updateBusinessInfo('website', e.target.value)}
                                                        placeholder="www.business.com"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                <button
                                    onClick={() => toggleSection('faqs')}
                                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                            <HelpCircle className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="font-medium text-gray-900">Common Questions (FAQs)</h3>
                                            <p className="text-sm text-gray-500">Pre-written answers for frequent questions</p>
                                        </div>
                                    </div>
                                    {expandedSections.includes('faqs') ? (
                                        <ChevronUp className="w-5 h-5 text-gray-400" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-gray-400" />
                                    )}
                                </button>

                                {expandedSections.includes('faqs') && (
                                    <div className="px-4 pb-4 border-t border-gray-100">
                                        <p className="text-sm text-gray-500 mt-4 mb-4">
                                            Your AI will use these exact answers when customers ask similar questions.
                                        </p>

                                        <div className="space-y-3">
                                            {faqs.map((faq, index) => (
                                                <div key={faq.id} className="bg-gray-50 rounded-lg p-3">
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-sm font-medium text-gray-400 mt-2 w-6">Q{index + 1}</span>
                                                        <div className="flex-1 space-y-2">
                                                            <input
                                                                type="text"
                                                                value={faq.question}
                                                                onChange={(e) => updateFaq(faq.id, 'question', e.target.value)}
                                                                placeholder="What do customers ask?"
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                                            />
                                                            <textarea
                                                                value={faq.answer}
                                                                onChange={(e) => updateFaq(faq.id, 'answer', e.target.value)}
                                                                placeholder="Your answer..."
                                                                rows={2}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() => removeFaq(faq.id)}
                                                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <button
                                            onClick={addFaq}
                                            className="mt-3 flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add another question
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                <button
                                    onClick={() => toggleSection('interactions')}
                                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                                            <MessageCircle className="w-5 h-5 text-amber-600" />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="font-medium text-gray-900">Example Interactions</h3>
                                            <p className="text-sm text-gray-500">Show your AI the ideal way to respond</p>
                                        </div>
                                    </div>
                                    {expandedSections.includes('interactions') ? (
                                        <ChevronUp className="w-5 h-5 text-gray-400" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-gray-400" />
                                    )}
                                </button>

                                {expandedSections.includes('interactions') && (
                                    <div className="px-4 pb-4 border-t border-gray-100">
                                        <p className="text-sm text-gray-500 mt-4 mb-4">
                                            These examples teach your AI the perfect tone and approach. Think of them as training conversations.
                                        </p>

                                        <div className="space-y-4">
                                            {exampleInteractions.map((interaction, index) => (
                                                <div key={interaction.id} className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-4">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                                                Example {index + 1}
                                                            </span>
                                                            <input
                                                                type="text"
                                                                value={interaction.situation}
                                                                onChange={(e) => updateInteraction(interaction.id, 'situation', e.target.value)}
                                                                placeholder="Situation (e.g., Greeting)"
                                                                className="px-2 py-1 text-xs border border-gray-200 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 w-32"
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() => removeInteraction(interaction.id)}
                                                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <div className="flex items-start gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                                                <User className="w-4 h-4 text-gray-500" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <label className="block text-xs font-medium text-gray-500 mb-1">Customer says:</label>
                                                                <input
                                                                    type="text"
                                                                    value={interaction.customerMessage}
                                                                    onChange={(e) => updateInteraction(interaction.id, 'customerMessage', e.target.value)}
                                                                    placeholder="e.g., Hi, I need help with something"
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="flex items-start gap-3">
                                                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0", colors.bg)}>
                                                                <Bot className="w-4 h-4 text-white" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <label className="block text-xs font-medium text-gray-500 mb-1">Ideal response:</label>
                                                                <textarea
                                                                    value={interaction.idealResponse}
                                                                    onChange={(e) => updateInteraction(interaction.id, 'idealResponse', e.target.value)}
                                                                    placeholder="Write the perfect response you'd want your AI to give..."
                                                                    rows={2}
                                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <button
                                            onClick={addInteraction}
                                            className="mt-4 flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Add another example
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                <button
                                    onClick={() => toggleSection('documents')}
                                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                            <FileText className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="font-medium text-gray-900">Documents</h3>
                                            <p className="text-sm text-gray-500">Files your AI can reference</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-500">
                                            {editedAgent.useAllDocuments ? 'All docs' : `${editedAgent.attachedDocumentIds.length} selected`}
                                        </span>
                                        {expandedSections.includes('documents') ? (
                                            <ChevronUp className="w-5 h-5 text-gray-400" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-gray-400" />
                                        )}
                                    </div>
                                </button>

                                {expandedSections.includes('documents') && (
                                    <div className="px-4 pb-4 border-t border-gray-100">
                                        <div className="mt-4 space-y-3">
                                            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={editedAgent.useAllDocuments}
                                                    onChange={(e) => updateAgent({ useAllDocuments: e.target.checked })}
                                                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                                />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">Use all documents</p>
                                                    <p className="text-xs text-gray-500">AI will search all {documents.length} uploaded files</p>
                                                </div>
                                            </label>

                                            {!editedAgent.useAllDocuments && (
                                                <div className="space-y-2 max-h-48 overflow-auto">
                                                    {documents.length === 0 ? (
                                                        <p className="text-sm text-gray-500 text-center py-4">
                                                            No documents uploaded yet. Go to Documents & Files to add some.
                                                        </p>
                                                    ) : (
                                                        documents.map(doc => (
                                                            <label
                                                                key={doc.id}
                                                                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
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
                                                                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                                                />
                                                                <FileText className="w-4 h-4 text-gray-400" />
                                                                <span className="text-sm text-gray-700 truncate">{doc.name}</span>
                                                            </label>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'personality' && (
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl border border-gray-200 p-4">
                                <h3 className="font-medium text-gray-900 mb-1">Communication Style</h3>
                                <p className="text-sm text-gray-500 mb-4">How should your AI sound when talking to customers?</p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Tone (pick one or more)</label>
                                        <div className="flex flex-wrap gap-2">
                                            {TONE_OPTIONS.map(option => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => {
                                                        const tones = editedAgent.tones.includes(option.value)
                                                            ? editedAgent.tones.filter(t => t !== option.value)
                                                            : [...editedAgent.tones, option.value];
                                                        updateAgent({ tones });
                                                    }}
                                                    className={cn(
                                                        "px-3 py-2 rounded-lg text-sm font-medium border transition-colors",
                                                        editedAgent.tones.includes(option.value)
                                                            ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                                                            : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                                                    )}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Style</label>
                                        <div className="grid sm:grid-cols-3 gap-2">
                                            {STYLE_OPTIONS.map(option => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => updateAgent({ style: option.value })}
                                                    className={cn(
                                                        "p-3 rounded-lg border text-left transition-colors",
                                                        editedAgent.style === option.value
                                                            ? "bg-indigo-50 border-indigo-300"
                                                            : "bg-white border-gray-200 hover:border-gray-300"
                                                    )}
                                                >
                                                    <p className={cn(
                                                        "text-sm font-medium",
                                                        editedAgent.style === option.value ? "text-indigo-700" : "text-gray-900"
                                                    )}>
                                                        {option.label}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Response Length</label>
                                        <div className="grid sm:grid-cols-3 gap-2">
                                            {LENGTH_OPTIONS.map(option => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => updateAgent({ responseLength: option.value })}
                                                    className={cn(
                                                        "p-3 rounded-lg border text-left transition-colors",
                                                        editedAgent.responseLength === option.value
                                                            ? "bg-indigo-50 border-indigo-300"
                                                            : "bg-white border-gray-200 hover:border-gray-300"
                                                    )}
                                                >
                                                    <p className={cn(
                                                        "text-sm font-medium",
                                                        editedAgent.responseLength === option.value ? "text-indigo-700" : "text-gray-900"
                                                    )}>
                                                        {option.label}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'rules' && (
                        <div className="space-y-4">
                            <div className="bg-white rounded-xl border border-gray-200 p-4">
                                <h3 className="font-medium text-gray-900 mb-1">Things to NEVER say</h3>
                                <p className="text-sm text-gray-500 mb-4">Words or phrases your AI should avoid</p>

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
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                            />
                                            <button
                                                onClick={() => {
                                                    updateAgent({ neverSay: editedAgent.neverSay.filter((_, i) => i !== index) });
                                                }}
                                                className="p-2 text-gray-400 hover:text-red-500"
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
                                        Add item
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 p-4">
                                <h3 className="font-medium text-gray-900 mb-1">Always include</h3>
                                <p className="text-sm text-gray-500 mb-4">Things your AI should mention</p>

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
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                            />
                                            <button
                                                onClick={() => {
                                                    updateAgent({ alwaysInclude: editedAgent.alwaysInclude.filter((_, i) => i !== index) });
                                                }}
                                                className="p-2 text-gray-400 hover:text-red-500"
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
                                        Add item
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 p-4">
                                <h3 className="font-medium text-gray-900 mb-1">Custom Response Rules</h3>
                                <p className="text-sm text-gray-500 mb-4">When customers say specific things, respond with exact text</p>

                                <div className="space-y-3">
                                    {editedAgent.responseRules.map((rule) => (
                                        <div key={rule.id} className="bg-gray-50 rounded-lg p-3">
                                            <div className="flex items-start gap-2 mb-2">
                                                <div className="flex-1">
                                                    <label className="block text-xs font-medium text-gray-500 mb-1">When customer says:</label>
                                                    <input
                                                        type="text"
                                                        value={rule.triggerKeywords.join(', ')}
                                                        onChange={(e) => updateResponseRule(rule.id, {
                                                            triggerKeywords: e.target.value.split(',').map(k => k.trim())
                                                        })}
                                                        placeholder="e.g., discount, promo code"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => removeResponseRule(rule.id)}
                                                    className="p-1 text-gray-400 hover:text-red-500 mt-5"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Respond with:</label>
                                                <textarea
                                                    value={rule.response}
                                                    onChange={(e) => updateResponseRule(rule.id, { response: e.target.value })}
                                                    placeholder="Your custom response..."
                                                    rows={2}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        onClick={addResponseRule}
                                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add rule
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'escalation' && (
                        <div className="space-y-4">
                            <div className={cn("rounded-xl p-4 border", colors.light, colors.border)}>
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className={cn("w-5 h-5 mt-0.5", colors.text)} />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            When should your AI get human help?
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            These settings ensure customers get a real person when needed.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editedAgent.escalationSettings.onHumanRequest}
                                        onChange={(e) => updateAgent({
                                            escalationSettings: {
                                                ...editedAgent.escalationSettings,
                                                onHumanRequest: e.target.checked
                                            }
                                        })}
                                        className="w-4 h-4 mt-1 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                    />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">When customer asks for a human</p>
                                        <p className="text-xs text-gray-500">Triggers: "speak to a person", "human please"</p>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editedAgent.escalationSettings.onFrustration}
                                        onChange={(e) => updateAgent({
                                            escalationSettings: {
                                                ...editedAgent.escalationSettings,
                                                onFrustration: e.target.checked
                                            }
                                        })}
                                        className="w-4 h-4 mt-1 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                    />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">When customer seems frustrated</p>
                                        <p className="text-xs text-gray-500">AI detects repeated questions or negative sentiment</p>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editedAgent.escalationSettings.onNoAnswer}
                                        onChange={(e) => updateAgent({
                                            escalationSettings: {
                                                ...editedAgent.escalationSettings,
                                                onNoAnswer: e.target.checked
                                            }
                                        })}
                                        className="w-4 h-4 mt-1 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                    />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">When AI can't answer</p>
                                        <p className="text-xs text-gray-500">After {editedAgent.escalationSettings.noAnswerAttempts} attempts</p>
                                    </div>
                                </label>

                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editedAgent.escalationSettings.onSensitiveTopics}
                                        onChange={(e) => updateAgent({
                                            escalationSettings: {
                                                ...editedAgent.escalationSettings,
                                                onSensitiveTopics: e.target.checked
                                            }
                                        })}
                                        className="w-4 h-4 mt-1 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                    />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">For sensitive topics</p>
                                        <p className="text-xs text-gray-500">
                                            Topics: {editedAgent.escalationSettings.sensitiveTopics.join(', ') || 'None set'}
                                        </p>
                                    </div>
                                </label>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 p-4">
                                <h3 className="font-medium text-gray-900 mb-1">Escalation Message</h3>
                                <p className="text-sm text-gray-500 mb-3">What your AI says when handing off</p>
                                <textarea
                                    value={editedAgent.escalationSettings.escalationMessage}
                                    onChange={(e) => updateAgent({
                                        escalationSettings: {
                                            ...editedAgent.escalationSettings,
                                            escalationMessage: e.target.value
                                        }
                                    })}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                    placeholder="e.g., Let me connect you with a team member..."
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}