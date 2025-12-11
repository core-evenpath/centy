"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { usePartnerHub } from '@/hooks/use-partnerhub';
import { cn } from '@/lib/utils';
import {
    Upload,
    FileText,
    Trash2,
    CheckCircle2,
    Clock,
    AlertCircle,
    Search,
    X,
    MessageCircle,
    Bot,
    Zap,
    Sparkles,
    HelpCircle,
    DollarSign,
    Shield,
    BookOpen,
    Megaphone,
    Package,
    MapPin,
    Lightbulb,
    RefreshCw,
    ExternalLink,
    ChevronRight,
    ArrowLeft,
    Image,
    File,
    Edit3,
    Plus,
    Eye,
    EyeOff,
    Globe,
    Lock
} from 'lucide-react';
import { ProcessingStatus, DocumentMetadata, ChatContextType } from '@/lib/partnerhub-types';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChatInterface from '@/components/partner/inbox/ChatInterface';
import Link from 'next/link';

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
    support: { name: 'Support', icon: Bot, color: 'text-blue-600', bg: 'bg-blue-100' },
    sales: { name: 'Sales', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-100' },
    marketing: { name: 'Marketing', icon: Sparkles, color: 'text-purple-600', bg: 'bg-purple-100' },
};

interface EnrichedDocument extends DocumentMetadata {
    inferredCategory: string;
    categoryInfo: DocumentCategory;
    assignedAgents: ('support' | 'sales' | 'marketing')[];
}

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

