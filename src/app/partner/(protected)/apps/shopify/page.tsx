'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { useShopifyIntegration } from '@/hooks/use-shopify';
import { usePartnerModules, useAvailableModules } from '@/hooks/use-modules';
import {
    initiateShopifyOAuth,
    getShopifyCounts,
    linkShopifyModule,
    syncShopifyProducts,
    syncShopifyCustomers,
    syncShopifyOrders,
    disconnectShopify,
    updateShopifySyncSettings,
} from '@/actions/shopify-actions';
import { enablePartnerModuleAction } from '@/actions/modules-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    CheckCircle2,
    XCircle,
    Loader2,
    AlertCircle,
    ArrowLeft,
    ShoppingBag,
    Package,
    Users,
    FileText,
    RefreshCw,
    ExternalLink,
    Shield,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ShopifyIntegrationPage() {
    const { currentWorkspace, loading: authLoading } = useMultiWorkspaceAuth();
    const partnerId = currentWorkspace?.partnerId || null;

    const { config, loading: configLoading } = useShopifyIntegration(partnerId);
    const { modules: partnerModules, isLoading: modulesLoading } = usePartnerModules(partnerId || '');
    const { modules: availableModules } = useAvailableModules(partnerId || '');

    const searchParams = useSearchParams();

    const [shopDomain, setShopDomain] = useState('');
    const [connecting, setConnecting] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);
    const [counts, setCounts] = useState<{ products: number; customers: number; orders: number } | null>(null);
    const [countsLoading, setCountsLoading] = useState(false);
    const [selectedModuleId, setSelectedModuleId] = useState<string>('');
    const [linkingModule, setLinkingModule] = useState(false);

    useEffect(() => {
        const connected = searchParams.get('connected');
        const error = searchParams.get('error');

        if (connected === 'true') {
            toast.success('Shopify connected successfully!');
        }
        if (error) {
            toast.error(error);
        }
    }, [searchParams]);

    useEffect(() => {
        if (config && config.status === 'connected' && !config.linkedModuleId && partnerId) {
            setCountsLoading(true);
            getShopifyCounts(partnerId)
                .then(result => {
                    if (result.success) {
                        setCounts({ products: result.products, customers: result.customers, orders: result.orders });
                    }
                })
                .finally(() => setCountsLoading(false));
        }
    }, [config, partnerId]);

    const handleConnect = async () => {
        if (!partnerId) return;

        const domain = shopDomain.trim().toLowerCase();
        if (!domain) {
            toast.error('Please enter your Shopify store URL');
            return;
        }

        const normalizedDomain = domain.includes('.myshopify.com')
            ? domain
            : `${domain}.myshopify.com`;

        setConnecting(true);
        try {
            const result = await initiateShopifyOAuth(partnerId, normalizedDomain);
            if (result.success && result.authUrl) {
                window.location.href = result.authUrl;
            } else {
                toast.error(result.message);
                setConnecting(false);
            }
        } catch (err: any) {
            toast.error(err.message);
            setConnecting(false);
        }
    };

    const handleLinkModule = async () => {
        if (!partnerId || !selectedModuleId) return;

        setLinkingModule(true);
        try {
            let moduleId = selectedModuleId;
            let moduleSlug = '';

            if (selectedModuleId === '__create_new__') {
                const productModule = availableModules.find(m =>
                    m.slug.includes('product') || m.slug.includes('catalog') || m.slug.includes('inventory')
                );

                if (productModule) {
                    const enableResult = await enablePartnerModuleAction(partnerId, productModule.slug);
                    if (enableResult.success && enableResult.data) {
                        moduleId = enableResult.data.moduleId;
                        moduleSlug = productModule.slug;
                    } else {
                        toast.error(enableResult.error || 'Failed to create module');
                        setLinkingModule(false);
                        return;
                    }
                } else {
                    toast.error('No suitable product module template found');
                    setLinkingModule(false);
                    return;
                }
            } else {
                const mod = partnerModules.find(m => m.id === moduleId);
                moduleSlug = mod?.moduleSlug || '';
            }

            const result = await linkShopifyModule(partnerId, moduleId, moduleSlug);
            if (result.success) {
                toast.success('Module linked successfully');
            } else {
                toast.error(result.message);
            }
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLinkingModule(false);
        }
    };

    const handleImportAll = async () => {
        if (!partnerId) return;

        setSyncing(true);
        try {
            const [productsResult, customersResult, ordersResult] = await Promise.all([
                config?.syncConfig.products.enabled ? syncShopifyProducts(partnerId) : Promise.resolve(null),
                config?.syncConfig.customers.enabled ? syncShopifyCustomers(partnerId) : Promise.resolve(null),
                config?.syncConfig.orders.enabled ? syncShopifyOrders(partnerId) : Promise.resolve(null),
            ]);

            const messages: string[] = [];
            if (productsResult?.success) messages.push(productsResult.message);
            if (customersResult?.success) messages.push(customersResult.message);
            if (ordersResult?.success) messages.push(ordersResult.message);

            if (messages.length > 0) {
                toast.success(messages.join('. '));
            }

            const errors: string[] = [];
            if (productsResult && !productsResult.success) errors.push(`Products: ${productsResult.message}`);
            if (customersResult && !customersResult.success) errors.push(`Customers: ${customersResult.message}`);
            if (ordersResult && !ordersResult.success) errors.push(`Orders: ${ordersResult.message}`);

            if (errors.length > 0) {
                toast.error(errors.join('. '));
            }
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSyncing(false);
        }
    };

    const handleDisconnect = async () => {
        if (!partnerId) return;

        setDisconnecting(true);
        try {
            const result = await disconnectShopify(partnerId);
            if (result.success) {
                toast.success(result.message);
                setShowDisconnectDialog(false);
            } else {
                toast.error(result.message);
            }
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setDisconnecting(false);
        }
    };

    const handleSyncToggle = async (type: 'products' | 'customers' | 'orders', enabled: boolean) => {
        if (!partnerId) return;
        const result = await updateShopifySyncSettings(partnerId, { [type]: enabled });
        if (!result.success) {
            toast.error(result.message);
        }
    };

    if (authLoading || configLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    const isConnected = config?.status === 'connected' || config?.status === 'syncing';
    const needsModuleLink = isConnected && !config?.linkedModuleId;
    const isReady = isConnected && config?.linkedModuleId;

    return (
        <div className="container max-w-4xl py-8">
            <div className="mb-8">
                <Link
                    href="/partner/apps"
                    className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to Integrations
                </Link>
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold">Shopify Integration</h1>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <ShoppingBag className="w-3 h-3 mr-1" />
                        E-Commerce
                    </Badge>
                </div>
                <p className="text-gray-600">
                    Sync products, customers, and orders from your Shopify store to Pingbox
                </p>
            </div>

            {!config && (
                <>
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5" />
                                Connect Your Shopify Store
                            </CardTitle>
                            <CardDescription>
                                Sync products, customers, and orders to Pingbox automatically.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <div className="flex gap-3">
                                    <Input
                                        placeholder="mystore.myshopify.com"
                                        value={shopDomain}
                                        onChange={(e) => setShopDomain(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                                        disabled={connecting}
                                        className="flex-1"
                                    />
                                    <Button
                                        onClick={handleConnect}
                                        disabled={connecting || !shopDomain.trim()}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        {connecting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Connecting...
                                            </>
                                        ) : (
                                            'Connect Shopify Store'
                                        )}
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <span className="text-green-600 font-semibold">1</span>
                                        </div>
                                        <div>
                                            <h4 className="font-medium">Enter store URL</h4>
                                            <p className="text-sm text-gray-600">Your myshopify.com domain</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <span className="text-green-600 font-semibold">2</span>
                                        </div>
                                        <div>
                                            <h4 className="font-medium">Authorize Pingbox</h4>
                                            <p className="text-sm text-gray-600">Grant read access in Shopify</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <span className="text-green-600 font-semibold">3</span>
                                        </div>
                                        <div>
                                            <h4 className="font-medium">Data syncs automatically</h4>
                                            <p className="text-sm text-gray-600">Products, customers & orders</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="w-5 h-5" />
                                What We Access
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium">Products & Inventory</h4>
                                        <p className="text-sm text-gray-600">Read-only access to your product catalog and stock levels</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium">Customers</h4>
                                        <p className="text-sm text-gray-600">Read-only access to customer records</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium">Orders (last 60 days)</h4>
                                        <p className="text-sm text-gray-600">Read-only access to recent order history</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium text-gray-500">Payment info</h4>
                                        <p className="text-sm text-gray-500">Not accessed — we never see payment details</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium text-gray-500">Store settings</h4>
                                        <p className="text-sm text-gray-500">Not accessed — your store config stays private</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}

            {needsModuleLink && (
                <>
                    <Card className="mb-6 border-green-200 bg-green-50">
                        <CardHeader>
                            <CardTitle className="text-green-900">
                                Connected to {config.shopName}
                            </CardTitle>
                            <CardDescription className="text-green-700">
                                {config.shopDomain}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {countsLoading ? (
                                <div className="flex items-center gap-2 text-green-700">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Fetching store data...
                                </div>
                            ) : counts ? (
                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    <div className="p-4 bg-white rounded-lg border border-green-200 text-center">
                                        <Package className="w-6 h-6 text-green-600 mx-auto mb-1" />
                                        <div className="text-2xl font-bold">{counts.products}</div>
                                        <div className="text-sm text-gray-600">Products</div>
                                    </div>
                                    <div className="p-4 bg-white rounded-lg border border-green-200 text-center">
                                        <Users className="w-6 h-6 text-green-600 mx-auto mb-1" />
                                        <div className="text-2xl font-bold">{counts.customers}</div>
                                        <div className="text-sm text-gray-600">Customers</div>
                                    </div>
                                    <div className="p-4 bg-white rounded-lg border border-green-200 text-center">
                                        <FileText className="w-6 h-6 text-green-600 mx-auto mb-1" />
                                        <div className="text-2xl font-bold">{counts.orders}</div>
                                        <div className="text-sm text-gray-600">Orders (60 days)</div>
                                    </div>
                                </div>
                            ) : null}

                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-medium mb-2 text-green-900">
                                        Where should we import your products?
                                    </h4>
                                    <div className="flex gap-3">
                                        <Select value={selectedModuleId} onValueChange={setSelectedModuleId}>
                                            <SelectTrigger className="flex-1 bg-white">
                                                <SelectValue placeholder="Select Module" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {partnerModules.map(mod => (
                                                    <SelectItem key={mod.id} value={mod.id}>
                                                        {mod.name}
                                                    </SelectItem>
                                                ))}
                                                <SelectItem value="__create_new__">
                                                    + Create New Module
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            onClick={handleLinkModule}
                                            disabled={!selectedModuleId || linkingModule}
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            {linkingModule ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                'Link Module'
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}

            {isReady && (
                <>
                    <Card className="mb-6">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                        Shopify Connected
                                    </CardTitle>
                                    <CardDescription>{config.shopDomain}</CardDescription>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                    onClick={() => setShowDisconnectDialog(true)}
                                >
                                    Disconnect
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="p-4 bg-gray-50 rounded-lg text-center">
                                    <Package className="w-6 h-6 text-green-600 mx-auto mb-1" />
                                    <div className="text-2xl font-bold">
                                        {config.syncConfig.products.itemsSynced}
                                    </div>
                                    <div className="text-sm text-gray-600">Products synced</div>
                                    {config.syncConfig.products.status === 'success' && (
                                        <Badge className="mt-1 bg-green-100 text-green-700">Active</Badge>
                                    )}
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg text-center">
                                    <Users className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                                    <div className="text-2xl font-bold">
                                        {config.syncConfig.customers.itemsSynced}
                                    </div>
                                    <div className="text-sm text-gray-600">Customers</div>
                                    {config.syncConfig.customers.status === 'success' && (
                                        <Badge className="mt-1 bg-green-100 text-green-700">Active</Badge>
                                    )}
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg text-center">
                                    <FileText className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                                    <div className="text-2xl font-bold">
                                        {config.syncConfig.orders.itemsSynced}
                                    </div>
                                    <div className="text-sm text-gray-600">Orders</div>
                                    {config.syncConfig.orders.status === 'success' && (
                                        <Badge className="mt-1 bg-green-100 text-green-700">Active</Badge>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                                <span>
                                    Last synced: {config.lastSyncAt
                                        ? new Date(config.lastSyncAt).toLocaleString()
                                        : 'Never'}
                                </span>
                                <span>
                                    Linked Module: {config.linkedModuleSlug}
                                </span>
                            </div>

                            <div className="flex gap-3">
                                {config.linkedModuleSlug && (
                                    <Button asChild variant="outline" size="sm">
                                        <Link href={`/partner/modules/${config.linkedModuleSlug}`}>
                                            <Package className="w-4 h-4 mr-2" />
                                            View Products
                                        </Link>
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleImportAll}
                                    disabled={syncing}
                                >
                                    {syncing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Syncing...
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="w-4 h-4 mr-2" />
                                            Sync Now
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Sync Settings</CardTitle>
                            <CardDescription>
                                Configure what data syncs from Shopify to Pingbox
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Package className="w-5 h-5 text-green-600" />
                                        <div>
                                            <div className="font-medium">Products</div>
                                            <div className="text-sm text-gray-500">Sync products & inventory</div>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={config.syncConfig.products.enabled}
                                        onCheckedChange={(checked) => handleSyncToggle('products', checked)}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Users className="w-5 h-5 text-blue-600" />
                                        <div>
                                            <div className="font-medium">Customers</div>
                                            <div className="text-sm text-gray-500">Sync customer records to contacts</div>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={config.syncConfig.customers.enabled}
                                        onCheckedChange={(checked) => handleSyncToggle('customers', checked)}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-purple-600" />
                                        <div>
                                            <div className="font-medium">Orders</div>
                                            <div className="text-sm text-gray-500">Sync orders as contact activity</div>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={config.syncConfig.orders.enabled}
                                        onCheckedChange={(checked) => handleSyncToggle('orders', checked)}
                                    />
                                </div>

                                <div className="pt-4 border-t">
                                    <div className="text-sm text-gray-500">
                                        Sync direction: Shopify → Pingbox (one-way)
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {config.error && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Sync Error</AlertTitle>
                            <AlertDescription>{config.error}</AlertDescription>
                        </Alert>
                    )}
                </>
            )}

            <Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Disconnect Shopify?</DialogTitle>
                        <DialogDescription>
                            This will remove the connection to {config?.shopDomain}. Your synced
                            products and contacts will be kept as local data.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDisconnectDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDisconnect}
                            disabled={disconnecting}
                        >
                            {disconnecting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Disconnecting...
                                </>
                            ) : (
                                <>
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Disconnect
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
