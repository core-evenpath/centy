"use client";

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  Building2, MapPin, Phone, Mail, Globe, Clock, Star, Users,
  Sparkles, Tag, Package, MessageSquare, FileText, ChevronRight,
  Edit2, Check, X, Plus, Trash2, ExternalLink, IndianRupee,
  AlertCircle, Lightbulb, Camera, Quote, Brain, Zap, ChevronDown,
  Store, Utensils, Bed, Home, Stethoscope, GraduationCap, Car,
  Scale, Landmark, Calendar, Heart, Save, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import type { BusinessPersona, ProductService, FrequentlyAskedQuestion } from '@/lib/business-persona-types';

interface BusinessProfileViewProps {
  persona: Partial<BusinessPersona>;
  partnerId: string;
  onFieldUpdate: (path: string, value: any) => Promise<void>;
  onRefresh?: () => Promise<void>;
  isAdmin?: boolean;
}

// Field editing component
function EditableField({
  label,
  value,
  type = 'text',
  placeholder,
  onSave,
  multiline = false,
  className,
}: {
  label: string;
  value: string | undefined;
  type?: 'text' | 'email' | 'phone' | 'url';
  placeholder?: string;
  onSave: (value: string) => void;
  multiline?: boolean;
  className?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value || '');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className={cn("flex items-start gap-2", className)}>
        {multiline ? (
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
            autoFocus
          />
        ) : (
          <input
            type={type}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
        )}
        <button onClick={handleSave} className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
          <Check className="w-4 h-4" />
        </button>
        <button onClick={handleCancel} className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn("group flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-2 py-1 -mx-2 rounded-lg transition-colors", className)}
      onClick={() => setIsEditing(true)}
    >
      <span className={cn("text-sm", value ? "text-slate-700" : "text-slate-400 italic")}>
        {value || placeholder || `Add ${label.toLowerCase()}`}
      </span>
      <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

// Tags editing component
function EditableTags({
  tags,
  onSave,
  placeholder = "Add item",
  maxTags = 10,
}: {
  tags: string[];
  onSave: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}) {
  const [newTag, setNewTag] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    if (newTag.trim() && tags.length < maxTags) {
      onSave([...tags, newTag.trim()]);
      setNewTag('');
      setIsAdding(false);
    }
  };

  const handleRemove = (index: number) => {
    onSave(tags.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag, index) => (
        <span
          key={index}
          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm group"
        >
          {tag}
          <button
            onClick={() => handleRemove(index)}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      {isAdding ? (
        <div className="inline-flex items-center gap-1">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder={placeholder}
            className="w-32 px-2 py-1 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <button onClick={handleAdd} className="p-1 text-green-600 hover:bg-green-50 rounded">
            <Check className="w-4 h-4" />
          </button>
          <button onClick={() => { setIsAdding(false); setNewTag(''); }} className="p-1 text-slate-400 hover:bg-slate-50 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : tags.length < maxTags ? (
        <button
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center gap-1 px-3 py-1 border border-dashed border-slate-300 text-slate-500 rounded-full text-sm hover:border-blue-400 hover:text-blue-600 transition-colors"
        >
          <Plus className="w-3 h-3" /> Add
        </button>
      ) : null}
    </div>
  );
}

