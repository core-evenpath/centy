'use client';

import { useState } from 'react';
import { generateModuleSchemaAction } from '@/actions/module-ai-actions';
import { ModuleSchema, ModuleGenerationResult } from '@/lib/modules/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, Wand2 } from 'lucide-react';
import { toast } from 'sonner';

interface RegenerationDialogProps {
    currentSchema: ModuleSchema;
    onApply: (result: ModuleGenerationResult) => void;
    moduleSlug?: string;
}

export function RegenerationDialog({ currentSchema, onApply, moduleSlug }: RegenerationDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const [params, setParams] = useState({
        industryName: '',
        moduleName: '',
        countryCode: 'IN',
        itemLabel: 'Item',
    });

    const handleGenerate = async () => {
        if (!params.industryName || !params.moduleName) {
            toast.error('Industry and Module Name are required');
            return;
        }

        setIsGenerating(true);
        try {
            // Using the new generation action which creates a fresh schema
            const result = await generateModuleSchemaAction(
                params.industryName.toLowerCase().replace(/\s+/g, '_'),
                params.industryName,
                params.moduleName,
                params.itemLabel,
                params.countryCode
            );

            if (result.success && result.schema) {
                // Adapt the result to ModuleGenerationResult expected by parent
                onApply({
                    success: true,
                    schema: result.schema,
                    suggestedItems: result.suggestedItems || [],
                    generatedAt: new Date().toISOString(),
                    model: 'gemini-1.5-flash',
                    promptTokens: 0,
                    completionTokens: 0
                });
                setIsOpen(false);
            } else {
                toast.error(result.error || 'Failed to generate schema');
            }
        } catch (error) {
            console.error('Generation error:', error);
            toast.error('An unexpected error occurred during generation');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate with AI
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Generate Schema with AI</DialogTitle>
                    <DialogDescription>
                        Provide business context to automatically generate relevant fields and categories.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Industry</Label>
                            <Input
                                placeholder="e.g. Healthcare"
                                value={params.industryName}
                                onChange={e => setParams({ ...params, industryName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Module Name / Business Type</Label>
                            <Input
                                placeholder="e.g. Dental Clinic Services"
                                value={params.moduleName}
                                onChange={e => setParams({ ...params, moduleName: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Country/Market Context</Label>
                        <Select value={params.countryCode} onValueChange={c => setParams({ ...params, countryCode: c })}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="IN">India</SelectItem>
                                <SelectItem value="US">United States</SelectItem>
                                <SelectItem value="UK">United Kingdom</SelectItem>
                                <SelectItem value="AE">UAE/Middle East</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Item Label (Singular)</Label>
                        <Input
                            placeholder="e.g. Service or Product"
                            value={params.itemLabel}
                            onChange={e => setParams({ ...params, itemLabel: e.target.value })}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handleGenerate} disabled={isGenerating}>
                        {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isGenerating ? 'Generating...' : 'Generate Schema'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
