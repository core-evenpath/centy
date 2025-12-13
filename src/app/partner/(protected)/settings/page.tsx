// src/app/partner/(protected)/settings/page.tsx
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
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
  Bot,
  Sparkles,
  Database,
  Settings,
  ArrowRight,
  ExternalLink,
  Phone,
  MapPin,
  Package,
  HelpCircle,
  Briefcase,
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getPartnerProfileAction } from '@/actions/get-partner-profile';
import { getBusinessPersonaAction } from '@/actions/business-persona-actions';
import { cn } from '@/lib/utils';
import type { Partner } from '@/lib/types';
import type { BusinessPersona, SetupProgress } from '@/lib/business-persona-types';

function LoadingSkeleton() {
  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex-1 overflow-auto p-6 space-y-6 max-w-5xl mx-auto w-full">
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
        <div className="grid md:grid-cols-2 gap-4">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>
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
  const [businessPersona, setBusinessPersona] = useState<BusinessPersona | null>(null);
  const [setupProgress, setSetupProgress] = useState<SetupProgress | null>(null);
  const [loadingPersona, setLoadingPersona] = useState(true);

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

  useEffect(() => {
    async function fetchBusinessPersona() {
      if (!partnerId) return;
      setLoadingPersona(true);
      try {
        const result = await getBusinessPersonaAction(partnerId);
        if (result.success && result.persona) {
          setBusinessPersona(result.persona);
        }
        if (result.setupProgress) {
          setSetupProgress(result.setupProgress);
        }
      } catch (error) {
        console.error('Error fetching business persona:', error);
      } finally {
        setLoadingPersona(false);
      }
    }

    if (!authLoading && partnerId) {
      fetchBusinessPersona();
    }
  }, [partnerId, authLoading]);

  if (authLoading) {
    return <LoadingSkeleton />;
  }

  if (!partnerId) {
    return (
      <div className="h-full flex flex-col bg-slate-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <UserCircle className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Not Logged In</h3>
            <p className="text-slate-500 mb-4">Please log in to access your settings.</p>
            <Link
              href="/partner/login"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              Sign In
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const businessName = businessPersona?.identity?.name || partner?.businessName || 'Your Business';
  const businessInitial = businessName.charAt(0).toUpperCase();
  const hasBusinessProfile = businessPersona?.identity?.name && businessPersona?.identity?.name !== '';
  const completeness = setupProgress?.overallPercentage || 0;

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Manage your business data and workspace
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6 max-w-5xl mx-auto">

          {/* Business Data - Featured Section */}
          {!loadingPersona && (
            <div className={cn(
              "rounded-xl border-2 overflow-hidden",
              hasBusinessProfile
                ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700"
                : "bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 border-indigo-500"
            )}>
              <div className="p-6">
                <div className="flex items-start gap-5">
                  {/* Icon */}
                  <div className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg",
                    hasBusinessProfile ? "bg-white/10 ring-2 ring-white/20" : "bg-white/20 ring-2 ring-white/30"
                  )}>
                    <Database className="w-7 h-7 text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h2 className="text-xl font-semibold text-white">Business Data</h2>
                          <Badge className="bg-white/20 text-white border-0 text-xs">
                            Powers AI Agents
                          </Badge>
                        </div>
                        <p className="text-white/70 text-sm">
                          {hasBusinessProfile
                            ? `Configure the data that powers your AI agents for "${businessName}"`
                            : 'Set up your business profile to enable AI agent functionality'
                          }
                        </p>

                        {/* Business Info Preview */}
                        {hasBusinessProfile && (
                          <div className="flex flex-wrap gap-2 mt-4">
                            {businessPersona?.identity?.industry?.name && (
                              <span className="inline-flex items-center gap-1.5 text-xs bg-white/10 px-2.5 py-1 rounded-full text-white/80">
                                <Briefcase className="w-3 h-3" />
                                {businessPersona.identity.industry.name}
                              </span>
                            )}
                            {businessPersona?.identity?.phone && (
                              <span className="inline-flex items-center gap-1.5 text-xs bg-white/10 px-2.5 py-1 rounded-full text-white/80">
                                <Phone className="w-3 h-3" />
                                {businessPersona.identity.phone}
                              </span>
                            )}
                            {businessPersona?.identity?.email && (
                              <span className="inline-flex items-center gap-1.5 text-xs bg-white/10 px-2.5 py-1 rounded-full text-white/80">
                                <Mail className="w-3 h-3" />
                                {businessPersona.identity.email}
                              </span>
                            )}
                            {businessPersona?.identity?.address?.city && (
                              <span className="inline-flex items-center gap-1.5 text-xs bg-white/10 px-2.5 py-1 rounded-full text-white/80">
                                <MapPin className="w-3 h-3" />
                                {businessPersona.identity.address.city}
                              </span>
                            )}
                            {businessPersona?.knowledge?.productsOrServices && businessPersona.knowledge.productsOrServices.length > 0 && (
                              <span className="inline-flex items-center gap-1.5 text-xs bg-white/10 px-2.5 py-1 rounded-full text-white/80">
                                <Package className="w-3 h-3" />
                                {businessPersona.knowledge.productsOrServices.length} Products
                              </span>
                            )}
                            {businessPersona?.knowledge?.faqs && businessPersona.knowledge.faqs.length > 0 && (
                              <span className="inline-flex items-center gap-1.5 text-xs bg-white/10 px-2.5 py-1 rounded-full text-white/80">
                                <HelpCircle className="w-3 h-3" />
                                {businessPersona.knowledge.faqs.length} FAQs
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Progress & CTA */}
                      <div className="flex items-center gap-4 flex-shrink-0">
                        {/* Completeness Ring */}
                        <div className="hidden sm:flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
                          <div className="relative w-12 h-12">
                            <svg className="w-12 h-12 -rotate-90">
                              <circle
                                cx="24" cy="24" r="20"
                                fill="none"
                                stroke="rgba(255,255,255,0.2)"
                                strokeWidth="4"
                              />
                              <circle
                                cx="24" cy="24" r="20"
                                fill="none"
                                stroke="white"
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeDasharray={`${completeness * 1.257} 126`}
                              />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                              {completeness}%
                            </span>
                          </div>
                          <div className="text-sm">
                            <div className="font-medium text-white">Complete</div>
                            <div className="text-white/60 text-xs">
                              {completeness >= 80 ? 'Ready!' : 'Add more data'}
                            </div>
                          </div>
                        </div>

                        <Link
                          href="/partner/settings/dashboard"
                          className={cn(
                            "flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium transition-all",
                            hasBusinessProfile
                              ? "bg-white text-slate-900 hover:bg-slate-100"
                              : "bg-white text-indigo-600 hover:bg-indigo-50"
                          )}
                        >
                          {hasBusinessProfile ? (
                            <>
                              <Settings className="w-4 h-4" />
                              Manage Data
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              Get Started
                            </>
                          )}
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Assistant Highlight */}
              <div className={cn(
                "px-6 py-4 border-t",
                hasBusinessProfile ? "bg-white/5 border-white/10" : "bg-white/10 border-white/20"
              )}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">Business Data Assistant</span>
                      <Badge className="bg-white/20 text-white border-0 text-[10px]">
                        Powered by Centy
                      </Badge>
                    </div>
                    <p className="text-xs text-white/60 mt-0.5">
                      Chat with AI to update your business profile, add products, and configure your agents
                    </p>
                  </div>
                  <Link
                    href="/partner/settings/dashboard"
                    className="text-xs text-white/80 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    Open Assistant
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Loading state for business data */}
          {loadingPersona && (
            <Skeleton className="h-48 rounded-xl" />
          )}

          {/* Account Section */}
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-slate-700">Account</h2>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-5">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <Avatar className="h-14 w-14 border-2 border-slate-100">
                    <AvatarImage src={user?.photoURL || undefined} alt={businessName} />
                    <AvatarFallback className="bg-slate-100 text-slate-600 text-lg font-semibold">
                      {businessInitial}
                    </AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900">{businessName}</h3>
                    <p className="text-sm text-slate-500 truncate">{user?.email}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant={userRole === 'partner_admin' ? 'default' : 'secondary'} className="text-xs">
                        {userRole === 'partner_admin' ? 'Administrator' : 'Team Member'}
                      </Badge>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Joined {formatDate(user?.metadata?.creationTime)}
                      </span>
                    </div>
                  </div>

                  {/* Workspace ID */}
                  <div className="hidden sm:block text-right">
                    <p className="text-xs text-slate-400">Workspace ID</p>
                    <p className="text-xs font-mono text-slate-600">{partnerId?.substring(0, 12)}...</p>
                  </div>
                </div>
              </div>

              {/* Account Stats */}
              <div className="border-t border-slate-100 px-5 py-3 bg-slate-50/50">
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>Last sign in: {formatDate(user?.metadata?.lastSignInTime)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Team Management Section */}
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-slate-700">Team Management</h2>
            <div className="grid md:grid-cols-2 gap-3">
              {/* Team Members */}
              <Link
                href="/partner/settings/employees"
                className="group bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-slate-900">Team Members</h3>
                      <Badge variant="secondary" className="text-xs">
                        {loadingStats ? '...' : teamCount}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Manage your team and invite new members
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-400 transition-colors" />
                </div>
              </Link>

              {/* Administrators */}
              <Link
                href="/partner/settings/admins"
                className="group bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-100 transition-colors">
                    <Shield className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-slate-900">Administrators</h3>
                      <Badge variant="secondary" className="text-xs">
                        {loadingStats ? '...' : adminCount}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Manage admin access and permissions
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-400 transition-colors" />
                </div>
              </Link>
            </div>
          </div>

          {/* How Business Data Works */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-medium text-slate-900 mb-4">How Business Data Powers Your Agents</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-700 font-medium text-sm">
                  1
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Add Your Data</p>
                  <p className="text-xs text-slate-500 mt-0.5">Business info, products, FAQs, and more</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-700 font-medium text-sm">
                  2
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">AI Learns Your Business</p>
                  <p className="text-xs text-slate-500 mt-0.5">Agents understand your offerings and style</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-700 font-medium text-sm">
                  3
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Better Customer Responses</p>
                  <p className="text-xs text-slate-500 mt-0.5">Accurate, branded answers every time</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
