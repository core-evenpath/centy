// src/components/partner/team/TeamManagement.tsx
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  UserPlus,
  Search,
  Users,
  Phone,
  Mail,
  Clock,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  Trash2,
  MoreVertical,
  Calendar,
  Shield,
  QrCode,
  CheckSquare,
  ArrowLeft,
  User
} from "lucide-react";
import type { TeamMember } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { removeTeamMemberAction } from "@/actions/team-actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import GenerateInviteCodeDialog from "./GenerateInviteCodeDialog";
import InvitationManagement from "./InvitationManagement";
import TaskAssignmentModal from "@/components/chat/TaskAssignmentModal";

interface TeamManagementProps {
  roleToShow: 'employee' | 'partner_admin';
}

// Loading skeleton for the member list
function MemberListSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Member detail skeleton
function MemberDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    </div>
  );
}

// Info item for member details
function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
      <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

export default function TeamManagement({ roleToShow }: TeamManagementProps) {
  const { user, loading: authLoading } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [inviteRefreshTrigger, setInviteRefreshTrigger] = useState(0);
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const { toast } = useToast();

  const partnerId = user?.customClaims?.partnerId;
  const userRole = user?.customClaims?.role;

  const filteredMembers = useMemo(() => {
    return teamMembers.filter(member => {
      const matchesRole = member.role === roleToShow;
      const matchesSearch = !searchTerm ||
        member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesRole && matchesSearch;
    });
  }, [teamMembers, searchTerm, roleToShow]);

  useEffect(() => {
    if (authLoading) {
      setIsLoading(true);
      return;
    }

    if (!partnerId || !db) {
      setFirestoreError("Could not identify your organization. Please ensure you are logged in correctly.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setFirestoreError(null);

    const teamMembersRef = collection(db, "teamMembers");
    const q = query(teamMembersRef, where("partnerId", "==", partnerId));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const membersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : null,
        lastActive: doc.data().lastActive?.toDate ? doc.data().lastActive.toDate() : null
      } as TeamMember));

      setTeamMembers(membersData);
      setFirestoreError(null);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching team members:", error);
      setFirestoreError(`Access denied: ${error.message}`);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [partnerId, authLoading]);

  const handleSelectMember = (member: TeamMember) => {
    setSelectedMember(member);
    setShowMobileDetail(true);
  };

  const handleBackToList = () => {
    setShowMobileDetail(false);
  };

  const handleRemoveMember = async (memberToRemove: TeamMember) => {
    if (!memberToRemove || !partnerId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Cannot remove member: missing context.",
      });
      return;
    }

    if (window.confirm(`Are you sure you want to remove ${memberToRemove.name}? This will revoke their workspace access.`)) {
      const result = await removeTeamMemberAction({ partnerId, userIdToRemove: memberToRemove.id });
      if (result.success) {
        toast({ title: "Member Removed", description: result.message });
        if (selectedMember?.id === memberToRemove.id) {
          setSelectedMember(null);
          setShowMobileDetail(false);
        }
      } else {
        toast({ variant: "destructive", title: "Error", description: result.message });
      }
    }
  };

  const handleInviteGenerated = () => {
    setInviteRefreshTrigger(prev => prev + 1);
  };

  const handleTaskAssigned = (taskData: any) => {
    toast({
      title: "Task Assigned",
      description: `Task "${taskData.title}" has been assigned.`
    });
    setIsTaskModalOpen(false);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { className: string; label: string }> = {
      active: { className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", label: "Active" },
      invited: { className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", label: "Invited" },
      suspended: { className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", label: "Suspended" },
    };
    const { className, label } = config[status] || { className: "bg-gray-100 text-gray-700", label: status };
    return <Badge variant="secondary" className={className}>{label}</Badge>;
  };

  const getRoleBadge = (role: string) => {
    return role === 'partner_admin'
      ? <Badge variant="default">Admin</Badge>
      : <Badge variant="outline">Team Member</Badge>;
  };

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const pageConfig = {
    employee: {
      title: "Team Members",
      description: "Manage your team members and their access permissions.",
      emptyText: "team members",
      icon: Users,
    },
    partner_admin: {
      title: "Administrators",
      description: "Manage users with administrative access to this workspace.",
      emptyText: "administrators",
      icon: Shield,
    },
  };

  const config = pageConfig[roleToShow];

  // Error state
  if (firestoreError) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center py-8">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold text-destructive mb-2">Connection Error</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">{firestoreError}</p>
            <Button onClick={() => window.location.reload()} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Member list component
  const MemberList = () => (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={`Search ${config.emptyText}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* List */}
      <ScrollArea className="h-[400px] lg:h-[500px]">
        {isLoading ? (
          <MemberListSkeleton />
        ) : filteredMembers.length > 0 ? (
          <div className="space-y-2 pr-4">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                onClick={() => handleSelectMember(member)}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all
                  ${selectedMember?.id === member.id
                    ? 'bg-primary/10 border border-primary/30'
                    : 'hover:bg-muted/50 border border-transparent'
                  }`}
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground text-sm font-semibold">
                    {member.name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">{member.name}</h4>
                  <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(member.status)}
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <User className="w-6 h-6 text-muted-foreground" />
            </div>
            <h4 className="font-medium mb-1">No {config.emptyText} found</h4>
            <p className="text-sm text-muted-foreground mb-4">
              {searchTerm ? 'Try a different search term' : `Invite ${config.emptyText} to get started`}
            </p>
            {userRole === 'partner_admin' && !searchTerm && (
              <Button onClick={() => setIsInviteDialogOpen(true)} size="sm">
                <UserPlus className="w-4 h-4 mr-2" />
                Generate Invite
              </Button>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  // Member detail component
  const MemberDetail = () => {
    if (!selectedMember) {
      return (
        <div className="flex flex-col items-center justify-center h-full py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <h3 className="font-semibold text-lg mb-2">Select a Member</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Choose someone from the list to view their details and manage their access.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Mobile back button */}
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden -ml-2 mb-2"
          onClick={handleBackToList}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to list
        </Button>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground text-xl font-bold">
                {selectedMember.name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-bold">{selectedMember.name}</h3>
              <div className="flex items-center gap-2 mt-1.5">
                {getRoleBadge(selectedMember.role)}
                {getStatusBadge(selectedMember.status)}
              </div>
            </div>
          </div>

          {userRole === 'partner_admin' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setIsTaskModalOpen(true)}>
                  <CheckSquare className="mr-2 h-4 w-4" />
                  Assign Task
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Shield className="mr-2 h-4 w-4" />
                  Edit Permissions
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                  onClick={() => handleRemoveMember(selectedMember)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove Member
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Contact Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoItem icon={Mail} label="Email" value={selectedMember.email || 'Not provided'} />
          <InfoItem icon={Phone} label="Phone" value={selectedMember.phone || 'Not provided'} />
          <InfoItem icon={Clock} label="Last Active" value={formatDate(selectedMember.lastActive)} />
          <InfoItem icon={Calendar} label="Joined" value={formatDate(selectedMember.joinedDate)} />
        </div>
      </div>
    );
  };

  return (
    <>
      <Tabs defaultValue="members" className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <TabsList>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <config.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{config.title}</span>
              <Badge variant="secondary" className="ml-1">{filteredMembers.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="invitations" className="flex items-center gap-2">
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">Invitations</span>
            </TabsTrigger>
          </TabsList>

          {userRole === 'partner_admin' && (
            <Button onClick={() => setIsInviteDialogOpen(true)} size="sm">
              <UserPlus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Generate Invite</span>
              <span className="sm:hidden">Invite</span>
            </Button>
          )}
        </div>

        {/* Members Tab */}
        <TabsContent value="members" className="mt-0">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">{config.title}</CardTitle>
              <CardDescription>{config.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Desktop: Side-by-side layout */}
              <div className="hidden lg:grid lg:grid-cols-5 lg:gap-6">
                <div className="lg:col-span-2 lg:border-r lg:pr-6">
                  <MemberList />
                </div>
                <div className="lg:col-span-3">
                  {isLoading ? <MemberDetailSkeleton /> : <MemberDetail />}
                </div>
              </div>

              {/* Mobile: Conditional rendering */}
              <div className="lg:hidden">
                {!showMobileDetail ? (
                  <MemberList />
                ) : (
                  <MemberDetail />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invitations Tab */}
        <TabsContent value="invitations" className="mt-0">
          <InvitationManagement
            partnerId={partnerId!}
            refreshTrigger={inviteRefreshTrigger}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {partnerId && (
        <GenerateInviteCodeDialog
          isOpen={isInviteDialogOpen}
          onClose={() => setIsInviteDialogOpen(false)}
          partnerId={partnerId}
          onInviteGenerated={handleInviteGenerated}
        />
      )}

      {user?.customClaims && teamMembers && (
        <TaskAssignmentModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          onTaskAssigned={handleTaskAssigned}
          activeWorkspace={user.customClaims}
          teamMembers={teamMembers}
        />
      )}
    </>
  );
}
