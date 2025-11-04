// src/components/partner/messaging/ClientProfilePanel.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Mail, Phone, Building2, DollarSign, Circle, MessageSquare, FileText, Calendar, Edit, Save, Loader2, User } from 'lucide-react';
import type { SMSConversation, WhatsAppConversation, Contact } from '@/lib/types';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

type Platform = 'sms' | 'whatsapp';
type UnifiedConversation = (SMSConversation | WhatsAppConversation) & { 
  platform: Platform;
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
      
      const contactsRef = collection(db, `partners/${partnerId}/contacts`);
      const q = query(contactsRef, where('phone', '==', conversation.customerPhone), limit(1));
      
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const contactDoc = snapshot.docs[0];
        const contactData = { id: contactDoc.id, ...contactDoc.data() } as Contact;
        setContact(contactData);
        setEditedContact(contactData);
      } else {
        setContact(null); // No existing contact
        setEditedContact({
          name: conversation.customerName || '',
          phone: conversation.customerPhone,
          email: '',
          portfolio: '',
          occupation: '',
          accountType: '',
          notes: ''
        });
      }
      setIsLoading(false);
    };

    if (partnerId && conversation.customerPhone) {
      fetchContact();
    }
  }, [partnerId, conversation.customerPhone]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
        let contactId = contact?.id;

        // If no contact exists, create a new one
        if (!contactId) {
            const newContactRef = doc(collection(db, `partners/${partnerId}/contacts`));
            const newContactData: Partial<Contact> = {
                ...editedContact,
                partnerId: partnerId,
                createdAt: new Date(),
                updatedAt: new Date(),
                isActive: true
            };
            await setDoc(newContactRef, newContactData);
            contactId = newContactRef.id;
            setContact({ ...newContactData, id: contactId } as Contact);
            toast({ title: 'Contact Created', description: 'New contact profile has been saved.' });
        } else {
            // Update existing contact
            const contactRef = doc(db, `partners/${partnerId}/contacts`, contactId);
            await updateDoc(contactRef, { ...editedContact, updatedAt: new Date() });
            setContact(prev => prev ? { ...prev, ...editedContact } : null);
            toast({ title: 'Profile Updated', description: 'Client information has been saved.' });
        }
        setIsEditing(false);
    } catch (error) {
        console.error("Error saving contact:", error);
        toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save client profile.' });
    } finally {
        setIsSaving(false);
    }
  };

  const DetailItem = ({ icon: Icon, label, value, field, isEditing: editing, onChange, placeholder }: any) => (
    <div className="flex items-start gap-3">
        <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4 text-slate-600" />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500">{label}</p>
            {editing ? (
                <Input
                    value={value || ''}
                    onChange={(e) => onChange(field, e.target.value)}
                    placeholder={placeholder}
                    className="h-8 mt-1"
                />
            ) : (
                <p className="text-sm text-slate-900 truncate font-medium">
                    {value || 'Not set'}
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
      <div 
        className="fixed inset-0 bg-black bg-opacity-30 z-40 transition-opacity"
        onClick={onClose}
      />
      
      <div className="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out border-l border-slate-200">
        <div className="flex flex-col h-full">
          <div className="p-5 border-b border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Client Profile</h3>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-slate-500 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-3">
                {getInitials(isEditing ? editedContact?.name : contact?.name)}
              </div>
              <h4 className="font-semibold text-slate-900 text-lg mb-1">
                {isEditing ? (
                    <Input value={editedContact?.name || ''} onChange={e => setEditedContact(prev => ({...prev, name: e.target.value}))} className="text-center"/>
                ) : (
                    contact?.name || conversation.customerName || 'Unknown Client'
                )}
              </h4>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">Details</h5>
                  <div className="space-y-3">
                    <DetailItem icon={Phone} label="Phone" value={conversation.customerPhone} isEditing={false} />
                    <DetailItem icon={Mail} label="Email" value={editedContact?.email} field="email" isEditing={isEditing} onChange={setEditedContact} placeholder="client@example.com" />
                    <DetailItem icon={Building2} label="Occupation" value={editedContact?.occupation} field="occupation" isEditing={isEditing} onChange={setEditedContact} placeholder="e.g., Tech Executive" />
                    <DetailItem icon={DollarSign} label="Portfolio Size" value={editedContact?.portfolio} field="portfolio" isEditing={isEditing} onChange={setEditedContact} placeholder="e.g., $2.4M" />
                  </div>
                </div>

                <div>
                  <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">Notes</h5>
                  {isEditing ? (
                    <Textarea
                      value={editedContact?.notes || ''}
                      onChange={(e) => setEditedContact(prev => ({...prev, notes: e.target.value}))}
                      placeholder="Add notes about this client..."
                      rows={4}
                      className="text-sm"
                    />
                  ) : (
                    <div className="text-sm p-3 bg-slate-50 rounded-lg whitespace-pre-wrap min-h-[100px]">
                      {contact?.notes || 'No notes yet.'}
                    </div>
                  )}
                </div>

                {!isEditing && (
                    <Button onClick={() => setIsEditing(true)} className="w-full">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                    </Button>
                )}

                {isEditing && (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => { setIsEditing(false); setEditedContact(contact || {}); }} className="flex-1">
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            {isSaving ? 'Saving...' : 'Save Profile'}
                        </Button>
                    </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
