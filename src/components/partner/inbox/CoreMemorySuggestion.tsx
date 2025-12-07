import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Sparkles,
    Bot,
    RefreshCcw,
    Send,
    Edit2,
    X,
    Check,
    ThumbsUp,
    ThumbsDown,
    Copy,
    Info,
    ChevronDown,
    ChevronUp,
    FileText,
    User,
    RefreshCw,
    Edit3,
    Search,
    Brain,
    Clock,
    Database,
    Wand2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RAGSource {
    type: 'conversation' | 'document';
    name: string;
    excerpt: string;
    relevance: number;
}

interface RAGSuggestion {
    suggestedReply: string;
    confidence: number;
    reasoning: string;
    sources: RAGSource[];
    personaUsed?: boolean;
}

interface CoreMemorySuggestionProps {
    suggestion: RAGSuggestion | null;
    isLoading: boolean;
    isVisible: boolean;
    onEdit: (text: string) => void;
    onSend: (text: string) => void;
    onDismiss: () => void;
    onRegenerate: () => void;
    onRefine: (instruction: string) => void;
    incomingMessage: string;
}

type LoadingStage = 'searching' | 'analyzing' | 'generating' | 'complete';

export default function CoreMemorySuggestion({
    suggestion,
    isLoading,
    isVisible,
    onEdit,
    onSend,
    onDismiss,
    onRegenerate,
    onRefine,
    incomingMessage,
}: CoreMemorySuggestionProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [loadingStage, setLoadingStage] = useState<LoadingStage>('searching');
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        if (!isLoading) {
            setLoadingStage('complete');
            if (suggestion) setIsExpanded(true);
            return;
        }

        setLoadingStage('searching');
        setIsExpanded(true);
        const timer1 = setTimeout(() => setLoadingStage('analyzing'), 800);
        const timer2 = setTimeout(() => setLoadingStage('generating'), 1800);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, [isLoading]);

    useEffect(() => {
        if (!suggestion?.suggestedReply || isLoading) {
            setDisplayedText('');
            return;
        }

        setIsTyping(true);
        setDisplayedText('');

        const text = suggestion.suggestedReply;
        let currentIndex = 0;

        const typingInterval = setInterval(() => {
            if (currentIndex <= text.length) {
                setDisplayedText(text.slice(0, currentIndex));
                currentIndex++;
            } else {
                setIsTyping(false);
                clearInterval(typingInterval);
            }
        }, 8);

        return () => clearInterval(typingInterval);
    }, [suggestion?.suggestedReply, isLoading]);

    if (!isVisible) return null;

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.8) return 'bg-green-50 text-green-700 border-green-200';
        if (confidence >= 0.6) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
        return 'bg-red-50 text-red-700 border-red-200';
    };

    const documentSources = suggestion?.sources?.filter(s => s.type === 'document').length || 0;

    const getLoadingStageInfo = () => {
        switch (loadingStage) {
            case 'searching':
                return {
                    icon: Search,
                    text: 'Searching Core Memory',
                    subtext: 'Scanning documents...',
                    color: 'text-blue-600',
                    bgColor: 'bg-blue-50',
                };
            case 'analyzing':
                return {
                    icon: Brain,
                    text: 'Analyzing Context',
                    subtext: 'Processing message...',
                    color: 'text-purple-600',
                    bgColor: 'bg-purple-50',
                };
            case 'generating':
                return {
                    icon: Sparkles,
                    text: 'Crafting Response',
                    subtext: 'Finalizing text...',
                    color: 'text-indigo-600',
                    bgColor: 'bg-indigo-50',
                };
            default:
                return null;
        }
    };

    const handleSend = () => onSend(displayedText || suggestion?.suggestedReply || '');
    const handleEdit = () => onEdit(displayedText || suggestion?.suggestedReply || '');

    return (
        // Changed wrapper to standard flex column, removed absolute positioning
        <div className="w-[360px] flex flex-col h-full border-l border-gray-100 bg-white shadow-xl shadow-gray-100/50 z-20 shrink-0 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b border-gray-50 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center transition-all ring-4 ring-indigo-50",
                        isLoading ? "bg-indigo-50" : "bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm"
                    )}>
                        <Database className={cn(
                            "h-3.5 w-3.5",
                            isLoading ? "text-indigo-600 animate-pulse" : "text-white"
                        )} />
                    </div>
                    <div>
                        <h3 className="text-[13px] font-bold text-gray-900 leading-tight">Core Memory</h3>
                        <p className="text-[10px] text-gray-500 font-medium">AI Intelligence</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onDismiss}
                    className="h-7 w-7 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <ScrollArea className="flex-1 bg-white">
                <div className="p-4 space-y-5">
                    {/* Incoming Context */}
                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-400 mb-2 flex items-center gap-1.5 uppercase tracking-widest">
                            <Brain className="w-3 h-3" />
                            Context
                        </p>
                        <p className="text-[13px] text-gray-700 italic leading-relaxed font-serif">
                            "{incomingMessage}"
                        </p>
                    </div>

                    {isLoading ? (
                        <div className="bg-white p-6 rounded-2xl border border-indigo-50 shadow-sm space-y-4 relative overflow-hidden">
                            {(() => {
                                const stageInfo = getLoadingStageInfo();
                                if (!stageInfo) return null;
                                const Icon = stageInfo.icon;
                                return (
                                    <>
                                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/20 to-purple-50/20 opacity-30" />
                                        <div className="relative flex flex-col items-center text-center py-2">
                                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors duration-500 shadow-sm", stageInfo.bgColor)}>
                                                <Icon className={cn("h-5 w-5 animate-pulse transition-colors duration-500", stageInfo.color)} />
                                            </div>
                                            <h3 className={cn("text-[13px] font-bold mb-1 transition-colors duration-500", stageInfo.color)}>
                                                {stageInfo.text}
                                            </h3>
                                            <p className="text-[11px] text-gray-400 font-medium">{stageInfo.subtext}</p>
                                        </div>
                                        {/* Progress Bar */}
                                        <div className="h-1 bg-gray-100 rounded-full overflow-hidden w-full max-w-[100px] mx-auto opacity-70">
                                            <div
                                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700 ease-out"
                                                style={{ width: loadingStage === 'searching' ? '30%' : loadingStage === 'analyzing' ? '60%' : '90%' }}
                                            />
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    ) : suggestion ? (
                        <>
                            {/* Suggestion Card */}
                            <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden group hover:shadow-md transition-all">
                                <div className="p-3 bg-gradient-to-r from-indigo-50/30 to-violet-50/30 border-b border-indigo-50 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className={cn("text-[9px] h-5 px-2 font-bold tracking-wide border rounded-md shadow-sm", getConfidenceColor(suggestion.confidence))}>
                                            {Math.round(suggestion.confidence * 100)}% MATCH
                                        </Badge>
                                        {documentSources > 0 && (
                                            <Badge variant="outline" className="text-[9px] h-5 px-2 font-semibold bg-white text-gray-500 border-gray-200 rounded-md">
                                                {documentSources} DOCS
                                            </Badge>
                                        )}
                                    </div>
                                    <Button onClick={onRegenerate} variant="ghost" size="icon" className="h-6 w-6 text-indigo-400 hover:text-indigo-600 rounded-full hover:bg-white" title="Regenerate">
                                        <RefreshCw className="h-3 w-3" />
                                    </Button>
                                </div>
                                <div className="p-5">
                                    <div className="prose prose-sm max-w-none">
                                        <p className="text-[13px] text-gray-900 leading-relaxed whitespace-pre-wrap">
                                            {displayedText}
                                            {isTyping && <span className="inline-block w-0.5 h-3.5 bg-indigo-600 ml-0.5 animate-pulse align-middle" />}
                                        </p>
                                    </div>

                                    {!isTyping && (
                                        <div className="mt-5 flex flex-col gap-2.5">
                                            <Button
                                                onClick={handleSend}
                                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm h-9 text-xs font-semibold rounded-lg"
                                            >
                                                <Send className="w-3.5 h-3.5 mr-2" />
                                                Send Reply
                                            </Button>
                                            <Button
                                                onClick={handleEdit}
                                                variant="outline"
                                                className="w-full border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 h-9 text-xs font-semibold rounded-lg"
                                            >
                                                <Edit3 className="w-3.5 h-3.5 mr-2" />
                                                Edit Text
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Refinements */}
                            {!isTyping && (
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Refine Response</p>
                                    <div className="grid grid-cols-2 gap-2.5">
                                        <Button variant="outline" size="sm" onClick={() => onRefine("Make it shorter")} className="h-8 text-[10px] font-semibold border-gray-200/60 hover:border-indigo-200 hover:bg-indigo-50 text-gray-600 bg-white shadow-sm rounded-lg">
                                            Shorten
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => onRefine("Make it more formal")} className="h-8 text-[10px] font-semibold border-gray-200/60 hover:border-indigo-200 hover:bg-indigo-50 text-gray-600 bg-white shadow-sm rounded-lg">
                                            Formal
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => onRefine("Add a friendly greeting")} className="h-8 text-[10px] font-semibold border-gray-200/60 hover:border-indigo-200 hover:bg-indigo-50 text-gray-600 bg-white shadow-sm rounded-lg">
                                            + Greeting
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => onRefine("Ask a follow-up question")} className="h-8 text-[10px] font-semibold border-gray-200/60 hover:border-indigo-200 hover:bg-indigo-50 text-gray-600 bg-white shadow-sm rounded-lg">
                                            + Question
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Sources */}
                            {suggestion.sources.length > 0 && !isTyping && (
                                <div className="space-y-3 pt-2">
                                    <div
                                        onClick={() => setIsExpanded(!isExpanded)}
                                        className="flex items-center justify-between cursor-pointer group"
                                    >
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1 group-hover:text-gray-600 transition-colors">
                                            Sources
                                        </p>
                                        <ChevronDown className={cn("w-3 h-3 text-gray-400 transition-transform", isExpanded && "rotate-180")} />
                                    </div>

                                    {isExpanded && (
                                        <div className="space-y-2.5 animate-in slide-in-from-top-2 duration-200">
                                            {suggestion.sources.slice(0, 3).map((source, i) => (
                                                <div key={i} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-1.5 hover:border-indigo-200 transition-colors">
                                                    <div className="flex items-center gap-2">
                                                        <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                                        <span className="text-[11px] font-semibold text-gray-900 truncate">
                                                            {source.name}
                                                        </span>
                                                        <span className="text-[9px] text-gray-400 ml-auto tabular-nums font-medium bg-gray-50 px-1.5 py-0.5 rounded-md border border-gray-100">
                                                            {Math.round(source.relevance * 100)}%
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed bg-gray-50/50 p-2 rounded-lg border border-gray-50/50 italic">
                                                        "{source.excerpt}"
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    ) : null}
                </div>
            </ScrollArea>
        </div>
    );
}