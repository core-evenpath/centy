'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, CheckCircle2, Circle, AlertCircle, Copy, ExternalLink } from 'lucide-react';

interface SetupStep {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'in-progress' | 'completed';
    substeps?: string[];
    curlCommand?: string;
    metaLink?: string;
}

interface SetupGuideProps {
    currentStatus?: 'disconnected' | 'pending' | 'active';
    hasPhoneNumberId?: boolean;
    hasAppId?: boolean;
}

export default function SetupGuide({ currentStatus, hasPhoneNumberId, hasAppId }: SetupGuideProps) {
    const [expandedStep, setExpandedStep] = useState<string | null>('step1');
    const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

    const steps: SetupStep[] = [
        {
            id: 'step1',
            title: 'Get Meta WhatsApp Business Credentials',
            description: 'Set up your Meta App and WhatsApp Business Account',
            status: currentStatus === 'disconnected' ? 'in-progress' : 'completed',
            metaLink: 'https://developers.facebook.com/apps',
            substeps: [
                'Go to Meta for Developers (developers.facebook.com)',
                'Create a new App or select existing one',
                'Add "WhatsApp" product to your app',
                'Note down your App ID (e.g., 1411415467214690)',
                'Create or select a WhatsApp Business Account (WABA)',
                'Note down your WABA ID (15+ digits)',
                'Add a phone number to your WABA',
                'Generate a Permanent Access Token',
            ],
        },
        {
            id: 'step2',
            title: 'Connect WhatsApp to Centy',
            description: 'Enter your credentials in the form above',
            status: currentStatus === 'disconnected' ? 'pending' : 'completed',
            substeps: [
                'Fill in WABA ID',
                'Fill in Display Phone Number (e.g., +91 89030 39009)',
                'Fill in Access Token',
                'Fill in Business Name (optional)',
                'Fill in Meta App ID',
                'Leave Phone Number ID empty for now',
                'Click "Connect WhatsApp Business"',
            ],
        },
        {
            id: 'step3',
            title: 'Discover & Select Phone Number',
            description: 'Find your phone number and get its ID',
            status: !hasPhoneNumberId ? 'in-progress' : 'completed',
            substeps: [
                'Scroll to "Discover Your Phone Numbers" card',
                'Click "Discover Phone Numbers" button',
                'Review the list of phone numbers from your WABA',
                'Check verification status of each number',
                'Click "Select" on the phone you want to use',
                'Configuration will auto-update with Phone Number ID',
            ],
        },
        {
            id: 'step4',
            title: 'Register Phone Number for Messaging',
            description: 'Enable the phone to send/receive messages',
            status: 'pending',
            curlCommand: `curl -X POST "https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID/register" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"messaging_product":"whatsapp","pin":"YOUR_6_DIGIT_PIN"}'`,
            substeps: [
                'If you have two-step verification: Use the curl command with your PIN',
                'If no two-step verification: Remove the pin parameter',
                'Expected response: {"success": true}',
                'Your phone is now registered for messaging!',
            ],
        },
        {
            id: 'step5',
            title: 'Subscribe App to WABA',
            description: 'Connect your app to receive webhooks',
            status: 'pending',
            curlCommand: `curl -X POST "https://graph.facebook.com/v18.0/YOUR_WABA_ID/subscribed_apps" \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"`,
            substeps: [
                'Run the curl command with your WABA ID',
                'Expected response: {"success": true}',
                'Verify subscription with GET request',
                'Your app is now subscribed to the WABA',
            ],
        },
        {
            id: 'step6',
            title: 'Configure Webhook in Meta',
            description: 'Set up webhook URL and verify token',
            status: 'pending',
            metaLink: 'https://developers.facebook.com/apps',
            substeps: [
                'Go to your Meta App Dashboard',
                'Navigate to WhatsApp > Configuration',
                'Click "Edit" in Webhook section',
                'Callback URL: https://www.centy.dev/api/webhooks/meta/whatsapp',
                'Verify Token: (shown in Centy settings above)',
                'Click "Verify and Save"',
                'You should see "Webhook verified successfully"',
            ],
        },
        {
            id: 'step7',
            title: 'Subscribe to Webhook Fields',
            description: 'Enable message event notifications',
            status: 'pending',
            substeps: [
                'In Meta App Dashboard, find "Webhook fields"',
                'Check the box for "messages"',
                'Check the box for "message_template_status_update" (optional)',
                'Click "Subscribe" or "Save"',
                'Both fields should show "Subscribed" status',
            ],
        },
        {
            id: 'step8',
            title: 'Activate Connection',
            description: 'Make the integration live',
            status: currentStatus === 'active' ? 'completed' : 'pending',
            substeps: [
                'Return to Centy settings page',
                'Scroll to connection status',
                'Click "Activate Connection" button',
                'Status should change to "Connected"',
                'Integration is now active!',
            ],
        },
        {
            id: 'step9',
            title: 'Test Messaging',
            description: 'Verify send and receive functionality',
            status: 'pending',
            curlCommand: `curl -X POST "https://www.centy.dev/api/webhooks/meta/whatsapp" \\
  -H "Content-Type: application/json" \\
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{"changes": [{"value": {
      "messages": [{"from": "918008968303", "text": {"body": "Test!"}}]
    }}]}]
  }'`,
            substeps: [
                'Send a message from Centy to your phone',
                'Send a message from your phone to the business number',
                'Both should appear in /partner/inbox',
                'Use curl command to simulate incoming message (optional)',
                '✅ Integration complete!',
            ],
        },
    ];

    const copyToClipboard = (text: string, commandId: string) => {
        navigator.clipboard.writeText(text);
        setCopiedCommand(commandId);
        setTimeout(() => setCopiedCommand(null), 2000);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle2 className="w-5 h-5 text-green-600" />;
            case 'in-progress':
                return <Circle className="w-5 h-5 text-blue-600 fill-blue-600" />;
            default:
                return <Circle className="w-5 h-5 text-gray-300" />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return <Badge className="bg-green-500">Completed</Badge>;
            case 'in-progress':
                return <Badge className="bg-blue-500">In Progress</Badge>;
            default:
                return <Badge variant="outline">Pending</Badge>;
        }
    };

    return (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle>📖 WhatsApp Integration Setup Guide</CardTitle>
                <CardDescription>
                    Complete step-by-step instructions to integrate Meta WhatsApp Business API
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Alert className="mb-4 bg-blue-50 border-blue-200">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-800">Setup Overview</AlertTitle>
                    <AlertDescription className="text-blue-700 text-sm">
                        This guide walks you through connecting your WhatsApp Business Account to Centy.
                        Each step builds on the previous one. Click on any step to expand detailed instructions.
                    </AlertDescription>
                </Alert>

                <div className="space-y-3">
                    {steps.map((step, index) => (
                        <div
                            key={step.id}
                            className={`border rounded-lg transition-all ${step.status === 'in-progress' ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                                }`}
                        >
                            <button
                                onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                                className="w-full p-4 flex items-start gap-3 text-left hover:bg-gray-50 transition-colors"
                            >
                                {getStatusIcon(step.status)}
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-semibold text-sm">
                                            Step {index + 1}: {step.title}
                                        </h4>
                                        {getStatusBadge(step.status)}
                                    </div>
                                    <p className="text-xs text-gray-600">{step.description}</p>
                                </div>
                                {expandedStep === step.id ? (
                                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                ) : (
                                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                )}
                            </button>

                            {expandedStep === step.id && (
                                <div className="px-4 pb-4 pt-2 border-t">
                                    {step.substeps && (
                                        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 mb-4">
                                            {step.substeps.map((substep, idx) => (
                                                <li key={idx} className="ml-2">{substep}</li>
                                            ))}
                                        </ol>
                                    )}

                                    {step.curlCommand && (
                                        <div className="mt-3 p-3 bg-gray-900 rounded-lg">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs text-green-400 font-semibold">Terminal Command:</span>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => copyToClipboard(step.curlCommand!, step.id)}
                                                    className="text-green-400 hover:text-green-300"
                                                >
                                                    <Copy className="w-3 h-3 mr-1" />
                                                    {copiedCommand === step.id ? 'Copied!' : 'Copy'}
                                                </Button>
                                            </div>
                                            <pre className="text-xs text-green-400 overflow-x-auto whitespace-pre-wrap">
                                                {step.curlCommand}
                                            </pre>
                                        </div>
                                    )}

                                    {step.metaLink && (
                                        <a
                                            href={step.metaLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 mt-3"
                                        >
                                            <ExternalLink className="w-3 h-3" />
                                            Open in Meta Dashboard
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <Alert className="mt-6 bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Need Help?</AlertTitle>
                    <AlertDescription className="text-green-700 text-sm">
                        If you encounter any issues, refer to the{' '}
                        <a
                            href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline font-semibold"
                        >
                            Meta WhatsApp Cloud API documentation
                        </a>{' '}
                        or check the curl commands in each step for troubleshooting.
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    );
}
