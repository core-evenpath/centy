'use client';

import { useState, useEffect } from 'react';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import {
    connectTelegramBot,
    disconnectTelegramBot,
    getTelegramStatus,
    refreshTelegramWebhook,
} from '@/actions/telegram-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    CheckCircle2,
    Loader2,
    AlertCircle,
    Bot,
    Shield,
    Zap,
    RefreshCw,
    ExternalLink,
    Trash2,
    Eye,
    EyeOff,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export default function TelegramAPIPage() {
    const { currentWorkspace, loading: authLoading } = useMultiWorkspaceAuth();
    const currentPartnerId = currentWorkspace?.partnerId;

    const [config, setConfig] = useState<any>(null);
    const [webhookInfo, setWebhookInfo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [botToken, setBotToken] = useState('');
    const [showToken, setShowToken] = useState(false);
    const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);

    useEffect(() => {
        async function loadStatus() {
            if (!currentPartnerId) return;

            setLoading(true);
            try {
                const status = await getTelegramStatus(currentPartnerId);
                setConfig(status.config);
                setWebhookInfo(status.webhookInfo);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        loadStatus();
    }, [currentPartnerId]);

    const handleConnect = async () => {
        if (!currentPartnerId || !botToken.trim()) {
            setError('Please enter a bot token');
            return;
        }

        setConnecting(true);
        setError(null);
        setSuccess(null);

        try {
            const result = await connectTelegramBot(currentPartnerId, botToken.trim());

            if (result.success) {
                setSuccess(result.message);
                setBotToken('');
                const status = await getTelegramStatus(currentPartnerId);
                setConfig(status.config);
                setWebhookInfo(status.webhookInfo);
            } else {
                setError(result.message);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        if (!currentPartnerId) return;

        setDisconnecting(true);
        setError(null);

        try {
            const result = await disconnectTelegramBot(currentPartnerId);

            if (result.success) {
                setSuccess(result.message);
                setConfig(null);
                setWebhookInfo(null);
            } else {
                setError(result.message);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setDisconnecting(false);
            setShowDisconnectDialog(false);
        }
    };

    const handleRefreshWebhook = async () => {
        if (!currentPartnerId) return;

        setError(null);
        try {
            const result = await refreshTelegramWebhook(currentPartnerId);

            if (result.success) {
                setSuccess(result.message);
                const status = await getTelegramStatus(currentPartnerId);
                setConfig(status.config);
                setWebhookInfo(status.webhookInfo);
            } else {
                setError(result.message);
            }
        } catch (err: any) {
            setError(err.message);
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

    return (
        <div className="container max-w-4xl py-8">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold">Telegram Bot API</h1>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        <Zap className="w-3 h-3 mr-1" />
                        Bot Integration
                    </Badge>
                </div>
                <p className="text-gray-600">
                    Connect your Telegram bot to send and receive messages directly in Centy
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
                                <Bot className="w-5 h-5" />
                                Connect Your Telegram Bot
                            </CardTitle>
                            <CardDescription>
                                Enter your Telegram bot token to start receiving messages
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <span className="text-blue-600 font-bold text-sm">1</span>
                                        </div>
                                        <div>
                                            <h4 className="font-medium">Create a Bot</h4>
                                            <p className="text-sm text-gray-600">
                                                Talk to @BotFather on Telegram
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <span className="text-blue-600 font-bold text-sm">2</span>
                                        </div>
                                        <div>
                                            <h4 className="font-medium">Get Bot Token</h4>
                                            <p className="text-sm text-gray-600">
                                                Copy the API token from @BotFather
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <span className="text-blue-600 font-bold text-sm">3</span>
                                        </div>
                                        <div>
                                            <h4 className="font-medium">Paste & Connect</h4>
                                            <p className="text-sm text-gray-600">
                                                Enter the token below
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="botToken">Bot Token</Label>
                                        <div className="relative">
                                            <Input
                                                id="botToken"
                                                type={showToken ? 'text' : 'password'}
                                                value={botToken}
                                                onChange={(e) => setBotToken(e.target.value)}
                                                placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                                                className="pr-10 font-mono"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowToken(!showToken)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            Your token looks like: 123456789:ABCdefGhIJKlmNoPQRsTUVwxYZ
                                        </p>
                                    </div>

                                    <Button
                                        onClick={handleConnect}
                                        disabled={connecting || !botToken.trim()}
                                        className="w-full bg-blue-600 hover:bg-blue-700"
                                    >
                                        {connecting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Connecting...
                                            </>
                                        ) : (
                                            <>
                                                <Bot className="w-4 h-4 mr-2" />
                                                Connect Bot
                                            </>
                                        )}
                                    </Button>
                                </div>

                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <h4 className="font-medium text-blue-900 mb-2">How to create a Telegram Bot:</h4>
                                    <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                                        <li>Open Telegram and search for @BotFather</li>
                                        <li>Send /newbot and follow the instructions</li>
                                        <li>Choose a name and username for your bot</li>
                                        <li>Copy the HTTP API token provided</li>
                                        <li>Paste it above and click Connect</li>
                                    </ol>
                                    <a
                                        href="https://core.telegram.org/bots#how-do-i-create-a-bot"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-3"
                                    >
                                        Learn more about Telegram bots
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Integration Features</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-start gap-3">
                                    <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium">Secure Token Storage</h4>
                                        <p className="text-sm text-gray-600">
                                            Your bot token is encrypted using AES-256-GCM
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Zap className="w-5 h-5 text-blue-600 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium">Real-time Messages</h4>
                                        <p className="text-sm text-gray-600">
                                            Receive messages instantly via webhooks
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Bot className="w-5 h-5 text-purple-600 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium">AI-Powered Replies</h4>
                                        <p className="text-sm text-gray-600">
                                            Use your AI agents to respond to messages
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-indigo-600 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium">Unified Inbox</h4>
                                        <p className="text-sm text-gray-600">
                                            Manage Telegram alongside WhatsApp
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
                                Current state of your Telegram bot integration
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
                                    ) : (
                                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                            <AlertCircle className="w-3 h-3 mr-1" />
                                            Pending Activation
                                        </Badge>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="text-sm text-gray-500">Bot Username</p>
                                        <p className="font-medium">@{config.botUsername}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Bot ID</p>
                                        <p className="font-mono text-sm">{config.botId}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Webhook Status</p>
                                        <p className="font-medium">
                                            {config.webhookConfigured ? (
                                                <span className="text-green-600">Configured</span>
                                            ) : (
                                                <span className="text-yellow-600">Not Configured</span>
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Connected At</p>
                                        <p className="text-sm">
                                            {config.createdAt ? new Date(config.createdAt).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                {webhookInfo && (
                                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <h4 className="font-medium text-blue-900 mb-2">Webhook Info</h4>
                                        <div className="text-sm text-blue-800 space-y-1">
                                            <p>URL: {webhookInfo.url || 'Not set'}</p>
                                            <p>Pending Updates: {webhookInfo.pending_update_count || 0}</p>
                                            {webhookInfo.last_error_message && (
                                                <p className="text-red-600">
                                                    Last Error: {webhookInfo.last_error_message}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {isConnected && (
                        <Card className="mb-6 border-green-200 bg-green-50">
                            <CardHeader>
                                <CardTitle className="text-green-900">Integration Active</CardTitle>
                                <CardDescription className="text-green-700">
                                    Your Telegram bot is connected and ready to receive messages
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-green-800">
                                    Users can now message your bot @{config.botUsername} on Telegram.
                                    Messages will appear in your Inbox.
                                </p>
                                <div className="flex gap-3">
                                    <Button asChild className="bg-green-600 hover:bg-green-700">
                                        <a href="/partner/inbox">
                                            Go to Inbox
                                        </a>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handleRefreshWebhook}
                                        className="border-green-600 text-green-700 hover:bg-green-100"
                                    >
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Refresh Webhook
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card className="border-red-200">
                        <CardHeader>
                            <CardTitle className="text-red-900">Danger Zone</CardTitle>
                            <CardDescription>
                                Disconnect your Telegram bot from this workspace
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                variant="destructive"
                                onClick={() => setShowDisconnectDialog(true)}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Disconnect Bot
                            </Button>
                        </CardContent>
                    </Card>
                </>
            )}

            <Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Disconnect Telegram Bot?</DialogTitle>
                        <DialogDescription>
                            This will remove the bot connection. You will stop receiving messages
                            from Telegram. Your conversation history will be preserved.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowDisconnectDialog(false)}
                        >
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
                                'Disconnect'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
