'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Wand2 } from 'lucide-react';
import { BusinessCategoriesModal } from '@/components/partner/settings/BusinessCategoriesModal';
import { generateIndustryTemplatesAction } from '@/actions/template-generator-actions';
import { toast } from 'sonner';
import { SelectedBusinessCategory } from '@/lib/business-taxonomy/types';
import { useRouter } from 'next/navigation';

export function AITemplateGenerator() {
    const [isOpen, setIsOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const router = useRouter();

    const handleGenerate = async (categories: SelectedBusinessCategory[]) => {
        if (!categories.length) return;
        const industryId = categories[0].industryId;

        setIsGenerating(true);
        setIsOpen(false); // Close dialog immediately or keep open with loading state? Better to show global loading or toast.

        const toastId = toast.loading('Generating templates with AI...');

        try {
            const result = await generateIndustryTemplatesAction(industryId);
            if (result.success) {
                toast.success(`Successfully generated ${result.count} templates!`, { id: toastId });
                router.refresh();
            } else {
                toast.error(`Generation failed: ${result.error}`, { id: toastId });
            }
        } catch (error) {
            toast.error('An unexpected error occurred.', { id: toastId });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <>
            <Button onClick={() => setIsOpen(true)} disabled={isGenerating} variant="secondary">
                <Wand2 className="mr-2 h-4 w-4" />
                {isGenerating ? 'Generating...' : 'AI Generate Library'}
            </Button>

            <BusinessCategoriesModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                onSave={(categories) => handleGenerate(categories)}
                initialSelections={[]}
            />
        </>
    );
}
