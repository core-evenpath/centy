'use client';

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  Globe, Search, RefreshCw, Trash2, ChevronDown, ChevronRight,
  CheckCircle2, Clock, Building2, Phone, Mail, MapPin, Package,
  Star, Users, MessageSquare, Award, FileText, Zap, Info,
  ExternalLink, Database, Sparkles, AlertCircle, X, Link2, Loader2,
  Check, Circle, Calendar, DollarSign, Briefcase, Shield, Heart,
  Camera, Gift, BookOpen, UserCheck
} from 'lucide-react';
import type { BusinessPersona, ImportHistory } from '@/lib/business-persona-types';

// ========================================
// TYPES
// ========================================

export interface ImportCenterProps {
  persona: Partial<BusinessPersona>;
  importHistory?: ImportHistory;

  // Google import
  googleSearch: string;
  onGoogleSearchChange: (query: string) => void;
  googleResults: any[];
  selectedPlace: any | null;
  onSelectPlace: (place: any) => void;
  onGoogleImport: () => Promise<void>;
  isGoogleImporting: boolean;

  // Website import
  websiteUrl: string;
  onWebsiteUrlChange: (url: string) => void;
  onWebsiteImport: () => Promise<void>;
  isWebsiteImporting: boolean;
  websiteError?: string | null;

  // Actions
  onRefreshGoogle: () => Promise<void>;
  onRefreshWebsite: () => Promise<void>;
  onClearGoogle: () => Promise<void>;
  onClearWebsite: () => Promise<void>;
  onClearAll: () => Promise<void>;
}

// Imported data categories for display
interface ImportedCategory {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  fields: ImportedField[];
}

