'use client';

import { useEffect, useState, useCallback } from 'react';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { db } from '@/lib/firebase';
import {
    doc,
    getDoc,
    setDoc,
    collection,
    query,
    orderBy,
    limit,
    getDocs,
    where,
    Timestamp,
} from 'firebase/firestore';
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
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────

interface RelayConfig {
    enabled: boolean;
    brandName: string;
    tagline: string;
    brandEmoji: string;
    accentColor: string;
    welcomeMessage: string;
    updatedAt?: string;
}

interface DiagnosticCheck {
    label: string;
    status: 'pass' | 'warn' | 'fail' | 'loading';
    description: string;
    fix?: string;
}

interface RelayConversation {
    id: string;
    visitorName: string;
    lastMessage: string;
    timestamp: string;
    messageCount: number;
}

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

// ── Page Component ───────────────────────────────────────────────────

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

    // ── Load config ──────────────────────────────────────────────────

    useEffect(() => {
        if (!partnerId || !db) return;
        (async () => {
            try {
                const snap = await getDoc(doc(db, 'partners', partnerId, 'relayConfig', 'config'));
                if (snap.exists()) {
                    setConfig({ ...DEFAULT_CONFIG, ...snap.data() as RelayConfig });
                }
            } catch (e) {
                console.error('Failed to load relay config:', e);
            } finally {
                setConfigLoading(false);
            }
        })();
    }, [partnerId]);

    // ── Save config ──────────────────────────────────────────────────

    const handleSave = async () => {
        if (!partnerId || !db) return;
        setSaving(true);
        try {
            await setDoc(doc(db, 'partners', partnerId, 'relayConfig', 'config'), {
                ...config,
                updatedAt: new Date().toISOString(),
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
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

    // ── Diagnostics ──────────────────────────────────────────────────

    const runDiagnostics = useCallback(async () => {
        if (!partnerId || !db) return;
        setDiagRunning(true);

        const checks: DiagnosticCheck[] = [
            { label: 'Widget Configuration', status: 'loading', description: 'Checking...' },
            { label: 'RAG Store', status: 'loading', description: 'Checking...' },
            { label: 'Knowledge Documents', status: 'loading', description: 'Checking...' },
            { label: 'Module Data', status: 'loading', description: 'Checking...' },
            { label: 'Relay Block Configs', status: 'loading', description: 'Checking...' },
        ];
        setDiagnostics([...checks]);

        // Check 1: Widget config
        try {
            const snap = await getDoc(doc(db, 'partners', partnerId, 'relayConfig', 'config'));
            if (snap.exists() && snap.data().brandName) {
                checks[0] = { label: 'Widget Configuration', status: 'pass', description: 'Brand name and config set' };
            } else {
                checks[0] = { label: 'Widget Configuration', status: 'warn', description: 'No brand name configured', fix: 'Fill in the Setup tab above' };
            }
        } catch {
            checks[0] = { label: 'Widget Configuration', status: 'fail', description: 'Could not read config', fix: 'Check Firestore permissions' };
        }
        setDiagnostics([...checks]);

        // Check 2: RAG Store
        try {
            const snap = await getDocs(collection(db, 'partners', partnerId, 'fileSearchStores'));
            const active = snap.docs.filter(d => d.data().status === 'active');
            if (active.length > 0) {
                checks[1] = { label: 'RAG Store', status: 'pass', description: `${active.length} active store(s)` };
            } else {
                checks[1] = { label: 'RAG Store', status: 'warn', description: 'No active RAG store', fix: 'Upload documents in Core Memory' };
            }
        } catch {
            checks[1] = { label: 'RAG Store', status: 'warn', description: 'No RAG store found', fix: 'Upload documents in Core Memory' };
        }
        setDiagnostics([...checks]);

        // Check 3: Knowledge docs
        try {
            const q = query(
                collection(db, 'partners', partnerId, 'vaultFiles'),
                where('state', '==', 'ACTIVE'),
            );
            const snap = await getDocs(q);
            if (snap.size > 0) {
                checks[2] = { label: 'Knowledge Documents', status: 'pass', description: `${snap.size} active document(s)` };
            } else {
                checks[2] = { label: 'Knowledge Documents', status: 'warn', description: 'No knowledge documents', fix: 'Upload files in Core Memory' };
            }
        } catch {
            checks[2] = { label: 'Knowledge Documents', status: 'warn', description: 'Could not check documents' };
        }
        setDiagnostics([...checks]);

        // Check 4: Module data
        try {
            const q = query(
                collection(db, 'partners', partnerId, 'modules'),
                where('isEnabled', '==', true),
            );
            const snap = await getDocs(q);
            if (snap.size > 0) {
                checks[3] = { label: 'Module Data', status: 'pass', description: `${snap.size} enabled module(s)` };
            } else {
                checks[3] = { label: 'Module Data', status: 'warn', description: 'No enabled modules', fix: 'Enable modules in the Modules tab' };
            }
        } catch {
            checks[3] = { label: 'Module Data', status: 'warn', description: 'Could not check modules' };
        }
        setDiagnostics([...checks]);

        // Check 5: Relay block configs (global collection)
        try {
            const snap = await getDocs(collection(db, 'relayBlockConfigs'));
            if (snap.size > 0) {
                checks[4] = { label: 'Relay Block Configs', status: 'pass', description: `${snap.size} block config(s)` };
            } else {
                checks[4] = { label: 'Relay Block Configs', status: 'warn', description: 'No relay block configs', fix: 'Generate modules in Admin > Modules' };
            }
        } catch {
            checks[4] = { label: 'Relay Block Configs', status: 'warn', description: 'Could not check block configs' };
        }
        setDiagnostics([...checks]);
        setDiagRunning(false);
    }, [partnerId]);

    useEffect(() => {
        if (partnerId && db) {
            runDiagnostics();
        }
    }, [partnerId, runDiagnostics]);

    // ── Conversations ────────────────────────────────────────────────

    useEffect(() => {
        if (!partnerId || !db) { setConvoLoading(false); return; }
        (async () => {
            try {
                const q = query(
                    collection(db, 'relayConversations'),
                    where('partnerId', '==', partnerId),
                    orderBy('updatedAt', 'desc'),
                    limit(20),
                );
                const snap = await getDocs(q);
                setConversations(snap.docs.map(d => {
                    const data = d.data();
                    const ts = data.updatedAt instanceof Timestamp
                        ? data.updatedAt.toDate().toISOString()
                        : data.updatedAt || '';
                    return {
                        id: d.id,
                        visitorName: data.visitorName || 'Anonymous',
                        lastMessage: data.lastMessage || '',
                        timestamp: ts,
                        messageCount: data.messageCount || 0,
                    };
                }));
            } catch {
                // Collection may not exist yet
            } finally {
                setConvoLoading(false);
            }
        })();
    }, [partnerId]);

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

            <Tabs defaultValue="setup" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="setup" className="gap-2">
                        <Settings className="h-4 w-4" /> Setup
                    </TabsTrigger>
                    <TabsTrigger value="embed" className="gap-2">
                        <Code className="h-4 w-4" /> Embed & Diagnostics
                    </TabsTrigger>
                    <TabsTrigger value="conversations" className="gap-2">
                        <MessageSquare className="h-4 w-4" /> Conversations
                    </TabsTrigger>
                </TabsList>

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
                                {diagnostics.map((check, i) => (
                                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                                        <DiagIcon status={check.status} />
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">{check.label}</p>
                                            <p className="text-xs text-muted-foreground">{check.description}</p>
                                            {check.fix && (
                                                <p className="text-xs text-yellow-600 mt-1">Fix: {check.fix}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {diagnostics.length === 0 && (
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
                                        Embed the widget on your website to start receiving visitors.
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
            </Tabs>
        </div>
    );
}
