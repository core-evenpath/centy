'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wand2, CheckCircle, Loader2 } from 'lucide-react';
import { getIndustries } from '@/lib/business-taxonomy';
import { generateSystemTemplatesBatchAction } from '@/actions/template-generator-actions';
import { toast } from 'sonner';

export function CategoryGrid() {
    const industries = getIndustries();
    const [generatingId, setGeneratingId] = useState<string | null>(null);

    const handleGenerate = async (industryId: string, industryName: string) => {
        setGeneratingId(industryId);
        try {
            const result = await generateSystemTemplatesBatchAction(industryId, 10);
            if (result.success) {
                toast.success(`Generated ${result.count} templates for ${industryName}`);
            } else {
                toast.error(result.error || "Failed to generate templates");
            }
        } catch (error) {
            console.error(error);
            toast.error("An unexpected error occurred");
        } finally {
            setGeneratingId(null);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {industries.map((industry) => (
                <Card key={industry.industryId} className="flex flex-col">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{industry.name}</CardTitle>
                            {/* Placeholder for "Verified" status if we had that data readily available */}
                            {/* <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Ready</Badge> */}
                        </div>
                        <CardDescription className="line-clamp-2">{industry.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <div className="text-sm text-muted-foreground">
                            <p>Includes:</p>
                            <ul className="list-disc list-inside mt-1">
                                <li>3 Marketing (Offers)</li>
                                <li>5 Utility (Updates)</li>
                                <li>2 Auth (OTP)</li>
                            </ul>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            className="w-full"
                            variant="outline"
                            onClick={() => handleGenerate(industry.industryId, industry.name)}
                            disabled={generatingId === industry.industryId}
                        >
                            {generatingId === industry.industryId ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="mr-2 h-4 w-4" />
                                    Generate Batch (10)
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    );
}