// Section card component
function SectionCard({
  icon: Icon,
  title,
  badge,
  children,
  className,
  collapsible = false,
  defaultExpanded = true,
  action,
}: {
  icon: React.ElementType;
  title: string;
  badge?: { text: string; color: string };
  children: React.ReactNode;
  className?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  action?: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className={cn("bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden", className)}>
      <div
        className={cn(
          "flex items-center justify-between px-5 py-4 border-b border-slate-100",
          collapsible && "cursor-pointer hover:bg-slate-50"
        )}
        onClick={() => collapsible && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-lg">
            <Icon className="w-5 h-5 text-slate-600" />
          </div>
          <h3 className="font-semibold text-slate-800">{title}</h3>
          {badge && (
            <span className={cn("px-2 py-0.5 text-xs font-medium rounded-full", badge.color)}>
              {badge.text}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {action}
          {collapsible && (
            <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform", expanded && "rotate-180")} />
          )}
        </div>
      </div>
      {(!collapsible || expanded) && (
        <div className="p-5">{children}</div>
      )}
    </div>
  );
}

// Inventory item card
function InventoryCard({
  name,
  category,
  price,
  priceUnit,
  description,
  details,
  icon: Icon,
  onEdit,
  onRemove,
}: {
  name: string;
  category?: string;
  price?: number | { value?: number; unit?: string } | string;
  priceUnit?: string;
  description?: string;
  details?: string;
  icon?: React.ElementType;
  onEdit?: () => void;
  onRemove?: () => void;
}) {
  const IconComponent = Icon || Package;

  // Safely extract price value and unit
  const getPriceDisplay = () => {
    if (price === undefined || price === null) return null;

    let priceValue: number | undefined;
    let unit = priceUnit;

    if (typeof price === 'object' && price !== null) {
      priceValue = price.value;
      unit = price.unit || priceUnit;
    } else if (typeof price === 'number') {
      priceValue = price;
    } else if (typeof price === 'string') {
      priceValue = parseFloat(price);
      if (isNaN(priceValue)) return null;
    }

    if (priceValue === undefined) return null;

    return { value: priceValue, unit };
  };

  const priceDisplay = getPriceDisplay();

  return (
    <div className="group relative p-4 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="p-2 bg-white rounded-lg border border-slate-100">
            <IconComponent className="w-4 h-4 text-slate-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-sm text-slate-800 truncate">{name}</h4>
              {category && typeof category === 'string' && (
                <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded text-[10px] uppercase tracking-wide">
                  {category}
                </span>
              )}
            </div>
            {description && typeof description === 'string' && (
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{description}</p>
            )}
            {details && typeof details === 'string' && (
              <p className="text-xs text-slate-400 mt-1">{details}</p>
            )}
          </div>
        </div>
        {priceDisplay && (
          <div className="flex-shrink-0">
            <span className="inline-flex items-center gap-0.5 px-2.5 py-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full text-xs font-bold shadow-sm">
              <IndianRupee className="w-3 h-3" />
              {priceDisplay.value.toLocaleString('en-IN')}
              {priceDisplay.unit && typeof priceDisplay.unit === 'string' && (
                <span className="font-normal opacity-90">/{priceDisplay.unit}</span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Edit/Remove buttons (on hover) */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        {onEdit && (
          <button onClick={onEdit} className="p-1 bg-white rounded shadow-sm hover:bg-blue-50 text-blue-600">
            <Edit2 className="w-3 h-3" />
          </button>
        )}
        {onRemove && (
          <button onClick={onRemove} className="p-1 bg-white rounded shadow-sm hover:bg-red-50 text-red-600">
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

// AI Suggestions Component
function AISuggestions({
  persona,
  onFieldFocus,
}: {
  persona: Partial<BusinessPersona>;
  onFieldFocus: (field: string) => void;
}) {
  const suggestions = useMemo(() => {
    const items: { field: string; label: string; priority: 'high' | 'medium' | 'low'; reason: string }[] = [];

    // Check essential fields
    if (!persona.identity?.name) {
      items.push({ field: 'identity.name', label: 'Business Name', priority: 'high', reason: 'Required for all communications' });
    }
    if (!persona.personality?.description || persona.personality.description.length < 50) {
      items.push({ field: 'personality.description', label: 'Business Description', priority: 'high', reason: 'Helps AI understand your business' });
    }
    if (!persona.identity?.phone) {
      items.push({ field: 'identity.phone', label: 'Phone Number', priority: 'high', reason: 'Primary contact method' });
    }
    if (!persona.identity?.email) {
      items.push({ field: 'identity.email', label: 'Email Address', priority: 'medium', reason: 'For customer inquiries' });
    }
    if (!persona.identity?.address?.city) {
      items.push({ field: 'identity.address.city', label: 'City/Location', priority: 'medium', reason: 'Helps local customers find you' });
    }
    if (!persona.personality?.uniqueSellingPoints?.length) {
      items.push({ field: 'personality.uniqueSellingPoints', label: 'What Makes You Special', priority: 'medium', reason: 'Differentiates your business' });
    }
    if (!persona.customerProfile?.targetAudience) {
      items.push({ field: 'customerProfile.targetAudience', label: 'Target Audience', priority: 'medium', reason: 'Helps tailor AI responses' });
    }
    if (!persona.knowledge?.productsOrServices?.length) {
      items.push({ field: 'knowledge.productsOrServices', label: 'Products/Services', priority: 'high', reason: 'Essential for customer queries' });
    }
    if (!persona.knowledge?.faqs?.length) {
      items.push({ field: 'knowledge.faqs', label: 'FAQs', priority: 'low', reason: 'Reduces repetitive queries' });
    }
    if (!persona.identity?.operatingHours?.isOpen24x7 && !persona.identity?.operatingHours?.schedule) {
      items.push({ field: 'identity.operatingHours', label: 'Operating Hours', priority: 'medium', reason: 'Customers need to know when you\'re available' });
    }

    // Check inventory based on industry
    const industry = persona.identity?.industry?.category;
    if (industry === 'hospitality' && (!persona.roomTypes?.length)) {
      items.push({ field: 'roomTypes', label: 'Room Types', priority: 'high', reason: 'Essential for hospitality bookings' });
    }
    if (industry === 'food_beverage' && (!persona.menuItems?.length)) {
      items.push({ field: 'menuItems', label: 'Menu Items', priority: 'high', reason: 'Customers need to see your menu' });
    }
    if (industry === 'retail' && (!persona.productCatalog?.length)) {
      items.push({ field: 'productCatalog', label: 'Product Catalog', priority: 'high', reason: 'Display your products' });
    }
    if (industry === 'healthcare' && (!persona.healthcareServices?.length)) {
      items.push({ field: 'healthcareServices', label: 'Healthcare Services', priority: 'high', reason: 'List your medical services' });
    }

    return items.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [persona]);

  if (suggestions.length === 0) {
    return (
      <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
        <div className="p-2 bg-green-100 rounded-lg">
          <Check className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h4 className="font-medium text-green-800">Profile Complete!</h4>
          <p className="text-sm text-green-600">All essential fields are filled. Your AI agent is ready.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-amber-100 rounded-lg">
          <Lightbulb className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h4 className="font-semibold text-amber-800">AI Suggestions</h4>
          <p className="text-sm text-amber-600">{suggestions.length} fields need attention</p>
        </div>
      </div>
      <div className="space-y-2">
        {suggestions.slice(0, 5).map((suggestion) => (
          <button
            key={suggestion.field}
            onClick={() => onFieldFocus(suggestion.field)}
            className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-amber-100 hover:border-amber-300 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <span className={cn(
                "w-2 h-2 rounded-full",
                suggestion.priority === 'high' && "bg-red-500",
                suggestion.priority === 'medium' && "bg-amber-500",
                suggestion.priority === 'low' && "bg-slate-400"
              )} />
              <div>
                <span className="font-medium text-sm text-slate-800">{suggestion.label}</span>
                <p className="text-xs text-slate-500">{suggestion.reason}</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        ))}
      </div>
    </div>
  );
}

// Additional Data Section - for unstructured data
function AdditionalDataSection({
  persona,
  onFieldUpdate,
}: {
  persona: Partial<BusinessPersona>;
  onFieldUpdate: (path: string, value: any) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);

  // Gather all unstructured/additional data
  const additionalData = useMemo(() => {
    const data: { category: string; items: { label: string; value: any; path: string }[] }[] = [];

    // From the web (AI research data)
    const fromTheWeb = persona.industrySpecificData?.fromTheWeb;
    if (fromTheWeb) {
      const webItems: { label: string; value: any; path: string }[] = [];
      if (fromTheWeb.awards?.length) {
        webItems.push({ label: 'Awards & Recognition', value: fromTheWeb.awards, path: 'industrySpecificData.fromTheWeb.awards' });
      }
      if (fromTheWeb.specialServices?.length) {
        webItems.push({ label: 'Special Services', value: fromTheWeb.specialServices, path: 'industrySpecificData.fromTheWeb.specialServices' });
      }
      if (fromTheWeb.certifications?.length) {
        webItems.push({ label: 'Certifications', value: fromTheWeb.certifications, path: 'industrySpecificData.fromTheWeb.certifications' });
      }
      if (fromTheWeb.partnerships?.length) {
        webItems.push({ label: 'Partnerships', value: fromTheWeb.partnerships, path: 'industrySpecificData.fromTheWeb.partnerships' });
      }
      if (fromTheWeb.mediaFeatures?.length) {
        webItems.push({ label: 'Media Features', value: fromTheWeb.mediaFeatures, path: 'industrySpecificData.fromTheWeb.mediaFeatures' });
      }
      if (fromTheWeb.additionalInfo) {
        webItems.push({ label: 'Additional Info', value: fromTheWeb.additionalInfo, path: 'industrySpecificData.fromTheWeb.additionalInfo' });
      }
      if (webItems.length > 0) {
        data.push({ category: 'From the Web', items: webItems });
      }
    }

    // Fetched reviews
    const reviews = persona.industrySpecificData?.fetchedReviews;
    if (reviews?.length) {
      data.push({
        category: 'Customer Reviews',
        items: [{ label: `${reviews.length} Reviews`, value: reviews, path: 'industrySpecificData.fetchedReviews' }]
      });
    }

    // Fetched photos
    const photos = persona.industrySpecificData?.fetchedPhotos;
    if (photos?.length) {
      data.push({
        category: 'Photos',
        items: [{ label: `${photos.length} Photos`, value: photos, path: 'industrySpecificData.fetchedPhotos' }]
      });
    }

    // Online presence
    const onlinePresence = persona.industrySpecificData?.onlinePresence;
    if (onlinePresence) {
      const presenceItems: { label: string; value: any; path: string }[] = [];
      Object.entries(onlinePresence).forEach(([key, value]) => {
        if (value) {
          presenceItems.push({ label: key.charAt(0).toUpperCase() + key.slice(1), value, path: `industrySpecificData.onlinePresence.${key}` });
        }
      });
      if (presenceItems.length > 0) {
        data.push({ category: 'Online Presence', items: presenceItems });
      }
    }

    // Testimonials
    const testimonials = persona.industrySpecificData?.testimonials;
    if (testimonials?.length) {
      data.push({
        category: 'Testimonials',
        items: [{ label: `${testimonials.length} Testimonials`, value: testimonials, path: 'industrySpecificData.testimonials' }]
      });
    }

    // Press & Media
    const pressMedia = persona.industrySpecificData?.pressMedia;
    if (pressMedia?.length) {
      data.push({
        category: 'Press & Media',
        items: [{ label: `${pressMedia.length} Press Mentions`, value: pressMedia, path: 'industrySpecificData.pressMedia' }]
      });
    }

    // Custom fields
    const customFields = persona.customFields;
    if (customFields && Object.keys(customFields).length > 0) {
      const customItems = Object.entries(customFields).map(([key, value]) => ({
        label: key,
        value,
        path: `customFields.${key}`
      }));
      data.push({ category: 'Custom Fields', items: customItems });
    }

    return data;
  }, [persona]);

  if (additionalData.length === 0) {
    return null;
  }

  return (
    <SectionCard
      icon={FileText}
      title="Additional Data"
      badge={{ text: `${additionalData.reduce((acc, d) => acc + d.items.length, 0)} items`, color: 'bg-slate-100 text-slate-600' }}
      collapsible
      defaultExpanded={false}
    >
      <div className="space-y-4">
        {additionalData.map((category) => (
          <div key={category.category}>
            <h4 className="text-sm font-medium text-slate-700 mb-2">{category.category}</h4>
            <div className="space-y-2">
              {category.items.map((item) => (
                <div key={item.path} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-500">{item.label}</span>
                  </div>
                  <div className="text-sm text-slate-700">
                    {Array.isArray(item.value) ? (
                      <div className="flex flex-wrap gap-1">
                        {item.value.slice(0, 5).map((v: any, i: number) => (
                          <span key={i} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-xs">
                            {typeof v === 'object' ? (v.text || v.name || v.title || JSON.stringify(v).slice(0, 50)) : v}
                          </span>
                        ))}
                        {item.value.length > 5 && (
                          <span className="px-2 py-0.5 text-slate-400 text-xs">+{item.value.length - 5} more</span>
                        )}
                      </div>
                    ) : typeof item.value === 'object' ? (
                      <pre className="text-xs overflow-auto max-h-20">{JSON.stringify(item.value, null, 2)}</pre>
                    ) : (
                      <span>{String(item.value)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// Profile Completeness Score
function CompletenessScore({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 50) return 'text-amber-600 bg-amber-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90">
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            className="text-slate-200"
          />
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            strokeDasharray={`${(score / 100) * 176} 176`}
            className={score >= 80 ? 'text-green-500' : score >= 50 ? 'text-amber-500' : 'text-red-500'}
          />
        </svg>
        <span className={cn("absolute inset-0 flex items-center justify-center text-sm font-bold", getColor().split(' ')[0])}>
          {score}%
        </span>
      </div>
      <div>
        <p className="font-medium text-slate-800">Profile Score</p>
        <p className="text-xs text-slate-500">
          {score >= 80 ? 'Excellent!' : score >= 50 ? 'Good progress' : 'Needs attention'}
        </p>
      </div>
    </div>
  );
}

// Main Component
export default function BusinessProfileView({
  persona,
  partnerId,
  onFieldUpdate,
  onRefresh,
  isAdmin = true,
}: BusinessProfileViewProps) {
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Helper to get inventory icon based on industry
  const getInventoryIcon = () => {
    const industry = persona.identity?.industry?.category;
    switch (industry) {
      case 'hospitality': return Bed;
      case 'food_beverage': return Utensils;
      case 'retail': return Store;
      case 'healthcare': return Stethoscope;
      case 'real_estate': return Home;
      case 'education': return GraduationCap;
      case 'automotive': return Car;
      case 'legal': return Scale;
      case 'finance': return Landmark;
      default: return Package;
    }
  };

  // Helper to get inventory items based on industry
  const getInventoryItems = () => {
    const items: { type: string; data: any[]; icon: React.ElementType }[] = [];

    if (persona.roomTypes?.length) {
      items.push({ type: 'Room Types', data: persona.roomTypes, icon: Bed });
    }
    if (persona.menuItems?.length) {
      items.push({ type: 'Menu Items', data: persona.menuItems, icon: Utensils });
    }
    if (persona.productCatalog?.length) {
      items.push({ type: 'Products', data: persona.productCatalog, icon: Store });
    }
    if (persona.healthcareServices?.length) {
      items.push({ type: 'Healthcare Services', data: persona.healthcareServices, icon: Stethoscope });
    }
    if (persona.propertyListings?.length) {
      items.push({ type: 'Property Listings', data: persona.propertyListings, icon: Home });
    }
    if (persona.diagnosticTests?.length) {
      items.push({ type: 'Diagnostic Tests', data: persona.diagnosticTests, icon: Stethoscope });
    }

    return items;
  };

  const inventoryItems = getInventoryItems();
  const profileScore = persona.setupProgress?.overallPercentage || 0;

  const handleSave = async (path: string, value: any) => {
    setIsSaving(true);
    try {
      await onFieldUpdate(path, value);
      toast.success('Saved');
    } catch (error) {
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Score */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            {persona.identity?.name || 'Your Business'}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {persona.identity?.industry?.name || 'Set up your business profile'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <CompletenessScore score={profileScore} />
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* AI Suggestions */}
      <AISuggestions persona={persona} onFieldFocus={setFocusedField} />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Business Identity */}
        <SectionCard icon={Building2} title="Business Identity">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Business Name</label>
              <EditableField
                label="Business Name"
                value={persona.identity?.name}
                onSave={(v) => handleSave('identity.name', v)}
                placeholder="Enter your business name"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Tagline</label>
              <EditableField
                label="Tagline"
                value={persona.personality?.tagline}
                onSave={(v) => handleSave('personality.tagline', v)}
                placeholder="A short catchy phrase"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Description</label>
              <EditableField
                label="Description"
                value={persona.personality?.description}
                onSave={(v) => handleSave('personality.description', v)}
                placeholder="Tell customers about your business"
                multiline
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 block">What Makes You Special</label>
              <EditableTags
                tags={persona.personality?.uniqueSellingPoints || []}
                onSave={(tags) => handleSave('personality.uniqueSellingPoints', tags)}
                placeholder="Add USP"
              />
            </div>
          </div>
        </SectionCard>

        {/* Contact & Location */}
        <SectionCard icon={MapPin} title="Contact & Location">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Phone
                </label>
                <EditableField
                  label="Phone"
                  type="phone"
                  value={persona.identity?.phone}
                  onSave={(v) => handleSave('identity.phone', v)}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Email
                </label>
                <EditableField
                  label="Email"
                  type="email"
                  value={persona.identity?.email}
                  onSave={(v) => handleSave('identity.email', v)}
                  placeholder="hello@business.com"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center gap-1">
                <Globe className="w-3 h-3" /> Website
              </label>
              <EditableField
                label="Website"
                type="url"
                value={persona.identity?.website}
                onSave={(v) => handleSave('identity.website', v)}
                placeholder="https://yourbusiness.com"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Address</label>
              <EditableField
                label="Address"
                value={[
                  persona.identity?.address?.street,
                  persona.identity?.address?.city,
                  persona.identity?.address?.state
                ].filter(Boolean).join(', ')}
                onSave={(v) => {
                  // Simple parsing - just update city for now
                  handleSave('identity.address.city', v);
                }}
                placeholder="Enter your address"
              />
            </div>
            {persona.identity?.address?.city && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="w-4 h-4" />
                {persona.identity.address.city}
                {persona.identity.address.state && `, ${persona.identity.address.state}`}
              </div>
            )}
          </div>
        </SectionCard>

        {/* Operating Hours */}
        <SectionCard icon={Clock} title="Operating Hours">
          <div className="space-y-4">
            {persona.identity?.operatingHours?.isOpen24x7 ? (
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg text-green-700">
                <Check className="w-4 h-4" />
                <span className="text-sm font-medium">Open 24/7</span>
              </div>
            ) : persona.identity?.operatingHours?.appointmentOnly ? (
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg text-blue-700">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">By Appointment Only</span>
              </div>
            ) : persona.identity?.operatingHours?.schedule ? (
              <div className="space-y-2">
                {Object.entries(persona.identity.operatingHours.schedule).map(([day, hours]) => (
                  <div key={day} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <span className="text-sm font-medium text-slate-600 capitalize">{day}</span>
                    <span className="text-sm text-slate-700">
                      {(hours as any)?.open && (hours as any)?.close
                        ? `${(hours as any).open} - ${(hours as any).close}`
                        : 'Closed'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">No hours set</p>
            )}
          </div>
        </SectionCard>

        {/* Target Audience */}
        <SectionCard icon={Users} title="Target Audience">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Who are your customers?</label>
              <EditableField
                label="Target Audience"
                value={persona.customerProfile?.targetAudience}
                onSave={(v) => handleSave('customerProfile.targetAudience', v)}
                placeholder="Describe your ideal customers"
                multiline
              />
            </div>
            {persona.customerProfile?.commonQueries?.length ? (
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 block">Common Questions</label>
                <div className="flex flex-wrap gap-2">
                  {persona.customerProfile.commonQueries.map((query, i) => (
                    <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs">
                      {typeof query === 'string' ? query : (typeof query === 'object' ? JSON.stringify(query) : String(query))}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </SectionCard>
      </div>

      {/* Inventory Section - Full Width */}
      {inventoryItems.length > 0 && (
        <SectionCard
          icon={getInventoryIcon()}
          title="Inventory & Pricing"
          badge={{ text: `${inventoryItems.reduce((acc, i) => acc + i.data.length, 0)} items`, color: 'bg-orange-100 text-orange-700' }}
          collapsible
          defaultExpanded
        >
          <div className="space-y-6">
            {inventoryItems.map((category) => (
              <div key={category.type}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-slate-700 flex items-center gap-2">
                    <category.icon className="w-4 h-4" />
                    {category.type}
                    <span className="text-sm text-slate-400">({category.data.length})</span>
                  </h4>
                  <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {category.data.slice(0, 9).map((item: any, index: number) => {
                    // Safely extract string values
                    const getName = () => {
                      const val = item.name || item.title;
                      if (typeof val === 'string') return val;
                      if (typeof val === 'object' && val !== null) return val.name || val.title || val.text || `Item ${index + 1}`;
                      return `Item ${index + 1}`;
                    };
                    const getCategory = () => {
                      const val = item.category || item.type;
                      if (typeof val === 'string') return val;
                      return undefined;
                    };
                    const getDescription = () => {
                      const val = item.description;
                      if (typeof val === 'string') return val;
                      return undefined;
                    };
                    const getDetails = () => {
                      const val = item.duration || item.size || item.area;
                      if (typeof val === 'string') return val;
                      if (typeof val === 'number') return String(val);
                      return undefined;
                    };
                    return (
                      <InventoryCard
                        key={index}
                        name={getName()}
                        category={getCategory()}
                        price={item.price || item.fee || item.rate}
                        priceUnit={typeof (item.priceUnit || item.feeStructure) === 'string' ? (item.priceUnit || item.feeStructure) : undefined}
                        description={getDescription()}
                        details={getDetails()}
                        icon={category.icon}
                      />
                    );
                  })}
                </div>
                {category.data.length > 9 && (
                  <button className="mt-3 text-sm text-blue-600 hover:text-blue-700">
                    View all {category.data.length} items
                  </button>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Products/Services */}
      {persona.knowledge?.productsOrServices?.length ? (
        <SectionCard
          icon={Package}
          title="Products & Services"
          badge={{ text: `${persona.knowledge.productsOrServices.length} items`, color: 'bg-blue-100 text-blue-700' }}
          collapsible
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {persona.knowledge.productsOrServices.map((item, index) => (
              <InventoryCard
                key={index}
                name={typeof item.name === 'string' ? item.name : `Item ${index + 1}`}
                category={typeof item.category === 'string' ? item.category : undefined}
                price={item.price}
                description={typeof item.description === 'string' ? item.description : undefined}
                icon={Package}
              />
            ))}
          </div>
        </SectionCard>
      ) : null}

      {/* FAQs */}
      {persona.knowledge?.faqs?.length ? (
        <SectionCard
          icon={MessageSquare}
          title="Frequently Asked Questions"
          badge={{ text: `${persona.knowledge.faqs.length} FAQs`, color: 'bg-purple-100 text-purple-700' }}
          collapsible
        >
          <div className="space-y-3">
            {persona.knowledge.faqs.map((faq, index) => (
              <div key={index} className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-medium text-slate-800 mb-2">
                  {typeof faq.question === 'string' ? faq.question : `Question ${index + 1}`}
                </h4>
                <p className="text-sm text-slate-600">
                  {typeof faq.answer === 'string' ? faq.answer : (typeof faq.answer === 'object' ? JSON.stringify(faq.answer) : String(faq.answer || ''))}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {/* Reviews */}
      {persona.industrySpecificData?.fetchedReviews?.length ? (
        <SectionCard
          icon={Star}
          title="Customer Reviews"
          badge={{ text: `${persona.industrySpecificData.fetchedReviews.length} reviews`, color: 'bg-yellow-100 text-yellow-700' }}
          collapsible
          defaultExpanded={false}
        >
          <div className="space-y-4">
            {persona.industrySpecificData.fetchedReviews.slice(0, 5).map((review: any, index: number) => {
              const author = typeof review.author === 'string' ? review.author : 'Anonymous';
              const text = typeof review.text === 'string' ? review.text : (typeof review.text === 'object' ? JSON.stringify(review.text) : '');
              const rating = typeof review.rating === 'number' ? review.rating : 0;
              return (
                <div key={index} className="p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm text-slate-800">{author}</span>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn("w-3 h-3", i < rating ? "text-yellow-400 fill-yellow-400" : "text-slate-300")}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-3">{text}</p>
                </div>
              );
            })}
          </div>
        </SectionCard>
      ) : null}

      {/* Additional/Unstructured Data */}
      <AdditionalDataSection persona={persona} onFieldUpdate={handleSave} />

      {/* Saving Indicator */}
      {isSaving && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg shadow-lg">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm">Saving...</span>
        </div>
      )}
    </div>
  );
}
