// src/components/partner/contacts/AddContactModal.tsx
"use client";

import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, User, Briefcase } from 'lucide-react';
import { createContactAction } from '@/actions/contact-actions';

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerId: string;
  initialData?: {
    name?: string;
    phone?: string;
  };
}

export default function AddContactModal({
  isOpen,
  onClose,
  partnerId,
  initialData
}: AddContactModalProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  // Generic CRM fields
  const [company, setCompany] = useState('');
  const [category, setCategory] = useState('');
  const [lifetimeValue, setLifetimeValue] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Update state when initialData changes or modal opens
  React.useEffect(() => {
    if (isOpen && initialData) {
      if (initialData.name) setName(initialData.name);
      if (initialData.phone) setPhone(initialData.phone);
    }
  }, [isOpen, initialData]);

  const resetAndClose = () => {
    setName('');
    setEmail('');
    setPhone('');
    setStatus('active');
    setCompany('');
    setCategory('');
    setLifetimeValue('');
    setNotes('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Name and phone number are required.' });
      return;
    }
    setIsSubmitting(true);

    try {
      const result = await createContactAction({
        partnerId,
        name,
        phone,
        email,
        status,
        company,
        category,
        lifetimeValue,
        notes,
      });

      if (result.success) {
        toast({ title: 'Success', description: 'Contact has been added.' });
        resetAndClose();
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error Adding Contact',
        description: error.message || 'An unknown error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Contact</DialogTitle>
          <DialogDescription>
            Enter the contact details below. Fields marked with * are required.
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
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john.doe@example.com"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(value: 'active' | 'inactive') => setStatus(value)}>
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
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g., Acme Corp, Tech Solutions"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category / Tier</Label>
                <Input
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g., Premium, Enterprise, Basic"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lifetimeValue">Lifetime Value</Label>
                <Input
                  id="lifetimeValue"
                  value={lifetimeValue}
                  onChange={(e) => setLifetimeValue(e.target.value)}
                  placeholder="e.g., $50K, High Value, Tier 1"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional notes about this contact..."
                  rows={4}
                  disabled={isSubmitting}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button variant="outline" type="button" onClick={resetAndClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...</>
              ) : (
                <><Plus className="w-4 h-4 mr-2" /> Add Contact</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}