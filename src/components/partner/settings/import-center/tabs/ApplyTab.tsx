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
  Plus,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Target,
  Zap,
  Users,
  MapPin,
  Gift,
  DollarSign,
  Award,
  Clock,
  ShieldCheck,
  Cpu,
  Compass,
  Star,
  Briefcase,
  Info,
  Search,
  Mail,
  Globe,
  MessageCircle,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Youtube,
  Store,
  Eye,
  Heart,
  BookOpen,
  BarChart2,
  HelpCircle,
  AlertCircle,
  Shield,
  Trophy,
  CheckCircle,
  FileCheck,
  UserCircle,
  CreditCard,
  Calendar,
  Hash,
  Map,
  Share2,
  MessageSquare,
  AlignLeft,
  Pill,
  Building,
  Smartphone,
  Stethoscope,
  Home,
  Receipt,
  BedDouble,
  TestTube2,
  Siren,
  Video,
  UtensilsCrossed,
  Utensils,
  Leaf,
  Truck,
  Grid,
  Tag,
  RotateCcw,
  ShoppingCart,
  Link,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ReviewAccordionSection } from '../cards';
import { ReviewFieldRow, ReviewTestimonialRow } from '../rows';
import {
  generateProfileTagsAction,
} from '@/actions/profile-tags-actions';
import {
  type SuggestedTag,
  type TagGroup,
  type TagInsight,
  type TagCategory,
  TAG_CATEGORY_META,
} from '@/lib/profile-tags-types';
import type { MergeField, EnrichedTestimonial, AISuggestion, ImportCenterTab } from '../types';

// Icon mapping from string names to Lucide icons
const ICON_MAP: Record<string, LucideIcon> = {
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  Clock,
  MessageCircle,
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Youtube,
  Store,
  Target,
  Eye,
  Heart,
  Star,
  BookOpen,
  Quote,
  Users,
  BarChart2,
  HelpCircle,
  AlertCircle,
  TrendingUp,
  Zap,
  Shield,
  Compass,
  DollarSign,
  Award,
  Trophy,
  CheckCircle,
  FileCheck,
  FileText,
  UserCircle,
  Briefcase,
  Package,
  CreditCard,
  Calendar,
  Hash,
  Map,
  Share2,
  MessageSquare,
  AlignLeft,
  ShieldCheck,
  Pill,
  Building,
  Smartphone,
  Stethoscope,
  Home,
  Receipt,
  BedDouble,
  TestTube2,
  Siren,
  Video,
  UtensilsCrossed,
  Utensils,
  Leaf,
  Truck,
  Grid,
  Tag,
  RotateCcw,
  ShoppingCart,
  GraduationCap,
  Link,
  Sparkles: Star, // Fallback
  IdCard: CreditCard, // Fallback
};

// Helper to get icon from field
function getFieldIcon(field: MergeField): LucideIcon {
  const iconName = field.definition?.iconName || 'FileText';
  return ICON_MAP[iconName] || FileText;
}

// Helper to get field key (targetPath)
function getFieldKey(field: MergeField): string {
  return field.definition?.targetPath || '';
}

// Helper to get field label
function getFieldLabel(field: MergeField): string {
  return field.definition?.label || 'Unknown';
}

// Helper to get field category
function getFieldCategory(field: MergeField): string {
  return field.definition?.category || 'knowledge';
}

interface ApplyTabProps {
  mergeFields: MergeField[];
  testimonials: EnrichedTestimonial[];
  suggestions: AISuggestion[];
  expandedSections: Record<string, boolean>;
  hasUnresolvedConflicts: boolean;
  highPrioritySuggestions: AISuggestion[];
  isApplying: boolean;
  onToggleSection: (section: string) => void;
  onNavigateToTab: (tab: ImportCenterTab) => void;
  onApply: (selectedTags?: string[]) => void;
  // Lifted state props
  suggestedTags: SuggestedTag[];
  setSuggestedTags: (tags: SuggestedTag[]) => void;
  tagGroups: TagGroup[];
  setTagGroups: (groups: TagGroup[]) => void;
  tagInsights: TagInsight[];
  setTagInsights: (insights: TagInsight[]) => void;
  tagsGenerated: boolean;
  setTagsGenerated: (generated: boolean) => void;
}

