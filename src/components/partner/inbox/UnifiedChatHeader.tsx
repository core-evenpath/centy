import React from 'react';
import { MoreHorizontal, Trash2, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import type { UnifiedConversation, Platform } from '@/hooks/useUnifiedConversations';

interface UnifiedChatHeaderProps {
    conversation: UnifiedConversation;
    onDelete: () => void;
    onBack?: () => void;
}

function getPlatformBadge(platform: Platform) {
    if (platform === 'meta_whatsapp') {
        return { label: 'WhatsApp', bg: '#25D366' };
    }
    return { label: 'Telegram', bg: '#0088cc' };
}

export function UnifiedChatHeader({ conversation, onDelete, onBack }: UnifiedChatHeaderProps) {
    const displayName = conversation.contactName || conversation.title || conversation.customerIdentifier;
    const platform = getPlatformBadge(conversation.platform);

    return (
        <div className="h-[72px] bg-white border-b border-[#e5e5e5] px-4 md:px-6 flex items-center justify-between shrink-0 z-10">
            <div className="flex items-center gap-3.5">
                <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden -ml-2 h-10 w-10 text-[#666] hover:text-[#000] hover:bg-[#f5f5f5] rounded-xl transition-colors"
                    onClick={onBack}
                >
                    <ChevronLeft className="w-6 h-6" />
                </Button>

                <Avatar className="w-11 h-11 rounded-xl">
                    <AvatarImage src={conversation.contact?.avatarUrl} />
                    <AvatarFallback className="bg-[#111] text-white font-semibold text-[13px] rounded-xl">
                        {displayName?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                        <span className="font-semibold text-[#000] text-[15px] truncate max-w-[140px] md:max-w-xs">
                            {displayName}
                        </span>
                        <span
                            className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold text-white"
                            style={{ backgroundColor: platform.bg }}
                        >
                            {platform.label}
                        </span>
                    </div>
                    <div className="flex items-center text-[13px] text-[#666] mt-0.5">
                        <span>{conversation.contactCompany || 'Contact'}</span>
                        {conversation.contact?.customFields?.aum && (
                            <>
                                <span className="mx-1.5">·</span>
                                <span className="text-[#000] font-medium">AUM {conversation.contact.customFields.aum}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {conversation.contactId && (
                    <Link href={`/partner/contacts/${conversation.contactId}`}>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-[12px] text-[#666] hover:text-[#000] hover:bg-[#f5f5f5] hidden md:flex rounded-lg transition-colors font-medium"
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
                            className="h-9 w-9 text-[#999] hover:text-[#666] hover:bg-[#f5f5f5] rounded-lg transition-colors"
                        >
                            <MoreHorizontal className="w-5 h-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 border-[#e5e5e5]">
                        {conversation.contactId && (
                            <>
                                <DropdownMenuItem asChild className="cursor-pointer text-[13px]">
                                    <Link href={`/partner/contacts/${conversation.contactId}`}>
                                        View Contact Profile
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                            </>
                        )}
                        <DropdownMenuItem
                            onClick={onDelete}
                            className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer text-[13px]"
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
