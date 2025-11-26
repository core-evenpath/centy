'use client';

import { useState, useEffect, useRef } from 'react';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { useEnrichedMetaConversations, EnrichedMetaConversation } from '@/hooks/useEnrichedMetaConversations';
import { useMetaMessages } from '@/hooks/useMetaWhatsApp';
import { sendMetaWhatsAppMessageAction, getMetaWhatsAppStatus, deleteMetaConversation, deleteMetaMessage } from '@/actions/meta-whatsapp-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Send,
    Search,
    Plus,
    MessageSquare,
    ArrowLeft,
    AlertCircle,
    Loader2,
    Phone,
    Settings,
    MoreVertical,
    Trash2,
    Paperclip,
    Image as ImageIcon,
    FileText,
    Video,
    User,
    Building2,
    Mail
} from 'lucide-react';
import Link from 'next/link';
import type { MetaWhatsAppConversation, MetaWhatsAppMessage } from '@/lib/types-meta-whatsapp';
import { format } from 'date-fns';
import { MessageBubble } from '@/components/partner/commspace/MessageBubble';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'sonner';
import AddContactModal from '@/components/partner/contacts/AddContactModal';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"

export default function CommSpacePage() {
    const { currentWorkspace, loading: authLoading } = useMultiWorkspaceAuth();
    const currentPartnerId = currentWorkspace?.partnerId;
    const { conversations, loading: convsLoading, markAsRead } = useEnrichedMetaConversations(currentPartnerId);

    const [selectedConversation, setSelectedConversation] = useState<EnrichedMetaConversation | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [messageInput, setMessageInput] = useState('');
    const [sending, setSending] = useState(false);
    const [isConnected, setIsConnected] = useState<boolean | null>(null);
    const [mobileShowChat, setMobileShowChat] = useState(false);

    // New Chat State
    const [newChatOpen, setNewChatOpen] = useState(false);
    const [newChatPhone, setNewChatPhone] = useState('');
    const [newChatName, setNewChatName] = useState('');

    // File Upload State
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Contact Modal State
    const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);

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
            conv.lastMessagePreview?.toLowerCase().includes(search) ||
            conv.contactName?.toLowerCase().includes(search) ||
            conv.contactEmail?.toLowerCase().includes(search) ||
            conv.contactCompany?.toLowerCase().includes(search)
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
                toast.error(`Failed to send: ${result.message}`);
            }
        } catch (error: any) {
            toast.error(`Error: ${error.message}`);
        } finally {
            setSending(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedConversation || !currentPartnerId) return;

        // Validate file type
        let mediaType: 'image' | 'video' | 'document' | 'audio' = 'document';
        if (file.type.startsWith('image/')) mediaType = 'image';
        else if (file.type.startsWith('video/')) mediaType = 'video';
        else if (file.type.startsWith('audio/')) mediaType = 'audio';

        setIsUploading(true);
        try {
            // Upload to Firebase Storage
            const storageRef = ref(storage, `chat/${currentPartnerId}/whatsapp/outgoing/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            // Send message with media
            const result = await sendMetaWhatsAppMessageAction({
                partnerId: currentPartnerId,
                to: selectedConversation.customerPhone,
                conversationId: selectedConversation.id,
                mediaUrl: downloadURL,
                mediaType: mediaType,
                filename: file.name,
                message: mediaType === 'document' ? undefined : file.name // Use filename as caption for non-documents if needed, or leave blank
            });

            if (result.success) {
                toast.success('Media sent successfully');
            } else {
                toast.error(`Failed to send media: ${result.message}`);
            }
        } catch (error: any) {
            console.error('Upload error:', error);
            toast.error(`Upload failed: ${error.message}`);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDeleteConversation = async () => {
        if (!selectedConversation || !currentPartnerId) return;

        if (!confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) return;

        try {
            const result = await deleteMetaConversation(currentPartnerId, selectedConversation.id);
            if (result.success) {
                toast.success('Conversation deleted');
                setSelectedConversation(null);
                setMobileShowChat(false);
            } else {
                toast.error(`Failed to delete: ${result.message}`);
            }
        } catch (error: any) {
            toast.error(`Error: ${error.message}`);
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        if (!currentPartnerId) return;

        if (!confirm('Delete this message?')) return;

        try {
            const result = await deleteMetaMessage(currentPartnerId, messageId);
            if (result.success) {
                toast.success('Message deleted');
            } else {
                toast.error(`Failed to delete: ${result.message}`);
            }
        } catch (error: any) {
            toast.error(`Error: ${error.message}`);
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
        const tempConv: EnrichedMetaConversation = {
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
            customerWaId: '', // Placeholder
            title: newChatName || newChatPhone,
        };

        setSelectedConversation(tempConv);
        setNewChatOpen(false);
        setNewChatPhone('');
        setNewChatName('');
        setMobileShowChat(true);
    };

    const selectConversation = (conv: EnrichedMetaConversation) => {
        setSelectedConversation(conv);
        setMobileShowChat(true);
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
        <div className="flex h-[calc(100vh-64px)] bg-white overflow-hidden">
            {/* Sidebar */}
            <div className={`w-full md:w-80 lg:w-96 border-r flex flex-col ${mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b bg-gray-50/50">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-xl font-bold text-gray-900">Messages</h1>
                        <Dialog open={newChatOpen} onOpenChange={setNewChatOpen}>
                            <DialogTrigger asChild>
                                <Button size="icon" variant="ghost" className="hover:bg-gray-200 rounded-full">
                                    <Plus className="w-5 h-5 text-gray-600" />
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
                            className="pl-10 bg-white border-gray-200 focus:border-blue-500 transition-colors"
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
                        <div className="divide-y divide-gray-100">
                            {filteredConversations.map((conv) => (
                                <button
                                    key={conv.id}
                                    onClick={() => selectConversation(conv)}
                                    className={`w-full p-4 text-left hover:bg-gray-50 transition-all duration-200 ${selectedConversation?.id === conv.id ? 'bg-blue-50/60 border-l-4 border-blue-500' : 'border-l-4 border-transparent'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                                            <AvatarImage
                                                src={conv.customerProfilePicture || `https://api.dicebear.com/7.x/initials/svg?seed=${conv.contactName || conv.customerName || conv.customerPhone}`}
                                                referrerPolicy="no-referrer"
                                            />
                                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                                {(conv.contactName || conv.customerName || conv.customerPhone).charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="font-semibold text-gray-900 truncate">
                                                    {conv.contactName || conv.customerName || conv.customerPhone}
                                                </p>
                                                {conv.unreadCount > 0 && (
                                                    <Badge variant="default" className="ml-2 bg-green-500 hover:bg-green-600 h-5 px-1.5 min-w-[1.25rem]">
                                                        {conv.unreadCount}
                                                    </Badge>
                                                )}
                                            </div>
                                            {/* Contact Info Subtitle */}
                                            {conv.contact ? (
                                                <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                                                    {conv.contactCompany && (
                                                        <span className="flex items-center gap-0.5">
                                                            <Building2 className="w-3 h-3" />
                                                            {conv.contactCompany}
                                                        </span>
                                                    )}
                                                    {conv.contactEmail && (
                                                        <span className="flex items-center gap-0.5 ml-1">
                                                            <Mail className="w-3 h-3" />
                                                            {conv.contactEmail}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : null}

                                            <p className="text-sm text-gray-500 truncate">
                                                {conv.lastMessagePreview || 'No messages'}
                                            </p>

                                            {/* Tags */}
                                            {conv.contactTags && conv.contactTags.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {conv.contactTags.slice(0, 2).map(tag => (
                                                        <span key={tag} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                    {conv.contactTags.length > 2 && (
                                                        <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                                                            +{conv.contactTags.length - 2}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col bg-[#efeae2] ${!mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
                {selectedConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-3 border-b bg-white flex items-center gap-3 shadow-sm z-10">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="md:hidden"
                                onClick={() => setMobileShowChat(false)}
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <Avatar className="w-10 h-10">
                                <AvatarImage
                                    src={selectedConversation.customerProfilePicture || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedConversation.contactName || selectedConversation.customerName || selectedConversation.customerPhone}`}
                                    referrerPolicy="no-referrer"
                                />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                    {(selectedConversation.contactName || selectedConversation.customerName || selectedConversation.customerPhone).charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                                    {selectedConversation.contactName || selectedConversation.customerName || selectedConversation.customerPhone}
                                    {selectedConversation.contact && (
                                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal bg-blue-50 text-blue-600 border-blue-100">
                                            Contact
                                        </Badge>
                                    )}
                                </h2>
                                <div className="flex flex-col">
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                        <Phone className="w-3 h-3" />
                                        {selectedConversation.customerPhone}
                                    </p>
                                    {selectedConversation.contactEmail && (
                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                            <Mail className="w-3 h-3" />
                                            {selectedConversation.contactEmail}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreVertical className="w-5 h-5 text-gray-500" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    {selectedConversation.contact ? (
                                        <DropdownMenuItem asChild>
                                            <Link href={`/partner/contacts?search=${selectedConversation.customerPhone}`} className="flex items-center">
                                                <User className="w-4 h-4 mr-2" />
                                                View Contact
                                            </Link>
                                        </DropdownMenuItem>
                                    ) : (
                                        <DropdownMenuItem onClick={() => setIsAddContactModalOpen(true)}>
                                            <User className="w-4 h-4 mr-2" />
                                            Add to Contacts
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={handleDeleteConversation} className="text-red-600 focus:text-red-600">
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete Conversation
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Messages Area */}
                        <ScrollArea className="flex-1 p-4">
                            {msgsLoading ? (
                                <div className="flex items-center justify-center p-8">
                                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-8 text-center mt-10">
                                    <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                                        <MessageSquare className="w-8 h-8 text-blue-500" />
                                    </div>
                                    <p className="text-gray-600 font-medium">No messages yet</p>
                                    <p className="text-sm text-gray-400 mt-1">Send a message to start the conversation.</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-w-3xl mx-auto">
                                    {messages.map((msg: MetaWhatsAppMessage) => (
                                        <MessageBubble
                                            key={msg.id}
                                            message={msg}
                                            onDelete={handleDeleteMessage}
                                        />
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </ScrollArea>

                        {/* Input Area */}
                        <div className="p-3 bg-white border-t">
                            <div className="max-w-3xl mx-auto flex items-end gap-2">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    accept="image/*,video/*,audio/*,application/pdf"
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                >
                                    {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                                </Button>

                                <div className="flex-1 bg-gray-100 rounded-2xl flex items-center px-4 py-2 focus-within:ring-1 focus-within:ring-blue-500 focus-within:bg-white transition-all">
                                    <textarea
                                        placeholder="Type a message..."
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage();
                                            }
                                        }}
                                        className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 py-1 text-sm outline-none"
                                        rows={1}
                                        style={{ minHeight: '24px' }}
                                        disabled={sending}
                                    />
                                </div>

                                <Button
                                    onClick={handleSendMessage}
                                    disabled={(!messageInput.trim() && !isUploading) || sending}
                                    size="icon"
                                    className="rounded-full w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex-shrink-0"
                                >
                                    {sending ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Send className="w-5 h-5 ml-0.5" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/50">
                        <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-gray-100">
                            <MessageSquare className="w-12 h-12 text-blue-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Welcome to CommSpace
                        </h2>
                        <p className="text-gray-500 max-w-md text-lg">
                            Select a conversation from the sidebar to begin messaging your clients via WhatsApp.
                        </p>
                    </div>
                )}
            </div>

            {/* Add Contact Modal */}
            {currentPartnerId && selectedConversation && (
                <AddContactModal
                    isOpen={isAddContactModalOpen}
                    onClose={() => setIsAddContactModalOpen(false)}
                    partnerId={currentPartnerId}
                    initialData={{
                        name: selectedConversation.customerName || '',
                        phone: selectedConversation.customerPhone
                    }}
                />
            )}
        </div>
    );
}
