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
                "fixed inset-x-0 bottom-0 max-h-[85vh] rounded-t-3xl shadow-2xl bg-[#fafafa]",
                "animate-in slide-in-from-bottom duration-300",
                // Desktop: Integrated side panel style
                "md:relative md:inset-auto md:w-[380px] md:max-w-[380px] md:h-full md:max-h-full",
                "md:rounded-none md:shadow-none md:bg-[#fafafa]",
                "md:border-l md:border-[#e5e5e5] md:shrink-0",
                "md:suggestion-panel-enter"
            )}>
                {/* Mobile drag handle */}
                <div className="md:hidden flex justify-center py-3">
                    <div className="w-12 h-1.5 rounded-full bg-[#ddd]" />
                </div>

                {/* Scrollable Content */}
                <ScrollArea className="flex-1 min-h-0 bg-[#fafafa]">
                    <div className="p-5 space-y-4">
                        {/* Customer Message Card */}
                        <div className="bg-white rounded-xl border border-[#e5e5e5] p-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-[#f5f5f5] flex items-center justify-center shrink-0">
                                    <MessageSquare className="w-4 h-4 text-[#666]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-semibold text-[#999] uppercase tracking-wider mb-1.5">Customer Message</p>
                                    <p className="text-[14px] text-[#111] leading-[1.6]">"{incomingMessage}"</p>
                                </div>
                            </div>
                        </div>

                        {/* Suggestion Header */}
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center",
                                    isLoading ? "bg-[#f5f5f5]" : "bg-[#111]"
                                )}>
                                    <Zap className={cn(
                                        "h-5 w-5",
                                        isLoading ? "text-[#666]" : "text-white"
                                    )} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-[14px] font-semibold text-[#000]">Pingbox</h3>
                                        <span className="text-[14px] text-[#666]">Suggestion</span>
                                        {suggestion && !isLoading && (
                                            <span className="px-2 py-0.5 text-[11px] font-semibold text-[#16a34a] bg-[#f0fdf4] rounded ml-1">
                                                {Math.round(suggestion.confidence * 100)}% Match
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[12px] text-[#999] mt-0.5">
                                        {documentSources.length > 0 ? documentSources.map(s => s.name).slice(0, 3).join(' · ') : 'Knowledge Base'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-0.5">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleCopy}
                                    className="h-8 w-8 text-[#999] hover:text-[#666] hover:bg-[#f5f5f5]"
                                >
                                    {copied ? <CheckCircle2 className="h-4 w-4 text-[#16a34a]" /> : <Copy className="h-4 w-4" />}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onRegenerate}
                                    className="h-8 w-8 text-[#999] hover:text-[#666] hover:bg-[#f5f5f5]"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="bg-white rounded-xl border border-[#e5e5e5] p-6">
                                <div className="flex flex-col items-center text-center">
                                    <div className="flex gap-1.5 mb-4">
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#000] animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#000] animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#000] animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                    <p className="text-[14px] text-[#666]">{loadingContent.title}</p>
                                    <p className="text-[12px] text-[#999] mt-1">{loadingContent.subtitle}</p>
                                </div>
                            </div>
                        ) : suggestion ? (
                            <>
                                {/* Suggestion Text */}
                                <div className="bg-white rounded-xl border border-[#e5e5e5] p-5" ref={textRef}>
                                    <p className="text-[14px] text-[#111] leading-[1.7] whitespace-pre-wrap">
                                        {displayedText}
                                        {isTyping && <span className="inline-block w-0.5 h-4 bg-[#000] ml-0.5 animate-pulse" />}
                                    </p>
                                </div>

                                {/* Action Buttons */}
                                {!isTyping && (
                                    <div className="flex gap-2.5">
                                        <Button
                                            onClick={() => onSend(suggestion.suggestedReply)}
                                            className="flex-1 h-12 bg-[#111] hover:bg-[#000] text-white text-[14px] font-semibold rounded-lg transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                                        >
                                            <span className="mr-2">↑</span>
                                            Send
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => onEdit(suggestion.suggestedReply)}
                                            className="h-12 px-6 border-[#e5e5e5] hover:bg-[#f5f5f5] hover:border-[#ddd] text-[14px] font-medium rounded-lg transition-all duration-200"
                                        >
                                            <Edit3 className="h-4 w-4 mr-2" />
                                            Edit
                                        </Button>
                                    </div>
                                )}

                                {/* Quick Refine Section */}
                                {!isTyping && (
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] font-semibold text-[#999] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                                <Lightbulb className="w-3 h-3" />
                                                Quick Refine
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {QUICK_REFINEMENTS.map((item) => (
                                                    <button
                                                        key={item.label}
                                                        onClick={() => onRefine(item.instruction)}
                                                        className="px-4 py-2.5 text-[13px] font-medium text-[#333] bg-white border border-[#e5e5e5] rounded-lg hover:bg-[#f5f5f5] hover:border-[#ddd] transition-all duration-200"
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
                                                className="h-10 text-[14px] bg-white border-[#e5e5e5] focus:border-[#000] focus:ring-0 rounded-lg placeholder:text-[#999]"
                                                onKeyDown={(e) => e.key === 'Enter' && handleCustomRefine()}
                                            />
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleCustomRefine}
                                                disabled={!customRefineInput.trim()}
                                                className="h-10 w-10 p-0 border-[#e5e5e5] hover:bg-[#f5f5f5] rounded-lg"
                                            >
                                                <Wand2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Sources Section - Hidden for cleaner UI */}

                                {/* Personalization Badge */}
                                {suggestion.personaUsed && (
                                    <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-200">
                                        <User className="w-4 h-4 text-gray-500" />
                                        <span className="text-xs text-gray-600">
                                            Personalized using customer profile
                                        </span>
                                    </div>
                                )}
                            </>
                        ) : null}
                    </div>
                </ScrollArea>
            </div>
        </>
    );
}