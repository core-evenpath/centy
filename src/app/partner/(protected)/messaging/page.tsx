
// src/app/partner/(protected)/messaging/page.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { 
  MessageSquare, 
  Send, 
  Phone, 
  Search, 
  Plus,
  Loader2,
  CheckCheck,
  Check,
  Clock,
  AlertCircle,
  MessageCircle as WhatsAppIcon,
  Info,
  Image as ImageIcon,
  FileText,
  Download,
  Copy,
  Wrench,
  XCircle,
  CheckCircle as CheckCircleIcon,
  MoreVertical,
  Settings,
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { sendSMSAction } from '@/actions/sms-actions';
import { sendWhatsAppMessageAction } from '@/actions/whatsapp-actions';
import type { SMSConversation, SMSMessage, WhatsAppConversation, WhatsAppMessage, MessageAttachment } from '@/lib/types';
import { formatDistanceToNow, format } from 'date-fns';

type Platform = 'sms' | 'whatsapp';
type UnifiedConversation = (SMSConversation | WhatsAppConversation) & { platform: Platform };
type UnifiedMessage = (SMSMessage | WhatsAppMessage) & { platform: Platform };

interface MessagingDiagnostics {
  configOk: boolean;
  accountSid: boolean;
  authToken: boolean;
  smsNumber: boolean;
  whatsAppNumber: boolean;
  baseUrl: string;
}

