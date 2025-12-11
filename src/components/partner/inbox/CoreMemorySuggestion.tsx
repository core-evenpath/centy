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
                className="md:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onDismiss}
            />

            {/* Mobile: Bottom sheet / Desktop: Side panel */}
            <div className={cn(
                "flex flex-col z-50 transition-all duration-300 ease-out",
                // Mobile: Bottom sheet style
                "fixed inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl shadow-2xl bg-white",
                "animate-in slide-in-from-bottom duration-300",
                // Desktop: Integrated side panel style
                "md:relative md:inset-auto md:w-[400px] md:max-w-[400px] md:h-full md:max-h-full",
                "md:rounded-none md:shadow-none md:bg-gradient-to-b md:from-slate-50/80 md:to-white",
                "md:border-l md:border-gray-200/80 md:shrink-0",
                "md:animate-in md:slide-in-from-right md:duration-300"
            )}>
                {/* Mobile drag handle */}
                <div className="md:hidden flex justify-center py-2">
                    <div className="w-10 h-1 rounded-full bg-gray-300" />
                </div>

                {/* Header */}
                <div className="shrink-0 p-4 pt-2 md:pt-5 md:pb-4 border-b border-gray-100/80 bg-white/90 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-all shadow-sm",
                                isLoading
                                    ? "bg-indigo-100 animate-pulse"
                                    : "bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600"
                            )}>
                                <Database className={cn(
                                    "h-4 w-4 md:h-5 md:w-5",
                                    isLoading ? "text-indigo-600" : "text-white"
                                )} />
                            </div>
                            <div>
                                <h3 className="text-sm md:text-base font-semibold text-gray-900">Core Memory</h3>
                                <p className="text-[10px] md:text-xs text-gray-500">AI-Powered Suggestions</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onDismiss}
                            className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100/80 rounded-lg touch-manipulation transition-colors"
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
                        <div className="mt-3 px-3 py-2 bg-slate-50/80 border border-slate-200/60 rounded-lg">
                            <p className="text-[10px] md:text-xs text-slate-600 flex items-center gap-1.5">
                                <Bot className="w-3 h-3" />
                                <span><strong>General Mode:</strong> Responding without business documents</span>
                            </p>
                        </div>
                    )}
                </div>

                {/* Scrollable Content */}
                <ScrollArea className="flex-1 min-h-0">
                    <div className="p-4 md:p-5 space-y-4 md:space-y-5">
                        {/* Customer Message Card */}
                        <div className="bg-white md:bg-white/80 rounded-xl border border-gray-100 md:border-gray-200/60 p-3 md:p-4 shadow-sm">
                            <div className="flex items-start gap-2.5">
                                <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                    <MessageSquare className="w-3.5 h-3.5 text-gray-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] md:text-xs font-medium text-gray-400 uppercase tracking-wider mb-1.5">Customer Message</p>
                                    <p className="text-sm md:text-[15px] text-gray-700 leading-relaxed">"{incomingMessage}"</p>
                                </div>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="bg-white md:bg-white/80 rounded-xl border border-gray-100 md:border-gray-200/60 p-6 md:p-8 shadow-sm">
                                <div className="flex flex-col items-center text-center">
                                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center mb-5 shadow-sm">
                                        <LoadingIcon className="w-7 h-7 md:w-8 md:h-8 text-indigo-600 animate-pulse" />
                                    </div>
                                    <h4 className="text-sm md:text-base font-semibold text-gray-900 mb-1">{loadingContent.title}</h4>
                                    <p className="text-xs md:text-sm text-gray-500 mb-5">{loadingContent.subtitle}</p>

                                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
                                            style={{ width: `${loadingContent.progress}%` }}
                                        />
                                    </div>

                                    <div className="flex items-center gap-3 md:gap-4 mt-5 text-[10px] md:text-xs text-gray-400">
                                        <span className={cn(
                                            "transition-colors",
                                            loadingStage === 'searching' && 'text-indigo-600 font-semibold'
                                        )}>Search</span>
                                        <ArrowRight className="w-3 h-3 text-gray-300" />
                                        <span className={cn(
                                            "transition-colors",
                                            loadingStage === 'analyzing' && 'text-indigo-600 font-semibold'
                                        )}>Analyze</span>
                                        <ArrowRight className="w-3 h-3 text-gray-300" />
                                        <span className={cn(
                                            "transition-colors",
                                            loadingStage === 'generating' && 'text-indigo-600 font-semibold'
                                        )}>Generate</span>
                                    </div>
                                </div>
                            </div>
                        ) : suggestion ? (
                            <>
                                {/* Suggestion Card */}
                                <div className="bg-white md:bg-white/90 rounded-xl border border-gray-100 md:border-gray-200/60 shadow-sm overflow-hidden">
                                    {/* Card Header */}
                                    <div className="p-3 md:p-4 bg-gradient-to-r from-gray-50/80 to-slate-50/80 border-b border-gray-100/80 flex items-center justify-between">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {suggestion.assistantUsed && (
                                                <div className={cn(
                                                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
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
                                                className={cn("text-[10px] md:text-xs h-5 md:h-6 px-2 md:px-2.5 font-medium border", getConfidenceInfo(suggestion.confidence).color)}
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
                                                            className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100/80 transition-colors"
                                                        >
                                                            {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
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
                                                            className="h-8 w-8 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                                        >
                                                            <RefreshCw className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="top" className="text-xs">Regenerate</TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </div>

                                    {/* Suggestion Text */}
                                    <div className="p-4 md:p-5" ref={textRef}>
                                        <p className="text-sm md:text-[15px] text-gray-800 leading-relaxed whitespace-pre-wrap">
                                            {displayedText}
                                            {isTyping && <span className="inline-block w-0.5 h-4 bg-indigo-500 animate-pulse ml-0.5" />}
                                        </p>
                                    </div>

                                    {/* Action Buttons */}
                                    {!isTyping && (
                                        <div className="px-4 md:px-5 pb-4 md:pb-5 flex gap-2.5">
                                            <Button
                                                onClick={() => onSend(suggestion.suggestedReply)}
                                                className="flex-1 h-11 md:h-10 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-sm touch-manipulation active:scale-[0.98] transition-all font-medium"
                                            >
                                                <Send className="h-4 w-4 mr-2" />
                                                Send
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => onEdit(suggestion.suggestedReply)}
                                                className="h-11 md:h-10 px-5 border-gray-200 hover:bg-gray-50 hover:border-gray-300 touch-manipulation active:scale-[0.98] transition-all"
                                            >
                                                <Edit3 className="h-4 w-4 mr-2" />
                                                Edit
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* Quick Refine Section */}
                                {!isTyping && (
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] md:text-xs font-medium text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                                                <Lightbulb className="w-3.5 h-3.5" />
                                                Quick Refine
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {QUICK_REFINEMENTS.map((item) => (
                                                    <button
                                                        key={item.label}
                                                        onClick={() => onRefine(item.instruction)}
                                                        className="px-3.5 py-2 md:px-3 md:py-1.5 text-sm md:text-xs font-medium text-gray-600 bg-white md:bg-white/80 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 active:scale-[0.97] transition-all touch-manipulation shadow-sm"
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
                                                className="h-10 md:h-9 text-sm bg-white md:bg-white/80 border-gray-200"
                                                onKeyDown={(e) => e.key === 'Enter' && handleCustomRefine()}
                                            />
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleCustomRefine}
                                                disabled={!customRefineInput.trim()}
                                                className="h-10 md:h-9 px-3.5 border-gray-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 touch-manipulation transition-colors"
                                            >
                                                <Wand2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Sources Section */}
                                {documentSources.length > 0 && !isTyping && (
                                    <div className="bg-white md:bg-white/80 rounded-xl border border-gray-100 md:border-gray-200/60 overflow-hidden shadow-sm">
                                        <button
                                            onClick={() => setShowSources(!showSources)}
                                            className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-gray-50/80 transition-colors"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center">
                                                    <FileText className="w-3.5 h-3.5 text-indigo-500" />
                                                </div>
                                                <span className="text-xs md:text-sm font-medium text-gray-700">
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
                                                    <div key={idx} className="p-3.5">
                                                        <div className="flex items-start justify-between mb-1.5">
                                                            <span className="text-xs md:text-sm font-medium text-gray-800 flex items-center gap-1.5">
                                                                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                                                                {source.name}
                                                            </span>
                                                            {source.fromAssistant && (
                                                                <Badge variant="outline" className="text-[9px] md:text-[10px] h-4 md:h-5 px-1.5 bg-violet-50 text-violet-600 border-violet-200">
                                                                    via {source.fromAssistant}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        {source.excerpt && (
                                                            <p className="text-[11px] md:text-xs text-gray-500 leading-relaxed line-clamp-2 pl-5">
                                                                "{source.excerpt}"
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Personalization Badge */}
                                {suggestion.personaUsed && (
                                    <div className="flex items-center gap-2.5 px-4 py-3 bg-violet-50/80 rounded-xl border border-violet-100">
                                        <User className="w-4 h-4 text-violet-500" />
                                        <span className="text-xs md:text-sm text-violet-700 font-medium">
                                            Personalized using customer profile
                                        </span>
                                    </div>
                                )}

                                {/* Reasoning Footer */}
                                <p className="text-[10px] md:text-xs text-gray-400 text-center pb-safe px-2 leading-relaxed">
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