// src/components/partner/messaging/NewConversationForm.tsx
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send } from 'lucide-react';

interface NewConversationFormProps {
  phoneNumber: string;
  message: string;
  onPhoneNumberChange: (value: string) => void;
  onMessageChange: (value: string) => void;
  onSend: () => void;
  onCancel: () => void;
  isSending: boolean;
}

export default function NewConversationForm({
  phoneNumber,
  message,
  onPhoneNumberChange,
  onMessageChange,
  onSend,
  onCancel,
  isSending,
}: NewConversationFormProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-6">
        <h2 className="text-lg font-semibold mb-4">Start New Conversation</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Phone Number</label>
            <Input
              placeholder="+1234567890"
              value={phoneNumber}
              onChange={(e) => onPhoneNumberChange(e.target.value)}
              className="max-w-md"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Message</label>
            <Textarea
              placeholder="Type your message..."
              value={message}
              onChange={(e) => onMessageChange(e.target.value)}
              className="max-w-md"
              rows={4}
            />
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={onSend} 
              disabled={isSending || !phoneNumber || !message}
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
