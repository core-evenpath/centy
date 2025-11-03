// src/components/partner/messaging/MessageInput.tsx
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send } from 'lucide-react';

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isSending: boolean;
  disabled?: boolean;
}

export default function MessageInput({ value, onChange, onSend, isSending, disabled }: MessageInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="border-t p-4 bg-white dark:bg-gray-800">
      <div className="flex items-end gap-2">
        <Textarea
          placeholder="Type a message..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 min-h-[60px] max-h-[120px] resize-none"
          disabled={isSending || disabled}
        />
        <Button 
          onClick={onSend} 
          disabled={isSending || !value.trim() || disabled}
          size="icon"
          className="h-[60px] w-[60px]"
        >
          {isSending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </Button>
      </div>
    </div>
  );
}
