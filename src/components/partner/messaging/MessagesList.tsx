// src/components/partner/messaging/MessagesList.tsx
"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Loader2, MessageSquare, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MessageBubble from './MessageBubble';
import { format } from 'date-fns';
import type { SMSMessage, WhatsAppMessage } from '@/lib/types';

type Platform = 'sms' | 'whatsapp';
type UnifiedMessage = (SMSMessage | WhatsAppMessage) & { platform: Platform };

interface MessagesListProps {
  messages: UnifiedMessage[];
  isLoading: boolean;
}

export default function MessagesList({ messages, isLoading }: MessagesListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const previousMessageCountRef = useRef(0);
  const isInitialLoadRef = useRef(true);

  // Check if user is scrolled to bottom
  const checkIfScrolledToBottom = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return false;

    const threshold = 150; // pixels from bottom
    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    
    return distanceFromBottom < threshold;
  }, []);

  // Handle scroll event
  const handleScroll = useCallback(() => {
    const isAtBottom = checkIfScrolledToBottom();
    setIsUserScrolledUp(!isAtBottom);
    setShowScrollButton(!isAtBottom && messages.length > 0);
  }, [checkIfScrolledToBottom, messages.length]);

  // Scroll to bottom function
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    }
  }, []);

  // Initial load - scroll to bottom instantly
  useEffect(() => {
    if (isInitialLoadRef.current && messages.length > 0 && !isLoading) {
      console.log('📍 Initial load - scrolling to bottom instantly');
      setTimeout(() => {
        scrollToBottom('instant');
        isInitialLoadRef.current = false;
      }, 100);
    }
  }, [messages.length, isLoading, scrollToBottom]);

  // Handle new messages - only auto-scroll if user is at bottom
  useEffect(() => {
    if (isInitialLoadRef.current) return; // Skip during initial load

    const hasNewMessages = messages.length > previousMessageCountRef.current;
    previousMessageCountRef.current = messages.length;

    if (hasNewMessages && messages.length > 0) {
      const isAtBottom = checkIfScrolledToBottom();
      
      if (isAtBottom) {
        console.log('📍 New message + user at bottom - auto-scrolling');
        setTimeout(() => scrollToBottom('smooth'), 100);
      } else {
        console.log('📍 New message + user scrolled up - NOT auto-scrolling');
      }
    }
  }, [messages.length, scrollToBottom, checkIfScrolledToBottom]);

  // Reset on conversation change
  useEffect(() => {
    isInitialLoadRef.current = true;
    previousMessageCountRef.current = 0;
    setIsUserScrolledUp(false);
    setShowScrollButton(false);
  }, [messages[0]?.conversationId]); // Reset when conversation changes

  const formatMessageTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
      return format(date, 'MMM d, h:mm a');
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return '';
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
          <span className="text-sm text-muted-foreground">Loading messages...</span>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center py-12 px-4">
          <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium text-gray-700 mb-2">No messages yet</p>
          <p className="text-sm text-muted-foreground">
            Start the conversation by sending a message below
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Custom Scroll Container */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgb(203 213 225) transparent'
        }}
      >
        <div className="p-4 space-y-4 min-h-full flex flex-col justify-end">
          {messages.map((message, index) => {
            const showTimestamp = index === 0 || 
              (messages[index - 1] && 
               Math.abs((message.createdAt?.toMillis?.() || 0) - (messages[index - 1].createdAt?.toMillis?.() || 0)) > 300000);
            
            return (
              <MessageBubble
                key={message.id}
                message={message}
                showTimestamp={showTimestamp}
                formattedTimestamp={showTimestamp ? formatMessageTimestamp(message.createdAt) : undefined}
              />
            );
          })}
          <div ref={messagesEndRef} className="h-1" />
        </div>
      </div>

      {/* Scroll to Bottom Button - WhatsApp Style */}
      {showScrollButton && (
        <div className="absolute bottom-6 right-6 z-10 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Button
            onClick={() => scrollToBottom('smooth')}
            size="icon"
            className="h-12 w-12 rounded-full shadow-lg bg-white dark:bg-gray-800 text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 border-2 border-gray-200 dark:border-gray-700"
            variant="outline"
          >
            <ArrowDown className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
}