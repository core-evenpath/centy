"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, X, MessageCircle, Smartphone } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { sendSMSAction } from '@/actions/sms-actions';
import { sendWhatsAppMessageAction } from '@/actions/whatsapp-actions';
import { useToast } from '@/hooks/use-toast';

type Platform = 'sms' | 'whatsapp';

interface NewConversationFormProps {
  partnerId: string;
  onClose: () => void;
  onConversationCreated: (conversationId: string, platform: Platform) => void;
}

export default function NewConversationForm({
  partnerId,
  onClose,
  onConversationCreated
}: NewConversationFormProps) {
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [platform, setPlatform] = useState<Platform>('whatsapp');
  const [isSending, setIsSending] = useState(false);

  const canSend = !isSending && phoneNumber.trim() && message.trim();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSend) {
        handleSend();
      }
    }
  };

  const handleSend = async () => {
    if (!canSend) return;

    setIsSending(true);
    try {
      let result;

      if (platform === 'sms') {
        result = await sendSMSAction({
          partnerId,
          to: phoneNumber,
          message: message,
        });
      } else {
        result = await sendWhatsAppMessageAction({
          partnerId,
          to: phoneNumber,
          message: message,
        });
      }

      if (result.success && result.conversationId) {
        toast({
          title: 'Message sent',
          description: `Your ${platform.toUpperCase()} message has been sent successfully.`
        });
        onConversationCreated(result.conversationId, platform);
      } else {
        throw new Error(result.message || 'Failed to send message');
      }
    } catch (error: any) {
      console.error('Failed to send message:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to send',
        description: error.message || 'An error occurred while sending your message.'
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8 relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
          onClick={onClose}
          disabled={isSending}
        >
          <X className="w-5 h-5" />
        </Button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Start New Conversation</h2>
          <p className="text-slate-600">
            Send a message via WhatsApp or SMS to start chatting with a customer.
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <Label htmlFor="phone" className="text-sm font-semibold text-slate-700 mb-2 block">
              Phone Number
            </Label>
            <Input
              id="phone"
              placeholder="+1 (555) 123-4567"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isSending}
              className="h-12 text-base"
            />
            <p className="text-xs text-slate-500 mt-1">Include country code (e.g., +1 for US)</p>
          </div>

          <div>
            <Label className="text-sm font-semibold text-slate-700 mb-3 block">
              Platform
            </Label>
            <RadioGroup
              value={platform}
              onValueChange={(value: Platform) => setPlatform(value)}
              className="flex gap-4"
            >
              <div className="flex-1">
                <RadioGroupItem value="whatsapp" id="r-whatsapp" className="peer sr-only" />
                <Label
                  htmlFor="r-whatsapp"
                  className="flex items-center justify-center gap-3 rounded-lg border-2 border-slate-200 bg-white p-4 hover:bg-slate-50 peer-data-[state=checked]:border-green-500 peer-data-[state=checked]:bg-green-50 cursor-pointer transition-all"
                >
                  <MessageCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-slate-900">WhatsApp</span>
                </Label>
              </div>
              <div className="flex-1">
                <RadioGroupItem value="sms" id="r-sms" className="peer sr-only" />
                <Label
                  htmlFor="r-sms"
                  className="flex items-center justify-center gap-3 rounded-lg border-2 border-slate-200 bg-white p-4 hover:bg-slate-50 peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-50 cursor-pointer transition-all"
                >
                  <Smartphone className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-slate-900">SMS</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="message" className="text-sm font-semibold text-slate-700 mb-2 block">
              Message
            </Label>
            <Textarea
              id="message"
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[140px] text-base resize-none"
              disabled={isSending}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSending}
              className="flex-1 h-12"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={!canSend}
              className="flex-1 h-12 bg-blue-600 hover:bg-blue-700"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}