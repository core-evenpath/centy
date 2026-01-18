'use client';

import React from 'react';
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
} from 'lucide-react';
import { ReviewAccordionSection } from '../cards';
import { ReviewFieldRow, ReviewProductRow, ReviewTestimonialRow } from '../rows';
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
  onApply: () => void;
}

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
  const identityFields = mergeFields.filter((f) => f.category === 'identity');
  const contactFields = mergeFields.filter((f) => f.category === 'contact');
  const industryFields = mergeFields.filter((f) => f.category === 'industry');

  const selectedProducts = products.filter((p) => p.selected);
  const selectedTestimonials = testimonials.filter((t) => t.selected);
  const highlightedTestimonials = testimonials.filter((t) => t.highlighted);
  const appliedSuggestions = suggestions.filter((s) => s.applied);
  const filledFields = mergeFields.filter((f) => f.finalValue).length;

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
            </p>
          </div>
          <button
            onClick={onApply}
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
