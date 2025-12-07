'use client';

import { format } from 'date-fns';
import { Check, CheckCheck, Clock, FileText, Download, MoreVertical, Trash2 } from 'lucide-react';
import type { MetaWhatsAppMessage } from '@/lib/types-meta-whatsapp';
import ReactMarkdown from 'react-markdown';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface MessageBubbleProps {
    message: MetaWhatsAppMessage;
    onDelete?: (messageId: string) => void;
}

export function MessageBubble({ message, onDelete }: MessageBubbleProps) {
    const isOutbound = message.direction === 'outbound';
    const metadata = message.metaMetadata || {};

    const getStatusIcon = () => {
        if (!isOutbound) return null;

        const iconClass = "w-3 h-3";

        switch (metadata.status) {
            case 'read':
                return <CheckCheck className={cn(iconClass, "text-blue-300")} />; // Distinct blue for read on indigo bg
            case 'delivered':
                return <CheckCheck className={cn(iconClass, "text-indigo-200")} />;
            case 'sent':
                return <Check className={cn(iconClass, "text-indigo-200")} />;
            default:
                return <Clock className={cn(iconClass, "text-indigo-300")} />;
        }
    };

    const formatTime = () => {
        try {
            const date = message.createdAt?.toDate?.() || new Date(message.createdAt);
            return format(date, 'HH:mm');
        } catch {
            return '';
        }
    };

    const renderContent = () => {
        if (message.type === 'image' && metadata.mediaUrl) {
            return (
                <div className="relative mb-1 group max-w-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={metadata.mediaUrl}
                        alt="Image"
                        className="rounded-lg w-full h-auto object-cover border border-black/5"
                    />
                    {message.content && !message.content.includes('[IMAGE]') && (
                        <p className={cn("mt-2 text-[14px] leading-relaxed", isOutbound ? "text-indigo-50" : "text-gray-900")}>{message.content}</p>
                    )}
                </div>
            );
        }

        if (message.type === 'video' && metadata.mediaUrl) {
            return (
                <div className="relative mb-1 max-w-sm">
                    <video
                        src={metadata.mediaUrl}
                        controls
                        className="rounded-lg w-full h-auto border border-black/5"
                    />
                    {message.content && !message.content.includes('[VIDEO]') && (
                        <p className={cn("mt-2 text-[14px] leading-relaxed", isOutbound ? "text-indigo-50" : "text-gray-900")}>{message.content}</p>
                    )}
                </div>
            );
        }

        if (message.type === 'document' && metadata.mediaUrl) {
            return (
                <div className={cn(
                    "flex items-center gap-3 p-3 rounded-lg mb-1 max-w-sm",
                    isOutbound ? "bg-white/10 border border-white/20" : "bg-gray-50 border border-gray-200"
                )}>
                    <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                        isOutbound ? "bg-white/20" : "bg-white border border-gray-100 shadow-sm"
                    )}>
                        <FileText className={cn("w-5 h-5", isOutbound ? "text-white" : "text-indigo-500")} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className={cn("text-[13px] font-medium truncate", isOutbound ? "text-white" : "text-gray-900")}>
                            {metadata.filename || 'Document'}
                        </p>
                        <p className={cn("text-[10px] uppercase tracking-wider font-medium", isOutbound ? "text-indigo-200" : "text-gray-400")}>
                            {metadata.mimeType?.split('/')[1] || 'FILE'}
                        </p>
                    </div>
                    <a
                        href={metadata.mediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                            "p-2 rounded-full transition-colors",
                            isOutbound ? "hover:bg-white/10 text-indigo-100" : "hover:bg-gray-200 text-gray-500"
                        )}
                    >
                        <Download className="w-4 h-4" />
                    </a>
                </div>
            );
        }

        // For text messages
        if (message.content && !message.content.match(/^\[(IMAGE|VIDEO|DOCUMENT|AUDIO|STICKER)\]$/)) {
            return (
                <div className={cn(
                    "text-[14px] whitespace-pre-wrap break-words leading-relaxed tracking-normal",
                    isOutbound ? "text-white" : "text-gray-900" // removed font-light/medium, just use default (regular) for clean look
                )}>
                    <ReactMarkdown
                        components={{
                            p: ({ children }) => <p className="mb-0.5 last:mb-0">{children}</p>, // tighter spacing between paragraphs
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
                        {message.content}
                    </ReactMarkdown>
                </div>
            );
        }

        return null;
    };

    return (
        <div className={cn(
            "flex w-full mb-3 group", // reduced margin bottom
            isOutbound ? "justify-end" : "justify-start"
        )}>
            <div className={cn(
                "relative max-w-[85%] sm:max-w-[70%] px-3.5 py-2.5 shadow-sm text-left transition-all",
                isOutbound
                    ? "bg-indigo-600 rounded-2xl rounded-tr-sm"
                    : "bg-white border border-gray-100 rounded-2xl rounded-tl-sm hover:shadow-md"
            )}>
                {/* Dropdown - Only show on hover */}
                {onDelete && (
                    <div className={cn(
                        "absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10",
                        isOutbound ? "text-indigo-100" : "text-gray-400"
                    )}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-black/10">
                                    <MoreVertical className="w-3 h-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onClick={() => onDelete(message.id)}
                                    className="text-red-600 focus:text-red-600 cursor-pointer focus:bg-red-50 text-xs"
                                >
                                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}

                {renderContent()}

                <div className={cn(
                    "flex items-center gap-1 mt-0.5 select-none",
                    isOutbound ? "justify-end text-indigo-200" : "justify-start text-gray-400"
                )}>
                    <span className="text-[10px] font-medium tracking-wide opacity-80 tabular-nums">{formatTime()}</span>
                    {getStatusIcon()}
                </div>
            </div>
        </div>
    );
}