export default function DocumentsView() {
    const {
        documents,
        uploadDocument,
        deleteDocument,
        addTagToDocument,
        removeTagFromDocument,
        switchContext,
        activeContext,
    } = usePartnerHub();

    const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [newTag, setNewTag] = useState('');
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [uploadVisibility, setUploadVisibility] = useState<'internal' | 'external' | 'both'>('both');

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
            } as EnrichedDocument;
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

        return filtered.sort((a, b) => {
            const dateA = a.updatedAt && 'toDate' in a.updatedAt ? a.updatedAt.toDate() : new Date((a.updatedAt as any) || 0);
            const dateB = b.updatedAt && 'toDate' in b.updatedAt ? b.updatedAt.toDate() : new Date((b.updatedAt as any) || 0);
            return dateB.getTime() - dateA.getTime();
        });
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
        if (documents.length === 0) return gaps;
        if (!categoryStats.pricing) gaps.push({ category: 'pricing', message: 'Add pricing info', icon: DollarSign });
        if (!categoryStats.faq) gaps.push({ category: 'faq', message: 'Add FAQs', icon: HelpCircle });
        if (!categoryStats.contact) gaps.push({ category: 'contact', message: 'Add contact info', icon: MapPin });
        return gaps.slice(0, 2);
    }, [categoryStats, documents.length]);

    const selectedDoc = selectedDocId ? enrichedDocuments.find(d => d.id === selectedDocId) : null;

    useEffect(() => {
        if (selectedDoc) {
            switchContext({
                type: ChatContextType.DOCUMENT,
                id: selectedDoc.id,
                name: selectedDoc.name,
                description: `${(selectedDoc.size / 1024).toFixed(0)} KB • ${selectedDoc.categoryInfo.name}`
            });
        }
    }, [selectedDoc?.id]);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        setUploading(true);
        await Promise.all(Array.from(files).map(file => uploadDocument(file, uploadVisibility)));
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
            await Promise.all(Array.from(files).map(file => uploadDocument(file, uploadVisibility)));
            setUploading(false);
        }
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
                return { icon: RefreshCw, text: 'Processing', color: 'text-amber-600', bg: 'bg-amber-50', spin: true };
            case ProcessingStatus.FAILED:
                return { icon: AlertCircle, text: 'Failed', color: 'text-red-600', bg: 'bg-red-50' };
            default:
                return { icon: Clock, text: 'Pending', color: 'text-slate-500', bg: 'bg-slate-50' };
        }
    };

    const getFileIcon = (doc: DocumentMetadata) => {
        if (doc.mimeType?.startsWith('image/')) return Image;
        if (doc.mimeType?.includes('pdf')) return FileText;
        return File;
    };

    if (showChat && selectedDoc) {
        return (
            <div className="h-full flex flex-col">
                <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
                    <button
                        onClick={() => setShowChat(false)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-500" />
                    </button>
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", selectedDoc.categoryInfo.bgColor)}>
                        <selectedDoc.categoryInfo.icon className={cn("w-4 h-4", selectedDoc.categoryInfo.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="font-medium text-slate-900 text-sm truncate">{selectedDoc.name}</h2>
                        <p className="text-xs text-slate-500">Chat with this document</p>
                    </div>
                </div>
                <div className="flex-1 overflow-hidden">
                    <ChatInterface
                        onBack={() => setShowChat(false)}
                        showBackButton={false}
                        hideCallButtons={true}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex">
            <div className={cn(
                "flex flex-col bg-white transition-all duration-200",
                selectedDoc ? "w-[336px] border-r border-slate-200" : "flex-1"
            )}>
                <div className="p-4 border-b border-slate-100">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search documents..."
                                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>

                        <div className="flex items-center bg-slate-100 rounded-lg p-1 mr-2">
                            <button
                                onClick={() => setUploadVisibility('internal')}
                                className={cn(
                                    "p-1.5 rounded-md transition-all",
                                    uploadVisibility === 'internal' ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-900"
                                )}
                                title="Internal only"
                            >
                                <Lock className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setUploadVisibility('both')}
                                className={cn(
                                    "p-1.5 rounded-md transition-all",
                                    uploadVisibility === 'both' ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-900"
                                )}
                                title="Internal & External"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setUploadVisibility('external')}
                                className={cn(
                                    "p-1.5 rounded-md transition-all",
                                    uploadVisibility === 'external' ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-900"
                                )}
                                title="External only"
                            >
                                <Globe className="w-4 h-4" />
                            </button>
                        </div>

                        <label className="flex items-center justify-center px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer gap-1.5">
                            <Upload className="w-4 h-4" />
                            <span className="hidden sm:inline">Upload</span>
                            <input
                                type="file"
                                multiple
                                accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.png,.jpg,.jpeg"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                        </label>
                    </div>

                    {documents.length > 0 && (
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                            <button
                                onClick={() => setFilterCategory(null)}
                                className={cn(
                                    "px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                                    !filterCategory ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
                                            "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
                                            filterCategory === cat
                                                ? `${info.bgColor} ${info.color}`
                                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                        )}
                                    >
                                        <info.icon className="w-3 h-3" />
                                        {count}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-3">
                        {documents.length === 0 ? (
                            <div
                                onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={(e) => { e.preventDefault(); if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false); }}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleDrop}
                                className={cn(
                                    "relative rounded-2xl border-2 border-dashed p-8 text-center transition-all",
                                    isDragging ? "border-indigo-400 bg-indigo-50" : "border-slate-200 hover:border-slate-300 bg-slate-50"
                                )}
                            >
                                <input
                                    type="file"
                                    multiple
                                    accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.png,.jpg,.jpeg"
                                    onChange={handleFileUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />

                                <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                                    {uploading ? (
                                        <RefreshCw className="w-7 h-7 text-indigo-600 animate-spin" />
                                    ) : (
                                        <Upload className="w-7 h-7 text-indigo-600" />
                                    )}
                                </div>
                                <h3 className="font-semibold text-slate-900 mb-1">Upload your first document</h3>
                                <p className="text-sm text-slate-500 mb-4">Drop files here or click to browse</p>
                                <div className="flex flex-wrap justify-center gap-2">
                                    <span className="px-2 py-1 bg-white rounded text-xs text-slate-500">PDF</span>
                                    <span className="px-2 py-1 bg-white rounded text-xs text-slate-500">Word</span>
                                    <span className="px-2 py-1 bg-white rounded text-xs text-slate-500">Excel</span>
                                    <span className="px-2 py-1 bg-white rounded text-xs text-slate-500">Images</span>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-1.5">
                                {filteredDocuments.map(doc => {
                                    const status = getStatusInfo(doc.status);
                                    const isSelected = selectedDocId === doc.id;
                                    const FileIcon = getFileIcon(doc);

                                    return (
                                        <button
                                            key={doc.id}
                                            onClick={() => setSelectedDocId(doc.id)}
                                            className={cn(
                                                "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all",
                                                isSelected
                                                    ? "bg-indigo-50 ring-2 ring-indigo-500 ring-inset"
                                                    : "hover:bg-slate-50"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                                                doc.categoryInfo.bgColor
                                            )}>
                                                <doc.categoryInfo.icon className={cn("w-5 h-5", doc.categoryInfo.color)} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-slate-900 truncate text-sm">{doc.name}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-xs text-slate-400">{formatFileSize(doc.size)}</span>
                                                    <span className={cn("flex items-center gap-1 text-xs", status.color)}>
                                                        <status.icon className={cn("w-3 h-3", status.spin && "animate-spin")} />
                                                        {status.text}
                                                    </span>
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <ChevronRight className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {knowledgeGaps.length > 0 && !selectedDoc && (
                            <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                                <div className="flex items-start gap-2">
                                    <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-xs font-medium text-amber-900 mb-1">Make AI smarter</p>
                                        <div className="space-y-0.5">
                                            {knowledgeGaps.map((gap, i) => (
                                                <p key={i} className="text-xs text-amber-700 flex items-center gap-1">
                                                    <gap.icon className="w-3 h-3" />
                                                    {gap.message}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            {selectedDoc && (
                <div className="flex-1 flex flex-col bg-slate-50 min-w-0">
                    <div className="bg-white border-b border-slate-200 px-5 py-4">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4">
                                <button
                                    onClick={() => setSelectedDocId(null)}
                                    className="p-1 hover:bg-slate-100 rounded-lg transition-colors lg:hidden mt-1"
                                >
                                    <ArrowLeft className="w-5 h-5 text-slate-400" />
                                </button>
                                <div className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                                    selectedDoc.categoryInfo.bgColor
                                )}>
                                    <selectedDoc.categoryInfo.icon className={cn("w-6 h-6", selectedDoc.categoryInfo.color)} />
                                </div>
                                <div>
                                    <h2 className="font-semibold text-slate-900 text-lg">{selectedDoc.name}</h2>
                                    <p className="text-sm text-slate-500 mt-0.5">
                                        {formatFileSize(selectedDoc.size)} • {formatDate(selectedDoc.updatedAt)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {selectedDoc.status === ProcessingStatus.COMPLETED && (
                                    <button
                                        onClick={() => setShowChat(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                        Chat with AI
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        if (confirm('Delete this document?')) {
                                            deleteDocument(selectedDoc.id);
                                            setSelectedDocId(null);
                                        }
                                    }}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="p-5 max-w-2xl">
                            <div className="space-y-6">
                                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                                        <h3 className="font-medium text-slate-900">Category</h3>
                                        <button
                                            onClick={() => setShowCategoryPicker(!showCategoryPicker)}
                                            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" />
                                            {showCategoryPicker ? 'Done' : 'Change'}
                                        </button>
                                    </div>
                                    <div className="p-4">
                                        {showCategoryPicker ? (
                                            <div className="grid grid-cols-2 gap-2">
                                                {Object.values(DOCUMENT_CATEGORIES).map(cat => (
                                                    <button
                                                        key={cat.id}
                                                        onClick={() => handleCategoryChange(cat.id)}
                                                        className={cn(
                                                            "flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left",
                                                            selectedDoc.inferredCategory === cat.id
                                                                ? `${cat.bgColor} ${cat.borderColor}`
                                                                : "border-slate-200 hover:border-slate-300"
                                                        )}
                                                    >
                                                        <cat.icon className={cn("w-4 h-4", cat.color)} />
                                                        <span className="text-sm font-medium text-slate-700">{cat.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className={cn(
                                                "inline-flex items-center gap-2 px-3 py-2 rounded-lg",
                                                selectedDoc.categoryInfo.bgColor
                                            )}>
                                                <selectedDoc.categoryInfo.icon className={cn("w-5 h-5", selectedDoc.categoryInfo.color)} />
                                                <span className={cn("font-medium", selectedDoc.categoryInfo.color)}>
                                                    {selectedDoc.categoryInfo.name}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                                        <h3 className="font-medium text-slate-900">Used by AI Assistants</h3>
                                        <Link
                                            href="/partner/agents"
                                            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                                        >
                                            <Edit3 className="w-3.5 h-3.5" />
                                            Configure
                                        </Link>
                                    </div>
                                    <div className="p-4">
                                        <div className="flex flex-wrap gap-2">
                                            {selectedDoc.assignedAgents.map(agentKey => {
                                                const agent = AGENT_INFO[agentKey];
                                                return (
                                                    <div key={agentKey} className={cn(
                                                        "flex items-center gap-2 px-3 py-2 rounded-lg",
                                                        agent.bg
                                                    )}>
                                                        <agent.icon className={cn("w-4 h-4", agent.color)} />
                                                        <span className={cn("text-sm font-medium", agent.color)}>{agent.name}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <p className="text-xs text-slate-400 mt-3">
                                            Auto-assigned based on category • Manage in AI Assistants page
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                    <div className="px-4 py-3 border-b border-slate-100">
                                        <h3 className="font-medium text-slate-900">Tags</h3>
                                    </div>
                                    <div className="p-4">
                                        <div className="flex flex-wrap items-center gap-2">
                                            {selectedDoc.tags?.filter(t => !Object.keys(DOCUMENT_CATEGORIES).includes(t)).map(tag => (
                                                <span
                                                    key={tag}
                                                    className="group inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm"
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
                                                    className="px-2.5 py-1 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-24"
                                                />
                                                {newTag && (
                                                    <button
                                                        onClick={handleAddTag}
                                                        className="p-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {selectedDoc.summary && (
                                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                        <div className="px-4 py-3 border-b border-slate-100">
                                            <h3 className="font-medium text-slate-900">AI Summary</h3>
                                        </div>
                                        <div className="p-4">
                                            <p className="text-slate-600 leading-relaxed">{selectedDoc.summary}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-3">
                                    {selectedDoc.storageUrl && (
                                        <a
                                            href={selectedDoc.storageUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
                                        >
                                            <Eye className="w-4 h-4" />
                                            View Original
                                        </a>
                                    )}
                                    {selectedDoc.storageUrl && (
                                        <a
                                            href={selectedDoc.storageUrl}
                                            download
                                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                            Download
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                </div>
            )}

            {!selectedDoc && documents.length > 0 && (
                <div className="hidden lg:flex flex-1 items-center justify-center bg-slate-50">
                    <div className="text-center px-8">
                        <div className="w-16 h-16 rounded-2xl bg-slate-200 flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="font-medium text-slate-600 mb-1">Select a document</h3>
                        <p className="text-sm text-slate-400">View details, edit tags, and chat with AI</p>
                    </div>
                </div>
            )}
        </div>
    );
}