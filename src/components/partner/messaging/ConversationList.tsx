// src/components/partner/messaging/ConversationList.tsx
"use client";

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Plus, Search, MessageCircle, Smartphone } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ConversationListProps {
  conversations: any[];
  selectedConversation: any | null;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSelectConversation: (conversation: any) => void;
  onNewConversation: () => void;
  isLoading: boolean;
}

export default function ConversationList({
  conversations,
  selectedConversation,
  searchTerm,
  onSearchChange,
  onSelectConversation,
  onNewConversation,
  isLoading,
}: ConversationListProps) {

  const getDisplayName = (convo: any) => {
    return convo.contactName || convo.customerName || convo.customerPhone;
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return '';
    }
  };

  const getPlatformIcon = (platform: string) => {
    if (platform === 'whatsapp') {
      return <MessageCircle className="w-4 h-4 text-green-600" />;
    }
    return <Smartphone className="w-4 h-4 text-blue-600" />;
  };

  const getPlatformBadge = (platform: string) => {
    if (platform === 'whatsapp') {
      return <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">WhatsApp</Badge>;
    }
    return <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">SMS</Badge>;
  };

  console.log('📋 ConversationList render:', {
    total: conversations.length,
    isLoading,
    selected: selectedConversation?.id,
    sms: conversations.filter(c => c.platform === 'sms').length,
    whatsapp: conversations.filter(c => c.platform === 'whatsapp').length
  });

  return (
    <aside className="bg-white border-r border-slate-200 flex flex-col h-full w-80">
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-semibold text-slate-900">Messages</h1>
          <Button size="sm" onClick={onNewConversation} variant="ghost">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-3 py-2 bg-slate-50 border-slate-200 rounded-lg text-sm"
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-6 text-center text-slate-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-sm">No conversations yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {conversations.map((convo) => {
              const displayName = getDisplayName(convo);
              const isSelected = selectedConversation?.id === convo.id;
              
              return (
                <div
                  key={convo.id}
                  onClick={() => onSelectConversation(convo)}
                  className={`p-4 cursor-pointer transition-colors hover:bg-slate-50 ${
                    isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                  }`}
                >
                  {/* Contact Avatar */}
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {/* Name and Time */}
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-slate-900 text-sm truncate">
                          {displayName}
                        </p>
                        <span className="text-xs text-slate-500 ml-2">
                          {formatTime(convo.lastMessageAt)}
                        </span>
                      </div>
                      
                      {/* Phone Number */}
                      <p className="text-xs text-slate-500 mb-2">{convo.customerPhone}</p>
                      
                      {/* Platform Badge and Message Count */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getPlatformIcon(convo.platform)}
                          {getPlatformBadge(convo.platform)}
                        </div>
                        
                        {convo.messageCount > 0 && (
                          <span className="text-xs text-slate-500">
                            {convo.messageCount} msgs
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Info Banner */}
      {!isLoading && conversations.length > 0 && (
        <div className="p-3 bg-blue-50 border-t border-blue-100">
          <p className="text-xs text-blue-800">
            <span className="font-semibold">{conversations.length} conversations</span>
            {' • '}
            <span>{conversations.filter(c => c.platform === 'sms').length} SMS</span>
            {' • '}
            <span>{conversations.filter(c => c.platform === 'whatsapp').length} WhatsApp</span>
          </p>
        </div>
      )}
    </aside>
  );
}