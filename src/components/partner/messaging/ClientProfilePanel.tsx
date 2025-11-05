// src/components/partner/messaging/ClientProfilePanel.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Mail, Phone, Building2, DollarSign, User, FileText, Edit, Save, Loader2, Briefcase } from 'lucide-react';
import type { Contact } from '@/lib/types';
import type { UnifiedConversation } from '@/lib/conversation-grouping-service';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { updateContactAction } from '@/actions/contact-actions';

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
        // Try to find contact by contactId first
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

        // Search by phone number
        const contactsRef = collection(db, `partners/${partnerId}/contacts`);
        const q = query(contactsRef, where('phone', '==', conversation.customerPhone), limit(1));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const contactDoc = snapshot.docs[0];
          const contactData = { id: contactDoc.id, ...contactDoc.data() } as Contact;
          setContact(contactData);
          setEditedContact(contactData);
        } else {
          // Create default contact object for new contact
          setContact(null);
          setEditedContact({
            name: conversation.contactName || conversation.customerName || '',
            phone: conversation.customerPhone,
            email: conversation.contactEmail || '',
            lifetimeValue: conversation.clientInfo?.lifetimeValue || '',
            company: conversation.clientInfo?.company || '',
            category: conversation.clientInfo?.category || '',
            notes: conversation.clientInfo?.notes || '',
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
  }, [partnerId, conversation.customerPhone, conversation.contactId, conversation.contactName, conversation.customerName, conversation.contactEmail, conversation.clientInfo]);

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
          phone: conversation.customerPhone,
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
        // Update existing contact
        const result = await updateContactAction({
          partnerId,
          contactId,
          name: editedContact.name!,
          phone: editedContact.phone!,
          email: editedContact.email,
          status: editedContact.status as 'active' | 'inactive' || 'active',
          groups: editedContact.groups,
          lifetimeValue: editedContact.lifetimeValue,
          company: editedContact.company,
          category: editedContact.category,
        });

        if (result.success) {
          // Update notes separately if changed
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
            description: 'Contact information has been saved.' 
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
        description: error.message || 'Could not save contact profile.' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedContact(contact || {
      name: conversation.contactName || conversation.customerName || '',
      phone: conversation.customerPhone,
      email: conversation.contactEmail || '',
      lifetimeValue: '',
      company: '',
      category: '',
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
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const displayName = contact?.name || conversation.contactName || conversation.customerName || 'Unknown Contact';

  return (
    <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Contact Profile</h3>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button size="sm" variant="ghost" onClick={handleCancel} disabled={isSaving}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Saving</>
                ) : (
                  <><Save className="w-4 h-4 mr-1" /> Save</>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                <Edit className="w-4 h-4 mr-1" /> Edit
              </Button>
              <Button size="sm" variant="ghost" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Profile Picture & Name */}
      <div className="p-5 border-b border-slate-200">
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold mb-3">
            {getInitials(displayName)}
          </div>
          <div className="w-full text-center">
            {isEditing ? (
              <Input 
                value={editedContact?.name || ''} 
                onChange={e => handleFieldChange('name', e.target.value)}
                className="text-center font-semibold"
                placeholder="Contact Name"
              />
            ) : (
              <h4 className="font-semibold text-slate-900 text-lg">
                {displayName}
              </h4>
            )}
          </div>
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
                  field="phone"
                  isEditing={false}
                  placeholder=""
                />
                <DetailItem 
                  icon={Mail} 
                  label="Email" 
                  value={editedContact?.email} 
                  field="email" 
                  isEditing={isEditing}
                  placeholder="contact@example.com"
                  type="email"
                />
              </div>
            </div>

            {/* Business Info - Generic Fields */}
            <div>
              <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
                Business Info
              </h5>
              <div className="space-y-3">
                <DetailItem 
                  icon={Building2} 
                  label="Company" 
                  value={editedContact?.company} 
                  field="company" 
                  isEditing={isEditing}
                  placeholder="e.g., Acme Corp"
                />
                <DetailItem 
                  icon={Briefcase} 
                  label="Category" 
                  value={editedContact?.category} 
                  field="category" 
                  isEditing={isEditing}
                  placeholder="e.g., Premium, Enterprise"
                />
                <DetailItem 
                  icon={DollarSign} 
                  label="Lifetime Value" 
                  value={editedContact?.lifetimeValue} 
                  field="lifetimeValue" 
                  isEditing={isEditing}
                  placeholder="e.g., $50K, Tier 1"
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
                  placeholder="Add notes about this contact..."
                  className="min-h-[100px] text-sm"
                />
              ) : (
                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                  {editedContact?.notes || <span className="text-slate-400">No notes yet</span>}
                </p>
              )}
            </div>

            {/* Platform Info */}
            <div>
              <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
                Available Platforms
              </h5>
              <div className="flex gap-2">
                {conversation.availablePlatforms?.map(platform => (
                  <span
                    key={platform}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      platform === 'whatsapp'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {platform === 'whatsapp' ? 'WhatsApp' : 'SMS'}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}