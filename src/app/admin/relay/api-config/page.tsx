'use client';

/**
 * Admin: API Integrations
 *
 * Controls which third-party APIs are exposed to partners as data-source
 * options inside Content Studio. Disabling an integration hides it from
 * partners even if their vertical would normally see it.
 *
 * Auth is enforced by the parent /admin layout (AdminAuthWrapper).
 */

import React from 'react';
import {
    ShoppingBag,
    ShoppingCart,
    CreditCard,
    Calendar,
    Plug,
    Loader2,
    Sparkles,
    type LucideIcon,
} from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

import type { ApiIntegrationConfig } from '@/lib/types-content-studio';
import {
    getApiIntegrationsAction,
    seedApiIntegrationsAction,
    toggleApiIntegrationAction,
} from '@/actions/admin-api-config-actions';

const ICON_MAP: Record<string, LucideIcon> = {
    ShoppingBag,
    ShoppingCart,
    CreditCard,
    Calendar,
    Plug,
};

function iconFor(name: string): LucideIcon {
    return ICON_MAP[name] || Plug;
}

function formatApplicable(v: ApiIntegrationConfig['applicableVerticals']): string {
    if (v === 'all') return 'All verticals';
    return v.join(', ');
}

export default function AdminApiConfigPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [configs, setConfigs] = React.useState<ApiIntegrationConfig[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [persisted, setPersisted] = React.useState(false);
    const [seeding, setSeeding] = React.useState(false);
    const [pendingId, setPendingId] = React.useState<string | null>(null);

    const load = React.useCallback(async () => {
        setLoading(true);
        const res = await getApiIntegrationsAction();
        if (res.success && res.configs) {
            setConfigs(res.configs);
            // If any config has a non-epoch updatedAt not equal across all, treat as persisted.
            // Simplest heuristic: look for updatedBy !== 'system'.
            setPersisted(res.configs.some(c => c.updatedBy !== 'system'));
        } else {
            toast({
                title: 'Failed to load integrations',
                description: res.error || 'Unknown error',
                variant: 'destructive',
            });
        }
        setLoading(false);
    }, [toast]);

    React.useEffect(() => {
        void load();
    }, [load]);

    const handleToggle = async (id: string, enabled: boolean) => {
        if (!user?.uid) return;
        setPendingId(id);
        // Optimistic update
        setConfigs(prev => prev.map(c => (c.id === id ? { ...c, enabled } : c)));
        const res = await toggleApiIntegrationAction(id, enabled, user.uid);
        setPendingId(null);
        if (!res.success) {
            toast({
                title: 'Toggle failed',
                description: res.error || 'Unknown error',
                variant: 'destructive',
            });
            // Revert
            setConfigs(prev => prev.map(c => (c.id === id ? { ...c, enabled: !enabled } : c)));
            return;
        }
        setPersisted(true);
    };

    const handleSeed = async () => {
        if (!user?.uid) return;
        setSeeding(true);
        const res = await seedApiIntegrationsAction(user.uid);
        setSeeding(false);
        if (!res.success) {
            toast({
                title: 'Seed failed',
                description: res.error || 'Unknown error',
                variant: 'destructive',
            });
            return;
        }
        toast({ title: 'Seeded default integrations' });
        await load();
    };

    return (
        <div className="container mx-auto py-8">
            <div className="flex items-start justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">API Integrations</h1>
                    <p className="text-muted-foreground mt-2 max-w-2xl">
                        Enable or disable API integrations available to partners. Disabled
                        integrations won&apos;t appear as data source options in Content
                        Studio, even for partners whose vertical would normally see them.
                    </p>
                </div>
                {!persisted && !loading && (
                    <Button onClick={handleSeed} disabled={seeding}>
                        {seeding ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Sparkles className="mr-2 h-4 w-4" />
                        )}
                        Seed defaults
                    </Button>
                )}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Loading integrations…
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {configs.map(cfg => {
                        const Icon = iconFor(cfg.iconName);
                        const isPending = pendingId === cfg.id;
                        return (
                            <Card key={cfg.id} className="relative">
                                <CardHeader>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3 min-w-0">
                                            <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                                <Icon className="h-5 w-5 text-foreground/70" />
                                            </div>
                                            <div className="min-w-0">
                                                <CardTitle className="text-base flex items-center gap-2">
                                                    {cfg.name}
                                                    <Badge variant="secondary" className="capitalize">
                                                        {cfg.category}
                                                    </Badge>
                                                </CardTitle>
                                                <CardDescription className="mt-1">
                                                    {cfg.description}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {isPending && (
                                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                            )}
                                            <Switch
                                                checked={cfg.enabled}
                                                onCheckedChange={v => handleToggle(cfg.id, v)}
                                                disabled={isPending}
                                                aria-label={`Toggle ${cfg.name}`}
                                            />
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="text-xs text-muted-foreground space-y-1">
                                    <div>
                                        <span className="font-medium text-foreground">Applies to:</span>{' '}
                                        {formatApplicable(cfg.applicableVerticals)}
                                    </div>
                                    <div>
                                        <span className="font-medium text-foreground">Required fields:</span>{' '}
                                        {cfg.requiredFields.join(', ')}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
