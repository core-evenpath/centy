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
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { sendWhatsAppMessageAction } from '@/actions/whatsapp-actions';
import type { WhatsAppConversation, WhatsAppMessage } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

export default function MessagingPage() {
  const { user, currentWorkspace } = useMultiWorkspaceAuth();
  const { toast } = useToast();

  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<WhatsAppConversation | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);

  const partnerId = currentWorkspace?.partnerId || user?.customClaims?.partnerId;

  // Load conversations
  useEffect(() => {
    if (!partnerId || !db) {
      setIsLoadingConversations(false);
      return;
    }

    setIsLoadingConversations(true);

    const conversationsQuery = query(
      collection(db, 'whatsappConversations'),
      where('partnerId', '==', partnerId),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      conversationsQuery,
      (snapshot) => {
        const convos = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt,
            lastMessageAt: data.lastMessageAt,
          } as WhatsAppConversation;
        });
        setConversations(convos);
        setIsLoadingConversations(false);
      },
      (error) => {
        console.error('Error loading conversations:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load conversations',
        });
        setIsLoadingConversations(false);
      }
    );

    return () => unsubscribe();
  }, [partnerId, toast]);

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedConversation?.id || !db) {
      setMessages([]);
      return;
    }

    setIsLoadingMessages(true);

    const messagesQuery = query(
      collection(db, 'whatsappMessages'),
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
            createdAt: data.createdAt,
          } as WhatsAppMessage;
        });
        setMessages(msgs);
        setIsLoadingMessages(false);

        // Scroll to bottom
        setTimeout(() => {
          const messageContainer = document.getElementById('message-container');
          if (messageContainer) {
            messageContainer.scrollTop = messageContainer.scrollHeight;
          }
        }, 100);
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
  }, [selectedConversation?.id, toast]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !partnerId) return;

    let phoneNumber = '';
    let conversationId = selectedConversation?.id;

    // New conversation
    if (showNewConversation) {
      if (!newPhoneNumber.trim()) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Please enter a phone number',
        });
        return;
      }
      phoneNumber = newPhoneNumber.trim();
    } else if (selectedConversation) {
      phoneNumber = selectedConversation.customerPhone;
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
      const result = await sendWhatsAppMessageAction({
        partnerId,
        to: phoneNumber,
        message: messageInput.trim(),
        conversationId,
      });

      if (result.success) {
        setMessageInput('');
        setNewPhoneNumber('');
        setShowNewConversation(false);

        toast({
          title: 'Success',
          description: 'Message sent successfully',
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
        description: 'Failed to send message',
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

  const filteredConversations = conversations.filter(conv =>
    conv.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.customerPhone?.includes(searchTerm)
  );

  const getMessageStatusIcon = (status?: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-green-500" />;
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

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-green-600" />
            <div>
              <h1 className="text-2xl font-bold">WhatsApp Messaging</h1>
              <p className="text-sm text-muted-foreground">
                Powered by Twilio
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
          <div className="p-4">
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
                <p>No conversations yet</p>
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
                        <AvatarFallback className="bg-green-100 text-green-700">
                          <Phone className="w-4 h-4" />
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
                        <Badge variant="secondary" className="mt-1">
                          {conversation.messageCount || 0} messages
                        </Badge>
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
            <div className="flex-1 flex flex-col">
              <div className="bg-white dark:bg-gray-800 border-b px-6 py-4">
                <h2 className="text-lg font-semibold">New Conversation</h2>
              </div>
              <div className="flex-1 flex items-center justify-center p-8">
                <Card className="w-full max-w-md">
                  <CardHeader>
                    <CardTitle>Start WhatsApp Conversation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Phone Number (with country code)
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
                      <label className="text-sm font-medium mb-2 block">
                        Message
                      </label>
                      <Textarea
                        placeholder="Type your message..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        rows={4}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setShowNewConversation(false)}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSendMessage}
                        disabled={isSending || !newPhoneNumber.trim() || !messageInput.trim()}
                        className="flex-1"
                      >
                        {isSending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        Send Message
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : selectedConversation ? (
            <>
              {/* Conversation Header */}
              <div className="bg-white dark:bg-gray-800 border-b px-6 py-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-green-100 text-green-700">
                      <Phone className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold">
                      {selectedConversation.customerName || selectedConversation.customerPhone}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {selectedConversation.customerPhone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-6" id="message-container">
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
                              ? 'bg-green-600 text-white'
                              : 'bg-white dark:bg-gray-800 border'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{message.content}</p>
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2">
                              {message.attachments.map((attachment) => (
                                <img
                                  key={attachment.id}
                                  src={attachment.url}
                                  alt={attachment.name}
                                  className="max-w-full rounded"
                                />
                              ))}
                            </div>
                          )}
                          <div
                            className={`flex items-center gap-1 mt-1 text-xs ${
                              message.direction === 'outbound'
                                ? 'text-green-100'
                                : 'text-muted-foreground'
                            }`}
                          >
                            <span>{formatTimestamp(message.createdAt)}</span>
                            {message.direction === 'outbound' && (
                              <span className="ml-1">
                                {getMessageStatusIcon(message.whatsappMetadata?.twilioStatus)}
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