"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { sendSMSAction } from '@/actions/sms-actions';
import { sendWhatsAppMessageAction } from '@/actions/whatsapp-actions';
import { chatWithVaultForConversation } from '@/actions/vault-actions';
import { Timestamp } from 'firebase/firestore';

import { useConversations } from '@/hooks/useConversations';
import { useEnrichedConversations } from '@/hooks/useEnrichedConversations';
import { useConversationMessages } from '@/hooks/useConversationMessages';
import { useNotifications } from '@/hooks/useNotifications';

import ConversationList from '@/components/partner/messaging/ConversationList';
import ChatHeader from '@/components/partner/messaging/ChatHeader';
import MessagesList from '@/components/partner/messaging/MessagesList';
import MessageInput from '@/components/partner/messaging/MessageInput';
import NewConversationForm from '@/components/partner/messaging/NewConversationForm';
import EmptyState from '@/components/partner/messaging/EmptyState';
import DiagnosticsView from '@/components/partner/messaging/DiagnosticsView';
import ClientProfilePanel from '@/components/partner/messaging/ClientProfilePanel';
import InlineAISuggestion from '@/components/partner/messaging/InlineAISuggestion';

type Platform = 'sms' | 'whatsapp';

interface RAGSuggestion {
  suggestedReply: string;
  confidence: number;
  reasoning: string;
  sources: Array<{
    type: 'conversation' | 'document';
    name: string;
    excerpt: string;
    relevance: number;
  }>;
  alternativeReplies?: string[];
}

interface SimpleConversation {
  id: string;
  platform: Platform;
  customerPhone: string;
  customerName?: string;
  contactName?: string;
  contactEmail?: string;
  contactId?: string;
  lastMessageAt: any;
  messageCount: number;
  isActive: boolean;
  partnerId: string;
  createdAt: any;
  clientInfo?: any;
}

