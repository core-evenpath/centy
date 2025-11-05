// src/components/partner/messaging/ConversationList.tsx
"use client";

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Plus, Search, MessageCircle, Smartphone } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { UnifiedConversation } from '@/lib/conversation-grouping-service';

interface ConversationListProps {
  conversations: UnifiedConversation[];
  selectedConversation: UnifiedConversation | null;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSelectConversation: (conversation: UnifiedConversation) => void;
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

  const getDisplayName = (convo: UnifiedConversation) => {
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

  console.log('📋 ConversationList render:', {
    total: conversations.length,
    isLoading,
    conversations: conversations.map(c => ({
      phone: c.customerPhone,
      platforms: c.availablePlatforms,
      smsId: c.smsConversationId,
      whatsappId: c.whatsappConversationId
    }))
  });

  return (
    <aside className="bg-white border-r border-slate-200 flex flex-col h-full w-80">
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

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-6 text-center text-slate-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No conversations yet</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={onNewConversation}
            >
              Start a conversation
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {conversations.map((convo) => {
              const isSelected = selectedConversation?.id === convo.id;
              const lastMessage = convo.recentMessages?.[0];
              const displayName = getDisplayName(convo);
              
              console.log('📱 Rendering conversation:', {
                phone: convo.customerPhone,
                platforms: convo.availablePlatforms,
                displayName
              });
              
              return (
                <button
                  key={convo.id}
                  onClick={() => {
                    console.log('👆 Clicked conversation:', convo.id);
                    onSelectConversation(convo);
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors ${
                    isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-slate-900 truncate text-sm">
                        {displayName}
                      </h3>
                      {convo.contactName && convo.customerPhone !== displayName && (
                        <p className="text-xs text-slate-500 truncate">
                          {convo.customerPhone}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 ml-2 flex-shrink-0">
                      {formatTime(convo.lastMessageAt)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 truncate mb-2">
                    {lastMessage?.content || 'No messages yet'}
                  </p>

                  <div className="flex items-center gap-1.5">
                    {convo.availablePlatforms.map(platform => (
                      <Badge 
                        key={platform}
                        variant={platform === 'whatsapp' ? 'default' : 'secondary'}
                        className={`text-xs px-2 py-0 h-5 ${
                          platform === 'whatsapp' 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        }`}
                      >
                        {platform === 'whatsapp' ? (
                          <MessageCircle className="w-3 h-3 mr-1" />
                        ) : (
                          <Smartphone className="w-3 h-3 mr-1" />
                        )}
                        {platform === 'whatsapp' ? 'WhatsApp' : 'SMS'}
                      </Badge>
                    ))}
                    
                    {convo.messageCount > 0 && (
                      <span className="text-xs text-slate-500 ml-auto">
                        {convo.messageCount} {convo.messageCount === 1 ? 'msg' : 'msgs'}
                      </span>
                    )}
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