'use client';

import { format } from 'date-fns';
import { Check, CheckCheck, Clock } from 'lucide-react';
import type { MetaWhatsAppMessage } from '@/lib/types-meta-whatsapp';

interface MessageBubbleProps {
    message: MetaWhatsAppMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
    const isOutbound = message.direction === 'outbound';

    const getStatusIcon = () => {
        if (!isOutbound) return null;

        switch (message.metaMetadata?.status) {
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

    return (
        <div className={`flex ${isOutbound ? 'justify-end' : 'justify-start'} mb-1`}>
            <div
                className={`max-w-[70%] rounded-lg px-3 py-2 shadow-sm ${isOutbound
                        ? 'bg-[#dcf8c6] rounded-tr-none'
                        : 'bg-white rounded-tl-none'
                    }`}
            >
                <p className="text-[15px] text-gray-900 whitespace-pre-wrap break-words">
                    {message.content}
                </p>

                <div className={`flex items-center gap-1 mt-1 ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[11px] text-gray-500">{formatTime()}</span>
                    {getStatusIcon()}
                </div>
            </div>
        </div>
    );
}
