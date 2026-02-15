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
    Package,
    Plus,
    ShoppingBag,
    Image as ImageIcon
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

    // Product management state
    const [attachedProducts, setAttachedProducts] = useState<InlineProductData[]>([]);
    const [showProductPicker, setShowProductPicker] = useState(false);
    const [swapPickerIndex, setSwapPickerIndex] = useState<number | null>(null);

    // Initialize attached products from suggestion's inline content
    useEffect(() => {
        if (suggestion?.inlineContent) {
            const products = suggestion.inlineContent
                .filter(b => b.type === 'product' && b.data)
                .map(b => b.data as InlineProductData);
            setAttachedProducts(products);
        } else {
            setAttachedProducts([]);
        }
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

    // Build WhatsApp-formatted caption for a product (mirrors the card layout)
    const buildProductCaption = useCallback((product: InlineProductData): string => {
        const currencySymbol = product.currency === 'USD' ? '$'
            : product.currency === 'EUR' ? '\u20AC'
            : product.currency === 'GBP' ? '\u00A3'
            : '\u20B9';
        const lines: string[] = [];

        // Category
        if (product.category) {
            lines.push(product.category.toUpperCase());
        }

        // Product name (bold in WhatsApp)
        lines.push(`*${product.name}*`);

        // Price line
        if (product.price !== null) {
            let priceLine = `*${currencySymbol}${product.price.toLocaleString()}*`;
            if (product.comparePrice && product.comparePrice > product.price) {
                const discount = Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100);
                priceLine += `  ~${currencySymbol}${product.comparePrice.toLocaleString()}~  (${discount}% off)`;
            }
            lines.push(priceLine);
        }

        // Rating
        if (product.rating && product.rating > 0) {
            let ratingLine = `\u2B50 ${product.rating.toFixed(1)}`;
            if (product.reviewCount !== undefined) {
                ratingLine += ` (${product.reviewCount} reviews)`;
            }
            lines.push(ratingLine);
        }

        // Stock status
        if (product.stockStatus === 'in_stock') {
            const stockText = product.stockCount ? `${product.stockCount} in stock` : 'In Stock';
            lines.push(`\u2705 ${stockText}`);
        } else if (product.stockStatus === 'low_stock') {
            const stockText = product.stockCount ? `Only ${product.stockCount} left` : 'Low Stock';
            lines.push(`\u26A0\uFE0F ${stockText}`);
        } else if (product.stockStatus === 'out_of_stock') {
            lines.push(`\u274C Out of Stock`);
        }

        // Description
        if (product.description) {
            const desc = product.description.length > 300
                ? product.description.substring(0, 300) + '...'
                : product.description;
            lines.push('');
            lines.push(desc);
        }

        // Colors
        if (product.colors && product.colors.length > 0) {
            lines.push('');
            lines.push(`\uD83C\uDFA8 Colors: ${product.colors.join(', ')}`);
        }

        return lines.join('\n');
    }, []);

    // Build the text-only message (no product details - those go in image captions)
    const buildFinalText = useCallback(() => {
        if (!suggestion) return '';
        return suggestion.suggestedReply;
    }, [suggestion]);

    const handleCopy = () => {
        // For copy, include product details in the text since there's no image
        if (!suggestion) return;
        let text = suggestion.suggestedReply;
        if (attachedProducts.length > 0) {
            for (const product of attachedProducts) {
                text += '\n\n---\n' + buildProductCaption(product);
            }
        }
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSend = () => {
        const text = buildFinalText();
        if (text) {
            onSend(text);
        }
        // Send each product as a separate image message with rich caption
        if (onSendMedia) {
            for (const product of attachedProducts) {
                const imageUrl = product.imageUrl || product.images?.[0];
                if (imageUrl) {
                    onSendMedia(imageUrl, 'image', buildProductCaption(product));
                }
            }
        }
    };

    const handleEdit = () => {
        // For edit, put the suggestion text in the input (products sent separately)
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

    // Product management
    const handleRemoveProduct = (index: number) => {
        setAttachedProducts(prev => prev.filter((_, i) => i !== index));
    };

    const handleSwapProduct = (index: number, product: InlineProductData) => {
        setAttachedProducts(prev => prev.map((p, i) => i === index ? product : p));
    };

    const handleAddProducts = (products: InlineProductData[]) => {
        setAttachedProducts(prev => {
            const existing = new Set(prev.map(p => p.id));
            const newProducts = products.filter(p => !existing.has(p.id));
            return [...prev, ...newProducts];
        });
    };

    // Get all available products for picker (deduped)
    const allPickerProducts = useMemo(() => {
        const allProducts = [...availableProducts];
        // Include inline content products that aren't in availableProducts
        if (suggestion?.inlineContent) {
            for (const block of suggestion.inlineContent) {
                if (block.type === 'product' && block.data) {
                    const p = block.data as InlineProductData;
                    if (!allProducts.find(ap => ap.id === p.id)) {
                        allProducts.push(p);
                    }
                }
            }
        }
        return allProducts;
    }, [availableProducts, suggestion?.inlineContent]);

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

    const loadingContent = getLoadingContent();
    const LoadingIcon = loadingContent.icon;

    if (!isVisible) {
        return (
            <div className="hidden md:block md:w-0 md:overflow-hidden md:shrink-0 transition-all duration-300 ease-out" />
        );
    }

    const productCount = attachedProducts.length;
    const hasProductImages = attachedProducts.some(p => p.imageUrl || p.images?.[0]);

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
                "md:static md:w-[400px] md:max-w-[400px] md:h-full md:max-h-full",
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
                                {/* Suggestion Text */}
                                <div className="bg-white rounded-xl border border-[#e5e5e5] p-5" ref={textRef}>
                                    <p className="text-[14px] text-[#111] leading-[1.7] whitespace-pre-wrap">
                                        {displayedText}
                                        {isTyping && <span className="inline-block w-0.5 h-4 bg-[#000] ml-0.5 animate-pulse" />}
                                    </p>
                                </div>

                                {/* Products Section */}
                                {!isTyping && (
                                    <div className="space-y-3">
                                        {/* Section header with count and add button */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-md bg-[#111] flex items-center justify-center">
                                                    <ShoppingBag className="w-3 h-3 text-white" />
                                                </div>
                                                <span className="text-[12px] font-semibold text-[#333]">
                                                    Products
                                                </span>
                                                {productCount > 0 && (
                                                    <span className="text-[11px] text-[#888] bg-[#f0f0f0] px-1.5 py-0.5 rounded-full font-medium">
                                                        {productCount}
                                                    </span>
                                                )}
                                            </div>
                                            {allPickerProducts.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setShowProductPicker(true)}
                                                    className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium text-[#111] bg-white border border-[#e0e0e0] hover:border-[#bbb] hover:bg-[#f8f8f8] rounded-lg transition-all duration-150"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                    Add Products
                                                </button>
                                            )}
                                        </div>

                                        {/* Product cards */}
                                        {productCount > 0 ? (
                                            <div className="space-y-3">
                                                {attachedProducts.map((product, idx) => (
                                                    <InlineProductCard
                                                        key={`product-${product.id}-${idx}`}
                                                        product={product}
                                                        onChangeProduct={() => setSwapPickerIndex(idx)}
                                                        onRemove={() => handleRemoveProduct(idx)}
                                                    />
                                                ))}
                                            </div>
                                        ) : allPickerProducts.length > 0 ? (
                                            /* Empty state - invite to add */
                                            <button
                                                type="button"
                                                onClick={() => setShowProductPicker(true)}
                                                className="w-full flex flex-col items-center gap-2 py-6 px-4 rounded-xl border-2 border-dashed border-[#e0e0e0] hover:border-[#bbb] bg-white hover:bg-[#fcfcfc] transition-all duration-150 group cursor-pointer"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-[#f5f5f5] group-hover:bg-[#eee] flex items-center justify-center transition-colors duration-150">
                                                    <Plus className="w-5 h-5 text-[#888] group-hover:text-[#555]" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[13px] font-medium text-[#555]">Add products to send</p>
                                                    <p className="text-[11px] text-[#aaa] mt-0.5">Products will be sent as image messages</p>
                                                </div>
                                            </button>
                                        ) : null}

                                        {/* Send preview hint */}
                                        {productCount > 0 && hasProductImages && (
                                            <div className="flex items-center gap-2 px-3 py-2 bg-[#f8f8ff] border border-[#e8e8f0] rounded-lg">
                                                <ImageIcon className="w-3.5 h-3.5 text-[#6366f1]" />
                                                <span className="text-[11px] text-[#666]">
                                                    {productCount} product image{productCount !== 1 ? 's' : ''} will be sent after the text message
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Action Buttons */}
                                {!isTyping && (
                                    <div className="flex gap-2.5">
                                        <Button
                                            onClick={handleSend}
                                            className="flex-1 h-12 bg-[#111] hover:bg-[#000] text-white text-[14px] font-semibold rounded-lg transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                                        >
                                            <span className="mr-2">&uarr;</span>
                                            Send{productCount > 0 ? ` + ${productCount} Product${productCount !== 1 ? 's' : ''}` : ''}
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

            {/* Add Products Modal */}
            {showProductPicker && (
                <ProductPickerModal
                    open={true}
                    onOpenChange={(open) => {
                        if (!open) setShowProductPicker(false);
                    }}
                    products={allPickerProducts}
                    alreadySelectedIds={attachedProducts.map(p => p.id)}
                    onAddProducts={handleAddProducts}
                />
            )}

            {/* Swap Product Modal */}
            {swapPickerIndex !== null && (
                <ProductPickerModal
                    open={true}
                    onOpenChange={(open) => {
                        if (!open) setSwapPickerIndex(null);
                    }}
                    products={allPickerProducts}
                    currentProductId={attachedProducts[swapPickerIndex]?.id}
                    onSelect={(product) => handleSwapProduct(swapPickerIndex, product)}
                />
            )}
        </>
    );
}
