'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import Link from 'next/link';
import {
    getRelayConfigAction,
    saveRelayConfigAction,
    runRelayDiagnosticsAction,
    getRelayConversationsAction,
} from '@/actions/relay-actions';
import type { RelayConfig, DiagnosticCheck, RelayConversation } from '@/actions/relay-actions';
import RelayChatSetup from '@/components/partner/relay/RelayChatSetup';
import RelayStorefrontManager from '@/components/partner/relay/RelayStorefrontManager';
import TestChatPanel from '@/components/partner/relay/test-chat/TestChatPanel';
import { DEFAULT_THEME } from '@/components/relay/blocks/types';
import type { RelayTheme } from '@/components/relay/blocks/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Zap,
    Settings,
    Code,
    MessageSquare,
    Copy,
    Check,
    RefreshCw,
    CheckCircle,
    AlertTriangle,
    XCircle,
    Loader2,
    Save,
    ExternalLink,
    Play,
    GitBranch,
    Layers,
} from 'lucide-react';

const DEFAULT_CONFIG: RelayConfig = {
    enabled: false,
    brandName: '',
    tagline: '',
    brandEmoji: '💬',
    accentColor: '#6366f1',
    welcomeMessage: 'Hi! How can I help you today?',
};

const ACCENT_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
    '#f97316', '#eab308', '#22c55e', '#06b6d4',
];

const EMOJI_OPTIONS = ['💬', '🤖', '✨', '🏨', '🍽️', '💼', '🎯', '🌟'];

// ── Diagnostic fix links ─────────────────────────────────────────────

const DIAG_LINKS: Record<string, string> = {
    'Widget Configuration': '/partner/relay',
    'RAG Store': '/partner/core',
    'Knowledge Documents': '/partner/core',
    'Module Data': '/partner/relay/modules',
    'Relay Block Configs': '/admin/modules/new',
};

// ── Theme builder from accent color ──────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
    const h = hex.replace('#', '');
    return [
        parseInt(h.substring(0, 2), 16),
        parseInt(h.substring(2, 4), 16),
        parseInt(h.substring(4, 6), 16),
    ];
}

function rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}

function buildThemeFromAccent(accent: string): RelayTheme {
    const [r, g, b] = hexToRgb(accent);
    return {
        ...DEFAULT_THEME,
        accent,
        accentHi: rgbToHex(r + 30, g + 30, b + 30),
        accentDk: rgbToHex(r - 25, g - 25, b - 25),
        accentBg: `rgba(${r},${g},${b},0.06)`,
        accentBg2: `rgba(${r},${g},${b},0.13)`,
    };
}

// ── Chat message type ────────────────────────────────────────────────

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    blockId?: string;
    blockData?: Record<string, unknown>;
    suggestions?: string[];
}

