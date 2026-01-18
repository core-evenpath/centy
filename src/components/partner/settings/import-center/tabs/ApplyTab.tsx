'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Rocket,
  FileText,
  Package,
  Quote,
  Wand2,
  AlertTriangle,
  Lightbulb,
  Building2,
  Phone,
  GraduationCap,
  CheckCircle2,
  Loader2,
  Tags,
  Sparkles,
  RefreshCw,
  X,
} from 'lucide-react';
import { ReviewAccordionSection } from '../cards';
import { ReviewFieldRow, ReviewProductRow, ReviewTestimonialRow } from '../rows';
import { generateProfileTagsAction, type SuggestedTag } from '@/actions/profile-tags-actions';
import type { MergeField, ImportedProduct, EnrichedTestimonial, AISuggestion, ImportCenterTab } from '../types';

interface ApplyTabProps {
  mergeFields: MergeField[];
  products: ImportedProduct[];
  testimonials: EnrichedTestimonial[];
  suggestions: AISuggestion[];
  expandedSections: Record<string, boolean>;
  hasUnresolvedConflicts: boolean;
  highPrioritySuggestions: AISuggestion[];
  isApplying: boolean;
  onToggleSection: (section: string) => void;
  onNavigateToTab: (tab: ImportCenterTab) => void;
  onApply: (selectedTags?: string[]) => void;
}

// Tag category colors
const tagCategoryColors: Record<string, { bg: string; text: string; border: string }> = {
  industry: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  service: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  specialty: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  audience: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  location: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  feature: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  benefit: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
};

