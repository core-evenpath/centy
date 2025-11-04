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
import { Phone, MessageCircle as WhatsAppIcon, MoreVertical, Info, ChevronRight, Circle } from 'lucide-react';
import type { SMSConversation, WhatsAppConversation } from '@/lib/types';

type Platform = 'sms' | 'whatsapp';
type UnifiedConversation = (SMSConversation | WhatsAppConversation) & { 
  platform: Platform;
  clientInfo?: {
    portfolio?: string;
    email?: string;
    occupation?: string;
    accountType?: string;
  };
};

interface ChatHeaderProps {
  conversation: UnifiedConversation;
  onShowClientProfile: () => void;
}

export default function ChatHeader({ conversation, onShowClientProfile }: ChatHeaderProps) {
  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between bg-white">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-500 text-white flex items-center justify-center font-semibold text-sm">
          {getInitials(conversation.customerName)}
        </div>
        <div>
          <h2 className="font-semibold text-slate-900">
            {conversation.customerName || conversation.customerPhone}
          </h2>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${
              conversation.platform === 'whatsapp'
                ? 'bg-green-100 text-green-700'
                : 'bg-blue-100 text-blue-700'
            }`}>
              <Circle className="w-2 h-2 fill-current" />
              {conversation.platform === 'whatsapp' ? 'WhatsApp' : 'SMS'}
            </span>
            {conversation.clientInfo?.portfolio && (
              <span className="text-xs text-slate-500">
                · {conversation.clientInfo.portfolio}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Client Profile Button */}
      <Button
        onClick={onShowClientProfile}
        variant="outline"
        className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
      >
        Client Profile
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}