export default function PartnerRelayPage() {
    const { currentWorkspace, loading: authLoading } = useMultiWorkspaceAuth();
    const partnerId = currentWorkspace?.partnerId;

    const [config, setConfig] = useState<RelayConfig>(DEFAULT_CONFIG);
    const [configLoading, setConfigLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [copied, setCopied] = useState(false);
    const [diagnostics, setDiagnostics] = useState<DiagnosticCheck[]>([]);
    const [diagRunning, setDiagRunning] = useState(false);
    const [conversations, setConversations] = useState<RelayConversation[]>([]);
    const [convoLoading, setConvoLoading] = useState(true);

    // Chat test state
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatSending, setChatSending] = useState(false);
    const [conversationId] = useState(() => `test_${Date.now()}`);

    // Compute relay theme from accent color
    const relayTheme = useMemo(() => buildThemeFromAccent(config.accentColor), [config.accentColor]);

    // ── Load config via server action ────────────────────────────────

    useEffect(() => {
        if (!partnerId) return;
        (async () => {
            try {
                const result = await getRelayConfigAction(partnerId);
                if (result.success && result.config) {
                    setConfig({ ...DEFAULT_CONFIG, ...result.config });
                }
            } catch (e) {
                console.error('Failed to load relay config:', e);
            } finally {
                setConfigLoading(false);
            }
        })();
    }, [partnerId]);

    // ── Save config via server action ────────────────────────────────

    const handleSave = async () => {
        if (!partnerId) return;
        setSaving(true);
        try {
            const result = await saveRelayConfigAction(partnerId, config);
            if (result.success) {
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
            } else {
                alert(`Failed to save: ${result.error}`);
            }
        } catch (e) {
            console.error('Failed to save relay config:', e);
            alert('Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // ── Copy embed code ──────────────────────────────────────────────

    const embedCode = `<script src="https://pingbox.io/relay/widget.js"></script>\n<div data-pingbox-widget data-partner-id="${partnerId || 'YOUR_PARTNER_ID'}"></div>`;

    const handleCopy = () => {
        navigator.clipboard.writeText(embedCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // ── Diagnostics via server action ────────────────────────────────

    const runDiagnostics = useCallback(async () => {
        if (!partnerId) return;
        setDiagRunning(true);
        try {
            const result = await runRelayDiagnosticsAction(partnerId);
            if (result.success) {
                setDiagnostics(result.checks);
            }
        } catch (e) {
            console.error('Diagnostics failed:', e);
        } finally {
            setDiagRunning(false);
        }
    }, [partnerId]);

    useEffect(() => {
        if (partnerId) {
            runDiagnostics();
        }
    }, [partnerId, runDiagnostics]);

    // ── Conversations via server action ──────────────────────────────

    useEffect(() => {
        if (!partnerId) { setConvoLoading(false); return; }
        (async () => {
            try {
                const result = await getRelayConversationsAction(partnerId);
                if (result.success) {
                    setConversations(result.conversations);
                }
            } catch {
                // Collection may not exist yet
            } finally {
                setConvoLoading(false);
            }
        })();
    }, [partnerId]);

    // ── Chat test ────────────────────────────────────────────────────

    const sendChatMessage = async (messageText: string) => {
        const text = messageText.trim();
        if (!text || !partnerId || chatSending) return;

        const userMsg: ChatMessage = { role: 'user', content: text };
        const updatedMessages = [...chatMessages, userMsg];
        setChatMessages(updatedMessages);
        setChatSending(true);

        try {
            const res = await fetch('/api/relay/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    partnerId,
                    conversationId,
                    messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
                }),
            });

            const data = await res.json();

            if (data.success && data.response) {
                // The server response is now admin-registry-first:
                //   { type: 'text', blockId?, text, suggestions? }
                // `blockId` (when present) maps to a preview component in
                // src/app/admin/relay/blocks/previews/**. No partner-data
                // payload — the preview is a self-contained design.
                const assistantMsg: ChatMessage = {
                    role: 'assistant',
                    content: data.response.text || '',
                    blockId: typeof data.response.blockId === 'string' ? data.response.blockId : undefined,
                    blockData: data.response.blockData && typeof data.response.blockData === 'object'
                        ? data.response.blockData
                        : undefined,
                    suggestions: Array.isArray(data.response.suggestions) ? data.response.suggestions : undefined,
                };
                setChatMessages(prev => [...prev, assistantMsg]);
            } else {
                setChatMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `Error: ${data.error || 'Unknown error'}`,
                }]);
            }
        } catch (e: any) {
            setChatMessages(prev => [...prev, {
                role: 'assistant',
                content: `Network error: ${e.message}`,
            }]);
        } finally {
            setChatSending(false);
        }
    };

    // ── Loading / auth guard ─────────────────────────────────────────

    if (authLoading || configLoading) {
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

    // ── Render ───────────────────────────────────────────────────────

    const DiagIcon = ({ status }: { status: string }) => {
        if (status === 'pass') return <CheckCircle className="h-4 w-4 text-green-500" />;
        if (status === 'warn') return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
        if (status === 'fail') return <XCircle className="h-4 w-4 text-red-500" />;
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    };

    return (
        <div className="container mx-auto py-8 px-6 max-w-4xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Zap className="h-6 w-6" /> Relay
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Configure your embeddable chat widget
                    </p>
                </div>
            </div>

            <RelayChatSetup
                partnerId={partnerId}
                currentSlug={config.relaySlug || null}
                onSlugUpdated={(newSlug) => setConfig(c => ({ ...c, relaySlug: newSlug }))}
            />

            <Tabs defaultValue="test" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="test" className="gap-2">
                        <Play className="h-4 w-4" /> Test Chat
                    </TabsTrigger>
                    <TabsTrigger value="setup" className="gap-2">
                        <Settings className="h-4 w-4" /> Setup
                    </TabsTrigger>
                    <TabsTrigger value="embed" className="gap-2">
                        <Code className="h-4 w-4" /> Embed & Diagnostics
                    </TabsTrigger>
                    <TabsTrigger value="conversations" className="gap-2">
                        <MessageSquare className="h-4 w-4" /> Conversations
                    </TabsTrigger>
                    <TabsTrigger value="flows" className="gap-2">
                        <GitBranch className="h-4 w-4" /> Flows
                    </TabsTrigger>
                    <TabsTrigger value="storefront">Storefront</TabsTrigger>
                </TabsList>

                {/* ── Section 0: Test Chat ──────────────────────────── */}
                <TabsContent value="test" className="space-y-6">
                    <TestChatPanel
                        brandName={config.brandName || 'Relay'}
                        brandEmoji={config.brandEmoji}
                        tagline={config.welcomeMessage || config.tagline}
                        theme={relayTheme}
                        messages={chatMessages}
                        sending={chatSending}
                        onSend={sendChatMessage}
                        onClear={() => setChatMessages([])}
                    />
                </TabsContent>

                {/* ── Section 1: Setup ──────────────────────────────── */}
                <TabsContent value="setup" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Widget Configuration</CardTitle>
                            <CardDescription>
                                Customize how the Relay chat widget appears on your website
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Enable toggle */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Enable Widget</p>
                                    <p className="text-sm text-muted-foreground">
                                        Allow the chat widget to appear on your site
                                    </p>
                                </div>
                                <Button
                                    variant={config.enabled ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setConfig(c => ({ ...c, enabled: !c.enabled }))}
                                >
                                    {config.enabled ? 'Enabled' : 'Disabled'}
                                </Button>
                            </div>

                            {/* Brand name */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Brand Name</label>
                                <Input
                                    value={config.brandName}
                                    onChange={e => setConfig(c => ({ ...c, brandName: e.target.value }))}
                                    placeholder="Your business name"
                                />
                            </div>

                            {/* Tagline */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tagline</label>
                                <Input
                                    value={config.tagline}
                                    onChange={e => setConfig(c => ({ ...c, tagline: e.target.value }))}
                                    placeholder="A short description of your business"
                                />
                            </div>

                            {/* Emoji picker */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Brand Emoji</label>
                                <div className="flex gap-2 flex-wrap">
                                    {EMOJI_OPTIONS.map(emoji => (
                                        <button
                                            key={emoji}
                                            onClick={() => setConfig(c => ({ ...c, brandEmoji: emoji }))}
                                            className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center border-2 transition-colors ${
                                                config.brandEmoji === emoji
                                                    ? 'border-primary bg-primary/10'
                                                    : 'border-transparent hover:border-muted-foreground/30'
                                            }`}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Accent color */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Accent Color</label>
                                <div className="flex gap-2 flex-wrap">
                                    {ACCENT_COLORS.map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setConfig(c => ({ ...c, accentColor: color }))}
                                            className={`w-8 h-8 rounded-full border-2 transition-all ${
                                                config.accentColor === color
                                                    ? 'border-foreground scale-110'
                                                    : 'border-transparent hover:scale-105'
                                            }`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Welcome message */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Welcome Message</label>
                                <Textarea
                                    value={config.welcomeMessage}
                                    onChange={e => setConfig(c => ({ ...c, welcomeMessage: e.target.value }))}
                                    placeholder="Hi! How can I help you today?"
                                    rows={3}
                                />
                            </div>

                            {/* Save */}
                            <Button onClick={handleSave} disabled={saving} className="w-full">
                                {saving ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : saved ? (
                                    <Check className="mr-2 h-4 w-4" />
                                ) : (
                                    <Save className="mr-2 h-4 w-4" />
                                )}
                                {saved ? 'Saved!' : saving ? 'Saving...' : 'Save Configuration'}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── Section 2: Embed Code & Diagnostics ──────────── */}
                <TabsContent value="embed" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Embed Code</CardTitle>
                            <CardDescription>
                                Add this snippet to your website to display the chat widget
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="relative">
                                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap">
                                    {embedCode}
                                </pre>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="absolute top-2 right-2"
                                    onClick={handleCopy}
                                >
                                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Diagnostics</CardTitle>
                                    <CardDescription>
                                        Check that everything is configured for the widget to work
                                    </CardDescription>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={runDiagnostics}
                                    disabled={diagRunning}
                                >
                                    <RefreshCw className={`mr-2 h-4 w-4 ${diagRunning ? 'animate-spin' : ''}`} />
                                    Re-run
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {diagRunning && diagnostics.length === 0 && (
                                    <div className="flex justify-center py-4">
                                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                )}
                                {diagnostics.map((check, i) => (
                                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                                        <DiagIcon status={check.status} />
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">{check.label}</p>
                                            <p className="text-xs text-muted-foreground">{check.description}</p>
                                            {check.fix && check.status !== 'pass' && (
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <p className="text-xs text-yellow-600">Fix: {check.fix}</p>
                                                    {DIAG_LINKS[check.label] && (
                                                        <Link
                                                            href={DIAG_LINKS[check.label]}
                                                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                                        >
                                                            Go <ExternalLink className="h-3 w-3" />
                                                        </Link>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {!diagRunning && diagnostics.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        Click &quot;Re-run&quot; to check your setup.
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── Section 3: Conversations ─────────────────────── */}
                <TabsContent value="conversations" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Conversations</CardTitle>
                            <CardDescription>
                                Conversations from visitors interacting with your Relay widget
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {convoLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : conversations.length === 0 ? (
                                <div className="text-center py-12">
                                    <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                                    <p className="font-medium">No conversations yet</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Embed the widget on your website or use the Test Chat tab to start a conversation.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {conversations.map(convo => (
                                        <div
                                            key={convo.id}
                                            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                                                {convo.visitorName.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-sm truncate">
                                                        {convo.visitorName}
                                                    </p>
                                                    <Badge variant="secondary" className="text-xs shrink-0">
                                                        {convo.messageCount} msg{convo.messageCount !== 1 ? 's' : ''}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {convo.lastMessage}
                                                </p>
                                            </div>
                                            <span className="text-xs text-muted-foreground shrink-0">
                                                {convo.timestamp ? new Date(convo.timestamp).toLocaleDateString() : ''}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── Section 5: Flows ─────────────────────────── */}
                <TabsContent value="flows" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Conversation Flows</CardTitle>
                            <CardDescription>
                                Configure how your AI assistant guides visitors through the sales journey
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild>
                                <Link href="/partner/relay/flows">
                                    <GitBranch className="h-4 w-4 mr-2" />
                                    Open Flow Editor
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Block Configurations</CardTitle>
                            <CardDescription>
                                Browse and toggle the block designs the AI assistant can use when replying to visitors.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild variant="outline">
                                <Link href="/partner/relay/blocks">
                                    <Layers className="h-4 w-4 mr-2" />
                                    Open Block Configurations
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="storefront">
                    <RelayStorefrontManager partnerId={partnerId!} accentColor={config.accentColor} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
