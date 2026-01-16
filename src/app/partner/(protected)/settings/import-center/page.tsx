'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getBusinessPersonaAction, saveBusinessPersonaAction } from '@/actions/business-persona-actions';
import { searchBusinessesAction, autoFillProfileAction } from '@/actions/business-autofill-actions';
import { scrapeWebsiteAction } from '@/actions/website-scrape-actions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, Search, Globe, Sparkles, Loader2, CheckCircle2,
  Circle, ChevronDown, ChevronRight, Trash2, RefreshCw, X,
  Building2, MapPin, Package, Heart, Star, Shield, Users,
  MessageSquare, Clock, Phone, Mail, Link2, ExternalLink,
  Info, AlertCircle, Check, Send, Database
} from 'lucide-react';
import type { BusinessPersona } from '@/lib/business-persona-types';

// ========================================
// TYPES
// ========================================

interface ImportedField {
  id: string;
  label: string;
  value: any;
  displayValue: string;
  path: string;
  source: 'google' | 'website';
  selected: boolean;
}

interface ImportedCategory {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  fields: ImportedField[];
  expanded: boolean;
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function formatRelativeTime(date: Date | string | undefined): string {
  if (!date) return 'Never';
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

function formatDisplayValue(value: any): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.length > 100 ? value.substring(0, 100) + '...' : value;
  if (Array.isArray(value)) return `${value.length} items`;
  if (typeof value === 'object') {
    if (value.street || value.city) {
      return [value.street, value.city, value.state, value.country].filter(Boolean).join(', ');
    }
    return JSON.stringify(value).substring(0, 100) + '...';
  }
  return String(value);
}

function extractImportedCategories(persona: Partial<BusinessPersona>, source: 'google' | 'website'): ImportedCategory[] {
  const categories: ImportedCategory[] = [];
  const identity = persona.identity || {};
  const knowledge = persona.knowledge || {};
  const personality = persona.personality || {};

  // Business Identity
  const identityFields: ImportedField[] = [];
  if ((identity as any).name || (identity as any).businessName) {
    identityFields.push({
      id: 'identity.name',
      label: 'Business Name',
      value: (identity as any).name || (identity as any).businessName,
      displayValue: formatDisplayValue((identity as any).name || (identity as any).businessName),
      path: 'identity.name',
      source,
      selected: true
    });
  }
  if ((identity as any).description) {
    identityFields.push({
      id: 'identity.description',
      label: 'Description',
      value: (identity as any).description,
      displayValue: formatDisplayValue((identity as any).description),
      path: 'identity.description',
      source,
      selected: true
    });
  }
  if ((identity as any).phone) {
    identityFields.push({
      id: 'identity.phone',
      label: 'Phone',
      value: (identity as any).phone,
      displayValue: (identity as any).phone,
      path: 'identity.phone',
      source,
      selected: true
    });
  }
  if ((identity as any).email) {
    identityFields.push({
      id: 'identity.email',
      label: 'Email',
      value: (identity as any).email,
      displayValue: (identity as any).email,
      path: 'identity.email',
      source,
      selected: true
    });
  }
  if ((identity as any).website) {
    identityFields.push({
      id: 'identity.website',
      label: 'Website',
      value: (identity as any).website,
      displayValue: (identity as any).website,
      path: 'identity.website',
      source,
      selected: true
    });
  }

  if (identityFields.length > 0) {
    categories.push({
      id: 'identity',
      label: 'Business Identity',
      icon: Building2,
      color: 'bg-indigo-500',
      fields: identityFields,
      expanded: true
    });
  }

  // Location & Hours
  const locationFields: ImportedField[] = [];
  const address = (identity as any).address;
  if (address && (address.street || address.city)) {
    locationFields.push({
      id: 'identity.address',
      label: 'Address',
      value: address,
      displayValue: formatDisplayValue(address),
      path: 'identity.address',
      source,
      selected: true
    });
  }
  if ((identity as any).operatingHours?.length > 0) {
    locationFields.push({
      id: 'identity.operatingHours',
      label: 'Operating Hours',
      value: (identity as any).operatingHours,
      displayValue: `${(identity as any).operatingHours.length} days configured`,
      path: 'identity.operatingHours',
      source,
      selected: true
    });
  }

  if (locationFields.length > 0) {
    categories.push({
      id: 'location',
      label: 'Location & Hours',
      icon: MapPin,
      color: 'bg-blue-500',
      fields: locationFields,
      expanded: false
    });
  }

  // Products & Services
  const productsFields: ImportedField[] = [];
  if ((knowledge as any).productsOrServices?.length > 0) {
    productsFields.push({
      id: 'knowledge.productsOrServices',
      label: 'Products/Services',
      value: (knowledge as any).productsOrServices,
      displayValue: `${(knowledge as any).productsOrServices.length} items`,
      path: 'knowledge.productsOrServices',
      source,
      selected: true
    });
  }
  if ((knowledge as any).packages?.length > 0) {
    productsFields.push({
      id: 'knowledge.packages',
      label: 'Packages',
      value: (knowledge as any).packages,
      displayValue: `${(knowledge as any).packages.length} packages`,
      path: 'knowledge.packages',
      source,
      selected: true
    });
  }
  if ((knowledge as any).pricingTiers?.length > 0) {
    productsFields.push({
      id: 'knowledge.pricingTiers',
      label: 'Pricing Tiers',
      value: (knowledge as any).pricingTiers,
      displayValue: `${(knowledge as any).pricingTiers.length} tiers`,
      path: 'knowledge.pricingTiers',
      source,
      selected: true
    });
  }

  if (productsFields.length > 0) {
    categories.push({
      id: 'products',
      label: 'Products & Services',
      icon: Package,
      color: 'bg-emerald-500',
      fields: productsFields,
      expanded: false
    });
  }

  // Brand & Values
  const brandFields: ImportedField[] = [];
  if ((personality as any).tagline) {
    brandFields.push({
      id: 'personality.tagline',
      label: 'Tagline',
      value: (personality as any).tagline,
      displayValue: formatDisplayValue((personality as any).tagline),
      path: 'personality.tagline',
      source,
      selected: true
    });
  }
  if ((personality as any).brandStory) {
    brandFields.push({
      id: 'personality.brandStory',
      label: 'Brand Story',
      value: (personality as any).brandStory,
      displayValue: formatDisplayValue((personality as any).brandStory),
      path: 'personality.brandStory',
      source,
      selected: true
    });
  }
  if ((personality as any).missionStatement) {
    brandFields.push({
      id: 'personality.missionStatement',
      label: 'Mission Statement',
      value: (personality as any).missionStatement,
      displayValue: formatDisplayValue((personality as any).missionStatement),
      path: 'personality.missionStatement',
      source,
      selected: true
    });
  }
  if ((personality as any).brandValues?.length > 0) {
    brandFields.push({
      id: 'personality.brandValues',
      label: 'Brand Values',
      value: (personality as any).brandValues,
      displayValue: (personality as any).brandValues.join(', '),
      path: 'personality.brandValues',
      source,
      selected: true
    });
  }

  if (brandFields.length > 0) {
    categories.push({
      id: 'brand',
      label: 'Brand & Values',
      icon: Heart,
      color: 'bg-pink-500',
      fields: brandFields,
      expanded: false
    });
  }

  // Reviews & Testimonials
  const socialProofFields: ImportedField[] = [];
  if ((persona as any).testimonials?.length > 0) {
    socialProofFields.push({
      id: 'testimonials',
      label: 'Testimonials',
      value: (persona as any).testimonials,
      displayValue: `${(persona as any).testimonials.length} reviews`,
      path: 'testimonials',
      source,
      selected: true
    });
  }

  if (socialProofFields.length > 0) {
    categories.push({
      id: 'social-proof',
      label: 'Reviews & Testimonials',
      icon: Star,
      color: 'bg-amber-500',
      fields: socialProofFields,
      expanded: false
    });
  }

  // Trust & Credentials
  const trustFields: ImportedField[] = [];
  if ((persona as any).awards?.length > 0) {
    trustFields.push({
      id: 'awards',
      label: 'Awards',
      value: (persona as any).awards,
      displayValue: `${(persona as any).awards.length} awards`,
      path: 'awards',
      source,
      selected: true
    });
  }
  if ((persona as any).certifications?.length > 0) {
    trustFields.push({
      id: 'certifications',
      label: 'Certifications',
      value: (persona as any).certifications,
      displayValue: `${(persona as any).certifications.length} certifications`,
      path: 'certifications',
      source,
      selected: true
    });
  }

  if (trustFields.length > 0) {
    categories.push({
      id: 'trust',
      label: 'Trust & Credentials',
      icon: Shield,
      color: 'bg-purple-500',
      fields: trustFields,
      expanded: false
    });
  }

  // Team
  if ((persona as any).team?.length > 0) {
    categories.push({
      id: 'team',
      label: 'Team',
      icon: Users,
      color: 'bg-teal-500',
      fields: [{
        id: 'team',
        label: 'Team Members',
        value: (persona as any).team,
        displayValue: `${(persona as any).team.length} members`,
        path: 'team',
        source,
        selected: true
      }],
      expanded: false
    });
  }

  // FAQs
  if ((knowledge as any).faqs?.length > 0) {
    categories.push({
      id: 'faqs',
      label: 'FAQs',
      icon: MessageSquare,
      color: 'bg-cyan-500',
      fields: [{
        id: 'knowledge.faqs',
        label: 'Frequently Asked Questions',
        value: (knowledge as any).faqs,
        displayValue: `${(knowledge as any).faqs.length} questions`,
        path: 'knowledge.faqs',
        source,
        selected: true
      }],
      expanded: false
    });
  }

  // Social Media
  const social = (identity as any).socialMedia;
  if (social) {
    const socialFields: ImportedField[] = [];
    Object.entries(social).forEach(([platform, url]) => {
      if (url) {
        socialFields.push({
          id: `identity.socialMedia.${platform}`,
          label: platform.charAt(0).toUpperCase() + platform.slice(1),
          value: url,
          displayValue: String(url),
          path: `identity.socialMedia.${platform}`,
          source,
          selected: true
        });
      }
    });
    if (socialFields.length > 0) {
      categories.push({
        id: 'social',
        label: 'Social Media',
        icon: Globe,
        color: 'bg-sky-500',
        fields: socialFields,
        expanded: false
      });
    }
  }

  return categories;
}

// ========================================
// MAIN PAGE COMPONENT
// ========================================

export default function ImportCenterPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Core state
  const [loading, setLoading] = useState(true);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [persona, setPersona] = useState<Partial<BusinessPersona>>({});

