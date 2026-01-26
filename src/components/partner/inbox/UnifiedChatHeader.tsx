import React from 'react';
import { MoreHorizontal, Trash2, ChevronLeft, MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import type { UnifiedConversation, Platform } from '@/hooks/useUnifiedConversations';
import { cn } from '@/lib/utils';

interface UnifiedChatHeaderProps {
    conversation: UnifiedConversation;
    onDelete: () => void;
    onBack?: () => void;
}

function getPlatformIcon(platform: Platform) {
    if (platform === 'meta_whatsapp') {
        return <MessageCircle className="w-3.5 h-3.5" />;
    }
    return <Send className="w-3.5 h-3.5" />;
}

function getPlatformLabel(platform: Platform) {
    if (platform === 'meta_whatsapp') {
        return 'WhatsApp';
    }
    return 'Telegram';
}

function getPlatformColor(platform: Platform) {
    if (platform === 'meta_whatsapp') {
        return 'text-green-600 bg-green-50 border-green-200';
    }
    return 'text-blue-600 bg-blue-50 border-blue-200';
}

export function UnifiedChatHeader({ conversation, onDelete, onBack }: UnifiedChatHeaderProps) {
    const displayName = conversation.contactName || conversation.title || conversation.customerIdentifier;

    return (
        <div className="h-[72px] bg-white border-b border-gray-200 px-4 md:px-6 flex items-center justify-between shrink-0 z-10">
            <div className="flex items-center gap-2.5 md:gap-3.5">
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden -ml-2 h-10 w-10 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                    onClick={onBack}
                >
                    <ChevronLeft className="w-6 h-6" />
                </Button>

                <Avatar className="w-10 h-10 md:w-11 md:h-11 rounded-xl">
                    <AvatarImage src={conversation.contact?.avatarUrl} />
                    <AvatarFallback className="bg-[#111] text-white font-semibold text-sm rounded-xl">
                        {displayName?.[0]?.toUpperCase()}
                    </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <h2 className="font-semibold text-gray-900 text-[15px] leading-tight tracking-tight truncate max-w-[140px] md:max-w-xs">
                            {displayName}
                        </h2>
                        {conversation.contactCompany && (
                            <span className="text-[10px] md:text-[11px] text-gray-400 truncate max-w-[80px] md:max-w-none hidden sm:inline font-medium">
                                · {conversation.contactCompany}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-1">
                        <Badge
                            variant="outline"
                            className={cn(
                                "h-5 text-[10px] font-medium border",
                                getPlatformColor(conversation.platform)
                            )}
                        >
                            {getPlatformIcon(conversation.platform)}
                            <span className="ml-1">{getPlatformLabel(conversation.platform)}</span>
                        </Badge>
                        <span className="text-gray-300">•</span>
                        <span className="truncate max-w-[120px] md:max-w-none text-gray-400">
                            {conversation.customerIdentifier}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-1.5">
                {conversation.contactId && (
                    <Link href={`/partner/contacts/${conversation.contactId}`}>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100 hidden md:flex rounded-lg transition-colors"
                        >
                            View Contact
                        </Button>
                    </Link>
                )}

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                        >
                            <MoreHorizontal className="w-5 h-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 border-gray-200">
                        {conversation.contactId && (
                            <>
                                <DropdownMenuItem asChild className="cursor-pointer">
                                    <Link href={`/partner/contacts/${conversation.contactId}`}>
                                        View Contact Profile
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                            </>
                        )}
                        <DropdownMenuItem
                            onClick={onDelete}
                            className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Conversation
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
