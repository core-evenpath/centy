"use client";

import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, ChevronRight, X, Download, Globe, MapPin, Star, Building2, Package, Users, HelpCircle, Utensils, Bed, Home, Stethoscope, CheckSquare, Square, MinusSquare } from 'lucide-react';

// Types for selection tracking
interface SelectionState {
  // Top-level sections
  identity: {
    selected: boolean;
    fields: {
      businessName: boolean;
      industry: boolean;
      phone: boolean;
      website: boolean;
      email: boolean;
      address: boolean;
      description: boolean;
      location: boolean;
    };
  };
  photos: {
    selected: boolean;
    items: boolean[];
  };
  reviews: {
    selected: boolean;
    items: boolean[];
  };
  onlinePresence: {
    selected: boolean;
    items: boolean[];
  };
  personality: {
    selected: boolean;
    fields: {
      uniqueSellingPoints: boolean;
      tagline: boolean;
    };
  };
  customerProfile: {
    selected: boolean;
    fields: {
      targetAudience: boolean;
    };
  };
  knowledge: {
    selected: boolean;
    fields: {
      productsOrServices: boolean;
      faqs: boolean;
    };
    items: {
      productsOrServices: boolean[];
      faqs: boolean[];
    };
  };
  industrySpecificData: {
    selected: boolean;
    fields: Record<string, boolean>;
  };
  inventory: {
    selected: boolean;
    rooms: boolean[];
    menuItems: boolean[];
    products: boolean[];
    services: boolean[];
    properties: boolean[];
  };
  fromTheWeb: {
    selected: boolean;
    fields: {
      websiteContent: boolean;
      otherFindings: boolean;
      rawIndustryData: boolean;
      additionalInfo: boolean;
    };
  };
}

interface AutoFillPreviewModalProps {
  data: any;
  onClose: () => void;
  onApply: (selectedData: any) => Promise<void>;
  isApplying?: boolean;
}

// Helper to initialize selection state from data
function initializeSelectionState(data: any): SelectionState {
  return {
    identity: {
      selected: true,
      fields: {
        businessName: !!data?.identity?.businessName,
        industry: !!data?.identity?.industry,
        phone: !!data?.identity?.phone,
        website: !!data?.identity?.website,
        email: !!data?.identity?.email,
        address: !!data?.identity?.address?.street || !!data?.identity?.address?.city,
        description: !!data?.identity?.description,
        location: !!data?.identity?.location,
      },
    },
    photos: {
      selected: (data?.photos?.length || 0) > 0,
      items: (data?.photos || []).map(() => true),
    },
    reviews: {
      selected: (data?.reviews?.length || 0) > 0,
      items: (data?.reviews || []).map(() => true),
    },
    onlinePresence: {
      selected: (data?.onlinePresence?.length || 0) > 0,
      items: (data?.onlinePresence || []).map(() => true),
    },
    personality: {
      selected: true,
      fields: {
        uniqueSellingPoints: (data?.personality?.uniqueSellingPoints?.length || 0) > 0,
        tagline: !!data?.personality?.tagline,
      },
    },
    customerProfile: {
      selected: true,
      fields: {
        targetAudience: (data?.customerProfile?.targetAudience?.length || 0) > 0,
      },
    },
    knowledge: {
      selected: true,
      fields: {
        productsOrServices: (data?.knowledge?.productsOrServices?.length || 0) > 0,
        faqs: (data?.knowledge?.faqs?.length || 0) > 0,
      },
      items: {
        productsOrServices: (data?.knowledge?.productsOrServices || []).map(() => true),
        faqs: (data?.knowledge?.faqs || []).map(() => true),
      },
    },
    industrySpecificData: {
      selected: !!data?.industrySpecificData && Object.keys(data.industrySpecificData).length > 0,
      fields: Object.keys(data?.industrySpecificData || {}).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {} as Record<string, boolean>),
    },
    inventory: {
      selected: !!(data?.inventory && (
        data.inventory.rooms?.length ||
        data.inventory.menuItems?.length ||
        data.inventory.products?.length ||
        data.inventory.services?.length ||
        data.inventory.properties?.length
      )),
      rooms: (data?.inventory?.rooms || []).map(() => true),
      menuItems: (data?.inventory?.menuItems || []).map(() => true),
      products: (data?.inventory?.products || []).map(() => true),
      services: (data?.inventory?.services || []).map(() => true),
      properties: (data?.inventory?.properties || []).map(() => true),
    },
    fromTheWeb: {
      selected: !!data?.fromTheWeb && Object.keys(data.fromTheWeb).length > 0,
      fields: {
        websiteContent: !!data?.fromTheWeb?.websiteContent,
        otherFindings: (data?.fromTheWeb?.otherFindings?.length || 0) > 0,
        rawIndustryData: !!data?.fromTheWeb?.rawIndustryData && Object.keys(data.fromTheWeb.rawIndustryData).length > 0,
        additionalInfo: !!data?.fromTheWeb?.additionalInfo && Object.keys(data.fromTheWeb.additionalInfo).length > 0,
      },
    },
  };
}