export default function MessagingPage() {
  const { user, currentWorkspace } = useMultiWorkspaceAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  
  const partnerId = currentWorkspace?.partnerId || user?.customClaims?.partnerId;
  
  const { conversations: rawConversations, isLoading: isLoadingConversations } = useConversations(partnerId);
  const { enrichedConversations, isLoadingContacts } = useEnrichedConversations(rawConversations, partnerId);
  
  const simpleConversations: SimpleConversation[] = useMemo(() => {
    return enrichedConversations.map(conv => ({
      id: conv.id,
      platform: conv.platform as Platform,
      customerPhone: conv.customerPhone,
      customerName: conv.customerName,
      contactName: conv.contactName,
      contactEmail: conv.contactEmail,
      contactId: conv.contactId,
      lastMessageAt: conv.lastMessageAt,
      messageCount: conv.messageCount,
      isActive: conv.isActive,
      partnerId: conv.partnerId,
      createdAt: conv.createdAt,
      clientInfo: conv.clientInfo
    }));
  }, [enrichedConversations]);
  
  const { notifications, hasUnread, markAllAsRead } = useNotifications(partnerId);
  
  const [selectedConversation, setSelectedConversation] = useState<SimpleConversation | null>(null);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [showClientProfile, setShowClientProfile] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [optimisticMessages, setOptimisticMessages] = useState<any[]>([]);
  const [notificationSound, setNotificationSound] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isSending, setIsSending] = useState(false);
  
  const [showAISuggestion, setShowAISuggestion] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<RAGSuggestion | null>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const [pendingIncomingMessage, setPendingIncomingMessage] = useState('');
  
  const processedMessageIds = useRef<Set<string>>(new Set());
  const lastSuggestionContext = useRef<string>('');
  const suggestionDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  
  const { 
    messages: dbMessages, 
    isLoading: isLoadingMessages
  } = useConversationMessages({
    conversationId: selectedConversation?.id,
    platform: selectedConversation?.platform || 'sms',
    onNewMessage: () => {
      if (notificationSound) {
        audioRef.current?.play().catch(e => console.log('Audio play failed:', e));
      }
    }
  });

  const allMessages = useMemo(() => {
    return [...dbMessages, ...optimisticMessages].sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || a.createdAt?.getTime?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || b.createdAt?.getTime?.() || 0;
      return aTime - bTime;
    });
  }, [dbMessages, optimisticMessages]);

  const filteredConversations = useMemo(() => {
    if (!searchTerm.trim()) return simpleConversations;
    const lower = searchTerm.toLowerCase();
    return simpleConversations.filter(conv => 
      conv.customerPhone?.toLowerCase().includes(lower) ||
      conv.customerName?.toLowerCase().includes(lower) ||
      conv.contactName?.toLowerCase().includes(lower) ||
      conv.contactEmail?.toLowerCase().includes(lower)
    );
  }, [simpleConversations, searchTerm]);

  useEffect(() => {
    const convIdFromQuery = searchParams.get('conversationId');
    if (convIdFromQuery && simpleConversations.length > 0) {
      const conv = simpleConversations.find(c => c.id === convIdFromQuery);
      if (conv) {
        setSelectedConversation(conv);
        setShowNewConversation(false);
        setShowDiagnostics(false);
      }
    }
  }, [searchParams, simpleConversations]);

  useEffect(() => {
    if (!selectedConversation || dbMessages.length === 0) return;

    const latestMessage = dbMessages[dbMessages.length - 1];
    if (!latestMessage || latestMessage.direction !== 'inbound') return;

    const messageId = latestMessage.id;
    if (processedMessageIds.current.has(messageId)) return;

    const currentContext = `${selectedConversation.id}-${latestMessage.content}`;
    if (lastSuggestionContext.current === currentContext) return;

    console.log('🔔 New inbound message detected');
    processedMessageIds.current.add(messageId);
    lastSuggestionContext.current = currentContext;

    if (suggestionDebounceTimer.current) {
      clearTimeout(suggestionDebounceTimer.current);
    }

    suggestionDebounceTimer.current = setTimeout(() => {
      handleRequestAISuggestion(latestMessage.content);
    }, 200);
  }, [dbMessages, selectedConversation]);

  const handleSelectConversation = (conversation: SimpleConversation) => {
    console.log('📱 Selecting conversation:', conversation.id);
    setSelectedConversation(conversation);
    setShowNewConversation(false);
    setShowDiagnostics(false);
    setShowClientProfile(false);
    setOptimisticMessages([]);
    setShowAISuggestion(false);
    setAiSuggestion(null);
    setPendingIncomingMessage('');
    processedMessageIds.current.clear();
    lastSuggestionContext.current = '';
    
    if (suggestionDebounceTimer.current) {
      clearTimeout(suggestionDebounceTimer.current);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedConversation || !messageInput.trim() || isSending) return;

    const optimistic = {
      id: `optimistic-${Date.now()}`,
      conversationId: selectedConversation.id,
      direction: 'outbound' as const,
      content: messageInput,
      createdAt: Timestamp.now(),
      status: 'sending',
    };

    setOptimisticMessages(prev => [...prev, optimistic]);
    const messageText = messageInput;
    setMessageInput('');
    setIsSending(true);
    setShowAISuggestion(false);
    setAiSuggestion(null);
    setPendingIncomingMessage('');

    try {
      let result;
      
      if (selectedConversation.platform === 'sms') {
        result = await sendSMSAction({
          partnerId,
          to: selectedConversation.customerPhone,
          message: messageText,
          conversationId: selectedConversation.id,
        });
      } else {
        result = await sendWhatsAppMessageAction({
          partnerId,
          to: selectedConversation.customerPhone,
          message: messageText,
          conversationId: selectedConversation.id,
        });
      }

      if (result.success) {
        setOptimisticMessages(prev => prev.filter(m => m.id !== optimistic.id));
      } else {
        throw new Error(result.message || 'Failed to send');
      }
    } catch (error: any) {
      console.error('❌ Send error:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Failed to send message',
        description: error.message 
      });
      setOptimisticMessages(prev => prev.filter(m => m.id !== optimistic.id));
      setMessageInput(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const handleRequestAISuggestion = async (incomingMessage?: string) => {
    if (!selectedConversation || !partnerId) return;
    
    const messageToAnalyze = incomingMessage || pendingIncomingMessage || "Hello";
    
    setPendingIncomingMessage(messageToAnalyze);
    setShowAISuggestion(true);
    setIsLoadingSuggestion(true);
    setAiSuggestion(null);

    try {
      console.log('⚡ Ultra-fast RAG starting...');
      const startTime = Date.now();
      
      const result = await chatWithVaultForConversation(
        partnerId,
        selectedConversation.id,
        selectedConversation.platform,
        messageToAnalyze,
        {
          includeAlternatives: false
        }
      );

      console.log(`⚡ RAG completed in ${Date.now() - startTime}ms`);

      if (result.success && result.suggestedReply) {
        setAiSuggestion({
          suggestedReply: result.suggestedReply,
          confidence: result.confidence || 0.5,
          reasoning: result.reasoning || 'Generated from available context',
          sources: result.sources || [],
          alternativeReplies: result.alternativeReplies || []
        });
      } else {
        throw new Error(result.message || 'Failed to generate suggestion');
      }
    } catch (error: any) {
      console.error('❌ AI suggestion error:', error);
      toast({
        variant: 'destructive',
        title: 'AI suggestion failed',
        description: error.message
      });
      setShowAISuggestion(false);
    } finally {
      setIsLoadingSuggestion(false);
    }
  };

  const handleEditSuggestion = (text: string) => {
    setMessageInput(text);
    setShowAISuggestion(false);
    setAiSuggestion(null);
    setPendingIncomingMessage('');
  };

  const handleSendSuggestion = async (text: string) => {
    if (!selectedConversation || !text.trim()) return;

    setShowAISuggestion(false);
    setAiSuggestion(null);
    setPendingIncomingMessage('');

    const optimistic = {
      id: `optimistic-${Date.now()}`,
      conversationId: selectedConversation.id,
      direction: 'outbound' as const,
      content: text,
      createdAt: Timestamp.now(),
      status: 'sending',
    };

    setOptimisticMessages(prev => [...prev, optimistic]);
    setIsSending(true);

    try {
      let result;
      
      if (selectedConversation.platform === 'sms') {
        result = await sendSMSAction({
          partnerId,
          to: selectedConversation.customerPhone,
          message: text,
          conversationId: selectedConversation.id,
        });
      } else {
        result = await sendWhatsAppMessageAction({
          partnerId,
          to: selectedConversation.customerPhone,
          message: text,
          conversationId: selectedConversation.id,
        });
      }

      if (result.success) {
        setOptimisticMessages(prev => prev.filter(m => m.id !== optimistic.id));
      } else {
        throw new Error(result.message || 'Failed to send');
      }
    } catch (error: any) {
      console.error('❌ Send error:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Failed to send message',
        description: error.message 
      });
      setOptimisticMessages(prev => prev.filter(m => m.id !== optimistic.id));
    } finally {
      setIsSending(false);
    }
  };

  const handleDismissSuggestion = () => {
    setShowAISuggestion(false);
    setAiSuggestion(null);
    setPendingIncomingMessage('');
  };

  const handleRegenerateSuggestion = () => {
    handleRequestAISuggestion(pendingIncomingMessage);
  };

  if (!partnerId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading workspace...</p>
      </div>
    );
  }

  return (
    <>
      <audio ref={audioRef} src="/notification.mp3" preload="auto" />
      
      <div className="grid grid-cols-[380px_1fr] h-screen bg-gray-50">
        <div className="border-r border-gray-200 bg-white flex flex-col overflow-hidden">
          <ConversationList
            conversations={filteredConversations}
            selectedConversation={selectedConversation}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onSelectConversation={handleSelectConversation}
            onNewConversation={() => {
              setShowNewConversation(true);
              setSelectedConversation(null);
              setShowDiagnostics(false);
            }}
            isLoading={isLoadingConversations || isLoadingContacts}
          />
        </div>

        <div className="flex flex-col overflow-hidden">
          {showNewConversation && (
            <>
              <div className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
                <h2 className="text-lg font-semibold text-gray-900">New Conversation</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <NewConversationForm
                  partnerId={partnerId}
                  onClose={() => setShowNewConversation(false)}
                  onConversationCreated={(conversationId, platform) => {
                    setShowNewConversation(false);
                    const conv = simpleConversations.find(c => c.id === conversationId);
                    if (conv) handleSelectConversation(conv);
                  }}
                />
              </div>
            </>
          )}

          {showDiagnostics && (
            <>
              <div className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
                <h2 className="text-lg font-semibold text-gray-900">Diagnostics</h2>
              </div>
              <div className="flex-1 overflow-y-auto">
                <DiagnosticsView partnerId={partnerId} />
              </div>
            </>
          )}

          {!selectedConversation && !showNewConversation && !showDiagnostics && (
            <EmptyState
              onNewConversation={() => {
                setShowNewConversation(true);
                setShowDiagnostics(false);
              }}
              onViewDiagnostics={() => {
                setShowDiagnostics(true);
                setShowNewConversation(false);
              }}
            />
          )}

          {selectedConversation && !showNewConversation && !showDiagnostics && (
            <>
              <div className="shrink-0">
                <ChatHeader
                  conversation={selectedConversation}
                  onViewProfile={() => setShowClientProfile(true)}
                />
              </div>

              <div className="flex-1 overflow-hidden">
                <MessagesList
                  messages={allMessages}
                  isLoadingMore={isLoadingMessages}
                  allMessagesLoaded={true}
                  onLoadMore={() => {}}
                  partnerId={partnerId}
                />
              </div>

              <div className="shrink-0">
                <InlineAISuggestion
                  suggestion={aiSuggestion}
                  isLoading={isLoadingSuggestion}
                  isVisible={showAISuggestion}
                  onEdit={handleEditSuggestion}
                  onSend={handleSendSuggestion}
                  onDismiss={handleDismissSuggestion}
                  onRegenerate={handleRegenerateSuggestion}
                  incomingMessage={pendingIncomingMessage}
                />
              </div>

              <div className="shrink-0">
                <MessageInput
                  value={messageInput}
                  onChange={setMessageInput}
                  onSend={handleSendMessage}
                  disabled={isSending || !selectedConversation}
                />
              </div>
            </>
          )}
        </div>

        {showClientProfile && selectedConversation && (
          <div className="fixed inset-0 z-50">
            <ClientProfilePanel
              conversation={selectedConversation as any}
              onClose={() => setShowClientProfile(false)}
              partnerId={partnerId}
            />
          </div>
        )}
      </div>
    </>
  );
}