interface ImportedField {
  label: string;
  value: any;
  source: 'google' | 'website' | 'both';
  path: string;
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function formatRelativeTime(date: Date | undefined): string {
  if (!date) return 'Never';
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

function extractImportedData(persona: Partial<BusinessPersona>): ImportedCategory[] {
  const categories: ImportedCategory[] = [];

  // Business Identity
  const identityFields: ImportedField[] = [];
  const identity = persona.identity || {};

  if ((identity as any).name || (identity as any).businessName) {
    identityFields.push({
      label: 'Business Name',
      value: (identity as any).name || (identity as any).businessName,
      source: 'both',
      path: 'identity.name'
    });
  }
  if ((identity as any).tagline || (persona.personality as any)?.tagline) {
    identityFields.push({
      label: 'Tagline',
      value: (identity as any).tagline || (persona.personality as any)?.tagline,
      source: 'website',
      path: 'personality.tagline'
    });
  }
  if ((identity as any).description) {
    identityFields.push({
      label: 'Description',
      value: (identity as any).description,
      source: 'both',
      path: 'identity.description'
    });
  }
  if ((identity as any).phone) {
    identityFields.push({
      label: 'Phone',
      value: (identity as any).phone,
      source: 'google',
      path: 'identity.phone'
    });
  }
  if ((identity as any).email) {
    identityFields.push({
      label: 'Email',
      value: (identity as any).email,
      source: 'website',
      path: 'identity.email'
    });
  }
  if ((identity as any).website) {
    identityFields.push({
      label: 'Website',
      value: (identity as any).website,
      source: 'both',
      path: 'identity.website'
    });
  }

  if (identityFields.length > 0) {
    categories.push({
      id: 'identity',
      label: 'Business Identity',
      icon: Building2,
      color: 'bg-indigo-500',
      fields: identityFields
    });
  }

  // Contact & Location
  const contactFields: ImportedField[] = [];
  const address = (identity as any).address || {};

  if (address.street || address.city || address.state) {
    const addressParts = [address.street, address.city, address.state, address.country].filter(Boolean);
    contactFields.push({
      label: 'Address',
      value: addressParts.join(', '),
      source: 'google',
      path: 'identity.address'
    });
  }
  if ((identity as any).operatingHours?.length > 0) {
    contactFields.push({
      label: 'Operating Hours',
      value: `${(identity as any).operatingHours.length} days configured`,
      source: 'google',
      path: 'identity.operatingHours'
    });
  }

  if (contactFields.length > 0) {
    categories.push({
      id: 'contact',
      label: 'Location & Hours',
      icon: MapPin,
      color: 'bg-blue-500',
      fields: contactFields
    });
  }

  // Packages & Pricing
  const packagesFields: ImportedField[] = [];
  const knowledge = persona.knowledge || {};

  if ((knowledge as any).packages?.length > 0) {
    packagesFields.push({
      label: 'Packages',
      value: `${(knowledge as any).packages.length} packages`,
      source: 'website',
      path: 'knowledge.packages'
    });
  }
  if ((knowledge as any).pricingTiers?.length > 0) {
    packagesFields.push({
      label: 'Pricing Tiers',
      value: `${(knowledge as any).pricingTiers.length} tiers`,
      source: 'website',
      path: 'knowledge.pricingTiers'
    });
  }

  if (packagesFields.length > 0) {
    categories.push({
      id: 'packages',
      label: 'Packages & Pricing',
      icon: Package,
      color: 'bg-emerald-500',
      fields: packagesFields
    });
  }

  // Brand & Values
  const brandFields: ImportedField[] = [];
  const personality = persona.personality || {};

  if ((personality as any).brandStory) {
    brandFields.push({
      label: 'Brand Story',
      value: (personality as any).brandStory.substring(0, 100) + '...',
      source: 'website',
      path: 'personality.brandStory'
    });
  }
  if ((personality as any).missionStatement) {
    brandFields.push({
      label: 'Mission',
      value: (personality as any).missionStatement,
      source: 'website',
      path: 'personality.missionStatement'
    });
  }
  if ((personality as any).brandValues?.length > 0) {
    brandFields.push({
      label: 'Brand Values',
      value: (personality as any).brandValues.join(', '),
      source: 'website',
      path: 'personality.brandValues'
    });
  }
  if ((personality as any).uniqueSellingPoints?.length > 0) {
    brandFields.push({
      label: 'Unique Selling Points',
      value: `${(personality as any).uniqueSellingPoints.length} points`,
      source: 'website',
      path: 'personality.uniqueSellingPoints'
    });
  }

  if (brandFields.length > 0) {
    categories.push({
      id: 'brand',
      label: 'Brand & Values',
      icon: Heart,
      color: 'bg-pink-500',
      fields: brandFields
    });
  }

  // Reviews & Testimonials
  const socialProofFields: ImportedField[] = [];

  if ((persona as any).testimonials?.length > 0) {
    socialProofFields.push({
      label: 'Testimonials',
      value: `${(persona as any).testimonials.length} reviews`,
      source: 'google',
      path: 'testimonials'
    });
  }
  if ((persona as any).caseStudies?.length > 0) {
    socialProofFields.push({
      label: 'Case Studies',
      value: `${(persona as any).caseStudies.length} studies`,
      source: 'website',
      path: 'caseStudies'
    });
  }

  if (socialProofFields.length > 0) {
    categories.push({
      id: 'social-proof',
      label: 'Reviews & Social Proof',
      icon: Star,
      color: 'bg-amber-500',
      fields: socialProofFields
    });
  }

  // Trust & Credentials
  const trustFields: ImportedField[] = [];

  if ((persona as any).awards?.length > 0) {
    trustFields.push({
      label: 'Awards',
      value: `${(persona as any).awards.length} awards`,
      source: 'website',
      path: 'awards'
    });
  }
  if ((persona as any).certifications?.length > 0) {
    trustFields.push({
      label: 'Certifications',
      value: `${(persona as any).certifications.length} certifications`,
      source: 'website',
      path: 'certifications'
    });
  }
  if ((knowledge as any).policies) {
    const policiesCount = Object.values((knowledge as any).policies).filter(Boolean).length;
    if (policiesCount > 0) {
      trustFields.push({
        label: 'Policies',
        value: `${policiesCount} policies`,
        source: 'website',
        path: 'knowledge.policies'
      });
    }
  }

  if (trustFields.length > 0) {
    categories.push({
      id: 'trust',
      label: 'Trust & Credentials',
      icon: Shield,
      color: 'bg-purple-500',
      fields: trustFields
    });
  }

  // Team
  const teamFields: ImportedField[] = [];

  if ((persona as any).team?.length > 0) {
    teamFields.push({
      label: 'Team Members',
      value: `${(persona as any).team.length} members`,
      source: 'website',
      path: 'team'
    });
  }

  if (teamFields.length > 0) {
    categories.push({
      id: 'team',
      label: 'Team',
      icon: Users,
      color: 'bg-teal-500',
      fields: teamFields
    });
  }

  // FAQs & Support
  const supportFields: ImportedField[] = [];

  if ((knowledge as any).faqs?.length > 0) {
    supportFields.push({
      label: 'FAQs',
      value: `${(knowledge as any).faqs.length} questions`,
      source: 'both',
      path: 'knowledge.faqs'
    });
  }

  if (supportFields.length > 0) {
    categories.push({
      id: 'support',
      label: 'FAQs & Support',
      icon: MessageSquare,
      color: 'bg-cyan-500',
      fields: supportFields
    });
  }

  // Social Media
  const socialFields: ImportedField[] = [];
  const social = (identity as any).socialMedia || {};

  const socialPlatforms = Object.entries(social).filter(([_, v]) => v);
  if (socialPlatforms.length > 0) {
    socialFields.push({
      label: 'Social Profiles',
      value: socialPlatforms.map(([k]) => k).join(', '),
      source: 'website',
      path: 'identity.socialMedia'
    });
  }

  if (socialFields.length > 0) {
    categories.push({
      id: 'social',
      label: 'Social Media',
      icon: Globe,
      color: 'bg-sky-500',
      fields: socialFields
    });
  }

  return categories;
}

function countTotalFields(categories: ImportedCategory[]): number {
  return categories.reduce((acc, cat) => acc + cat.fields.length, 0);
}

// ========================================
// SUB-COMPONENTS
// ========================================

// Source indicator badge
function SourceBadge({ source }: { source: 'google' | 'website' | 'both' }) {
  if (source === 'both') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gradient-to-r from-blue-100 to-purple-100 text-xs font-medium text-slate-600 rounded">
        <Search className="w-2.5 h-2.5 text-blue-500" />
        <Globe className="w-2.5 h-2.5 text-purple-500" />
      </span>
    );
  }
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium rounded",
      source === 'google' ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"
    )}>
      {source === 'google' ? <Search className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}
      {source === 'google' ? 'Google' : 'Website'}
    </span>
  );
}

