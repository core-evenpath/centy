import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Sparkles,
    Bot,
    Send,
    X,
    Copy,
    ChevronDown,
    ChevronUp,
    FileText,
    RefreshCw,
    Edit3,
    Search,
    Brain,
    Database,
    Wand2,
    CheckCircle2,
    Zap,
    MessageSquare,
    User,
    Lightbulb,
    ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AssistantSelector } from './AssistantSelector';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface RAGSource {
    type: 'conversation' | 'document';
    name: string;
    excerpt: string;
    relevance: number;
    fromAssistant?: string;
}

interface RAGSuggestion {
    suggestedReply: string;
    confidence: number;
    reasoning: string;
    sources: RAGSource[];
    personaUsed?: boolean;
    assistantUsed?: {
        id: string;
        name: string;
        avatar: string;
        usedAsFallback: boolean;
    };
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
    activeAssistants: any[];
    selectedAssistantIds: string[];
    onAssistantSelectionChange: (ids: string[]) => void;
    assistantsLoading?: boolean;
}

type LoadingStage = 'searching' | 'analyzing' | 'generating' | 'complete';

const QUICK_REFINEMENTS = [
    { label: 'Shorter', instruction: 'Make it more concise and brief' },
    { label: 'Friendlier', instruction: 'Make it warmer and more friendly' },
    { label: 'More formal', instruction: 'Make it more professional and formal' },
    { label: 'Add details', instruction: 'Add more helpful details and specifics' },
];

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
    activeAssistants,
    selectedAssistantIds,
    onAssistantSelectionChange,
    assistantsLoading
}: CoreMemorySuggestionProps) {
    const [loadingStage, setLoadingStage] = useState<LoadingStage>('searching');
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [showSources, setShowSources] = useState(false);
    const [customRefineInput, setCustomRefineInput] = useState('');
    const [copied, setCopied] = useState(false);
    const textRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isLoading) {
            setLoadingStage('complete');
            return;
        }

        setLoadingStage('searching');
        const timer1 = setTimeout(() => setLoadingStage('analyzing'), 600);
        const timer2 = setTimeout(() => setLoadingStage('generating'), 1400);

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
        }, 12);

        return () => clearInterval(typingInterval);
    }, [suggestion?.suggestedReply, isLoading]);

    const handleCopy = () => {
        if (suggestion?.suggestedReply) {
            navigator.clipboard.writeText(suggestion.suggestedReply);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleCustomRefine = () => {
        if (customRefineInput.trim()) {
            onRefine(customRefineInput.trim());
            setCustomRefineInput('');
        }
    };

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isVisible) {
                onDismiss();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isVisible, onDismiss]);

    if (!isVisible) return null;

    const getConfidenceInfo = (confidence: number) => {
        if (confidence >= 0.85) return { label: 'High', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
        if (confidence >= 0.7) return { label: 'Good', color: 'bg-blue-100 text-blue-700 border-blue-200' };
        if (confidence >= 0.5) return { label: 'Fair', color: 'bg-amber-100 text-amber-700 border-amber-200' };
        return { label: 'Low', color: 'bg-red-100 text-red-700 border-red-200' };
    };

    const documentSources = suggestion?.sources?.filter(s => s.type === 'document') || [];
    const isGeneralMode = selectedAssistantIds.includes('essential-general_mode');

    const getLoadingContent = () => {
        const stages = {
            searching: {
                icon: Search,
                title: 'Searching Knowledge Base',
                subtitle: 'Finding relevant documents...',
                progress: 33
            },
            analyzing: {
                icon: Brain,
                title: 'Analyzing Context',
                subtitle: 'Understanding the conversation...',
                progress: 66
            },
            generating: {
                icon: Wand2,
                title: 'Crafting Response',
                subtitle: 'Generating personalized reply...',
                progress: 90
            },
            complete: {
                icon: CheckCircle2,
                title: 'Complete',
                subtitle: '',
                progress: 100
            },
        };

        return stages[loadingStage];
    };

    const loadingContent = getLoadingContent();
    const LoadingIcon = loadingContent.icon;

    return (
        <>
            {/* Mobile: Full-screen overlay */}
            <div
                className="md:hidden fixed inset-0 bg-black/50 z-40 animate-fadeIn"
                onClick={onDismiss}
            />

            {/* Mobile: Bottom sheet / Desktop: Side panel */}
            <div className={cn(
                "bg-gradient-to-b from-slate-50 to-white flex flex-col z-50",
                // Mobile: Bottom sheet style
                "fixed inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl shadow-2xl",
                // Desktop: Side panel style
                "md:relative md:inset-auto md:w-[380px] md:h-full md:rounded-none md:shadow-none md:border-l md:border-gray-100"
            )}>
                {/* Mobile drag handle */}
                <div className="md:hidden flex justify-center py-2">
                    <div className="w-10 h-1 rounded-full bg-gray-300" />
                </div>

                <div className="p-4 pt-2 md:pt-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                            <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                                isLoading
                                    ? "bg-indigo-100 animate-pulse"
                                    : "bg-gradient-to-br from-indigo-500 to-violet-600 shadow-sm"
                            )}>
                                <Database className={cn(
                                    "h-4 w-4",
                                    isLoading ? "text-indigo-600" : "text-white"
                                )} />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900">Core Memory</h3>
                                <p className="text-[10px] text-gray-500">AI-Powered Suggestions</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onDismiss}
                            className="h-8 w-8 md:h-7 md:w-7 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg touch-manipulation"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                <AssistantSelector
                    availableAssistants={activeAssistants}
                    selectedAssistantIds={selectedAssistantIds}
                    onSelectionChange={onAssistantSelectionChange}
                    isLoading={assistantsLoading}
                />

                {isGeneralMode && (
                    <div className="mt-2 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                        <p className="text-[10px] text-slate-600 flex items-center gap-1.5">
                            <Bot className="w-3 h-3" />
                            <span><strong>General Mode:</strong> Responding without business documents</span>
                        </p>
                    </div>
                )}
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                    <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
                        <div className="flex items-start gap-2">
                            <MessageSquare className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1">Customer Message</p>
                                <p className="text-sm text-gray-700 leading-relaxed">"{incomingMessage}"</p>
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
                                    <LoadingIcon className="w-6 h-6 text-indigo-600 animate-pulse" />
                                </div>
                                <h4 className="text-sm font-medium text-gray-900 mb-1">{loadingContent.title}</h4>
                                <p className="text-xs text-gray-500 mb-4">{loadingContent.subtitle}</p>

                                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500 ease-out"
                                        style={{ width: `${loadingContent.progress}%` }}
                                    />
                                </div>

                                <div className="flex items-center gap-4 mt-4 text-[10px] text-gray-400">
                                    <span className={cn(loadingStage === 'searching' && 'text-indigo-600 font-medium')}>Search</span>
                                    <ArrowRight className="w-3 h-3" />
                                    <span className={cn(loadingStage === 'analyzing' && 'text-indigo-600 font-medium')}>Analyze</span>
                                    <ArrowRight className="w-3 h-3" />
                                    <span className={cn(loadingStage === 'generating' && 'text-indigo-600 font-medium')}>Generate</span>
                                </div>
                            </div>
                        </div>
                    ) : suggestion ? (
                        <>
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="p-3 bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {suggestion.assistantUsed && (
                                            <div className={cn(
                                                "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border",
                                                suggestion.assistantUsed.usedAsFallback
                                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                                    : "bg-indigo-50 text-indigo-700 border-indigo-200"
                                            )}>
                                                <span className="text-sm">{suggestion.assistantUsed.avatar}</span>
                                                <span>{suggestion.assistantUsed.name}</span>
                                                {suggestion.assistantUsed.usedAsFallback && (
                                                    <Badge variant="outline" className="h-4 px-1 text-[8px] bg-white border-amber-300">
                                                        Fallback
                                                    </Badge>
                                                )}
                                            </div>
                                        )}
                                        <Badge
                                            variant="outline"
                                            className={cn("text-[10px] h-5 px-2 font-medium border", getConfidenceInfo(suggestion.confidence).color)}
                                        >
                                            {Math.round(suggestion.confidence * 100)}% {getConfidenceInfo(suggestion.confidence).label}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={handleCopy}
                                                        className="h-7 w-7 text-gray-400 hover:text-gray-600"
                                                    >
                                                        {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent side="top" className="text-xs">Copy</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={onRegenerate}
                                                        className="h-7 w-7 text-gray-400 hover:text-indigo-600"
                                                    >
                                                        <RefreshCw className="h-3.5 w-3.5" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent side="top" className="text-xs">Regenerate</TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                </div>

                                <div className="p-4" ref={textRef}>
                                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                                        {displayedText}
                                        {isTyping && <span className="inline-block w-0.5 h-4 bg-indigo-500 animate-pulse ml-0.5" />}
                                    </p>
                                </div>

                                {!isTyping && (
                                    <div className="px-4 pb-4 flex gap-2">
                                        <Button
                                            onClick={() => onSend(suggestion.suggestedReply)}
                                            className="flex-1 h-11 md:h-9 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-sm touch-manipulation active:scale-[0.98] transition-transform"
                                        >
                                            <Send className="h-4 w-4 md:h-3.5 md:w-3.5 mr-1.5" />
                                            Send
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => onEdit(suggestion.suggestedReply)}
                                            className="h-11 md:h-9 px-4 border-gray-200 hover:bg-gray-50 touch-manipulation active:scale-[0.98] transition-transform"
                                        >
                                            <Edit3 className="h-4 w-4 md:h-3.5 md:w-3.5 mr-1.5" />
                                            Edit
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {!isTyping && (
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                            <Lightbulb className="w-3 h-3" />
                                            Quick Refine
                                        </p>
                                        <div className="flex flex-wrap gap-2 md:gap-1.5">
                                            {QUICK_REFINEMENTS.map((item) => (
                                                <button
                                                    key={item.label}
                                                    onClick={() => onRefine(item.instruction)}
                                                    className="px-3 py-1.5 md:px-2.5 md:py-1 text-sm md:text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-full hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 active:scale-95 transition-all touch-manipulation"
                                                >
                                                    {item.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Input
                                            value={customRefineInput}
                                            onChange={(e) => setCustomRefineInput(e.target.value)}
                                            placeholder="Custom instruction..."
                                            className="h-10 md:h-8 text-sm md:text-xs bg-white"
                                            onKeyDown={(e) => e.key === 'Enter' && handleCustomRefine()}
                                        />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleCustomRefine}
                                            disabled={!customRefineInput.trim()}
                                            className="h-10 w-10 md:h-8 md:w-auto md:px-3 touch-manipulation"
                                        >
                                            <Wand2 className="h-4 w-4 md:h-3.5 md:w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {documentSources.length > 0 && !isTyping && (
                                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                                    <button
                                        onClick={() => setShowSources(!showSources)}
                                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-indigo-500" />
                                            <span className="text-xs font-medium text-gray-700">
                                                {documentSources.length} Source{documentSources.length > 1 ? 's' : ''} Used
                                            </span>
                                        </div>
                                        {showSources ? (
                                            <ChevronUp className="w-4 h-4 text-gray-400" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4 text-gray-400" />
                                        )}
                                    </button>

                                    {showSources && (
                                        <div className="border-t border-gray-100 divide-y divide-gray-50">
                                            {documentSources.map((source, idx) => (
                                                <div key={idx} className="p-3">
                                                    <div className="flex items-start justify-between mb-1.5">
                                                        <span className="text-xs font-medium text-gray-800 flex items-center gap-1.5">
                                                            <FileText className="w-3 h-3 text-indigo-400" />
                                                            {source.name}
                                                        </span>
                                                        {source.fromAssistant && (
                                                            <Badge variant="outline" className="text-[9px] h-4 px-1.5 bg-violet-50 text-violet-600 border-violet-200">
                                                                via {source.fromAssistant}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    {source.excerpt && (
                                                        <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">
                                                            "{source.excerpt}"
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {suggestion.personaUsed && (
                                <div className="flex items-center gap-2 px-3 py-2 bg-violet-50 rounded-lg border border-violet-100">
                                    <User className="w-3.5 h-3.5 text-violet-500" />
                                    <span className="text-[11px] text-violet-700 font-medium">
                                        Personalized using customer profile
                                    </span>
                                </div>
                            )}

                            <p className="text-[10px] text-gray-400 text-center pb-safe">
                                {suggestion.reasoning}
                            </p>
                        </>
                    ) : null}
                </div>
            </ScrollArea>
            </div>
        </>
    );
}