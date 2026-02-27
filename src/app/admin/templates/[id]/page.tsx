import { TemplateBuilder } from '@/components/admin/templates/TemplateBuilder';
import { getSystemTemplatesAction } from '@/actions/template-actions';
import { notFound } from 'next/navigation';

interface PageProps {
    params: {
        id: string;
    }
}

export default async function EditTemplatePage({ params }: PageProps) {
    // In a real app we'd have a getById action, but for now we filter the list or add a specific get action.
    // Let's add a quick fetcher to template-actions or just filter here if list is small. 
    // Actually, I should have added getSystemTemplateByIdAction.
    // For now, let's assume I can get it. I'll fetch all and find. 
    // OPTIMIZATION: I should add getSystemTemplateByIdAction later.
    const { data: templates } = await getSystemTemplatesAction();
    const template = templates?.find(t => t.id === params.id);

    if (!template) {
        notFound();
    }

    return (
        <div className="container mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Edit Template</h1>
                <p className="text-muted-foreground mt-2">
                    Update the template design.
                </p>
            </div>
            <TemplateBuilder initialData={template} />
        </div>
    );
}
