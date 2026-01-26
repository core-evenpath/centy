import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Sparkles,
    Bot,
    Send,
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
    User,
    Lightbulb,
    ArrowRight,
    X,
    MessageSquare,
    Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Animation styles for the suggestion panel
const suggestionStyles = `
@keyframes suggestionSlideIn {
    from {
        opacity: 0;
        transform: translateX(20px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

@keyframes suggestionFadeUp {
    from {
        opacity: 0;
        transform: translateY(8px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes pulseGlow {
    0%, 100% {
        box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4);
    }
    50% {
        box-shadow: 0 0 0 8px rgba(99, 102, 241, 0);
    }
}

@keyframes progressPulse {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}

@keyframes typingCursor {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
}

@keyframes bounceIn {
    0% { transform: scale(0.3); opacity: 0; }
    50% { transform: scale(1.05); }
    70% { transform: scale(0.9); }
    100% { transform: scale(1); opacity: 1; }
}

@keyframes floatBounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
}

.suggestion-panel-enter {
    animation: suggestionSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.suggestion-content-enter {
    animation: suggestionFadeUp 0.35s ease-out;
}

.suggestion-bounce-in {
    animation: bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.suggestion-float {
    animation: floatBounce 2s ease-in-out infinite;
}

.suggestion-typing-cursor {
    animation: typingCursor 0.8s ease-in-out infinite;
}

.suggestion-progress-animated {
    background: linear-gradient(90deg, #6366f1, #8b5cf6, #6366f1);
    background-size: 200% 100%;
    animation: progressPulse 2s ease-in-out infinite;
}

.suggestion-glow {
    animation: pulseGlow 2s ease-in-out infinite;
}
`;

interface RAGSource {
    type: 'conversation' | 'document';
    name: string;
    excerpt: string;
    relevance: number;
    fromAssistant?: string;
    fromAgent?: string;
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
    agentUsed?: {
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
    incomingMessage
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
        if (confidence >= 0.85) return { label: 'High', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', iconColor: 'text-emerald-500' };
        if (confidence >= 0.7) return { label: 'Good', color: 'bg-sky-50 text-sky-700 border-sky-200', iconColor: 'text-sky-500' };
        if (confidence >= 0.5) return { label: 'Fair', color: 'bg-amber-50 text-amber-700 border-amber-200', iconColor: 'text-amber-500' };
        return { label: 'Low', color: 'bg-red-50 text-red-700 border-red-200', iconColor: 'text-red-500' };
    };

    const documentSources = suggestion?.sources?.filter(s => s.type === 'document') || [];

    // Helper to get agent/assistant used info
    const usedAgent = suggestion?.agentUsed || suggestion?.assistantUsed;

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
            <style dangerouslySetInnerHTML={{ __html: suggestionStyles }} />

            {/* Mobile: Full-screen overlay */}
            <div
                className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onDismiss}
            />

            {/* Mobile: Bottom sheet / Desktop: Side panel */}
            <div className={cn(
                "flex flex-col z-50 transition-all duration-300 ease-out",
                // Mobile: Bottom sheet style
                "fixed inset-x-0 bottom-0 max-h-[85vh] rounded-t-3xl shadow-2xl bg-white",
                "animate-in slide-in-from-bottom duration-300",
                // Desktop: Integrated side panel style
                "md:relative md:inset-auto md:w-[420px] md:max-w-[420px] md:h-full md:max-h-full",
                "md:rounded-none md:shadow-none md:bg-gradient-to-b md:from-white md:to-slate-50/50",
                "md:border-l md:border-gray-200/80 md:shrink-0",
                "md:suggestion-panel-enter"
            )}>
                {/* Mobile drag handle */}
                <div className="md:hidden flex justify-center py-3">
                    <div className="w-12 h-1.5 rounded-full bg-gray-200" />
                </div>

