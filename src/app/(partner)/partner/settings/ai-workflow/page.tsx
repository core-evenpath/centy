'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Package, UtensilsCrossed, Briefcase, Building, Zap, Link2,
    ChevronDown, Plus, Edit3, Trash2, Check, X, Settings,
    RefreshCw, AlertCircle, CheckCircle, Clock, LucideIcon, ExternalLink,
    Sparkles, Search, ToggleLeft, ToggleRight, Database, Bot,
    Loader2, ChevronRight, Grid3X3, List, Filter, Download,
    ArrowRight, Brain, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getIndustries, getFunctionsByIndustry, type Industry, type BusinessFunction } from '@/lib/business-taxonomy';
import { generateModulesFromCategories, type ModulesConfig, type GeneratedModule, type GeneratedField } from '@/actions/module-generator-actions';

// Icon mapping
const INDUSTRY_ICONS: Record<string, string> = {
    'financial_services': '🏦',
    'education_learning': '📚',
    'healthcare_medical': '🏥',
    'business_professional': '💼',
    'retail_commerce': '🛒',
    'food_beverage': '🍕',
    'food_supply': '🥬',
    'personal_wellness': '✨',
    'automotive_mobility': '🚗',
    'travel_transport': '✈️',
    'hospitality': '🏨',
    'events_entertainment': '🎉',
    'home_property': '🔧',
    'public_nonprofit': '🏛️',
};

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    'inventory': { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
    'integration': { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    'ai_tool': { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
};

// ===== COMPONENTS =====

function FieldBadge({ field }: { field: GeneratedField }) {
    const typeColors: Record<string, string> = {
        text: 'bg-slate-100 text-slate-600',
        number: 'bg-blue-100 text-blue-600',
        select: 'bg-purple-100 text-purple-600',
        toggle: 'bg-green-100 text-green-600',
        tags: 'bg-orange-100 text-orange-600',
        textarea: 'bg-slate-100 text-slate-600',
        image: 'bg-pink-100 text-pink-600',
    };

    return (
        <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium", typeColors[field.type] || 'bg-gray-100')}>
            {field.name}
            <span className="opacity-60 text-[10px]">{field.type}</span>
            {field.isRequired && <span className="text-red-500">*</span>}
        </span>
    );
}

function ModuleCard({ module, isExpanded, onToggle }: { module: GeneratedModule; isExpanded: boolean; onToggle: () => void }) {
    const colors = TYPE_COLORS[module.type] || TYPE_COLORS.inventory;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <button
                onClick={onToggle}
                className="w-full flex items-center gap-4 p-5 text-left hover:bg-slate-50 transition-colors"
            >
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", colors.bg, colors.text)}>
                    {module.type === 'inventory' ? <Package className="w-6 h-6" /> :
                        module.type === 'integration' ? <Link2 className="w-6 h-6" /> :
                            <Sparkles className="w-6 h-6" />}
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900">{module.name}</h3>
                        {module.inventoryConfig?.fields && (
                            <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                                {module.inventoryConfig.fields.length} fields
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-slate-500">{module.description}</p>
                </div>
                <ChevronRight className={cn("w-5 h-5 text-slate-400 transition-transform", isExpanded && "rotate-90")} />
            </button>

            {isExpanded && (
                <div className="border-t border-slate-100 p-5 bg-slate-50 space-y-4">
                    {module.type === 'inventory' && module.inventoryConfig && (
                        <>
                            {/* Fields */}
                            <div>
                                <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">
                                    {module.inventoryConfig.itemLabel} Fields
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {module.inventoryConfig.fields.map(field => (
                                        <FieldBadge key={field.id} field={field} />
                                    ))}
                                </div>
                            </div>

                            {/* Categories */}
                            <div>
                                <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Categories</h4>
                                <div className="flex flex-wrap gap-2">
                                    {module.inventoryConfig.categories.map(cat => (
                                        <span key={cat.id} className="px-3 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg text-sm">
                                            {cat.name}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Sample Items */}
                            <div>
                                <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">
                                    Sample {module.inventoryConfig.itemLabelPlural}
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {module.inventoryConfig.suggestedItems.map((item, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm text-slate-800">{item.name}</div>
                                                <div className="text-xs text-slate-500">{item.category}</div>
                                            </div>
                                            <div className="font-semibold text-emerald-600">₹{item.suggestedPrice}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {module.type === 'integration' && module.integrationConfig && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {module.integrationConfig.platforms.map((platform, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <Link2 className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm text-slate-800">{platform.name}</div>
                                        <div className="text-xs text-slate-500 capitalize">{platform.category}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {module.type === 'ai_tool' && module.aiToolConfig && (
                        <div className="space-y-2">
                            {module.aiToolConfig.tools.map((tool, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
                                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <Bot className="w-5 h-5 text-purple-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm text-slate-800">{tool.name}</div>
                                        <div className="text-xs text-slate-500">{tool.useCase}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ===== MAIN PAGE =====
export default function SmartModulesDemo() {
    const router = useRouter();
    const [industries] = useState<Industry[]>(getIndustries());
    const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);
    const [functions, setFunctions] = useState<BusinessFunction[]>([]);
    const [selectedFunction, setSelectedFunction] = useState<BusinessFunction | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [modulesConfig, setModulesConfig] = useState<ModulesConfig | null>(null);
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(['inventory']));
    const [error, setError] = useState<string | null>(null);

    // Load functions when industry changes
    useEffect(() => {
        if (selectedIndustry) {
            const funcs = getFunctionsByIndustry(selectedIndustry.industryId);
            setFunctions(funcs);
            setSelectedFunction(null);
            setModulesConfig(null);
        }
    }, [selectedIndustry]);

    const handleGenerate = async () => {
        if (!selectedIndustry || !selectedFunction) return;

        setIsGenerating(true);
        setError(null);

        try {
            const result = await generateModulesFromCategories(
                [{
                    industryId: selectedIndustry.industryId,
                    functionId: selectedFunction.functionId,
                    label: selectedFunction.name,
                    googlePlacesTypes: selectedFunction.googlePlacesTypes,
                }],
                'IN'
            );

            if (result.success && result.config) {
                setModulesConfig(result.config);
                setExpandedModules(new Set(['inventory']));
            } else {
                setError(result.error || 'Failed to generate modules');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsGenerating(false);
        }
    };

    const toggleModule = (id: string) => {
        setExpandedModules(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100">
            <div className="max-w-6xl mx-auto py-8 px-4">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-full text-sm font-medium mb-4">
                        <Brain className="w-4 h-4" />
                        Smart Module Generator Demo
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">AI-Generated Business Modules</h1>
                    <p className="text-slate-600 max-w-2xl mx-auto">
                        Select an industry and business type to see how AI generates custom inventory fields,
                        categories, sample items, integrations, and AI tools.
                    </p>
                </div>

                {/* Info Banner */}
                <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                        <p className="text-sm text-blue-800">
                            <strong>How this works in production:</strong> When you save your business categories in
                            <Link href="/partner/settings" className="underline mx-1 font-medium">Business Profile</Link>,
                            modules are automatically generated in the background and appear in the Modules tab.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Industry & Function Selection */}
                    <div className="lg:col-span-1 space-y-4">
                        {/* Industry Selection */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-4">
                            <h3 className="font-semibold text-slate-900 mb-3">1. Select Industry</h3>
                            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                                {industries.map(industry => (
                                    <button
                                        key={industry.industryId}
                                        onClick={() => setSelectedIndustry(industry)}
                                        className={cn(
                                            "flex items-center gap-2 p-2 rounded-lg text-left text-sm transition-colors",
                                            selectedIndustry?.industryId === industry.industryId
                                                ? "bg-indigo-100 border-indigo-300 border"
                                                : "bg-slate-50 hover:bg-slate-100"
                                        )}
                                    >
                                        <span className="text-lg">{INDUSTRY_ICONS[industry.industryId] || '📦'}</span>
                                        <span className="font-medium text-slate-700 text-xs">{industry.name.replace(' & ', '\n& ')}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Business Function Selection */}
                        {functions.length > 0 && (
                            <div className="bg-white rounded-2xl border border-slate-200 p-4">
                                <h3 className="font-semibold text-slate-900 mb-3">2. Select Business Type</h3>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {functions.map(func => (
                                        <button
                                            key={func.functionId}
                                            onClick={() => setSelectedFunction(func)}
                                            className={cn(
                                                "w-full flex items-center gap-2 p-3 rounded-lg text-left transition-colors",
                                                selectedFunction?.functionId === func.functionId
                                                    ? "bg-indigo-100 border-indigo-300 border"
                                                    : "bg-slate-50 hover:bg-slate-100"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-4 h-4 rounded-full border-2",
                                                selectedFunction?.functionId === func.functionId
                                                    ? "bg-indigo-600 border-indigo-600"
                                                    : "border-slate-300"
                                            )}>
                                                {selectedFunction?.functionId === func.functionId && (
                                                    <Check className="w-3 h-3 text-white" />
                                                )}
                                            </div>
                                            <span className="font-medium text-sm text-slate-700">{func.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Generate Button */}
                        <button
                            onClick={handleGenerate}
                            disabled={!selectedFunction || isGenerating}
                            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-medium hover:opacity-90 disabled:opacity-50 transition-all"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Generating with AI...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    Generate Modules
                                </>
                            )}
                        </button>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Right: Generated Modules */}
                    <div className="lg:col-span-2">
                        {!modulesConfig ? (
                            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                                <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Package className="w-10 h-10 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">No Modules Generated Yet</h3>
                                <p className="text-slate-500 text-sm">
                                    Select an industry and business type, then click "Generate Modules" to see
                                    AI-generated configurations.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Selection Summary */}
                                <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-2xl">
                                        {INDUSTRY_ICONS[selectedIndustry?.industryId || ''] || '📦'}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-bold text-slate-900">{selectedFunction?.name}</div>
                                        <div className="text-sm text-slate-500">{selectedIndustry?.name}</div>
                                    </div>
                                    <div className="flex items-center gap-2 text-emerald-600">
                                        <CheckCircle className="w-5 h-5" />
                                        <span className="text-sm font-medium">AI Generated</span>
                                    </div>
                                </div>

                                {/* Modules */}
                                {modulesConfig.modules.map(module => (
                                    <ModuleCard
                                        key={module.id}
                                        module={module}
                                        isExpanded={expandedModules.has(module.id.split('_')[0])}
                                        onToggle={() => toggleModule(module.id.split('_')[0])}
                                    />
                                ))}

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleGenerate}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 rounded-xl font-medium text-slate-600 hover:bg-slate-50"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        Regenerate
                                    </button>
                                    <Link
                                        href="/partner/settings"
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700"
                                    >
                                        Go to Settings
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
