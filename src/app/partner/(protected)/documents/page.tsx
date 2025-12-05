"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { usePartnerHub } from '@/hooks/use-partnerhub';
import { cn } from '@/lib/utils';
import {
    Upload,
    FileText,
    Image,
    File,
    Trash2,
    CheckCircle2,
    Clock,
    AlertCircle,
    Search,
    X,
    Eye,
    MessageCircle,
    Tag,
    Plus,
    Bot,
    Zap,
    Sparkles,
    ChevronDown,
    HelpCircle,
    DollarSign,
    Shield,
    BookOpen,
    Megaphone,
    Package,
    MapPin,
    Lightbulb,
    RefreshCw,
    Brain,
    Layers,
    LayoutGrid,
    List,
    Info,
    Edit3,
    Check,
    ArrowLeft,
    Send,
    MoreHorizontal,
    ExternalLink,
    Copy,
    Download
} from 'lucide-react';
import { ProcessingStatus, FileCategory, DocumentMetadata, ChatContextType } from '@/lib/partnerhub-types';

interface DocumentCategory {
    id: string;
    name: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    borderColor: string;
    description: string;
    keywords: string[];
    suggestedAgents: ('support' | 'sales' | 'marketing')[];
}

const DOCUMENT_CATEGORIES: Record<string, DocumentCategory> = {
    faq: {
        id: 'faq',
        name: 'FAQ & Help',
        icon: HelpCircle,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        description: 'Common questions and answers',
        keywords: ['faq', 'question', 'answer', 'help', 'support', 'how to', 'guide'],
        suggestedAgents: ['support'],
    },
    pricing: {
        id: 'pricing',
        name: 'Pricing & Rates',
        icon: DollarSign,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
        description: 'Price lists, packages, quotes',
        keywords: ['price', 'pricing', 'cost', 'rate', 'fee', 'package', 'quote', 'tariff'],
        suggestedAgents: ['sales'],
    },
    product: {
        id: 'product',
        name: 'Products & Services',
        icon: Package,
        color: 'text-violet-600',
        bgColor: 'bg-violet-50',
        borderColor: 'border-violet-200',
        description: 'Catalogs, menus, offerings',
        keywords: ['menu', 'catalog', 'product', 'service', 'offering', 'item', 'inventory'],
        suggestedAgents: ['sales', 'support'],
    },
    policy: {
        id: 'policy',
        name: 'Policies & Terms',
        icon: Shield,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        description: 'Return policy, terms, guarantees',
        keywords: ['policy', 'term', 'condition', 'return', 'refund', 'warranty', 'guarantee', 'legal'],
        suggestedAgents: ['support'],
    },
    contact: {
        id: 'contact',
        name: 'Contact & Hours',
        icon: MapPin,
        color: 'text-rose-600',
        bgColor: 'bg-rose-50',
        borderColor: 'border-rose-200',
        description: 'Location, hours, contact info',
        keywords: ['contact', 'address', 'location', 'hour', 'phone', 'email', 'direction', 'map'],
        suggestedAgents: ['support', 'sales'],
    },
    promo: {
        id: 'promo',
        name: 'Promotions',
        icon: Megaphone,
        color: 'text-pink-600',
        bgColor: 'bg-pink-50',
        borderColor: 'border-pink-200',
        description: 'Offers, discounts, campaigns',
        keywords: ['promo', 'discount', 'offer', 'sale', 'deal', 'coupon', 'special', 'campaign'],
        suggestedAgents: ['marketing', 'sales'],
    },
    general: {
        id: 'general',
        name: 'General',
        icon: BookOpen,
        color: 'text-slate-600',
        bgColor: 'bg-slate-50',
        borderColor: 'border-slate-200',
        description: 'Other business information',
        keywords: [],
        suggestedAgents: ['support', 'sales', 'marketing'],
    },
};

