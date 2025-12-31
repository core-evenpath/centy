"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { usePartnerHub } from '@/hooks/use-partnerhub';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { ChatContextType, Attachment } from '@/lib/partnerhub-types';
import { cn } from '@/lib/utils';
import { Timestamp } from 'firebase/firestore';
import {
    Bot,
    FileText,
    X,
    Sparkles,
    ImagePlus,
    ArrowUp,
    ArrowLeft,
    MoreVertical,
    Phone,
    Video,
    CheckCheck,
    Hash,
    Zap,
    BarChart,
    MessageCircle,
    Plus,
    File as LucideFile
} from 'lucide-react';

interface ChatInterfaceProps {
    onBack?: () => void;
    showBackButton?: boolean;
    hideCallButtons?: boolean;
}

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

const ThinkingSkeleton: React.FC<{ status?: string }> = ({ status }) => (
    <div className="flex items-center gap-3 p-3 max-w-[300px]">
        <div className="flex space-x-1">
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '75ms' }}></div>
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        </div>
        <span className="text-xs text-gray-500 font-medium animate-pulse">{status || 'Thinking...'}</span>
    </div>
);

export default function ChatInterface({ onBack, showBackButton, hideCallButtons }: ChatInterfaceProps) {
    const {
        messages,
        sendMessage,
        isGenerating,
        generationStatus,
        activeContext,
        documents,
        agents,
        switchContext,
        uploadDocument
    } = usePartnerHub();

    const { user } = useMultiWorkspaceAuth();

    const [input, setInput] = useState('');
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [inputMode, setInputMode] = useState<'chat' | 'image'>('chat');

    const [triggerType, setTriggerType] = useState<null | '/' | '#'>(null);
    const [filterQuery, setFilterQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isGenerating]);

    const uniqueTags = useMemo(() => {
        return Array.from(new Set(documents.flatMap(d => d.tags || []))) as string[];
    }, [documents]);

    const filteredItems = useMemo(() => {
        if (!triggerType) return [];
        const q = filterQuery.toLowerCase();

        if (triggerType === '/') {
            // If a tag filter is active, only show docs with that tag
            const docsToFilter = selectedTagFilter
                ? documents.filter(d => d.tags?.includes(selectedTagFilter))
                : documents;
            return docsToFilter
                .filter(d => d.status === 'COMPLETED' && d.name.toLowerCase().includes(q))
                .slice(0, 8)
                .map(d => ({ id: d.id, label: d.name, type: 'document' as const, sub: d.category || 'document' }));
        } else {
            // Show tags, then show documents under each tag when selected
            return uniqueTags
                .filter(t => t.toLowerCase().includes(q))
                .slice(0, 8)
                .map(t => {
                    const docCount = documents.filter(d => d.tags?.includes(t)).length;
                    return { id: t, label: t, type: 'tag' as const, sub: `${docCount} document${docCount !== 1 ? 's' : ''}` };
                });
        }
    }, [triggerType, filterQuery, documents, uniqueTags, selectedTagFilter]);

    useEffect(() => {
        if (activeContext?.initialMode) {
            setInputMode(activeContext.initialMode);
        }
    }, [activeContext]);

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setInput(val);

        e.target.style.height = 'auto';
        e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;

        const match = val.match(/(?:^|\s)([\/#])([^\n]*)$/);

        if (match) {
            const type = match[1] as '/' | '#';
            const query = match[2];

            if (type === '#' && query.includes(' ')) {
                setTriggerType(null);
                setFilterQuery('');
                return;
            }

            const validFileChars = /^[a-zA-Z0-9_\-\.\s\(\)\[\]]*$/;
            if (type === '/' && !validFileChars.test(query)) {
                setTriggerType(null);
                setFilterQuery('');
                return;
            }

            setTriggerType(type);
            setFilterQuery(query);
            setSelectedIndex(0);
        } else {
            setTriggerType(null);
            setFilterQuery('');
        }
    };

    const handleSmartSelect = (item: { id: string; label: string; type: 'document' | 'tag' }) => {
        if (item.type === 'document') {
            const doc = documents.find(d => d.id === item.id);
            if (doc) {
                switchContext({
                    type: ChatContextType.DOCUMENT,
                    id: doc.id,
                    name: doc.name,
                    description: `${(doc.size / 1024).toFixed(0)} KB • ${doc.category?.toUpperCase() || 'DOCUMENT'}`
                });
            }
            // Clear input and close popup
            const lastIndex = input.lastIndexOf(triggerType! + filterQuery);
            if (lastIndex !== -1) {
                const newVal = input.substring(0, lastIndex).trim();
                setInput(newVal);
            } else {
                setInput('');
            }
            setTriggerType(null);
            setSelectedTagFilter(null);
        } else if (item.type === 'tag') {
            // When tag is selected, switch to / mode to show documents with that tag
            setSelectedTagFilter(item.label);
            setTriggerType('/');
            setFilterQuery('');
            setSelectedIndex(0);
            // Update input to show we're filtering by tag
            const lastIndex = input.lastIndexOf('#' + filterQuery);
            if (lastIndex !== -1) {
                const newVal = input.substring(0, lastIndex) + `#${item.label} /`;
                setInput(newVal);
            }
            return; // Don't close popup yet
        }

        inputRef.current?.focus();
    };

    const clearTagFilter = () => {
        setSelectedTagFilter(null);
        const lastIndex = input.lastIndexOf('/');
        if (lastIndex !== -1) {
            setInput(input.substring(0, lastIndex).replace(/#[^\s]+\s*$/, '').trim());
        }
        setTriggerType(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (triggerType) {
            if (filteredItems.length > 0) {
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredItems.length - 1));
                    return;
                }
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelectedIndex(prev => (prev < filteredItems.length - 1 ? prev + 1 : 0));
                    return;
                }
                if (e.key === 'Enter' || e.key === 'Tab') {
                    e.preventDefault();
                    handleSmartSelect(filteredItems[selectedIndex]);
                    return;
                }
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                setTriggerType(null);
                return;
            }
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleSubmit = async () => {
        if ((input.trim() || attachments.length > 0) && !isGenerating) {
            const messageText = input.trim();
            const messageAttachments = [...attachments];
            const isImage = inputMode === 'image';

            // Determine reference image for editing/regeneration
            let referenceImageUrl: string | undefined;

            if (isImage) {
                // 1. Check attachments for an image (highest priority)
                const imageAttachment = attachments.find(a => a.type === 'image');
                if (imageAttachment) {
                    // Try to find in documents to get storage URL
                    const doc = documents.find(d => d.id === imageAttachment.id);
                    if (doc?.storageUrl) {
                        referenceImageUrl = doc.storageUrl;
                    }
                }

                // 2. If no attachment, check active context (e.g. "Chat with Document")
                if (!referenceImageUrl && activeContext?.type === ChatContextType.DOCUMENT) {
                    const doc = documents.find(d => d.id === activeContext.id);
                    // Check if it's an image
                    if (doc && (doc.category === 'image' || doc.mimeType?.startsWith('image/'))) {
                        referenceImageUrl = doc.storageUrl;
                    }
                }
            }

            setInput('');
            setAttachments([]);
            setTriggerType(null);
            if (inputRef.current) inputRef.current.style.height = 'auto';

            // Reset to chat mode after sending an image request
            if (isImage) {
                setInputMode('chat');
            }

            await sendMessage(messageText, messageAttachments, {
                isImageMode: isImage,
                referenceImageUrl
            });
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        for (const file of Array.from(files)) {
            if (file.type.startsWith('image/')) {
                setInputMode('image');
            }

            const docId = await uploadDocument(file);

            if (docId) {
                const newAtt: Attachment = {
                    id: docId,
                    type: file.type.startsWith('image/') ? 'image' : 'document',
                    name: file.name,
                    mimeType: file.type,
                    url: URL.createObjectURL(file),
                    size: file.size
                };
                setAttachments(prev => [...prev, newAtt]);
            }
        }

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeAttachment = (idx: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== idx));
    };

    const toggleMode = () => {
        setInputMode(prev => prev === 'chat' ? 'image' : 'chat');
        inputRef.current?.focus();
    };

    const getContextDetails = () => {
        if (!activeContext) {
            return {
                title: 'Select a conversation',
                subtitle: '',
                icon: <Bot className="w-5 h-5 text-white" />,
                bgColor: 'bg-gray-400',
                tags: [] as string[]
            };
        }

        if (activeContext.type === ChatContextType.AGENT) {
            const agent = agents.find(a => a.id === activeContext.id);
            let IconComponent = Bot;
            if (agent?.avatar === 'Sparkles') IconComponent = Sparkles;
            if (agent?.avatar === 'Zap') IconComponent = Zap;
            if (agent?.avatar === 'BarChart') IconComponent = BarChart;

            return {
                title: agent?.name || activeContext.name,
                subtitle: agent?.description || 'AI Assistant',
                icon: <IconComponent className="w-5 h-5 text-white" />,
                bgColor: agent?.type === 'SYSTEM' ? 'bg-indigo-600' : 'bg-purple-600',
                tags: [] as string[]
            };
        }

        if (activeContext.type === ChatContextType.DOCUMENT) {
            const doc = documents.find(d => d.id === activeContext.id);
            return {
                title: doc?.name || activeContext.name,
                subtitle: doc ? `${(doc.size / 1024).toFixed(1)} KB • ${doc.category || 'document'}` : 'Document',
                icon: <FileText className="w-5 h-5 text-white" />,
                bgColor: 'bg-blue-500',
                tags: doc?.tags || []
            };
        }

        if (activeContext.type === ChatContextType.THREAD) {
            return {
                title: activeContext.name,
                subtitle: 'Conversation',
                icon: <MessageCircle className="w-5 h-5 text-white" />,
                bgColor: 'bg-green-600',
                tags: [] as string[]
            };
        }

        return {
            title: activeContext.name,
            subtitle: activeContext.description || '',
            icon: <Bot className="w-5 h-5 text-white" />,
            bgColor: 'bg-indigo-600',
            tags: [] as string[]
        };
    };

    const contextInfo = getContextDetails();
    const isImageMode = inputMode === 'image';

    return (
        <div className="flex flex-col h-full bg-[#f4f1eb] relative font-sans">

            {/* CRM Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm z-30 transition-all sticky top-0">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className={cn(
                            "p-1 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full",
                            !onBack && "hidden",
                            !showBackButton && "md:hidden"
                        )}
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>

                    <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center border shadow-sm transition-colors",
                        contextInfo.bgColor
                    )}>
                        {contextInfo.icon}
                    </div>

                    <div className="flex flex-col">
                        <h2 className="font-semibold text-gray-900 text-sm md:text-base leading-tight truncate max-w-[200px] md:max-w-md">
                            {contextInfo.title}
                        </h2>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{contextInfo.subtitle}</span>
                            {contextInfo.tags.length > 0 && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                                    <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px]">
                                        #{contextInfo.tags[0]}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 text-indigo-600">
                    {!hideCallButtons && (
                        <>
                            <Phone className="w-5 h-5 opacity-40 cursor-not-allowed" />
                            <Video className="w-5 h-5 opacity-40 cursor-not-allowed" />
                        </>
                    )}
                    <MoreVertical className="w-5 h-5 cursor-pointer hover:bg-gray-50 rounded-full" />
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-32 scroll-smooth bg-[#f4f1eb]">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-6 opacity-80 mt-10">
                        <div className="bg-white p-6 rounded-2xl shadow-sm ring-1 ring-gray-900/5">
                            <Bot className="w-10 h-10 text-indigo-500" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-lg font-semibold text-gray-900">Hello there.</p>
                            <p className="text-sm text-gray-500 max-w-xs mx-auto">
                                I'm ready to help you with {contextInfo.title}. Use <code className="bg-gray-200 px-1 rounded text-gray-700">/</code> to reference files.
                            </p>
                        </div>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isUser = msg.role === 'user';
                        const timestamp = toDate(msg.createdAt);

                        return (
                            <div key={msg.id} className={cn("flex w-full group", isUser ? 'justify-end' : 'justify-start')}>
                                <div
                                    className={cn(
                                        "relative max-w-[85%] md:max-w-[70%] px-5 py-3.5 shadow-sm text-[15px] leading-relaxed transition-all",
                                        isUser
                                            ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm'
                                            : 'bg-white text-gray-800 rounded-2xl rounded-tl-sm border border-gray-100'
                                    )}
                                >
                                    {msg.attachments && msg.attachments.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {msg.attachments.map((att, i) => (
                                                <div key={i} className="relative rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity ring-1 ring-black/5">
                                                    {att.type === 'image' ? (
                                                        <img
                                                            src={att.url || att.thumbnailUrl}
                                                            alt="attachment"
                                                            className="h-48 w-auto object-cover rounded-lg bg-white"
                                                        />
                                                    ) : (
                                                        <div className={cn(
                                                            "flex items-center gap-3 p-2.5 rounded-lg border",
                                                            isUser ? 'bg-white/10 border-white/20' : 'bg-gray-50 border-gray-200'
                                                        )}>
                                                            <FileText className={cn("w-8 h-8", isUser ? 'text-white/80' : 'text-indigo-500')} />
                                                            <div className="text-xs">
                                                                <p className={cn("font-medium truncate max-w-[120px]", isUser ? 'text-white' : 'text-gray-900')}>{att.name}</p>
                                                                <p className={isUser ? 'text-white/60' : 'text-gray-500'}>{att.mimeType?.split('/')[1]?.toUpperCase()}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Format message content with markdown-like rendering */}
                                    <div className="whitespace-pre-wrap break-words">
                                        {msg.content.split('\n').map((line, idx) => {
                                            // Check for bold text like **text**
                                            const boldRegex = /\*\*(.*?)\*\*/g;
                                            const parts = [];
                                            let lastIndex = 0;
                                            let match;

                                            while ((match = boldRegex.exec(line)) !== null) {
                                                if (match.index > lastIndex) {
                                                    parts.push(<span key={`text-${idx}-${lastIndex}`}>{line.substring(lastIndex, match.index)}</span>);
                                                }
                                                parts.push(<strong key={`bold-${idx}-${match.index}`} className="font-semibold">{match[1]}</strong>);
                                                lastIndex = match.index + match[0].length;
                                            }

                                            if (lastIndex < line.length) {
                                                parts.push(<span key={`text-${idx}-${lastIndex}`}>{line.substring(lastIndex)}</span>);
                                            }

                                            // Handle bullet points
                                            const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-');
                                            const isNumbered = /^\d+\./.test(line.trim());

                                            if (isBullet || isNumbered) {
                                                return (
                                                    <div key={idx} className="flex gap-2 my-1">
                                                        <span className="shrink-0">{line.trim().split(' ')[0]}</span>
                                                        <span className="flex-1">
                                                            {parts.length > 0 ? parts : line.substring(line.indexOf(' ') + 1)}
                                                        </span>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div key={idx} className={line.trim() === '' ? 'h-2' : ''}>
                                                    {parts.length > 0 ? parts : line}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                                        <div className="flex gap-1 mt-2 flex-wrap">
                                            {msg.groundingChunks.map((chunk, c) => (
                                                <span key={c} className="flex items-center text-[9px] bg-black/5 px-1.5 py-0.5 rounded">
                                                    <LucideFile className="w-2.5 h-2.5 mr-1" />{chunk.documentName}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <div className={cn(
                                        "flex flex-wrap items-center justify-end gap-2 mt-2 select-none",
                                        isUser ? 'text-indigo-200' : 'text-gray-400'
                                    )}>
                                        <span className="text-[10px] flex items-center gap-1">
                                            {timestamp ? timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                            {isUser && <CheckCheck className="w-3 h-3 opacity-70" />}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}

                {isGenerating && (
                    <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2">
                        <div className="bg-white rounded-2xl rounded-tl-sm p-1 shadow-sm border border-gray-100">
                            <ThinkingSkeleton status={generationStatus} />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Floating Input Dock */}
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 pointer-events-none z-50 flex justify-center">

                {triggerType && (
                    <div className="absolute bottom-full mb-4 w-full max-w-2xl px-4 pointer-events-auto">
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                            <div className="bg-gray-50/50 px-4 py-2 text-xs font-semibold text-gray-500 border-b border-gray-200/50 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <span>{triggerType === '/' ? 'Select Document' : 'Select Tag'}</span>
                                    {selectedTagFilter && (
                                        <button
                                            onClick={clearTagFilter}
                                            className="flex items-center gap-1 bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full text-[10px] font-medium hover:bg-pink-200 transition-colors"
                                        >
                                            <Hash className="w-2.5 h-2.5" />
                                            {selectedTagFilter}
                                            <X className="w-2.5 h-2.5" />
                                        </button>
                                    )}
                                </div>
                                <span className="text-[10px] font-normal opacity-70 bg-white px-2 py-0.5 rounded border">Use Arrows</span>
                            </div>

                            <div className="max-h-60 overflow-y-auto p-1">
                                {filteredItems.length === 0 ? (
                                    <div className="p-8 text-center text-gray-400 text-sm">
                                        No matching {triggerType === '/' ? 'files' : 'tags'} found.
                                    </div>
                                ) : (
                                    filteredItems.map((item, idx) => (
                                        <button
                                            key={item.id}
                                            onMouseDown={(e) => { e.preventDefault(); handleSmartSelect(item); }}
                                            className={cn(
                                                "w-full text-left px-3 py-2.5 flex items-center gap-3 text-sm rounded-xl transition-all",
                                                idx === selectedIndex
                                                    ? 'bg-indigo-600 text-white shadow-md'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                            )}
                                        >
                                            <div className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                                                idx === selectedIndex
                                                    ? 'bg-white/20 text-white'
                                                    : item.type === 'document'
                                                        ? 'bg-blue-100 text-blue-600'
                                                        : 'bg-pink-100 text-pink-600'
                                            )}>
                                                {item.type === 'document' ? <FileText className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium truncate">{item.label}</div>
                                                <div className={cn("text-xs truncate", idx === selectedIndex ? 'text-indigo-200' : 'text-gray-400')}>{item.sub}</div>
                                            </div>
                                            {idx === selectedIndex && <CheckCheck className="w-4 h-4 text-white flex-shrink-0" />}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className={cn(
                    "pointer-events-auto w-full max-w-3xl bg-white rounded-3xl shadow-xl border transition-all duration-300 relative",
                    isImageMode ? 'shadow-pink-500/10 border-pink-200' : 'shadow-indigo-500/10 border-gray-200',
                    "focus-within:ring-2",
                    isImageMode ? 'focus-within:ring-pink-100' : 'focus-within:ring-indigo-100'
                )}>

                    {attachments.length > 0 && (
                        <div className="px-4 pt-4 pb-0 flex gap-3 overflow-x-auto">
                            {attachments.map((att, idx) => (
                                <div key={idx} className="relative group flex-shrink-0">
                                    <div className="w-16 h-16 rounded-xl border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center relative">
                                        {att.type === 'image' ? (
                                            <img src={att.url} className="w-full h-full object-cover" alt={att.name} />
                                        ) : (
                                            <FileText className="w-8 h-8 text-indigo-400" />
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                onClick={() => removeAttachment(idx)}
                                                className="text-white bg-black/50 rounded-full p-1 hover:bg-red-500 transition-colors"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gray-900 text-white rounded-full text-[10px] flex items-center justify-center border-2 border-white">
                                        {idx + 1}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex items-end gap-2 p-3">

                        <div className="flex items-center gap-1 pb-1 pl-1">
                            <input
                                type="file"
                                multiple
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                accept="image/*,application/pdf,audio/*,video/*,text/*,application/msword,application/vnd.openxmlformats-officedocument.*"
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                                title="Attach files"
                            >
                                <Plus className="w-6 h-6" />
                            </button>
                            <button
                                onClick={toggleMode}
                                className={cn(
                                    "p-2 rounded-full transition-colors",
                                    isImageMode ? 'text-pink-600 bg-pink-50' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                                )}
                                title={isImageMode ? "Image Mode Active" : "Switch to Image Mode"}
                            >
                                <ImagePlus className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 py-2">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                placeholder={isImageMode ? "Describe an image to generate..." : "Message... (/ for files, # for tags)"}
                                rows={1}
                                className="w-full bg-transparent border-none focus:ring-0 focus:outline-none p-0 text-gray-900 placeholder:text-gray-400 resize-none max-h-48 leading-relaxed"
                            />
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={(!input.trim() && attachments.length === 0) || isGenerating}
                            className={cn(
                                "p-2.5 rounded-full mb-0.5 transition-all duration-200 flex items-center justify-center",
                                ((!input.trim() && attachments.length === 0) || isGenerating)
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : isImageMode
                                        ? 'bg-pink-600 text-white shadow-md hover:bg-pink-700'
                                        : 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700'
                            )}
                        >
                            {isImageMode ? <Sparkles className="w-5 h-5" /> : <ArrowUp className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}