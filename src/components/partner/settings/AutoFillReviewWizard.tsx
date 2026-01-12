"use client";

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Building2, MapPin, Phone, Mail, Globe, Clock, Star, Users,
  Package, ChevronRight, ChevronLeft, Check, X, Edit2, Save,
  IndianRupee, Utensils, Bed, Home, Stethoscope, GraduationCap, Car,
  Scale, Landmark, Calendar, Tag, FileText, AlertCircle, Sparkles,
  Image as ImageIcon, MessageSquare, ExternalLink, Plus, Trash2,
  CheckCircle2, Circle, Loader2
} from 'lucide-react';

interface AutoFillReviewWizardProps {
  data: any;
  onClose: () => void;
  onApply: (reviewedData: any) => Promise<void>;
  isApplying?: boolean;
}

type WizardStep = 'identity' | 'inventory' | 'additional' | 'unstructured' | 'review';

const STEPS: { id: WizardStep; label: string; icon: React.ElementType }[] = [
  { id: 'identity', label: 'Business Info', icon: Building2 },
  { id: 'inventory', label: 'Products & Pricing', icon: Package },
  { id: 'additional', label: 'Photos & Reviews', icon: FileText },
  { id: 'unstructured', label: 'Data & SEO', icon: Sparkles },
  { id: 'review', label: 'Confirm', icon: CheckCircle2 },
];

// Editable field component for the wizard
function WizardEditableField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  multiline = false,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'phone' | 'url';
  placeholder?: string;
  multiline?: boolean;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          rows={4}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      )}
    </div>
  );
}

