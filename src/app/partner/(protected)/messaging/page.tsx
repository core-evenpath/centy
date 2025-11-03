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
import type { SMSConversation, WhatsAppConversation, SMSMessage, WhatsAppMessage } from '@/lib/types';
import { Timestamp } from 'firebase/firestore';

// Custom hooks
import { useConversations } from '@/hooks/useConversations';
import { useMessages } from '@/hooks/useMessages';
import { useNotifications } from '@/hooks/useNotifications';

// Components
import ConversationList from '@/components/partner/messaging/ConversationList';
import ChatHeader from '@/components/partner/messaging/ChatHeader';
import MessagesList from '@/components/partner/messaging/MessagesList';
import MessageInput from '@/components/partner/messaging/MessageInput';
import NewConversationForm from '@/components/partner/messaging/NewConversationForm';
import EmptyState from '@/components/partner/messaging/EmptyState';
import DiagnosticsView from '@/components/partner/messaging/DiagnosticsView';

type Platform = 'sms' | 'whatsapp';
type UnifiedConversation = (SMSConversation | WhatsAppConversation) & { platform: Platform; recentMessages?: UnifiedMessage[] };
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
  const { conversations, isLoading: isLoadingConversations } = useConversations(partnerId);
  const { notificationsEnabled, setNotificationsEnabled, audioRef, notify } = useNotifications();
  
  // State
  const [selectedConversation, setSelectedConversation] = useState<UnifiedConversation | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnostics, setDiagnostics] = useState<MessagingDiagnostics | null>(null);
  
  // Optimistic messages state
  const [optimisticMessages, setOptimisticMessages] = useState<UnifiedMessage[]>([]);

  // Get initial messages from the selected conversation (thanks to denormalization)
  const initialRecentMessages = useMemo(() => {
    return (selectedConversation?.recentMessages || []) as UnifiedMessage[];
  }, [selectedConversation]);

  // Use messages hook with notification callback and initial messages
  const { 
    messages: firebaseMessages, 
    isLoadingMore: isLoadingMessages, // This is now for pagination
    error: messagesError,
    loadMore,
    allMessagesLoaded 
  } = useMessages({
    conversationId: selectedConversation?.id,
    platform: selectedConversation?.platform,
    initialRecentMessages: initialRecentMessages,
    onNewMessage: () => {
      if (selectedConversation) {
        notify(selectedConversation.customerName || selectedConversation.customerPhone);
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

  // Debug logs
  useEffect(() => {
    console.log('💬 Messages state:', {
      firebase: firebaseMessages.length,
      optimistic: optimisticMessages.length,
      combined: messages.length,
      conversationId: selectedConversation?.id
    });
  }, [firebaseMessages.length, optimisticMessages.length, messages.length, selectedConversation?.id]);

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

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
    if (!partnerId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Partner ID not found' });
      return;
    }
  
    let phoneNumber = '';
    let conversationId = '';
    // Default to 'whatsapp' if no conversation is selected
    let platform: Platform = selectedConversation?.platform || 'whatsapp';
    let isNewConvo = false;
  
    if (selectedConversation && selectedConversation.id !== 'pending') {
      phoneNumber = selectedConversation.customerPhone;
      conversationId = selectedConversation.id;
      platform = selectedConversation.platform;
    } else if (showNewConversation && newPhoneNumber) {
      phoneNumber = newPhoneNumber;
      isNewConvo = true;
      conversationId = 'pending'; // Use 'pending' for optimistic conversation
      // platform remains 'whatsapp' as default for new conversations
    } else {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select a conversation or enter a phone number' });
      return;
    }

    const currentMessage = messageInput.trim();
    const optimisticId = `optimistic-${Date.now()}`;
    
    // *** UX FIX: Switch view immediately for new conversations ***
    if (isNewConvo) {
      const optimisticConversation: UnifiedConversation = {
        id: 'pending',
        customerPhone: phoneNumber,
        customerName: phoneNumber, // Use phone number as temporary name
        platform: platform,
        partnerId: partnerId,
        type: 'direct', // Default 'direct' type from types.ts
        messageCount: 1,
        lastMessageAt: Timestamp.now(),
        participants: [], // Default empty participants
        isActive: true, // Default active
        createdAt: Timestamp.now(),
        recentMessages: [], // Starts with no recent messages
      };
      // Set this optimistic conversation as "selected"
      setSelectedConversation(optimisticConversation);
      // Hide the new conversation form, which will show the MessagesList
      setShowNewConversation(false);
    }
    
    console.log('📤 Sending message:', { 
      phoneNumber, 
      platform, 
      conversationId: selectedConversation?.id || 'pending', // Use the selected convo id
      messageLength: currentMessage.length 
    });

    // Create optimistic message
    const optimisticMessage: UnifiedMessage = {
      id: optimisticId,
      conversationId: selectedConversation?.id || 'pending', // Assign to current convo
      senderId: user?.uid || 'current-user',
      content: currentMessage,
      direction: 'outbound',
      platform: platform,
      createdAt: Timestamp.now(),
      type: 'text',
      isEdited: false,
      reactions: [],
      mentions: [],
      partnerId: partnerId,
      ...(platform === 'sms' ? {
        smsMetadata: {
          twilioSid: 'pending',
          twilioStatus: 'sending',
          from: '',
          to: phoneNumber,
        }
      } : {
        whatsappMetadata: {
          twilioSid: 'pending',
          twilioStatus: 'sending',
          from: '',
          to: phoneNumber,
        }
      })
    } as UnifiedMessage;

    // Add optimistic message immediately
    setOptimisticMessages(prev => [...prev, optimisticMessage]);
    
    // Clear input immediately for better UX
    setMessageInput('');
    setIsSending(true);
  
    try {
      let result;
      
      if (platform === 'sms') {
        result = await sendSMSAction({ 
          partnerId, 
          to: phoneNumber, 
          message: currentMessage,
          // Send undefined for conversationId if it's a new convo
          conversationId: isNewConvo ? undefined : selectedConversation?.id
        });
      } else {
        result = await sendWhatsAppMessageAction({
          partnerId,
          to: phoneNumber,
          message: currentMessage,
          // Send undefined for conversationId if it's a new convo
          conversationId: isNewConvo ? undefined : selectedConversation?.id
        });
      }

      console.log('✅ Message sent result:', result);
  
      if (result.success) {
        toast({ 
          title: 'Message sent', 
          description: 'Your message has been delivered.',
          duration: 2000 
        });

        // *** UX FIX: Robust de-duplication ***
        if (result.messageId) {
          // If server returns the real message ID, update our optimistic message
          // This allows the `useMemo` hook to de-dupe it once Firebase loads it
          setOptimisticMessages(prev =>
            prev.map(m =>
              m.id === optimisticId ? { ...m, id: result.messageId! } : m
            )
          );
          
          // Fallback garbage collection: remove the message from optimistic state
          // after a long delay, in case the Firebase listener fails.
          setTimeout(() => {
            setOptimisticMessages(prev => prev.filter(m => m.id !== result.messageId));
          }, 10000); // 10 seconds

        } else {
          // Fallback for older actions: remove optimistic message after 2s
          setTimeout(() => {
            setOptimisticMessages(prev => prev.filter(m => m.id !== optimisticId));
          }, 2000);
        }
        
        // If this was a new convo, find the *real* convo now
        if (result.conversationId && isNewConvo) {
          setTimeout(() => {
            const foundConvo = conversations.find(c => c.id === result.conversationId);
            if (foundConvo) {
              // Replace the 'pending' convo with the real one
              setSelectedConversation(foundConvo as UnifiedConversation);
              setNewPhoneNumber('');
            }
          }, 500); // Wait for useConversations to update
        }
      } else {
        throw new Error(result.message || 'Failed to send message');
      }
    } catch (error: any) {
      console.error('❌ Send message error:', error);
      
      // Remove optimistic message on error
      setOptimisticMessages(prev => prev.filter(m => m.id !== optimisticId));
      
      toast({ 
        variant: 'destructive', 
        title: 'Failed to send', 
        description: error.message 
      });
      
      // Restore message input on error
      setMessageInput(currentMessage);
      
      // *** UX FIX: If sending the *first* message fails, go back to new convo form
      if (isNewConvo) {
        setSelectedConversation(null);
        setShowNewConversation(true);
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleSelectConversation = (conversation: UnifiedConversation) => {
    console.log('👆 User selected conversation:', conversation.id);
    setSelectedConversation(conversation);
    setShowNewConversation(false);
    setShowDiagnostics(false);
    setOptimisticMessages([]); // Clear optimistic messages
  };

  const handleNewConversation = () => {
    setShowNewConversation(true);
    setSelectedConversation(null);
    setShowDiagnostics(false);
    setMessageInput('');
    setNewPhoneNumber('');
    setOptimisticMessages([]);
  };

  const handleCancelNewConversation = () => {
    setShowNewConversation(false);
    setNewPhoneNumber('');
    setMessageInput('');
  };

  const handleViewDiagnostics = () => {
    setShowDiagnostics(true);
    setShowNewConversation(false);
    setSelectedConversation(null);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Audio element for notifications */}
      <audio ref={audioRef} src="/audio/notification.mp3" preload="auto" />
      
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold">Messaging</h1>
              <p className="text-sm text-muted-foreground">
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
          conversations={conversations as UnifiedConversation[]}
          selectedConversation={selectedConversation}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          isLoading={isLoadingConversations}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
          {showDiagnostics ? (
            <DiagnosticsView 
              diagnostics={diagnostics} 
              onBack={() => setShowDiagnostics(false)} 
            />
          ) : showNewConversation ? (
            <NewConversationForm
              phoneNumber={newPhoneNumber}
              message={messageInput}
              onPhoneNumberChange={setNewPhoneNumber}
              onMessageChange={setMessageInput}
              onSend={handleSendMessage}
              onCancel={handleCancelNewConversation}
              isSending={isSending}
            />
          ) : selectedConversation ? (
            <>
              <ChatHeader conversation={selectedConversation} />
              <MessagesList 
                messages={messages} 
                isLoading={isLoadingMessages} // This is now for pagination
                onLoadMore={loadMore}
                allMessagesLoaded={allMessagesLoaded}
              />
              <MessageInput
                value={messageInput}
                onChange={setMessageInput}
                onSend={handleSendMessage}
                isSending={isSending}
              />
            </>
          ) : (
            <EmptyState 
              onNewConversation={handleNewConversation}
              onViewDiagnostics={handleViewDiagnostics}
            />
          )}
        </div>
      </div>
    </div>
  );
}