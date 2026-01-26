import React from 'react';
import { Search, Plus, MessageCircle, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { UnifiedConversation, Platform } from '@/hooks/useUnifiedConversations';

interface UnifiedConversationSidebarProps {
    conversations: UnifiedConversation[];
    selectedId: string | null;
    onSelect: (conversation: UnifiedConversation) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    loading: boolean;
    isMobile?: boolean;
    onNewConversation?: () => void;
    platformFilter: Platform | 'all';
    onPlatformFilterChange: (platform: Platform | 'all') => void;
    whatsAppCount: number;
    telegramCount: number;
}

function getPlatformLabel(platform: Platform) {
    if (platform === 'meta_whatsapp') {
        return 'WhatsApp';
    }
    return 'Telegram';
}

export function UnifiedConversationSidebar({
    conversations,
    selectedId,
    onSelect,
    searchQuery,
    onSearchChange,
    loading,
    isMobile = false,
    onNewConversation,
    platformFilter,
    onPlatformFilterChange,
    whatsAppCount,
    telegramCount,
}: UnifiedConversationSidebarProps) {

    const formatTime = (timestamp: any) => {
        if (!timestamp) return '';
        try {
            const date = timestamp?.toDate?.() || new Date(timestamp);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            if (diffMins < 1) return 'now';
            if (diffMins < 60) return `${diffMins}m`;
            if (diffHours < 24) return `${diffHours}h`;
            if (diffDays < 7) return `${diffDays}d`;

            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } catch {
            return '';
        }
    };

    return (
        <div className={cn(
            "flex flex-col bg-white border-r border-[#e5e5e5] h-full",
            isMobile ? "w-full" : "w-[320px]"
        )}>
            <div className="px-5 pt-5 pb-4 border-b border-[#e5e5e5]">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#000] flex items-center justify-center">
                            <span className="text-white text-sm">⚡</span>
                        </div>
                        <h1 className="text-[18px] font-bold text-[#000] tracking-[-0.5px]">Inbox</h1>
                    </div>
                    {onNewConversation && (
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={onNewConversation}
                            className="h-8 w-8 rounded-lg bg-[#f5f5f5] hover:bg-[#eee] border-0"
                        >
                            <Plus className="w-4 h-4 text-[#666]" />
                        </Button>
                    )}
                </div>

                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
                    <Input
                        placeholder="Search clients..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-10 h-10 bg-[#fafafa] border-[#e5e5e5] focus:border-[#000] focus:ring-0 rounded-lg text-[13px] placeholder:text-[#999]"
                    />
                </div>

                <div className="flex items-center gap-2 mt-3">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 border-[#e5e5e5] hover:bg-[#f5f5f5] text-[12px] font-medium text-[#333]">
                                <Filter className="w-3 h-3 mr-1.5 text-[#666]" />
                                {platformFilter === 'all' ? 'All' : getPlatformLabel(platformFilter)}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="border-[#e5e5e5]">
                            <DropdownMenuItem onClick={() => onPlatformFilterChange('all')} className="cursor-pointer text-[13px]">
                                All ({whatsAppCount + telegramCount})
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onPlatformFilterChange('meta_whatsapp')} className="cursor-pointer text-[13px]">
                                <span className="w-2 h-2 rounded-full bg-[#25D366] mr-2" />
                                WhatsApp ({whatsAppCount})
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onPlatformFilterChange('telegram')} className="cursor-pointer text-[13px]">
                                <span className="w-2 h-2 rounded-full bg-[#0088cc] mr-2" />
                                Telegram ({telegramCount})
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <ScrollArea className="flex-1">
                {loading ? (
                    <div className="flex items-center justify-center p-8">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#e5e5e5] border-t-[#000]" />
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                        <div className="w-12 h-12 rounded-xl bg-[#f5f5f5] flex items-center justify-center mb-3">
                            <MessageCircle className="w-6 h-6 text-[#999]" />
                        </div>
                        <p className="text-[#666] text-[14px] font-medium">No conversations yet</p>
                        <p className="text-[#999] text-[12px] mt-1">
                            {platformFilter !== 'all'
                                ? `No ${getPlatformLabel(platformFilter)} conversations`
                                : 'Start a conversation to see it here'}
                        </p>
                    </div>
                ) : (
                    <div>
                        {conversations.map((conv) => {
                            const isSelected = selectedId === conv.id;

                            return (
                                <div
                                    key={conv.id}
                                    onClick={() => onSelect(conv)}
                                    className={cn(
                                        "flex gap-3 py-3.5 px-5 cursor-pointer border-l-[3px] transition-colors",
                                        isSelected
                                            ? "bg-[#f5f5f5] border-l-[#000]"
                                            : "hover:bg-[#fafafa] border-l-transparent"
                                    )}
                                >
                                    <div className="relative flex-shrink-0">
                                        <Avatar className="w-11 h-11 rounded-xl">
                                            <AvatarImage src={conv.contact?.avatarUrl} />
                                            <AvatarFallback className="bg-[#111] text-white font-semibold text-[13px] rounded-xl">
                                                {conv.title?.substring(0, 2).toUpperCase() || '?'}
                                            </AvatarFallback>
                                        </Avatar>
                                        {conv.unreadCount > 0 && (
                                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#ef4444] rounded-full border-2 border-white" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className="font-semibold text-[14px] text-[#000] truncate">
                                                {conv.title}
                                            </span>
                                            <span className={cn(
                                                "text-[11px] ml-2 flex-shrink-0",
                                                conv.unreadCount > 0 ? "text-[#000] font-semibold" : "text-[#999]"
                                            )}>
                                                {formatTime(conv.lastMessageAt)}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className="text-[12px] text-[#666]">{conv.contactCompany || 'Contact'}</span>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <span className={cn(
                                                "w-2 h-2 rounded-full flex-shrink-0",
                                                conv.platform === 'meta_whatsapp' ? "bg-[#25D366]" : "bg-[#0088cc]"
                                            )} />
                                            <p className={cn(
                                                "text-[12px] truncate",
                                                conv.unreadCount > 0 ? "text-[#000] font-medium" : "text-[#888]"
                                            )}>
                                                {conv.lastMessagePreview || 'No messages yet'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
