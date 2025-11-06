"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  User, 
  MoreVertical,
  MessageCircle,
  Smartphone
} from 'lucide-react';
import { Phone, Mail } from 'lucide-react';

type Platform = 'sms' | 'whatsapp';

interface UnifiedConversation {
  id: string;
  customerPhone: string;
  customerName?: string;
  contactName?: string;
  contactEmail?: string;
  contactId?: string;
  availablePlatforms: Platform[];
  smsConversationId?: string;
  whatsappConversationId?: string;
  lastMessageAt: any;
  messageCount: number;
  recentMessages?: any[];
  isActive: boolean;
  clientInfo?: any;
}

interface ChatHeaderProps {
  conversation: UnifiedConversation;
  selectedPlatform: Platform;
  onPlatformChange: (platform: Platform) => void;
  onToggleProfile: () => void;
}

export default function ChatHeader({
  conversation,
  selectedPlatform,
  onPlatformChange,
  onToggleProfile,
}: ChatHeaderProps) {
  const displayName = conversation.contactName || conversation.customerName || conversation.customerPhone;
  const hasMultiplePlatforms = conversation.availablePlatforms.length > 1;

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
            <User className="w-5 h-5 text-slate-600" />
          </div>
          
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-slate-900 truncate">{displayName}</h2>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Phone className="w-3 h-3" />
              <span className="truncate">{conversation.customerPhone}</span>
              {conversation.contactEmail && (
                <>
                  <span>•</span>
                  <Mail className="w-3 h-3" />
                  <span className="truncate">{conversation.contactEmail}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onToggleProfile}
            className="gap-2"
          >
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Profile</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onToggleProfile}>
                <User className="w-4 h-4 mr-2" />
                View Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                Archive Conversation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}