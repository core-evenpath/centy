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
      const aTime = a.createdAt?.toMillis?.() || a.createdAt?.seconds * 1000 || 0;
      const bTime = b.createdAt?.toMillis?.() || b.createdAt?.seconds * 1000 || 0;
      return aTime - bTime;
    });
  }, [dbMessages, optimisticMessages]);

  const filteredConversations = useMemo(() => {
    if (!searchTerm) return simpleConversations;
    const term = searchTerm.toLowerCase();
    return simpleConversations.filter(conv => 
      conv.contactName?.toLowerCase().includes(term) ||
      conv.customerName?.toLowerCase().includes(term) ||
      conv.customerPhone.includes(term)
    );
  }, [simpleConversations, searchTerm]);

  useEffect(() => {
    const urlConversationId = searchParams.get('conversation');
    if (urlConversationId && simpleConversations.length > 0) {
      const conv = simpleConversations.find(c => c.id === urlConversationId);
      if (conv) {
        handleSelectConversation(conv);
      }
    }
  }, [searchParams, simpleConversations]);

  useEffect(() => {
    processedMessageIds.current.clear();
    lastSuggestionContext.current = '';
  }, [selectedConversation?.id]);

  useEffect(() => {
    if (!selectedConversation || !partnerId) return;
    if (dbMessages.length === 0) return;
    
    const latestMessage = dbMessages[dbMessages.length - 1];
    const isIncomingMessage = latestMessage.direction === 'inbound';
    
    if (!isIncomingMessage) return;
    
    const recentMessages = dbMessages.slice(-5);
    const conversationContext = recentMessages
      .map(m => `${m.direction}: ${m.content}`)
      .join(' | ');
    
    if (conversationContext === lastSuggestionContext.current) return;
    
    if (processedMessageIds.current.has(latestMessage.id)) {
      const contextChanged = conversationContext.length > lastSuggestionContext.current.length + 50;
      if (!contextChanged) return;
    }
    
    console.log('🤖 Generating AI suggestion for:', latestMessage.content);
    
    processedMessageIds.current.add(latestMessage.id);
    lastSuggestionContext.current = conversationContext;
    
    setTimeout(() => {
      handleRequestAISuggestion(latestMessage.content);
    }, 500);
  }, [dbMessages, selectedConversation, partnerId]);

  const handleSelectConversation = (conversation: SimpleConversation) => {
    setSelectedConversation(conversation);
    setShowNewConversation(false);
    setShowDiagnostics(false);
    setShowClientProfile(false);
    setOptimisticMessages([]);
    setShowAISuggestion(false);
    setAiSuggestion(null);
    setPendingIncomingMessage('');
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
    if (!partnerId || !selectedConversation) return;

    const optimistic = {
      id: `optimistic-${Date.now()}`,
      conversationId: selectedConversation.id,
      direction: 'outbound',
      content: messageInput,
      status: 'pending',
      createdAt: Timestamp.now(),
      senderId: user?.uid
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
      console.log('🔍 Querying RAG for customer-specific suggestion...');
      console.log('📝 Message:', messageToAnalyze.substring(0, 50));
      console.log('💼 Partner:', partnerId);
      console.log('💬 Conversation:', selectedConversation.id);
      console.log('📱 Platform:', selectedConversation.platform);
      console.log('👤 Customer:', selectedConversation.customerPhone);
      
      const result = await chatWithVaultForConversation(
        partnerId,
        selectedConversation.id,
        selectedConversation.platform,
        messageToAnalyze
      );

      console.log('📦 RAG Result:', {
        success: result.success,
        hasReply: !!result.suggestedReply,
        confidence: result.confidence,
        sourcesCount: result.sources?.length || 0,
      });

      if (result.success && result.suggestedReply) {
        const suggestion: RAGSuggestion = {
          suggestedReply: result.suggestedReply,
          confidence: result.confidence || 0.7,
          reasoning: result.reasoning || 'Generated from available knowledge',
          sources: result.sources || [],
          alternativeReplies: result.alternativeReplies || [],
        };

        setAiSuggestion(suggestion);
        console.log('✅ Customer-specific AI suggestion generated');
      } else {
        console.error('❌ RAG query failed:', result);
        throw new Error(result.message || 'Failed to generate suggestion');
      }
    } catch (error: any) {
      console.error('❌ Failed to get AI suggestion:', error);
      
      let errorMessage = 'Failed to generate suggestion';
      if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'AI Suggestion Error',
        description: errorMessage,
        variant: 'destructive',
      });
      
      setShowAISuggestion(false);
    } finally {
      setIsLoadingSuggestion(false);
    }
  };

  const handleAcceptSuggestion = (text: string) => {
    setMessageInput(text);
  };

  const handleRegenerateSuggestion = () => {
    if (pendingIncomingMessage) {
      handleRequestAISuggestion(pendingIncomingMessage);
    }
  };

  const handleDismissSuggestion = () => {
    setShowAISuggestion(false);
    setAiSuggestion(null);
    setPendingIncomingMessage('');
  };

  if (!user || !partnerId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-gray-900 font-semibold">Authentication Required</p>
          <p className="text-gray-600 mt-2">Please log in to access messaging.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <audio ref={audioRef} src="/notification.mp3" preload="auto" />
      
      <div className="flex h-screen bg-gray-50 overflow-hidden">
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
            setShowClientProfile(false);
            setShowAISuggestion(false);
          }}
          isLoading={isLoadingConversations}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          {showNewConversation && (
            <>
              <div className="bg-white border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">New Conversation</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <NewConversationForm
                  partnerId={partnerId}
                  onSuccess={(conversationId) => {
                    setShowNewConversation(false);
                    const conv = simpleConversations.find(c => c.id === conversationId);
                    if (conv) handleSelectConversation(conv);
                  }}
                  onCancel={() => setShowNewConversation(false)}
                />
              </div>
            </>
          )}

          {showDiagnostics && (
            <>
              <div className="bg-white border-b border-gray-200 px-6 py-4">
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
              hasNotifications={hasUnread}
              notificationCount={notifications?.filter(n => !n.isRead).length || 0}
              onViewNotifications={markAllAsRead}
            />
          )}

          {selectedConversation && !showNewConversation && !showDiagnostics && (
            <>
              <ChatHeader
                conversation={selectedConversation}
                onViewProfile={() => setShowClientProfile(true)}
              />

              <div className="flex-1 overflow-hidden">
                <MessagesList
                  messages={allMessages}
                  isLoadingMore={isLoadingMessages}
                  allMessagesLoaded={true}
                  onLoadMore={() => {}}
                  partnerId={partnerId}
                />
              </div>

              <InlineAISuggestion
                suggestion={aiSuggestion}
                isLoading={isLoadingSuggestion}
                isVisible={showAISuggestion}
                onAccept={handleAcceptSuggestion}
                onDismiss={handleDismissSuggestion}
                onRegenerate={handleRegenerateSuggestion}
                incomingMessage={pendingIncomingMessage}
              />

              <MessageInput
                value={messageInput}
                onChange={setMessageInput}
                onSend={handleSendMessage}
                disabled={isSending || !selectedConversation}
              />
            </>
          )}
        </div>

        {showClientProfile && selectedConversation && (
          <ClientProfilePanel
            conversation={selectedConversation as any}
            onClose={() => setShowClientProfile(false)}
            partnerId={partnerId}
          />
        )}
      </div>
    </>
  );
}