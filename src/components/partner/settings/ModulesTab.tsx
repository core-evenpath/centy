'use client';

import React, { useState, useMemo } from 'react';
import {
    Package, UtensilsCrossed, Briefcase, Building, Zap, Link2,
    ChevronDown, Plus, Edit3, Trash2, Check, X, Settings,
    RefreshCw, AlertCircle, CheckCircle, Clock, LucideIcon, ExternalLink,
    Sparkles, Search, ToggleLeft, ToggleRight, Database, Bot,
    Loader2, ChevronRight, Grid3X3, List, Filter, Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BusinessPersona } from '@/lib/business-persona-types';
import { type ModulesConfig, type GeneratedModule, type GeneratedField, generateMoreInventoryItems } from '@/actions/module-generator-actions';

const TYPE_ICONS: Record<string, LucideIcon> = {
    'inventory': Package,
    'integration': Link2,
    'ai_tool': Sparkles,
};

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    'inventory': { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
    'integration': { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    'ai_tool': { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
};

interface ModulesTabProps {
    persona: Partial<BusinessPersona>;
    modulesConfig: ModulesConfig | null;
    onUpdate: (path: string, value: any) => Promise<void>;
    onRegenerateModules?: () => Promise<void>;
    isRegenerating?: boolean;
}

// ===== FIELD RENDERER =====
function FieldRenderer({ field }: { field: GeneratedField }) {
    const typeColors: Record<string, string> = {
        text: 'bg-slate-100 text-slate-600',
        number: 'bg-blue-100 text-blue-600',
        select: 'bg-purple-100 text-purple-600',
        toggle: 'bg-green-100 text-green-600',
        tags: 'bg-orange-100 text-orange-600',
        textarea: 'bg-slate-100 text-slate-600',
        image: 'bg-pink-100 text-pink-600',
        date: 'bg-indigo-100 text-indigo-600',
        time: 'bg-indigo-100 text-indigo-600',
    };

    return (
        <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-100">
            <span className="font-medium text-slate-700 text-sm">{field.name}</span>
            <span className={cn("text-xs px-1.5 py-0.5 rounded font-medium", typeColors[field.type] || 'bg-gray-100 text-gray-600')}>
                {field.type}
            </span>
            {field.isRequired && <span className="text-xs text-red-500">*</span>}
        </div>
    );
}

// ===== INVENTORY ITEM CARD =====
function InventoryItemCard({ item, onEdit, onDelete }: { item: any; onEdit?: () => void; onDelete?: () => void }) {
    return (
        <div className="group flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all">
            <div className="w-14 h-14 bg-gradient-to-br from-slate-100 to-slate-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Package className="w-6 h-6 text-slate-300" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{item.name}</span>
                    <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded">{item.category}</span>
                </div>
                <p className="text-sm text-slate-500 truncate">{item.description}</p>
            </div>
            <div className="text-right">
                <div className="font-bold text-emerald-600">₹{item.suggestedPrice?.toLocaleString()}</div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={onEdit} className="p-2 hover:bg-slate-100 rounded-lg">
                    <Edit3 className="w-4 h-4 text-slate-500" />
                </button>
                <button onClick={onDelete} className="p-2 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4 text-red-500" />
                </button>
            </div>
        </div>
    );
}

// ===== INTEGRATION CARD =====
function IntegrationCard({ platform }: { platform: any }) {
    const [connected, setConnected] = useState(false);

    const categoryColors: Record<string, string> = {
        delivery: 'bg-orange-100 text-orange-600',
        pos: 'bg-blue-100 text-blue-600',
        booking: 'bg-green-100 text-green-600',
        payment: 'bg-purple-100 text-purple-600',
        marketing: 'bg-pink-100 text-pink-600',
    };

    return (
        <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                <Link2 className="w-5 h-5 text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{platform.name}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded capitalize", categoryColors[platform.category] || 'bg-slate-100')}>
                        {platform.category}
                    </span>
                </div>
                <p className="text-sm text-slate-500">{platform.description}</p>
            </div>
            <button
                onClick={() => setConnected(!connected)}
                className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                    connected
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        : "bg-indigo-600 text-white hover:bg-indigo-700"
                )}
            >
                {connected ? (
                    <>
                        <CheckCircle className="w-4 h-4" />
                        Connected
                    </>
                ) : (
                    <>
                        <ExternalLink className="w-4 h-4" />
                        Connect
                    </>
                )}
            </button>
        </div>
    );
}

