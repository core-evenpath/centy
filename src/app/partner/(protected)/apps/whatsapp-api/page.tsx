'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import Script from 'next/script';
import {
    completeEmbeddedSignup,
    getEmbeddedSignupStatus,
    activateEmbeddedSignup,
    disconnectEmbeddedSignup,
} from '@/actions/meta-embedded-signup-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    CheckCircle2,
    XCircle,
    Loader2,
    Copy,
    AlertCircle,
    ExternalLink,
    Smartphone,
    Shield,
    Zap,
} from 'lucide-react';
import type { EmbeddedSignupSessionInfo, EmbeddedSignupResponse } from '@/lib/types-meta-embedded';

const META_APP_ID = process.env.NEXT_PUBLIC_META_APP_ID || '1411415467214690';
const META_CONFIG_ID = process.env.NEXT_PUBLIC_META_CONFIG_ID || '849551567857314';

export default function WhatsAppBusinessAPIPage() {
    const { currentWorkspace, loading: authLoading } = useMultiWorkspaceAuth();
    const currentPartnerId = currentWorkspace?.partnerId;

    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [sdkLoaded, setSdkLoaded] = useState(false);

    const sessionDataRef = useRef<{ wabaId: string; phoneNumberId: string } | null>(null);

    const webhookUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/api/webhooks/meta/whatsapp`
        : '';

    useEffect(() => {
        async function loadStatus() {
            if (!currentPartnerId) return;

            setLoading(true);
            try {
                const status = await getEmbeddedSignupStatus(currentPartnerId);
                setConfig(status.config);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        loadStatus();
    }, [currentPartnerId]);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.origin !== 'https://www.facebook.com' && event.origin !== 'https://web.facebook.com') {
                return;
            }

            try {
                const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

                if (data.type === 'WA_EMBEDDED_SIGNUP') {
                    const sessionInfo = data as EmbeddedSignupSessionInfo;
                    console.log('📱 Embedded Signup event:', sessionInfo.event);

                    if (sessionInfo.event === 'FINISH' && sessionInfo.data) {
                        console.log('✅ Session data received:', sessionInfo.data);
                        sessionDataRef.current = {
                            wabaId: sessionInfo.data.waba_id,
                            phoneNumberId: sessionInfo.data.phone_number_id,
                        };
                    } else if (sessionInfo.event === 'CANCEL') {
                        console.log('❌ User cancelled embedded signup');
                        setConnecting(false);
                        setError('Signup was cancelled by user');
                    } else if (sessionInfo.event === 'ERROR') {
                        console.error('❌ Embedded signup error');
                        setConnecting(false);
                        setError('An error occurred during signup. Please try again.');
                    }
                }
            } catch (e) {
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const initFacebookSDK = useCallback(() => {
        if (typeof window !== 'undefined' && window.FB) {
            window.FB.init({
                appId: META_APP_ID,
                autoLogAppEvents: true,
                xfbml: true,
                version: 'v24.0',
            });
            setSdkLoaded(true);
            console.log('✅ Facebook SDK initialized with App ID:', META_APP_ID);
        }
    }, []);

    useEffect(() => {
        window.fbAsyncInit = initFacebookSDK;

        if (typeof window !== 'undefined' && window.FB) {
            initFacebookSDK();
        }
    }, [initFacebookSDK]);

    const launchEmbeddedSignup = () => {
        if (!window.FB) {
            setError('Facebook SDK not loaded. Please refresh the page and try again.');
            return;
        }

        if (!META_CONFIG_ID) {
            setError('Meta Configuration ID not set. Please contact support.');
            return;
        }

        setError(null);
        setSuccess(null);
        setConnecting(true);
        sessionDataRef.current = null;

        console.log('🚀 Launching WhatsApp Embedded Signup...');
        console.log('📋 Config ID:', META_CONFIG_ID);

        // Check for HTTPS
        if (window.location.protocol !== 'https:') {
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const errorMsg = isLocalhost
                ? 'Facebook Login requires HTTPS. Please restart your server with "npm run dev:https" or use a tunneling service like ngrok.'
                : 'Facebook Login requires HTTPS. Please ensure your site is served over HTTPS.';

            setError(errorMsg);
            setConnecting(false);
            return;
        }

        try {
            window.FB.login(
                async (response: EmbeddedSignupResponse) => {
                    console.log('📱 FB.login response:', response);

                    if (response.authResponse && response.authResponse.code) {
                        const code = response.authResponse.code;
                        console.log('✅ Authorization code received, length:', code.length);

                        try {
                            let attempts = 0;
                            const maxAttempts = 60;

                            while (!sessionDataRef.current && attempts < maxAttempts) {
                                await new Promise(resolve => setTimeout(resolve, 500));
                                attempts++;
                            }

                            if (!sessionDataRef.current) {
                                throw new Error('Timeout waiting for WhatsApp session data. Please try again.');
                            }

                            console.log('✅ Session data available:', sessionDataRef.current);

                            if (!currentPartnerId) {
                                throw new Error('Partner ID not available. Please refresh the page.');
                            }

                            const result = await completeEmbeddedSignup({
                                partnerId: currentPartnerId,
                                code,
                                wabaId: sessionDataRef.current.wabaId,
                                phoneNumberId: sessionDataRef.current.phoneNumberId,
                            });

                            if (result.success) {
                                setSuccess(result.message);
                                const status = await getEmbeddedSignupStatus(currentPartnerId);
                                setConfig(status.config);
                            } else {
                                setError(result.message);
                            }
                        } catch (err: any) {
                            console.error('❌ Signup completion error:', err);
                            setError(err.message);
                        }
                    } else {
                        console.log('❌ User cancelled or authorization failed');
                        setError('Authorization was not completed. Please try again.');
                    }

                    setConnecting(false);
                },
                {
                    config_id: META_CONFIG_ID,
                    response_type: 'code',
                    override_default_response_type: true,
                    extras: {
                        version: 'v3',
                    },
                }
            );
        } catch (err: any) {
            console.error('❌ Facebook Login error:', err);
            setError(`Failed to launch Facebook Login: ${err.message || 'Unknown error'}`);
            setConnecting(false);
        }
    };

    const handleActivate = async () => {
        if (!currentPartnerId) return;

        setError(null);
        try {
            const result = await activateEmbeddedSignup(currentPartnerId);

            if (result.success) {
                setSuccess(result.message);
                const status = await getEmbeddedSignupStatus(currentPartnerId);
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

        if (!confirm('Are you sure you want to disconnect? This will stop all message processing.')) {
            return;
        }

        setError(null);
        try {
            const result = await disconnectEmbeddedSignup(currentPartnerId);
            if (result.success) {
                setSuccess('Disconnected successfully. You can reconnect anytime.');
                setConfig(null);
            } else {
                setError(result.message);
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    const copyToClipboard = (text: string) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
            setSuccess('Copied to clipboard!');
            setTimeout(() => setSuccess(null), 2000);
        } else {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setSuccess('Copied to clipboard!');
            setTimeout(() => setSuccess(null), 2000);
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
        <>
            <Script
                src="https://connect.facebook.net/en_US/sdk.js"
                strategy="lazyOnload"
                onLoad={() => {
                    console.log('📦 Facebook SDK script loaded');
                    if (window.FB) {
                        initFacebookSDK();
                    }
                }}
            />

            <div className="container max-w-4xl py-8">
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold">WhatsApp Business API</h1>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                            <Zap className="w-3 h-3 mr-1" />
                            Quick Setup
                        </Badge>
                    </div>
                    <p className="text-gray-600">
                        Connect your WhatsApp Business account in minutes with Meta's official Embedded Signup
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

                {!config && (
                    <>
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Smartphone className="w-5 h-5" />
                                    Connect WhatsApp Business
                                </CardTitle>
                                <CardDescription>
                                    Use Meta's official Embedded Signup flow to connect your WhatsApp Business account
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                <span className="text-blue-600 font-semibold">1</span>
                                            </div>
                                            <div>
                                                <h4 className="font-medium">Login with Facebook</h4>
                                                <p className="text-sm text-gray-600">
                                                    Authenticate with your Facebook account
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                <span className="text-blue-600 font-semibold">2</span>
                                            </div>
                                            <div>
                                                <h4 className="font-medium">Select Business Account</h4>
                                                <p className="text-sm text-gray-600">
                                                    Choose or create your WhatsApp Business Account
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                <span className="text-blue-600 font-semibold">3</span>
                                            </div>
                                            <div>
                                                <h4 className="font-medium">Verify Phone Number</h4>
                                                <p className="text-sm text-gray-600">
                                                    Enter OTP sent via SMS to your business phone
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                        <h4 className="font-medium text-amber-900 mb-2">Before you start:</h4>
                                        <ul className="text-sm text-amber-800 space-y-1">
                                            <li>• Have access to a Facebook account linked to your business</li>
                                            <li>• Have a phone number ready that is NOT currently registered on WhatsApp</li>
                                            <li>• Be able to receive SMS or voice calls on that phone number</li>
                                            <li>• If your number is on WhatsApp, delete that account first</li>
                                        </ul>
                                    </div>

                                    <Button
                                        onClick={launchEmbeddedSignup}
                                        disabled={connecting || !sdkLoaded}
                                        className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white h-12 text-lg"
                                    >
                                        {connecting ? (
                                            <>
                                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                Connecting...
                                            </>
                                        ) : !sdkLoaded ? (
                                            <>
                                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                                Loading Facebook SDK...
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                                </svg>
                                                Connect with Facebook
                                            </>
                                        )}
                                    </Button>

                                    {!sdkLoaded && (
                                        <p className="text-sm text-center text-gray-500">
                                            If the button stays on "Loading", please refresh the page or check if you have an ad blocker enabled.
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="w-5 h-5" />
                                    Why Embedded Signup?
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="font-medium">Secure OAuth Flow</h4>
                                            <p className="text-sm text-gray-600">
                                                No need to manually copy API tokens or secrets
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="font-medium">Instant Setup</h4>
                                            <p className="text-sm text-gray-600">
                                                Complete the entire setup in under 5 minutes
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="font-medium">Automatic Registration</h4>
                                            <p className="text-sm text-gray-600">
                                                Phone number is registered automatically with Meta
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="font-medium">Official Meta Integration</h4>
                                            <p className="text-sm text-gray-600">
                                                Uses Meta's recommended Business API signup method
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}

                {config && (
                    <>
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle>Connection Status</CardTitle>
                                <CardDescription>
                                    Current state of your WhatsApp Business API integration
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        {isConnected ? (
                                            <Badge className="bg-green-500 text-white">
                                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                                Connected & Active
                                            </Badge>
                                        ) : isPending ? (
                                            <Badge className="bg-yellow-500 text-white">
                                                <AlertCircle className="w-3 h-3 mr-1" />
                                                Pending Webhook Configuration
                                            </Badge>
                                        ) : (
                                            <Badge variant="destructive">
                                                <XCircle className="w-3 h-3 mr-1" />
                                                Disconnected
                                            </Badge>
                                        )}
                                        {config.integrationType === 'embedded_signup' && (
                                            <Badge variant="outline" className="text-blue-600 border-blue-200">
                                                <Zap className="w-3 h-3 mr-1" />
                                                Embedded Signup
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                        <div>
                                            <p className="text-sm text-gray-500">Phone Number</p>
                                            <p className="font-medium">{config.displayPhoneNumber || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Verified Name</p>
                                            <p className="font-medium">{config.verifiedName || 'Pending Approval'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">WABA ID</p>
                                            <p className="font-mono text-sm">{config.wabaId || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Quality Rating</p>
                                            <Badge
                                                variant="outline"
                                                className={
                                                    config.qualityRating === 'GREEN'
                                                        ? 'border-green-500 text-green-700'
                                                        : config.qualityRating === 'YELLOW'
                                                            ? 'border-yellow-500 text-yellow-700'
                                                            : config.qualityRating === 'RED'
                                                                ? 'border-red-500 text-red-700'
                                                                : 'border-gray-500'
                                                }
                                            >
                                                {config.qualityRating || 'Unknown'}
                                            </Badge>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Phone Number ID</p>
                                            <p className="font-mono text-sm">{config.phoneNumberId || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Connected At</p>
                                            <p className="text-sm">{config.createdAt ? new Date(config.createdAt).toLocaleDateString() : 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {isPending && (
                            <Card className="mb-6 border-amber-200 bg-amber-50">
                                <CardHeader>
                                    <CardTitle className="text-amber-900">⚠️ Webhook Configuration Required</CardTitle>
                                    <CardDescription className="text-amber-700">
                                        Complete these final steps to start sending and receiving messages
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="p-4 bg-white rounded-lg border">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-sm font-medium">Callback URL</p>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => copyToClipboard(webhookUrl)}
                                                >
                                                    <Copy className="w-4 h-4 mr-1" />
                                                    Copy
                                                </Button>
                                            </div>
                                            <code className="block p-2 bg-gray-100 rounded text-sm break-all font-mono">
                                                {webhookUrl}
                                            </code>
                                        </div>

                                        <div className="p-4 bg-white rounded-lg border">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-sm font-medium">Verify Token</p>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => copyToClipboard(config.verifyToken || '')}
                                                >
                                                    <Copy className="w-4 h-4 mr-1" />
                                                    Copy
                                                </Button>
                                            </div>
                                            <code className="block p-2 bg-gray-100 rounded text-sm font-mono">
                                                {config.verifyToken}
                                            </code>
                                        </div>

                                        <div className="space-y-2">
                                            <h4 className="font-medium text-amber-900">Steps to complete:</h4>
                                            <ol className="list-decimal list-inside space-y-2 text-sm text-amber-800">
                                                <li>
                                                    Go to{' '}
                                                    <a
                                                        href="https://developers.facebook.com/apps"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="underline font-semibold inline-flex items-center gap-1 text-blue-600"
                                                    >
                                                        Meta App Dashboard
                                                        <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                </li>
                                                <li>Select your app and navigate to <strong>WhatsApp → Configuration</strong></li>
                                                <li>In the <strong>Webhook</strong> section, click <strong>"Edit"</strong></li>
                                                <li>Paste the <strong>Callback URL</strong> above</li>
                                                <li>Paste the <strong>Verify Token</strong> above</li>
                                                <li>Click <strong>"Verify and Save"</strong></li>
                                                <li>Under Webhook Fields, click <strong>"Manage"</strong> and subscribe to <strong>"messages"</strong></li>
                                                <li>Come back here and click the <strong>"Activate Connection"</strong> button below</li>
                                            </ol>
                                        </div>

                                        <Button onClick={handleActivate} className="w-full" size="lg">
                                            <CheckCircle2 className="w-4 h-4 mr-2" />
                                            Activate Connection
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {isConnected && (
                            <Card className="mb-6 border-green-200 bg-green-50">
                                <CardHeader>
                                    <CardTitle className="text-green-900">✅ Integration Active</CardTitle>
                                    <CardDescription className="text-green-700">
                                        Your WhatsApp Business API is connected and ready to use
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-green-800">
                                        You can now send and receive WhatsApp messages through the ChatSpace.
                                        Messages will be delivered to your connected phone number.
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        <Card className="border-red-100">
                            <CardHeader>
                                <CardTitle className="text-red-900">Danger Zone</CardTitle>
                                <CardDescription className="text-red-600">
                                    Irreversible actions - proceed with caution
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Disconnect WhatsApp Business API</p>
                                        <p className="text-sm text-gray-500">
                                            This will stop all message processing immediately
                                        </p>
                                    </div>
                                    <Button variant="destructive" onClick={handleDisconnect}>
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Disconnect
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </>
    );
}
