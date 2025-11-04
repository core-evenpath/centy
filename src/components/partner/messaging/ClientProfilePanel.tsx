// src/components/partner/messaging/ClientProfilePanel.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Mail, Phone, Building2, DollarSign, User, FileText, Edit, Save, Loader2, Briefcase } from 'lucide-react';
import type { SMSConversation, WhatsAppConversation, Contact } from '@/lib/types';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { updateContactAction } from '@/actions/contact-actions';

type Platform = 'sms' | 'whatsapp';
type UnifiedConversation = (SMSConversation | WhatsAppConversation) & { 
  platform: Platform;
  contactId?: string; // Enriched from contacts
};

interface ClientProfilePanelProps {
  conversation: UnifiedConversation;
  onClose: () => void;
  partnerId: string;
}

export default function ClientProfilePanel({ conversation, onClose, partnerId }: ClientProfilePanelProps) {
  const { toast } = useToast();
  const [contact, setContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedContact, setEditedContact] = useState<Partial<Contact>>({});

  useEffect(() => {
    const fetchContact = async () => {
      setIsLoading(true);
      
      try {
        // Try to use contactId from enriched conversation first
        if (conversation.contactId) {
          const contactRef = doc(db, `partners/${partnerId}/contacts`, conversation.contactId);
          const contactSnap = await getDoc(contactRef);
          
          if (contactSnap.exists()) {
            const contactData = { id: contactSnap.id, ...contactSnap.data() } as Contact;
            setContact(contactData);
            setEditedContact(contactData);
            setIsLoading(false);
            return;
          }
        }

        // Fallback: search by phone number
        const contactsRef = collection(db, `partners/${partnerId}/contacts`);
        const q = query(contactsRef, where('phone', '==', conversation.customerPhone), limit(1));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const contactDoc = snapshot.docs[0];
          const contactData = { id: contactDoc.id, ...contactDoc.data() } as Contact;
          setContact(contactData);
          setEditedContact(contactData);
        } else {
          // No existing contact - prepare new contact template
          setContact(null);
          setEditedContact({
            name: conversation.customerName || '',
            phone: conversation.customerPhone,
            email: '',
            portfolio: '',
            occupation: '',
            accountType: '',
            notes: '',
            groups: [],
            tags: [],
            status: 'active',
          });
        }
      } catch (error) {
        console.error('Error fetching contact:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load contact information'
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (partnerId && conversation.customerPhone) {
      fetchContact();
    }
  }, [partnerId, conversation.customerPhone, conversation.contactId]);

  const handleFieldChange = (field: string, value: string) => {
    setEditedContact(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!editedContact.name || !editedContact.phone) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Name and phone number are required'
      });
      return;
    }

    setIsSaving(true);
    try {
      const contactId = contact?.id;

      if (!contactId) {
        // Create new contact
        const newContactRef = doc(collection(db, `partners/${partnerId}/contacts`));
        const newContactData: Partial<Contact> = {
          ...editedContact,
          partnerId: partnerId,
          phone: conversation.customerPhone, // Ensure phone is set
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
        };
        
        await setDoc(newContactRef, newContactData);
        
        const createdContact = { ...newContactData, id: newContactRef.id } as Contact;
        setContact(createdContact);
        setEditedContact(createdContact);
        
        toast({ 
          title: 'Contact Created', 
          description: 'New contact profile has been saved.' 
        });
      } else {
        // Update existing contact using the server action
        const result = await updateContactAction({
          partnerId,
          contactId,
          name: editedContact.name!,
          phone: editedContact.phone!,
          email: editedContact.email,
          status: editedContact.status as 'active' | 'inactive' || 'active',
          groups: editedContact.groups,
          portfolio: editedContact.portfolio,
          occupation: editedContact.occupation,
          accountType: editedContact.accountType,
        });

        if (result.success) {
          // Also update notes separately if changed
          if (editedContact.notes !== contact.notes) {
            const contactRef = doc(db, `partners/${partnerId}/contacts`, contactId);
            await updateDoc(contactRef, { 
              notes: editedContact.notes || '',
              updatedAt: new Date() 
            });
          }

          setContact(prev => prev ? { ...prev, ...editedContact } : null);
          toast({ 
            title: 'Profile Updated', 
            description: 'Client information has been saved.' 
          });
        } else {
          throw new Error(result.message);
        }
      }
      
      setIsEditing(false);
    } catch (error: any) {
      console.error("Error saving contact:", error);
      toast({ 
        variant: 'destructive', 
        title: 'Save Failed', 
        description: error.message || 'Could not save client profile.' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedContact(contact || {
      name: conversation.customerName || '',
      phone: conversation.customerPhone,
      email: '',
      portfolio: '',
      occupation: '',
      accountType: '',
      notes: '',
    });
    setIsEditing(false);
  };

  const DetailItem = ({ 
    icon: Icon, 
    label, 
    value, 
    field, 
    isEditing: editing, 
    placeholder,
    type = 'text'
  }: {
    icon: any;
    label: string;
    value: string | undefined;
    field: string;
    isEditing: boolean;
    placeholder: string;
    type?: string;
  }) => (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-slate-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 mb-1">{label}</p>
        {editing ? (
          <Input
            type={type}
            value={value || ''}
            onChange={(e) => handleFieldChange(field, e.target.value)}
            placeholder={placeholder}
            className="h-9"
          />
        ) : (
          <p className="text-sm text-slate-900 font-medium">
            {value || <span className="text-slate-400">Not set</span>}
          </p>
        )}
      </div>
    </div>
  );

  const getInitials = (name?: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-30 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out border-l border-slate-200 flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Client Profile</h3>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
          
          {/* Profile Header */}
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-3 shadow-lg">
              {getInitials(isEditing ? editedContact?.name : contact?.name)}
            </div>
            {isEditing ? (
              <Input 
                value={editedContact?.name || ''} 
                onChange={e => handleFieldChange('name', e.target.value)}
                className="text-center font-semibold"
                placeholder="Client Name"
              />
            ) : (
              <h4 className="font-semibold text-slate-900 text-lg">
                {contact?.name || conversation.customerName || 'Unknown Client'}
              </h4>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Contact Details */}
              <div>
                <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
                  Contact Details
                </h5>
                <div className="space-y-3">
                  <DetailItem 
                    icon={Phone} 
                    label="Phone" 
                    value={conversation.customerPhone} 
                    isEditing={false}
                  />
                  <DetailItem 
                    icon={Mail} 
                    label="Email" 
                    value={editedContact?.email} 
                    field="email" 
                    isEditing={isEditing}
                    placeholder="client@example.com"
                    type="email"
                  />
                </div>
              </div>

              {/* Professional Info */}
              <div>
                <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
                  Professional Info
                </h5>
                <div className="space-y-3">
                  <DetailItem 
                    icon={Briefcase} 
                    label="Occupation" 
                    value={editedContact?.occupation} 
                    field="occupation" 
                    isEditing={isEditing}
                    placeholder="e.g., Tech Executive"
                  />
                  <DetailItem 
                    icon={Building2} 
                    label="Account Type" 
                    value={editedContact?.accountType} 
                    field="accountType" 
                    isEditing={isEditing}
                    placeholder="e.g., Individual Brokerage"
                  />
                  <DetailItem 
                    icon={DollarSign} 
                    label="Portfolio Size" 
                    value={editedContact?.portfolio} 
                    field="portfolio" 
                    isEditing={isEditing}
                    placeholder="e.g., $2.4M"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
                  Notes
                </h5>
                {isEditing ? (
                  <Textarea
                    value={editedContact?.notes || ''}
                    onChange={(e) => handleFieldChange('notes', e.target.value)}
                    placeholder="Add notes about this client..."
                    rows={6}
                    className="text-sm resize-none"
                  />
                ) : (
                  <div className="text-sm p-4 bg-slate-50 rounded-lg whitespace-pre-wrap min-h-[120px] text-slate-700">
                    {contact?.notes || <span className="text-slate-400 italic">No notes yet.</span>}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-200 bg-slate-50">
          {isEditing ? (
            <div className="flex gap-2">
              <Button
                onClick={handleCancel}
                variant="outline"
                className="flex-1"
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setIsEditing(true)}
              className="w-full"
              variant="default"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>
    </>
  );
}