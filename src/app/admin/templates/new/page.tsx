import { TemplateBuilder } from '@/components/admin/templates/TemplateBuilder';

export default function NewTemplatePage() {
    return (
        <div className="container mx-auto py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Create New Template</h1>
                <p className="text-muted-foreground mt-2">
                    Design a message template with variables and fast buttons.
                </p>
            </div>
            <TemplateBuilder />
        </div>
    );
}
