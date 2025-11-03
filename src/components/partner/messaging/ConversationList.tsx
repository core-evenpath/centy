// src/components/partner/messaging/ConversationList.tsx
"use client";

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Plus, Search, MessageCircle, Smartphone } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { SMSConversation, WhatsAppConversation } from '@/lib/types';
import type { Timestamp } from 'firebase/firestore';

// Duplicating types from page.tsx to avoid import issues
type Platform = 'sms' | 'whatsapp';
type UnifiedConversation = (SMSConversation | WhatsAppConversation) & { platform: Platform; recentMessages?: any[] };

interface ConversationListProps {
  conversations: UnifiedConversation[]; // <-- Reverted to flat list
  selectedConversation: UnifiedConversation | null;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSelectConversation: (conversation: UnifiedConversation) => void;
  onNewConversation: () => void;
  isLoading: boolean;
}

// --- PlatformIcon ---
// Helper component to show platform icon
const PlatformIcon = ({ platform }: { platform: Platform }) => {
  if (platform === 'whatsapp') {
    return <MessageCircle className="w-4 h-4 text-green-500" title="WhatsApp" />;
  }
  return <Smartphone className="w-4 h-4 text-blue-500" title="SMS" />;
};


// --- ConversationList ---
// Main component, now simplified to a flat list
export default function ConversationList({
  conversations,
  selectedConversation,
  searchTerm,
  onSearchChange,
  onSelectConversation,
  onNewConversation,
  isLoading,
}: ConversationListProps) {

  return (
    <aside className="w-80 border-r dark:border-gray-700 flex flex-col h-full bg-white dark:bg-gray-800">
      {/* Header with Search and New Button */}
      <div className="p-4 border-b dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button variant="ghost" size="icon" onClick={onNewConversation}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Conversation List Area */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {conversations.map((convo) => {
              const isSelected = selectedConversation?.id === convo.id;
              
              const lastMessage = convo.recentMessages?.[convo.recentMessages.length - 1] || null;
              const lastMessageSnippet = lastMessage?.content || '...';
              const lastMessageAt = convo.lastMessageAt?.toDate 
                ? formatDistanceToNow(convo.lastMessageAt.toDate(), { addSuffix: true })
                : '';

              return (
                <div key={convo.id} className="px-2 py-1">
                  <button
                    onClick={() => onSelectConversation(convo)}
                    className={`w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors ${
                      isSelected ? 'bg-blue-100 dark:bg-blue-900/50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm truncate">{convo.customerName || convo.customerPhone}</span>
                      <span className="text-xs text-muted-foreground">
                        {lastMessageAt}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <PlatformIcon platform={convo.platform} />
                      <p className="text-sm text-muted-foreground truncate">{lastMessageSnippet}</p>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </aside>
  );
}