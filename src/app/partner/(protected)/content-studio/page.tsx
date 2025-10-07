// src/app/partner/(protected)/content-studio/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent } from '../../../../components/ui/card';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import type { ContactGroup } from '@/lib/types';
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
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../../components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '../../../../components/ui/input';
import { Textarea } from '../../../../components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { sendSMSAction } from '@/actions/sms-actions';
import { sendWhatsAppMessageAction } from '@/actions/whatsapp-actions';

// Simple Modal for V1 - New Conversation
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
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [platform, setPlatform] = useState<'whatsapp' | 'sms'>('whatsapp');

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
      let result;
      if (platform === 'whatsapp') {
        result = await sendWhatsAppMessageAction({
          partnerId: currentWorkspace.partnerId,
          to: phoneNumber,
          message: message,
        });
      } else {
        result = await sendSMSAction({
          partnerId: currentWorkspace.partnerId,
          to: phoneNumber,
          message: message,
        });
      }

      if (result.success && result.conversationId) {
        toast({ title: 'Conversation Started', description: `Your ${platform.toUpperCase()} message has been sent.` });
        onConversationStarted(result.conversationId, platform);
        onClose();
      } else {
        throw new Error(result.message || `Failed to send ${platform.toUpperCase()} message.`);
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
          <DialogDescription>Send an initial message to a new contact via WhatsApp or SMS.</DialogDescription>
        </DialogHeader>
        
        <Tabs value={platform} onValueChange={(value) => setPlatform(value as any)} className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="whatsapp" className="flex items-center gap-2">
              <WhatsAppIcon className="w-4 h-4" />
              WhatsApp
            </TabsTrigger>
            <TabsTrigger value="sms" className="flex items-center gap-2">
              <SmsIcon className="w-4 h-4" />
              SMS
            </TabsTrigger>
          </TabsList>
        </Tabs>

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
            {isSending ? 'Sending...' : `Send ${platform.toUpperCase()}`}
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
                  <h2 className="text-xl font-bold text-white mb-1">Send New Message</h2>
                  <p className="text-blue-100 text-sm">Start a new SMS or WhatsApp conversation</p>
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
          onConversationStarted={handleConversationStarted}
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
