// src/components/partner/messaging/MessagesList.tsx
"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowDown, MessageCircle, Smartphone, Check, CheckCheck, Trash2 } from 'lucide-react';
import { format, isToday, isYesterday, isThisWeek, isSameDay } from 'date-fns';
import type { UnifiedMessage } from '@/lib/conversation-grouping-service';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import dynamic from 'next/dynamic';

const ReactMarkdown = dynamic(() => import('react-markdown'), {
  loading: () => <span className="animate-pulse">Loading...</span>,
  ssr: false
});

interface MessagesListProps {
  messages: UnifiedMessage[];
  isLoadingMore: boolean;
  allMessagesLoaded: boolean;
  onLoadMore: () => void;
  partnerId: string;
  onDeleteMessage?: (messageId: string, conversationId: string, platform: 'sms' | 'whatsapp') => Promise<void>;
}

export default function MessagesList({
  messages,
  isLoadingMore,
  allMessagesLoaded,
  onLoadMore,
  partnerId,
  onDeleteMessage,
}: MessagesListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialLoadRef = useRef(true);
  const previousMessageCountRef = useRef(0);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<{ id: string; conversationId: string; platform: 'sms' | 'whatsapp' } | null>(null);

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

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    }
  };

  const isNearBottom = () => {
    if (!scrollContainerRef.current) return false;
    const threshold = 150;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    return distanceFromBottom < threshold;
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;

    const nearBottom = isNearBottom();
    setShowScrollButton(!nearBottom);

    if (!nearBottom) {
      setUserHasScrolled(true);
    } else {
      setUserHasScrolled(false);
    }

    const { scrollTop } = scrollContainerRef.current;
    if (scrollTop < 100 && !isLoadingMore && !allMessagesLoaded && messages.length > 0) {
      console.log('📥 User scrolled to top, loading more messages');
      onLoadMore();
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [isLoadingMore, allMessagesLoaded, messages.length]);

  useEffect(() => {
    if (isInitialLoadRef.current && messages.length > 0) {
      console.log('📍 Initial load - scrolling to bottom');
      setTimeout(() => scrollToBottom('auto'), 100);
      isInitialLoadRef.current = false;
      previousMessageCountRef.current = messages.length;
    } else if (messages.length > previousMessageCountRef.current) {
      const wasNearBottom = isNearBottom();

      if (wasNearBottom || !userHasScrolled) {
        console.log('📍 New messages - user at bottom, scrolling');
        setTimeout(() => scrollToBottom('smooth'), 50);
      } else {
        console.log('📍 New messages - user scrolled up, not auto-scrolling');
      }

      previousMessageCountRef.current = messages.length;
    }
  }, [messages.length]);

  const formatTime = (timestamp: any) => {
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

  const formatDateDivider = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);

      if (isToday(date)) return 'Today';
      if (isYesterday(date)) return 'Yesterday';
      if (isThisWeek(date)) return format(date, 'EEEE');
      return format(date, 'MMMM d, yyyy');
    } catch {
      return '';
    }
  };

  const shouldShowDateDivider = (currentMessage: any, previousMessage: any) => {
    if (!previousMessage) return true;

    try {
      const currentDate = currentMessage.createdAt?.toDate?.() || new Date();
      const previousDate = previousMessage.createdAt?.toDate?.() || new Date();
      return !isSameDay(currentDate, previousDate);
    } catch {
      return false;
    }
  };

  const handleDeleteClick = (message: UnifiedMessage) => {
    if (message.direction === 'outbound' && message.conversationId) {
      setMessageToDelete({
        id: message.id,
        conversationId: message.conversationId,
        platform: message.platform || 'sms'
      });
      setShowDeleteDialog(true);
    }
  };

  const confirmDelete = async () => {
    if (messageToDelete && onDeleteMessage) {
      await onDeleteMessage(
        messageToDelete.id,
        messageToDelete.conversationId,
        messageToDelete.platform
      );
    }
    setShowDeleteDialog(false);
    setMessageToDelete(null);
  };

  const getStatusIcon = (message: UnifiedMessage) => {
    if (message.direction === 'inbound') return null;

    const isOptimistic = message.id.startsWith('optimistic-');
    if (isOptimistic) {
      return <Loader2 className="w-3 h-3 animate-spin text-blue-300" />;
    }

    const status = 'smsMetadata' in message
      ? message.smsMetadata?.twilioStatus
      : ('whatsappMetadata' in message ? message.whatsappMetadata?.twilioStatus : undefined);

    if (status === 'delivered') return <CheckCheck className="w-3 h-3 text-blue-500" />;
    if (status === 'sent') return <Check className="w-3 h-3 text-gray-400" />;
    if (status === 'failed') return <ArrowDown className="w-3 h-3 text-red-500" />;
    return <Check className="w-3 h-3 text-gray-400" />;
  };

  const renderMessageContent = (message: UnifiedMessage) => {
    const attachments = message.attachments || [];

    if (attachments.length > 0) {
      return (
        <div className="space-y-2">
          {attachments.map((attachment, index) => {
            const attachmentUrl = attachment.url || '';
            const attachmentType = attachment.type || '';

            if (attachmentType.startsWith('image/')) {
              return (
                <img
                  key={index}
                  src={attachmentUrl}
                  alt="attachment"
                  className="max-w-xs rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => window.open(attachmentUrl, '_blank')}
                />
              );
            }
            return null;
          })}
          {message.content && (
            <div className="text-sm break-words markdown-content">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-1 last:mb-0 whitespace-pre-wrap">{children}</p>,
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:opacity-80"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {children}
                    </a>
                  ),
                  ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
                  li: ({ children }) => <li className="mb-0.5">{children}</li>,
                  strong: ({ children }) => <span className="font-bold">{children}</span>,
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="text-sm break-words markdown-content">
        <ReactMarkdown
          components={{
            p: ({ children }) => <p className="mb-1 last:mb-0 whitespace-pre-wrap">{children}</p>,
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:opacity-80"
                onClick={(e) => e.stopPropagation()}
              >
                {children}
              </a>
            ),
            ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
            li: ({ children }) => <li className="mb-0.5">{children}</li>,
            strong: ({ children }) => <span className="font-bold">{children}</span>,
          }}
        >
          {message.content || ''}
        </ReactMarkdown>
      </div>
    );
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
    <>
      <div className="relative h-full bg-gray-50">
        {isLoadingMore && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
            <div className="bg-white rounded-full shadow-lg px-4 py-2 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-sm text-gray-600">Loading older messages...</span>
            </div>
          </div>
        )}

        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto px-4 py-4"
        >
          {!allMessagesLoaded && messages.length >= 30 && (
            <div className="text-center py-3 mb-2">
              <p className="text-xs text-gray-400">↑ Scroll up to load older messages</p>
            </div>
          )}

          <div className="space-y-1">
            {messages.map((message, index) => {
              const isOutbound = message.direction === 'outbound';
              const previousMessage = index > 0 ? messages[index - 1] : null;
              const showDateDivider = shouldShowDateDivider(message, previousMessage);
              const canDelete = isOutbound && !message.id.startsWith('optimistic-');
              const isHovered = hoveredMessageId === message.id;

              return (
                <React.Fragment key={message.id}>
                  {showDateDivider && (
                    <div className="flex items-center justify-center my-4">
                      <div className="bg-gray-200 rounded-md px-3 py-1">
                        <span className="text-xs text-gray-600 font-medium">
                          {formatDateDivider(message.createdAt)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div
                    className={`flex ${isOutbound ? 'justify-end' : 'justify-start'} mb-1 group`}
                    onMouseEnter={() => canDelete && setHoveredMessageId(message.id)}
                    onMouseLeave={() => setHoveredMessageId(null)}
                  >
                    <div className={`relative max-w-[75%] ${isOutbound ? 'mr-2' : 'ml-2'}`}>
                      <div
                        className={`rounded-2xl px-4 py-2 shadow-sm ${isOutbound
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-white text-slate-900 rounded-bl-sm border border-slate-200'
                          }`}
                      >
                        {renderMessageContent(message)}

                        <div className={`flex items-center gap-1 mt-1 ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                          <span className={`text-[10px] ${isOutbound ? 'text-blue-100' : 'text-slate-500'}`}>
                            {formatTime(message.createdAt)}
                          </span>
                          {isOutbound && getStatusIcon(message)}
                          {message.platform === 'whatsapp' && (
                            <MessageCircle className={`w-3 h-3 ml-1 ${isOutbound ? 'text-blue-200' : 'text-green-600'}`} />
                          )}
                          {message.platform === 'sms' && (
                            <Smartphone className={`w-3 h-3 ml-1 ${isOutbound ? 'text-blue-200' : 'text-blue-600'}`} />
                          )}
                        </div>
                      </div>

                      {canDelete && isHovered && onDeleteMessage && (
                        <button
                          onClick={() => handleDeleteClick(message)}
                          className="absolute -right-8 top-1/2 -translate-y-1/2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100"
                          title="Delete message"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          <div ref={messagesEndRef} />
        </div>

        {showScrollButton && (
          <button
            onClick={() => scrollToBottom('smooth')}
            className="absolute bottom-6 right-6 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow border border-gray-200"
          >
            <ArrowDown className="w-5 h-5 text-gray-600" />
          </button>
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}