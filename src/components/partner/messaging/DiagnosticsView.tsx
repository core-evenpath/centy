// src/components/partner/messaging/DiagnosticsView.tsx
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Wrench, Copy, AlertCircle, CheckCircle as CheckCircleIcon, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MessagingDiagnostics {
  configOk: boolean;
  accountSid: boolean;
  authToken: boolean;
  smsNumber: boolean;
  whatsAppNumber: boolean;
  baseUrl: string;
}

interface DiagnosticsViewProps {
  diagnostics: MessagingDiagnostics | null;
  onBack: () => void;
}

export default function DiagnosticsView({ diagnostics, onBack }: DiagnosticsViewProps) {
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: 'Webhook URL copied to clipboard.' });
  };

  if (!diagnostics) {
    return (
      <Card className="m-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Messaging Diagnostics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="ml-2">Loading diagnostics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const smsWebhookUrl = `${diagnostics.baseUrl}/api/webhooks/twilio/sms`;
  const whatsappWebhookUrl = `${diagnostics.baseUrl}/api/webhooks/twilio/whatsapp`;

  const CheckItem = ({ label, isOk }: { label: string; isOk: boolean }) => (
    <li className="flex items-center gap-2 text-sm">
      {isOk ? (
        <CheckCircleIcon className="w-4 h-4 text-green-500" />
      ) : (
        <XCircle className="w-4 h-4 text-red-500" />
      )}
      <span className={isOk ? 'text-gray-700' : 'text-red-600'}>{label}</span>
    </li>
  );

  return (
    <Card className="m-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="w-5 h-5" />
          Messaging Diagnostics
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Configuration status and webhook URLs for Twilio integration
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="font-medium mb-2">Configuration Status</h4>
          <ul className="space-y-2">
            <CheckItem label="Twilio Account SID" isOk={diagnostics.accountSid} />
            <CheckItem label="Twilio Auth Token" isOk={diagnostics.authToken} />
            <CheckItem label="SMS Phone Number" isOk={diagnostics.smsNumber} />
            <CheckItem label="WhatsApp Number" isOk={diagnostics.whatsAppNumber} />
          </ul>
        </div>

        {(!diagnostics.configOk) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Incomplete Configuration</AlertTitle>
            <AlertDescription>
              Some Twilio credentials are missing. Please check your environment variables.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <h4 className="font-medium">SMS Webhook URL</h4>
          <div className="flex items-center gap-2">
            <Input 
              readOnly 
              value={smsWebhookUrl} 
              className="font-mono text-xs" 
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => copyToClipboard(smsWebhookUrl)}
            >
              <Copy className="w-3 h-3 mr-1" />
              Copy
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            In your Twilio Console, set the webhook for your SMS number to this URL with the `HTTP POST` method.
          </p>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium">WhatsApp Webhook URL</h4>
          <div className="flex items-center gap-2">
            <Input 
              readOnly 
              value={whatsappWebhookUrl} 
              className="font-mono text-xs" 
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => copyToClipboard(whatsappWebhookUrl)}
            >
              <Copy className="w-3 h-3 mr-1" />
              Copy
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            In your Twilio Console, set the webhook for your WhatsApp sender to this URL with the `HTTP POST` method.
          </p>
        </div>

        <div className="pt-4">
          <Button variant="outline" onClick={onBack}>
            Back to Messages
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
