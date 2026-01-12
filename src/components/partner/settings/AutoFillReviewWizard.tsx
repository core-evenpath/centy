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
  ArrowRight, CheckCircle2, Circle, Loader2
} from 'lucide-react';

interface AutoFillReviewWizardProps {
  data: any;
  onClose: () => void;
  onApply: (reviewedData: any) => Promise<void>;
  isApplying?: boolean;
}

type WizardStep = 'identity' | 'inventory' | 'additional' | 'unstructured' | 'review';

const STEPS: { id: WizardStep; label: string; icon: React.ElementType }[] = [
  { id: 'identity', label: 'Business Identity', icon: Building2 },
  { id: 'inventory', label: 'Products & Inventory', icon: Package },
  { id: 'additional', label: 'Additional Info', icon: FileText },
  { id: 'unstructured', label: 'Data Mapping', icon: Sparkles },
  { id: 'review', label: 'Review & Apply', icon: CheckCircle2 },
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

// Unstructured data mapper
function UnstructuredDataMapper({
  rawData,
  onMap,
}: {
  rawData: any;
  onMap: (field: string, value: any) => void;
}) {
  const [selectedField, setSelectedField] = useState<string | null>(null);

  const targetFields = [
    { key: 'identity.name', label: 'Business Name' },
    { key: 'personality.description', label: 'Description' },
    { key: 'personality.tagline', label: 'Tagline' },
    { key: 'identity.phone', label: 'Phone' },
    { key: 'identity.email', label: 'Email' },
    { key: 'identity.website', label: 'Website' },
    { key: 'personality.uniqueSellingPoints', label: 'Unique Selling Points' },
    { key: 'knowledge.productsOrServices', label: 'Products/Services' },
  ];

  // Extract displayable items from raw data
  const extractItems = (data: any, prefix = ''): { path: string; value: any; displayValue: string }[] => {
    const items: { path: string; value: any; displayValue: string }[] = [];

    if (!data || typeof data !== 'object') return items;

    Object.entries(data).forEach(([key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key;

      if (value === null || value === undefined) return;

      if (typeof value === 'string' && value.trim()) {
        items.push({ path, value, displayValue: value.length > 100 ? value.slice(0, 100) + '...' : value });
      } else if (typeof value === 'number') {
        items.push({ path, value, displayValue: String(value) });
      } else if (Array.isArray(value) && value.length > 0) {
        if (typeof value[0] === 'string') {
          items.push({ path, value, displayValue: value.slice(0, 3).join(', ') + (value.length > 3 ? '...' : '') });
        }
      }
    });

    return items;
  };

  const items = useMemo(() => {
    const result: { path: string; value: any; displayValue: string }[] = [];

    // Extract from fromTheWeb
    if (rawData?.fromTheWeb) {
      result.push(...extractItems(rawData.fromTheWeb, 'fromTheWeb'));
      if (rawData.fromTheWeb.additionalInfo) {
        result.push(...extractItems(rawData.fromTheWeb.additionalInfo, 'fromTheWeb.additionalInfo'));
      }
      if (rawData.fromTheWeb.rawIndustryData) {
        result.push(...extractItems(rawData.fromTheWeb.rawIndustryData, 'fromTheWeb.rawIndustryData'));
      }
    }

    // Extract from industrySpecificData
    if (rawData?.industrySpecificData) {
      result.push(...extractItems(rawData.industrySpecificData, 'industrySpecificData'));
    }

    return result;
  }, [rawData]);

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <Sparkles className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p className="text-sm">No unstructured data to map</p>
        <p className="text-xs text-slate-400 mt-1">All data has been categorized</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
        <p className="text-sm text-indigo-700">
          <Sparkles className="w-4 h-4 inline mr-1" />
          Map unstructured data to structured fields. Click on an item and select a target field.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Source data */}
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-2">Source Data</h4>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {items.map((item) => (
              <div
                key={item.path}
                onClick={() => setSelectedField(selectedField === item.path ? null : item.path)}
                className={cn(
                  "p-3 rounded-lg border cursor-pointer transition-all",
                  selectedField === item.path
                    ? "bg-indigo-50 border-indigo-300"
                    : "bg-white border-slate-200 hover:border-indigo-200"
                )}
              >
                <div className="text-[10px] text-slate-400 uppercase mb-1">{item.path}</div>
                <div className="text-sm text-slate-700">{item.displayValue}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Target fields */}
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-2">Map To</h4>
          <div className="space-y-2">
            {targetFields.map((field) => (
              <button
                key={field.key}
                onClick={() => {
                  if (selectedField) {
                    const item = items.find(i => i.path === selectedField);
                    if (item) {
                      onMap(field.key, item.value);
                      toast.success(`Mapped to ${field.label}`);
                      setSelectedField(null);
                    }
                  }
                }}
                disabled={!selectedField}
                className={cn(
                  "w-full p-3 text-left rounded-lg border transition-all",
                  selectedField
                    ? "bg-white border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer"
                    : "bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{field.label}</span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
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

  // Handle mapping unstructured data
  const handleMapUnstructured = (field: string, value: any) => {
    const keys = field.split('.');
    setReviewData(prev => {
      const updated = { ...prev };
      let current: any = updated;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }

      const lastKey = keys[keys.length - 1];
      if (Array.isArray(current[lastKey])) {
        current[lastKey] = Array.isArray(value) ? [...current[lastKey], ...value] : [...current[lastKey], value];
      } else {
        current[lastKey] = value;
      }

      return updated;
    });
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

          {/* Step 4: Unstructured Data */}
          {currentStep === 'unstructured' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Sparkles className="w-12 h-12 mx-auto text-indigo-500 mb-2" />
                <h4 className="text-lg font-semibold text-slate-800">Data Mapping</h4>
                <p className="text-sm text-slate-500">Map unstructured data to structured fields</p>
              </div>

              <UnstructuredDataMapper
                rawData={reviewData}
                onMap={handleMapUnstructured}
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
