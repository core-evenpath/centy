// src/components/partner/messaging/ConversationList.tsx
"use client";

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Plus, Search, MessageCircle, Smartphone, Circle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { SMSConversation, WhatsAppConversation } from '@/lib/types';
import type { Timestamp } from 'firebase/firestore';

type Platform = 'sms' | 'whatsapp';
type UnifiedConversation = (SMSConversation | WhatsAppConversation) & { 
  platform: Platform; 
  recentMessages?: any[];
  clientInfo?: {
    portfolio?: string;
    email?: string;
    occupation?: string;
    accountType?: string;
  };
};

interface ConversationListProps {
  conversations: UnifiedConversation[];
  selectedConversation: UnifiedConversation | null;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSelectConversation: (conversation: UnifiedConversation) => void;
  onNewConversation: () => void;
  isLoading: boolean;
}

const PlatformIcon = ({ platform }: { platform: Platform }) => {
  if (platform === 'whatsapp') {
    return <MessageCircle className="w-4 h-4 text-green-500" title="WhatsApp" />;
  }
  return <Smartphone className="w-4 h-4 text-blue-500" title="SMS" />;
};

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
    <aside className="bg-white border-r border-slate-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <h1 className="text-lg font-semibold text-slate-900 mb-3">Messages</h1>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-3 py-2 bg-slate-50 border-slate-200 rounded-lg text-sm"
          />
        </div>
      </div>

      {/* Conversation List Area */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="space-y-0">
            {conversations.map((convo) => {
              const isSelected = selectedConversation?.id === convo.id;
              const lastMessage = convo.recentMessages?.[convo.recentMessages.length - 1];
              const unreadCount = 0; // TODO: Implement unread count logic
              
              return (
                <button
                  key={convo.id}
                  onClick={() => onSelectConversation(convo)}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors ${
                    isSelected ? 'bg-slate-50 border-l-2 border-l-slate-700' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-11 h-11 rounded-full bg-slate-500 text-white flex items-center justify-center font-semibold text-sm">
                      {(convo.customerName || convo.customerPhone || '??')
                        .split(' ')
                        .map(n => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </div>
                    {unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                        {unreadCount}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-baseline justify-between gap-2 mb-0.5">
                      <h3 className="font-semibold text-slate-900 text-sm truncate">
                        {convo.customerName || convo.customerPhone}
                      </h3>
                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        {convo.lastMessageAt ? formatDistanceToNow(convo.lastMessageAt.toDate(), { addSuffix: true }) : ''}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mb-2">
                      {lastMessage?.content || 'No messages yet'}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold ${
                        convo.platform === 'whatsapp'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        <Circle className="w-2 h-2 fill-current" />
                        {convo.platform === 'whatsapp' ? 'WhatsApp' : 'SMS'}
                      </span>
                      {convo.clientInfo?.portfolio && (
                        <span className="text-xs text-slate-600 font-medium">
                          {convo.clientInfo.portfolio}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </aside>
  );
}