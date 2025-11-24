'use client';

import { useState, useEffect, useRef } from 'react';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { useMetaConversations, useMetaMessages } from '@/hooks/useMetaWhatsApp';
import { sendMetaWhatsAppMessageAction, getMetaWhatsAppStatus } from '@/actions/meta-whatsapp-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Send,
    Search,
    Plus,
    MessageSquare,
    ArrowLeft,
    AlertCircle,
    Loader2,
    Phone,
    Settings
} from 'lucide-react';
import Link from 'next/link';
import type { MetaWhatsAppConversation, MetaWhatsAppMessage } from '@/lib/types-meta-whatsapp';
import { format } from 'date-fns';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export default function CommSpacePage() {
    const { currentWorkspace, loading: authLoading } = useMultiWorkspaceAuth();
    const currentPartnerId = currentWorkspace?.partnerId;
    const { conversations, loading: convsLoading, markAsRead } = useMetaConversations(currentPartnerId);

    const [selectedConversation, setSelectedConversation] = useState<MetaWhatsAppConversation | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [messageInput, setMessageInput] = useState('');
    const [sending, setSending] = useState(false);
    const [isConnected, setIsConnected] = useState<boolean | null>(null);
    const [mobileShowChat, setMobileShowChat] = useState(false);

    // New Chat State
    const [newChatOpen, setNewChatOpen] = useState(false);
    const [newChatPhone, setNewChatPhone] = useState('');
    const [newChatName, setNewChatName] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { messages, loading: msgsLoading } = useMetaMessages(selectedConversation?.id);

    useEffect(() => {
        async function checkConnection() {
            if (currentPartnerId) {
                const status = await getMetaWhatsAppStatus(currentPartnerId);
                setIsConnected(status.connected);
            }
        }
        checkConnection();
    }, [currentPartnerId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (selectedConversation && selectedConversation.unreadCount > 0) {
            markAsRead(selectedConversation.id);
        }
    }, [selectedConversation, markAsRead]);

    const filteredConversations = conversations.filter(conv => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            conv.customerName?.toLowerCase().includes(search) ||
            conv.customerPhone.includes(search) ||
            conv.lastMessagePreview?.toLowerCase().includes(search)
        );
    });

    const handleSendMessage = async () => {
        if (!messageInput.trim() || !selectedConversation || !currentPartnerId) return;

        setSending(true);
        try {
            const result = await sendMetaWhatsAppMessageAction({
                partnerId: currentPartnerId,
                to: selectedConversation.customerPhone,
                message: messageInput.trim(),
                conversationId: selectedConversation.id,
            });

            if (result.success) {
                setMessageInput('');
            } else {
                alert(`Failed to send: ${result.message}`);
            }
        } catch (error: any) {
            alert(`Error: ${error.message}`);
        } finally {
            setSending(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleStartNewChat = async () => {
        if (!newChatPhone || !currentPartnerId) return;

        // Create a temporary conversation object to select immediately
        const tempConv: MetaWhatsAppConversation = {
            id: 'temp_' + Date.now(),
            partnerId: currentPartnerId,
            platform: 'meta_whatsapp',
            customerPhone: newChatPhone,
            customerName: newChatName || newChatPhone,
            phoneNumberId: '', // Will be filled by backend
            type: 'direct',
            isActive: true,
            messageCount: 0,
            unreadCount: 0,
            lastMessageAt: { toDate: () => new Date() } as any,
            createdAt: { toDate: () => new Date() } as any,
        };

        setSelectedConversation(tempConv);
        setNewChatOpen(false);
        setNewChatPhone('');
        setNewChatName('');
        setMobileShowChat(true);
    };

    const selectConversation = (conv: MetaWhatsAppConversation) => {
        setSelectedConversation(conv);
        setMobileShowChat(true);
    };

    const formatTime = (timestamp: any) => {
        try {
            const date = timestamp?.toDate?.() || new Date(timestamp);
            return format(date, 'HH:mm');
        } catch {
            return '';
        }
    };

    if (authLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (isConnected === false) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <AlertCircle className="w-16 h-16 text-yellow-500 mb-4" />
                <h2 className="text-2xl font-semibold mb-2">WhatsApp Business Not Connected</h2>
                <p className="text-gray-600 mb-6 max-w-md">
                    Connect your WhatsApp Business account to start messaging your clients directly from Centy.
                </p>
                <Link href="/partner/settings/whatsapp-business">
                    <Button>
                        <Settings className="w-4 h-4 mr-2" />
                        Connect WhatsApp Business
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-gray-50">
            <div className={`w-full md:w-80 lg:w-96 border-r bg-white flex flex-col ${mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-xl font-semibold">Messages</h1>
                        <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
                            <DialogTrigger asChild>
                                <Button size="icon" variant="ghost">
                                    <Plus className="w-5 h-5" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>New Message</DialogTitle>
                                    <DialogDescription>
                                        Enter a phone number to start a new conversation.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <Input
                                            id="phone"
                                            placeholder="+1234567890"
                                            value={newChatPhone}
                                            onChange={(e) => setNewChatPhone(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Customer Name (Optional)</Label>
                                        <Input
                                            id="name"
                                            placeholder="John Doe"
                                            value={newChatName}
                                            onChange={(e) => setNewChatName(e.target.value)}
                                        />
                                    </div>
                                    <Button
                                        className="w-full"
                                        onClick={handleStartNewChat}
                                        disabled={!newChatPhone}
                                    >
                                        Start Conversation
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="Search conversations..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    {convsLoading ? (
                        <div className="flex items-center justify-center p-8">
                            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                        </div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center">
                            <MessageSquare className="w-12 h-12 text-gray-300 mb-4" />
                            <p className="text-gray-500">No conversations yet</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {filteredConversations.map((conv) => (
                                <button
                                    key={conv.id}
                                    onClick={() => selectConversation(conv)}
                                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${selectedConversation?.id === conv.id ? 'bg-blue-50' : ''
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <Avatar className="w-10 h-10">
                                            <AvatarFallback className="bg-green-100 text-green-700">
                                                {(conv.customerName || conv.customerPhone).charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className="font-medium truncate">
                                                    {conv.customerName || conv.customerPhone}
                                                </p>
                                                {conv.unreadCount > 0 && (
                                                    <Badge variant="default" className="ml-2 bg-green-500">
                                                        {conv.unreadCount}
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500 truncate mt-0.5">
                                                {conv.lastMessagePreview || 'No messages'}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>

            <div className={`flex-1 flex flex-col ${!mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
                {selectedConversation ? (
                    <>
                        <div className="p-4 border-b bg-white flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="md:hidden"
                                onClick={() => setMobileShowChat(false)}
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <Avatar className="w-10 h-10">
                                <AvatarFallback className="bg-green-100 text-green-700">
                                    {(selectedConversation.customerName || selectedConversation.customerPhone).charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <h2 className="font-semibold">
                                    {selectedConversation.customerName || selectedConversation.customerPhone}
                                </h2>
                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {selectedConversation.customerPhone}
                                </p>
                            </div>
                        </div>

                        <ScrollArea className="flex-1 p-4 bg-[#e5ded8]">
                            {msgsLoading ? (
                                <div className="flex items-center justify-center p-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-8 text-center">
                                    <MessageSquare className="w-12 h-12 text-gray-400 mb-4" />
                                    <p className="text-gray-600">No messages yet</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {messages.map((msg: MetaWhatsAppMessage) => {
                                        const isOutbound = msg.direction === 'outbound';
                                        return (
                                            <div key={msg.id} className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                                                <div
                                                    className={`max-w-[70%] rounded-lg px-3 py-2 shadow-sm ${isOutbound
                                                        ? 'bg-[#dcf8c6] rounded-tr-none'
                                                        : 'bg-white rounded-tl-none'
                                                        }`}
                                                >
                                                    <p className="text-sm text-gray-900 whitespace-pre-wrap break-words">
                                                        {msg.content}
                                                    </p>
                                                    <div className="flex items-center gap-1 mt-1 justify-end">
                                                        <span className="text-[11px] text-gray-500">{formatTime(msg.createdAt)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </ScrollArea>

                        <div className="p-4 border-t bg-white">
                            <div className="flex items-center gap-2">
                                <Input
                                    placeholder="Type a message..."
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    className="flex-1"
                                    disabled={sending}
                                />
                                <Button
                                    onClick={handleSendMessage}
                                    disabled={!messageInput.trim() || sending}
                                    size="icon"
                                >
                                    {sending ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Send className="w-5 h-5" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-100">
                        <div className="w-64 h-64 bg-gray-200 rounded-full flex items-center justify-center mb-6">
                            <MessageSquare className="w-24 h-24 text-gray-400" />
                        </div>
                        <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                            Welcome to CommSpace
                        </h2>
                        <p className="text-gray-500 max-w-md">
                            Select a conversation from the sidebar to begin messaging your clients via WhatsApp.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