// Import source card (Google or Website)
function ImportSourceCard({
  type,
  isActive,
  lastImportedAt,
  sourceIdentifier,
  pagesScraped,
  fieldsCount,
  isImporting,
  onRefresh,
  onClick,
}: {
  type: 'google' | 'website';
  isActive: boolean;
  lastImportedAt?: Date;
  sourceIdentifier?: string;
  pagesScraped?: string[];
  fieldsCount: number;
  isImporting: boolean;
  onRefresh: () => Promise<void>;
  onClick: () => void;
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isGoogle = type === 'google';
  const hasData = !!lastImportedAt && fieldsCount > 0;

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 p-4 rounded-xl border-2 transition-all text-left relative overflow-hidden",
        isActive
          ? isGoogle
            ? "border-blue-400 bg-blue-50/80 ring-2 ring-blue-200"
            : "border-purple-400 bg-purple-50/80 ring-2 ring-purple-200"
          : hasData
            ? isGoogle
              ? "border-blue-200 bg-blue-50/30 hover:bg-blue-50/50"
              : "border-purple-200 bg-purple-50/30 hover:bg-purple-50/50"
            : "border-slate-200 bg-white hover:bg-slate-50"
      )}
    >
      {/* Status indicator dot */}
      {hasData && (
        <div className={cn(
          "absolute top-3 right-3 w-2.5 h-2.5 rounded-full",
          isGoogle ? "bg-blue-500" : "bg-purple-500"
        )} />
      )}

      <div className="flex items-start gap-3">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
          isGoogle ? "bg-blue-100" : "bg-purple-100"
        )}>
          {isGoogle ? (
            <Search className={cn("w-5 h-5", isGoogle ? "text-blue-600" : "text-purple-600")} />
          ) : (
            <Globe className="w-5 h-5 text-purple-600" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 text-sm">
            {isGoogle ? 'Google Business' : 'Website Import'}
          </h3>

          {hasData ? (
            <>
              <div className="flex items-center gap-1.5 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs text-emerald-600 font-medium">{fieldsCount} fields</span>
              </div>
              {sourceIdentifier && (
                <div className="text-xs text-slate-500 mt-1 truncate">
                  {isGoogle ? sourceIdentifier : new URL(sourceIdentifier).hostname}
                </div>
              )}
              <div className="flex items-center gap-1.5 mt-1.5">
                <Clock className="w-3 h-3 text-slate-400" />
                <span className="text-xs text-slate-500">{formatRelativeTime(lastImportedAt)}</span>
                {!isImporting && (
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="ml-1 p-1 hover:bg-white/50 rounded transition-colors"
                  >
                    <RefreshCw className={cn("w-3 h-3 text-slate-400 hover:text-slate-600", isRefreshing && "animate-spin")} />
                  </button>
                )}
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-500 mt-1">
              {isGoogle ? 'Search & import from Google' : 'Import from your website'}
            </p>
          )}

          {isImporting && (
            <div className="flex items-center gap-1.5 mt-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
              <span className="text-xs text-indigo-600 font-medium">Importing...</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

// Category display section
function CategorySection({
  category,
  isExpanded,
  onToggle
}: {
  category: ImportedCategory;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const Icon = category.icon;

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors"
      >
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", category.color)}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 text-left">
          <h4 className="font-medium text-slate-900 text-sm">{category.label}</h4>
          <p className="text-xs text-slate-500">{category.fields.length} fields imported</p>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 pt-1 border-t border-slate-100">
          <div className="space-y-2">
            {category.fields.map((field, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700">{field.label}</span>
                    <SourceBadge source={field.source} />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{String(field.value)}</p>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 ml-2" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ========================================
// MAIN COMPONENT
// ========================================

export default function ImportCenter({
  persona,
  importHistory,
  googleSearch,
  onGoogleSearchChange,
  googleResults,
  selectedPlace,
  onSelectPlace,
  onGoogleImport,
  isGoogleImporting,
  websiteUrl,
  onWebsiteUrlChange,
  onWebsiteImport,
  isWebsiteImporting,
  websiteError,
  onRefreshGoogle,
  onRefreshWebsite,
  onClearGoogle,
  onClearWebsite,
  onClearAll,
}: ImportCenterProps) {

  // Active tab for import mode
  const [activeMode, setActiveMode] = useState<'google' | 'website' | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['identity']);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Compute imported data categories
  const importedCategories = useMemo(() => extractImportedData(persona), [persona]);
  const totalFieldsCount = useMemo(() => countTotalFields(importedCategories), [importedCategories]);

  // Check if any imports exist
  const hasGoogleImport = !!importHistory?.google?.lastImportedAt;
  const hasWebsiteImport = !!importHistory?.website?.lastImportedAt;
  const hasAnyImport = hasGoogleImport || hasWebsiteImport;

  // Google fields count approximation
  const googleFieldsCount = hasGoogleImport ? Math.ceil(totalFieldsCount * 0.4) : 0;
  const websiteFieldsCount = hasWebsiteImport ? totalFieldsCount - googleFieldsCount : 0;

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-5 bg-gradient-to-r from-slate-50 to-indigo-50/50 border-b border-slate-200/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Import Center</h2>
              <p className="text-sm text-slate-500">
                {hasAnyImport
                  ? `${totalFieldsCount} fields imported from ${hasGoogleImport && hasWebsiteImport ? 'both sources' : hasGoogleImport ? 'Google' : 'your website'}`
                  : 'Auto-fill your profile from Google or your website'
                }
              </p>
            </div>
          </div>

          {hasAnyImport && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowClearConfirm(true)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Clear all imports"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Import Source Selection */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex gap-3">
          <ImportSourceCard
            type="google"
            isActive={activeMode === 'google'}
            lastImportedAt={importHistory?.google?.lastImportedAt ? new Date(importHistory.google.lastImportedAt) : undefined}
            sourceIdentifier={importHistory?.google?.placeName}
            fieldsCount={googleFieldsCount}
            isImporting={isGoogleImporting}
            onRefresh={onRefreshGoogle}
            onClick={() => setActiveMode(activeMode === 'google' ? null : 'google')}
          />
          <ImportSourceCard
            type="website"
            isActive={activeMode === 'website'}
            lastImportedAt={importHistory?.website?.lastImportedAt ? new Date(importHistory.website.lastImportedAt) : undefined}
            sourceIdentifier={importHistory?.website?.url}
            pagesScraped={importHistory?.website?.pagesScraped}
            fieldsCount={websiteFieldsCount}
            isImporting={isWebsiteImporting}
            onRefresh={onRefreshWebsite}
            onClick={() => setActiveMode(activeMode === 'website' ? null : 'website')}
          />
        </div>

        {/* Import Input Panel */}
        {activeMode && (
          <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            {activeMode === 'google' ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Search className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 relative">
                    {selectedPlace ? (
                      <div className="flex items-center justify-between px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                        <div>
                          <div className="font-medium text-blue-900">{selectedPlace.mainText}</div>
                          <div className="text-xs text-blue-600">{selectedPlace.secondaryText}</div>
                        </div>
                        <button onClick={() => onSelectPlace(null)} className="p-1 hover:bg-blue-100 rounded">
                          <X className="w-4 h-4 text-blue-500" />
                        </button>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={googleSearch}
                        onChange={e => onGoogleSearchChange(e.target.value)}
                        placeholder="Search your business on Google..."
                        className="w-full px-4 py-2.5 rounded-lg bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                      />
                    )}
                    {googleResults.length > 0 && !selectedPlace && (
                      <div className="absolute z-20 top-12 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                        {googleResults.map(r => (
                          <button
                            key={r.placeId}
                            onClick={() => onSelectPlace(r)}
                            className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                          >
                            <div className="font-medium text-slate-900">{r.mainText}</div>
                            <div className="text-xs text-slate-500">{r.secondaryText}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={onGoogleImport}
                    disabled={isGoogleImporting || !selectedPlace}
                    className={cn(
                      "px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-all",
                      selectedPlace
                        ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    )}
                  >
                    {isGoogleImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    Import
                  </button>
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 pl-12">
                  <Info className="w-3.5 h-3.5" />
                  We'll import business details, reviews, and hours from Google Business Profile
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Link2 className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1 relative">
                    <input
                      type="url"
                      value={websiteUrl}
                      onChange={e => onWebsiteUrlChange(e.target.value)}
                      placeholder="Enter your website URL (e.g., www.yourbusiness.com)"
                      className={cn(
                        "w-full px-4 py-2.5 rounded-lg bg-white border text-sm focus:outline-none focus:ring-2 focus:ring-purple-300",
                        websiteError ? "border-red-300" : "border-slate-200"
                      )}
                    />
                    {websiteUrl && (
                      <a
                        href={websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-600"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                  <button
                    onClick={onWebsiteImport}
                    disabled={isWebsiteImporting || !websiteUrl.trim()}
                    className={cn(
                      "px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-all",
                      websiteUrl.trim()
                        ? "bg-purple-600 text-white hover:bg-purple-700 shadow-md"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    )}
                  >
                    {isWebsiteImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                    Import
                  </button>
                </div>
                {websiteError && (
                  <div className="ml-12 px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{websiteError}</span>
                  </div>
                )}
                <p className="text-xs text-slate-500 flex items-center gap-1.5 pl-12">
                  <Info className="w-3.5 h-3.5" />
                  We'll analyze your website and import services, pricing, team info, and more
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Imported Data Display */}
      {hasAnyImport && importedCategories.length > 0 && (
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Imported Data</h3>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
              {importedCategories.length} categories
            </span>
          </div>

          <div className="space-y-2">
            {importedCategories.map(category => (
              <CategorySection
                key={category.id}
                category={category}
                isExpanded={expandedCategories.includes(category.id)}
                onToggle={() => toggleCategory(category.id)}
              />
            ))}
          </div>

          {/* Footer info */}
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-500 px-1">
            <Info className="w-3.5 h-3.5" />
            <span>All imported data can be edited in the sections below</span>
          </div>
        </div>
      )}

      {/* Empty state when no imports */}
      {!hasAnyImport && !activeMode && (
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Database className="w-8 h-8 text-indigo-500" />
          </div>
          <h3 className="font-semibold text-slate-900 mb-2">No imports yet</h3>
          <p className="text-sm text-slate-500 mb-4 max-w-sm mx-auto">
            Get started by importing your business data from Google Business Profile or your website
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setActiveMode('google')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Import from Google
            </button>
            <button
              onClick={() => setActiveMode('website')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 flex items-center gap-2"
            >
              <Globe className="w-4 h-4" />
              Import from Website
            </button>
          </div>
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center mb-2">
              Clear All Imported Data?
            </h3>
            <p className="text-sm text-slate-500 text-center mb-6">
              This will remove tracking for all imported data. Your profile content will remain, but import history will be cleared.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onClearAll();
                  setShowClearConfirm(false);
                }}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
