// src/components/partner/contacts/EditContactModal.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Edit, Save, User, Briefcase, Sparkles } from 'lucide-react';
import { updateContactAction } from '@/actions/contact-actions';
import type { Contact } from '@/lib/types';
import PersonaPanel from './PersonaPanel';

interface EditContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact | null;
  partnerId: string;
}

export default function EditContactModal({
  isOpen,
  onClose,
  contact,
  partnerId,
}: EditContactModalProps) {
  const [formData, setFormData] = useState<Partial<Contact>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (contact) {
      setFormData(contact);
    }
  }, [contact]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact || !formData.name || !formData.phone) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Name and phone number are required.' });
      return;
    }
    setIsSubmitting(true);

    try {
      const result = await updateContactAction({
        partnerId,
        contactId: contact.id,
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        status: formData.status as 'active' | 'inactive',
        groups: formData.groups,
        lifetimeValue: formData.lifetimeValue,
        company: formData.company,
        category: formData.category,
      });

      if (result.success) {
        toast({ title: 'Success', description: 'Contact has been updated.' });
        onClose();
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error Updating Contact',
        description: error.message || 'An unknown error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Contact</DialogTitle>
          <DialogDescription>
            Update the contact details below. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">
                <User className="w-4 h-4 mr-2" />
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="business">
                <Briefcase className="w-4 h-4 mr-2" />
                Business Info
              </TabsTrigger>
              <TabsTrigger value="persona">
                <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
                Persona
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone || ''}
                  onChange={handleInputChange}
                  placeholder="+1234567890"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={handleInputChange}
                  placeholder="john.doe@example.com"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status || 'active'}
                  onValueChange={(value) => handleSelectChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="business" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="company">Company / Organization</Label>
                <Input
                  id="company"
                  value={formData.company || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., Acme Corp, Tech Solutions"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category / Tier</Label>
                <Input
                  id="category"
                  value={formData.category || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., Premium, Enterprise, Basic"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lifetimeValue">Lifetime Value</Label>
                <Input
                  id="lifetimeValue"
                  value={formData.lifetimeValue || ''}
                  onChange={handleInputChange}
                  placeholder="e.g., $50K, High Value, Tier 1"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={handleInputChange}
                  placeholder="Add any additional notes about this contact..."
                  rows={4}
                  disabled={isSubmitting}
                />
              </div>
            </TabsContent>

            <TabsContent value="persona" className="mt-4">
              {contact && (
                <PersonaPanel
                  contactId={contact.id}
                  partnerId={partnerId}
                  persona={contact.persona}
                  messageCount={contact.totalMessageCount || 0}
                  generationStatus={contact.personaGenerationStatus || 'idle'}
                />
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> Save Changes</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}