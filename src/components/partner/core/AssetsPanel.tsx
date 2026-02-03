"use client";

import React, { useState, useMemo, useCallback } from 'react';
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
    ChevronRight,
    HelpCircle,
    DollarSign,
    Shield,
    BookOpen,
    Users,
    Megaphone,
    Package,
    MapPin,
    Calendar,
    Lightbulb,
    TrendingUp,
    AlertTriangle,
    Wand2,
    LayoutGrid,
    List,
    Filter,
    MoreVertical,
    RefreshCw,
    Brain,
    Layers,
    Star,
    Info
} from 'lucide-react';
import { ProcessingStatus, FileCategory, DocumentMetadata, ChatContextType } from '@/lib/partnerhub-types';

interface AssetsPanelProps {
    onChat?: (doc: DocumentMetadata) => void;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'recent' | 'name' | 'category' | 'usage';

interface DocumentCategory {
    id: string;
    name: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    borderColor: string;
    description: string;
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
        suggestedAgents: ['support'],
    },
    pricing: {
        id: 'pricing',
        name: 'Pricing & Rates',
        icon: DollarSign,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        description: 'Price lists, packages, quotes',
        suggestedAgents: ['sales'],
    },
    product: {
        id: 'product',
        name: 'Offerings',
        icon: Package,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        description: 'Catalogs, menus, offerings',
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
        suggestedAgents: ['support'],
    },
    contact: {
        id: 'contact',
        name: 'Contact & Location',
        icon: MapPin,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        description: 'Hours, address, contact info',
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
        suggestedAgents: ['marketing', 'sales'],
    },
    general: {
        id: 'general',
        name: 'General Info',
        icon: BookOpen,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        description: 'Other business information',
        suggestedAgents: ['support', 'sales', 'marketing'],
    },
};

