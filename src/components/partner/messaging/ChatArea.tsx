import React, { useState, useEffect, useMemo } from 'react';
import { Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { sendSMSAction } from '@/actions/sms-actions';
import { sendWhatsAppMessageAction } from '@/actions/whatsapp-actions';
import { useConversationMessages } from '@/hooks/useConversationMessages';
import { useAISuggestions } from '@/hooks/useAISuggestions';

import ChatHeader from './ChatHeader';
import MessagesList from './MessagesList';
import MessageInput from './MessageInput';
import InlineAISuggestion from './InlineAISuggestion';

interface ChatAreaProps {
    partnerId: string;
    conversation: any; // SimpleConversation
    onViewProfile: () => void;
}

export default function ChatArea({ partnerId, conversation, onViewProfile }: ChatAreaProps) {
    const { toast } = useToast();
    const [messageInput, setMessageInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [optimisticMessages, setOptimisticMessages] = useState<any[]>([]);

    const {
        showAISuggestion,
        setShowAISuggestion,
        aiSuggestion,
        setAiSuggestion,
        isLoadingSuggestion,
        pendingIncomingMessage,
        setPendingIncomingMessage,
        handleRequestAISuggestion,
        handleDismissSuggestion,
        handleRegenerateSuggestion,
        checkForNewMessage,
        reset: resetAI
    } = useAISuggestions({
        partnerId,
        selectedConversationId: conversation.id,
        platform: conversation.platform
    });

    const {
        messages: dbMessages,
        isLoading: isLoadingMessages
    } = useConversationMessages({
        conversationId: conversation.id,
        platform: conversation.platform || 'sms',
        onNewMessage: () => {
            // Audio handled in parent or global context if needed, or re-add here
        }
    });

    // Reset state when conversation changes
    useEffect(() => {
        setOptimisticMessages([]);
        setMessageInput('');
        setIsSending(false);
        resetAI();
    }, [conversation.id]);

    // Check for new messages for AI suggestions
    useEffect(() => {
        if (dbMessages.length > 0) {
            const latest = dbMessages[dbMessages.length - 1];
            checkForNewMessage(latest);
        }
    }, [dbMessages, conversation.id]);

    const allMessages = useMemo(() => {
        return [...dbMessages, ...optimisticMessages].sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || a.createdAt?.getTime?.() || 0;
            const bTime = b.createdAt?.toMillis?.() || b.createdAt?.getTime?.() || 0;
            return aTime - bTime;
        });
    }, [dbMessages, optimisticMessages]);

    const handleSendMessage = async (text: string = messageInput) => {
        if (!text.trim() || isSending) return;

        const optimistic = {
            id: `optimistic-${Date.now()}`,
            conversationId: conversation.id,
            direction: 'outbound' as const,
            content: text,
            createdAt: Timestamp.now(),
            status: 'sending',
        };

        setOptimisticMessages(prev => [...prev, optimistic]);
        const messageText = text;
        setMessageInput('');
        setIsSending(true);

        // Clear AI state
        setShowAISuggestion(false);
        setAiSuggestion(null);
        setPendingIncomingMessage('');

        try {
            let result;

            if (conversation.platform === 'sms') {
                result = await sendSMSAction({
                    partnerId,
                    to: conversation.customerPhone,
                    message: messageText,
                    conversationId: conversation.id,
                });
            } else {
                result = await sendWhatsAppMessageAction({
                    partnerId,
                    to: conversation.customerPhone,
                    message: messageText,
                    conversationId: conversation.id,
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
                title: 'Failed to send message',
                description: error.message
            });
            setOptimisticMessages(prev => prev.filter(m => m.id !== optimistic.id));
            // Restore input if it was the main input
            if (text === messageInput) {
                setMessageInput(messageText);
            }
        } finally {
            setIsSending(false);
        }
    };

    const handleEditSuggestion = (text: string) => {
        setMessageInput(text);
        setShowAISuggestion(false);
        setAiSuggestion(null);
        setPendingIncomingMessage('');
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="shrink-0">
                <ChatHeader
                    conversation={conversation}
                    onViewProfile={onViewProfile}
                />
            </div>

            <div className="flex-1 overflow-hidden">
                <MessagesList
                    messages={allMessages}
                    isLoadingMore={isLoadingMessages}
                    allMessagesLoaded={true}
                    onLoadMore={() => { }}
                    partnerId={partnerId}
                />
            </div>

            <div className="shrink-0">
                <InlineAISuggestion
                    suggestion={aiSuggestion}
                    isLoading={isLoadingSuggestion}
                    isVisible={showAISuggestion}
                    onEdit={handleEditSuggestion}
                    onSend={(text) => handleSendMessage(text)}
                    onDismiss={handleDismissSuggestion}
                    onRegenerate={handleRegenerateSuggestion}
                    incomingMessage={pendingIncomingMessage}
                />
            </div>

            <div className="shrink-0">
                <MessageInput
                    value={messageInput}
                    onChange={setMessageInput}
                    onSend={() => handleSendMessage()}
                    disabled={isSending}
                />
            </div>
        </div>
    );
}
