import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
    Zap,
    Building,
    Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import InlineProductCard, { type InlineProductData } from './InlineProductCard';
import ProductPickerModal from './ProductPickerModal';

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
    type: 'document' | 'module' | 'profile';
    name: string;
    excerpt: string;
    relevance: number;
}

export interface InlineContentBlock {
    type: 'product' | 'document' | 'image';
    position: 'before' | 'after' | 'inline';
    data: any;
}

export interface RAGSuggestion {
    suggestedReply: string;
    confidence: number;
    reasoning: string;
    sources: RAGSource[];
    inlineContent?: InlineContentBlock[];
    personaUsed?: boolean;
    assistantUsed?: any;
}

interface CoreMemorySuggestionProps {
    suggestion: RAGSuggestion | null;
    isLoading: boolean;
    isVisible: boolean;
    onEdit: (text: string) => void;
    onSend: (text: string) => void;
    onSendMedia?: (mediaUrl: string, mediaType: 'image' | 'video' | 'audio' | 'document', caption?: string, filename?: string) => void;
    onDismiss: () => void;
    onRegenerate: () => void;
    onRefine: (instruction: string) => void;
    incomingMessage: string;
    availableProducts?: InlineProductData[];
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
    onSendMedia,
    onDismiss,
    onRegenerate,
    onRefine,
    incomingMessage,
    availableProducts = [],
}: CoreMemorySuggestionProps) {
    const [loadingStage, setLoadingStage] = useState<LoadingStage>('searching');
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [showSources, setShowSources] = useState(false);
    const [customRefineInput, setCustomRefineInput] = useState('');
    const [copied, setCopied] = useState(false);
    const textRef = useRef<HTMLDivElement>(null);

    // Inline product card state
    const [swappedProducts, setSwappedProducts] = useState<Record<number, InlineProductData>>({});
    const [pickerOpenIndex, setPickerOpenIndex] = useState<number | null>(null);
    const [embedImages, setEmbedImages] = useState<Record<number, boolean>>({});

    // Reset swapped products and embed state when suggestion changes
    useEffect(() => {
        setSwappedProducts({});
        setEmbedImages({});
    }, [suggestion?.suggestedReply]);

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

    // Get resolved inline content (with swapped products applied)
    const resolvedInlineContent = useMemo(() => {
        if (!suggestion?.inlineContent) return [];
        return suggestion.inlineContent.map((block, idx) => {
            if (block.type === 'product' && swappedProducts[idx]) {
                return { ...block, data: swappedProducts[idx] };
            }
            return block;
        });
    }, [suggestion?.inlineContent, swappedProducts]);

    // Build the final text for send/edit, incorporating swapped product names
    const buildFinalText = useCallback(() => {
        if (!suggestion) return '';
        const reply = suggestion.suggestedReply;
        if (!resolvedInlineContent.length) return reply;

        // The text is sent as-is; product details are conveyed via the inline cards visually.
        // For the actual message, we append product details as text.
        const productBlocks = resolvedInlineContent.filter(b => b.type === 'product');
        if (productBlocks.length === 0) return reply;

        let finalText = reply;
        for (const block of productBlocks) {
            const product = block.data as InlineProductData;
            if (!product) continue;
            const priceStr = product.price !== null
                ? ` - ${product.currency || 'INR'} ${product.price?.toLocaleString()}`
                : '';
            const productLine = `\n\n${product.name}${priceStr}`;
            if (block.position === 'before') {
                finalText = productLine + '\n\n' + finalText;
            } else {
                finalText = finalText + productLine;
            }
        }
        return finalText;
    }, [suggestion, resolvedInlineContent]);

    const handleCopy = () => {
        const text = buildFinalText();
        if (text) {
            navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleSend = () => {
        const text = buildFinalText();
        if (text) {
            onSend(text);
        }
        // Send embedded product images after the text message
        if (onSendMedia) {
            for (const [indexStr, shouldEmbed] of Object.entries(embedImages)) {
                if (!shouldEmbed) continue;
                const idx = Number(indexStr);
                const block = resolvedInlineContent[idx];
                if (block?.type === 'product') {
                    const product = block.data as InlineProductData;
                    const imageUrl = product.imageUrl || product.images?.[0];
                    if (imageUrl) {
                        onSendMedia(imageUrl, 'image', product.name);
                    }
                }
            }
        }
    };

    const handleEdit = () => {
        const text = buildFinalText();
        if (text) {
            onEdit(text);
        }
    };

    const handleCustomRefine = () => {
        if (customRefineInput.trim()) {
            onRefine(customRefineInput.trim());
            setCustomRefineInput('');
        }
    };

    const handleProductSwap = (index: number, product: InlineProductData) => {
        setSwappedProducts(prev => ({ ...prev, [index]: product }));
    };

    // Build product list for picker: available products + products from other inline blocks
    const getPickerProducts = useCallback((currentIndex: number): InlineProductData[] => {
        const fromInline: InlineProductData[] = [];
        if (suggestion?.inlineContent) {
            for (const block of suggestion.inlineContent) {
                if (block.type === 'product' && block.data) {
                    fromInline.push(block.data as InlineProductData);
                }
            }
        }
        // Merge availableProducts and fromInline, deduplicating by id
        const allProducts = [...availableProducts];
        for (const p of fromInline) {
            if (!allProducts.find(ap => ap.id === p.id)) {
                allProducts.push(p);
            }
        }
        // Also include any swapped products
        for (const p of Object.values(swappedProducts)) {
            if (!allProducts.find(ap => ap.id === p.id)) {
                allProducts.push(p);
            }
        }
        return allProducts;
    }, [suggestion?.inlineContent, availableProducts, swappedProducts]);

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

    const getLoadingContent = () => {
        const stages = {
            searching: {
                icon: Search,
                title: 'Building AI Context',
                subtitle: 'Profile, modules & documents...',
                progress: 33
            },
            analyzing: {
                icon: Brain,
                title: 'Analyzing Conversation',
                subtitle: 'Understanding the customer...',
                progress: 66
            },
            generating: {
                icon: Wand2,
                title: 'Crafting Suggestion',
                subtitle: 'Generating professional reply...',
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

    // Render suggestion text with inline product cards interspersed
    const renderSuggestionContent = () => {
        if (!suggestion) return null;

        const productBlocks = resolvedInlineContent.filter(b => b.type === 'product');
        const beforeBlocks: Array<{ block: InlineContentBlock; index: number }> = [];
        const afterBlocks: Array<{ block: InlineContentBlock; index: number }> = [];
        const inlineBlocks: Array<{ block: InlineContentBlock; index: number }> = [];

        resolvedInlineContent.forEach((block, idx) => {
            if (block.type !== 'product') return;
            if (block.position === 'before') beforeBlocks.push({ block, index: idx });
            else if (block.position === 'after') afterBlocks.push({ block, index: idx });
            else inlineBlocks.push({ block, index: idx });
        });

        const renderProductCard = (block: InlineContentBlock, idx: number) => (
            <InlineProductCard
                key={`product-${idx}`}
                product={block.data as InlineProductData}
                onChangeProduct={() => setPickerOpenIndex(idx)}
                embedImage={!!embedImages[idx]}
                onToggleEmbed={onSendMedia ? (embed) => setEmbedImages(prev => ({ ...prev, [idx]: embed })) : undefined}
            />
        );

        return (
            <div className="bg-white rounded-xl border border-[#e5e5e5] p-5" ref={textRef}>
                {/* Before-position product cards */}
                {!isTyping && beforeBlocks.map(({ block, index }) => renderProductCard(block, index))}

                {/* Suggestion text */}
                {inlineBlocks.length > 0 && !isTyping ? (
                    // Split text around inline markers: use "---" or double newline as split points
                    renderTextWithInlineCards(displayedText, inlineBlocks)
                ) : (
                    <p className="text-[14px] text-[#111] leading-[1.7] whitespace-pre-wrap">
                        {displayedText}
                        {isTyping && <span className="inline-block w-0.5 h-4 bg-[#000] ml-0.5 animate-pulse" />}
                    </p>
                )}

                {/* After-position product cards */}
                {!isTyping && afterBlocks.map(({ block, index }) => renderProductCard(block, index))}
            </div>
        );
    };

    // Render text split by paragraph breaks with inline product cards inserted between segments
    const renderTextWithInlineCards = (
        text: string,
        inlineBlocks: Array<{ block: InlineContentBlock; index: number }>
    ) => {
        // Split text into paragraphs (by double newline or single newline)
        const paragraphs = text.split(/\n\n+/);

        // If we have fewer paragraphs than inline blocks + 1, just split evenly
        const splitPoint = Math.max(1, Math.ceil(paragraphs.length / (inlineBlocks.length + 1)));

        const segments: React.ReactNode[] = [];
        let blockIdx = 0;

        for (let i = 0; i < paragraphs.length; i++) {
            segments.push(
                <p key={`text-${i}`} className="text-[14px] text-[#111] leading-[1.7] whitespace-pre-wrap">
                    {paragraphs[i]}
                </p>
            );

            // Insert an inline product card after every splitPoint paragraphs
            if (
                blockIdx < inlineBlocks.length &&
                (i + 1) % splitPoint === 0 &&
                i < paragraphs.length - 1
            ) {
                const { block, index } = inlineBlocks[blockIdx];
                segments.push(
                    <InlineProductCard
                        key={`inline-product-${index}`}
                        product={block.data as InlineProductData}
                        onChangeProduct={() => setPickerOpenIndex(index)}
                        embedImage={!!embedImages[index]}
                        onToggleEmbed={onSendMedia ? (embed) => setEmbedImages(prev => ({ ...prev, [index]: embed })) : undefined}
                    />
                );
                blockIdx++;
            }
        }

        // If any remaining inline blocks not yet inserted, append them
        while (blockIdx < inlineBlocks.length) {
            const { block, index } = inlineBlocks[blockIdx];
            segments.push(
                <InlineProductCard
                    key={`inline-product-tail-${index}`}
                    product={block.data as InlineProductData}
                    onChangeProduct={() => setPickerOpenIndex(index)}
                    embedImage={!!embedImages[index]}
                    onToggleEmbed={onSendMedia ? (embed) => setEmbedImages(prev => ({ ...prev, [index]: embed })) : undefined}
                />
            );
            blockIdx++;
        }

        return <div className="space-y-1">{segments}</div>;
    };

    const loadingContent = getLoadingContent();
    const LoadingIcon = loadingContent.icon;

    if (!isVisible) {
        // Desktop: render a hidden placeholder to prevent layout shift
        return (
            <div className="hidden md:block md:w-0 md:overflow-hidden md:shrink-0 transition-all duration-300 ease-out" />
        );
    }

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
                "md:static md:w-[380px] md:max-w-[380px] md:h-full md:max-h-full",
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
                                        Powered by AI Context Builder
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
                                {/* Suggestion Text with Inline Product Cards */}
                                {renderSuggestionContent()}

                                {/* Action Buttons */}
                                {!isTyping && (
                                    <div className="flex gap-2.5">
                                        <Button
                                            onClick={handleSend}
                                            className="flex-1 h-12 bg-[#111] hover:bg-[#000] text-white text-[14px] font-semibold rounded-lg transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                                        >
                                            <span className="mr-2">↑</span>
                                            Send
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={handleEdit}
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

                                {/* Sources Section */}
                                {!isTyping && suggestion.sources.length > 0 && (
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-semibold text-[#999] uppercase tracking-wider flex items-center gap-1.5">
                                            <Database className="w-3 h-3" />
                                            Context Used
                                        </p>
                                        <div className="space-y-2">
                                            {suggestion.sources.map((source, idx) => (
                                                <div key={idx} className="flex items-center gap-2 p-2 bg-white border border-[#e5e5e5] rounded-lg">
                                                    {source.type === 'profile' && <Building className="w-4 h-4 text-blue-500" />}
                                                    {source.type === 'module' && <Package className="w-4 h-4 text-green-500" />}
                                                    {source.type === 'document' && <FileText className="w-4 h-4 text-purple-500" />}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-medium text-gray-900 truncate">{source.name}</p>
                                                        <p className="text-[10px] text-gray-500 truncate">{source.excerpt}</p>
                                                    </div>
                                                    <Badge variant="outline" className="text-[9px] px-1 h-4 border-[#eee] text-[#666]">
                                                        {Math.round(source.relevance * 100)}%
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Personalization Badge */}
                                {suggestion.personaUsed && (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50/50 rounded-lg border border-blue-100">
                                        <User className="w-3 h-3 text-blue-500" />
                                        <span className="text-[11px] text-blue-600 font-medium">
                                            Personalized for this customer
                                        </span>
                                    </div>
                                )}
                            </>
                        ) : null}
                    </div>
                </ScrollArea>
            </div>

            {/* Product Picker Modal */}
            {pickerOpenIndex !== null && (
                <ProductPickerModal
                    open={true}
                    onOpenChange={(open) => {
                        if (!open) setPickerOpenIndex(null);
                    }}
                    products={getPickerProducts(pickerOpenIndex)}
                    currentProductId={
                        resolvedInlineContent[pickerOpenIndex]?.type === 'product'
                            ? (resolvedInlineContent[pickerOpenIndex].data as InlineProductData)?.id
                            : undefined
                    }
                    onSelect={(product) => handleProductSwap(pickerOpenIndex, product)}
                />
            )}
        </>
    );
}
