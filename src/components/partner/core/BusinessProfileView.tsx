'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
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
  CheckCircle2,
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
  ChevronDown,
  Pencil,
  Loader2,
  Bot,
  Download,
  RefreshCw,
  Sparkles,
  Tags,
  Rocket,
  Wand2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import NextLink from 'next/link';
import { toast } from 'sonner';

import { getBusinessPersonaAction } from '@/actions/business-persona-actions';
import { FIELD_REGISTRY, CATEGORY_CONFIG, type FieldDefinition, type FieldCategory } from '@/lib/field-registry';
import type { BusinessPersona, SetupProgress, ProductService } from '@/lib/business-persona-types';

import TestAIResponseModal from './TestAIResponseModal';

// Icon mapping from string names to Lucide icons
const ICON_MAP: Record<string, LucideIcon> = {
  Building2, Phone, Mail, Globe, MapPin, Clock, MessageCircle,
  Instagram, Facebook, Linkedin, Twitter, Youtube, Store, Target,
  Eye, Heart, Star, BookOpen, Quote, Users, BarChart2, HelpCircle,
  AlertCircle, TrendingUp, Zap, Shield, Compass, DollarSign, Award,
  Trophy, CheckCircle, FileCheck, FileText, UserCircle, Briefcase,
  Package, CreditCard, Calendar, Hash, Map, Share2, MessageSquare,
  AlignLeft, ShieldCheck, Pill, Building, Smartphone, Stethoscope,
  Home, Receipt, BedDouble, TestTube2, Siren, Video, UtensilsCrossed,
  Utensils, Leaf, Truck, Grid, Tag, RotateCcw, ShoppingCart,
  GraduationCap, Link,
  Sparkles: Star,
  IdCard: CreditCard,
};

// Helper to get nested value from object using dot notation
function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

// Helper to format any value for display
function formatDisplayValue(value: any): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) {
    if (value.length === 0) return '';
    if (typeof value[0] === 'object') {
      return value.map(item => formatDisplayValue(item)).join('; ');
    }
    return value.join(', ');
  }
  if (typeof value === 'object') {
    if (value.street || value.city || value.line1) {
      const parts = [
        value.street || value.line1, value.area, value.city,
        value.state, value.country, value.pincode || value.postalCode || value.zip
      ].filter(Boolean);
      return parts.join(', ');
    }
    if (value.isOpen24x7 !== undefined) {
      if (value.isOpen24x7) return 'Open 24/7';
      if (value.appointmentOnly) return 'By appointment only';
      if (value.onlineAlways) return 'Online services always available';
      if (value.schedule) {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const openDays = days.filter(d => value.schedule[d]?.isOpen);
        if (openDays.length > 0) {
          const firstDay = value.schedule[openDays[0]];
          return `${openDays.length} days/week (${firstDay.openTime} - ${firstDay.closeTime})`;
        }
      }
      return 'Custom hours';
    }
    if (value.instagram || value.facebook || value.linkedin || value.twitter) {
      const platforms = ['instagram', 'facebook', 'linkedin', 'twitter', 'youtube', 'tiktok'];
      const found = platforms.filter(p => value[p]).map(p => p.charAt(0).toUpperCase() + p.slice(1));
      return found.join(', ') || 'Connected';
    }
    if (value.category && value.name) {
      return value.subCategory ? `${value.name} (${value.subCategory})` : value.name;
    }
    if (value.name) return value.name;
    try {
      const entries = Object.entries(value).filter(([_, v]) => v !== null && v !== undefined && v !== '');
      if (entries.length === 0) return '';
      return entries.map(([k, v]) => `${k}: ${formatDisplayValue(v)}`).join(', ');
    } catch {
      return JSON.stringify(value);
    }
  }
  return String(value);
}

interface BusinessProfileViewProps {
  partnerId: string;
}

// Field Row Component
function FieldRow({ label, value, icon: Icon }: { label: string; value: any; icon?: LucideIcon }) {
  const displayValue = formatDisplayValue(value);
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      {Icon && <Icon className="w-4 h-4 text-slate-400 mt-1 flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
        <p className="text-sm text-slate-900 font-medium">
          {displayValue || <span className="text-slate-400 italic">Not set</span>}
        </p>
      </div>
    </div>
  );
}

// Accordion Section Component
interface AccordionSectionProps {
  title: string;
  icon: LucideIcon;
  count: string;
  status: 'complete' | 'warning' | 'default';
  isExpanded: boolean;
  onToggle: () => void;
  editLink: string;
  previewContent?: string;
  children: React.ReactNode;
}

