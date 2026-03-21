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
    Plus, Sparkles, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BULK_INDUSTRY_CONFIGS, DEFAULT_MODULE_SETTINGS, PRICE_TYPE_LABELS, type BulkIndustryConfig } from '@/lib/modules/constants';
import { generateModuleSchemaAction } from '@/actions/module-ai-actions';
import { createSystemModuleAction } from '@/actions/modules-actions';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';

interface UnifiedModuleCreatorProps {
    userId: string;
}

type CreatorStep = 'industry' | 'subcategories' | 'generating' | 'results' | 'custom';

interface GenerationProgress {
    slug: string;
    name: string;
    status: 'pending' | 'generating' | 'success' | 'error';
    fieldsCount?: number;
    categoriesCount?: number;
    error?: string;
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
    const [step, setStep] = useState<CreatorStep>('industry');
    const [selectedIndustry, setSelectedIndustry] = useState<BulkIndustryConfig | null>(null);
    const [selectedModuleSlugs, setSelectedModuleSlugs] = useState<string[]>([]);
    const [countryCode, setCountryCode] = useState('IN');
    const [progress, setProgress] = useState<GenerationProgress[]>([]);

    const [customIndustry, setCustomIndustry] = useState('');
    const [customModuleName, setCustomModuleName] = useState('');
    const [customItemLabel, setCustomItemLabel] = useState('Item');
    const [customCountry, setCustomCountry] = useState('IN');
    const [isCustomGenerating, setIsCustomGenerating] = useState(false);

    const handleSelectIndustry = (industry: BulkIndustryConfig) => {
        setSelectedIndustry(industry);
        setSelectedModuleSlugs(industry.modules.map(m => m.slug));
        setStep('subcategories');
    };

    const toggleModule = (slug: string) => {
        setSelectedModuleSlugs(prev =>
            prev.includes(slug)
                ? prev.filter(s => s !== slug)
                : [...prev, slug]
        );
    };

    const toggleAll = () => {
        if (!selectedIndustry) return;
        if (selectedModuleSlugs.length === selectedIndustry.modules.length) {
            setSelectedModuleSlugs([]);
        } else {
            setSelectedModuleSlugs(selectedIndustry.modules.map(m => m.slug));
        }
    };

