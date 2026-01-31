import { ModuleEditor } from '@/components/admin/modules/ModuleEditor';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getSystemModuleAction } from '@/actions/modules-actions';
import { notFound } from 'next/navigation';

interface PageProps {
    params: {
        id: string;
    };
}

export default async function EditModulePage({ params }: PageProps) {
    const result = await getSystemModuleAction(params.id);

    if (!result.success || !result.data) {
        if (result.code === 'NOT_FOUND') {
            notFound();
        }
        return <div>Error loading module</div>;
    }

    const module = result.data;

    return (
        <div className="container mx-auto py-8">
            <div className="mb-8">
                <Button variant="ghost" className="mb-4 pl-0 hover:pl-0 hover:bg-transparent" asChild>
                    <Link href="/admin/modules">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Modules
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold tracking-tight">Edit Module: {module.name}</h1>
                <p className="text-muted-foreground mt-2">
                    Update module configuration and settings
                </p>
            </div>

            <div className="max-w-4xl">
                <ModuleEditor module={module} />
            </div>
        </div>
    );
}
