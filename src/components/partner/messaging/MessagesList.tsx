// src/components/partner/messaging/MessagesList.tsx
"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowDown, MessageCircle, Smartphone, Check, CheckCheck } from 'lucide-react';
import { format, isToday, isYesterday, isThisWeek, isSameDay } from 'date-fns';
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
  const [userHasScrolled, setUserHasScrolled] = useState(false);

  console.log('📋 MessagesList render:', {
    total: messages.length,
    inbound: messages.filter(m => m.direction === 'inbound').length,
    outbound: messages.filter(m => m.direction === 'outbound').length,
    platforms: {
      sms: messages.filter(m => m.platform === 'sms').length,
      whatsapp: messages.filter(m => m.platform === 'whatsapp').length
    },
    sample: messages.slice(-5).map(m => ({
      direction: m.direction,
      platform: m.platform,
      content: m.content?.substring(0, 20)
    }))
  });

  // Scroll to bottom helper
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    }
  };

  // Check if user is near the bottom
  const isNearBottom = () => {
    if (!scrollContainerRef.current) return false;
    const threshold = 150;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    return distanceFromBottom < threshold;
  };

  // Handle scroll events
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    
    const nearBottom = isNearBottom();
    setShowScrollButton(!nearBottom);

    // Mark that user has manually scrolled
    if (!nearBottom) {
      setUserHasScrolled(true);
    } else {
      setUserHasScrolled(false);
    }

    // Load more messages when scrolled to top
    const { scrollTop } = scrollContainerRef.current;
    if (scrollTop < 100 && !isLoadingMore && !allMessagesLoaded && messages.length > 0) {
      console.log('📥 User scrolled to top, loading more messages');
      onLoadMore();
    }
  };

  // Auto-scroll on initial load
  useEffect(() => {
    if (messages.length > 0 && isInitialLoadRef.current) {
      console.log('🎬 Initial load, scrolling to bottom immediately');
      setTimeout(() => {
        scrollToBottom('auto');
        isInitialLoadRef.current = false;
      }, 100);
    }
  }, [messages.length]);

  // Auto-scroll when new messages arrive (only if user is near bottom)
  useEffect(() => {
    const messageCount = messages.length;
    const previousCount = previousMessageCountRef.current;

    if (messageCount > previousCount && previousCount > 0 && !isInitialLoadRef.current) {
      console.log('📨 New message(s) arrived:', {
        current: messageCount,
        previous: previousCount,
        new: messageCount - previousCount,
        userHasScrolled,
        isNearBottom: isNearBottom()
      });

      // Only auto-scroll if user hasn't manually scrolled away
      if (!userHasScrolled || isNearBottom()) {
        console.log('⬇️ Auto-scrolling to new message');
        setTimeout(() => scrollToBottom('smooth'), 100);
      } else {
        console.log('👤 User scrolled away, not auto-scrolling');
      }
    }

    previousMessageCountRef.current = messageCount;
  }, [messages.length, userHasScrolled]);

  const formatMessageTime = (timestamp: any) => {
    if (!timestamp) return '';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(date, 'h:mm a');
    } catch (error) {
      return '';
    }
  };

  const formatDateDivider = (timestamp: any) => {
    if (!timestamp) return '';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      
      if (isToday(date)) {
        return 'Today';
      } else if (isYesterday(date)) {
        return 'Yesterday';
      } else if (isThisWeek(date)) {
        return format(date, 'EEEE');
      } else {
        return format(date, 'MMMM d, yyyy');
      }
    } catch (error) {
      return '';
    }
  };

  const getMessageStatusIcon = (message: UnifiedMessage) => {
    if (message.direction === 'inbound') return null;
    
    if (message.status === 'delivered' || message.status === 'read') {
      return <CheckCheck className="w-3.5 h-3.5 text-blue-400" />;
    } else if (message.status === 'sent') {
      return <Check className="w-3.5 h-3.5 text-gray-400" />;
    }
    
    return null;
  };

  const getPlatformBadge = (platform: 'sms' | 'whatsapp') => {
    if (platform === 'whatsapp') {
      return (
        <div className="flex items-center gap-1 text-[10px] text-gray-500">
          <MessageCircle className="w-3 h-3 text-green-600" />
          <span>WhatsApp</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 text-[10px] text-gray-500">
        <Smartphone className="w-3 h-3 text-blue-600" />
        <span>SMS</span>
      </div>
    );
  };

  // Check if we should show date divider
  const shouldShowDateDivider = (currentMessage: UnifiedMessage, previousMessage: UnifiedMessage | null) => {
    if (!previousMessage) return true;
    
    try {
      const currentDate = currentMessage.createdAt?.toDate?.() || new Date();
      const previousDate = previousMessage.createdAt?.toDate?.() || new Date();
      return !isSameDay(currentDate, previousDate);
    } catch {
      return false;
    }
  };

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No messages yet</p>
          <p className="text-sm text-gray-400 mt-2">Start the conversation by sending a message</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full bg-gray-50">
      {/* Loading indicator for pagination */}
      {isLoadingMore && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-white rounded-full shadow-lg px-4 py-2 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span className="text-sm text-gray-600">Loading older messages...</span>
          </div>
        </div>
      )}

      {/* Messages container */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto px-4 py-4"
      >
        {/* Load more hint */}
        {!allMessagesLoaded && messages.length >= 30 && (
          <div className="text-center py-3 mb-2">
            <p className="text-xs text-gray-400">↑ Scroll up to load older messages</p>
          </div>
        )}

        {/* Messages */}
        <div className="space-y-1">
          {messages.map((message, index) => {
            const isOutbound = message.direction === 'outbound';
            const previousMessage = index > 0 ? messages[index - 1] : null;
            const showDateDivider = shouldShowDateDivider(message, previousMessage);

            return (
              <React.Fragment key={message.id}>
                {/* Date divider */}
                {showDateDivider && (
                  <div className="flex items-center justify-center my-4">
                    <div className="bg-gray-200 rounded-md px-3 py-1">
                      <span className="text-xs text-gray-600 font-medium">
                        {formatDateDivider(message.createdAt)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Message bubble */}
                <div className={`flex ${isOutbound ? 'justify-end' : 'justify-start'} mb-1`}>
                  <div className={`max-w-[75%] ${isOutbound ? 'items-end' : 'items-start'} flex flex-col`}>
                    {/* Platform badge (show for first message or platform switch) */}
                    {(index === 0 || message.platform !== previousMessage?.platform) && (
                      <div className="mb-1 px-2">
                        {getPlatformBadge(message.platform)}
                      </div>
                    )}
                    
                    <div
                      className={`rounded-lg px-3 py-2 ${
                        isOutbound
                          ? 'bg-blue-500 text-white rounded-br-none'
                          : 'bg-white text-gray-900 shadow-sm rounded-bl-none'
                      }`}
                    >
                      {/* Message content */}
                      <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                        {message.content}
                      </p>

                      {/* Media attachments */}
                      {message.mediaUrl && (
                        <div className="mt-2 rounded-md overflow-hidden">
                          <img
                            src={message.mediaUrl}
                            alt="Attachment"
                            className="max-w-full h-auto"
                            style={{ maxHeight: '300px' }}
                          />
                        </div>
                      )}

                      {/* Message metadata */}
                      <div className={`flex items-center justify-end gap-1 mt-1 ${
                        isOutbound ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        <span className="text-[11px]">{formatMessageTime(message.createdAt)}</span>
                        {getMessageStatusIcon(message)}
                      </div>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        {/* Scroll anchor */}
        <div ref={messagesEndRef} className="h-1" />
      </div>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={() => {
            scrollToBottom('smooth');
            setUserHasScrolled(false);
          }}
          className="absolute bottom-6 right-6 bg-white text-gray-700 rounded-full p-3 shadow-lg hover:shadow-xl transition-all border border-gray-200 hover:bg-gray-50"
          aria-label="Scroll to bottom"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}