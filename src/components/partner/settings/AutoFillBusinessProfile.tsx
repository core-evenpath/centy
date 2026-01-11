"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    Search,
    Sparkles,
    Loader2,
    MapPin,
    Building2,
    Phone,
    Mail,
    Globe,
    Clock,
    Star,
    MessageSquare,
    ThumbsUp,
    ThumbsDown,
    AlertTriangle,
    CheckCircle2,
    X,
    ChevronDown,
    ChevronUp,
    Zap,
    FileText,
    Users,
    DollarSign,
    Award,
    HelpCircle,
    ExternalLink,
    Import,
} from 'lucide-react';
import { searchBusinessAndResearchAction, type BusinessResearchResult, type ResearchDataItem } from '@/actions/business-autofill-actions';
import type { BusinessPersona } from '@/lib/business-persona-types';

interface AutoFillBusinessProfileProps {
    partnerId: string;
    onDataSelected: (selectedData: Partial<BusinessPersona>) => void;
    onClose: () => void;
}

interface CategoryGroup {
    id: string;
    title: string;
    icon: React.ReactNode;
    items: ResearchDataItem[];
}

export default function AutoFillBusinessProfile({
    partnerId,
    onDataSelected,
    onClose
}: AutoFillBusinessProfileProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<BusinessResearchResult | null>(null);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['identity', 'contact', 'services', 'reviews_positive']));
    const [error, setError] = useState<string | null>(null);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        setError(null);
        setSearchResults(null);

        try {
            const result = await searchBusinessAndResearchAction(partnerId, searchQuery);

            if (result.success && result.data) {
                setSearchResults(result.data);

                // Pre-select positive items (not negative feedback)
                const preSelected = new Set<string>();
                result.data.items.forEach(item => {
                    if (!item.isNegative) {
                        preSelected.add(item.id);
                    }
                });
                setSelectedItems(preSelected);
            } else {
                setError(result.message || 'No results found. Try a different search term.');
            }
        } catch (err: any) {
            setError(err.message || 'Search failed. Please try again.');
        } finally {
            setIsSearching(false);
        }
    };

    const toggleItem = (itemId: string) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) {
                newSet.delete(itemId);
            } else {
                newSet.add(itemId);
            }
            return newSet;
        });
    };

    const toggleCategory = (categoryId: string) => {
        setExpandedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(categoryId)) {
                newSet.delete(categoryId);
            } else {
                newSet.add(categoryId);
            }
            return newSet;
        });
    };

    const selectAllInCategory = (categoryItems: ResearchDataItem[]) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            categoryItems.forEach(item => newSet.add(item.id));
            return newSet;
        });
    };

    const deselectAllInCategory = (categoryItems: ResearchDataItem[]) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            categoryItems.forEach(item => newSet.delete(item.id));
            return newSet;
        });
    };

    const handleImport = () => {
        if (!searchResults) return;

        // Build persona update from selected items
        const selectedData = searchResults.items.filter(item => selectedItems.has(item.id));

        // Convert to BusinessPersona structure
        const personaUpdate: Partial<BusinessPersona> = {
            identity: {},
            personality: {},
            knowledge: {},
        };

        selectedData.forEach(item => {
            if (item.fieldPath) {
                // Set nested value using field path
                const keys = item.fieldPath.split('.');
                let current: any = personaUpdate;
                for (let i = 0; i < keys.length - 1; i++) {
                    if (!current[keys[i]]) {
                        current[keys[i]] = {};
                    }
                    current = current[keys[i]];
                }
                current[keys[keys.length - 1]] = item.value;
            }
        });

        onDataSelected(personaUpdate);
    };

    // Group items by category
    const groupedItems = React.useMemo(() => {
        if (!searchResults) return [];

        const groups: Record<string, CategoryGroup> = {
            identity: {
                id: 'identity',
                title: 'Business Identity',
                icon: <Building2 className="w-4 h-4" />,
                items: [],
            },
            contact: {
                id: 'contact',
                title: 'Contact & Location',
                icon: <MapPin className="w-4 h-4" />,
                items: [],
            },
            hours: {
                id: 'hours',
                title: 'Operating Hours',
                icon: <Clock className="w-4 h-4" />,
                items: [],
            },
            services: {
                id: 'services',
                title: 'Services & Products',
                icon: <FileText className="w-4 h-4" />,
                items: [],
            },
            pricing: {
                id: 'pricing',
                title: 'Pricing Information',
                icon: <DollarSign className="w-4 h-4" />,
                items: [],
            },
            reviews_positive: {
                id: 'reviews_positive',
                title: 'Positive Highlights',
                icon: <ThumbsUp className="w-4 h-4" />,
                items: [],
            },
            reviews_negative: {
                id: 'reviews_negative',
                title: 'Areas for Improvement',
                icon: <AlertTriangle className="w-4 h-4" />,
                items: [],
            },
            faqs: {
                id: 'faqs',
                title: 'Common Questions',
                icon: <HelpCircle className="w-4 h-4" />,
                items: [],
            },
            credentials: {
                id: 'credentials',
                title: 'Credentials & Awards',
                icon: <Award className="w-4 h-4" />,
                items: [],
            },
            social: {
                id: 'social',
                title: 'Social Media & Web',
                icon: <Globe className="w-4 h-4" />,
                items: [],
            },
        };

        searchResults.items.forEach(item => {
            const category = item.category || 'identity';
            if (groups[category]) {
                groups[category].items.push(item);
            } else {
                groups.identity.items.push(item);
            }
        });

        // Return only non-empty groups
        return Object.values(groups).filter(g => g.items.length > 0);
    }, [searchResults]);

    const selectedCount = selectedItems.size;
    const totalCount = searchResults?.items.length || 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="shrink-0 px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-indigo-600 to-purple-600">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Auto-Fill Business Profile</h2>
                                <p className="text-xs text-indigo-100">AI powered research to find and fill business information from the web</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="text-white/70 hover:text-white hover:bg-white/10"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                {/* Search Section */}
                <div className="shrink-0 px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="Search your business name or location..."
                                className="pl-10 h-11"
                                disabled={isSearching}
                            />
                        </div>
                        <Button
                            onClick={handleSearch}
                            disabled={isSearching || !searchQuery.trim()}
                            className="h-11 px-6 bg-indigo-600 hover:bg-indigo-700"
                        >
                            {isSearching ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Researching...
                                </>
                            ) : (
                                <>
                                    <Zap className="w-4 h-4 mr-2" />
                                    Search
                                </>
                            )}
                        </Button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                        Enter your business name, address, or location to find publicly available information
                    </p>
                </div>

                {/* Results Section */}
                <ScrollArea className="flex-1 p-6">
                    {/* Loading State */}
                    {isSearching && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                            </div>
                            <h3 className="font-semibold text-slate-900 mb-2">Researching your business...</h3>
                            <p className="text-sm text-slate-500 max-w-md">
                                AI is searching the web for your business information. This may take a few moments.
                            </p>
                        </div>
                    )}

                    {/* Error State */}
                    {error && !isSearching && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                                <AlertTriangle className="w-8 h-8 text-red-600" />
                            </div>
                            <h3 className="font-semibold text-slate-900 mb-2">Search Failed</h3>
                            <p className="text-sm text-slate-500 max-w-md">{error}</p>
                            <Button
                                variant="outline"
                                onClick={() => setError(null)}
                                className="mt-4"
                            >
                                Try Again
                            </Button>
                        </div>
                    )}

                    {/* Empty State */}
                    {!searchResults && !isSearching && !error && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                                <Search className="w-8 h-8 text-slate-400" />
                            </div>
                            <h3 className="font-semibold text-slate-900 mb-2">Search for your business</h3>
                            <p className="text-sm text-slate-500 max-w-md">
                                Enter your business name or location above to automatically find and fill your profile with publicly available information.
                            </p>
                        </div>
                    )}

                    {/* Results */}
                    {searchResults && !isSearching && (
                        <div className="space-y-4">
                            {/* Business Summary Header */}
                            {searchResults.businessName && (
                                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                                    <div className="flex items-start gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                                            {searchResults.businessName.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-slate-900 text-lg">{searchResults.businessName}</h3>
                                            {searchResults.summary && (
                                                <p className="text-sm text-slate-600 mt-1 line-clamp-2">{searchResults.summary}</p>
                                            )}
                                            {searchResults.rating && (
                                                <div className="flex items-center gap-2 mt-2">
                                                    <div className="flex items-center gap-1">
                                                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                        <span className="font-semibold text-sm">{searchResults.rating}</span>
                                                    </div>
                                                    {searchResults.reviewCount && (
                                                        <span className="text-xs text-slate-500">
                                                            ({searchResults.reviewCount} reviews)
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Selection Summary */}
                            <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg">
                                <span className="text-sm text-slate-600">
                                    <strong>{selectedCount}</strong> of {totalCount} items selected
                                </span>
                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedItems(new Set(searchResults.items.filter(i => !i.isNegative).map(i => i.id)))}
                                        className="text-xs"
                                    >
                                        Select Positive
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedItems(new Set(searchResults.items.map(i => i.id)))}
                                        className="text-xs"
                                    >
                                        Select All
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedItems(new Set())}
                                        className="text-xs"
                                    >
                                        Clear All
                                    </Button>
                                </div>
                            </div>

                            {/* Grouped Items */}
                            <div className="space-y-3">
                                {groupedItems.map((group) => {
                                    const isExpanded = expandedCategories.has(group.id);
                                    const selectedInGroup = group.items.filter(item => selectedItems.has(item.id)).length;
                                    const isNegativeGroup = group.id === 'reviews_negative';

                                    return (
                                        <div
                                            key={group.id}
                                            className={cn(
                                                "border rounded-xl overflow-hidden transition-all",
                                                isNegativeGroup ? "border-amber-200 bg-amber-50/50" : "border-slate-200 bg-white"
                                            )}
                                        >
                                            {/* Category Header */}
                                            <button
                                                onClick={() => toggleCategory(group.id)}
                                                className={cn(
                                                    "w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-slate-50 transition-colors",
                                                    isNegativeGroup && "hover:bg-amber-100/50"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center",
                                                    isNegativeGroup ? "bg-amber-100 text-amber-600" : "bg-indigo-100 text-indigo-600"
                                                )}>
                                                    {group.icon}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-slate-900">{group.title}</span>
                                                        <Badge variant="secondary" className="text-xs">
                                                            {selectedInGroup}/{group.items.length}
                                                        </Badge>
                                                        {isNegativeGroup && (
                                                            <Badge variant="outline" className="text-xs text-amber-700 border-amber-300 bg-amber-100">
                                                                Review before including
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                {isExpanded ? (
                                                    <ChevronUp className="w-4 h-4 text-slate-400" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4 text-slate-400" />
                                                )}
                                            </button>

                                            {/* Category Items */}
                                            {isExpanded && (
                                                <div className="px-4 pb-4 space-y-2">
                                                    {/* Category Actions */}
                                                    <div className="flex gap-2 mb-2">
                                                        <button
                                                            onClick={() => selectAllInCategory(group.items)}
                                                            className="text-xs text-indigo-600 hover:underline"
                                                        >
                                                            Select all in category
                                                        </button>
                                                        <span className="text-slate-300">|</span>
                                                        <button
                                                            onClick={() => deselectAllInCategory(group.items)}
                                                            className="text-xs text-slate-500 hover:underline"
                                                        >
                                                            Deselect all
                                                        </button>
                                                    </div>

                                                    {/* Items */}
                                                    {group.items.map((item) => (
                                                        <label
                                                            key={item.id}
                                                            className={cn(
                                                                "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                                                                selectedItems.has(item.id)
                                                                    ? item.isNegative
                                                                        ? "bg-amber-100 border border-amber-300"
                                                                        : "bg-indigo-50 border border-indigo-200"
                                                                    : "bg-slate-50 border border-transparent hover:bg-slate-100"
                                                            )}
                                                        >
                                                            <Checkbox
                                                                checked={selectedItems.has(item.id)}
                                                                onCheckedChange={() => toggleItem(item.id)}
                                                                className="mt-0.5"
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-medium text-sm text-slate-900">
                                                                        {item.label}
                                                                    </span>
                                                                    {item.isNegative && (
                                                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                                                    )}
                                                                    {item.confidence && item.confidence >= 0.9 && (
                                                                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-slate-600 mt-0.5">
                                                                    {typeof item.value === 'string' ? item.value : JSON.stringify(item.value)}
                                                                </p>
                                                                {item.source && (
                                                                    <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                                                        <ExternalLink className="w-3 h-3" />
                                                                        {item.source}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Warning for negative items */}
                            {selectedItems.size > 0 && searchResults.items.some(item => item.isNegative && selectedItems.has(item.id)) && (
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-amber-900 text-sm">Negative feedback selected</p>
                                        <p className="text-xs text-amber-700 mt-1">
                                            You have selected items marked as negative feedback. These may not represent your business positively. Review carefully before importing.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </ScrollArea>

                {/* Footer */}
                {searchResults && (
                    <div className="shrink-0 px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                        <div className="text-sm text-slate-600">
                            {selectedCount > 0 ? (
                                <span>
                                    Ready to import <strong>{selectedCount}</strong> item{selectedCount !== 1 ? 's' : ''} to your profile
                                </span>
                            ) : (
                                <span className="text-slate-400">Select items to import</span>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleImport}
                                disabled={selectedCount === 0}
                                className="bg-indigo-600 hover:bg-indigo-700"
                            >
                                <Import className="w-4 h-4 mr-2" />
                                Import Selected
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
