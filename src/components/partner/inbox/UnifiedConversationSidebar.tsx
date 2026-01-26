import React from 'react';
import { Search, Plus, MessageCircle, Send, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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

function getAvatarColor(): string {
    return 'bg-[#111]';
}

function getPlatformIcon(platform: Platform) {
    if (platform === 'meta_whatsapp') {
        return <MessageCircle className="w-3 h-3" />;
    }
    return <Send className="w-3 h-3" />;
}

function getPlatformColor(platform: Platform) {
    if (platform === 'meta_whatsapp') {
        return 'border-green-200 text-green-600 bg-green-50';
    }
    return 'border-blue-200 text-blue-600 bg-blue-50';
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
            "flex flex-col bg-white border-r border-gray-200 h-full",
            isMobile ? "w-full" : "w-[320px]"
        )}>
            <div className="p-4 border-b border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#111] flex items-center justify-center">
                            <span className="text-white text-sm">⚡</span>
                        </div>
                        <h2 className="text-lg font-bold text-[#111] tracking-tight">Inbox</h2>
                    </div>
                    {onNewConversation && (
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={onNewConversation}
                            className="h-8 w-8 rounded-lg bg-gray-100 hover:bg-gray-200"
                        >
                            <Plus className="w-4 h-4 text-gray-600" />
                        </Button>
                    )}
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Search clients..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9 h-10 bg-gray-50 border-gray-200 focus:border-gray-300 focus:ring-0 rounded-lg"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 border-gray-200 hover:bg-gray-50">
                                <Filter className="w-3 h-3 mr-1" />
                                {platformFilter === 'all' ? 'All' : getPlatformLabel(platformFilter)}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            <DropdownMenuItem onClick={() => onPlatformFilterChange('all')} className="cursor-pointer">
                                All ({whatsAppCount + telegramCount})
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onPlatformFilterChange('meta_whatsapp')} className="cursor-pointer">
                                <MessageCircle className="w-4 h-4 mr-2 text-green-600" />
                                WhatsApp ({whatsAppCount})
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onPlatformFilterChange('telegram')} className="cursor-pointer">
                                <Send className="w-4 h-4 mr-2 text-blue-600" />
                                Telegram ({telegramCount})
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="flex gap-1">
                        {whatsAppCount > 0 && (
                            <Badge variant="outline" className="text-xs border-green-200 text-green-600">
                                <MessageCircle className="w-3 h-3 mr-1" />
                                {whatsAppCount}
                            </Badge>
                        )}
                        {telegramCount > 0 && (
                            <Badge variant="outline" className="text-xs border-blue-200 text-blue-600">
                                <Send className="w-3 h-3 mr-1" />
                                {telegramCount}
                            </Badge>
                        )}
                    </div>
                </div>
            </div>

            <ScrollArea className="flex-1">
                {loading ? (
                    <div className="flex items-center justify-center p-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900" />
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                        <MessageCircle className="w-12 h-12 text-gray-300 mb-3" />
                        <p className="text-gray-500 text-sm">No conversations yet</p>
                        <p className="text-gray-400 text-xs mt-1">
                            {platformFilter !== 'all'
                                ? `No ${getPlatformLabel(platformFilter)} conversations`
                                : 'Start a conversation to see it here'}
                        </p>
                    </div>
                ) : (
                    <div>
                        {conversations.map((conv) => {
                            const isSelected = selectedId === conv.id;
                            const avatarColor = getAvatarColor();

                            return (
                                <div
                                    key={conv.id}
                                    onClick={() => onSelect(conv)}
                                    className={cn(
                                        "flex items-start gap-3 p-4 cursor-pointer border-l-[3px]",
                                        isSelected
                                            ? "bg-gray-100 border-l-[#111]"
                                            : "hover:bg-gray-50 border-l-transparent"
                                    )}
                                >
                                    <div className="relative">
                                        <Avatar className="w-11 h-11 rounded-xl">
                                            <AvatarImage src={conv.contact?.avatarUrl} />
                                            <AvatarFallback className={cn("text-white font-semibold text-sm rounded-xl", avatarColor)}>
                                                {conv.title?.substring(0, 2).toUpperCase() || '?'}
                                            </AvatarFallback>
                                        </Avatar>
                                        {conv.unreadCount > 0 && (
                                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <h3 className="font-semibold text-sm text-[#111] truncate">
                                                {conv.title}
                                            </h3>
                                            <span className={cn(
                                                "text-[11px] ml-2 flex-shrink-0",
                                                conv.unreadCount > 0 ? "text-[#111] font-semibold" : "text-gray-400"
                                            )}>
                                                {formatTime(conv.lastMessageAt)}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1.5">
                                            <span>{conv.contactCompany || 'Contact'}</span>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                            <span className={cn(
                                                "w-2 h-2 rounded-full",
                                                conv.platform === 'meta_whatsapp' ? "bg-green-500" : "bg-blue-500"
                                            )} />
                                            <p className={cn(
                                                "text-xs truncate",
                                                conv.unreadCount > 0 ? "text-[#111] font-medium" : "text-gray-500"
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
