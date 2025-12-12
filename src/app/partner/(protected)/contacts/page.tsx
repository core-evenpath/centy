// src/app/partner/(protected)/contacts/page.tsx
"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { Badge } from '../../../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table';
import { Avatar, AvatarFallback } from '../../../../components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../../components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../../components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
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
  Building2,
  MessageSquare,
  UserCheck,
  ArrowUpDown,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  Sparkles,
  X
} from 'lucide-react';
import sampleContacts from '@/lib/contacts.json';
import AddContactModal from '@/components/partner/contacts/AddContactModal';
import EditContactModal from '@/components/partner/contacts/EditContactModal';
import { deleteContactAction } from '@/actions/contact-actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { PERSONA_STAGE_LABELS } from '@/lib/types-contact';

type SortField = 'name' | 'createdAt' | 'totalMessageCount' | 'company';
type SortOrder = 'asc' | 'desc';

export default function ContactsPage() {
  const { currentWorkspace } = useMultiWorkspaceAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [companyFilter, setCompanyFilter] = useState<'all' | 'with_company' | 'no_company'>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; contact: Contact | null }>({
    open: false,
    contact: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const seedHasBeenAttempted = useRef(false);
  const { toast } = useToast();

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

  // Calculate stats from real data
  const stats = useMemo(() => {
    const total = contacts.length;
    const active = contacts.filter(c => c.status === 'active').length;
    const withCompany = contacts.filter(c => c.company && c.company.trim() !== '').length;
    const totalMessages = contacts.reduce((acc, c) => acc + (c.totalMessageCount || 0), 0);
    return { total, active, withCompany, totalMessages };
  }, [contacts]);

  // Filter and sort contacts
  const filteredContacts = useMemo(() => {
    let result = contacts.filter(contact => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        contact.name?.toLowerCase().includes(searchLower) ||
        contact.email?.toLowerCase().includes(searchLower) ||
        contact.phone?.includes(searchLower) ||
        contact.company?.toLowerCase().includes(searchLower);

      const matchesStatus = statusFilter === 'all' || contact.status === statusFilter;

      const matchesCompany =
        companyFilter === 'all' ||
        (companyFilter === 'with_company' && contact.company && contact.company.trim() !== '') ||
        (companyFilter === 'no_company' && (!contact.company || contact.company.trim() === ''));

      return matchesSearch && matchesStatus && matchesCompany;
    });

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'company':
          comparison = (a.company || '').localeCompare(b.company || '');
          break;
        case 'totalMessageCount':
          comparison = (a.totalMessageCount || 0) - (b.totalMessageCount || 0);
          break;
        case 'createdAt':
          const aTime = a.createdAt ? (typeof a.createdAt === 'object' && 'seconds' in a.createdAt ? a.createdAt.seconds : 0) : 0;
          const bTime = b.createdAt ? (typeof b.createdAt === 'object' && 'seconds' in b.createdAt ? b.createdAt.seconds : 0) : 0;
          comparison = aTime - bTime;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [contacts, searchTerm, statusFilter, companyFilter, sortField, sortOrder]);

  const handleEditClick = (contact: Contact) => {
    setEditingContact(contact);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (contact: Contact) => {
    setDeleteConfirm({ open: true, contact });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.contact || !partnerId) return;

    setIsDeleting(true);
    try {
      const result = await deleteContactAction(partnerId, deleteConfirm.contact.id);
      if (result.success) {
        toast({ title: 'Contact Deleted', description: 'The contact has been removed.' });
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete contact.',
      });
    } finally {
      setIsDeleting(false);
      setDeleteConfirm({ open: false, contact: null });
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    return status === 'active'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : 'bg-slate-50 text-slate-600 border-slate-200';
  };

  const getPersonaStage = (contact: Contact) => {
    if (contact.persona?.customerStage && contact.persona.customerStage !== 'unknown') {
      return PERSONA_STAGE_LABELS[contact.persona.customerStage] || contact.persona.customerStage;
    }
    return null;
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />;
    return sortOrder === 'asc'
      ? <ChevronUp className="w-3.5 h-3.5 text-primary" />
      : <ChevronDown className="w-3.5 h-3.5 text-primary" />;
  };

  return (
    <>
      <PartnerHeader
        title="Contacts"
        subtitle="Manage and organize your customer relationships"
        actions={
          <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Contact
          </Button>
        }
      />

      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-slate-900">{stats.total}</p>
                  <p className="text-xs text-slate-500">Total Contacts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-50">
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-slate-900">{stats.active}</p>
                  <p className="text-xs text-slate-500">Active Contacts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-50">
                  <Building2 className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-slate-900">{stats.withCompany}</p>
                  <p className="text-xs text-slate-500">With Company</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-50">
                  <MessageSquare className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-slate-900">{stats.totalMessages}</p>
                  <p className="text-xs text-slate-500">Total Messages</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Search */}
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by name, email, phone, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-50 border-slate-200 focus:bg-white"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex gap-2 flex-wrap">
                <Select value={statusFilter} onValueChange={(v: 'all' | 'active' | 'inactive') => setStatusFilter(v)}>
                  <SelectTrigger className="w-[130px] bg-slate-50 border-slate-200">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={companyFilter} onValueChange={(v: 'all' | 'with_company' | 'no_company') => setCompanyFilter(v)}>
                  <SelectTrigger className="w-[150px] bg-slate-50 border-slate-200">
                    <SelectValue placeholder="Company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Contacts</SelectItem>
                    <SelectItem value="with_company">With Company</SelectItem>
                    <SelectItem value="no_company">No Company</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(searchTerm || statusFilter !== 'all' || companyFilter !== 'all') && (
              <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                <span>Showing {filteredContacts.length} of {contacts.length} contacts</span>
                <button
                  onClick={() => { setSearchTerm(''); setStatusFilter('all'); setCompanyFilter('all'); }}
                  className="text-primary hover:underline ml-2"
                >
                  Clear filters
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Content */}
        {isLoading && (
          <Card className="border-slate-200">
            <CardContent className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              <span className="ml-3 text-slate-600">Loading contacts...</span>
            </CardContent>
          </Card>
        )}

        {firestoreError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-800">Permission Error</h3>
                  <p className="text-red-700 mt-1 text-sm">{firestoreError}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!isLoading && !firestoreError && (
          <Card className="border-slate-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="w-[300px]">
                    <button
                      onClick={() => toggleSort('name')}
                      className="flex items-center gap-2 font-medium hover:text-primary transition-colors"
                    >
                      Contact
                      <SortIcon field="name" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => toggleSort('company')}
                      className="flex items-center gap-2 font-medium hover:text-primary transition-colors"
                    >
                      Company
                      <SortIcon field="company" />
                    </button>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <button
                      onClick={() => toggleSort('totalMessageCount')}
                      className="flex items-center gap-2 font-medium hover:text-primary transition-colors"
                    >
                      Messages
                      <SortIcon field="totalMessageCount" />
                    </button>
                  </TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead className="text-right w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.length > 0 ? (
                  filteredContacts.map((contact) => (
                    <React.Fragment key={contact.id}>
                      <TableRow
                        className={cn(
                          "cursor-pointer transition-colors",
                          expandedRow === contact.id && "bg-slate-50"
                        )}
                        onClick={() => setExpandedRow(expandedRow === contact.id ? null : contact.id)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border border-slate-200">
                              <AvatarFallback className="bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 text-sm font-medium">
                                {getInitials(contact.name || '?')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900 truncate">{contact.name}</p>
                              <p className="text-xs text-slate-500 truncate">{contact.phone}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {contact.company ? (
                            <div className="flex items-center gap-2">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-slate-700">{contact.company}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn("font-normal", getStatusColor(contact.status || 'active'))}
                          >
                            {contact.status === 'active' ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-slate-700">{contact.totalMessageCount || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getPersonaStage(contact) ? (
                            <div className="flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                              <span className="text-sm text-slate-700">{getPersonaStage(contact)}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditClick(contact); }}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Contact
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => { e.stopPropagation(); handleDeleteClick(contact); }}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Row Details */}
                      {expandedRow === contact.id && (
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                          <TableCell colSpan={6} className="p-0">
                            <div className="px-6 py-4 border-t border-slate-100">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Contact Info */}
                                <div className="space-y-3">
                                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact Info</h4>
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                      <Phone className="w-4 h-4 text-slate-400" />
                                      <span className="text-slate-700">{contact.phone}</span>
                                    </div>
                                    {contact.email && (
                                      <div className="flex items-center gap-2 text-sm">
                                        <Mail className="w-4 h-4 text-slate-400" />
                                        <span className="text-slate-700">{contact.email}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Business Info */}
                                <div className="space-y-3">
                                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Business Info</h4>
                                  <div className="space-y-2 text-sm">
                                    {contact.category && (
                                      <div className="flex items-center justify-between">
                                        <span className="text-slate-500">Category</span>
                                        <span className="text-slate-700">{contact.category}</span>
                                      </div>
                                    )}
                                    {contact.lifetimeValue && (
                                      <div className="flex items-center justify-between">
                                        <span className="text-slate-500">Value</span>
                                        <span className="text-slate-700 font-medium">{contact.lifetimeValue}</span>
                                      </div>
                                    )}
                                    {contact.groups && contact.groups.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {contact.groups.map(group => (
                                          <Badge key={group} variant="secondary" className="text-xs">
                                            {group}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* AI Persona Preview */}
                                <div className="space-y-3">
                                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                                    AI Persona
                                  </h4>
                                  {contact.persona?.summary ? (
                                    <p className="text-sm text-slate-600 line-clamp-3">{contact.persona.summary}</p>
                                  ) : (
                                    <p className="text-sm text-slate-400 italic">
                                      {(contact.totalMessageCount || 0) < 5
                                        ? `Need ${5 - (contact.totalMessageCount || 0)} more messages to generate`
                                        : 'Click Edit to generate persona'}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Notes */}
                              {contact.notes && (
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Notes</h4>
                                  <p className="text-sm text-slate-600">{contact.notes}</p>
                                </div>
                              )}

                              <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => { e.stopPropagation(); handleEditClick(contact); }}
                                  className="gap-2"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                  Edit Full Profile
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center p-12">
                      <div className="flex flex-col items-center">
                        <div className="p-4 rounded-full bg-slate-100 mb-4">
                          <Users className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="font-semibold text-slate-900">No contacts found</h3>
                        <p className="text-sm text-slate-500 mt-1 max-w-sm">
                          {contacts.length === 0
                            ? "Your contact list is empty. Add your first contact to get started."
                            : "No contacts match your current filters. Try adjusting your search."}
                        </p>
                        {contacts.length === 0 && (
                          <Button onClick={() => setIsAddModalOpen(true)} className="mt-4 gap-2">
                            <Plus className="w-4 h-4" />
                            Add Your First Contact
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        )}
      </main>

      {/* Modals */}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => !open && setDeleteConfirm({ open: false, contact: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteConfirm.contact?.name}</strong>? This action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
