"use client";

import React, { useState, useRef, useEffect } from 'react';
import { EssentialAgent, AgentRole } from '@/lib/partnerhub-types';
import { cn } from '@/lib/utils';
import {
    X,
    Send,
    Bot,
    Zap,
    Sparkles,
    User,
    Loader2,
    RefreshCw,
    MessageCircle
} from 'lucide-react';
import { testAgentAction } from '@/actions/partnerhub-actions';

interface AgentTestPanelProps {
    agent: EssentialAgent;
    partnerId: string;
    onClose: () => void;
}

interface TestMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const AGENT_ICONS = {
    [AgentRole.CUSTOMER_CARE]: Bot,
    [AgentRole.SALES_ASSISTANT]: Zap,
    [AgentRole.MARKETING_COMMS]: Sparkles,
};

const AGENT_COLORS = {
    [AgentRole.CUSTOMER_CARE]: 'bg-blue-500',
    [AgentRole.SALES_ASSISTANT]: 'bg-amber-500',
    [AgentRole.MARKETING_COMMS]: 'bg-purple-500',
};

const SAMPLE_PROMPTS = {
    [AgentRole.CUSTOMER_CARE]: [
        "What are your hours?",
        "How can I return a product?",
        "Where is my order?",
    ],
    [AgentRole.SALES_ASSISTANT]: [
        "What services do you offer?",
        "How much does it cost?",
        "Tell me about your products",
    ],
    [AgentRole.MARKETING_COMMS]: [
        "What promotions are available?",
        "Do you have any special offers?",
        "When is your next sale?",
    ],
};

export default function AgentTestPanel({ agent, partnerId, onClose }: AgentTestPanelProps) {
    const [messages, setMessages] = useState<TestMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const Icon = AGENT_ICONS[agent.role];
    const bgColor = AGENT_COLORS[agent.role];
    const samplePrompts = SAMPLE_PROMPTS[agent.role];

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: TestMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: input.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Use the testAgentAction which uses RAG without requiring a thread
            const result = await testAgentAction(
                partnerId,
                agent.id,
                userMessage.content
            );

            const assistantMessage: TestMessage = {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                content: result.success && result.response
                    ? result.response
                    : `Sorry, I encountered an error: ${result.message || 'Unknown error'}`,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error: any) {
            const errorMessage: TestMessage = {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                content: `Sorry, I encountered an error. Please try again.`,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSamplePrompt = (prompt: string) => {
        setInput(prompt);
        inputRef.current?.focus();
    };

    const resetChat = () => {
        setMessages([]);
        setInput('');
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg h-[600px] flex flex-col overflow-hidden">
                {/* Header */}
                <div className={cn("px-4 py-3 flex items-center justify-between text-white", bgColor)}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                            <Icon className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-semibold">{agent.name}</h2>
                            <p className="text-xs text-white/80">Test Mode • Responses are simulated</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={resetChat}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            title="Reset chat"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-auto p-4 space-y-4 bg-slate-50">
                    {messages.length === 0 && (
                        <div className="text-center py-8">
                            <div className={cn("w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center", bgColor)}>
                                <Icon className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="font-medium text-slate-900 mb-2">Test {agent.name}</h3>
                            <p className="text-sm text-slate-500 mb-4">
                                Try asking questions to see how your agent responds
                            </p>
                            <div className="space-y-2">
                                <p className="text-xs text-slate-400 uppercase tracking-wider">Try these:</p>
                                {samplePrompts.map((prompt, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSamplePrompt(prompt)}
                                        className="block w-full max-w-xs mx-auto px-4 py-2 text-sm text-slate-600 bg-white rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
                                    >
                                        "{prompt}"
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={cn(
                                "flex gap-3",
                                message.role === 'user' ? "justify-end" : "justify-start"
                            )}
                        >
                            {message.role === 'assistant' && (
                                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", bgColor)}>
                                    <Icon className="w-4 h-4 text-white" />
                                </div>
                            )}
                            <div
                                className={cn(
                                    "max-w-[80%] rounded-xl px-4 py-2.5",
                                    message.role === 'user'
                                        ? "bg-slate-900 text-white"
                                        : "bg-white border border-slate-200 text-slate-900"
                                )}
                            >
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            </div>
                            {message.role === 'user' && (
                                <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0">
                                    <User className="w-4 h-4 text-slate-600" />
                                </div>
                            )}
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex gap-3 justify-start">
                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", bgColor)}>
                                <Icon className="w-4 h-4 text-white" />
                            </div>
                            <div className="bg-white border border-slate-200 rounded-xl px-4 py-3">
                                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-slate-200 bg-white">
                    <div className="flex gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a message to test..."
                            disabled={isLoading}
                            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            className={cn(
                                "px-4 py-2.5 rounded-xl font-medium text-white transition-colors",
                                input.trim() && !isLoading
                                    ? `${bgColor} hover:opacity-90`
                                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                            )}
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
