'use client';

import { useState } from 'react';
import { SchemaBuilder } from '@/components/admin/modules/SchemaBuilder';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useSystemModule } from '@/hooks/use-modules';
import { publishNewSchemaVersionAction } from '@/actions/modules-actions';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { ModuleSchema } from '@/lib/modules/types';
import { notFound } from 'next/navigation';

interface PageProps {
    params: {
        id: string;
    };
}

export default function SchemaPage({ params }: PageProps) {
    const { module, isLoading, error } = useSystemModule(params.id);
    const [isSaving, setIsSaving] = useState(false);

    if (isLoading) {
        return (
            <div className="container mx-auto py-8 text-center">
                <Skeleton className="h-10 w-1/3 mb-8" />
                <Skeleton className="h-[500px] w-full rounded-xl" />
            </div>
        );
    }

    if (error || !module) {
        return <div className="container mx-auto py-8">Error: {error || 'Module not found'}</div>;
    }

    const handleSaveSchema = async (newSchema: ModuleSchema) => {
        if (!confirm('This will publish a NEW VERSION of the schema. Are you sure?')) return;

        setIsSaving(true);
        const result = await publishNewSchemaVersionAction(
            module.id,
            newSchema,
            'manual',
            'Manual update via Schema Builder'
        );

        if (result.success) {
            toast.success(`Version ${result.data?.version} published successfully`);
            // Force reload to get updated version
            window.location.reload();
        } else {
            toast.error(result.error || 'Failed to publish schema');
        }
        setIsSaving(false);
    };

    return (
        <div className="container mx-auto py-8">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <Button variant="ghost" className="mb-2 pl-0 hover:pl-0 hover:bg-transparent" asChild>
                        <Link href="/admin/modules">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Modules
                        </Link>
                    </Button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight">Schema: {module.name}</h1>
                        <div className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                            v{module.currentVersion}
                        </div>
                    </div>
                    <p className="text-muted-foreground mt-2">
                        Status: <span className="capitalize">{module.status}</span> • Fields: {module.schema.fields.length} • Categories: {module.schema.categories.length}
                    </p>
                </div>
            </div>

            <SchemaBuilder
                initialSchema={module.schema}
                onSave={handleSaveSchema}
                isSaving={isSaving}
                moduleSlug={module.slug}
            />
        </div>
    );
}
