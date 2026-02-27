import React, { useState, useMemo, useCallback } from 'react';
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
import { Search, Package, Check, Star, Plus, X, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InlineProductData } from './InlineProductCard';

interface ProductPickerModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    products: InlineProductData[];
    /** IDs of products already added */
    alreadySelectedIds?: string[];
    /** Single-select mode: pick one product to swap */
    onSelect?: (product: InlineProductData) => void;
    /** Multi-select mode: add multiple products */
    onAddProducts?: (products: InlineProductData[]) => void;
    /** Current product ID (for swap mode highlight) */
    currentProductId?: string;
    /** Title override */
    title?: string;
    /** Description override */
    description?: string;
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
    alreadySelectedIds = [],
    onSelect,
    onAddProducts,
    currentProductId,
    title,
    description,
}: ProductPickerModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const isMultiSelect = !!onAddProducts;

    const filteredProducts = useMemo(() => {
        const available = isMultiSelect
            ? products.filter(p => !alreadySelectedIds.includes(p.id))
            : products;

        if (!searchQuery.trim()) return available;
        const query = searchQuery.toLowerCase();
        return available.filter(
            (p) =>
                p.name.toLowerCase().includes(query) ||
                p.category?.toLowerCase().includes(query) ||
                p.description?.toLowerCase().includes(query)
        );
    }, [products, searchQuery, alreadySelectedIds, isMultiSelect]);

    const toggleSelect = useCallback((productId: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(productId)) {
                next.delete(productId);
            } else {
                next.add(productId);
            }
            return next;
        });
    }, []);

    const handleSingleSelect = (product: InlineProductData) => {
        if (onSelect) {
            onSelect(product);
            onOpenChange(false);
            setSearchQuery('');
        }
    };

    const handleAddSelected = () => {
        if (onAddProducts && selectedIds.size > 0) {
            const selected = products.filter(p => selectedIds.has(p.id));
            onAddProducts(selected);
            onOpenChange(false);
            setSearchQuery('');
            setSelectedIds(new Set());
        }
    };

    const handleClose = (isOpen: boolean) => {
        if (!isOpen) {
            setSearchQuery('');
            setSelectedIds(new Set());
        }
        onOpenChange(isOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[480px] p-0 gap-0 bg-white border-[#e5e5e5] rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="px-5 pt-5 pb-0">
                    <DialogHeader className="space-y-1">
                        <DialogTitle className="text-[16px] font-semibold text-[#111] flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-[#111] flex items-center justify-center">
                                <ShoppingBag className="w-4 h-4 text-white" />
                            </div>
                            {title || (isMultiSelect ? 'Add Products' : 'Swap Product')}
                        </DialogTitle>
                        <DialogDescription className="text-[12px] text-[#888] pl-10">
                            {description || (isMultiSelect
                                ? 'Select products to include with your message'
                                : 'Choose a different product'
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Search */}
                    <div className="relative mt-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name, category..."
                            className="pl-9 h-10 text-[13px] bg-[#f8f8f8] border-[#eee] focus:border-[#111] focus:ring-0 rounded-xl placeholder:text-[#bbb]"
                        />
                    </div>
                </div>

                {/* Product Grid */}
                <ScrollArea className="max-h-[400px] px-5 pt-3 pb-2">
                    {filteredProducts.length === 0 ? (
                        <div className="flex flex-col items-center py-12 text-center">
                            <div className="w-12 h-12 rounded-full bg-[#f5f5f5] flex items-center justify-center mb-3">
                                <Package className="w-5 h-5 text-[#ccc]" />
                            </div>
                            <p className="text-[13px] font-medium text-[#888]">
                                {isMultiSelect && alreadySelectedIds.length > 0
                                    ? 'All products already added'
                                    : 'No products found'
                                }
                            </p>
                            <p className="text-[11px] text-[#bbb] mt-1">
                                {searchQuery ? 'Try a different search' : 'Add products to your catalog first'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-2.5 pb-2">
                            {filteredProducts.map((product) => {
                                const isSelected = isMultiSelect
                                    ? selectedIds.has(product.id)
                                    : product.id === currentProductId;
                                const heroImage = product.imageUrl || product.images?.[0];

                                return (
                                    <button
                                        key={product.id}
                                        onClick={() => isMultiSelect ? toggleSelect(product.id) : handleSingleSelect(product)}
                                        className={cn(
                                            "group relative text-left rounded-xl border overflow-hidden transition-all duration-150",
                                            isSelected
                                                ? "border-[#111] ring-1 ring-[#111]"
                                                : "border-[#eee] hover:border-[#ccc]"
                                        )}
                                    >
                                        {/* Selection indicator */}
                                        {isMultiSelect && (
                                            <div className={cn(
                                                "absolute top-2 right-2 z-10 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-150",
                                                isSelected
                                                    ? "bg-[#111]"
                                                    : "bg-white/80 backdrop-blur-sm border border-[#ddd]"
                                            )}>
                                                {isSelected && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                        )}

                                        {/* Product Image */}
                                        <div className="w-full h-[110px] bg-[#f5f5f5] overflow-hidden">
                                            {heroImage ? (
                                                <img
                                                    src={heroImage}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Package className="w-6 h-6 text-[#ddd]" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Product Info */}
                                        <div className="p-2.5">
                                            <p className="text-[12px] font-medium text-[#111] leading-tight line-clamp-2">
                                                {product.name}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                {product.price !== null && (
                                                    <span className="text-[13px] font-bold text-[#111]">
                                                        {formatPrice(product.price, product.currency)}
                                                    </span>
                                                )}
                                            </div>
                                            {product.rating && product.rating > 0 && (
                                                <div className="flex items-center gap-0.5 mt-1">
                                                    <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                                                    <span className="text-[10px] text-[#888]">
                                                        {product.rating.toFixed(1)}
                                                    </span>
                                                </div>
                                            )}
                                            {product.category && (
                                                <span className="text-[10px] text-[#aaa] mt-0.5 block truncate">
                                                    {product.category}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>

                {/* Footer - multi-select add button */}
                {isMultiSelect && (
                    <div className="px-5 py-4 border-t border-[#f0f0f0] bg-[#fafafa]">
                        <Button
                            onClick={handleAddSelected}
                            disabled={selectedIds.size === 0}
                            className={cn(
                                "w-full h-11 rounded-xl text-[14px] font-semibold transition-all duration-200",
                                selectedIds.size > 0
                                    ? "bg-[#111] hover:bg-[#000] text-white"
                                    : "bg-[#e5e5e5] text-[#999] cursor-not-allowed"
                            )}
                        >
                            {selectedIds.size > 0 ? (
                                <>
                                    <Plus className="w-4 h-4 mr-1.5" />
                                    Add {selectedIds.size} Product{selectedIds.size !== 1 ? 's' : ''}
                                </>
                            ) : (
                                'Select products to add'
                            )}
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