// ===== AI TOOL CARD =====
function AIToolCard({ tool }: { tool: any }) {
    const [enabled, setEnabled] = useState(false);

    return (
        <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl flex items-center justify-center">
                <Bot className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-800">{tool.name}</div>
                <p className="text-sm text-slate-500">{tool.description}</p>
                <p className="text-xs text-indigo-500 mt-1">{tool.useCase}</p>
            </div>
            <button
                onClick={() => setEnabled(!enabled)}
                className={cn("p-1 rounded-lg transition-colors", enabled ? "text-indigo-600" : "text-slate-300")}
            >
                {enabled ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
            </button>
        </div>
    );
}

// ===== MODULE SECTION =====
function ModuleSection({
    module,
    defaultOpen = false,
    onAddItem,
    isGeneratingItems
}: {
    module: GeneratedModule;
    defaultOpen?: boolean;
    onAddItem?: () => void;
    isGeneratingItems?: boolean;
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const Icon = TYPE_ICONS[module.type] || Package;
    const colors = TYPE_COLORS[module.type] || TYPE_COLORS.inventory;

    const itemCount = module.type === 'inventory'
        ? module.inventoryConfig?.suggestedItems.length
        : module.type === 'integration'
            ? module.integrationConfig?.platforms.length
            : module.aiToolConfig?.tools.length;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Header */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-4 p-5 text-left hover:bg-slate-50 transition-colors"
            >
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", colors.bg, colors.text)}>
                    <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900">{module.name}</h3>
                        {itemCount !== undefined && (
                            <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                                {itemCount} items
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-slate-500">{module.description}</p>
                </div>
                <ChevronRight className={cn("w-5 h-5 text-slate-400 transition-transform", isOpen && "rotate-90")} />
            </button>

            {/* Content */}
            {isOpen && (
                <div className="border-t border-slate-100">
                    {/* Inventory Module */}
                    {module.type === 'inventory' && module.inventoryConfig && (
                        <div className="p-5 space-y-6">
                            {/* Fields */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-xs font-semibold text-slate-500 uppercase">
                                        {module.inventoryConfig.itemLabel} Fields ({module.inventoryConfig.fields.length})
                                    </h4>
                                    <button className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1">
                                        <Settings className="w-3 h-3" /> Customize
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                    {module.inventoryConfig.fields.map(field => (
                                        <FieldRenderer key={field.id} field={field} />
                                    ))}
                                </div>
                            </div>

                            {/* Categories */}
                            <div>
                                <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3">
                                    Categories ({module.inventoryConfig.categories.length})
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {module.inventoryConfig.categories.map(cat => (
                                        <span key={cat.id} className="px-3 py-1.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg text-sm font-medium">
                                            {cat.name}
                                        </span>
                                    ))}
                                    <button className="px-3 py-1.5 border-2 border-dashed border-slate-200 text-slate-500 rounded-lg text-sm hover:border-indigo-300 hover:text-indigo-600">
                                        + Add
                                    </button>
                                </div>
                            </div>

                            {/* Items */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-xs font-semibold text-slate-500 uppercase">
                                        {module.inventoryConfig.itemLabelPlural} ({module.inventoryConfig.suggestedItems.length})
                                    </h4>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={onAddItem}
                                            disabled={isGeneratingItems}
                                            className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1 disabled:opacity-50"
                                        >
                                            {isGeneratingItems ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                            Generate More
                                        </button>
                                        <button className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1">
                                            <Plus className="w-3 h-3" /> Add Item
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {module.inventoryConfig.suggestedItems.map((item, i) => (
                                        <InventoryItemCard key={i} item={item} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Integration Module */}
                    {module.type === 'integration' && module.integrationConfig && (
                        <div className="p-5 space-y-3">
                            {module.integrationConfig.platforms.map((platform, i) => (
                                <IntegrationCard key={i} platform={platform} />
                            ))}
                        </div>
                    )}

                    {/* AI Tool Module */}
                    {module.type === 'ai_tool' && module.aiToolConfig && (
                        <div className="p-5 space-y-3">
                            {module.aiToolConfig.tools.map((tool, i) => (
                                <AIToolCard key={i} tool={tool} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ===== MAIN COMPONENT =====
export default function ModulesTab({
    persona,
    modulesConfig,
    onUpdate,
    onRegenerateModules,
    isRegenerating
}: ModulesTabProps) {
    const [isGeneratingItems, setIsGeneratingItems] = useState(false);

    const hasCategories = useMemo(() => {
        const cats = (persona.identity as any)?.businessCategories;
        return Array.isArray(cats) && cats.length > 0;
    }, [persona]);

    const handleGenerateMoreItems = async (module: GeneratedModule) => {
        if (!module.inventoryConfig) return;

        setIsGeneratingItems(true);
        try {
            const result = await generateMoreInventoryItems(
                module.sourceIndustry,
                module.sourceFunction,
                module.inventoryConfig.categories.map(c => c.name),
                module.inventoryConfig.suggestedItems.map(i => i.name),
                4
            );

            if (result.success && result.items) {
                // Add new items to the module (would need to be persisted)
                console.log('Generated new items:', result.items);
            }
        } finally {
            setIsGeneratingItems(false);
        }
    };

    // No categories selected
    if (!hasCategories) {
        return (
            <div className="min-h-[50vh] flex items-center justify-center">
                <div className="text-center max-w-md p-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Database className="w-10 h-10 text-indigo-500" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">No Modules Yet</h2>
                    <p className="text-slate-500 mb-6">
                        Select your business categories in the <strong>Business Profile</strong> tab to auto-generate industry-specific modules.
                    </p>
                    <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                        <p className="text-sm text-indigo-700">
                            💡 Modules are automatically generated when you save your business categories
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Categories selected but no modules generated yet
    if (!modulesConfig || !modulesConfig.modules || modulesConfig.modules.length === 0) {
        return (
            <div className="min-h-[50vh] flex items-center justify-center">
                <div className="text-center max-w-md p-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Sparkles className="w-10 h-10 text-amber-500" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Generating Modules...</h2>
                    <p className="text-slate-500 mb-6">
                        AI is creating custom modules based on your selected business categories.
                    </p>
                    {isRegenerating ? (
                        <div className="flex items-center justify-center gap-2 text-indigo-600">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="font-medium">Please wait...</span>
                        </div>
                    ) : (
                        <button
                            onClick={onRegenerateModules}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 flex items-center gap-2 mx-auto"
                        >
                            <Sparkles className="w-5 h-5" />
                            Generate Now
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Display generated modules
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Your Business Modules</h2>
                    <p className="text-sm text-slate-500">
                        AI-generated based on your selected categories • Last updated {new Date(modulesConfig.generatedAt).toLocaleDateString()}
                    </p>
                </div>
                <button
                    onClick={onRegenerateModules}
                    disabled={isRegenerating}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-2 disabled:opacity-50"
                >
                    {isRegenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Regenerate
                </button>
            </div>

            {/* Modules List */}
            <div className="space-y-4">
                {modulesConfig.modules.map((module, index) => (
                    <ModuleSection
                        key={module.id}
                        module={module}
                        defaultOpen={index === 0}
                        onAddItem={() => handleGenerateMoreItems(module)}
                        isGeneratingItems={isGeneratingItems}
                    />
                ))}
            </div>
        </div>
    );
}

export { ModulesTab };
