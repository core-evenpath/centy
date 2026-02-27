import React from 'react';
import { Button } from '@/components/ui/button';
import { Star, Package, AlertCircle, X, ArrowLeftRight, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InlineProductData {
    id: string;
    name: string;
    description?: string;
    price: number | null;
    comparePrice?: number | null;
    currency?: string;
    imageUrl?: string;
    images?: string[];
    rating?: number;
    reviewCount?: number;
    stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';
    stockCount?: number;
    colors?: string[];
    category?: string;
    sourceModule?: string;
    metadata?: Record<string, any>;
}

interface InlineProductCardProps {
    product: InlineProductData;
    onChangeProduct?: () => void;
    onRemove?: () => void;
    compact?: boolean;
}

function formatPrice(price: number | null, currency: string = 'INR'): string {
    if (price === null || price === undefined) return '';
    const symbols: Record<string, string> = { INR: '\u20B9', USD: '$', EUR: '\u20AC', GBP: '\u00A3' };
    const symbol = symbols[currency] || currency + ' ';
    return `${symbol}${price.toLocaleString()}`;
}

function getStockLabel(status?: string, count?: number): { label: string; color: string; bg: string } {
    switch (status) {
        case 'in_stock':
            return { label: count ? `${count} in stock` : 'In Stock', color: 'text-emerald-700', bg: 'bg-emerald-50' };
        case 'low_stock':
            return { label: count ? `Only ${count} left` : 'Low Stock', color: 'text-amber-700', bg: 'bg-amber-50' };
        case 'out_of_stock':
            return { label: 'Out of Stock', color: 'text-red-700', bg: 'bg-red-50' };
        default:
            return { label: '', color: '', bg: '' };
    }
}

export default function InlineProductCard({ product, onChangeProduct, onRemove, compact = false }: InlineProductCardProps) {
    const currency = product.currency || 'INR';
    const hasDiscount = product.comparePrice && product.price && product.comparePrice > product.price;
    const discountPercent = hasDiscount
        ? Math.round(((product.comparePrice! - product.price!) / product.comparePrice!) * 100)
        : 0;
    const stock = getStockLabel(product.stockStatus, product.stockCount);
    const heroImage = product.imageUrl || product.images?.[0];

    return (
        <div className={cn(
            "group relative bg-white rounded-2xl border border-[#e8e8e8] overflow-hidden transition-all duration-200",
            "hover:border-[#d0d0d0] hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)]",
            compact ? "max-w-[220px]" : "w-full"
        )}>
            {/* Remove button - top right corner */}
            {onRemove && (
                <button
                    type="button"
                    onClick={onRemove}
                    className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:bg-black/70"
                >
                    <X className="w-3 h-3 text-white" />
                </button>
            )}

            {/* Hero Image */}
            <div className={cn(
                "relative w-full bg-[#f5f5f5] overflow-hidden",
                compact ? "h-[140px]" : "h-[180px]"
            )}>
                {heroImage ? (
                    <img
                        src={heroImage}
                        alt={product.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                        <Package className="w-8 h-8 text-[#ccc]" />
                        <span className="text-[11px] text-[#bbb]">No image</span>
                    </div>
                )}

                {/* Discount badge overlay */}
                {hasDiscount && (
                    <div className="absolute top-2.5 left-2.5">
                        <span className="px-2 py-0.5 text-[11px] font-bold text-white bg-emerald-500 rounded-full shadow-sm">
                            {discountPercent}% OFF
                        </span>
                    </div>
                )}

                {/* Stock badge overlay */}
                {stock.label && product.stockStatus !== 'in_stock' && (
                    <div className="absolute bottom-2.5 left-2.5">
                        <span className={cn(
                            "px-2 py-0.5 text-[10px] font-semibold rounded-full backdrop-blur-sm",
                            product.stockStatus === 'out_of_stock'
                                ? "bg-red-500/90 text-white"
                                : "bg-amber-400/90 text-amber-900"
                        )}>
                            {product.stockStatus === 'out_of_stock' && <AlertCircle className="w-2.5 h-2.5 inline mr-0.5 -mt-px" />}
                            {stock.label}
                        </span>
                    </div>
                )}

                {/* Image count badge */}
                {product.images && product.images.length > 1 && (
                    <div className="absolute bottom-2.5 right-2.5">
                        <span className="px-1.5 py-0.5 text-[10px] font-medium text-white bg-black/50 backdrop-blur-sm rounded">
                            1/{product.images.length}
                        </span>
                    </div>
                )}
            </div>

            {/* Product Details */}
            <div className={cn("px-3.5 pt-3 pb-2.5", compact && "px-3 pt-2.5 pb-2")}>
                {/* Category tag */}
                {product.category && (
                    <span className="text-[10px] font-medium text-[#888] uppercase tracking-wider">
                        {product.category}
                    </span>
                )}

                {/* Product name */}
                <h4 className={cn(
                    "font-semibold text-[#111] leading-snug mt-0.5",
                    compact ? "text-[13px] line-clamp-1" : "text-[14px] line-clamp-2"
                )}>
                    {product.name}
                </h4>

                {/* Price row */}
                <div className="flex items-baseline gap-2 mt-1.5">
                    {product.price !== null && (
                        <span className={cn(
                            "font-bold text-[#111]",
                            compact ? "text-[15px]" : "text-[17px]"
                        )}>
                            {formatPrice(product.price, currency)}
                        </span>
                    )}
                    {hasDiscount && (
                        <span className="text-[12px] text-[#999] line-through">
                            {formatPrice(product.comparePrice!, currency)}
                        </span>
                    )}
                </div>

                {/* Rating */}
                {product.rating && product.rating > 0 && (
                    <div className="flex items-center gap-1.5 mt-2">
                        <div className="flex items-center gap-px">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    className={cn(
                                        "w-3 h-3",
                                        star <= Math.round(product.rating!)
                                            ? "text-amber-400 fill-amber-400"
                                            : "text-[#e0e0e0] fill-[#e0e0e0]"
                                    )}
                                />
                            ))}
                        </div>
                        <span className="text-[11px] text-[#888]">
                            {product.rating.toFixed(1)}
                            {product.reviewCount !== undefined && ` (${product.reviewCount})`}
                        </span>
                    </div>
                )}

                {/* Description - only in non-compact */}
                {!compact && product.description && (
                    <p className="text-[12px] text-[#777] leading-relaxed mt-2 line-clamp-2">
                        {product.description}
                    </p>
                )}

                {/* Colors */}
                {product.colors && product.colors.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-2">
                        <div className="flex -space-x-0.5">
                            {product.colors.slice(0, 5).map((color, idx) => (
                                <div
                                    key={idx}
                                    className="w-4 h-4 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.08)]"
                                    style={{ backgroundColor: color }}
                                    title={color}
                                />
                            ))}
                        </div>
                        {product.colors.length > 5 && (
                            <span className="text-[10px] text-[#999] font-medium">
                                +{product.colors.length - 5}
                            </span>
                        )}
                    </div>
                )}

                {/* In-stock label (only for in_stock) */}
                {stock.label && product.stockStatus === 'in_stock' && (
                    <div className="mt-2">
                        <span className="text-[10px] font-medium text-emerald-600">
                            {stock.label}
                        </span>
                    </div>
                )}
            </div>

            {/* Action bar */}
            {(onChangeProduct || onRemove) && (
                <div className="px-3.5 pb-3 pt-0.5">
                    <div className="flex items-center gap-2">
                        {onChangeProduct && (
                            <button
                                type="button"
                                onClick={onChangeProduct}
                                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-[#555] bg-[#f5f5f5] hover:bg-[#ebebeb] rounded-lg transition-colors duration-150"
                            >
                                <ArrowLeftRight className="w-3 h-3" />
                                Swap
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
