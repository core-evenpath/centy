"use client";

import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { useEnrichedMetaConversations, EnrichedMetaConversation } from '@/hooks/useEnrichedMetaConversations';
import { useMetaMessages } from '@/hooks/useMetaWhatsApp';
import {
    sendMetaWhatsAppMessageAction,
    deleteMetaConversation,
    deleteMetaMessage,
    updateConversationAssistantsAction
} from '@/actions/meta-whatsapp-actions';
import { getEmbeddedSignupStatus } from '@/actions/meta-embedded-signup-actions';
import { generateInboxSuggestionAction } from '@/actions/partnerhub-actions';
import { getActiveAssistantsAction } from '@/actions/assistant-actions';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { ConversationSidebar } from '@/components/partner/inbox/ConversationSidebar';
import { ChatHeader } from '@/components/partner/inbox/ChatHeader';
import { MessageInput } from '@/components/partner/inbox/MessageInput';
import { EmptyState } from '@/components/partner/inbox/EmptyState';
import { NewConversationDialog } from '@/components/partner/inbox/NewConversationDialog';
import { MessageBubble } from '@/components/partner/chatspace/MessageBubble';
import CoreMemorySuggestion from '@/components/partner/inbox/CoreMemorySuggestion';
import { Badge } from '@/components/ui/badge';
import { useContacts } from '@/hooks/useContacts';

import type { MetaWhatsAppMessage } from '@/lib/types-meta-whatsapp';

interface RAGSuggestion {
    suggestedReply: string;
    confidence: number;
    reasoning: string;
    sources: Array<{
        type: 'conversation' | 'document';
        name: string;
        excerpt: string;
        relevance: number;
        fromAssistant?: string;
    }>;
    personaUsed?: boolean;
    assistantUsed?: {
        id: string;
        name: string;
        avatar: string;
        usedAsFallback: boolean;
    };
}

