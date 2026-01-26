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
        'bg-gradient-to-br from-emerald-500 to-green-600',
        'bg-gradient-to-br from-blue-500 to-indigo-600',
        'bg-gradient-to-br from-violet-500 to-purple-600',
        'bg-gradient-to-br from-amber-500 to-orange-600',
        'bg-gradient-to-br from-cyan-500 to-teal-600',
        'bg-gradient-to-br from-rose-500 to-pink-600',
        'bg-gradient-to-br from-slate-600 to-gray-700',
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
        return 'border-emerald-300 text-emerald-700 bg-emerald-50/80';
    }
    return 'border-sky-300 text-sky-700 bg-sky-50/80';
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
            "flex flex-col bg-white border-r border-gray-100/80 h-full",
            isMobile ? "w-full" : "w-[340px]"
        )}>
            <div className="p-4 border-b border-gray-100/80 space-y-3 bg-gradient-to-b from-white to-gray-50/30">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Inbox</h2>
                    {onNewConversation && (
                        <Button
                            size="sm"
                            onClick={onNewConversation}
                            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-sm shadow-indigo-500/20 transition-all active:scale-[0.98]"
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
                        className="pl-9 bg-gray-50/80 border-gray-200/80 focus:border-indigo-300 focus:ring-indigo-200 transition-colors"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors">
                                <Filter className="w-3 h-3 mr-1" />
                                {platformFilter === 'all' ? 'All' : getPlatformLabel(platformFilter)}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="shadow-lg border-gray-200">
                            <DropdownMenuItem onClick={() => onPlatformFilterChange('all')} className="cursor-pointer">
                                All ({whatsAppCount + telegramCount})
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onPlatformFilterChange('meta_whatsapp')} className="cursor-pointer">
                                <MessageCircle className="w-4 h-4 mr-2 text-emerald-600" />
                                WhatsApp ({whatsAppCount})
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onPlatformFilterChange('telegram')} className="cursor-pointer">
                                <Send className="w-4 h-4 mr-2 text-sky-600" />
                                Telegram ({telegramCount})
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <div className="flex gap-1">
                        {whatsAppCount > 0 && (
                            <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-600 bg-emerald-50/50">
                                <MessageCircle className="w-3 h-3 mr-1" />
                                {whatsAppCount}
                            </Badge>
                        )}
                        {telegramCount > 0 && (
                            <Badge variant="outline" className="text-xs border-sky-200 text-sky-600 bg-sky-50/50">
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
                        <div className="flex gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center mb-4">
                            <MessageCircle className="w-7 h-7 text-gray-300" />
                        </div>
                        <p className="text-gray-500 text-sm font-medium">No conversations yet</p>
                        <p className="text-gray-400 text-xs mt-1">
                            {platformFilter !== 'all'
                                ? `No ${getPlatformLabel(platformFilter)} conversations`
                                : 'Start a conversation to see it here'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50/80">
                        {conversations.map((conv) => {
                            const isSelected = selectedId === conv.id;
                            const avatarColor = getAvatarColor(conv.customerIdentifier);

                            return (
                                <div
                                    key={conv.id}
                                    onClick={() => onSelect(conv)}
                                    className={cn(
                                        "flex items-start gap-3 p-4 cursor-pointer transition-all duration-200",
                                        isSelected
                                            ? "bg-gradient-to-r from-indigo-50/80 to-violet-50/50 border-l-[3px] border-indigo-500"
                                            : "hover:bg-gray-50/80 border-l-[3px] border-transparent"
                                    )}
                                >
                                    <div className="relative">
                                        <Avatar className={cn(
                                            "w-11 h-11 border-2 transition-all",
                                            isSelected ? "border-indigo-200 shadow-sm" : "border-white shadow-sm"
                                        )}>
                                            <AvatarImage src={conv.contact?.avatarUrl} />
                                            <AvatarFallback className={cn("text-white font-semibold text-sm", avatarColor)}>
                                                {conv.title?.[0]?.toUpperCase() || '?'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className={cn(
                                            "absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm text-white",
                                            conv.platform === 'meta_whatsapp' ? "bg-emerald-500" : "bg-sky-500"
                                        )}>
                                            {getPlatformIcon(conv.platform)}
                                            <span className="sr-only">{getPlatformLabel(conv.platform)}</span>
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className={cn(
                                                "font-semibold text-sm truncate tracking-tight",
                                                isSelected ? "text-indigo-900" : "text-gray-900"
                                            )}>
                                                {conv.title}
                                            </h3>
                                            <span className={cn(
                                                "text-[11px] ml-2 flex-shrink-0 font-medium",
                                                conv.unreadCount > 0 ? "text-indigo-600" : "text-gray-400"
                                            )}>
                                                {formatTime(conv.lastMessageAt)}
                                            </span>
                                        </div>

                                        <p className={cn(
                                            "text-xs truncate mb-1.5 leading-relaxed",
                                            conv.unreadCount > 0 ? "text-gray-800 font-medium" : "text-gray-500"
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
                                                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-500/25">
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
