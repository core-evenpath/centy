// src/components/partner/messaging/SecondLevelModals.tsx
"use client";

import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { Textarea } from '../../ui/textarea';
import {
  Loader2,
  Send,
} from 'lucide-react';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { useToast } from '@/hooks/use-toast';
import { sendSMSAction } from '@/actions/sms-actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../ui/dialog';
import { Input } from '../../ui/input';

// This file is simplified to only contain the essential components.
// The complex modals for templates and groups are removed as per the new focus.

export const NewCampaignModal = ({
  isOpen,
  onClose,
  onConversationStarted
}: {
  isOpen: boolean;
  onClose: () => void;
  onConversationStarted: (conversationId: string) => void;
}) => {
  const { currentWorkspace } = useMultiWorkspaceAuth();
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!phoneNumber.trim() || !message.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Phone number and message are required.' });
      return;
    }
    if (!currentWorkspace?.partnerId) {
      toast({ variant: 'destructive', title: 'Error', description: 'No active workspace found.' });
      return;
    }

    setIsSending(true);
    try {
      const result = await sendSMSAction({
        partnerId: currentWorkspace.partnerId,
        to: phoneNumber,
        message: message,
      });

      if (result.success && result.conversationId) {
        toast({ title: 'Conversation Started', description: 'Your message has been sent.' });
        onConversationStarted(result.conversationId);
        onClose();
      } else {
        throw new Error(result.message || 'Failed to send message.');
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start a New Conversation</DialogTitle>
          <DialogDescription>Send an initial SMS to a new contact. The conversation will appear in your messaging inbox.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label htmlFor="phone-number" className="text-sm font-medium">Phone Number</label>
            <Input
              id="phone-number"
              placeholder="+1234567890 (E.164 format)"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isSending}
            />
          </div>
          <div>
            <label htmlFor="message" className="text-sm font-medium">Message</label>
            <Textarea
              id="message"
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              disabled={isSending}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSending}>Cancel</Button>
          <Button onClick={handleSend} disabled={isSending}>
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            {isSending ? 'Sending...' : 'Send Message'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
