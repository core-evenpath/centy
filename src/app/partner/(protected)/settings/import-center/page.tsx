'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getBusinessPersonaAction, saveBusinessPersonaAction } from '@/actions/business-persona-actions';
import { searchBusinessesAction, autoFillProfileAction, applyImportToProfileAction } from '@/actions/business-autofill-actions';
import { scrapeWebsiteAction } from '@/actions/website-scrape-actions';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Download,
  GitMerge,
  Package,
  Quote,
  Wand2,
  Rocket,
  Loader2,
} from 'lucide-react';
import type { BusinessPersona } from '@/lib/business-persona-types';
import {
  ImportTab,
  ReviewTab,
  ProductsTab,
  TestimonialsTab,
  AISuggestionsTab,
  ApplyTab,
} from '@/components/partner/settings/import-center/tabs';
import { SuccessScreen } from '@/components/partner/settings/import-center/screens';
import type {
  ImportCenterTab,
  MergeField,
  ImportedProduct,
  EnrichedTestimonial,
  AISuggestion,
  ImportStats,
  FieldSource,
} from '@/components/partner/settings/import-center/types';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  Sparkles,
  FileText,
  Target,
  BookOpen,
  BadgeCheck,
  Users,
  GraduationCap,
  Flag,
} from 'lucide-react';

// ========================================
// HELPER FUNCTIONS
// ========================================

function analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  const positiveWords = [
    'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'best',
    'perfect', 'awesome', 'outstanding', 'exceptional', 'highly recommend',
    'impressed', 'friendly', 'professional', 'delicious', 'beautiful',
  ];
  const negativeWords = [
    'bad', 'terrible', 'awful', 'worst', 'horrible', 'disappointed', 'poor',
    'never again', 'waste', 'rude', 'slow', 'dirty', 'overpriced', 'avoid',
  ];

  const lowerText = text.toLowerCase();
  let positiveScore = 0;
  let negativeScore = 0;

  positiveWords.forEach((word) => {
    if (lowerText.includes(word)) positiveScore++;
  });
  negativeWords.forEach((word) => {
    if (lowerText.includes(word)) negativeScore++;
  });

  if (positiveScore > negativeScore) return 'positive';
  if (negativeScore > positiveScore) return 'negative';
  return 'neutral';
}

// Get nested value from object by path
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

// ========================================
// MAIN PAGE COMPONENT
// ========================================

