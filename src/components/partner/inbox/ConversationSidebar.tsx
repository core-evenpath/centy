import React from 'react';
import { Search, Plus, MessageCircle, MoreVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { EnrichedMetaConversation } from '@/hooks/useEnrichedMetaConversations';
import { formatDistanceToNow } from 'date-fns';

interface ConversationSidebarProps {
    conversations: EnrichedMetaConversation[];
    selectedId: string | null;
    onSelect: (conversation: EnrichedMetaConversation) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    loading: boolean;
    isMobile?: boolean;
}

// Generate consistent color from string
function getAvatarColor(str: string): string {
    const colors = [
        'bg-green-500',
        'bg-blue-500',
        'bg-emerald-500',
        'bg-teal-500',
        'bg-cyan-500',
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

export function ConversationSidebar({
    conversations,
    selectedId,
    onSelect,
    searchQuery,
    onSearchChange,
    loading,
    isMobile = false
}: ConversationSidebarProps) {
    const filteredConversations = React.useMemo(() => {
        if (!searchQuery.trim()) return conversations;

        const lowerQ = searchQuery.toLowerCase();
        return conversations.filter(c =>
            c.customerName?.toLowerCase().includes(lowerQ) ||
            c.customerPhone.includes(lowerQ) ||
            c.lastMessagePreview?.toLowerCase().includes(lowerQ) ||
            c.contactName?.toLowerCase().includes(lowerQ) ||
            c.contactEmail?.toLowerCase().includes(lowerQ) ||
            c.contactCompany?.toLowerCase().includes(lowerQ)
        );
    }, [conversations, searchQuery]);

    const formatTime = (timestamp: any) => {
        if (!timestamp) return '';
        try {
            const date = timestamp?.toDate?.() || new Date(timestamp);
            return formatDistanceToNow(date, { addSuffix: true });
        } catch {
            return '';
        }
    };

    const getDisplayName = (conv: EnrichedMetaConversation) => {
        return conv.contactName || conv.customerName || conv.customerPhone;
    };

    const getPhoneDisplay = (conv: EnrichedMetaConversation) => {
        // Format as whatsapp:+number for WhatsApp conversations
        if (conv.platform === 'meta_whatsapp') {
            return `whatsapp:${conv.customerPhone}`;
        }
        return conv.customerPhone;
    };

    const getChannelType = (conv: EnrichedMetaConversation): 'whatsapp' | 'sms' => {
        return conv.platform === 'meta_whatsapp' ? 'whatsapp' : 'sms';
    };

    return (
        <div className={cn(
            "h-full flex flex-col border-r border-gray-200 bg-white shrink-0",
            "w-full md:w-[380px] md:min-w-[380px] md:max-w-[380px]"
        )}>
            {/* Header */}
            <div className="p-4 pb-3 space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
                    <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium h-9 px-4"
                    >
                        <Plus className="w-4 h-4 mr-1" />
                        New
                    </Button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search conversations..."
                        className="pl-10 h-11 bg-gray-50 border-gray-200 rounded-lg text-sm"
                    />
                </div>
            </div>

            {/* Conversation List */}
            <ScrollArea className="flex-1">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-3">
                        <div className="w-6 h-6 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                            <Search className="w-5 h-5 text-gray-400" />
                        </div>
                        <p className="text-gray-600 font-medium">No conversations found</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredConversations.map((conv) => {
                            const displayName = getDisplayName(conv);
                            const channelType = getChannelType(conv);
                            const avatarColor = getAvatarColor(displayName);

                            return (
                                <div
                                    key={conv.id}
                                    onClick={() => onSelect(conv)}
                                    className={cn(
                                        "flex items-start gap-3 p-4 cursor-pointer transition-all relative",
                                        "hover:bg-gray-50",
                                        selectedId === conv.id
                                            ? "bg-blue-50/60 border-l-4 border-l-blue-500 pl-3"
                                            : "border-l-4 border-l-transparent"
                                    )}
                                >
                                    {/* Avatar */}
                                    <Avatar className="w-12 h-12 shrink-0">
                                        <AvatarImage src={conv.contact?.avatarUrl || conv.customerProfilePicture} />
                                        <AvatarFallback className={cn(
                                            "text-white font-semibold text-lg",
                                            avatarColor
                                        )}>
                                            {displayName?.[0]?.toUpperCase() || '?'}
                                        </AvatarFallback>
                                    </Avatar>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        {/* Top row: Name and timestamp */}
                                        <div className="flex items-start justify-between gap-2 mb-0.5">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <h3 className="text-base font-semibold text-gray-900 truncate">
                                                    {displayName}
                                                </h3>
                                                <MessageCircle className="w-4 h-4 text-gray-400 shrink-0" />
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <span className="text-sm text-gray-500">
                                                    {formatTime(conv.lastMessageAt)}
                                                </span>
                                                <button
                                                    className="p-1 hover:bg-gray-100 rounded"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <MoreVertical className="w-4 h-4 text-gray-400" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Phone number */}
                                        <p className="text-sm text-gray-600 mb-2 truncate">
                                            {getPhoneDisplay(conv)}
                                        </p>

                                        {/* Bottom row: Channel badge and message count */}
                                        <div className="flex items-center justify-between gap-2">
                                            {channelType === 'whatsapp' ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-green-500 text-green-600 bg-white">
                                                    WhatsApp
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                                    SMS
                                                </span>
                                            )}
                                            <span className="text-sm text-gray-500">
                                                {conv.messageCount} msgs
                                            </span>
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