const AGENT_INFO = {
    support: { name: 'Customer Support', icon: Bot, color: 'text-blue-600', bg: 'bg-blue-100', bgDark: 'bg-blue-500' },
    sales: { name: 'Sales', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-100', bgDark: 'bg-amber-500' },
    marketing: { name: 'Marketing', icon: Sparkles, color: 'text-purple-600', bg: 'bg-purple-100', bgDark: 'bg-purple-500' },
};

type ViewMode = 'grid' | 'list';
type PageView = 'list' | 'detail' | 'chat';

const inferCategory = (doc: DocumentMetadata): string => {
    const name = doc.name.toLowerCase();
    const summary = (doc.summary || '').toLowerCase();
    const tags = (doc.tags || []).map(t => t.toLowerCase());
    const combined = `${name} ${summary} ${tags.join(' ')}`;

    for (const [categoryId, category] of Object.entries(DOCUMENT_CATEGORIES)) {
        if (categoryId === 'general') continue;
        if (category.keywords.some(keyword => combined.includes(keyword))) {
            return categoryId;
        }
    }
    return 'general';
};

export default function DocumentsPage() {
    const {
        documents,
        uploadDocument,
        deleteDocument,
        addTagToDocument,
        removeTagFromDocument,
        updateDocumentMetadata,
    } = usePartnerHub();

    const [pageView, setPageView] = useState<PageView>('list');
    const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [editingField, setEditingField] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [newTag, setNewTag] = useState('');
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);

    const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const enrichedDocuments = useMemo(() => {
        return documents.map(doc => {
            const categoryTag = doc.tags?.find(t => Object.keys(DOCUMENT_CATEGORIES).includes(t));
            const category = categoryTag || inferCategory(doc);
            const categoryInfo = DOCUMENT_CATEGORIES[category] || DOCUMENT_CATEGORIES.general;
            const assignedAgents = categoryInfo.suggestedAgents;

            return {
                ...doc,
                inferredCategory: category,
                categoryInfo,
                assignedAgents,
            };
        });
    }, [documents]);

    const filteredDocuments = useMemo(() => {
        let filtered = enrichedDocuments;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(doc =>
                doc.name.toLowerCase().includes(query) ||
                doc.summary?.toLowerCase().includes(query) ||
                doc.tags?.some(tag => tag.toLowerCase().includes(query))
            );
        }

        if (filterCategory) {
            filtered = filtered.filter(doc => doc.inferredCategory === filterCategory);
        }

        return filtered.sort((a, b) =>
            new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
        );
    }, [enrichedDocuments, searchQuery, filterCategory]);

    const categoryStats = useMemo(() => {
        const stats: Record<string, number> = {};
        enrichedDocuments.forEach(doc => {
            stats[doc.inferredCategory] = (stats[doc.inferredCategory] || 0) + 1;
        });
        return stats;
    }, [enrichedDocuments]);

    const knowledgeGaps = useMemo(() => {
        const gaps: { category: string; message: string; icon: React.ElementType }[] = [];
        if (!categoryStats.pricing) gaps.push({
            category: 'pricing',
            message: 'Add pricing info so AI can answer "How much does it cost?"',
            icon: DollarSign
        });
        if (!categoryStats.faq) gaps.push({
            category: 'faq',
            message: 'Add FAQs to handle common customer questions automatically',
            icon: HelpCircle
        });
        if (!categoryStats.contact) gaps.push({
            category: 'contact',
            message: 'Add hours & location so AI can answer "When are you open?"',
            icon: MapPin
        });
        return gaps.slice(0, 2);
    }, [categoryStats]);

    const selectedDoc = selectedDocId ? enrichedDocuments.find(d => d.id === selectedDocId) : null;

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        setUploading(true);
        await Promise.all(Array.from(files).map(file => uploadDocument(file)));
        setUploading(false);
        event.target.value = '';
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            setUploading(true);
            await Promise.all(Array.from(files).map(file => uploadDocument(file)));
            setUploading(false);
        }
    };

    const handleSelectDocument = (docId: string) => {
        setSelectedDocId(docId);
        setPageView('detail');
        setChatMessages([]);
    };

    const handleCategoryChange = async (newCategory: string) => {
        if (!selectedDocId) return;
        const doc = documents.find(d => d.id === selectedDocId);
        if (!doc) return;

        const existingCategoryTags = doc.tags?.filter(t => Object.keys(DOCUMENT_CATEGORIES).includes(t)) || [];
        for (const tag of existingCategoryTags) {
            await removeTagFromDocument(selectedDocId, tag);
        }
        await addTagToDocument(selectedDocId, newCategory);
        setShowCategoryPicker(false);
    };

    const handleAddTag = async () => {
        if (!selectedDocId || !newTag.trim()) return;
        await addTagToDocument(selectedDocId, newTag.trim().toLowerCase());
        setNewTag('');
    };

    const handleSendChat = async () => {
        if (!chatInput.trim() || !selectedDoc) return;

        const userMessage = chatInput.trim();
        setChatInput('');
        setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setChatLoading(true);

        setTimeout(() => {
            setChatMessages(prev => [...prev, {
                role: 'assistant',
                content: `Based on "${selectedDoc.name}", here's what I found:\n\n${selectedDoc.summary || 'I can help you find information from this document. What would you like to know?'}`
            }]);
            setChatLoading(false);
        }, 1000);
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const formatDate = (date: any) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getStatusInfo = (status: ProcessingStatus) => {
        switch (status) {
            case ProcessingStatus.COMPLETED:
                return { icon: CheckCircle2, text: 'Ready', color: 'text-emerald-600', bg: 'bg-emerald-50' };
            case ProcessingStatus.PROCESSING:
                return { icon: RefreshCw, text: 'Analyzing...', color: 'text-amber-600', bg: 'bg-amber-50', spin: true };
            case ProcessingStatus.FAILED:
                return { icon: AlertCircle, text: 'Failed', color: 'text-red-600', bg: 'bg-red-50' };
            default:
                return { icon: Clock, text: 'Pending', color: 'text-slate-500', bg: 'bg-slate-50' };
        }
    };

    const getFileIcon = (category: FileCategory) => {
        switch (category) {
            case FileCategory.IMAGE: return Image;
            case FileCategory.DOCUMENT: return FileText;
            default: return File;
        }
    };

    if (pageView === 'detail' && selectedDoc) {
        return (
            <div className="h-full flex flex-col bg-slate-50">
                <div className="bg-white border-b border-slate-200 px-6 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => { setPageView('list'); setSelectedDocId(null); }}
                            className="p-2 -ml-2 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-500" />
                        </button>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-lg font-semibold text-slate-900 truncate">{selectedDoc.name}</h1>
                            <p className="text-sm text-slate-500">{formatFileSize(selectedDoc.size)} • {formatDate(selectedDoc.updatedAt)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPageView('chat')}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
                            >
                                <MessageCircle className="w-4 h-4" />
                                Ask Questions
                            </button>
                            <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                                <MoreHorizontal className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    <div className="max-w-3xl mx-auto p-6 space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                            <div className="p-6 border-b border-slate-100">
                                <div className="flex items-start gap-4">
                                    <div className={cn(
                                        "w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0",
                                        selectedDoc.categoryInfo.bgColor
                                    )}>
                                        <selectedDoc.categoryInfo.icon className={cn("w-8 h-8", selectedDoc.categoryInfo.color)} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h2 className="text-xl font-semibold text-slate-900">{selectedDoc.name}</h2>
                                                <p className="text-slate-500 mt-1">{selectedDoc.categoryInfo.description}</p>
                                            </div>
                                            {(() => {
                                                const status = getStatusInfo(selectedDoc.status);
                                                return (
                                                    <span className={cn(
                                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
                                                        status.bg, status.color
                                                    )}>
                                                        <status.icon className={cn("w-4 h-4", status.spin && "animate-spin")} />
                                                        {status.text}
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="divide-y divide-slate-100">
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-semibold text-slate-900">Category</h3>
                                        <button
                                            onClick={() => setShowCategoryPicker(!showCategoryPicker)}
                                            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" />
                                            Change
                                        </button>
                                    </div>

                                    {showCategoryPicker ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            {Object.values(DOCUMENT_CATEGORIES).map(cat => (
                                                <button
                                                    key={cat.id}
                                                    onClick={() => handleCategoryChange(cat.id)}
                                                    className={cn(
                                                        "flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left",
                                                        selectedDoc.inferredCategory === cat.id
                                                            ? `${cat.bgColor} ${cat.borderColor}`
                                                            : "border-slate-200 hover:border-slate-300 bg-white"
                                                    )}
                                                >
                                                    <cat.icon className={cn("w-5 h-5", cat.color)} />
                                                    <span className="text-sm font-medium text-slate-700">{cat.name}</span>
                                                    {selectedDoc.inferredCategory === cat.id && (
                                                        <Check className="w-4 h-4 text-emerald-500 ml-auto" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className={cn(
                                            "inline-flex items-center gap-2 px-4 py-2 rounded-xl",
                                            selectedDoc.categoryInfo.bgColor
                                        )}>
                                            <selectedDoc.categoryInfo.icon className={cn("w-5 h-5", selectedDoc.categoryInfo.color)} />
                                            <span className={cn("font-medium", selectedDoc.categoryInfo.color)}>
                                                {selectedDoc.categoryInfo.name}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="p-6">
                                    <h3 className="text-sm font-semibold text-slate-900 mb-3">AI Assistants Using This</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedDoc.assignedAgents.map(agentKey => {
                                            const agent = AGENT_INFO[agentKey];
                                            return (
                                                <div
                                                    key={agentKey}
                                                    className={cn(
                                                        "flex items-center gap-2 px-3 py-2 rounded-xl",
                                                        agent.bg
                                                    )}
                                                >
                                                    <agent.icon className={cn("w-4 h-4", agent.color)} />
                                                    <span className={cn("text-sm font-medium", agent.color)}>{agent.name}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
                                        <Info className="w-3.5 h-3.5" />
                                        Auto-assigned based on category. Change category to update.
                                    </p>
                                </div>

                                <div className="p-6">
                                    <h3 className="text-sm font-semibold text-slate-900 mb-3">Tags</h3>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {selectedDoc.tags?.filter(t => !Object.keys(DOCUMENT_CATEGORIES).includes(t)).map(tag => (
                                            <span
                                                key={tag}
                                                className="group inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm"
                                            >
                                                #{tag}
                                                <button
                                                    onClick={() => removeTagFromDocument(selectedDoc.id, tag)}
                                                    className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </span>
                                        ))}
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="text"
                                                value={newTag}
                                                onChange={(e) => setNewTag(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                                                placeholder="Add tag..."
                                                className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-28"
                                            />
                                            {newTag && (
                                                <button
                                                    onClick={handleAddTag}
                                                    className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {selectedDoc.summary && (
                                    <div className="p-6">
                                        <h3 className="text-sm font-semibold text-slate-900 mb-3">AI Summary</h3>
                                        <p className="text-slate-600 leading-relaxed">{selectedDoc.summary}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {selectedDoc.storageUrl && (
                                    <a
                                        href={selectedDoc.storageUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                        Open Original
                                    </a>
                                )}
                            </div>
                            <button
                                onClick={() => {
                                    if (confirm('Delete this document? This cannot be undone.')) {
                                        deleteDocument(selectedDoc.id);
                                        setPageView('list');
                                        setSelectedDocId(null);
                                    }
                                }}
                                className="flex items-center gap-2 px-4 py-2.5 text-red-600 text-sm font-medium rounded-xl hover:bg-red-50 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (pageView === 'chat' && selectedDoc) {
        return (
            <div className="h-full flex flex-col bg-white">
                <div className="border-b border-slate-200 px-6 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setPageView('detail')}
                            className="p-2 -ml-2 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-500" />
                        </button>
                        <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            selectedDoc.categoryInfo.bgColor
                        )}>
                            <selectedDoc.categoryInfo.icon className={cn("w-5 h-5", selectedDoc.categoryInfo.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-base font-semibold text-slate-900 truncate">Chat with {selectedDoc.name}</h1>
                            <p className="text-sm text-slate-500">Ask questions about this document</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-6">
                    <div className="max-w-2xl mx-auto space-y-4">
                        {chatMessages.length === 0 && (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                                    <MessageCircle className="w-8 h-8 text-indigo-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">Ask anything about this document</h3>
                                <p className="text-slate-500 mb-6">I'll search through the content and give you accurate answers</p>
                                <div className="flex flex-wrap justify-center gap-2">
                                    {['What is this about?', 'Summarize the key points', 'What are the main topics?'].map(q => (
                                        <button
                                            key={q}
                                            onClick={() => { setChatInput(q); }}
                                            className="px-4 py-2 bg-slate-100 text-slate-700 text-sm rounded-xl hover:bg-slate-200 transition-colors"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {chatMessages.map((msg, i) => (
                            <div key={i} className={cn("flex", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                                <div className={cn(
                                    "max-w-[80%] rounded-2xl px-4 py-3",
                                    msg.role === 'user'
                                        ? "bg-indigo-600 text-white"
                                        : "bg-slate-100 text-slate-900"
                                )}>
                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            </div>
                        ))}

                        {chatLoading && (
                            <div className="flex justify-start">
                                <div className="bg-slate-100 rounded-2xl px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>
                </div>

                <div className="border-t border-slate-200 p-4">
                    <div className="max-w-2xl mx-auto">
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendChat()}
                                placeholder="Ask a question..."
                                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <button
                                onClick={handleSendChat}
                                disabled={!chatInput.trim() || chatLoading}
                                className={cn(
                                    "p-3 rounded-xl transition-colors",
                                    chatInput.trim() && !chatLoading
                                        ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                        : "bg-slate-100 text-slate-400"
                                )}
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-slate-50">
            <div className="bg-white border-b border-slate-200 px-6 py-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-slate-900">Your Documents</h1>
                        <p className="text-slate-500 text-sm mt-0.5">
                            {documents.length === 0
                                ? 'Upload files to train your AI assistants'
                                : `${documents.length} document${documents.length !== 1 ? 's' : ''} • AI will use these to answer customer questions`
                            }
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer">
                            <Upload className="w-4 h-4" />
                            Upload
                            <input
                                type="file"
                                multiple
                                accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.png,.jpg,.jpeg"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                        </label>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                <div className="p-6 space-y-6">
                    {documents.length === 0 ? (
                        <div
                            onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={(e) => { e.preventDefault(); if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false); }}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                            className={cn(
                                "relative rounded-2xl border-2 border-dashed p-12 text-center transition-all",
                                isDragging
                                    ? "border-indigo-400 bg-indigo-50"
                                    : "border-slate-300 bg-white hover:border-slate-400"
                            )}
                        >
                            <input
                                type="file"
                                multiple
                                accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.png,.jpg,.jpeg"
                                onChange={handleFileUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />

                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center mx-auto mb-6">
                                {uploading ? (
                                    <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin" />
                                ) : (
                                    <Layers className="w-10 h-10 text-indigo-600" />
                                )}
                            </div>

                            <h3 className="text-xl font-semibold text-slate-900 mb-2">
                                {uploading ? 'Uploading & analyzing...' : 'Drop files here to get started'}
                            </h3>
                            <p className="text-slate-500 mb-8 max-w-md mx-auto">
                                Upload your business documents and AI will automatically learn from them to answer customer questions.
                            </p>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 max-w-2xl mx-auto">
                                {Object.values(DOCUMENT_CATEGORIES).filter(c => c.id !== 'general').map(cat => (
                                    <div
                                        key={cat.id}
                                        className={cn(
                                            "flex flex-col items-center gap-2 p-3 rounded-xl",
                                            cat.bgColor
                                        )}
                                    >
                                        <cat.icon className={cn("w-5 h-5", cat.color)} />
                                        <span className="text-xs font-medium text-slate-700">{cat.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div
                                onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={(e) => { e.preventDefault(); if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false); }}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleDrop}
                                className={cn(
                                    "relative rounded-2xl border-2 border-dashed p-4 transition-all",
                                    isDragging
                                        ? "border-indigo-400 bg-indigo-50"
                                        : "border-slate-200 bg-white hover:border-slate-300"
                                )}
                            >
                                <input
                                    type="file"
                                    multiple
                                    accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.png,.jpg,.jpeg"
                                    onChange={handleFileUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                                        isDragging ? "bg-indigo-100" : "bg-slate-100"
                                    )}>
                                        {uploading ? (
                                            <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
                                        ) : (
                                            <Upload className={cn("w-6 h-6", isDragging ? "text-indigo-600" : "text-slate-400")} />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-700">
                                            {uploading ? 'Uploading & analyzing...' : 'Drop more files or click to upload'}
                                        </p>
                                        <p className="text-xs text-slate-500">PDF, Word, Excel, images</p>
                                    </div>
                                </div>
                            </div>

                            {knowledgeGaps.length > 0 && (
                                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                                            <Lightbulb className="w-5 h-5 text-amber-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-amber-900">Improve Your AI</h3>
                                            <div className="mt-2 space-y-1.5">
                                                {knowledgeGaps.map((gap, i) => (
                                                    <p key={i} className="text-sm text-amber-800 flex items-center gap-2">
                                                        <gap.icon className="w-4 h-4 text-amber-600" />
                                                        {gap.message}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                    <button
                                        onClick={() => setFilterCategory(null)}
                                        className={cn(
                                            "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
                                            !filterCategory
                                                ? "bg-slate-900 text-white shadow-sm"
                                                : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
                                        )}
                                    >
                                        All ({documents.length})
                                    </button>
                                    {Object.entries(categoryStats).map(([cat, count]) => {
                                        const info = DOCUMENT_CATEGORIES[cat];
                                        if (!info) return null;
                                        return (
                                            <button
                                                key={cat}
                                                onClick={() => setFilterCategory(filterCategory === cat ? null : cat)}
                                                className={cn(
                                                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
                                                    filterCategory === cat
                                                        ? `${info.bgColor} ${info.color} shadow-sm`
                                                        : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
                                                )}
                                            >
                                                <info.icon className="w-4 h-4" />
                                                {info.name} ({count})
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search documents..."
                                            className="pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-48 bg-white"
                                        />
                                        {searchQuery && (
                                            <button
                                                onClick={() => setSearchQuery('')}
                                                className="absolute right-3 top-1/2 -translate-y-1/2"
                                            >
                                                <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden">
                                        <button
                                            onClick={() => setViewMode('grid')}
                                            className={cn(
                                                "p-2 transition-colors",
                                                viewMode === 'grid' ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:text-slate-600"
                                            )}
                                        >
                                            <LayoutGrid className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setViewMode('list')}
                                            className={cn(
                                                "p-2 transition-colors",
                                                viewMode === 'list' ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:text-slate-600"
                                            )}
                                        >
                                            <List className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {filteredDocuments.length === 0 ? (
                                <div className="text-center py-12">
                                    <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500">No documents match your search</p>
                                </div>
                            ) : viewMode === 'grid' ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {filteredDocuments.map(doc => {
                                        const status = getStatusInfo(doc.status);
                                        return (
                                            <div
                                                key={doc.id}
                                                onClick={() => handleSelectDocument(doc.id)}
                                                className="group bg-white rounded-2xl border border-slate-200 p-5 cursor-pointer transition-all hover:shadow-lg hover:border-slate-300 hover:-translate-y-0.5"
                                            >
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className={cn(
                                                        "w-12 h-12 rounded-xl flex items-center justify-center",
                                                        doc.categoryInfo.bgColor
                                                    )}>
                                                        <doc.categoryInfo.icon className={cn("w-6 h-6", doc.categoryInfo.color)} />
                                                    </div>
                                                    <span className={cn(
                                                        "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium",
                                                        status.bg, status.color
                                                    )}>
                                                        <status.icon className={cn("w-3 h-3", status.spin && "animate-spin")} />
                                                        {status.text}
                                                    </span>
                                                </div>

                                                <h3 className="font-semibold text-slate-900 mb-1 truncate" title={doc.name}>
                                                    {doc.name}
                                                </h3>
                                                <p className="text-sm text-slate-500 mb-4">
                                                    {doc.categoryInfo.name} • {formatFileSize(doc.size)}
                                                </p>

                                                <div className="flex items-center justify-between">
                                                    <div className="flex -space-x-2">
                                                        {doc.assignedAgents.slice(0, 3).map(agentKey => {
                                                            const agent = AGENT_INFO[agentKey];
                                                            return (
                                                                <div
                                                                    key={agentKey}
                                                                    className={cn(
                                                                        "w-7 h-7 rounded-full flex items-center justify-center border-2 border-white",
                                                                        agent.bgDark
                                                                    )}
                                                                    title={agent.name}
                                                                >
                                                                    <agent.icon className="w-3.5 h-3.5 text-white" />
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    {doc.status === ProcessingStatus.COMPLETED && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedDocId(doc.id);
                                                                setPageView('chat');
                                                            }}
                                                            className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-all"
                                                        >
                                                            <MessageCircle className="w-3.5 h-3.5" />
                                                            Chat
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
                                    {filteredDocuments.map(doc => {
                                        const status = getStatusInfo(doc.status);
                                        return (
                                            <div
                                                key={doc.id}
                                                onClick={() => handleSelectDocument(doc.id)}
                                                className="group flex items-center gap-4 p-4 cursor-pointer transition-colors hover:bg-slate-50"
                                            >
                                                <div className={cn(
                                                    "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                                                    doc.categoryInfo.bgColor
                                                )}>
                                                    <doc.categoryInfo.icon className={cn("w-6 h-6", doc.categoryInfo.color)} />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-slate-900 truncate">{doc.name}</h3>
                                                    <p className="text-sm text-slate-500">
                                                        {doc.categoryInfo.name} • {formatFileSize(doc.size)} • {formatDate(doc.updatedAt)}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <div className="hidden sm:flex -space-x-2">
                                                        {doc.assignedAgents.map(agentKey => {
                                                            const agent = AGENT_INFO[agentKey];
                                                            return (
                                                                <div
                                                                    key={agentKey}
                                                                    className={cn(
                                                                        "w-7 h-7 rounded-full flex items-center justify-center border-2 border-white",
                                                                        agent.bgDark
                                                                    )}
                                                                    title={agent.name}
                                                                >
                                                                    <agent.icon className="w-3.5 h-3.5 text-white" />
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    <span className={cn(
                                                        "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium",
                                                        status.bg, status.color
                                                    )}>
                                                        <status.icon className={cn("w-3.5 h-3.5", status.spin && "animate-spin")} />
                                                        {status.text}
                                                    </span>
                                                    {doc.status === ProcessingStatus.COMPLETED && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedDocId(doc.id);
                                                                setPageView('chat');
                                                            }}
                                                            className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-all"
                                                        >
                                                            <MessageCircle className="w-3.5 h-3.5" />
                                                            Chat
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}