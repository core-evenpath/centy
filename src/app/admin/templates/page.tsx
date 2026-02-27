import { getSystemTemplatesAction } from '@/actions/template-actions';
import { TemplateList } from '@/components/admin/templates/TemplateList';
import { CategoryGrid } from '@/components/admin/templates/CategoryGrid';
import { ClearTemplatesButton } from '@/components/admin/templates/ClearTemplatesButton';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Removed unused Table imports as they moved to TemplateList
// import {
//     Table,
//     TableBody,
//     TableCell,
//     TableHead,
//     TableHeader,
//     TableRow,
// } from "@/components/ui/table";
// import { format } from 'date-fns';

export default async function TemplatesPage() {
    const { data: templates = [] } = await getSystemTemplatesAction();

    return (
        <div className="container mx-auto py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Broadcast Templates</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage system-wide message templates for WhatsApp and other channels.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button asChild>
                        <Link href="/admin/templates/new">
                            <Plus className="mr-2 h-4 w-4" />
                            New Template
                        </Link>
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="library" className="w-full">
                <TabsList className="mb-8 flex justify-between w-full bg-transparent p-0 border-b rounded-none h-auto">
                    <div className="flex gap-2">
                        <TabsTrigger
                            value="library"
                            className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none bg-transparent px-4 py-2"
                        >Template Library</TabsTrigger>
                        <TabsTrigger
                            value="generator"
                            className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none bg-transparent px-4 py-2"
                        >AI Generator</TabsTrigger>
                    </div>
                    <div className="pb-2">
                        <ClearTemplatesButton />
                    </div>
                </TabsList>

                <TabsContent value="library">
                    <TemplateList initialTemplates={templates} />
                </TabsContent>

                <TabsContent value="generator">
                    <CategoryGrid />
                </TabsContent>
            </Tabs>
        </div>
    );
}
