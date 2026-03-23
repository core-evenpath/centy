import AdminHeader from '@/components/admin/AdminHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Zap, Plus, Package, Eye } from 'lucide-react';
import { db } from '@/lib/firebase-admin';
import { BackfillButton } from './BackfillButton';

interface RelayBlockConfig {
    id: string;
    blockType: string;
    label: string;
    moduleSlug?: string;
    applicableIndustries: string[];
    status: string;
}

export default async function RelayBlocksPage() {
    let configs: RelayBlockConfig[] = [];

    try {
        const snapshot = await db.collection('relayBlockConfigs').get();
        configs = snapshot.docs.map(doc => ({
            id: doc.id,
            blockType: doc.data().blockType || 'card',
            label: doc.data().label || doc.id,
            moduleSlug: doc.data().moduleSlug || undefined,
            applicableIndustries: doc.data().applicableIndustries || [],
            status: doc.data().status || 'active',
        }));
    } catch {
        // Collection may not exist yet — show empty state
    }

    return (
        <div>
            <AdminHeader
                title="Relay Blocks"
                subtitle="AI response templates for the embeddable chat widget"
                actions={
                    <div className="flex items-center gap-2">
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
                            <h2 className="text-xl font-semibold mb-2">Relay Block Configs</h2>
                            <p className="text-muted-foreground mb-6 max-w-md">
                                Block configs are auto-generated when modules are created via /admin/modules/new
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
                                            {config.moduleSlug && (
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    Module: {config.moduleSlug}
                                                </p>
                                            )}
                                            {config.applicableIndustries.length > 0 && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Industries: {config.applicableIndustries.join(', ')}
                                                </p>
                                            )}
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                            config.status === 'active'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {config.status}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
