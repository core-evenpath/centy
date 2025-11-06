"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Bell } from 'lucide-react';
import { sendSMSAction } from '@/actions/sms-actions';
import { sendWhatsAppMessageAction } from '@/actions/whatsapp-actions';
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

type Platform = 'sms' | 'whatsapp';

interface MessagingDiagnostics {
  configOk: boolean;
  accountSid: boolean;
  authToken: boolean;
  smsNumber: boolean;
  whatsAppNumber: boolean;
  baseUrl: string;
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

  const [diagnostics, setDiagnostics] = useState<MessagingDiagnostics>({
    configOk: false,
    accountSid: false,
    authToken: false,
    smsNumber: false,
    whatsAppNumber: false,
    baseUrl: typeof window !== 'undefined' ? window.location.origin : ''
  });

  useEffect(() => {
    const urlConversationId = searchParams.get('conversation');
    if (urlConversationId && simpleConversations.length > 0) {
      const conv = simpleConversations.find(c => c.id === urlConversationId);
      if (conv) {
        handleSelectConversation(conv);
      }
    }
  }, [searchParams, simpleConversations]);

  const handleSelectConversation = (conversation: SimpleConversation) => {
    setSelectedConversation(conversation);
    setShowNewConversation(false);
    setShowDiagnostics(false);
    setShowClientProfile(false);
    setOptimisticMessages([]);
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
        title: 'Failed to send', 
        description: error.message 
      });
      setOptimisticMessages(prev => prev.filter(m => m.id !== optimistic.id));
    }
  };

  const handleNewConversation = () => {
    setShowNewConversation(true);
    setSelectedConversation(null);
    setShowDiagnostics(false);
    setShowClientProfile(false);
  };

  const handleConversationCreated = (conversationId: string, platform: Platform) => {
    setShowNewConversation(false);
    setTimeout(() => {
      const newConvo = simpleConversations.find(c => c.id === conversationId);
      if (newConvo) {
        handleSelectConversation(newConvo);
      }
    }, 500);
  };

  const handleViewDiagnostics = () => {
    setShowDiagnostics(true);
    setSelectedConversation(null);
    setShowNewConversation(false);
    setShowClientProfile(false);
  };

  const handleToggleProfile = () => {
    setShowClientProfile(prev => !prev);
  };

  const selectedForComponents = selectedConversation ? {
    id: selectedConversation.id,
    customerPhone: selectedConversation.customerPhone,
    customerName: selectedConversation.customerName,
    contactName: selectedConversation.contactName,
    contactEmail: selectedConversation.contactEmail,
    contactId: selectedConversation.contactId,
    availablePlatforms: [selectedConversation.platform],
    smsConversationId: selectedConversation.platform === 'sms' ? selectedConversation.id : undefined,
    whatsappConversationId: selectedConversation.platform === 'whatsapp' ? selectedConversation.id : undefined,
    lastMessageAt: selectedConversation.lastMessageAt,
    messageCount: selectedConversation.messageCount,
    recentMessages: [],
    isActive: selectedConversation.isActive,
    clientInfo: selectedConversation.clientInfo,
    partnerId: selectedConversation.partnerId,
    createdAt: selectedConversation.createdAt
  } : null;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <audio ref={audioRef} src="/notification.mp3" />
      
      <ConversationList
        conversations={filteredConversations}
        selectedConversation={selectedForComponents}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        isLoading={isLoadingConversations || isLoadingContacts}
      />

      <main className="flex-1 flex relative min-w-0">
        <div className="flex-1 flex flex-col">
          {showDiagnostics ? (
            <DiagnosticsView 
              diagnostics={diagnostics}
              onClose={() => setShowDiagnostics(false)}
            />
          ) : showNewConversation ? (
            <NewConversationForm
              partnerId={partnerId}
              onClose={() => setShowNewConversation(false)}
              onConversationCreated={handleConversationCreated}
            />
          ) : selectedConversation ? (
            <>
              <ChatHeader
                conversation={selectedForComponents!}
                selectedPlatform={selectedConversation.platform}
                onPlatformChange={() => {}}
                onToggleProfile={handleToggleProfile}
              />

              <div className="flex-1 overflow-hidden">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto mb-4"></div>
                      <p className="text-sm text-slate-600">Loading messages...</p>
                    </div>
                  </div>
                ) : (
                  <MessagesList
                    messages={allMessages}
                    isLoadingMore={false}
                    allMessagesLoaded={true}
                    onLoadMore={() => {}}
                    partnerId={partnerId}
                  />
                )}
              </div>

              <MessageInput
                value={messageInput}
                onChange={setMessageInput}
                onSend={handleSendMessage}
                isSending={false}
                platform={selectedConversation.platform}
              />
            </>
          ) : (
            <EmptyState 
              onNewConversation={handleNewConversation}
              onViewDiagnostics={handleViewDiagnostics}
            />
          )}
        </div>

        {showClientProfile && selectedConversation && (
          <div className="w-96 border-l border-slate-200 bg-white">
            <ClientProfilePanel
              conversation={selectedForComponents!}
              partnerId={partnerId}
              onClose={() => setShowClientProfile(false)}
            />
          </div>
        )}
      </main>

      {hasUnread && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            onClick={markAllAsRead}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
          >
            <Bell className="w-4 h-4 mr-2" />
            {notifications.filter(n => !n.isRead).length} new
          </Button>
        </div>
      )}
    </div>
  );
}