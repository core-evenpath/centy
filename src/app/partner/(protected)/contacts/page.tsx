// src/app/partner/(protected)/contacts/page.tsx
"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { collection, query, onSnapshot, writeBatch, doc } from 'firebase/firestore';
import type { Contact } from '@/lib/types';
import PartnerHeader from '../../../../components/partner/PartnerHeader';
import { Users, Search, Plus, MoreVertical, Edit, Trash2, Loader2, AlertCircle } from 'lucide-react';
import sampleContacts from '@/lib/contacts.json';
import AddContactModal from '@/components/partner/contacts/AddContactModal';
import EditContactModal from '@/components/partner/contacts/EditContactModal';

export default function ContactsPage() {
  const { currentWorkspace } = useMultiWorkspaceAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const seedHasBeenAttempted = useRef(false);

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

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        if (snapshot.empty && !seedHasBeenAttempted.current) {
          seedHasBeenAttempted.current = true;
          console.log(`Contacts collection empty for partner ${partnerId}. Seeding data...`);
          
          const batch = writeBatch(db);
          sampleContacts.forEach(contact => {
            const docRef = doc(collection(db, collectionPath));
            const newContact: Partial<Contact> = { 
              ...contact, 
              partnerId,
            };
            batch.set(docRef, newContact);
          });

          batch.commit().catch(seedError => {
            console.error("Error seeding contacts:", seedError);
            setFirestoreError("Failed to initialize sample contacts. Please check Firestore permissions.");
            setIsLoading(false);
          });
          
        } else {
          const contactsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Contact));
          
          setContacts(contactsData);
          setIsLoading(false);
        }
      }, 
      (error) => {
        console.error("Firestore onSnapshot error:", error);
        if (error.code === 'permission-denied') {
          setFirestoreError('Permission Denied: Your security rules are preventing access to the contacts collection. Please check your Firestore rules to allow reads for authenticated users of this workspace.');
        } else {
          setFirestoreError(`An error occurred while fetching contacts: ${error.message}`);
        }
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [partnerId]);


  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        contact.name?.toLowerCase().includes(searchLower) ||
        contact.email?.toLowerCase().includes(searchLower) ||
        contact.phone?.includes(searchLower);
      const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [contacts, searchTerm, statusFilter]);

  const handleEditClick = (contact: Contact) => {
    setEditingContact(contact);
    setIsEditModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    return status === 'active'
      ? <Badge variant="success" className="bg-green-100 text-green-800">Active</Badge>
      : <Badge variant="secondary" className="bg-gray-100 text-gray-700">Inactive</Badge>;
  };

  return (
    <>
      <PartnerHeader
        title="Contacts"
        subtitle="Manage your contact list and groups."
        actions={<Button onClick={() => setIsAddModalOpen(true)}><Plus className="w-4 h-4 mr-2" />Add Contact</Button>}
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
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                    placeholder="Search contacts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64 pl-10"
                    />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 h-10 border rounded-md text-sm bg-background"
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
                 <span className="ml-2">Loading Contacts...</span>
              </div>
            )}
            
            {firestoreError && (
              <div className="text-center p-8 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-4"/>
                <h3 className="text-xl font-semibold text-red-800">Permission Error</h3>
                <p className="text-red-700 mt-2 text-sm whitespace-pre-wrap">{firestoreError}</p>
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
                  {filteredContacts.length > 0 ? (
                    filteredContacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell className="font-medium">{contact.name}</TableCell>
                        <TableCell>{contact.phone}</TableCell>
                        <TableCell>{contact.email || 'N/A'}</TableCell>
                        <TableCell>{getStatusBadge(contact.status ?? 'active')}</TableCell>
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
                              <DropdownMenuItem onClick={() => handleEditClick(contact)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600"><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center p-8">
                        <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4"/>
                        <h3 className="font-semibold">No contacts found</h3>
                        <p className="text-sm text-muted-foreground">
                            {contacts.length === 0 ? "Your contact list is empty. Add your first contact." : "No contacts match your current filters."}
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      {partnerId && (
        <>
          <AddContactModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            partnerId={partnerId}
          />
          <EditContactModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setEditingContact(null);
            }}
            contact={editingContact}
            partnerId={partnerId}
          />
        </>
      )}
    </>
  );
}
