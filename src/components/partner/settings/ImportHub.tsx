'use client';

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  Globe, Search, RefreshCw, Trash2, ChevronDown, ChevronRight,
  CheckCircle2, Clock, Building2, Phone, Mail, MapPin, Package,
  Star, Users, MessageSquare, Award, FileText, Zap, Info,
  ExternalLink, Calendar, Database, Sparkles, AlertCircle
} from 'lucide-react';

// Types for import tracking
export interface ImportSource {
  type: 'google' | 'website';
  name: string;
  lastImportedAt?: Date;
  sourceIdentifier?: string; // Google Place ID or Website URL
  pagesScraped?: string[];
  fieldsImported?: number;
  status: 'idle' | 'importing' | 'success' | 'error';
  error?: string;
}

export interface ImportedDataSummary {
  category: string;
  icon: React.ElementType;
  fields: { name: string; value: string | number | boolean; source: 'google' | 'website' | 'both' }[];
}

export interface ImportHubProps {
  // Import sources state
  googleImport: ImportSource;
  websiteImport: ImportSource;
  // Imported persona data
  persona: any;
  // Callbacks
  onGoogleRefresh: () => Promise<void>;
  onWebsiteRefresh: () => Promise<void>;
  onClearGoogle: () => Promise<void>;
  onClearWebsite: () => Promise<void>;
  onClearAll: () => Promise<void>;
  // Quick actions
  onOpenGoogleImport: () => void;
  onOpenWebsiteImport: () => void;
}

// Helper to format relative time
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

// Helper to count imported fields from persona
function countImportedFields(persona: any, source?: 'google' | 'website'): number {
  if (!persona) return 0;
  let count = 0;

  // Count identity fields
  const identity = persona.identity || {};
  if (identity.name || identity.businessName) count++;
  if (identity.phone) count++;
  if (identity.email) count++;
  if (identity.website) count++;
  if (identity.description) count++;
  if (identity.tagline) count++;
  if (identity.address?.street || identity.address?.city) count++;
  if (identity.operatingHours) count++;
  if (identity.socialMedia && Object.values(identity.socialMedia).some(v => v)) count++;
  if (identity.industry) count++;
  if (identity.yearEstablished) count++;
  if (identity.languages?.length) count++;

  // Count knowledge fields
  const knowledge = persona.knowledge || {};
  if (knowledge.faqs?.length) count += knowledge.faqs.length;
  if (knowledge.packages?.length) count += knowledge.packages.length;
  if (knowledge.policies) count++;

  // Count personality fields
  const personality = persona.personality || {};
  if (personality.uniqueSellingPoints?.length) count++;
  if (personality.missionStatement) count++;
  if (personality.visionStatement) count++;
  if (personality.brandValues?.length) count++;

  // Count other data
  if (persona.testimonials?.length) count += persona.testimonials.length;
  if (persona.team?.length) count += persona.team.length;
  if (persona.awards?.length) count++;
  if (persona.certifications?.length) count++;

  return count;
}

