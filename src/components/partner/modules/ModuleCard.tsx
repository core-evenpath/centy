'use client';

import Link from 'next/link';
import { PartnerModule, SystemModule } from '@/lib/modules/types';
import { MODULE_ICONS, MODULE_COLORS } from '@/lib/modules/constants';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModuleCardProps {
    module: PartnerModule | SystemModule;
    variant: 'enabled' | 'available';
    onClick?: () => void;
}

export function ModuleCard({ module, variant, onClick }: ModuleCardProps) {
    // Determine if it's a SystemModule or PartnerModule based on properties
    const isPartnerModule = (m: any): m is PartnerModule => 'moduleSlug' in m;

    const slug = isPartnerModule(module) ? module.moduleSlug : module.slug;
    const name = module.name;
    const description = isPartnerModule(module) ? `${module.itemCount} items` : module.description;

    const Icon = MODULE_ICONS[slug] || MODULE_ICONS.default;
    const colors = MODULE_COLORS[slug] || MODULE_COLORS.default;

    return (
        <Card
            className={cn(
                "flex h-full flex-col overflow-hidden transition-all hover:shadow-md cursor-pointer",
                variant === 'available' && "hover:border-primary/50"
            )}
            onClick={onClick}
        >
            <CardHeader className={cn("border-b pb-4", colors.bg)}>
                <div className="flex items-start justify-between">
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg border bg-white shadow-sm", colors.border)}>
                        <Icon className={cn("h-6 w-6", colors.text)} />
                    </div>
                    {isPartnerModule(module) && module.upgradeAvailable && (
                        <Badge variant="destructive" className="animate-pulse">
                            Update Available
                        </Badge>
                    )}
                </div>
                <CardTitle className="mt-4 text-xl">{name}</CardTitle>
                <CardDescription className="line-clamp-2">{description}</CardDescription>
            </CardHeader>

            {variant === 'enabled' && isPartnerModule(module) && (
                <CardContent className="flex-1 pt-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex flex-col">
                            <span className="text-muted-foreground">Items</span>
                            <span className="font-medium">{module.itemCount}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-muted-foreground">Active</span>
                            <span className="font-medium">{module.activeItemCount}</span>
                        </div>
                    </div>
                </CardContent>
            )}

            {variant === 'available' && !isPartnerModule(module) && (
                <CardContent className="flex-1 pt-4 text-sm text-muted-foreground">
                    Click to enable this module for your business.
                </CardContent>
            )}

            <CardFooter className="border-t bg-muted/20 p-4">
                {variant === 'enabled' && (
                    <Button variant="default" size="sm" asChild className="w-full">
                        <Link href={`/partner/relay/modules/${slug}`}>
                            Manage Items
                            <ArrowRight className="ml-2 h-3.5 w-3.5" />
                        </Link>
                    </Button>
                )}
                {variant === 'available' && (
                    <Button variant="outline" size="sm" className="w-full pointer-events-none">
                        Enable Module
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
