'use client';

import { useState } from 'react';
import { SystemTemplate } from '@/lib/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MobilePreview } from '@/components/shared/templates/MobilePreview';
import { instantiateTemplateForPartnerAction } from '@/actions/template-actions';
import { toast } from 'sonner';
import { Loader2, Check, Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PartnerTemplateLibraryProps {
    templates: SystemTemplate[];
    partnerId: string;
    partnerIndustries?: string[];
}

export function PartnerTemplateLibrary({ templates, partnerId, partnerIndustries = [] }: PartnerTemplateLibraryProps) {
    const router = useRouter();
    const [selectedTemplate, setSelectedTemplate] = useState<SystemTemplate | null>(null);
    const [isInstantiating, setIsInstantiating] = useState(false);
    const [filter, setFilter] = useState<'ALL' | 'MARKETING' | 'UTILITY' | 'AUTHENTICATION'>('ALL');

    const filteredTemplates = templates.filter(t => filter === 'ALL' || t.category === filter);

    const handleUseTemplate = async () => {
        if (!selectedTemplate) return;

        setIsInstantiating(true);
        try {
            const result = await instantiateTemplateForPartnerAction(partnerId, selectedTemplate.id);
            if (result.success) {
                toast.success("Template added to your library");
                // Reset selection
                setSelectedTemplate(null);
                // Refresh to show in "My Templates" (if on same page)
                router.refresh();
            } else {
                toast.error(result.error || "Failed to add template");
            }
        } catch (error) {
            console.error(error);
            toast.error("An unexpected error occurred");
        } finally {
            setIsInstantiating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Template Library</h2>
                    <p className="text-muted-foreground">Select a template to use in your campaigns.</p>
                </div>
                <Tabs value={filter} onValueChange={(v: any) => setFilter(v)}>
                    <TabsList>
                        <TabsTrigger value="ALL">All</TabsTrigger>
                        <TabsTrigger value="MARKETING">Marketing</TabsTrigger>
                        <TabsTrigger value="UTILITY">Utility</TabsTrigger>
                        <TabsTrigger value="AUTHENTICATION">Auth</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((template) => (
                    <Card key={template.id} className="flex flex-col cursor-pointer hover:border-primary transition-colors" onClick={() => setSelectedTemplate(template)}>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg">{template.name}</CardTitle>
                                <div className="flex gap-2">
                                    {partnerIndustries.some(id => template.applicableIndustries?.includes(id)) && (
                                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-0">
                                            Recommended
                                        </Badge>
                                    )}
                                    <Badge variant="outline">{template.category}</Badge>
                                </div>
                            </div>
                            <CardDescription className="line-clamp-2">
                                {template.components.find(c => c.type === 'BODY')?.text || "No preview text"}
                            </CardDescription>
                        </CardHeader>
                        <CardFooter className="mt-auto">
                            <Button variant="secondary" className="w-full">Preview & Use</Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {/* Preview Dialog */}
            <Dialog open={!!selectedTemplate} onOpenChange={(open) => !open && setSelectedTemplate(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Preview Template</DialogTitle>
                        <DialogDescription>
                            Review the template content before adding it to your library.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-semibold mb-1">Name</h4>
                                <p className="text-sm text-slate-600">{selectedTemplate?.name}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-1">Category</h4>
                                <Badge>{selectedTemplate?.category}</Badge>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-1">Language</h4>
                                <p className="text-sm text-slate-600">{selectedTemplate?.language}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-1">Variables</h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedTemplate?.variables.map(v => (
                                        <Badge key={v} variant="secondary">{v}</Badge>
                                    ))}
                                    {selectedTemplate?.variables.length === 0 && <span className="text-sm text-muted-foreground">None</span>}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center bg-slate-100 p-6 rounded-lg">
                            {selectedTemplate && (
                                <MobilePreview
                                    components={selectedTemplate.components}
                                    language={selectedTemplate.language}
                                />
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedTemplate(null)}>Cancel</Button>
                        <Button onClick={handleUseTemplate} disabled={isInstantiating}>
                            {isInstantiating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                <>
                                    <Copy className="mr-2 h-4 w-4" />
                                    Use Template
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
