'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip } from 'lucide-react';

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function MessageInput({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = "Type your message...",
}: MessageInputProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) {
        onSend();
      }
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <div className="flex items-end gap-2">
        <Button
          variant="outline"
          size="icon"
          disabled={disabled}
          className="shrink-0"
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 min-h-[44px] max-h-[120px] resize-none"
          rows={1}
        />

        <Button
          onClick={onSend}
          disabled={!value.trim() || disabled}
          size="icon"
          className="shrink-0 bg-blue-600 hover:bg-blue-700"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}