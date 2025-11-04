// src/app/partner/(protected)/messaging/page.tsx - MODIFIED VERSION WITH CONTACT ENRICHMENT
// Key Changes:
// 1. Import useEnrichedConversations hook
// 2. Use enrichedConversations instead of raw conversations
// 3. Display contact names throughout the UI

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
import type { SMSConversation, WhatsAppConversation, SMSMessage, WhatsAppMessage } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';

// Custom hooks
import { useConversations } from '@/hooks/useConversations';
import { useMessages } from '@/hooks/useMessages';
import { useNotifications } from '@/hooks/useNotifications';
import { useEnrichedConversations } from '@/hooks/useEnrichedConversations'; // NEW IMPORT

// Components
import ConversationList from '@/components/partner/messaging/ConversationList';
import ChatHeader from '@/components/partner/messaging/ChatHeader';
import MessagesList from '@/components/partner/messaging/MessagesList';
import MessageInput from '@/components/partner/messaging/MessageInput';
import NewConversationForm from '@/components/partner/messaging/NewConversationForm';
import EmptyState from '@/components/partner/messaging/EmptyState';
import DiagnosticsView from '@/components/partner/messaging/DiagnosticsView';
import ClientProfilePanel from '@/components/partner/messaging/ClientProfilePanel';

type Platform = 'sms' | 'whatsapp';
type UnifiedConversation = (SMSConversation | WhatsAppConversation) & { 
  platform: Platform; 
  recentMessages?: any[];
  clientInfo?: {
    portfolio?: string;
    email?: string;
    occupation?: string;
    accountType?: string;
    notes?: string;
  };
  contactName?: string;    // NEW
  contactEmail?: string;   // NEW
  contactId?: string;      // NEW
};
type UnifiedMessage = (SMSMessage | WhatsAppMessage) & { platform: Platform };

interface MessagingDiagnostics {
  configOk: boolean;
  accountSid: boolean;
  authToken: boolean;
  smsNumber: boolean;
  whatsAppNumber: boolean;
  baseUrl: string;
}

