"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Sparkles,
    X,
    Send,
    Edit3,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    FileText,
    Loader2,
    MessageSquare,
    Search,
    Brain,
    Clock,
    Database,
} from 'lucide-react';

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
}

interface CoreMemorySuggestionProps {
    suggestion: RAGSuggestion | null;
    isLoading: boolean;
    isVisible: boolean;
    onEdit: (text: string) => void;
    onSend: (text: string) => void;
    onDismiss: () => void;
    onRegenerate: () => void;
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
    incomingMessage,
}: CoreMemorySuggestionProps) {
    const [showDetails, setShowDetails] = useState(false);
    const [loadingStage, setLoadingStage] = useState<LoadingStage>('searching');
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        if (!isLoading) {
            setLoadingStage('complete');
            return;
        }

        setLoadingStage('searching');
        const timer1 = setTimeout(() => setLoadingStage('analyzing'), 300);
        const timer2 = setTimeout(() => setLoadingStage('generating'), 600);

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
        if (confidence >= 0.8) return 'bg-green-100 text-green-700 border-green-300';
        if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
        return 'bg-red-100 text-red-700 border-red-300';
    };

    const documentSources = suggestion?.sources?.filter(s => s.type === 'document').length || 0;

    const getLoadingStageInfo = () => {
        switch (loadingStage) {
            case 'searching':
                return {
                    icon: Search,
                    text: 'Searching Core Memory...',
                    subtext: 'Looking through your documents',
                    color: 'text-blue-600',
                    bgColor: 'bg-blue-50',
                };
            case 'analyzing':
                return {
                    icon: Brain,
                    text: 'Analyzing conversation...',
                    subtext: `Reading "${incomingMessage.slice(0, 40)}${incomingMessage.length > 40 ? '...' : ''}"`,
                    color: 'text-purple-600',
                    bgColor: 'bg-purple-50',
                };
            case 'generating':
                return {
                    icon: Sparkles,
                    text: 'Crafting your response...',
                    subtext: 'Almost ready',
                    color: 'text-indigo-600',
                    bgColor: 'bg-indigo-50',
                };
            default:
                return null;
        }
    };

    const handleEdit = () => {
        onEdit(displayedText || suggestion?.suggestedReply || '');
    };

    const handleSend = () => {
        onSend(displayedText || suggestion?.suggestedReply || '');
    };

    return (
        <div className="border-t-2 border-indigo-300 bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 shadow-lg animate-in slide-in-from-bottom-2 duration-300">
            <div className="px-4 py-2 flex items-center justify-between bg-white/80 backdrop-blur-sm border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                        <Database className={`h-4 w-4 text-white ${isLoading ? 'animate-pulse' : ''}`} />
                    </div>
                    <span className="text-sm font-semibold text-gray-900">From Core Memory</span>

                    {suggestion && !isLoading && (
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`text-xs px-2 py-0.5 ${getConfidenceColor(suggestion.confidence)}`}>
                                {Math.round(suggestion.confidence * 100)}%
                            </Badge>

                            {documentSources > 0 && (
                                <Badge variant="outline" className="text-xs px-2 py-0.5 bg-blue-50 border-blue-200 text-blue-700">
                                    <FileText className="h-3 w-3 mr-1" />
                                    {documentSources}
                                </Badge>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    {suggestion && !isLoading && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowDetails(!showDetails)}
                            className="h-7 text-xs text-gray-600 hover:text-gray-900"
                        >
                            {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            <span className="ml-1">Details</span>
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onDismiss}
                        className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {isLoading && (() => {
                const stageInfo = getLoadingStageInfo();
                if (!stageInfo) return null;
                const StageIcon = stageInfo.icon;

                return (
                    <div className="px-4 py-4">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full ${stageInfo.bgColor} flex items-center justify-center`}>
                                <StageIcon className={`h-5 w-5 ${stageInfo.color} animate-pulse`} />
                            </div>
                            <div className="flex-1">
                                <p className={`text-sm font-medium ${stageInfo.color}`}>{stageInfo.text}</p>
                                <p className="text-xs text-gray-500">{stageInfo.subtext}</p>
                                <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out rounded-full"
                                        style={{
                                            width: loadingStage === 'searching' ? '33%' : loadingStage === 'analyzing' ? '66%' : '95%'
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-4 px-2">
                            <div className="flex items-center gap-1.5">
                                <div className={`w-2 h-2 rounded-full ${loadingStage === 'searching' || loadingStage === 'analyzing' || loadingStage === 'generating' ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                                <span className="text-xs text-gray-500">Search</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className={`w-2 h-2 rounded-full ${loadingStage === 'analyzing' || loadingStage === 'generating' ? 'bg-purple-500' : 'bg-gray-300'}`}></div>
                                <span className="text-xs text-gray-500">Analyze</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className={`w-2 h-2 rounded-full ${loadingStage === 'generating' ? 'bg-indigo-500' : 'bg-gray-300'}`}></div>
                                <span className="text-xs text-gray-500">Generate</span>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {!isLoading && suggestion && (
                <div className="px-4 py-3">
                    <div className="bg-white rounded-lg border-2 border-indigo-200 shadow-md hover:shadow-lg transition-shadow">
                        <div className="p-4">
                            <div className="space-y-3">
                                <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                                    {displayedText}
                                    {isTyping && <span className="inline-block w-0.5 h-4 bg-indigo-600 ml-1 animate-pulse"></span>}
                                </div>

                                {!isTyping && (
                                    <>
                                        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                                            <Clock className="h-3 w-3 text-gray-400" />
                                            <span className="text-xs text-gray-500">Generated just now</span>
                                            {suggestion.sources.length > 0 && (
                                                <>
                                                    <span className="text-gray-300">•</span>
                                                    <span className="text-xs text-gray-500">
                                                        From {suggestion.sources.length} source{suggestion.sources.length > 1 ? 's' : ''}
                                                    </span>
                                                </>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 pt-2">
                                            <Button
                                                size="sm"
                                                onClick={handleSend}
                                                className="flex-1 h-9 bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all"
                                            >
                                                <Send className="h-4 w-4 mr-1.5" />
                                                Send
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleEdit}
                                                className="h-9 px-4 border-gray-300 hover:bg-gray-50"
                                            >
                                                <Edit3 className="h-4 w-4 mr-1.5" />
                                                Edit
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={onRegenerate}
                                                className="h-9 px-3 border-gray-300 hover:bg-gray-50"
                                                title="Regenerate"
                                            >
                                                <RefreshCw className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {showDetails && !isTyping && (
                        <div className="mt-3 space-y-2 animate-in slide-in-from-top-2 duration-200">
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-3">
                                <div className="flex items-start gap-2">
                                    <MessageSquare className="h-4 w-4 text-gray-600 mt-0.5 shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-xs font-semibold text-gray-700 mb-1">Customer asked:</p>
                                        <p className="text-xs text-gray-600 italic leading-relaxed">"{incomingMessage}"</p>
                                    </div>
                                </div>
                            </div>

                            {suggestion.sources && suggestion.sources.length > 0 && (
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <FileText className="h-4 w-4 text-blue-600" />
                                        <p className="text-xs font-semibold text-blue-900">
                                            Information Sources ({suggestion.sources.length})
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        {suggestion.sources.slice(0, 3).map((source, index) => (
                                            <div
                                                key={index}
                                                className="bg-white/80 rounded-md p-2 border border-blue-100"
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <FileText className="h-3 w-3 text-blue-500" />
                                                    <span className="text-xs font-medium text-blue-800 truncate">
                                                        {source.name}
                                                    </span>
                                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-blue-50 border-blue-200 text-blue-600 ml-auto">
                                                        {Math.round(source.relevance * 100)}%
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                                    {source.excerpt}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {suggestion.reasoning && (
                                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-3">
                                    <div className="flex items-center gap-2">
                                        <Brain className="h-4 w-4 text-purple-600" />
                                        <p className="text-xs text-purple-800">
                                            <span className="font-semibold">Reasoning:</span> {suggestion.reasoning}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}