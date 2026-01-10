"use client";

import React, { useState, useMemo } from 'react';
import { usePartnerHub } from '@/hooks/use-partnerhub';
import { cn } from '@/lib/utils';
import {
    Upload,
    FileText,
    Trash2,
    CheckCircle2,
    Clock,
    AlertCircle,
    X,
    RefreshCw,
    Image,
    File,
    Eye,
    Building2,
    Menu,
    Receipt,
    FileImage,
    Briefcase,
    ExternalLink,
    Download,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { ProcessingStatus, DocumentMetadata } from '@/lib/partnerhub-types';

// Profile-specific document categories
const PROFILE_CATEGORIES = {
    branding: {
        id: 'branding',
        name: 'Logo & Branding',
        icon: Building2,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
        description: 'Logos, brand guidelines, visual identity',
        accepts: '.png,.jpg,.jpeg,.svg,.pdf',
    },
    menu: {
        id: 'menu',
        name: 'Menu / Catalog',
        icon: Menu,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        description: 'Product catalogs, service menus, price lists',
        accepts: '.pdf,.doc,.docx,.xlsx,.xls,.png,.jpg',
    },
    credentials: {
        id: 'credentials',
        name: 'Certificates & Licenses',
        icon: Receipt,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        description: 'Business licenses, certifications, awards',
        accepts: '.pdf,.png,.jpg,.jpeg',
    },
    photos: {
        id: 'photos',
        name: 'Business Photos',
        icon: FileImage,
        color: 'text-rose-600',
        bgColor: 'bg-rose-50',
        description: 'Office, storefront, team, product photos',
        accepts: '.png,.jpg,.jpeg,.webp',
    },
    other: {
        id: 'other',
        name: 'Other Documents',
        icon: Briefcase,
        color: 'text-slate-600',
        bgColor: 'bg-slate-50',
        description: 'Any other business documents',
        accepts: '.pdf,.doc,.docx,.txt,.xlsx,.xls,.png,.jpg,.jpeg',
    },
};

interface ProfileDocumentsProps {
    partnerId: string;
}

interface DocumentViewerProps {
    document: DocumentMetadata;
    onClose: () => void;
    onDelete: () => void;
}

function DocumentViewer({ document, onClose, onDelete }: DocumentViewerProps) {
    const ext = document.name.split('.').pop()?.toLowerCase();
    const isImage = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext || '');
    const isPdf = ext === 'pdf';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                            {isImage ? (
                                <Image className="w-5 h-5 text-slate-600" />
                            ) : isPdf ? (
                                <FileText className="w-5 h-5 text-red-500" />
                            ) : (
                                <File className="w-5 h-5 text-slate-600" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-semibold text-slate-900 truncate">{document.name}</h3>
                            <p className="text-xs text-slate-500">
                                {(document.size / 1024).toFixed(1)} KB
                                {document.status === ProcessingStatus.COMPLETED && ' • Processed'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {document.url && (
                            <a
                                href={document.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Open in new tab"
                            >
                                <ExternalLink className="w-5 h-5" />
                            </a>
                        )}
                        {document.url && (
                            <a
                                href={document.url}
                                download={document.name}
                                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Download"
                            >
                                <Download className="w-5 h-5" />
                            </a>
                        )}
                        <button
                            onClick={onDelete}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    {/* Preview */}
                    {isImage && document.url ? (
                        <div className="flex items-center justify-center bg-slate-50 rounded-xl p-4 min-h-[300px]">
                            <img
                                src={document.url}
                                alt={document.name}
                                className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-sm"
                            />
                        </div>
                    ) : isPdf && document.url ? (
                        <div className="bg-slate-50 rounded-xl p-4 min-h-[300px]">
                            <iframe
                                src={document.url}
                                className="w-full h-[60vh] rounded-lg border border-slate-200"
                                title={document.name}
                            />
                        </div>
                    ) : (
                        <div className="bg-slate-50 rounded-xl p-8 text-center">
                            <File className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 mb-4">Preview not available for this file type</p>
                            {document.url && (
                                <a
                                    href={document.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm hover:bg-slate-800 transition-colors"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Open File
                                </a>
                            )}
                        </div>
                    )}

                    {/* Extracted Content */}
                    {document.extractedText && (
                        <div className="mt-6">
                            <h4 className="text-sm font-semibold text-slate-700 mb-2">Extracted Content</h4>
                            <div className="bg-slate-50 rounded-xl p-4 max-h-[200px] overflow-auto">
                                <p className="text-sm text-slate-600 whitespace-pre-wrap">
                                    {document.extractedText.substring(0, 2000)}
                                    {document.extractedText.length > 2000 && '...'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Summary */}
                    {document.summary && (
                        <div className="mt-4">
                            <h4 className="text-sm font-semibold text-slate-700 mb-2">AI Summary</h4>
                            <div className="bg-indigo-50 rounded-xl p-4">
                                <p className="text-sm text-indigo-700">{document.summary}</p>
                            </div>
                        </div>
                    )}

                    {/* Tags */}
                    {document.tags && document.tags.length > 0 && (
                        <div className="mt-4">
                            <h4 className="text-sm font-semibold text-slate-700 mb-2">Tags</h4>
                            <div className="flex flex-wrap gap-2">
                                {document.tags.map(tag => (
                                    <span
                                        key={tag}
                                        className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ProfileDocuments({ partnerId }: ProfileDocumentsProps) {
    const {
        documents,
        uploadDocument,
        deleteDocument,
    } = usePartnerHub();

    const [uploading, setUploading] = useState(false);
    const [uploadCategory, setUploadCategory] = useState<string | null>(null);
    const [selectedDocument, setSelectedDocument] = useState<DocumentMetadata | null>(null);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

    // Filter documents that are tagged as profile documents
    const profileDocuments = useMemo(() => {
        return documents.filter(doc =>
            doc.tags?.some(tag => Object.keys(PROFILE_CATEGORIES).includes(tag)) ||
            doc.tags?.includes('profile')
        );
    }, [documents]);

    // Group documents by category
    const documentsByCategory = useMemo(() => {
        const grouped: Record<string, DocumentMetadata[]> = {};
        Object.keys(PROFILE_CATEGORIES).forEach(cat => {
            grouped[cat] = profileDocuments.filter(doc =>
                doc.tags?.includes(cat)
            );
        });
        return grouped;
    }, [profileDocuments]);

    const handleFileUpload = async (
        event: React.ChangeEvent<HTMLInputElement>,
        category: string
    ) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        setUploadCategory(category);
        try {
            await Promise.all(
                Array.from(files).map(async (file) => {
                    await uploadDocument(file, 'both');
                })
            );
        } catch (error) {
            console.error('Upload error:', error);
        } finally {
            setUploading(false);
            setUploadCategory(null);
            event.target.value = '';
        }
    };

    const handleDelete = async (docId: string) => {
        if (!confirm('Delete this document?')) return;
        await deleteDocument(docId);
        setSelectedDocument(null);
    };

    const getStatusIcon = (status: ProcessingStatus) => {
        switch (status) {
            case ProcessingStatus.COMPLETED:
                return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
            case ProcessingStatus.PROCESSING:
                return <RefreshCw className="w-3.5 h-3.5 text-blue-500 animate-spin" />;
            case ProcessingStatus.FAILED:
                return <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
            default:
                return <Clock className="w-3.5 h-3.5 text-amber-500" />;
        }
    };

    const getFileIcon = (doc: DocumentMetadata) => {
        const ext = doc.name.split('.').pop()?.toLowerCase();
        if (['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext || '')) {
            return <Image className="w-4 h-4" />;
        }
        if (ext === 'pdf') {
            return <FileText className="w-4 h-4" />;
        }
        return <File className="w-4 h-4" />;
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-slate-900">Business Documents</h3>
                    <p className="text-xs text-slate-500">
                        Upload documents that help AI understand your business better
                    </p>
                </div>
                <span className="text-xs text-slate-400">
                    {profileDocuments.length} document{profileDocuments.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Category Upload Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(PROFILE_CATEGORIES).map(([catId, category]) => {
                    const Icon = category.icon;
                    const docs = documentsByCategory[catId] || [];
                    const hasDocuments = docs.length > 0;
                    const isExpanded = expandedCategory === catId;

                    return (
                        <div
                            key={catId}
                            className={cn(
                                "relative rounded-xl border-2 p-4 transition-all",
                                hasDocuments
                                    ? `${category.bgColor} border-transparent`
                                    : "border-dashed border-slate-200 hover:border-slate-300 bg-slate-50"
                            )}
                        >
                            {/* Upload Input */}
                            <input
                                type="file"
                                id={`upload-${catId}`}
                                multiple
                                accept={category.accepts}
                                onChange={(e) => handleFileUpload(e, catId)}
                                className="hidden"
                            />

                            {/* Category Header */}
                            <div className="flex items-start gap-3 mb-3">
                                <div className={cn(
                                    "w-10 h-10 rounded-lg flex items-center justify-center",
                                    hasDocuments ? 'bg-white/60' : 'bg-white'
                                )}>
                                    <Icon className={cn("w-5 h-5", category.color)} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-slate-900 text-sm">{category.name}</h4>
                                    <p className="text-xs text-slate-500 truncate">{category.description}</p>
                                </div>
                            </div>

                            {/* Documents List */}
                            {hasDocuments ? (
                                <div className="space-y-1.5 mb-3">
                                    {(isExpanded ? docs : docs.slice(0, 3)).map(doc => (
                                        <div
                                            key={doc.id}
                                            className="flex items-center gap-2 p-2 bg-white/80 rounded-lg group cursor-pointer hover:bg-white transition-colors"
                                            onClick={() => setSelectedDocument(doc)}
                                        >
                                            <span className={category.color}>
                                                {getFileIcon(doc)}
                                            </span>
                                            <span className="flex-1 text-xs text-slate-700 truncate">
                                                {doc.name}
                                            </span>
                                            {getStatusIcon(doc.status)}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedDocument(doc);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-indigo-50 rounded transition-all"
                                                title="View details"
                                            >
                                                <Eye className="w-3 h-3 text-indigo-500" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(doc.id);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-all"
                                            >
                                                <Trash2 className="w-3 h-3 text-red-500" />
                                            </button>
                                        </div>
                                    ))}
                                    {docs.length > 3 && (
                                        <button
                                            onClick={() => setExpandedCategory(isExpanded ? null : catId)}
                                            className="w-full flex items-center justify-center gap-1 py-1 text-xs text-slate-500 hover:text-slate-700"
                                        >
                                            {isExpanded ? (
                                                <>
                                                    <ChevronUp className="w-3 h-3" />
                                                    Show less
                                                </>
                                            ) : (
                                                <>
                                                    <ChevronDown className="w-3 h-3" />
                                                    +{docs.length - 3} more
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-2 mb-3">
                                    <p className="text-xs text-slate-400">No documents yet</p>
                                </div>
                            )}

                            {/* Upload Button */}
                            <label
                                htmlFor={`upload-${catId}`}
                                className={cn(
                                    "flex items-center justify-center gap-2 w-full py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors",
                                    hasDocuments
                                        ? "bg-white/60 hover:bg-white text-slate-700"
                                        : "bg-white hover:bg-slate-100 text-slate-600"
                                )}
                            >
                                {uploading && uploadCategory === catId ? (
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Upload className="w-3.5 h-3.5" />
                                )}
                                {hasDocuments ? 'Add More' : 'Upload'}
                            </label>
                        </div>
                    );
                })}
            </div>

            {/* Info Note */}
            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                <p className="text-xs text-indigo-700">
                    <strong>Tip:</strong> Documents uploaded here are processed by AI and used to answer customer questions.
                    Upload menus, catalogs, or certificates to help AI provide accurate information.
                </p>
            </div>

            {/* Document Viewer Modal */}
            {selectedDocument && (
                <DocumentViewer
                    document={selectedDocument}
                    onClose={() => setSelectedDocument(null)}
                    onDelete={() => handleDelete(selectedDocument.id)}
                />
            )}
        </div>
    );
}
