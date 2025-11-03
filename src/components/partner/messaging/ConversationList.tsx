// src/components/partner/messaging/ConversationList.tsx
"use client";

import React from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, MessageSquare, Phone, Loader2, MessageCircle as WhatsAppIcon } from 'lucide-react';
import type { SMSConversation, WhatsAppConversation } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

type Platform = 'sms' | 'whatsapp';
type UnifiedConversation = (SMSConversation | WhatsAppConversation) & { platform: Platform };

interface ConversationListProps {
  conversations: UnifiedConversation[];
  selectedConversation: UnifiedConversation | null;
  searchTerm: string;
  onSearchChange: (value: string) => void;
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
  
  const filteredConversations = conversations.filter(convo => {
    const searchLower = searchTerm.toLowerCase();
    return (
      convo.customerName?.toLowerCase().includes(searchLower) ||
      convo.customerPhone?.toLowerCase().includes(searchLower) ||
      convo.lastMessagePreview?.toLowerCase().includes(searchLower)
    );
  });

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return '';
    }
  };

  const getPlatformBadge = (platform: Platform) => {
    return platform === 'sms' ? (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
        <Phone className="w-3 h-3 mr-1" />
        SMS
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        <WhatsAppIcon className="w-3 h-3 mr-1" />
        WhatsApp
      </Badge>
    );
  };

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-r flex flex-col">
      <div className="p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Search conversations..." 
            value={searchTerm} 
            onChange={(e) => onSearchChange(e.target.value)} 
            className="pl-9" 
          />
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No conversations</p>
            <Button 
              variant="link" 
              className="mt-2"
              onClick={onNewConversation}
            >
              Start a new one
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            {filteredConversations.map((conversation) => (
              <div 
                key={conversation.id} 
                onClick={() => onSelectConversation(conversation)}
                className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  selectedConversation?.id === conversation.id 
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' 
                    : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <Avatar>
                    <AvatarFallback 
                      className={
                        conversation.platform === 'sms' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-green-100 text-green-700'
                      }
                    >
                      {conversation.platform === 'sms' 
                        ? <Phone className="w-4 h-4" /> 
                        : <WhatsAppIcon className="w-4 h-4" />
                      }
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">
                        {conversation.customerName || conversation.customerPhone}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(conversation.lastMessageAt)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {conversation.lastMessagePreview || conversation.customerPhone}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {getPlatformBadge(conversation.platform)}
                      {conversation.messageCount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {conversation.messageCount}
                        </Badge>
                      )}
                    </div>
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
