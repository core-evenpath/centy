'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, Globe, Check, Building2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    useTaxonomy,
    type TaxonomyIndustry,
    type ResolvedFunction,
    type SelectedBusinessCategory
} from '@/hooks/use-taxonomy';
import { getCountriesForDropdown, type CountryCode } from '@/lib/business-taxonomy';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
    Landmark: Building2,
    GraduationCap: Building2,
    Heart: Building2,
    Briefcase: Building2,
    ShoppingBag: Building2,
    UtensilsCrossed: Building2,
    ShoppingCart: Building2,
    Sparkles: Building2,
    Car: Building2,
    Plane: Building2,
    Building: Building2,
    PartyPopper: Building2,
    Wrench: Building2,
    MoreHorizontal: Building2,
};

interface BusinessCategoriesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (categories: SelectedBusinessCategory[], country: CountryCode) => void;
    initialSelections?: string[];
    initialCountry?: CountryCode;
}

export function BusinessCategoriesModal({
    isOpen,
    onClose,
    onSave,
    initialSelections = [],
    initialCountry = 'GLOBAL'
}: BusinessCategoriesModalProps) {
    const [selectedCountry, setSelectedCountry] = useState<CountryCode>(initialCountry);
    const [pendingSelections, setPendingSelections] = useState<string[]>(initialSelections);
    const [searchQuery, setSearchQuery] = useState('');

    const {
        industries,
        industryFunctions,
        searchResults,
        loading,
        selectedIndustryId,
        setSelectedIndustryId,
        search,
        clearSearch,
        convertToCategories
    } = useTaxonomy(selectedCountry);

    useEffect(() => {
        if (isOpen) {
            setPendingSelections(initialSelections);
            setSearchQuery('');
            clearSearch();
        }
    }, [isOpen, initialSelections]);

    useEffect(() => {
        const debounce = setTimeout(() => {
            if (searchQuery.trim()) {
                search(searchQuery);
            } else {
                clearSearch();
            }
        }, 300);
        return () => clearTimeout(debounce);
    }, [searchQuery, search, clearSearch]);

    const handleToggleFunction = (functionId: string) => {
        setPendingSelections(prev =>
            prev.includes(functionId)
                ? prev.filter(id => id !== functionId)
                : [...prev, functionId]
        );
    };

    const handleSave = async () => {
        const categories = await convertToCategories(pendingSelections);
        onSave(categories, selectedCountry);
        onClose();
    };

    const functionsToShow = searchQuery.trim() ? searchResults : industryFunctions;
    const countries = getCountriesForDropdown();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h3 className="font-bold text-lg text-slate-800">Select Business Categories</h3>
                            <p className="text-xs text-slate-500">
                                Choose categories that describe your business
                                {pendingSelections.length > 0 && (
                                    <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                                        {pendingSelections.length} selected
                                    </span>
                                )}
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full">
                            <X className="w-5 h-5 text-slate-500" />
                        </button>
                    </div>

                    {/* Country & Search */}
                    <div className="flex gap-3">
                        <div className="relative">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <select
                                value={selectedCountry}
                                onChange={(e) => setSelectedCountry(e.target.value as CountryCode)}
                                className="pl-10 pr-8 py-2 rounded-lg bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            >
                                {countries.map(c => (
                                    <option key={c.code} value={c.code}>
                                        {c.flag} {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search categories..."
                                className="w-full pl-10 pr-10 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                >
                                    <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-hidden flex">
                    {/* Industries List */}
                    <div className="w-1/3 border-r border-slate-100 overflow-y-auto bg-slate-50/50 p-2">
                        {loading && industries.length === 0 ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                            </div>
                        ) : (
                            industries.map(industry => {
                                const selectedCount = industryFunctions.filter(f =>
                                    f.industryId === industry.industryId &&
                                    pendingSelections.includes(f.functionId)
                                ).length;

                                const IconComponent = CATEGORY_ICONS[industry.iconName] || Building2;

                                return (
                                    <button
                                        key={industry.industryId}
                                        onClick={() => setSelectedIndustryId(industry.industryId)}
                                        className={cn(
                                            "w-full text-left px-3 py-3 rounded-xl text-sm font-medium transition-all mb-1.5 flex items-center justify-between",
                                            selectedIndustryId === industry.industryId
                                                ? "bg-indigo-600 text-white shadow-lg"
                                                : "text-slate-700 hover:bg-white hover:shadow-md"
                                        )}
                                    >
                                        <span className="flex items-center gap-3">
                                            <span className={cn(
                                                "w-8 h-8 rounded-lg flex items-center justify-center",
                                                selectedIndustryId === industry.industryId
                                                    ? "bg-white/20 text-white"
                                                    : "bg-indigo-100 text-indigo-700"
                                            )}>
                                                <IconComponent className="w-4 h-4" />
                                            </span>
                                            <span className="truncate">{industry.name}</span>
                                        </span>
                                        {selectedCount > 0 && (
                                            <span className={cn(
                                                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                                                selectedIndustryId === industry.industryId
                                                    ? "bg-white/20 text-white"
                                                    : "bg-indigo-100 text-indigo-700"
                                            )}>
                                                {selectedCount}
                                            </span>
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* Functions List */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                            </div>
                        ) : functionsToShow.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">
                                {searchQuery ? 'No results found' : 'Select an industry to see categories'}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {functionsToShow.map(func => {
                                    const isSelected = pendingSelections.includes(func.functionId);
                                    return (
                                        <button
                                            key={func.functionId}
                                            onClick={() => handleToggleFunction(func.functionId)}
                                            className={cn(
                                                "text-left p-3 rounded-xl border transition-all flex items-center gap-3",
                                                isSelected
                                                    ? "border-indigo-500 bg-indigo-50 shadow-md"
                                                    : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-5 h-5 rounded-md flex items-center justify-center border-2",
                                                isSelected
                                                    ? "bg-indigo-600 border-indigo-600"
                                                    : "border-slate-300"
                                            )}>
                                                {isSelected && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm text-slate-800 truncate">
                                                    {func.displayLabel}
                                                </div>
                                                {func.isLocalized && func.displayLabel !== func.name && (
                                                    <div className="text-xs text-slate-400 truncate">
                                                        {func.name}
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div className="text-sm text-slate-500">
                        {pendingSelections.length > 0 ? (
                            <span>{pendingSelections.length} categor{pendingSelections.length === 1 ? 'y' : 'ies'} selected</span>
                        ) : (
                            <span>Select at least one category</span>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={pendingSelections.length === 0}
                            className={cn(
                                "px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors",
                                pendingSelections.length > 0
                                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                            )}
                        >
                            <Check className="w-4 h-4" />
                            Apply Selection
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