// Build filtered data based on selection
function buildSelectedData(data: any, selection: SelectionState): any {
  const result: any = {
    source: data.source,
  };

  // Identity
  if (selection.identity.selected) {
    result.identity = {};
    if (selection.identity.fields.businessName && data.identity?.businessName) {
      result.identity.businessName = data.identity.businessName;
    }
    if (selection.identity.fields.industry && data.identity?.industry) {
      result.identity.industry = data.identity.industry;
    }
    if (selection.identity.fields.phone && data.identity?.phone) {
      result.identity.phone = data.identity.phone;
    }
    if (selection.identity.fields.website && data.identity?.website) {
      result.identity.website = data.identity.website;
    }
    if (selection.identity.fields.email && data.identity?.email) {
      result.identity.email = data.identity.email;
    }
    if (selection.identity.fields.address && data.identity?.address) {
      result.identity.address = data.identity.address;
    }
    if (selection.identity.fields.description && data.identity?.description) {
      result.identity.description = data.identity.description;
    }
    if (selection.identity.fields.location && data.identity?.location) {
      result.identity.location = data.identity.location;
      result.identity.googleMapsUrl = data.identity.googleMapsUrl;
      result.identity.plusCode = data.identity.plusCode;
    }
  }

  // Photos
  if (selection.photos.selected && data.photos?.length > 0) {
    result.photos = data.photos.filter((_: any, i: number) => selection.photos.items[i]);
  }

  // Reviews
  if (selection.reviews.selected && data.reviews?.length > 0) {
    result.reviews = data.reviews.filter((_: any, i: number) => selection.reviews.items[i]);
  }

  // Online Presence
  if (selection.onlinePresence.selected && data.onlinePresence?.length > 0) {
    result.onlinePresence = data.onlinePresence.filter((_: any, i: number) => selection.onlinePresence.items[i]);
  }

  // Personality
  if (selection.personality.selected) {
    result.personality = {};
    if (selection.personality.fields.uniqueSellingPoints && data.personality?.uniqueSellingPoints?.length > 0) {
      result.personality.uniqueSellingPoints = data.personality.uniqueSellingPoints;
    }
    if (selection.personality.fields.tagline && data.personality?.tagline) {
      result.personality.tagline = data.personality.tagline;
    }
  }

  // Customer Profile
  if (selection.customerProfile.selected) {
    result.customerProfile = {};
    if (selection.customerProfile.fields.targetAudience && data.customerProfile?.targetAudience?.length > 0) {
      result.customerProfile.targetAudience = data.customerProfile.targetAudience;
    }
  }

  // Knowledge
  if (selection.knowledge.selected) {
    result.knowledge = {};
    if (selection.knowledge.fields.productsOrServices && data.knowledge?.productsOrServices?.length > 0) {
      result.knowledge.productsOrServices = data.knowledge.productsOrServices.filter(
        (_: any, i: number) => selection.knowledge.items.productsOrServices[i]
      );
    }
    if (selection.knowledge.fields.faqs && data.knowledge?.faqs?.length > 0) {
      result.knowledge.faqs = data.knowledge.faqs.filter(
        (_: any, i: number) => selection.knowledge.items.faqs[i]
      );
    }
  }

  // Industry Specific Data
  if (selection.industrySpecificData.selected && data.industrySpecificData) {
    result.industrySpecificData = {};
    Object.keys(selection.industrySpecificData.fields).forEach(key => {
      if (selection.industrySpecificData.fields[key] && data.industrySpecificData[key] !== undefined) {
        result.industrySpecificData[key] = data.industrySpecificData[key];
      }
    });
  }

  // Inventory
  if (selection.inventory.selected && data.inventory) {
    result.inventory = {};
    if (data.inventory.rooms?.length > 0) {
      result.inventory.rooms = data.inventory.rooms.filter((_: any, i: number) => selection.inventory.rooms[i]);
    }
    if (data.inventory.menuItems?.length > 0) {
      result.inventory.menuItems = data.inventory.menuItems.filter((_: any, i: number) => selection.inventory.menuItems[i]);
    }
    if (data.inventory.products?.length > 0) {
      result.inventory.products = data.inventory.products.filter((_: any, i: number) => selection.inventory.products[i]);
    }
    if (data.inventory.services?.length > 0) {
      result.inventory.services = data.inventory.services.filter((_: any, i: number) => selection.inventory.services[i]);
    }
    if (data.inventory.properties?.length > 0) {
      result.inventory.properties = data.inventory.properties.filter((_: any, i: number) => selection.inventory.properties[i]);
    }
  }

  // From the Web
  if (selection.fromTheWeb.selected && data.fromTheWeb) {
    result.fromTheWeb = {};
    if (selection.fromTheWeb.fields.websiteContent && data.fromTheWeb.websiteContent) {
      result.fromTheWeb.websiteContent = data.fromTheWeb.websiteContent;
    }
    if (selection.fromTheWeb.fields.otherFindings && data.fromTheWeb.otherFindings?.length > 0) {
      result.fromTheWeb.otherFindings = data.fromTheWeb.otherFindings;
    }
    if (selection.fromTheWeb.fields.rawIndustryData && data.fromTheWeb.rawIndustryData) {
      result.fromTheWeb.rawIndustryData = data.fromTheWeb.rawIndustryData;
    }
    if (selection.fromTheWeb.fields.additionalInfo && data.fromTheWeb.additionalInfo) {
      result.fromTheWeb.additionalInfo = data.fromTheWeb.additionalInfo;
    }
  }

  return result;
}