// Source Card Component
function SourceCard({
  source,
  onRefresh,
  onClear,
  onOpen,
  isExpanded,
  onToggleExpand,
  importedFieldsCount,
}: {
  source: ImportSource;
  onRefresh: () => Promise<void>;
  onClear: () => Promise<void>;
  onOpen: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  importedFieldsCount: number;
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleClear = async () => {
    setIsClearing(true);
    try {
      await onClear();
    } finally {
      setIsClearing(false);
    }
  };

  const hasData = source.lastImportedAt && importedFieldsCount > 0;
  const isGoogle = source.type === 'google';

  return (
    <div className={cn(
      "rounded-xl border-2 transition-all duration-200",
      hasData
        ? isGoogle ? "border-blue-200 bg-blue-50/50" : "border-purple-200 bg-purple-50/50"
        : "border-slate-200 bg-slate-50/50"
    )}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              isGoogle ? "bg-blue-100" : "bg-purple-100"
            )}>
              {isGoogle ? (
                <Search className={cn("w-5 h-5", isGoogle ? "text-blue-600" : "text-purple-600")} />
              ) : (
                <Globe className="w-5 h-5 text-purple-600" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{source.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                {hasData ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-xs text-emerald-600 font-medium">
                      {importedFieldsCount} fields imported
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs text-slate-500">No data imported</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Status Badge */}
          {source.status === 'importing' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Importing...
            </span>
          )}
        </div>

        {/* Source Info */}
        {source.sourceIdentifier && (
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
            {isGoogle ? (
              <span className="truncate max-w-[200px]">Place: {source.sourceIdentifier}</span>
            ) : (
              <a
                href={source.sourceIdentifier}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 truncate max-w-[200px]"
              >
                {new URL(source.sourceIdentifier).hostname}
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
            )}
            {source.pagesScraped && source.pagesScraped.length > 1 && (
              <span className="text-slate-400">• {source.pagesScraped.length} pages</span>
            )}
          </div>
        )}

        {/* Last Import Time */}
        {source.lastImportedAt && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            Last imported: {formatRelativeTime(source.lastImportedAt)}
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2">
          {hasData ? (
            <>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing || source.status === 'importing'}
                className={cn(
                  "flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isGoogle
                    ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                    : "bg-purple-100 text-purple-700 hover:bg-purple-200",
                  (isRefreshing || source.status === 'importing') && "opacity-50 cursor-not-allowed"
                )}
              >
                <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                Refresh
              </button>
              <button
                onClick={handleClear}
                disabled={isClearing}
                className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={onToggleExpand}
                className="inline-flex items-center justify-center p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </>
          ) : (
            <button
              onClick={onOpen}
              className={cn(
                "flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isGoogle
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-purple-600 text-white hover:bg-purple-700"
              )}
            >
              <Zap className="w-4 h-4" />
              Import from {isGoogle ? 'Google' : 'Website'}
            </button>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && hasData && (
        <div className="border-t border-slate-200/50 p-4 bg-white/50">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Imported Data Preview
          </h4>
          <ImportedDataPreview source={source.type} />
        </div>
      )}
    </div>
  );
}

// Imported Data Preview (placeholder - will show actual data)
function ImportedDataPreview({ source }: { source: 'google' | 'website' }) {
  // This would show a preview of what was imported
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Building2 className="w-4 h-4 text-slate-400" />
        <span>Business identity, contact details</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Package className="w-4 h-4 text-slate-400" />
        <span>Products & services</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Star className="w-4 h-4 text-slate-400" />
        <span>Reviews & testimonials</span>
      </div>
      {source === 'website' && (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <FileText className="w-4 h-4 text-slate-400" />
          <span>Policies & FAQs</span>
        </div>
      )}
    </div>
  );
}

// Main Import Hub Component
export default function ImportHub({
  googleImport,
  websiteImport,
  persona,
  onGoogleRefresh,
  onWebsiteRefresh,
  onClearGoogle,
  onClearWebsite,
  onClearAll,
  onOpenGoogleImport,
  onOpenWebsiteImport,
}: ImportHubProps) {
  const [expandedGoogle, setExpandedGoogle] = useState(false);
  const [expandedWebsite, setExpandedWebsite] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Calculate stats
  const totalFields = useMemo(() => countImportedFields(persona), [persona]);
  const googleFields = useMemo(() => {
    // Approximate split - in a real implementation, track this separately
    return googleImport.lastImportedAt ? Math.floor(totalFields * 0.6) : 0;
  }, [googleImport.lastImportedAt, totalFields]);
  const websiteFields = useMemo(() => {
    return websiteImport.lastImportedAt ? totalFields - googleFields : 0;
  }, [websiteImport.lastImportedAt, totalFields, googleFields]);

  const hasAnyImport = googleImport.lastImportedAt || websiteImport.lastImportedAt;

  return (
    <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-200/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Import Hub</h2>
              <p className="text-sm text-slate-500">
                Manage your imported business data
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          {hasAnyImport && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-indigo-600">{totalFields}</div>
                <div className="text-xs text-slate-500">Total Fields</div>
              </div>
              {hasAnyImport && (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Clear all imported data"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Info Banner */}
        {!hasAnyImport && (
          <div className="mt-4 flex items-start gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
            <Sparkles className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-indigo-900">
                Auto-fill your business profile
              </p>
              <p className="text-xs text-indigo-700 mt-0.5">
                Import data from Google Business or your website to quickly set up your profile.
                You can always edit the imported data afterwards.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Import Sources */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <SourceCard
          source={googleImport}
          onRefresh={onGoogleRefresh}
          onClear={onClearGoogle}
          onOpen={onOpenGoogleImport}
          isExpanded={expandedGoogle}
          onToggleExpand={() => setExpandedGoogle(!expandedGoogle)}
          importedFieldsCount={googleFields}
        />
        <SourceCard
          source={websiteImport}
          onRefresh={onWebsiteRefresh}
          onClear={onClearWebsite}
          onOpen={onOpenWebsiteImport}
          isExpanded={expandedWebsite}
          onToggleExpand={() => setExpandedWebsite(!expandedWebsite)}
          importedFieldsCount={websiteFields}
        />
      </div>

      {/* Last Sync Footer */}
      {hasAnyImport && (
        <div className="px-5 py-3 bg-slate-100/50 border-t border-slate-200/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="w-3.5 h-3.5" />
            <span>Imported data is merged with your manual edits. Refresh to update from source.</span>
          </div>
          <button
            onClick={async () => {
              await Promise.all([
                googleImport.lastImportedAt ? onGoogleRefresh() : Promise.resolve(),
                websiteImport.lastImportedAt ? onWebsiteRefresh() : Promise.resolve(),
              ]);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh All
          </button>
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
              This will remove all data imported from Google and your website.
              Your manual edits will be preserved. This action cannot be undone.
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
                Clear All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