// Category icons mapping
const categoryIcons: Record<TagCategory, React.ElementType> = {
  industry: Building2,
  service: Briefcase,
  product: Package,
  specialty: Star,
  audience: Users,
  location: MapPin,
  feature: Zap,
  benefit: Gift,
  pricing: DollarSign,
  quality: Award,
  experience: Clock,
  certification: ShieldCheck,
  technology: Cpu,
  methodology: Compass,
};

// Tag category colors - more variety
const tagCategoryColors: Record<TagCategory, { bg: string; text: string; border: string; badge: string }> = {
  industry: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', badge: 'bg-blue-100' },
  service: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', badge: 'bg-emerald-100' },
  product: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', badge: 'bg-teal-100' },
  specialty: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', badge: 'bg-purple-100' },
  audience: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', badge: 'bg-amber-100' },
  location: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', badge: 'bg-rose-100' },
  feature: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', badge: 'bg-cyan-100' },
  benefit: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', badge: 'bg-indigo-100' },
  pricing: { bg: 'bg-lime-50', text: 'text-lime-700', border: 'border-lime-200', badge: 'bg-lime-100' },
  quality: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', badge: 'bg-orange-100' },
  experience: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', badge: 'bg-slate-100' },
  certification: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', badge: 'bg-green-100' },
  technology: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', badge: 'bg-violet-100' },
  methodology: { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', border: 'border-fuchsia-200', badge: 'bg-fuchsia-100' },
};

// Importance badge colors
const importanceBadgeColors = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-slate-100 text-slate-600',
};

