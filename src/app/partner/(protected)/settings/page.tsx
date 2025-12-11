// src/app/partner/(protected)/settings/page.tsx
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Building2,
  Users,
  Shield,
  Mail,
  Calendar,
  ChevronRight,
  UserCircle,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface QuickLinkCardProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
}

function QuickLinkCard({ href, icon, title, description, badge }: QuickLinkCardProps) {
  return (
    <Link href={href} className="block group">
      <Card className="h-full transition-all hover:shadow-md hover:border-primary/50 cursor-pointer">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                {icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-base">{title}</h3>
                  {badge && (
                    <Badge variant="secondary" className="text-xs">
                      {badge}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [teamCount, setTeamCount] = useState<number>(0);
  const [adminCount, setAdminCount] = useState<number>(0);
  const [loadingStats, setLoadingStats] = useState(true);

  const partnerId = user?.customClaims?.partnerId;
  const userRole = user?.customClaims?.role;

  useEffect(() => {
    async function fetchTeamStats() {
      if (!partnerId || !db) {
        setLoadingStats(false);
        return;
      }

      try {
        const teamMembersRef = collection(db, "teamMembers");
        const q = query(teamMembersRef, where("partnerId", "==", partnerId));
        const snapshot = await getDocs(q);

        let employees = 0;
        let admins = 0;

        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.role === 'partner_admin') {
            admins++;
          } else if (data.role === 'employee') {
            employees++;
          }
        });

        setTeamCount(employees);
        setAdminCount(admins);
      } catch (error) {
        console.error('Error fetching team stats:', error);
      } finally {
        setLoadingStats(false);
      }
    }

    if (!authLoading) {
      fetchTeamStats();
    }
  }, [partnerId, authLoading]);

  if (authLoading) {
    return <LoadingSkeleton />;
  }

  if (!partnerId) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <UserCircle className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Not Logged In</h3>
          <p className="text-muted-foreground mb-4">
            Please log in to access your settings.
          </p>
          <Button asChild>
            <Link href="/partner/login">Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const userInitial = user?.displayName?.charAt(0)?.toUpperCase() ||
                      user?.email?.charAt(0)?.toUpperCase() ||
                      'U';

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Account Overview Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Account Overview</CardTitle>
          <CardDescription>Your account information and workspace details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            {/* Avatar & Name */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-primary/20">
                <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || 'User'} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                  {userInitial}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold">
                  {user?.displayName || 'Workspace User'}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={userRole === 'partner_admin' ? 'default' : 'secondary'}>
                    {userRole === 'partner_admin' ? 'Administrator' : 'Team Member'}
                  </Badge>
                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                </div>
              </div>
            </div>

            {/* Account Details */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-4 sm:pt-0 sm:pl-6 border-t sm:border-t-0 sm:border-l">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium truncate">{user?.email || 'Not set'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Member Since</p>
                  <p className="text-sm font-medium">
                    {formatDate(user?.metadata?.creationTime)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Last Sign In</p>
                  <p className="text-sm font-medium">
                    {formatDate(user?.metadata?.lastSignInTime)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Workspace ID</p>
                  <p className="text-sm font-medium font-mono text-xs">
                    {partnerId?.substring(0, 12)}...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Manage Workspace</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <QuickLinkCard
            href="/partner/settings/dashboard"
            icon={<Building2 className="w-5 h-5" />}
            title="Organization"
            description="View and edit your business profile and details"
          />
          <QuickLinkCard
            href="/partner/settings/employees"
            icon={<Users className="w-5 h-5" />}
            title="Team Members"
            description="Manage your team and invite new members"
            badge={loadingStats ? '...' : `${teamCount} members`}
          />
          <QuickLinkCard
            href="/partner/settings/admins"
            icon={<Shield className="w-5 h-5" />}
            title="Administrators"
            description="Manage admin access and permissions"
            badge={loadingStats ? '...' : `${adminCount} admins`}
          />
        </div>
      </div>

      {/* Workspace Stats */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Workspace Summary</CardTitle>
          <CardDescription>Quick overview of your workspace activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20">
              <div className="text-2xl font-bold text-blue-600">
                {loadingStats ? '...' : teamCount + adminCount}
              </div>
              <div className="text-sm text-muted-foreground">Total Users</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
              <div className="text-2xl font-bold text-green-600">
                {loadingStats ? '...' : adminCount}
              </div>
              <div className="text-sm text-muted-foreground">Admins</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20">
              <div className="text-2xl font-bold text-purple-600">
                {loadingStats ? '...' : teamCount}
              </div>
              <div className="text-sm text-muted-foreground">Team Members</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-orange-50 dark:bg-orange-950/20">
              <div className="text-2xl font-bold text-orange-600">Active</div>
              <div className="text-sm text-muted-foreground">Status</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
