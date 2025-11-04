// src/app/partner/(protected)/contacts/page.tsx
"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { Badge } from '../../../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
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
import { 
  Users, 
  Search, 
  Plus, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Loader2, 
  AlertCircle,
  DollarSign,
  Briefcase,
  TrendingUp,
  Filter,
  Download,
  Mail,
  Phone,
  MessageSquare
} from 'lucide-react';
import sampleContacts from '@/lib/contacts.json';
import AddContactModal from '@/components/partner/contacts/AddContactModal';
import EditContactModal from '@/components/partner/contacts/EditContactModal';

export default function ContactsPage() {
  const { currentWorkspace } = useMultiWorkspaceAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [portfolioFilter, setPortfolioFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'portfolio' | 'recent'>('name');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
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
              status: contact.status || 'active',
              createdAt: new Date(),
              updatedAt: new Date(),
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
          setFirestoreError('Permission Denied: Your security rules are preventing access to the contacts collection.');
        } else {
          setFirestoreError(`An error occurred while fetching contacts: ${error.message}`);
        }
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [partnerId]);

  // Calculate stats
  const stats = useMemo(() => {
    const active = contacts.filter(c => c.status === 'active' || !c.status).length;
    const withPortfolio = contacts.filter(c => c.portfolio).length;
    const totalPortfolioValue = contacts.reduce((sum, c) => {
      if (c.portfolio) {
        const value = parseFloat(c.portfolio.replace(/[$,KMB]/g, '')) || 0;
        return sum + value;
      }
      return sum;
    }, 0);
    
    return {
      total: contacts.length,
      active,
      inactive: contacts.length - active,
      withPortfolio,
      totalPortfolioValue: `$${(totalPortfolioValue / 1000000).toFixed(1)}M`
    };
  }, [contacts]);

  // Filter and sort contacts
  const filteredContacts = useMemo(() => {
    let filtered = contacts.filter(contact => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        contact.name?.toLowerCase().includes(searchLower) ||
        contact.email?.toLowerCase().includes(searchLower) ||
        contact.phone?.includes(searchLower) ||
        contact.occupation?.toLowerCase().includes(searchLower);
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && (contact.status === 'active' || !contact.status)) ||
        (statusFilter === 'inactive' && contact.status === 'inactive');
      
      const matchesPortfolio = portfolioFilter === 'all' ||
        (portfolioFilter === 'has' && contact.portfolio) ||
        (portfolioFilter === 'none' && !contact.portfolio);
      
      return matchesSearch && matchesStatus && matchesPortfolio;
    });

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      } else if (sortBy === 'portfolio') {
        const aValue = parseFloat((a.portfolio || '0').replace(/[$,KMB]/g, '')) || 0;
        const bValue = parseFloat((b.portfolio || '0').replace(/[$,KMB]/g, '')) || 0;
        return bValue - aValue;
      } else if (sortBy === 'recent') {
        const aDate = a.updatedAt || a.createdAt || new Date(0);
        const bDate = b.updatedAt || b.createdAt || new Date(0);
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      }
      return 0;
    });

    return filtered;
  }, [contacts, searchTerm, statusFilter, portfolioFilter, sortBy]);

  const handleEditClick = (contact: Contact) => {
    setEditingContact(contact);
    setIsEditModalOpen(true);
  };

  const getStatusBadge = (status?: string) => {
    const isActive = status === 'active' || !status;
    return isActive
      ? <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
      : <Badge variant="secondary" className="bg-gray-100 text-gray-700">Inactive</Badge>;
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Phone', 'Email', 'Occupation', 'Portfolio', 'Account Type', 'Status'];
    const rows = filteredContacts.map(c => [
      c.name,
      c.phone,
      c.email || '',
      c.occupation || '',
      c.portfolio || '',
      c.accountType || '',
      c.status || 'active'
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts.csv';
    a.click();
  };

  return (
    <>
      <PartnerHeader
        title="Contacts"
        subtitle="Your client relationship management hub"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </div>
        }
      />
      
      <main className="flex-1 overflow-y-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Contacts</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Clients</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">With Portfolio</p>
                  <p className="text-2xl font-bold">{stats.withPortfolio}</p>
                </div>
                <Briefcase className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total AUM</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalPortfolioValue}</p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <CardTitle>All Contacts</CardTitle>
                <CardDescription>
                  Manage your client relationships and track key information
                </CardDescription>
              </div>

              {/* Filters and Search */}
              <div className="flex flex-wrap gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search contacts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={portfolioFilter} onValueChange={setPortfolioFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Portfolio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="has">Has Portfolio</SelectItem>
                    <SelectItem value="none">No Portfolio</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(val) => setSortBy(val as any)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="portfolio">Portfolio</SelectItem>
                    <SelectItem value="recent">Recent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {firestoreError ? (
              <div className="flex items-center justify-center p-8 text-center">
                <div>
                  <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Error Loading Contacts</h3>
                  <p className="text-sm text-muted-foreground mb-4">{firestoreError}</p>
                </div>
              </div>
            ) : isLoading ? (
              <div className="flex justify-center items-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact Info</TableHead>
                      <TableHead>Occupation</TableHead>
                      <TableHead>Portfolio</TableHead>
                      <TableHead>Account Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContacts.length > 0 ? (
                      filteredContacts.map((contact) => (
                        <TableRow key={contact.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-semibold">
                                {contact.name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '??'}
                              </div>
                              <div>
                                <div className="font-medium">{contact.name}</div>
                                {contact.groups && contact.groups.length > 0 && (
                                  <div className="flex gap-1 mt-1">
                                    {contact.groups.slice(0, 2).map(group => (
                                      <Badge key={group} variant="outline" className="text-xs">
                                        {group}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Phone className="w-3 h-3" />
                                {contact.phone}
                              </div>
                              {contact.email && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Mail className="w-3 h-3" />
                                  {contact.email}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{contact.occupation || '-'}</span>
                          </TableCell>
                          <TableCell>
                            {contact.portfolio ? (
                              <span className="font-semibold text-blue-600">{contact.portfolio}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {contact.accountType ? (
                              <Badge variant="secondary">{contact.accountType}</Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(contact.status)}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditClick(contact)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <MessageSquare className="w-4 h-4 mr-2" />
                                  Message
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center p-8">
                          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4"/>
                          <h3 className="font-semibold">No contacts found</h3>
                          <p className="text-sm text-muted-foreground">
                            {contacts.length === 0 
                              ? "Your contact list is empty. Add your first contact." 
                              : "No contacts match your current filters."}
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
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