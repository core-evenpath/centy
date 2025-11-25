'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle, Lock, Globe, Key } from 'lucide-react';
import { getPlatformMetaConfig, savePlatformMetaConfig } from '@/actions/admin-platform-actions';
import { useAuth } from '@/hooks/use-auth';

export default function PlatformSettingsPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        appId: '',
        appSecret: '',
        verifyToken: '',
        webhookUrl: '',
    });

    useEffect(() => {
        async function loadConfig() {
            try {
                const config = await getPlatformMetaConfig();
                if (config) {
                    setFormData({
                        appId: config.appId || '',
                        appSecret: '', // Don't show secret
                        verifyToken: config.verifyToken || '',
                        webhookUrl: config.webhookUrl || '',
                    });
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load configuration');
            } finally {
                setLoading(false);
            }
        }
        loadConfig();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const result = await savePlatformMetaConfig({
                ...formData,
                userId: user.uid
            });

            if (result.success) {
                setSuccess(result.message);
                setFormData(prev => ({ ...prev, appSecret: '' })); // Clear secret after save
            } else {
                setError(result.message);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Platform Settings</h1>
                <p className="text-gray-500 mt-2">Configure global settings for the Centy platform.</p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Globe className="w-5 h-5 text-blue-600" />
                        <CardTitle>Meta WhatsApp Configuration</CardTitle>
                    </div>
                    <CardDescription>
                        These settings are used to verify webhooks and manage the Centy App connection.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {success && (
                        <Alert className="mb-6 bg-green-50 border-green-200">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertTitle className="text-green-800">Success</AlertTitle>
                            <AlertDescription className="text-green-700">{success}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="appId">Meta App ID</Label>
                                <Input
                                    id="appId"
                                    value={formData.appId}
                                    onChange={(e) => setFormData(prev => ({ ...prev, appId: e.target.value }))}
                                    placeholder="e.g., 1411415467214690"
                                    required
                                />
                                <p className="text-xs text-gray-500">The ID of the Centy App in Meta Developers.</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="appSecret">App Secret</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="appSecret"
                                        type="password"
                                        value={formData.appSecret}
                                        onChange={(e) => setFormData(prev => ({ ...prev, appSecret: e.target.value }))}
                                        className="pl-9"
                                        placeholder={formData.appId ? "Enter new secret to update" : "e.g., a1b2c3d4..."}
                                    />
                                </div>
                                <p className="text-xs text-gray-500">Used to verify webhook signatures. Stored encrypted.</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="verifyToken">Webhook Verify Token</Label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="verifyToken"
                                        value={formData.verifyToken}
                                        onChange={(e) => setFormData(prev => ({ ...prev, verifyToken: e.target.value }))}
                                        className="pl-9"
                                        placeholder="e.g., random_string_123"
                                        required
                                    />
                                </div>
                                <p className="text-xs text-gray-500">The token used for webhook verification handshake.</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="webhookUrl">Webhook Callback URL</Label>
                                <Input
                                    id="webhookUrl"
                                    value={formData.webhookUrl}
                                    onChange={(e) => setFormData(prev => ({ ...prev, webhookUrl: e.target.value }))}
                                    placeholder="https://centy.dev/api/webhooks/meta/whatsapp"
                                    required
                                />
                                <p className="text-xs text-gray-500">The URL configured in Meta App Dashboard.</p>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={saving}>
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Configuration'
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
