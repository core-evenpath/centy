"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Loader2, AlertCircle, Copy, RefreshCw, Trash2, Radio } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface WebhookLog {
  id: string;
  platform: 'sms' | 'whatsapp';
  success: boolean;
  error: string | null;
  timestamp: string;
  from: string | null;
  to: string | null;
  body: string | null;
  messageSid: string | null;
  payload: any;
}

interface PhoneMapping {
  phoneNumber: string;
  partnerId: string;
  partnerName: string;
}

export default function WebhookTestPage() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [mappings, setMappings] = useState<PhoneMapping[]>([]);
  const [loadingMappings, setLoadingMappings] = useState(false);
  const [isLiveMonitoring, setIsLiveMonitoring] = useState(false);
  const [webhookUrls, setWebhookUrls] = useState({ sms: '', whatsapp: '' });

  useEffect(() => {
    const baseUrl = 'https://www.centy.dev';
    setWebhookUrls({
      sms: `${baseUrl}/api/webhooks/twilio/sms`,
      whatsapp: `${baseUrl}/api/webhooks/twilio/whatsapp`
    });
    loadLogs();
    loadMappings();
  }, []);

  useEffect(() => {
    if (isLiveMonitoring) {
      const interval = setInterval(() => {
        loadLogs();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isLiveMonitoring]);

  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      const response = await fetch('/api/webhooks/logs');
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const clearLogs = async () => {
    try {
      const response = await fetch('/api/webhooks/logs', { method: 'DELETE' });
      if (response.ok) {
        setLogs([]);
        toast({ title: 'Success', description: 'Logs cleared' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to clear logs', variant: 'destructive' });
    }
  };

  const loadMappings = async () => {
    setLoadingMappings(true);
    try {
      const response = await fetch('/api/webhooks/twilio/mappings');
      if (response.ok) {
        const data = await response.json();
        setMappings(data.mappings || []);
      }
    } catch (error) {
      console.error('Error loading mappings:', error);
    } finally {
      setLoadingMappings(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: 'URL copied to clipboard' });
  };

  const getStatusBadge = (log: WebhookLog) => {
    if (log.success) {
      return <Badge className="bg-green-600">Success</Badge>;
    }
    return <Badge variant="destructive">Failed</Badge>;
  };

  const getPlatformBadge = (platform: string) => {
    if (platform === 'whatsapp') {
      return <Badge variant="outline" className="bg-green-50">WhatsApp</Badge>;
    }
    return <Badge variant="outline" className="bg-blue-50">SMS</Badge>;
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Real-Time Webhook Monitor</h1>
        <p className="text-muted-foreground">
          Monitor incoming webhook calls from Twilio in real-time
        </p>
      </div>

      <Tabs defaultValue="monitor" className="space-y-4">
        <TabsList>
          <TabsTrigger value="monitor">Live Monitor</TabsTrigger>
          <TabsTrigger value="mappings">Phone Mappings</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="monitor" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Radio className={`w-5 h-5 ${isLiveMonitoring ? 'text-red-600 animate-pulse' : 'text-gray-400'}`} />
                    Incoming Webhook Calls
                  </CardTitle>
                  <CardDescription>
                    {isLiveMonitoring ? 'Auto-refreshing every 3 seconds' : 'Paused'}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={isLiveMonitoring ? 'destructive' : 'default'}
                    onClick={() => setIsLiveMonitoring(!isLiveMonitoring)}
                    size="sm"
                  >
                    {isLiveMonitoring ? 'Stop' : 'Start'} Live Monitor
                  </Button>
                  <Button variant="outline" onClick={loadLogs} size="sm" disabled={loadingLogs}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${loadingLogs ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button variant="outline" onClick={clearLogs} size="sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No Webhook Calls Detected</AlertTitle>
                  <AlertDescription>
                    <div className="space-y-2 mt-2">
                      <p>No incoming webhook calls have been received yet.</p>
                      <p className="text-sm font-semibold">To test:</p>
                      <ol className="list-decimal list-inside text-sm space-y-1 ml-2">
                        <li>Ensure your Twilio webhook is configured to: <code className="text-xs bg-muted px-1 py-0.5 rounded">{webhookUrls.sms}</code></li>
                        <li>Send an SMS or WhatsApp message to your Twilio number</li>
                        <li>Watch this page for incoming webhook calls</li>
                        <li>If nothing appears, check your Twilio webhook configuration</li>
                      </ol>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => (
                    <Card key={log.id} className={log.success ? 'border-green-200' : 'border-red-200'}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getPlatformBadge(log.platform)}
                            {getStatusBadge(log)}
                            <span className="text-xs text-muted-foreground">
                              {log.timestamp ? formatDistanceToNow(new Date(log.timestamp), { addSuffix: true }) : 'Unknown time'}
                            </span>
                          </div>
                          <span className="text-xs font-mono text-muted-foreground">{log.messageSid}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                          <div>
                            <span className="text-muted-foreground">From:</span>
                            <span className="ml-2 font-mono">{log.from || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">To:</span>
                            <span className="ml-2 font-mono">{log.to || 'N/A'}</span>
                          </div>
                        </div>

                        {log.body && (
                          <div className="text-sm mb-2">
                            <span className="text-muted-foreground">Message:</span>
                            <p className="mt-1 p-2 bg-muted rounded text-sm">{log.body}</p>
                          </div>
                        )}

                        {!log.success && log.error && (
                          <Alert variant="destructive" className="mt-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription className="text-xs">{log.error}</AlertDescription>
                          </Alert>
                        )}

                        <details className="mt-2">
                          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                            View Full Payload
                          </summary>
                          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-40">
                            {JSON.stringify(log.payload, null, 2)}
                          </pre>
                        </details>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>How to Test</AlertTitle>
            <AlertDescription>
              <ol className="list-decimal list-inside space-y-1 text-sm mt-2">
                <li>Start the live monitor above</li>
                <li>Send a test SMS or WhatsApp message to your Twilio number</li>
                <li>Watch for the webhook call to appear here within 3 seconds</li>
                <li>Check if it succeeded or failed</li>
                <li>If failed, check the error message for details</li>
              </ol>
              <p className="mt-3 text-xs">
                <strong>Expected webhook URL:</strong> <code className="bg-muted px-1 py-0.5 rounded">{webhookUrls.sms}</code>
              </p>
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="mappings" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Phone Number Mappings</CardTitle>
                <Button variant="outline" size="sm" onClick={loadMappings}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${loadingMappings ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              <CardDescription>
                Phone numbers mapped to partners for routing incoming messages
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingMappings ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Loading mappings...</p>
                </div>
              ) : mappings.length === 0 ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No Phone Mappings Found</AlertTitle>
                  <AlertDescription>
                    <p className="mb-2">
                      Phone mappings are required to route incoming messages to the correct partner.
                      Without mappings, all incoming messages will be rejected.
                    </p>
                    <p className="text-xs font-mono bg-muted p-2 rounded mt-2">
                      Run: npm run create-phone-mapping
                    </p>
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  {mappings.map((mapping, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-mono text-sm">{mapping.phoneNumber}</p>
                        <p className="text-xs text-muted-foreground">{mapping.partnerName}</p>
                      </div>
                      <Badge variant="outline">{mapping.partnerId}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Webhook URLs for Twilio</CardTitle>
              <CardDescription>
                Configure these exact URLs in your Twilio Console
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-900">Important: Use HTTPS URLs</AlertTitle>
                <AlertDescription className="text-blue-800 text-sm">
                  Twilio requires HTTPS webhook URLs. The URLs below are the correct production URLs for www.centy.dev.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
                  <label className="text-sm font-semibold text-blue-900">SMS Webhook URL</label>
                  <div className="flex gap-2 mt-2">
                    <Input 
                      readOnly 
                      value={webhookUrls.sms} 
                      className="font-mono text-sm bg-white"
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => copyToClipboard(webhookUrls.sms)}
                      className="shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use this URL in Twilio Console → Phone Numbers → Your SMS Number → Messaging Configuration
                  </p>
                </div>

                <div className="p-4 border-2 border-green-200 rounded-lg bg-green-50">
                  <label className="text-sm font-semibold text-green-900">WhatsApp Webhook URL</label>
                  <div className="flex gap-2 mt-2">
                    <Input 
                      readOnly 
                      value={webhookUrls.whatsapp} 
                      className="font-mono text-sm bg-white"
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => copyToClipboard(webhookUrls.whatsapp)}
                      className="shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use this URL in Twilio Console → Messaging → WhatsApp Sandbox Settings
                  </p>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Twilio Configuration Steps</AlertTitle>
                <AlertDescription className="text-sm space-y-3">
                  <div>
                    <p className="font-semibold">For SMS:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Go to <a href="https://console.twilio.com/us1/develop/phone-numbers/manage/incoming" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Twilio Phone Numbers</a></li>
                      <li>Click on your phone number</li>
                      <li>Scroll to "Messaging Configuration"</li>
                      <li>Under "A MESSAGE COMES IN", select "Webhook"</li>
                      <li>Paste: <code className="bg-muted px-1 py-0.5 rounded text-xs">{webhookUrls.sms}</code></li>
                      <li>Set HTTP method to <strong>POST</strong></li>
                      <li>Click "Save"</li>
                    </ol>
                  </div>
                  
                  <div>
                    <p className="font-semibold">For WhatsApp:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Go to <a href="https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">WhatsApp Sandbox</a></li>
                      <li>Click "Sandbox Settings"</li>
                      <li>Under "When a message comes in", select "Webhook"</li>
                      <li>Paste: <code className="bg-muted px-1 py-0.5 rounded text-xs">{webhookUrls.whatsapp}</code></li>
                      <li>Set HTTP method to <strong>POST</strong></li>
                      <li>Click "Save"</li>
                    </ol>
                  </div>

                  <div className="pt-2 border-t">
                    <p className="font-semibold text-red-600">⚠️ Common Mistakes to Avoid:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2 text-xs">
                      <li>Don't use HTTP (must be HTTPS)</li>
                      <li>Don't use localhost or 127.0.0.1</li>
                      <li>Don't forget to set HTTP method to POST</li>
                      <li>Don't include query parameters or trailing slashes</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Verify Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle>Test Your Configuration</AlertTitle>
                <AlertDescription className="text-sm">
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Copy the webhook URL above</li>
                    <li>Configure it in Twilio Console</li>
                    <li>Go to the "Live Monitor" tab</li>
                    <li>Click "Start Live Monitor"</li>
                    <li>Send a test message to your Twilio number</li>
                    <li>You should see the webhook call appear within 3 seconds</li>
                  </ol>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
