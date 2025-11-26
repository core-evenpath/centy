'use client';

import { format } from 'date-fns';
import { Check, CheckCheck, Clock, FileText, Download, MoreVertical, Trash2 } from 'lucide-react';
import type { MetaWhatsAppMessage } from '@/lib/types-meta-whatsapp';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MessageBubbleProps {
    message: MetaWhatsAppMessage;
    onDelete?: (messageId: string) => void;
}

export function MessageBubble({ message, onDelete }: MessageBubbleProps) {
    const isOutbound = message.direction === 'outbound';
    const metadata = message.metaMetadata || {};

    const getStatusIcon = () => {
        if (!isOutbound) return null;

        switch (metadata.status) {
            case 'read':
                return <CheckCheck className="w-4 h-4 text-blue-500" />;
            case 'delivered':
                return <CheckCheck className="w-4 h-4 text-gray-400" />;
            case 'sent':
                return <Check className="w-4 h-4 text-gray-400" />;
            default:
                return <Clock className="w-4 h-4 text-gray-300" />;
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
                <div className="relative mb-1 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={metadata.mediaUrl}
                        alt="Image"
                        className="rounded-lg max-w-full h-auto object-cover"
                        style={{ maxHeight: '300px' }}
                    />
                    {message.content && !message.content.includes('[IMAGE]') && (
                        <p className="mt-2 text-sm">{message.content}</p>
                    )}
                </div>
            );
        }

        if (message.type === 'video' && metadata.mediaUrl) {
            return (
                <div className="relative mb-1">
                    <video
                        src={metadata.mediaUrl}
                        controls
                        className="rounded-lg max-w-full h-auto"
                        style={{ maxHeight: '300px' }}
                    />
                    {message.content && !message.content.includes('[VIDEO]') && (
                        <p className="mt-2 text-sm">{message.content}</p>
                    )}
                </div>
            );
        }

        if (message.type === 'document' && metadata.mediaUrl) {
            return (
                <div className="flex items-center gap-3 p-2 bg-gray-100 rounded-lg mb-1">
                    <FileText className="w-8 h-8 text-red-500" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{metadata.filename || 'Document'}</p>
                        <p className="text-xs text-gray-500 uppercase">{metadata.mimeType?.split('/')[1] || 'FILE'}</p>
                    </div>
                    <a href={metadata.mediaUrl} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-gray-200 rounded-full">
                        <Download className="w-4 h-4 text-gray-600" />
                    </a>
                </div>
            );
        }

        // For text messages or media without URL
        if (message.content && !message.content.match(/^\[(IMAGE|VIDEO|DOCUMENT|AUDIO|STICKER)\]$/)) {
            return (
                <p className="text-[15px] text-gray-900 whitespace-pre-wrap break-words">
                    {message.content}
                </p>
            );
        }

        return null;
    };

    return (
        <div className={`flex ${isOutbound ? 'justify-end' : 'justify-start'} mb-2 group`}>
            <div
                className={`relative max-w-[70%] rounded-lg px-3 py-2 shadow-sm ${isOutbound
                    ? 'bg-[#dcf8c6] rounded-tr-none'
                    : 'bg-white rounded-tl-none'
                    }`}
            >
                {/* Dropdown Trigger - Floating inside top right */}
                <div className={`absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-black/10 rounded-full backdrop-blur-sm`}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="p-1 hover:bg-black/20 rounded-full text-gray-600">
                                <MoreVertical className="w-3 h-3" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={() => onDelete?.(message.id)}
                                className="text-red-600 focus:text-red-600 cursor-pointer"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {renderContent()}

                <div className={`flex items-center gap-1 mt-1 ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[11px] text-gray-500">{formatTime()}</span>
                    {getStatusIcon()}
                </div>
            </div>
        </div>
    );
}