export default function ImportCenterPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Core state
  const [loading, setLoading] = useState(true);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [persona, setPersona] = useState<Partial<BusinessPersona>>({});
  const [partnerIndustry, setPartnerIndustry] = useState<string | null>(null);
  const [partnerCountry, setPartnerCountry] = useState<string | null>(null);

  // View state
  const [activeTab, setActiveTab] = useState<ImportCenterTab>('import');

  // Import state
  const [googleImported, setGoogleImported] = useState(false);
  const [websiteImported, setWebsiteImported] = useState(false);
  const [googleSearch, setGoogleSearch] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [importing, setImporting] = useState<'google' | 'website' | null>(null);

  // Google search state
  const [googleResults, setGoogleResults] = useState<any[]>([]);
  const [googleSearching, setGoogleSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [websiteError, setWebsiteError] = useState<string | null>(null);

  // Raw imported data
  const [googleRawData, setGoogleRawData] = useState<any>(null);
  const [websiteRawData, setWebsiteRawData] = useState<any>(null);

  // Merge state
  const [mergeFields, setMergeFields] = useState<MergeField[]>([]);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Products state
  const [products, setProducts] = useState<ImportedProduct[]>([]);

  // Testimonials state
  const [testimonials, setTestimonials] = useState<EnrichedTestimonial[]>([]);

  // AI Suggestions state
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [suggestionFilter, setSuggestionFilter] = useState<'all' | 'core' | 'products' | 'testimonials'>('all');

  // Apply state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    identity: true,
    contact: false,
    industry: false,
    products: false,
    testimonials: false,
    suggestions: false,
  });
  const [isApplying, setIsApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  // Get partnerId from user claims
  const userPartnerId = (user as any)?.customClaims?.partnerId;

  // ========================================
  // DATA LOADING
  // ========================================

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
          setPartnerIndustry(result.persona.identity?.industry?.category || null);
          setPartnerCountry(result.persona.identity?.address?.country || null);

          // Load previously saved import data
          if (result.persona.importedData?.google) {
            setGoogleRawData(result.persona.importedData.google.rawData);
            setGoogleImported(true);
          }
          if (result.persona.importedData?.website) {
            setWebsiteRawData(result.persona.importedData.website.rawData);
            setWebsiteImported(true);
          }
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

  // ========================================
  // BUILD MERGE FIELDS
  // ========================================

  useEffect(() => {
    if (googleImported || websiteImported) {
      buildMergeFields();
      extractProducts();
      extractTestimonials();
      generateSuggestions();
    }
  }, [googleRawData, websiteRawData, googleImported, websiteImported]);

  const buildMergeFields = () => {
    const fieldDefinitions = [
      { key: 'identity.businessName', label: 'Business Name', icon: Building2, critical: true, category: 'identity' as const },
      { key: 'identity.legalName', label: 'Legal Name', icon: FileText, category: 'identity' as const },
      { key: 'identity.tagline', label: 'Tagline', icon: Sparkles, critical: true, category: 'identity' as const },
      { key: 'identity.description', label: 'Description', icon: FileText, critical: true, multiline: true, category: 'identity' as const },
      { key: 'identity.mission', label: 'Mission', icon: Target, category: 'identity' as const },
      { key: 'identity.founderStory', label: 'Founder Story', icon: BookOpen, category: 'identity' as const },
      { key: 'contact.phone', label: 'Phone', icon: Phone, category: 'contact' as const },
      { key: 'contact.email', label: 'Email', icon: Mail, category: 'contact' as const },
      { key: 'contact.address', label: 'Address', icon: MapPin, category: 'contact' as const },
      { key: 'contact.operatingHours', label: 'Hours', icon: Clock, category: 'contact' as const },
      { key: 'industryMetrics.visaSuccessRate', label: 'Visa Success Rate', icon: BadgeCheck, critical: true, category: 'industry' as const },
      { key: 'industryMetrics.studentsPlaced', label: 'Students Placed', icon: Users, critical: true, category: 'industry' as const },
      { key: 'industryMetrics.universitiesPartnered', label: 'Universities', icon: GraduationCap, category: 'industry' as const },
      { key: 'industryMetrics.countriesServed', label: 'Countries', icon: Flag, category: 'industry' as const },
    ];

    const fields: MergeField[] = fieldDefinitions.map((def) => {
      // Try to get values from various paths in the raw data
      const googleVal = googleRawData
        ? getNestedValue(googleRawData, def.key) ||
          getNestedValue(googleRawData, def.key.replace('identity.', '').replace('contact.', '').replace('industryMetrics.', ''))
        : null;
      const websiteVal = websiteRawData
        ? getNestedValue(websiteRawData, def.key) ||
          getNestedValue(websiteRawData, def.key.replace('identity.', '').replace('contact.', '').replace('industryMetrics.', ''))
        : null;

      const hasConflict = googleVal && websiteVal && JSON.stringify(googleVal) !== JSON.stringify(websiteVal);

      let selectedSource: FieldSource = 'none';
      let finalValue = null;

      if (websiteVal) {
        selectedSource = 'website';
        finalValue = websiteVal;
      } else if (googleVal) {
        selectedSource = 'google';
        finalValue = googleVal;
      }

      return {
        key: def.key,
        label: def.label,
        icon: def.icon,
        category: def.category,
        critical: def.critical,
        multiline: def.multiline,
        googleValue: googleVal,
        websiteValue: websiteVal,
        finalValue,
        selectedSource,
        hasConflict,
      };
    });

    setMergeFields(fields);
  };

  const extractProducts = () => {
    const allProducts: ImportedProduct[] = [];

    const processProducts = (data: any, source: FieldSource) => {
      const productsData = data?.knowledge?.productsOrServices || data?.productsOrServices || data?.products || [];
      productsData.forEach((p: any, index: number) => {
        allProducts.push({
          id: `${source}_product_${index}`,
          name: p.name || `Product ${index + 1}`,
          description: p.description || p.shortDescription || '',
          category: p.category || 'General',
          pricing: p.price ? `${p.priceUnit || '$'}${p.price}` : p.pricing || '',
          features: p.features || [],
          popular: p.popular || p.featured || false,
          selected: true,
          source,
        });
      });
    };

    if (googleRawData) processProducts(googleRawData, 'google');
    if (websiteRawData) processProducts(websiteRawData, 'website');

    setProducts(allProducts);
  };

  const extractTestimonials = () => {
    const allTestimonials: EnrichedTestimonial[] = [];

    const processTestimonials = (data: any, source: FieldSource) => {
      const rawTestimonials = data?.testimonials || [];
      const reviews = data?.reviews || [];

      rawTestimonials.forEach((t: any, i: number) => {
        const quote = t.quote || t.text;
        if (quote) {
          allTestimonials.push({
            id: `${source}_testimonial_${i}`,
            quote,
            author: t.author || t.name,
            rating: t.rating,
            date: t.date,
            source,
            verified: t.verified,
            outcome: t.outcome,
            sentiment: analyzeSentiment(quote),
            keywords: t.keywords || [],
            selected: true,
            highlighted: (t.rating === 5 && t.outcome) || false,
          });
        }
      });

      reviews.forEach((r: any, i: number) => {
        if (r.text) {
          let reviewDate: string | undefined;
          try {
            if (r.time && typeof r.time === 'number' && r.time > 0) {
              const date = new Date(r.time * 1000);
              if (!isNaN(date.getTime())) {
                reviewDate = date.toISOString();
              }
            }
          } catch {
            reviewDate = undefined;
          }

          allTestimonials.push({
            id: `${source}_review_${i}`,
            quote: r.text,
            author: r.authorName || r.author,
            rating: r.rating,
            date: reviewDate,
            source,
            verified: true,
            outcome: undefined,
            sentiment: analyzeSentiment(r.text),
            keywords: [],
            selected: true,
            highlighted: r.rating === 5,
          });
        }
      });
    };

    if (googleRawData) processTestimonials(googleRawData, 'google');
    if (websiteRawData) processTestimonials(websiteRawData, 'website');

    setTestimonials(allTestimonials);
  };

  const generateSuggestions = () => {
    // Generate AI suggestions based on imported data
    const newSuggestions: AISuggestion[] = [];

    // Check tagline
    const tagline = mergeFields.find((f) => f.key === 'identity.tagline')?.finalValue;
    if (tagline && typeof tagline === 'string') {
      newSuggestions.push({
        id: 's1',
        type: 'improvement',
        priority: 'high',
        title: 'Strengthen Your Tagline',
        field: 'identity.tagline',
        current: tagline,
        suggested: tagline.includes('98%') ? tagline : `${tagline} | 98% Success Rate`,
        reason: 'Include specific numbers for credibility and trust.',
        category: 'core',
        applied: false,
      });
    }

    // Check for neutral reviews
    const neutralReviews = testimonials.filter((t) => t.sentiment === 'neutral');
    if (neutralReviews.length > 0) {
      newSuggestions.push({
        id: 's2',
        type: 'gap',
        priority: 'high',
        title: 'Respond to Neutral Reviews',
        current: `${neutralReviews.length} reviews need responses`,
        suggested: 'Add thoughtful responses to address concerns',
        reason: '53% of customers expect businesses to respond to reviews.',
        category: 'testimonials',
        applied: false,
      });
    }

    // Check for testimonials with outcomes
    const testimonialsWithOutcome = testimonials.filter((t) => t.outcome);
    if (testimonialsWithOutcome.length >= 2) {
      newSuggestions.push({
        id: 's3',
        type: 'highlight',
        priority: 'high',
        title: 'Feature Success Stories',
        current: `${testimonialsWithOutcome.length} testimonials with outcomes`,
        suggested: 'Create a dedicated success stories section',
        reason: 'Success stories address ROI concerns and build trust.',
        category: 'testimonials',
        applied: false,
      });
    }

    // Check for video testimonials
    newSuggestions.push({
      id: 's4',
      type: 'missing',
      priority: 'medium',
      title: 'Add Video Testimonials',
      current: 'No videos',
      suggested: 'Record 3-5 video testimonials from happy customers',
      reason: 'Video testimonials have 2x conversion impact.',
      category: 'testimonials',
      applied: false,
    });

    setSuggestions(newSuggestions);
  };

  // ========================================
  // GOOGLE SEARCH
  // ========================================

  const handleGoogleSearchChange = useCallback(async (value: string) => {
    setGoogleSearch(value);
    setSelectedPlace(null);

    if (value.length < 3) {
      setGoogleResults([]);
      return;
    }

    setGoogleSearching(true);
    try {
      const result = await searchBusinessesAction(value);
      if (result.success && result.results) {
        setGoogleResults(result.results);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setGoogleSearching(false);
    }
  }, []);

  // ========================================
  // IMPORT HANDLERS
  // ========================================

  const handleGoogleImport = async () => {
    if (!selectedPlace || !partnerId) {
      toast.error('Please select a business first');
      return;
    }

    setImporting('google');
    try {
      const result = await autoFillProfileAction(selectedPlace.placeId);
      if (result.success && result.profile) {
        setGoogleRawData(result.profile);
        setGoogleImported(true);

        // Auto-save to Firestore
        const importedDataUpdate = {
          importedData: {
            ...(persona.importedData || {}),
            google: {
              rawData: result.profile,
              importedAt: new Date().toISOString(),
              placeName: selectedPlace.name,
              placeId: selectedPlace.placeId,
            },
          },
          importHistory: {
            ...persona.importHistory,
            google: {
              lastImportedAt: new Date(),
              placeId: selectedPlace.placeId,
              placeName: selectedPlace.name,
              status: 'success' as const,
            },
          },
        };

        await saveBusinessPersonaAction(partnerId, importedDataUpdate as any);
        setPersona((prev) => ({ ...prev, ...importedDataUpdate }));
        toast.success('Imported from Google successfully!');
      } else {
        toast.error(result.error || 'Failed to import from Google');
      }
    } catch (err: any) {
      toast.error(err.message || 'Import failed');
    } finally {
      setImporting(null);
    }
  };

  const handleWebsiteImport = async () => {
    if (!websiteUrl.trim() || !partnerId) {
      toast.error('Please enter a website URL');
      return;
    }

    setImporting('website');
    setWebsiteError(null);
    try {
      const result = await scrapeWebsiteAction(websiteUrl, {
        includeSubpages: true,
        maxPages: 5,
      });

      if (!result.success || !result.profile) {
        setWebsiteError(result.error || 'Failed to import from website');
        toast.error(result.error || 'Failed to import from website');
        return;
      }

      setWebsiteRawData(result.profile);
      setWebsiteImported(true);

      // Auto-save to Firestore
      const importedDataUpdate = {
        importedData: {
          ...(persona.importedData || {}),
          website: {
            rawData: result.profile,
            importedAt: new Date().toISOString(),
            url: websiteUrl,
            pagesScraped: result.pagesScraped,
          },
        },
        importHistory: {
          ...persona.importHistory,
          website: {
            lastImportedAt: new Date(),
            url: websiteUrl,
            pagesScraped: result.pagesScraped,
            status: 'success' as const,
          },
        },
      };

      await saveBusinessPersonaAction(partnerId, importedDataUpdate as any);
      setPersona((prev) => ({ ...prev, ...importedDataUpdate }));
      toast.success(`Imported from ${result.pagesScraped?.length || 1} pages!`);
    } catch (err: any) {
      setWebsiteError(err.message || 'Failed to import');
      toast.error('Failed to import from website');
    } finally {
      setImporting(null);
    }
  };

  const handleGoogleClear = async () => {
    if (!partnerId) return;

    setGoogleImported(false);
    setGoogleSearch('');
    setSelectedPlace(null);
    setGoogleResults([]);
    setGoogleRawData(null);

    // Update Firestore
    const updated = {
      importedData: {
        ...(persona.importedData || {}),
        google: null,
      },
    };
    await saveBusinessPersonaAction(partnerId, updated as any);
    setPersona((prev) => ({ ...prev, ...updated }));
    toast.success('Google import cleared');
  };

  const handleWebsiteClear = async () => {
    if (!partnerId) return;

    setWebsiteImported(false);
    setWebsiteUrl('');
    setWebsiteRawData(null);
    setWebsiteError(null);

    // Update Firestore
    const updated = {
      importedData: {
        ...(persona.importedData || {}),
        website: null,
      },
    };
    await saveBusinessPersonaAction(partnerId, updated as any);
    setPersona((prev) => ({ ...prev, ...updated }));
    toast.success('Website import cleared');
  };

  // ========================================
  // MERGE HANDLERS
  // ========================================

  const handleSelectSource = (fieldKey: string, source: FieldSource) => {
    setMergeFields((prev) =>
      prev.map((f) =>
        f.key === fieldKey
          ? {
              ...f,
              selectedSource: source,
              finalValue: source === 'google' ? f.googleValue : f.websiteValue,
            }
          : f
      )
    );
  };

  const handleStartEdit = (field: MergeField) => {
    setEditingField(field.key);
    setEditValue(Array.isArray(field.finalValue) ? field.finalValue.join(', ') : field.finalValue || '');
  };

  const handleSaveEdit = (fieldKey: string) => {
    setMergeFields((prev) =>
      prev.map((f) =>
        f.key === fieldKey
          ? { ...f, finalValue: editValue, selectedSource: 'custom' as FieldSource }
          : f
      )
    );
    setEditingField(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  // ========================================
  // PRODUCT HANDLERS
  // ========================================

  const handleToggleProduct = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p))
    );
  };

  const handleSelectAllProducts = () => {
    setProducts((prev) => prev.map((p) => ({ ...p, selected: true })));
  };

  // ========================================
  // TESTIMONIAL HANDLERS
  // ========================================

  const handleToggleTestimonial = (id: string) => {
    setTestimonials((prev) =>
      prev.map((t) => (t.id === id ? { ...t, selected: !t.selected } : t))
    );
  };

  const handleHighlightTestimonial = (id: string) => {
    setTestimonials((prev) =>
      prev.map((t) => (t.id === id ? { ...t, highlighted: !t.highlighted } : t))
    );
  };

  const handleSelectPositive = () => {
    setTestimonials((prev) =>
      prev.map((t) => ({ ...t, selected: t.sentiment === 'positive' }))
    );
  };

  const handleFeatureBest = () => {
    setTestimonials((prev) =>
      prev.map((t) => ({ ...t, highlighted: t.rating === 5 && Boolean(t.outcome) }))
    );
  };

  // ========================================
  // AI SUGGESTION HANDLERS
  // ========================================

  const handleApplySuggestion = (id: string) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, applied: true } : s))
    );
  };

  const handleDismissSuggestion = (id: string) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
  };

  const handleApplyAllHighPriority = () => {
    const highPriority = suggestions.filter((s) => s.priority === 'high' && !s.applied);
    highPriority.forEach((s) => handleApplySuggestion(s.id));
  };

  // ========================================
  // APPLY TO PROFILE
  // ========================================

  const handleApplyToProfile = async () => {
    if (!partnerId) {
      toast.error('Partner ID not found');
      return;
    }

    setIsApplying(true);
    try {
      // Build payload from merge fields
      const updates: any = {};

      mergeFields.forEach((field) => {
        if (field.finalValue) {
          const pathParts = field.key.split('.');
          let current = updates;

          for (let i = 0; i < pathParts.length - 1; i++) {
            if (!current[pathParts[i]]) {
              current[pathParts[i]] = {};
            }
            current = current[pathParts[i]];
          }
          current[pathParts[pathParts.length - 1]] = field.finalValue;
        }
      });

      // Add selected products
      const selectedProducts = products.filter((p) => p.selected);
      if (selectedProducts.length > 0) {
        updates.knowledge = updates.knowledge || {};
        updates.knowledge.productsOrServices = selectedProducts.map((p) => ({
          name: p.name,
          description: p.description,
          category: p.category,
          price: p.pricing,
          features: p.features,
          featured: p.popular,
        }));
      }

      // Add selected testimonials
      const selectedTestimonials = testimonials.filter((t) => t.selected);
      if (selectedTestimonials.length > 0) {
        updates.testimonials = selectedTestimonials.map((t) => ({
          quote: t.quote,
          author: t.author,
          rating: t.rating,
          date: t.date,
          source: t.source,
          highlighted: t.highlighted,
          outcome: t.outcome,
        }));
      }

      // Add import metadata
      updates.importHistory = {
        ...persona.importHistory,
        lastAppliedAt: new Date(),
        appliedFields: mergeFields.filter((f) => f.finalValue).map((f) => f.key),
        appliedProducts: selectedProducts.length,
        appliedTestimonials: selectedTestimonials.length,
        appliedSuggestions: suggestions.filter((s) => s.applied).map((s) => s.id),
      };

      // Also use AI-powered transformation if available
      const rawMergedData = {
        ...googleRawData,
        ...websiteRawData,
      };

      const transformResult = await applyImportToProfileAction(rawMergedData, persona);

      if (transformResult.success && transformResult.profile) {
        // Merge AI-transformed data with manual selections
        const finalUpdates = {
          ...transformResult.profile,
          ...updates,
          identity: {
            ...transformResult.profile.identity,
            ...updates.identity,
          },
          personality: {
            ...transformResult.profile.personality,
            ...updates.personality,
          },
          knowledge: {
            ...transformResult.profile.knowledge,
            ...updates.knowledge,
          },
        };

        await saveBusinessPersonaAction(partnerId, finalUpdates);
      } else {
        // Fall back to just manual updates
        await saveBusinessPersonaAction(partnerId, updates);
      }

      setApplied(true);
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to apply to profile');
    } finally {
      setIsApplying(false);
    }
  };

  // ========================================
  // COMPUTED VALUES
  // ========================================

  const googleStats: ImportStats = useMemo(() => {
    if (!googleRawData) return { fields: 0, products: 0, testimonials: 0 };
    const productCount = (googleRawData.knowledge?.productsOrServices || googleRawData.products || []).length;
    const testimonialCount = (googleRawData.reviews || googleRawData.testimonials || []).length;
    return { fields: 10, products: productCount, testimonials: testimonialCount };
  }, [googleRawData]);

  const websiteStats: ImportStats = useMemo(() => {
    if (!websiteRawData) return { fields: 0, products: 0, testimonials: 0 };
    const productCount = (websiteRawData.knowledge?.productsOrServices || websiteRawData.products || []).length;
    const testimonialCount = (websiteRawData.testimonials || []).length;
    return { fields: 18, products: productCount, testimonials: testimonialCount };
  }, [websiteRawData]);

  const conflictCount = mergeFields.filter((f) => f.hasConflict).length;
  const resolvedCount = mergeFields.filter((f) => f.hasConflict && f.selectedSource !== 'none').length;
  const hasUnresolvedConflicts = conflictCount > resolvedCount;
  const filledFields = mergeFields.filter((f) => f.finalValue).length;

  const selectedProducts = products.filter((p) => p.selected);
  const selectedTestimonials = testimonials.filter((t) => t.selected);
  const appliedSuggestions = suggestions.filter((s) => s.applied);
  const pendingSuggestions = suggestions.filter((s) => !s.applied);
  const highPrioritySuggestions = pendingSuggestions.filter((s) => s.priority === 'high');

  const canProceed = googleImported || websiteImported;

  // ========================================
  // TAB CONFIG
  // ========================================

  const tabs = [
    { id: 'import' as ImportCenterTab, label: 'Import', icon: Download, badge: null },
    {
      id: 'merge' as ImportCenterTab,
      label: 'Review',
      icon: GitMerge,
      badge: conflictCount > 0 ? conflictCount : null,
      badgeType: hasUnresolvedConflicts ? 'warning' : 'success',
    },
    { id: 'products' as ImportCenterTab, label: 'Products', icon: Package, badge: selectedProducts.length },
    { id: 'testimonials' as ImportCenterTab, label: 'Testimonials', icon: Quote, badge: selectedTestimonials.length },
    {
      id: 'ai' as ImportCenterTab,
      label: 'AI',
      icon: Wand2,
      badge: highPrioritySuggestions.length,
      highlight: true,
    },
    { id: 'final' as ImportCenterTab, label: 'Apply', icon: Rocket, highlight: true },
  ];

  // ========================================
  // RENDER
  // ========================================

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (applied) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
        <SuccessScreen
          stats={{
            fields: filledFields,
            products: selectedProducts.length,
            testimonials: selectedTestimonials.length,
          }}
          onReset={() => setApplied(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/partner/settings')}
                className="p-2 hover:bg-slate-100 rounded-xl"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-slate-900">Import Center</h1>
                <p className="text-xs text-slate-500">
                  {partnerCountry && `${partnerCountry}`}
                  {partnerIndustry && ` • ${partnerIndustry}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {canProceed && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-sm text-emerald-700 font-medium">Saved</span>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 -mb-px overflow-x-auto pb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                disabled={tab.id !== 'import' && !canProceed}
                className={`px-3 py-3 text-sm font-medium border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? tab.highlight
                      ? 'border-purple-600 text-purple-600'
                      : 'border-indigo-600 text-indigo-600'
                    : tab.id !== 'import' && !canProceed
                      ? 'border-transparent text-slate-300 cursor-not-allowed'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.badge !== null && tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                      tab.badgeType === 'warning'
                        ? 'bg-amber-100 text-amber-700'
                        : tab.highlight
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'import' && (
          <ImportTab
            googleImported={googleImported}
            websiteImported={websiteImported}
            googleSearch={googleSearch}
            websiteUrl={websiteUrl}
            importing={importing}
            googleStats={googleStats}
            websiteStats={websiteStats}
            googleResults={googleResults}
            searching={googleSearching}
            selectedPlace={selectedPlace}
            websiteError={websiteError}
            onGoogleSearchChange={handleGoogleSearchChange}
            onWebsiteUrlChange={setWebsiteUrl}
            onGoogleImport={handleGoogleImport}
            onWebsiteImport={handleWebsiteImport}
            onGoogleClear={handleGoogleClear}
            onWebsiteClear={handleWebsiteClear}
            onSelectPlace={setSelectedPlace}
            onProceed={() => setActiveTab('merge')}
            conflictCount={conflictCount}
            filledFields={filledFields}
          />
        )}

        {activeTab === 'merge' && (
          <ReviewTab
            mergeFields={mergeFields}
            conflictCount={conflictCount}
            resolvedCount={resolvedCount}
            editingField={editingField}
            editValue={editValue}
            onSelectSource={handleSelectSource}
            onStartEdit={handleStartEdit}
            onEditChange={setEditValue}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={handleCancelEdit}
          />
        )}

        {activeTab === 'products' && (
          <ProductsTab
            products={products}
            onToggleProduct={handleToggleProduct}
            onSelectAll={handleSelectAllProducts}
          />
        )}

        {activeTab === 'testimonials' && (
          <TestimonialsTab
            testimonials={testimonials}
            onToggleTestimonial={handleToggleTestimonial}
            onHighlightTestimonial={handleHighlightTestimonial}
            onSelectPositive={handleSelectPositive}
            onFeatureBest={handleFeatureBest}
          />
        )}

        {activeTab === 'ai' && (
          <AISuggestionsTab
            suggestions={suggestions}
            filter={suggestionFilter}
            onFilterChange={setSuggestionFilter}
            onApplySuggestion={handleApplySuggestion}
            onDismissSuggestion={handleDismissSuggestion}
            onApplyAllHighPriority={handleApplyAllHighPriority}
          />
        )}

        {activeTab === 'final' && (
          <ApplyTab
            mergeFields={mergeFields}
            products={products}
            testimonials={testimonials}
            suggestions={suggestions}
            expandedSections={expandedSections}
            hasUnresolvedConflicts={hasUnresolvedConflicts}
            highPrioritySuggestions={highPrioritySuggestions}
            isApplying={isApplying}
            onToggleSection={(section) =>
              setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
            }
            onNavigateToTab={setActiveTab}
            onApply={handleApplyToProfile}
          />
        )}
      </div>
    </div>
  );
}
