'use client';

import { useState, useEffect } from 'react';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import {
    connectMetaWhatsApp,
    activateMetaWhatsApp,
    disconnectMetaWhatsApp,
    deleteMetaWhatsAppAccount,
    getMetaWhatsAppStatus,
    subscribeToWebhookFields
} from '@/actions/meta-whatsapp-actions';
import {
    requestVerificationCode,
    verifyPhoneCode
} from '@/actions/meta-phone-verification';
import {
    fetchWABAPhoneNumbers,
    selectPhoneNumber
} from '@/actions/meta-phone-discovery';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Loader2, Copy, AlertCircle, Edit, RefreshCw, Trash2, Unplug } from 'lucide-react';
import type { MetaWhatsAppConfig } from '@/lib/types-meta-whatsapp';

import Diagnostics from '@/components/whatsapp/Diagnostics';
import SetupGuide from '@/components/whatsapp/SetupGuide';
import WhatsAppTroubleshooting from '@/components/whatsapp/Troubleshooting';

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
        appId: '',
    });

    const [verifyToken, setVerifyToken] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Phone verification state
    const [showVerification, setShowVerification] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [requestingCode, setRequestingCode] = useState(false);

    // Edit mode state
    const [editMode, setEditMode] = useState(false);
    const [subscribing, setSubscribing] = useState(false);

    // Phone discovery state
    const [discoveredPhones, setDiscoveredPhones] = useState<any[]>([]);
    const [discoveringPhones, setDiscoveringPhones] = useState(false);
    const [showPhoneDiscovery, setShowPhoneDiscovery] = useState(false);

    // Delete account state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteWithConversations, setDeleteWithConversations] = useState(false);
    const [deleting, setDeleting] = useState(false);

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
                phoneNumberId: formData.phoneNumberId,
                wabaId: formData.wabaId,
                accessToken: formData.accessToken,
                displayPhoneNumber: formData.displayPhoneNumber,
                businessName: formData.businessName,
                appId: formData.appId,
            });

            if (result.success) {
                setSuccess(result.message);
                if (result.verifyToken) {
                    setVerifyToken(result.verifyToken);
                }
                const status = await getMetaWhatsAppStatus(currentPartnerId);
                setConfig(status.config);
                setFormData(prev => ({ ...prev, accessToken: '' }));
                setEditMode(false);
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

        if (!confirm('Are you sure you want to disconnect? This will pause message processing but keep your configuration.')) {
            return;
        }

        setSaving(true);
        try {
            const result = await disconnectMetaWhatsApp(currentPartnerId);
            if (result.success) {
                setSuccess(result.message);
                // Reload status to show updated config
                const status = await getMetaWhatsAppStatus(currentPartnerId);
                setConfig(status.config);
            } else {
                setError(result.message);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!currentPartnerId) return;

        setDeleting(true);
        setError(null);
        try {
            const result = await deleteMetaWhatsAppAccount(currentPartnerId, deleteWithConversations);
            if (result.success) {
                setSuccess(result.message);
                setConfig(null); // This will show the connect form again
                setFormData({
                    phoneNumberId: '',
                    wabaId: '',
                    accessToken: '',
                    displayPhoneNumber: '',
                    businessName: '',
                    appId: '',
                });
                setVerifyToken(null);
                setShowDeleteConfirm(false);
                setDeleteWithConversations(false);
            } else {
                setError(result.message);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setDeleting(false);
        }
    };

    const handleRequestCode = async (method: 'SMS' | 'VOICE') => {
        if (!currentPartnerId) return;

        setError(null);
        setSuccess(null);
        setRequestingCode(true);

        try {
            const result = await requestVerificationCode({
                partnerId: currentPartnerId,
                codeMethod: method,
                language: 'en'
            });

            if (result.success) {
                setSuccess(result.message);
                setShowVerification(true);
            } else {
                setError(result.message);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setRequestingCode(false);
        }
    };

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentPartnerId || !verificationCode) return;

        setError(null);
        setSuccess(null);
        setVerifying(true);

        try {
            const result = await verifyPhoneCode({
                partnerId: currentPartnerId,
                code: verificationCode
            });

            if (result.success) {
                setSuccess(result.message);
                setShowVerification(false);
                setVerificationCode('');
                // Reload status to update UI
                const status = await getMetaWhatsAppStatus(currentPartnerId);
                setConfig(status.config);
            } else {
                setError(result.message);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setVerifying(false);
        }
    };

    const handleEnableEdit = () => {
        if (config) {
            setFormData({
                wabaId: config.wabaId || '',
                phoneNumberId: config.phoneNumberId || '',
                displayPhoneNumber: config.displayPhoneNumber || '',
                businessName: config.businessName || '',
                accessToken: '',
                appId: formData.appId || '',
            });
            setEditMode(true);
        }
    };

    const handleCancelEdit = () => {
        setEditMode(false);
        setFormData(prev => ({ ...prev, accessToken: '' }));
    };

    const handleSubscribeWebhook = async () => {
        if (!currentPartnerId || !formData.appId) {
            setError('App ID is required to subscribe to webhooks');
            return;
        }

        setError(null);
        setSuccess(null);
        setSubscribing(true);

        try {
            const result = await subscribeToWebhookFields(currentPartnerId, formData.appId);

            if (result.success) {
                setSuccess(result.message);
            } else {
                setError(result.message);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubscribing(false);
        }
    };

    const handleDiscoverPhones = async () => {
        if (!currentPartnerId || !config) {
            setError('Configuration not found. Please connect first.');
            return;
        }

        if (!config.wabaId) {
            setError('WABA ID not found in configuration');
            return;
        }

        setError(null);
        setSuccess(null);
        setDiscoveringPhones(true);

        try {
            // The server action will fetch the encrypted token from the config
            const result = await fetchWABAPhoneNumbers(
                currentPartnerId,
                config.wabaId,
                '' // Empty string - the server will fetch it from saved config
            );

            if (result.success && result.phoneNumbers) {
                setDiscoveredPhones(result.phoneNumbers);
                setShowPhoneDiscovery(true);
                setSuccess(`Found ${result.phoneNumbers.length} phone number(s)`);
            } else {
                setError(result.message);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setDiscoveringPhones(false);
        }
    };

    const handleSelectPhone = async (phoneId: string, displayNumber: string) => {
        if (!currentPartnerId) return;

        setError(null);
        setSuccess(null);
        setSaving(true);

        try {
            const result = await selectPhoneNumber(currentPartnerId, phoneId, displayNumber);

            if (result.success) {
                setSuccess('Phone number selected and configuration updated!');
                setShowPhoneDiscovery(false);
                const status = await getMetaWhatsAppStatus(currentPartnerId);
                setConfig(status.config);
                setFormData(prev => ({ ...prev, phoneNumberId: phoneId, displayPhoneNumber: displayNumber }));
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
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
            setSuccess('Copied to clipboard!');
            setTimeout(() => setSuccess(null), 2000);
        } else {
            // Fallback or just alert user
            alert('Copying to clipboard is not supported in this context. Please copy manually.');
        }
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

            <Diagnostics config={config} />

            <SetupGuide
                currentStatus={config?.status || 'disconnected'}
                hasPhoneNumberId={!!config?.phoneNumberId && config.phoneNumberId !== 'pending'}
                hasAppId={!!config?.appId}
            />

            {!config || config.status === 'disconnected' ? (
                <>
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
                                        <Label htmlFor="phoneNumberId">
                                            Phone Number ID
                                            <span className="text-xs text-gray-500 ml-2">(Optional - add after phone verification)</span>
                                        </Label>
                                        <Input
                                            id="phoneNumberId"
                                            placeholder="Leave empty if not verified yet"
                                            value={formData.phoneNumberId}
                                            onChange={(e) => setFormData(prev => ({ ...prev, phoneNumberId: e.target.value }))}
                                        />
                                        <p className="text-xs text-amber-600">
                                            💡 You'll get this ID after verifying your phone number with Meta
                                        </p>
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
                </>
            ) : (
                <>
                    {/* Configuration Details Card */}
                    <Card className="mb-6">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>{editMode ? 'Update Configuration' : 'Current Configuration'}</CardTitle>
                                    <CardDescription>
                                        {editMode ? 'Edit your WhatsApp Business settings' : 'Review your WhatsApp Business setup details'}
                                    </CardDescription>
                                </div>
                                {!editMode && (
                                    <Button variant="outline" size="sm" onClick={handleEnableEdit}>
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {editMode ? (
                                <form onSubmit={handleConnect} className="space-y-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-wabaId">WABA ID</Label>
                                            <Input
                                                id="edit-wabaId"
                                                value={formData.wabaId}
                                                onChange={(e) => setFormData(prev => ({ ...prev, wabaId: e.target.value }))}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="edit-phoneNumberId">
                                                Phone Number ID
                                                <span className="text-xs text-gray-500 ml-2">(Optional)</span>
                                            </Label>
                                            <Input
                                                id="edit-phoneNumberId"
                                                placeholder="Add after verification"
                                                value={formData.phoneNumberId}
                                                onChange={(e) => setFormData(prev => ({ ...prev, phoneNumberId: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-displayPhone">Display Phone Number</Label>
                                        <Input
                                            id="edit-displayPhone"
                                            value={formData.displayPhoneNumber}
                                            onChange={(e) => setFormData(prev => ({ ...prev, displayPhoneNumber: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-businessName">Business Name (Optional)</Label>
                                        <Input
                                            id="edit-businessName"
                                            value={formData.businessName}
                                            onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-appId">Meta App ID (for webhooks)</Label>
                                        <Input
                                            id="edit-appId"
                                            placeholder="e.g., 1411415467214690"
                                            value={formData.appId}
                                            onChange={(e) => setFormData(prev => ({ ...prev, appId: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-accessToken">Access Token (leave empty to keep current)</Label>
                                        <Input
                                            id="edit-accessToken"
                                            type="password"
                                            placeholder="Enter new token or leave empty"
                                            value={formData.accessToken}
                                            onChange={(e) => setFormData(prev => ({ ...prev, accessToken: e.target.value }))}
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <Button type="submit" disabled={saving} className="flex-1">
                                            {saving ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                            )}
                                            Update Configuration
                                        </Button>
                                        <Button type="button" variant="outline" onClick={handleCancelEdit}>
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-4">
                                    {/* WABA ID */}
                                    <div className="flex items-start justify-between py-2 border-b">
                                        <div className="flex-1">
                                            <Label className="text-sm font-medium text-gray-700">WhatsApp Business Account ID</Label>
                                            {config.wabaId ? (
                                                <p className="text-sm font-mono mt-1 text-gray-900">{config.wabaId}</p>
                                            ) : (
                                                <p className="text-sm text-red-600 mt-1 flex items-center">
                                                    <AlertCircle className="w-3 h-3 mr-1" />
                                                    Missing
                                                </p>
                                            )}
                                        </div>
                                        {config.wabaId && (
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 ml-2" />
                                        )}
                                    </div>

                                    {/* Phone Number ID */}
                                    <div className="flex items-start justify-between py-2 border-b">
                                        <div className="flex-1">
                                            <Label className="text-sm font-medium text-gray-700">Phone Number ID</Label>
                                            {config.phoneNumberId ? (
                                                <p className="text-sm font-mono mt-1 text-gray-900">{config.phoneNumberId}</p>
                                            ) : (
                                                <p className="text-sm text-red-600 mt-1 flex items-center">
                                                    <AlertCircle className="w-3 h-3 mr-1" />
                                                    Missing
                                                </p>
                                            )}
                                        </div>
                                        {config.phoneNumberId && (
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 ml-2" />
                                        )}
                                    </div>

                                    {/* Display Phone Number */}
                                    <div className="flex items-start justify-between py-2 border-b">
                                        <div className="flex-1">
                                            <Label className="text-sm font-medium text-gray-700">Display Phone Number</Label>
                                            {config.displayPhoneNumber ? (
                                                <p className="text-sm mt-1 text-gray-900">{config.displayPhoneNumber}</p>
                                            ) : (
                                                <p className="text-sm text-amber-600 mt-1 flex items-center">
                                                    <AlertCircle className="w-3 h-3 mr-1" />
                                                    Not set
                                                </p>
                                            )}
                                        </div>
                                        {config.displayPhoneNumber && (
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 ml-2" />
                                        )}
                                    </div>

                                    {/* Phone Verification Status - only show if phoneNumberId is set */}
                                    {config.phoneNumberId && config.phoneNumberId !== 'pending' && (
                                        <div className="flex items-start justify-between py-2 border-b">
                                            <div className="flex-1">
                                                <Label className="text-sm font-medium text-gray-700">Phone Verification Status</Label>
                                                <p className="text-sm mt-1 text-blue-700">
                                                    Check verification status before requesting OTP
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Business Name */}
                                    <div className="flex items-start justify-between py-2 border-b">
                                        <div className="flex-1">
                                            <Label className="text-sm font-medium text-gray-700">Business Name</Label>
                                            {config.businessName ? (
                                                <p className="text-sm mt-1 text-gray-900">{config.businessName}</p>
                                            ) : (
                                                <p className="text-sm text-gray-500 mt-1">Optional - not set</p>
                                            )}
                                        </div>
                                        {config.businessName && (
                                            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 ml-2" />
                                        )}
                                    </div>

                                    {/* Access Token Status */}
                                    <div className="flex items-start justify-between py-2 border-b">
                                        <div className="flex-1">
                                            <Label className="text-sm font-medium text-gray-700">Access Token</Label>
                                            {config.wabaId ? (
                                                <p className="text-sm mt-1 text-green-700 flex items-center">
                                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                                    Encrypted and stored securely
                                                </p>
                                            ) : (
                                                <p className="text-sm text-red-600 mt-1 flex items-center">
                                                    <AlertCircle className="w-3 h-3 mr-1" />
                                                    Not configured
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Webhook Configuration Status */}
                                    <div className="flex items-start justify-between py-2">
                                        <div className="flex-1">
                                            <Label className="text-sm font-medium text-gray-700">Webhook Status</Label>
                                            {config.webhookConfigured ? (
                                                <p className="text-sm mt-1 text-green-700 flex items-center">
                                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                                    Configured and verified
                                                </p>
                                            ) : (
                                                <p className="text-sm text-amber-600 mt-1 flex items-center">
                                                    <AlertCircle className="w-3 h-3 mr-1" />
                                                    Pending verification - configure in Meta Dashboard
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Setup Checklist */}
                                    {isPending && (
                                        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                            <h4 className="text-sm font-semibold text-amber-900 mb-2">⚠️ Setup Incomplete</h4>
                                            <ul className="text-sm text-amber-800 space-y-1">
                                                <li>✅ Credentials configured</li>
                                                <li className="flex items-center">
                                                    <span className="mr-2">❌</span>
                                                    <span>Configure webhook in Meta App Dashboard (see below)</span>
                                                </li>
                                                <li className="flex items-center">
                                                    <span className="mr-2">❌</span>
                                                    <span>Subscribe to "messages" webhook field</span>
                                                </li>
                                                <li className="flex items-center">
                                                    <span className="mr-2">❌</span>
                                                    <span>Click "Activate Connection" after webhook is verified</span>
                                                </li>
                                            </ul>
                                        </div>
                                    )}

                                    {isConnected && (
                                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                                            <h4 className="text-sm font-semibold text-green-900 mb-2">✅ Fully Configured</h4>
                                            <p className="text-sm text-green-800">
                                                Your WhatsApp Business integration is active and ready to send/receive messages.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Webhook Subscription Card */}
                    {!editMode && formData.appId && (
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle>Webhook Subscription</CardTitle>
                                <CardDescription>
                                    Subscribe to receive message notifications
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-600">
                                        App ID: <span className="font-mono font-semibold">{formData.appId}</span>
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        This will subscribe your app to receive webhook notifications for messages and message template status updates.
                                    </p>
                                    <Button
                                        onClick={handleSubscribeWebhook}
                                        disabled={subscribing}
                                        className="w-full"
                                    >
                                        {subscribing ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <CheckCircle2 className="w-4 h-4 mr-2" />
                                        )}
                                        Subscribe to Webhook Fields
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Phone Number Verification Card */}
                    {config && config.phoneNumberId && config.phoneNumberId !== 'pending' ? (
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle>Phone Number Verification</CardTitle>
                                <CardDescription>
                                    Verify your WhatsApp Business phone number to enable messaging
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {!showVerification ? (
                                    <div className="space-y-4">
                                        <p className="text-sm text-gray-600">
                                            Phone: <span className="font-semibold">{config.displayPhoneNumber}</span>
                                        </p>

                                        {/* Show actual access token for testing */}
                                        <Alert className="bg-amber-50 border-amber-200">
                                            <AlertCircle className="h-4 w-4 text-amber-600" />
                                            <AlertTitle className="text-amber-800">Access Token for Testing</AlertTitle>
                                            <AlertDescription className="text-amber-700">
                                                <p className="text-xs mb-2">Your access token is encrypted in storage. Use this for curl testing:</p>
                                                <div className="flex items-center gap-2 bg-white p-2 rounded border">
                                                    <code className="text-xs flex-1 overflow-x-auto">
                                                        {config.status === 'active' ? 'Token available after connection' : 'Connect first to see token'}
                                                    </code>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={async () => {
                                                            // Fetch decrypted token from server for display
                                                            const { checkPhoneStatus } = await import('@/actions/meta-phone-status');
                                                            // We'll use status check to validate token works
                                                            setSuccess('Use the token from your initial connection');
                                                        }}
                                                    >
                                                        <Copy className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                                <p className="text-xs mt-2 text-amber-600">
                                                    ⚠️ Use the same Access Token you entered when connecting
                                                </p>
                                            </AlertDescription>
                                        </Alert>

                                        <p className="text-sm text-gray-600">
                                            Choose how you'd like to receive your verification code:
                                        </p>
                                        <div className="flex gap-4">
                                            <Button
                                                variant="outline"
                                                onClick={() => handleRequestCode('SMS')}
                                                disabled={requestingCode}
                                                className="flex-1"
                                            >
                                                {requestingCode ? (
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                ) : (
                                                    'Send via SMS'
                                                )}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => handleRequestCode('VOICE')}
                                                disabled={requestingCode}
                                                className="flex-1"
                                            >
                                                {requestingCode ? (
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                ) : (
                                                    'Send via Voice Call'
                                                )}
                                            </Button>
                                        </div>

                                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                            <p className="text-sm text-gray-600 font-semibold mb-2">🧪 Test with cURL:</p>
                                            <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
                                                {`curl -X POST "https://graph.facebook.com/v18.0/${config.phoneNumberId}/request_code" \\
  -H "Content-Type: application/json" \\
  -d '{"code_method":"SMS","language":"en"}' \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"`}
                                            </pre>
                                            <p className="text-xs text-gray-500 mt-2">
                                                Replace <code className="bg-gray-200 px-1 rounded">YOUR_ACCESS_TOKEN</code> with your actual token.
                                            </p>
                                        </div>

                                        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                            <p className="text-sm text-blue-800 font-semibold mb-2">📋 Check Phone Status First:</p>
                                            <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
                                                {`curl "https://graph.facebook.com/v18.0/${config.phoneNumberId}?fields=code_verification_status,display_phone_number,verified_name,quality_rating" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"`}
                                            </pre>
                                            <p className="text-xs text-blue-600 mt-2">
                                                If <code className="bg-blue-100 px-1 rounded">code_verification_status</code> is already "VERIFIED", no OTP is needed!
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={handleVerifyCode} className="space-y-4">
                                        <div>
                                            <Label htmlFor="verificationCode">Verification Code</Label>
                                            <Input
                                                id="verificationCode"
                                                placeholder="Enter 6-digit code"
                                                value={verificationCode}
                                                onChange={(e) => setVerificationCode(e.target.value)}
                                                required
                                                maxLength={6}
                                            />
                                        </div>
                                        <div className="flex gap-3">
                                            <Button type="submit" disabled={verifying} className="flex-1">
                                                {verifying ? (
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                ) : (
                                                    'Verify Code'
                                                )}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                onClick={() => setShowVerification(false)}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </form>
                                )}
                            </CardContent>
                        </Card>
                    ) : config && config.phoneNumberId === 'pending' ? (
                        <>
                            {/* Phone Discovery Card */}
                            <Card className="mb-6 border-blue-200 bg-blue-50/30">
                                <CardHeader>
                                    <CardTitle className="text-blue-900">Discover Your Phone Numbers</CardTitle>
                                    <CardDescription className="text-blue-700">
                                        We can automatically find phone numbers associated with your WhatsApp Business Account.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {!showPhoneDiscovery ? (
                                        <Button
                                            onClick={handleDiscoverPhones}
                                            disabled={discoveringPhones}
                                            className="w-full bg-blue-600 hover:bg-blue-700"
                                        >
                                            {discoveringPhones ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <RefreshCw className="w-4 h-4 mr-2" />
                                            )}
                                            Discover Phone Numbers
                                        </Button>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="grid gap-3">
                                                {discoveredPhones.map((phone) => (
                                                    <div
                                                        key={phone.id}
                                                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100 shadow-sm"
                                                    >
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{phone.display_phone_number}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Badge variant={phone.code_verification_status === 'VERIFIED' ? 'default' : 'secondary'} className="text-xs">
                                                                    {phone.code_verification_status || 'UNKNOWN'}
                                                                </Badge>
                                                                <span className="text-xs text-gray-500">ID: {phone.id}</span>
                                                            </div>
                                                            <p className="text-xs text-gray-500 mt-1">Quality: {phone.quality_rating}</p>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleSelectPhone(phone.id, phone.display_phone_number)}
                                                            disabled={saving}
                                                        >
                                                            Select
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setShowPhoneDiscovery(false)}
                                                className="w-full text-blue-600"
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="mb-6 border-amber-200 bg-amber-50">
                                <CardHeader>
                                    <CardTitle className="text-amber-900">Phone Number Verification Required</CardTitle>
                                    <CardDescription className="text-amber-800">
                                        You haven't added a Phone Number ID yet. You need to verify your phone number in Meta Business Manager first.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ol className="list-decimal list-inside space-y-2 text-sm text-amber-900">
                                        <li>Go to <a href="https://business.facebook.com/" target="_blank" rel="noopener noreferrer" className="underline font-semibold">Meta Business Suite</a></li>
                                        <li>Navigate to WhatsApp Manager &gt; Phone Numbers</li>
                                        <li>Click "Add Phone Number" if you haven't already</li>
                                        <li>Complete the SMS/Voice verification process there</li>
                                        <li>Once verified, copy the <strong>Phone Number ID</strong></li>
                                        <li>Come back here, click "Edit", and paste the ID</li>
                                    </ol>
                                </CardContent>
                            </Card>
                        </>
                    ) : null}

                    {/* Connection Actions */}
                    <Card className="border-red-100">
                        <CardHeader>
                            <CardTitle className="text-red-900">Connection Management</CardTitle>
                            <CardDescription className="text-red-700">
                                Manage your WhatsApp Business connection
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {isPending && (
                                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 mb-4">
                                        <h4 className="font-semibold text-yellow-900 mb-2">Activate Connection</h4>
                                        <p className="text-sm text-yellow-800 mb-4">
                                            Once you have configured the webhook in Meta, click here to activate the connection.
                                        </p>
                                        <Button
                                            onClick={handleActivate}
                                            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                                        >
                                            Activate Connection
                                        </Button>
                                    </div>
                                )}

                                {/* Reconnect button - shown when disconnected */}
                                {config?.status === 'disconnected' && (
                                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                                        <h4 className="font-semibold text-blue-900 mb-2">Reconnect</h4>
                                        <p className="text-sm text-blue-800 mb-4">
                                            Your WhatsApp Business is currently disconnected. Click below to reconnect with your existing configuration.
                                        </p>
                                        <Button
                                            onClick={handleActivate}
                                            disabled={saving}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                        >
                                            {saving ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                            )}
                                            Reconnect WhatsApp Business
                                        </Button>
                                    </div>
                                )}

                                {/* Disconnect button - shown when active or pending */}
                                {(isConnected || isPending) && (
                                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                                        <h4 className="font-semibold text-amber-900 mb-2">Disconnect</h4>
                                        <p className="text-sm text-amber-800 mb-4">
                                            Temporarily pause message processing. Your configuration will be saved for easy reconnection.
                                        </p>
                                        <Button
                                            variant="outline"
                                            onClick={handleDisconnect}
                                            disabled={saving}
                                            className="w-full border-amber-600 text-amber-700 hover:bg-amber-100"
                                        >
                                            {saving ? (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            ) : (
                                                <Unplug className="w-4 h-4 mr-2" />
                                            )}
                                            Disconnect WhatsApp Business
                                        </Button>
                                    </div>
                                )}

                                {/* Delete Account Section */}
                                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                                    <h4 className="font-semibold text-red-900 mb-2">Delete WhatsApp Account</h4>
                                    <p className="text-sm text-red-800 mb-4">
                                        Permanently remove your WhatsApp Business configuration. This allows you to connect a different WhatsApp Business account.
                                    </p>

                                    {!showDeleteConfirm ? (
                                        <Button
                                            variant="destructive"
                                            onClick={() => setShowDeleteConfirm(true)}
                                            className="w-full"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete WhatsApp Account
                                        </Button>
                                    ) : (
                                        <div className="space-y-4">
                                            <Alert variant="destructive">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertTitle>Are you sure?</AlertTitle>
                                                <AlertDescription>
                                                    This action cannot be undone. Your WhatsApp Business configuration will be permanently deleted.
                                                </AlertDescription>
                                            </Alert>

                                            <label className="flex items-center gap-2 text-sm text-red-800 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={deleteWithConversations}
                                                    onChange={(e) => setDeleteWithConversations(e.target.checked)}
                                                    className="rounded border-red-300 text-red-600 focus:ring-red-500"
                                                />
                                                Also delete all WhatsApp conversations and messages
                                            </label>

                                            <div className="flex gap-3">
                                                <Button
                                                    variant="destructive"
                                                    onClick={handleDelete}
                                                    disabled={deleting}
                                                    className="flex-1"
                                                >
                                                    {deleting ? (
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                    )}
                                                    Yes, Delete Account
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        setShowDeleteConfirm(false);
                                                        setDeleteWithConversations(false);
                                                    }}
                                                    disabled={deleting}
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
            <WhatsAppTroubleshooting />
        </div>
    );
}