function AccordionSection({
  title, icon: Icon, count, status, isExpanded, onToggle, editLink, previewContent, children
}: AccordionSectionProps) {
  const statusStyles = {
    complete: {
      border: 'border-emerald-200 bg-emerald-50/30',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      countBg: 'bg-emerald-100 text-emerald-700',
    },
    warning: {
      border: 'border-amber-200 bg-amber-50/30',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      countBg: 'bg-amber-100 text-amber-700',
    },
    default: {
      border: 'border-slate-200 bg-white',
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-500',
      countBg: 'bg-slate-100 text-slate-600',
    },
  };
  const styles = statusStyles[status];

  return (
    <div className={`rounded-2xl border-2 overflow-hidden transition-all ${styles.border}`}>
      <div
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${styles.iconBg}`}>
            <Icon className={`w-6 h-6 ${styles.iconColor}`} />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900">{title}</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-sm font-semibold ${styles.countBg}`}>
                {count}
              </span>
              {status === 'complete' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
              {status === 'warning' && <AlertCircle className="w-5 h-5 text-amber-500" />}
            </div>
            {!isExpanded && previewContent && (
              <p className="text-sm text-slate-500 mt-1 line-clamp-1">{previewContent}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NextLink
            href={editLink}
            onClick={(e) => e.stopPropagation()}
            className="px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg font-medium flex items-center gap-1"
          >
            <Pencil className="w-4 h-4" /> Edit
          </NextLink>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            <ChevronDown className="w-5 h-5 text-slate-400" />
          </div>
        </div>
      </div>
      {isExpanded && (
        <div className="px-5 pb-5 border-t border-slate-100">{children}</div>
      )}
    </div>
  );
}

// Product Row Component
function ProductRow({ product }: { product: ProductService }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <Package className="w-4 h-4 text-slate-400 mt-1 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm text-slate-900 font-medium">{product.name}</p>
          {product.isPopular && (
            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">Popular</span>
          )}
        </div>
        {product.description && (
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{product.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          {product.category && (
            <span className="text-xs text-slate-400">{product.category}</span>
          )}
          {product.priceRange && (
            <span className="text-xs font-medium text-emerald-600">{product.priceRange}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BusinessProfileView({ partnerId }: BusinessProfileViewProps) {
  const [persona, setPersona] = useState<BusinessPersona | null>(null);
  const [setupProgress, setSetupProgress] = useState<SetupProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    identity: true,
    contact: false,
    social: false,
    brand: false,
    products: false,
    knowledge: false,
  });

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

  // Build fields grouped by category from the persona data
  const fieldsByCategory = useMemo(() => {
    if (!persona) return {};

    const groups: Record<string, Array<{ definition: FieldDefinition; value: any }>> = {};

    FIELD_REGISTRY.forEach((field) => {
      const value = getNestedValue(persona, field.targetPath);
      if (value !== undefined && value !== null && value !== '' &&
          !(Array.isArray(value) && value.length === 0)) {
        if (!groups[field.category]) {
          groups[field.category] = [];
        }
        groups[field.category].push({ definition: field, value });
      }
    });

    return groups;
  }, [persona]);

  // Get category config with icons
  const getCategoryInfo = (categoryId: string) => {
    const config = CATEGORY_CONFIG.find(c => c.id === categoryId);
    return {
      label: config?.label || categoryId,
      icon: ICON_MAP[config?.iconName || 'FileText'] || FileText,
      color: config?.color || 'slate',
    };
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

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
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
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
          <NextLink href="/partner/settings?tab=profile">
            <Button className="gap-2">
              <Rocket className="w-4 h-4" />
              Create Business Profile
            </Button>
          </NextLink>
        </div>
      </div>
    );
  }

  const products = persona.knowledge?.productsOrServices || [];
  const faqs = persona.knowledge?.faqs || [];
  const testimonials = (persona as any).testimonials || [];
  const tags = (persona as any).tags || [];

  // Count filled fields
  const totalFilledFields = Object.values(fieldsByCategory).reduce((sum, fields) => sum + fields.length, 0);

  return (
    <ScrollArea className="h-full">
      <div className="max-w-4xl mx-auto p-6 space-y-6 pb-20">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium mb-4">
            <Bot className="w-4 h-4" /> What Your AI Knows
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
            {persona.identity?.name || 'Your Business Profile'}
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            This is the data your AI assistant uses when responding to customers.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border p-4 text-center">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{totalFilledFields}</p>
            <p className="text-xs text-slate-500">Fields</p>
          </div>
          <div className="bg-white rounded-xl border p-4 text-center">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Package className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{products.length}</p>
            <p className="text-xs text-slate-500">Products</p>
          </div>
          <div className="bg-white rounded-xl border p-4 text-center">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <HelpCircle className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{faqs.length}</p>
            <p className="text-xs text-slate-500">FAQs</p>
          </div>
          <div className="bg-white rounded-xl border p-4 text-center">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{setupProgress?.overallPercentage ?? 0}%</p>
            <p className="text-xs text-slate-500">Complete</p>
          </div>
        </div>

        {/* Progress Banner */}
        {(setupProgress?.overallPercentage ?? 0) < 80 && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-amber-900">Improve Your Profile</p>
              <p className="text-sm text-amber-700">
                Adding more data helps your AI give better responses.
                {setupProgress?.nextRecommendedStep && (
                  <span> Next: <strong>{setupProgress.nextRecommendedStep}</strong></span>
                )}
              </p>
            </div>
            <NextLink href="/partner/settings/import-center">
              <Button variant="outline" className="bg-white">
                <Download className="w-4 h-4 mr-2" />
                Import Data
              </Button>
            </NextLink>
          </div>
        )}

        {/* Tags Section */}
        {tags.length > 0 && (
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="p-5 border-b bg-gradient-to-r from-violet-50 to-purple-50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Tags className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Profile Tags</h3>
                  <p className="text-sm text-slate-500">{tags.length} tags for discoverability</p>
                </div>
              </div>
            </div>
            <div className="p-5">
              <div className="flex flex-wrap gap-2">
                {tags.map((tag: string, i: number) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-violet-50 text-violet-700 rounded-lg text-sm font-medium border border-violet-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Sections from Field Registry */}
        <div className="space-y-4">
          {/* Identity Fields */}
          {fieldsByCategory['identity'] && (
            <AccordionSection
              title="Business Identity"
              icon={Building2}
              count={`${fieldsByCategory['identity'].length} fields`}
              status={fieldsByCategory['identity'].length > 0 ? 'complete' : 'default'}
              isExpanded={expandedSections.identity || false}
              onToggle={() => toggleSection('identity')}
              editLink="/partner/settings?tab=profile"
              previewContent={persona.identity?.name}
            >
              <div className="pt-4">
                {fieldsByCategory['identity'].map(({ definition, value }) => (
                  <FieldRow
                    key={definition.targetPath}
                    label={definition.label}
                    value={value}
                    icon={ICON_MAP[definition.iconName || 'FileText']}
                  />
                ))}
              </div>
            </AccordionSection>
          )}

          {/* Contact Fields */}
          {fieldsByCategory['contact'] && (
            <AccordionSection
              title="Contact & Location"
              icon={MapPin}
              count={`${fieldsByCategory['contact'].length} fields`}
              status={fieldsByCategory['contact'].length > 0 ? 'complete' : 'default'}
              isExpanded={expandedSections.contact || false}
              onToggle={() => toggleSection('contact')}
              editLink="/partner/settings?tab=profile"
              previewContent={persona.identity?.phone || persona.identity?.email}
            >
              <div className="pt-4">
                {fieldsByCategory['contact'].map(({ definition, value }) => (
                  <FieldRow
                    key={definition.targetPath}
                    label={definition.label}
                    value={value}
                    icon={ICON_MAP[definition.iconName || 'FileText']}
                  />
                ))}
              </div>
            </AccordionSection>
          )}

          {/* Social Media Fields */}
          {fieldsByCategory['social'] && fieldsByCategory['social'].length > 0 && (
            <AccordionSection
              title="Social Media"
              icon={Share2}
              count={`${fieldsByCategory['social'].length} profiles`}
              status="complete"
              isExpanded={expandedSections.social || false}
              onToggle={() => toggleSection('social')}
              editLink="/partner/settings?tab=profile"
              previewContent={fieldsByCategory['social'].map(f => f.definition.label).slice(0, 3).join(', ')}
            >
              <div className="pt-4">
                {fieldsByCategory['social'].map(({ definition, value }) => (
                  <FieldRow
                    key={definition.targetPath}
                    label={definition.label}
                    value={value}
                    icon={ICON_MAP[definition.iconName || 'FileText']}
                  />
                ))}
              </div>
            </AccordionSection>
          )}

          {/* Brand & Strategy */}
          {(fieldsByCategory['brand'] || fieldsByCategory['audience'] || fieldsByCategory['competitive']) && (
            <AccordionSection
              title="Brand & Strategy"
              icon={Target}
              count={`${(fieldsByCategory['brand']?.length || 0) + (fieldsByCategory['audience']?.length || 0) + (fieldsByCategory['competitive']?.length || 0)} fields`}
              status="complete"
              isExpanded={expandedSections.brand || false}
              onToggle={() => toggleSection('brand')}
              editLink="/partner/settings?tab=profile"
              previewContent={persona.personality?.tagline || persona.personality?.description?.slice(0, 50)}
            >
              <div className="pt-4">
                {[...(fieldsByCategory['brand'] || []), ...(fieldsByCategory['audience'] || []), ...(fieldsByCategory['competitive'] || [])].map(({ definition, value }) => (
                  <FieldRow
                    key={definition.targetPath}
                    label={definition.label}
                    value={value}
                    icon={ICON_MAP[definition.iconName || 'FileText']}
                  />
                ))}
              </div>
            </AccordionSection>
          )}

          {/* Products & Services */}
          <AccordionSection
            title="Products & Services"
            icon={Package}
            count={`${products.length} items`}
            status={products.length > 0 ? 'complete' : 'warning'}
            isExpanded={expandedSections.products || false}
            onToggle={() => toggleSection('products')}
            editLink="/partner/settings?tab=profile"
            previewContent={products.slice(0, 2).map(p => p.name).join(', ')}
          >
            <div className="pt-4">
              {products.length > 0 ? (
                products.map((product) => (
                  <ProductRow key={product.id} product={product} />
                ))
              ) : (
                <div className="text-center py-6 text-slate-500">
                  <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">No products or services added yet</p>
                </div>
              )}
            </div>
          </AccordionSection>

          {/* Knowledge Base */}
          {(fieldsByCategory['knowledge'] || fieldsByCategory['credentials'] || faqs.length > 0) && (
            <AccordionSection
              title="Knowledge Base"
              icon={BookOpen}
              count={`${(fieldsByCategory['knowledge']?.length || 0) + (fieldsByCategory['credentials']?.length || 0) + faqs.length} items`}
              status="complete"
              isExpanded={expandedSections.knowledge || false}
              onToggle={() => toggleSection('knowledge')}
              editLink="/partner/settings?tab=profile"
              previewContent={`${faqs.length} FAQs`}
            >
              <div className="pt-4">
                {[...(fieldsByCategory['knowledge'] || []), ...(fieldsByCategory['credentials'] || [])].map(({ definition, value }) => (
                  <FieldRow
                    key={definition.targetPath}
                    label={definition.label}
                    value={value}
                    icon={ICON_MAP[definition.iconName || 'FileText']}
                  />
                ))}
                {faqs.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs font-medium text-slate-500 mb-3">Frequently Asked Questions</p>
                    {faqs.slice(0, 3).map((faq) => (
                      <div key={faq.id} className="py-2 border-b border-slate-50 last:border-0">
                        <p className="text-sm font-medium text-slate-700">Q: {faq.question}</p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">A: {faq.answer}</p>
                      </div>
                    ))}
                    {faqs.length > 3 && (
                      <p className="text-xs text-slate-400 mt-2">+{faqs.length - 3} more FAQs</p>
                    )}
                  </div>
                )}
              </div>
            </AccordionSection>
          )}

          {/* Industry-Specific Fields */}
          {fieldsByCategory['industry'] && fieldsByCategory['industry'].length > 0 && (
            <AccordionSection
              title="Industry Data"
              icon={GraduationCap}
              count={`${fieldsByCategory['industry'].length} fields`}
              status="complete"
              isExpanded={expandedSections.industry || false}
              onToggle={() => toggleSection('industry')}
              editLink="/partner/settings?tab=profile"
              previewContent="Industry-specific information"
            >
              <div className="pt-4">
                {fieldsByCategory['industry'].map(({ definition, value }) => (
                  <FieldRow
                    key={definition.targetPath}
                    label={definition.label}
                    value={value}
                    icon={ICON_MAP[definition.iconName || 'FileText']}
                  />
                ))}
              </div>
            </AccordionSection>
          )}
        </div>

        {/* Action CTA */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-6 mt-8 shadow-xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-white text-center sm:text-left">
              <h3 className="font-bold text-xl mb-1">Test Your AI</h3>
              <p className="text-white/80">
                See how your AI assistant uses this data to respond to customers.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setIsTestModalOpen(true)}
                className="bg-white text-indigo-700 hover:bg-indigo-50 shadow-xl"
              >
                <Bot className="w-4 h-4 mr-2" />
                Test AI Response
              </Button>
              <Button
                onClick={loadPersona}
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <TestAIResponseModal
        open={isTestModalOpen}
        onOpenChange={setIsTestModalOpen}
        partnerId={partnerId}
        persona={persona}
      />
    </ScrollArea>
  );
}