export function ApplyTab({
  mergeFields,
  testimonials,
  suggestions,
  expandedSections,
  hasUnresolvedConflicts,
  highPrioritySuggestions,
  isApplying,
  onToggleSection,
  onNavigateToTab,
  onApply,
  // Lifted state props
  suggestedTags,
  setSuggestedTags,
  tagGroups,
  setTagGroups,
  tagInsights,
  setTagInsights,
  tagsGenerated,
  setTagsGenerated,
}: ApplyTabProps) {
  // Local UI state
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [newCustomTag, setNewCustomTag] = useState('');
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [tagsError, setTagsError] = useState<string | null>(null);

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['industry', 'service', 'audience']));
  const [showAllGroups, setShowAllGroups] = useState(false);
  const [hoveredTag, setHoveredTag] = useState<string | null>(null);

  // Filter fields by category using the new structure
  const identityFields = mergeFields.filter((f) => getFieldCategory(f) === 'identity');
  const contactFields = mergeFields.filter((f) => getFieldCategory(f) === 'contact');
  const industryFields = mergeFields.filter((f) => getFieldCategory(f) === 'industry');

  const selectedTestimonials = testimonials.filter((t) => t.selected);
  const highlightedTestimonials = testimonials.filter((t) => t.highlighted);
  const appliedSuggestions = suggestions.filter((s) => s.applied);
  const filledFields = mergeFields.filter((f) => f.finalValue).length;

  // Build profile data for tag generation
  const buildProfileData = useCallback(() => {
    const getFieldValue = (targetPath: string) => {
      const field = mergeFields.find(f => {
        const path = getFieldKey(f);
        return path === targetPath || path.endsWith(targetPath);
      });
      return field?.finalValue;
    };

    return {
      businessName: getFieldValue('identity.name') as string,
      industry: getFieldValue('industry') as string,
      subIndustry: getFieldValue('industry.subCategory') as string,
      description: getFieldValue('personality.description') as string,
      shortDescription: getFieldValue('personality.description') as string,
      tagline: getFieldValue('personality.tagline') as string,
      missionStatement: getFieldValue('personality.missionStatement') as string,
      services: getFieldValue('knowledge.services') as string[],
      products: [],
      targetAudience: getFieldValue('customerProfile.targetAudience') as string[],
      uniqueSellingPoints: getFieldValue('personality.uniqueSellingPoints') as string[],
      specializations: getFieldValue('industrySpecificData.specializations') as string[],
      differentiators: getFieldValue('competitive.differentiators') as string[],
      areasServed: getFieldValue('identity.serviceArea') as string[],
      brandValues: getFieldValue('personality.brandValues') as string[],
      location: {
        city: getFieldValue('identity.address.city') as string,
        state: getFieldValue('identity.address.state') as string,
        country: getFieldValue('identity.address.country') as string,
      },
      testimonials: selectedTestimonials.map(t => ({
        quote: t.quote,
        rating: t.rating,
      })),
      yearEstablished: getFieldValue('identity.yearEstablished') as number,
    };
  }, [mergeFields, selectedTestimonials]);

  // Generate tags
  const handleGenerateTags = useCallback(async () => {
    setIsGeneratingTags(true);
    setTagsError(null);

    try {
      const profileData = buildProfileData();
      const result = await generateProfileTagsAction(profileData);

      if (result.success && result.tags) {
        setSuggestedTags(result.tags);
        setTagGroups(result.groups || []);
        setTagInsights(result.insights || []);

        // Auto-select high confidence tags
        const autoSelected = new Set(
          result.tags.filter(t => t.confidence >= 0.85).map(t => t.tag)
        );
        setSelectedTags(autoSelected);
        setTagsGenerated(true);

        // Expand groups with selected tags
        const groupsWithSelected = new Set(
          result.tags.filter(t => t.confidence >= 0.85).map(t => t.category)
        );
        setExpandedGroups(prev => new Set([...prev, ...groupsWithSelected]));
      } else {
        setTagsError(result.error || 'Failed to generate tags');
      }
    } catch (error: any) {
      setTagsError(error.message || 'Failed to generate tags');
    } finally {
      setIsGeneratingTags(false);
    }
  }, [buildProfileData]);

  // Auto-generate tags on mount only if we have no tags yet
  useEffect(() => {
    if (!tagsGenerated && suggestedTags.length === 0 && filledFields >= 3 && !isGeneratingTags) {
      handleGenerateTags();
    }
  }, [filledFields, tagsGenerated, suggestedTags.length, isGeneratingTags, handleGenerateTags]);



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

  // Toggle group expansion
  const toggleGroup = (category: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // Add custom tag
  const handleAddCustomTag = () => {
    const tag = newCustomTag.toLowerCase().trim();
    if (tag && !customTags.includes(tag) && !suggestedTags.some(t => t.tag === tag)) {
      setCustomTags(prev => [...prev, tag]);
      setSelectedTags(prev => new Set([...prev, tag]));
      setNewCustomTag('');
    }
  };

  // Remove custom tag
  const removeCustomTag = (tag: string) => {
    setCustomTags(prev => prev.filter(t => t !== tag));
    setSelectedTags(prev => {
      const newSet = new Set(prev);
      newSet.delete(tag);
      return newSet;
    });
  };

  // Handle apply with tags
  const handleApply = () => {
    onApply(Array.from(selectedTags));
  };

  // Get visible groups based on showAllGroups
  const visibleGroups = showAllGroups
    ? tagGroups
    : tagGroups.filter(g => g.importance === 'critical' || g.importance === 'high' || expandedGroups.has(g.category));

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

      {/* AI Suggested Tags Section - Enhanced */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b bg-gradient-to-r from-violet-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Tags className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                  AI Suggested Tags
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-100 text-violet-700 text-xs rounded-full font-medium">
                    <Sparkles className="w-3 h-3" /> AI Powered
                  </span>
                </h3>
                <p className="text-sm text-slate-500">
                  Strategic tags to improve discoverability and AI accuracy
                </p>
              </div>
            </div>
            <button
              onClick={handleGenerateTags}
              disabled={isGeneratingTags}
              className="p-2.5 text-violet-600 hover:bg-violet-100 rounded-xl transition-colors disabled:opacity-50 border border-violet-200"
              title="Regenerate tags"
            >
              <RefreshCw className={`w-5 h-5 ${isGeneratingTags ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Quick Stats */}
          {suggestedTags.length > 0 && (
            <div className="flex items-center gap-4 mt-4 text-sm">
              <span className="flex items-center gap-1.5 text-violet-700">
                <CheckCircle2 className="w-4 h-4" />
                <strong>{selectedTags.size}</strong> selected
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-600">
                {suggestedTags.length} AI suggestions
              </span>
              {customTags.length > 0 && (
                <>
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-600">
                    {customTags.length} custom
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Loading State */}
        {isGeneratingTags && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mb-4">
              <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
            </div>
            <p className="text-sm font-medium text-violet-700 mb-1">Analyzing your business profile...</p>
            <p className="text-xs text-slate-500">Generating strategic tags based on your data</p>
          </div>
        )}

        {/* Error State */}
        {tagsError && !isGeneratingTags && (
          <div className="m-5 flex items-center gap-3 py-4 px-4 bg-red-50 rounded-xl border border-red-200">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-sm text-red-700">{tagsError}</span>
            <button
              onClick={handleGenerateTags}
              className="ml-auto px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Tags Content */}
        {!isGeneratingTags && suggestedTags.length > 0 && (
          <div className="p-5 space-y-5">
            {/* Insights Panel */}
            {tagInsights.length > 0 && (
              <div className="space-y-2">
                {tagInsights.map((insight, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 p-3 rounded-xl text-sm ${insight.type === 'warning'
                      ? 'bg-amber-50 border border-amber-200'
                      : insight.type === 'opportunity'
                        ? 'bg-emerald-50 border border-emerald-200'
                        : 'bg-blue-50 border border-blue-200'
                      }`}
                  >
                    {insight.type === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    ) : insight.type === 'opportunity' ? (
                      <TrendingUp className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Lightbulb className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className={`font-medium ${insight.type === 'warning' ? 'text-amber-800' :
                        insight.type === 'opportunity' ? 'text-emerald-800' : 'text-blue-800'
                        }`}>
                        {insight.title}
                      </p>
                      <p className={`mt-0.5 ${insight.type === 'warning' ? 'text-amber-700' :
                        insight.type === 'opportunity' ? 'text-emerald-700' : 'text-blue-700'
                        }`}>
                        {insight.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex items-center justify-between text-sm border-b pb-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedTags(new Set([...suggestedTags.map(t => t.tag), ...customTags]))}
                  className="px-3 py-1.5 text-violet-600 hover:bg-violet-50 rounded-lg font-medium transition-colors"
                >
                  Select All
                </button>
                <button
                  onClick={() => setSelectedTags(new Set())}
                  className="px-3 py-1.5 text-slate-500 hover:bg-slate-50 rounded-lg font-medium transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={() => {
                    const highConf = new Set(suggestedTags.filter(t => t.confidence >= 0.85).map(t => t.tag));
                    setSelectedTags(highConf);
                  }}
                  className="px-3 py-1.5 text-slate-500 hover:bg-slate-50 rounded-lg font-medium transition-colors"
                >
                  Select High Confidence
                </button>
              </div>
              <button
                onClick={() => setShowAllGroups(!showAllGroups)}
                className="text-violet-600 hover:underline"
              >
                {showAllGroups ? 'Show Important Only' : `Show All Categories (${tagGroups.length})`}
              </button>
            </div>

            {/* Grouped Tags */}
            <div className="space-y-3">
              {visibleGroups.map((group) => {
                const Icon = categoryIcons[group.category] || Tags;
                const colors = tagCategoryColors[group.category];
                const isExpanded = expandedGroups.has(group.category);
                const selectedInGroup = group.tags.filter(t => selectedTags.has(t.tag)).length;

                return (
                  <div
                    key={group.category}
                    className={`border rounded-xl overflow-hidden ${colors.border}`}
                  >
                    {/* Group Header */}
                    <button
                      onClick={() => toggleGroup(group.category)}
                      className={`w-full flex items-center gap-3 p-3 ${colors.bg} hover:opacity-90 transition-opacity`}
                    >
                      <div className={`w-8 h-8 ${colors.badge} rounded-lg flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${colors.text}`} />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${colors.text}`}>{group.label}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${importanceBadgeColors[group.importance]}`}>
                            {group.importance}
                          </span>
                          <span className="text-xs text-slate-500">
                            {selectedInGroup}/{group.tags.length} selected
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{group.description}</p>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      )}
                    </button>

                    {/* Group Tags */}
                    {isExpanded && (
                      <div className="p-3 bg-white">
                        <div className="flex flex-wrap gap-2">
                          {group.tags.map((tag) => {
                            const isSelected = selectedTags.has(tag.tag);
                            const isHovered = hoveredTag === tag.tag;

                            return (
                              <div key={tag.tag} className="relative">
                                <button
                                  onClick={() => toggleTag(tag.tag)}
                                  onMouseEnter={() => setHoveredTag(tag.tag)}
                                  onMouseLeave={() => setHoveredTag(null)}
                                  className={`
                                    group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                                    transition-all duration-200 border
                                    ${isSelected
                                      ? `${colors.bg} ${colors.text} ${colors.border}`
                                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                    }
                                  `}
                                >
                                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                                  {tag.tag}
                                  {tag.searchVolume === 'high' && (
                                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                                  )}
                                  {isSelected && (
                                    <X className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  )}
                                </button>

                                {/* Tooltip */}
                                {isHovered && (
                                  <div className="absolute bottom-full left-0 mb-2 z-10 w-64 p-3 bg-slate-900 text-white text-xs rounded-lg shadow-xl">
                                    <p className="font-medium mb-1">{tag.tag}</p>
                                    <p className="text-slate-300 mb-2">{tag.reason}</p>
                                    <div className="flex items-center gap-3 text-slate-400">
                                      <span className="flex items-center gap-1">
                                        <Target className="w-3 h-3" />
                                        {Math.round(tag.confidence * 100)}% match
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Search className="w-3 h-3" />
                                        {tag.searchVolume} volume
                                      </span>
                                    </div>
                                    {tag.relatedTags && tag.relatedTags.length > 0 && (
                                      <div className="mt-2 pt-2 border-t border-slate-700">
                                        <span className="text-slate-500">Related: </span>
                                        {tag.relatedTags.join(', ')}
                                      </div>
                                    )}
                                    <div className="absolute left-4 bottom-0 transform translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900" />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Custom Tags Section */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Plus className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">Add Custom Tags</span>
              </div>

              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newCustomTag}
                  onChange={(e) => setNewCustomTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTag()}
                  placeholder="Type a custom tag and press Enter"
                  className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
                <button
                  onClick={handleAddCustomTag}
                  disabled={!newCustomTag.trim()}
                  className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add
                </button>
              </div>

              {customTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {customTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium border border-slate-200"
                    >
                      {tag}
                      <button
                        onClick={() => removeCustomTag(tag)}
                        className="hover:text-red-600 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Tags Summary */}
            {selectedTags.size > 0 && (
              <div className="bg-violet-50 rounded-xl p-4 border border-violet-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-violet-800">
                    {selectedTags.size} Tags Ready to Apply
                  </span>
                  <span className="text-xs text-violet-600">
                    These will be saved to your profile
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(selectedTags).slice(0, 10).map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded text-xs font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                  {selectedTags.size > 10 && (
                    <span className="px-2 py-0.5 bg-violet-200 text-violet-800 rounded text-xs font-medium">
                      +{selectedTags.size - 10} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!isGeneratingTags && !tagsError && suggestedTags.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Tags className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium mb-2">No tags generated yet</p>
            <p className="text-sm text-slate-500 mb-4">
              Tags help categorize your business and improve AI responses
            </p>
            <button
              onClick={handleGenerateTags}
              className="px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 shadow-sm transition-colors"
            >
              Generate Smart Tags
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
            identityFields.find((f) => getFieldKey(f) === 'identity.name')?.finalValue as string
          }
        >
          <div className="pt-4">
            {identityFields.map((f) => (
              <ReviewFieldRow
                key={getFieldKey(f)}
                label={getFieldLabel(f)}
                value={f.finalValue}
                source={f.selectedSource}
                icon={getFieldIcon(f)}
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
          previewContent={contactFields.find((f) => getFieldKey(f) === 'identity.phone')?.finalValue as string}
        >
          <div className="pt-4">
            {contactFields.map((f) => (
              <ReviewFieldRow
                key={getFieldKey(f)}
                label={getFieldLabel(f)}
                value={f.finalValue}
                source={f.selectedSource}
                icon={getFieldIcon(f)}
              />
            ))}
          </div>
        </ReviewAccordionSection>

        {/* Social Media */}
        {mergeFields.some(f => getFieldCategory(f) === 'social' && f.finalValue) && (
          <ReviewAccordionSection
            title="Social Media"
            icon={Users}
            count={`${mergeFields.filter((f) => getFieldCategory(f) === 'social' && f.finalValue).length} profiles`}
            status="complete"
            isExpanded={expandedSections.social || false}
            onToggle={() => onToggleSection('social')}
            onEdit={() => onNavigateToTab('merge')}
            previewContent={
              mergeFields.filter((f) => getFieldCategory(f) === 'social' && f.finalValue)
                .map(f => getFieldLabel(f))
                .slice(0, 3)
                .join(', ')
            }
          >
            <div className="pt-4">
              {mergeFields.filter((f) => getFieldCategory(f) === 'social').map((f) => (
                <ReviewFieldRow
                  key={getFieldKey(f)}
                  label={getFieldLabel(f)}
                  value={f.finalValue}
                  source={f.selectedSource}
                  icon={getFieldIcon(f)}
                />
              ))}
            </div>
          </ReviewAccordionSection>
        )}

        {/* Brand & Strategy (Aggregated) */}
        {(mergeFields.some(f => ['brand', 'audience', 'competitive'].includes(getFieldCategory(f)) && f.finalValue)) && (
          <ReviewAccordionSection
            title="Brand & Strategy"
            icon={Target}
            count={`${mergeFields.filter((f) => ['brand', 'audience', 'competitive'].includes(getFieldCategory(f)) && f.finalValue).length} fields`}
            status="complete"
            isExpanded={expandedSections.brand || false}
            onToggle={() => onToggleSection('brand')}
            onEdit={() => onNavigateToTab('merge')}
            previewContent={
              mergeFields.find((f) => getFieldKey(f) === 'personality.uniqueSellingPoints')?.finalValue?.[0] || 'Brand Strategy'
            }
          >
            <div className="pt-4">
              {mergeFields.filter((f) => ['brand', 'audience', 'competitive'].includes(getFieldCategory(f))).map((f) => (
                <ReviewFieldRow
                  key={getFieldKey(f)}
                  label={getFieldLabel(f)}
                  value={f.finalValue}
                  source={f.selectedSource}
                  icon={getFieldIcon(f)}
                />
              ))}
            </div>
          </ReviewAccordionSection>
        )}

        {/* Knowledge Base (Aggregated) */}
        {(mergeFields.some(f => ['knowledge', 'credentials', 'team', 'success'].includes(getFieldCategory(f)) && f.finalValue)) && (
          <ReviewAccordionSection
            title="Knowledge Base"
            icon={ShieldCheck}
            count={`${mergeFields.filter((f) => ['knowledge', 'credentials', 'team', 'success'].includes(getFieldCategory(f)) && f.finalValue).length} fields`}
            status="complete"
            isExpanded={expandedSections.knowledge || false}
            onToggle={() => onToggleSection('knowledge')}
            onEdit={() => onNavigateToTab('merge')}
            previewContent="Credentials, FAQs, Team"
          >
            <div className="pt-4">
              {mergeFields.filter((f) => ['knowledge', 'credentials', 'team', 'success'].includes(getFieldCategory(f))).map((f) => (
                <ReviewFieldRow
                  key={getFieldKey(f)}
                  label={getFieldLabel(f)}
                  value={f.finalValue}
                  source={f.selectedSource}
                  icon={getFieldIcon(f)}
                />
              ))}
            </div>
          </ReviewAccordionSection>
        )}

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
              industryFields.find((f) => getFieldKey(f).includes('visaSuccess'))?.finalValue as string
            }
          >
            <div className="pt-4">
              {industryFields.map((f) => (
                <ReviewFieldRow
                  key={getFieldKey(f)}
                  label={getFieldLabel(f)}
                  value={f.finalValue}
                  source={f.selectedSource}
                  icon={getFieldIcon(f)}
                />
              ))}
            </div>
          </ReviewAccordionSection>
        )}

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
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-6 mt-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-white text-center sm:text-left">
            <h3 className="font-bold text-xl mb-1">Ready to Apply?</h3>
            <p className="text-white/80">
              Your AI assistant will use this data to serve customers.
              {selectedTags.size > 0 && (
                <span className="block mt-1 text-white/90">
                  Including <strong>{selectedTags.size} strategic tags</strong> for better categorization.
                </span>
              )}
            </p>
          </div>
          <button
            onClick={handleApply}
            disabled={hasUnresolvedConflicts || isApplying}
            className={`w-full sm:w-auto px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 text-lg transition-all ${hasUnresolvedConflicts
              ? 'bg-white/30 text-white/70 cursor-not-allowed'
              : 'bg-white text-indigo-700 hover:bg-indigo-50 shadow-xl hover:shadow-2xl'
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