// Editable inventory item
function EditableInventoryItem({
  item,
  type,
  onUpdate,
  onRemove,
  icon: Icon,
}: {
  item: any;
  type: string;
  onUpdate: (updatedItem: any) => void;
  onRemove: () => void;
  icon: React.ElementType;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedItem, setEditedItem] = useState(item);

  // Safe extraction for display
  const getName = () => {
    const val = item.name || item.title;
    if (typeof val === 'string') return val;
    if (typeof val === 'object' && val !== null) return val.name || val.title || val.text || 'Unnamed Item';
    return 'Unnamed Item';
  };

  const getPrice = () => {
    const price = item.price || item.fee || item.rate;
    if (typeof price === 'number') return price;
    if (typeof price === 'object' && price !== null) return price.value || 0;
    if (typeof price === 'string') {
      const parsed = parseFloat(price.replace(/[^0-9.]/g, ''));
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  const getDescription = () => {
    const val = item.description;
    if (typeof val === 'string') return val;
    return '';
  };

  const handleSave = () => {
    onUpdate(editedItem);
    setIsEditing(false);
    toast.success('Item updated');
  };

  if (isEditing) {
    return (
      <div className="p-4 bg-white border-2 border-indigo-200 rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-indigo-600 uppercase">{type}</span>
          <div className="flex gap-1">
            <button onClick={handleSave} className="p-1.5 text-green-600 hover:bg-green-50 rounded">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={() => { setEditedItem(item); setIsEditing(false); }} className="p-1.5 text-slate-400 hover:bg-slate-50 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <input
          type="text"
          value={editedItem.name || ''}
          onChange={(e) => setEditedItem({ ...editedItem, name: e.target.value })}
          placeholder="Item name"
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            value={typeof editedItem.price === 'number' ? editedItem.price : ''}
            onChange={(e) => setEditedItem({ ...editedItem, price: parseFloat(e.target.value) || 0 })}
            placeholder="Price (INR)"
            className="px-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="text"
            value={editedItem.priceUnit || editedItem.unit || ''}
            onChange={(e) => setEditedItem({ ...editedItem, priceUnit: e.target.value })}
            placeholder="Unit (e.g., /night)"
            className="px-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <textarea
          value={editedItem.description || ''}
          onChange={(e) => setEditedItem({ ...editedItem, description: e.target.value })}
          placeholder="Description"
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          rows={2}
        />
      </div>
    );
  }

  const price = getPrice();

  return (
    <div className="group relative p-4 bg-slate-50 border border-slate-200 rounded-lg hover:border-indigo-200 transition-colors">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-white rounded-lg border border-slate-100">
          <Icon className="w-4 h-4 text-slate-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm text-slate-800 truncate">{getName()}</h4>
            <span className="px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded text-[10px] uppercase">{type}</span>
          </div>
          {getDescription() && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{getDescription()}</p>
          )}
        </div>
        {price > 0 && (
          <span className="inline-flex items-center gap-0.5 px-2.5 py-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full text-xs font-bold">
            <IndianRupee className="w-3 h-3" />
            {price.toLocaleString('en-IN')}
          </span>
        )}
      </div>
      {/* Hover actions */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <button onClick={() => setIsEditing(true)} className="p-1.5 bg-white rounded shadow-sm hover:bg-indigo-50 text-indigo-600">
          <Edit2 className="w-3 h-3" />
        </button>
        <button onClick={onRemove} className="p-1.5 bg-white rounded shadow-sm hover:bg-red-50 text-red-600">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// Data Mapping & Web Presence Analysis Component
function DataMappingReview({
  rawData,
  reviewData,
  onUpdateField,
}: {
  rawData: any;
  reviewData: any;
  onUpdateField: (field: string, value: any) => void;
}) {
  const [activeTab, setActiveTab] = useState<'mapping' | 'seo' | 'reviews'>('mapping');

  // Target fields for mapping
  const targetFields = [
    { key: 'skip', label: 'Skip (Don\'t import)' },
    { key: 'identity.businessName', label: 'Business Name' },
    { key: 'identity.description', label: 'Description' },
    { key: 'personality.tagline', label: 'Tagline' },
    { key: 'identity.phone', label: 'Phone Number' },
    { key: 'identity.email', label: 'Email Address' },
    { key: 'identity.website', label: 'Website' },
    { key: 'personality.uniqueSellingPoints', label: 'Unique Selling Points' },
    { key: 'customerProfile.targetAudience', label: 'Target Audience' },
  ];

  // Extract all discovered data items with smart suggestions
  const discoveredItems = useMemo(() => {
    const items: {
      id: string;
      label: string;
      value: any;
      displayValue: string;
      suggestedTarget: string;
      source: string;
    }[] = [];

    // From website content
    const web = rawData?.fromTheWeb || {};
    if (web.websiteContent && typeof web.websiteContent === 'string' && web.websiteContent.length > 50) {
      items.push({
        id: 'web_content',
        label: 'Website Description',
        value: web.websiteContent,
        displayValue: web.websiteContent.slice(0, 150) + '...',
        suggestedTarget: 'identity.description',
        source: 'Website'
      });
    }

    // Awards
    if (web.awards && Array.isArray(web.awards) && web.awards.length > 0) {
      items.push({
        id: 'awards',
        label: 'Awards & Recognition',
        value: web.awards,
        displayValue: web.awards.slice(0, 3).join(', '),
        suggestedTarget: 'personality.uniqueSellingPoints',
        source: 'Website'
      });
    }

    // Certifications
    if (web.certifications && Array.isArray(web.certifications) && web.certifications.length > 0) {
      items.push({
        id: 'certifications',
        label: 'Certifications',
        value: web.certifications,
        displayValue: web.certifications.slice(0, 3).join(', '),
        suggestedTarget: 'personality.uniqueSellingPoints',
        source: 'Website'
      });
    }

    // Special Services
    if (web.specialServices && Array.isArray(web.specialServices) && web.specialServices.length > 0) {
      items.push({
        id: 'special_services',
        label: 'Special Services',
        value: web.specialServices,
        displayValue: web.specialServices.slice(0, 3).join(', '),
        suggestedTarget: 'personality.uniqueSellingPoints',
        source: 'Website'
      });
    }

    // Other findings
    if (web.otherFindings && Array.isArray(web.otherFindings) && web.otherFindings.length > 0) {
      items.push({
        id: 'other_findings',
        label: 'Key Highlights',
        value: web.otherFindings,
        displayValue: web.otherFindings.slice(0, 3).join(', '),
        suggestedTarget: 'personality.uniqueSellingPoints',
        source: 'Web Research'
      });
    }

    // Additional info from raw data
    if (web.additionalInfo && typeof web.additionalInfo === 'object') {
      Object.entries(web.additionalInfo).forEach(([key, value]) => {
        if (value && typeof value === 'string' && value.length > 10) {
          items.push({
            id: `additional_${key}`,
            label: key.replace(/([A-Z])/g, ' $1').trim(),
            value: value,
            displayValue: String(value).slice(0, 100) + (String(value).length > 100 ? '...' : ''),
            suggestedTarget: 'skip',
            source: 'Additional Data'
          });
        }
      });
    }

    return items;
  }, [rawData]);

  // Mapping state
  const [mappings, setMappings] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    discoveredItems.forEach(item => {
      initial[item.id] = item.suggestedTarget;
    });
    return initial;
  });

  // SEO Analysis
  const seoAnalysis = useMemo(() => {
    const checks: { label: string; status: 'good' | 'warning' | 'missing'; detail: string }[] = [];

    // Business Name
    const name = reviewData?.identity?.businessName;
    if (name && name.length >= 3) {
      checks.push({ label: 'Business Name', status: 'good', detail: `"${name}" is set` });
    } else {
      checks.push({ label: 'Business Name', status: 'missing', detail: 'Required for search visibility' });
    }

    // Description
    const desc = reviewData?.identity?.description;
    if (desc && desc.length >= 100) {
      checks.push({ label: 'Description', status: 'good', detail: `${desc.length} characters (recommended: 150+)` });
    } else if (desc && desc.length > 0) {
      checks.push({ label: 'Description', status: 'warning', detail: `Only ${desc.length} chars. Add more detail.` });
    } else {
      checks.push({ label: 'Description', status: 'missing', detail: 'Critical for SEO. Add a detailed description.' });
    }

    // Website
    const website = reviewData?.identity?.website;
    if (website && website.startsWith('http')) {
      checks.push({ label: 'Website URL', status: 'good', detail: 'Website linked' });
    } else {
      checks.push({ label: 'Website URL', status: 'warning', detail: 'Add website for better credibility' });
    }

    // Phone
    const phone = reviewData?.identity?.phone;
    if (phone) {
      checks.push({ label: 'Contact Phone', status: 'good', detail: 'Phone number available' });
    } else {
      checks.push({ label: 'Contact Phone', status: 'warning', detail: 'Add phone for customer contact' });
    }

    // USPs
    const usps = reviewData?.personality?.uniqueSellingPoints || [];
    if (usps.length >= 3) {
      checks.push({ label: 'Unique Selling Points', status: 'good', detail: `${usps.length} USPs defined` });
    } else if (usps.length > 0) {
      checks.push({ label: 'Unique Selling Points', status: 'warning', detail: `Only ${usps.length} USP. Add more.` });
    } else {
      checks.push({ label: 'Unique Selling Points', status: 'missing', detail: 'Add what makes you unique' });
    }

    // Reviews
    const reviews = rawData?.reviews || reviewData?.reviews || [];
    if (reviews.length >= 5) {
      checks.push({ label: 'Customer Reviews', status: 'good', detail: `${reviews.length} reviews imported` });
    } else if (reviews.length > 0) {
      checks.push({ label: 'Customer Reviews', status: 'warning', detail: `Only ${reviews.length} reviews` });
    } else {
      checks.push({ label: 'Customer Reviews', status: 'missing', detail: 'No reviews found' });
    }

    // Photos
    const photos = rawData?.photos || reviewData?.photos || [];
    if (photos.length >= 3) {
      checks.push({ label: 'Business Photos', status: 'good', detail: `${photos.length} photos available` });
    } else if (photos.length > 0) {
      checks.push({ label: 'Business Photos', status: 'warning', detail: `Only ${photos.length} photo(s)` });
    } else {
      checks.push({ label: 'Business Photos', status: 'missing', detail: 'Add photos to increase engagement' });
    }

    return checks;
  }, [reviewData, rawData]);

  const seoScore = Math.round((seoAnalysis.filter(c => c.status === 'good').length / seoAnalysis.length) * 100);

  // Reviews data
  const reviews = rawData?.reviews || reviewData?.reviews || [];

  // Apply a single mapping
  const applyMapping = (itemId: string) => {
    const item = discoveredItems.find(i => i.id === itemId);
    const targetKey = mappings[itemId];
    if (!item || targetKey === 'skip') return;

    const value = item.value;
    if (targetKey === 'personality.uniqueSellingPoints') {
      const current = reviewData?.personality?.uniqueSellingPoints || [];
      const newItems = Array.isArray(value) ? value : [value];
      onUpdateField(targetKey, [...current, ...newItems.filter((v: string) => !current.includes(v))]);
    } else if (targetKey === 'customerProfile.targetAudience') {
      const current = reviewData?.customerProfile?.targetAudience || [];
      const newItems = Array.isArray(value) ? value : [value];
      onUpdateField(targetKey, [...current, ...newItems]);
    } else {
      onUpdateField(targetKey, Array.isArray(value) ? value.join(', ') : value);
    }
    toast.success(`Mapped to ${targetFields.find(f => f.key === targetKey)?.label}`);
  };

  // Apply all suggested mappings
  const applyAllMappings = () => {
    let count = 0;
    discoveredItems.forEach(item => {
      const targetKey = mappings[item.id];
      if (targetKey && targetKey !== 'skip') {
        const value = item.value;
        if (targetKey === 'personality.uniqueSellingPoints') {
          const current = reviewData?.personality?.uniqueSellingPoints || [];
          const newItems = Array.isArray(value) ? value : [value];
          onUpdateField(targetKey, [...current, ...newItems.filter((v: string) => !current.includes(v))]);
        } else {
          onUpdateField(targetKey, Array.isArray(value) ? value.join(', ') : value);
        }
        count++;
      }
    });
    if (count > 0) {
      toast.success(`Applied ${count} mappings`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
        <button
          onClick={() => setActiveTab('mapping')}
          className={cn(
            "flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all",
            activeTab === 'mapping'
              ? "bg-white text-indigo-700 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          <Sparkles className="w-4 h-4 inline mr-1.5" />
          Data Mapping
        </button>
        <button
          onClick={() => setActiveTab('seo')}
          className={cn(
            "flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all",
            activeTab === 'seo'
              ? "bg-white text-indigo-700 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          <Globe className="w-4 h-4 inline mr-1.5" />
          Web Presence
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={cn(
            "flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all relative",
            activeTab === 'reviews'
              ? "bg-white text-indigo-700 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          <Star className="w-4 h-4 inline mr-1.5" />
          Reviews
          {reviews.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
              {reviews.length}
            </span>
          )}
        </button>
      </div>

      {/* Data Mapping Tab */}
      {activeTab === 'mapping' && (
        <div className="space-y-4">
          {discoveredItems.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">
                  Found <span className="font-semibold text-indigo-600">{discoveredItems.length}</span> data items to map
                </p>
                <button
                  onClick={applyAllMappings}
                  className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Apply All Suggestions
                </button>
              </div>

              <div className="space-y-3">
                {discoveredItems.map((item) => (
                  <div key={item.id} className="p-4 bg-white border border-slate-200 rounded-xl">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-indigo-600 uppercase">{item.label}</span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">
                            {item.source}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 line-clamp-2">{item.displayValue}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={mappings[item.id] || 'skip'}
                          onChange={(e) => setMappings(prev => ({ ...prev, [item.id]: e.target.value }))}
                          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {targetFields.map(field => (
                            <option key={field.key} value={field.key}>{field.label}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => applyMapping(item.id)}
                          disabled={mappings[item.id] === 'skip'}
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            mappings[item.id] === 'skip'
                              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                              : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                          )}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
              <p className="text-sm font-medium text-slate-700">All Data Organized</p>
              <p className="text-xs text-slate-500 mt-1">
                No additional data to map. Your profile is well structured.
              </p>
            </div>
          )}
        </div>
      )}

      {/* SEO / Web Presence Tab */}
      {activeTab === 'seo' && (
        <div className="space-y-4">
          {/* SEO Score */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-semibold text-slate-800">Web Presence Score</h4>
                <p className="text-sm text-slate-500">How well your business appears online</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 -rotate-90">
                    <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="none" className="text-slate-200" />
                    <circle
                      cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="none"
                      strokeDasharray={`${(seoScore / 100) * 176} 176`}
                      className={seoScore >= 70 ? 'text-green-500' : seoScore >= 40 ? 'text-amber-500' : 'text-red-500'}
                    />
                  </svg>
                  <span className={cn(
                    "absolute inset-0 flex items-center justify-center text-lg font-bold",
                    seoScore >= 70 ? 'text-green-600' : seoScore >= 40 ? 'text-amber-600' : 'text-red-600'
                  )}>
                    {seoScore}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {seoAnalysis.map((check, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-white rounded-lg">
                  <div className="flex items-center gap-2">
                    {check.status === 'good' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    {check.status === 'warning' && <AlertCircle className="w-4 h-4 text-amber-500" />}
                    {check.status === 'missing' && <X className="w-4 h-4 text-red-500" />}
                    <span className="text-sm font-medium text-slate-700">{check.label}</span>
                  </div>
                  <span className={cn(
                    "text-xs",
                    check.status === 'good' && "text-green-600",
                    check.status === 'warning' && "text-amber-600",
                    check.status === 'missing' && "text-red-600"
                  )}>
                    {check.detail}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
            <h5 className="font-medium text-amber-800 text-sm mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Recommendations
            </h5>
            <ul className="space-y-1.5 text-xs text-amber-700">
              {seoAnalysis.filter(c => c.status !== 'good').map((check, i) => (
                <li key={i}>• <strong>{check.label}:</strong> {check.detail}</li>
              ))}
              {seoAnalysis.every(c => c.status === 'good') && (
                <li>Great job! Your profile is well optimized for web presence.</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {reviews.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">
                  <span className="font-semibold text-indigo-600">{reviews.length}</span> customer reviews found
                </p>
                {/* Average rating */}
                {reviews.some((r: any) => r.rating) && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-sm font-semibold text-slate-700">
                      {(reviews.reduce((acc: number, r: any) => acc + (r.rating || 0), 0) / reviews.filter((r: any) => r.rating).length).toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-500">avg rating</span>
                  </div>
                )}
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {reviews.map((review: any, i: number) => (
                  <div key={i} className="p-4 bg-white border border-slate-200 rounded-xl">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-indigo-600">
                            {(typeof review.author === 'string' ? review.author : 'A').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-slate-800">
                            {typeof review.author === 'string' ? review.author : 'Anonymous'}
                          </span>
                          {review.date && (
                            <span className="text-xs text-slate-400 ml-2">
                              {typeof review.date === 'string' ? review.date : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      {review.rating && (
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, j) => (
                            <Star
                              key={j}
                              className={cn(
                                "w-3.5 h-3.5",
                                j < review.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"
                              )}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-slate-600">
                      {typeof review.text === 'string' ? review.text : ''}
                    </p>
                    {review.source && (
                      <span className="inline-block mt-2 text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">
                        via {typeof review.source === 'string' ? review.source : 'Unknown'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200">
              <Star className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-medium text-slate-700">No Reviews Found</p>
              <p className="text-xs text-slate-500 mt-1">
                Reviews will appear here when imported from web research
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Step indicator
function StepIndicator({ currentStep, steps }: { currentStep: WizardStep; steps: typeof STEPS }) {
  const currentIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isActive = step.id === currentStep;
        const isCompleted = index < currentIndex;

        return (
          <React.Fragment key={step.id}>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                  isCompleted && "bg-green-500 text-white",
                  isActive && "bg-indigo-600 text-white",
                  !isActive && !isCompleted && "bg-slate-200 text-slate-500"
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span className={cn(
                "text-sm font-medium hidden sm:block",
                isActive && "text-indigo-600",
                isCompleted && "text-green-600",
                !isActive && !isCompleted && "text-slate-400"
              )}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={cn(
                "flex-1 h-0.5 mx-2",
                index < currentIndex ? "bg-green-500" : "bg-slate-200"
              )} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// Main Wizard Component
export default function AutoFillReviewWizard({
  data,
  onClose,
  onApply,
  isApplying = false,
}: AutoFillReviewWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('identity');

  // Editable state for the data
  const [reviewData, setReviewData] = useState(() => {
    // Initialize with the incoming data
    return {
      identity: {
        businessName: data?.identity?.businessName || '',
        industry: data?.identity?.industry || '',
        phone: data?.identity?.phone || '',
        email: data?.identity?.email || '',
        website: data?.identity?.website || '',
        description: data?.identity?.description || '',
        address: data?.identity?.address || {},
      },
      personality: {
        tagline: data?.personality?.tagline || '',
        uniqueSellingPoints: data?.personality?.uniqueSellingPoints || [],
      },
      inventory: {
        rooms: data?.inventory?.rooms || [],
        menuItems: data?.inventory?.menuItems || [],
        products: data?.inventory?.products || [],
        services: data?.inventory?.services || [],
        properties: data?.inventory?.properties || [],
        courses: data?.inventory?.courses || [],
        treatments: data?.inventory?.treatments || [],
        memberships: data?.inventory?.memberships || [],
        vehicles: data?.inventory?.vehicles || [],
        venuePackages: data?.inventory?.venuePackages || [],
        legalServices: data?.inventory?.legalServices || [],
        financialProducts: data?.inventory?.financialProducts || [],
      },
      photos: data?.photos || [],
      reviews: data?.reviews || [],
      knowledge: {
        faqs: data?.knowledge?.faqs || [],
        productsOrServices: data?.knowledge?.productsOrServices || [],
      },
      customerProfile: {
        targetAudience: data?.customerProfile?.targetAudience || [],
      },
      fromTheWeb: data?.fromTheWeb || {},
      industrySpecificData: data?.industrySpecificData || {},
      source: data?.source,
    };
  });

  // Get icon for inventory type
  const getInventoryIcon = (type: string) => {
    const iconMap: Record<string, React.ElementType> = {
      rooms: Bed,
      menuItems: Utensils,
      products: Package,
      services: Package,
      properties: Home,
      courses: GraduationCap,
      treatments: Stethoscope,
      memberships: Users,
      vehicles: Car,
      venuePackages: Calendar,
      legalServices: Scale,
      financialProducts: Landmark,
    };
    return iconMap[type] || Package;
  };

  // Get all inventory items
  const getAllInventoryItems = () => {
    const items: { type: string; data: any[]; icon: React.ElementType }[] = [];
    const inv = reviewData.inventory;

    Object.entries(inv).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length > 0) {
        items.push({
          type: key.replace(/([A-Z])/g, ' $1').trim(),
          data: value,
          icon: getInventoryIcon(key),
        });
      }
    });

    return items;
  };

  const inventoryItems = getAllInventoryItems();

  // Update inventory item
  const updateInventoryItem = (type: string, index: number, updatedItem: any) => {
    setReviewData(prev => ({
      ...prev,
      inventory: {
        ...prev.inventory,
        [type]: prev.inventory[type as keyof typeof prev.inventory].map((item: any, i: number) =>
          i === index ? updatedItem : item
        ),
      },
    }));
  };

  // Remove inventory item
  const removeInventoryItem = (type: string, index: number) => {
    setReviewData(prev => ({
      ...prev,
      inventory: {
        ...prev.inventory,
        [type]: prev.inventory[type as keyof typeof prev.inventory].filter((_: any, i: number) => i !== index),
      },
    }));
    toast.success('Item removed');
  };

  
  // Navigation
  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);
  const canGoNext = currentStepIndex < STEPS.length - 1;
  const canGoPrev = currentStepIndex > 0;

  const goNext = () => {
    if (canGoNext) {
      setCurrentStep(STEPS[currentStepIndex + 1].id);
    }
  };

  const goPrev = () => {
    if (canGoPrev) {
      setCurrentStep(STEPS[currentStepIndex - 1].id);
    }
  };

  // Handle final apply
  const handleApply = async () => {
    await onApply(reviewData);
  };

  // Calculate summary stats
  const getStats = () => {
    const totalInventory = Object.values(reviewData.inventory).reduce((acc: number, arr: any) => acc + (arr?.length || 0), 0);
    return {
      hasIdentity: !!reviewData.identity.businessName,
      hasDescription: !!reviewData.identity.description,
      inventoryCount: totalInventory,
      photosCount: reviewData.photos?.length || 0,
      reviewsCount: reviewData.reviews?.length || 0,
      faqsCount: reviewData.knowledge.faqs?.length || 0,
    };
  };

  const stats = getStats();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Review Auto-Fill Data
            </h3>
            <p className="text-sm text-slate-500">
              Review and edit before adding to Business Profile
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} steps={STEPS} />

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Business Identity */}
          {currentStep === 'identity' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Building2 className="w-12 h-12 mx-auto text-indigo-500 mb-2" />
                <h4 className="text-lg font-semibold text-slate-800">Business Identity</h4>
                <p className="text-sm text-slate-500">Review and edit your basic business information</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <WizardEditableField
                  label="Business Name"
                  value={reviewData.identity.businessName}
                  onChange={(v) => setReviewData(prev => ({
                    ...prev,
                    identity: { ...prev.identity, businessName: v }
                  }))}
                  placeholder="Enter business name"
                  required
                />
                <WizardEditableField
                  label="Industry"
                  value={reviewData.identity.industry}
                  onChange={(v) => setReviewData(prev => ({
                    ...prev,
                    identity: { ...prev.identity, industry: v }
                  }))}
                  placeholder="e.g., Hospitality, F&B"
                />
              </div>

              <WizardEditableField
                label="Business Description"
                value={reviewData.identity.description}
                onChange={(v) => setReviewData(prev => ({
                  ...prev,
                  identity: { ...prev.identity, description: v }
                }))}
                placeholder="Tell customers about your business"
                multiline
              />

              <WizardEditableField
                label="Tagline"
                value={reviewData.personality.tagline}
                onChange={(v) => setReviewData(prev => ({
                  ...prev,
                  personality: { ...prev.personality, tagline: v }
                }))}
                placeholder="A catchy phrase for your business"
              />

              <div className="grid grid-cols-3 gap-4">
                <WizardEditableField
                  label="Phone"
                  value={reviewData.identity.phone}
                  onChange={(v) => setReviewData(prev => ({
                    ...prev,
                    identity: { ...prev.identity, phone: v }
                  }))}
                  type="phone"
                  placeholder="+91 98765 43210"
                />
                <WizardEditableField
                  label="Email"
                  value={reviewData.identity.email}
                  onChange={(v) => setReviewData(prev => ({
                    ...prev,
                    identity: { ...prev.identity, email: v }
                  }))}
                  type="email"
                  placeholder="hello@business.com"
                />
                <WizardEditableField
                  label="Website"
                  value={reviewData.identity.website}
                  onChange={(v) => setReviewData(prev => ({
                    ...prev,
                    identity: { ...prev.identity, website: v }
                  }))}
                  type="url"
                  placeholder="https://example.com"
                />
              </div>

              {/* Unique Selling Points */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-600">What Makes You Special</label>
                <div className="flex flex-wrap gap-2">
                  {reviewData.personality.uniqueSellingPoints.map((usp: string, i: number) => (
                    <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm group">
                      {typeof usp === 'string' ? usp : JSON.stringify(usp)}
                      <button
                        onClick={() => setReviewData(prev => ({
                          ...prev,
                          personality: {
                            ...prev.personality,
                            uniqueSellingPoints: prev.personality.uniqueSellingPoints.filter((_: any, idx: number) => idx !== i)
                          }
                        }))}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <button
                    onClick={() => {
                      const usp = prompt('Add a unique selling point:');
                      if (usp?.trim()) {
                        setReviewData(prev => ({
                          ...prev,
                          personality: {
                            ...prev.personality,
                            uniqueSellingPoints: [...prev.personality.uniqueSellingPoints, usp.trim()]
                          }
                        }));
                      }
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1 border border-dashed border-slate-300 text-slate-500 rounded-full text-sm hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Inventory */}
          {currentStep === 'inventory' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Package className="w-12 h-12 mx-auto text-indigo-500 mb-2" />
                <h4 className="text-lg font-semibold text-slate-800">Products & Inventory</h4>
                <p className="text-sm text-slate-500">Review and edit your products, services, and pricing</p>
              </div>

              {inventoryItems.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Package className="w-16 h-16 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm">No inventory items found</p>
                  <p className="text-xs text-slate-400 mt-1">Inventory will be populated from Auto-Fill data</p>
                </div>
              ) : (
                inventoryItems.map(({ type, data, icon: Icon }) => (
                  <div key={type}>
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className="w-4 h-4 text-slate-500" />
                      <h5 className="font-medium text-slate-700">{type}</h5>
                      <span className="text-xs text-slate-400">({data.length} items)</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {data.map((item: any, index: number) => {
                        // Get the raw type key for updating
                        const typeKey = Object.keys(reviewData.inventory).find(k =>
                          k.toLowerCase().replace(/\s/g, '') === type.toLowerCase().replace(/\s/g, '')
                        ) || type;
                        return (
                          <EditableInventoryItem
                            key={index}
                            item={item}
                            type={type}
                            icon={Icon}
                            onUpdate={(updated) => updateInventoryItem(typeKey, index, updated)}
                            onRemove={() => removeInventoryItem(typeKey, index)}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Step 3: Additional Info */}
          {currentStep === 'additional' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <FileText className="w-12 h-12 mx-auto text-indigo-500 mb-2" />
                <h4 className="text-lg font-semibold text-slate-800">Additional Information</h4>
                <p className="text-sm text-slate-500">Photos, reviews, and other data to include</p>
              </div>

              {/* Photos */}
              {reviewData.photos.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <ImageIcon className="w-4 h-4 text-slate-500" />
                    <h5 className="font-medium text-slate-700">Photos</h5>
                    <span className="text-xs text-slate-400">({reviewData.photos.length})</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {reviewData.photos.slice(0, 8).map((photo: any, i: number) => (
                      <div key={i} className="relative group aspect-square rounded-lg overflow-hidden bg-slate-100">
                        <img
                          src={typeof photo === 'string' ? photo : photo.url || photo.thumbnail}
                          alt={`Photo ${i + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2UyZThmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTRhM2I4IiBmb250LXNpemU9IjEwIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                          }}
                        />
                        <button
                          onClick={() => setReviewData(prev => ({
                            ...prev,
                            photos: prev.photos.filter((_: any, idx: number) => idx !== i)
                          }))}
                          className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews */}
              {reviewData.reviews.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-4 h-4 text-slate-500" />
                    <h5 className="font-medium text-slate-700">Customer Reviews</h5>
                    <span className="text-xs text-slate-400">({reviewData.reviews.length})</span>
                  </div>
                  <div className="space-y-2">
                    {reviewData.reviews.slice(0, 5).map((review: any, i: number) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-lg relative group">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-slate-800">
                            {typeof review.author === 'string' ? review.author : 'Anonymous'}
                          </span>
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, j) => (
                              <Star
                                key={j}
                                className={cn(
                                  "w-3 h-3",
                                  j < (review.rating || 0) ? "text-yellow-400 fill-yellow-400" : "text-slate-300"
                                )}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2">
                          {typeof review.text === 'string' ? review.text : ''}
                        </p>
                        <button
                          onClick={() => setReviewData(prev => ({
                            ...prev,
                            reviews: prev.reviews.filter((_: any, idx: number) => idx !== i)
                          }))}
                          className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FAQs */}
              {reviewData.knowledge.faqs.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="w-4 h-4 text-slate-500" />
                    <h5 className="font-medium text-slate-700">FAQs</h5>
                    <span className="text-xs text-slate-400">({reviewData.knowledge.faqs.length})</span>
                  </div>
                  <div className="space-y-2">
                    {reviewData.knowledge.faqs.map((faq: any, i: number) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-lg relative group">
                        <h6 className="font-medium text-sm text-slate-800 mb-1">
                          {typeof faq.question === 'string' ? faq.question : `Question ${i + 1}`}
                        </h6>
                        <p className="text-sm text-slate-600">
                          {typeof faq.answer === 'string' ? faq.answer : JSON.stringify(faq.answer)}
                        </p>
                        <button
                          onClick={() => setReviewData(prev => ({
                            ...prev,
                            knowledge: {
                              ...prev.knowledge,
                              faqs: prev.knowledge.faqs.filter((_: any, idx: number) => idx !== i)
                            }
                          }))}
                          className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {reviewData.photos.length === 0 && reviewData.reviews.length === 0 && reviewData.knowledge.faqs.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <FileText className="w-16 h-16 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm">No additional data found</p>
                  <p className="text-xs text-slate-400 mt-1">Photos, reviews, and FAQs will appear here</p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Data Mapping & Analysis */}
          {currentStep === 'unstructured' && (
            <div className="space-y-6">
              <div className="text-center mb-4">
                <Sparkles className="w-10 h-10 mx-auto text-indigo-500 mb-2" />
                <h4 className="text-lg font-semibold text-slate-800">Data Mapping & Analysis</h4>
                <p className="text-sm text-slate-500">Map discovered data, check web presence, and review feedback</p>
              </div>

              <DataMappingReview
                rawData={data}
                reviewData={reviewData}
                onUpdateField={(field, value) => {
                  const keys = field.split('.');
                  setReviewData(prev => {
                    const updated = { ...prev };
                    let current: any = updated;
                    for (let i = 0; i < keys.length - 1; i++) {
                      if (!current[keys[i]]) current[keys[i]] = {};
                      current = current[keys[i]];
                    }
                    current[keys[keys.length - 1]] = value;
                    return updated;
                  });
                }}
              />
            </div>
          )}

          {/* Step 5: Review */}
          {currentStep === 'review' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-2" />
                <h4 className="text-lg font-semibold text-slate-800">Review & Apply</h4>
                <p className="text-sm text-slate-500">Confirm the data to add to your Business Profile</p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className={cn(
                  "p-4 rounded-xl border-2",
                  stats.hasIdentity ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    {stats.hasIdentity ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className="font-medium text-slate-800">Identity</span>
                  </div>
                  <p className="text-sm text-slate-600">
                    {stats.hasIdentity ? reviewData.identity.businessName : 'Missing business name'}
                  </p>
                </div>

                <div className={cn(
                  "p-4 rounded-xl border-2",
                  stats.inventoryCount > 0 ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-200"
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    {stats.inventoryCount > 0 ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-400" />
                    )}
                    <span className="font-medium text-slate-800">Inventory</span>
                  </div>
                  <p className="text-sm text-slate-600">{stats.inventoryCount} items</p>
                </div>

                <div className={cn(
                  "p-4 rounded-xl border-2",
                  stats.photosCount + stats.reviewsCount > 0 ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-200"
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    {stats.photosCount + stats.reviewsCount > 0 ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-400" />
                    )}
                    <span className="font-medium text-slate-800">Additional</span>
                  </div>
                  <p className="text-sm text-slate-600">
                    {stats.photosCount} photos, {stats.reviewsCount} reviews
                  </p>
                </div>
              </div>

              {/* Detailed Summary */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                <h5 className="font-medium text-slate-800 mb-4">Data Summary</h5>
                <div className="space-y-3">
                  {reviewData.identity.businessName && (
                    <div className="flex items-start gap-3">
                      <Building2 className="w-4 h-4 text-slate-500 mt-0.5" />
                      <div>
                        <span className="text-xs text-slate-500">Business Name</span>
                        <p className="text-sm font-medium text-slate-800">{reviewData.identity.businessName}</p>
                      </div>
                    </div>
                  )}
                  {reviewData.identity.description && (
                    <div className="flex items-start gap-3">
                      <FileText className="w-4 h-4 text-slate-500 mt-0.5" />
                      <div>
                        <span className="text-xs text-slate-500">Description</span>
                        <p className="text-sm text-slate-700 line-clamp-2">{reviewData.identity.description}</p>
                      </div>
                    </div>
                  )}
                  {stats.inventoryCount > 0 && (
                    <div className="flex items-start gap-3">
                      <Package className="w-4 h-4 text-slate-500 mt-0.5" />
                      <div>
                        <span className="text-xs text-slate-500">Inventory</span>
                        <p className="text-sm text-slate-700">
                          {inventoryItems.map(i => `${i.data.length} ${i.type}`).join(', ')}
                        </p>
                      </div>
                    </div>
                  )}
                  {reviewData.personality.uniqueSellingPoints.length > 0 && (
                    <div className="flex items-start gap-3">
                      <Star className="w-4 h-4 text-slate-500 mt-0.5" />
                      <div>
                        <span className="text-xs text-slate-500">Unique Selling Points</span>
                        <p className="text-sm text-slate-700">{reviewData.personality.uniqueSellingPoints.length} points</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Warning if missing required data */}
              {!stats.hasIdentity && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h6 className="font-medium text-red-800">Missing Required Data</h6>
                    <p className="text-sm text-red-600">Business name is required. Please go back and add it.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <button
            onClick={canGoPrev ? goPrev : onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            {canGoPrev ? 'Previous' : 'Cancel'}
          </button>

          <div className="flex items-center gap-3">
            {currentStep === 'review' ? (
              <button
                onClick={handleApply}
                disabled={isApplying || !stats.hasIdentity}
                className={cn(
                  "px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all",
                  isApplying || !stats.hasIdentity
                    ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl"
                )}
              >
                {isApplying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Apply to Business Profile
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={goNext}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-indigo-700 transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
