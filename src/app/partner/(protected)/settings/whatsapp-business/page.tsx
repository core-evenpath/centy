'use client';

import { useState, useEffect } from 'react';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import {
    connectMetaWhatsApp,
    activateMetaWhatsApp,
    disconnectMetaWhatsApp,
    getMetaWhatsAppStatus
} from '@/actions/meta-whatsapp-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Loader2, Copy, AlertCircle } from 'lucide-react';
import type { MetaWhatsAppConfig } from '@/lib/types-meta-whatsapp';

export default function WhatsAppBusinessSettingsPage() {
    const { currentWorkspace, loading: authLoading } = useMultiWorkspaceAuth();
    const currentPartnerId = currentWorkspace?.partnerId;

    const [config, setConfig] = useState<Omit<MetaWhatsAppConfig, 'encryptedAccessToken'> | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        phoneNumberId: '',
        wabaId: '',
        accessToken: '',
        displayPhoneNumber: '',
        businessName: '',
    });

    const [verifyToken, setVerifyToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const webhookUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/api/webhooks/meta/whatsapp`
        : '';

    useEffect(() => {
        async function loadStatus() {
            if (!currentPartnerId) return;

            setLoading(true);
            try {
                const status = await getMetaWhatsAppStatus(currentPartnerId);
                setConfig(status.config);

                if (status.config?.verifyToken) {
                    setVerifyToken(status.config.verifyToken);
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        loadStatus();
    }, [currentPartnerId]);

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentPartnerId) return;

        setError(null);
        setSuccess(null);
        setSaving(true);

        try {
            const result = await connectMetaWhatsApp(currentPartnerId, {
                phoneNumberId: formData.phoneNumberId.trim(),
                wabaId: formData.wabaId.trim(),
                accessToken: formData.accessToken.trim(),
                displayPhoneNumber: formData.displayPhoneNumber.trim(),
                businessName: formData.businessName.trim() || undefined,
            });

            if (result.success) {
                setSuccess(result.message);
                setVerifyToken(result.verifyToken || null);
                const status = await getMetaWhatsAppStatus(currentPartnerId);
                setConfig(status.config);
                setFormData(prev => ({ ...prev, accessToken: '' }));
            } else {
                setError(result.message);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleActivate = async () => {
        if (!currentPartnerId) return;

        try {
            const result = await activateMetaWhatsApp(currentPartnerId);

            if (result.success) {
                setSuccess(result.message);
                const status = await getMetaWhatsAppStatus(currentPartnerId);
                setConfig(status.config);
            } else {
                setError(result.message);
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleDisconnect = async () => {
        if (!currentPartnerId) return;

        if (!confirm('Are you sure you want to disconnect? This will stop message processing.')) {
            return;
        }

        setSaving(true);
        try {
            const result = await disconnectMetaWhatsApp(currentPartnerId);
            if (result.success) {
                setSuccess('Disconnected successfully. You can now re-connect.');
                setConfig(null); // This will show the connect form again
                setFormData(prev => ({ ...prev, accessToken: '' }));
            } else {
                setError(result.message);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    const isConnected = config?.status === 'active';
    const isPending = config?.status === 'pending';

    return (
        <div className="container max-w-4xl py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">WhatsApp Business Settings</h1>
                <p className="text-gray-600 mt-2">
                    Connect your WhatsApp Business account
                </p>
            </div>

            {error && (
                <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {success && (
                <Alert className="mb-6 border-green-200 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Success</AlertTitle>
                    <AlertDescription className="text-green-700">{success}</AlertDescription>
                </Alert>
            )}

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Connection Status</CardTitle>
                    <CardDescription>
                        Current state of your WhatsApp Business integration
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isConnected ? (
                        <Badge className="bg-green-500">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Connected & Active
                        </Badge>
                    ) : isPending ? (
                        <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Pending Webhook Configuration
                        </Badge>
                    ) : (
                        <Badge variant="outline" className="border-gray-400 text-gray-600">
                            <XCircle className="w-3 h-3 mr-1" />
                            Not Connected
                        </Badge>
                    )}
                </CardContent>
            </Card>

            {!config || config.status === 'disconnected' ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Connect WhatsApp Business</CardTitle>
                        <CardDescription>
                            Enter your Meta WhatsApp Business API credentials
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleConnect} className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="wabaId">WhatsApp Business Account ID</Label>
                                    <Input
                                        id="wabaId"
                                        placeholder="123456789012345"
                                        value={formData.wabaId}
                                        onChange={(e) => setFormData(prev => ({ ...prev, wabaId: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phoneNumberId">Phone Number ID</Label>
                                    <Input
                                        id="phoneNumberId"
                                        placeholder="123456789012345"
                                        value={formData.phoneNumberId}
                                        onChange={(e) => setFormData(prev => ({ ...prev, phoneNumberId: e.target.value }))}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="displayPhoneNumber">Display Phone Number</Label>
                                <Input
                                    id="displayPhoneNumber"
                                    placeholder="+1234567890"
                                    value={formData.displayPhoneNumber}
                                    onChange={(e) => setFormData(prev => ({ ...prev, displayPhoneNumber: e.target.value }))}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="accessToken">Permanent Access Token</Label>
                                <Input
                                    id="accessToken"
                                    type="password"
                                    placeholder="Your permanent access token"
                                    value={formData.accessToken}
                                    onChange={(e) => setFormData(prev => ({ ...prev, accessToken: e.target.value }))}
                                    required
                                />
                            </div>

                            <Button type="submit" disabled={saving} className="w-full">
                                {saving ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                )}
                                Connect WhatsApp Business
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Webhook Configuration</CardTitle>
                            <CardDescription>
                                Configure in Meta Business Suite
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Callback URL</Label>
                                <div className="flex items-center gap-2 mt-1">
                                    <code className="flex-1 p-2 bg-gray-100 rounded text-sm break-all">
                                        {webhookUrl}
                                    </code>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => copyToClipboard(webhookUrl)}
                                    >
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <Label>Verify Token</Label>
                                <div className="flex items-center gap-2 mt-1">
                                    <code className="flex-1 p-2 bg-gray-100 rounded text-sm font-mono">
                                        {verifyToken || config.verifyToken}
                                    </code>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => copyToClipboard(verifyToken || config.verifyToken || '')}
                                    >
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            {isPending && (
                                <Button onClick={handleActivate} className="w-full mb-2">
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Activate Connection
                                </Button>
                            )}

                            <div className="pt-4 border-t">
                                <Button
                                    variant="destructive"
                                    onClick={handleDisconnect}
                                    disabled={saving}
                                    className="w-full"
                                >
                                    {saving ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <XCircle className="w-4 h-4 mr-2" />
                                    )}
                                    Disconnect & Reset Configuration
                                </Button>
                                <p className="text-xs text-gray-500 text-center mt-2">
                                    This will allow you to re-enter your credentials.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
