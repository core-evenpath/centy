import React, { useState, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Package, Check, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InlineProductData } from './InlineProductCard';

interface ProductPickerModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    products: InlineProductData[];
    currentProductId?: string;
    onSelect: (product: InlineProductData) => void;
}

function formatPrice(price: number | null, currency: string = 'INR'): string {
    if (price === null || price === undefined) return '';
    const symbols: Record<string, string> = { INR: '\u20B9', USD: '$', EUR: '\u20AC', GBP: '\u00A3' };
    const symbol = symbols[currency] || currency + ' ';
    return `${symbol}${price.toLocaleString()}`;
}

export default function ProductPickerModal({
    open,
    onOpenChange,
    products,
    currentProductId,
    onSelect,
}: ProductPickerModalProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredProducts = useMemo(() => {
        if (!searchQuery.trim()) return products;
        const query = searchQuery.toLowerCase();
        return products.filter(
            (p) =>
                p.name.toLowerCase().includes(query) ||
                p.category?.toLowerCase().includes(query) ||
                p.description?.toLowerCase().includes(query)
        );
    }, [products, searchQuery]);

    const handleSelect = (product: InlineProductData) => {
        onSelect(product);
        onOpenChange(false);
        setSearchQuery('');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[440px] p-0 gap-0 bg-[#fafafa] border-[#e5e5e5]">
                <DialogHeader className="p-4 pb-0">
                    <DialogTitle className="text-[15px] font-semibold text-[#111]">
                        Choose Product
                    </DialogTitle>
                    <DialogDescription className="text-[12px] text-[#999]">
                        Select a different product to include in the suggestion
                    </DialogDescription>
                </DialogHeader>

                {/* Search */}
                <div className="px-4 pt-3 pb-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search products..."
                            className="pl-9 h-10 text-[13px] bg-white border-[#e5e5e5] focus:border-[#111] focus:ring-0 rounded-lg placeholder:text-[#999]"
                        />
                    </div>
                </div>

                {/* Product List */}
                <ScrollArea className="max-h-[360px] px-4 pb-4">
                    <div className="space-y-1.5">
                        {filteredProducts.length === 0 ? (
                            <div className="flex flex-col items-center py-8 text-center">
                                <Package className="w-8 h-8 text-[#ddd] mb-2" />
                                <p className="text-[13px] text-[#999]">No products found</p>
                                <p className="text-[11px] text-[#ccc] mt-0.5">
                                    Try a different search term
                                </p>
                            </div>
                        ) : (
                            filteredProducts.map((product) => {
                                const isSelected = product.id === currentProductId;
                                return (
                                    <button
                                        key={product.id}
                                        onClick={() => handleSelect(product)}
                                        className={cn(
                                            "w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all duration-150 text-left",
                                            isSelected
                                                ? "bg-[#111] border-[#111]"
                                                : "bg-white border-[#e5e5e5] hover:border-[#ccc] hover:bg-[#f9f9f9]"
                                        )}
                                    >
                                        {/* Product Image */}
                                        <div className={cn(
                                            "w-11 h-11 rounded-lg overflow-hidden shrink-0 flex items-center justify-center",
                                            isSelected ? "bg-[#333]" : "bg-[#f5f5f5] border border-[#e5e5e5]"
                                        )}>
                                            {product.imageUrl ? (
                                                <img
                                                    src={product.imageUrl}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <Package className={cn(
                                                    "w-4 h-4",
                                                    isSelected ? "text-[#888]" : "text-[#ccc]"
                                                )} />
                                            )}
                                        </div>

                                        {/* Product Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className={cn(
                                                "text-[13px] font-medium leading-tight truncate",
                                                isSelected ? "text-white" : "text-[#111]"
                                            )}>
                                                {product.name}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                {product.price !== null && (
                                                    <span className={cn(
                                                        "text-[12px] font-semibold",
                                                        isSelected ? "text-white/80" : "text-[#111]"
                                                    )}>
                                                        {formatPrice(product.price, product.currency)}
                                                    </span>
                                                )}
                                                {product.category && (
                                                    <span className={cn(
                                                        "text-[10px]",
                                                        isSelected ? "text-white/50" : "text-[#999]"
                                                    )}>
                                                        {product.category}
                                                    </span>
                                                )}
                                            </div>
                                            {product.rating && product.rating > 0 && (
                                                <div className="flex items-center gap-0.5 mt-0.5">
                                                    <Star className={cn(
                                                        "w-2.5 h-2.5",
                                                        isSelected ? "text-[#f59e0b] fill-[#f59e0b]" : "text-[#f59e0b] fill-[#f59e0b]"
                                                    )} />
                                                    <span className={cn(
                                                        "text-[10px]",
                                                        isSelected ? "text-white/60" : "text-[#999]"
                                                    )}>
                                                        {product.rating.toFixed(1)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Selected Check */}
                                        {isSelected && (
                                            <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0">
                                                <Check className="w-3 h-3 text-[#111]" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
