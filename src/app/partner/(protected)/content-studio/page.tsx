
// src/app/partner/(protected)/content-studio/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent } from '../../../../components/ui/card';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import type { Contact, ContactGroup } from '@/lib/types';
import PartnerHeader from '../../../../components/partner/PartnerHeader';
import { 
  Send, 
  Users, 
  FileText, 
  Loader2, 
  AlertCircle, 
  X,
  MessageCircle as WhatsAppIcon,
  Phone as SmsIcon,
  User,
  Check
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../../components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '../../../../components/ui/input';
import { Textarea } from '../../../../components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { sendSmsCampaignAction } from '@/actions/sms-actions';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

// V1 Modal: New Conversation with recipient selection
const NewConversationModal = ({ 
  isOpen, 
  onClose,
  onConversationStarted
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onConversationStarted: (conversationId: string, platform: 'sms' | 'whatsapp') => void;
}) => {
  const { currentWorkspace } = useMultiWorkspaceAuth();
  const { toast } = useToast();
  
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactGroups, setContactGroups] = useState<ContactGroup[]>([]);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(true);

  const [selectedRecipients, setSelectedRecipients] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRecipientPopoverOpen, setIsRecipientPopoverOpen] = useState(false);

  const partnerId = currentWorkspace?.partnerId;

  // Fetch contacts and groups
  useEffect(() => {
    if (!partnerId || !isOpen) return;

    setIsLoadingRecipients(true);
    const contactsQuery = query(collection(db, `partners/${partnerId}/contacts`));
    const groupsQuery = query(collection(db, `partners/${partnerId}/contactGroups`));

    const unsubContacts = onSnapshot(contactsQuery, snapshot => {
      setContacts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contact)));
    });
    
    const unsubGroups = onSnapshot(groupsQuery, snapshot => {
      setContactGroups(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContactGroup)));
    });

    Promise.all([new Promise(res => setTimeout(res, 500))]).then(() => setIsLoadingRecipients(false));

    return () => {
      unsubContacts();
      unsubGroups();
    };
  }, [partnerId, isOpen]);

  const handleSend = async () => {
    if (selectedRecipients.length === 0 || !message.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Recipients and message are required.' });
      return;
    }
    if (!currentWorkspace?.partnerId) {
      toast({ variant: 'destructive', title: 'Error', description: 'No active workspace found.' });
      return;
    }

    setIsSending(true);
    try {
      const result = await sendSmsCampaignAction({
        partnerId: currentWorkspace.partnerId,
        message,
        recipients: selectedRecipients.map(r => ({
          id: r.id,
          name: r.name,
          type: r.contactCount !== undefined ? 'group' : 'contact'
        })),
      });
      
      if (result.success) {
        toast({ title: 'Campaign Sent', description: result.message });
        onClose();
      } else {
        throw new Error(result.message || 'Failed to send campaign.');
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsSending(false);
    }
  };

  const handleRecipientSelect = (recipient: any) => {
    setSelectedRecipients(prev => {
      if (prev.some(r => r.id === recipient.id)) {
        return prev.filter(r => r.id !== recipient.id);
      }
      return [...prev, recipient];
    });
  };

  const availableRecipients = useMemo(() => {
    return [
      ...contactGroups.map(g => ({ ...g, type: 'group' })),
      ...contacts.map(c => ({ ...c, type: 'contact' }))
    ];
  }, [contacts, contactGroups]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Send New Campaign</DialogTitle>
          <DialogDescription>Send a message to selected contacts or groups.</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Recipient Selector */}
          <div>
            <Label htmlFor="recipients" className="text-sm font-medium">Recipients</Label>
            <Popover open={isRecipientPopoverOpen} onOpenChange={setIsRecipientPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={isRecipientPopoverOpen}
                  className="w-full justify-between h-auto min-h-10 mt-1"
                >
                  <div className="flex gap-1 flex-wrap items-center">
                    {selectedRecipients.length > 0 ? (
                      selectedRecipients.map(r => (
                        <Badge key={r.id} variant="secondary" className="mr-1">
                          <div className="flex items-center">
                            {r.type === 'group' ? <Users className="w-3 h-3 mr-1" /> : <User className="w-3 h-3 mr-1" />}
                            {r.name}
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRecipientSelect(r);
                              }}
                              className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            >
                              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                            </div>
                          </div>
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground">Select contacts or groups...</span>
                    )}
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Search recipients..." />
                  <CommandList>
                    {isLoadingRecipients ? (
                      <div className="p-4 text-center text-sm">Loading recipients...</div>
                    ) : (
                      <>
                        <CommandEmpty>No recipients found.</CommandEmpty>
                        <CommandGroup heading="Groups">
                          {contactGroups.map(group => (
                            <CommandItem
                              key={group.id}
                              onSelect={() => handleRecipientSelect({ ...group, type: 'group' })}
                              className="cursor-pointer"
                            >
                              <Check className={cn("mr-2 h-4 w-4", selectedRecipients.some(r => r.id === group.id) ? "opacity-100" : "opacity-0")} />
                              <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                              <div className="flex-1">{group.name}</div>
                              <div className="text-xs text-muted-foreground">{group.contactCount} contacts</div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                        <CommandGroup heading="Contacts">
                          {contacts.map(contact => (
                            <CommandItem
                              key={contact.id}
                              onSelect={() => handleRecipientSelect({ ...contact, type: 'contact' })}
                              className="cursor-pointer"
                            >
                              <Check className={cn("mr-2 h-4 w-4", selectedRecipients.some(r => r.id === contact.id) ? "opacity-100" : "opacity-0")} />
                              <User className="mr-2 h-4 w-4 text-muted-foreground" />
                              <div className="flex-1">{contact.name}</div>
                              <div className="text-xs text-muted-foreground">{contact.phone}</div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label htmlFor="message" className="text-sm font-medium">Message</Label>
            <Textarea
              id="message"
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              disabled={isSending}
              className="mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSending}>Cancel</Button>
          <Button onClick={handleSend} disabled={isSending || selectedRecipients.length === 0 || !message.trim()}>
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            {isSending ? 'Sending...' : 'Send Message'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


function MessagingPlatform() {
  const { currentWorkspace } = useMultiWorkspaceAuth();
  const router = useRouter();
  const [contactGroups, setContactGroups] = useState<ContactGroup[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);

  useEffect(() => {
    if (!currentWorkspace?.partnerId) {
      setIsLoadingGroups(false);
      setContactGroups([]);
      return;
    }

    setIsLoadingGroups(true);
    setFirestoreError(null);
    const collectionPath = `partners/${currentWorkspace.partnerId}/contactGroups`;
    const q = query(collection(db, collectionPath));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setContactGroups(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContactGroup)));
      setIsLoadingGroups(false);
    }, (error) => {
      console.error("Firestore onSnapshot error:", error);
      setFirestoreError("Permission denied. Cannot fetch contact groups.");
      setIsLoadingGroups(false);
    });

    return () => unsubscribe();
  }, [currentWorkspace?.partnerId]);

  const handleConversationStarted = (conversationId: string, platform: 'sms' | 'whatsapp') => {
    // Redirect to the messaging page with the new conversation selected
    router.push(`/partner/messaging?conversation=${conversationId}&platform=${platform}`);
  };
  
  const totalContacts = contactGroups.reduce((sum, g) => sum + (g.contactCount || 0), 0);
  
  return (
    <div className="min-h-full bg-gray-50 p-4 sm:p-6 flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4 space-y-6">
          <button
            onClick={() => setShowNewConversationModal(true)}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all mb-6 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Send className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <h2 className="text-xl font-bold text-white mb-1">Send New Campaign</h2>
                  <p className="text-blue-100 text-sm">Start a new SMS or WhatsApp campaign</p>
                </div>
              </div>
            </div>
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card
              onClick={() => alert("This feature is under development.")}
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all text-left border-2 border-transparent hover:border-purple-300 group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <FileText className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">
                Message Templates
              </h3>
              <p className="text-gray-600 text-sm">
                Browse pre-written messages you can customize
              </p>
            </Card>

            <Link href="/partner/contacts">
              <Card
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all text-left border-2 border-transparent hover:border-green-300 group cursor-pointer h-full"
              >
                <div className="flex items-start justify-between mb-3">
                  <Users className="w-10 h-10 text-green-600" />
                   <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                    {isLoadingGroups ? <Loader2 className="w-3 h-3 animate-spin"/> : `${totalContacts} CONTACTS`}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-green-600 transition-colors">
                  Contact Groups
                </h3>
                <p className="text-gray-600 text-sm">View and manage your contact lists</p>
              </Card>
            </Link>
          </div>

          {firestoreError && (
               <Card className="sm:col-span-2 lg:col-span-3 bg-red-50 border-red-200">
                  <CardContent className="p-6 text-center">
                      <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-4"/>
                      <h3 className="text-xl font-semibold text-red-800">Permission Error</h3>
                      <p className="text-red-700 mt-2 text-sm whitespace-pre-wrap">{firestoreError}</p>
                  </CardContent>
              </Card>
          )}

        </div>
      </div>
      {showNewConversationModal && (
        <NewConversationModal 
          isOpen={showNewConversationModal}
          onClose={() => setShowNewConversationModal(false)} 
          onConversationStarted={(conversationId, platform) => handleConversationStarted(conversationId, platform)}
        />
      )}
    </div>
  );
}

export default function ContentStudioPage() {
  return (
    <>
      <PartnerHeader
        title="Content Studio"
        subtitle="Design, manage and send your content."
      />
      <main className="flex-1 overflow-y-auto">
        <MessagingPlatform />
      </main>
    </>
  );
}
