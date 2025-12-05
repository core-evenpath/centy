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
    Bot,
    Loader2,
    Inbox
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageBubble } from '@/components/partner/chatspace/MessageBubble';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ReactMarkdown from 'react-markdown';

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

    // WhatsApp Data
    const { conversations, loading: convsLoading, markAsRead } = useEnrichedMetaConversations(currentPartnerId);
    const [selectedConversation, setSelectedConversation] = useState<EnrichedMetaConversation | null>(null);
    const { messages, loading: msgsLoading } = useMetaMessages(selectedConversation?.id);
    const [isWhatsAppConnected, setIsWhatsAppConnected] = useState<boolean | null>(null);

    // Filter Logic
    const [searchQuery, setSearchQuery] = useState('');
    const filteredConversations = useMemo(() => {
        if (!searchQuery.trim()) return conversations;
        const lowerQ = searchQuery.toLowerCase();
        return conversations.filter(c =>
            c.customerName?.toLowerCase().includes(lowerQ) ||
            c.customerPhone.includes(lowerQ) ||
            c.lastMessagePreview?.toLowerCase().includes(lowerQ)
        );
    }, [conversations, searchQuery]);

    // UI States
    const [messageInput, setMessageInput] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // AI States
    const [showAISuggestion, setShowAISuggestion] = useState(false);
    const [aiSuggestion, setAISuggestion] = useState<RAGSuggestion | null>(null);
    const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);

    // Check connection
    useEffect(() => {
        if (currentPartnerId) {
            getMetaWhatsAppStatus(currentPartnerId).then(s => setIsWhatsAppConnected(s.connected));
        }
    }, [currentPartnerId]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Utility: Convert Markdown to WhatsApp formatting
    const markdownToWhatsApp = useCallback((text: string): string => {
        let formatted = text;
        // Headers: # Header -> *Header*
        formatted = formatted.replace(/^#+\s+(.*)$/gm, '*$1*');
        // Bold: **text** or __text__ -> *text* (WhatsApp Bold)
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '*$1*');
        formatted = formatted.replace(/__(.*?)__/g, '*$1*');
        // Italic -> Bold (preference)
        formatted = formatted.replace(/(?<!\w)_([^*\n]+?)_(?!\w)/g, '_$1_'); // Underscores usually italic, keep as _
        // Strikethrough
        formatted = formatted.replace(/~~(.*?)~~/g, '~$1~');
        // Monospace
        formatted = formatted.replace(/`([^`]+)`/g, '```$1```');
        return formatted;
    }, []);

    const handleSendMessage = async () => {
        if (!messageInput.trim() || !selectedConversation || !currentPartnerId) return;
        setSending(true);
        const rawText = messageInput.trim();
        const formattedText = markdownToWhatsApp(rawText);
        setMessageInput('');

        try {
            await sendMetaWhatsAppMessageAction({
                partnerId: currentPartnerId,
                to: selectedConversation.customerPhone,
                message: formattedText,
                conversationId: selectedConversation.id
            });
        } catch (err) {
            console.error(err);
            toast.error("Failed to send");
            setMessageInput(rawText);
        } finally {
            setSending(false);
        }
    };

    const handleGenerateSuggestion = async () => {
        if (!currentPartnerId || !selectedConversation) return;
        setIsLoadingSuggestion(true);
        try {
            const lastMsg = messages[messages.length - 1];
            const recentMsgs = messages.slice(-5).map(m => `${m.direction}: ${m.content}`).join('\n');
            const result = await generateInboxSuggestionAction(
                currentPartnerId,
                lastMsg?.content || "Hello",
                recentMsgs
            );
            if (result.success && result.suggestedReply) {
                setAISuggestion({
                    suggestedReply: result.suggestedReply,
                    confidence: result.confidence || 0.8,
                    reasoning: result.reasoning || '',
                    sources: result.sources || []
                });
                setMessageInput(result.suggestedReply);
                setShowAISuggestion(true);
            }
        } catch (e) {
            toast.error("AI Generation failed");
        } finally {
            setIsLoadingSuggestion(false);
        }
    };

    if (authLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>;

    return (
        <div className="flex h-screen bg-white overflow-hidden">
            {/* LEFT SIDEBAR: Conversation List */}
            <div className="w-[350px] flex flex-col border-r border-gray-100 bg-white">
                {/* Header */}
                <div className="p-5 pb-2">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-xl font-bold text-gray-900">Inbox</h1>
                        <div className="flex gap-2 text-gray-400">
                            <Plus className="w-5 h-5 cursor-pointer hover:text-gray-600" />
                            <MoreHorizontal className="w-5 h-5 cursor-pointer hover:text-gray-600" />
                        </div>
                    </div>
                    {/* Search */}
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

                {/* List */}
                <div className="px-5 pb-2">
                    <h2 className="text-xs font-semibold text-gray-400 tracking-wider mb-2 uppercase">Active Chats</h2>
                </div>

                <ScrollArea className="flex-1 px-3">
                    <div className="space-y-1 pb-4">
                        {filteredConversations.map(conv => (
                            <div
                                key={conv.id}
                                onClick={() => setSelectedConversation(conv)}
                                className={cn(
                                    "flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors group",
                                    selectedConversation?.id === conv.id ? "bg-gray-50" : "hover:bg-white"
                                )}
                            >
                                <div className="relative flex-shrink-0">
                                    <Avatar className="w-10 h-10 border border-gray-100">
                                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${conv.customerPhone}`} />
                                        <AvatarFallback className="text-xs">{conv.customerName?.charAt(0) || 'U'}</AvatarFallback>
                                    </Avatar>
                                    {/* Online Status Dot */}
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                                </div>
                                <div className="flex-1 min-w-0 pt-0.5">
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <h3 className={cn(
                                            "text-sm font-semibold truncate",
                                            selectedConversation?.id === conv.id ? "text-gray-900" : "text-gray-700"
                                        )}>
                                            {conv.customerName || conv.customerPhone}
                                        </h3>
                                        <span className="text-[10px] text-gray-400 flex-shrink-0">5m</span>
                                        {/* TODO: Real timestamp */}
                                    </div>
                                    <p className={cn(
                                        "text-xs truncate",
                                        conv.unreadCount > 0 ? "text-gray-900 font-medium" : "text-gray-500"
                                    )}>
                                        {conv.lastMessagePreview || "Start a conversation..."}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* MAIN AREA: Chat */}
            <div className="flex-1 flex flex-col bg-[#FDFBF9]"> {/* Warm white background from design */}
                {selectedConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="h-16 px-6 border-b border-gray-100 flex items-center justify-between bg-white flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <Avatar className="w-9 h-9 bg-indigo-600">
                                    <AvatarFallback className="bg-indigo-600 text-white font-bold">
                                        {(selectedConversation.customerName || 'U').charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h2 className="font-bold text-gray-900 text-sm">{selectedConversation.customerName || selectedConversation.customerPhone}</h2>
                                    <p className="text-xs text-gray-500">Customer Success</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-gray-400">
                                <Phone className="w-5 h-5 cursor-pointer hover:text-gray-600" />
                                <Video className="w-5 h-5 cursor-pointer hover:text-gray-600" />
                                <MoreHorizontal className="w-5 h-5 cursor-pointer hover:text-gray-600" />
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 relative overflow-hidden">
                            {messages.length === 0 ? (
                                /* Empty State - matching design exactly */
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-[#FDFBF9]">
                                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">
                                        <Bot className="w-8 h-8 text-indigo-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">Hello there.</h3>
                                    <p className="text-gray-500 max-w-md text-sm leading-relaxed">
                                        I'm ready to help you with {selectedConversation.customerName}. Use <br />
                                        <span className="font-semibold text-gray-700">/</span> to reference files.
                                    </p>
                                </div>
                            ) : (
                                <ScrollArea className="h-full px-6 py-4">
                                    <div className="max-w-3xl mx-auto space-y-4 pb-4">
                                        {messages.map(msg => (
                                            <MessageBubble key={msg.id} message={msg} />
                                        ))}
                                        <div ref={messagesEndRef} />
                                    </div>
                                </ScrollArea>
                            )}
                        </div>
                    </>
                ) : (
                    /* No Chat Selected Empty State */
                    <div className="flex-1 flex flex-col items-center justify-center bg-[#FDFBF9] text-center">
                        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                            <Inbox className="w-10 h-10 text-indigo-600" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">Select a conversation</h2>
                        <p className="text-gray-500">Choose a chat from the left to start messaging.</p>
                    </div>
                )}

                {/* AI Suggestion Panel - Reverted to Classic Design */}
                {showAISuggestion && (
                    <div className="border-t border-purple-100 bg-gradient-to-b from-white to-purple-50/80 animate-in slide-in-from-bottom-10 duration-300">
                        {/* Header Section */}
                        <div className="px-6 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center shadow-sm">
                                    <Database className="w-4 h-4 text-white" />
                                </div>
                                <span className="font-bold text-gray-900">From Core Memory</span>
                                {aiSuggestion && !isLoadingSuggestion && (
                                    <span className="px-2.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold border border-yellow-200">
                                        {Math.round(aiSuggestion.confidence * 100)}%
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowAISuggestion(false)}
                                    className="h-8 w-8 p-0 rounded-full hover:bg-gray-100 text-gray-400"
                                >
                                    <span className="sr-only">Close</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 18 12" /></svg>
                                </Button>
                            </div>
                        </div>

                        {/* Content Card */}
                        <div className="px-6 pb-6">
                            <div className="bg-white rounded-xl border border-indigo-100 shadow-sm p-5 relative overflow-hidden">
                                {isLoadingSuggestion ? (
                                    <div className="flex flex-col items-center justify-center py-6 text-purple-600 gap-3">
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        <span className="font-medium text-sm">Analyzing Core Memory...</span>
                                    </div>
                                ) : aiSuggestion ? (
                                    <>
                                        {/* Suggestion Text */}
                                        <div className="prose prose-sm max-w-none text-gray-800 mb-6">
                                            <ReactMarkdown
                                                components={{
                                                    p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed text-[15px]">{children}</p>,
                                                    strong: ({ children }) => <span className="font-bold text-gray-900">{children}</span>,
                                                    em: ({ children }) => <span className="font-bold text-gray-900 not-italic">{children}</span>,
                                                    ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2 marker:text-purple-500">{children}</ul>,
                                                    li: ({ children }) => <li className="pl-1 text-gray-800">{children}</li>
                                                }}
                                            >
                                                {aiSuggestion.suggestedReply}
                                            </ReactMarkdown>
                                        </div>

                                        {/* Footer Info */}
                                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-4 border-t border-gray-50 pt-3">
                                            <div className="w-3.5 h-3.5 rounded-full border border-gray-300 flex items-center justify-center">
                                                <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                                            </div>
                                            <span>Generated just now</span>
                                        </div>

                                        {/* Actions Row */}
                                        <div className="flex items-center gap-3">
                                            <Button
                                                onClick={() => {
                                                    setMessageInput(aiSuggestion.suggestedReply);
                                                    handleSendMessage();
                                                    setShowAISuggestion(false);
                                                }}
                                                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium h-11 rounded-lg shadow-purple-200 shadow-md transition-all hover:shadow-lg"
                                            >
                                                <ArrowUp className="w-4 h-4 mr-2 rotate-45" /> {/* Send icon visual */}
                                                Send
                                            </Button>

                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setMessageInput(aiSuggestion.suggestedReply);
                                                    setShowAISuggestion(false);
                                                }}
                                                className="px-6 border-gray-200 text-gray-700 font-medium h-11 rounded-lg hover:bg-gray-50 hover:text-gray-900"
                                            >
                                                <span className="mr-2">✎</span> Edit
                                            </Button>

                                            <Button
                                                variant="outline"
                                                onClick={handleGenerateSuggestion}
                                                className="w-11 h-11 border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 p-0 flex items-center justify-center"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 16h5v5" /></svg>
                                            </Button>
                                        </div>
                                    </>
                                ) : null}
                            </div>
                        </div>
                    </div>
                )}

                {/* Floating Input Area - Matching Design Capsule */}
                {selectedConversation && (
                    <div className="px-6 pb-6 pt-2 bg-[#FDFBF9]"> {/* Matches background */}
                        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-2 flex items-end gap-2">
                            <Button variant="ghost" size="icon" className="h-10 w-10 text-gray-400 hover:text-gray-600 rounded-xl">
                                <Plus className="w-5 h-5" />
                            </Button>

                            <div className="flex-1 py-2.5">
                                <input
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                                    placeholder="Message... (/ for files, # for tags)"
                                    className="w-full bg-transparent border-none outline-none text-sm text-gray-900 placeholder:text-gray-400"
                                />
                            </div>

                            <div className="flex gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 text-gray-400 hover:text-gray-600 rounded-xl"
                                    onClick={() => {/* Image upload trigger */ }}
                                >
                                    <ImageIcon className="w-5 h-5" />
                                </Button>
                                <Button
                                    onClick={handleGenerateSuggestion}
                                    variant="ghost"
                                    size="icon"
                                    disabled={isLoadingSuggestion}
                                    className="h-10 w-10 text-indigo-600 hover:bg-indigo-50 rounded-xl"
                                >
                                    {isLoadingSuggestion ? <Loader2 className="w-5 h-5 animate-spin" /> : <Database className="w-5 h-5" />}
                                </Button>
                                <Button
                                    onClick={handleSendMessage}
                                    disabled={!messageInput.trim() || sending}
                                    className="h-10 w-10 bg-gray-100 hover:bg-indigo-600 hover:text-white text-gray-900 rounded-xl transition-all"
                                    size="icon"
                                >
                                    <ArrowUp className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                        {/* Centered hint text below input if needed, or keeping it clean */}
                    </div>
                )}
            </div>
        </div>
    );
}