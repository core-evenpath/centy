'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { getRegisteredBlocksAction } from '@/actions/block-builder-actions';
import RelayBlockExplorer from '../RelayBlockExplorer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowLeft, Layers, Loader2 } from 'lucide-react';

// ── Partner → Relay → Blocks ─────────────────────────────────────────
//
// Dedicated page for the block-configuration explorer. Moved out of
// /partner/relay Tabs so it has room to breathe.

export default function PartnerRelayBlocksPage() {
    const { currentWorkspace, loading: authLoading } = useMultiWorkspaceAuth();
    const partnerId = currentWorkspace?.partnerId;

    const [blocksLoading, setBlocksLoading] = useState(false);
    const [blocksError, setBlocksError] = useState<string | null>(null);
    const [blocksCategory, setBlocksCategory] = useState<string | null>(null);

    useEffect(() => {
        if (!partnerId) return;
        setBlocksLoading(true);
        setBlocksError(null);
        (async () => {
            try {
                const result = await getRegisteredBlocksAction({ partnerId });
                if (result.success) {
                    setBlocksCategory(result.category || null);
                } else {
                    setBlocksError(result.error || 'Failed to load blocks');
                }
            } catch (e: any) {
                setBlocksError(e.message || 'Unknown error');
            } finally {
                setBlocksLoading(false);
            }
        })();
    }, [partnerId]);

    if (authLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!partnerId) {
        return (
            <div className="container mx-auto py-16 text-center">
                <p className="text-muted-foreground">No workspace selected.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-6 max-w-4xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Layers className="h-6 w-6" /> Block Configurations
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Block types the AI assistant can use when responding to visitors.
                    </p>
                </div>
                <Button asChild variant="outline" size="sm">
                    <Link href="/partner/relay">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Relay
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>
                        Available Blocks
                        {blocksCategory && (
                            <Badge variant="secondary" className="ml-2 font-normal text-xs">
                                {blocksCategory}
                            </Badge>
                        )}
                    </CardTitle>
                    <CardDescription>
                        {blocksCategory
                            ? `Blocks available for your business category (${blocksCategory}). Toggle individual blocks to enable or disable them.`
                            : 'Browse every block design available to the assistant. Toggle blocks to enable or disable them for your widget.'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {blocksLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : blocksError ? (
                        <div className="text-center py-12">
                            <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
                            <p className="font-medium">Failed to load block configs</p>
                            <p className="text-sm text-muted-foreground mt-1">{blocksError}</p>
                        </div>
                    ) : (
                        <RelayBlockExplorer
                            partnerId={partnerId}
                            defaultFunctionId={blocksCategory}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
