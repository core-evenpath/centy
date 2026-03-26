'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    ArrowLeft, Check, ChevronRight, Loader2, Package,
    Plus, RefreshCw, Sparkles, X, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEFAULT_MODULE_SETTINGS } from '@/lib/modules/constants';
import {
    generateModuleSchemaAction,
    discoverModulesForBusinessType,
    regenerateModuleTemplate,
} from '@/actions/module-ai-actions';
import { createSystemModuleAction } from '@/actions/modules-actions';
import { getIndustries, getFunctionsByIndustry } from '@/lib/business-taxonomy';
import type { Industry, BusinessFunction } from '@/lib/business-taxonomy';
import type { DiscoveredModule } from '@/lib/modules/types';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';

interface UnifiedModuleCreatorProps {
    userId: string;
}

type CreatorStep = 'industry' | 'function' | 'discovery' | 'generating' | 'results' | 'custom';

interface GenerationProgress {
    slug: string;
    name: string;
    status: 'pending' | 'generating' | 'success' | 'error';
    fieldsCount?: number;
    categoriesCount?: number;
    error?: string;
    relayBlockStatus?: 'pending' | 'success' | 'error';
    relayBlockId?: string;
    relayBlockError?: string;
}

const INDUSTRY_ICONS: Record<string, string> = {
    financial_services: '🏦',
    hospitality: '🏨',
    food_beverage: '🍽️',
    retail_commerce: '🛒',
    healthcare_medical: '🏥',
    education_learning: '🎓',
    business_professional: '💼',
    home_property: '🏠',
    personal_wellness: '💆',
    automotive: '🚗',
    agriculture: '🌾',
    logistics_transport: '🚚',
    entertainment_media: '🎬',
    technology: '💻',
};

function getIndustryIcon(industryId: string): string {
    return INDUSTRY_ICONS[industryId] || '📦';
}

function getIndustryColor(industryId: string): string {
    const colors: Record<string, string> = {
        hospitality: 'blue', food_beverage: 'orange', retail_commerce: 'emerald', healthcare_medical: 'red',
        education_learning: 'purple', business_professional: 'indigo', home_property: 'teal', automotive: 'slate',
        personal_wellness: 'pink', financial_services: 'amber', agriculture: 'green', logistics_transport: 'cyan',
    };
    return colors[industryId] || 'blue';
}

