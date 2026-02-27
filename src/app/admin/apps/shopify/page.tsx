'use client';

import { useState, useEffect } from 'react';
import {
    getAllShopifyIntegrations,
    getShopifyWebhookLogs,
    testShopifyConnection,
    forceDisconnectShopify,
    getShopifyAdminStats,
} from '@/actions/admin-shopify-actions';
import type { AdminShopifyIntegration } from '@/actions/admin-shopify-actions';
import type { ShopifyWebhookLogEntry } from '@/lib/types-shopify';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Loader2,
    ShoppingBag,
    CheckCircle2,
    XCircle,
    AlertCircle,
    RefreshCw,
    Package,
    Users,
    FileText,
    Webhook,
    Search,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminShopifyPage() {
    const [integrations, setIntegrations] = useState<AdminShopifyIntegration[]>([]);
    const [webhookLogs, setWebhookLogs] = useState<(ShopifyWebhookLogEntry & { partnerId: string })[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [testingPartner, setTestingPartner] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [intResult, logsResult, statsResult] = await Promise.all([
                getAllShopifyIntegrations(),
                getShopifyWebhookLogs(undefined, 20),
                getShopifyAdminStats(),
            ]);

            if (intResult.success) setIntegrations(intResult.data);
            if (logsResult.success) setWebhookLogs(logsResult.data);
            if (statsResult.success) setStats(statsResult);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleTestConnection = async (partnerId: string) => {
        setTestingPartner(partnerId);
        try {
            const result = await testShopifyConnection(partnerId);
            if (result.success) {
                toast.success(`Connection healthy: ${result.shopInfo?.name}`);
            } else {
                toast.error(`Connection failed: ${result.message}`);
            }
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setTestingPartner(null);
        }
    };

    const handleForceDisconnect = async (partnerId: string) => {
        if (!confirm('Force disconnect this partner? This cannot be undone.')) return;

        try {
            const result = await forceDisconnectShopify(partnerId);
            if (result.success) {
                toast.success('Force disconnected');
                loadData();
            } else {
                toast.error(result.message);
            }
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const filteredIntegrations = integrations.filter(i => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            i.shopDomain.toLowerCase().includes(q) ||
            i.shopName.toLowerCase().includes(q) ||
            i.partnerId.toLowerCase().includes(q) ||
            (i.partnerName || '').toLowerCase().includes(q)
        );
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'connected':
                return <Badge className="bg-green-100 text-green-700">Connected</Badge>;
            case 'syncing':
                return <Badge className="bg-blue-100 text-blue-700">Syncing</Badge>;
            case 'error':
                return <Badge variant="destructive">Error</Badge>;
            case 'disconnected':
                return <Badge variant="outline">Disconnected</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    const envApiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY_SET ? 'Set' : 'Unknown';

    return (
        <div className="container max-w-6xl py-8">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <ShoppingBag className="w-8 h-8 text-green-600" />
                    <h1 className="text-3xl font-bold">Shopify Admin Debug</h1>
                </div>
                <p className="text-gray-600">View and manage all Shopify integrations across partners</p>
            </div>

            {stats && (
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold">{stats.connectedPartners}</div>
                                <div className="text-xs text-gray-500">Connected Partners</div>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold">{stats.totalProducts}</div>
                                <div className="text-xs text-gray-500">Products Synced</div>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold">{stats.totalCustomers}</div>
                                <div className="text-xs text-gray-500">Customers Synced</div>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold">{stats.totalOrders}</div>
                                <div className="text-xs text-gray-500">Orders Tracked</div>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold">{stats.activeWebhooks}</div>
                                <div className="text-xs text-gray-500">Active Webhooks</div>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold text-red-600">{stats.errorsLast24h}</div>
                                <div className="text-xs text-gray-500">Errors (24h)</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card className="mb-6">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Partner Integrations</CardTitle>
                        <Button variant="outline" size="sm" onClick={loadData}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                            <Input
                                placeholder="Search partner..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {filteredIntegrations.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No Shopify integrations found</p>
                    ) : (
                        <div className="space-y-4">
                            {filteredIntegrations.map((integration) => (
                                <div
                                    key={integration.partnerId}
                                    className="p-4 border rounded-lg"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <div className="font-medium">
                                                {integration.partnerName || integration.shopName}
                                                <span className="text-sm text-gray-400 ml-2">
                                                    ({integration.partnerId})
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                {integration.shopDomain}
                                            </div>
                                        </div>
                                        {getStatusBadge(integration.status)}
                                    </div>

                                    {integration.error && (
                                        <div className="text-sm text-red-600 mb-2">
                                            Error: {integration.error}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                                        <span className="flex items-center gap-1">
                                            <Package className="w-3 h-3" />
                                            {integration.syncConfig?.products?.itemsSynced || 0}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Users className="w-3 h-3" />
                                            {integration.syncConfig?.customers?.itemsSynced || 0}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <FileText className="w-3 h-3" />
                                            {integration.syncConfig?.orders?.itemsSynced || 0}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Webhook className="w-3 h-3" />
                                            {Object.keys(integration.webhookIds || {}).length}/{10} webhooks
                                        </span>
                                        <span>
                                            Last sync: {integration.lastSyncAt
                                                ? new Date(integration.lastSyncAt).toLocaleString()
                                                : 'Never'}
                                        </span>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleTestConnection(integration.partnerId)}
                                            disabled={testingPartner === integration.partnerId}
                                        >
                                            {testingPartner === integration.partnerId ? (
                                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                            ) : (
                                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                            )}
                                            Test Sync
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-red-600 border-red-200 hover:bg-red-50"
                                            onClick={() => handleForceDisconnect(integration.partnerId)}
                                        >
                                            <XCircle className="w-3 h-3 mr-1" />
                                            Force Disconnect
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Recent Webhook Events</CardTitle>
                    <CardDescription>Latest webhook events across all partners</CardDescription>
                </CardHeader>
                <CardContent>
                    {webhookLogs.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">No webhook events yet</p>
                    ) : (
                        <div className="space-y-2">
                            {webhookLogs.map((log, i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm"
                                >
                                    <div className="flex items-center gap-3">
                                        {log.status === 'success' ? (
                                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        ) : (
                                            <XCircle className="w-4 h-4 text-red-500" />
                                        )}
                                        <span className="font-mono">{log.topic}</span>
                                        <span className="text-gray-400">{log.partnerId.slice(0, 8)}...</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {log.error && (
                                            <span className="text-red-500 text-xs">{log.error}</span>
                                        )}
                                        <span className="text-gray-400 text-xs">
                                            {log.processingTimeMs}ms
                                        </span>
                                        <span className="text-gray-400">
                                            {new Date(log.receivedAt).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Environment</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="font-mono">SHOPIFY_API_KEY</span>
                            <Badge variant="outline" className="text-green-600">
                                Server-side only
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="font-mono">SHOPIFY_API_SECRET</span>
                            <Badge variant="outline" className="text-green-600">
                                Server-side only
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="font-mono">Webhook callback</span>
                            <span className="font-mono text-xs text-gray-500">
                                {process.env.NEXT_PUBLIC_APP_URL || 'https://pingbox.io'}/api/webhooks/shopify
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
