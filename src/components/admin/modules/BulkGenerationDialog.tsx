'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Check, Loader2, AlertCircle, Brain } from 'lucide-react';
import { bulkGenerateModulesAction } from '@/actions/module-ai-actions';
import { BULK_INDUSTRY_CONFIGS } from '@/lib/modules/constants';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface BulkGenerationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onComplete: () => void;
}

export function BulkGenerationDialog({ open, onOpenChange, onComplete }: BulkGenerationDialogProps) {
    const [selectedIndustries, setSelectedIndustries] = useState<string[]>(
        BULK_INDUSTRY_CONFIGS.map(i => i.id)
    );
    const [countryCode, setCountryCode] = useState('IN');
    const [isGenerating, setIsGenerating] = useState(false);
    const [results, setResults] = useState<{
        generated: { slug: string; name: string; fieldsCount: number; categoriesCount: number }[];
        failed: { slug: string; name: string; error: string }[];
    } | null>(null);

    const totalModules = BULK_INDUSTRY_CONFIGS
        .filter(i => selectedIndustries.includes(i.id))
        .reduce((acc, i) => acc + i.modules.length, 0);

    const toggleIndustry = (industryId: string) => {
        setSelectedIndustries(prev =>
            prev.includes(industryId)
                ? prev.filter(id => id !== industryId)
                : [...prev, industryId]
        );
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        setResults(null);

        try {
            const result = await bulkGenerateModulesAction(
                { industryIds: selectedIndustries, countryCode },
                'admin'
            );

            setResults({
                generated: result.generated,
                failed: result.failed,
            });

            if (result.generated.length > 0) {
                toast.success(`Generated ${result.generated.length} modules!`);
            }
            if (result.failed.length > 0) {
                toast.warning(`${result.failed.length} modules failed`);
            }
        } catch (error) {
            console.error('Generation error:', error);
            toast.error('Generation failed');
            setResults({
                generated: [],
                failed: [{ slug: 'error', name: 'Error', error: String(error) }],
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleClose = () => {
        if (results?.generated.length) {
            onComplete();
        }
        setResults(null);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        Generate Modules with AI
                    </DialogTitle>
                    <DialogDescription>
                        AI will create module schemas for each selected industry.
                    </DialogDescription>
                </DialogHeader>

                {/* Info Banner */}
                <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl flex items-start gap-3">
                    <Brain className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
                    <div className="text-sm text-indigo-700">
                        <p className="font-medium text-indigo-800">How this works:</p>
                        <p>Each module gets 8-12 fields, 5-7 categories, and sample items.</p>
                    </div>
                </div>

                {!isGenerating && !results && (
                    <>
                        {/* Industry Selection */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium">Select Industries</label>
                            <div className="grid gap-2 max-h-64 overflow-y-auto pr-2">
                                {BULK_INDUSTRY_CONFIGS.map(industry => (
                                    <label
                                        key={industry.id}
                                        className={cn(
                                            "flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all",
                                            selectedIndustries.includes(industry.id)
                                                ? "border-indigo-300 bg-indigo-50/50"
                                                : "border-slate-200 hover:border-slate-300"
                                        )}
                                    >
                                        <Checkbox
                                            checked={selectedIndustries.includes(industry.id)}
                                            onCheckedChange={() => toggleIndustry(industry.id)}
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span>{industry.icon}</span>
                                                <span className="font-medium">{industry.name}</span>
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1">
                                                {industry.modules.map(m => m.name).join(' • ')}
                                            </div>
                                        </div>
                                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                            {industry.modules.length}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Country */}
                        <div className="flex items-center gap-4 pt-2">
                            <div className="flex-1">
                                <label className="text-sm font-medium">Target Market</label>
                                <Select value={countryCode} onValueChange={setCountryCode}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="IN">🇮🇳 India (INR)</SelectItem>
                                        <SelectItem value="US">🇺🇸 USA (USD)</SelectItem>
                                        <SelectItem value="GB">🇬🇧 UK (GBP)</SelectItem>
                                        <SelectItem value="AE">🇦🇪 UAE (AED)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="text-right pt-6">
                                <div className="text-2xl font-bold text-indigo-600">{totalModules}</div>
                                <div className="text-xs text-slate-500">modules</div>
                            </div>
                        </div>

                        <DialogFooter className="gap-2 pt-4">
                            <Button variant="outline" onClick={handleClose}>Cancel</Button>
                            <Button
                                onClick={handleGenerate}
                                disabled={totalModules === 0}
                                className="bg-gradient-to-r from-indigo-600 to-purple-600"
                            >
                                <Sparkles className="h-4 w-4 mr-2" />
                                Generate {totalModules} Modules
                            </Button>
                        </DialogFooter>
                    </>
                )}

                {isGenerating && (
                    <div className="py-12 flex flex-col items-center gap-4">
                        <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
                        <div className="text-center">
                            <p className="font-medium">Generating modules...</p>
                            <p className="text-sm text-slate-500">This may take 1-2 minutes</p>
                        </div>
                    </div>
                )}

                {results && (
                    <div className="space-y-4">
                        {results.generated.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
                                    <Check className="h-4 w-4" />
                                    Generated ({results.generated.length})
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {results.generated.map(m => (
                                        <div key={m.slug} className="text-sm bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                                            <div className="font-medium text-emerald-800">{m.name}</div>
                                            <div className="text-xs text-emerald-600">
                                                {m.fieldsCount} fields • {m.categoriesCount} categories
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {results.failed.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-red-600 text-sm font-medium">
                                    <AlertCircle className="h-4 w-4" />
                                    Failed ({results.failed.length})
                                </div>
                                {results.failed.map(m => (
                                    <div key={m.slug} className="text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-700">
                                        {m.name}: {m.error}
                                    </div>
                                ))}
                            </div>
                        )}

                        <DialogFooter>
                            <Button onClick={handleClose} className="w-full">
                                {results.generated.length > 0 ? 'Done - View Modules' : 'Close'}
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
