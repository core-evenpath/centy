// src/app/partner/(protected)/messaging/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  MessageCircle,
  Info,
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { sendSMSAction } from '@/actions/sms-actions';
import { sendWhatsAppMessageAction } from '@/actions/whatsapp-actions';
import type { SMSConversation, SMSMessage, WhatsAppConversation, WhatsAppMessage } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

type Platform = 'sms' | 'whatsapp';
type UnifiedConversation = (SMSConversation | WhatsAppConversation) & { platform: Platform };
type UnifiedMessage = (SMSMessage | WhatsAppMessage) & { platform: Platform };

export default function MessagingPage() {
  const { user, currentWorkspace } = useMultiWorkspaceAuth();
  const { toast } = useToast();

  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('sms');
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

  const partnerId = currentWorkspace?.partnerId || user?.customClaims?.partnerId;

  // Load conversations for both platforms
  useEffect(() => {
    if (!partnerId || !db) {
      setIsLoadingConversations(false);
      return;
    }

    setIsLoadingConversations(true);

    // Query SMS conversations
    const smsQuery = query(
      collection(db, 'smsConversations'),
      where('partnerId', '==', partnerId),
      orderBy('lastMessageAt', 'desc')
    );

    // Query WhatsApp conversations
    const whatsappQuery = query(
      collection(db, 'whatsappConversations'),
      where('partnerId', '==', partnerId),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribeSMS = onSnapshot(
      smsQuery,
      (snapshot) => {
        const smsConvos = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            platform: 'sms' as Platform,
            createdAt: data.createdAt,
            lastMessageAt: data.lastMessageAt,
          } as UnifiedConversation;
        });

        setConversations(prev => {
          const whatsappConvos = prev.filter(c => c.platform === 'whatsapp');
          return [...smsConvos, ...whatsappConvos].sort((a, b) => {
            const aTime = a.lastMessageAt?.toMillis?.() || 0;
            const bTime = b.lastMessageAt?.toMillis?.() || 0;
            return bTime - aTime;
          });
        });
        setIsLoadingConversations(false);
      },
      (error) => {
        console.error('Error loading SMS conversations:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load SMS conversations',
        });
        setIsLoadingConversations(false);
      }
    );

    const unsubscribeWhatsApp = onSnapshot(
      whatsappQuery,
      (snapshot) => {
        const waConvos = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            platform: 'whatsapp' as Platform,
            createdAt: data.createdAt,
            lastMessageAt: data.lastMessageAt,
          } as UnifiedConversation;
        });

        setConversations(prev => {
          const smsConvos = prev.filter(c => c.platform === 'sms');
          return [...smsConvos, ...waConvos].sort((a, b) => {
            const aTime = a.lastMessageAt?.toMillis?.() || 0;
            const bTime = b.lastMessageAt?.toMillis?.() || 0;
            return bTime - aTime;
          });
        });
        setIsLoadingConversations(false);
      },
      (error) => {
        console.error('Error loading WhatsApp conversations:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load WhatsApp conversations',
        });
      }
    );

    return () => {
      unsubscribeSMS();
      unsubscribeWhatsApp();
    };
  }, [partnerId, toast]);

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedConversation?.id || !db) {
      setMessages([]);
      return;
    }

    setIsLoadingMessages(true);

    const collectionName = selectedConversation.platform === 'sms' ? 'smsMessages' : 'twilio_whatsapp_messages';
    const messagesQuery = query(
      collection(db, collectionName),
      where('conversationId', '==', selectedConversation.id),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const msgs = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            platform: selectedConversation.platform,
            createdAt: data.createdAt,
          } as UnifiedMessage;
        });
        setMessages(msgs);
        setIsLoadingMessages(false);
      },
      (error) => {
        console.error('Error loading messages:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load messages',
        });
        setIsLoadingMessages(false);
      }
    );

    return () => unsubscribe();
  }, [selectedConversation?.id, selectedConversation?.platform, toast]);

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
    if (!partnerId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Partner ID not found',
      });
      return;
    }

    let phoneNumber = '';
    let conversationId = '';

    if (selectedConversation) {
      phoneNumber = selectedConversation.customerPhone;
      conversationId = selectedConversation.id;
    } else if (showNewConversation && newPhoneNumber) {
      phoneNumber = newPhoneNumber;
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a conversation or enter a phone number',
      });
      return;
    }

    setIsSending(true);

    try {
      let result;
      
      if (selectedPlatform === 'sms') {
        result = await sendSMSAction({
          partnerId,
          to: phoneNumber,
          message: messageInput.trim(),
          conversationId,
        });
      } else {
        result = await sendWhatsAppMessageAction({
          partnerId,
          to: phoneNumber,
          message: messageInput.trim(),
          conversationId,
        });
      }

      if (result.success) {
        setMessageInput('');
        setNewPhoneNumber('');
        setShowNewConversation(false);

        toast({
          title: 'Success',
          description: `${selectedPlatform === 'sms' ? 'SMS' : 'WhatsApp message'} sent successfully`,
        });

        // Select the conversation if it's new
        if (result.conversationId && !selectedConversation) {
          const newConvo = conversations.find(c => c.id === result.conversationId);
          if (newConvo) {
            setSelectedConversation(newConvo);
          }
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.message,
        });
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to send ${selectedPlatform === 'sms' ? 'SMS' : 'WhatsApp message'}`,
      });
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
    .filter(conv => conv.platform === selectedPlatform)
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
    
    let date: Date;
    if (timestamp instanceof Timestamp) {
      date = timestamp.toDate();
    } else if (timestamp.toDate) {
      date = timestamp.toDate();
    } else {
      date = new Date(timestamp);
    }

    return formatDistanceToNow(date, { addSuffix: true });
  };

  const getPlatformBadge = (platform: Platform) => {
    return platform === 'sms' ? (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
        <Phone className="w-3 h-3 mr-1" />
        SMS
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        <MessageCircle className="w-3 h-3 mr-1" />
        WhatsApp
      </Badge>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
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
          <Button onClick={() => setShowNewConversation(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Conversation
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Conversations List */}
        <div className="w-80 bg-white dark:bg-gray-800 border-r flex flex-col">
          <div className="p-4 space-y-3">
            {/* Platform Selector */}
            <Tabs value={selectedPlatform} onValueChange={(value) => setSelectedPlatform(value as Platform)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="sms" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  SMS
                </TabsTrigger>
                <TabsTrigger value="whatsapp" className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* WhatsApp Info Alert */}
            {selectedPlatform === 'whatsapp' && (
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-xs text-blue-800">
                  WhatsApp conversations require approved message templates. New conversations must start with an approved template.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <ScrollArea className="flex-1">
            {isLoadingConversations ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No {selectedPlatform === 'sms' ? 'SMS' : 'WhatsApp'} conversations yet</p>
                <p className="text-sm">Start a new conversation to begin</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => {
                      setSelectedConversation(conversation);
                      setShowNewConversation(false);
                    }}
                    className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      selectedConversation?.id === conversation.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
                        : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarFallback className={conversation.platform === 'sms' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}>
                          {conversation.platform === 'sms' ? <Phone className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">
                            {conversation.customerName || conversation.customerPhone}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(conversation.lastMessageAt)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {conversation.customerPhone}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {getPlatformBadge(conversation.platform)}
                          <Badge variant="secondary">
                            {conversation.messageCount || 0} messages
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Message Area */}
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
          {showNewConversation ? (
            <Card className="m-6">
              <CardHeader>
                <CardTitle>New {selectedPlatform === 'sms' ? 'SMS' : 'WhatsApp'} Conversation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Phone Number (E.164 format)</label>
                  <Input
                    placeholder="+1234567890"
                    value={newPhoneNumber}
                    onChange={(e) => setNewPhoneNumber(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Include country code (e.g., +1 for US)
                  </p>
                </div>
                
                {selectedPlatform === 'whatsapp' && (
                  <Alert className="bg-amber-50 border-amber-200">
                    <Info className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-xs text-amber-800">
                      <strong>WhatsApp Business Account ID:</strong> 1103704538583912<br />
                      <strong>Meta Business Manager ID:</strong> 1949265818947335<br />
                      <strong>WhatsApp Number:</strong> +19107149473 (Evenpath)<br />
                      <strong>Note:</strong> First message to a new contact must use an approved template.
                    </AlertDescription>
                  </Alert>
                )}

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
              {/* Conversation Header */}
              <div className="bg-white dark:bg-gray-800 border-b p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className={selectedConversation.platform === 'sms' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}>
                        {selectedConversation.platform === 'sms' ? <Phone className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
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

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
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
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.direction === 'outbound' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            message.direction === 'outbound'
                              ? 'bg-blue-600 text-white'
                              : 'bg-white dark:bg-gray-800 border'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{message.content}</p>
                          <div
                            className={`flex items-center gap-1 mt-1 text-xs ${
                              message.direction === 'outbound'
                                ? 'text-blue-100'
                                : 'text-muted-foreground'
                            }`}
                          >
                            <span>{formatTimestamp(message.createdAt)}</span>
                            {message.direction === 'outbound' && (
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
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Message Input */}
              <div className="bg-white dark:bg-gray-800 border-t p-4">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    rows={2}
                    className="resize-none"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isSending || !messageInput.trim()}
                    size="lg"
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
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                <p className="text-sm">
                  Choose a conversation from the list or start a new one
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
