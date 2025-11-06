// src/components/partner/messaging/ConversationList.tsx
"use client";

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Loader2, 
  Plus, 
  Search, 
  MessageCircle, 
  Smartphone, 
  Trash2, 
  MoreVertical,
  Pin 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConversationListProps {
  conversations: any[];
  selectedConversation: any | null;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSelectConversation: (conversation: any) => void;
  onNewConversation: () => void;
  onDeleteConversation?: (conversationId: string, platform: 'sms' | 'whatsapp') => Promise<void>;
  onPinConversation?: (conversationId: string, platform: 'sms' | 'whatsapp') => Promise<void>;
  isLoading: boolean;
}

export default function ConversationList({
  conversations,
  selectedConversation,
  searchTerm,
  onSearchChange,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onPinConversation,
  isLoading,
}: ConversationListProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<{ id: string; platform: 'sms' | 'whatsapp'; name: string } | null>(null);

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

  const getPlatformBadges = (convo: any) => {
    const platforms = convo.availablePlatforms || [convo.platform];
    return (
      <div className="flex gap-1">
        {platforms.includes('whatsapp') && (
          <Badge variant="outline" className="text-[10px] px-1 py-0 border-green-600 text-green-600">
            <MessageCircle className="w-2.5 h-2.5 mr-0.5" />
            WA
          </Badge>
        )}
        {platforms.includes('sms') && (
          <Badge variant="outline" className="text-[10px] px-1 py-0 border-blue-600 text-blue-600">
            <Smartphone className="w-2.5 h-2.5 mr-0.5" />
            SMS
          </Badge>
        )}
      </div>
    );
  };

  const handleDeleteClick = (conversation: any) => {
    setConversationToDelete({
      id: conversation.id,
      platform: conversation.platform,
      name: getDisplayName(conversation),
    });
    setShowDeleteDialog(true);
  };

  const handlePinClick = async (conversation: any) => {
    if (onPinConversation) {
      await onPinConversation(conversation.id, conversation.platform);
    }
  };

  const confirmDelete = async () => {
    if (conversationToDelete && onDeleteConversation) {
      await onDeleteConversation(conversationToDelete.id, conversationToDelete.platform);
    }
    setShowDeleteDialog(false);
    setConversationToDelete(null);
  };

  if (isLoading) {
    return (
      <div className="w-80 border-r border-gray-200 bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
            <Button onClick={onNewConversation} size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-1" />
              New
            </Button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 bg-gray-50 border-gray-200"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {conversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No conversations yet</p>
              <p className="text-xs text-gray-400 mt-1">Start a new conversation to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {conversations.map((convo) => {
                const isSelected = selectedConversation?.id === convo.id;
                const isPinned = convo.isPinned || false;

                return (
                  <div
                    key={convo.id}
                    onClick={() => onSelectConversation(convo)}
                    className={`
                      relative p-4 cursor-pointer transition-colors group
                      ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-gray-50 border-l-4 border-l-transparent'}
                      ${isPinned ? 'bg-yellow-50/30' : ''}
                    `}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {isPinned && <Pin className="w-3 h-3 text-yellow-600 fill-yellow-600" />}
                          <h3 className="font-medium text-gray-900 truncate">
                            {getDisplayName(convo)}
                          </h3>
                        </div>
                        
                        <p className="text-xs text-gray-500 truncate">
                          {convo.customerPhone}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-2">
                          {getPlatformBadges(convo)}
                          <span className="text-xs text-gray-400">
                            {formatTime(convo.lastMessageAt)}
                          </span>
                          {convo.messageCount > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {convo.messageCount}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePinClick(convo);
                            }}
                            className="cursor-pointer"
                          >
                            <Pin className="w-4 h-4 mr-2" />
                            {isPinned ? 'Unpin' : 'Pin'} Conversation
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(convo);
                            }}
                            className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Conversation
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the conversation with <strong>{conversationToDelete?.name}</strong>? 
              This will permanently delete the conversation and all its messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}