"use client";

import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { useUnifiedConversations, UnifiedConversation, Platform } from '@/hooks/useUnifiedConversations';
import { useMetaMessages } from '@/hooks/useMetaWhatsApp';
import { useTelegramMessages } from '@/hooks/useTelegram';
import {
    sendMetaWhatsAppMessageAction,
    deleteMetaConversation,
    deleteMetaMessage
} from '@/actions/meta-whatsapp-actions';
import {
    sendTelegramMessageAction,
    deleteTelegramConversation,
    deleteTelegramMessage,
} from '@/actions/telegram-actions';
import { getEmbeddedSignupStatus } from '@/actions/meta-embedded-signup-actions';
import { getTelegramStatus } from '@/actions/telegram-actions';
import { generateInboxSuggestionAction } from '@/actions/partnerhub-actions';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { UnifiedConversationSidebar } from '@/components/partner/inbox/UnifiedConversationSidebar';
import { UnifiedChatHeader } from '@/components/partner/inbox/UnifiedChatHeader';
import { MessageInput } from '@/components/partner/inbox/MessageInput';
import { UnifiedEmptyState } from '@/components/partner/inbox/UnifiedEmptyState';
import { NewConversationDialog } from '@/components/partner/inbox/NewConversationDialog';
import { UnifiedMessageBubble } from '@/components/partner/inbox/UnifiedMessageBubble';
import CoreMemorySuggestion from '@/components/partner/inbox/CoreMemorySuggestion';
import { Badge } from '@/components/ui/badge';
import { useContacts } from '@/hooks/useContacts';

// CSS Animations for the inbox
const inboxStyles = `
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes fadeSlideUp {
    from {
        opacity: 0;
        transform: translateY(12px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes fadeSlideIn {
    from {
        opacity: 0;
        transform: translateX(-12px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

@keyframes messageSlideIn {
    from {
        opacity: 0;
        transform: translateY(16px) scale(0.97);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

@keyframes subtlePulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
}

@keyframes spinLoader {
    to { transform: rotate(360deg); }
}

@keyframes typingBounce {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-4px); }
}

@keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
}

@keyframes scaleIn {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
}

@keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

.inbox-fade-in {
    animation: fadeIn 0.4s ease-out;
}

.inbox-slide-up {
    animation: fadeSlideUp 0.4s ease-out;
}

.inbox-message-enter {
    animation: messageSlideIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.inbox-scale-in {
    animation: scaleIn 0.3s ease-out;
}

.inbox-typing-dot {
    animation: typingBounce 1.4s infinite;
}

.inbox-typing-dot:nth-child(2) {
    animation-delay: 0.2s;
}

.inbox-typing-dot:nth-child(3) {
    animation-delay: 0.4s;
}

.inbox-shimmer {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
}

.chat-area-gradient {
    background: #f9fafb;
}

.message-container-scroll {
    scroll-behavior: smooth;
}

.message-container-scroll::-webkit-scrollbar {
    width: 6px;
}

.message-container-scroll::-webkit-scrollbar-track {
    background: transparent;
}

.message-container-scroll::-webkit-scrollbar-thumb {
    background: #e0e0e0;
    border-radius: 3px;
}

.message-container-scroll::-webkit-scrollbar-thumb:hover {
    background: #d0d0d0;
}
`;

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
        fromAgent?: string;
    }>;
    personaUsed?: boolean;
    assistantUsed?: {
        id: string;
        name: string;
        avatar: string;
        usedAsFallback: boolean;
    };
    agentUsed?: {
        id: string;
        name: string;
        avatar: string;
        usedAsFallback: boolean;
    };
}

