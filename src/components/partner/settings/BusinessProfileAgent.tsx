"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
    MessageCircle,
    Send,
    X,
    Sparkles,
    Check,
    CheckCheck,
    Loader2,
    Bot,
    ChevronDown,
    Paperclip,
    Smile,
    MoreVertical,
    RefreshCw,
    Minimize2,
    User
} from 'lucide-react';
import { chatWithPersonaManagerAction } from '@/actions/business-persona-actions';
import type { BusinessPersona } from '@/lib/business-persona-types';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    status?: 'sending' | 'sent' | 'delivered' | 'error';
    dataUpdated?: boolean;
}

interface BusinessProfileAgentProps {
    partnerId: string;
    persona: Partial<BusinessPersona>;
    onPersonaUpdated: () => void;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

const QUICK_PROMPTS = [
    { icon: '🕐', label: 'Update hours', prompt: 'Update my business hours' },
    { icon: '📞', label: 'Change contact', prompt: 'Update my contact information' },
    { icon: '➕', label: 'Add service', prompt: 'Add a new service' },
    { icon: '❓', label: 'Add FAQ', prompt: 'Add a frequently asked question' },
];

const WELCOME_MESSAGE = `Hi! I'm your Business Profile Agent. 👋

I can help you update your profile using natural language. Try saying:
• "Update my hours to 9am-6pm weekdays"
• "Add a service called Consulting"
• "Set my tagline to..."

What would you like to update?`;

export default function BusinessProfileAgent({
    partnerId,
    persona,
    onPersonaUpdated,
    open: externalOpen,
    onOpenChange
}: BusinessProfileAgentProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Sync with external open prop
    useEffect(() => {
        if (externalOpen && !isOpen) {
            setIsOpen(true);
        }
    }, [externalOpen, isOpen]);

    // Notify parent when open state changes
    const handleOpenChange = useCallback((newOpen: boolean) => {
        setIsOpen(newOpen);
        onOpenChange?.(newOpen);
    }, [onOpenChange]);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: WELCOME_MESSAGE,
            timestamp: new Date(),
            status: 'delivered'
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Focus input when opening
    useEffect(() => {
        if (isOpen && !isMinimized && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, isMinimized]);

    // Clear unread when opening
    useEffect(() => {
        if (isOpen) {
            setUnreadCount(0);
        }
    }, [isOpen]);

    const handleSend = async (messageOverride?: string) => {
        const messageText = messageOverride || input.trim();
        if (!messageText || isTyping) return;

        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: messageText,
            timestamp: new Date(),
            status: 'sending'
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        // Mark as sent after a brief delay
        setTimeout(() => {
            setMessages(prev => prev.map(m =>
                m.id === userMessage.id ? { ...m, status: 'sent' } : m
            ));
        }, 300);

        try {
            const messageHistory = messages
                .filter(m => m.role !== 'system')
                .slice(-10) // Keep last 10 messages for context
                .map(m => ({ role: m.role, content: m.content }));

            messageHistory.push({ role: 'user', content: messageText });

            const result = await chatWithPersonaManagerAction(
                partnerId,
                messageHistory as any,
                persona as BusinessPersona
            );

            // Mark user message as delivered
            setMessages(prev => prev.map(m =>
                m.id === userMessage.id ? { ...m, status: 'delivered' } : m
            ));

            if (result.success && result.response) {
                const assistantMessage: ChatMessage = {
                    id: `assistant-${Date.now()}`,
                    role: 'assistant',
                    content: result.response,
                    timestamp: new Date(),
                    status: 'delivered',
                    dataUpdated: result.dataUpdated
                };

                setMessages(prev => [...prev, assistantMessage]);

                if (result.dataUpdated) {
                    onPersonaUpdated();
                }

                if (!isOpen) {
                    setUnreadCount(prev => prev + 1);
                }
            } else {
                throw new Error(result.message || 'Failed to get response');
            }
        } catch (error: any) {
            setMessages(prev => prev.map(m =>
                m.id === userMessage.id ? { ...m, status: 'error' } : m
            ));

            const errorMessage: ChatMessage = {
                id: `error-${Date.now()}`,
                role: 'assistant',
                content: `Sorry, I encountered an error. Please try again.`,
                timestamp: new Date(),
                status: 'delivered'
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleQuickPrompt = (prompt: string) => {
        handleSend(prompt);
    };

    const clearChat = () => {
        setMessages([{
            id: 'welcome-new',
            role: 'assistant',
            content: 'Chat cleared. How can I help you update your profile?',
            timestamp: new Date(),
            status: 'delivered'
        }]);
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const businessName = persona.identity?.name || 'Your Business';

    return (
        <>
            {/* Floating Chat Button */}
            <button
                onClick={() => {
                    handleOpenChange(true);
                    setIsMinimized(false);
                }}
                className={cn(
                    "fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110",
                    "bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700",
                    isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
                )}
            >
                <MessageCircle className="w-6 h-6 text-white" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Chat Window */}
            <div
                className={cn(
                    "fixed z-50 transition-all duration-300 ease-out",
                    // Desktop: bottom-right corner
                    "bottom-6 right-6 w-[380px] max-w-[calc(100vw-48px)]",
                    // Mobile: full screen
                    "sm:bottom-6 sm:right-6 sm:w-[380px]",
                    "max-sm:inset-0 max-sm:w-full max-sm:max-w-full",
                    isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none",
                    isMinimized ? "h-[60px]" : "h-[600px] max-h-[calc(100vh-48px)] max-sm:h-full max-sm:max-h-full"
                )}
            >
                <div className={cn(
                    "bg-white rounded-2xl max-sm:rounded-none shadow-2xl flex flex-col h-full overflow-hidden",
                    "border border-slate-200"
                )}>
                    {/* Header */}
                    <div className="shrink-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                        <div className="px-4 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm">Business Profile Agent</h3>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                        <span className="text-xs text-indigo-100">Online</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={clearChat}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                    title="Clear chat"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setIsMinimized(!isMinimized)}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors hidden sm:block"
                                    title={isMinimized ? "Expand" : "Minimize"}
                                >
                                    {isMinimized ? (
                                        <ChevronDown className="w-4 h-4 rotate-180" />
                                    ) : (
                                        <Minimize2 className="w-4 h-4" />
                                    )}
                                </button>
                                <button
                                    onClick={() => handleOpenChange(false)}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                    title="Close"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Minimized state info */}
                        {isMinimized && (
                            <div className="px-4 pb-3 text-xs text-indigo-100">
                                Click to continue chatting...
                            </div>
                        )}
                    </div>

                    {/* Chat Content - Hidden when minimized */}
                    {!isMinimized && (
                        <>
                            {/* Messages */}
                            <div
                                ref={chatContainerRef}
                                className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50"
                            >
                                {messages.map((message, idx) => (
                                    <div
                                        key={message.id}
                                        className={cn(
                                            "flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300",
                                            message.role === 'user' ? 'justify-end' : 'justify-start'
                                        )}
                                        style={{ animationDelay: `${idx * 50}ms` }}
                                    >
                                        {message.role === 'assistant' && (
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shrink-0 shadow-sm">
                                                <Bot className="w-4 h-4 text-white" />
                                            </div>
                                        )}

                                        <div className={cn(
                                            "max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm",
                                            message.role === 'user'
                                                ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-br-md"
                                                : "bg-white text-slate-800 rounded-bl-md border border-slate-100"
                                        )}>
                                            <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                                {message.content}
                                            </p>

                                            {/* Data updated badge */}
                                            {message.dataUpdated && (
                                                <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-white/20">
                                                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                                                    <span className="text-xs text-emerald-200 font-medium">
                                                        Profile updated
                                                    </span>
                                                </div>
                                            )}

                                            {/* Timestamp and status */}
                                            <div className={cn(
                                                "flex items-center gap-1.5 mt-1",
                                                message.role === 'user' ? 'justify-end' : 'justify-start'
                                            )}>
                                                <span className={cn(
                                                    "text-[10px]",
                                                    message.role === 'user' ? 'text-indigo-200' : 'text-slate-400'
                                                )}>
                                                    {formatTime(message.timestamp)}
                                                </span>
                                                {message.role === 'user' && (
                                                    <>
                                                        {message.status === 'sending' && (
                                                            <Loader2 className="w-3 h-3 text-indigo-200 animate-spin" />
                                                        )}
                                                        {message.status === 'sent' && (
                                                            <Check className="w-3 h-3 text-indigo-200" />
                                                        )}
                                                        {message.status === 'delivered' && (
                                                            <CheckCheck className="w-3 h-3 text-indigo-200" />
                                                        )}
                                                        {message.status === 'error' && (
                                                            <span className="text-[10px] text-red-300">Failed</span>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {message.role === 'user' && (
                                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                                <User className="w-4 h-4 text-slate-600" />
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Typing indicator */}
                                {isTyping && (
                                    <div className="flex gap-2 animate-in fade-in duration-200">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shrink-0 shadow-sm">
                                            <Bot className="w-4 h-4 text-white" />
                                        </div>
                                        <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-slate-100">
                                            <div className="flex gap-1">
                                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Quick Prompts */}
                            {messages.length <= 2 && (
                                <div className="shrink-0 px-4 py-2 bg-white border-t border-slate-100">
                                    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                                        {QUICK_PROMPTS.map((qp, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleQuickPrompt(qp.prompt)}
                                                disabled={isTyping}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 rounded-full text-xs font-medium text-slate-600 whitespace-nowrap transition-colors disabled:opacity-50"
                                            >
                                                <span>{qp.icon}</span>
                                                {qp.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Input Area */}
                            <div className="shrink-0 p-4 bg-white border-t border-slate-200">
                                <div className="flex items-end gap-2">
                                    <div className="flex-1 relative">
                                        <textarea
                                            ref={inputRef}
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="Type a message..."
                                            disabled={isTyping}
                                            rows={1}
                                            className="w-full px-4 py-2.5 bg-slate-100 rounded-2xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all disabled:opacity-50 max-h-32"
                                            style={{ minHeight: '44px' }}
                                        />
                                    </div>
                                    <button
                                        onClick={() => handleSend()}
                                        disabled={!input.trim() || isTyping}
                                        className={cn(
                                            "w-11 h-11 rounded-full flex items-center justify-center transition-all",
                                            input.trim() && !isTyping
                                                ? "bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg"
                                                : "bg-slate-100 text-slate-400"
                                        )}
                                    >
                                        {isTyping ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Send className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                                <p className="text-[10px] text-slate-400 text-center mt-2">
                                    Powered by AI • Updates save automatically
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
