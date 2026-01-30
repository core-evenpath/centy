import React from 'react';
import { Search, Plus, MessageCircle, Filter, RefreshCw } from 'lucide-react';
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
    onRefresh?: () => void;
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
    onRefresh,
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
            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-[#e5e5e5]">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#000] flex items-center justify-center shadow-sm">
                            <span className="text-white text-[14px]">⚡</span>
                        </div>
                        <h1 className="text-[18px] font-bold text-[#000] tracking-[-0.5px]">Inbox</h1>
                    </div>
                    {onNewConversation && (
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={onNewConversation}
                            className="h-8 w-8 rounded-lg bg-[#f5f5f5] hover:bg-[#e8e8e8] border-0 transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                            <Plus className="w-[18px] h-[18px] text-[#666]" />
                        </Button>
                    )}
                </div>

                {/* Search Input */}
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
                    <Input
                        placeholder="Search clients..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-10 h-10 bg-[#fafafa] border-[#e5e5e5] focus:border-[#000] focus:bg-white focus:ring-0 rounded-lg text-[14px] placeholder:text-[#999] transition-all duration-200"
                    />
                </div>

                {/* Filter Dropdown */}
                <div className="flex items-center gap-2 mt-3">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 border-[#e5e5e5] hover:bg-[#f5f5f5] hover:border-[#ddd] text-[12px] font-medium text-[#333] transition-all duration-200"
                            >
                                <Filter className="w-3 h-3 mr-1.5 text-[#666]" />
                                {platformFilter === 'all' ? 'All' : getPlatformLabel(platformFilter)}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="border-[#e5e5e5] shadow-lg">
                            <DropdownMenuItem onClick={() => onPlatformFilterChange('all')} className="cursor-pointer text-[13px] font-medium">
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

                {onRefresh && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onRefresh}
                        className="h-8 w-8 p-0 rounded-lg hover:bg-[#f5f5f5] text-[#666] transition-all duration-200"
                        title="Refresh Business Data"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                    </Button>
                )}
            </div>

            {/* Conversation List */}
            <ScrollArea className="flex-1">
                {loading ? (
                    <div className="flex items-center justify-center p-8">
                        <div className="flex flex-col items-center gap-4">
                            <div className="flex gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-[#000] animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 rounded-full bg-[#000] animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 rounded-full bg-[#000] animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                            <p className="text-[13px] text-[#999]">Loading conversations...</p>
                        </div>
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-[#f5f5f5] flex items-center justify-center mb-4">
                            <span className="text-2xl">💬</span>
                        </div>
                        <p className="text-[#000] text-[15px] font-semibold tracking-[-0.3px]">No conversations yet</p>
                        <p className="text-[#999] text-[13px] mt-1.5 leading-relaxed">
                            {platformFilter !== 'all'
                                ? `No ${getPlatformLabel(platformFilter)} conversations`
                                : 'Start a conversation to see it here'}
                        </p>
                    </div>
                ) : (
                    <div className="py-1">
                        {conversations.map((conv, index) => {
                            const isSelected = selectedId === conv.id;

                            return (
                                <div
                                    key={conv.id}
                                    onClick={() => onSelect(conv)}
                                    style={{
                                        animationDelay: `${index * 50}ms`,
                                        opacity: 0,
                                        animation: `fadeSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards`
                                    }}
                                    className={cn(
                                        "flex gap-3 py-3.5 px-5 cursor-pointer border-l-[3px] transition-all duration-200",
                                        isSelected
                                            ? "bg-[#f5f5f5] border-l-[#000]"
                                            : "hover:bg-[#fafafa] border-l-transparent"
                                    )}
                                >
                                    {/* Avatar */}
                                    <div className="relative flex-shrink-0">
                                        <Avatar className="w-11 h-11 rounded-xl">
                                            <AvatarImage src={conv.contact?.avatarUrl} />
                                            <AvatarFallback className="bg-[#111] text-white font-semibold text-[13px] rounded-xl">
                                                {conv.title?.substring(0, 2).toUpperCase() || '?'}
                                            </AvatarFallback>
                                        </Avatar>
                                        {conv.unreadCount > 0 && (
                                            <span
                                                className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#ef4444] rounded-full border-2 border-white"
                                                style={{ animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                                            />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        {/* Name & Time */}
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className="font-semibold text-[14px] text-[#000] truncate">
                                                {conv.title}
                                            </span>
                                            <span className={cn(
                                                "text-[12px] ml-2 flex-shrink-0",
                                                conv.unreadCount > 0 ? "text-[#000] font-semibold" : "text-[#999]"
                                            )}>
                                                {formatTime(conv.lastMessageAt)}
                                            </span>
                                        </div>

                                        {/* Company · Value */}
                                        <div className="flex items-center gap-1.5 mb-1.5">
                                            <span className="text-[12px] text-[#666]">{conv.contactCompany || 'Contact'}</span>
                                            {conv.contact?.customFields?.aum && (
                                                <>
                                                    <span className="text-[12px] text-[#999]">·</span>
                                                    <span className="text-[12px] text-[#000] font-semibold">{conv.contact.customFields.aum}</span>
                                                </>
                                            )}
                                        </div>

                                        {/* Platform & Preview */}
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

            {/* Inline styles for animations */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fadeSlideIn {
                    from {
                        opacity: 0;
                        transform: translateX(-16px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                @keyframes scaleIn {
                    from { transform: scale(0); }
                    to { transform: scale(1); }
                }
            `}} />
        </div >
    );
}