// Section Header with checkbox
function SectionHeader({
  icon: Icon,
  title,
  count,
  selected,
  onToggle,
  expanded,
  onExpandToggle,
  badge,
  children,
}: {
  icon: any;
  title: string;
  count?: number;
  selected: boolean;
  onToggle: () => void;
  expanded: boolean;
  onExpandToggle: () => void;
  badge?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <div
        className={cn(
          "flex items-center gap-3 p-3 cursor-pointer transition-colors",
          selected ? "bg-indigo-50" : "bg-slate-50"
        )}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className={cn(
            "w-5 h-5 rounded flex items-center justify-center transition-colors",
            selected ? "bg-indigo-600 text-white" : "bg-white border border-slate-300"
          )}
        >
          {selected && <Check className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={onExpandToggle}
          className="flex-1 flex items-center gap-2 text-left"
        >
          <Icon className="w-4 h-4 text-slate-600" />
          <span className="font-medium text-slate-800">{title}</span>
          {count !== undefined && count > 0 && (
            <span className="text-xs px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded">
              {count}
            </span>
          )}
          {badge && (
            <span className="text-xs px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded">
              {badge}
            </span>
          )}
        </button>
        <button onClick={onExpandToggle} className="p-1">
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
        </button>
      </div>
      {expanded && children && (
        <div className="p-3 pt-0 bg-white border-t border-slate-100">
          {children}
        </div>
      )}
    </div>
  );
}

// Selectable Item
function SelectableItem({
  selected,
  onToggle,
  children,
  className,
}: {
  selected: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      onClick={onToggle}
      className={cn(
        "flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-all",
        selected ? "bg-indigo-50 border border-indigo-200" : "bg-slate-50 border border-slate-200 opacity-60",
        className
      )}
    >
      <div
        className={cn(
          "w-4 h-4 rounded flex-shrink-0 flex items-center justify-center mt-0.5 transition-colors",
          selected ? "bg-indigo-600 text-white" : "bg-white border border-slate-300"
        )}
      >
        {selected && <Check className="w-3 h-3" />}
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

// Select All / Deselect All for array sections
function SelectAllControls({
  items,
  onSelectAll,
  onDeselectAll,
}: {
  items: boolean[];
  onSelectAll: () => void;
  onDeselectAll: () => void;
}) {
  const selectedCount = items.filter(Boolean).length;
  const total = items.length;

  return (
    <div className="flex items-center gap-2 mt-2 mb-2 text-xs">
      <button
        onClick={onSelectAll}
        className="text-indigo-600 hover:text-indigo-800 font-medium"
      >
        Select All
      </button>
      <span className="text-slate-300">|</span>
      <button
        onClick={onDeselectAll}
        className="text-slate-500 hover:text-slate-700 font-medium"
      >
        Deselect All
      </button>
      <span className="ml-auto text-slate-400">
        {selectedCount}/{total} selected
      </span>
    </div>
  );
}

export default function AutoFillPreviewModal({
  data,
  onClose,
  onApply,
  isApplying = false,
}: AutoFillPreviewModalProps) {
  const [selection, setSelection] = useState<SelectionState>(() => initializeSelectionState(data));
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['identity', 'inventory']));

  // Calculate selection counts
  const selectionCounts = useMemo(() => {
    let total = 0;
    let selected = 0;

    // Identity fields
    Object.values(selection.identity.fields).forEach(v => {
      if (v !== undefined) total++;
      if (v && selection.identity.selected) selected++;
    });

    // Photos
    total += selection.photos.items.length;
    if (selection.photos.selected) selected += selection.photos.items.filter(Boolean).length;

    // Reviews
    total += selection.reviews.items.length;
    if (selection.reviews.selected) selected += selection.reviews.items.filter(Boolean).length;

    // Inventory items
    const invItems = [
      ...selection.inventory.rooms,
      ...selection.inventory.menuItems,
      ...selection.inventory.products,
      ...selection.inventory.services,
      ...selection.inventory.properties,
    ];
    total += invItems.length;
    if (selection.inventory.selected) selected += invItems.filter(Boolean).length;

    // FAQs
    total += selection.knowledge.items.faqs.length;
    if (selection.knowledge.selected && selection.knowledge.fields.faqs) {
      selected += selection.knowledge.items.faqs.filter(Boolean).length;
    }

    // Products/Services
    total += selection.knowledge.items.productsOrServices.length;
    if (selection.knowledge.selected && selection.knowledge.fields.productsOrServices) {
      selected += selection.knowledge.items.productsOrServices.filter(Boolean).length;
    }

    return { total, selected };
  }, [selection]);

  const toggleSection = (section: keyof SelectionState) => {
    setSelection(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        selected: !prev[section].selected,
      },
    }));
  };

  const toggleExpanded = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelection(initializeSelectionState(data));
  };

  const handleDeselectAll = () => {
    setSelection(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(key => {
        const section = next[key as keyof SelectionState];
        if (typeof section === 'object' && 'selected' in section) {
          (section as any).selected = false;
        }
      });
      return next;
    });
  };

  const handleApply = async () => {
    const selectedData = buildSelectedData(data, selection);
    await onApply(selectedData);
  };

  const handleSaveJson = () => {
    const selectedData = buildSelectedData(data, selection);
    const dataStr = JSON.stringify(selectedData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.identity?.businessName?.replace(/\s+/g, '_') || 'business'}_profile.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Selected data saved as JSON!');
  };

  // Helper to check if we have data for a section
  const hasData = (section: string): boolean => {
    switch (section) {
      case 'identity':
        return !!data?.identity && Object.keys(data.identity).length > 0;
      case 'photos':
        return (data?.photos?.length || 0) > 0;
      case 'reviews':
        return (data?.reviews?.length || 0) > 0;
      case 'onlinePresence':
        return (data?.onlinePresence?.length || 0) > 0;
      case 'personality':
        return !!(data?.personality?.uniqueSellingPoints?.length || data?.personality?.tagline);
      case 'customerProfile':
        return (data?.customerProfile?.targetAudience?.length || 0) > 0;
      case 'knowledge':
        return !!(data?.knowledge?.productsOrServices?.length || data?.knowledge?.faqs?.length);
      case 'industrySpecificData':
        return !!data?.industrySpecificData && Object.keys(data.industrySpecificData).filter(k =>
          !['googleRating', 'googleReviewCount', 'priceLevel'].includes(k)
        ).length > 0;
      case 'inventory':
        return !!(data?.inventory && (
          data.inventory.rooms?.length ||
          data.inventory.menuItems?.length ||
          data.inventory.products?.length ||
          data.inventory.services?.length ||
          data.inventory.properties?.length
        ));
      case 'fromTheWeb':
        return !!data?.fromTheWeb && Object.keys(data.fromTheWeb).length > 0;
      default:
        return false;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Select Data to Import</h3>
            <p className="text-sm text-slate-500">
              {data.identity?.businessName || 'Business Profile'} - Choose which data to apply
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveJson}
              className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-all flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              Save JSON
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Selection Controls */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAll}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
            >
              <CheckSquare className="w-4 h-4" />
              Select All
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={handleDeselectAll}
              className="text-sm text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1"
            >
              <Square className="w-4 h-4" />
              Deselect All
            </button>
          </div>
          <div className="text-sm text-slate-500">
            <span className="font-medium text-indigo-600">{selectionCounts.selected}</span>
            <span className="text-slate-400"> / {selectionCounts.total} items selected</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">

          {/* Business Identity Section */}
          {hasData('identity') && (
            <SectionHeader
              icon={Building2}
              title="Business Identity"
              selected={selection.identity.selected}
              onToggle={() => toggleSection('identity')}
              expanded={expandedSections.has('identity')}
              onExpandToggle={() => toggleExpanded('identity')}
            >
              <div className="grid grid-cols-2 gap-2 mt-3">
                {data.identity?.businessName && (
                  <SelectableItem
                    selected={selection.identity.fields.businessName && selection.identity.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      identity: {
                        ...prev.identity,
                        fields: { ...prev.identity.fields, businessName: !prev.identity.fields.businessName }
                      }
                    }))}
                  >
                    <div className="text-xs text-slate-500">Business Name</div>
                    <div className="text-sm font-medium text-slate-800">{data.identity.businessName}</div>
                  </SelectableItem>
                )}
                {data.identity?.industry && (
                  <SelectableItem
                    selected={selection.identity.fields.industry && selection.identity.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      identity: {
                        ...prev.identity,
                        fields: { ...prev.identity.fields, industry: !prev.identity.fields.industry }
                      }
                    }))}
                  >
                    <div className="text-xs text-slate-500">Industry</div>
                    <div className="text-sm font-medium text-slate-800">{data.identity.industry}</div>
                  </SelectableItem>
                )}
                {data.identity?.phone && (
                  <SelectableItem
                    selected={selection.identity.fields.phone && selection.identity.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      identity: {
                        ...prev.identity,
                        fields: { ...prev.identity.fields, phone: !prev.identity.fields.phone }
                      }
                    }))}
                  >
                    <div className="text-xs text-slate-500">Phone</div>
                    <div className="text-sm font-medium text-slate-800">{data.identity.phone}</div>
                  </SelectableItem>
                )}
                {data.identity?.website && (
                  <SelectableItem
                    selected={selection.identity.fields.website && selection.identity.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      identity: {
                        ...prev.identity,
                        fields: { ...prev.identity.fields, website: !prev.identity.fields.website }
                      }
                    }))}
                  >
                    <div className="text-xs text-slate-500">Website</div>
                    <div className="text-sm font-medium text-slate-800 truncate">{data.identity.website}</div>
                  </SelectableItem>
                )}
                {data.identity?.email && (
                  <SelectableItem
                    selected={selection.identity.fields.email && selection.identity.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      identity: {
                        ...prev.identity,
                        fields: { ...prev.identity.fields, email: !prev.identity.fields.email }
                      }
                    }))}
                  >
                    <div className="text-xs text-slate-500">Email</div>
                    <div className="text-sm font-medium text-slate-800">{data.identity.email}</div>
                  </SelectableItem>
                )}
                {(data.identity?.address?.street || data.identity?.address?.city) && (
                  <SelectableItem
                    selected={selection.identity.fields.address && selection.identity.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      identity: {
                        ...prev.identity,
                        fields: { ...prev.identity.fields, address: !prev.identity.fields.address }
                      }
                    }))}
                    className="col-span-2"
                  >
                    <div className="text-xs text-slate-500">Address</div>
                    <div className="text-sm font-medium text-slate-800">
                      {data.identity.address.street && <div>{data.identity.address.street}</div>}
                      <div>
                        {[data.identity.address.city, data.identity.address.state, data.identity.address.country]
                          .filter(Boolean)
                          .join(', ')}
                      </div>
                    </div>
                  </SelectableItem>
                )}
                {data.identity?.description && (
                  <SelectableItem
                    selected={selection.identity.fields.description && selection.identity.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      identity: {
                        ...prev.identity,
                        fields: { ...prev.identity.fields, description: !prev.identity.fields.description }
                      }
                    }))}
                    className="col-span-2"
                  >
                    <div className="text-xs text-slate-500">Description</div>
                    <div className="text-sm text-slate-700 line-clamp-3">{data.identity.description}</div>
                  </SelectableItem>
                )}
                {data.identity?.location && (
                  <SelectableItem
                    selected={selection.identity.fields.location && selection.identity.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      identity: {
                        ...prev.identity,
                        fields: { ...prev.identity.fields, location: !prev.identity.fields.location }
                      }
                    }))}
                    className="col-span-2"
                  >
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Location Coordinates
                    </div>
                    <div className="text-sm font-mono text-slate-700">
                      {data.identity.location.lat.toFixed(6)}, {data.identity.location.lng.toFixed(6)}
                      {data.identity.plusCode && (
                        <span className="ml-2 text-slate-500">({data.identity.plusCode})</span>
                      )}
                    </div>
                  </SelectableItem>
                )}
              </div>
            </SectionHeader>
          )}

          {/* Photos Section */}
          {hasData('photos') && (
            <SectionHeader
              icon={Globe}
              title="Photos"
              count={data.photos?.length}
              selected={selection.photos.selected}
              onToggle={() => toggleSection('photos')}
              expanded={expandedSections.has('photos')}
              onExpandToggle={() => toggleExpanded('photos')}
            >
              <SelectAllControls
                items={selection.photos.items}
                onSelectAll={() => setSelection(prev => ({
                  ...prev,
                  photos: { ...prev.photos, items: prev.photos.items.map(() => true) }
                }))}
                onDeselectAll={() => setSelection(prev => ({
                  ...prev,
                  photos: { ...prev.photos, items: prev.photos.items.map(() => false) }
                }))}
              />
              <div className="grid grid-cols-5 gap-2 mt-2">
                {data.photos?.map((photo: any, i: number) => (
                  <div
                    key={i}
                    onClick={() => setSelection(prev => {
                      const items = [...prev.photos.items];
                      items[i] = !items[i];
                      return { ...prev, photos: { ...prev.photos, items } };
                    })}
                    className={cn(
                      "relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all",
                      selection.photos.items[i] && selection.photos.selected
                        ? "border-indigo-500 ring-2 ring-indigo-200"
                        : "border-transparent opacity-50 hover:opacity-75"
                    )}
                  >
                    <img src={photo.url} alt="" className="w-full h-full object-cover" />
                    {selection.photos.items[i] && selection.photos.selected && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center text-white">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </SectionHeader>
          )}

          {/* Reviews Section */}
          {hasData('reviews') && (
            <SectionHeader
              icon={Star}
              title="Reviews & Testimonials"
              count={data.reviews?.length}
              selected={selection.reviews.selected}
              onToggle={() => toggleSection('reviews')}
              expanded={expandedSections.has('reviews')}
              onExpandToggle={() => toggleExpanded('reviews')}
              badge={data.industrySpecificData?.googleRating ? `${data.industrySpecificData.googleRating}/5` : undefined}
            >
              <SelectAllControls
                items={selection.reviews.items}
                onSelectAll={() => setSelection(prev => ({
                  ...prev,
                  reviews: { ...prev.reviews, items: prev.reviews.items.map(() => true) }
                }))}
                onDeselectAll={() => setSelection(prev => ({
                  ...prev,
                  reviews: { ...prev.reviews, items: prev.reviews.items.map(() => false) }
                }))}
              />
              <div className="space-y-2 mt-2 max-h-60 overflow-y-auto">
                {data.reviews?.map((review: any, i: number) => (
                  <SelectableItem
                    key={i}
                    selected={selection.reviews.items[i] && selection.reviews.selected}
                    onToggle={() => setSelection(prev => {
                      const items = [...prev.reviews.items];
                      items[i] = !items[i];
                      return { ...prev, reviews: { ...prev.reviews, items } };
                    })}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-slate-800">{review.author}</span>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-amber-500">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                        <span className={cn(
                          "px-1.5 py-0.5 rounded",
                          review.source === 'google' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        )}>
                          {review.source === 'google' ? 'Google' : 'Web'}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">{review.text}</p>
                  </SelectableItem>
                ))}
              </div>
            </SectionHeader>
          )}

          {/* Online Presence Section */}
          {hasData('onlinePresence') && (
            <SectionHeader
              icon={Globe}
              title="Online Presence"
              count={data.onlinePresence?.length}
              selected={selection.onlinePresence.selected}
              onToggle={() => toggleSection('onlinePresence')}
              expanded={expandedSections.has('onlinePresence')}
              onExpandToggle={() => toggleExpanded('onlinePresence')}
            >
              <div className="grid grid-cols-2 gap-2 mt-3">
                {data.onlinePresence?.map((presence: any, i: number) => (
                  <SelectableItem
                    key={i}
                    selected={selection.onlinePresence.items[i] && selection.onlinePresence.selected}
                    onToggle={() => setSelection(prev => {
                      const items = [...prev.onlinePresence.items];
                      items[i] = !items[i];
                      return { ...prev, onlinePresence: { ...prev.onlinePresence, items } };
                    })}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-slate-800">{presence.source}</span>
                      {presence.rating && (
                        <span className="text-sm font-semibold text-amber-600">{presence.rating}★</span>
                      )}
                    </div>
                    {presence.reviewCount && (
                      <p className="text-xs text-slate-500">{presence.reviewCount} reviews</p>
                    )}
                  </SelectableItem>
                ))}
              </div>
            </SectionHeader>
          )}

          {/* USPs & Target Audience */}
          {(hasData('personality') || hasData('customerProfile')) && (
            <div className="grid grid-cols-2 gap-3">
              {hasData('personality') && (
                <SectionHeader
                  icon={Star}
                  title="Unique Selling Points"
                  count={data.personality?.uniqueSellingPoints?.length}
                  selected={selection.personality.selected}
                  onToggle={() => toggleSection('personality')}
                  expanded={expandedSections.has('personality')}
                  onExpandToggle={() => toggleExpanded('personality')}
                >
                  <div className="flex flex-wrap gap-2 mt-3">
                    {data.personality?.uniqueSellingPoints?.map((usp: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs">
                        {usp}
                      </span>
                    ))}
                  </div>
                </SectionHeader>
              )}

              {hasData('customerProfile') && (
                <SectionHeader
                  icon={Users}
                  title="Target Audience"
                  count={data.customerProfile?.targetAudience?.length}
                  selected={selection.customerProfile.selected}
                  onToggle={() => toggleSection('customerProfile')}
                  expanded={expandedSections.has('customerProfile')}
                  onExpandToggle={() => toggleExpanded('customerProfile')}
                >
                  <div className="flex flex-wrap gap-2 mt-3">
                    {data.customerProfile?.targetAudience?.map((audience: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                        {audience}
                      </span>
                    ))}
                  </div>
                </SectionHeader>
              )}
            </div>
          )}

          {/* Products/Services & FAQs */}
          {hasData('knowledge') && (
            <SectionHeader
              icon={Package}
              title="Products, Services & FAQs"
              count={(data.knowledge?.productsOrServices?.length || 0) + (data.knowledge?.faqs?.length || 0)}
              selected={selection.knowledge.selected}
              onToggle={() => toggleSection('knowledge')}
              expanded={expandedSections.has('knowledge')}
              onExpandToggle={() => toggleExpanded('knowledge')}
            >
              {data.knowledge?.productsOrServices?.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-600">Products & Services ({data.knowledge.productsOrServices.length})</span>
                    <SelectAllControls
                      items={selection.knowledge.items.productsOrServices}
                      onSelectAll={() => setSelection(prev => ({
                        ...prev,
                        knowledge: {
                          ...prev.knowledge,
                          items: { ...prev.knowledge.items, productsOrServices: prev.knowledge.items.productsOrServices.map(() => true) }
                        }
                      }))}
                      onDeselectAll={() => setSelection(prev => ({
                        ...prev,
                        knowledge: {
                          ...prev.knowledge,
                          items: { ...prev.knowledge.items, productsOrServices: prev.knowledge.items.productsOrServices.map(() => false) }
                        }
                      }))}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {data.knowledge.productsOrServices.map((item: any, i: number) => (
                      <span
                        key={i}
                        onClick={() => setSelection(prev => {
                          const items = [...prev.knowledge.items.productsOrServices];
                          items[i] = !items[i];
                          return {
                            ...prev,
                            knowledge: { ...prev.knowledge, items: { ...prev.knowledge.items, productsOrServices: items } }
                          };
                        })}
                        className={cn(
                          "px-2 py-1 rounded-full text-xs cursor-pointer transition-all",
                          selection.knowledge.items.productsOrServices[i] && selection.knowledge.selected
                            ? "bg-purple-100 text-purple-700"
                            : "bg-slate-100 text-slate-400 line-through"
                        )}
                      >
                        {item.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {data.knowledge?.faqs?.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-600">FAQs ({data.knowledge.faqs.length})</span>
                    <SelectAllControls
                      items={selection.knowledge.items.faqs}
                      onSelectAll={() => setSelection(prev => ({
                        ...prev,
                        knowledge: {
                          ...prev.knowledge,
                          items: { ...prev.knowledge.items, faqs: prev.knowledge.items.faqs.map(() => true) }
                        }
                      }))}
                      onDeselectAll={() => setSelection(prev => ({
                        ...prev,
                        knowledge: {
                          ...prev.knowledge,
                          items: { ...prev.knowledge.items, faqs: prev.knowledge.items.faqs.map(() => false) }
                        }
                      }))}
                    />
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {data.knowledge.faqs.map((faq: any, i: number) => (
                      <SelectableItem
                        key={i}
                        selected={selection.knowledge.items.faqs[i] && selection.knowledge.selected}
                        onToggle={() => setSelection(prev => {
                          const items = [...prev.knowledge.items.faqs];
                          items[i] = !items[i];
                          return {
                            ...prev,
                            knowledge: { ...prev.knowledge, items: { ...prev.knowledge.items, faqs: items } }
                          };
                        })}
                      >
                        <div className="text-xs font-medium text-slate-800">Q: {faq.question}</div>
                        <div className="text-xs text-slate-600 line-clamp-2">A: {faq.answer}</div>
                      </SelectableItem>
                    ))}
                  </div>
                </div>
              )}
            </SectionHeader>
          )}

          {/* Inventory Section */}
          {hasData('inventory') && (
            <SectionHeader
              icon={Package}
              title="Inventory Data"
              count={
                (data.inventory?.rooms?.length || 0) +
                (data.inventory?.menuItems?.length || 0) +
                (data.inventory?.products?.length || 0) +
                (data.inventory?.services?.length || 0) +
                (data.inventory?.properties?.length || 0)
              }
              selected={selection.inventory.selected}
              onToggle={() => toggleSection('inventory')}
              expanded={expandedSections.has('inventory')}
              onExpandToggle={() => toggleExpanded('inventory')}
              badge="Ready for Import"
            >
              {/* Rooms */}
              {data.inventory?.rooms?.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-600 flex items-center gap-1">
                      <Bed className="w-3 h-3" /> Rooms ({data.inventory.rooms.length})
                    </span>
                    <SelectAllControls
                      items={selection.inventory.rooms}
                      onSelectAll={() => setSelection(prev => ({
                        ...prev,
                        inventory: { ...prev.inventory, rooms: prev.inventory.rooms.map(() => true) }
                      }))}
                      onDeselectAll={() => setSelection(prev => ({
                        ...prev,
                        inventory: { ...prev.inventory, rooms: prev.inventory.rooms.map(() => false) }
                      }))}
                    />
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {data.inventory.rooms.map((room: any, i: number) => (
                      <SelectableItem
                        key={i}
                        selected={selection.inventory.rooms[i] && selection.inventory.selected}
                        onToggle={() => setSelection(prev => {
                          const rooms = [...prev.inventory.rooms];
                          rooms[i] = !rooms[i];
                          return { ...prev, inventory: { ...prev.inventory, rooms } };
                        })}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-medium text-sm text-slate-800">{room.name}</span>
                            {room.category && <span className="ml-2 text-xs text-slate-500">({room.category})</span>}
                          </div>
                          {room.price && (
                            <span className="font-semibold text-sm text-orange-600">
                              ₹{room.price?.toLocaleString()}{room.priceUnit ? `/${room.priceUnit}` : '/night'}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {[room.bedType, room.maxOccupancy && `${room.maxOccupancy} guests`, room.size].filter(Boolean).join(' • ')}
                        </div>
                      </SelectableItem>
                    ))}
                  </div>
                </div>
              )}

              {/* Menu Items */}
              {data.inventory?.menuItems?.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-600 flex items-center gap-1">
                      <Utensils className="w-3 h-3" /> Menu Items ({data.inventory.menuItems.length})
                    </span>
                    <SelectAllControls
                      items={selection.inventory.menuItems}
                      onSelectAll={() => setSelection(prev => ({
                        ...prev,
                        inventory: { ...prev.inventory, menuItems: prev.inventory.menuItems.map(() => true) }
                      }))}
                      onDeselectAll={() => setSelection(prev => ({
                        ...prev,
                        inventory: { ...prev.inventory, menuItems: prev.inventory.menuItems.map(() => false) }
                      }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {data.inventory.menuItems.map((item: any, i: number) => (
                      <SelectableItem
                        key={i}
                        selected={selection.inventory.menuItems[i] && selection.inventory.selected}
                        onToggle={() => setSelection(prev => {
                          const menuItems = [...prev.inventory.menuItems];
                          menuItems[i] = !menuItems[i];
                          return { ...prev, inventory: { ...prev.inventory, menuItems } };
                        })}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-1">
                            {item.isVeg !== undefined && (
                              <span className={item.isVeg ? 'text-green-600' : 'text-red-600'}>
                                {item.isVeg ? '🟢' : '🔴'}
                              </span>
                            )}
                            <span className="font-medium text-xs text-slate-800">{item.name}</span>
                          </div>
                          {item.price && <span className="font-semibold text-xs text-orange-600">₹{item.price}</span>}
                        </div>
                        {item.category && <div className="text-[10px] text-slate-500">{item.category}</div>}
                      </SelectableItem>
                    ))}
                  </div>
                </div>
              )}

              {/* Products */}
              {data.inventory?.products?.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-600 flex items-center gap-1">
                      <Package className="w-3 h-3" /> Products ({data.inventory.products.length})
                    </span>
                    <SelectAllControls
                      items={selection.inventory.products}
                      onSelectAll={() => setSelection(prev => ({
                        ...prev,
                        inventory: { ...prev.inventory, products: prev.inventory.products.map(() => true) }
                      }))}
                      onDeselectAll={() => setSelection(prev => ({
                        ...prev,
                        inventory: { ...prev.inventory, products: prev.inventory.products.map(() => false) }
                      }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {data.inventory.products.map((product: any, i: number) => (
                      <SelectableItem
                        key={i}
                        selected={selection.inventory.products[i] && selection.inventory.selected}
                        onToggle={() => setSelection(prev => {
                          const products = [...prev.inventory.products];
                          products[i] = !products[i];
                          return { ...prev, inventory: { ...prev.inventory, products } };
                        })}
                      >
                        <div className="font-medium text-xs text-slate-800">{product.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {product.price && <span className="font-semibold text-xs text-orange-600">₹{product.price}</span>}
                          {product.mrp && product.mrp > product.price && (
                            <span className="text-[10px] text-slate-400 line-through">₹{product.mrp}</span>
                          )}
                        </div>
                        {product.brand && <div className="text-[10px] text-slate-500">{product.brand}</div>}
                      </SelectableItem>
                    ))}
                  </div>
                </div>
              )}

              {/* Services (Healthcare) */}
              {data.inventory?.services?.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-600 flex items-center gap-1">
                      <Stethoscope className="w-3 h-3" /> Services ({data.inventory.services.length})
                    </span>
                    <SelectAllControls
                      items={selection.inventory.services}
                      onSelectAll={() => setSelection(prev => ({
                        ...prev,
                        inventory: { ...prev.inventory, services: prev.inventory.services.map(() => true) }
                      }))}
                      onDeselectAll={() => setSelection(prev => ({
                        ...prev,
                        inventory: { ...prev.inventory, services: prev.inventory.services.map(() => false) }
                      }))}
                    />
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {data.inventory.services.map((service: any, i: number) => (
                      <SelectableItem
                        key={i}
                        selected={selection.inventory.services[i] && selection.inventory.selected}
                        onToggle={() => setSelection(prev => {
                          const services = [...prev.inventory.services];
                          services[i] = !services[i];
                          return { ...prev, inventory: { ...prev.inventory, services } };
                        })}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-medium text-xs text-slate-800">{service.name}</span>
                            {service.category && <span className="ml-2 text-[10px] text-slate-500">({service.category})</span>}
                          </div>
                          {service.price && <span className="font-semibold text-xs text-orange-600">₹{service.price}</span>}
                        </div>
                        {service.doctor && <div className="text-[10px] text-slate-500">{service.doctor}</div>}
                      </SelectableItem>
                    ))}
                  </div>
                </div>
              )}

              {/* Properties (Real Estate) */}
              {data.inventory?.properties?.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-600 flex items-center gap-1">
                      <Home className="w-3 h-3" /> Properties ({data.inventory.properties.length})
                    </span>
                    <SelectAllControls
                      items={selection.inventory.properties}
                      onSelectAll={() => setSelection(prev => ({
                        ...prev,
                        inventory: { ...prev.inventory, properties: prev.inventory.properties.map(() => true) }
                      }))}
                      onDeselectAll={() => setSelection(prev => ({
                        ...prev,
                        inventory: { ...prev.inventory, properties: prev.inventory.properties.map(() => false) }
                      }))}
                    />
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {data.inventory.properties.map((property: any, i: number) => (
                      <SelectableItem
                        key={i}
                        selected={selection.inventory.properties[i] && selection.inventory.selected}
                        onToggle={() => setSelection(prev => {
                          const properties = [...prev.inventory.properties];
                          properties[i] = !properties[i];
                          return { ...prev, inventory: { ...prev.inventory, properties } };
                        })}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-medium text-xs text-slate-800">{property.title}</span>
                            {property.type && <span className="ml-2 text-[10px] text-slate-500">({property.type})</span>}
                          </div>
                          {property.price && (
                            <span className="font-semibold text-xs text-orange-600">
                              ₹{property.price?.toLocaleString()}{property.priceUnit === 'per month' ? '/mo' : ''}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {[property.bedrooms && `${property.bedrooms} BHK`, property.area, property.location].filter(Boolean).join(' • ')}
                        </div>
                      </SelectableItem>
                    ))}
                  </div>
                </div>
              )}
            </SectionHeader>
          )}

          {/* Industry Specific Data */}
          {hasData('industrySpecificData') && (
            <SectionHeader
              icon={Building2}
              title="Industry-Specific Data"
              count={Object.keys(data.industrySpecificData || {}).filter(k =>
                !['googleRating', 'googleReviewCount', 'priceLevel', 'googlePhotos', 'googleReviews'].includes(k)
              ).length}
              selected={selection.industrySpecificData.selected}
              onToggle={() => toggleSection('industrySpecificData')}
              expanded={expandedSections.has('industrySpecificData')}
              onExpandToggle={() => toggleExpanded('industrySpecificData')}
            >
              <div className="grid grid-cols-2 gap-2 mt-3">
                {Object.entries(data.industrySpecificData || {})
                  .filter(([k]) => !['googleRating', 'googleReviewCount', 'priceLevel', 'googlePhotos', 'googleReviews'].includes(k))
                  .map(([key, value]: [string, any]) => value && (
                    <SelectableItem
                      key={key}
                      selected={selection.industrySpecificData.fields[key] && selection.industrySpecificData.selected}
                      onToggle={() => setSelection(prev => ({
                        ...prev,
                        industrySpecificData: {
                          ...prev.industrySpecificData,
                          fields: { ...prev.industrySpecificData.fields, [key]: !prev.industrySpecificData.fields[key] }
                        }
                      }))}
                    >
                      <div className="text-[10px] text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                      <div className="text-xs font-medium text-slate-800 truncate">
                        {Array.isArray(value) ? value.join(', ') : typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </div>
                    </SelectableItem>
                  ))}
              </div>
            </SectionHeader>
          )}

          {/* From the Web Section */}
          {hasData('fromTheWeb') && (
            <SectionHeader
              icon={Globe}
              title="From the Web"
              selected={selection.fromTheWeb.selected}
              onToggle={() => toggleSection('fromTheWeb')}
              expanded={expandedSections.has('fromTheWeb')}
              onExpandToggle={() => toggleExpanded('fromTheWeb')}
              badge="Additional Data"
            >
              <div className="space-y-3 mt-3">
                {data.fromTheWeb?.websiteContent && (
                  <SelectableItem
                    selected={selection.fromTheWeb.fields.websiteContent && selection.fromTheWeb.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      fromTheWeb: {
                        ...prev.fromTheWeb,
                        fields: { ...prev.fromTheWeb.fields, websiteContent: !prev.fromTheWeb.fields.websiteContent }
                      }
                    }))}
                  >
                    <div className="text-xs text-slate-500">Website Content</div>
                    <p className="text-xs text-slate-700 line-clamp-3">{data.fromTheWeb.websiteContent}</p>
                  </SelectableItem>
                )}

                {data.fromTheWeb?.otherFindings?.length > 0 && (
                  <SelectableItem
                    selected={selection.fromTheWeb.fields.otherFindings && selection.fromTheWeb.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      fromTheWeb: {
                        ...prev.fromTheWeb,
                        fields: { ...prev.fromTheWeb.fields, otherFindings: !prev.fromTheWeb.fields.otherFindings }
                      }
                    }))}
                  >
                    <div className="text-xs text-slate-500">Other Findings ({data.fromTheWeb.otherFindings.length})</div>
                    <ul className="text-xs text-slate-700 mt-1 space-y-0.5">
                      {data.fromTheWeb.otherFindings.slice(0, 3).map((finding: string, i: number) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-cyan-500">•</span>
                          <span className="line-clamp-1">{finding}</span>
                        </li>
                      ))}
                      {data.fromTheWeb.otherFindings.length > 3 && (
                        <li className="text-slate-400">+{data.fromTheWeb.otherFindings.length - 3} more</li>
                      )}
                    </ul>
                  </SelectableItem>
                )}

                {data.fromTheWeb?.rawIndustryData && Object.keys(data.fromTheWeb.rawIndustryData).length > 0 && (
                  <SelectableItem
                    selected={selection.fromTheWeb.fields.rawIndustryData && selection.fromTheWeb.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      fromTheWeb: {
                        ...prev.fromTheWeb,
                        fields: { ...prev.fromTheWeb.fields, rawIndustryData: !prev.fromTheWeb.fields.rawIndustryData }
                      }
                    }))}
                  >
                    <div className="text-xs text-slate-500">Raw Industry Data</div>
                    <div className="text-xs text-slate-700 mt-1">
                      {Object.keys(data.fromTheWeb.rawIndustryData).length} fields available
                    </div>
                  </SelectableItem>
                )}
              </div>
            </SectionHeader>
          )}

          {/* Source Info */}
          {data.source && (
            <div className="text-xs text-slate-400 text-center pt-3 border-t border-slate-100">
              Data fetched: {new Date(data.source.fetchedAt).toLocaleString()} |
              Source: {data.source.placesData ? 'Google Places' : data.source.websiteUrl ? 'Website Scrape' : ''}
              {data.source.aiEnriched ? ' + AI Analysis' : ''}
              {data.source.pagesScraped?.length > 1 && ` (${data.source.pagesScraped.length} pages)`}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-200 flex gap-3 bg-slate-50">
          <button
            onClick={onClose}
            disabled={isApplying}
            className="px-4 py-2.5 border border-slate-200 rounded-xl font-medium text-sm text-slate-600 hover:bg-white transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={isApplying || selectionCounts.selected === 0}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium text-sm hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isApplying ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Apply {selectionCounts.selected} Selected Items
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
