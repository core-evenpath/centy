"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Loader2, Copy } from 'lucide-react';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { useToast } from '@/hooks/use-toast';

export default function DebugSMSPage() {
  const { currentWorkspace } = useMultiWorkspaceAuth();
  const { toast } = useToast();
  const partnerId = currentWorkspace?.partnerId;

  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostics = async () => {
    setLoading(true);
    setDiagnostics(null);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (partnerId) params.append('partnerId', partnerId);
      if (customerPhone) params.append('customerPhone', customerPhone);

      console.log('Calling debug API with params:', { partnerId, customerPhone });
      
      const response = await fetch(`/api/debug/sms-flow?${params.toString()}`);
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Debug response:', data);
      
      setDiagnostics(data);

      if (data.rawError) {
        toast({
          title: 'Error',
          description: data.rawError.message,
          variant: 'destructive'
        });
      } else {
        const failedChecks = data.checks?.filter((c: any) => c.status === 'FAILED').length || 0;
        if (failedChecks > 0) {
          toast({
            title: 'Issues Found',
            description: `${failedChecks} check(s) failed`,
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Diagnostics Complete',
            description: 'All checks passed'
          });
        }
      }
    } catch (error: any) {
      console.error('Diagnostics error:', error);
      setError(error.message);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OK':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'WARNING':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: any = {
      'OK': 'bg-green-600',
      'FAILED': 'bg-red-600',
      'WARNING': 'bg-yellow-600',
      'INFO': 'bg-blue-600'
    };
    return <Badge className={colors[status] || 'bg-gray-600'}>{status}</Badge>;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: 'Text copied to clipboard' });
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">SMS Flow Debugger</h1>
        <p className="text-muted-foreground">
          Diagnose why SMS messages aren't appearing in the UI
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Run Diagnostics</CardTitle>
          <CardDescription>
            Test the complete SMS message flow from webhook to UI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Partner ID</Label>
              <Input 
                value={partnerId || ''} 
                readOnly 
                className="bg-muted font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>Customer Phone (Optional)</Label>
              <Input 
                placeholder="+1234567890"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter the customer's phone number to check specific conversations
              </p>
            </div>
          </div>

          <Button 
            onClick={runDiagnostics} 
            disabled={loading || !partnerId}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running Diagnostics...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Run Diagnostics
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            <p className="mb-2">{error}</p>
            <p className="text-xs">Check the browser console for more details</p>
          </AlertDescription>
        </Alert>
      )}

      {diagnostics && (
        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Diagnostics Results</AlertTitle>
            <AlertDescription>
              {diagnostics.timestamp ? (
                <>Checked at: {new Date(diagnostics.timestamp).toLocaleString()}</>
              ) : (
                <>Diagnostics completed</>
              )}
            </AlertDescription>
          </Alert>

          {diagnostics.checks && diagnostics.checks.length > 0 ? (
            diagnostics.checks.map((check: any, index: number) => (
              <Card key={index} className={check.status === 'FAILED' ? 'border-red-300 border-2' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(check.status)}
                      <CardTitle className="text-lg">{check.name}</CardTitle>
                    </div>
                    {getStatusBadge(check.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {check.message && (
                    <p className="text-sm font-medium">{check.message}</p>
                  )}

                  {check.value !== undefined && (
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded flex-1">{check.value}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(check.value)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  )}

                  {check.count !== undefined && (
                    <p className="text-sm text-muted-foreground">
                      Count: <strong>{check.count}</strong>
                    </p>
                  )}

                  {check.partners && check.partners.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2">Partners in Database:</p>
                      <div className="space-y-2">
                        {check.partners.map((partner: any, i: number) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-muted rounded">
                            <div>
                              <p className="text-sm font-medium">{partner.name}</p>
                              <p className="text-xs text-muted-foreground font-mono">ID: {partner.id}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-mono">{partner.phone || '❌ No phone'}</p>
                              {partner.whatsAppPhone && (
                                <p className="text-xs text-muted-foreground">{partner.whatsAppPhone}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {check.conversations && check.conversations.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2">Conversations Found:</p>
                      <div className="space-y-2">
                        {check.conversations.map((conv: any, i: number) => (
                          <div key={i} className="p-3 bg-muted rounded space-y-1">
                            <p className="text-xs font-mono">ID: {conv.id}</p>
                            <p className="text-xs">Customer: {conv.customerPhone}</p>
                            <p className="text-xs">Messages: {conv.messageCount}</p>
                            <p className="text-xs">Last Message: {conv.lastMessageAt || 'N/A'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {check.messages && check.messages.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2">Recent Messages:</p>
                      <div className="space-y-2">
                        {check.messages.map((msg: any, i: number) => (
                          <div key={i} className="p-3 bg-muted rounded space-y-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={msg.direction === 'inbound' ? 'default' : 'outline'}>
                                {msg.direction}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{msg.createdAt}</span>
                            </div>
                            <p className="text-sm">{msg.content}</p>
                            {msg.twilioSid && (
                              <p className="text-xs font-mono text-muted-foreground">
                                Twilio SID: {msg.twilioSid}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {check.logs && check.logs.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2">Recent Webhook Calls:</p>
                      <div className="space-y-2">
                        {check.logs.map((log: any, i: number) => (
                          <div key={i} className={`p-3 rounded ${log.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                            <div className="flex items-center gap-2 mb-1">
                              {log.success ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-600" />
                              )}
                              <span className="text-xs">{log.timestamp}</span>
                            </div>
                            <p className="text-xs">From: {log.from} → To: {log.to}</p>
                            <p className="text-xs">Message: {log.body}</p>
                            {log.error && (
                              <p className="text-xs text-red-600 mt-1 font-semibold">Error: {log.error}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {check.details && (
                    <details className="mt-2">
                      <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                        View Raw Details
                      </summary>
                      <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto max-h-60">
                        {JSON.stringify(check.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>No Results</AlertTitle>
              <AlertDescription>
                Diagnostics returned no checks. This may indicate an API error.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Common Issues & Solutions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div className="p-4 border-l-4 border-red-500 bg-red-50">
              <p className="font-semibold text-red-900">❌ Phone Number Mapping Failed</p>
              <p className="text-red-800 mt-1">
                Your partner document doesn't have a <code className="bg-red-100 px-1 rounded">phone</code> field matching your Twilio number.
              </p>
              <div className="mt-2 text-xs text-red-800">
                <p className="font-semibold">Fix:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Go to <a href="https://console.firebase.google.com" target="_blank" className="underline">Firestore Console</a></li>
                  <li>Navigate to <code className="bg-red-100 px-1 rounded">partners</code> collection</li>
                  <li>Find your partner document</li>
                  <li>Add field: <code className="bg-red-100 px-1 rounded">phone</code> = <code className="bg-red-100 px-1 rounded">{process.env.TWILIO_PHONE_NUMBER || 'your Twilio SMS number'}</code></li>
                  <li>Save and run diagnostics again</li>
                </ol>
              </div>
            </div>

            <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50">
              <p className="font-semibold text-yellow-900">⚠️ No Webhook Logs</p>
              <p className="text-yellow-800 mt-1">
                No webhook calls detected - Twilio may not be configured correctly.
              </p>
              <div className="mt-2 text-xs text-yellow-800">
                <p className="font-semibold">Fix:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Go to <a href="https://console.twilio.com" target="_blank" className="underline">Twilio Console</a></li>
                  <li>Verify webhook URL: <code className="bg-yellow-100 px-1 rounded">https://www.centy.dev/api/webhooks/twilio/sms</code></li>
                  <li>Ensure HTTP method is set to <strong>POST</strong></li>
                  <li>Send a test SMS and check the Live Monitor</li>
                </ol>
              </div>
            </div>

            <div className="p-4 border-l-4 border-blue-500 bg-blue-50">
              <p className="font-semibold text-blue-900">💡 Messages Created But Not Visible</p>
              <p className="text-blue-800 mt-1">
                Messages exist in Firestore but aren't showing in the UI.
              </p>
              <div className="mt-2 text-xs text-blue-800">
                <p className="font-semibold">Possible causes:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Firestore security rules blocking reads</li>
                  <li>Conversation ID mismatch</li>
                  <li>partnerId not matching current user</li>
                  <li>Real-time listener not subscribed correctly</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}