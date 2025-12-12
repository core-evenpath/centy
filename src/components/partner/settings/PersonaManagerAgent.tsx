'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, User, Bot, Sparkles, Loader2, PlayCircle, Lightbulb, PenTool } from 'lucide-react';
import { BusinessPersona } from '@/lib/business-persona-types';
import { chatWithPersonaManagerAction } from '@/actions/business-persona-actions';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface PersonaManagerAgentProps {
    partnerId: string;
    persona: BusinessPersona;
    onDataUpdate?: () => void;
}

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export default function PersonaManagerAgent({ partnerId, persona, onDataUpdate }: PersonaManagerAgentProps) {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: "Hi! I'm your Business Manager AI. I can help you improve your profile, answer questions about your settings, or simulate how your customers will experience your brand. What would you like to do?" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSend = async (text: string = input) => {
        if (!text.trim() || isLoading) return;

        const userMsg: Message = { role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const result = await chatWithPersonaManagerAction(partnerId, [...messages, userMsg], persona);

            if (result.success && result.response) {
                setMessages(prev => [...prev, { role: 'assistant', content: result.response! }]);

                // Refresh data if an update occurred
                if (result.dataUpdated && onDataUpdate) {
                    onDataUpdate();
                }
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I encountered an error connecting to the AI service. Please try again later." }]);
            }
        } catch (e) {
            console.error(e);
            setMessages(prev => [...prev, { role: 'assistant', content: "An unexpected error occurred." }]);
        } finally {
            setIsLoading(false);
        }
    };

    const runSimulation = () => handleSend("Simulate a conversation with a customer interested in our main product.");

    return (
        <Card className="h-[650px] flex flex-col border-indigo-100 shadow-md">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-white pb-4 border-b">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-sm ring-2 ring-indigo-100">
                        <Bot className="w-6 h-6" />
                    </div>
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            Business Manager AI
                            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-normal">Beta</span>
                        </CardTitle>
                        <CardDescription>Your dedicated profile assistant & simulator</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0 flex flex-col bg-slate-50/30">
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4 max-w-3xl mx-auto">
                        {messages.map((m, i) => (
                            <div key={i} className={cn("flex gap-3 animate-in fade-in slide-in-from-bottom-2", m.role === 'user' ? "flex-row-reverse" : "")}>
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                                    m.role === 'user' ? "bg-white border" : "bg-indigo-600 text-white"
                                )}>
                                    {m.role === 'user' ? <User className="w-4 h-4 text-gray-600" /> : <Sparkles className="w-4 h-4" />}
                                </div>
                                <div className={cn(
                                    "p-3 rounded-2xl max-w-[85%] text-sm shadow-sm",
                                    m.role === 'user'
                                        ? "bg-white text-gray-900 rounded-tr-none border"
                                        : "bg-indigo-600 text-white rounded-tl-none"
                                )}>
                                    {m.content.split('\n').map((line, j) => (
                                        <p key={j} className={j > 0 ? "mt-2" : ""}>{line}</p>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                                </div>
                                <div className="p-3 rounded-2xl rounded-tl-none bg-indigo-50 text-sm italic text-muted-foreground border border-indigo-100">
                                    Analyzing your business profile...
                                </div>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>

                {/* Suggestions / Shortcuts */}
                <div className="bg-white border-t p-2">
                    {messages.length < 5 && !isLoading && (
                        <div className="mb-2 flex gap-2 overflow-x-auto pb-2 px-2 scrollbar-none">
                            <Button variant="outline" size="sm" onClick={runSimulation} className="text-xs whitespace-nowrap bg-indigo-50 border-indigo-200 hover:bg-indigo-100 text-indigo-700">
                                <PlayCircle className="w-3 h-3 mr-1" /> Run Simulation
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleSend("How detailed is my profile?")} className="text-xs whitespace-nowrap">
                                <Lightbulb className="w-3 h-3 mr-1" /> Review profile
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleSend("Suggest improvements for my Brand Voice")} className="text-xs whitespace-nowrap">
                                <PenTool className="w-3 h-3 mr-1" /> Brand Voice tips
                            </Button>
                        </div>
                    )}

                    <div className="flex gap-2 max-w-3xl mx-auto">
                        <Input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Ask me about your business settings..."
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                            disabled={isLoading}
                            className="bg-gray-50 border-gray-200 focus-visible:ring-indigo-500"
                        />
                        <Button
                            onClick={() => handleSend()}
                            disabled={isLoading || !input.trim()}
                            size="icon"
                            className="bg-indigo-600 hover:bg-indigo-700 shrink-0"
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
