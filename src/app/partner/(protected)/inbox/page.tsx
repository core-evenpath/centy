"use client";

import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { useRouter } from 'next/navigation';
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
/* Base font stack for better typography */
.inbox-container {
    font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

/* Keyframe Animations */
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes fadeSlideUp {
    from {
        opacity: 0;
        transform: translateY(16px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes fadeSlideIn {
    from {
        opacity: 0;
        transform: translateX(-16px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

@keyframes messageSlideIn {
    from {
        opacity: 0;
        transform: translateY(20px) scale(0.95);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

@keyframes subtlePulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.05); }
}

@keyframes spinLoader {
    to { transform: rotate(360deg); }
}

@keyframes typingBounce {
    0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
    30% { transform: translateY(-6px); opacity: 1; }
}

@keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
}

@keyframes scaleIn {
    from { transform: scale(0.9); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
}

@keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

@keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
}

@keyframes gentlePulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.1); }
    50% { box-shadow: 0 0 0 8px rgba(0, 0, 0, 0); }
}

@keyframes badgePop {
    from { transform: scale(0); }
    to { transform: scale(1); }
}

/* Animation Classes */
.inbox-fade-in {
    animation: fadeIn 0.5s ease-out;
}

.inbox-slide-up {
    animation: fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.inbox-slide-in {
    animation: fadeSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.inbox-message-enter {
    animation: messageSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.inbox-scale-in {
    animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.inbox-typing-dot {
    animation: typingBounce 1.4s infinite ease-in-out;
}

.inbox-typing-dot:nth-child(2) {
    animation-delay: 0.15s;
}

.inbox-typing-dot:nth-child(3) {
    animation-delay: 0.3s;
}

.inbox-shimmer {
    background: linear-gradient(90deg, #f5f5f5 25%, #eaeaea 50%, #f5f5f5 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite linear;
}

.inbox-float {
    animation: float 3s ease-in-out infinite;
}

.inbox-pulse {
    animation: gentlePulse 2s infinite;
}

/* Chat Area */
.chat-area-gradient {
    background: linear-gradient(180deg, #fafafa 0%, #f5f5f5 100%);
}

/* Custom Scrollbar */
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
    background: rgba(0, 0, 0, 0.1);
    border-radius: 3px;
}

.message-container-scroll::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.2);
}

/* Staggered animation for list items */
.inbox-list-item {
    opacity: 0;
    animation: fadeSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* Interactive hover effects */
.inbox-interactive {
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.inbox-interactive:hover {
    transform: translateY(-1px);
}

.inbox-interactive:active {
    transform: scale(0.98);
}

/* Button press effect */
button:active {
    transform: scale(0.97);
}
`;

interface RAGSuggestion {
    suggestedReply: string;
    confidence: number;
    reasoning: string;
    sources: Array<{
        type: 'document' | 'module' | 'profile';
        name: string;
        excerpt: string;
        relevance: number;
    }>;
    inlineContent?: Array<{
        type: 'product' | 'document' | 'image';
        position: 'before' | 'after' | 'inline';
        data: any;
    }>;
    personaUsed?: boolean;
    assistantUsed?: any;
}

export default function UnifiedInboxPage() {
    const { currentWorkspace, loading: authLoading } = useMultiWorkspaceAuth();
    const currentPartnerId = currentWorkspace?.partnerId;
    const router = useRouter();

    const handleRefreshBusinessData = useCallback(() => {
        router.refresh();
        toast.success('Refreshing data...');
    }, [router]);

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
    const [suggestionAvailableProducts, setSuggestionAvailableProducts] = useState<any[]>([]);

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
            const result = await generateInboxSuggestionAction(
                currentPartnerId,
                messageToAnalyze,
                selectedConversation.id,
                selectedConversation.contactId
            );

            if (result.success && result.suggestedReply) {
                let reply = result.suggestedReply;
                if (refinementInstruction) {
                    // Refinement logic would ideally be handled on the server, 
                    // but for now we follow the existing pattern if refinement is triggered.
                    // Note: generateInboxSuggestionAction already builds fresh context.
                }

                setAISuggestion({
                    suggestedReply: reply,
                    confidence: result.confidence || 0.85,
                    reasoning: result.reasoning || 'Based on business profile and documents.',
                    sources: result.sources || [],
                    inlineContent: result.inlineContent,
                    personaUsed: result.personaUsed
                });
                setSuggestionAvailableProducts(result.availableProducts || []);
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
                <div className="inbox-container flex items-center justify-center h-full bg-[#fafafa]">
                    <div className="flex flex-col items-center gap-5 inbox-fade-in">
                        <div className="relative">
                            <div className="w-14 h-14 rounded-2xl bg-[#000] flex items-center justify-center inbox-pulse">
                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-[15px] font-semibold text-[#000] tracking-[-0.3px]">Loading inbox</p>
                            <p className="text-[13px] text-[#999] mt-1.5">Fetching your conversations...</p>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: inboxStyles }} />
            <div className="inbox-container h-full flex bg-[#fafafa] overflow-hidden inbox-fade-in">
                <div className={cn(
                    "md:block inbox-slide-in",
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
                        onRefresh={handleRefreshBusinessData}
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
                        <div className="flex-1 flex flex-col min-w-0 bg-white md:border-x border-[#e5e5e5]">
                            <UnifiedChatHeader
                                conversation={selectedConversation}
                                onDelete={handleDeleteConversation}
                                onBack={handleMobileBack}
                            />

                            <div
                                ref={messagesContainerRef}
                                className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 md:px-6 py-5 chat-area-gradient message-container-scroll"
                                style={{ WebkitOverflowScrolling: 'touch' }}
                            >
                                {msgsLoading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="flex flex-col items-center gap-4 inbox-fade-in">
                                            <div className="flex gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full bg-[#000] inbox-typing-dot" />
                                                <div className="w-2.5 h-2.5 rounded-full bg-[#000] inbox-typing-dot" />
                                                <div className="w-2.5 h-2.5 rounded-full bg-[#000] inbox-typing-dot" />
                                            </div>
                                            <p className="text-[13px] text-[#999]">Loading messages</p>
                                        </div>
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex items-center justify-center h-full inbox-slide-up">
                                        <div className="text-center">
                                            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[#f0f0f0] flex items-center justify-center inbox-float">
                                                <span className="text-2xl">💬</span>
                                            </div>
                                            <p className="text-[15px] font-semibold text-[#000] tracking-[-0.3px] mb-2">No messages yet</p>
                                            <p className="text-[13px] text-[#999] max-w-[240px]">Start the conversation by typing a message below.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="chat-messages-container">
                                        <div className="chat-messages-wrapper space-y-4">
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
                            availableProducts={suggestionAvailableProducts}
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
