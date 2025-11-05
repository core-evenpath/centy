// src/components/partner/messaging/ChatHeader.tsx
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User,
  MessageCircle,
  Smartphone,
  ChevronDown,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import type { UnifiedConversation } from '@/lib/conversation-grouping-service';

type Platform = 'sms' | 'whatsapp';

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
  onToggleProfile 
}: ChatHeaderProps) {
  const displayName = conversation.contactName || conversation.customerName || conversation.customerPhone;
  const hasMultiplePlatforms = conversation.availablePlatforms.length > 1;

  console.log('🎨 ChatHeader render:', {
    displayName,
    platforms: conversation.availablePlatforms,
    selectedPlatform,
    hasMultiplePlatforms
  });

  return (
    <div className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-slate-900 text-base truncate">
              {displayName}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-500">{conversation.customerPhone}</span>
              {conversation.clientInfo?.company && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs text-slate-500">{conversation.clientInfo.company}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {hasMultiplePlatforms ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="gap-2"
              >
                {selectedPlatform === 'whatsapp' ? (
                  <>
                    <MessageCircle className="w-4 h-4 text-green-600" />
                    <span>WhatsApp</span>
                  </>
                ) : (
                  <>
                    <Smartphone className="w-4 h-4 text-blue-600" />
                    <span>SMS</span>
                  </>
                )}
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {conversation.availablePlatforms.map(platform => (
                <DropdownMenuItem
                  key={platform}
                  onClick={() => {
                    console.log('🔄 Switching to platform:', platform);
                    onPlatformChange(platform);
                  }}
                  className={selectedPlatform === platform ? 'bg-slate-50' : ''}
                >
                  {platform === 'whatsapp' ? (
                    <>
                      <MessageCircle className="w-4 h-4 mr-2 text-green-600" />
                      <span>Send via WhatsApp</span>
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-4 h-4 mr-2 text-blue-600" />
                      <span>Send via SMS</span>
                    </>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Badge 
            variant="secondary"
            className={`${
              selectedPlatform === 'whatsapp'
                ? 'bg-green-100 text-green-700'
                : 'bg-blue-100 text-blue-700'
            }`}
          >
            {selectedPlatform === 'whatsapp' ? (
              <MessageCircle className="w-3 h-3 mr-1" />
            ) : (
              <Smartphone className="w-3 h-3 mr-1" />
            )}
            {selectedPlatform === 'whatsapp' ? 'WhatsApp' : 'SMS'}
          </Badge>
        )}

        <div className="flex items-center gap-2 ml-3">
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