"use client";

import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Check, ChevronDown, ChevronRight, X, Download, Globe, MapPin,
  Building2, Package, Users, HelpCircle, Utensils, Bed, Home,
  Stethoscope, CheckSquare, Square, Phone, Mail, Clock, Link,
  MessageSquare, Tag, DollarSign, Star, FileText, ExternalLink,
  Instagram, Facebook, Linkedin, Twitter, Youtube, Award, Briefcase
} from 'lucide-react';

// Types for selection tracking
interface SelectionState {
  businessInfo: {
    selected: boolean;
    fields: {
      businessName: boolean;
      tagline: boolean;
      description: boolean;
      industry: boolean;
    };
  };
  contact: {
    selected: boolean;
    fields: {
      phone: boolean;
      email: boolean;
      address: boolean;
      website: boolean;
      operatingHours: boolean;
    };
  };
  social: {
    selected: boolean;
    fields: {
      instagram: boolean;
      facebook: boolean;
      linkedin: boolean;
      twitter: boolean;
      youtube: boolean;
    };
  };
  content: {
    selected: boolean;
    fields: {
      usps: boolean;
      targetAudience: boolean;
    };
  };
  productsServices: {
    selected: boolean;
    items: boolean[];
  };
  faqs: {
    selected: boolean;
    items: boolean[];
  };
  inventory: {
    selected: boolean;
    rooms: boolean[];
    menuItems: boolean[];
    products: boolean[];
    services: boolean[];
    properties: boolean[];
  };
  testimonials: {
    selected: boolean;
    items: boolean[];
  };
  additional: {
    selected: boolean;
    fields: {
      awards: boolean;
      certifications: boolean;
      founders: boolean;
      teamSize: boolean;
    };
  };
}

interface WebsiteImportPreviewModalProps {
  data: any;
  websiteUrl: string;
  pagesScraped?: string[];
  onClose: () => void;
  onApply: (selectedData: any) => Promise<void>;
  isApplying?: boolean;
}

