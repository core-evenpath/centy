"use client";

import React, { useState } from 'react';
import { DocumentMetadata, ProcessingStatus, FileCategory } from '@/lib/partnerhub-types';
import {
    FileText, Loader2, CheckCircle2, AlertCircle, MessageCircle,
    FileAudio, FileVideo, FileCode, FileSpreadsheet, Image as ImageIcon, File, Calendar, Plus, Tag
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentCardProps {
    doc: DocumentMetadata;
    onChat: (id: string) => void;
    variant?: 'list' | 'grid' | 'thread';
    isActiveContext?: boolean;
    onAddTag?: (tag: string) => void;
    onModifyImage?: (id: string) => void;
}

const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
    [ProcessingStatus.PROCESSING]: { color: 'text-amber-500', icon: Loader2, label: 'Processing' },
    [ProcessingStatus.COMPLETED]: { color: 'text-green-500', icon: CheckCircle2, label: 'Ready' },
    [ProcessingStatus.ACTIVE]: { color: 'text-green-500', icon: CheckCircle2, label: 'Ready' },
    [ProcessingStatus.FAILED]: { color: 'text-red-500', icon: AlertCircle, label: 'Error' },
    [ProcessingStatus.PENDING]: { color: 'text-gray-400', icon: Loader2, label: 'Pending' },
};

const getFileIcon = (category: FileCategory) => {
    switch (category) {
        case FileCategory.AUDIO: return FileAudio;
        case FileCategory.VIDEO: return FileVideo;
        case FileCategory.IMAGE: return ImageIcon;
        case FileCategory.CODE: return FileCode;
        case FileCategory.SPREADSHEET: return FileSpreadsheet;
        default: return File;
    }
};

const getDate = (date: any) => date?.toDate ? date.toDate() : new Date(date);

