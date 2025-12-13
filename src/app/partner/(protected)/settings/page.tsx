// src/app/partner/(protected)/settings/page.tsx
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import {
  Building2,
  Users,
  Shield,
  Mail,
  Calendar,
  ChevronRight,
  UserCircle,
  Clock,
  CheckCircle,
  Database,
  ArrowRight,
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getPartnerProfileAction } from '@/actions/get-partner-profile';
import type { Partner } from '@/lib/types';

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-slate-200 animate-pulse" />
          <div className="space-y-2">
            <div className="h-5 w-48 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-24 bg-slate-200 rounded-lg animate-pulse" />
        <div className="h-24 bg-slate-200 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [teamCount, setTeamCount] = useState<number>(0);
  const [adminCount, setAdminCount] = useState<number>(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [partner, setPartner] = useState<Partner | null>(null);

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

  useEffect(() => {
    async function fetchPartnerProfile() {
      if (!partnerId) return;

      try {
        const result = await getPartnerProfileAction(partnerId);
        if (result.success && result.partner) {
          setPartner(result.partner);
        }
      } catch (error) {
        console.error('Error fetching partner profile:', error);
      }
    }

    if (!authLoading && partnerId) {
      fetchPartnerProfile();
    }
  }, [partnerId, authLoading]);

  if (authLoading) {
    return <LoadingSkeleton />;
  }

  if (!partnerId) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
        <UserCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Not Logged In</h3>
        <p className="text-slate-500 mb-4">
          Please log in to access your settings.
        </p>
        <Link
          href="/partner/login"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const businessInitial = partner?.businessName?.charAt(0)?.toUpperCase() ||
                          user?.displayName?.charAt(0)?.toUpperCase() ||
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
      {/* Business Data CTA - Priority */}
      <Link href="/partner/settings/dashboard" className="block group">
        <div className="bg-slate-900 rounded-lg p-5 text-white hover:bg-slate-800 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-semibold text-lg">Business Data</h2>
                <p className="text-slate-300 text-sm">
                  Configure the data that powers your AI agents
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-300 group-hover:text-white transition-colors">
              <span className="text-sm font-medium hidden sm:inline">Configure</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </Link>

      {/* Account Overview */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Account Overview</h2>
          <p className="text-sm text-slate-500">Your profile and workspace details</p>
        </div>
        <div className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            {/* Avatar & Name */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 text-xl font-semibold">
                {businessInitial}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {partner?.businessName || 'Workspace User'}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded font-medium",
                    userRole === 'partner_admin'
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600"
                  )}>
                    {userRole === 'partner_admin' ? 'Administrator' : 'Team Member'}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Active
                  </span>
                </div>
              </div>
            </div>

            {/* Account Details */}
            <div className="flex-1 grid grid-cols-2 gap-4 pt-4 sm:pt-0 sm:pl-6 border-t sm:border-t-0 sm:border-l border-slate-100">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-400" />
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Email</p>
                  <p className="text-sm font-medium text-slate-900 truncate">{user?.email || 'Not set'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Member Since</p>
                  <p className="text-sm font-medium text-slate-900">
                    {formatDate(user?.metadata?.creationTime)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Last Sign In</p>
                  <p className="text-sm font-medium text-slate-900">
                    {formatDate(user?.metadata?.lastSignInTime)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Workspace ID</p>
                  <p className="text-sm font-medium text-slate-900 font-mono">
                    {partnerId?.substring(0, 12)}...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Management */}
      <div>
        <h3 className="text-sm font-medium text-slate-700 mb-3">Team Management</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <Link href="/partner/settings/employees" className="group">
            <div className="bg-white rounded-lg border border-slate-200 p-4 hover:border-slate-300 hover:shadow-sm transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                    <Users className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900">Team Members</h4>
                    <p className="text-sm text-slate-500">
                      {loadingStats ? '...' : `${teamCount} members`}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
              </div>
            </div>
          </Link>
          <Link href="/partner/settings/admins" className="group">
            <div className="bg-white rounded-lg border border-slate-200 p-4 hover:border-slate-300 hover:shadow-sm transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                    <Shield className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900">Administrators</h4>
                    <p className="text-sm text-slate-500">
                      {loadingStats ? '...' : `${adminCount} admins`}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
