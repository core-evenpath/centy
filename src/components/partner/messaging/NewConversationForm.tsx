// src/components/partner/messaging/NewConversationForm.tsx
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, X, MessageCircle, Smartphone } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

type Platform = 'sms' | 'whatsapp';

interface NewConversationFormProps {
  phoneNumber: string;
  message: string;
  platform: Platform;
  onPhoneNumberChange: (value: string) => void;
  onMessageChange: (value: string) => void;
  onPlatformChange: (value: Platform) => void;
  onSend: () => void;
  onCancel: () => void;
  isSending: boolean;
}

export default function NewConversationForm({
  phoneNumber,
  message,
  platform,
  onPhoneNumberChange,
  onMessageChange,
  onPlatformChange,
  onSend,
  onCancel,
  isSending,
}: NewConversationFormProps) {
  
  const canSend = !isSending && phoneNumber.trim() && message.trim();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSend) {
        onSend();
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-lg p-6 relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-muted-foreground"
          onClick={onCancel}
        >
          <X className="w-4 h-4" />
        </Button>
        
        <h2 className="text-xl font-semibold mb-2">New Conversation</h2>
        <p className="text-muted-foreground mb-6">
          Enter a phone number and a message to start a new chat.
        </p>

        <div className="space-y-4">
          <Input
            placeholder="Phone number (e.g., +15551234567)"
            value={phoneNumber}
            onChange={(e) => onPhoneNumberChange(e.target.value)}
            disabled={isSending}
          />
          
          <RadioGroup 
            defaultValue="whatsapp" 
            className="flex gap-4"
            value={platform}
            onValueChange={(value: Platform) => onPlatformChange(value)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="whatsapp" id="r-whatsapp" />
              <Label htmlFor="r-whatsapp" className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-green-500" />
                WhatsApp
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sms" id="r-sms" />
              <Label htmlFor="r-sms" className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-blue-500" />
                SMS
              </Label>
            </div>
          </RadioGroup>

          <Textarea
            placeholder="Type your message..."
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[120px] max-h-[240px] resize-none"
            disabled={isSending}
          />

          <Button 
            onClick={onSend} 
            disabled={!canSend}
            className="w-full"
            size="lg"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Send className="w-5 h-5 mr-2" />
            )}
            Send Message
          </Button>
        </div>
      </div>
    </div>
  );
}