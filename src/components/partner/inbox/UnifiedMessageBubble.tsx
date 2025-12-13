'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Check, CheckCheck, Clock, Download, MoreVertical, Trash2, MessageCircle, Send } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import type { Platform } from '@/hooks/useUnifiedConversations';

interface UnifiedMessageBubbleProps {
    message: any;
    platform: Platform;
    onDelete?: (messageId: string) => void;
}

export function UnifiedMessageBubble({ message, platform, onDelete }: UnifiedMessageBubbleProps) {
    const isOutbound = message.direction === 'outbound';

    const getTimestamp = () => {
        try {
            const ts = message.createdAt?.toDate?.() || message.createdAt;
            if (!ts) return '';
            return format(new Date(ts), 'h:mm a');
        } catch {
            return '';
        }
    };

    const getStatusIcon = () => {
        if (!isOutbound) return null;

        const metadata = platform === 'meta_whatsapp'
            ? message.metaMetadata
            : message.telegramMetadata;

        const status = metadata?.status;

        if (status === 'read') {
            return <CheckCheck className="w-3.5 h-3.5 text-blue-400" />;
        }
        if (status === 'delivered') {
            return <CheckCheck className="w-3.5 h-3.5 text-gray-400" />;
        }
        if (status === 'sent') {
            return <Check className="w-3.5 h-3.5 text-gray-400" />;
        }
        return <Clock className="w-3.5 h-3.5 text-gray-300" />;
    };

    const renderMedia = () => {
        const metadata = platform === 'meta_whatsapp'
            ? message.metaMetadata
            : message.telegramMetadata;

        const mediaUrl = metadata?.mediaUrl || metadata?.storagePath;
        const type = message.type;

        if (!mediaUrl && type === 'text') return null;

        if (type === 'photo' || type === 'image') {
            return (
                <div className="mb-2 rounded-lg overflow-hidden">
                    <img
                        src={mediaUrl}
                        alt="Image"
                        className="max-w-[280px] max-h-[300px] object-cover rounded-lg"
                        loading="lazy"
                    />
                </div>
            );
        }

        if (type === 'video') {
            return (
                <div className="mb-2 rounded-lg overflow-hidden">
                    <video
                        src={mediaUrl}
                        controls
                        className="max-w-[280px] max-h-[300px] rounded-lg"
                    />
                </div>
            );
        }

        if (type === 'audio' || type === 'voice') {
            return (
                <div className="mb-2">
                    <audio src={mediaUrl} controls className="w-full max-w-[280px]" />
                </div>
            );
        }

        if (type === 'document') {
            const fileName = metadata?.fileName || metadata?.filename || 'Document';
            return (
                <div className={cn(
                    "flex items-center gap-3 p-3 rounded-lg mb-2",
                    isOutbound ? "bg-white/10" : "bg-gray-100"
                )}>
                    <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        isOutbound ? "bg-white/20" : "bg-gray-200"
                    )}>
                        📄
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className={cn(
                            "text-sm font-medium truncate",
                            isOutbound ? "text-white" : "text-gray-900"
                        )}>
                            {fileName}
                        </p>
                        <p className={cn(
                            "text-xs",
                            isOutbound ? "text-indigo-200" : "text-gray-500"
                        )}>
                            Document
                        </p>
                    </div>
                    <a
                        href={mediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                            "p-2 rounded-lg transition-colors",
                            isOutbound ? "hover:bg-white/10 text-indigo-100" : "hover:bg-gray-200 text-gray-500"
                        )}
                    >
                        <Download className="w-4 h-4" />
                    </a>
                </div>
            );
        }

        if (type === 'sticker') {
            return (
                <div className="text-4xl mb-1">
                    {message.content || '🎭'}
                </div>
            );
        }

        if (type === 'location') {
            return (
                <div className={cn(
                    "p-3 rounded-lg mb-2",
                    isOutbound ? "bg-white/10" : "bg-gray-100"
                )}>
                    <p className={cn(
                        "text-sm",
                        isOutbound ? "text-white" : "text-gray-900"
                    )}>
                        📍 {message.content}
                    </p>
                </div>
            );
        }

        return null;
    };

    const renderTextContent = () => {
        const content = message.content;
        if (!content || content.match(/^\[(PHOTO|IMAGE|VIDEO|DOCUMENT|AUDIO|VOICE|STICKER|LOCATION)\]$/i)) {
            return null;
        }

        return (
            <div className={cn(
                "text-[14px] whitespace-pre-wrap break-words leading-relaxed tracking-normal",
                isOutbound ? "text-white" : "text-gray-900"
            )}>
                <ReactMarkdown
                    components={{
                        p: ({ children }) => <p className="mb-0.5 last:mb-0">{children}</p>,
                        strong: ({ children }) => <span className="font-semibold">{children}</span>,
                        em: ({ children }) => <span className="italic">{children}</span>,
                        ul: ({ children }) => <ul className="list-disc list-inside my-1 space-y-0.5">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside my-1 space-y-0.5">{children}</ol>,
                        code: ({ children }) => <code className={cn(
                            "px-1 py-0.5 rounded text-xs font-mono",
                            isOutbound ? "bg-white/20 text-white" : "bg-gray-100 text-indigo-600"
                        )}>{children}</code>,
                    }}
                >
                    {content}
                </ReactMarkdown>
            </div>
        );
    };

    const getPlatformIndicator = () => {
        if (platform === 'meta_whatsapp') {
            return (
                <div className="flex items-center gap-1 text-[10px] text-green-500">
                    <MessageCircle className="w-3 h-3" />
                </div>
            );
        }
        return (
            <div className="flex items-center gap-1 text-[10px] text-blue-500">
                <Send className="w-3 h-3" />
            </div>
        );
    };

    return (
        <div className={cn(
            "flex w-full mb-3 group",
            isOutbound ? "justify-end" : "justify-start"
        )}>
            <div className={cn(
                "relative max-w-[85%] sm:max-w-[70%] px-3.5 py-2.5 shadow-sm text-left transition-all",
                isOutbound
                    ? "bg-indigo-600 rounded-2xl rounded-tr-sm"
                    : "bg-white border border-gray-100 rounded-2xl rounded-tl-sm hover:shadow-md"
            )}>
                {onDelete && (
                    <div className={cn(
                        "absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10",
                        isOutbound ? "-right-8" : "-left-8"
                    )}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-gray-400 hover:text-gray-600"
                                >
                                    <MoreVertical className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align={isOutbound ? "end" : "start"}>
                                <DropdownMenuItem
                                    onClick={() => onDelete(message.id)}
                                    className="text-red-600"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}

                {renderMedia()}
                {renderTextContent()}

                <div className={cn(
                    "flex items-center gap-1.5 mt-1.5",
                    isOutbound ? "justify-end" : "justify-start"
                )}>
                    {getPlatformIndicator()}
                    <span className={cn(
                        "text-[10px]",
                        isOutbound ? "text-indigo-200" : "text-gray-400"
                    )}>
                        {getTimestamp()}
                    </span>
                    {getStatusIcon()}
                </div>
            </div>
        </div>
    );
}
