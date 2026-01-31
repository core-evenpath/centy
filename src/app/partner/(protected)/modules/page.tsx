import { ModulesDashboard } from '@/components/partner/modules/ModulesDashboard';
import { Separator } from '@/components/ui/separator';

export default function PartnerModulesPage() {
    return (
        <div className="container mx-auto py-8">
            <div className="flex flex-col gap-2 mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Business Modules</h1>
                <p className="text-muted-foreground">
                    Tools and managers tailored for your specific business needs.
                </p>
            </div>
            <Separator className="mb-8" />
            <ModulesDashboard />
        </div>
    );
}