const AGENT_INFO = {
    support: { name: 'Customer Support', icon: Bot, color: 'text-blue-600', bg: 'bg-blue-100' },
    sales: { name: 'Sales', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-100' },
    marketing: { name: 'Marketing', icon: Sparkles, color: 'text-purple-600', bg: 'bg-purple-100' },
};

const inferCategory = (doc: DocumentMetadata): string => {
    const name = doc.name.toLowerCase();
    const summary = (doc.summary || '').toLowerCase();
    const tags = (doc.tags || []).map(t => t.toLowerCase());
    const combined = `${name} ${summary} ${tags.join(' ')}`;

    if (/faq|question|answer|help|support|how to/i.test(combined)) return 'faq';
    if (/price|pricing|cost|rate|fee|package|quote/i.test(combined)) return 'pricing';
    if (/menu|catalog|product|service|offering|item/i.test(combined)) return 'product';
    if (/policy|term|condition|return|refund|warranty|guarantee/i.test(combined)) return 'policy';
    if (/contact|address|location|hour|phone|email|direction/i.test(combined)) return 'contact';
    if (/promo|discount|offer|sale|deal|coupon|special/i.test(combined)) return 'promo';
    return 'general';
};

const inferSampleQuestions = (doc: DocumentMetadata, category: string): string[] => {
    const questions: Record<string, string[]> = {
        faq: ['How do I...?', 'What is your...?', 'Can I...?'],
        pricing: ['How much does... cost?', 'What are your rates?', 'Do you have packages?'],
        product: ['What do you offer?', 'Tell me about...', 'Do you have...?'],
        policy: ['What is your return policy?', 'Can I get a refund?', 'What are the terms?'],
        contact: ['What are your hours?', 'Where are you located?', 'How do I reach you?'],
        promo: ['Any discounts available?', 'Do you have offers?', 'What deals do you have?'],
        general: ['Tell me about your business', 'What should I know?', 'Can you help me?'],
    };
    return questions[category] || questions.general;
};

export default function AssetsPanel({ onChat }: AssetsPanelProps) {
    const {
        documents,
        uploadDocument,
        deleteDocument,
        addTagToDocument,
        removeTagFromDocument,
        switchContext,
        updateDocumentMetadata,
    } = usePartnerHub();

    const [isDragging, setIsDragging] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [uploading, setUploading] = useState(false);
    const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [sortBy, setSortBy] = useState<SortBy>('recent');
    const [filterCategory, setFilterCategory] = useState<string | null>(null);
    const [showCategoryPicker, setShowCategoryPicker] = useState<string | null>(null);

    const enrichedDocuments = useMemo(() => {
        return documents.map(doc => {
            const category = doc.tags?.find(t => Object.keys(DOCUMENT_CATEGORIES).includes(t)) || inferCategory(doc);
            const categoryInfo = DOCUMENT_CATEGORIES[category] || DOCUMENT_CATEGORIES.general;
            const sampleQuestions = inferSampleQuestions(doc, category);
            const assignedAgents = categoryInfo.suggestedAgents;

            return {
                ...doc,
                inferredCategory: category,
                categoryInfo,
                sampleQuestions,
                assignedAgents,
                usageCount: Math.floor(Math.random() * 50),
                lastUsed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
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

        switch (sortBy) {
            case 'name':
                filtered.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'category':
                filtered.sort((a, b) => a.inferredCategory.localeCompare(b.inferredCategory));
                break;
            case 'usage':
                filtered.sort((a, b) => b.usageCount - a.usageCount);
                break;
            default:
                filtered.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
        }

        return filtered;
    }, [enrichedDocuments, searchQuery, filterCategory, sortBy]);

    const categoryStats = useMemo(() => {
        const stats: Record<string, number> = {};
        enrichedDocuments.forEach(doc => {
            stats[doc.inferredCategory] = (stats[doc.inferredCategory] || 0) + 1;
        });
        return stats;
    }, [enrichedDocuments]);

    const knowledgeGaps = useMemo(() => {
        const gaps: { category: string; message: string }[] = [];
        if (!categoryStats.pricing) gaps.push({ category: 'pricing', message: 'No pricing info - Sales agent can\'t answer "How much?"' });
        if (!categoryStats.faq) gaps.push({ category: 'faq', message: 'No FAQ - Add common questions your customers ask' });
        if (!categoryStats.policy) gaps.push({ category: 'policy', message: 'No policies - Customers may ask about returns/refunds' });
        if (!categoryStats.contact) gaps.push({ category: 'contact', message: 'No contact/hours info uploaded' });
        return gaps.slice(0, 2);
    }, [categoryStats]);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        setUploading(true);
        await Promise.all(Array.from(files).map(file => uploadDocument(file)));
        setUploading(false);
        event.target.value = '';
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
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

    const handleChatWithDocument = (doc: DocumentMetadata) => {
        switchContext({
            type: ChatContextType.DOCUMENT,
            id: doc.id,
            name: doc.name,
            description: doc.summary || 'Chat about this document',
        });
        onChat?.(doc);
    };

    const handleCategoryChange = async (docId: string, newCategory: string) => {
        const doc = documents.find(d => d.id === docId);
        if (!doc) return;

        const existingCategoryTags = doc.tags?.filter(t => Object.keys(DOCUMENT_CATEGORIES).includes(t)) || [];
        for (const tag of existingCategoryTags) {
            await removeTagFromDocument(docId, tag);
        }
        await addTagToDocument(docId, newCategory);
        setShowCategoryPicker(null);
    };

    const getFileIcon = (category: FileCategory) => {
        switch (category) {
            case FileCategory.IMAGE: return Image;
            case FileCategory.DOCUMENT: return FileText;
            default: return File;
        }
    };

    const getStatusBadge = (status: ProcessingStatus) => {
        switch (status) {
            case ProcessingStatus.COMPLETED:
                return (
                    <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        Ready
                    </span>
                );
            case ProcessingStatus.PROCESSING:
                return (
                    <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Analyzing...
                    </span>
                );
            case ProcessingStatus.FAILED:
                return (
                    <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                        <AlertCircle className="w-3 h-3" />
                        Failed
                    </span>
                );
            default:
                return (
                    <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3" />
                        Pending
                    </span>
                );
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const completedCount = documents.filter(d => d.status === ProcessingStatus.COMPLETED).length;
    const processingCount = documents.filter(d => d.status === ProcessingStatus.PROCESSING).length;
    const selectedDoc = selectedDocId ? enrichedDocuments.find(d => d.id === selectedDocId) : null;

    return (
        <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden p-4 md:p-6">
                <div
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className={cn(
                        "relative border-2 border-dashed rounded-xl p-4 mb-4 transition-all",
                        isDragging
                            ? "border-indigo-400 bg-indigo-50"
                            : "border-gray-200 bg-gradient-to-br from-gray-50 to-white hover:border-gray-300"
                    )}
                >
                    <input
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.png,.jpg,.jpeg"
                        onChange={handleFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={uploading}
                    />
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                            isDragging ? "bg-indigo-100" : "bg-white border border-gray-200"
                        )}>
                            {uploading ? (
                                <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
                            ) : (
                                <Upload className={cn("w-6 h-6", isDragging ? "text-indigo-600" : "text-gray-400")} />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-700">
                                {uploading ? 'Uploading & analyzing...' : isDragging ? 'Drop files here' : 'Drop files or click to upload'}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                                PDF, Word, Excel, images • AI will auto-categorize and assign to agents
                            </p>
                        </div>
                        {!uploading && (
                            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
                                <Brain className="w-4 h-4" />
                                Smart Analysis
                            </div>
                        )}
                    </div>
                </div>

                {knowledgeGaps.length > 0 && documents.length > 0 && (
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                        <div className="flex items-start gap-3">
                            <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-amber-900">Knowledge Gaps Detected</p>
                                <div className="mt-1 space-y-1">
                                    {knowledgeGaps.map((gap, i) => (
                                        <p key={i} className="text-xs text-amber-700 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                            {gap.message}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {documents.length > 0 && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                            <button
                                onClick={() => setFilterCategory(null)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
                                    !filterCategory
                                        ? "bg-indigo-100 text-indigo-700"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                )}
                            >
                                All ({documents.length})
                            </button>
                            {Object.entries(categoryStats).map(([cat, count]) => {
                                const info = DOCUMENT_CATEGORIES[cat];
                                const Icon = info?.icon || BookOpen;
                                return (
                                    <button
                                        key={cat}
                                        onClick={() => setFilterCategory(filterCategory === cat ? null : cat)}
                                        className={cn(
                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
                                            filterCategory === cat
                                                ? `${info?.bgColor} ${info?.color}`
                                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                        )}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        {info?.name || cat} ({count})
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search..."
                                    className="pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-40"
                                />
                            </div>
                            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={cn(
                                        "p-1.5 transition-colors",
                                        viewMode === 'grid' ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:text-gray-600"
                                    )}
                                >
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={cn(
                                        "p-1.5 transition-colors",
                                        viewMode === 'list' ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:text-gray-600"
                                    )}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-auto">
                    {documents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-12">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-4">
                                <Layers className="w-10 h-10 text-indigo-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Build Your AI's Knowledge</h3>
                            <p className="text-sm text-gray-500 max-w-md mb-6">
                                Upload documents and your AI will automatically learn from them.
                                It'll categorize content and know when to use each piece of information.
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg">
                                {['Menu / Price List', 'FAQs', 'Policies', 'Product Catalog', 'Contact Info', 'Promotions'].map((item) => (
                                    <div key={item} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-xs text-gray-600">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : filteredDocuments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-12">
                            <Search className="w-12 h-12 text-gray-300 mb-3" />
                            <p className="text-sm text-gray-500">No documents match your search</p>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {filteredDocuments.map(doc => {
                                const CategoryIcon = doc.categoryInfo.icon;
                                const FileIcon = getFileIcon(doc.category);

                                return (
                                    <div
                                        key={doc.id}
                                        onClick={() => setSelectedDocId(selectedDocId === doc.id ? null : doc.id)}
                                        className={cn(
                                            "group bg-white rounded-xl border-2 p-4 cursor-pointer transition-all hover:shadow-md",
                                            selectedDocId === doc.id
                                                ? `${doc.categoryInfo.borderColor} shadow-md`
                                                : "border-gray-100 hover:border-gray-200"
                                        )}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className={cn(
                                                "w-10 h-10 rounded-lg flex items-center justify-center",
                                                doc.categoryInfo.bgColor
                                            )}>
                                                <CategoryIcon className={cn("w-5 h-5", doc.categoryInfo.color)} />
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {getStatusBadge(doc.status)}
                                            </div>
                                        </div>

                                        <h4 className="font-medium text-gray-900 text-sm truncate mb-1" title={doc.name}>
                                            {doc.name}
                                        </h4>

                                        <div className="relative">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowCategoryPicker(showCategoryPicker === doc.id ? null : doc.id);
                                                }}
                                                className={cn(
                                                    "flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors",
                                                    doc.categoryInfo.bgColor, doc.categoryInfo.color
                                                )}
                                            >
                                                {doc.categoryInfo.name}
                                                <ChevronDown className="w-3 h-3" />
                                            </button>

                                            {showCategoryPicker === doc.id && (
                                                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1 min-w-[160px]">
                                                    {Object.values(DOCUMENT_CATEGORIES).map(cat => (
                                                        <button
                                                            key={cat.id}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCategoryChange(doc.id, cat.id);
                                                            }}
                                                            className={cn(
                                                                "w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 transition-colors",
                                                                doc.inferredCategory === cat.id && "bg-gray-50"
                                                            )}
                                                        >
                                                            <cat.icon className={cn("w-4 h-4", cat.color)} />
                                                            {cat.name}
                                                            {doc.inferredCategory === cat.id && (
                                                                <CheckCircle2 className="w-3 h-3 text-green-500 ml-auto" />
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                                            <div className="flex -space-x-1">
                                                {doc.assignedAgents.map(agentKey => {
                                                    const agent = AGENT_INFO[agentKey];
                                                    return (
                                                        <div
                                                            key={agentKey}
                                                            className={cn("w-6 h-6 rounded-full flex items-center justify-center border-2 border-white", agent.bg)}
                                                            title={agent.name}
                                                        >
                                                            <agent.icon className={cn("w-3 h-3", agent.color)} />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <span className="text-xs text-gray-400 flex-1">
                                                {doc.assignedAgents.length} agent{doc.assignedAgents.length !== 1 ? 's' : ''}
                                            </span>
                                            {doc.status === ProcessingStatus.COMPLETED && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleChatWithDocument(doc);
                                                    }}
                                                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Chat with this document"
                                                >
                                                    <MessageCircle className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredDocuments.map(doc => {
                                const CategoryIcon = doc.categoryInfo.icon;

                                return (
                                    <div
                                        key={doc.id}
                                        onClick={() => setSelectedDocId(selectedDocId === doc.id ? null : doc.id)}
                                        className={cn(
                                            "group flex items-center gap-4 bg-white rounded-xl border-2 p-3 cursor-pointer transition-all hover:shadow-sm",
                                            selectedDocId === doc.id
                                                ? `${doc.categoryInfo.borderColor} shadow-sm`
                                                : "border-gray-100 hover:border-gray-200"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                                            doc.categoryInfo.bgColor
                                        )}>
                                            <CategoryIcon className={cn("w-5 h-5", doc.categoryInfo.color)} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-medium text-gray-900 text-sm truncate">{doc.name}</h4>
                                                {getStatusBadge(doc.status)}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {doc.categoryInfo.name} • {formatFileSize(doc.size)}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="hidden sm:flex -space-x-1">
                                                {doc.assignedAgents.map(agentKey => {
                                                    const agent = AGENT_INFO[agentKey];
                                                    return (
                                                        <div
                                                            key={agentKey}
                                                            className={cn("w-6 h-6 rounded-full flex items-center justify-center border-2 border-white", agent.bg)}
                                                            title={agent.name}
                                                        >
                                                            <agent.icon className={cn("w-3 h-3", agent.color)} />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            {doc.status === ProcessingStatus.COMPLETED && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleChatWithDocument(doc);
                                                    }}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                                                >
                                                    <MessageCircle className="w-3.5 h-3.5" />
                                                    Chat
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (confirm('Delete this document?')) {
                                                        deleteDocument(doc.id);
                                                    }
                                                }}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {selectedDoc && (
                <div className="w-80 border-l border-gray-200 bg-white flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-gray-100">
                        <div className="flex items-start justify-between">
                            <div className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center",
                                selectedDoc.categoryInfo.bgColor
                            )}>
                                <selectedDoc.categoryInfo.icon className={cn("w-6 h-6", selectedDoc.categoryInfo.color)} />
                            </div>
                            <button
                                onClick={() => setSelectedDocId(null)}
                                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>
                        <h3 className="font-semibold text-gray-900 mt-3 text-sm">{selectedDoc.name}</h3>
                        <p className="text-xs text-gray-500 mt-1">{formatFileSize(selectedDoc.size)}</p>
                    </div>

                    <div className="flex-1 overflow-auto p-4 space-y-4">
                        <div>
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Category</h4>
                            <div className={cn(
                                "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium",
                                selectedDoc.categoryInfo.bgColor,
                                selectedDoc.categoryInfo.color
                            )}>
                                <selectedDoc.categoryInfo.icon className="w-4 h-4" />
                                {selectedDoc.categoryInfo.name}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{selectedDoc.categoryInfo.description}</p>
                        </div>

                        <div>
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                Assigned to Agents
                            </h4>
                            <div className="space-y-2">
                                {selectedDoc.assignedAgents.map(agentKey => {
                                    const agent = AGENT_INFO[agentKey];
                                    return (
                                        <div
                                            key={agentKey}
                                            className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg"
                                        >
                                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", agent.bg)}>
                                                <agent.icon className={cn("w-4 h-4", agent.color)} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900">{agent.name}</p>
                                                <p className="text-xs text-gray-500">Will use this document</p>
                                            </div>
                                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        </div>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-gray-400 mt-2 flex items-start gap-1">
                                <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                Auto-assigned based on content type. You can override this in agent settings.
                            </p>
                        </div>

                        <div>
                            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                Questions This Can Answer
                            </h4>
                            <div className="space-y-1.5">
                                {selectedDoc.sampleQuestions.map((q, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                        <MessageCircle className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                        {q}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {selectedDoc.summary && (
                            <div>
                                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                    AI Summary
                                </h4>
                                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                                    {selectedDoc.summary}
                                </p>
                            </div>
                        )}

                        {selectedDoc.tags && selectedDoc.tags.length > 0 && (
                            <div>
                                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Tags</h4>
                                <div className="flex flex-wrap gap-1.5">
                                    {selectedDoc.tags.filter(t => !Object.keys(DOCUMENT_CATEGORIES).includes(t)).map(tag => (
                                        <span
                                            key={tag}
                                            className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-gray-100 space-y-2">
                        {selectedDoc.status === ProcessingStatus.COMPLETED && (
                            <button
                                onClick={() => handleChatWithDocument(selectedDoc)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                <MessageCircle className="w-4 h-4" />
                                Chat with Document
                            </button>
                        )}
                        <div className="flex items-center gap-2">
                            {selectedDoc.storageUrl && (
                                <a
                                    href={selectedDoc.storageUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <Eye className="w-4 h-4" />
                                    View
                                </a>
                            )}
                            <button
                                onClick={() => {
                                    if (confirm('Delete this document?')) {
                                        deleteDocument(selectedDoc.id);
                                        setSelectedDocId(null);
                                    }
                                }}
                                className="flex items-center justify-center gap-2 px-3 py-2 border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}