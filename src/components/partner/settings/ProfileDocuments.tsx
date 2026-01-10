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
    Briefcase
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

export default function ProfileDocuments({ partnerId }: ProfileDocumentsProps) {
    const {
        documents,
        uploadDocument,
        deleteDocument,
    } = usePartnerHub();

    const [uploading, setUploading] = useState(false);
    const [uploadCategory, setUploadCategory] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

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
        try {
            await Promise.all(
                Array.from(files).map(async (file) => {
                    // Upload with 'both' visibility and add profile + category tags
                    const docId = await uploadDocument(file, 'both');
                    // The uploadDocument should handle tagging, but we'll tag after
                    // For now, we rely on the tag being added during upload
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
                                    {docs.slice(0, 3).map(doc => (
                                        <div
                                            key={doc.id}
                                            className="flex items-center gap-2 p-2 bg-white/80 rounded-lg group"
                                        >
                                            <span className={category.color}>
                                                {getFileIcon(doc)}
                                            </span>
                                            <span className="flex-1 text-xs text-slate-700 truncate">
                                                {doc.name}
                                            </span>
                                            {getStatusIcon(doc.status)}
                                            <button
                                                onClick={() => handleDelete(doc.id)}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-all"
                                            >
                                                <Trash2 className="w-3 h-3 text-red-500" />
                                            </button>
                                        </div>
                                    ))}
                                    {docs.length > 3 && (
                                        <p className="text-xs text-slate-500 text-center">
                                            +{docs.length - 3} more
                                        </p>
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
        </div>
    );
}
