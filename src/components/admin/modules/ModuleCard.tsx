'use client';

import Link from 'next/link';
import { SystemModule } from '@/lib/modules/types';
import { MODULE_ICONS, MODULE_COLORS } from '@/lib/modules/constants';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { deleteSystemModuleAction } from '@/actions/modules-actions';
import { useState } from 'react';
import { toast } from 'sonner';

interface ModuleCardProps {
    module: SystemModule;
}

export function ModuleCard({ module }: ModuleCardProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const Icon = MODULE_ICONS[module.slug] || MODULE_ICONS.default;
    const colors = MODULE_COLORS[module.slug] || MODULE_COLORS.default;

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!confirm('Are you sure you want to delete this module? This action cannot be undone.')) return;

        setIsDeleting(true);
        const result = await deleteSystemModuleAction(module.id);

        if (result.success) {
            toast.success('Module deleted successfully');
        } else {
            toast.error(result.error || 'Failed to delete module');
            setIsDeleting(false);
        }
    };

    return (
        <Card className="group relative overflow-hidden border border-slate-200/60 bg-white/80 backdrop-blur-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <CardHeader className="pb-3 relative z-10">
                <div className="flex items-start justify-between">
                    <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-transform group-hover:scale-105",
                        "bg-gradient-to-br shadow-sm",
                        colors.border,
                        colors.bg
                    )}>
                        <Icon className={cn("h-6 w-6", colors.text)} />
                    </div>
                    <Badge variant={module.status === 'active' ? 'default' : 'secondary'} className="bg-slate-900/5 text-slate-700 hover:bg-slate-900/10 border-0">
                        v{module.currentVersion}
                    </Badge>
                </div>
                <CardTitle className="mt-4 text-lg font-semibold text-slate-800">{module.name}</CardTitle>
                <CardDescription className="line-clamp-2 text-slate-500">{module.description}</CardDescription>
            </CardHeader>

            <CardContent className="pt-0 relative z-10">
                <div className="flex items-center gap-4 text-sm text-slate-500 mt-2">
                    <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                        <Settings className="h-3.5 w-3.5" />
                        {module.schema.fields.length} fields
                    </span>
                    <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                        <Settings className="h-3.5 w-3.5" />
                        {module.schema.categories.length} cats
                    </span>
                </div>

                <div className="mt-4 flex items-center gap-2 text-sm">
                    <div className="flex -space-x-2">
                        {[...Array(Math.min(3, module.usageCount > 0 ? module.usageCount : 0))].map((_, i) => (
                            <div key={i} className="h-6 w-6 rounded-full bg-slate-200 border-2 border-white" />
                        ))}
                    </div>
                    <span className="text-muted-foreground text-xs ml-1">
                        {module.usageCount} {module.usageCount === 1 ? 'partner' : 'partners'} using
                    </span>
                </div>
            </CardContent>

            <CardFooter className="border-t bg-slate-50/40 px-6 py-3 relative z-10">
                <div className="flex w-full items-center justify-between gap-2">
                    <Button variant="ghost" size="sm" asChild className="flex-1 hover:bg-white hover:shadow-sm">
                        <Link href={`/admin/modules/${module.id}`}>
                            <Settings className="h-4 w-4 mr-2 text-slate-400" />
                            Configure
                        </Link>
                    </Button>
                    <div className="h-4 w-px bg-slate-200" />
                    <Button variant="ghost" size="sm" asChild className="flex-1 hover:bg-white hover:shadow-sm">
                        <Link href={`/admin/modules/${module.id}/schema`}>
                            <Edit className="h-4 w-4 mr-2 text-slate-400" />
                            Schema
                        </Link>
                    </Button>

                    {module.usageCount === 0 && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </CardFooter>
        </Card>
    );
}
