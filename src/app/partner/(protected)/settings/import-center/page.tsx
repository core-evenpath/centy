'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getBusinessPersonaAction, saveBusinessPersonaAction } from '@/actions/business-persona-actions';
import { searchBusinessesAction, autoFillProfileAction, applyImportToProfileAction } from '@/actions/business-autofill-actions';
import { scrapeWebsiteAction } from '@/actions/website-scrape-actions';
import {
  standardizeGoogleImportData,
  standardizeWebsiteImportData,
  mapStandardizedDataToCanonicalProfile
} from '@/actions/import-data-standardization';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Download,
  GitMerge,
  Quote,
  Wand2,
  Rocket,
  Loader2,
} from 'lucide-react';
import type { BusinessPersona, OtherUsefulDataItem } from '@/lib/business-persona-types';
import {
  buildMergeFields as buildMergeFieldsFromRegistry,
  applyMergeFieldsToPersona,
} from '@/lib/field-registry';
import type { ImportSource } from '@/lib/field-registry';
import {
  ImportTab,
  ReviewTab,
  TestimonialsTab,
  AISuggestionsTab,
  ApplyTab,
} from '@/components/partner/settings/import-center/tabs';
import { SuccessScreen } from '@/components/partner/settings/import-center/screens';
import type {
  ImportCenterTab,
  MergeField,
  EnrichedTestimonial,
  AISuggestion,
  ImportStats,
  FieldSource,
} from '@/components/partner/settings/import-center/types';
import type {
  SuggestedTag,
  TagGroup,
  TagInsight,
} from '@/lib/profile-tags-types';

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
  const [googleSearchError, setGoogleSearchError] = useState<string | null>(null);
  const [websiteError, setWebsiteError] = useState<string | null>(null);

  // Raw imported data
  const [googleRawData, setGoogleRawData] = useState<any>(null);
  const [websiteRawData, setWebsiteRawData] = useState<any>(null);

  // Merge state
  const [mergeFields, setMergeFields] = useState<MergeField[]>([]);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Testimonials state
  const [testimonials, setTestimonials] = useState<EnrichedTestimonial[]>([]);

  // AI Suggestions state
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [suggestionFilter, setSuggestionFilter] = useState<'all' | 'core' | 'products' | 'testimonials'>('all');

  // AI Tags state (Lifted from ApplyTab)
  const [suggestedTags, setSuggestedTags] = useState<SuggestedTag[]>([]);
  const [tagGroups, setTagGroups] = useState<TagGroup[]>([]);
  const [tagInsights, setTagInsights] = useState<TagInsight[]>([]);
  const [tagsGenerated, setTagsGenerated] = useState(false);

  // Apply state - expanded sections for final review
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    identity: true,
    contact: false,
    social: false,
    brand: false,
    audience: false,
    competitive: false,
    credentials: false,
    team: false,
    industry: false,
    success: false,
    knowledge: false,
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

  // Load tags from local storage on mount (Prevent regeneration on refresh)
  useEffect(() => {
    if (userPartnerId && !tagsGenerated) {
      const savedTags = localStorage.getItem(`centy_import_tags_${userPartnerId}`);
      if (savedTags) {
        try {
          const parsed = JSON.parse(savedTags);
          if (parsed && Array.isArray(parsed.tags) && parsed.tags.length > 0) {
            setSuggestedTags(parsed.tags);
            setTagGroups(parsed.groups || []);
            setTagInsights(parsed.insights || []);
            setTagsGenerated(true);
            console.log('[ImportCenter] Restored AI tags from local storage');
          }
        } catch (e) {
          console.error('[ImportCenter] Failed to parse saved tags', e);
        }
      }
    }
  }, [userPartnerId, tagsGenerated]);

  // Save tags to local storage when generated
  useEffect(() => {
    if (userPartnerId && tagsGenerated && suggestedTags.length > 0) {
      localStorage.setItem(`centy_import_tags_${userPartnerId}`, JSON.stringify({
        tags: suggestedTags,
        groups: tagGroups,
        insights: tagInsights,
        timestamp: new Date().toISOString()
      }));
    }
  }, [userPartnerId, tagsGenerated, suggestedTags, tagGroups, tagInsights]);

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
  // BUILD MERGE FIELDS (Using Field Registry)
  // ========================================

  useEffect(() => {
    if (googleImported || websiteImported) {
      buildMergeFields();
      extractTestimonials();
      generateSuggestions();
    }
  }, [googleRawData, websiteRawData, googleImported, websiteImported, partnerIndustry, partnerCountry]);

  const buildMergeFields = () => {
    // Build sources object
    const sources: Partial<Record<ImportSource, any>> = {};
    if (googleRawData) sources.google = googleRawData;
    if (websiteRawData) sources.website = websiteRawData;

    // Build taxonomy for filtering
    const taxonomy = {
      industry: partnerIndustry || undefined,
      country: partnerCountry || undefined,
    };

    // Use field registry to build merge fields
    const fields = buildMergeFieldsFromRegistry(sources, taxonomy);
    setMergeFields(fields);
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
    const newSuggestions: AISuggestion[] = [];

    // Check tagline - use definition.targetPath instead of key
    const taglineField = mergeFields.find((f) => f.definition?.targetPath === 'personality.tagline');
    const tagline = taglineField?.finalValue;
    if (tagline && typeof tagline === 'string') {
      newSuggestions.push({
        id: 's1',
        type: 'improvement',
        priority: 'high',
        title: 'Strengthen Your Tagline',
        field: 'personality.tagline',
        current: tagline,
        suggested: tagline.includes('98%') ? tagline : `${tagline} | 98% Success Rate`,
        reason: 'Include specific numbers for credibility and trust.',
        category: 'core',
        applied: false,
      });
    }

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
    setGoogleSearchError(null);

    if (value.length < 3) {
      setGoogleResults([]);
      return;
    }

    setGoogleSearching(true);
    try {
      console.log('[ImportCenter] Searching for:', value);
      const result = await searchBusinessesAction(value);
      console.log('[ImportCenter] Search result:', { success: result.success, status: result.status, resultsCount: result.results?.length, error: result.error });

      if (!result.success) {
        setGoogleSearchError(result.error || 'Search failed');
        setGoogleResults([]);
        toast.error(result.error || 'Search failed');
      } else if (result.results && result.results.length > 0) {
        setGoogleResults(result.results);
        setGoogleSearchError(null);
      } else {
        setGoogleResults([]);
        if (result.status === 'ZERO_RESULTS') {
          setGoogleSearchError('No businesses found. Try a different search term.');
        } else if (result.status === 'OK') {
          setGoogleSearchError('No matching businesses found. Try a more specific name or location.');
        }
      }
    } catch (err: any) {
      console.error('Search error:', err);
      setGoogleSearchError(err.message || 'Search failed');
      toast.error('Search failed. Please try again.');
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

        const placeName = selectedPlace.mainText || selectedPlace.name || selectedPlace.description;

        const standardizedData = await standardizeGoogleImportData(
          result.profile,
          selectedPlace.placeId,
          placeName,
          {}
        );

        const importedDataUpdate = {
          importedData: {
            ...(persona.importedData || {}),
            google: {
              rawData: result.profile,
              importedAt: new Date().toISOString(),
              placeName,
              placeId: selectedPlace.placeId,
            },
          },
          standardizedImports: {
            ...(persona.standardizedImports || {}),
            google: standardizedData,
          },
          importHistory: {
            ...persona.importHistory,
            google: {
              lastImportedAt: new Date(),
              placeId: selectedPlace.placeId,
              placeName,
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

      const standardizedData = await standardizeWebsiteImportData(
        result.profile,
        websiteUrl,
        result.pagesScraped || [],
        {}
      );

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
        standardizedImports: {
          ...(persona.standardizedImports || {}),
          website: standardizedData,
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
    setGoogleSearchError(null);

    const updated = {
      importedData: {
        ...(persona.importedData || {}),
        google: undefined,
      },
      standardizedImports: {
        ...(persona.standardizedImports || {}),
        google: undefined,
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

    const updated = {
      importedData: {
        ...(persona.importedData || {}),
        website: undefined,
      },
      standardizedImports: {
        ...(persona.standardizedImports || {}),
        website: undefined,
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
      prev.map((f) => {
        if (f.definition?.targetPath === fieldKey) {
          const newValue = source === 'google'
            ? f.values?.google
            : source === 'website'
              ? f.values?.website
              : f.finalValue;
          return {
            ...f,
            selectedSource: source,
            finalValue: newValue,
          };
        }
        return f;
      })
    );
  };

  const handleStartEdit = (field: MergeField) => {
    const fieldKey = field.definition?.targetPath || '';
    setEditingField(fieldKey);
    setEditValue(Array.isArray(field.finalValue) ? field.finalValue.join(', ') : field.finalValue || '');
  };

  const handleSaveEdit = (fieldKey: string) => {
    setMergeFields((prev) =>
      prev.map((f) =>
        f.definition?.targetPath === fieldKey
          ? { ...f, finalValue: editValue, selectedSource: 'custom' as FieldSource, customValue: editValue }
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
  // APPLY TO PROFILE (Using Field Registry)
  // ========================================

  const handleApplyToProfile = async (selectedTags?: string[]) => {
    if (!partnerId) {
      toast.error('Partner ID not found');
      return;
    }

    setIsApplying(true);
    try {
      // Use field registry to apply merge fields to persona
      const { persona: newPersona, updatedPaths, metadata } = applyMergeFieldsToPersona(
        mergeFields,
        [],
        testimonials.filter(t => t.selected).map(t => ({
          id: t.id,
          quote: t.quote,
          author: t.author,
          rating: t.rating,
          date: t.date,
          sentiment: t.sentiment,
          selected: t.selected,
        }))
      );

      // Add AI-suggested tags if provided
      if (selectedTags && selectedTags.length > 0) {
        (newPersona as any).tags = selectedTags;
        if (!(newPersona as any).industrySpecificData) {
          (newPersona as any).industrySpecificData = {};
        }
        (newPersona as any).industrySpecificData.tags = selectedTags;
      }

      // Also use AI-powered transformation if available
      const rawMergedData = {
        ...googleRawData,
        ...websiteRawData,
      };

      const transformResult = await applyImportToProfileAction(rawMergedData, persona);

      if (transformResult.success && transformResult.profile) {
        // Merge AI-transformed data with field registry output
        const finalPersona = {
          ...transformResult.profile,
          ...newPersona,
          identity: {
            ...transformResult.profile.identity,
            ...(newPersona as any).identity,
          },
          personality: {
            ...transformResult.profile.personality,
            ...(newPersona as any).personality,
          },
          knowledge: {
            ...transformResult.profile.knowledge,
            ...(newPersona as any).knowledge,
          },
          customerProfile: {
            ...transformResult.profile.customerProfile,
            ...(newPersona as any).customerProfile,
          },
          webIntelligence: {
            ...transformResult.profile.webIntelligence,
            ...(newPersona as any).webIntelligence,
          },
          industrySpecificData: {
            ...transformResult.profile.industrySpecificData,
            ...(newPersona as any).industrySpecificData,
          },
          competitive: (newPersona as any).competitive,
          team: (newPersona as any).team,
          testimonials: (newPersona as any).testimonials,
          tags: (newPersona as any).tags,
        };

        // Fetch unmapped data (Other Useful Data) using server-side canonical logic
        try {
          const mappingResult = await mapStandardizedDataToCanonicalProfile(
            {
              google: persona.standardizedImports?.google,
              website: persona.standardizedImports?.website,
            },
            persona,
            { onlyChecked: true }
          );

          if (mappingResult.success && mappingResult.profile?.otherUsefulData) {
            const newItems = mappingResult.profile.otherUsefulData;
            const existingItems = persona.otherUsefulData || [];

            // Avoid duplicates by key (case-insensitive)
            const uniqueNewItems = newItems.filter((newItem: OtherUsefulDataItem) =>
              !existingItems.some((existing: OtherUsefulDataItem) => existing.key.toLowerCase() === newItem.key.toLowerCase())
            );

            finalPersona.otherUsefulData = [...existingItems, ...uniqueNewItems];
          }
        } catch (e) {
          console.error('Failed to map unmapped data:', e);
          // Non-blocking error, continue with saving mapped data
        }

        // Save via server action which does proper deep merging with existing data
        // NOTE: Removed savePersonaToFirestore call - it was using setDoc which replaces
        // the entire businessPersona object instead of deep merging, causing data loss
        const saveResult = await saveBusinessPersonaAction(partnerId, {
          ...finalPersona,
          _importMeta: metadata as any,

          importHistory: {
            ...persona.importHistory,
            lastAppliedAt: new Date(),
            appliedFields: updatedPaths,
            appliedProducts: 0,
            appliedTestimonials: testimonials.filter(t => t.selected).length,
            appliedSuggestions: suggestions.filter((s) => s.applied).map((s) => s.id),
            appliedTags: selectedTags?.length || 0,
          },
        });

        if (!saveResult.success) {
          throw new Error(saveResult.message || 'Failed to save to Firestore');
        }
      } else {
        // Fall back to just field registry output
        // Use server action for proper deep merging
        const saveResult = await saveBusinessPersonaAction(partnerId, {
          ...newPersona,
          _importMeta: metadata as any,

          importHistory: {
            ...persona.importHistory,
            lastAppliedAt: new Date(),
            appliedFields: updatedPaths,
            appliedProducts: 0,
            appliedTestimonials: testimonials.filter(t => t.selected).length,
            appliedSuggestions: suggestions.filter((s) => s.applied).map((s) => s.id),
            appliedTags: selectedTags?.length || 0,
          },
        });

        if (!saveResult.success) {
          throw new Error(saveResult.message || 'Failed to save to Firestore');
        }
      }

      setApplied(true);
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      console.error('Failed to apply to profile:', err);
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

    const countFields = (obj: any, prefix = ''): number => {
      if (!obj || typeof obj !== 'object') return obj ? 1 : 0;
      if (Array.isArray(obj)) return obj.length > 0 ? 1 : 0;
      return Object.entries(obj).reduce((count, [key, val]) => {
        if (val !== null && val !== undefined && val !== '') {
          if (typeof val === 'object' && !Array.isArray(val)) {
            return count + countFields(val, `${prefix}${key}.`);
          }
          return count + 1;
        }
        return count;
      }, 0);
    };

    const fieldCount = countFields(googleRawData.identity) +
      countFields(googleRawData.personality) +
      countFields(googleRawData.customerProfile) +
      countFields(googleRawData.knowledge) +
      countFields(googleRawData.industrySpecificData);

    const testimonialCount = (googleRawData.reviews || []).length +
      (googleRawData.testimonials || []).length;

    return { fields: fieldCount || 10, products: 0, testimonials: testimonialCount };
  }, [googleRawData]);

  const websiteStats: ImportStats = useMemo(() => {
    if (!websiteRawData) return { fields: 0, products: 0, testimonials: 0 };

    const countFields = (obj: any): number => {
      if (!obj || typeof obj !== 'object') return obj ? 1 : 0;
      if (Array.isArray(obj)) return obj.length > 0 ? 1 : 0;
      return Object.entries(obj).reduce((count, [key, val]) => {
        if (val !== null && val !== undefined && val !== '') {
          if (typeof val === 'object' && !Array.isArray(val)) {
            return count + countFields(val);
          }
          return count + 1;
        }
        return count;
      }, 0);
    };

    const fieldCount = countFields(websiteRawData.identity) +
      countFields(websiteRawData.personality) +
      countFields(websiteRawData.customerProfile) +
      countFields(websiteRawData.knowledge) +
      countFields(websiteRawData.industrySpecificData);

    const testimonialCount = (websiteRawData.testimonials || []).length;

    return { fields: fieldCount || 18, products: 0, testimonials: testimonialCount };
  }, [websiteRawData]);

  const conflictCount = mergeFields.filter((f) => f.hasConflict).length;
  const resolvedCount = mergeFields.filter((f) => f.hasConflict && f.selectedSource !== 'none').length;
  const hasUnresolvedConflicts = conflictCount > resolvedCount;
  const filledFields = mergeFields.filter((f) => f.finalValue).length;

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
            products: 0,
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
                className={`px-3 py-3 text-sm font-medium border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-all ${activeTab === tab.id
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
                    className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${tab.badgeType === 'warning'
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
            googleSearchError={googleSearchError}
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
            products={[]}
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
            suggestedTags={suggestedTags}
            setSuggestedTags={setSuggestedTags}
            tagGroups={tagGroups}
            setTagGroups={setTagGroups}
            tagInsights={tagInsights}
            setTagInsights={setTagInsights}
            tagsGenerated={tagsGenerated}
            setTagsGenerated={setTagsGenerated}
          />
        )}
      </div>
    </div>
  );
}
