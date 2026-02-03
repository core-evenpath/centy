"use client";

import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Check, ChevronDown, ChevronRight, X, Download, Globe, MapPin,
  Building2, Package, Users, HelpCircle,
  CheckSquare, Square, Phone, Mail, Clock, Link,
  MessageSquare, Tag, DollarSign, Star, FileText, ExternalLink,
  Instagram, Facebook, Linkedin, Twitter, Youtube, Award, Briefcase,
  Heart, Target, BookOpen, Shield, Percent,
  BadgeCheck, Handshake, Newspaper, Leaf, Accessibility, Truck
} from 'lucide-react';

// Types for selection tracking
interface SelectionState {
  businessInfo: {
    selected: boolean;
    fields: {
      businessName: boolean;
      legalName: boolean;
      tagline: boolean;
      description: boolean;
      shortDescription: boolean;
      industry: boolean;
      subIndustry: boolean;
      businessType: boolean;
      yearEstablished: boolean;
      languages: boolean;
    };
  };
  brandStory: {
    selected: boolean;
    fields: {
      missionStatement: boolean;
      visionStatement: boolean;
      story: boolean;
      brandValues: boolean;
      brandVoice: boolean;
    };
  };
  contact: {
    selected: boolean;
    fields: {
      phone: boolean;
      secondaryPhone: boolean;
      whatsapp: boolean;
      tollFree: boolean;
      email: boolean;
      supportEmail: boolean;
      salesEmail: boolean;
      bookingEmail: boolean;
      address: boolean;
      website: boolean;
      operatingHours: boolean;
    };
  };
  locations: {
    selected: boolean;
    items: boolean[];
  };
  serviceAreas: {
    selected: boolean;
    fields: {
      serviceAreas: boolean;
      deliveryZones: boolean;
      internationalShipping: boolean;
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
      pinterest: boolean;
      tiktok: boolean;
      whatsappBusiness: boolean;
      googleBusiness: boolean;
    };
  };
  content: {
    selected: boolean;
    fields: {
      usps: boolean;
      targetAudience: boolean;
      customerPainPoints: boolean;
    };
  };
  packages: {
    selected: boolean;
    items: boolean[];
  };
  pricingTiers: {
    selected: boolean;
    items: boolean[];
  };
  currentOffers: {
    selected: boolean;
    items: boolean[];
  };
  faqs: {
    selected: boolean;
    items: boolean[];
  };
  policies: {
    selected: boolean;
    fields: {
      returnPolicy: boolean;
      refundPolicy: boolean;
      cancellationPolicy: boolean;
      shippingPolicy: boolean;
      warrantyPolicy: boolean;
    };
  };
  team: {
    selected: boolean;
    items: boolean[];
  };
  testimonials: {
    selected: boolean;
    items: boolean[];
  };
  caseStudies: {
    selected: boolean;
    items: boolean[];
  };
  credibility: {
    selected: boolean;
    fields: {
      awards: boolean;
      certifications: boolean;
      accreditations: boolean;
      partnerships: boolean;
      clients: boolean;
      featuredIn: boolean;
    };
  };
  additional: {
    selected: boolean;
    fields: {
      founders: boolean;
      teamSize: boolean;
      technicalInfo: boolean;
      sustainability: boolean;
      accessibility: boolean;
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
        legalName: !!data?.identity?.legalName,
        tagline: !!data?.personality?.tagline || !!data?.identity?.tagline,
        description: !!data?.personality?.description || !!data?.identity?.description,
        shortDescription: !!data?.identity?.shortDescription || !!data?.personality?.shortDescription,
        industry: !!data?.identity?.industry,
        subIndustry: !!data?.identity?.subIndustry,
        businessType: !!data?.identity?.businessType,
        yearEstablished: !!data?.identity?.yearEstablished,
        languages: !!(data?.identity?.languages?.length),
      },
    },
    brandStory: {
      selected: !!(data?.personality?.missionStatement || data?.personality?.visionStatement ||
                   data?.personality?.story || data?.personality?.brandValues?.length || data?.personality?.brandVoice),
      fields: {
        missionStatement: !!data?.personality?.missionStatement,
        visionStatement: !!data?.personality?.visionStatement,
        story: !!data?.personality?.story,
        brandValues: !!(data?.personality?.brandValues?.length),
        brandVoice: !!data?.personality?.brandVoice,
      },
    },
    contact: {
      selected: true,
      fields: {
        phone: !!data?.identity?.phone,
        secondaryPhone: !!data?.identity?.secondaryPhone,
        whatsapp: !!data?.identity?.whatsapp,
        tollFree: !!data?.identity?.tollFree,
        email: !!data?.identity?.email,
        supportEmail: !!data?.identity?.supportEmail,
        salesEmail: !!data?.identity?.salesEmail,
        bookingEmail: !!data?.identity?.bookingEmail,
        address: !!(data?.identity?.address?.street || data?.identity?.address?.city),
        website: !!data?.identity?.website,
        operatingHours: !!data?.identity?.operatingHours,
      },
    },
    locations: {
      selected: !!(data?.identity?.locations?.length),
      items: (data?.identity?.locations || []).map(() => true),
    },
    serviceAreas: {
      selected: !!(data?.identity?.serviceAreas?.length || data?.identity?.deliveryZones?.length),
      fields: {
        serviceAreas: !!(data?.identity?.serviceAreas?.length),
        deliveryZones: !!(data?.identity?.deliveryZones?.length),
        internationalShipping: !!data?.identity?.internationalShipping,
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
        pinterest: !!data?.identity?.socialMedia?.pinterest,
        tiktok: !!data?.identity?.socialMedia?.tiktok,
        whatsappBusiness: !!data?.identity?.socialMedia?.whatsappBusiness,
        googleBusiness: !!data?.identity?.socialMedia?.googleBusiness,
      },
    },
    content: {
      selected: true,
      fields: {
        usps: (data?.personality?.uniqueSellingPoints?.length || 0) > 0,
        targetAudience: (data?.customerProfile?.targetAudience?.length || 0) > 0,
        customerPainPoints: (data?.customerProfile?.customerPainPoints?.length || 0) > 0,
      },
    },
    packages: {
      selected: (data?.knowledge?.packages?.length || 0) > 0,
      items: (data?.knowledge?.packages || []).map(() => true),
    },
    pricingTiers: {
      selected: (data?.knowledge?.pricingTiers?.length || 0) > 0,
      items: (data?.knowledge?.pricingTiers || []).map(() => true),
    },
    currentOffers: {
      selected: (data?.knowledge?.currentOffers?.length || 0) > 0,
      items: (data?.knowledge?.currentOffers || []).map(() => true),
    },
    faqs: {
      selected: (data?.knowledge?.faqs?.length || 0) > 0,
      items: (data?.knowledge?.faqs || []).map(() => true),
    },
    policies: {
      selected: !!data?.knowledge?.policies,
      fields: {
        returnPolicy: !!data?.knowledge?.policies?.returnPolicy,
        refundPolicy: !!data?.knowledge?.policies?.refundPolicy,
        cancellationPolicy: !!data?.knowledge?.policies?.cancellationPolicy,
        shippingPolicy: !!data?.knowledge?.policies?.shippingPolicy,
        warrantyPolicy: !!data?.knowledge?.policies?.warrantyPolicy,
      },
    },
    team: {
      selected: (data?.team?.length || 0) > 0,
      items: (data?.team || []).map(() => true),
    },
    testimonials: {
      selected: (data?.testimonials?.length || 0) > 0,
      items: (data?.testimonials || []).map(() => true),
    },
    caseStudies: {
      selected: (data?.caseStudies?.length || 0) > 0,
      items: (data?.caseStudies || []).map(() => true),
    },
    credibility: {
      selected: !!(data?.awards?.length || data?.certifications?.length ||
                   data?.accreditations?.length || data?.partnerships?.length ||
                   data?.clients?.length || data?.featuredIn?.length),
      fields: {
        awards: (data?.awards?.length || 0) > 0,
        certifications: (data?.certifications?.length || 0) > 0,
        accreditations: (data?.accreditations?.length || 0) > 0,
        partnerships: (data?.partnerships?.length || 0) > 0,
        clients: (data?.clients?.length || 0) > 0,
        featuredIn: (data?.featuredIn?.length || 0) > 0,
      },
    },
    additional: {
      selected: !!(data?.industrySpecificData?.founders || data?.industrySpecificData?.teamSize ||
                   data?.technicalInfo || data?.sustainability || data?.accessibility),
      fields: {
        founders: !!data?.industrySpecificData?.founders,
        teamSize: !!data?.industrySpecificData?.teamSize,
        technicalInfo: !!data?.technicalInfo,
        sustainability: !!data?.sustainability,
        accessibility: !!data?.accessibility,
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
    if (selection.businessInfo.fields.legalName && data.identity?.legalName) {
      result.identity.legalName = data.identity.legalName;
    }
    if (selection.businessInfo.fields.industry && data.identity?.industry) {
      result.identity.industry = data.identity.industry;
    }
    if (selection.businessInfo.fields.subIndustry && data.identity?.subIndustry) {
      result.identity.subIndustry = data.identity.subIndustry;
    }
    if (selection.businessInfo.fields.businessType && data.identity?.businessType) {
      result.identity.businessType = data.identity.businessType;
    }
    if (selection.businessInfo.fields.description) {
      const desc = data.personality?.description || data.identity?.description;
      if (desc) result.identity.description = desc;
    }
    if (selection.businessInfo.fields.shortDescription) {
      const shortDesc = data.identity?.shortDescription || data.personality?.shortDescription;
      if (shortDesc) result.identity.shortDescription = shortDesc;
    }
    if (selection.businessInfo.fields.tagline) {
      const tagline = data.personality?.tagline || data.identity?.tagline;
      if (tagline) result.identity.tagline = tagline;
    }
    if (selection.businessInfo.fields.yearEstablished && data.identity?.yearEstablished) {
      result.identity.yearEstablished = data.identity.yearEstablished;
    }
    if (selection.businessInfo.fields.languages && data.identity?.languages?.length) {
      result.identity.languages = data.identity.languages;
    }
  }

  // Brand Story
  if (selection.brandStory.selected) {
    result.personality = result.personality || {};
    if (selection.brandStory.fields.missionStatement && data.personality?.missionStatement) {
      result.personality.missionStatement = data.personality.missionStatement;
    }
    if (selection.brandStory.fields.visionStatement && data.personality?.visionStatement) {
      result.personality.visionStatement = data.personality.visionStatement;
    }
    if (selection.brandStory.fields.story && data.personality?.story) {
      result.personality.story = data.personality.story;
    }
    if (selection.brandStory.fields.brandValues && data.personality?.brandValues?.length) {
      result.personality.brandValues = data.personality.brandValues;
    }
    if (selection.brandStory.fields.brandVoice && data.personality?.brandVoice) {
      result.personality.brandVoice = data.personality.brandVoice;
    }
  }

  // Contact info
  if (selection.contact.selected) {
    result.identity = result.identity || {};
    if (selection.contact.fields.phone && data.identity?.phone) {
      result.identity.phone = data.identity.phone;
    }
    if (selection.contact.fields.secondaryPhone && data.identity?.secondaryPhone) {
      result.identity.secondaryPhone = data.identity.secondaryPhone;
    }
    if (selection.contact.fields.whatsapp && data.identity?.whatsapp) {
      result.identity.whatsapp = data.identity.whatsapp;
    }
    if (selection.contact.fields.tollFree && data.identity?.tollFree) {
      result.identity.tollFree = data.identity.tollFree;
    }
    if (selection.contact.fields.email && data.identity?.email) {
      result.identity.email = data.identity.email;
    }
    if (selection.contact.fields.supportEmail && data.identity?.supportEmail) {
      result.identity.supportEmail = data.identity.supportEmail;
    }
    if (selection.contact.fields.salesEmail && data.identity?.salesEmail) {
      result.identity.salesEmail = data.identity.salesEmail;
    }
    if (selection.contact.fields.bookingEmail && data.identity?.bookingEmail) {
      result.identity.bookingEmail = data.identity.bookingEmail;
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

  // Locations
  if (selection.locations.selected && data.identity?.locations?.length) {
    result.identity = result.identity || {};
    result.identity.locations = data.identity.locations.filter(
      (_: any, i: number) => selection.locations.items[i]
    );
  }

  // Service Areas
  if (selection.serviceAreas.selected) {
    result.identity = result.identity || {};
    if (selection.serviceAreas.fields.serviceAreas && data.identity?.serviceAreas?.length) {
      result.identity.serviceAreas = data.identity.serviceAreas;
    }
    if (selection.serviceAreas.fields.deliveryZones && data.identity?.deliveryZones?.length) {
      result.identity.deliveryZones = data.identity.deliveryZones;
    }
    if (selection.serviceAreas.fields.internationalShipping && data.identity?.internationalShipping) {
      result.identity.internationalShipping = data.identity.internationalShipping;
    }
  }

  // Social Media
  if (selection.social.selected) {
    result.identity = result.identity || {};
    result.identity.socialMedia = {};
    const socialFields = ['instagram', 'facebook', 'linkedin', 'twitter', 'youtube', 'pinterest', 'tiktok', 'whatsappBusiness', 'googleBusiness'] as const;
    for (const field of socialFields) {
      if (selection.social.fields[field] && data.identity?.socialMedia?.[field]) {
        result.identity.socialMedia[field] = data.identity.socialMedia[field];
      }
    }
    if (Object.keys(result.identity.socialMedia).length === 0) {
      delete result.identity.socialMedia;
    }
  }

  // Content (USPs, Target Audience, Pain Points)
  if (selection.content.selected) {
    if (selection.content.fields.usps && data.personality?.uniqueSellingPoints?.length) {
      result.personality = result.personality || {};
      result.personality.uniqueSellingPoints = data.personality.uniqueSellingPoints;
    }
    if (selection.content.fields.targetAudience && data.customerProfile?.targetAudience?.length) {
      result.customerProfile = result.customerProfile || {};
      result.customerProfile.targetAudience = data.customerProfile.targetAudience;
    }
    if (selection.content.fields.customerPainPoints && data.customerProfile?.customerPainPoints?.length) {
      result.customerProfile = result.customerProfile || {};
      result.customerProfile.customerPainPoints = data.customerProfile.customerPainPoints;
    }
  }

  // Packages
  if (selection.packages.selected && data.knowledge?.packages?.length) {
    result.knowledge = result.knowledge || {};
    result.knowledge.packages = data.knowledge.packages.filter(
      (_: any, i: number) => selection.packages.items[i]
    );
  }

  // Pricing Tiers
  if (selection.pricingTiers.selected && data.knowledge?.pricingTiers?.length) {
    result.knowledge = result.knowledge || {};
    result.knowledge.pricingTiers = data.knowledge.pricingTiers.filter(
      (_: any, i: number) => selection.pricingTiers.items[i]
    );
  }

  // Current Offers
  if (selection.currentOffers.selected && data.knowledge?.currentOffers?.length) {
    result.knowledge = result.knowledge || {};
    result.knowledge.currentOffers = data.knowledge.currentOffers.filter(
      (_: any, i: number) => selection.currentOffers.items[i]
    );
  }

  // FAQs
  if (selection.faqs.selected && data.knowledge?.faqs?.length) {
    result.knowledge = result.knowledge || {};
    result.knowledge.faqs = data.knowledge.faqs.filter(
      (_: any, i: number) => selection.faqs.items[i]
    );
  }

  // Policies
  if (selection.policies.selected && data.knowledge?.policies) {
    result.knowledge = result.knowledge || {};
    result.knowledge.policies = {};
    const policyFields = ['returnPolicy', 'refundPolicy', 'cancellationPolicy', 'shippingPolicy', 'warrantyPolicy'] as const;
    for (const field of policyFields) {
      if (selection.policies.fields[field] && data.knowledge.policies[field]) {
        result.knowledge.policies[field] = data.knowledge.policies[field];
      }
    }
  }

  // Team
  if (selection.team.selected && data.team?.length) {
    result.team = data.team.filter(
      (_: any, i: number) => selection.team.items[i]
    );
  }

  // Testimonials
  if (selection.testimonials.selected && data.testimonials?.length) {
    result.testimonials = data.testimonials.filter(
      (_: any, i: number) => selection.testimonials.items[i]
    );
  }

  // Case Studies
  if (selection.caseStudies.selected && data.caseStudies?.length) {
    result.caseStudies = data.caseStudies.filter(
      (_: any, i: number) => selection.caseStudies.items[i]
    );
  }

  // Credibility (Awards, Certifications, etc.)
  if (selection.credibility.selected) {
    if (selection.credibility.fields.awards && data.awards?.length) {
      result.awards = data.awards;
    }
    if (selection.credibility.fields.certifications && data.certifications?.length) {
      result.certifications = data.certifications;
    }
    if (selection.credibility.fields.accreditations && data.accreditations?.length) {
      result.accreditations = data.accreditations;
    }
    if (selection.credibility.fields.partnerships && data.partnerships?.length) {
      result.partnerships = data.partnerships;
    }
    if (selection.credibility.fields.clients && data.clients?.length) {
      result.clients = data.clients;
    }
    if (selection.credibility.fields.featuredIn && data.featuredIn?.length) {
      result.featuredIn = data.featuredIn;
    }
  }

  // Additional Info
  if (selection.additional.selected) {
    result.industrySpecificData = result.industrySpecificData || {};
    if (selection.additional.fields.founders && data.industrySpecificData?.founders) {
      result.industrySpecificData.founders = data.industrySpecificData.founders;
    }
    if (selection.additional.fields.teamSize && data.industrySpecificData?.teamSize) {
      result.industrySpecificData.teamSize = data.industrySpecificData.teamSize;
    }
    if (selection.additional.fields.technicalInfo && data.technicalInfo) {
      result.technicalInfo = data.technicalInfo;
    }
    if (selection.additional.fields.sustainability && data.sustainability) {
      result.sustainability = data.sustainability;
    }
    if (selection.additional.fields.accessibility && data.accessibility) {
      result.accessibility = data.accessibility;
    }
  }

  return result;
}

// Count selected items
function countSelectedItems(selection: SelectionState): { selected: number; total: number } {
  let selected = 0;
  let total = 0;

  // Helper to count fields in a section
  const countFields = (fields: Record<string, boolean>, sectionSelected: boolean) => {
    Object.values(fields).forEach(v => {
      if (v) {
        total++;
        if (sectionSelected) selected++;
      }
    });
  };

  // Helper to count items array
  const countItems = (items: boolean[], sectionSelected: boolean) => {
    items.forEach(v => {
      total++;
      if (v && sectionSelected) selected++;
    });
  };

  // Business Info
  countFields(selection.businessInfo.fields, selection.businessInfo.selected);

  // Brand Story
  countFields(selection.brandStory.fields, selection.brandStory.selected);

  // Contact
  countFields(selection.contact.fields, selection.contact.selected);

  // Locations
  countItems(selection.locations.items, selection.locations.selected);

  // Service Areas
  countFields(selection.serviceAreas.fields, selection.serviceAreas.selected);

  // Social
  countFields(selection.social.fields, selection.social.selected);

  // Content
  countFields(selection.content.fields, selection.content.selected);

  // Packages
  countItems(selection.packages.items, selection.packages.selected);

  // Pricing Tiers
  countItems(selection.pricingTiers.items, selection.pricingTiers.selected);

  // Current Offers
  countItems(selection.currentOffers.items, selection.currentOffers.selected);

  // FAQs
  countItems(selection.faqs.items, selection.faqs.selected);

  // Policies
  countFields(selection.policies.fields, selection.policies.selected);

  // Team
  countItems(selection.team.items, selection.team.selected);

  // Testimonials
  countItems(selection.testimonials.items, selection.testimonials.selected);

  // Case Studies
  countItems(selection.caseStudies.items, selection.caseStudies.selected);

  // Credibility
  countFields(selection.credibility.fields, selection.credibility.selected);

  // Additional
  countFields(selection.additional.fields, selection.additional.selected);

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
    brandStory: false,
    contact: true,
    locations: false,
    serviceAreas: false,
    social: false,
    content: false,
    packages: false,
    pricingTiers: false,
    currentOffers: false,
    faqs: false,
    policies: false,
    team: false,
    testimonials: false,
    caseStudies: false,
    credibility: false,
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
  const hasBusinessInfo = data.identity?.businessName || data.identity?.description || data.personality?.tagline ||
                          data.identity?.industry || data.identity?.yearEstablished;
  const hasBrandStory = data.personality?.missionStatement || data.personality?.visionStatement ||
                        data.personality?.story || data.personality?.brandValues?.length || data.personality?.brandVoice;
  const hasContact = data.identity?.phone || data.identity?.email || data.identity?.address ||
                     data.identity?.secondaryPhone || data.identity?.supportEmail || data.identity?.operatingHours;
  const hasLocations = data.identity?.locations?.length > 0;
  const hasServiceAreas = data.identity?.serviceAreas?.length > 0 || data.identity?.deliveryZones?.length > 0;
  const hasSocial = data.identity?.socialMedia && Object.values(data.identity.socialMedia).some(v => v);
  const hasContent = data.personality?.uniqueSellingPoints?.length || data.customerProfile?.targetAudience?.length ||
                     data.customerProfile?.customerPainPoints?.length;
  const hasPackages = data.knowledge?.packages?.length > 0;
  const hasPricingTiers = data.knowledge?.pricingTiers?.length > 0;
  const hasCurrentOffers = data.knowledge?.currentOffers?.length > 0;
  const hasFaqs = data.knowledge?.faqs?.length > 0;
  const hasPolicies = data.knowledge?.policies && Object.values(data.knowledge.policies).some(v => v);
  const hasTeam = data.team?.length > 0;
  const hasTestimonials = data.testimonials?.length > 0;
  const hasCaseStudies = data.caseStudies?.length > 0;
  const hasCredibility = data.awards?.length > 0 || data.certifications?.length > 0 ||
                         data.accreditations?.length > 0 || data.partnerships?.length > 0 ||
                         data.clients?.length > 0 || data.featuredIn?.length > 0;
  const hasAdditional = data.industrySpecificData?.founders || data.industrySpecificData?.teamSize ||
                        data.technicalInfo || data.sustainability || data.accessibility;

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
                {data.identity?.legalName && (
                  <SelectableItem
                    selected={selection.businessInfo.fields.legalName && selection.businessInfo.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      businessInfo: {
                        ...prev.businessInfo,
                        fields: { ...prev.businessInfo.fields, legalName: !prev.businessInfo.fields.legalName }
                      }
                    }))}
                    label="Legal Name"
                    value={data.identity.legalName}
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
                {data.identity?.subIndustry && (
                  <SelectableItem
                    selected={selection.businessInfo.fields.subIndustry && selection.businessInfo.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      businessInfo: {
                        ...prev.businessInfo,
                        fields: { ...prev.businessInfo.fields, subIndustry: !prev.businessInfo.fields.subIndustry }
                      }
                    }))}
                    label="Sub-Industry"
                    value={data.identity.subIndustry}
                  />
                )}
                {data.identity?.businessType && (
                  <SelectableItem
                    selected={selection.businessInfo.fields.businessType && selection.businessInfo.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      businessInfo: {
                        ...prev.businessInfo,
                        fields: { ...prev.businessInfo.fields, businessType: !prev.businessInfo.fields.businessType }
                      }
                    }))}
                    label="Business Type"
                    value={data.identity.businessType}
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
                {data.identity?.yearEstablished && (
                  <SelectableItem
                    selected={selection.businessInfo.fields.yearEstablished && selection.businessInfo.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      businessInfo: {
                        ...prev.businessInfo,
                        fields: { ...prev.businessInfo.fields, yearEstablished: !prev.businessInfo.fields.yearEstablished }
                      }
                    }))}
                    label="Year Established"
                    value={String(data.identity.yearEstablished)}
                  />
                )}
                {data.identity?.languages?.length > 0 && (
                  <SelectableItem
                    selected={selection.businessInfo.fields.languages && selection.businessInfo.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      businessInfo: {
                        ...prev.businessInfo,
                        fields: { ...prev.businessInfo.fields, languages: !prev.businessInfo.fields.languages }
                      }
                    }))}
                    label="Languages"
                    value={data.identity.languages.join(', ')}
                  />
                )}
              </div>
            </SectionHeader>
          )}

          {/* Brand Story */}
          {hasBrandStory && (
            <SectionHeader
              title="Brand Story & Values"
              icon={Heart}
              selected={selection.brandStory.selected}
              onToggle={() => toggleSection('brandStory')}
              expanded={expandedSections.brandStory}
              onExpandToggle={() => toggleExpanded('brandStory')}
            >
              <div className="space-y-2">
                {data.personality?.missionStatement && (
                  <SelectableItem
                    selected={selection.brandStory.fields.missionStatement && selection.brandStory.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      brandStory: {
                        ...prev.brandStory,
                        fields: { ...prev.brandStory.fields, missionStatement: !prev.brandStory.fields.missionStatement }
                      }
                    }))}
                    label="Mission Statement"
                    value={data.personality.missionStatement.substring(0, 100) + (data.personality.missionStatement.length > 100 ? '...' : '')}
                  />
                )}
                {data.personality?.visionStatement && (
                  <SelectableItem
                    selected={selection.brandStory.fields.visionStatement && selection.brandStory.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      brandStory: {
                        ...prev.brandStory,
                        fields: { ...prev.brandStory.fields, visionStatement: !prev.brandStory.fields.visionStatement }
                      }
                    }))}
                    label="Vision Statement"
                    value={data.personality.visionStatement.substring(0, 100) + (data.personality.visionStatement.length > 100 ? '...' : '')}
                  />
                )}
                {data.personality?.story && (
                  <SelectableItem
                    selected={selection.brandStory.fields.story && selection.brandStory.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      brandStory: {
                        ...prev.brandStory,
                        fields: { ...prev.brandStory.fields, story: !prev.brandStory.fields.story }
                      }
                    }))}
                    label="Company Story"
                    value={data.personality.story.substring(0, 100) + (data.personality.story.length > 100 ? '...' : '')}
                  />
                )}
                {data.personality?.brandValues?.length > 0 && (
                  <SelectableItem
                    selected={selection.brandStory.fields.brandValues && selection.brandStory.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      brandStory: {
                        ...prev.brandStory,
                        fields: { ...prev.brandStory.fields, brandValues: !prev.brandStory.fields.brandValues }
                      }
                    }))}
                    label="Brand Values"
                    value={data.personality.brandValues.join(', ')}
                  />
                )}
                {data.personality?.brandVoice && (
                  <SelectableItem
                    selected={selection.brandStory.fields.brandVoice && selection.brandStory.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      brandStory: {
                        ...prev.brandStory,
                        fields: { ...prev.brandStory.fields, brandVoice: !prev.brandStory.fields.brandVoice }
                      }
                    }))}
                    label="Brand Voice"
                    value={typeof data.personality.brandVoice === 'object'
                      ? (data.personality.brandVoice.tone?.join(', ') || data.personality.brandVoice.style || 'Defined')
                      : data.personality.brandVoice}
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
                    label="Primary Phone"
                    value={data.identity.phone}
                  />
                )}
                {data.identity?.secondaryPhone && (
                  <SelectableItem
                    selected={selection.contact.fields.secondaryPhone && selection.contact.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      contact: { ...prev.contact, fields: { ...prev.contact.fields, secondaryPhone: !prev.contact.fields.secondaryPhone } }
                    }))}
                    label="Secondary Phone"
                    value={data.identity.secondaryPhone}
                  />
                )}
                {data.identity?.whatsapp && (
                  <SelectableItem
                    selected={selection.contact.fields.whatsapp && selection.contact.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      contact: { ...prev.contact, fields: { ...prev.contact.fields, whatsapp: !prev.contact.fields.whatsapp } }
                    }))}
                    label="WhatsApp"
                    value={data.identity.whatsapp}
                  />
                )}
                {data.identity?.tollFree && (
                  <SelectableItem
                    selected={selection.contact.fields.tollFree && selection.contact.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      contact: { ...prev.contact, fields: { ...prev.contact.fields, tollFree: !prev.contact.fields.tollFree } }
                    }))}
                    label="Toll-Free"
                    value={data.identity.tollFree}
                  />
                )}
                {data.identity?.email && (
                  <SelectableItem
                    selected={selection.contact.fields.email && selection.contact.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      contact: { ...prev.contact, fields: { ...prev.contact.fields, email: !prev.contact.fields.email } }
                    }))}
                    label="Primary Email"
                    value={data.identity.email}
                  />
                )}
                {data.identity?.supportEmail && (
                  <SelectableItem
                    selected={selection.contact.fields.supportEmail && selection.contact.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      contact: { ...prev.contact, fields: { ...prev.contact.fields, supportEmail: !prev.contact.fields.supportEmail } }
                    }))}
                    label="Support Email"
                    value={data.identity.supportEmail}
                  />
                )}
                {data.identity?.salesEmail && (
                  <SelectableItem
                    selected={selection.contact.fields.salesEmail && selection.contact.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      contact: { ...prev.contact, fields: { ...prev.contact.fields, salesEmail: !prev.contact.fields.salesEmail } }
                    }))}
                    label="Sales Email"
                    value={data.identity.salesEmail}
                  />
                )}
                {data.identity?.bookingEmail && (
                  <SelectableItem
                    selected={selection.contact.fields.bookingEmail && selection.contact.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      contact: { ...prev.contact, fields: { ...prev.contact.fields, bookingEmail: !prev.contact.fields.bookingEmail } }
                    }))}
                    label="Booking Email"
                    value={data.identity.bookingEmail}
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

          {/* Locations */}
          {hasLocations && (
            <SectionHeader
              title="Multiple Locations"
              icon={MapPin}
              selected={selection.locations.selected}
              onToggle={() => toggleSection('locations')}
              expanded={expandedSections.locations}
              onExpandToggle={() => toggleExpanded('locations')}
              count={data.identity?.locations?.length || 0}
            >
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {data.identity?.locations?.map((loc: any, i: number) => (
                  <SelectableItem
                    key={i}
                    selected={selection.locations.items[i] && selection.locations.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      locations: {
                        ...prev.locations,
                        items: prev.locations.items.map((v, idx) => idx === i ? !v : v)
                      }
                    }))}
                    label={loc.name || `Location ${i + 1}`}
                    value={loc.address}
                    sublabel={loc.isHeadquarters ? 'Headquarters' : undefined}
                  />
                ))}
              </div>
            </SectionHeader>
          )}

          {/* Service Areas */}
          {hasServiceAreas && (
            <SectionHeader
              title="Service Areas"
              icon={Truck}
              selected={selection.serviceAreas.selected}
              onToggle={() => toggleSection('serviceAreas')}
              expanded={expandedSections.serviceAreas}
              onExpandToggle={() => toggleExpanded('serviceAreas')}
            >
              <div className="space-y-2">
                {data.identity?.serviceAreas?.length > 0 && (
                  <SelectableItem
                    selected={selection.serviceAreas.fields.serviceAreas && selection.serviceAreas.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      serviceAreas: { ...prev.serviceAreas, fields: { ...prev.serviceAreas.fields, serviceAreas: !prev.serviceAreas.fields.serviceAreas } }
                    }))}
                    label="Service Areas"
                    value={data.identity.serviceAreas.join(', ')}
                  />
                )}
                {data.identity?.deliveryZones?.length > 0 && (
                  <SelectableItem
                    selected={selection.serviceAreas.fields.deliveryZones && selection.serviceAreas.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      serviceAreas: { ...prev.serviceAreas, fields: { ...prev.serviceAreas.fields, deliveryZones: !prev.serviceAreas.fields.deliveryZones } }
                    }))}
                    label="Delivery Zones"
                    value={data.identity.deliveryZones.join(', ')}
                  />
                )}
                {data.identity?.internationalShipping && (
                  <SelectableItem
                    selected={selection.serviceAreas.fields.internationalShipping && selection.serviceAreas.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      serviceAreas: { ...prev.serviceAreas, fields: { ...prev.serviceAreas.fields, internationalShipping: !prev.serviceAreas.fields.internationalShipping } }
                    }))}
                    label="International Shipping"
                    value="Available"
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
                {data.customerProfile?.customerPainPoints?.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        onClick={() => setSelection(prev => ({
                          ...prev,
                          content: { ...prev.content, fields: { ...prev.content.fields, customerPainPoints: !prev.content.fields.customerPainPoints } }
                        }))}
                        className="flex-shrink-0"
                      >
                        {selection.content.fields.customerPainPoints && selection.content.selected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                      <span className="text-sm font-medium text-slate-700">Customer Pain Points</span>
                    </div>
                    <div className="flex flex-wrap gap-2 pl-6">
                      {data.customerProfile.customerPainPoints.map((pp: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-sm">
                          {pp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
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

          {/* Packages */}
          {hasPackages && (
            <SectionHeader
              title="Packages"
              icon={Package}
              selected={selection.packages.selected}
              onToggle={() => toggleSection('packages')}
              expanded={expandedSections.packages}
              onExpandToggle={() => toggleExpanded('packages')}
              count={data.knowledge.packages.length}
            >
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {data.knowledge.packages.map((pkg: any, i: number) => (
                  <SelectableItem
                    key={i}
                    selected={selection.packages.items[i] && selection.packages.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      packages: {
                        ...prev.packages,
                        items: prev.packages.items.map((v, idx) => idx === i ? !v : v)
                      }
                    }))}
                    label={pkg.name}
                    value={pkg.price ? `${pkg.price}${pkg.duration ? ` - ${pkg.duration}` : ''}` : pkg.description}
                    sublabel={pkg.includes?.length ? `Includes: ${pkg.includes.slice(0, 3).join(', ')}...` : undefined}
                  />
                ))}
              </div>
            </SectionHeader>
          )}

          {/* Pricing Tiers */}
          {hasPricingTiers && (
            <SectionHeader
              title="Pricing Tiers"
              icon={DollarSign}
              selected={selection.pricingTiers.selected}
              onToggle={() => toggleSection('pricingTiers')}
              expanded={expandedSections.pricingTiers}
              onExpandToggle={() => toggleExpanded('pricingTiers')}
              count={data.knowledge.pricingTiers.length}
            >
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {data.knowledge.pricingTiers.map((tier: any, i: number) => (
                  <SelectableItem
                    key={i}
                    selected={selection.pricingTiers.items[i] && selection.pricingTiers.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      pricingTiers: {
                        ...prev.pricingTiers,
                        items: prev.pricingTiers.items.map((v, idx) => idx === i ? !v : v)
                      }
                    }))}
                    label={tier.name}
                    value={`${tier.price}${tier.period ? ` / ${tier.period}` : ''}`}
                    sublabel={tier.isRecommended ? 'Recommended' : (tier.features?.length ? `${tier.features.length} features` : undefined)}
                  />
                ))}
              </div>
            </SectionHeader>
          )}

          {/* Current Offers */}
          {hasCurrentOffers && (
            <SectionHeader
              title="Current Offers & Promotions"
              icon={Percent}
              selected={selection.currentOffers.selected}
              onToggle={() => toggleSection('currentOffers')}
              expanded={expandedSections.currentOffers}
              onExpandToggle={() => toggleExpanded('currentOffers')}
              count={data.knowledge.currentOffers.length}
            >
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {data.knowledge.currentOffers.map((offer: any, i: number) => (
                  <SelectableItem
                    key={i}
                    selected={selection.currentOffers.items[i] && selection.currentOffers.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      currentOffers: {
                        ...prev.currentOffers,
                        items: prev.currentOffers.items.map((v, idx) => idx === i ? !v : v)
                      }
                    }))}
                    label={offer.title}
                    value={offer.discount || offer.description}
                    sublabel={offer.code ? `Code: ${offer.code}` : (offer.validUntil ? `Valid until: ${offer.validUntil}` : undefined)}
                  />
                ))}
              </div>
            </SectionHeader>
          )}

          {/* Policies */}
          {hasPolicies && (
            <SectionHeader
              title="Policies"
              icon={Shield}
              selected={selection.policies.selected}
              onToggle={() => toggleSection('policies')}
              expanded={expandedSections.policies}
              onExpandToggle={() => toggleExpanded('policies')}
            >
              <div className="space-y-2">
                {data.knowledge?.policies?.returnPolicy && (
                  <SelectableItem
                    selected={selection.policies.fields.returnPolicy && selection.policies.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      policies: { ...prev.policies, fields: { ...prev.policies.fields, returnPolicy: !prev.policies.fields.returnPolicy } }
                    }))}
                    label="Return Policy"
                    value={data.knowledge.policies.returnPolicy.substring(0, 100) + (data.knowledge.policies.returnPolicy.length > 100 ? '...' : '')}
                  />
                )}
                {data.knowledge?.policies?.refundPolicy && (
                  <SelectableItem
                    selected={selection.policies.fields.refundPolicy && selection.policies.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      policies: { ...prev.policies, fields: { ...prev.policies.fields, refundPolicy: !prev.policies.fields.refundPolicy } }
                    }))}
                    label="Refund Policy"
                    value={data.knowledge.policies.refundPolicy.substring(0, 100) + (data.knowledge.policies.refundPolicy.length > 100 ? '...' : '')}
                  />
                )}
                {data.knowledge?.policies?.cancellationPolicy && (
                  <SelectableItem
                    selected={selection.policies.fields.cancellationPolicy && selection.policies.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      policies: { ...prev.policies, fields: { ...prev.policies.fields, cancellationPolicy: !prev.policies.fields.cancellationPolicy } }
                    }))}
                    label="Cancellation Policy"
                    value={data.knowledge.policies.cancellationPolicy.substring(0, 100) + (data.knowledge.policies.cancellationPolicy.length > 100 ? '...' : '')}
                  />
                )}
                {data.knowledge?.policies?.shippingPolicy && (
                  <SelectableItem
                    selected={selection.policies.fields.shippingPolicy && selection.policies.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      policies: { ...prev.policies, fields: { ...prev.policies.fields, shippingPolicy: !prev.policies.fields.shippingPolicy } }
                    }))}
                    label="Shipping Policy"
                    value={data.knowledge.policies.shippingPolicy.substring(0, 100) + (data.knowledge.policies.shippingPolicy.length > 100 ? '...' : '')}
                  />
                )}
                {data.knowledge?.policies?.warrantyPolicy && (
                  <SelectableItem
                    selected={selection.policies.fields.warrantyPolicy && selection.policies.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      policies: { ...prev.policies, fields: { ...prev.policies.fields, warrantyPolicy: !prev.policies.fields.warrantyPolicy } }
                    }))}
                    label="Warranty Policy"
                    value={data.knowledge.policies.warrantyPolicy.substring(0, 100) + (data.knowledge.policies.warrantyPolicy.length > 100 ? '...' : '')}
                  />
                )}
              </div>
            </SectionHeader>
          )}

          {/* Team */}
          {hasTeam && (
            <SectionHeader
              title="Team Members"
              icon={Users}
              selected={selection.team.selected}
              onToggle={() => toggleSection('team')}
              expanded={expandedSections.team}
              onExpandToggle={() => toggleExpanded('team')}
              count={data.team.length}
            >
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {data.team.map((member: any, i: number) => (
                  <SelectableItem
                    key={i}
                    selected={selection.team.items[i] && selection.team.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      team: {
                        ...prev.team,
                        items: prev.team.items.map((v, idx) => idx === i ? !v : v)
                      }
                    }))}
                    label={member.name}
                    value={member.role}
                    sublabel={member.department || (member.specializations?.length ? member.specializations.join(', ') : undefined)}
                  />
                ))}
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
                    sublabel={t.rating ? `${'★'.repeat(t.rating)}${'☆'.repeat(5 - t.rating)}` : (t.platform || undefined)}
                  />
                ))}
              </div>
            </SectionHeader>
          )}

          {/* Case Studies */}
          {hasCaseStudies && (
            <SectionHeader
              title="Case Studies"
              icon={Briefcase}
              selected={selection.caseStudies.selected}
              onToggle={() => toggleSection('caseStudies')}
              expanded={expandedSections.caseStudies}
              onExpandToggle={() => toggleExpanded('caseStudies')}
              count={data.caseStudies.length}
            >
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {data.caseStudies.map((cs: any, i: number) => (
                  <SelectableItem
                    key={i}
                    selected={selection.caseStudies.items[i] && selection.caseStudies.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      caseStudies: {
                        ...prev.caseStudies,
                        items: prev.caseStudies.items.map((v, idx) => idx === i ? !v : v)
                      }
                    }))}
                    label={cs.title}
                    value={cs.client || cs.results}
                    sublabel={cs.industry}
                  />
                ))}
              </div>
            </SectionHeader>
          )}

          {/* Credibility */}
          {hasCredibility && (
            <SectionHeader
              title="Awards & Credentials"
              icon={Award}
              selected={selection.credibility.selected}
              onToggle={() => toggleSection('credibility')}
              expanded={expandedSections.credibility}
              onExpandToggle={() => toggleExpanded('credibility')}
            >
              <div className="space-y-2">
                {data.awards?.length > 0 && (
                  <SelectableItem
                    selected={selection.credibility.fields.awards && selection.credibility.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      credibility: { ...prev.credibility, fields: { ...prev.credibility.fields, awards: !prev.credibility.fields.awards } }
                    }))}
                    label="Awards"
                    value={data.awards.map((a: any) => typeof a === 'string' ? a : a.name).join(', ')}
                  />
                )}
                {data.certifications?.length > 0 && (
                  <SelectableItem
                    selected={selection.credibility.fields.certifications && selection.credibility.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      credibility: { ...prev.credibility, fields: { ...prev.credibility.fields, certifications: !prev.credibility.fields.certifications } }
                    }))}
                    label="Certifications"
                    value={data.certifications.map((c: any) => typeof c === 'string' ? c : c.name).join(', ')}
                  />
                )}
                {data.accreditations?.length > 0 && (
                  <SelectableItem
                    selected={selection.credibility.fields.accreditations && selection.credibility.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      credibility: { ...prev.credibility, fields: { ...prev.credibility.fields, accreditations: !prev.credibility.fields.accreditations } }
                    }))}
                    label="Accreditations"
                    value={data.accreditations.join(', ')}
                  />
                )}
                {data.partnerships?.length > 0 && (
                  <SelectableItem
                    selected={selection.credibility.fields.partnerships && selection.credibility.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      credibility: { ...prev.credibility, fields: { ...prev.credibility.fields, partnerships: !prev.credibility.fields.partnerships } }
                    }))}
                    label="Partnerships"
                    value={data.partnerships.join(', ')}
                  />
                )}
                {data.clients?.length > 0 && (
                  <SelectableItem
                    selected={selection.credibility.fields.clients && selection.credibility.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      credibility: { ...prev.credibility, fields: { ...prev.credibility.fields, clients: !prev.credibility.fields.clients } }
                    }))}
                    label="Notable Clients"
                    value={data.clients.join(', ')}
                  />
                )}
                {data.featuredIn?.length > 0 && (
                  <SelectableItem
                    selected={selection.credibility.fields.featuredIn && selection.credibility.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      credibility: { ...prev.credibility, fields: { ...prev.credibility.fields, featuredIn: !prev.credibility.fields.featuredIn } }
                    }))}
                    label="Featured In"
                    value={data.featuredIn.join(', ')}
                  />
                )}
              </div>
            </SectionHeader>
          )}

          {/* Additional Info */}
          {hasAdditional && (
            <SectionHeader
              title="Additional Information"
              icon={FileText}
              selected={selection.additional.selected}
              onToggle={() => toggleSection('additional')}
              expanded={expandedSections.additional}
              onExpandToggle={() => toggleExpanded('additional')}
            >
              <div className="space-y-2">
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
                    value={String(data.industrySpecificData.teamSize)}
                  />
                )}
                {data.technicalInfo && (
                  <SelectableItem
                    selected={selection.additional.fields.technicalInfo && selection.additional.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      additional: { ...prev.additional, fields: { ...prev.additional.fields, technicalInfo: !prev.additional.fields.technicalInfo } }
                    }))}
                    label="Technical Info"
                    value="Technical specifications available"
                  />
                )}
                {data.sustainability && (
                  <SelectableItem
                    selected={selection.additional.fields.sustainability && selection.additional.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      additional: { ...prev.additional, fields: { ...prev.additional.fields, sustainability: !prev.additional.fields.sustainability } }
                    }))}
                    label="Sustainability"
                    value={data.sustainability.ecofriendly ? "Eco-friendly practices" : "Sustainability info available"}
                  />
                )}
                {data.accessibility && (
                  <SelectableItem
                    selected={selection.additional.fields.accessibility && selection.additional.selected}
                    onToggle={() => setSelection(prev => ({
                      ...prev,
                      additional: { ...prev.additional, fields: { ...prev.additional.fields, accessibility: !prev.additional.fields.accessibility } }
                    }))}
                    label="Accessibility"
                    value={data.accessibility.wheelchairAccessible ? "Wheelchair accessible" : "Accessibility info available"}
                  />
                )}
              </div>
            </SectionHeader>
          )}

          {/* No Data Message */}
          {!hasBusinessInfo && !hasBrandStory && !hasContact && !hasLocations && !hasServiceAreas &&
           !hasSocial && !hasContent && !hasPackages && !hasPricingTiers &&
           !hasCurrentOffers && !hasFaqs && !hasPolicies && !hasTeam &&
           !hasTestimonials && !hasCaseStudies && !hasCredibility && !hasAdditional && (
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
