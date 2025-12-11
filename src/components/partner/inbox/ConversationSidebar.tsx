import React from 'react';
import { Search, Inbox, SlidersHorizontal, Star, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { EnrichedMetaConversation } from '@/hooks/useEnrichedMetaConversations';
import { formatDistanceToNow, isToday, isYesterday } from 'date-fns';

interface ConversationSidebarProps {
    conversations: EnrichedMetaConversation[];
    selectedId: string | null;
    onSelect: (conversation: EnrichedMetaConversation) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    loading: boolean;
    isMobile?: boolean;
}

type FilterType = 'all' | 'unread' | 'starred';

export function ConversationSidebar({
    conversations,
    selectedId,
    onSelect,
    searchQuery,
    onSearchChange,
    loading,
    isMobile = false
}: ConversationSidebarProps) {
    const [activeFilter, setActiveFilter] = React.useState<FilterType>('all');

    const filteredConversations = React.useMemo(() => {
        let filtered = conversations;

        if (searchQuery.trim()) {
            const lowerQ = searchQuery.toLowerCase();
            filtered = filtered.filter(c =>
                c.customerName?.toLowerCase().includes(lowerQ) ||
                c.customerPhone.includes(lowerQ) ||
                c.lastMessagePreview?.toLowerCase().includes(lowerQ) ||
                c.contactName?.toLowerCase().includes(lowerQ) ||
                c.contactEmail?.toLowerCase().includes(lowerQ) ||
                c.contactCompany?.toLowerCase().includes(lowerQ)
            );
        }

        if (activeFilter === 'unread') {
            filtered = filtered.filter(c => c.unreadCount > 0);
        } else if (activeFilter === 'starred') {
            filtered = [];
        }

        return filtered;
    }, [conversations, searchQuery, activeFilter]);

    const formatTime = (timestamp: any) => {
        if (!timestamp) return '';
        try {
            const date = timestamp?.toDate?.() || new Date(timestamp);
            if (isToday(date)) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            if (isYesterday(date)) return 'Yesterday';
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } catch {
            return '';
        }
    };

    return (
        <div className={cn(
            "h-full flex flex-col border-r border-gray-100 bg-white shrink-0",
            // Full width on mobile, fixed width on desktop
            "w-full md:w-[320px] md:min-w-[320px] md:max-w-[320px]"
        )}>
            <div className="p-4 pb-2 space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl md:text-lg font-semibold tracking-tight text-gray-900">Inbox</h1>
                    <div className="flex gap-2">
                    </div>
                </div>

                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search messages..."
                        className="pl-9 h-9 bg-gray-50 border-gray-100 focus:border-indigo-200 focus:bg-white focus:ring-2 focus:ring-indigo-50/50 transition-all text-sm shadow-sm"
                    />
                </div>

                <div className="flex gap-1.5">
                    {['all', 'unread', 'starred'].map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter as FilterType)}
                            className={cn(
                                "px-3 py-1 rounded-full text-[11px] font-medium transition-all border",
                                activeFilter === filter
                                    ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            )}
                        >
                            {filter === 'all' ? 'All Chats' : filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <ScrollArea className="flex-1">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-3">
                        <div className="w-6 h-6 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                        <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                            <Search className="w-4 h-4 text-gray-400" />
                        </div>
                        <p className="text-gray-900 font-medium text-sm">No conversations</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {filteredConversations.map((conv) => (
                            <div
                                key={conv.id}
                                onClick={() => onSelect(conv)}
                                className={cn(
                                    "flex items-start gap-3 p-3.5 cursor-pointer transition-all hover:bg-gray-50/80 group",
                                    selectedId === conv.id && "bg-indigo-50/50 hover:bg-indigo-50/60 border-l-[3px] border-l-indigo-600 pl-[calc(0.875rem-3px)]"
                                )}
                            >
                                <div className="relative shrink-0">
                                    <Avatar className="w-10 h-10 border border-black/5 shadow-sm">
                                        <AvatarImage src={conv.contact?.avatarUrl} />
                                        <AvatarFallback className={cn(
                                            "text-xs font-medium text-white",
                                            selectedId === conv.id ? "bg-indigo-600" : "bg-gradient-to-br from-indigo-500 to-purple-600"
                                        )}>
                                            {(conv.contactName || conv.customerName || conv.customerPhone)?.[0]?.toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>

                                <div className="flex-1 min-w-0 flex flex-col justify-center h-10">
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className={cn(
                                            "text-[13px] font-semibold truncate leading-none",
                                            conv.unreadCount > 0 ? "text-gray-950" : "text-gray-700"
                                        )}>
                                            {conv.contactName || conv.customerName || conv.customerPhone}
                                        </h3>
                                        <span className={cn(
                                            "text-[10px] tabular-nums shrink-0",
                                            conv.unreadCount > 0 ? "text-indigo-600 font-medium" : "text-gray-400"
                                        )}>
                                            {formatTime(conv.lastMessageAt)}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between gap-2 mt-1">
                                        <p className={cn(
                                            "text-[12px] truncate line-clamp-1 leading-normal",
                                            (conv.unreadCount > 0 || selectedId === conv.id) ? "text-gray-900 font-medium" : "text-gray-500"
                                        )}>
                                            {conv.lastMessagePreview || 'No messages yet'}
                                        </p>
                                        {conv.unreadCount > 0 && (
                                            <Badge className="h-4 min-w-[1rem] px-1 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-[9px] rounded-full shrink-0 shadow-none">
                                                {conv.unreadCount}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}