export function ApplyTab({
  mergeFields,
  products,
  testimonials,
  suggestions,
  expandedSections,
  hasUnresolvedConflicts,
  highPrioritySuggestions,
  isApplying,
  onToggleSection,
  onNavigateToTab,
  onApply,
}: ApplyTabProps) {
  const [suggestedTags, setSuggestedTags] = useState<SuggestedTag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [tagsError, setTagsError] = useState<string | null>(null);
  const [tagsGenerated, setTagsGenerated] = useState(false);

  const identityFields = mergeFields.filter((f) => f.category === 'identity');
  const contactFields = mergeFields.filter((f) => f.category === 'contact');
  const industryFields = mergeFields.filter((f) => f.category === 'industry');

  const selectedProducts = products.filter((p) => p.selected);
  const selectedTestimonials = testimonials.filter((t) => t.selected);
  const highlightedTestimonials = testimonials.filter((t) => t.highlighted);
  const appliedSuggestions = suggestions.filter((s) => s.applied);
  const filledFields = mergeFields.filter((f) => f.finalValue).length;

  // Build profile data for tag generation
  const buildProfileData = useCallback(() => {
    const getFieldValue = (key: string) => {
      const field = mergeFields.find(f => f.key === key || f.key.endsWith(key));
      return field?.finalValue;
    };

    return {
      businessName: getFieldValue('businessName') as string,
      industry: getFieldValue('industry') as string,
      subIndustry: getFieldValue('subIndustry') as string,
      description: getFieldValue('description') as string,
      shortDescription: getFieldValue('shortDescription') as string,
      tagline: getFieldValue('tagline') as string,
      services: (getFieldValue('services') || getFieldValue('productsOrServices')) as string[],
      products: selectedProducts.map(p => ({
        name: p.name,
        category: p.category,
        description: p.description,
      })),
      targetAudience: getFieldValue('targetAudience') as string[],
      uniqueSellingPoints: getFieldValue('uniqueSellingPoints') as string[],
      specializations: getFieldValue('specializations') as string[],
      differentiators: getFieldValue('differentiators') as string[],
      areasServed: getFieldValue('areasServed') as string[],
      location: {
        city: getFieldValue('address.city') as string,
        state: getFieldValue('address.state') as string,
        country: getFieldValue('address.country') as string,
      },
    };
  }, [mergeFields, selectedProducts]);

  // Generate tags
  const handleGenerateTags = useCallback(async () => {
    setIsGeneratingTags(true);
    setTagsError(null);

    try {
      const profileData = buildProfileData();
      const result = await generateProfileTagsAction(profileData);

      if (result.success && result.tags) {
        setSuggestedTags(result.tags);
        // Auto-select high confidence tags
        const autoSelected = new Set(
          result.tags.filter(t => t.confidence >= 0.8).map(t => t.tag)
        );
        setSelectedTags(autoSelected);
        setTagsGenerated(true);
      } else {
        setTagsError(result.error || 'Failed to generate tags');
      }
    } catch (error: any) {
      setTagsError(error.message || 'Failed to generate tags');
    } finally {
      setIsGeneratingTags(false);
    }
  }, [buildProfileData]);

  // Auto-generate tags on mount if we have enough data
  useEffect(() => {
    if (!tagsGenerated && filledFields >= 3 && !isGeneratingTags) {
      handleGenerateTags();
    }
  }, [filledFields, tagsGenerated, isGeneratingTags, handleGenerateTags]);

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tag)) {
        newSet.delete(tag);
      } else {
        newSet.add(tag);
      }
      return newSet;
    });
  };

  // Handle apply with tags
  const handleApply = () => {
    onApply(Array.from(selectedTags));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-4">
          <Rocket className="w-4 h-4" /> Final Step
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
          Review & Apply to Profile
        </h2>
        <p className="text-slate-500 max-w-xl mx-auto">
          Everything below will be saved to your business profile and used by your AI assistant.
        </p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4 text-center">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-2">
            <FileText className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{filledFields}</p>
          <p className="text-xs text-slate-500">Fields</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-2">
            <Package className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{selectedProducts.length}</p>
          <p className="text-xs text-slate-500">Products</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2">
            <Quote className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{selectedTestimonials.length}</p>
          <p className="text-xs text-slate-500">Testimonials</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-2">
            <Wand2 className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{appliedSuggestions.length}</p>
          <p className="text-xs text-slate-500">AI Applied</p>
        </div>
      </div>

      {/* AI Suggested Tags Section */}
      <div className="bg-white rounded-2xl border p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Tags className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                AI Suggested Tags
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-100 text-violet-700 text-xs rounded-full font-medium">
                  <Sparkles className="w-3 h-3" /> AI
                </span>
              </h3>
              <p className="text-sm text-slate-500">
                Tags help categorize your business and improve AI responses
              </p>
            </div>
          </div>
          <button
            onClick={handleGenerateTags}
            disabled={isGeneratingTags}
            className="p-2 text-slate-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors disabled:opacity-50"
            title="Regenerate tags"
          >
            <RefreshCw className={`w-5 h-5 ${isGeneratingTags ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Loading State */}
        {isGeneratingTags && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3 text-violet-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">Analyzing profile and generating tags...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {tagsError && !isGeneratingTags && (
          <div className="flex items-center gap-3 py-4 px-4 bg-red-50 rounded-xl text-red-700">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{tagsError}</span>
            <button
              onClick={handleGenerateTags}
              className="ml-auto text-sm font-medium hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Tags Display */}
        {!isGeneratingTags && suggestedTags.length > 0 && (
          <div className="space-y-4">
            {/* Selected count */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">
                {selectedTags.size} of {suggestedTags.length} tags selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedTags(new Set(suggestedTags.map(t => t.tag)))}
                  className="text-violet-600 hover:underline"
                >
                  Select all
                </button>
                <span className="text-slate-300">|</span>
                <button
                  onClick={() => setSelectedTags(new Set())}
                  className="text-slate-500 hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Tags Grid */}
            <div className="flex flex-wrap gap-2">
              {suggestedTags.map((tag) => {
                const isSelected = selectedTags.has(tag.tag);
                const colors = tagCategoryColors[tag.category] || tagCategoryColors.feature;

                return (
                  <button
                    key={tag.tag}
                    onClick={() => toggleTag(tag.tag)}
                    title={tag.reason}
                    className={`
                      group relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                      transition-all duration-200 border-2
                      ${isSelected
                        ? `${colors.bg} ${colors.text} ${colors.border}`
                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
                      }
                    `}
                  >
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {tag.tag}
                    {isSelected && (
                      <X className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Category Legend */}
            <div className="flex flex-wrap gap-3 pt-3 border-t text-xs">
              {Object.entries(tagCategoryColors).map(([category, colors]) => {
                const count = suggestedTags.filter(t => t.category === category).length;
                if (count === 0) return null;
                return (
                  <span key={category} className={`inline-flex items-center gap-1 px-2 py-1 rounded ${colors.bg} ${colors.text}`}>
                    <span className="w-2 h-2 rounded-full bg-current opacity-60" />
                    {category} ({count})
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isGeneratingTags && !tagsError && suggestedTags.length === 0 && (
          <div className="text-center py-8">
            <Tags className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 mb-3">No tags generated yet</p>
            <button
              onClick={handleGenerateTags}
              className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700"
            >
              Generate Tags
            </button>
          </div>
        )}
      </div>

      {/* Warning Banners */}
      {hasUnresolvedConflicts && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-red-900">Unresolved Conflicts</p>
            <p className="text-sm text-red-700">
              You have conflicts to resolve before applying.
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('merge')}
            className="px-4 py-2 bg-red-600 text-white rounded-xl font-semibold"
          >
            Resolve Now
          </button>
        </div>
      )}

      {highPrioritySuggestions.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-6 h-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-amber-900">
              {highPrioritySuggestions.length} High Priority Suggestions
            </p>
            <p className="text-sm text-amber-700">
              Consider applying these to improve your AI&apos;s performance.
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('ai')}
            className="px-4 py-2 bg-amber-600 text-white rounded-xl font-semibold"
          >
            Review
          </button>
        </div>
      )}

      {/* Accordion Sections */}
      <div className="space-y-4">
        {/* Brand Identity */}
        <ReviewAccordionSection
          title="Brand Identity"
          icon={Building2}
          count={`${identityFields.filter((f) => f.finalValue).length} fields`}
          status="complete"
          isExpanded={expandedSections.identity || false}
          onToggle={() => onToggleSection('identity')}
          onEdit={() => onNavigateToTab('merge')}
          previewContent={
            identityFields.find((f) => f.key === 'identity.businessName')?.finalValue as string
          }
        >
          <div className="pt-4">
            {identityFields.map((f) => (
              <ReviewFieldRow
                key={f.key}
                label={f.label}
                value={f.finalValue}
                source={f.selectedSource}
                icon={f.icon}
              />
            ))}
          </div>
        </ReviewAccordionSection>

        {/* Contact */}
        <ReviewAccordionSection
          title="Contact Information"
          icon={Phone}
          count={`${contactFields.filter((f) => f.finalValue).length} fields`}
          status="complete"
          isExpanded={expandedSections.contact || false}
          onToggle={() => onToggleSection('contact')}
          onEdit={() => onNavigateToTab('merge')}
          previewContent={contactFields.find((f) => f.key === 'contact.phone')?.finalValue as string}
        >
          <div className="pt-4">
            {contactFields.map((f) => (
              <ReviewFieldRow
                key={f.key}
                label={f.label}
                value={f.finalValue}
                source={f.selectedSource}
                icon={f.icon}
              />
            ))}
          </div>
        </ReviewAccordionSection>

        {/* Industry Metrics */}
        {industryFields.length > 0 && (
          <ReviewAccordionSection
            title="Industry Metrics"
            icon={GraduationCap}
            count={`${industryFields.filter((f) => f.finalValue).length} fields`}
            status="complete"
            isExpanded={expandedSections.industry || false}
            onToggle={() => onToggleSection('industry')}
            onEdit={() => onNavigateToTab('merge')}
            previewContent={
              industryFields.find((f) => f.key.includes('visaSuccess'))?.finalValue as string
            }
          >
            <div className="pt-4">
              {industryFields.map((f) => (
                <ReviewFieldRow
                  key={f.key}
                  label={f.label}
                  value={f.finalValue}
                  source={f.selectedSource}
                  icon={f.icon}
                />
              ))}
            </div>
          </ReviewAccordionSection>
        )}

        {/* Products */}
        <ReviewAccordionSection
          title="Products & Services"
          icon={Package}
          count={`${selectedProducts.length} selected`}
          status={selectedProducts.length > 0 ? 'complete' : 'warning'}
          isExpanded={expandedSections.products || false}
          onToggle={() => onToggleSection('products')}
          onEdit={() => onNavigateToTab('products')}
          previewContent={selectedProducts
            .slice(0, 2)
            .map((p) => p.name)
            .join(', ')}
        >
          <div className="pt-4">
            {selectedProducts.map((p) => (
              <ReviewProductRow key={p.id} product={p} />
            ))}
          </div>
        </ReviewAccordionSection>

        {/* Testimonials */}
        <ReviewAccordionSection
          title="Testimonials"
          icon={Quote}
          count={`${selectedTestimonials.length} selected`}
          status={selectedTestimonials.length > 0 ? 'complete' : 'warning'}
          isExpanded={expandedSections.testimonials || false}
          onToggle={() => onToggleSection('testimonials')}
          onEdit={() => onNavigateToTab('testimonials')}
          previewContent={`${highlightedTestimonials.length} highlighted`}
        >
          <div className="pt-4">
            {selectedTestimonials.map((t) => (
              <ReviewTestimonialRow key={t.id} testimonial={t} />
            ))}
          </div>
        </ReviewAccordionSection>

        {/* AI Suggestions */}
        {appliedSuggestions.length > 0 && (
          <ReviewAccordionSection
            title="AI Improvements"
            icon={Wand2}
            count={`${appliedSuggestions.length} applied`}
            status="complete"
            isExpanded={expandedSections.suggestions || false}
            onToggle={() => onToggleSection('suggestions')}
            onEdit={() => onNavigateToTab('ai')}
            previewContent={appliedSuggestions.map((s) => s.title).join(', ')}
          >
            <div className="pt-4 space-y-2">
              {appliedSuggestions.map((s) => (
                <div key={s.id} className="flex items-center gap-2 py-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm text-slate-700">{s.title}</span>
                </div>
              ))}
            </div>
          </ReviewAccordionSection>
        )}
      </div>

      {/* Apply CTA */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-6 mt-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-white text-center sm:text-left">
            <h3 className="font-bold text-xl mb-1">Ready to Apply?</h3>
            <p className="text-white/80">
              Your AI assistant will use this data to serve customers.
              {selectedTags.size > 0 && (
                <span className="block mt-1 text-white/90">
                  Including {selectedTags.size} tags for better categorization.
                </span>
              )}
            </p>
          </div>
          <button
            onClick={handleApply}
            disabled={hasUnresolvedConflicts || isApplying}
            className={`w-full sm:w-auto px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 text-lg transition-all ${
              hasUnresolvedConflicts
                ? 'bg-white/30 text-white/70 cursor-not-allowed'
                : 'bg-white text-indigo-700 hover:bg-indigo-50 shadow-xl'
            }`}
          >
            {isApplying ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Applying...
              </>
            ) : (
              <>
                <Rocket className="w-5 h-5" /> Apply to Profile
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