  // Import source state
  const [activeSource, setActiveSource] = useState<'google' | 'website' | null>(null);

  // Google import state
  const [googleSearch, setGoogleSearch] = useState('');
  const [googleResults, setGoogleResults] = useState<any[]>([]);
  const [googleSearching, setGoogleSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [isGoogleImporting, setIsGoogleImporting] = useState(false);
  const [googleImportedData, setGoogleImportedData] = useState<ImportedCategory[]>([]);

  // Website import state
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [websiteError, setWebsiteError] = useState<string | null>(null);
  const [isWebsiteImporting, setIsWebsiteImporting] = useState(false);
  const [websiteImportedData, setWebsiteImportedData] = useState<ImportedCategory[]>([]);

  // Applying to profile
  const [isApplying, setIsApplying] = useState(false);

  // Get partnerId from user claims
  const userPartnerId = (user as any)?.customClaims?.partnerId;

  // Load business persona
  useEffect(() => {
    const loadPersona = async () => {
      if (!userPartnerId) {
        setLoading(false);
        return;
      }
      try {
        setPartnerId(userPartnerId);
        const result = await getBusinessPersonaAction(userPartnerId);
        if (result.success && result.persona) {
          setPersona(result.persona);
        }
      } catch (err) {
        console.error('Failed to load persona:', err);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    if (!authLoading) loadPersona();
  }, [userPartnerId, authLoading]);

  // Google places search - using searchBusinessesAction like settings page
  const debouncedSearch = useCallback(async (query: string) => {
    if (query.length < 3) {
      setGoogleResults([]);
      return;
    }

    setGoogleSearching(true);
    try {
      const result = await searchBusinessesAction(query);
      if (result.success && result.results) {
        setGoogleResults(result.results);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setGoogleSearching(false);
    }
  }, []);

  // Handle Google import
  const handleGoogleImport = async () => {
    if (!selectedPlace) {
      toast.error('Please select a business first');
      return;
    }
    setIsGoogleImporting(true);
    try {
      const result = await autoFillProfileAction(selectedPlace.placeId);
      if (result.success && result.profile) {
        // Extract categories from the imported data
        const categories = extractImportedCategories(result.profile as any, 'google');
        setGoogleImportedData(categories);
        toast.success('Data imported from Google!');
      } else {
        toast.error(result.error || 'Failed to import from Google');
      }
    } catch (err: any) {
      toast.error(err.message || 'Import failed');
    } finally {
      setIsGoogleImporting(false);
    }
  };

  // Handle website import - matching settings page implementation
  const handleWebsiteImport = async () => {
    if (!websiteUrl.trim()) {
      toast.error('Please enter a website URL');
      return;
    }
    setIsWebsiteImporting(true);
    setWebsiteError(null);
    try {
      console.log('[ImportCenter] Starting website import for:', websiteUrl);
      const result = await scrapeWebsiteAction(websiteUrl, {
        includeSubpages: true,
        maxPages: 5,
      });

      if (!result.success || !result.profile) {
        setWebsiteError(result.error || 'Failed to import from website');
        toast.error(result.error || 'Failed to import from website');
        return;
      }

      console.log('[ImportCenter] Website import complete, pages analyzed:', result.pagesScraped?.length);

      // Extract categories from the imported data
      const categories = extractImportedCategories(result.profile as any, 'website');
      setWebsiteImportedData(categories);
      toast.success(`Website analyzed! ${result.pagesScraped?.length || 1} page${(result.pagesScraped?.length || 1) !== 1 ? 's' : ''} processed.`);
    } catch (err: any) {
      console.error('[ImportCenter] Website import error:', err);
      setWebsiteError(err.message || 'Failed to import from website');
      toast.error('Failed to import from website');
    } finally {
      setIsWebsiteImporting(false);
    }
  };

  // Toggle field selection
  const toggleFieldSelection = (source: 'google' | 'website', categoryId: string, fieldId: string) => {
    const setData = source === 'google' ? setGoogleImportedData : setWebsiteImportedData;
    setData(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          fields: cat.fields.map(f => f.id === fieldId ? { ...f, selected: !f.selected } : f)
        };
      }
      return cat;
    }));
  };

