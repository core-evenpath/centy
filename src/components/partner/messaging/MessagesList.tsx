// src/components/partner/messaging/MessagesList.tsx
"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowDown, MessageCircle, Smartphone, Check, CheckCheck } from 'lucide-react';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import type { UnifiedMessage } from '@/lib/conversation-grouping-service';

interface MessagesListProps {
  messages: UnifiedMessage[];
  isLoadingMore: boolean;
  allMessagesLoaded: boolean;
  onLoadMore: () => void;
  partnerId: string;
}

export default function MessagesList({
  messages,
  isLoadingMore,
  allMessagesLoaded,
  onLoadMore,
  partnerId,
}: MessagesListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialLoadRef = useRef(true);
  const previousMessageCountRef = useRef(0);
  
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Scroll to bottom helper
  const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  // Check if user is scrolled to bottom
  const checkIfScrolledToBottom = () => {
    if (!scrollContainerRef.current) return false;
    const threshold = 100;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < threshold;
    return isAtBottom;
  };

  // Handle scroll events
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    
    const isAtBottom = checkIfScrolledToBottom();
    setShowScrollButton(!isAtBottom);

    // Load more messages when scrolled to top
    const { scrollTop } = scrollContainerRef.current;
    if (scrollTop < 50 && !isLoadingMore && !allMessagesLoaded) {
      onLoadMore();
    }
  };

  // Initial scroll on mount and when messages first load
  useEffect(() => {
    if (messages.length > 0 && isInitialLoadRef.current) {
      setTimeout(() => {
        scrollToBottom('auto');
        isInitialLoadRef.current = false;
      }, 100);
    }
  }, [messages.length]);

  // Handle new messages
  useEffect(() => {
    if (isInitialLoadRef.current) return;

    const hasNewMessages = messages.length > previousMessageCountRef.current;
    previousMessageCountRef.current = messages.length;

    if (hasNewMessages && messages.length > 0) {
      const isAtBottom = checkIfScrolledToBottom();
      
      if (isAtBottom) {
        setTimeout(() => scrollToBottom('smooth'), 100);
      }
    }
  }, [messages.length]);

  // Reset on conversation change
  useEffect(() => {
    isInitialLoadRef.current = true;
    previousMessageCountRef.current = 0;
    setShowScrollButton(false);
  }, [messages[0]?.conversationId]);

  const formatMessageTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      if (isToday(date)) {
        return format(date, 'h:mm a');
      } else if (isYesterday(date)) {
        return `Yesterday ${format(date, 'h:mm a')}`;
      } else if (isThisWeek(date)) {
        return format(date, 'EEE h:mm a');
      }
      return format(date, 'MMM d, h:mm a');
    } catch {
      return '';
    }
  };

  const getStatusIcon = (message: UnifiedMessage) => {
    if (message.direction === 'inbound') return null;

    const status = message.platform === 'sms' 
      ? message.smsMetadata?.twilioStatus 
      : message.whatsAppMetadata?.messageStatus;

    if (status === 'delivered' || status === 'read') {
      return <CheckCheck className="w-3 h-3" />;
    } else if (status === 'sent') {
      return <Check className="w-3 h-3" />;
    }
    return null;
  };

  const PlatformBadge = ({ platform }: { platform: 'sms' | 'whatsapp' }) => (
    <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
      platform === 'whatsapp' 
        ? 'bg-green-100 text-green-700' 
        : 'bg-blue-100 text-blue-700'
    }`}>
      {platform === 'whatsapp' ? (
        <MessageCircle className="w-2.5 h-2.5" />
      ) : (
        <Smartphone className="w-2.5 h-2.5" />
      )}
      <span className="uppercase">{platform}</span>
    </div>
  );

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center text-slate-500">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No messages yet</p>
          <p className="text-xs mt-1">Start the conversation below</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative bg-slate-50 overflow-hidden">
      {/* Scrollable container */}
      <div 
        ref={scrollContainerRef}
        className="absolute inset-0 overflow-y-auto"
        onScroll={handleScroll}
      >
        <div className="p-6 space-y-4">
          {/* Loading more indicator */}
          {isLoadingMore && (
            <div className="flex justify-center py-2">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          )}

          {/* Messages */}
          {messages.map((message, index) => {
            const isOutbound = message.direction === 'outbound';
            const showDateDivider = index === 0 || 
              (messages[index - 1] && 
               new Date(message.createdAt?.toDate?.() || message.createdAt).toDateString() !== 
               new Date(messages[index - 1].createdAt?.toDate?.() || messages[index - 1].createdAt).toDateString());

            return (
              <div key={message.id}>
                {/* Date Divider */}
                {showDateDivider && (
                  <div className="flex items-center justify-center my-4">
                    <div className="bg-white px-3 py-1 rounded-full text-xs text-slate-600 shadow-sm">
                      {formatMessageTimestamp(message.createdAt)}
                    </div>
                  </div>
                )}

                {/* Message */}
                <div className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] ${isOutbound ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    {/* Platform Badge */}
                    <PlatformBadge platform={message.platform} />
                    
                    {/* Message Bubble */}
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        isOutbound
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-white text-slate-900 shadow-sm rounded-bl-sm'
                      }`}
                    >
                      {message.type === 'image' && message.attachments?.[0] && (
                        <img
                          src={message.attachments[0].url}
                          alt="Message attachment"
                          className="rounded-lg mb-2 max-w-full"
                        />
                      )}
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    </div>

                    {/* Timestamp and Status */}
                    <div className={`flex items-center gap-1 text-xs ${
                      isOutbound ? 'text-slate-500' : 'text-slate-500'
                    }`}>
                      <span>{format(message.createdAt?.toDate?.() || new Date(message.createdAt), 'h:mm a')}</span>
                      {isOutbound && getStatusIcon(message)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollButton && (
        <Button
          size="icon"
          className="absolute bottom-4 right-4 rounded-full shadow-lg z-10"
          onClick={() => scrollToBottom('smooth')}
        >
          <ArrowDown className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}