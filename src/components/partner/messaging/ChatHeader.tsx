// src/components/partner/messaging/ChatHeader.tsx
"use client";

import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Phone, MessageCircle as WhatsAppIcon, MoreVertical, Info } from 'lucide-react';
import type { SMSConversation, WhatsAppConversation } from '@/lib/types';

type Platform = 'sms' | 'whatsapp';
type UnifiedConversation = (SMSConversation | WhatsAppConversation) & { platform: Platform };

interface ChatHeaderProps {
  conversation: UnifiedConversation;
}

export default function ChatHeader({ conversation }: ChatHeaderProps) {
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

  return (
    <div className="border-b p-4 bg-white dark:bg-gray-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback className={
              conversation.platform === 'sms' 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-green-100 text-green-700'
            }>
              {conversation.platform === 'sms' 
                ? <Phone className="w-5 h-5" /> 
                : <WhatsAppIcon className="w-5 h-5" />
              }
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">
              {conversation.customerName || conversation.customerPhone}
            </h3>
            <div className="flex items-center gap-2">
              {getPlatformBadge(conversation.platform)}
              <span className="text-xs text-muted-foreground">
                {conversation.customerPhone}
              </span>
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Info className="w-4 h-4 mr-2" />
              View Details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
