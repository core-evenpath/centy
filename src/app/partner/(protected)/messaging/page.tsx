// src/app/partner/(protected)/messaging/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { 
  MessageSquare, 
  Plus,
  MoreVertical,
  Settings,
  Bell,
  BellOff,
} from 'lucide-react';
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

// Simple conversation type - no merging
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
  
  console.log('════════════════════════════════════════════');
  console.log('🏠 MESSAGING PAGE - SEPARATE THREADS VERSION');
  console.log('Partner ID:', partnerId);
  console.log('════════════════════════════════════════════');
  
  // Fetch all conversations (no grouping)
  const { conversations: rawConversations, isLoading: isLoadingConversations } = useConversations(partnerId);
  
  console.log('📦 Raw conversations:', {
    total: rawConversations.length,
    sms: rawConversations.filter(c => c.platform === 'sms').length,
    whatsapp: rawConversations.filter(c => c.platform === 'whatsapp').length
  });
  
  // Enrich with contact data
  const { enrichedConversations, isLoadingContacts } = useEnrichedConversations(rawConversations, partnerId);
  
  // Convert to simple format (no grouping - each conversation is separate)
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

  console.log('✅ Simple conversations (separate threads):', {
    total: simpleConversations.length,
    sms: simpleConversations.filter(c => c.platform === 'sms').length,
    whatsapp: simpleConversations.filter(c => c.platform === 'whatsapp').length
  });
  
  const { notificationsEnabled, setNotificationsEnabled, audioRef, notify } = useNotifications();
  
  const [selectedConversation, setSelectedConversation] = useState<SimpleConversation | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [showClientProfile, setShowClientProfile] = useState(false);
  const [diagnostics, setDiagnostics] = useState<MessagingDiagnostics | null>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<any[]>([]);

  // Load messages for selected conversation (single platform only)
  const { 
    messages: loadedMessages, 
    isLoading: isLoadingMessages 
  } = useConversationMessages({
    conversationId: selectedConversation?.id,
    platform: selectedConversation?.platform || 'sms',
    onNewMessage: () => {
      console.log('🔔 New message notification!');
      notify();
    }
  });

  console.log('📨 Messages for selected conversation:', {
    conversationId: selectedConversation?.id,
    platform: selectedConversation?.platform,
    count: loadedMessages.length,
    inbound: loadedMessages.filter(m => m.direction === 'inbound').length,
    outbound: loadedMessages.filter(m => m.direction === 'outbound').length
  });

  // Combine with optimistic messages
  const allMessages = useMemo(() => {
    const combined = [...loadedMessages, ...optimisticMessages];
    combined.sort((a, b) => {
      const timeA = a.createdAt?.toMillis?.() || 0;
      const timeB = b.createdAt?.toMillis?.() || 0;
      return timeA - timeB;
    });
    return combined;
  }, [loadedMessages, optimisticMessages]);

  // Clear optimistic when conversation changes
  useEffect(() => {
    setOptimisticMessages([]);
  }, [selectedConversation?.id]);

  // Fetch diagnostics
  useEffect(() => {
    async function fetchDiagnostics() {
      try {
        const response = await fetch('/api/diagnostics/messaging');
        if (response.ok) {
          const data = await response.json();
          setDiagnostics(data);
        }
      } catch (error) {
        console.error("Failed to fetch diagnostics", error);
      }
    }
    fetchDiagnostics();
  }, []);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    if (!searchTerm) return simpleConversations;
    
    const lowerSearch = searchTerm.toLowerCase();
    return simpleConversations.filter(convo => {
      const phone = convo.customerPhone?.toLowerCase() || '';
      const customerName = convo.customerName?.toLowerCase() || '';
      const contactName = convo.contactName?.toLowerCase() || '';
      
      return phone.includes(lowerSearch) || 
             customerName.includes(lowerSearch) ||
             contactName.includes(lowerSearch);
    });
  }, [simpleConversations, searchTerm]);

  const handleSelectConversation = (conversation: any) => {
    console.log('════════════════════════════════════════════');
    console.log('👆 CONVERSATION SELECTED:', {
      id: conversation.id,
      platform: conversation.platform,
      phone: conversation.customerPhone,
      name: conversation.contactName || conversation.customerName
    });
    console.log('════════════════════════════════════════════');
    
    setSelectedConversation(conversation);
    setShowNewConversation(false);
    setShowDiagnostics(false);
    setShowClientProfile(false);
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
    if (!partnerId || !selectedConversation) return;

    console.log('📤 Sending message via', selectedConversation.platform);

    // Optimistic message
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
        console.log('✅ Message sent successfully');
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
    console.log('🎉 New conversation created:', { conversationId, platform });
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

  // Convert simple conversation for components that expect unified format
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
      
      {/* Conversation List - Shows separate SMS and WhatsApp threads */}
      <ConversationList
        conversations={filteredConversations}
        selectedConversation={selectedForComponents}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        isLoading={isLoadingConversations || isLoadingContacts}
      />

      <main className="flex-1 flex flex-col relative min-w-0">
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
            {/* Chat Header - Shows platform badge */}
            <ChatHeader
              conversation={selectedForComponents!}
              selectedPlatform={selectedConversation.platform}
              onPlatformChange={() => {}} // No switching since separate threads
              onToggleProfile={handleToggleProfile}
            />

            {/* Messages List */}
            <div className="flex-1 overflow-hidden">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading messages...</p>
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

            {/* Message Input */}
            <MessageInput
              value={messageInput}
              onChange={setMessageInput}
              onSend={handleSendMessage}
              platform={selectedConversation.platform}
              disabled={false}
            />

            {/* Client Profile Panel */}
            {showClientProfile && (
              <div className="absolute top-0 right-0 h-full w-96 bg-white shadow-xl z-10 border-l border-gray-200">
                <ClientProfilePanel
                  conversation={selectedForComponents!}
                  onClose={handleToggleProfile}
                  partnerId={partnerId}
                />
              </div>
            )}
          </>
        ) : (
          <EmptyState 
            onNewConversation={handleNewConversation}
            onViewDiagnostics={handleViewDiagnostics}
          />
        )}

        {/* Settings */}
        {!showDiagnostics && !showNewConversation && (
          <div className="absolute top-4 right-4 z-20">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="bg-white shadow-sm">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setNotificationsEnabled(!notificationsEnabled)}>
                  {notificationsEnabled ? (
                    <>
                      <BellOff className="w-4 h-4 mr-2" />
                      Disable Notifications
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4 mr-2" />
                      Enable Notifications
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleViewDiagnostics}>
                  <Settings className="w-4 h-4 mr-2" />
                  View Diagnostics
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </main>
    </div>
  );
}