// Initialize selection state from data
function initializeSelectionState(data: any): SelectionState {
  return {
    businessInfo: {
      selected: true,
      fields: {
        businessName: !!data?.identity?.businessName,
        tagline: !!data?.personality?.tagline || !!data?.identity?.tagline,
        description: !!data?.personality?.description || !!data?.identity?.description,
        industry: !!data?.identity?.industry,
      },
    },
    contact: {
      selected: true,
      fields: {
        phone: !!data?.identity?.phone,
        email: !!data?.identity?.email,
        address: !!(data?.identity?.address?.street || data?.identity?.address?.city),
        website: !!data?.identity?.website,
        operatingHours: !!data?.identity?.operatingHours,
      },
    },
    social: {
      selected: !!(data?.identity?.socialMedia && Object.values(data.identity.socialMedia).some(v => v)),
      fields: {
        instagram: !!data?.identity?.socialMedia?.instagram,
        facebook: !!data?.identity?.socialMedia?.facebook,
        linkedin: !!data?.identity?.socialMedia?.linkedin,
        twitter: !!data?.identity?.socialMedia?.twitter,
        youtube: !!data?.identity?.socialMedia?.youtube,
      },
    },
    content: {
      selected: true,
      fields: {
        usps: (data?.personality?.uniqueSellingPoints?.length || 0) > 0,
        targetAudience: (data?.customerProfile?.targetAudience?.length || 0) > 0,
      },
    },
    productsServices: {
      selected: (data?.knowledge?.productsOrServices?.length || 0) > 0,
      items: (data?.knowledge?.productsOrServices || []).map(() => true),
    },
    faqs: {
      selected: (data?.knowledge?.faqs?.length || 0) > 0,
      items: (data?.knowledge?.faqs || []).map(() => true),
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
    testimonials: {
      selected: (data?.testimonials?.length || 0) > 0,
      items: (data?.testimonials || []).map(() => true),
    },
    additional: {
      selected: !!(data?.industrySpecificData?.awards?.length ||
                   data?.industrySpecificData?.certifications?.length ||
                   data?.industrySpecificData?.founders ||
                   data?.industrySpecificData?.teamSize),
      fields: {
        awards: (data?.industrySpecificData?.awards?.length || 0) > 0,
        certifications: (data?.industrySpecificData?.certifications?.length || 0) > 0,
        founders: !!data?.industrySpecificData?.founders,
        teamSize: !!data?.industrySpecificData?.teamSize,
      },
    },
  };
}

// Build filtered data based on selection
function buildSelectedData(data: any, selection: SelectionState): any {
  const result: any = {
    source: data.source,
  };

  // Business Info -> identity
  if (selection.businessInfo.selected) {
    result.identity = result.identity || {};
    if (selection.businessInfo.fields.businessName && data.identity?.businessName) {
      result.identity.businessName = data.identity.businessName;
    }
    if (selection.businessInfo.fields.industry && data.identity?.industry) {
      result.identity.industry = data.identity.industry;
    }
    if (selection.businessInfo.fields.description) {
      const desc = data.personality?.description || data.identity?.description;
      if (desc) result.identity.description = desc;
    }
    if (selection.businessInfo.fields.tagline) {
      const tagline = data.personality?.tagline || data.identity?.tagline;
      if (tagline) result.identity.tagline = tagline;
    }
  }

  // Contact info
  if (selection.contact.selected) {
    result.identity = result.identity || {};
    if (selection.contact.fields.phone && data.identity?.phone) {
      result.identity.phone = data.identity.phone;
    }
    if (selection.contact.fields.email && data.identity?.email) {
      result.identity.email = data.identity.email;
    }
    if (selection.contact.fields.website && data.identity?.website) {
      result.identity.website = data.identity.website;
    }
    if (selection.contact.fields.address && data.identity?.address) {
      result.identity.address = data.identity.address;
    }
    if (selection.contact.fields.operatingHours && data.identity?.operatingHours) {
      result.identity.operatingHours = data.identity.operatingHours;
    }
  }

  // Social Media
  if (selection.social.selected) {
    result.identity = result.identity || {};
    result.identity.socialMedia = {};
    if (selection.social.fields.instagram && data.identity?.socialMedia?.instagram) {
      result.identity.socialMedia.instagram = data.identity.socialMedia.instagram;
    }
    if (selection.social.fields.facebook && data.identity?.socialMedia?.facebook) {
      result.identity.socialMedia.facebook = data.identity.socialMedia.facebook;
    }
    if (selection.social.fields.linkedin && data.identity?.socialMedia?.linkedin) {
      result.identity.socialMedia.linkedin = data.identity.socialMedia.linkedin;
    }
    if (selection.social.fields.twitter && data.identity?.socialMedia?.twitter) {
      result.identity.socialMedia.twitter = data.identity.socialMedia.twitter;
    }
    if (selection.social.fields.youtube && data.identity?.socialMedia?.youtube) {
      result.identity.socialMedia.youtube = data.identity.socialMedia.youtube;
    }
    if (Object.keys(result.identity.socialMedia).length === 0) {
      delete result.identity.socialMedia;
    }
  }

  // Content (USPs, Target Audience)
  if (selection.content.selected) {
    if (selection.content.fields.usps && data.personality?.uniqueSellingPoints?.length) {
      result.personality = result.personality || {};
      result.personality.uniqueSellingPoints = data.personality.uniqueSellingPoints;
    }
    if (selection.content.fields.targetAudience && data.customerProfile?.targetAudience?.length) {
      result.customerProfile = result.customerProfile || {};
      result.customerProfile.targetAudience = data.customerProfile.targetAudience;
    }
  }

  // Products/Services
  if (selection.productsServices.selected && data.knowledge?.productsOrServices?.length) {
    result.knowledge = result.knowledge || {};
    result.knowledge.productsOrServices = data.knowledge.productsOrServices.filter(
      (_: any, i: number) => selection.productsServices.items[i]
    );
  }

  // FAQs
  if (selection.faqs.selected && data.knowledge?.faqs?.length) {
    result.knowledge = result.knowledge || {};
    result.knowledge.faqs = data.knowledge.faqs.filter(
      (_: any, i: number) => selection.faqs.items[i]
    );
  }

  // Inventory
  if (selection.inventory.selected) {
    result.inventory = {};
    if (data.inventory?.rooms?.length) {
      result.inventory.rooms = data.inventory.rooms.filter(
        (_: any, i: number) => selection.inventory.rooms[i]
      );
    }
    if (data.inventory?.menuItems?.length) {
      result.inventory.menuItems = data.inventory.menuItems.filter(
        (_: any, i: number) => selection.inventory.menuItems[i]
      );
    }
    if (data.inventory?.products?.length) {
      result.inventory.products = data.inventory.products.filter(
        (_: any, i: number) => selection.inventory.products[i]
      );
    }
    if (data.inventory?.services?.length) {
      result.inventory.services = data.inventory.services.filter(
        (_: any, i: number) => selection.inventory.services[i]
      );
    }
    if (data.inventory?.properties?.length) {
      result.inventory.properties = data.inventory.properties.filter(
        (_: any, i: number) => selection.inventory.properties[i]
      );
    }
  }

  // Testimonials
  if (selection.testimonials.selected && data.testimonials?.length) {
    result.testimonials = data.testimonials.filter(
      (_: any, i: number) => selection.testimonials.items[i]
    );
  }

  // Additional Info
  if (selection.additional.selected) {
    result.industrySpecificData = result.industrySpecificData || {};
    if (selection.additional.fields.awards && data.industrySpecificData?.awards) {
      result.industrySpecificData.awards = data.industrySpecificData.awards;
    }
    if (selection.additional.fields.certifications && data.industrySpecificData?.certifications) {
      result.industrySpecificData.certifications = data.industrySpecificData.certifications;
    }
    if (selection.additional.fields.founders && data.industrySpecificData?.founders) {
      result.industrySpecificData.founders = data.industrySpecificData.founders;
    }
    if (selection.additional.fields.teamSize && data.industrySpecificData?.teamSize) {
      result.industrySpecificData.teamSize = data.industrySpecificData.teamSize;
    }
  }

  return result;
}

// Count selected items
function countSelectedItems(selection: SelectionState): { selected: number; total: number } {
  let selected = 0;
  let total = 0;

  // Business Info
  Object.values(selection.businessInfo.fields).forEach(v => {
    if (v !== undefined) {
      total++;
      if (v && selection.businessInfo.selected) selected++;
    }
  });

  // Contact
  Object.values(selection.contact.fields).forEach(v => {
    if (v !== undefined) {
      total++;
      if (v && selection.contact.selected) selected++;
    }
  });

  // Social
  Object.values(selection.social.fields).forEach(v => {
    if (v !== undefined) {
      total++;
      if (v && selection.social.selected) selected++;
    }
  });

  // Content
  Object.values(selection.content.fields).forEach(v => {
    if (v !== undefined) {
      total++;
      if (v && selection.content.selected) selected++;
    }
  });

  // Products/Services
  selection.productsServices.items.forEach(v => {
    total++;
    if (v && selection.productsServices.selected) selected++;
  });

  // FAQs
  selection.faqs.items.forEach(v => {
    total++;
    if (v && selection.faqs.selected) selected++;
  });

  // Inventory
  [...selection.inventory.rooms, ...selection.inventory.menuItems,
   ...selection.inventory.products, ...selection.inventory.services,
   ...selection.inventory.properties].forEach(v => {
    total++;
    if (v && selection.inventory.selected) selected++;
  });

  // Testimonials
  selection.testimonials.items.forEach(v => {
    total++;
    if (v && selection.testimonials.selected) selected++;
  });

  // Additional
  Object.values(selection.additional.fields).forEach(v => {
    if (v !== undefined) {
      total++;
      if (v && selection.additional.selected) selected++;
    }
  });

  return { selected, total };
}

// Section Header Component
function SectionHeader({
  title,
  icon: Icon,
  selected,
  onToggle,
  expanded,
  onExpandToggle,
  count,
  children,
}: {
  title: string;
  icon: any;
  selected: boolean;
  onToggle: () => void;
  expanded: boolean;
  onExpandToggle: () => void;
  count?: number;
  children?: React.ReactNode;
}) {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden mb-3">
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors",
          selected ? "bg-indigo-50" : "bg-slate-50"
        )}
        onClick={onExpandToggle}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className="flex-shrink-0"
        >
          {selected ? (
            <CheckSquare className="w-5 h-5 text-indigo-600" />
          ) : (
            <Square className="w-5 h-5 text-slate-400" />
          )}
        </button>
        <Icon className={cn("w-5 h-5", selected ? "text-indigo-600" : "text-slate-400")} />
        <span className={cn("font-medium flex-1", selected ? "text-indigo-900" : "text-slate-500")}>
          {title}
        </span>
        {count !== undefined && count > 0 && (
          <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
            {count} items
          </span>
        )}
        {expanded ? (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronRight className="w-5 h-5 text-slate-400" />
        )}
      </div>
      {expanded && children && (
        <div className="px-4 py-3 bg-white border-t border-slate-100">
          {children}
        </div>
      )}
    </div>
  );
}

