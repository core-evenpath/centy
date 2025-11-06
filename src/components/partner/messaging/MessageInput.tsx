"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, MessageCircle, Smartphone } from 'lucide-react';

type Platform = 'sms' | 'whatsapp';

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isSending: boolean;
  disabled?: boolean;
  platform: Platform;
}

export default function MessageInput({ 
  value, 
  onChange, 
  onSend, 
  isSending, 
  disabled,
  platform
}: MessageInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isSending && value.trim() && !disabled) {
        onSend();
      }
    }
  };

  return (
    <div className="border-t border-slate-200 bg-white">
      <div className="max-w-3xl mx-auto p-5">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              disabled={isSending || disabled}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <div
              className={`px-4 py-2.5 rounded-lg border flex items-center gap-2 ${
                platform === 'whatsapp'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}
            >
              {platform === 'whatsapp' ? (
                <>
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm font-semibold">WhatsApp</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-4 h-4" />
                  <span className="text-sm font-semibold">SMS</span>
                </>
              )}
            </div>
            
            <Button
              onClick={onSend}
              disabled={isSending || !value.trim() || disabled}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl h-[48px] whitespace-nowrap font-semibold"
            >
              <Send className="w-4 h-4 mr-2" />
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}