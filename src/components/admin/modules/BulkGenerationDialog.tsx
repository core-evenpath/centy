
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Check, Loader2, AlertCircle } from 'lucide-react';
import { bulkGenerateModulesAction } from '@/actions/module-ai-actions';
import { DEFAULT_BULK_CONFIG } from '@/lib/modules/constants';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface BulkGenerationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onComplete: () => void;
}

export function BulkGenerationDialog({ open, onOpenChange, onComplete }: BulkGenerationDialogProps) {
    const [selectedIndustries, setSelectedIndustries] = useState<string[]>(
        DEFAULT_BULK_CONFIG.industries.map(i => i.id)
    );
    const [countryCode, setCountryCode] = useState('IN');
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState({ completed: 0, total: 0, current: '' });
    const [results, setResults] = useState<{
        generated: { slug: string; name: string }[];
        failed: { slug: string; name: string; error: string }[];
    } | null>(null);

    const totalPossibleModules = DEFAULT_BULK_CONFIG.industries
        .filter(i => selectedIndustries.includes(i.id))
        .reduce((acc, i) => acc + i.modules.length, 0);

    const handleGenerate = async () => {
        setIsGenerating(true);
        // Since server action doesn't stream progress easily in this setup without complex streaming,
        // we'll simulate progress visually while waiting, or just specific stages. 
        // The server action returns final result.
        // For better UX, we could break it down by industry calls on client side, 
        // but the bulk action handles it efficiently in batch.
        // Let's implement client-side batching here for better progress bars?
        // Actually the requested implementation put logic in server action.
        // So we'll show an indeterminate or estimated progress.

        // NOTE: In a real app we'd stream this. For now let's just await the big promise 
        // and show a "Scanning..." state.

        setProgress({ completed: 0, total: totalPossibleModules, current: 'Initializing AI models...' });

        try {
            const filteredConfig = {
                industryIds: selectedIndustries,
                countryCode,
            };

            const result = await bulkGenerateModulesAction(
                filteredConfig,
                'admin', // userId
                // Progress callback won't work over serializable boundary naturally without specialized setup
            );

            setResults({ generated: result.generated, failed: result.failed });

            if (result.success) {
                toast.success(`Generated ${result.generated.length} modules successfully`);
                setTimeout(() => {
                    onComplete();
                    // Don't auto close immediately so they can see results
                }, 1500);
            } else {
                toast.error('Some modules failed to generate');
            }
        } catch (e) {
            toast.error('Bulk generation failed');
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    const toggleIndustry = (industryId: string) => {
        setSelectedIndustries(prev =>
            prev.includes(industryId)
                ? prev.filter(id => id !== industryId)
                : [...prev, industryId]
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-blue-500" />
                        Generate All Modules with AI
                    </DialogTitle>
                    <DialogDescription>
                        AI will create comprehensive modules for each industry category.
                    </DialogDescription>
                </DialogHeader>

                {!isGenerating && !results && (
                    <>
                        <div className="space-y-4 py-4">
                            <div className="space-y-3">
                                <label className="text-sm font-medium">Select Industries to Generate</label>
                                <div className="grid gap-2 max-h-64 overflow-y-auto">
                                    {DEFAULT_BULK_CONFIG.industries.map(industry => (
                                        <label
                                            key={industry.id}
                                            className={cn(
                                                "flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                                                selectedIndustries.includes(industry.id)
                                                    ? "border-blue-200 bg-blue-50/50"
                                                    : "border-slate-200 hover:border-slate-300"
                                            )}
                                        >
                                            <Checkbox
                                                checked={selectedIndustries.includes(industry.id)}
                                                onCheckedChange={() => toggleIndustry(industry.id)}
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium text-sm">{industry.name}</div>
                                                <div className="text-xs text-muted-foreground mt-0.5">
                                                    {industry.modules.map(m => m.name).join(', ')}
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <label className="text-sm font-medium">Target Market</label>
                                    <Select value={countryCode} onValueChange={setCountryCode}>
                                        <SelectTrigger className="mt-1">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="IN">🇮🇳 India</SelectItem>
                                            <SelectItem value="US">🇺🇸 United States</SelectItem>
                                            <SelectItem value="GB">🇬🇧 United Kingdom</SelectItem>
                                            <SelectItem value="AE">🇦🇪 UAE</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {/* 
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{totalPossibleModules}</div>
                  <div className="text-xs text-muted-foreground">est. modules</div>
                </div>
                */}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleGenerate} disabled={selectedIndustries.length === 0}>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Generate Modules
                            </Button>
                        </DialogFooter>
                    </>
                )}

                {isGenerating && (
                    <div className="py-8 space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Generating modules... this may take a minute</span>
                                {/* <span className="font-medium">{progress.completed} / {progress.total}</span> */}
                            </div>
                            <Progress value={30} className="animate-pulse" />
                            {/* Indeterminate loader since we don't have stream */}

                            <div className="text-sm text-muted-foreground flex items-center justify-center gap-2 mt-4">
                                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                AI is analyzing industries and building schemas...
                            </div>
                        </div>
                    </div>
                )}

                {results && (
                    <div className="py-4 space-y-4">
                        {results.generated.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                                    <Check className="h-4 w-4" />
                                    Generated Successfully ({results.generated.length})
                                </div>
                                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                                    {results.generated.map(m => (
                                        <div key={m.slug} className="text-sm text-muted-foreground bg-green-50 rounded px-2 py-1 truncate">
                                            {m.name}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {results.failed.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm font-medium text-red-600">
                                    <AlertCircle className="h-4 w-4" />
                                    Failed ({results.failed.length})
                                </div>
                                <div className="space-y-1 max-h-40 overflow-y-auto">
                                    {results.failed.map(m => (
                                        <div key={m.slug} className="text-sm text-red-600 bg-red-50 rounded px-2 py-1">
                                            {m.name}: {m.error}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            <Button onClick={() => { onComplete(); onOpenChange(false); }}>
                                Done
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
