"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { useEnrichedMetaConversations, EnrichedMetaConversation } from '@/hooks/useEnrichedMetaConversations';
import { useMetaMessages } from '@/hooks/useMetaWhatsApp';
import { sendMetaWhatsAppMessageAction, getMetaWhatsAppStatus, deleteMetaConversation, deleteMetaMessage } from '@/actions/meta-whatsapp-actions';
import { generateInboxSuggestionAction } from '@/actions/partnerhub-actions';
import { cn } from '@/lib/utils';
import {
    Search,
    Plus,
    MoreHorizontal,
    Phone,
    Video,
    Image as ImageIcon,
    ArrowUp,
    Paperclip,
    Database,
    Loader2,
    Inbox,
    Trash2,
    User,
    Building2,
    Mail,
    MessageSquare,
    Settings,
    X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageBubble } from '@/components/partner/chatspace/MessageBubble';
import CoreMemorySuggestion from '@/components/partner/inbox/CoreMemorySuggestion';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'sonner';
import Link from 'next/link';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
    const { currentWorkspace, loading: authLoading } = useMultiWorkspaceAuth();
    const currentPartnerId = currentWorkspace?.partnerId;

    const { conversations, loading: convsLoading, markAsRead } = useEnrichedMetaConversations(currentPartnerId);
    const [selectedConversation, setSelectedConversation] = useState<EnrichedMetaConversation | null>(null);
    const { messages, loading: msgsLoading } = useMetaMessages(selectedConversation?.id);
    const [isWhatsAppConnected, setIsWhatsAppConnected] = useState<boolean | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const filteredConversations = useMemo(() => {
        if (!searchQuery.trim()) return conversations;
        const lowerQ = searchQuery.toLowerCase();
        return conversations.filter(c =>
            c.customerName?.toLowerCase().includes(lowerQ) ||
            c.customerPhone.includes(lowerQ) ||
            c.lastMessagePreview?.toLowerCase().includes(lowerQ) ||
            c.contactName?.toLowerCase().includes(lowerQ) ||
            c.contactEmail?.toLowerCase().includes(lowerQ) ||
            c.contactCompany?.toLowerCase().includes(lowerQ)
        );
    }, [conversations, searchQuery]);

    const [messageInput, setMessageInput] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [showAISuggestion, setShowAISuggestion] = useState(false);
    const [aiSuggestion, setAISuggestion] = useState<RAGSuggestion | null>(null);
    const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
    const [pendingIncomingMessage, setPendingIncomingMessage] = useState('');

    const processedMessageIds = useRef<Set<string>>(new Set());
    const lastSuggestionContext = useRef<string>('');
    const suggestionDebounceTimer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (currentPartnerId) {
            getMetaWhatsAppStatus(currentPartnerId).then(s => setIsWhatsAppConnected(s.connected));
        }
    }, [currentPartnerId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

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

        suggestionDebounceTimer.current = setTimeout(() => {
            handleGenerateSuggestion(latestMessage.content);
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
            toast.error("Failed to send");
            if (!textOverride) setMessageInput(textToSend);
        } finally {
            setSending(false);
        }
    };

    const handleGenerateSuggestion = async (incomingMessage?: string) => {
        if (!currentPartnerId || !selectedConversation) return;

        const messageToAnalyze = incomingMessage || messages[messages.length - 1]?.content || "Hello";
        setPendingIncomingMessage(messageToAnalyze);
        setShowAISuggestion(true);
        setIsLoadingSuggestion(true);
        setAISuggestion(null);

        try {
            console.log('⚡ Core Memory RAG starting...');
            const startTime = Date.now();

            const recentMsgs = messages.slice(-5).map(m => `${m.direction}: ${m.content}`).join('\n');
            const result = await generateInboxSuggestionAction(
                currentPartnerId,
                messageToAnalyze,
                recentMsgs
            );

            console.log(`⚡ Core Memory RAG completed in ${Date.now() - startTime}ms`);

            if (result.success && result.suggestedReply) {
                setAISuggestion({
                    suggestedReply: result.suggestedReply,
                    confidence: result.confidence || 0.8,
                    reasoning: result.reasoning || 'Generated from Core Memory documents',
                    sources: result.sources || []
                });
            } else {
                toast.error(result.message || "Failed to generate suggestion");
                setShowAISuggestion(false);
            }
        } catch (e: any) {
            console.error('❌ AI suggestion error:', e);
            toast.error("AI Generation failed");
            setShowAISuggestion(false);
        } finally {
            setIsLoadingSuggestion(false);
        }
    };

    const handleDismissSuggestion = () => {
        setShowAISuggestion(false);
        setAISuggestion(null);
        setPendingIncomingMessage('');
    };

    const handleEditSuggestion = (text: string) => {
        setMessageInput(text);
        setShowAISuggestion(false);
        setAISuggestion(null);
    };

    const handleSendSuggestion = (text: string) => {
        handleSendMessage(text);
    };

    const handleRegenerateSuggestion = () => {
        handleGenerateSuggestion(pendingIncomingMessage);
    };

    const handleDeleteConversation = async () => {
        if (!selectedConversation || !currentPartnerId) return;
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

    const formatTime = (timestamp: any) => {
        if (!timestamp) return '';
        try {
            const date = timestamp?.toDate?.() || new Date(timestamp);
            const now = new Date();
            const diff = now.getTime() - date.getTime();
            const hours = diff / (1000 * 60 * 60);

            if (hours < 24) {
                return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            } else if (hours < 168) {
                return date.toLocaleDateString('en-US', { weekday: 'short' });
            } else {
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
        } catch {
            return '';
        }
    };

    if (authLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="animate-spin text-gray-400 w-8 h-8" />
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-white overflow-hidden">
            <div className="w-[350px] flex flex-col border-r border-gray-100 bg-white">
                <div className="p-5 pb-2">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-xl font-bold text-gray-900">Inbox</h1>
                        <div className="flex gap-2 text-gray-400">
                            <Plus className="w-5 h-5 cursor-pointer hover:text-gray-600" />
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="hover:text-gray-600">
                                        <MoreHorizontal className="w-5 h-5" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                        <Link href="/partner/settings/whatsapp-business" className="flex items-center">
                                            <Settings className="w-4 h-4 mr-2" />
                                            WhatsApp Settings
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search conversations..."
                            className="w-full bg-gray-50 border-none rounded-lg py-2.5 pl-10 pr-4 text-sm focus:ring-1 focus:ring-gray-200 outline-none"
                        />
                    </div>
                </div>

                <div className="px-5 pb-2">
                    <h2 className="text-xs font-semibold text-gray-400 tracking-wider mb-2 uppercase">Active Chats</h2>
                </div>

                <ScrollArea className="flex-1 px-3">
                    {convsLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                        </div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <Inbox className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-600 font-medium mb-1">No conversations yet</p>
                            <p className="text-sm text-gray-400">Messages will appear here when customers contact you</p>
                        </div>
                    ) : (
                        <div className="space-y-1 pb-4">
                            {filteredConversations.map(conv => (
                                <div
                                    key={conv.id}
                                    onClick={() => setSelectedConversation(conv)}
                                    className={cn(
                                        "flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors group",
                                        selectedConversation?.id === conv.id
                                            ? "bg-indigo-50 border border-indigo-200"
                                            : "hover:bg-gray-50"
                                    )}
                                >
                                    <Avatar className="w-12 h-12 shrink-0">
                                        <AvatarImage src={conv.contact?.avatarUrl} />
                                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-medium">
                                            {(conv.contactName || conv.customerName || conv.customerPhone)?.[0]?.toUpperCase() || '?'}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className="font-semibold text-gray-900 truncate text-sm">
                                                {conv.contactName || conv.customerName || conv.customerPhone}
                                            </span>
                                            <span className="text-xs text-gray-400 shrink-0 ml-2">
                                                {formatTime(conv.lastMessageAt)}
                                            </span>
                                        </div>

                                        {conv.contactCompany && (
                                            <div className="flex items-center gap-1 mb-0.5">
                                                <Building2 className="w-3 h-3 text-gray-400" />
                                                <span className="text-xs text-gray-500 truncate">{conv.contactCompany}</span>
                                            </div>
                                        )}

                                        <p className="text-sm text-gray-500 truncate">
                                            {conv.lastMessagePreview || 'No messages yet'}
                                        </p>

                                        {(conv.unreadCount ?? 0) > 0 && (
                                            <div className="mt-1">
                                                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-indigo-600 text-white rounded-full">
                                                    {conv.unreadCount}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>

            <div className="flex-1 flex flex-col bg-gray-50/50">
                {selectedConversation ? (
                    <>
                        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-4">
                                <Avatar className="w-11 h-11">
                                    <AvatarImage src={selectedConversation.contact?.avatarUrl} />
                                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-medium">
                                        {(selectedConversation.contactName || selectedConversation.customerName || selectedConversation.customerPhone)?.[0]?.toUpperCase() || '?'}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h2 className="font-semibold text-gray-900">
                                        {selectedConversation.contactName || selectedConversation.customerName || selectedConversation.customerPhone}
                                    </h2>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <Phone className="w-3 h-3" />
                                        <span>{selectedConversation.customerPhone}</span>
                                        {selectedConversation.contactEmail && (
                                            <>
                                                <span className="text-gray-300">•</span>
                                                <Mail className="w-3 h-3" />
                                                <span>{selectedConversation.contactEmail}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
                                    <Phone className="w-5 h-5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
                                    <Video className="w-5 h-5" />
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
                                            <MoreHorizontal className="w-5 h-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {selectedConversation.contact ? (
                                            <DropdownMenuItem asChild>
                                                <Link href={`/partner/contacts?search=${selectedConversation.customerPhone}`} className="flex items-center">
                                                    <User className="w-4 h-4 mr-2" />
                                                    View Contact
                                                </Link>
                                            </DropdownMenuItem>
                                        ) : (
                                            <DropdownMenuItem asChild>
                                                <Link href={`/partner/contacts/new?phone=${selectedConversation.customerPhone}&name=${selectedConversation.customerName || ''}`} className="flex items-center">
                                                    <User className="w-4 h-4 mr-2" />
                                                    Add to Contacts
                                                </Link>
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem onClick={handleDeleteConversation} className="text-red-600 focus:text-red-600">
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete Conversation
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        <ScrollArea className="flex-1 p-4">
                            {msgsLoading ? (
                                <div className="flex items-center justify-center p-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-8 text-center mt-10">
                                    <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                                        <MessageSquare className="w-8 h-8 text-indigo-500" />
                                    </div>
                                    <p className="text-gray-600 font-medium">No messages yet</p>
                                    <p className="text-sm text-gray-400 mt-1">Send a message to start the conversation.</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-w-3xl mx-auto">
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

                        <CoreMemorySuggestion
                            suggestion={aiSuggestion}
                            isLoading={isLoadingSuggestion}
                            isVisible={showAISuggestion}
                            onEdit={handleEditSuggestion}
                            onSend={handleSendSuggestion}
                            onDismiss={handleDismissSuggestion}
                            onRegenerate={handleRegenerateSuggestion}
                            incomingMessage={pendingIncomingMessage}
                        />

                        <div className="bg-white border-t border-gray-100 p-4">
                            <div className="max-w-3xl mx-auto">
                                <div className={cn(
                                    "flex items-center gap-2 bg-gray-50 border rounded-2xl px-3 transition-all",
                                    "shadow-sm border-gray-200",
                                    "focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300"
                                )}>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 text-gray-400 hover:text-gray-600 rounded-xl shrink-0"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </Button>

                                    <div className="flex-1 py-2.5">
                                        <input
                                            value={messageInput}
                                            onChange={(e) => setMessageInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendMessage();
                                                }
                                            }}
                                            placeholder="Type a message..."
                                            className="w-full bg-transparent border-none outline-none text-sm text-gray-900 placeholder:text-gray-400"
                                        />
                                    </div>

                                    <div className="flex gap-1 shrink-0">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-10 w-10 text-gray-400 hover:text-gray-600 rounded-xl"
                                        >
                                            <ImageIcon className="w-5 h-5" />
                                        </Button>
                                        <Button
                                            onClick={() => handleGenerateSuggestion()}
                                            variant="ghost"
                                            size="icon"
                                            disabled={isLoadingSuggestion}
                                            className="h-10 w-10 text-indigo-600 hover:bg-indigo-50 rounded-xl"
                                            title="Generate AI suggestion from Core Memory"
                                        >
                                            {isLoadingSuggestion ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <Database className="w-5 h-5" />
                                            )}
                                        </Button>
                                        <Button
                                            onClick={() => handleSendMessage()}
                                            disabled={!messageInput.trim() || sending}
                                            className="h-10 w-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all disabled:opacity-50"
                                            size="icon"
                                        >
                                            {sending ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <ArrowUp className="w-5 h-5" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                        <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-gray-100">
                            <Inbox className="w-12 h-12 text-indigo-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Welcome to Inbox
                        </h2>
                        <p className="text-gray-500 max-w-md text-lg mb-6">
                            Select a conversation from the sidebar to start messaging your clients.
                        </p>
                        {isWhatsAppConnected === false && (
                            <Link href="/partner/settings/whatsapp-business">
                                <Button className="bg-indigo-600 hover:bg-indigo-700">
                                    <Settings className="w-4 h-4 mr-2" />
                                    Connect WhatsApp
                                </Button>
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}