                {/* Header - Enhanced design */}
                <div className="shrink-0 px-5 py-4 md:py-5 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "relative w-11 h-11 rounded-xl flex items-center justify-center transition-all",
                                isLoading
                                    ? "bg-gradient-to-br from-indigo-100 to-violet-100 suggestion-glow"
                                    : "bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25"
                            )}>
                                <Zap className={cn(
                                    "h-5 w-5 transition-colors",
                                    isLoading ? "text-indigo-500" : "text-white"
                                )} />
                                {isLoading && (
                                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-400/20 to-violet-400/20 animate-pulse" />
                                )}
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-gray-900 tracking-tight">AI Suggestion</h3>
                                <p className="text-xs text-gray-500">Powered by your knowledge base</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onDismiss}
                            className="h-9 w-9 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all active:scale-95"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <ScrollArea className="flex-1 min-h-0 bg-gradient-to-b from-gray-50/30 to-gray-50/80">
                    <div className="p-5 space-y-4">
                        {/* Customer Message Card */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm suggestion-content-enter">
                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-100 to-gray-100 flex items-center justify-center shrink-0">
                                    <MessageSquare className="w-4 h-4 text-gray-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Customer Message</p>
                                    <p className="text-sm text-gray-800 leading-relaxed">"{incomingMessage}"</p>
                                </div>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm suggestion-content-enter">
                                <div className="flex flex-col items-center text-center">
                                    <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center mb-5 suggestion-float">
                                        <LoadingIcon className="w-7 h-7 text-indigo-600" />
                                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 animate-pulse" />
                                    </div>
                                    <h4 className="text-base font-semibold text-gray-900 mb-1 tracking-tight">{loadingContent.title}</h4>
                                    <p className="text-sm text-gray-500 mb-6">{loadingContent.subtitle}</p>

                                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className="h-full suggestion-progress-animated rounded-full transition-all duration-500 ease-out"
                                            style={{ width: `${loadingContent.progress}%` }}
                                        />
                                    </div>

                                    <div className="flex items-center gap-3 mt-6">
                                        {['Search', 'Analyze', 'Generate'].map((stage, idx) => (
                                            <React.Fragment key={stage}>
                                                <div className={cn(
                                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300",
                                                    (loadingStage === 'searching' && idx === 0) ||
                                                    (loadingStage === 'analyzing' && idx === 1) ||
                                                    (loadingStage === 'generating' && idx === 2)
                                                        ? "bg-indigo-100 text-indigo-700 scale-105"
                                                        : "text-gray-400"
                                                )}>
                                                    {idx === 0 && <Search className="w-3 h-3" />}
                                                    {idx === 1 && <Brain className="w-3 h-3" />}
                                                    {idx === 2 && <Wand2 className="w-3 h-3" />}
                                                    {stage}
                                                </div>
                                                {idx < 2 && <ArrowRight className="w-3 h-3 text-gray-300" />}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : suggestion ? (
                            <>
                                {/* Suggestion Card */}
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden suggestion-content-enter">
                                    {/* Card Header */}
                                    <div className="px-4 py-3 bg-gradient-to-r from-gray-50/80 to-slate-50/80 border-b border-gray-100 flex items-center justify-between">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {usedAgent && (
                                                <div className={cn(
                                                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border shadow-sm",
                                                    usedAgent.usedAsFallback
                                                        ? "bg-amber-50 text-amber-700 border-amber-200"
                                                        : "bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 border-indigo-200"
                                                )}>
                                                    <span className="text-sm">{usedAgent.avatar}</span>
                                                    <span>{usedAgent.name}</span>
                                                    {usedAgent.usedAsFallback && (
                                                        <Badge variant="outline" className="h-4 px-1 text-[8px] bg-white border-amber-300">
                                                            Fallback
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}
                                            <Badge
                                                variant="outline"
                                                className={cn("text-xs h-6 px-2.5 font-medium border shadow-sm", getConfidenceInfo(suggestion.confidence).color)}
                                            >
                                                {Math.round(suggestion.confidence * 100)}% {getConfidenceInfo(suggestion.confidence).label}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-0.5">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={handleCopy}
                                                            className="h-8 w-8 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-all active:scale-95"
                                                        >
                                                            {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-500 suggestion-bounce-in" /> : <Copy className="h-4 w-4" />}
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
                                                            className="h-8 w-8 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all active:scale-95"
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
                                    <div className="p-5" ref={textRef}>
                                        <p className="text-[15px] text-gray-800 leading-relaxed whitespace-pre-wrap">
                                            {displayedText}
                                            {isTyping && <span className="inline-block w-0.5 h-5 bg-indigo-500 ml-0.5 -mb-1 suggestion-typing-cursor" />}
                                        </p>
                                    </div>

                                    {/* Action Buttons */}
                                    {!isTyping && (
                                        <div className="px-5 pb-5 flex gap-2.5">
                                            <Button
                                                onClick={() => onSend(suggestion.suggestedReply)}
                                                className="flex-1 h-11 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-md shadow-indigo-500/20 active:scale-[0.98] transition-all font-medium rounded-xl"
                                            >
                                                <Send className="h-4 w-4 mr-2" />
                                                Send
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => onEdit(suggestion.suggestedReply)}
                                                className="h-11 px-5 border-gray-200 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] transition-all rounded-xl"
                                            >
                                                <Edit3 className="h-4 w-4 mr-2" />
                                                Edit
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* Quick Refine Section */}
                                {!isTyping && (
                                    <div className="space-y-3 suggestion-content-enter" style={{ animationDelay: '0.1s' }}>
                                        <div>
                                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                                                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                                                Quick Refine
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {QUICK_REFINEMENTS.map((item) => (
                                                    <button
                                                        key={item.label}
                                                        onClick={() => onRefine(item.instruction)}
                                                        className="px-3.5 py-2 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gradient-to-r hover:from-indigo-50 hover:to-violet-50 hover:text-indigo-700 hover:border-indigo-300 active:scale-[0.97] transition-all shadow-sm"
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
                                                className="h-10 text-sm bg-white border-gray-200 focus-visible:ring-indigo-500 focus-visible:border-indigo-300 rounded-xl"
                                                onKeyDown={(e) => e.key === 'Enter' && handleCustomRefine()}
                                            />
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleCustomRefine}
                                                disabled={!customRefineInput.trim()}
                                                className="h-10 w-10 p-0 border-gray-200 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-violet-50 hover:text-indigo-600 hover:border-indigo-300 transition-all rounded-xl active:scale-95"
                                            >
                                                <Wand2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Sources Section */}
                                {documentSources.length > 0 && !isTyping && (
                                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm suggestion-content-enter" style={{ animationDelay: '0.15s' }}>
                                        <button
                                            onClick={() => setShowSources(!showSources)}
                                            className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-gray-50/80 transition-all"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center">
                                                    <FileText className="w-4 h-4 text-indigo-600" />
                                                </div>
                                                <span className="text-sm font-medium text-gray-700">
                                                    {documentSources.length} Source{documentSources.length > 1 ? 's' : ''} Used
                                                </span>
                                            </div>
                                            <div className={cn(
                                                "w-6 h-6 rounded-lg flex items-center justify-center transition-all",
                                                showSources ? "bg-indigo-50 rotate-180" : "bg-gray-100"
                                            )}>
                                                <ChevronDown className="w-4 h-4 text-gray-500" />
                                            </div>
                                        </button>

                                        {showSources && (
                                            <div className="border-t border-gray-100 divide-y divide-gray-50">
                                                {documentSources.map((source, idx) => (
                                                    <div key={idx} className="p-4 hover:bg-gray-50/50 transition-colors">
                                                        <div className="flex items-start justify-between mb-1.5">
                                                            <span className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                                                                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                                                                {source.name}
                                                            </span>
                                                            {(source.fromAgent || source.fromAssistant) && (
                                                                <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-violet-50 text-violet-600 border-violet-200">
                                                                    via {source.fromAgent || source.fromAssistant}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        {source.excerpt && (
                                                            <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 pl-5 italic">
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
                                    <div className="flex items-center gap-2.5 px-4 py-3.5 bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl border border-violet-200/80 suggestion-content-enter" style={{ animationDelay: '0.2s' }}>
                                        <div className="w-8 h-8 rounded-xl bg-white/80 flex items-center justify-center shadow-sm">
                                            <User className="w-4 h-4 text-violet-600" />
                                        </div>
                                        <span className="text-sm text-violet-700 font-medium">
                                            Personalized using customer profile
                                        </span>
                                    </div>
                                )}

                                {/* Reasoning Footer */}
                                <p className="text-[11px] text-gray-400 text-center px-4 leading-relaxed">
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