export function DocumentCard({ doc, onChat, variant = 'list', isActiveContext, onAddTag, onModifyImage }: DocumentCardProps) {
    const config = statusConfig[doc.status] || statusConfig[ProcessingStatus.FAILED];
    const StatusIcon = config.icon;
    const FileTypeIcon = getFileIcon(doc.category);
    const isActive = doc.status === ProcessingStatus.ACTIVE || doc.status === ProcessingStatus.COMPLETED;
    const tags = doc.tags || [];

    const [isAddingTag, setIsAddingTag] = useState(false);
    const [newTag, setNewTag] = useState('');

    const handleTagSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTag.trim() && onAddTag) {
            onAddTag(newTag.trim());
            setNewTag('');
            setIsAddingTag(false);
        }
    };

    // --- THREAD VARIANT (WhatsApp Style List Item) ---
    if (variant === 'thread') {
        return (
            <div
                onClick={() => onChat(doc.id)}
                className={cn(
                    "group flex items-center gap-3 p-3 cursor-pointer transition-colors border-b border-gray-100 last:border-0",
                    isActiveContext ? 'bg-indigo-50/80 hover:bg-indigo-50' : 'bg-white hover:bg-gray-50'
                )}
            >
                {/* Avatar Area */}
                <div className={cn(
                    "relative flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center",
                    isActiveContext ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'
                )}>
                    <FileTypeIcon className="w-5 h-5" />
                    {!isActive && (
                        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] rounded-full flex items-center justify-center">
                            <StatusIcon className={cn("w-4 h-4", config.color, doc.status !== ProcessingStatus.FAILED && "animate-spin")} />
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                        <h3 className={cn(
                            "font-medium text-sm truncate pr-2",
                            isActiveContext ? 'text-indigo-900' : 'text-gray-900'
                        )}>
                            {doc.name}
                        </h3>


                        <span className="text-[10px] text-gray-400 flex-shrink-0">
                            {doc.createdAt ? getDate(doc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-500 truncate max-w-[80%]">
                            {tags.length > 0 ? `#${tags[0]} • ` : ''}
                            {doc.summary ? doc.summary : `${(doc.size / 1024).toFixed(0)}KB`}
                        </p>
                        {doc.status === ProcessingStatus.FAILED && (
                            <AlertCircle className="w-3 h-3 text-red-500" />
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // --- GRID VARIANT (Core Memory View) ---
    const isGrid = variant === 'grid';
    return (
        <div className={cn(
            "group relative bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:border-indigo-200",
            isGrid ? 'p-4 flex flex-col gap-3' : 'p-3 flex items-start gap-3'
        )}>

            {/* Header with Icon & Actions */}
            <div className="flex justify-between items-start">
                <div className={cn(
                    "rounded-lg flex-shrink-0 flex items-center justify-center",
                    isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-500',
                    isGrid ? 'w-10 h-10' : 'p-2.5'
                )}>
                    <FileTypeIcon className={isGrid ? 'w-5 h-5' : 'w-5 h-5'} />
                </div>

                {/* Status Badge */}
                <div className={cn(
                    "flex items-center gap-1 text-[10px] uppercase tracking-wide font-bold flex-shrink-0 bg-white px-1.5 py-0.5 rounded-full border border-gray-100 shadow-sm",
                    config.color
                )}>
                    {!isActive && doc.status !== ProcessingStatus.FAILED && <StatusIcon className="w-3 h-3 animate-spin" />}
                    {doc.status === ProcessingStatus.FAILED && <StatusIcon className="w-3 h-3" />}
                    <span>{config.label}</span>
                </div>
            </div>

            <div className="flex-1 min-w-0 w-full">
                <h3 className="font-medium text-gray-900 text-sm truncate pr-2 w-full mb-1" title={doc.name}>
                    {doc.name}
                </h3>

                {/* Summary Snippet */}
                {doc.summary && (
                    <p className="text-[11px] text-gray-500 leading-snug mb-2 line-clamp-2 min-h-[32px]">
                        {doc.summary}
                    </p>
                )}

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-y-1 gap-x-2 text-[10px] text-gray-400 mb-3 border-t border-gray-50 pt-2">
                    <div className="flex items-center gap-1">
                        <span className="font-medium text-gray-500">Size:</span> {(doc.size / 1024).toFixed(1)} KB
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="font-medium text-gray-500">Type:</span> {doc.category.toUpperCase()}
                    </div>
                    <div className="flex items-center gap-1 col-span-2">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span>{doc.createdAt ? getDate(doc.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : ''}</span>
                    </div>
                </div>

                {/* Tags Section */}
                <div className="flex flex-wrap gap-1 mt-auto">
                    {tags.map((tag, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded-md border border-gray-200">
                            #{tag}
                        </span>
                    ))}

                    {onAddTag && (
                        isAddingTag ? (
                            <form onSubmit={handleTagSubmit} className="flex items-center">
                                <input
                                    autoFocus
                                    type="text"
                                    value={newTag}
                                    onChange={e => setNewTag(e.target.value)}
                                    onBlur={() => setIsAddingTag(false)}
                                    placeholder="tag..."
                                    className="w-16 px-1 py-0.5 text-[10px] border border-indigo-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                                />
                            </form>
                        ) : (
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsAddingTag(true); }}
                                className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] rounded-md border border-indigo-100 hover:bg-indigo-100 transition-colors flex items-center gap-0.5"
                            >
                                <Plus className="w-3 h-3" /> Add
                            </button>
                        )
                    )}
                </div>
            </div>

            {isActive && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2 w-full">
                    {/* Modify Image Button (only for images) */}
                    {(doc.category === 'image' || doc.mimeType?.startsWith('image/')) && onModifyImage && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onModifyImage(doc.id); }}
                            className="text-xs font-medium text-pink-600 hover:text-pink-800 flex items-center gap-1 px-3 py-1.5 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors flex-1 justify-center"
                        >
                            <ImageIcon className="w-3.5 h-3.5" />
                            Modify
                        </button>
                    )}

                    <button
                        onClick={(e) => { e.stopPropagation(); onChat(doc.id); }}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-3 py-1.5 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors flex-1 justify-center"
                    >
                        <MessageCircle className="w-3.5 h-3.5" />
                        {(doc.category === 'image' || doc.mimeType?.startsWith('image/')) ? 'Chat' : 'Chat'}
                    </button>
                </div>
            )}
        </div>
    );
}