export default function InboxPage() {
    const { currentWorkspace, loading: authLoading } = useMultiWorkspaceAuth();
    const currentPartnerId = currentWorkspace?.partnerId;

    const { conversations, loading: convsLoading, markAsRead } = useEnrichedMetaConversations(currentPartnerId);
    const [selectedConversation, setSelectedConversation] = useState<EnrichedMetaConversation | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Mobile view state - show chat view when conversation is selected on mobile
    const [mobileShowChat, setMobileShowChat] = useState(false);

    // New conversation dialog state
    const [showNewConversationDialog, setShowNewConversationDialog] = useState(false);
    const { contacts, loading: contactsLoading } = useContacts(currentPartnerId);

    const { messages, loading: msgsLoading } = useMetaMessages(selectedConversation?.id);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    const [isWhatsAppConnected, setIsWhatsAppConnected] = useState<boolean | null>(null);
    const [whatsAppStatus, setWhatsAppStatus] = useState<string | null>(null);

    const [activeAssistants, setActiveAssistants] = useState<any[]>([]);
    const [assistantsLoading, setAssistantsLoading] = useState(false);
    const [selectedAssistantIds, setSelectedAssistantIds] = useState<string[]>([]);
    const previousAssistantIdsRef = useRef<string[]>([]);

    const [showAISuggestion, setShowAISuggestion] = useState(false);
    const [aiSuggestion, setAISuggestion] = useState<RAGSuggestion | null>(null);
    const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
    const [pendingIncomingMessage, setPendingIncomingMessage] = useState('');

    const processedMessageIds = useRef<Set<string>>(new Set());
    const lastSuggestionContext = useRef<string>('');
    const suggestionDebounceTimer = useRef<NodeJS.Timeout | null>(null);
    const assistantChangeTimer = useRef<NodeJS.Timeout | null>(null);

    // Ref to store the latest handleGenerateSuggestion function to avoid stale closures
    const handleGenerateSuggestionRef = useRef<(incomingMessage?: string, refinementInstruction?: string) => void>();

    const [messageInput, setMessageInput] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (currentPartnerId) {
            getEmbeddedSignupStatus(currentPartnerId).then(status => {
                setIsWhatsAppConnected(status.connected);
                setWhatsAppStatus(status.config?.status || null);
            });

            setAssistantsLoading(true);
            getActiveAssistantsAction(currentPartnerId).then(res => {
                if (res.success && res.assistants) {
                    setActiveAssistants(res.assistants);
                }
                setAssistantsLoading(false);
            });
        }
    }, [currentPartnerId]);

    useEffect(() => {
        if (selectedConversation && activeAssistants.length > 0) {
            const storedIds = selectedConversation.assignedAssistantIds || [];
            const validIds = storedIds.filter(id => activeAssistants.some(a => a.id === id));
            setSelectedAssistantIds(validIds);
            previousAssistantIdsRef.current = validIds;
        } else {
            setSelectedAssistantIds([]);
            previousAssistantIdsRef.current = [];
        }
    }, [selectedConversation?.id, activeAssistants]);

    // Track if this is initial load vs new message
    const isInitialLoad = useRef(true);
    const prevMessagesLength = useRef(0);

    // Scroll to bottom when messages change - instant on load, smooth for new messages
    useLayoutEffect(() => {
        if (messagesContainerRef.current && messages.length > 0) {
            const container = messagesContainerRef.current;
            // Use instant scroll on initial load to avoid visible scrolling
            // Use smooth scroll only for new messages after initial load
            const isNewMessage = messages.length > prevMessagesLength.current && !isInitialLoad.current;

            if (isNewMessage) {
                // Smooth scroll for new messages
                container.scrollTo({
                    top: container.scrollHeight,
                    behavior: 'smooth'
                });
            } else {
                // Instant scroll on initial load - no visible scrolling
                container.scrollTop = container.scrollHeight;
            }

            prevMessagesLength.current = messages.length;
            isInitialLoad.current = false;
        }
    }, [messages]);

    // Reset initial load flag when conversation changes
    useEffect(() => {
        isInitialLoad.current = true;
        prevMessagesLength.current = 0;
    }, [selectedConversation?.id]);

    // Handle conversation selection with mobile view toggle
    const handleSelectConversation = useCallback((conversation: EnrichedMetaConversation) => {
        setSelectedConversation(conversation);
        setMobileShowChat(true);
    }, []);

    // Handle back button on mobile
    const handleMobileBack = useCallback(() => {
        setMobileShowChat(false);
    }, []);

    useEffect(() => {
        if (selectedConversation && selectedConversation.unreadCount > 0) {
            markAsRead(selectedConversation.id);
        }
    }, [selectedConversation, markAsRead]);

    useEffect(() => {
        if (!messages || messages.length === 0) return;

        const latestMessage = messages[messages.length - 1];
        if (!latestMessage || latestMessage.direction !== 'inbound') return;

        const messageId = latestMessage.id;
        if (processedMessageIds.current.has(messageId)) return;

        const currentContext = `${selectedConversation?.id}-${latestMessage.content}`;
        if (lastSuggestionContext.current === currentContext) return;

        console.log('🔔 New inbound message detected, triggering AI suggestion');
        processedMessageIds.current.add(messageId);
        lastSuggestionContext.current = currentContext;

        if (suggestionDebounceTimer.current) {
            clearTimeout(suggestionDebounceTimer.current);
        }

        // Capture the message content to use in the timeout
        const messageContent = latestMessage.content;
        suggestionDebounceTimer.current = setTimeout(() => {
            // Use ref to get the latest function and avoid stale closures
            handleGenerateSuggestionRef.current?.(messageContent);
        }, 300);

        return () => {
            if (suggestionDebounceTimer.current) {
                clearTimeout(suggestionDebounceTimer.current);
            }
        };
    }, [messages, selectedConversation?.id]);

    useEffect(() => {
        processedMessageIds.current.clear();
        lastSuggestionContext.current = '';
        setShowAISuggestion(false);
        setAISuggestion(null);
        setPendingIncomingMessage('');
        setMessageInput('');
    }, [selectedConversation?.id]);

    const handleAssistantSelectionChange = useCallback(async (ids: string[]) => {
        const previousIds = previousAssistantIdsRef.current;
        setSelectedAssistantIds(ids);
        previousAssistantIdsRef.current = ids;

        if (currentPartnerId && selectedConversation) {
            const result = await updateConversationAssistantsAction(currentPartnerId, selectedConversation.id, ids);
            if (!result.success) {
                toast.error("Failed to save assistant selection");
                setSelectedAssistantIds(previousIds);
                previousAssistantIdsRef.current = previousIds;
                return;
            }
        }

        const hasChanged = JSON.stringify(previousIds.sort()) !== JSON.stringify(ids.sort());

        if (hasChanged && showAISuggestion && pendingIncomingMessage) {
            if (assistantChangeTimer.current) {
                clearTimeout(assistantChangeTimer.current);
            }

            assistantChangeTimer.current = setTimeout(() => {
                console.log('🔄 Assistant selection changed, regenerating suggestion...');
                handleGenerateSuggestionWithIds(pendingIncomingMessage, undefined, ids);
            }, 500);
        }
    }, [currentPartnerId, selectedConversation, showAISuggestion, pendingIncomingMessage]);

    const markdownToWhatsApp = useCallback((text: string): string => {
        let formatted = text;
        formatted = formatted.replace(/^#+\s+(.*)$/gm, '*$1*');
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '*$1*');
        formatted = formatted.replace(/__(.*?)__/g, '*$1*');
        formatted = formatted.replace(/(?<!\w)_([^*\n]+?)_(?!\w)/g, '_$1_');
        formatted = formatted.replace(/~~(.*?)~~/g, '~$1~');
        formatted = formatted.replace(/`([^`]+)`/g, '```$1```');
        return formatted;
    }, []);

    const handleSendMessage = async (textOverride?: string) => {
        const textToSend = textOverride || messageInput.trim();
        if (!textToSend || !selectedConversation || !currentPartnerId) return;

        setSending(true);
        const formattedText = markdownToWhatsApp(textToSend);
        if (!textOverride) setMessageInput('');

        try {
            await sendMetaWhatsAppMessageAction({
                partnerId: currentPartnerId,
                to: selectedConversation.customerPhone,
                message: formattedText,
                conversationId: selectedConversation.id
            });
            setShowAISuggestion(false);
            setAISuggestion(null);
        } catch (err) {
            console.error(err);
            toast.error("Failed to send message");
            if (!textOverride) setMessageInput(textToSend);
        } finally {
            setSending(false);
        }
    };

    const handleSendMedia = async (
        mediaUrl: string,
        mediaType: 'image' | 'video' | 'audio' | 'document',
        caption?: string,
        filename?: string
    ) => {
        if (!selectedConversation || !currentPartnerId) return;

        setSending(true);

        try {
            await sendMetaWhatsAppMessageAction({
                partnerId: currentPartnerId,
                to: selectedConversation.customerPhone,
                message: caption,
                mediaUrl,
                mediaType,
                filename,
                conversationId: selectedConversation.id
            });
            setShowAISuggestion(false);
            setAISuggestion(null);
            toast.success(`${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} sent`);
        } catch (err) {
            console.error(err);
            toast.error(`Failed to send ${mediaType}`);
        } finally {
            setSending(false);
        }
    };

    const handleGenerateSuggestionWithIds = async (
        incomingMessage?: string,
        refinementInstruction?: string,
        assistantIds?: string[]
    ) => {
        if (!currentPartnerId || !selectedConversation) return;

        const messageToAnalyze = incomingMessage || pendingIncomingMessage || messages[messages.length - 1]?.content || "Hello";
        const idsToUse = assistantIds ?? selectedAssistantIds;

        if (!refinementInstruction) {
            setPendingIncomingMessage(messageToAnalyze);
            setAISuggestion(null);
        }

        setShowAISuggestion(true);
        setIsLoadingSuggestion(true);

        try {
            console.log('⚡ Core Memory RAG starting...', { assistantIds: idsToUse });

            let context = messages.slice(-5).map(m => `${m.direction}: ${m.content}`).join('\n');

            if (refinementInstruction) {
                context += `\n\n[SYSTEM INSTRUCTION: The user wants to refine the previous suggestion. ${refinementInstruction}]`;
            }

            const result = await generateInboxSuggestionAction(
                currentPartnerId,
                messageToAnalyze,
                context,
                selectedConversation?.contactId,
                idsToUse
            );

            if (result.success && result.suggestedReply) {
                setAISuggestion({
                    suggestedReply: result.suggestedReply,
                    confidence: result.confidence || 0.85,
                    reasoning: result.reasoning || 'Generated based on your business documents and conversation history.',
                    sources: (result.sources || []).map(s => ({ ...s, type: 'document' as const, excerpt: s.excerpt || '' })),
                    personaUsed: result.personaUsed,
                    assistantUsed: result.assistantUsed
                });
            } else {
                toast.error(result.message || "Failed to generate suggestion");
                if (!refinementInstruction) setShowAISuggestion(false);
            }
        } catch (e: any) {
            console.error('❌ AI suggestion error:', e);
            toast.error("AI Generation failed");
            if (!refinementInstruction) setShowAISuggestion(false);
        } finally {
            setIsLoadingSuggestion(false);
        }
    };

    const handleGenerateSuggestion = (incomingMessage?: string, refinementInstruction?: string) => {
        handleGenerateSuggestionWithIds(incomingMessage, refinementInstruction, selectedAssistantIds);
    };

    // Keep the ref updated with the latest handleGenerateSuggestion function
    useEffect(() => {
        handleGenerateSuggestionRef.current = handleGenerateSuggestion;
    });

    const handleRefineSuggestion = (instruction: string) => {
        handleGenerateSuggestion(undefined, instruction);
    };

    const handleDeleteConversation = async () => {
        if (!selectedConversation || !currentPartnerId) return;
        if (!confirm("Are you sure you want to delete this conversation? This cannot be undone.")) return;

        try {
            const result = await deleteMetaConversation(currentPartnerId, selectedConversation.id);
            if (result.success) {
                toast.success("Conversation deleted");
                setSelectedConversation(null);
            } else {
                toast.error(result.message || "Failed to delete");
            }
        } catch (e: any) {
            toast.error(e.message || "Delete failed");
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        if (!currentPartnerId) return;
        if (!confirm("Delete this message?")) return;

        try {
            const result = await deleteMetaMessage(currentPartnerId, messageId);
            if (result.success) {
                toast.success("Message deleted");
            } else {
                toast.error(result.message || "Failed to delete");
            }
        } catch (e: any) {
            toast.error(e.message || "Delete failed");
        }
    };

    const handleStartNewConversation = async (phoneNumber: string, contactName?: string) => {
        if (!currentPartnerId) {
            throw new Error('Partner not available');
        }

        if (!isWhatsAppConnected) {
            if (whatsAppStatus === 'pending') {
                throw new Error('WhatsApp setup is incomplete. Please go to Apps → WhatsApp API and click "Activate Connection" to complete the setup.');
            }
            throw new Error('WhatsApp is not connected. Please set up WhatsApp integration in Apps → WhatsApp API.');
        }

        // Create a temporary conversation object to show immediately
        const tempConversationId = `temp_${Date.now()}`;
        const tempConversation: EnrichedMetaConversation = {
            id: tempConversationId,
            partnerId: currentPartnerId,
            platform: 'meta_whatsapp',
            customerPhone: phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`,
            customerWaId: phoneNumber.replace(/\D/g, ''),
            phoneNumberId: '',
            type: 'direct',
            title: `WhatsApp: ${phoneNumber}`,
            customerName: contactName,
            isActive: true,
            messageCount: 0,
            unreadCount: 0,
            lastMessageAt: new Date(),
            createdAt: new Date(),
        };

        // Select the temp conversation
        setSelectedConversation(tempConversation);
        setMobileShowChat(true);

        toast.success('Conversation started. Send a message to begin chatting.');
    };

    if (authLoading || convsLoading) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-50/50">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    <p className="text-sm text-gray-500">Loading inbox...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex bg-gray-50/30 overflow-hidden">
            {/* Conversation Sidebar - hidden on mobile when chat is open */}
            <div className={cn(
                "md:block",
                mobileShowChat ? "hidden" : "block w-full md:w-auto"
            )}>
                <ConversationSidebar
                    conversations={conversations}
                    selectedId={selectedConversation?.id || null}
                    onSelect={handleSelectConversation}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    loading={convsLoading}
                    isMobile={!mobileShowChat}
                    onNewConversation={() => setShowNewConversationDialog(true)}
                />
            </div>

            {/* Empty state or Chat view with AI Panel */}
            {!selectedConversation ? (
                <div className={cn(
                    "flex-1",
                    mobileShowChat ? "hidden md:flex" : "hidden md:flex"
                )}>
                    <EmptyState isWhatsAppConnected={isWhatsAppConnected} whatsAppStatus={whatsAppStatus} />
                </div>
            ) : (
                <div className={cn(
                    "flex-1 flex min-w-0",
                    mobileShowChat ? "flex" : "hidden md:flex"
                )}>
                    {/* Chat Column */}
                    <div className="flex-1 flex flex-col min-w-0 bg-white md:border-x border-gray-100">
                        {/* Chat Header - Fixed at top */}
                        <ChatHeader
                            conversation={selectedConversation}
                            isWhatsAppConnected={isWhatsAppConnected}
                            onDelete={handleDeleteConversation}
                            onBack={handleMobileBack}
                        />

                        {/* Messages Area - Scrollable, takes remaining space */}
                        <div
                            ref={messagesContainerRef}
                            className="flex-1 overflow-y-auto overscroll-contain px-4 md:px-6 py-4"
                            style={{ WebkitOverflowScrolling: 'touch' }}
                        >
                            {msgsLoading ? (
                                <div className="flex items-center justify-center h-full">
                                    <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <Badge variant="outline" className="mb-4 bg-gray-50 text-gray-400 border-dashed">No messages yet</Badge>
                                        <p className="text-gray-400 text-sm">Start the conversation by typing a message below.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="chat-messages-container">
                                    <div className="chat-messages-wrapper space-y-4 md:space-y-6">
                                        {messages.map((msg: MetaWhatsAppMessage) => (
                                            <MessageBubble
                                                key={msg.id}
                                                message={msg}
                                                onDelete={handleDeleteMessage}
                                            />
                                        ))}
                                        <div ref={messagesEndRef} className="h-1" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Message Input - Fixed at bottom */}
                        <div className="shrink-0">
                            <MessageInput
                                value={messageInput}
                                onChange={setMessageInput}
                                onSend={() => handleSendMessage()}
                                onSendMedia={handleSendMedia}
                                onGenerateSuggestion={() => handleGenerateSuggestion()}
                                isGenerating={isLoadingSuggestion}
                                sending={sending}
                                partnerId={currentPartnerId}
                            />
                        </div>
                    </div>

                    {/* AI Suggestion Panel - Side panel on desktop, bottom sheet on mobile */}
                    <CoreMemorySuggestion
                        suggestion={aiSuggestion}
                        isLoading={isLoadingSuggestion}
                        isVisible={showAISuggestion}
                        onEdit={(text) => {
                            setMessageInput(text);
                            setShowAISuggestion(false);
                            setAISuggestion(null);
                        }}
                        onSend={(text) => {
                            handleSendMessage(text);
                        }}
                        onDismiss={() => {
                            setShowAISuggestion(false);
                            setAISuggestion(null);
                            setPendingIncomingMessage('');
                        }}
                        onRegenerate={() => handleGenerateSuggestion()}
                        onRefine={handleRefineSuggestion}
                        incomingMessage={pendingIncomingMessage}
                        activeAssistants={activeAssistants}
                        selectedAssistantIds={selectedAssistantIds}
                        onAssistantSelectionChange={handleAssistantSelectionChange}
                        assistantsLoading={assistantsLoading}
                    />
                </div>
            )}

            {/* New Conversation Dialog */}
            <NewConversationDialog
                open={showNewConversationDialog}
                onOpenChange={setShowNewConversationDialog}
                onStartConversation={handleStartNewConversation}
                contacts={contacts}
                contactsLoading={contactsLoading}
            />
        </div>
    );
}