export function UnifiedModuleCreator({ userId }: UnifiedModuleCreatorProps) {
    const router = useRouter();
    const industries = getIndustries();

    const [step, setStep] = useState<CreatorStep>('industry');
    const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);
    const [selectedFunction, setSelectedFunction] = useState<BusinessFunction | null>(null);
    const [discoveredModules, setDiscoveredModules] = useState<DiscoveredModule[]>([]);
    const [isDiscovering, setIsDiscovering] = useState(false);
    const [countryCode, setCountryCode] = useState('IN');
    const [progress, setProgress] = useState<GenerationProgress[]>([]);

    // Custom module state
    const [customIndustry, setCustomIndustry] = useState('');
    const [customModuleName, setCustomModuleName] = useState('');
    const [customItemLabel, setCustomItemLabel] = useState('Item');
    const [customCountry, setCustomCountry] = useState('IN');
    const [isCustomGenerating, setIsCustomGenerating] = useState(false);

    const handleSelectIndustry = (industry: Industry) => {
        setSelectedIndustry(industry);
        setSelectedFunction(null);
        setDiscoveredModules([]);
        setStep('function');
    };

    const handleSelectFunction = async (func: BusinessFunction) => {
        if (!selectedIndustry) return;
        setSelectedFunction(func);
        setIsDiscovering(true);
        setStep('discovery');

        try {
            const result = await discoverModulesForBusinessType(
                selectedIndustry.industryId,
                selectedIndustry.name,
                func.functionId,
                func.name,
                countryCode
            );

            if (result.success && result.template) {
                setDiscoveredModules(result.template.modules.map(m => ({ ...m, selected: true })));
            } else {
                toast.error(result.error || 'Failed to discover modules');
                setStep('function');
            }
        } catch (error) {
            toast.error('Failed to discover modules');
            setStep('function');
        } finally {
            setIsDiscovering(false);
        }
    };

    const handleRediscover = async () => {
        if (!selectedIndustry || !selectedFunction) return;
        setIsDiscovering(true);

        try {
            const result = await regenerateModuleTemplate(
                selectedIndustry.industryId,
                selectedIndustry.name,
                selectedFunction.functionId,
                selectedFunction.name,
                countryCode
            );

            if (result.success && result.template) {
                setDiscoveredModules(result.template.modules.map(m => ({ ...m, selected: true })));
                toast.success('Modules re-discovered');
            } else {
                toast.error(result.error || 'Failed to re-discover modules');
            }
        } catch {
            toast.error('Failed to re-discover modules');
        } finally {
            setIsDiscovering(false);
        }
    };

    const toggleModule = (slug: string) => {
        setDiscoveredModules(prev =>
            prev.map(m => m.slug === slug ? { ...m, selected: !m.selected } : m)
        );
    };

    const toggleAll = () => {
        const allSelected = discoveredModules.every(m => m.selected);
        setDiscoveredModules(prev => prev.map(m => ({ ...m, selected: !allSelected })));
    };

    const selectedModules = discoveredModules.filter(m => m.selected);

    const handleGenerate = async () => {
        if (!selectedIndustry || !selectedFunction || selectedModules.length === 0) return;

        const initialProgress: GenerationProgress[] = selectedModules.map(m => ({
            slug: m.slug,
            name: m.name,
            status: 'pending',
        }));

        setProgress(initialProgress);
        setStep('generating');

        for (let i = 0; i < selectedModules.length; i++) {
            const mod = selectedModules[i];

            setProgress(prev => prev.map((p, idx) =>
                idx === i ? { ...p, status: 'generating' } : p
            ));

            try {
                const schemaResult = await generateModuleSchemaAction(
                    selectedIndustry.industryId,
                    selectedIndustry.name,
                    mod.name,
                    mod.itemLabel,
                    countryCode,
                    'standard',
                    selectedFunction.functionId,
                    selectedFunction.name
                );

                if (!schemaResult.success || !schemaResult.schema) {
                    throw new Error(schemaResult.error || 'Schema generation failed');
                }

                const scopedSlug = `${selectedFunction.functionId}_${mod.slug.replace(/[^a-z0-9_-]/g, '_')}`.substring(0, 60);

                const createResult = await createSystemModuleAction({
                    slug: scopedSlug,
                    name: mod.name,
                    description: mod.description,
                    icon: mod.icon,
                    color: getIndustryColor(selectedIndustry.industryId),
                    itemLabel: mod.itemLabel,
                    itemLabelPlural: mod.itemLabelPlural,
                    priceLabel: mod.priceLabel,
                    priceType: mod.priceType,
                    defaultCurrency: countryCode === 'IN' ? 'INR' : 'USD',
                    applicableIndustries: [selectedIndustry.industryId],
                    applicableFunctions: [selectedFunction.functionId],
                    agentConfig: mod.agentConfig,
                    status: 'active',
                    settings: DEFAULT_MODULE_SETTINGS,
                    schema: schemaResult.schema,
                    createdBy: userId,
                });

                if (!createResult.success) {
                    throw new Error(createResult.error || 'Module creation failed');
                }

                const relayBlock = createResult.data?.relayBlock;

                setProgress(prev => prev.map((p, idx) =>
                    idx === i ? {
                        ...p,
                        status: 'success',
                        fieldsCount: schemaResult.schema!.fields.length,
                        categoriesCount: schemaResult.schema!.categories.length,
                        relayBlockStatus: relayBlock?.success ? 'success' : 'error',
                        relayBlockId: relayBlock?.blockId,
                        relayBlockError: relayBlock?.error,
                    } : p
                ));
            } catch (error) {
                setProgress(prev => prev.map((p, idx) =>
                    idx === i ? {
                        ...p,
                        status: 'error',
                        error: error instanceof Error ? error.message : 'Unknown error',
                    } : p
                ));
            }
        }

        setStep('results');
    };

    const handleCustomGenerate = async () => {
        if (!customIndustry || !customModuleName) {
            toast.error('Industry and module name are required');
            return;
        }

        setIsCustomGenerating(true);
        try {
            const slug = `${customIndustry.toLowerCase().replace(/\s+/g, '_')}_${customModuleName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`.substring(0, 50);

            const schemaResult = await generateModuleSchemaAction(
                customIndustry.toLowerCase().replace(/\s+/g, '_'),
                customIndustry,
                customModuleName,
                customItemLabel,
                customCountry,
                'comprehensive'
            );

            if (!schemaResult.success || !schemaResult.schema) {
                throw new Error(schemaResult.error || 'Schema generation failed');
            }

            const createResult = await createSystemModuleAction({
                slug,
                name: customModuleName,
                description: `${customModuleName} for ${customIndustry} businesses`,
                icon: '📦',
                color: 'blue',
                itemLabel: customItemLabel,
                itemLabelPlural: customItemLabel + 's',
                priceLabel: 'Price',
                priceType: 'one_time',
                defaultCurrency: customCountry === 'IN' ? 'INR' : 'USD',
                applicableIndustries: [customIndustry.toLowerCase().replace(/\s+/g, '_')],
                applicableFunctions: [],
                status: 'active',
                settings: DEFAULT_MODULE_SETTINGS,
                schema: schemaResult.schema,
                createdBy: userId,
            });

            if (!createResult.success) {
                throw new Error(createResult.error || 'Module creation failed');
            }

            const relayBlock = createResult.data?.relayBlock;
            if (relayBlock?.success) {
                toast.success('Module + Relay block created successfully!');
            } else {
                toast.success('Module created! Relay block failed — generate it from Admin > Relay.');
            }
            router.push('/admin/modules');
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : 'Failed to generate module');
        } finally {
            setIsCustomGenerating(false);
        }
    };

    const successCount = progress.filter(p => p.status === 'success').length;
    const failedCount = progress.filter(p => p.status === 'error').length;

    const functions = selectedIndustry ? getFunctionsByIndustry(selectedIndustry.industryId) : [];

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/admin/modules">
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Back
                    </Link>
                </Button>
            </div>

            <div className="text-center space-y-2">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-black shadow-lg mb-2">
                    <Sparkles className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Create Module</h1>
                <p className="text-muted-foreground max-w-lg mx-auto">
                    Pick an industry and business type, then let AI discover and generate the right modules.
                </p>
            </div>

            {/* Step 1: Industry Selection */}
            {step === 'industry' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {industries.map(industry => (
                            <button
                                key={industry.industryId}
                                onClick={() => handleSelectIndustry(industry)}
                                className="flex flex-col items-start p-4 rounded-xl border border-slate-200 bg-white transition-all text-left hover:border-slate-400 hover:shadow-md group"
                            >
                                <span className="text-2xl mb-2">{getIndustryIcon(industry.industryId)}</span>
                                <span className="font-medium text-sm text-slate-900">{industry.name}</span>
                                <span className="text-xs text-slate-400 mt-1">
                                    {getFunctionsByIndustry(industry.industryId).length} sub-categories
                                </span>
                                <ChevronRight className="h-4 w-4 text-slate-300 mt-2 transition-transform group-hover:translate-x-1" />
                            </button>
                        ))}
                    </div>

                    <div className="border-t border-slate-200 pt-6">
                        <button
                            onClick={() => setStep('custom')}
                            className="w-full flex items-center justify-between p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                                    <Plus className="h-5 w-5 text-slate-500" />
                                </div>
                                <div className="text-left">
                                    <div className="font-medium text-sm text-slate-700">Custom Module</div>
                                    <div className="text-xs text-slate-500">Create a module for a custom industry or business type</div>
                                </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Business Function (Sub-category) Selection */}
            {step === 'function' && selectedIndustry && (
                <Card className="border-0 shadow-lg ring-1 ring-slate-200">
                    <CardContent className="p-6 space-y-6">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{getIndustryIcon(selectedIndustry.industryId)}</span>
                            <div>
                                <h2 className="text-lg font-semibold">{selectedIndustry.name}</h2>
                                <p className="text-sm text-muted-foreground">Select a business type to discover modules</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-1">
                            {functions.map(func => (
                                <button
                                    key={func.functionId}
                                    onClick={() => handleSelectFunction(func)}
                                    className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-left transition-all hover:border-slate-400 hover:shadow-sm group"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm">{func.name}</div>
                                        {func.description && (
                                            <div className="text-xs text-slate-500 truncate">{func.description}</div>
                                        )}
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-slate-300 shrink-0 transition-transform group-hover:translate-x-1" />
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-4 pt-2 border-t border-slate-100">
                            <div className="flex-1">
                                <Label className="text-sm font-medium">Target Market</Label>
                                <Select value={countryCode} onValueChange={setCountryCode}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="IN">India (INR)</SelectItem>
                                        <SelectItem value="US">USA (USD)</SelectItem>
                                        <SelectItem value="GB">UK (GBP)</SelectItem>
                                        <SelectItem value="AE">UAE (AED)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <Button variant="ghost" onClick={() => { setStep('industry'); setSelectedIndustry(null); }}>
                                <ArrowLeft className="h-4 w-4 mr-1" /> Back
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 3: Discovery - AI discovers modules for the selected business function */}
            {step === 'discovery' && selectedIndustry && selectedFunction && (
                <Card className="border-0 shadow-lg ring-1 ring-slate-200">
                    <CardContent className="p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{getIndustryIcon(selectedIndustry.industryId)}</span>
                                <div>
                                    <h2 className="text-lg font-semibold">{selectedFunction.name}</h2>
                                    <p className="text-sm text-muted-foreground">
                                        {isDiscovering ? 'Discovering modules...' : `${discoveredModules.length} modules discovered`}
                                    </p>
                                </div>
                            </div>
                            {!isDiscovering && discoveredModules.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="sm" onClick={handleRediscover}>
                                        <RefreshCw className="h-4 w-4 mr-1" /> Re-discover
                                    </Button>
                                    <button
                                        onClick={toggleAll}
                                        className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                                    >
                                        {discoveredModules.every(m => m.selected) ? 'Deselect All' : 'Select All'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {isDiscovering ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                                <Loader2 className="h-8 w-8 text-slate-400 animate-spin" />
                                <p className="text-sm text-slate-500">AI is discovering modules for {selectedFunction.name}...</p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                                    {discoveredModules.map(mod => (
                                        <label
                                            key={mod.slug}
                                            className={cn(
                                                "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all",
                                                mod.selected
                                                    ? "border-slate-400 bg-slate-50"
                                                    : "border-slate-200 hover:border-slate-300"
                                            )}
                                        >
                                            <Checkbox
                                                checked={mod.selected}
                                                onCheckedChange={() => toggleModule(mod.slug)}
                                            />
                                            <span className="text-lg shrink-0">{mod.icon}</span>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm">{mod.name}</div>
                                                <div className="text-xs text-slate-500">
                                                    {mod.itemLabel} &middot; {mod.priceLabel} &middot; ~{mod.estimatedFieldCount} fields
                                                </div>
                                                {mod.description && (
                                                    <div className="text-xs text-slate-400 mt-0.5 truncate">{mod.description}</div>
                                                )}
                                            </div>
                                        </label>
                                    ))}
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                    <Button variant="ghost" onClick={() => {
                                        setStep('function');
                                        setSelectedFunction(null);
                                        setDiscoveredModules([]);
                                    }}>
                                        <ArrowLeft className="h-4 w-4 mr-1" /> Back
                                    </Button>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-slate-500">
                                            {selectedModules.length} of {discoveredModules.length} selected
                                        </span>
                                        <Button
                                            onClick={handleGenerate}
                                            disabled={selectedModules.length === 0}
                                        >
                                            <Sparkles className="h-4 w-4 mr-2" />
                                            Generate {selectedModules.length} Modules
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Step 4 & 5: Generation Progress / Results */}
            {(step === 'generating' || step === 'results') && (
                <Card className="border-0 shadow-lg ring-1 ring-slate-200">
                    <CardContent className="p-6 space-y-6">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{selectedIndustry ? getIndustryIcon(selectedIndustry.industryId) : '📦'}</span>
                            <div>
                                <h2 className="text-lg font-semibold">
                                    {step === 'generating' ? 'Generating Modules...' : 'Generation Complete'}
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    {step === 'generating'
                                        ? `${progress.filter(p => p.status === 'success').length} of ${progress.length} completed`
                                        : `${successCount} modules, ${progress.filter(p => p.relayBlockStatus === 'success').length} relay blocks created`
                                    }
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                            {progress.map(item => (
                                <div
                                    key={item.slug}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg border p-3 transition-all",
                                        item.status === 'success' && "border-emerald-200 bg-emerald-50/50",
                                        item.status === 'error' && "border-red-200 bg-red-50/50",
                                        item.status === 'generating' && "border-slate-300 bg-slate-50",
                                        item.status === 'pending' && "border-slate-200"
                                    )}
                                >
                                    <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0">
                                        {item.status === 'pending' && (
                                            <div className="h-3 w-3 rounded-full bg-slate-300" />
                                        )}
                                        {item.status === 'generating' && (
                                            <Loader2 className="h-5 w-5 text-slate-600 animate-spin" />
                                        )}
                                        {item.status === 'success' && (
                                            <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                                <Check className="h-4 w-4 text-emerald-600" />
                                            </div>
                                        )}
                                        {item.status === 'error' && (
                                            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                                                <X className="h-4 w-4 text-red-600" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm">{item.name}</div>
                                        {item.status === 'success' && (
                                            <div className="space-y-0.5">
                                                <div className="text-xs text-emerald-600">
                                                    {item.fieldsCount} fields &middot; {item.categoriesCount} categories
                                                </div>
                                                <div className={cn(
                                                    "text-xs flex items-center gap-1",
                                                    item.relayBlockStatus === 'success' ? "text-emerald-600" : "text-amber-600"
                                                )}>
                                                    {item.relayBlockStatus === 'success' ? (
                                                        <>
                                                            <Zap className="h-3 w-3" />
                                                            Relay block created
                                                        </>
                                                    ) : item.relayBlockStatus === 'error' ? (
                                                        <>
                                                            <Zap className="h-3 w-3" />
                                                            Relay block failed{item.relayBlockError ? `: ${item.relayBlockError}` : ''}
                                                        </>
                                                    ) : null}
                                                </div>
                                            </div>
                                        )}
                                        {item.status === 'error' && (
                                            <div className="text-xs text-red-600 truncate">{item.error}</div>
                                        )}
                                        {item.status === 'generating' && (
                                            <div className="text-xs text-slate-500">Generating schema...</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {step === 'results' && (
                            <div className="flex items-center justify-between pt-2">
                                <Button variant="ghost" onClick={() => {
                                    setStep('industry');
                                    setSelectedIndustry(null);
                                    setSelectedFunction(null);
                                    setDiscoveredModules([]);
                                    setProgress([]);
                                }}>
                                    Generate More
                                </Button>
                                <Button asChild>
                                    <Link href="/admin/modules">
                                        Done &mdash; View Modules
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Custom Module Flow */}
            {step === 'custom' && (
                <Card className="border-0 shadow-lg ring-1 ring-slate-200">
                    <CardContent className="p-6 space-y-6">
                        <div>
                            <h2 className="text-lg font-semibold">Custom Module</h2>
                            <p className="text-sm text-muted-foreground">
                                Define your own industry and module for AI generation
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Industry Name</Label>
                                    <Input
                                        placeholder="e.g. Pet Care, Event Planning"
                                        value={customIndustry}
                                        onChange={e => setCustomIndustry(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Module Name</Label>
                                    <Input
                                        placeholder="e.g. Pet Grooming Services"
                                        value={customModuleName}
                                        onChange={e => setCustomModuleName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Item Label</Label>
                                    <Input
                                        placeholder="e.g. Service, Product, Package"
                                        value={customItemLabel}
                                        onChange={e => setCustomItemLabel(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Country</Label>
                                    <Select value={customCountry} onValueChange={setCustomCountry}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="IN">India (INR)</SelectItem>
                                            <SelectItem value="US">USA (USD)</SelectItem>
                                            <SelectItem value="GB">UK (GBP)</SelectItem>
                                            <SelectItem value="AE">UAE (AED)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <Button variant="ghost" onClick={() => setStep('industry')}>
                                <ArrowLeft className="h-4 w-4 mr-1" /> Back
                            </Button>
                            <Button
                                onClick={handleCustomGenerate}
                                disabled={isCustomGenerating || !customIndustry || !customModuleName}
                            >
                                {isCustomGenerating ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-4 w-4 mr-2" />
                                        Generate Module
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