export default function MessagingPage() {
  const { user, currentWorkspace } = useMultiWorkspaceAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  
  const partnerId = currentWorkspace?.partnerId || user?.customClaims?.partnerId;
  
  // Custom hooks
  const { conversations: rawConversations, isLoading: isLoadingConversations } = useConversations(partnerId);
  
  // NEW: Enrich conversations with contact data
  const { enrichedConversations, isLoadingContacts } = useEnrichedConversations(rawConversations, partnerId);
  
  // Use enriched conversations instead of raw
  const conversations = enrichedConversations as UnifiedConversation[];
  
  const { notificationsEnabled, setNotificationsEnabled, audioRef, notify } = useNotifications();
  
  // State
  const [selectedConversation, setSelectedConversation] = useState<UnifiedConversation | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [newPlatform, setNewPlatform] = useState<Platform>('whatsapp');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [showClientProfile, setShowClientProfile] = useState(false);
  const [diagnostics, setDiagnostics] = useState<MessagingDiagnostics | null>(null);
  
  // Optimistic messages state
  const [optimisticMessages, setOptimisticMessages] = useState<UnifiedMessage[]>([]);

  // Get initial messages from the selected conversation
  const initialRecentMessages = useMemo(() => {
    return (selectedConversation?.recentMessages || []) as UnifiedMessage[];
  }, [selectedConversation]);

  // Use messages hook
  const { 
    messages: firebaseMessages, 
    isLoadingMore: isLoadingMessages,
    error: messagesError,
    loadMore,
    allMessagesLoaded 
  } = useMessages({
    conversationId: selectedConversation?.id,
    platform: selectedConversation?.platform,
    initialRecentMessages: initialRecentMessages,
    onNewMessage: () => {
      if (selectedConversation) {
        // Use contact name if available, fallback to customerName or phone
        const displayName = selectedConversation.contactName || 
                          selectedConversation.customerName || 
                          selectedConversation.customerPhone;
        notify(displayName);
      }
    },
  });

  // Combine Firebase messages with optimistic messages
  const messages = useMemo(() => {
    const firebaseMessageIds = new Set(firebaseMessages.map(m => m.id));
    const uniqueOptimistic = optimisticMessages.filter(m => !firebaseMessageIds.has(m.id));
    return [...firebaseMessages, ...uniqueOptimistic].sort((a, b) => {
      const timeA = a.createdAt?.toMillis?.() || 0;
      const timeB = b.createdAt?.toMillis?.() || 0;
      return timeA - timeB;
    });
  }, [firebaseMessages, optimisticMessages]);

  // Clear optimistic messages when conversation changes
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
        console.error("Failed to fetch messaging diagnostics", error);
      }
    }
    fetchDiagnostics();
  }, []);

  // Select conversation from URL
  useEffect(() => {
    const conversationIdFromUrl = searchParams.get('conversation');
    if (conversationIdFromUrl && conversations.length > 0) {
      const convo = conversations.find(c => c.id === conversationIdFromUrl);
      if (convo) {
        setSelectedConversation(convo as UnifiedConversation);
        setShowNewConversation(false);
        setShowDiagnostics(false);
      }
    }
  }, [searchParams, conversations]);

  // NEW: Filter conversations with contact name support
  const filteredConversations = useMemo(() => {
    if (!searchTerm) return conversations;
    
    const lowerSearch = searchTerm.toLowerCase();
    return conversations.filter(convo => {
      const phone = convo.customerPhone?.toLowerCase() || '';
      const customerName = convo.customerName?.toLowerCase() || '';
      const contactName = convo.contactName?.toLowerCase() || '';
      const contactEmail = convo.contactEmail?.toLowerCase() || '';
      
      return phone.includes(lowerSearch) || 
             customerName.includes(lowerSearch) ||
             contactName.includes(lowerSearch) ||
             contactEmail.includes(lowerSearch);
    });
  }, [conversations, searchTerm]);

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
    if (!partnerId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Partner ID not found' });
      return;
    }
  
    let phoneNumber = '';
    let conversationId = '';
    let platform: Platform = selectedConversation?.platform || newPlatform;
    let isNewConvo = false;
  
    if (selectedConversation && selectedConversation.id !== 'pending') {
      phoneNumber = selectedConversation.customerPhone;
      conversationId = selectedConversation.id;
      platform = selectedConversation.platform;
    } else if (showNewConversation && newPhoneNumber) {
      phoneNumber = newPhoneNumber;
      isNewConvo = true;
      conversationId = 'pending';
    } else {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select a conversation or enter a phone number' });
      return;
    }

    const currentMessage = messageInput.trim();
    const tempId = `temp-${Date.now()}`;
    
    // Create optimistic message
    const optimisticMessage: UnifiedMessage = {
      id: tempId,
      conversationId: conversationId === 'pending' ? '' : conversationId,
      senderId: partnerId,
      content: currentMessage,
      type: 'text',
      direction: 'outbound',
      platform: platform,
      createdAt: Timestamp.now(),
      smsMetadata: platform === 'sms' ? {
        to: phoneNumber,
        from: '',
        twilioStatus: 'queued',
      } : undefined,
      whatsAppMetadata: platform === 'whatsapp' ? {
        to: `whatsapp:${phoneNumber}`,
        from: '',
        messageStatus: 'queued',
      } : undefined,
    } as UnifiedMessage;
    
    setOptimisticMessages(prev => [...prev, optimisticMessage]);
    setMessageInput('');
    setIsSending(true);

    try {
      let result;
      
      if (platform === 'sms') {
        result = await sendSMSAction({
          partnerId,
          to: phoneNumber,
          message: currentMessage,
          conversationId: conversationId !== 'pending' ? conversationId : undefined,
        });
      } else {
        result = await sendWhatsAppMessageAction({
          partnerId,
          to: phoneNumber,
          message: currentMessage,
          conversationId: conversationId !== 'pending' ? conversationId : undefined,
        });
      }

      if (result.success) {
        // Remove optimistic message - real one will come from Firebase
        setOptimisticMessages(prev => prev.filter(m => m.id !== tempId));
        
        if (isNewConvo && result.conversationId) {
          const newConvo = conversations.find(c => c.id === result.conversationId);
          if (newConvo) {
            setSelectedConversation(newConvo);
            setShowNewConversation(false);
            setNewPhoneNumber('');
          }
        }
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      setOptimisticMessages(prev => prev.filter(m => m.id !== tempId));
      toast({ 
        variant: 'destructive', 
        title: 'Failed to send message', 
        description: error.message 
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSelectConversation = (conversation: UnifiedConversation) => {
    setSelectedConversation(conversation);
    setShowNewConversation(false);
    setShowDiagnostics(false);
    setShowClientProfile(false);
  };

  const handleNewConversation = () => {
    setShowNewConversation(true);
    setSelectedConversation(null);
    setShowDiagnostics(false);
    setShowClientProfile(false);
    setNewPhoneNumber('');
  };

  const handleViewDiagnostics = () => {
    setShowDiagnostics(true);
    setShowNewConversation(false);
    setSelectedConversation(null);
    setShowClientProfile(false);
  };

  const handleShowClientProfile = () => {
    setShowClientProfile(true);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <audio ref={audioRef} src="/audio/notification.mp3" preload="auto" />
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-slate-700" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
              <p className="text-sm text-slate-600">
                SMS & WhatsApp powered by Twilio
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={notificationsEnabled ? "outline" : "ghost"}
              size="icon"
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              title={notificationsEnabled ? "Notifications enabled" : "Notifications disabled"}
            >
              {notificationsEnabled ? (
                <Bell className="w-4 h-4" />
              ) : (
                <BellOff className="w-4 h-4" />
              )}
            </Button>
            <Button onClick={handleNewConversation}>
              <Plus className="w-4 h-4 mr-2" />
              New Conversation
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleViewDiagnostics}>
                  <Settings className="w-4 h-4 mr-2" />
                  Diagnostics
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Conversations Sidebar */}
        <ConversationList
          conversations={filteredConversations}
          selectedConversation={selectedConversation}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          isLoading={isLoadingConversations || isLoadingContacts}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-white relative">
          {showDiagnostics ? (
            <DiagnosticsView 
              diagnostics={diagnostics} 
              onBack={() => setShowDiagnostics(false)} 
            />
          ) : showNewConversation ? (
            <NewConversationForm
              phoneNumber={newPhoneNumber}
              message={messageInput}
              platform={newPlatform}
              isSending={isSending}
              onPhoneNumberChange={setNewPhoneNumber}
              onMessageChange={setMessageInput}
              onPlatformChange={setNewPlatform}
              onSend={handleSendMessage}
            />
          ) : selectedConversation ? (
            <>
              <ChatHeader
                conversation={selectedConversation}
                onShowClientProfile={handleShowClientProfile}
              />
              <MessagesList
                messages={messages}
                isLoading={isLoadingMessages}
                onLoadMore={loadMore}
                allMessagesLoaded={allMessagesLoaded}
                error={messagesError}
              />
              <MessageInput
                value={messageInput}
                onChange={setMessageInput}
                onSend={handleSendMessage}
                isSending={isSending}
                placeholder="Type your message..."
              />
            </>
          ) : (
            <EmptyState onNewConversation={handleNewConversation} />
          )}
        </div>

        {/* Client Profile Panel */}
        {showClientProfile && selectedConversation && partnerId && (
          <ClientProfilePanel
            conversation={selectedConversation}
            onClose={() => setShowClientProfile(false)}
            partnerId={partnerId}
          />
        )}
      </div>
    </div>
  );
}