    const handleGenerate = async () => {
        if (!selectedIndustry || selectedModuleSlugs.length === 0) return;

        const selectedModules = selectedIndustry.modules.filter(m => selectedModuleSlugs.includes(m.slug));
        const initialProgress: GenerationProgress[] = selectedModules.map(m => ({
            slug: m.slug,
            name: m.name,
            status: 'pending',
        }));

        setProgress(initialProgress);
        setStep('generating');

        for (let i = 0; i < selectedModules.length; i++) {
            const moduleConfig = selectedModules[i];

            setProgress(prev => prev.map((p, idx) =>
                idx === i ? { ...p, status: 'generating' } : p
            ));

            try {
                const schemaResult = await generateModuleSchemaAction(
                    selectedIndustry.id,
                    selectedIndustry.name,
                    moduleConfig.name,
                    moduleConfig.itemLabel,
                    countryCode,
                    'standard'
                );

                if (!schemaResult.success || !schemaResult.schema) {
                    throw new Error(schemaResult.error || 'Schema generation failed');
                }

                const createResult = await createSystemModuleAction({
                    slug: moduleConfig.slug,
                    name: moduleConfig.name,
                    description: `${moduleConfig.name} for ${selectedIndustry.name} businesses`,
                    icon: selectedIndustry.icon,
                    color: getIndustryColor(selectedIndustry.id),
                    itemLabel: moduleConfig.itemLabel,
                    itemLabelPlural: moduleConfig.itemLabel + 's',
                    priceLabel: 'Price',
                    priceType: moduleConfig.priceType as any,
                    defaultCurrency: countryCode === 'IN' ? 'INR' : 'USD',
                    applicableIndustries: [selectedIndustry.id],
                    applicableFunctions: [],
                    status: 'active',
                    settings: DEFAULT_MODULE_SETTINGS,
                    schema: schemaResult.schema,
                    createdBy: userId,
                });

                if (!createResult.success) {
                    throw new Error(createResult.error || 'Module creation failed');
                }

                setProgress(prev => prev.map((p, idx) =>
                    idx === i ? {
                        ...p,
                        status: 'success',
                        fieldsCount: schemaResult.schema!.fields.length,
                        categoriesCount: schemaResult.schema!.categories.length,
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

            toast.success('Module created successfully!');
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
                    Pick an industry and let AI generate comprehensive data structures for your business modules.
                </p>
            </div>

            {/* Step 1: Industry Selection */}
            {step === 'industry' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {BULK_INDUSTRY_CONFIGS.map(industry => (
                            <button
                                key={industry.id}
                                onClick={() => handleSelectIndustry(industry)}
                                className="flex flex-col items-start p-4 rounded-xl border border-slate-200 bg-white transition-all text-left hover:border-slate-400 hover:shadow-md group"
                            >
                                <span className="text-2xl mb-2">{industry.icon}</span>
                                <span className="font-medium text-sm text-slate-900">{industry.name}</span>
                                <span className="text-xs text-slate-400 mt-1">{industry.modules.length} modules</span>
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

            {/* Step 2: Subcategory Selection */}
            {step === 'subcategories' && selectedIndustry && (
                <Card className="border-0 shadow-lg ring-1 ring-slate-200">
                    <CardContent className="p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{selectedIndustry.icon}</span>
                                <div>
                                    <h2 className="text-lg font-semibold">{selectedIndustry.name}</h2>
                                    <p className="text-sm text-muted-foreground">Select modules to generate</p>
                                </div>
                            </div>
                            <button
                                onClick={toggleAll}
                                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                            >
                                {selectedModuleSlugs.length === selectedIndustry.modules.length ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>

                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                            {selectedIndustry.modules.map(mod => (
                                <label
                                    key={mod.slug}
                                    className={cn(
                                        "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all",
                                        selectedModuleSlugs.includes(mod.slug)
                                            ? "border-slate-400 bg-slate-50"
                                            : "border-slate-200 hover:border-slate-300"
                                    )}
                                >
                                    <Checkbox
                                        checked={selectedModuleSlugs.includes(mod.slug)}
                                        onCheckedChange={() => toggleModule(mod.slug)}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm">{mod.name}</div>
                                        <div className="text-xs text-slate-500">
                                            {mod.itemLabel} &middot; {PRICE_TYPE_LABELS[mod.priceType] || mod.priceType}
                                        </div>
                                    </div>
                                </label>
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
                            <div className="text-right pt-5">
                                <div className="text-2xl font-bold text-slate-900">{selectedModuleSlugs.length}</div>
                                <div className="text-xs text-slate-500">modules</div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <Button variant="ghost" onClick={() => { setStep('industry'); setSelectedIndustry(null); }}>
                                <ArrowLeft className="h-4 w-4 mr-1" /> Back
                            </Button>
                            <Button
                                onClick={handleGenerate}
                                disabled={selectedModuleSlugs.length === 0}
                            >
                                <Sparkles className="h-4 w-4 mr-2" />
                                Generate {selectedModuleSlugs.length} Modules
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 3: Generation Progress / Results */}
            {(step === 'generating' || step === 'results') && (
                <Card className="border-0 shadow-lg ring-1 ring-slate-200">
                    <CardContent className="p-6 space-y-6">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{selectedIndustry?.icon}</span>
                            <div>
                                <h2 className="text-lg font-semibold">
                                    {step === 'generating' ? 'Generating Modules...' : 'Generation Complete'}
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    {step === 'generating'
                                        ? `${progress.filter(p => p.status === 'success').length} of ${progress.length} completed`
                                        : `${successCount} succeeded, ${failedCount} failed`
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
                                            <div className="text-xs text-emerald-600">
                                                {item.fieldsCount} fields &middot; {item.categoriesCount} categories
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
