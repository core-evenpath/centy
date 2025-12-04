"use client";

import React, { useState, useEffect, useRef } from 'react';
import { usePartnerHub } from '@/hooks/use-partnerhub';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import {
    Send, Paperclip, Bot, User, MoreVertical, Search,
    Plus, MessageSquare, ArrowLeft, FileText, Sparkles,
    Loader2, Trash2, Check, Copy, ThumbsUp, ThumbsDown
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

function toDate(value: Date | Timestamp | string | null | undefined): Date | null {
    if (!value) return null;
    if (value instanceof Timestamp) return value.toDate();
    if (value instanceof Date) return value;
    if (typeof value === 'string') {
        const parsed = new Date(value);
        return isNaN(parsed.getTime()) ? null : parsed;
    }
    if (typeof value === 'object' && 'seconds' in value) {
        return new Date((value as { seconds: number }).seconds * 1000);
    }
    return null;
}

export default function ChatInterface() {
    const {
        threads,
        activeThreadId,
        setActiveThreadId,
        messages,
        messagesLoading,
        sendMessage,
        isGenerating,
        generationStatus,
        agents,
        selectedAgentId,
        setSelectedAgentId,
        createNewThread,
        deleteThread,
        chatSearch,
        setChatSearch
    } = usePartnerHub();

    const { user } = useMultiWorkspaceAuth();
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isGenerating]);

    const handleSend = async () => {
        if (!input.trim() || isGenerating) return;
        const text = input;
        setInput('');
        await sendMessage(text);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const filteredThreads = threads.filter(t =>
        t.title.toLowerCase().includes(chatSearch.toLowerCase())
    );

    const activeThread = threads.find(t => t.id === activeThreadId);
    const selectedAgent = agents.find(a => a.id === selectedAgentId);

    const formatThreadDate = (timestamp: any): string => {
        const date = toDate(timestamp);
        if (!date) return '';
        return format(date, 'MMM d');
    };

    return (
        <div className="flex h-full bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
            <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50/50">
                <div className="p-4 border-b border-gray-200 space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-gray-800">Inbox</h2>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => createNewThread('New Conversation')}
                            className="h-8 w-8 text-gray-500 hover:text-indigo-600"
                        >
                            <Plus className="h-5 w-5" />
                        </Button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search chats..."
                            className="pl-9 bg-white border-gray-200 focus-visible:ring-indigo-500"
                            value={chatSearch}
                            onChange={(e) => setChatSearch(e.target.value)}
                        />
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                        {filteredThreads.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 text-sm">
                                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                <p>No conversations found</p>
                            </div>
                        ) : (
                            filteredThreads.map((thread) => (
                                <div
                                    key={thread.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setActiveThreadId(thread.id)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            setActiveThreadId(thread.id);
                                        }
                                    }}
                                    className={cn(
                                        "w-full text-left p-3 rounded-lg transition-all duration-200 group relative cursor-pointer",
                                        activeThreadId === thread.id
                                            ? "bg-white shadow-sm border border-indigo-100 ring-1 ring-indigo-50"
                                            : "hover:bg-gray-100 border border-transparent"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className={cn(
                                            "font-medium text-sm truncate max-w-[180px]",
                                            activeThreadId === thread.id ? "text-indigo-900" : "text-gray-700"
                                        )}>
                                            {thread.title || 'New Conversation'}
                                        </h3>
                                        <span className="text-[10px] text-gray-400 flex-shrink-0">
                                            {formatThreadDate(thread.updatedAt)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 truncate pr-6">
                                        {thread.description || 'No messages yet'}
                                    </p>

                                    <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <MoreVertical className="h-3 w-3" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    className="text-red-600 focus:text-red-600"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteThread(thread.id);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>

            <div className="flex-1 flex flex-col bg-white">
                <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-indigo-100 bg-indigo-50">
                            <AvatarImage src={selectedAgent?.avatar} />
                            <AvatarFallback className="text-indigo-600 bg-indigo-50">
                                {selectedAgent?.name?.charAt(0) || <Bot className="h-5 w-5" />}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="font-semibold text-gray-900">
                                    {activeThread?.title || 'New Conversation'}
                                </h2>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-normal text-gray-500">
                                    {selectedAgent?.name || 'AI Assistant'}
                                </Badge>
                            </div>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                                Online
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                            <SelectTrigger className="w-[180px] h-9 text-xs">
                                <SelectValue placeholder="Select Agent" />
                            </SelectTrigger>
                            <SelectContent>
                                {agents.map(agent => (
                                    <SelectItem key={agent.id} value={agent.id}>
                                        <div className="flex items-center gap-2">
                                            <span>{agent.avatar}</span>
                                            <span>{agent.name}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-600">
                            <MoreVertical className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                <ScrollArea className="flex-1 px-6 py-6">
                    <div className="space-y-6 max-w-3xl mx-auto">
                        {messages.length === 0 ? (
                            <div className="text-center py-12 space-y-4">
                                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Sparkles className="h-8 w-8 text-indigo-500" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Start a new conversation
                                </h3>
                                <p className="text-gray-500 max-w-sm mx-auto text-sm">
                                    Choose an agent and start typing to get help with your tasks, documents, or questions.
                                </p>
                                <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto mt-8">
                                    {['Summarize a document', 'Draft an email', 'Analyze data', 'Brainstorm ideas'].map((suggestion) => (
                                        <Button
                                            key={suggestion}
                                            variant="outline"
                                            className="h-auto py-3 px-4 justify-start text-gray-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50"
                                            onClick={() => {
                                                setInput(suggestion);
                                            }}
                                        >
                                            <MessageSquare className="h-4 w-4 mr-2 opacity-50" />
                                            {suggestion}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={cn(
                                        "flex gap-4 group",
                                        msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                                    )}
                                >
                                    <Avatar className={cn(
                                        "h-8 w-8 mt-1 border",
                                        msg.role === 'user' ? "bg-gray-100 border-gray-200" : "bg-indigo-50 border-indigo-100"
                                    )}>
                                        {msg.role === 'user' ? (
                                            <AvatarFallback className="text-gray-600">
                                                {user?.email?.charAt(0).toUpperCase() || <User className="h-4 w-4" />}
                                            </AvatarFallback>
                                        ) : (
                                            <>
                                                <AvatarImage src={selectedAgent?.avatar} />
                                                <AvatarFallback className="text-indigo-600">
                                                    <Bot className="h-4 w-4" />
                                                </AvatarFallback>
                                            </>
                                        )}
                                    </Avatar>

                                    <div className={cn(
                                        "flex flex-col max-w-[80%]",
                                        msg.role === 'user' ? "items-end" : "items-start"
                                    )}>
                                        <div className={cn(
                                            "rounded-2xl px-5 py-3.5 shadow-sm text-sm leading-relaxed",
                                            msg.role === 'user'
                                                ? "bg-indigo-600 text-white rounded-tr-none"
                                                : "bg-white border border-gray-100 text-gray-800 rounded-tl-none"
                                        )}>
                                            <div className="whitespace-pre-wrap">{msg.content}</div>
                                        </div>

                                        {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {msg.groundingChunks.map((chunk, idx) => (
                                                    <Badge
                                                        key={idx}
                                                        variant="secondary"
                                                        className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-100 cursor-pointer transition-colors text-[10px] py-0.5 px-2"
                                                    >
                                                        <FileText className="w-3 h-3 mr-1" />
                                                        {chunk.documentName}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}

                                        {msg.role === 'assistant' && (
                                            <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-gray-600">
                                                    <Copy className="h-3 w-3" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-gray-600">
                                                    <ThumbsUp className="h-3 w-3" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-gray-600">
                                                    <ThumbsDown className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}

                        {isGenerating && (
                            <div className="flex gap-4">
                                <Avatar className="h-8 w-8 mt-1 bg-indigo-50 border border-indigo-100">
                                    <AvatarFallback className="text-indigo-600">
                                        <Bot className="h-4 w-4" />
                                    </AvatarFallback>
                                </Avatar>
                                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-5 py-4 shadow-sm flex items-center gap-3">
                                    <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                                    <span className="text-sm text-gray-500">{generationStatus || 'Thinking...'}</span>
                                </div>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>

                <div className="p-4 bg-white border-t border-gray-200">
                    <div className="max-w-3xl mx-auto relative flex items-end gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200 focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-50/50 transition-all">
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-indigo-600 mb-0.5">
                            <Paperclip className="h-5 w-5" />
                        </Button>
                        <Textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a message..."
                            className="min-h-[44px] max-h-32 border-0 bg-transparent focus-visible:ring-0 resize-none py-3 px-2 text-sm"
                            rows={1}
                        />
                        <Button
                            onClick={handleSend}
                            disabled={!input.trim() || isGenerating}
                            className={cn(
                                "h-9 w-9 mb-0.5 transition-all",
                                input.trim() ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-gray-200 text-gray-400 hover:bg-gray-300"
                            )}
                            size="icon"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="max-w-3xl mx-auto mt-2 flex justify-center">
                        <p className="text-[10px] text-gray-400">
                            AI can make mistakes. Please verify important information.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}