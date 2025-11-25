'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import type { MetaWhatsAppConfig } from '@/lib/types-meta-whatsapp';

interface DiagnosticsProps {
    config: Omit<MetaWhatsAppConfig, 'encryptedAccessToken'> | null;
}

export default function Diagnostics({ config }: DiagnosticsProps) {
    if (!config) return null;

    const issues: string[] = [];
    const warnings: string[] = [];

    if (!config.wabaId) issues.push('Missing WhatsApp Business Account ID');
    if (!config.phoneNumberId || config.phoneNumberId === 'pending') issues.push('Missing Phone Number ID');
    if (!config.appId) issues.push('Missing Meta App ID');
    if (!config.webhookConfigured) warnings.push('Webhook might not be fully configured');
    if (config.status !== 'active') warnings.push('Connection is not active');

    if (issues.length === 0 && warnings.length === 0) {
        return (
            <Alert className="mb-6 bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">System Healthy</AlertTitle>
                <AlertDescription className="text-green-700">
                    All required configurations are present.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="mb-6 space-y-4">
            {issues.length > 0 && (
                <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Configuration Issues</AlertTitle>
                    <AlertDescription>
                        <ul className="list-disc list-inside mt-2">
                            {issues.map((issue, index) => (
                                <li key={index}>{issue}</li>
                            ))}
                        </ul>
                    </AlertDescription>
                </Alert>
            )}
            {warnings.length > 0 && (
                <Alert className="bg-amber-50 border-amber-200">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-800">Warnings</AlertTitle>
                    <AlertDescription className="text-amber-700">
                        <ul className="list-disc list-inside mt-2">
                            {warnings.map((warning, index) => (
                                <li key={index}>{warning}</li>
                            ))}
                        </ul>
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
