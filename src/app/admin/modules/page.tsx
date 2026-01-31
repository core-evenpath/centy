import { ModulesList } from '@/components/admin/modules/ModulesList';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default function ModulesPage() {
    return (
        <div className="container mx-auto py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">System Modules</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage reusable business data templates
                    </p>
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" asChild>
                        <Link href="/admin/modules/assignments">
                            Manage Assignments
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/admin/modules/new">
                            <Plus className="mr-2 h-4 w-4" />
                            New Module
                        </Link>
                    </Button>
                </div>
            </div>

            <ModulesList />
        </div>
    );
}
