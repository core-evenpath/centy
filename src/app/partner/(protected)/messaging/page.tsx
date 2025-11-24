"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { useToast } from '@/hooks/use-toast';

import { useConversations } from '@/hooks/useConversations';
import { useEnrichedConversations } from '@/hooks/useEnrichedConversations';
import { useNotifications } from '@/hooks/useNotifications';

import ConversationList from '@/components/partner/messaging/ConversationList';
import NewConversationForm from '@/components/partner/messaging/NewConversationForm';
import EmptyState from '@/components/partner/messaging/EmptyState';
import DiagnosticsView from '@/components/partner/messaging/DiagnosticsView';
import ClientProfilePanel from '@/components/partner/messaging/ClientProfilePanel';
import ChatArea from '@/components/partner/messaging/ChatArea';

type Platform = 'sms' | 'whatsapp';

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
  const [notificationSound, setNotificationSound] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

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

  const handleSelectConversation = (conversation: SimpleConversation) => {
    console.log('📱 Selecting conversation:', conversation.id);
    setSelectedConversation(conversation);
    setShowNewConversation(false);
    setShowDiagnostics(false);
    setShowClientProfile(false);
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
            <ChatArea
              partnerId={partnerId}
              conversation={selectedConversation}
              onViewProfile={() => setShowClientProfile(true)}
            />
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