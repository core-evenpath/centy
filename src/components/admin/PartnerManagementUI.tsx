
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import type { Partner, AdminPartnerStats } from '../../lib/types';
import { UserPlus, Search, ListFilter, AlertTriangle, Edit, MessageCircle, Send, MoreVertical, Copy, ExternalLink } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import AddPartnerModal from "./AddPartnerModal";
import EditPartnerModal from "./EditPartnerModal";
import PartnerDetailView from "./PartnerDetailView";
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { createTenant } from '../../ai/flows/create-tenant-flow';
import { createUserInTenant } from '../../ai/flows/user-management-flow';
import { useToast } from "../../hooks/use-toast";
import { updatePartner } from '../../ai/flows/update-partner-flow';
import { deletePartner } from '../../ai/flows/delete-partner-flow';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, query } from "firebase/firestore";
import { getTenantForEmailAction } from '../../actions/auth-actions';
import { getAdminPartnerStatsAction } from '../../actions/admin-partner-actions';

interface PartnerManagementUIProps {
    initialPartners: Partner[];
    error?: string | null;
}

const PartnerCard = ({ partner, isSelected, onSelect }: { partner: Partner, isSelected: boolean, onSelect: () => void }) => {
    const whatsappConnected = (partner as any).metaWhatsAppConfig?.status === 'active';
    const telegramConnected = partner.telegramConfig?.isConnected === true;
    const showBusinessName = partner.businessName && partner.businessName !== partner.name;

    return (
        <div
            onClick={onSelect}
            className={`p-4 rounded-lg cursor-pointer transition-colors border ${isSelected ? 'bg-secondary border-primary' : 'hover:bg-secondary/50'}`}
        >
            <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{partner.name}</p>
                    {showBusinessName && (
                        <p className="text-xs text-muted-foreground truncate">{partner.businessName}</p>
                    )}
                    <p className="text-sm text-muted-foreground truncate">{partner.email}</p>
                </div>
                <Badge variant={partner.status === 'active' ? 'success' : 'warning'}>{partner.status}</Badge>
            </div>
            <div className="flex items-center justify-between mt-2">
                <div>
                    {partner.industry?.name && (
                        <Badge variant="secondary" className="text-xs">{partner.industry.name}</Badge>
                    )}
                </div>
                <div className="flex items-center gap-1.5">
                    <MessageCircle className={`w-3.5 h-3.5 ${whatsappConnected ? 'text-green-500' : 'text-muted-foreground/30'}`} />
                    <Send className={`w-3.5 h-3.5 ${telegramConnected ? 'text-blue-500' : 'text-muted-foreground/30'}`} />
                </div>
            </div>
        </div>
    );
};