export default function UnifiedInboxPage() {
    const { currentWorkspace, loading: authLoading } = useMultiWorkspaceAuth();
    const currentPartnerId = currentWorkspace?.partnerId;

    const [platformFilter, setPlatformFilter] = useState<Platform | 'all'>('all');
    const { conversations, loading: convsLoading, markAsRead, whatsAppCount, telegramCount } = useUnifiedConversations(currentPartnerId);
    const [selectedConversation, setSelectedConversation] = useState<UnifiedConversation | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [mobileShowChat, setMobileShowChat] = useState(false);
    const [showNewConversationDialog, setShowNewConversationDialog] = useState(false);
    const { contacts, loading: contactsLoading } = useContacts(currentPartnerId);

    // Use appropriate messages hook based on platform
    const { messages: whatsAppMessages, loading: whatsAppMsgsLoading } = useMetaMessages(
        selectedConversation?.platform === 'meta_whatsapp' ? selectedConversation.id : undefined
    );
    const { messages: telegramMessages, loading: telegramMsgsLoading } = useTelegramMessages(
        selectedConversation?.platform === 'telegram' ? selectedConversation.id : undefined
    );

    const messages = selectedConversation?.platform === 'meta_whatsapp' ? whatsAppMessages : telegramMessages;
    const msgsLoading = selectedConversation?.platform === 'meta_whatsapp' ? whatsAppMsgsLoading : telegramMsgsLoading;

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    const [isWhatsAppConnected, setIsWhatsAppConnected] = useState<boolean | null>(null);
    const [isTelegramConnected, setIsTelegramConnected] = useState<boolean | null>(null);
    const [whatsAppStatus, setWhatsAppStatus] = useState<string | null>(null);

    const [messageInput, setMessageInput] = useState('');
    const [sending, setSending] = useState(false);

    const [showAISuggestion, setShowAISuggestion] = useState(false);
    const [aiSuggestion, setAISuggestion] = useState<RAGSuggestion | null>(null);
    const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
    const [pendingIncomingMessage, setPendingIncomingMessage] = useState('');

    const processedMessageIds = useRef<Set<string>>(new Set());
    const lastSuggestionContext = useRef<string>('');
    const suggestionDebounceTimer = useRef<NodeJS.Timeout | null>(null);
    const handleGenerateSuggestionRef = useRef<(incomingMessage?: string, refinementInstruction?: string) => void>();

    useEffect(() => {
        async function checkConnections() {
            if (!currentPartnerId) return;

            try {
                const [waStatus, tgStatus] = await Promise.all([
                    getEmbeddedSignupStatus(currentPartnerId),
                    getTelegramStatus(currentPartnerId),
                ]);

                setIsWhatsAppConnected(waStatus.connected);
                setWhatsAppStatus(waStatus.config?.status || null);
                setIsTelegramConnected(tgStatus.connected);
            } catch (err) {
                console.error('Error checking connections:', err);
            }
        }

        checkConnections();
    }, [currentPartnerId]);



    const isInitialLoad = useRef(true);
    const prevMessagesLength = useRef(0);

    useLayoutEffect(() => {
        if (messagesContainerRef.current && messages.length > 0) {
            const container = messagesContainerRef.current;
            const isNewMessage = messages.length > prevMessagesLength.current && !isInitialLoad.current;

            if (isNewMessage) {
                container.scrollTo({
                    top: container.scrollHeight,
                    behavior: 'smooth'
                });
            } else {
                container.scrollTop = container.scrollHeight;
            }

            prevMessagesLength.current = messages.length;
            isInitialLoad.current = false;
        }
    }, [messages]);

    useEffect(() => {
        isInitialLoad.current = true;
        prevMessagesLength.current = 0;
    }, [selectedConversation?.id]);

    const filteredConversations = React.useMemo(() => {
        let filtered = conversations;

        if (platformFilter !== 'all') {
            filtered = filtered.filter(c => c.platform === platformFilter);
        }

        if (!searchQuery.trim()) return filtered;

        const lowerQ = searchQuery.toLowerCase();
        return filtered.filter(c =>
            c.title.toLowerCase().includes(lowerQ) ||
            c.customerIdentifier.includes(lowerQ) ||
            c.lastMessagePreview?.toLowerCase().includes(lowerQ) ||
            c.contactName?.toLowerCase().includes(lowerQ) ||
            c.contactEmail?.toLowerCase().includes(lowerQ)
        );
    }, [conversations, searchQuery, platformFilter]);

    const handleSelectConversation = useCallback((conv: UnifiedConversation) => {
        setSelectedConversation(conv);
        setMobileShowChat(true);
        setShowAISuggestion(false);
        setAISuggestion(null);
        setPendingIncomingMessage('');
        processedMessageIds.current.clear();

        if (conv.unreadCount > 0 && currentPartnerId) {
            markAsRead(conv.id, conv.platform);
        }
    }, [currentPartnerId, markAsRead]);

    const handleMobileBack = useCallback(() => {
        setMobileShowChat(false);
    }, []);

    useEffect(() => {
        if (!messages || messages.length === 0) return;

        const latestMessage = messages[messages.length - 1];
        if (!latestMessage || latestMessage.direction !== 'inbound') return;

        const messageId = latestMessage.id;
        if (processedMessageIds.current.has(messageId)) return;

        const currentContext = `${selectedConversation?.id}-${latestMessage.content}`;
        if (lastSuggestionContext.current === currentContext) return;

        console.log('New inbound message detected, triggering AI suggestion');
        processedMessageIds.current.add(messageId);
        lastSuggestionContext.current = currentContext;

        if (suggestionDebounceTimer.current) {
            clearTimeout(suggestionDebounceTimer.current);
        }

        const messageContent = latestMessage.content;
        suggestionDebounceTimer.current = setTimeout(() => {
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
        if (!textOverride) setMessageInput('');

        try {
            let result;

            if (selectedConversation.platform === 'meta_whatsapp' && selectedConversation.whatsAppData) {
                const formattedText = markdownToWhatsApp(textToSend);
                result = await sendMetaWhatsAppMessageAction({
                    partnerId: currentPartnerId,
                    to: selectedConversation.whatsAppData.customerPhone,
                    message: formattedText,
                    conversationId: selectedConversation.id,
                });
            } else if (selectedConversation.platform === 'telegram' && selectedConversation.telegramData) {
                result = await sendTelegramMessageAction({
                    partnerId: currentPartnerId,
                    chatId: selectedConversation.telegramData.chatId,
                    message: textToSend,
                    conversationId: selectedConversation.id,
                });
            }

            if (result?.success) {
                setShowAISuggestion(false);
                setAISuggestion(null);
            } else {
                toast.error(result?.message || 'Failed to send message');
                if (!textOverride) setMessageInput(textToSend);
            }
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || 'Failed to send message');
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
            let result;

            if (selectedConversation.platform === 'meta_whatsapp' && selectedConversation.whatsAppData) {
                result = await sendMetaWhatsAppMessageAction({
                    partnerId: currentPartnerId,
                    to: selectedConversation.whatsAppData.customerPhone,
                    message: caption,
                    mediaUrl,
                    mediaType,
                    filename,
                    conversationId: selectedConversation.id,
                });
            } else if (selectedConversation.platform === 'telegram' && selectedConversation.telegramData) {
                result = await sendTelegramMessageAction({
                    partnerId: currentPartnerId,
                    chatId: selectedConversation.telegramData.chatId,
                    message: caption,
                    mediaUrl,
                    mediaType: mediaType === 'image' ? 'photo' : mediaType,
                    filename,
                    conversationId: selectedConversation.id,
                });
            }

            if (result?.success) {
                setShowAISuggestion(false);
                setAISuggestion(null);
                toast.success(`${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} sent`);
            } else {
                toast.error(result?.message || `Failed to send ${mediaType}`);
            }
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || `Failed to send ${mediaType}`);
        } finally {
            setSending(false);
        }
    };



    const handleGenerateSuggestion = async (
        incomingMessage?: string,
        refinementInstruction?: string
    ) => {
        if (!currentPartnerId || !selectedConversation) return;

        const messageToAnalyze = incomingMessage || pendingIncomingMessage || messages[messages.length - 1]?.content || "Hello";

        if (!refinementInstruction) {
            setPendingIncomingMessage(messageToAnalyze);
            setAISuggestion(null);
        }

        setShowAISuggestion(true);
        setIsLoadingSuggestion(true);

        try {
            let context = messages.slice(-5).map((m: any) => `${m.direction}: ${m.content}`).join('\n');

            if (refinementInstruction) {
                context += `\n\n[SYSTEM INSTRUCTION: The user wants to refine the previous suggestion. ${refinementInstruction}]`;
            }

            const result = await generateInboxSuggestionAction(
                currentPartnerId,
                messageToAnalyze,
                context,
                selectedConversation?.contactId,
                [] // No agent selection - use all documents
            );

            if (result.success && result.suggestedReply) {
                setAISuggestion({
                    suggestedReply: result.suggestedReply,
                    confidence: result.confidence || 0.85,
                    reasoning: result.reasoning || 'Generated based on your business documents and conversation history.',
                    sources: (result.sources || []).map((s: any) => ({ ...s, type: 'document' as const, excerpt: s.excerpt || '' })),
                    personaUsed: result.personaUsed,
                    assistantUsed: result.assistantUsed,
                    agentUsed: result.assistantUsed
                });
            } else {
                toast.error(result.message || "Failed to generate suggestion");
                if (!refinementInstruction) setShowAISuggestion(false);
            }
        } catch (e: any) {
            console.error('AI suggestion error:', e);
            toast.error("AI Generation failed");
            if (!refinementInstruction) setShowAISuggestion(false);
        } finally {
            setIsLoadingSuggestion(false);
        }
    };

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
            let result;

            if (selectedConversation.platform === 'meta_whatsapp') {
                result = await deleteMetaConversation(currentPartnerId, selectedConversation.id);
            } else {
                result = await deleteTelegramConversation(currentPartnerId, selectedConversation.id);
            }

            if (result.success) {
                toast.success("Conversation deleted");
                setSelectedConversation(null);
                setMobileShowChat(false);
            } else {
                toast.error(result.message || "Failed to delete");
            }
        } catch (e: any) {
            toast.error(e.message || "Delete failed");
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        if (!currentPartnerId || !selectedConversation) return;
        if (!confirm("Delete this message?")) return;

        try {
            let result;

            if (selectedConversation.platform === 'meta_whatsapp') {
                result = await deleteMetaMessage(currentPartnerId, messageId);
            } else {
                result = await deleteTelegramMessage(currentPartnerId, messageId);
            }

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

        const tempConversationId = `temp_${Date.now()}`;
        const tempConversation: UnifiedConversation = {
            id: tempConversationId,
            partnerId: currentPartnerId,
            platform: 'meta_whatsapp',
            customerIdentifier: phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`,
            customerName: contactName,
            title: contactName || `WhatsApp: ${phoneNumber}`,
            isActive: true,
            messageCount: 0,
            unreadCount: 0,
            lastMessageAt: new Date(),
            createdAt: new Date(),
            whatsAppData: {
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
            },
        };

        setSelectedConversation(tempConversation);
        setMobileShowChat(true);
        toast.success('Conversation started. Send a message to begin chatting.');
    };

    if (authLoading || convsLoading) {
        return (
            <>
                <style dangerouslySetInnerHTML={{ __html: inboxStyles }} />
                <div className="flex items-center justify-center h-full bg-gray-50">
                    <div className="flex flex-col items-center gap-4 inbox-fade-in">
                        <div className="w-12 h-12 rounded-xl bg-[#111] flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-700">Loading inbox</p>
                            <p className="text-xs text-gray-400 mt-1">Fetching your conversations...</p>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: inboxStyles }} />
            <div className="h-full flex bg-gray-50 overflow-hidden inbox-fade-in">
                <div className={cn(
                    "md:block",
                    mobileShowChat ? "hidden" : "block w-full md:w-auto"
                )}>
                    <UnifiedConversationSidebar
                        conversations={filteredConversations}
                        selectedId={selectedConversation?.id || null}
                        onSelect={handleSelectConversation}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        loading={convsLoading}
                        isMobile={!mobileShowChat}
                        onNewConversation={() => setShowNewConversationDialog(true)}
                        platformFilter={platformFilter}
                        onPlatformFilterChange={setPlatformFilter}
                        whatsAppCount={whatsAppCount}
                        telegramCount={telegramCount}
                    />
                </div>

                {!selectedConversation ? (
                    <div className={cn(
                        "flex-1",
                        mobileShowChat ? "hidden md:flex" : "hidden md:flex"
                    )}>
                        <UnifiedEmptyState
                            isWhatsAppConnected={isWhatsAppConnected}
                            isTelegramConnected={isTelegramConnected}
                            whatsAppStatus={whatsAppStatus}
                        />
                    </div>
                ) : (
                    <div className={cn(
                        "flex-1 flex min-w-0",
                        mobileShowChat ? "flex" : "hidden md:flex"
                    )}>
                        <div className="flex-1 flex flex-col min-w-0 bg-white md:border-x border-gray-100/80 shadow-sm">
                            <UnifiedChatHeader
                                conversation={selectedConversation}
                                onDelete={handleDeleteConversation}
                                onBack={handleMobileBack}
                            />

                            <div
                                ref={messagesContainerRef}
                                className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 md:px-6 py-4 chat-area-gradient message-container-scroll"
                                style={{ WebkitOverflowScrolling: 'touch' }}
                            >
                                {msgsLoading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="flex flex-col items-center gap-3 inbox-fade-in">
                                            <div className="flex gap-1.5">
                                                <div className="w-2 h-2 rounded-full bg-gray-400 inbox-typing-dot" />
                                                <div className="w-2 h-2 rounded-full bg-gray-400 inbox-typing-dot" />
                                                <div className="w-2 h-2 rounded-full bg-gray-400 inbox-typing-dot" />
                                            </div>
                                            <p className="text-xs text-gray-400">Loading messages</p>
                                        </div>
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex items-center justify-center h-full inbox-slide-up">
                                        <div className="text-center">
                                            <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gray-100 flex items-center justify-center">
                                                <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                </svg>
                                            </div>
                                            <Badge variant="outline" className="mb-3 bg-white text-gray-500 border-gray-200">No messages yet</Badge>
                                            <p className="text-gray-400 text-sm">Start the conversation by typing a message below.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="chat-messages-container">
                                        <div className="chat-messages-wrapper space-y-3 md:space-y-4">
                                            {messages.map((msg: any, index: number) => (
                                                <UnifiedMessageBubble
                                                    key={msg.id}
                                                    message={msg}
                                                    platform={selectedConversation.platform}
                                                    onDelete={handleDeleteMessage}
                                                    isLatest={index === messages.length - 1}
                                                />
                                            ))}
                                            <div ref={messagesEndRef} className="h-1" />
                                        </div>
                                    </div>
                                )}
                            </div>

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
                        />
                    </div>
                )}

                <NewConversationDialog
                    open={showNewConversationDialog}
                    onOpenChange={setShowNewConversationDialog}
                    onStartConversation={handleStartNewConversation}
                    contacts={contacts}
                    contactsLoading={contactsLoading}
                />
            </div>
        </>
    );
}
