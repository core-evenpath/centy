import React from 'react';
import { Button } from '@/components/ui/button';
import { Star, RefreshCw, Package, AlertCircle, ImageIcon } from 'lucide-react';
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
    onChangeProduct: () => void;
    embedImage?: boolean;
    onToggleEmbed?: (embed: boolean) => void;
}

function formatPrice(price: number | null, currency: string = 'INR'): string {
    if (price === null || price === undefined) return '';
    const symbols: Record<string, string> = { INR: '\u20B9', USD: '$', EUR: '\u20AC', GBP: '\u00A3' };
    const symbol = symbols[currency] || currency + ' ';
    return `${symbol}${price.toLocaleString()}`;
}

function getStockLabel(status?: string, count?: number): { label: string; color: string } {
    switch (status) {
        case 'in_stock':
            return { label: count ? `${count} in stock` : 'In Stock', color: 'text-[#16a34a]' };
        case 'low_stock':
            return { label: count ? `Only ${count} left` : 'Low Stock', color: 'text-[#ea580c]' };
        case 'out_of_stock':
            return { label: 'Out of Stock', color: 'text-[#dc2626]' };
        default:
            return { label: '', color: '' };
    }
}

export default function InlineProductCard({ product, onChangeProduct, embedImage, onToggleEmbed }: InlineProductCardProps) {
    const currency = product.currency || 'INR';
    const hasDiscount = product.comparePrice && product.price && product.comparePrice > product.price;
    const discountPercent = hasDiscount
        ? Math.round(((product.comparePrice! - product.price!) / product.comparePrice!) * 100)
        : 0;
    const stock = getStockLabel(product.stockStatus, product.stockCount);

    return (
        <div className="bg-[#fafafa] border border-[#e5e5e5] rounded-xl p-3 my-2">
            <div className="flex gap-3">
                {/* Product Image */}
                <div className="w-16 h-16 rounded-lg bg-[#f0f0f0] border border-[#e5e5e5] overflow-hidden shrink-0 flex items-center justify-center">
                    {product.imageUrl ? (
                        <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <Package className="w-6 h-6 text-[#999]" />
                    )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#111] leading-tight truncate">
                        {product.name}
                    </p>

                    {/* Price Row */}
                    <div className="flex items-center gap-1.5 mt-1">
                        {product.price !== null && (
                            <span className="text-[13px] font-semibold text-[#111]">
                                {formatPrice(product.price, currency)}
                            </span>
                        )}
                        {hasDiscount && (
                            <>
                                <span className="text-[11px] text-[#999] line-through">
                                    {formatPrice(product.comparePrice!, currency)}
                                </span>
                                <span className="text-[10px] font-semibold text-[#16a34a] bg-[#f0fdf4] px-1 py-0.5 rounded">
                                    {discountPercent}% off
                                </span>
                            </>
                        )}
                    </div>

                    {/* Rating */}
                    {product.rating && product.rating > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                            <div className="flex items-center">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={cn(
                                            "w-3 h-3",
                                            star <= Math.round(product.rating!)
                                                ? "text-[#f59e0b] fill-[#f59e0b]"
                                                : "text-[#e5e5e5]"
                                        )}
                                    />
                                ))}
                            </div>
                            {product.reviewCount !== undefined && (
                                <span className="text-[10px] text-[#999]">
                                    ({product.reviewCount})
                                </span>
                            )}
                        </div>
                    )}

                    {/* Stock Status */}
                    {stock.label && (
                        <div className="flex items-center gap-1 mt-1">
                            {product.stockStatus === 'out_of_stock' && (
                                <AlertCircle className="w-3 h-3 text-[#dc2626]" />
                            )}
                            <span className={cn("text-[10px] font-medium", stock.color)}>
                                {stock.label}
                            </span>
                        </div>
                    )}

                    {/* Colors */}
                    {product.colors && product.colors.length > 0 && (
                        <div className="flex items-center gap-1 mt-1.5">
                            <span className="text-[10px] text-[#999]">Colors:</span>
                            <div className="flex gap-1">
                                {product.colors.slice(0, 6).map((color, idx) => (
                                    <div
                                        key={idx}
                                        className="w-3.5 h-3.5 rounded-full border border-[#e5e5e5]"
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                                {product.colors.length > 6 && (
                                    <span className="text-[10px] text-[#999]">
                                        +{product.colors.length - 6}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="mt-2 flex items-center justify-between">
                {/* Embed Image Toggle */}
                {product.imageUrl && onToggleEmbed ? (
                    <button
                        type="button"
                        onClick={() => onToggleEmbed(!embedImage)}
                        className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all duration-150",
                            embedImage
                                ? "bg-[#111] text-white"
                                : "bg-white border border-[#e5e5e5] text-[#666] hover:text-[#111] hover:border-[#ccc]"
                        )}
                    >
                        <ImageIcon className="w-3 h-3" />
                        {embedImage ? 'Image attached' : 'Attach image'}
                    </button>
                ) : (
                    <div />
                )}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onChangeProduct}
                    className="h-7 px-2.5 text-[11px] font-medium text-[#666] hover:text-[#111] hover:bg-[#f0f0f0] rounded-lg gap-1"
                >
                    <RefreshCw className="w-3 h-3" />
                    Change
                </Button>
            </div>
        </div>
    );
}
