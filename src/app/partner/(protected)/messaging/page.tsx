
// src/app/partner/(protected)/messaging/page.tsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
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
  Bell,
  BellOff,
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

  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('whatsapp');
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
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [previousMessageCount, setPreviousMessageCount] = useState(0);

  const partnerId = currentWorkspace?.partnerId;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Request notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
      
      if (permission === 'granted') {
        toast({
          title: 'Notifications Enabled',
          description: 'You will now receive desktop notifications for new messages',
        });
      }
    }
  };

  // Play notification sound
  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(err => console.error('Error playing sound:', err));
    }
  };

  // Show desktop notification
  const showDesktopNotification = (conversation: UnifiedConversation, message: UnifiedMessage) => {
    if (typeof window === 'undefined' || !notificationsEnabled || document.hasFocus()) return;

    const notification = new Notification('New Message', {
      body: `${conversation.customerPhone}: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`,
      icon: '/logo.png',
      tag: conversation.id,
      requireInteraction: false,
    });

    notification.onclick = () => {
      window.focus();
      setSelectedConversation(conversation);
      notification.close();
    };

    playNotificationSound();
  };

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations
  useEffect(() => {
    if (!partnerId || !db) {
      setConversations([]);
      return;
    }

    setIsLoadingConversations(true);

    const smsQuery = query(
      collection(db, 'smsConversations'),
      where('partnerId', '==', partnerId),
      where('isActive', '==', true),
      orderBy('lastMessageAt', 'desc')
    );

    const whatsappQuery = query(
      collection(db, 'whatsappConversations'),
      where('partnerId', '==', partnerId),
      where('isActive', '==', true),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribeSMS = onSnapshot(
      smsQuery,
      (snapshot) => {
        const smsConvs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          platform: 'sms' as Platform,
        })) as UnifiedConversation[];

        setConversations(prev => {
          const whatsappConvs = prev.filter(c => c.platform === 'whatsapp');
          const combined = [...smsConvs, ...whatsappConvs];
          return combined.sort((a, b) => {
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
      }
    );

    const unsubscribeWhatsApp = onSnapshot(
      whatsappQuery,
      (snapshot) => {
        const whatsappConvs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          platform: 'whatsapp' as Platform,
        })) as UnifiedConversation[];

        setConversations(prev => {
          const smsConvs = prev.filter(c => c.platform === 'sms');
          const combined = [...smsConvs, ...whatsappConvs];
          return combined.sort((a, b) => {
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
      setPreviousMessageCount(0);
      return;
    }

    setIsLoadingMessages(true);

    const collectionName = selectedConversation.platform === 'sms' ? 'smsMessages' : 'whatsappMessages';
    const messagesQuery = query(
      collection(db, collectionName),
      where('conversationId', '==', selectedConversation.id),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const newMessages = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            platform: selectedConversation.platform,
            createdAt: data.createdAt,
          } as UnifiedMessage;
        });

        // Check for new inbound messages
        const inboundMessages = newMessages.filter(m => m.direction === 'inbound');
        
        if (inboundMessages.length > previousMessageCount && previousMessageCount > 0) {
          const latestInbound = inboundMessages[inboundMessages.length - 1];
          if (latestInbound) {
            // Show notification
            showDesktopNotification(selectedConversation, latestInbound);
            
            // Show toast if not focused on this conversation
            if (typeof window !== 'undefined' && !document.hasFocus()) {
              toast({
                title: 'New Message',
                description: `${selectedConversation.customerPhone}: ${latestInbound.content.substring(0, 50)}`,
                duration: 5000,
              });
            }
          }
        }

        setPreviousMessageCount(inboundMessages.length);
        setMessages(newMessages);
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

  // Calculate unread count (conversations with recent messages)
  useEffect(() => {
    const count = conversations.filter(conv => {
      if (!conv.lastMessageAt) return false;
      const lastMessageTime = conv.lastMessageAt.toMillis();
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      return lastMessageTime > fiveMinutesAgo;
    }).length;
    setUnreadCount(count);
  }, [conversations]);

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
          description: `${selectedPlatform === 'sms' ? 'SMS' : 'WhatsApp'} message sent successfully`,
        });

        // Auto-select the conversation if it was a new one
        if (result.conversationId && !selectedConversation) {
          const newConv = conversations.find(c => c.id === result.conversationId);
          if (newConv) setSelectedConversation(newConv);
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.message || 'Failed to send message',
        });
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'An error occurred while sending the message',
      });
    } finally {
      setIsSending(false);
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const platformMatch = conv.platform === selectedPlatform;
    const searchMatch = searchTerm === '' || 
      conv.customerPhone.includes(searchTerm) ||
      conv.title.toLowerCase().includes(searchTerm.toLowerCase());
    return platformMatch && searchMatch;
  });

  const getStatusIcon = (message: UnifiedMessage) => {
    if (message.direction === 'inbound') return null;

    const status = message.platform === 'sms' 
      ? message.smsMetadata?.twilioStatus 
      : message.whatsappMetadata?.twilioStatus;

    switch (status) {
      case 'delivered':
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case 'sent':
        return <Check className="h-3 w-3 text-gray-400" />;
      case 'failed':
      case 'undelivered':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return <Clock className="h-3 w-3 text-gray-400" />;
    }
  };

  const renderMessageContent = (message: UnifiedMessage) => {
    if (message.attachments && message.attachments.length > 0) {
      const attachment = message.attachments[0];
      if (attachment.type === 'image') {
        return <img src={attachment.url} alt={attachment.name} className="rounded max-w-full h-auto" />;
      } else {
        return (
          <a
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm underline"
          >
            {attachment.name}
          </a>
        );
      }
    }
    return <p className="whitespace-pre-wrap break-words">{message.content}</p>;
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Notification sound - hidden audio element */}
      <audio ref={audioRef} src="/notification.mp3" preload="auto" />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Messaging</h1>
          <p className="text-muted-foreground">Communicate with your customers via SMS and WhatsApp</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={notificationsEnabled ? "default" : "outline"}
            size="sm"
            onClick={requestNotificationPermission}
          >
            {notificationsEnabled ? <Bell className="h-4 w-4 mr-2" /> : <BellOff className="h-4 w-4 mr-2" />}
            {notificationsEnabled ? 'Notifications On' : 'Enable Notifications'}
          </Button>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="px-3">
              {unreadCount} new
            </Badge>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-12 h-[calc(100vh-200px)]">
            {/* Conversations List */}
            <div className="col-span-4 border-r flex flex-col">
              <div className="p-4 border-b space-y-4">
                <Tabs value={selectedPlatform} onValueChange={(v) => setSelectedPlatform(v as Platform)}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="sms">
                      <Phone className="h-4 w-4 mr-2" />
                      SMS
                    </TabsTrigger>
                    <TabsTrigger value="whatsapp">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      WhatsApp
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search conversations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button
                    size="icon"
                    variant={showNewConversation ? "default" : "outline"}
                    onClick={() => setShowNewConversation(!showNewConversation)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {showNewConversation && (
                  <div className="space-y-2">
                    <Input
                      placeholder="Enter phone number..."
                      value={newPhoneNumber}
                      onChange={(e) => setNewPhoneNumber(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Format: +1234567890 (include country code)
                    </p>
                  </div>
                )}
              </div>

              <ScrollArea className="flex-1">
                {isLoadingConversations ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No conversations yet</p>
                    <p className="text-sm mt-1">Start a new conversation</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredConversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => {
                          setSelectedConversation(conv);
                          setShowNewConversation(false);
                        }}
                        className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                          selectedConversation?.id === conv.id ? 'bg-muted' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {conv.platform === 'sms' ? <Phone className="h-4 w-4" /> : <MessageCircle className="h-4 w-4" />}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium truncate">{conv.customerPhone}</p>
                              {conv.lastMessageAt && (
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(conv.lastMessageAt.toDate(), { addSuffix: true })}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground capitalize">
                              {conv.platform} • {conv.messageCount} messages
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Messages Area */}
            <div className="col-span-8 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Conversation Header */}
                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold">{selectedConversation.customerPhone}</h2>
                        <p className="text-sm text-muted-foreground capitalize">
                          {selectedConversation.platform} Conversation
                        </p>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {selectedConversation.platform}
                      </Badge>
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    {isLoadingMessages ? (
                      <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
                        <p>No messages yet</p>
                        <p className="text-sm mt-1">Send a message to start the conversation</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg p-3 ${
                                message.direction === 'outbound'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              {renderMessageContent(message)}
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs opacity-70">
                                  {message.createdAt && formatDistanceToNow(message.createdAt.toDate(), { addSuffix: true })}
                                </span>
                                {getStatusIcon(message)}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Type your message..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        className="min-h-[60px] resize-none"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={isSending || !messageInput.trim()}
                        size="icon"
                        className="h-[60px] w-[60px]"
                      >
                        {isSending ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Send className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Press Enter to send, Shift+Enter for new line
                    </p>
                  </div>
                </>
              ) : showNewConversation && newPhoneNumber ? (
                <>
                  <div className="p-4 border-b">
                    <h2 className="text-lg font-semibold">New {selectedPlatform === 'sms' ? 'SMS' : 'WhatsApp'} Conversation</h2>
                    <p className="text-sm text-muted-foreground">To: {newPhoneNumber}</p>
                  </div>
                  <div className="flex-1" />
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Type your message..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        className="min-h-[60px] resize-none"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={isSending || !messageInput.trim()}
                        size="icon"
                        className="h-[60px] w-[60px]"
                      >
                        {isSending ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Send className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <MessageSquare className="h-16 w-16 mb-4 opacity-50" />
                  <p className="text-lg font-medium">Select a conversation</p>
                  <p className="text-sm mt-1">Choose a conversation from the list or start a new one</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
