"use client";

import React, { useState, useMemo } from 'react';
import { usePartnerHub } from '@/hooks/use-partnerhub';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { ChatContextType, DocumentMetadata, AgentProfile } from '@/lib/partnerhub-types';
import { cn } from '@/lib/utils';
import {
    Search,
    Plus,
    MoreHorizontal,
    MessageCircle,
    Bot,
    Sparkles,
    Zap,
    Briefcase,
    FileText,
    Users,
    Image as ImageIcon,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChatInterface from '@/components/partner/inbox/ChatInterface';

export default function InboxPage() {
    const {
        threads,
        activeThreadId,
        setActiveThreadId,
        documents,
        agents,
        selectedAgentId,
        setSelectedAgentId,
        activeContext,
        switchContext,
        createNewThread,
        isUploading,
        uploadDocument
    } = usePartnerHub();

    const { user } = useMultiWorkspaceAuth();

    const [chatSearch, setChatSearch] = useState('');
    const [activeMobileDetail, setActiveMobileDetail] = useState<'none' | 'chat'>('none');

    const filteredDocuments = useMemo(() => {
        const completed = documents.filter(d => d.status === 'COMPLETED');
        if (!chatSearch.trim()) return completed;
        const q = chatSearch.toLowerCase();
        return completed.filter(d =>
            d.name.toLowerCase().includes(q) ||
            d.tags?.some(t => t.toLowerCase().includes(q))
        );
    }, [documents, chatSearch]);

    const filteredAgents = useMemo(() => {
        if (!chatSearch.trim()) return agents;
        const q = chatSearch.toLowerCase();
        return agents.filter(a =>
            a.name.toLowerCase().includes(q) ||
            a.description?.toLowerCase().includes(q)
        );
    }, [agents, chatSearch]);

    const getAgentIcon = (iconName?: string) => {
        switch (iconName) {
            case 'Sparkles': return Sparkles;
            case 'Zap': return Zap;
            case 'Briefcase': return Briefcase;
            default: return Bot;
        }
    };

    const handleAgentSelect = (agent: AgentProfile) => {
        setSelectedAgentId(agent.id);
        switchContext({
            type: ChatContextType.AGENT,
            id: agent.id,
            name: agent.name,
            description: agent.description
        });
        setActiveMobileDetail('chat');
    };

    const handleDocumentSelect = (doc: DocumentMetadata) => {
        switchContext({
            type: ChatContextType.DOCUMENT,
            id: doc.id,
            name: doc.name,
            description: `${(doc.size / 1024).toFixed(0)} KB • ${doc.category?.toUpperCase() || 'DOCUMENT'}`
        });
        setActiveMobileDetail('chat');
    };

    const handleCreateThread = async () => {
        const threadId = await createNewThread('New Conversation');
        if (threadId) {
            setActiveThreadId(threadId);
            setActiveMobileDetail('chat');
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        for (const file of Array.from(files)) {
            await uploadDocument(file);
        }
        event.target.value = '';
    };

    return (
        <div className="flex h-full w-full overflow-hidden bg-gray-100">
            {/* Left Sidebar */}
            <div className={cn(
                "flex-col w-full md:w-[380px] h-full flex-shrink-0 border-r border-gray-200 bg-white z-10",
                activeMobileDetail === 'chat' ? 'hidden md:flex' : 'flex'
            )}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 bg-white border-b border-gray-100 h-16 flex-shrink-0">
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">Inbox</h1>
                    <div className="flex gap-2">
                        <div className="relative">
                            <input
                                type="file"
                                id="inbox-upload"
                                className="hidden"
                                onChange={handleFileUpload}
                                multiple
                                disabled={isUploading}
                            />
                            <label
                                htmlFor="inbox-upload"
                                className="p-2 text-gray-500 hover:bg-gray-100 rounded-full cursor-pointer block transition-colors"
                                title="Upload File"
                            >
                                {isUploading ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                                ) : (
                                    <Plus className="w-5 h-5" />
                                )}
                            </label>
                        </div>
                        <Button variant="ghost" size="icon" className="text-gray-500 hover:bg-gray-100">
                            <MoreHorizontal className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                {/* Search */}
                <div className="p-3">
                    <div className="flex items-center bg-gray-100/50 border border-gray-200 rounded-xl px-3 py-2.5 transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-300">
                        <Search className="w-4 h-4 text-gray-400 mr-2" />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            className="bg-transparent border-none text-sm w-full focus:ring-0 focus:outline-none p-0 placeholder:text-gray-400 text-gray-700"
                            value={chatSearch}
                            onChange={e => setChatSearch(e.target.value)}
                        />
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    {/* Active Chats Section */}
                    <div className="px-4 py-2">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Chats</span>
                            <button
                                onClick={handleCreateThread}
                                className="p-1 hover:bg-gray-100 rounded-full text-indigo-600 transition-colors"
                            >
                                <MessageCircle className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-1">
                            {threads.length === 0 ? (
                                <p className="text-xs text-gray-400 py-2 text-center">No active chats</p>
                            ) : (
                                threads.slice(0, 5).map(thread => (
                                    <div
                                        key={thread.id}
                                        onClick={() => {
                                            setActiveThreadId(thread.id);
                                            switchContext({
                                                type: ChatContextType.THREAD,
                                                id: thread.id,
                                                name: thread.title,
                                                description: `${thread.messageCount || 0} messages`
                                            });
                                            setActiveMobileDetail('chat');
                                        }}
                                        className={cn(
                                            "relative group flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors",
                                            activeThreadId === thread.id
                                                ? 'bg-indigo-50 shadow-sm ring-1 ring-indigo-100'
                                                : 'hover:bg-gray-50'
                                        )}
                                    >
                                        <div className="relative w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 flex-shrink-0 border border-gray-200">
                                            <Users className="w-5 h-5" />
                                            <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5 border-2 border-white">
                                                <MessageCircle className="w-2.5 h-2.5 text-white" />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline">
                                                <h3 className={cn(
                                                    "font-medium text-sm truncate",
                                                    activeThreadId === thread.id ? 'text-indigo-900' : 'text-gray-900'
                                                )}>
                                                    {thread.title}
                                                </h3>
                                                <span className="text-[10px] text-gray-400 flex-shrink-0">
                                                    {thread.lastMessageAt ? new Date((thread.lastMessageAt as any).seconds ? (thread.lastMessageAt as any).seconds * 1000 : thread.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 truncate">
                                                {thread.messageCount || 0} messages
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Assistants Section */}
                    <div className="px-4 py-2 mt-2">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Assistants</span>
                        </div>
                        <div className="space-y-1">
                            {filteredAgents.map(agent => {
                                const IconComponent = getAgentIcon(agent.avatar);
                                const isActive = activeContext?.type === ChatContextType.AGENT && activeContext?.id === agent.id;

                                return (
                                    <button
                                        key={agent.id}
                                        onClick={() => handleAgentSelect(agent)}
                                        className={cn(
                                            "w-full flex items-center gap-3 p-2 rounded-xl transition-all group text-left",
                                            isActive
                                                ? 'bg-indigo-50 shadow-sm ring-1 ring-indigo-100'
                                                : 'hover:bg-gray-50'
                                        )}
                                    >
                                        <div className={cn(
                                            "w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-sm flex-shrink-0",
                                            agent.type === 'SYSTEM' ? 'bg-indigo-600' : 'bg-purple-600'
                                        )}>
                                            <IconComponent className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className={cn(
                                                "block text-sm font-medium truncate",
                                                isActive ? 'text-indigo-900' : 'text-gray-900'
                                            )}>
                                                {agent.name}
                                            </span>
                                            <span className={cn(
                                                "block text-xs truncate",
                                                isActive ? 'text-indigo-700' : 'text-gray-500'
                                            )}>
                                                {agent.description || 'AI Assistant'}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}

                            <button
                                onClick={() => window.location.href = '/partner/core'}
                                className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-all text-left group border border-dashed border-gray-200 text-gray-400 hover:border-indigo-300 hover:text-indigo-600"
                            >
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-50 group-hover:bg-indigo-50 transition-colors">
                                    <Plus className="w-5 h-5" />
                                </div>
                                <span className="text-sm font-medium">Create New Agent</span>
                            </button>
                        </div>
                    </div>

                    {/* Knowledge Chats Section */}
                    {filteredDocuments.length > 0 && (
                        <div className="px-4 py-2 mt-2">
                            <div className="flex items-center justify-between mb-2 border-t border-gray-100 pt-4">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Knowledge Chats</span>
                            </div>
                            <div className="space-y-1">
                                {filteredDocuments.map(doc => {
                                    const isActive = activeContext?.type === ChatContextType.DOCUMENT && activeContext?.id === doc.id;

                                    return (
                                        <div
                                            key={doc.id}
                                            onClick={() => handleDocumentSelect(doc)}
                                            className={cn(
                                                "group flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors",
                                                isActive
                                                    ? 'bg-indigo-50 shadow-sm ring-1 ring-indigo-100'
                                                    : 'hover:bg-gray-50'
                                            )}
                                        >
                                            <div className={cn(
                                                "relative flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
                                                isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'
                                            )}>
                                                {doc.category === 'image' ? (
                                                    <ImageIcon className="w-5 h-5" />
                                                ) : (
                                                    <FileText className="w-5 h-5" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-baseline mb-0.5">
                                                    <h3 className={cn(
                                                        "font-medium text-sm truncate pr-2",
                                                        isActive ? 'text-indigo-900' : 'text-gray-900'
                                                    )}>
                                                        {doc.name}
                                                    </h3>
                                                    <span className="text-[10px] text-gray-400 flex-shrink-0">
                                                        {doc.createdAt ? new Date((doc.createdAt as any).seconds ? (doc.createdAt as any).seconds * 1000 : doc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {doc.tags?.length ? `#${doc.tags[0]} • ` : ''}
                                                    {doc.summary || `${(doc.size / 1024).toFixed(0)}KB`}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </ScrollArea>
            </div>

            {/* Main Chat Area */}
            <main className={cn(
                "flex-1 h-full bg-[#EFEAE2] relative flex flex-col",
                activeMobileDetail === 'chat' ? 'flex fixed inset-0 z-50 md:relative md:inset-auto' : 'hidden md:flex'
            )}>
                <ChatInterface onBack={() => setActiveMobileDetail('none')} />
            </main>
        </div>
    );
}