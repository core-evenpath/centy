"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
    Send,
    Bot,
    User,
    Sparkles,
    Loader2,
    RefreshCw,
    FileText,
    CheckCircle2,
    AlertCircle,
    ChevronDown,
    MessageSquare,
    Zap,
    X
} from 'lucide-react';
import { chatWithPersonaManagerAction } from '@/actions/business-persona-actions';
import type { BusinessPersona } from '@/lib/business-persona-types';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    dataUpdated?: boolean;
}

interface SettingsAIChatProps {
    partnerId: string;
    persona: Partial<BusinessPersona>;
    onPersonaUpdated: () => void;
    isOpen: boolean;
    onClose: () => void;
}

const QUICK_ACTIONS = [
    { label: 'Update hours', prompt: 'Update my business hours to Monday-Friday 9am-6pm' },
    { label: 'Add service', prompt: 'Add a new service called ' },
    { label: 'Change phone', prompt: 'Change my phone number to ' },
    { label: 'Set tagline', prompt: 'Set my business tagline to ' },
    { label: 'Add USP', prompt: 'Add a unique selling point: ' },
    { label: 'Import from docs', prompt: 'Import business information from my uploaded documents' },
];

export default function SettingsAIChat({
    partnerId,
    persona,
    onPersonaUpdated,
    isOpen,
    onClose
}: SettingsAIChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: `Hello! I'm your Business Profile Assistant. I can help you update your profile using natural language.\n\nTry saying things like:\n• "Update my business hours"\n• "Add a new service"\n• "Import info from my documents"`,
            timestamp: new Date(),
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showQuickActions, setShowQuickActions] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSend = async (messageOverride?: string) => {
        const messageText = messageOverride || input.trim();
        if (!messageText || isLoading) return;

        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: messageText,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setShowQuickActions(false);

        try {
            // Build message history for context
            const messageHistory = messages
                .filter(m => m.role !== 'system')
                .map(m => ({ role: m.role, content: m.content }));

            messageHistory.push({ role: 'user', content: messageText });

            const result = await chatWithPersonaManagerAction(
                partnerId,
                messageHistory as any,
                persona as BusinessPersona
            );

            if (result.success && result.response) {
                const assistantMessage: ChatMessage = {
                    id: `assistant-${Date.now()}`,
                    role: 'assistant',
                    content: result.response,
                    timestamp: new Date(),
                    dataUpdated: result.dataUpdated,
                };

                setMessages(prev => [...prev, assistantMessage]);

                // If data was updated, trigger refresh
                if (result.dataUpdated) {
                    onPersonaUpdated();
                }
            } else {
                const errorMessage: ChatMessage = {
                    id: `error-${Date.now()}`,
                    role: 'assistant',
                    content: result.message || 'Sorry, I encountered an error. Please try again.',
                    timestamp: new Date(),
                };
                setMessages(prev => [...prev, errorMessage]);
            }
        } catch (error: any) {
            const errorMessage: ChatMessage = {
                id: `error-${Date.now()}`,
                role: 'assistant',
                content: `Error: ${error.message || 'Something went wrong'}`,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickAction = (prompt: string) => {
        // If prompt ends with a space, it needs user input
        if (prompt.endsWith(' ')) {
            setInput(prompt);
            inputRef.current?.focus();
        } else {
            handleSend(prompt);
        }
    };

    const clearChat = () => {
        setMessages([{
            id: 'welcome-new',
            role: 'assistant',
            content: 'Chat cleared. How can I help you update your business profile?',
            timestamp: new Date(),
        }]);
        setShowQuickActions(true);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 md:relative md:inset-auto">
            {/* Mobile backdrop */}
            <div
                className="md:hidden absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Chat Panel */}
            <div className={cn(
                "absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col",
                "md:relative md:w-80 md:max-w-none md:shadow-none md:border-l md:border-slate-200"
            )}>
                {/* Header */}
                <div className="shrink-0 px-4 py-4 border-b border-slate-200 bg-gradient-to-r from-indigo-600 to-purple-600">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-white text-sm">AI Profile Assistant</h3>
                                <p className="text-xs text-indigo-100">Update via natural language</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={clearChat}
                                className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                            >
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10 md:hidden"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={cn(
                                    "flex gap-3",
                                    message.role === 'user' ? 'justify-end' : 'justify-start'
                                )}
                            >
                                {message.role === 'assistant' && (
                                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                                        <Bot className="w-4 h-4 text-indigo-600" />
                                    </div>
                                )}

                                <div className={cn(
                                    "max-w-[85%] rounded-2xl px-4 py-2.5",
                                    message.role === 'user'
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-slate-100 text-slate-900'
                                )}>
                                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                        {message.content}
                                    </p>

                                    {message.dataUpdated && (
                                        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-indigo-200/30">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                            <span className="text-xs text-emerald-600 font-medium">
                                                Profile updated
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {message.role === 'user' && (
                                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
                                        <User className="w-4 h-4 text-white" />
                                    </div>
                                )}
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                                    <Bot className="w-4 h-4 text-indigo-600" />
                                </div>
                                <div className="bg-slate-100 rounded-2xl px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                                        <span className="text-sm text-slate-500">Processing...</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                </ScrollArea>

                {/* Quick Actions */}
                {showQuickActions && (
                    <div className="shrink-0 px-4 py-3 border-t border-slate-100 bg-slate-50">
                        <p className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1.5">
                            <Zap className="w-3 h-3" />
                            Quick Actions
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {QUICK_ACTIONS.map((action, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleQuickAction(action.prompt)}
                                    className="px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-colors"
                                >
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Input */}
                <div className="shrink-0 p-4 border-t border-slate-200 bg-white">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSend();
                        }}
                        className="flex gap-2"
                    >
                        <Input
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a message..."
                            disabled={isLoading}
                            className="flex-1 h-10 text-sm"
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={!input.trim() || isLoading}
                            className="h-10 w-10 bg-indigo-600 hover:bg-indigo-700"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </Button>
                    </form>
                    <p className="text-[10px] text-slate-400 text-center mt-2">
                        AI can read your uploaded documents and update your profile
                    </p>
                </div>
            </div>
        </div>
    );
}
