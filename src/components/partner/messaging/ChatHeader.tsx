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

interface ChatHeaderProps {
  conversation: {
    id: string;
    platform: Platform;
    customerPhone: string;
    customerName?: string;
    contactName?: string;
    contactEmail?: string;
    contactId?: string;
    lastMessageAt?: any;
    messageCount?: number;
    isActive?: boolean;
    partnerId?: string;
    createdAt?: any;
    clientInfo?: any;
  };
  onViewProfile?: () => void;
}

export default function ChatHeader({
  conversation,
  onViewProfile,
}: ChatHeaderProps) {
  const displayName = conversation.contactName || conversation.customerName || conversation.customerPhone;
  
  const getPlatformIcon = (platform: Platform) => {
    if (platform === 'whatsapp') {
      return <MessageCircle className="h-4 w-4 text-green-600" />;
    }
    return <Smartphone className="h-4 w-4 text-blue-600" />;
  };

  const getPlatformBadge = (platform: Platform) => {
    if (platform === 'whatsapp') {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <MessageCircle className="h-3 w-3 mr-1" />
          WhatsApp
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
        <Smartphone className="h-3 w-3 mr-1" />
        SMS
      </Badge>
    );
  };

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center border-2 border-white">
              {getPlatformIcon(conversation.platform)}
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-900">
                {displayName}
              </h2>
              {getPlatformBadge(conversation.platform)}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-slate-600 flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                {conversation.customerPhone}
              </span>
              {conversation.contactEmail && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="text-sm text-slate-600 flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    {conversation.contactEmail}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {onViewProfile && (
            <Button
              variant="outline"
              size="sm"
              onClick={onViewProfile}
              className="h-9"
            >
              <User className="h-4 w-4 mr-2" />
              View Profile
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onViewProfile}>
                <User className="h-4 w-4 mr-2" />
                View Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-slate-500">
                Mute Conversation
              </DropdownMenuItem>
              <DropdownMenuItem className="text-slate-500">
                Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}