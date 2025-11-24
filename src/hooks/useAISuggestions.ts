import { useState, useRef, useEffect } from 'react';
import { chatWithVaultForConversation } from '@/actions/vault-actions';
import { useToast } from '@/hooks/use-toast';

export interface RAGSuggestion {
    suggestedReply: string;
    confidence: number;
    reasoning: string;
    sources: Array<{
        type: 'conversation' | 'document';
        name: string;
        excerpt: string;
        relevance: number;
    }>;
    alternativeReplies?: string[];
}

interface UseAISuggestionsProps {
    partnerId?: string;
    selectedConversationId?: string;
    platform?: 'sms' | 'whatsapp';
    onSuggestionReady?: (suggestion: RAGSuggestion) => void;
}

export function useAISuggestions({
    partnerId,
    selectedConversationId,
    platform,
    onSuggestionReady
}: UseAISuggestionsProps) {
    const { toast } = useToast();

    const [showAISuggestion, setShowAISuggestion] = useState(false);
    const [aiSuggestion, setAiSuggestion] = useState<RAGSuggestion | null>(null);
    const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
    const [pendingIncomingMessage, setPendingIncomingMessage] = useState('');

    const processedMessageIds = useRef<Set<string>>(new Set());
    const lastSuggestionContext = useRef<string>('');
    const suggestionDebounceTimer = useRef<NodeJS.Timeout | null>(null);

    const reset = () => {
        setShowAISuggestion(false);
        setAiSuggestion(null);
        setPendingIncomingMessage('');
        processedMessageIds.current.clear();
        lastSuggestionContext.current = '';
        if (suggestionDebounceTimer.current) {
            clearTimeout(suggestionDebounceTimer.current);
        }
    };

    const handleRequestAISuggestion = async (incomingMessage?: string) => {
        if (!selectedConversationId || !partnerId || !platform) return;

        const messageToAnalyze = incomingMessage || pendingIncomingMessage || "Hello";

        setPendingIncomingMessage(messageToAnalyze);
        setShowAISuggestion(true);
        setIsLoadingSuggestion(true);
        setAiSuggestion(null);

        try {
            console.log('⚡ Ultra-fast RAG starting...');
            const startTime = Date.now();

            const result = await chatWithVaultForConversation(
                partnerId,
                selectedConversationId,
                platform,
                messageToAnalyze,
                {
                    includeAlternatives: false
                }
            );

            console.log(`⚡ RAG completed in ${Date.now() - startTime}ms`);

            if (result.success && result.suggestedReply) {
                const suggestion: RAGSuggestion = {
                    suggestedReply: result.suggestedReply,
                    confidence: result.confidence || 0.5,
                    reasoning: result.reasoning || 'Generated from available context',
                    sources: result.sources || [],
                    alternativeReplies: result.alternativeReplies || []
                };

                setAiSuggestion(suggestion);
                onSuggestionReady?.(suggestion);
            } else {
                throw new Error(result.message || 'Failed to generate suggestion');
            }
        } catch (error: any) {
            console.error('❌ AI suggestion error:', error);
            toast({
                variant: 'destructive',
                title: 'AI suggestion failed',
                description: error.message
            });
            setShowAISuggestion(false);
        } finally {
            setIsLoadingSuggestion(false);
        }
    };

    const handleDismissSuggestion = () => {
        setShowAISuggestion(false);
        setAiSuggestion(null);
        setPendingIncomingMessage('');
    };

    const handleRegenerateSuggestion = () => {
        handleRequestAISuggestion(pendingIncomingMessage);
    };

    // Auto-trigger logic for new messages
    const checkForNewMessage = (latestMessage: any) => {
        if (!latestMessage || latestMessage.direction !== 'inbound') return;

        const messageId = latestMessage.id;
        if (processedMessageIds.current.has(messageId)) return;

        const currentContext = `${selectedConversationId}-${latestMessage.content}`;
        if (lastSuggestionContext.current === currentContext) return;

        console.log('🔔 New inbound message detected');
        processedMessageIds.current.add(messageId);
        lastSuggestionContext.current = currentContext;

        if (suggestionDebounceTimer.current) {
            clearTimeout(suggestionDebounceTimer.current);
        }

        suggestionDebounceTimer.current = setTimeout(() => {
            handleRequestAISuggestion(latestMessage.content);
        }, 200);
    };

    return {
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
        reset
    };
}
