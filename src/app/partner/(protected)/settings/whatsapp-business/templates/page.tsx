'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TemplatesPage() {
    return (
        <div className="container max-w-4xl py-8">
            <Link
                href="/partner/settings/whatsapp-business"
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Settings
            </Link>

            <div className="mb-8">
                <h1 className="text-3xl font-bold">Message Templates</h1>
                <p className="text-gray-600 mt-2">
                    Create and manage WhatsApp message templates
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Template Management
                    </CardTitle>
                    <CardDescription>
                        Coming Soon - Full template creation and management
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                        Message templates will allow you to:
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-2 mb-6">
                        <li>Create pre-approved templates for initiating conversations</li>
                        <li>Manage template variables and placeholders</li>
                        <li>Track template approval status</li>
                        <li>Send templates to customers</li>
                    </ul>
                    <p className="text-sm text-gray-500">
                        This feature requires full backend integration and will be available after completing the webhook setup.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
