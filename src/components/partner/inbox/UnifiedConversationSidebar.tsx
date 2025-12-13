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

function getAvatarColor(str: string): string {
    const colors = [
        'bg-green-500',
        'bg-blue-500',
        'bg-emerald-500',
        'bg-teal-500',
        'bg-cyan-500',
        'bg-indigo-500',
        'bg-purple-500',
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

function getPlatformIcon(platform: Platform) {
    if (platform === 'meta_whatsapp') {
        return <MessageCircle className="w-3 h-3" />;
    }
    return <Send className="w-3 h-3" />;
}

function getPlatformColor(platform: Platform) {
    if (platform === 'meta_whatsapp') {
        return 'border-green-500 text-green-600 bg-green-50';
    }
    return 'border-blue-500 text-blue-600 bg-blue-50';
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
            "flex flex-col bg-white border-r border-gray-100 h-full",
            isMobile ? "w-full" : "w-[340px]"
        )}>
            <div className="p-4 border-b border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Inbox</h2>
                    {onNewConversation && (
                        <Button
                            size="sm"
                            onClick={onNewConversation}
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            <Plus className="w-4 h-4 mr-1" />
                            New
                        </Button>
                    )}
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9 bg-gray-50 border-gray-200"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8">
                                <Filter className="w-3 h-3 mr-1" />
                                {platformFilter === 'all' ? 'All' : getPlatformLabel(platformFilter)}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            <DropdownMenuItem onClick={() => onPlatformFilterChange('all')}>
                                All ({whatsAppCount + telegramCount})
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onPlatformFilterChange('meta_whatsapp')}>
                                <MessageCircle className="w-4 h-4 mr-2 text-green-600" />
                                WhatsApp ({whatsAppCount})
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onPlatformFilterChange('telegram')}>
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
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
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
                    <div className="divide-y divide-gray-50">
                        {conversations.map((conv) => {
                            const isSelected = selectedId === conv.id;
                            const avatarColor = getAvatarColor(conv.customerIdentifier);

                            return (
                                <div
                                    key={conv.id}
                                    onClick={() => onSelect(conv)}
                                    className={cn(
                                        "flex items-start gap-3 p-4 cursor-pointer transition-all",
                                        isSelected
                                            ? "bg-indigo-50 border-l-2 border-indigo-600"
                                            : "hover:bg-gray-50 border-l-2 border-transparent"
                                    )}
                                >
                                    <div className="relative">
                                        <Avatar className="w-11 h-11 border border-gray-100">
                                            <AvatarImage src={conv.contact?.avatarUrl} />
                                            <AvatarFallback className={cn("text-white font-medium", avatarColor)}>
                                                {conv.title?.[0]?.toUpperCase() || '?'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className={cn(
                                            "absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white",
                                            conv.platform === 'meta_whatsapp' ? "bg-green-500" : "bg-blue-500"
                                        )}>
                                            {getPlatformIcon(conv.platform)}
                                            <span className="sr-only">{getPlatformLabel(conv.platform)}</span>
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className={cn(
                                                "font-medium text-sm truncate",
                                                isSelected ? "text-indigo-900" : "text-gray-900"
                                            )}>
                                                {conv.title}
                                            </h3>
                                            <span className="text-[11px] text-gray-400 ml-2 flex-shrink-0">
                                                {formatTime(conv.lastMessageAt)}
                                            </span>
                                        </div>

                                        <p className={cn(
                                            "text-xs truncate mb-1.5",
                                            conv.unreadCount > 0 ? "text-gray-700 font-medium" : "text-gray-500"
                                        )}>
                                            {conv.lastMessagePreview || 'No messages yet'}
                                        </p>

                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border",
                                                getPlatformColor(conv.platform)
                                            )}>
                                                {getPlatformIcon(conv.platform)}
                                                <span className="ml-1">{getPlatformLabel(conv.platform)}</span>
                                            </span>
                                            {conv.unreadCount > 0 && (
                                                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold bg-indigo-600 text-white">
                                                    {conv.unreadCount}
                                                </span>
                                            )}
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
