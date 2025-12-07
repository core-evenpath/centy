"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { useEnrichedMetaConversations, EnrichedMetaConversation } from '@/hooks/useEnrichedMetaConversations';
import { useMetaMessages } from '@/hooks/useMetaWhatsApp';
import { sendMetaWhatsAppMessageAction, getMetaWhatsAppStatus, deleteMetaConversation, deleteMetaMessage } from '@/actions/meta-whatsapp-actions';
import { generateInboxSuggestionAction } from '@/actions/partnerhub-actions';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Components
import { ConversationSidebar } from '@/components/partner/inbox/ConversationSidebar';
import { ChatHeader } from '@/components/partner/inbox/ChatHeader';
import { MessageInput } from '@/components/partner/inbox/MessageInput';
import { EmptyState } from '@/components/partner/inbox/EmptyState';
import { MessageBubble } from '@/components/partner/chatspace/MessageBubble';
import CoreMemorySuggestion from '@/components/partner/inbox/CoreMemorySuggestion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

// Types
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
    }>;
}

export default function InboxPage() {
    // ----------------------------------------------------------------------
    // State & Hooks
    // ----------------------------------------------------------------------
    const { currentWorkspace, loading: authLoading } = useMultiWorkspaceAuth();
    const currentPartnerId = currentWorkspace?.partnerId;

    // Data - Conversations
    const { conversations, loading: convsLoading, markAsRead } = useEnrichedMetaConversations(currentPartnerId);
    const [selectedConversation, setSelectedConversation] = useState<EnrichedMetaConversation | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Data - Messages
    const { messages, loading: msgsLoading } = useMetaMessages(selectedConversation?.id);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Data - Status
    const [isWhatsAppConnected, setIsWhatsAppConnected] = useState<boolean | null>(null);

    // AI State
    const [showAISuggestion, setShowAISuggestion] = useState(false);
    const [aiSuggestion, setAISuggestion] = useState<RAGSuggestion | null>(null);
    const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
    const [pendingIncomingMessage, setPendingIncomingMessage] = useState('');

    // Debounce & Tracking refs
    const processedMessageIds = useRef<Set<string>>(new Set());
    const lastSuggestionContext = useRef<string>('');
    const suggestionDebounceTimer = useRef<NodeJS.Timeout | null>(null);

    // Input State
    const [messageInput, setMessageInput] = useState('');
    const [sending, setSending] = useState(false);

    // ----------------------------------------------------------------------
    // Effects
    // ----------------------------------------------------------------------

    // Check WhatsApp Status
    useEffect(() => {
        if (currentPartnerId) {
            getMetaWhatsAppStatus(currentPartnerId).then(s => setIsWhatsAppConnected(s.connected));
        }
    }, [currentPartnerId]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Mark as read when selecting conversation
    useEffect(() => {
        if (selectedConversation && selectedConversation.unreadCount > 0) {
            markAsRead(selectedConversation.id);
        }
    }, [selectedConversation, markAsRead]);

    // Auto-Trigger AI for new inbound messages
    useEffect(() => {
        if (!messages || messages.length === 0) return;

        const latestMessage = messages[messages.length - 1];
        if (!latestMessage || latestMessage.direction !== 'inbound') return;

        const messageId = latestMessage.id;
        if (processedMessageIds.current.has(messageId)) return;

        // Simple context check to prevent duplicate runs
        const currentContext = `${selectedConversation?.id}-${latestMessage.content}`;
        if (lastSuggestionContext.current === currentContext) return;

        console.log('🔔 New inbound message detected, triggering AI suggestion');
        processedMessageIds.current.add(messageId);
        lastSuggestionContext.current = currentContext;

        if (suggestionDebounceTimer.current) {
            clearTimeout(suggestionDebounceTimer.current);
        }

        suggestionDebounceTimer.current = setTimeout(() => {
            handleGenerateSuggestion(latestMessage.content);
        }, 300);

        return () => {
            if (suggestionDebounceTimer.current) {
                clearTimeout(suggestionDebounceTimer.current);
            }
        };
    }, [messages, selectedConversation?.id]);

    // Reset AI state on conversation change
    useEffect(() => {
        processedMessageIds.current.clear();
        lastSuggestionContext.current = '';
        setShowAISuggestion(false);
        setAISuggestion(null);
        setPendingIncomingMessage('');
        setMessageInput('');
    }, [selectedConversation?.id]);

    // ----------------------------------------------------------------------
    // Handlers
    // ----------------------------------------------------------------------

    const markdownToWhatsApp = useCallback((text: string): string => {
        let formatted = text;
        formatted = formatted.replace(/^#+\s+(.*)$/gm, '*$1*');
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '*$1*');
        formatted = formatted.replace(/__(.*?)__/g, '*$1*');
        formatted = formatted.replace(/(?<!\w)_([^*\n]+?)_(?!\w)/g, '_$1_'); // Underscores for italics
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
            if (!textOverride) setMessageInput(textToSend); // Restore input on fail
        } finally {
            setSending(false);
        }
    };

    const handleGenerateSuggestion = async (incomingMessage?: string, refinementInstruction?: string) => {
        if (!currentPartnerId || !selectedConversation) return;

        const messageToAnalyze = incomingMessage || pendingIncomingMessage || messages[messages.length - 1]?.content || "Hello";

        // If it's a new generation (not refinement), reset state
        if (!refinementInstruction) {
            setPendingIncomingMessage(messageToAnalyze);
            setAISuggestion(null);
        }

        setShowAISuggestion(true);
        setIsLoadingSuggestion(true);

        try {
            console.log('⚡ Core Memory RAG starting...');

            // Construct context from recent messages
            let context = messages.slice(-5).map(m => `${m.direction}: ${m.content}`).join('\n');

            // Add refinement instruction if present
            if (refinementInstruction) {
                context += `\n\n[SYSTEM INSTRUCTION: The user wants to refine the previous suggestion. ${refinementInstruction}]`;
            }

            const result = await generateInboxSuggestionAction(
                currentPartnerId,
                messageToAnalyze,
                context
            );

            if (result.success && result.suggestedReply) {
                setAISuggestion({
                    suggestedReply: result.suggestedReply,
                    confidence: result.confidence || 0.85,
                    reasoning: result.reasoning || 'Generated based on your business documents and conversation history.',
                    sources: (result.sources || []).map(s => ({ ...s, type: 'document' as const, excerpt: s.excerpt || '' }))
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

    const handleRefineSuggestion = (instruction: string) => {
        handleGenerateSuggestion(undefined, instruction);
    };

    const handleDeleteConversation = async () => {
        if (!selectedConversation || !currentPartnerId) return;
        if (!confirm("Are you sure you want to delete this conversation? This cannot be undone.")) return;

        try {
            await deleteMetaConversation(currentPartnerId, selectedConversation.id);
            setSelectedConversation(null);
            toast.success("Conversation deleted");
        } catch (err) {
            toast.error("Failed to delete conversation");
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        if (!currentPartnerId) return;
        try {
            await deleteMetaMessage(currentPartnerId, messageId);
            toast.success("Message deleted");
        } catch (err) {
            toast.error("Failed to delete message");
        }
    };

    // ----------------------------------------------------------------------
    // Render
    // ----------------------------------------------------------------------

    if (authLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-white">
                <Loader2 className="animate-spin text-indigo-500 w-8 h-8" />
            </div>
        );
    }

    return (
        <div className="flex bg-white overflow-hidden font-sans h-full">
            {/* Panel 1: Left Sidebar - Hidden on mobile if conversation selected */}
            <div className={cn(
                "w-full md:w-[380px] flex-col border-r border-gray-200 bg-white h-full",
                selectedConversation ? "hidden md:flex" : "flex"
            )}>
                <ConversationSidebar
                    conversations={conversations}
                    selectedId={selectedConversation?.id || null}
                    onSelect={(conv) => setSelectedConversation(conv)}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    loading={convsLoading}
                />
            </div>

            {/* Panel 2 & 3: Chat Area + AI Panel */}
            <div className={cn(
                "flex-1 flex min-w-0 bg-white relative h-full", // Flex row to contain Chat Area and AI Panel
                !selectedConversation ? "hidden md:flex" : "flex"
            )}>
                {selectedConversation ? (
                    <>
                        {/* Panel 2: Main Chat Area */}
                        <div className="flex-1 flex flex-col min-w-0 bg-white h-full relative">
                            <ChatHeader
                                conversation={selectedConversation}
                                isWhatsAppConnected={isWhatsAppConnected}
                                onDelete={handleDeleteConversation}
                                onBack={() => setSelectedConversation(null)}
                            />

                            {/* Messages Area */}
                            <div className="flex-1 relative bg-gray-50/30 min-h-0">
                                <ScrollArea className="h-full px-4 md:px-6 pt-6">
                                    {msgsLoading ? (
                                        <div className="flex items-center justify-center py-12">
                                            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div className="text-center py-20">
                                            <Badge variant="outline" className="mb-4 bg-gray-50 text-gray-400 border-dashed">No messages yet</Badge>
                                            <p className="text-gray-400 text-sm">Start the conversation by typing a message below.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-6 pb-6">
                                            {messages.map((msg: MetaWhatsAppMessage) => (
                                                <MessageBubble
                                                    key={msg.id}
                                                    message={msg}
                                                    onDelete={handleDeleteMessage}
                                                />
                                            ))}
                                            <div ref={messagesEndRef} />
                                        </div>
                                    )}
                                </ScrollArea>
                            </div>

                            {/* Input Area */}
                            <MessageInput
                                value={messageInput}
                                onChange={setMessageInput}
                                onSend={() => handleSendMessage()}
                                onGenerateSuggestion={() => handleGenerateSuggestion()}
                                isGenerating={isLoadingSuggestion}
                                sending={sending}
                            />
                        </div>

                        {/* Panel 3: Core Memory AI Suggestion Panel (Conditional render as a column) */}
                        {showAISuggestion && (
                            <CoreMemorySuggestion
                                suggestion={aiSuggestion}
                                isLoading={isLoadingSuggestion}
                                isVisible={showAISuggestion}
                                onEdit={(text) => {
                                    setMessageInput(text);
                                    setShowAISuggestion(false);
                                    setAISuggestion(null);
                                }}
                                onSend={(text) => handleSendMessage(text)}
                                onDismiss={() => {
                                    setShowAISuggestion(false);
                                    setAISuggestion(null);
                                }}
                                onRegenerate={() => handleGenerateSuggestion()}
                                onRefine={handleRefineSuggestion}
                                incomingMessage={pendingIncomingMessage}
                            />
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex flex-col">
                        <EmptyState isWhatsAppConnected={isWhatsAppConnected} />
                    </div>
                )}
            </div>

            {/* Optional: Right Profile Panel Area (Hidden for now, can be toggled) */}
        </div>
    );
}