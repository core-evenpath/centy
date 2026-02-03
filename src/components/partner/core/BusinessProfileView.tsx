'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  Clock,
  MessageSquare,
  HelpCircle,
  FileText,
  Users,
  Shield,
  MessageCircle,
  Sparkles,
  ChevronRight,
  Edit3,
  Plus,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Bot,
  Download,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { toast } from 'sonner';

import { getBusinessPersonaAction } from '@/actions/business-persona-actions';
import type {
  BusinessPersona,
  SetupProgress,
} from '@/lib/business-persona-types';

import TestAIResponseModal from './TestAIResponseModal';

interface BusinessProfileViewProps {
  partnerId: string;
}

// Profile Section Component
interface ProfileSectionProps {
  title: string;
  icon: React.ReactNode;
  iconBg: string;
  children: React.ReactNode;
  editLink?: string;
  isEmpty?: boolean;
  emptyMessage?: string;
  emptyAction?: string;
}

function ProfileSection({
  title,
  icon,
  iconBg,
  children,
  editLink,
  isEmpty,
  emptyMessage,
  emptyAction,
}: ProfileSectionProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center`}>
            {icon}
          </div>
          <h3 className="font-semibold text-slate-900">{title}</h3>
        </div>
        {editLink && (
          <Link href={editLink}>
            <Button variant="ghost" size="sm" className="gap-1.5 text-slate-600 hover:text-slate-900">
              <Edit3 className="w-3.5 h-3.5" />
              Edit
            </Button>
          </Link>
        )}
      </div>
      <div className="p-5">
        {isEmpty ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm text-slate-500 mb-3">{emptyMessage || 'No data available'}</p>
            {editLink && (
              <Link href={editLink}>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  {emptyAction || 'Add this info'}
                </Button>
              </Link>
            )}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

// Field Display Component
interface FieldDisplayProps {
  icon?: React.ReactNode;
  label: string;
  value: string | React.ReactNode;
  className?: string;
}

function FieldDisplay({ icon, label, value, className = '' }: FieldDisplayProps) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      {icon && (
        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-500 mb-0.5">{label}</p>
        <p className="text-sm text-slate-900">{value || <span className="text-slate-400">Not set</span>}</p>
      </div>
    </div>
  );
}

export default function BusinessProfileView({ partnerId }: BusinessProfileViewProps) {
  const [persona, setPersona] = useState<BusinessPersona | null>(null);
  const [setupProgress, setSetupProgress] = useState<SetupProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  const loadPersona = async () => {
    setIsLoading(true);
    try {
      const result = await getBusinessPersonaAction(partnerId);
      if (result.success && result.persona) {
        setPersona(result.persona);
        setSetupProgress(result.setupProgress || null);
      } else {
        toast.error(result.message || 'Failed to load business profile');
      }
    } catch (error) {
      console.error('Error loading persona:', error);
      toast.error('Error loading business profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPersona();
  }, [partnerId]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!persona) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900">No Business Profile Found</h3>
          <p className="text-sm text-slate-500 mt-1 mb-4">
            Set up your business profile to help AI respond better to customers.
          </p>
          <Link href="/partner/settings?tab=profile">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Business Profile
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { identity, personality, customerProfile, knowledge } = persona;

  // Calculate content availability for empty states
  const hasFaqs = (knowledge?.faqs?.length ?? 0) > 0;
  const hasPolicies = !!(
    knowledge?.policies?.returnPolicy ||
    knowledge?.policies?.refundPolicy ||
    knowledge?.policies?.cancellationPolicy ||
    (knowledge?.policies?.customPolicies?.length ?? 0) > 0
  );
  const hasContactInfo = !!(identity?.phone || identity?.email || identity?.website);
  const hasAddress = !!(identity?.address?.city || identity?.address?.state);
  const hasOperatingHours = !!(
    identity?.operatingHours?.isOpen24x7 ||
    identity?.operatingHours?.appointmentOnly ||
    identity?.operatingHours?.schedule
  );

  // Format operating hours for display
  const formatOperatingHours = () => {
    if (!identity?.operatingHours) return 'Not set';
    if (identity.operatingHours.isOpen24x7) return 'Open 24/7';
    if (identity.operatingHours.appointmentOnly) return 'By appointment only';
    if (identity.operatingHours.onlineAlways) return 'Online services always available';
    if (identity.operatingHours.specialNote) return identity.operatingHours.specialNote;
    return 'Custom schedule';
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6 pb-20">
        {/* Header with Completeness */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white shadow-sm flex items-center justify-center">
                <Building2 className="w-7 h-7 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {identity?.name || 'Your Business'}
                </h2>
                {personality?.tagline && (
                  <p className="text-sm text-slate-600 mt-0.5">{personality.tagline}</p>
                )}
                {identity?.industry?.name && (
                  <Badge variant="secondary" className="mt-2">
                    {identity.industry.name}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-indigo-700">
                  {setupProgress?.overallPercentage ?? 0}% Complete
                </span>
                <CheckCircle2 className={`w-5 h-5 ${(setupProgress?.overallPercentage ?? 0) >= 80 ? 'text-emerald-500' : 'text-indigo-400'}`} />
              </div>
              <Progress value={setupProgress?.overallPercentage ?? 0} className="w-32 h-2" />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t border-indigo-100">
            <Button
              onClick={() => setIsTestModalOpen(true)}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700"
            >
              <Bot className="w-4 h-4" />
              Test AI Response
            </Button>
            <Link href="/partner/settings/import-center">
              <Button variant="outline" className="gap-2 bg-white">
                <Download className="w-4 h-4" />
                Import from Google/Website
              </Button>
            </Link>
            <Button variant="ghost" onClick={loadPersona} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Section 1: Identity */}
          <ProfileSection
            title="Business Identity"
            icon={<Building2 className="w-5 h-5 text-blue-600" />}
            iconBg="bg-blue-100"
            editLink="/partner/settings?tab=profile"
            isEmpty={!identity?.name && !personality?.description}
            emptyMessage="Add your business name and description"
            emptyAction="Add identity"
          >
            <div className="space-y-4">
              <FieldDisplay
                icon={<Building2 className="w-4 h-4 text-slate-500" />}
                label="Business Name"
                value={identity?.name}
              />
              {personality?.description && (
                <FieldDisplay
                  icon={<FileText className="w-4 h-4 text-slate-500" />}
                  label="Description"
                  value={
                    <span className="line-clamp-3">
                      {personality.description}
                    </span>
                  }
                />
              )}
              {personality?.foundedYear && (
                <FieldDisplay
                  icon={<Clock className="w-4 h-4 text-slate-500" />}
                  label="Founded"
                  value={`Established ${personality.foundedYear}`}
                />
              )}
              {personality?.uniqueSellingPoints && personality.uniqueSellingPoints.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-2">Unique Selling Points</p>
                  <div className="flex flex-wrap gap-1.5">
                    {personality.uniqueSellingPoints.slice(0, 5).map((usp, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {usp}
                      </Badge>
                    ))}
                    {personality.uniqueSellingPoints.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{personality.uniqueSellingPoints.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </ProfileSection>

          {/* Section 2: Contact & Location */}
          <ProfileSection
            title="Contact & Location"
            icon={<MapPin className="w-5 h-5 text-green-600" />}
            iconBg="bg-green-100"
            editLink="/partner/settings?tab=profile"
            isEmpty={!hasContactInfo && !hasAddress}
            emptyMessage="Add your contact information and location"
            emptyAction="Add contact info"
          >
            <div className="space-y-4">
              {identity?.phone && (
                <FieldDisplay
                  icon={<Phone className="w-4 h-4 text-slate-500" />}
                  label="Phone"
                  value={identity.phone}
                />
              )}
              {identity?.email && (
                <FieldDisplay
                  icon={<Mail className="w-4 h-4 text-slate-500" />}
                  label="Email"
                  value={identity.email}
                />
              )}
              {identity?.website && (
                <FieldDisplay
                  icon={<Globe className="w-4 h-4 text-slate-500" />}
                  label="Website"
                  value={
                    <a
                      href={identity.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      {identity.website.replace(/^https?:\/\//, '')}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  }
                />
              )}
              {identity?.whatsAppNumber && (
                <FieldDisplay
                  icon={<MessageCircle className="w-4 h-4 text-slate-500" />}
                  label="WhatsApp"
                  value={identity.whatsAppNumber}
                />
              )}
              {hasAddress && (
                <FieldDisplay
                  icon={<MapPin className="w-4 h-4 text-slate-500" />}
                  label="Address"
                  value={[
                    identity?.address?.street,
                    identity?.address?.area,
                    identity?.address?.city,
                    identity?.address?.state,
                    identity?.address?.postalCode,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                />
              )}
              <FieldDisplay
                icon={<Clock className="w-4 h-4 text-slate-500" />}
                label="Operating Hours"
                value={formatOperatingHours()}
              />
            </div>
          </ProfileSection>

          {/* Section 3: Knowledge Base Summary */}
          <ProfileSection
            title="Knowledge Base"
            icon={<HelpCircle className="w-5 h-5 text-amber-600" />}
            iconBg="bg-amber-100"
            editLink="/partner/settings?tab=profile"
            isEmpty={!hasFaqs && !hasPolicies}
            emptyMessage="Add FAQs and policies for better AI responses"
            emptyAction="Add knowledge"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <HelpCircle className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-slate-900">FAQs</span>
                </div>
                <p className="text-2xl font-semibold text-slate-900">
                  {knowledge?.faqs?.length ?? 0}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-slate-900">Policies</span>
                </div>
                <p className="text-2xl font-semibold text-slate-900">
                  {[
                    knowledge?.policies?.returnPolicy,
                    knowledge?.policies?.refundPolicy,
                    knowledge?.policies?.cancellationPolicy,
                    knowledge?.policies?.shippingInfo,
                    ...(knowledge?.policies?.customPolicies || []),
                  ].filter(Boolean).length}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-slate-900">Team</span>
                </div>
                <p className="text-2xl font-semibold text-slate-900">
                  {(persona as any).teamMembers?.length ?? 0}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium text-slate-900">Testimonials</span>
                </div>
                <p className="text-2xl font-semibold text-slate-900">
                  {(persona as any).testimonials?.length ?? 0}
                </p>
              </div>
            </div>
            {hasFaqs && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-500 mb-2">Sample FAQs</p>
                <div className="space-y-2">
                  {knowledge?.faqs?.slice(0, 2).map((faq) => (
                    <div key={faq.id} className="text-sm">
                      <p className="font-medium text-slate-700">Q: {faq.question}</p>
                      <p className="text-slate-500 line-clamp-1">A: {faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ProfileSection>

          {/* Section 5: AI Personality */}
          <ProfileSection
            title="AI Personality"
            icon={<Sparkles className="w-5 h-5 text-pink-600" />}
            iconBg="bg-pink-100"
            editLink="/partner/settings?tab=profile"
            isEmpty={!personality?.voiceTone?.length && !personality?.communicationStyle}
            emptyMessage="Configure how your AI should communicate"
            emptyAction="Configure AI"
          >
            <div className="space-y-4">
              {personality?.voiceTone && personality.voiceTone.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-2">Voice Tone</p>
                  <div className="flex flex-wrap gap-1.5">
                    {personality.voiceTone.map((tone, i) => (
                      <Badge key={i} variant="secondary" className="text-xs capitalize">
                        {tone}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {personality?.communicationStyle && (
                <FieldDisplay
                  icon={<MessageSquare className="w-4 h-4 text-slate-500" />}
                  label="Communication Style"
                  value={
                    <span className="capitalize">
                      {personality.communicationStyle}
                    </span>
                  }
                />
              )}
              {personality?.languagePreference && personality.languagePreference.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-2">Languages</p>
                  <div className="flex flex-wrap gap-1.5">
                    {personality.languagePreference.map((lang, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {personality?.brandValues && personality.brandValues.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-2">Brand Values</p>
                  <div className="flex flex-wrap gap-1.5">
                    {personality.brandValues.map((value, i) => (
                      <Badge key={i} className="text-xs bg-pink-100 text-pink-700 hover:bg-pink-100">
                        {value}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ProfileSection>

          {/* Section 6: Customer Profile */}
          <ProfileSection
            title="Customer Profile"
            icon={<Users className="w-5 h-5 text-cyan-600" />}
            iconBg="bg-cyan-100"
            editLink="/partner/settings?tab=profile"
            isEmpty={!customerProfile?.targetAudience && !customerProfile?.commonQueries?.length}
            emptyMessage="Define your target audience for personalized AI responses"
            emptyAction="Add audience info"
          >
            <div className="space-y-4">
              {customerProfile?.targetAudience && (
                <FieldDisplay
                  icon={<Users className="w-4 h-4 text-slate-500" />}
                  label="Target Audience"
                  value={customerProfile.targetAudience}
                />
              )}
              {customerProfile?.commonQueries && customerProfile.commonQueries.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-2">Common Customer Questions</p>
                  <ul className="space-y-1">
                    {customerProfile.commonQueries.slice(0, 3).map((query, i) => (
                      <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                        <span className="text-slate-400">•</span>
                        {query}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {customerProfile?.customerPainPoints && customerProfile.customerPainPoints.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-2">Customer Pain Points</p>
                  <div className="flex flex-wrap gap-1.5">
                    {customerProfile.customerPainPoints.slice(0, 4).map((point, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {point}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ProfileSection>
        </div>
      </div>

      {/* Test AI Response Modal */}
      <TestAIResponseModal
        open={isTestModalOpen}
        onOpenChange={setIsTestModalOpen}
        partnerId={partnerId}
        persona={persona}
      />
    </ScrollArea>
  );
}