  // Toggle category expansion
  const toggleCategoryExpansion = (source: 'google' | 'website', categoryId: string) => {
    const setData = source === 'google' ? setGoogleImportedData : setWebsiteImportedData;
    setData(prev => prev.map(cat =>
      cat.id === categoryId ? { ...cat, expanded: !cat.expanded } : cat
    ));
  };

  // Select all in category
  const selectAllInCategory = (source: 'google' | 'website', categoryId: string, selected: boolean) => {
    const setData = source === 'google' ? setGoogleImportedData : setWebsiteImportedData;
    setData(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          fields: cat.fields.map(f => ({ ...f, selected }))
        };
      }
      return cat;
    }));
  };

  // Clear import data
  const clearImportData = (source: 'google' | 'website') => {
    if (source === 'google') {
      setGoogleImportedData([]);
      setGoogleSearch('');
      setSelectedPlace(null);
      setGoogleResults([]);
    } else {
      setWebsiteImportedData([]);
      setWebsiteUrl('');
      setWebsiteError(null);
    }
    toast.success(`${source === 'google' ? 'Google' : 'Website'} import cleared`);
  };

  // Apply selected data to profile
  const applyToProfile = async () => {
    if (!partnerId) {
      toast.error('No partner ID found');
      return;
    }

    // Collect all selected fields
    const allSelectedFields: ImportedField[] = [
      ...googleImportedData.flatMap(c => c.fields.filter(f => f.selected)),
      ...websiteImportedData.flatMap(c => c.fields.filter(f => f.selected))
    ];

    if (allSelectedFields.length === 0) {
      toast.error('Please select at least one field to apply');
      return;
    }

    setIsApplying(true);
    try {
      // Build the updated persona by applying selected fields
      let updatedPersona = { ...persona };

      allSelectedFields.forEach(field => {
        const pathParts = field.path.split('.');
        let current: any = updatedPersona;

        // Navigate to the parent
        for (let i = 0; i < pathParts.length - 1; i++) {
          if (!current[pathParts[i]]) {
            current[pathParts[i]] = {};
          }
          current = current[pathParts[i]];
        }

        // Set the value
        current[pathParts[pathParts.length - 1]] = field.value;
      });

      // Update import history
      updatedPersona.importHistory = {
        ...updatedPersona.importHistory,
        ...(googleImportedData.length > 0 && {
          google: {
            lastImportedAt: new Date(),
            placeId: selectedPlace?.placeId,
            placeName: selectedPlace?.mainText,
            status: 'success' as const,
          }
        }),
        ...(websiteImportedData.length > 0 && {
          website: {
            lastImportedAt: new Date(),
            url: websiteUrl,
            status: 'success' as const,
          }
        })
      };

      // Save to backend
      await saveBusinessPersonaAction(partnerId, updatedPersona);
      setPersona(updatedPersona);

      toast.success(`${allSelectedFields.length} fields applied to profile!`);

      // Clear the imported data after applying
      setGoogleImportedData([]);
      setWebsiteImportedData([]);

      // Navigate back to profile
      router.push('/partner/settings');
    } catch (err: any) {
      toast.error(err.message || 'Failed to apply data');
    } finally {
      setIsApplying(false);
    }
  };

  // Count selected fields
  const totalSelectedCount = useMemo(() => {
    return [
      ...googleImportedData.flatMap(c => c.fields),
      ...websiteImportedData.flatMap(c => c.fields)
    ].filter(f => f.selected).length;
  }, [googleImportedData, websiteImportedData]);

  const totalFieldCount = useMemo(() => {
    return [
      ...googleImportedData.flatMap(c => c.fields),
      ...websiteImportedData.flatMap(c => c.fields)
    ].length;
  }, [googleImportedData, websiteImportedData]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/partner/settings')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Import Center</h1>
              <p className="text-xs text-slate-500">Import and select data for your profile</p>
            </div>
          </div>

          {totalFieldCount > 0 && (
            <button
              onClick={applyToProfile}
              disabled={isApplying || totalSelectedCount === 0}
              className={cn(
                "px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all",
                totalSelectedCount > 0
                  ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              )}
            >
              {isApplying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Apply {totalSelectedCount > 0 ? `(${totalSelectedCount})` : ''} to Profile
            </button>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Import Source Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* Google Import Card */}
          <button
            onClick={() => setActiveSource(activeSource === 'google' ? null : 'google')}
            className={cn(
              "p-5 rounded-xl border-2 text-left transition-all",
              activeSource === 'google'
                ? "border-blue-400 bg-blue-50 ring-2 ring-blue-200"
                : googleImportedData.length > 0
                  ? "border-blue-200 bg-blue-50/50 hover:bg-blue-50"
                  : "border-slate-200 bg-white hover:bg-slate-50"
            )}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Search className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">Google Business</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {googleImportedData.length > 0
                    ? `${googleImportedData.flatMap(c => c.fields).length} fields imported`
                    : 'Search & import from Google'}
                </p>
                {googleImportedData.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs text-emerald-600 font-medium">Data ready</span>
                  </div>
                )}
              </div>
            </div>
          </button>

          {/* Website Import Card */}
          <button
            onClick={() => setActiveSource(activeSource === 'website' ? null : 'website')}
            className={cn(
              "p-5 rounded-xl border-2 text-left transition-all",
              activeSource === 'website'
                ? "border-purple-400 bg-purple-50 ring-2 ring-purple-200"
                : websiteImportedData.length > 0
                  ? "border-purple-200 bg-purple-50/50 hover:bg-purple-50"
                  : "border-slate-200 bg-white hover:bg-slate-50"
            )}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900">Website Import</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {websiteImportedData.length > 0
                    ? `${websiteImportedData.flatMap(c => c.fields).length} fields imported`
                    : 'Import from your website'}
                </p>
                {websiteImportedData.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs text-emerald-600 font-medium">Data ready</span>
                  </div>
                )}
              </div>
            </div>
          </button>
        </div>

        {/* Active Import Panel */}
        {activeSource && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8 shadow-sm">
            {activeSource === 'google' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Search className="w-5 h-5 text-blue-600" />
                    Search Google Business
                  </h3>
                  {googleImportedData.length > 0 && (
                    <button
                      onClick={() => clearImportData('google')}
                      className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    {selectedPlace ? (
                      <div className="flex items-center justify-between px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div>
                          <div className="font-medium text-blue-900">{selectedPlace.mainText}</div>
                          <div className="text-sm text-blue-600">{selectedPlace.secondaryText}</div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedPlace(null);
                            setGoogleSearch('');
                          }}
                          className="p-1 hover:bg-blue-100 rounded"
                        >
                          <X className="w-4 h-4 text-blue-500" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <input
                          type="text"
                          value={googleSearch}
                          onChange={e => {
                            setGoogleSearch(e.target.value);
                            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                            searchTimeoutRef.current = setTimeout(() => debouncedSearch(e.target.value), 300);
                          }}
                          placeholder="Search your business on Google..."
                          className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                        {googleResults.length > 0 && (
                          <div className="absolute z-20 top-14 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                            {googleResults.map(r => (
                              <button
                                key={r.placeId}
                                onClick={() => {
                                  setSelectedPlace(r);
                                  setGoogleSearch(r.mainText);
                                  setGoogleResults([]);
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                              >
                                <div className="font-medium text-slate-900">{r.mainText}</div>
                                <div className="text-xs text-slate-500">{r.secondaryText}</div>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <button
                    onClick={handleGoogleImport}
                    disabled={isGoogleImporting || !selectedPlace}
                    className={cn(
                      "px-6 py-3 rounded-lg text-sm font-medium flex items-center gap-2",
                      selectedPlace
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    )}
                  >
                    {isGoogleImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Import
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-purple-600" />
                    Import from Website
                  </h3>
                  {websiteImportedData.length > 0 && (
                    <button
                      onClick={() => clearImportData('website')}
                      className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="url"
                      value={websiteUrl}
                      onChange={e => {
                        setWebsiteUrl(e.target.value);
                        setWebsiteError(null);
                      }}
                      placeholder="Enter your website URL (e.g., www.yourbusiness.com)"
                      className={cn(
                        "w-full px-4 py-3 rounded-lg bg-slate-50 border text-sm focus:outline-none focus:ring-2 focus:ring-purple-300",
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
                    onClick={handleWebsiteImport}
                    disabled={isWebsiteImporting || !websiteUrl.trim()}
                    className={cn(
                      "px-6 py-3 rounded-lg text-sm font-medium flex items-center gap-2",
                      websiteUrl.trim()
                        ? "bg-purple-600 text-white hover:bg-purple-700"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    )}
                  >
                    {isWebsiteImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                    Import
                  </button>
                </div>

                {websiteError && (
                  <div className="px-4 py-2 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{websiteError}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Imported Data Sections */}
        {(googleImportedData.length > 0 || websiteImportedData.length > 0) && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Imported Data</h2>
              <p className="text-sm text-slate-500">
                {totalSelectedCount} of {totalFieldCount} fields selected
              </p>
            </div>

            {/* Google Imported Data */}
            {googleImportedData.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Search className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-blue-900">From Google Business</span>
                  </div>
                  <span className="text-sm text-blue-600">
                    {googleImportedData.flatMap(c => c.fields).filter(f => f.selected).length} selected
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {googleImportedData.map(category => (
                    <CategorySection
                      key={category.id}
                      category={category}
                      source="google"
                      onToggleExpand={() => toggleCategoryExpansion('google', category.id)}
                      onToggleField={(fieldId) => toggleFieldSelection('google', category.id, fieldId)}
                      onSelectAll={(selected) => selectAllInCategory('google', category.id, selected)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Website Imported Data */}
            {websiteImportedData.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 bg-purple-50 border-b border-purple-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-purple-600" />
                    <span className="font-semibold text-purple-900">From Website</span>
                  </div>
                  <span className="text-sm text-purple-600">
                    {websiteImportedData.flatMap(c => c.fields).filter(f => f.selected).length} selected
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {websiteImportedData.map(category => (
                    <CategorySection
                      key={category.id}
                      category={category}
                      source="website"
                      onToggleExpand={() => toggleCategoryExpansion('website', category.id)}
                      onToggleField={(fieldId) => toggleFieldSelection('website', category.id, fieldId)}
                      onSelectAll={(selected) => selectAllInCategory('website', category.id, selected)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {googleImportedData.length === 0 && websiteImportedData.length === 0 && !activeSource && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Database className="w-8 h-8 text-indigo-500" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Start importing data</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
              Select a source above to import your business data. You can import from both sources and select which fields to apply to your profile.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ========================================
// CATEGORY SECTION COMPONENT
// ========================================

function CategorySection({
  category,
  source,
  onToggleExpand,
  onToggleField,
  onSelectAll
}: {
  category: ImportedCategory;
  source: 'google' | 'website';
  onToggleExpand: () => void;
  onToggleField: (fieldId: string) => void;
  onSelectAll: (selected: boolean) => void;
}) {
  const Icon = category.icon;
  const selectedCount = category.fields.filter(f => f.selected).length;
  const allSelected = selectedCount === category.fields.length;

  return (
    <div>
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors"
      >
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", category.color)}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 text-left">
          <h4 className="font-medium text-slate-900">{category.label}</h4>
          <p className="text-xs text-slate-500">{selectedCount} of {category.fields.length} selected</p>
        </div>
        {category.expanded ? (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronRight className="w-5 h-5 text-slate-400" />
        )}
      </button>

      {category.expanded && (
        <div className="px-4 pb-4">
          <div className="flex items-center justify-end mb-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectAll(!allSelected);
              }}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {allSelected ? 'Deselect all' : 'Select all'}
            </button>
          </div>

          <div className="space-y-2">
            {category.fields.map(field => (
              <div
                key={field.id}
                onClick={() => onToggleField(field.id)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all",
                  field.selected
                    ? "bg-indigo-50 border border-indigo-200"
                    : "bg-slate-50 border border-slate-200 hover:bg-slate-100"
                )}
              >
                <div className={cn(
                  "w-5 h-5 rounded-md flex items-center justify-center border-2 transition-colors",
                  field.selected
                    ? "bg-indigo-600 border-indigo-600"
                    : "bg-white border-slate-300"
                )}>
                  {field.selected && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-slate-900">{field.label}</div>
                  <div className="text-xs text-slate-500 truncate">{field.displayValue}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