// Selectable Item Component
function SelectableItem({
  selected,
  onToggle,
  label,
  value,
  sublabel,
}: {
  selected: boolean;
  onToggle: () => void;
  label: string;
  value?: string;
  sublabel?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors",
        selected ? "bg-indigo-50/50" : "bg-slate-50/50 opacity-60"
      )}
      onClick={onToggle}
    >
      <button className="flex-shrink-0 mt-0.5">
        {selected ? (
          <CheckSquare className="w-4 h-4 text-indigo-600" />
        ) : (
          <Square className="w-4 h-4 text-slate-400" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-700">{label}</div>
        {value && <div className="text-sm text-slate-600 truncate">{value}</div>}
        {sublabel && <div className="text-xs text-slate-400 mt-1">{sublabel}</div>}
      </div>
    </div>
  );
}

// Format address for display
function formatAddress(address: any): string {
  if (!address) return '';
  const parts = [address.street, address.city, address.state, address.country, address.pincode || address.postalCode].filter(Boolean);
  return parts.join(', ');
}

// Main Component
export default function WebsiteImportPreviewModal({
  data,
  websiteUrl,
  pagesScraped = [],
  onClose,
  onApply,
  isApplying = false,
}: WebsiteImportPreviewModalProps) {
  const [selection, setSelection] = useState<SelectionState>(() => initializeSelectionState(data));
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    businessInfo: true,
    contact: true,
    social: false,
    content: false,
    productsServices: false,
    faqs: false,
    inventory: true,
    testimonials: false,
    additional: false,
  });

  const selectionCounts = useMemo(() => countSelectedItems(selection), [selection]);

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
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleApply = async () => {
    const selectedData = buildSelectedData(data, selection);
    await onApply(selectedData);
  };

  const handleDownloadJson = () => {
    const selectedData = buildSelectedData(data, selection);
    const blob = new Blob([JSON.stringify(selectedData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.identity?.businessName?.replace(/\s+/g, '_') || 'website'}_import.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Data exported as JSON');
  };

  // Check if we have data to display
  const hasBusinessInfo = data.identity?.businessName || data.identity?.description || data.personality?.tagline;
  const hasContact = data.identity?.phone || data.identity?.email || data.identity?.address;
  const hasSocial = data.identity?.socialMedia && Object.values(data.identity.socialMedia).some(v => v);
  const hasContent = data.personality?.uniqueSellingPoints?.length || data.customerProfile?.targetAudience?.length;
  const hasProductsServices = data.knowledge?.productsOrServices?.length > 0;
  const hasFaqs = data.knowledge?.faqs?.length > 0;
  const hasInventory = data.inventory && (
    data.inventory.rooms?.length ||
    data.inventory.menuItems?.length ||
    data.inventory.products?.length ||
    data.inventory.services?.length ||
    data.inventory.properties?.length
  );
  const hasTestimonials = data.testimonials?.length > 0;
  const hasAdditional = data.industrySpecificData?.awards?.length ||
                        data.industrySpecificData?.certifications?.length ||
                        data.industrySpecificData?.founders ||
                        data.industrySpecificData?.teamSize;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Website Import Preview</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Review and select data to import from your website
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Website URL & Pages Info */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg text-sm text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
              <Link className="w-4 h-4" />
              {new URL(websiteUrl).hostname}
              <ExternalLink className="w-3 h-3" />
            </a>
            {pagesScraped.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg text-sm text-slate-600">
                <FileText className="w-4 h-4 text-slate-400" />
                {pagesScraped.length} page{pagesScraped.length !== 1 ? 's' : ''} analyzed
              </span>
            )}
            <button
              onClick={handleDownloadJson}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors ml-auto"
            >
              <Download className="w-4 h-4" />
              Export JSON
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Business Information */}
          {hasBusinessInfo && (
            <SectionHeader
              title="Business Information"
              icon={Building2}
              selected={selection.businessInfo.selected}
              onToggle={() => toggleSection('businessInfo')}
              expanded={expandedSections.businessInfo}
              onExpandToggle={() => toggleExpanded('businessInfo')}
            >
              <div className="space-y-2">
                {data.identity?.businessName && (
                  <SelectableItem
                    selected={selection.businessInfo.fields.businessName && selection.businessInfo.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      businessInfo: {
                        ...prev.businessInfo,
                        fields: { ...prev.businessInfo.fields, businessName: !prev.businessInfo.fields.businessName }
                      }
                    }))}
                    label="Business Name"
                    value={data.identity.businessName}
                  />
                )}
                {data.identity?.industry && (
                  <SelectableItem
                    selected={selection.businessInfo.fields.industry && selection.businessInfo.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      businessInfo: {
                        ...prev.businessInfo,
                        fields: { ...prev.businessInfo.fields, industry: !prev.businessInfo.fields.industry }
                      }
                    }))}
                    label="Industry"
                    value={typeof data.identity.industry === 'string' ? data.identity.industry : data.identity.industry?.name}
                  />
                )}
                {(data.personality?.tagline || data.identity?.tagline) && (
                  <SelectableItem
                    selected={selection.businessInfo.fields.tagline && selection.businessInfo.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      businessInfo: {
                        ...prev.businessInfo,
                        fields: { ...prev.businessInfo.fields, tagline: !prev.businessInfo.fields.tagline }
                      }
                    }))}
                    label="Tagline"
                    value={data.personality?.tagline || data.identity?.tagline}
                  />
                )}
                {(data.personality?.description || data.identity?.description) && (
                  <SelectableItem
                    selected={selection.businessInfo.fields.description && selection.businessInfo.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      businessInfo: {
                        ...prev.businessInfo,
                        fields: { ...prev.businessInfo.fields, description: !prev.businessInfo.fields.description }
                      }
                    }))}
                    label="Description"
                    value={(data.personality?.description || data.identity?.description)?.substring(0, 150) + '...'}
                  />
                )}
              </div>
            </SectionHeader>
          )}

          {/* Contact Information */}
          {hasContact && (
            <SectionHeader
              title="Contact Information"
              icon={Phone}
              selected={selection.contact.selected}
              onToggle={() => toggleSection('contact')}
              expanded={expandedSections.contact}
              onExpandToggle={() => toggleExpanded('contact')}
            >
              <div className="space-y-2">
                {data.identity?.phone && (
                  <SelectableItem
                    selected={selection.contact.fields.phone && selection.contact.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      contact: { ...prev.contact, fields: { ...prev.contact.fields, phone: !prev.contact.fields.phone } }
                    }))}
                    label="Phone"
                    value={data.identity.phone}
                  />
                )}
                {data.identity?.email && (
                  <SelectableItem
                    selected={selection.contact.fields.email && selection.contact.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      contact: { ...prev.contact, fields: { ...prev.contact.fields, email: !prev.contact.fields.email } }
                    }))}
                    label="Email"
                    value={data.identity.email}
                  />
                )}
                {data.identity?.address && (
                  <SelectableItem
                    selected={selection.contact.fields.address && selection.contact.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      contact: { ...prev.contact, fields: { ...prev.contact.fields, address: !prev.contact.fields.address } }
                    }))}
                    label="Address"
                    value={formatAddress(data.identity.address)}
                  />
                )}
                {data.identity?.operatingHours && (
                  <SelectableItem
                    selected={selection.contact.fields.operatingHours && selection.contact.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      contact: { ...prev.contact, fields: { ...prev.contact.fields, operatingHours: !prev.contact.fields.operatingHours } }
                    }))}
                    label="Operating Hours"
                    value="Schedule available"
                  />
                )}
              </div>
            </SectionHeader>
          )}

          {/* Social Media */}
          {hasSocial && (
            <SectionHeader
              title="Social Media"
              icon={Globe}
              selected={selection.social.selected}
              onToggle={() => toggleSection('social')}
              expanded={expandedSections.social}
              onExpandToggle={() => toggleExpanded('social')}
              count={Object.values(data.identity?.socialMedia || {}).filter(Boolean).length}
            >
              <div className="grid grid-cols-2 gap-2">
                {data.identity?.socialMedia?.instagram && (
                  <SelectableItem
                    selected={selection.social.fields.instagram && selection.social.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      social: { ...prev.social, fields: { ...prev.social.fields, instagram: !prev.social.fields.instagram } }
                    }))}
                    label="Instagram"
                    value={data.identity.socialMedia.instagram.split('/').pop()}
                  />
                )}
                {data.identity?.socialMedia?.facebook && (
                  <SelectableItem
                    selected={selection.social.fields.facebook && selection.social.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      social: { ...prev.social, fields: { ...prev.social.fields, facebook: !prev.social.fields.facebook } }
                    }))}
                    label="Facebook"
                    value={data.identity.socialMedia.facebook.split('/').pop()}
                  />
                )}
                {data.identity?.socialMedia?.linkedin && (
                  <SelectableItem
                    selected={selection.social.fields.linkedin && selection.social.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      social: { ...prev.social, fields: { ...prev.social.fields, linkedin: !prev.social.fields.linkedin } }
                    }))}
                    label="LinkedIn"
                    value={data.identity.socialMedia.linkedin.split('/').pop()}
                  />
                )}
                {data.identity?.socialMedia?.twitter && (
                  <SelectableItem
                    selected={selection.social.fields.twitter && selection.social.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      social: { ...prev.social, fields: { ...prev.social.fields, twitter: !prev.social.fields.twitter } }
                    }))}
                    label="Twitter/X"
                    value={data.identity.socialMedia.twitter.split('/').pop()}
                  />
                )}
                {data.identity?.socialMedia?.youtube && (
                  <SelectableItem
                    selected={selection.social.fields.youtube && selection.social.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      social: { ...prev.social, fields: { ...prev.social.fields, youtube: !prev.social.fields.youtube } }
                    }))}
                    label="YouTube"
                    value={data.identity.socialMedia.youtube.split('/').pop()}
                  />
                )}
              </div>
            </SectionHeader>
          )}

          {/* USPs & Target Audience */}
          {hasContent && (
            <SectionHeader
              title="Brand Content"
              icon={Tag}
              selected={selection.content.selected}
              onToggle={() => toggleSection('content')}
              expanded={expandedSections.content}
              onExpandToggle={() => toggleExpanded('content')}
            >
              <div className="space-y-3">
                {data.personality?.uniqueSellingPoints?.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        onClick={() => setSelection(prev => ({
                          ...prev,
                          content: { ...prev.content, fields: { ...prev.content.fields, usps: !prev.content.fields.usps } }
                        }))}
                        className="flex-shrink-0"
                      >
                        {selection.content.fields.usps && selection.content.selected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                      <span className="text-sm font-medium text-slate-700">Unique Selling Points</span>
                    </div>
                    <div className="flex flex-wrap gap-2 pl-6">
                      {data.personality.uniqueSellingPoints.map((usp: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm">
                          {usp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {data.customerProfile?.targetAudience?.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        onClick={() => setSelection(prev => ({
                          ...prev,
                          content: { ...prev.content, fields: { ...prev.content.fields, targetAudience: !prev.content.fields.targetAudience } }
                        }))}
                        className="flex-shrink-0"
                      >
                        {selection.content.fields.targetAudience && selection.content.selected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                      <span className="text-sm font-medium text-slate-700">Target Audience</span>
                    </div>
                    <div className="flex flex-wrap gap-2 pl-6">
                      {data.customerProfile.targetAudience.map((ta: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm">
                          {ta}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </SectionHeader>
          )}

          {/* Products/Services */}
          {hasProductsServices && (
            <SectionHeader
              title="Products & Services"
              icon={Package}
              selected={selection.productsServices.selected}
              onToggle={() => toggleSection('productsServices')}
              expanded={expandedSections.productsServices}
              onExpandToggle={() => toggleExpanded('productsServices')}
              count={data.knowledge.productsOrServices.length}
            >
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {data.knowledge.productsOrServices.map((item: any, i: number) => (
                  <SelectableItem
                    key={i}
                    selected={selection.productsServices.items[i] && selection.productsServices.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      productsServices: {
                        ...prev.productsServices,
                        items: prev.productsServices.items.map((v, idx) => idx === i ? !v : v)
                      }
                    }))}
                    label={item.name}
                    value={item.description}
                    sublabel={item.isService ? 'Service' : 'Product'}
                  />
                ))}
              </div>
            </SectionHeader>
          )}

          {/* FAQs */}
          {hasFaqs && (
            <SectionHeader
              title="FAQs"
              icon={HelpCircle}
              selected={selection.faqs.selected}
              onToggle={() => toggleSection('faqs')}
              expanded={expandedSections.faqs}
              onExpandToggle={() => toggleExpanded('faqs')}
              count={data.knowledge.faqs.length}
            >
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {data.knowledge.faqs.map((faq: any, i: number) => (
                  <SelectableItem
                    key={i}
                    selected={selection.faqs.items[i] && selection.faqs.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      faqs: {
                        ...prev.faqs,
                        items: prev.faqs.items.map((v, idx) => idx === i ? !v : v)
                      }
                    }))}
                    label={faq.question}
                    value={faq.answer?.substring(0, 100) + (faq.answer?.length > 100 ? '...' : '')}
                  />
                ))}
              </div>
            </SectionHeader>
          )}

          {/* Inventory */}
          {hasInventory && (
            <SectionHeader
              title="Inventory"
              icon={data.inventory?.menuItems?.length ? Utensils :
                    data.inventory?.rooms?.length ? Bed :
                    data.inventory?.services?.length ? Stethoscope :
                    data.inventory?.properties?.length ? Home : Package}
              selected={selection.inventory.selected}
              onToggle={() => toggleSection('inventory')}
              expanded={expandedSections.inventory}
              onExpandToggle={() => toggleExpanded('inventory')}
              count={(data.inventory?.rooms?.length || 0) + (data.inventory?.menuItems?.length || 0) +
                     (data.inventory?.products?.length || 0) + (data.inventory?.services?.length || 0) +
                     (data.inventory?.properties?.length || 0)}
            >
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {/* Rooms */}
                {data.inventory?.rooms?.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                      <Bed className="w-4 h-4" /> Rooms ({data.inventory.rooms.length})
                    </div>
                    <div className="space-y-2">
                      {data.inventory.rooms.map((room: any, i: number) => (
                        <SelectableItem
                          key={i}
                          selected={selection.inventory.rooms[i] && selection.inventory.selected}
                          onToggle={() => setSelection(prev => ({
                            ...prev,
                            inventory: {
                              ...prev.inventory,
                              rooms: prev.inventory.rooms.map((v, idx) => idx === i ? !v : v)
                            }
                          }))}
                          label={room.name}
                          value={room.price ? `${room.price} ${room.priceUnit || 'per night'}` : undefined}
                          sublabel={room.description?.substring(0, 80)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Menu Items */}
                {data.inventory?.menuItems?.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                      <Utensils className="w-4 h-4" /> Menu Items ({data.inventory.menuItems.length})
                    </div>
                    <div className="space-y-2">
                      {data.inventory.menuItems.map((item: any, i: number) => (
                        <SelectableItem
                          key={i}
                          selected={selection.inventory.menuItems[i] && selection.inventory.selected}
                          onToggle={() => setSelection(prev => ({
                            ...prev,
                            inventory: {
                              ...prev.inventory,
                              menuItems: prev.inventory.menuItems.map((v, idx) => idx === i ? !v : v)
                            }
                          }))}
                          label={item.name}
                          value={item.price ? `${item.price}` : undefined}
                          sublabel={`${item.category || 'Menu Item'}${item.isVeg ? ' • Vegetarian' : ''}`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Products */}
                {data.inventory?.products?.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                      <Package className="w-4 h-4" /> Products ({data.inventory.products.length})
                    </div>
                    <div className="space-y-2">
                      {data.inventory.products.map((product: any, i: number) => (
                        <SelectableItem
                          key={i}
                          selected={selection.inventory.products[i] && selection.inventory.selected}
                          onToggle={() => setSelection(prev => ({
                            ...prev,
                            inventory: {
                              ...prev.inventory,
                              products: prev.inventory.products.map((v, idx) => idx === i ? !v : v)
                            }
                          }))}
                          label={product.name}
                          value={product.price ? `${product.price}` : undefined}
                          sublabel={product.category}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Services */}
                {data.inventory?.services?.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                      <Stethoscope className="w-4 h-4" /> Services ({data.inventory.services.length})
                    </div>
                    <div className="space-y-2">
                      {data.inventory.services.map((service: any, i: number) => (
                        <SelectableItem
                          key={i}
                          selected={selection.inventory.services[i] && selection.inventory.selected}
                          onToggle={() => setSelection(prev => ({
                            ...prev,
                            inventory: {
                              ...prev.inventory,
                              services: prev.inventory.services.map((v, idx) => idx === i ? !v : v)
                            }
                          }))}
                          label={service.name}
                          value={service.price ? `${service.price}${service.duration ? ` • ${service.duration}` : ''}` : service.duration}
                          sublabel={service.category}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Properties */}
                {data.inventory?.properties?.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                      <Home className="w-4 h-4" /> Properties ({data.inventory.properties.length})
                    </div>
                    <div className="space-y-2">
                      {data.inventory.properties.map((property: any, i: number) => (
                        <SelectableItem
                          key={i}
                          selected={selection.inventory.properties[i] && selection.inventory.selected}
                          onToggle={() => setSelection(prev => ({
                            ...prev,
                            inventory: {
                              ...prev.inventory,
                              properties: prev.inventory.properties.map((v, idx) => idx === i ? !v : v)
                            }
                          }))}
                          label={property.title || property.name}
                          value={property.price ? `${property.price} ${property.priceUnit || ''}` : undefined}
                          sublabel={`${property.type || ''}${property.location ? ` • ${property.location}` : ''}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </SectionHeader>
          )}

          {/* Testimonials */}
          {hasTestimonials && (
            <SectionHeader
              title="Testimonials"
              icon={MessageSquare}
              selected={selection.testimonials.selected}
              onToggle={() => toggleSection('testimonials')}
              expanded={expandedSections.testimonials}
              onExpandToggle={() => toggleExpanded('testimonials')}
              count={data.testimonials.length}
            >
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {data.testimonials.map((t: any, i: number) => (
                  <SelectableItem
                    key={i}
                    selected={selection.testimonials.items[i] && selection.testimonials.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      testimonials: {
                        ...prev.testimonials,
                        items: prev.testimonials.items.map((v, idx) => idx === i ? !v : v)
                      }
                    }))}
                    label={t.author || 'Customer'}
                    value={`"${t.quote?.substring(0, 100)}${t.quote?.length > 100 ? '...' : ''}"`}
                  />
                ))}
              </div>
            </SectionHeader>
          )}

          {/* Additional Info */}
          {hasAdditional && (
            <SectionHeader
              title="Additional Information"
              icon={Award}
              selected={selection.additional.selected}
              onToggle={() => toggleSection('additional')}
              expanded={expandedSections.additional}
              onExpandToggle={() => toggleExpanded('additional')}
            >
              <div className="space-y-2">
                {data.industrySpecificData?.awards?.length > 0 && (
                  <SelectableItem
                    selected={selection.additional.fields.awards && selection.additional.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      additional: { ...prev.additional, fields: { ...prev.additional.fields, awards: !prev.additional.fields.awards } }
                    }))}
                    label="Awards"
                    value={data.industrySpecificData.awards.join(', ')}
                  />
                )}
                {data.industrySpecificData?.certifications?.length > 0 && (
                  <SelectableItem
                    selected={selection.additional.fields.certifications && selection.additional.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      additional: { ...prev.additional, fields: { ...prev.additional.fields, certifications: !prev.additional.fields.certifications } }
                    }))}
                    label="Certifications"
                    value={data.industrySpecificData.certifications.join(', ')}
                  />
                )}
                {data.industrySpecificData?.founders && (
                  <SelectableItem
                    selected={selection.additional.fields.founders && selection.additional.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      additional: { ...prev.additional, fields: { ...prev.additional.fields, founders: !prev.additional.fields.founders } }
                    }))}
                    label="Founders"
                    value={data.industrySpecificData.founders}
                  />
                )}
                {data.industrySpecificData?.teamSize && (
                  <SelectableItem
                    selected={selection.additional.fields.teamSize && selection.additional.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      additional: { ...prev.additional, fields: { ...prev.additional.fields, teamSize: !prev.additional.fields.teamSize } }
                    }))}
                    label="Team Size"
                    value={data.industrySpecificData.teamSize}
                  />
                )}
              </div>
            </SectionHeader>
          )}

          {/* No Data Message */}
          {!hasBusinessInfo && !hasContact && !hasSocial && !hasContent &&
           !hasProductsServices && !hasFaqs && !hasInventory && !hasTestimonials && !hasAdditional && (
            <div className="text-center py-12">
              <Globe className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">No Data Found</h3>
              <p className="text-sm text-slate-400">
                We couldn't extract meaningful business data from this website.
              </p>
            </div>
          )}

          {/* Source Info */}
          {data.source && (
            <div className="text-xs text-slate-400 text-center pt-4 mt-4 border-t border-slate-100">
              Imported: {new Date(data.source.fetchedAt).toLocaleString()} |
              Source: Website Import + AI Analysis
              {pagesScraped.length > 1 && ` (${pagesScraped.length} pages)`}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-200 flex items-center gap-3 bg-slate-50">
          <div className="text-sm text-slate-500">
            {selectionCounts.selected} of {selectionCounts.total} items selected
          </div>
          <div className="flex-1" />
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
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-medium text-sm shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-200 transition-all disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
          >
            {isApplying ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Import {selectionCounts.selected} Items
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
