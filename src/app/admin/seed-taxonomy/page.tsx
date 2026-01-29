'use client';

import { useState } from 'react';
import { getAuth } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

export default function SeedTaxonomyPage() {
    const [seedLoading, setSeedLoading] = useState(false);
    const [verifyLoading, setVerifyLoading] = useState(false);
    const [seedResult, setSeedResult] = useState<any>(null);
    const [verifyResult, setVerifyResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const getAuthToken = async () => {
        const auth = getAuth(app);
        const user = auth.currentUser;

        if (!user) {
            throw new Error('You must be logged in to perform this action');
        }

        return await user.getIdToken();
    };

    const handleSeedTaxonomy = async () => {
        setSeedLoading(true);
        setError(null);
        setSeedResult(null);

        try {
            const token = await getAuthToken();

            const response = await fetch('/api/admin/seed-taxonomy', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.details || 'Failed to seed taxonomy');
            }

            setSeedResult(data);
        } catch (err: any) {
            setError(err.message);
            console.error('Error seeding taxonomy:', err);
        } finally {
            setSeedLoading(false);
        }
    };

    const handleVerifyData = async () => {
        setVerifyLoading(true);
        setError(null);
        setVerifyResult(null);

        try {
            const token = await getAuthToken();

            const response = await fetch('/api/admin/seed-taxonomy', {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.details || 'Failed to verify taxonomy');
            }

            setVerifyResult(data);
        } catch (err: any) {
            setError(err.message);
            console.error('Error verifying taxonomy:', err);
        } finally {
            setVerifyLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-10 px-4">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold mb-2">Seed System Taxonomy</h1>
                    <p className="text-muted-foreground">
                        Seed and verify the systemTaxonomy collections in Firestore. This operation is
                        idempotent and safe to run multiple times.
                    </p>
                </div>

                {/* Action Buttons */}
                <Card>
                    <CardHeader>
                        <CardTitle>Actions</CardTitle>
                        <CardDescription>
                            Use these buttons to seed or verify taxonomy data
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex gap-4">
                        <Button
                            onClick={handleSeedTaxonomy}
                            disabled={seedLoading}
                            size="lg"
                            variant="default"
                        >
                            {seedLoading ? 'Seeding...' : 'Seed Taxonomy'}
                        </Button>
                        <Button
                            onClick={handleVerifyData}
                            disabled={verifyLoading}
                            size="lg"
                            variant="outline"
                        >
                            {verifyLoading ? 'Verifying...' : 'Verify Data'}
                        </Button>
                    </CardContent>
                </Card>

                {/* Error Display */}
                {error && (
                    <Card className="border-red-500">
                        <CardHeader>
                            <CardTitle className="text-red-600">Error</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-red-600">{error}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Seed Results */}
                {seedResult && (
                    <Card className={seedResult.success ? 'border-green-500' : 'border-yellow-500'}>
                        <CardHeader>
                            <CardTitle className={seedResult.success ? 'text-green-600' : 'text-yellow-600'}>
                                {seedResult.success ? '✓ Seeding Complete' : '⚠ Seeding Completed with Errors'}
                            </CardTitle>
                            <CardDescription>{seedResult.message}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Summary */}
                            <div>
                                <h3 className="font-semibold mb-2">Summary</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium">Industries:</span>{' '}
                                        {seedResult.summary.industries.seeded} seeded
                                        {seedResult.summary.industries.errors > 0 &&
                                            `, ${seedResult.summary.industries.errors} errors`}
                                    </div>
                                    <div>
                                        <span className="font-medium">Functions:</span>{' '}
                                        {seedResult.summary.functions.seeded} seeded
                                        {seedResult.summary.functions.errors > 0 &&
                                            `, ${seedResult.summary.functions.errors} errors`}
                                    </div>
                                    <div>
                                        <span className="font-medium">Specializations:</span>{' '}
                                        {seedResult.summary.specializations.seeded} seeded
                                        {seedResult.summary.specializations.errors > 0 &&
                                            `, ${seedResult.summary.specializations.errors} errors`}
                                    </div>
                                    <div>
                                        <span className="font-medium">Country Overrides:</span>{' '}
                                        {seedResult.summary.countryOverrides.seeded} seeded
                                        {seedResult.summary.countryOverrides.errors > 0 &&
                                            `, ${seedResult.summary.countryOverrides.errors} errors`}
                                    </div>
                                    <div>
                                        <span className="font-medium">Broadcast Templates:</span>{' '}
                                        {seedResult.summary.broadcastTemplates.seeded} seeded
                                        {seedResult.summary.broadcastTemplates.errors > 0 &&
                                            `, ${seedResult.summary.broadcastTemplates.errors} errors`}
                                    </div>
                                </div>
                            </div>

                            {/* Errors */}
                            {seedResult.errors && seedResult.errors.length > 0 && (
                                <div>
                                    <h3 className="font-semibold mb-2 text-red-600">Errors</h3>
                                    <div className="bg-red-50 p-4 rounded-md max-h-60 overflow-y-auto">
                                        <ul className="text-sm text-red-800 space-y-1">
                                            {seedResult.errors.map((err: string, idx: number) => (
                                                <li key={idx}>• {err}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Verify Results */}
                {verifyResult && (
                    <Card className="border-blue-500">
                        <CardHeader>
                            <CardTitle className="text-blue-600">✓ Verification Complete</CardTitle>
                            <CardDescription>{verifyResult.message}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div>
                                <h3 className="font-semibold mb-2">Document Counts</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium">Industries:</span>{' '}
                                        {verifyResult.counts.industries}
                                    </div>
                                    <div>
                                        <span className="font-medium">Functions:</span>{' '}
                                        {verifyResult.counts.functions}
                                    </div>
                                    <div>
                                        <span className="font-medium">Specializations:</span>{' '}
                                        {verifyResult.counts.specializations}
                                    </div>
                                    <div>
                                        <span className="font-medium">Country Overrides:</span>{' '}
                                        {verifyResult.counts.countryOverrides}
                                    </div>
                                    <div>
                                        <span className="font-medium">Broadcast Templates:</span>{' '}
                                        {verifyResult.counts.broadcastTemplates}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>About This Tool</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground space-y-2">
                        <p>
                            This tool seeds the <code className="bg-muted px-1 py-0.5 rounded">systemTaxonomy</code>{' '}
                            collections in Firestore with:
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                            <li>14 Industries</li>
                            <li>~100 Business Functions</li>
                            <li>~20 Specializations</li>
                            <li>~400 Country Overrides</li>
                            <li>8 Broadcast Templates</li>
                        </ul>
                        <p className="mt-4">
                            The seeding operation uses <code className="bg-muted px-1 py-0.5 rounded">merge: true</code>,
                            making it safe to run multiple times without creating duplicates.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