export default function PartnerManagementUI({ initialPartners = [], error = null }: PartnerManagementUIProps) {
    const [partners, setPartners] = useState<Partner[]>(initialPartners);
    const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [dbError, setDbError] = useState<string | null>(error);
    const [partnerStats, setPartnerStats] = useState<AdminPartnerStats | null>(null);
    const [statsLoading, setStatsLoading] = useState(false);

    useEffect(() => {
        if (!selectedPartner?.id) {
            setPartnerStats(null);
            return;
        }

        setStatsLoading(true);
        getAdminPartnerStatsAction(selectedPartner.id)
            .then(result => {
                if (result.success && result.data) {
                    setPartnerStats(result.data);
                } else {
                    setPartnerStats(null);
                }
            })
            .catch(() => setPartnerStats(null))
            .finally(() => setStatsLoading(false));
    }, [selectedPartner?.id]);

    // Set up a real-time listener for the partners collection
    useEffect(() => {
        setIsLoading(true);
        if (!db) {
            console.error("Firestore not initialized");
            setDbError("Firestore not initialized. Check Firebase configuration.");
            setIsLoading(false);
            return;
        }
        const q = query(collection(db, "partners"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const partnersData = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // Convert timestamps to strings if they exist
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
                    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
                    joinedDate: data.joinedDate?.toDate ? data.joinedDate.toDate().toISOString() : data.joinedDate,
                } as Partner;
            });

            // Sort partners client-side
            partnersData.sort((a, b) => a.name.localeCompare(b.name));

            setPartners(partnersData);
            setDbError(null);

            if (!selectedPartner && partnersData.length > 0) {
                setSelectedPartner(partnersData[0]);
            } else if (selectedPartner) {
                // Refresh selected partner data if it has been updated
                const updatedSelected = partnersData.find(p => p.id === selectedPartner.id);
                setSelectedPartner(updatedSelected || null);
            }

            setIsLoading(false);
        }, (err) => {
            console.error("Error fetching partners:", err);
            const errorMessage = "Failed to fetch partners. This could be due to missing Firestore permissions. Please check the diagnostics page.";
            setDbError(errorMessage);
            toast({
                variant: "destructive",
                title: "Error Fetching Partners",
                description: errorMessage,
            });
            setIsLoading(false);
        });

        // Cleanup the listener on component unmount
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!selectedPartner && partners.length > 0) {
            setSelectedPartner(partners[0]);
        }
    }, [partners, selectedPartner]);

    // Filter partners based on search query and status
    const filteredPartners = useMemo(() => partners.filter(partner => {
        const matchesSearch = partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (partner.businessName && partner.businessName.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            partner.email.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = filterStatus === 'all' || partner.status === filterStatus;

        return matchesSearch && matchesStatus;
    }), [partners, searchQuery, filterStatus]);

    if (dbError) {
        return (
            <div className="flex items-center justify-center h-full p-6">
                <Card className="w-full max-w-md border-destructive">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <AlertTriangle className="w-8 h-8 text-destructive" />
                            <div>
                                <h3 className="text-lg font-bold text-destructive">Error Fetching Data</h3>
                                <p className="text-muted-foreground">{dbError}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const handleAddPartner = async (newPartnerData: { name: string; email: string; }) => {
        console.log("Adding new partner:", newPartnerData.name);
        try {
            const existingUserCheck = await getTenantForEmailAction(newPartnerData.email);
            if (existingUserCheck.success) {
                throw new Error("An account with this email already exists. Please use a different email.");
            }

            const tenantResult = await createTenant({
                partnerName: newPartnerData.name,
                email: newPartnerData.email
            });

            if (!tenantResult.success || !tenantResult.tenantId || !tenantResult.partnerId) {
                throw new Error(tenantResult.message || 'Failed to create workspace.');
            }

            const userResult = await createUserInTenant({
                email: newPartnerData.email,
                password: Math.random().toString(36).slice(-8),
                tenantId: tenantResult.tenantId,
                displayName: newPartnerData.name,
                partnerId: tenantResult.partnerId,
                role: 'partner_admin',
            });

            if (!userResult.success) {
                throw new Error(userResult.message || 'Workspace created, but failed to create admin user.');
            }

            toast({
                title: "Partner Created Successfully",
                description: `${newPartnerData.name} is set up.`,
            });
             setIsAddModalOpen(false);
        } catch (e) {
            console.error("Error creating partner:", e);
            const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
            toast({
                variant: "destructive",
                title: "Error",
                description: `Could not create partner: ${errorMessage}`,
            });
        }
    };

    const handleUpdatePartner = async (updatedPartner: Partner) => {
        try {
            const result = await updatePartner(JSON.stringify(updatedPartner));
            if (result.success) {
                toast({
                    title: "Partner Updated",
                    description: result.message
                });
                setIsEditModalOpen(false);
            } else {
                toast({
                    variant: "destructive",
                    title: "Update Failed",
                    description: result.message
                });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({
                variant: "destructive",
                title: "Update Error",
                description: errorMessage
            });
        }
    };

    const handleDeletePartner = async (partnerId: string, tenantId: string) => {
        try {
            const result = await deletePartner({ partnerId, tenantId });
            if (result.success) {
                toast({
                    title: "Partner Deleted",
                    description: result.message,
                });
                setIsEditModalOpen(false);
                setSelectedPartner(null);
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
             const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            toast({
                variant: "destructive",
                title: "Deletion Failed",
                description: errorMessage,
            });
        }
    };

    const handleStatusFilterChange = (status: string) => {
        setFilterStatus(status);
    };

    const getStatusCounts = () => {
        return {
            all: partners.length,
            active: partners.filter(p => p.status === 'active').length,
            pending: partners.filter(p => p.status === 'pending').length,
            suspended: partners.filter(p => p.status === 'suspended').length,
        };
    };

    const statusCounts = getStatusCounts();

    return (
        <>
            <div className="h-full flex flex-col">
                <div className="flex-1 flex overflow-hidden">
                    {/* Partner List */}
                    <div className="w-1/3 border-r overflow-y-auto">
                        <div className="p-4 border-b sticky top-0 bg-card z-10">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold">
                                    Partners ({partners.length})
                                </h2>
                                <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Create
                                </Button>
                            </div>

                            {/* Search Input */}
                            <div className="flex items-center gap-2 mb-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search partners..."
                                        className="pl-8"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <Button variant="outline" size="icon" className="w-9 h-9">
                                    <ListFilter className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Status Filter Tabs */}
                            <div className="flex gap-1">
                                {[
                                    { key: 'all', label: 'All', count: statusCounts.all },
                                    { key: 'active', label: 'Active', count: statusCounts.active },
                                    { key: 'pending', label: 'Pending', count: statusCounts.pending },
                                    { key: 'suspended', label: 'Suspended', count: statusCounts.suspended },
                                ].map(({ key, label, count }) => (
                                    <button
                                        key={key}
                                        onClick={() => handleStatusFilterChange(key)}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                            filterStatus === key
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                        }`}
                                    >
                                        {label} ({count})
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Partner List */}
                        <div className="p-4 space-y-2">
                            {isLoading ? (
                                <p className="text-center text-muted-foreground p-4">Loading partners...</p>
                            ) : filteredPartners.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>No partners found matching your criteria.</p>
                                </div>
                            ) : (
                                filteredPartners.map(partner => (
                                    <PartnerCard
                                        key={partner.id}
                                        partner={partner}
                                        isSelected={selectedPartner?.id === partner.id}
                                        onSelect={() => setSelectedPartner(partner)}
                                    />
                                ))
                            )}
                        </div>
                    </div>

                    {/* Partner Detail View */}
                    <div className="w-2/3 overflow-y-auto p-6">
                        {selectedPartner ? (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                     <h2 className="text-xl font-semibold">Partner Details</h2>
                                     <div className="flex items-center gap-2">
                                         <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
                                             <Edit className="w-4 h-4 mr-2" />
                                             Edit Partner
                                         </Button>
                                         <DropdownMenu>
                                             <DropdownMenuTrigger asChild>
                                                 <Button variant="outline" size="icon">
                                                     <MoreVertical className="w-4 h-4" />
                                                 </Button>
                                             </DropdownMenuTrigger>
                                             <DropdownMenuContent align="end">
                                                 <DropdownMenuItem onClick={() => {
                                                     navigator.clipboard.writeText(selectedPartner.id);
                                                     toast({ title: "Partner ID copied" });
                                                 }}>
                                                     <Copy className="w-4 h-4 mr-2" />
                                                     Copy Partner ID
                                                 </DropdownMenuItem>
                                                 {selectedPartner.tenantId && (
                                                     <DropdownMenuItem onClick={() => {
                                                         navigator.clipboard.writeText(selectedPartner.tenantId!);
                                                         toast({ title: "Tenant ID copied" });
                                                     }}>
                                                         <Copy className="w-4 h-4 mr-2" />
                                                         Copy Tenant ID
                                                     </DropdownMenuItem>
                                                 )}
                                                 <DropdownMenuSeparator />
                                                 <DropdownMenuItem onClick={() => {
                                                     window.open(`https://console.firebase.google.com/project/_/firestore/data/partners/${selectedPartner.id}`, '_blank');
                                                 }}>
                                                     <ExternalLink className="w-4 h-4 mr-2" />
                                                     Open in Firebase
                                                 </DropdownMenuItem>
                                             </DropdownMenuContent>
                                         </DropdownMenu>
                                     </div>
                                </div>
                                <PartnerDetailView
                                    partner={selectedPartner}
                                    stats={partnerStats}
                                    statsLoading={statsLoading}
                                />
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center text-muted-foreground">
                                    <UserPlus className="w-12 h-12 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No Partner Selected</h3>
                                    <p>Select a partner from the list to view details.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <AddPartnerModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleAddPartner}
            />

            {selectedPartner && (
                 <EditPartnerModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    partner={selectedPartner}
                    onSave={handleUpdatePartner}
                    onDelete={handleDeletePartner}
                />
            )}
        </>
    );
}
