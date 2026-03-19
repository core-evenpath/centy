
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRight, ChevronRight, Loader2, Sparkles, Building2, Layers, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getIndustries, getFunctionsByIndustry } from '@/lib/business-taxonomy';
import { generateModuleSchemaAction } from '@/actions/module-ai-actions';
import { DEFAULT_MODULE_SETTINGS } from '@/lib/modules/constants';
import { GenerationPreview } from './GenerationPreview';
import { createSystemModuleAction } from '@/actions/modules-actions';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface AIModuleWizardProps {
    userId: string;
}

export function AIModuleWizard({ userId }: AIModuleWizardProps) {
    const router = useRouter();
    const [step, setStep] = useState<1 | 2 | 3 | 'preview'>(1);
    const [isGenerating, setIsGenerating] = useState(false);

    // Form State
    const [selectedIndustry, setSelectedIndustry] = useState("");
    const [selectedFunction, setSelectedFunction] = useState("");
    const [country, setCountry] = useState("IN");
    const [additionalContext, setAdditionalContext] = useState("");

    // Result State
    const [generatedResult, setGeneratedResult] = useState<any>(null);

    const industries = getIndustries();
    const functions = selectedIndustry ? getFunctionsByIndustry(selectedIndustry) : [];

    const handleGenerate = async () => {
        if (!selectedIndustry || !selectedFunction) return;

        setIsGenerating(true);
        const industryName = industries.find(i => i.industryId === selectedIndustry)?.name || "";
        const functionName = functions.find(f => f.functionId === selectedFunction)?.name || "";

        try {
            const result = await generateModuleSchemaAction(
                selectedIndustry,
                industryName,
                functionName,
                'Item', // Default item label
                country
            );

            if (result.success) {
                setGeneratedResult(result);
                setStep('preview');
            } else {
                toast.error(result.error || "Generation failed");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred during generation");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!generatedResult) return;

        setIsGenerating(true); // Re-use loading state for saving

        try {
            const industryName = industries.find(i => i.industryId === selectedIndustry)?.name || "";
            const functionName = functions.find(f => f.functionId === selectedFunction)?.name || "";
            const slug = `${selectedIndustry}_${selectedFunction}_${Date.now()}`; // Ensure uniqueness or let backend handle

            // Refine schema props before saving if needed
            const finalData = {
                slug: slug.substring(0, 50),
                name: functionName + " (AI Generated)",
                description: `AI-generated module for ${industryName} - ${functionName}`,
                icon: '📦', // Default, user can change later or we map it
                color: 'blue',
                itemLabel: 'Item',
                itemLabelPlural: 'Items',
                priceLabel: 'Price',
                priceType: 'one_time' as const,
                defaultCurrency: country === 'IN' ? 'INR' : 'USD',
                applicableIndustries: [selectedIndustry],
                applicableFunctions: [selectedFunction],
                status: 'active' as const, // or 'draft'
                settings: {
                    ...DEFAULT_MODULE_SETTINGS,
                    allowCustomFields: true,
                    allowCustomCategories: true,
                    maxItems: 1000,
                },
                schema: generatedResult.schema,
                createdBy: userId || 'system'
            };

            const result = await createSystemModuleAction(finalData);

            if (result.success) {
                toast.success("Module created! Relay blocks are generating in the background.");
                router.push(`/admin/modules`);
            } else {
                toast.error(result.error || "Failed to save module");
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to save module");
        } finally {
            setIsGenerating(false);
        }
    };

    if (step === 'preview' && generatedResult) {
        return (
            <GenerationPreview
                schema={generatedResult.schema}
                items={generatedResult.suggestedItems}
                moduleName="Generated Module"
                onRegenerate={async () => {
                    // Quick re-gen implementation or complex one
                    toast.info("Regenerating...");
                    await handleGenerate();
                }}
                onSave={handleSave}
                onCancel={() => setStep(3)}
                isSaving={isGenerating}
            />
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-2 mb-8">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg mb-4">
                    <Sparkles className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Create New Module</h1>
                <p className="text-muted-foreground max-w-lg mx-auto">
                    Let AI build a comprehensive data structure for your business needs in seconds.
                </p>
            </div>

            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm ring-1 ring-slate-200">
                <CardContent className="p-0">
                    <div className="grid md:grid-cols-[280px_1fr] min-h-[400px]">
                        {/* Sidebar Steps */}
                        <div className="border-r border-slate-100 bg-slate-50/50 p-6 space-y-6">
                            <div className="space-y-1">
                                <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-500 mb-4">Steps</h3>
                                {[
                                    { id: 1, label: 'Industry', icon: Building2 },
                                    { id: 2, label: 'Business Type', icon: Layers },
                                    { id: 3, label: 'Details', icon: Globe },
                                ].map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() => (step === 'preview' ? 4 : step) > s.id && setStep(s.id as any)}
                                        disabled={(step === 'preview' ? 4 : step) < s.id}
                                        className={cn(
                                            "flex items-center gap-3 w-full p-2 rounded-lg text-sm font-medium transition-colors",
                                            step === s.id
                                                ? "bg-white text-indigo-600 shadow-sm border border-indigo-100"
                                                : (step === 'preview' ? 4 : step) > s.id
                                                    ? "text-slate-600 hover:bg-slate-100"
                                                    : "text-slate-400 cursor-not-allowed"
                                        )}
                                    >
                                        <div className={cn(
                                            "h-8 w-8 rounded-full flex items-center justify-center border transition-colors",
                                            step === s.id
                                                ? "border-indigo-200 bg-indigo-50 text-indigo-600"
                                                : (step === 'preview' ? 4 : step) > s.id
                                                    ? "border-green-200 bg-green-50 text-green-600"
                                                    : "border-slate-200 bg-slate-50"
                                        )}>
                                            {(step === 'preview' ? 4 : step) > s.id ? (
                                                <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
                                            ) : (
                                                <s.icon className="h-4 w-4" />
                                            )}
                                        </div>
                                        {s.label}
                                    </button>
                                ))}
                            </div>

                            <div className="pt-6 mt-auto border-t border-slate-200">
                                <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                                    <p className="text-xs text-indigo-700 leading-relaxed">
                                        <strong>Did you know?</strong><br />
                                        The AI analyzes thousands of business patterns to suggest the most relevant fields and categories.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="p-8">
                            {isGenerating ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in duration-500">
                                    <div className="relative">
                                        <div className="h-16 w-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Sparkles className="h-6 w-6 text-indigo-600" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-900">Generating Module...</h3>
                                        <p className="text-sm text-slate-500">Crafting fields, categories, and sample items.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                    {step === 1 && (
                                        <div className="space-y-4">
                                            <div>
                                                <h2 className="text-lg font-semibold mb-1">Select Industry</h2>
                                                <p className="text-sm text-muted-foreground">Which sector does this module belong to?</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                {industries.map(ind => (
                                                    <button
                                                        key={ind.industryId}
                                                        onClick={() => {
                                                            setSelectedIndustry(ind.industryId);
                                                            setStep(2);
                                                        }}
                                                        className={cn(
                                                            "flex flex-col items-start p-4 rounded-xl border transition-all text-left hover:border-indigo-300 hover:shadow-md",
                                                            selectedIndustry === ind.industryId
                                                                ? "border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600"
                                                                : "border-slate-200 bg-white"
                                                        )}
                                                    >
                                                        <span className="text-2xl mb-2 block">{ind.iconName === 'utensils' ? '🍽️' : '📦'}</span>
                                                        {/* ^ quick mapping placeholder, real mapping needed if not in industry obj */}
                                                        <span className="font-medium text-sm">{ind.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {step === 2 && (
                                        <div className="space-y-4">
                                            <div>
                                                <h2 className="text-lg font-semibold mb-1">Select Business Type</h2>
                                                <p className="text-sm text-muted-foreground">What specific function does this module serve?</p>
                                            </div>
                                            <div className="space-y-2">
                                                {functions.map(func => (
                                                    <button
                                                        key={func.functionId}
                                                        onClick={() => {
                                                            setSelectedFunction(func.functionId);
                                                            setStep(3);
                                                        }}
                                                        className={cn(
                                                            "w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left hover:border-indigo-300 group",
                                                            selectedFunction === func.functionId
                                                                ? "border-indigo-600 bg-indigo-50"
                                                                : "border-slate-200 bg-white"
                                                        )}
                                                    >
                                                        <div>
                                                            <div className="font-medium text-sm">{func.name}</div>
                                                            <div className="text-xs text-muted-foreground">{func.description}</div>
                                                        </div>
                                                        <ChevronRight className={cn(
                                                            "h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-1",
                                                            selectedFunction === func.functionId && "text-indigo-600"
                                                        )} />
                                                    </button>
                                                ))}
                                            </div>
                                            <Button variant="ghost" onClick={() => setStep(1)} className="text-muted-foreground">
                                                Back
                                            </Button>
                                        </div>
                                    )}

                                    {step === 3 && (
                                        <div className="space-y-6">
                                            <div>
                                                <h2 className="text-lg font-semibold mb-1">Final Details</h2>
                                                <p className="text-sm text-muted-foreground">Customize the context for better AI results.</p>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label>Target Market / Country</Label>
                                                    <Select value={country} onValueChange={setCountry}>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="IN">🇮🇳 India</SelectItem>
                                                            <SelectItem value="US">🇺🇸 United States</SelectItem>
                                                            <SelectItem value="AE">🇦🇪 UAE</SelectItem>
                                                            <SelectItem value="GB">🇬🇧 United Kingdom</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Additional Context (Optional)</Label>
                                                    <Textarea
                                                        placeholder="e.g. Include specific fields for eco-friendly certifications, or focus on luxury amenities..."
                                                        className="min-h-[100px] resize-none"
                                                        value={additionalContext}
                                                        onChange={(e) => setAdditionalContext(e.target.value)}
                                                    />
                                                    <p className="text-xs text-muted-foreground">
                                                        Provide any specific requirements or nuances for your business.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-4">
                                                <Button variant="ghost" onClick={() => setStep(2)}>
                                                    Back
                                                </Button>
                                                <Button onClick={handleGenerate} className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-md pl-6 pr-8">
                                                    <Sparkles className="mr-2 h-4 w-4" />
                                                    Generate Module
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
