// src/components/partner/messaging/SecondLevelModals.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Textarea } from '../../ui/textarea';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Plus,
  Send,
  X,
  Upload,
  Lightbulb,
  Trash2,
  Users,
  User,
  Loader2,
  Check
} from 'lucide-react';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { Contact, ContactGroup } from '@/lib/types';
import { sendSmsCampaignAction } from '@/actions/sms-actions';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../ui/dialog';
import { Input } from '../../ui/input';

// V1 Modal: Replaced with a simple new conversation starter
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
      // We'll use the SMS action as the primary for this simplified flow
      const result = await sendSMSAction({
        partnerId: currentWorkspace.partnerId,
        to: phoneNumber,
        message: message,
      });

      if (result.success && result.conversationId) {
        toast({ title: 'Conversation Started', description: 'Your message has been sent.' });
        onConversationStarted(result.conversationId); // Pass the ID back
        onClose(); // Close the modal
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


// These are no longer used for the simple V1 but are kept for potential future use.
export const NewTemplateModal = ({ setShowNewTemplate }: { setShowNewTemplate: (show: boolean) => void }) => {
    return <div></div>;
};

export const NewGroupModal = ({ setShowNewGroup }: { setShowNewGroup: (show: boolean) => void }) => {
    return <div></div>;
};
