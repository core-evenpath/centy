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

// Simplified V1 NewCampaignModal
export const NewCampaignModal = ({ setShowNewCampaign }: { setShowNewCampaign: (show: boolean) => void }) => {
  const { currentWorkspace } = useMultiWorkspaceAuth();
  const { toast } = useToast();

  // Data fetching state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Form state
  const [selectedRecipients, setSelectedRecipients] = useState<Array<{ id: string; name: string; type: 'contact' | 'group' }>>([]);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [open, setOpen] = useState(false);

  // Fetch contacts and groups
  useEffect(() => {
    if (!currentWorkspace?.partnerId) return;

    setIsLoadingData(true);
    const contactsQuery = query(collection(db, `partners/${currentWorkspace.partnerId}/contacts`));
    const groupsQuery = query(collection(db, `partners/${currentWorkspace.partnerId}/contactGroups`));

    const unsubContacts = onSnapshot(contactsQuery, (snapshot) => {
      setContacts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contact)));
    });

    const unsubGroups = onSnapshot(groupsQuery, (snapshot) => {
      setGroups(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContactGroup)));
      setIsLoadingData(false);
    });

    return () => {
      unsubContacts();
      unsubGroups();
    };
  }, [currentWorkspace?.partnerId]);

  const recipientOptions = useMemo(() => [
    ...contacts.map(c => ({ id: c.id, name: c.name, type: 'contact' as const, subtext: c.phone })),
    ...groups.map(g => ({ id: g.id, name: g.name, type: 'group' as const, subtext: `${g.contactCount} contacts` })),
  ], [contacts, groups]);

  const handleSelectRecipient = (recipient: { id: string; name: string; type: 'contact' | 'group' }) => {
    setSelectedRecipients(prev =>
      prev.some(r => r.id === recipient.id)
        ? prev.filter(r => r.id !== recipient.id)
        : [...prev, recipient]
    );
  };
  
  const handleSendCampaign = async () => {
    if (!message.trim() || selectedRecipients.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please select recipients and enter a message.',
      });
      return;
    }
  
    setIsSending(true);
  
    const result = await sendSmsCampaignAction({
      partnerId: currentWorkspace!.partnerId,
      message,
      recipients: selectedRecipients,
    });
  
    if (result.success) {
      toast({
        title: 'Campaign Sent!',
        description: result.message,
      });
      setShowNewCampaign(false);
    } else {
      toast({
        variant: 'destructive',
        title: 'Failed to Send Campaign',
        description: result.message,
      });
    }
  
    setIsSending(false);
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Send New Campaign</h2>
          <button onClick={() => setShowNewCampaign(false)}>
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Recipient Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To:</label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-start h-auto flex-wrap"
                >
                  <div className="flex gap-1 flex-wrap">
                    {selectedRecipients.length > 0 ? (
                      selectedRecipients.map(recipient => (
                        <Badge
                          key={recipient.id}
                          variant="secondary"
                          className="mr-1"
                        >
                          {recipient.type === 'group' && <Users className="w-3 h-3 mr-1"/>}
                          {recipient.type === 'contact' && <User className="w-3 h-3 mr-1"/>}
                          {recipient.name}
                          <div
                            role="button"
                            tabIndex={0}
                            className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectRecipient(recipient);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.stopPropagation();
                                    handleSelectRecipient(recipient);
                                }
                            }}
                          >
                            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                          </div>
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">Select recipients...</span>
                    )}
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Search contacts or groups..." disabled={isLoadingData}/>
                  {isLoadingData ? (
                    <div className="p-4 text-center text-sm">
                      <Loader2 className="w-4 h-4 animate-spin inline mr-2"/>Loading...
                    </div>
                  ) : (
                    <CommandList>
                      <CommandEmpty>No results found.</CommandEmpty>
                      <CommandGroup heading="Groups">
                        {groups.map(group => (
                          <CommandItem
                            key={group.id}
                            onSelect={() => handleSelectRecipient({id: group.id, name: group.name, type: 'group'})}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedRecipients.some(r => r.id === group.id)
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                                {group.name}
                            </div>
                            <span className="text-xs text-muted-foreground">{group.contactCount} contacts</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      <CommandGroup heading="Contacts">
                        {contacts.map(contact => (
                          <CommandItem
                            key={contact.id}
                            onSelect={() => handleSelectRecipient({id: contact.id, name: contact.name, type: 'contact'})}
                          >
                             <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedRecipients.some(r => r.id === contact.id)
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <User className="mr-2 h-4 w-4 text-muted-foreground" />
                             <div className="flex-1">
                                {contact.name}
                            </div>
                            <span className="text-xs text-muted-foreground">{contact.phone}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  )}
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Message Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message:</label>
            <Textarea
              rows={8}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
              disabled={isSending}
            />
             <p className="text-xs text-muted-foreground mt-1">This will be sent as an SMS message.</p>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <Button variant="outline" onClick={() => setShowNewCampaign(false)} disabled={isSending}>
            Cancel
          </Button>
          <Button onClick={handleSendCampaign} disabled={isSending || !message.trim() || selectedRecipients.length === 0}>
             {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Campaign
                  </>
                )}
          </Button>
        </div>
      </div>
    </div>
  );
};


// These are no longer used for the simple V1 but are kept for potential future use.
export const NewTemplateModal = ({ setShowNewTemplate }: { setShowNewTemplate: (show: boolean) => void }) => {
    return <div></div>;
};

export const NewGroupModal = ({ setShowNewGroup }: { setShowNewGroup: (show: boolean) => void }) => {
    return <div></div>;
};
