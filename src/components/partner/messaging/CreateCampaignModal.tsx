
// src/components/partner/messaging/CreateCampaignModal.tsx
"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Badge } from '../../ui/badge';
import { Label } from '../../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import type { Contact, ContactGroup, Campaign } from '@/lib/types';
import { sendSmsCampaignAction } from '@/actions/sms-actions';
import { sendWhatsAppCampaignAction } from '@/actions/whatsapp-actions';
import { cn } from '@/lib/utils';
import { Loader2, Send, Users, User, X, Check, MessageSquare, Phone, Sparkles, Upload } from 'lucide-react';
import AIComposerModal from './AIComposerModal';
import { ScrollArea } from '@/components/ui/scroll-area';

const messageTemplates = [
    {
      id: 'template1',
      name: 'Stock Pick Alert',
      content: '💰 GS Foundation - September 16 Selected Quality Stock\n📍 Industry: Nuclear Energy\n✅ Ticker: NNE\n🛒 Buy Range: Current price\n📊 Expected Return: 20% - 40%\n⏳ Trade Type: Short term (holding period: 7–15 trading days)\n⏳ Position Size: 10%  given current market conditions we do not recommend exceeding this allocation'
    },
    {
      id: 'template2',
      name: 'Quick Update',
      content: 'Quick update: ONTO has performed really well, and it’s a perfect time to sell and lock in your profits. Don’t miss out! 💰'
    }
  ];

export const CreateCampaignModal = ({
  isOpen,
  onClose,
  partnerId,
  onConversationStarted,
}: {
  isOpen: boolean;
  onClose: () => void;
  partnerId: string;
  onConversationStarted?: (conversationId: string) => void;
}) => {
  const { toast } = useToast();
  const [platform, setPlatform] = useState<'whatsapp' | 'sms'>('whatsapp');
  const [showAiComposer, setShowAiComposer] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Data fetching state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactGroups, setContactGroups] = useState<ContactGroup[]>([]);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(true);

  // Form state
  const [campaignName, setCampaignName] = useState(`Campaign - ${new Date().toLocaleDateString()}`);
  const [selectedRecipients, setSelectedRecipients] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRecipientPopoverOpen, setIsRecipientPopoverOpen] = useState(false);

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
    if (!campaignName.trim() || selectedRecipients.length === 0 || !message.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Campaign name, recipients, and message are required.' });
      return;
    }

    setIsSending(true);
    try {
      // 1. Create the Campaign document in Firestore
      const campaignData: Partial<Campaign> = {
        name: campaignName,
        partnerId,
        status: 'sent',
        sentCount: selectedRecipients.reduce((acc, r) => acc + (r.contactCount || 1), 0),
        engagementRate: 0,
        revenueGenerated: 0,
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, `partners/${partnerId}/campaigns`), campaignData);

      // 2. Call the correct action based on platform
      let result;
      const campaignPayload = {
        partnerId: partnerId,
        message,
        recipients: selectedRecipients.map(r => ({
          id: r.id,
          name: r.name,
          type: r.contactCount !== undefined ? 'group' : 'contact'
        })),
        ...(mediaUrl && { mediaUrl }),
      };

      if (platform === 'whatsapp') {
        result = await sendWhatsAppCampaignAction(campaignPayload as any); // Cast needed if action is not updated yet
      } else {
        result = await sendSmsCampaignAction(campaignPayload);
      }

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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        toast({
            variant: 'destructive',
            title: 'Invalid File Type',
            description: 'Please select an image file.'
        });
        return;
    }

    const reader = new FileReader();
    reader.onload = () => {
        setMediaUrl(reader.result as string);
        toast({
            title: 'Image Uploaded',
            description: 'Your image is attached and ready to send.'
        });
    };
    reader.onerror = () => {
        toast({
            variant: 'destructive',
            title: 'Upload Failed',
            description: 'There was an error reading the image file.'
        });
    };
    reader.readAsDataURL(file);
  };

  const availableRecipients = useMemo(() => {
    return [
      ...contactGroups.map(g => ({ ...g, type: 'group' })),
      ...contacts.map(c => ({ ...c, type: 'contact' }))
    ];
  }, [contacts, contactGroups]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Create New Campaign</DialogTitle>
            <DialogDescription>Design, target, and send a new marketing campaign.</DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-6 -mr-6">
            <div className="space-y-4 py-4">
              
              {/* Platform Selector */}
              <div>
                <Label htmlFor="platform" className="text-sm font-medium mb-2 block">Platform</Label>
                <Tabs defaultValue="whatsapp" onValueChange={(value) => setPlatform(value as any)} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="whatsapp" className="flex items-center gap-2"><MessageSquare /> WhatsApp</TabsTrigger>
                        <TabsTrigger value="sms" className="flex items-center gap-2"><Phone /> SMS</TabsTrigger>
                    </TabsList>
                </Tabs>
              </div>

              {/* Campaign Name */}
              <div>
                <Label htmlFor="campaign-name" className="text-sm font-medium">Campaign Name</Label>
                <Input
                  id="campaign-name"
                  placeholder="e.g., Q4 Promotion"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  disabled={isSending}
                  className="mt-1"
                />
              </div>

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

              {/* Message and Templates */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <Label htmlFor="message" className="text-sm font-medium">Message</Label>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="w-4 h-4 mr-2 text-gray-500" />
                        Upload
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      className="hidden"
                      accept="image/*"
                    />
                    <Button variant="ghost" size="sm" onClick={() => setShowAiComposer(true)}>
                      <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
                      AI Compose
                    </Button>
                  </div>
                </div>
                <Textarea
                  id="message"
                  placeholder="Type your message or select a template..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={8}
                  disabled={isSending}
                />
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Use a template:</span>
                  {messageTemplates.map(template => (
                    <Button 
                      key={template.id}
                      variant="outline"
                      size="sm"
                      onClick={() => setMessage(template.content)}
                      disabled={isSending}
                    >
                      {template.name}
                    </Button>
                  ))}
                </div>
                 {mediaUrl && (
                  <div className="mt-4">
                    <Label>Image Attachment</Label>
                    <div className="mt-2 relative w-48 h-48">
                      <img src={mediaUrl} alt="Generated attachment" className="rounded-lg object-cover w-full h-full" />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                        onClick={() => setMediaUrl(null)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="flex-shrink-0 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isSending}>Cancel</Button>
            <Button onClick={handleSend} disabled={isSending || selectedRecipients.length === 0 || !message.trim()}>
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              {isSending ? 'Sending...' : 'Send Campaign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {showAiComposer && (
        <AIComposerModal
          isOpen={showAiComposer}
          onClose={() => setShowAiComposer(false)}
          onTextGenerated={(text) => {
            setMessage(text);
            setShowAiComposer(false);
          }}
          onImageGenerated={(imageUrl) => {
            setMediaUrl(imageUrl);
            setShowAiComposer(false);
          }}
        />
      )}
    </>
  );
};
