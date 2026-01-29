'use client';

import { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, RefreshCw, Database, AlertTriangle } from 'lucide-react';

interface SeedResult {
    success: boolean;
    summary: {
        industries: { seeded: number; errors: number };
        functions: { seeded: number; errors: number };
        specializations: { seeded: number; errors: number };
        countryOverrides: { seeded: number; errors: number };
        broadcastTemplates: { seeded: number; errors: number };
    };
    errors: string[];
    timestamp: string;
}

interface VerifyResult {
    success: boolean;
    counts: {
        industries: number;
        functions: number;
        specializations: number;
        countryOverrides: number;
        broadcastTemplates: number;
    };
    expected: {
        industries: number;
        functions: number;
        specializations: number;
        countryOverrides: number;
        broadcastTemplates: number;
    };
    inSync: boolean;
    lastSeededAt?: string;
}

export default function SeedTaxonomyPage() {
    const [user, setUser] = useState<User | null>(null);
    const [seedLoading, setSeedLoading] = useState(false);
    const [verifyLoading, setVerifyLoading] = useState(false); // Start false until we have a user
    const [seedResult, setSeedResult] = useState<SeedResult | null>(null);
    const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Auth Subscription
    useEffect(() => {
        const auth = getAuth(app);
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                // Auto-verify when user is found
                handleVerify(currentUser);
            }
        });

        return () => unsubscribe();
    }, []);

    const getToken = async (currentUser: User | null = user) => {
        if (!currentUser) throw new Error('Not authenticated');
        return await currentUser.getIdToken();
    };

    const handleVerify = async (currentUser: User | null = user) => {
        if (!currentUser) return;

        setVerifyLoading(true);
        setError(null);
        try {
            const token = await getToken(currentUser);
            const response = await fetch('/api/admin/seed-taxonomy', {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Verification failed');
            setVerifyResult(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setVerifyLoading(false);
        }
    };

    const handleSeed = async () => {
        if (!user) return;

        setSeedLoading(true);
        setError(null);
        try {
            const token = await getToken(user);
            const response = await fetch('/api/admin/seed-taxonomy', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Seeding failed');
            setSeedResult(data);
            await handleVerify(user);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSeedLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-10 px-4 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Database className="w-8 h-8 text-indigo-600" />
                    System Taxonomy Sync
                </h1>
                <p className="text-muted-foreground mt-2">
                    Sync business categories from code to Firestore for runtime access.
                </p>
            </div>

            {/* Sync Status Card */}
            <Card className={verifyResult?.inSync ? 'border-green-200 bg-green-50/50' : 'border-amber-200 bg-amber-50/50'}>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            {verifyLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : verifyResult?.inSync ? (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : (
                                <AlertTriangle className="w-5 h-5 text-amber-600" />
                            )}
                            Sync Status
                        </span>
                        <Badge variant={verifyResult?.inSync ? 'default' : 'destructive'}>
                            {verifyResult?.inSync ? 'In Sync' : 'Out of Sync'}
                        </Badge>
                    </CardTitle>
                    {verifyResult?.lastSeededAt && (
                        <CardDescription>
                            Last synced: {new Date(verifyResult.lastSeededAt).toLocaleString()}
                        </CardDescription>
                    )}
                </CardHeader>
                <CardContent>
                    {verifyResult && (
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                            {(['industries', 'functions', 'specializations', 'countryOverrides', 'broadcastTemplates'] as const).map(key => (
                                <div key={key} className="text-center p-3 bg-white rounded-lg border">
                                    <div className="text-2xl font-bold">
                                        {verifyResult.counts[key]}
                                        <span className="text-sm font-normal text-slate-400">
                                            /{verifyResult.expected[key]}
                                        </span>
                                    </div>
                                    <div className="text-xs text-slate-500 capitalize">
                                        {key.replace(/([A-Z])/g, ' $1').trim()}
                                    </div>
                                    {verifyResult.counts[key] !== verifyResult.expected[key] && (
                                        <Badge variant="destructive" className="mt-1 text-[10px]">
                                            Missing {verifyResult.expected[key] - verifyResult.counts[key]}
                                        </Badge>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Actions */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Actions</CardTitle>
                    <CardDescription>
                        Seed taxonomy data from code to Firestore. This operation is idempotent (safe to run multiple times).
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex gap-4">
                    <Button onClick={handleSeed} disabled={seedLoading || !user} size="lg">
                        {seedLoading ? (
                            <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Syncing...</>
                        ) : (
                            <><Database className="w-4 h-4 mr-2" /> Sync Now</>
                        )}
                    </Button>
                    <Button onClick={() => handleVerify(user)} disabled={verifyLoading || !user} variant="outline" size="lg">
                        <RefreshCw className={`w-4 h-4 mr-2 ${verifyLoading ? 'animate-spin' : ''}`} />
                        Refresh Status
                    </Button>
                </CardContent>
            </Card>

            {/* Error */}
            {error && (
                <Card className="mt-6 border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                        <p className="text-red-600 flex items-center gap-2">
                            <XCircle className="w-5 h-5" /> {error}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Seed Result */}
            {seedResult && (
                <Card className="mt-6 border-green-200">
                    <CardHeader>
                        <CardTitle className="text-green-600 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5" /> Sync Complete
                        </CardTitle>
                        <CardDescription>{seedResult.timestamp}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                <div className="text-2xl font-bold text-green-700">{seedResult.summary.industries.seeded}</div>
                                <div className="text-xs text-green-600">Industries</div>
                            </div>
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                <div className="text-2xl font-bold text-green-700">{seedResult.summary.functions.seeded}</div>
                                <div className="text-xs text-green-600">Functions</div>
                            </div>
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                <div className="text-2xl font-bold text-green-700">{seedResult.summary.specializations.seeded}</div>
                                <div className="text-xs text-green-600">Specializations</div>
                            </div>
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                <div className="text-2xl font-bold text-green-700">{seedResult.summary.countryOverrides.seeded}</div>
                                <div className="text-xs text-green-600">Overrides</div>
                            </div>
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                <div className="text-2xl font-bold text-green-700">{seedResult.summary.broadcastTemplates.seeded}</div>
                                <div className="text-xs text-green-600">Templates</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
