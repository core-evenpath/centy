'use client';

import React from 'react';
import { X, FileText, Music, Video, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface MediaAttachment {
    file: File;
    preview: string | null;
    mediaType: 'image' | 'video' | 'audio' | 'document';
    uploading?: boolean;
    uploadProgress?: number;
    uploadedUrl?: string;
    error?: string;
}

interface MediaPreviewProps {
    attachment: MediaAttachment;
    onRemove: () => void;
    compact?: boolean;
}

export function MediaPreview({ attachment, onRemove, compact = false }: MediaPreviewProps) {
    const { file, preview, mediaType, uploading, uploadProgress, error } = attachment;

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getFileIcon = () => {
        switch (mediaType) {
            case 'image':
                return <ImageIcon className="w-5 h-5" />;
            case 'video':
                return <Video className="w-5 h-5" />;
            case 'audio':
                return <Music className="w-5 h-5" />;
            case 'document':
                return <FileText className="w-5 h-5" />;
            default:
                return <FileText className="w-5 h-5" />;
        }
    };

    const getTypeColor = () => {
        switch (mediaType) {
            case 'image':
                return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'video':
                return 'bg-purple-50 text-purple-600 border-purple-200';
            case 'audio':
                return 'bg-orange-50 text-orange-600 border-orange-200';
            case 'document':
                return 'bg-emerald-50 text-emerald-600 border-emerald-200';
            default:
                return 'bg-gray-50 text-gray-600 border-gray-200';
        }
    };

    if (compact) {
        return (
            <div className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
                error ? "bg-red-50 border-red-200" : getTypeColor()
            )}>
                {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    getFileIcon()
                )}
                <span className="text-xs font-medium truncate max-w-[120px]">
                    {file.name}
                </span>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 hover:bg-white/50 rounded-full ml-auto"
                    onClick={onRemove}
                >
                    <X className="w-3 h-3" />
                </Button>
            </div>
        );
    }

    return (
        <div className={cn(
            "relative rounded-xl overflow-hidden border-2 transition-all",
            error ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"
        )}>
            {/* Close button */}
            <Button
                variant="secondary"
                size="icon"
                className="absolute top-2 right-2 z-10 h-7 w-7 rounded-full bg-white/90 hover:bg-white shadow-md"
                onClick={onRemove}
            >
                <X className="w-4 h-4" />
            </Button>

            {/* Preview area */}
            <div className="p-3">
                {mediaType === 'image' && preview ? (
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                        <img
                            src={preview}
                            alt={file.name}
                            className="w-full h-full object-contain"
                        />
                        {uploading && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <div className="text-center text-white">
                                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                                    <span className="text-sm font-medium">
                                        {uploadProgress ? `${uploadProgress}%` : 'Uploading...'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                ) : mediaType === 'video' && preview ? (
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-900">
                        <video
                            src={preview}
                            className="w-full h-full object-contain"
                            controls={!uploading}
                        />
                        {uploading && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <div className="text-center text-white">
                                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                                    <span className="text-sm font-medium">
                                        {uploadProgress ? `${uploadProgress}%` : 'Uploading...'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                ) : mediaType === 'audio' && preview ? (
                    <div className={cn(
                        "rounded-lg p-4",
                        getTypeColor()
                    )}>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 rounded-full bg-white/80">
                                <Music className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{file.name}</p>
                                <p className="text-xs opacity-70">{formatFileSize(file.size)}</p>
                            </div>
                        </div>
                        <audio
                            src={preview}
                            controls
                            className="w-full h-8"
                        />
                        {uploading && (
                            <div className="flex items-center gap-2 mt-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="text-xs">
                                    {uploadProgress ? `Uploading ${uploadProgress}%` : 'Uploading...'}
                                </span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={cn(
                        "rounded-lg p-4",
                        getTypeColor()
                    )}>
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-white/80">
                                {uploading ? (
                                    <Loader2 className="w-8 h-8 animate-spin" />
                                ) : (
                                    <div className="w-8 h-8 flex items-center justify-center">
                                        {getFileIcon()}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{file.name}</p>
                                <p className="text-xs opacity-70">
                                    {formatFileSize(file.size)}
                                    {uploading && uploadProgress && ` - ${uploadProgress}%`}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error message */}
                {error && (
                    <div className="mt-2 px-3 py-2 bg-red-100 rounded-lg">
                        <p className="text-xs text-red-700">{error}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

interface MediaPreviewListProps {
    attachments: MediaAttachment[];
    onRemove: (index: number) => void;
}

export function MediaPreviewList({ attachments, onRemove }: MediaPreviewListProps) {
    if (attachments.length === 0) return null;

    // For single attachment, show full preview
    if (attachments.length === 1) {
        return (
            <div className="px-3 pb-2">
                <MediaPreview
                    attachment={attachments[0]}
                    onRemove={() => onRemove(0)}
                />
            </div>
        );
    }

    // For multiple attachments, show compact grid
    return (
        <div className="px-3 pb-2">
            <div className="flex flex-wrap gap-2">
                {attachments.map((attachment, index) => (
                    <MediaPreview
                        key={index}
                        attachment={attachment}
                        onRemove={() => onRemove(index)}
                        compact
                    />
                ))}
            </div>
        </div>
    );
}
