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
import { useUnifiedMessages } from '@/hooks/useUnifiedMessages';
import { useNotifications } from '@/hooks/useNotifications';

import { 
  groupConversationsByPhone, 
  getConversationIdForPlatform,
  getPreferredPlatform,
  type UnifiedConversation,
  type UnifiedMessage
} from '@/lib/conversation-grouping-service';

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

export default function MessagingPage() {
  const { user, currentWorkspace } = useMultiWorkspaceAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  
  const partnerId = currentWorkspace?.partnerId || user?.customClaims?.partnerId;
  
  console.log('🏠 Messaging Page - Partner ID:', partnerId);
  
  const { conversations: rawConversations, isLoading: isLoadingConversations } = useConversations(partnerId);
  
  console.log('📦 Raw conversations:', rawConversations.length);
  rawConversations.forEach(c => {
    console.log(`  ${c.platform}: ${c.customerPhone} (${c.messageCount} msgs)`);
  });
  
  const { enrichedConversations, isLoadingContacts } = useEnrichedConversations(rawConversations, partnerId);
  
  console.log('💎 Enriched conversations:', enrichedConversations.length);
  
  const groupedConversations = useMemo(() => {
    const grouped = groupConversationsByPhone(enrichedConversations);
    console.log('🎯 Final grouped conversations:', grouped.length);
    return grouped;
  }, [enrichedConversations]);
  
  const { notificationsEnabled, setNotificationsEnabled, audioRef, notify } = useNotifications();
  
  const [selectedConversation, setSelectedConversation] = useState<UnifiedConversation | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('whatsapp');
  const [messageInput, setMessageInput] = useState('');
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [newPlatform, setNewPlatform] = useState<Platform>('whatsapp');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [showClientProfile, setShowClientProfile] = useState(false);
  const [diagnostics, setDiagnostics] = useState<MessagingDiagnostics | null>(null);
  
  const [optimisticMessages, setOptimisticMessages] = useState<UnifiedMessage[]>([]);

  console.log('📌 Selected conversation:', selectedConversation?.id);
  console.log('🎚️ Selected platform:', selectedPlatform);

  const { 
    messages: unifiedMessages, 
    isLoadingMore, 
    allMessagesLoaded, 
    loadMore 
  } = useUnifiedMessages({
    unifiedConversation: selectedConversation,
    onNewMessage: () => {
      if (selectedConversation) {
        const displayName = selectedConversation.contactName || 
                          selectedConversation.customerName || 
                          selectedConversation.customerPhone;
        notify(displayName);
      }
    },
  });

  console.log('💬 Unified messages:', unifiedMessages.length);

  const messages = useMemo(() => {
    const messageIds = new Set(unifiedMessages.map(m => m.id));
    const uniqueOptimistic = optimisticMessages.filter(m => !messageIds.has(m.id));
    return [...unifiedMessages, ...uniqueOptimistic].sort((a, b) => {
      const timeA = a.createdAt?.toMillis?.() || 0;
      const timeB = b.createdAt?.toMillis?.() || 0;
      return timeA - timeB;
    });
  }, [unifiedMessages, optimisticMessages]);

  useEffect(() => {
    setOptimisticMessages([]);
  }, [selectedConversation?.id]);

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

  useEffect(() => {
    const conversationIdFromUrl = searchParams.get('conversation');
    if (conversationIdFromUrl && groupedConversations.length > 0) {
      const convo = groupedConversations.find(c => c.id === conversationIdFromUrl);
      if (convo) {
        setSelectedConversation(convo);
        setSelectedPlatform(getPreferredPlatform(convo));
        setShowNewConversation(false);
        setShowDiagnostics(false);
      }
    }
  }, [searchParams, groupedConversations]);

  const filteredConversations = useMemo(() => {
    if (!searchTerm) return groupedConversations;
    
    const lowerSearch = searchTerm.toLowerCase();
    return groupedConversations.filter(convo => {
      const phone = convo.customerPhone?.toLowerCase() || '';
      const customerName = convo.customerName?.toLowerCase() || '';
      const contactName = convo.contactName?.toLowerCase() || '';
      const contactEmail = convo.contactEmail?.toLowerCase() || '';
      
      return phone.includes(lowerSearch) || 
             customerName.includes(lowerSearch) ||
             contactName.includes(lowerSearch) ||
             contactEmail.includes(lowerSearch);
    });
  }, [groupedConversations, searchTerm]);

  const handleSelectConversation = (conversation: UnifiedConversation) => {
    console.log('👆 Selected conversation:', {
      id: conversation.id,
      platforms: conversation.availablePlatforms,
      smsId: conversation.smsConversationId,
      whatsappId: conversation.whatsappConversationId
    });
    
    setSelectedConversation(conversation);
    const preferred = getPreferredPlatform(conversation);
    console.log('🎯 Setting platform to:', preferred);
    setSelectedPlatform(preferred);
    setShowNewConversation(false);
    setShowDiagnostics(false);
    setShowClientProfile(false);
  };

  const handlePlatformChange = (platform: Platform) => {
    console.log('🔄 Platform changed to:', platform);
    setSelectedPlatform(platform);
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
    if (!partnerId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Partner ID not found' });
      return;
    }
  
    let phoneNumber = '';
    let conversationId = '';
    let platform: Platform = selectedPlatform;
    
    console.log('📤 Sending message:', { platform, selectedConversation: !!selectedConversation });
    
    if (selectedConversation) {
      phoneNumber = selectedConversation.customerPhone;
      const platformConvoId = getConversationIdForPlatform(selectedConversation, platform);
      
      console.log('📝 Platform conversation ID:', platformConvoId);
      
      if (!platformConvoId) {
        conversationId = 'pending';
      } else {
        conversationId = platformConvoId;
      }
    } else if (showNewConversation && newPhoneNumber) {
      phoneNumber = newPhoneNumber;
      platform = newPlatform;
      conversationId = 'pending';
    } else {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select a conversation or enter a phone number' });
      return;
    }

    const currentMessage = messageInput.trim();
    const tempId = `temp-${Date.now()}`;
    
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
      
      console.log('🚀 Sending via:', platform);
      
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

      console.log('📬 Send result:', result);

      if (result.success) {
        toast({ title: 'Message sent', description: 'Your message was delivered successfully' });
        
        setTimeout(() => {
          setOptimisticMessages(prev => prev.filter(m => m.id !== tempId));
        }, 1000);

        if (showNewConversation && result.conversationId) {
          setShowNewConversation(false);
        }
      } else {
        throw new Error(result.message || 'Failed to send message');
      }
    } catch (error: any) {
      console.error('❌ Send error:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Failed to send message', 
        description: error.message 
      });
      
      setOptimisticMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setIsSending(false);
    }
  };

  const handleNewConversation = () => {
    setShowNewConversation(true);
    setSelectedConversation(null);
    setShowDiagnostics(false);
    setShowClientProfile(false);
    setNewPhoneNumber('');
    setMessageInput('');
  };

  const handleViewDiagnostics = () => {
    setShowDiagnostics(true);
    setShowNewConversation(false);
    setSelectedConversation(null);
  };

  const handleToggleProfile = () => {
    setShowClientProfile(!showClientProfile);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <h1 className="text-lg font-semibold text-slate-900">Messaging</h1>
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
        <ConversationList
          conversations={filteredConversations}
          selectedConversation={selectedConversation}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          isLoading={isLoadingConversations || isLoadingContacts}
        />

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
                selectedPlatform={selectedPlatform}
                onPlatformChange={handlePlatformChange}
                onToggleProfile={handleToggleProfile}
              />
              <MessagesList 
                messages={messages}
                isLoadingMore={isLoadingMore}
                allMessagesLoaded={allMessagesLoaded}
                onLoadMore={loadMore}
                partnerId={partnerId || ''}
              />
              <MessageInput
                value={messageInput}
                onChange={setMessageInput}
                onSend={handleSendMessage}
                isSending={isSending}
                placeholder={`Send via ${selectedPlatform === 'whatsapp' ? 'WhatsApp' : 'SMS'}...`}
              />
            </>
          ) : (
            <EmptyState onNewConversation={handleNewConversation} />
          )}
        </div>

        {selectedConversation && showClientProfile && partnerId && (
          <ClientProfilePanel 
            conversation={selectedConversation}
            onClose={() => setShowClientProfile(false)}
            partnerId={partnerId}
          />
        )}
      </div>

      <audio ref={audioRef} src="/notification.mp3" />
    </div>
  );
}