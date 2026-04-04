import AdminHeader from '@/components/admin/AdminHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Zap, Plus, Package, Eye, GitBranch } from 'lucide-react';
import { BackfillButton } from './BackfillButton';
import { getRelayBlockConfigsWithModulesAction } from '@/actions/relay-actions';

export default async function RelayBlocksPage() {
    const result = await getRelayBlockConfigsWithModulesAction();
    const configs = result.success ? result.configs : [];

    return (
        <div>
            <AdminHeader
                title="Relay Blocks"
                subtitle="Block definitions from the code registry (@/lib/relay/blocks/)"
                actions={
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/relay/flows">
                                <GitBranch className="mr-2 h-4 w-4" />
                                Flow Templates
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/admin/relay/blocks">
                                <Eye className="mr-2 h-4 w-4" />
                                Block Gallery
                            </Link>
                        </Button>
                        <BackfillButton />
                    </div>
                }
            />

            <div className="container mx-auto py-8 px-6">
                {configs.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                            <Zap className="h-12 w-12 text-muted-foreground mb-4" />
                            <h2 className="text-xl font-semibold mb-2">Relay Block Registry</h2>
                            <p className="text-muted-foreground mb-6 max-w-md">
                                No blocks found in the code registry. Add block definitions in @/lib/relay/blocks/.
                            </p>
                            <Button asChild>
                                <Link href="/admin/modules/new">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Modules
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {configs.map(config => (
                            <Card key={config.id}>
                                <CardContent className="p-5">
                                    <div className="flex items-start gap-3">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 flex-shrink-0">
                                            <Package className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold truncate">{config.label}</h3>
                                            <p className="text-sm text-muted-foreground mt-0.5">
                                                Type: {config.blockType}
                                            </p>
                                            {(config.applicableIndustries?.length ?? 0) > 0 && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Categories: {(config.applicableIndustries || []).join(', ')}
                                                </p>
                                            )}
                                        </div>
                                        <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-100 text-green-700">
                                            {config.status}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {configs.length > 0 && (
                    <Card className="mt-6">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div>
                                        <div className="text-2xl font-bold">{configs.length}</div>
                                        <div className="text-sm text-muted-foreground">Block Configs</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold">{new Set(configs.map(c => c.blockType)).size}</div>
                                        <div className="text-sm text-muted-foreground">Block Types</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold">
                                            {new Set(configs.flatMap(c => c.applicableIndustries || [])).size}
                                        </div>
                                        <div className="text-sm text-muted-foreground">Categories Covered</div>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href="/admin/relay/blocks">
                                        View Full Gallery →
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
