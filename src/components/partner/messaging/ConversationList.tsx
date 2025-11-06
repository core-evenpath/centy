"use client";

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, Plus, Search, MessageCircle, Smartphone, MoreVertical, Pin, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';

interface ConversationListProps {
  conversations: any[];
  selectedConversation: any | null;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSelectConversation: (conversation: any) => void;
  onNewConversation: () => void;
  isLoading: boolean;
}

export default function ConversationList({
  conversations,
  selectedConversation,
  searchTerm,
  onSearchChange,
  onSelectConversation,
  onNewConversation,
  isLoading,
}: ConversationListProps) {
  const { toast } = useToast();
  const [deleteConfirm, setDeleteConfirm] = React.useState<any | null>(null);

  const getDisplayName = (convo: any) => {
    return convo.contactName || convo.customerName || convo.customerPhone;
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return '';
    }
  };

  const getPlatformIcon = (platform: string) => {
    if (platform === 'whatsapp') {
      return <MessageCircle className="w-4 h-4 text-green-600" />;
    }
    return <Smartphone className="w-4 h-4 text-blue-600" />;
  };

  const getPlatformColor = (platform: string) => {
    return platform === 'whatsapp' ? 'from-green-500 to-green-600' : 'from-blue-500 to-blue-600';
  };

  const handlePin = async (convo: any, e: React.MouseEvent) => {
    e.stopPropagation();
    toast({
      title: 'Coming soon',
      description: 'Pin feature will be available in a future update.'
    });
  };

  const handleDeleteClick = (convo: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm(convo);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    try {
      const collectionName = deleteConfirm.platform === 'sms' ? 'smsConversations' : 'whatsappConversations';
      const conversationRef = doc(db, collectionName, deleteConfirm.id);
      await deleteDoc(conversationRef);

      toast({
        title: 'Conversation deleted',
        description: 'The conversation has been permanently deleted.'
      });
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        variant: 'destructive',
        title: 'Delete failed',
        description: 'Could not delete the conversation. Please try again.'
      });
    }
  };

  return (
    <>
      <aside className="bg-white border-r border-slate-200 flex flex-col h-full w-96">
        <div className="p-4 border-b border-slate-200 bg-white sticky top-0 z-10">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-slate-900">Messages</h1>
            <Button size="sm" onClick={onNewConversation} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-1" />
              New
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 pr-3 py-2 bg-slate-50 border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-sm font-medium mb-1">No conversations yet</p>
              <p className="text-xs">Start a new conversation to begin messaging</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {conversations.map((convo) => {
                const displayName = getDisplayName(convo);
                const isSelected = selectedConversation?.id === convo.id;

                return (
                  <div
                    key={convo.id}
                    onClick={() => onSelectConversation(convo)}
                    className={`p-4 cursor-pointer transition-all hover:bg-slate-50 ${
                      isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getPlatformColor(convo.platform)} flex items-center justify-center text-white font-semibold flex-shrink-0 shadow-sm`}>
                        {displayName.charAt(0).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 text-sm truncate">
                              {displayName}
                            </p>
                            {getPlatformIcon(convo.platform)}
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <span className="text-xs text-slate-500 flex-shrink-0">
                              {formatTime(convo.lastMessageAt)}
                            </span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => handlePin(convo, e)}>
                                  <Pin className="w-4 h-4 mr-2" />
                                  Pin conversation
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => handleDeleteClick(convo, e)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        <p className="text-xs text-slate-500 mb-2 truncate">{convo.customerPhone}</p>

                        <div className="flex items-center justify-between">
                          <Badge
                            variant="secondary"
                            className={`text-xs font-medium ${
                              convo.platform === 'whatsapp'
                                ? 'bg-green-100 text-green-700 border-green-200'
                                : 'bg-blue-100 text-blue-700 border-blue-200'
                            }`}
                          >
                            {convo.platform === 'whatsapp' ? 'WhatsApp' : 'SMS'}
                          </Badge>

                          {convo.messageCount > 0 && (
                            <span className="text-xs text-slate-500 font-medium">
                              {convo.messageCount} msgs
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {!isLoading && conversations.length > 0 && (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 border-t border-slate-200">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="font-semibold text-green-700">{conversations.filter(c => c.platform === 'whatsapp').length} WhatsApp</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="font-semibold text-blue-700">{conversations.filter(c => c.platform === 'sms').length} SMS</span>
                </div>
              </div>
              <span className="text-slate-600 font-medium">{conversations.length} total</span>
            </div>
          </div>
        )}
      </aside>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this conversation and all its messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}