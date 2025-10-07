// src/app/partner/(protected)/contacts/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { Badge } from '../../../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../../components/ui/dropdown-menu';
import { useMultiWorkspaceAuth } from '@/hooks/use-multi-workspace-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, writeBatch, doc } from 'firebase/firestore';
import type { Contact } from '@/lib/types';
import PartnerHeader from '../../../../components/partner/PartnerHeader';
import { Users, Search, Plus, MoreVertical, Edit, Trash2, Loader2, AlertCircle } from 'lucide-react';
import sampleContacts from '@/lib/contacts.json';

export default function ContactsPage() {
  const { currentWorkspace } = useMultiWorkspaceAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  const partnerId = currentWorkspace?.partnerId;

  useEffect(() => {
    if (!partnerId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setFirestoreError(null);
    const collectionPath = `partners/${partnerId}/contacts`;
    const q = query(collection(db, collectionPath));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      // Seed data if collection is empty
      if (snapshot.empty) {
        console.log(`Contacts collection is empty for partner ${partnerId}. Seeding...`);
        try {
          const batch = writeBatch(db);
          sampleContacts.forEach(contact => {
            const docRef = doc(collection(db, collectionPath));
            batch.set(docRef, { ...contact, partnerId });
          });
          await batch.commit();
          console.log('Sample contacts seeded successfully.');
        } catch (seedError) {
          console.error("Error seeding contacts:", seedError);
          setFirestoreError("Failed to initialize sample contacts.");
        }
        setIsLoading(false);
        return;
      }

      const contactsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Contact));
      
      setContacts(contactsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Firestore onSnapshot error:", error);
      setFirestoreError('You do not have permission to view contacts. Please check your security rules.');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [partnerId]);

  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          contact.phone.includes(searchTerm);
      const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [contacts, searchTerm, statusFilter]);

  const getStatusBadge = (status: string) => {
    return status === 'active'
      ? <Badge variant="success">Active</Badge>
      : <Badge variant="secondary">Inactive</Badge>;
  };

  return (
    <>
      <PartnerHeader
        title="Contacts"
        subtitle="Manage your contact list and groups."
        actions={<Button><Plus className="w-4 h-4 mr-2" />Add Contact</Button>}
      />
      <main className="flex-1 overflow-y-auto p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Contacts</CardTitle>
                <CardDescription>
                  A complete list of contacts in your workspace.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm bg-background"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            )}
            
            {firestoreError && (
              <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-4"/>
                <h3 className="text-xl font-semibold text-red-800">Permission Error</h3>
                <p className="text-red-700 mt-2 text-sm">{firestoreError}</p>
              </div>
            )}
            
            {!isLoading && !firestoreError && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Groups</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell className="font-medium">{contact.name}</TableCell>
                      <TableCell>{contact.phone}</TableCell>
                      <TableCell>{contact.email || 'N/A'}</TableCell>
                      <TableCell>{getStatusBadge(contact.status)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {contact.groups?.map(group => <Badge key={group} variant="outline">{group}</Badge>)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem><Edit className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600"><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {!isLoading && !firestoreError && filteredContacts.length === 0 && (
              <div className="text-center p-8">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4"/>
                <h3 className="font-semibold">No contacts found</h3>
                <p className="text-sm text-muted-foreground">Add your first contact to get started.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
