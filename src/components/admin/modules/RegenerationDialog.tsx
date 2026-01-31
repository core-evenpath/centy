'use client';

import { useState } from 'react';
import { generateModuleSchemaWithAI } from '@/actions/module-ai-actions';
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
        functionName: '',
        countryCode: 'IN',
        prompt: '',
    });

    const handleGenerate = async () => {
        if (!params.industryName || !params.functionName) {
            toast.error('Industry and Business Type are required');
            return;
        }

        setIsGenerating(true);
        try {
            const result = await generateModuleSchemaWithAI({
                moduleSlug,
                industryId: params.industryName.toLowerCase().replace(/\s+/g, '_'),
                functionId: params.functionName.toLowerCase().replace(/\s+/g, '_'),
                industryName: params.industryName,
                functionName: params.functionName,
                countryCode: params.countryCode,
                existingSchema: currentSchema,
                enhancementPrompt: params.prompt,
            });

            if (result.success && result.schema) {
                onApply(result);
                setIsOpen(false);
                setParams({ ...params, prompt: '' }); // Reset prompt but keep context
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
                            <Label>Business Type</Label>
                            <Input
                                placeholder="e.g. Dental Clinic"
                                value={params.functionName}
                                onChange={e => setParams({ ...params, functionName: e.target.value })}
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
                        <Label>Additional Requirements (Prompt)</Label>
                        <Textarea
                            placeholder="e.g. Make sure to include fields for insurance details and follow-up appointment tracking."
                            value={params.prompt}
                            onChange={e => setParams({ ...params, prompt: e.target.value })}
                            rows={3}
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
