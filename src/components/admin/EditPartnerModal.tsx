// src/components/admin/EditPartnerModal.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog"
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from '../ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Edit, Trash2 } from 'lucide-react';
import type { Partner } from '../../lib/types';
import { useToast } from '../../hooks/use-toast';
import { industries } from '../../lib/mockData';

interface EditPartnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  partner: Partner;
  onSave: (partnerData: Partner) => void;
  onDelete: (partnerId: string, tenantId: string) => void;
}

export default function EditPartnerModal({ isOpen, onClose, partner, onSave, onDelete }: EditPartnerModalProps) {
  const [formData, setFormData] = useState<Partner>(partner);
  const { toast } = useToast();
  
  useEffect(() => {
    setFormData(partner);
  }, [partner]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value as any }));
  };

  const handleIndustryChange = (value: string) => {
    const selectedIndustry = industries.find(ind => ind.id === value) || null;
    setFormData(prev => ({ ...prev, industry: selectedIndustry }));
  };
  
  const handleNestedInputChange = (parentKey: 'location' | 'stats', nestedKey: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [parentKey]: {
        ...prev[parentKey],
        [nestedKey]: value
      }
    }));
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    toast({
        title: "Partner Details Saved",
        description: "The changes have been saved successfully.",
    });
  };

  const handleDelete = () => {
    if (partner.id && partner.tenantId) {
      onDelete(partner.id, partner.tenantId);
    } else {
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: "Partner ID or Tenant ID is missing. Cannot delete.",
      });
    }
  };
  
  const handleClose = () => {
    onClose();
  }

  if (!partner) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-headline">
              <Edit />
              Edit Partner: {partner.name}
            </DialogTitle>
            <DialogDescription>
             Update the details for this partner organization.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Partner Name</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleInputChange} />
              </div>
              <div>
                <Label htmlFor="businessName">Business Name</Label>
                <Input id="businessName" name="businessName" value={formData.businessName} onChange={handleInputChange} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactPerson">Contact Person</Label>
                <Input id="contactPerson" name="contactPerson" value={formData.contactPerson} onChange={handleInputChange} />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} />
              </div>
            </div>
             <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} />
              </div>
               <div>
                <Label htmlFor="joinedDate">Joined Date</Label>
                <Input id="joinedDate" name="joinedDate" type="date" value={new Date(formData.joinedDate).toISOString().split('T')[0]} onChange={handleInputChange} />
              </div>
            </div>
            <div>
              <Label htmlFor="industry">Industry</Label>
              <Select value={formData.industry?.id || ''} onValueChange={handleIndustryChange}>
                <SelectTrigger id="industry">
                  <SelectValue placeholder="Select an industry" />
                </SelectTrigger>
                <SelectContent>
                  {industries.map((industry) => (
                    <SelectItem key={industry.id} value={industry.id}>
                      {industry.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" name="city" value={formData.location.city} onChange={(e) => handleNestedInputChange('location', 'city', e.target.value)} />
                </div>
                <div>
                    <Label htmlFor="state">State</Label>
                    <Input id="state" name="state" value={formData.location.state} onChange={(e) => handleNestedInputChange('location', 'state', e.target.value)} />
                </div>
            </div>
            <div className="grid grid-cols-3 gap-4 items-center">
                <div>
                    <Label htmlFor="plan">Plan</Label>
                    <Select name="plan" value={formData.plan} onValueChange={(value) => handleSelectChange('plan', value)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                        <SelectItem value="Starter">Starter</SelectItem>
                        <SelectItem value="Professional">Professional</SelectItem>
                        <SelectItem value="Enterprise">Enterprise</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="status">Status</Label>
                     <Select name="status" value={formData.status} onValueChange={(value) => handleSelectChange('status', value)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div>
                    <Label htmlFor="businessSize">Business Size</Label>
                     <Select name="businessSize" value={formData.businessSize} onValueChange={(value) => handleSelectChange('businessSize', value)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
             <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="employeeCount">Employee Count</Label>
                <Input id="employeeCount" name="employeeCount" type="number" value={formData.employeeCount} onChange={handleInputChange} />
              </div>
              <div>
                <Label htmlFor="monthlyRevenue">Monthly Revenue</Label>
                <Input id="monthlyRevenue" name="monthlyRevenue" value={formData.monthlyRevenue} onChange={handleInputChange} />
              </div>
              <div>
                <Label htmlFor="aiProfileCompleteness">AI Profile %</Label>
                <Input id="aiProfileCompleteness" name="aiProfileCompleteness" type="number" value={formData.aiProfileCompleteness} onChange={handleInputChange} />
              </div>
            </div>
            <div className="flex items-center space-x-2">
                <Switch 
                    id="isActivePlanUser" 
                    checked={formData.isActivePlanUser}
                    onCheckedChange={(checked) => handleSwitchChange('isActivePlanUser', checked)}
                />
                <Label htmlFor="isActivePlanUser">Active Plan User</Label>
            </div>
          </div>

          <DialogFooter className="justify-between">
             <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Partner
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the
                    <span className="font-bold"> {partner.name} </span>
                     partner account and all associated data, including their authentication tenant.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