export default function MessagingPage() {
  const { user, currentWorkspace } = useMultiWorkspaceAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const audioRef = useRef<HTMLAudioElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const [conversations, setConversations] = useState<UnifiedConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<UnifiedConversation | null>(null);
  const [messages, setMessages] = useState<UnifiedMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnostics, setDiagnostics] = useState<MessagingDiagnostics | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);

  const partnerId = currentWorkspace?.partnerId || user?.customClaims?.partnerId;
  const conversationIdFromUrl = searchParams.get('conversation');

  // Fetch diagnostics info
  useEffect(() => {
    async function fetchDiagnostics() {
      try {
        const response = await fetch('/api/diagnostics/messaging');
        if (response.ok) {
          const data = await response.json();
          setDiagnostics(data);
        }
      } catch (error) {
        console.error("Failed to fetch messaging diagnostics", error);
      }
    }
    fetchDiagnostics();
  }, []);

  // Load and consolidate conversations for both platforms
  useEffect(() => {
    if (!partnerId || !db) {
      setIsLoadingConversations(false);
      return;
    }

    setIsLoadingConversations(true);

    const smsQuery = query(
      collection(db, 'smsConversations'),
      where('partnerId', '==', partnerId),
      orderBy('lastMessageAt', 'desc')
    );

    const whatsappQuery = query(
      collection(db, 'whatsappConversations'),
      where('partnerId', '==', partnerId),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubSMS = onSnapshot(smsQuery, (snapshot) => {
      const smsConvos = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, platform: 'sms' as Platform } as UnifiedConversation));
      updateConversations(smsConvos, 'sms');
    });

    const unsubWhatsApp = onSnapshot(whatsappQuery, (snapshot) => {
      const waConvos = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, platform: 'whatsapp' as Platform } as UnifiedConversation));
      updateConversations(waConvos, 'whatsapp');
    });

    // Helper to merge conversations
    const updateConversations = (newConvos: UnifiedConversation[], platform: Platform) => {
      setConversations(prev => {
        const otherPlatformConvos = prev.filter(c => c.platform !== platform);
        const allConvos = [...otherPlatformConvos, ...newConvos];

        // Group by customer phone number
        const groupedByPhone = allConvos.reduce((acc, convo) => {
          const phone = convo.customerPhone;
          if (!acc[phone]) {
            acc[phone] = [];
          }
          acc[phone].push(convo);
          return acc;
        }, {} as Record<string, UnifiedConversation[]>);

        // Consolidate groups
        const consolidated = Object.values(groupedByPhone).map(group => {
          if (group.length === 1) {
            return group[0];
          } else {
            // Prioritize WhatsApp if available, or the most recent one
            const mainConvo = group.find(c => c.platform === 'whatsapp') || group.sort((a,b) => (b.lastMessageAt?.toMillis() || 0) - (a.lastMessageAt?.toMillis() || 0))[0];
            
            // Aggregate message counts, etc. if needed
            const totalMessages = group.reduce((sum, c) => sum + (c.messageCount || 0), 0);
            
            return {
              ...mainConvo,
              messageCount: totalMessages,
              // Add a field to indicate it's a consolidated conversation
              consolidatedFrom: group.map(c => ({ id: c.id, platform: c.platform })),
            };
          }
        });

        return consolidated.sort((a, b) => (b.lastMessageAt?.toMillis() || 0) - (a.lastMessageAt?.toMillis() || 0));
      });
      setIsLoadingConversations(false);
    };

    return () => {
      unsubSMS();
      unsubWhatsApp();
    };
  }, [partnerId]);
  
  // Select conversation from URL parameter
  useEffect(() => {
    if (conversationIdFromUrl && conversations.length > 0) {
      const convoToSelect = conversations.find(c => c.id === conversationIdFromUrl);
      if (convoToSelect) {
        setSelectedConversation(convoToSelect);
        // Clean the URL
        router.replace('/partner/messaging');
      }
    }
  }, [conversationIdFromUrl, conversations, router]);

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedConversation?.id || !db) {
      setMessages([]);
      return;
    }

    setIsLoadingMessages(true);
    const collectionName = selectedConversation.platform === 'sms' ? 'smsMessages' : 'whatsappMessages';
    const messagesQuery = query(
      collection(db, collectionName),
      where('conversationId', '==', selectedConversation.id),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id, ...doc.data(), platform: selectedConversation.platform
      } as UnifiedMessage));
      
      // Only play sound for new incoming messages
      if (newMessages.length > messages.length) {
        const lastNewMessage = newMessages[newMessages.length - 1];
        if (lastNewMessage.direction === 'inbound' && messages.length > 0) {
          audioRef.current?.play().catch(e => console.log("Audio play failed:", e));
        }
      }
      
      setMessages(newMessages);
      setIsLoadingMessages(false);
    });

    return () => unsubscribe();
  }, [selectedConversation?.id, selectedConversation?.platform]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() && !mediaUrl) return;
    if (!partnerId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Partner ID not found' });
      return;
    }
  
    let phoneNumber = '';
    let conversationId = '';
    let platform = selectedConversation?.platform || 'whatsapp';
  
    if (selectedConversation) {
      phoneNumber = selectedConversation.customerPhone;
      conversationId = selectedConversation.id;
      platform = selectedConversation.platform;
    } else if (showNewConversation && newPhoneNumber) {
      phoneNumber = newPhoneNumber;
    } else {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select a conversation or enter a phone number' });
      return;
    }
  
    setIsSending(true);
    const currentMessage = messageInput;
    const currentMediaUrl = mediaUrl;
    setMessageInput('');
    setMediaUrl(null);
  
    try {
      let result;
      
      if (platform === 'sms') {
        result = await sendSMSAction({ 
          partnerId, 
          to: phoneNumber, 
          message: currentMessage.trim() || undefined,
          conversationId,
          mediaUrl: currentMediaUrl || undefined
        });
      } else {
        result = await sendWhatsAppMessageAction({ 
          partnerId, 
          to: phoneNumber, 
          message: currentMessage.trim() || undefined,
          conversationId,
          mediaUrl: currentMediaUrl || undefined
        });
      }
  
      if (result.success) {
        setNewPhoneNumber('');
        setShowNewConversation(false);
        if (result.conversationId && !selectedConversation) {
          const newConvo = conversations.find(c => c.id === result.conversationId);
          if (newConvo) setSelectedConversation(newConvo);
        }
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
        setMessageInput(currentMessage);
        setMediaUrl(currentMediaUrl);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({ variant: 'destructive', title: 'Error', description: `Failed to send ${platform === 'sms' ? 'SMS' : 'WhatsApp message'}` });
      setMessageInput(currentMessage);
      setMediaUrl(currentMediaUrl);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredConversations = conversations
    .filter(conv =>
      conv.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.customerPhone?.includes(searchTerm)
    );

  const getMessageStatusIcon = (status?: string) => {
    switch (status) {
      case 'delivered':
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      case 'sent':
        return <Check className="w-3 h-3 text-gray-500" />;
      case 'failed':
      case 'undelivered':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return <Clock className="w-3 h-3 text-gray-400" />;
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return format(date, 'p'); // Just time: 2:30 PM
    } else if (diffInHours < 168) { // Less than a week
      return format(date, 'EEE p'); // Day and time: Mon 2:30 PM
    } else {
      return format(date, 'MMM d, p'); // Date and time: Jan 15, 2:30 PM
    }
  };

  const formatConversationTimestamp = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  };
  
  const renderMessageContent = (message: UnifiedMessage) => {
    const hasAttachments = message.attachments && message.attachments.length > 0;
  
    if (hasAttachments) {
      return (
        <div className="space-y-2">
          {message.attachments!.map((attachment, index) => {
            const attachmentUrl = attachment.url;
            const attachmentType = attachment.mimeType || '';
  
            if (attachmentType.startsWith('image/')) {
              return (
                <a 
                  key={index}
                  href={attachmentUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block"
                >
                  <img 
                    src={attachmentUrl} 
                    alt={attachment.name || 'attachment'} 
                    className="rounded-lg max-w-sm w-full cursor-pointer hover:opacity-90 transition-opacity" 
                    loading="lazy"
                  />
                </a>
              );
            } else if (attachmentType.startsWith('video/')) {
              return (
                <video 
                  key={index}
                  src={attachmentUrl} 
                  controls 
                  className="rounded-lg max-w-sm w-full"
                >
                  Your browser does not support the video tag.
                </video>
              );
            } else if (attachmentType.startsWith('audio/')) {
              return (
                <audio 
                  key={index}
                  src={attachmentUrl} 
                  controls 
                  className="w-full max-w-sm"
                >
                  Your browser does not support the audio tag.
                </audio>
              );
            } else {
              return (
                <a 
                  key={index}
                  href={attachmentUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <FileText className="w-5 h-5 text-gray-500" />
                  <span className="text-sm">{attachment.name || 'File'}</span>
                  <Download className="w-4 h-4 ml-auto text-gray-500" />
                </a>
              );
            }
          })}
          {message.content && (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          )}
        </div>
      );
    }
    
    // Only render text content if no attachments
    return <p className="whitespace-pre-wrap break-words">{message.content}</p>;
  };

  const getPlatformBadge = (platform: Platform) => {
    return platform === 'sms' ? (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
        <Phone className="w-3 h-3 mr-1" />
        SMS
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        <WhatsAppIcon className="w-3 h-3 mr-1" />
        WhatsApp
      </Badge>
    );
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: 'Webhook URL copied to clipboard.' });
  };

  const DiagnosticsView = () => {
    if (!diagnostics) {
      return (
        <Card className="m-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Wrench className="w-5 h-5" />Messaging Diagnostics</CardTitle>
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
        {isOk ? <CheckCircleIcon className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
        <span className={isOk ? 'text-foreground' : 'text-red-500'}>{label}</span>
      </li>
    );
  
    return (
      <Card className="m-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Wrench className="w-5 h-5" />Messaging Diagnostics</CardTitle>
          <p className="text-sm text-muted-foreground">
            Use this information to ensure your Twilio account is configured correctly for inbound messages.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant={diagnostics.configOk ? "default" : "destructive"}>
            <AlertTitle className="flex items-center gap-2">
              {diagnostics.configOk ? (
                <><CheckCircleIcon className="w-4 h-4" />Configuration Status: OK</>
              ) : (
                <><XCircle className="w-4 h-4" />Configuration Status: Incomplete</>
              )}
            </AlertTitle>
            <AlertDescription>
              {diagnostics.configOk ? "All required environment variables are set." : "One or more required Twilio environment variables are missing."}
            </AlertDescription>
          </Alert>
  
          <div>
            <h4 className="font-medium mb-2">Twilio Variables Check</h4>
            <ul className="space-y-1">
              <CheckItem label="TWILIO_ACCOUNT_SID" isOk={diagnostics.accountSid} />
              <CheckItem label="TWILIO_AUTH_TOKEN" isOk={diagnostics.authToken} />
              <CheckItem label="TWILIO_PHONE_NUMBER (for SMS)" isOk={diagnostics.smsNumber} />
              <CheckItem label="TWILIO_WHATSAPP_NUMBER" isOk={diagnostics.whatsAppNumber} />
            </ul>
          </div>
  
          <Separator />
  
          <div className="space-y-3">
            <h4 className="font-medium">SMS Webhook URL</h4>
            <div className="flex items-center gap-2">
              <Input readOnly value={smsWebhookUrl} className="font-mono text-xs" />
              <Button variant="outline" size="sm" onClick={() => copyToClipboard(smsWebhookUrl)}><Copy className="w-3 h-3 mr-1" />Copy</Button>
            </div>
            <p className="text-xs text-muted-foreground">
              In your Twilio Console, set the webhook for your SMS number to this URL with the `HTTP POST` method.
            </p>
          </div>
  
          <div className="space-y-3">
            <h4 className="font-medium">WhatsApp Webhook URL</h4>
            <div className="flex items-center gap-2">
              <Input readOnly value={whatsappWebhookUrl} className="font-mono text-xs" />
              <Button variant="outline" size="sm" onClick={() => copyToClipboard(whatsappWebhookUrl)}><Copy className="w-3 h-3 mr-1" />Copy</Button>
            </div>
            <p className="text-xs text-muted-foreground">
              In your Twilio Console, set the webhook for your WhatsApp sender to this URL with the `HTTP POST` method.
            </p>
          </div>

          <div className="pt-4">
            <Button variant="outline" onClick={() => setShowDiagnostics(false)}>
              Back to Messages
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const EmptyState = () => (
    <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
      <div className="text-center max-w-md p-8">
        <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold mb-2">Welcome to Messaging</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Send and receive SMS and WhatsApp messages with your customers. Select a conversation from the left or start a new one.
        </p>
        <div className="flex flex-col gap-3">
          <Button onClick={() => setShowNewConversation(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Conversation
          </Button>
          <Button variant="outline" onClick={() => setShowDiagnostics(true)}>
            <Settings className="w-4 h-4 mr-2" />
            View Diagnostics
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      <audio ref={audioRef} src="/audio/incoming_text.mp3" preload="auto" />
      
      <header className="bg-white dark:bg-gray-800 border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold">Messaging</h1>
              <p className="text-sm text-muted-foreground">
                SMS & WhatsApp powered by Twilio
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowNewConversation(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Conversation
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowDiagnostics(true)}>
                  <Settings className="w-4 h-4 mr-2" />
                  Diagnostics
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Conversations Sidebar */}
        <div className="w-80 bg-white dark:bg-gray-800 border-r flex flex-col">
          <div className="p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Search conversations..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="pl-9" 
              />
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            {isLoadingConversations ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No conversations</p>
                <Button 
                  variant="link" 
                  className="mt-2"
                  onClick={() => setShowNewConversation(true)}
                >
                  Start a new one
                </Button>
              </div>
            ) : (
              <div className="divide-y">
                {filteredConversations.map((conversation) => (
                  <div 
                    key={conversation.id} 
                    onClick={() => { 
                      setSelectedConversation(conversation); 
                      setShowNewConversation(false);
                      setShowDiagnostics(false);
                    }}
                    className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      selectedConversation?.id === conversation.id 
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' 
                        : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarFallback 
                          className={
                            conversation.platform === 'sms' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-green-100 text-green-700'
                          }
                        >
                          {conversation.platform === 'sms' 
                            ? <Phone className="w-4 h-4" /> 
                            : <WhatsAppIcon className="w-4 h-4" />
                          }
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">
                            {conversation.customerName || conversation.customerPhone}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {formatConversationTimestamp(conversation.lastMessageAt)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.lastMessagePreview || conversation.customerPhone}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {getPlatformBadge(conversation.platform)}
                          {conversation.messageCount > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {conversation.messageCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
          {showDiagnostics ? (
            <DiagnosticsView />
          ) : showNewConversation ? (
            <Card className="m-6">
              <CardHeader>
                <CardTitle>New Conversation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Phone Number (E.164 format)
                  </label>
                  <Input 
                    placeholder="+1234567890" 
                    value={newPhoneNumber} 
                    onChange={(e) => setNewPhoneNumber(e.target.value)} 
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Include country code (e.g., +1 for US)
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Message</label>
                  <Textarea 
                    placeholder="Type your message..." 
                    value={messageInput} 
                    onChange={(e) => setMessageInput(e.target.value)} 
                    rows={4} 
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowNewConversation(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSendMessage}
                    disabled={isSending || !newPhoneNumber || !messageInput.trim()}
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="bg-white dark:bg-gray-800 border-b p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback 
                        className={
                          selectedConversation.platform === 'sms' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-green-100 text-green-700'
                        }
                      >
                        {selectedConversation.platform === 'sms' 
                          ? <Phone className="w-5 h-5" /> 
                          : <WhatsAppIcon className="w-5 h-5" />
                        }
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">
                        {selectedConversation.customerName || selectedConversation.customerPhone}
                      </h3>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">
                          {selectedConversation.customerPhone}
                        </p>
                        {getPlatformBadge(selectedConversation.platform)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No messages yet</p>
                      <p className="text-sm">Send a message to start the conversation</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((message, index) => {
                      const showDateDivider = index === 0 || 
                        (message.createdAt && messages[index - 1]?.createdAt && 
                        format(
                          message.createdAt instanceof Timestamp ? message.createdAt.toDate() : new Date(message.createdAt), 
                          'yyyy-MM-dd'
                        ) !== format(
                          messages[index - 1].createdAt instanceof Timestamp ? messages[index - 1].createdAt.toDate() : new Date(messages[index - 1].createdAt), 
                          'yyyy-MM-dd'
                        ));
                      
                      const isOutbound = message.direction === 'outbound';

                      return (
                        <React.Fragment key={message.id}>
                          {showDateDivider && (
                            <div className="flex items-center justify-center my-4">
                              <div className="bg-gray-200 dark:bg-gray-700 rounded-full px-3 py-1">
                                <span className="text-xs text-gray-600 dark:text-gray-300">
                                  {format(
                                    message.createdAt instanceof Timestamp ? message.createdAt.toDate() : new Date(message.createdAt),
                                    'MMMM d, yyyy'
                                  )}
                                </span>
                              </div>
                            </div>
                          )}
                          <div 
                            className={`flex ${
                              isOutbound ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            <div 
                              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                isOutbound
                                  ? 'bg-blue-600 text-white rounded-br-none' 
                                  : 'bg-white dark:bg-gray-800 border rounded-bl-none shadow-sm'
                              }`}
                            >
                              {renderMessageContent(message)}
                              <div 
                                className={`flex items-center gap-1 mt-1 text-xs ${
                                  isOutbound
                                    ? 'text-blue-100' 
                                    : 'text-muted-foreground'
                                }`}
                              >
                                <span>{formatTimestamp(message.createdAt)}</span>
                                {isOutbound && (
                                  <span className="ml-1">
                                    {getMessageStatusIcon(
                                      message.platform === 'sms' 
                                        ? (message as SMSMessage).smsMetadata?.twilioStatus 
                                        : (message as WhatsAppMessage).whatsappMetadata?.twilioStatus
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Message Input Area */}
              <div className="bg-white dark:bg-gray-800 border-t p-4">
                <div className="flex gap-2">
                  <Textarea 
                    placeholder="Type a message..." 
                    value={messageInput} 
                    onChange={(e) => setMessageInput(e.target.value)} 
                    onKeyPress={handleKeyPress} 
                    rows={2} 
                    className="resize-none flex-1"
                    disabled={isSending}
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={isSending || !messageInput.trim()} 
                    size="lg"
                    className="self-end"
                  >
                    {isSending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </>
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </div>
  );
}
