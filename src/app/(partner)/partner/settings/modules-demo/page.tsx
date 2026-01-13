'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Package, Link2, Sparkles, Loader2, CheckCircle, ArrowRight,
    Brain, Info, AlertCircle, RefreshCw, ChevronRight, Search,
    Building2, Database, Zap, Settings, Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Taxonomy
import { getIndustries, getFunctionsByIndustry, type Industry, type BusinessFunction } from '@/lib/business-taxonomy';

// Module Generation (server action)
import { generateModulesFromCategories, type GeneratedModule } from '@/actions/module-generator-actions';

// Module Converters (pure functions)
import {
    convertToUnifiedInventory,
    convertToUnifiedIntegrations,
    convertToUnifiedAITools
} from '@/lib/module-converters';

// Inventory Types & Manager
import type { InventoryConfig, IntegrationsConfig, AIToolsConfig } from '@/lib/inventory-types';
import InventoryManager from '@/components/partner/settings/InventoryManager';

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

// ===== DEMO PAGE =====
export default function ModulesDemo() {
    const [step, setStep] = useState<'select' | 'generating' | 'manage'>('select');

    // Selection state
    const [industries] = useState<Industry[]>(getIndustries());
    const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);
    const [functions, setFunctions] = useState<BusinessFunction[]>([]);
    const [selectedFunction, setSelectedFunction] = useState<BusinessFunction | null>(null);

    // Generated data
    const [inventoryConfig, setInventoryConfig] = useState<InventoryConfig | null>(null);
    const [integrationsConfig, setIntegrationsConfig] = useState<IntegrationsConfig | null>(null);
    const [aiToolsConfig, setAIToolsConfig] = useState<AIToolsConfig | null>(null);

    // UI state
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeTab, setActiveTab] = useState<'inventory' | 'integrations' | 'ai_tools'>('inventory');
    const [error, setError] = useState<string | null>(null);

    // Load functions when industry changes
    useEffect(() => {
        if (selectedIndustry) {
            const funcs = getFunctionsByIndustry(selectedIndustry.industryId);
            setFunctions(funcs);
            setSelectedFunction(null);
        }
    }, [selectedIndustry]);

    // Generate modules
    const handleGenerate = async () => {
        if (!selectedIndustry || !selectedFunction) return;

        setStep('generating');
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
                // Convert to unified formats
                const inventory = convertToUnifiedInventory(result.config.modules);
                const integrations = convertToUnifiedIntegrations(result.config.modules);
                const aiTools = convertToUnifiedAITools(result.config.modules);

                setInventoryConfig(inventory);
                setIntegrationsConfig(integrations);
                setAIToolsConfig(aiTools);
                setStep('manage');
                toast.success('Modules generated successfully!');
            } else {
                setError(result.error || 'Failed to generate modules');
                setStep('select');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            setStep('select');
        } finally {
            setIsGenerating(false);
        }
    };

    // Handle inventory config change
    const handleInventoryChange = (config: InventoryConfig) => {
        setInventoryConfig(config);
        // In production, this would persist to BusinessPersona
    };

    // Reset and start over
    const handleStartOver = () => {
        setStep('select');
        setInventoryConfig(null);
        setIntegrationsConfig(null);
        setAIToolsConfig(null);
        setSelectedIndustry(null);
        setSelectedFunction(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-100">

            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <Package className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-slate-900">Modules Manager</h1>
                            <p className="text-xs text-slate-500">AI-Powered Inventory & Integrations</p>
                        </div>
                    </div>

                    {step === 'manage' && (
                        <div className="flex items-center gap-2">
                            <span className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                                <CheckCircle className="w-4 h-4" />
                                {selectedFunction?.name}
                            </span>
                            <button
                                onClick={handleStartOver}
                                className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                            >
                                Change Business
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-6xl mx-auto py-8 px-4">

                {/* Step: Selection */}
                {step === 'select' && (
                    <div className="space-y-6">
                        {/* Info Banner */}
                        <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl flex items-start gap-3">
                            <Brain className="w-5 h-5 text-indigo-600 mt-0.5" />
                            <div>
                                <p className="text-sm text-indigo-800 font-medium">
                                    How this works:
                                </p>
                                <p className="text-sm text-indigo-700">
                                    1. Select your industry and business type<br />
                                    2. AI generates custom inventory fields, categories, and sample items<br />
                                    3. Manage your inventory with full CRUD operations
                                </p>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600" />
                                <span className="text-red-700">{error}</span>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Industry Selection */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-5">
                                <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-sm font-bold text-indigo-600">1</span>
                                    Select Your Industry
                                </h2>
                                <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
                                    {industries.map(industry => (
                                        <button
                                            key={industry.industryId}
                                            onClick={() => setSelectedIndustry(industry)}
                                            className={cn(
                                                "flex items-center gap-3 p-3 rounded-xl text-left transition-all",
                                                selectedIndustry?.industryId === industry.industryId
                                                    ? "bg-indigo-100 border-2 border-indigo-500 shadow-md"
                                                    : "bg-slate-50 border-2 border-transparent hover:bg-slate-100"
                                            )}
                                        >
                                            <span className="text-2xl">{INDUSTRY_ICONS[industry.industryId] || '📦'}</span>
                                            <span className="font-medium text-sm text-slate-700">{industry.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Business Type Selection */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-5">
                                <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <span className={cn(
                                        "w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold",
                                        selectedIndustry ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400"
                                    )}>2</span>
                                    Select Business Type
                                </h2>

                                {!selectedIndustry ? (
                                    <div className="h-[400px] flex items-center justify-center">
                                        <div className="text-center text-slate-400">
                                            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                            <p>Select an industry first</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                        {functions.map(func => (
                                            <button
                                                key={func.functionId}
                                                onClick={() => setSelectedFunction(func)}
                                                className={cn(
                                                    "w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all",
                                                    selectedFunction?.functionId === func.functionId
                                                        ? "bg-indigo-100 border-2 border-indigo-500"
                                                        : "bg-slate-50 border-2 border-transparent hover:bg-slate-100"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                                                    selectedFunction?.functionId === func.functionId
                                                        ? "bg-indigo-600 border-indigo-600"
                                                        : "border-slate-300"
                                                )}>
                                                    {selectedFunction?.functionId === func.functionId && (
                                                        <CheckCircle className="w-3 h-3 text-white" />
                                                    )}
                                                </div>
                                                <div>
                                                    <span className="font-medium text-slate-800">{func.name}</span>
                                                    <p className="text-xs text-slate-500">{func.googlePlacesTypes.slice(0, 2).join(' • ')}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Generate Button */}
                        <button
                            onClick={handleGenerate}
                            disabled={!selectedFunction || isGenerating}
                            className={cn(
                                "w-full flex items-center justify-center gap-3 px-8 py-5 rounded-xl font-semibold text-lg transition-all",
                                selectedFunction
                                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90 shadow-lg shadow-indigo-200"
                                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                            )}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    Generating Modules with AI...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-6 h-6" />
                                    Generate Custom Modules
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Step: Generating */}
                {step === 'generating' && (
                    <div className="flex items-center justify-center min-h-[50vh]">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pulse">
                                <Sparkles className="w-10 h-10 text-indigo-600" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 mb-2">Generating Your Modules</h2>
                            <p className="text-slate-500 mb-4">
                                AI is creating custom inventory fields, categories, and sample items<br />
                                for your {selectedFunction?.name} business...
                            </p>
                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
                        </div>
                    </div>
                )}

                {/* Step: Manage */}
                {step === 'manage' && (
                    <div className="space-y-6">
                        {/* Tabs */}
                        <div className="bg-white rounded-xl border border-slate-200 p-1 flex gap-1">
                            <button
                                onClick={() => setActiveTab('inventory')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors",
                                    activeTab === 'inventory'
                                        ? "bg-indigo-100 text-indigo-700"
                                        : "text-slate-500 hover:bg-slate-50"
                                )}
                            >
                                <Package className="w-5 h-5" />
                                {inventoryConfig?.itemLabelPlural || 'Inventory'}
                                <span className="text-xs px-2 py-0.5 bg-white rounded-full">
                                    {inventoryConfig?.items.length || 0}
                                </span>
                            </button>
                            <button
                                onClick={() => setActiveTab('integrations')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors",
                                    activeTab === 'integrations'
                                        ? "bg-indigo-100 text-indigo-700"
                                        : "text-slate-500 hover:bg-slate-50"
                                )}
                            >
                                <Link2 className="w-5 h-5" />
                                Integrations
                                <span className="text-xs px-2 py-0.5 bg-white rounded-full">
                                    {integrationsConfig?.platforms.length || 0}
                                </span>
                            </button>
                            <button
                                onClick={() => setActiveTab('ai_tools')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-colors",
                                    activeTab === 'ai_tools'
                                        ? "bg-indigo-100 text-indigo-700"
                                        : "text-slate-500 hover:bg-slate-50"
                                )}
                            >
                                <Zap className="w-5 h-5" />
                                AI Tools
                                <span className="text-xs px-2 py-0.5 bg-white rounded-full">
                                    {aiToolsConfig?.tools.length || 0}
                                </span>
                            </button>
                        </div>

                        {/* Tab Content */}
                        {activeTab === 'inventory' && inventoryConfig && (
                            <InventoryManager
                                config={inventoryConfig}
                                onConfigChange={handleInventoryChange}
                            />
                        )}

                        {activeTab === 'integrations' && integrationsConfig && (
                            <div className="bg-white rounded-xl border border-slate-200 p-6">
                                <h2 className="text-xl font-bold text-slate-900 mb-4">Integrations</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {integrationsConfig.platforms.map((platform, i) => (
                                        <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                                <Link2 className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-slate-800">{platform.name}</div>
                                                <div className="text-sm text-slate-500">{platform.description}</div>
                                            </div>
                                            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                                                Connect
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'ai_tools' && aiToolsConfig && (
                            <div className="bg-white rounded-xl border border-slate-200 p-6">
                                <h2 className="text-xl font-bold text-slate-900 mb-4">AI Tools</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {aiToolsConfig.tools.map((tool, i) => (
                                        <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                                <Zap className="w-5 h-5 text-purple-600" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-slate-800">{tool.name}</div>
                                                <div className="text-sm text-slate-500">{tool.description}</div>
                                                <div className="text-xs text-purple-600 mt-1">{tool.useCase}</div>
                                            </div>
                                            <button className={cn(
                                                "px-4 py-2 rounded-lg text-sm font-medium",
                                                tool.isEnabled
                                                    ? "bg-green-100 text-green-700"
                                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                            )}>
                                                {tool.isEnabled ? 'Enabled' : 'Enable'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
