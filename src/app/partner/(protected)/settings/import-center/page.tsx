'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getBusinessPersonaAction, saveBusinessPersonaAction } from '@/actions/business-persona-actions';
import { searchBusinessesAction, autoFillProfileAction, applyImportToProfileAction } from '@/actions/business-autofill-actions';
import { scrapeWebsiteAction } from '@/actions/website-scrape-actions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, Search, Globe, Sparkles, Loader2, CheckCircle2,
  ChevronDown, ChevronRight, Trash2, X,
  Building2, MapPin, Package, Heart, Star, Shield, Users,
  MessageSquare, Phone, Mail, Link2, ExternalLink,
  Info, AlertCircle, Check, Send, Database, Clock, DollarSign,
  Tag, Gift, FileText, Award, Briefcase, Target, Share2,
  Home, ShoppingBag, Utensils, Bed, GraduationCap, Stethoscope,
  Merge, Layers, Quote, TrendingUp, ThumbsUp, ThumbsDown,
  Minus, BarChart3, Eye, EyeOff, Copy, Zap, ArrowRight,
  RefreshCw, Filter, CheckCheck, XCircle, Circle, Edit3, Save
} from 'lucide-react';
import type { BusinessPersona } from '@/lib/business-persona-types';

// ========================================
// TYPES
// ========================================

type ViewTab = 'import' | 'merge' | 'testimonials' | 'saved';

interface ImportedField {
  id: string;
  label: string;
  value: any;
  displayValue: string;
  path: string;
  source: 'google' | 'website' | 'saved';
  selected: boolean;
  category?: string;
}

interface EditingField {
  field: ImportedField;
  categoryId: string;
  newValue: any;
}

interface ImportedCategory {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  fields: ImportedField[];
  expanded: boolean;
}

interface MergeField {
  fieldKey: string;
  label: string;
  path: string;
  googleValue?: any;
  websiteValue?: any;
  selectedSource: 'google' | 'website' | 'none';
  category: string;
}

interface TestimonialItem {
  id: string;
  quote: string;
  author?: string;
  role?: string;
  location?: string;
  rating?: number;
  date?: string;
  platform?: string;
  verified?: boolean;
  productService?: string;
  source: 'google' | 'website';
  sentiment?: 'positive' | 'neutral' | 'negative';
  selected: boolean;
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function formatDisplayValue(value: any, maxLength = 120): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') {
    return value.length > maxLength ? value.substring(0, maxLength) + '...' : value;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return 'None';
    if (typeof value[0] === 'string') {
      const joined = value.join(', ');
      return joined.length > maxLength ? joined.substring(0, maxLength) + '...' : joined;
    }
    return `${value.length} items`;
  }
  if (typeof value === 'object') {
    if (value.street || value.city) {
      const parts = [value.street, value.area, value.city, value.state, value.country].filter(Boolean);
      return parts.join(', ');
    }
    if (value.isOpen24x7 !== undefined) {
      return value.isOpen24x7 ? 'Open 24/7' : 'Custom hours configured';
    }
    return JSON.stringify(value).substring(0, maxLength) + '...';
  }
  if (typeof value === 'number') return value.toLocaleString();
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function addField(
  fields: ImportedField[],
  id: string,
  label: string,
  value: any,
  path: string,
  source: 'google' | 'website' | 'saved',
  customDisplay?: string,
  category?: string
) {
  if (value !== null && value !== undefined && value !== '' &&
    !(Array.isArray(value) && value.length === 0) &&
    !(typeof value === 'object' && Object.keys(value).length === 0)) {
    fields.push({
      id,
      label,
      value,
      displayValue: customDisplay || formatDisplayValue(value),
      path,
      source,
      selected: true,
      category
    });
  }
}

function analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  const positiveWords = ['great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'best', 'perfect', 'awesome', 'outstanding', 'exceptional', 'highly recommend', 'impressed', 'friendly', 'professional', 'delicious', 'beautiful'];
  const negativeWords = ['bad', 'terrible', 'awful', 'worst', 'horrible', 'disappointed', 'poor', 'never again', 'waste', 'rude', 'slow', 'dirty', 'overpriced', 'avoid'];

  const lowerText = text.toLowerCase();
  let positiveScore = 0;
  let negativeScore = 0;

  positiveWords.forEach(word => {
    if (lowerText.includes(word)) positiveScore++;
  });
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) negativeScore++;
  });

  if (positiveScore > negativeScore) return 'positive';
  if (negativeScore > positiveScore) return 'negative';
  return 'neutral';
}

// Helper to get category icon by ID
function getCategoryIcon(categoryId: string): React.ElementType {
  const iconMap: Record<string, React.ElementType> = {
    identity: Building2,
    contact: Phone,
    personality: Heart,
    products: Package,
    knowledge: FileText,
    policies: Shield,
    ratings: Star,
    team: Users,
    social: Share2,
    facilities: Home
  };
  return iconMap[categoryId] || Building2;
}

// Helper to get category color by ID
function getCategoryColor(categoryId: string): string {
  const colorMap: Record<string, string> = {
    identity: 'bg-indigo-500',
    contact: 'bg-blue-500',
    personality: 'bg-pink-500',
    products: 'bg-emerald-500',
    knowledge: 'bg-amber-500',
    policies: 'bg-slate-500',
    ratings: 'bg-yellow-500',
    team: 'bg-purple-500',
    social: 'bg-cyan-500',
    facilities: 'bg-teal-500'
  };
  return colorMap[categoryId] || 'bg-slate-500';
}

/**
 * COMPREHENSIVE extraction of ALL imported data organized by category
 */
function extractImportedCategories(data: any, source: 'google' | 'website' | 'saved'): ImportedCategory[] {
  const categories: ImportedCategory[] = [];
  if (!data) return categories;

  // Safely access nested data - check both nested and root level
  const identity = data?.identity || {};
  const personality = data?.personality || {};
  const knowledge = data?.knowledge || {};
  const customerProfile = data?.customerProfile || {};
  const inventory = data?.inventory || {};

  // ========================================
  // 1. BUSINESS IDENTITY
  // ========================================
  const identityFields: ImportedField[] = [];

  addField(identityFields, 'businessName', 'Business Name', identity.businessName || identity.name || data.businessName, 'identity.name', source);
  addField(identityFields, 'legalName', 'Legal Name', identity.legalName || data.legalName, 'identity.legalName', source);
  addField(identityFields, 'tagline', 'Tagline', personality.tagline || identity.tagline || data.tagline, 'personality.tagline', source);
  addField(identityFields, 'description', 'Description', personality.description || identity.description || data.description, 'personality.description', source);
  addField(identityFields, 'shortDescription', 'Short Description', personality.shortDescription || identity.shortDescription || data.shortDescription, 'personality.shortDescription', source);
  addField(identityFields, 'industry', 'Industry', identity.industry || data.industry, 'identity.industry', source);
  addField(identityFields, 'subIndustry', 'Sub-Industry', identity.subIndustry || data.subIndustry, 'identity.subIndustry', source);
  addField(identityFields, 'businessType', 'Business Type', identity.businessType || data.businessType, 'identity.businessType', source);
  addField(identityFields, 'yearEstablished', 'Year Established', identity.yearEstablished || data.yearEstablished, 'identity.yearEstablished', source);
  addField(identityFields, 'languages', 'Languages', identity.languages || data.languages, 'identity.languages', source);

  if (identityFields.length > 0) {
    categories.push({
      id: 'identity',
      label: 'Business Identity',
      icon: Building2,
      color: 'bg-indigo-500',
      fields: identityFields,
      expanded: true
    });
  }

  // ========================================
  // 2. CONTACT INFORMATION
  // ========================================
  const contactFields: ImportedField[] = [];
  const contact = data?.contact || {};

  addField(contactFields, 'phone', 'Primary Phone', identity.phone || contact.primaryPhone || data.phone, 'identity.phone', source);
  addField(contactFields, 'secondaryPhone', 'Secondary Phone', identity.secondaryPhone || contact.secondaryPhone, 'identity.secondaryPhone', source);
  addField(contactFields, 'whatsapp', 'WhatsApp', identity.whatsapp || contact.whatsapp, 'identity.whatsAppNumber', source);
  addField(contactFields, 'tollFree', 'Toll-Free', identity.tollFree || contact.tollFree, 'identity.tollFree', source);
  addField(contactFields, 'email', 'Primary Email', identity.email || contact.primaryEmail || data.email, 'identity.email', source);
  addField(contactFields, 'supportEmail', 'Support Email', identity.supportEmail || contact.supportEmail, 'identity.supportEmail', source);
  addField(contactFields, 'salesEmail', 'Sales Email', identity.salesEmail || contact.salesEmail, 'identity.salesEmail', source);
  addField(contactFields, 'bookingEmail', 'Booking Email', identity.bookingEmail || contact.bookingEmail, 'identity.bookingEmail', source);
  addField(contactFields, 'website', 'Website', identity.website || data.website, 'identity.website', source);

  if (contactFields.length > 0) {
    categories.push({
      id: 'contact',
      label: 'Contact Information',
      icon: Phone,
      color: 'bg-blue-500',
      fields: contactFields,
      expanded: true
    });
  }

  // ========================================
  // 3. LOCATION & HOURS
  // ========================================
  const locationFields: ImportedField[] = [];
  const address = identity.address || data.address;

  if (address && (address.street || address.city || address.line1)) {
    addField(locationFields, 'address', 'Address', address, 'identity.address', source);
  }

  const locations = identity.locations || data.locations;
  if (locations && locations.length > 0) {
    locations.forEach((loc: any, i: number) => {
      addField(locationFields, `location_${i}`, `Location: ${loc.name || `Branch ${i + 1}`}`, loc, `identity.locations.${i}`, source,
        `${loc.address || ''} ${loc.isHeadquarters ? '(HQ)' : ''}`);
    });
  }

  addField(locationFields, 'serviceAreas', 'Service Areas', identity.serviceAreas || data.serviceAreas, 'identity.serviceArea', source);
  addField(locationFields, 'deliveryZones', 'Delivery Zones', identity.deliveryZones || data.deliveryZones, 'identity.deliveryZones', source);
  addField(locationFields, 'internationalShipping', 'International Shipping', identity.internationalShipping || data.internationalShipping, 'identity.internationalShipping', source);

  const operatingHours = identity.operatingHours || data.operatingHours;
  if (operatingHours) {
    addField(locationFields, 'operatingHours', 'Operating Hours', operatingHours, 'identity.operatingHours', source);
  }

  if (locationFields.length > 0) {
    categories.push({
      id: 'location',
      label: 'Location & Hours',
      icon: MapPin,
      color: 'bg-emerald-500',
      fields: locationFields,
      expanded: false
    });
  }

  // ========================================
  // 4. SOCIAL MEDIA
  // ========================================
  const socialFields: ImportedField[] = [];
  const social = identity.socialMedia || data.socialMedia || {};

  addField(socialFields, 'instagram', 'Instagram', social.instagram, 'identity.socialMedia.instagram', source);
  addField(socialFields, 'facebook', 'Facebook', social.facebook, 'identity.socialMedia.facebook', source);
  addField(socialFields, 'linkedin', 'LinkedIn', social.linkedin, 'identity.socialMedia.linkedin', source);
  addField(socialFields, 'twitter', 'Twitter/X', social.twitter, 'identity.socialMedia.twitter', source);
  addField(socialFields, 'youtube', 'YouTube', social.youtube, 'identity.socialMedia.youtube', source);
  addField(socialFields, 'pinterest', 'Pinterest', social.pinterest, 'identity.socialMedia.pinterest', source);
  addField(socialFields, 'tiktok', 'TikTok', social.tiktok, 'identity.socialMedia.tiktok', source);
  addField(socialFields, 'googleBusiness', 'Google Business', social.googleBusiness, 'identity.socialMedia.googleBusiness', source);

  if (socialFields.length > 0) {
    categories.push({
      id: 'social',
      label: 'Social Media',
      icon: Share2,
      color: 'bg-pink-500',
      fields: socialFields,
      expanded: false
    });
  }

  // ========================================
  // 5. BRAND & VALUES
  // ========================================
  const brandFields: ImportedField[] = [];

  addField(brandFields, 'missionStatement', 'Mission Statement', personality.missionStatement || data.missionStatement, 'personality.missionStatement', source);
  addField(brandFields, 'visionStatement', 'Vision Statement', personality.visionStatement || data.visionStatement, 'personality.visionStatement', source);
  addField(brandFields, 'story', 'Brand Story', personality.story || data.story || data.founderStory, 'personality.story', source);
  addField(brandFields, 'brandValues', 'Brand Values', personality.brandValues || data.brandValues, 'personality.brandValues', source);
  addField(brandFields, 'uniqueSellingPoints', 'Unique Selling Points', personality.uniqueSellingPoints || data.uniqueSellingPoints || data.usps, 'personality.uniqueSellingPoints', source);

  const brandVoice = personality.brandVoice || data.brandVoice;
  if (brandVoice) {
    addField(brandFields, 'brandVoiceTone', 'Brand Tone', brandVoice.tone, 'personality.voiceTone', source);
    addField(brandFields, 'brandVoiceStyle', 'Communication Style', brandVoice.style, 'personality.communicationStyle', source);
  }

  if (brandFields.length > 0) {
    categories.push({
      id: 'brand',
      label: 'Brand & Values',
      icon: Heart,
      color: 'bg-rose-500',
      fields: brandFields,
      expanded: false
    });
  }

  // ========================================
  // 6. TARGET AUDIENCE & CUSTOMER INSIGHTS
  // ========================================
  const audienceFields: ImportedField[] = [];

  addField(audienceFields, 'targetAudience', 'Target Audience', customerProfile.targetAudience || data.targetAudience, 'customerProfile.targetAudience', source);
  addField(audienceFields, 'customerPainPoints', 'Customer Pain Points', customerProfile.customerPainPoints || data.customerPainPoints, 'customerProfile.customerPainPoints', source);

  // New customer insights fields
  const customerInsights = data.customerInsights || customerProfile;
  if (customerInsights) {
    addField(audienceFields, 'painPoints', 'Pain Points & Solutions', customerInsights.painPoints, 'customerProfile.painPoints', source);
    addField(audienceFields, 'targetAgeGroups', 'Target Age Groups', customerInsights.targetAgeGroups || customerInsights.ageGroup, 'customerProfile.ageGroup', source);
    addField(audienceFields, 'incomeSegments', 'Income Segments', customerInsights.incomeSegments || customerInsights.incomeSegment, 'customerProfile.incomeSegment', source);
    addField(audienceFields, 'valuePropositions', 'Value Propositions', customerInsights.valuePropositions, 'customerProfile.valuePropositions', source);
    addField(audienceFields, 'idealCustomerProfile', 'Ideal Customer Profile', customerInsights.idealCustomerProfile, 'customerProfile.idealCustomerProfile', source);
  }

  if (audienceFields.length > 0) {
    categories.push({
      id: 'audience',
      label: 'Target Audience & Insights',
      icon: Target,
      color: 'bg-orange-500',
      fields: audienceFields,
      expanded: false
    });
  }

  // ========================================
  // 6B. COMPETITIVE INTELLIGENCE
  // ========================================
  const competitiveFields: ImportedField[] = [];
  const competitiveIntel = data.competitiveIntel || customerProfile;

  if (competitiveIntel) {
    addField(competitiveFields, 'differentiators', 'Key Differentiators', competitiveIntel.differentiators, 'customerProfile.differentiators', source);
    addField(competitiveFields, 'objectionHandlers', 'Objection Handlers', competitiveIntel.objectionHandlers, 'customerProfile.objectionHandlers', source);
    addField(competitiveFields, 'competitiveAdvantages', 'Competitive Advantages', competitiveIntel.competitiveAdvantages, 'customerProfile.competitiveAdvantages', source);
    addField(competitiveFields, 'marketPosition', 'Market Position', competitiveIntel.marketPosition, 'customerProfile.marketPosition', source);
  }

  if (competitiveFields.length > 0) {
    categories.push({
      id: 'competitive',
      label: 'Competitive Intelligence',
      icon: Zap,
      color: 'bg-violet-500',
      fields: competitiveFields,
      expanded: false
    });
  }

  // ========================================
  // 6C. SUCCESS METRICS
  // ========================================
  const successFields: ImportedField[] = [];
  const successMetrics = data.successMetrics || knowledge;

  if (successMetrics) {
    addField(successFields, 'caseStudies', 'Case Studies', successMetrics.caseStudies, 'knowledge.caseStudies', source);
    addField(successFields, 'keyStats', 'Key Statistics', successMetrics.keyStats, 'knowledge.keyStats', source);
    addField(successFields, 'notableClients', 'Notable Clients', successMetrics.notableClients, 'industrySpecificData.notableClients', source);
  }

  if (successFields.length > 0) {
    categories.push({
      id: 'success',
      label: 'Success Metrics',
      icon: Award,
      color: 'bg-amber-500',
      fields: successFields,
      expanded: false
    });
  }

  // ========================================
  // 7. PRODUCTS & SERVICES
  // ========================================
  const productsOrServices = knowledge.productsOrServices || data.productsOrServices || [];
  if (productsOrServices.length > 0) {
    const productFields: ImportedField[] = [];

    productsOrServices.forEach((item: any, i: number) => {
      const priceStr = item.price ? ` - ${item.priceUnit || '$'}${item.price}` : '';
      addField(productFields, `product_${i}`,
        item.name || `Item ${i + 1}`,
        item,
        `knowledge.productsOrServices.${i}`,
        source,
        `${item.shortDescription || item.description || item.category || ''}${priceStr}`
      );
    });

    if (productFields.length > 0) {
      categories.push({
        id: 'products',
        label: `Products & Services (${productFields.length})`,
        icon: Package,
        color: 'bg-cyan-500',
        fields: productFields,
        expanded: false
      });
    }
  }

  // ========================================
  // 8. PACKAGES
  // ========================================
  const packages = knowledge.packages || data.packages || [];
  if (packages.length > 0) {
    const packageFields: ImportedField[] = [];

    packages.forEach((pkg: any, i: number) => {
      addField(packageFields, `package_${i}`,
        pkg.name || `Package ${i + 1}`,
        pkg,
        `knowledge.packages.${i}`,
        source,
        `${pkg.price ? `$${pkg.price}` : ''} ${pkg.duration || ''} - ${pkg.description || ''}`
      );
    });

    if (packageFields.length > 0) {
      categories.push({
        id: 'packages',
        label: `Packages (${packageFields.length})`,
        icon: Gift,
        color: 'bg-purple-500',
        fields: packageFields,
        expanded: false
      });
    }
  }

  // ========================================
  // 9. PRICING TIERS
  // ========================================
  const pricingTiers = knowledge.pricingTiers || data.pricingTiers || [];
  if (pricingTiers.length > 0) {
    const pricingFields: ImportedField[] = [];

    pricingTiers.forEach((tier: any, i: number) => {
      addField(pricingFields, `tier_${i}`,
        tier.name || `Tier ${i + 1}`,
        tier,
        `knowledge.pricingTiers.${i}`,
        source,
        `${tier.price ? `$${tier.price}` : ''} ${tier.period || ''} - ${(tier.features || []).slice(0, 2).join(', ')}`
      );
    });

    if (pricingFields.length > 0) {
      categories.push({
        id: 'pricing',
        label: `Pricing Tiers (${pricingFields.length})`,
        icon: DollarSign,
        color: 'bg-green-500',
        fields: pricingFields,
        expanded: false
      });
    }
  }

  // ========================================
  // 10. CURRENT OFFERS
  // ========================================
  const currentOffers = knowledge.currentOffers || data.currentOffers || [];
  if (currentOffers.length > 0) {
    const offerFields: ImportedField[] = [];

    currentOffers.forEach((offer: any, i: number) => {
      addField(offerFields, `offer_${i}`,
        offer.title || `Offer ${i + 1}`,
        offer,
        `knowledge.currentOffers.${i}`,
        source,
        `${offer.discount || ''} ${offer.code ? `Code: ${offer.code}` : ''}`
      );
    });

    if (offerFields.length > 0) {
      categories.push({
        id: 'offers',
        label: `Current Offers (${offerFields.length})`,
        icon: Tag,
        color: 'bg-red-500',
        fields: offerFields,
        expanded: false
      });
    }
  }

  // ========================================
  // 11. PAYMENT METHODS
  // ========================================
  const paymentFields: ImportedField[] = [];

  addField(paymentFields, 'paymentMethods', 'Payment Methods', knowledge.paymentMethods || data.paymentMethods, 'knowledge.acceptedPayments', source);
  addField(paymentFields, 'acceptedCards', 'Accepted Cards', knowledge.acceptedCards || data.acceptedCards, 'knowledge.acceptedCards', source);
  addField(paymentFields, 'emiAvailable', 'EMI Available', knowledge.emiAvailable || data.emiAvailable, 'knowledge.emiAvailable', source);
  addField(paymentFields, 'codAvailable', 'COD Available', knowledge.codAvailable || data.codAvailable, 'knowledge.codAvailable', source);

  if (paymentFields.length > 0) {
    categories.push({
      id: 'payments',
      label: 'Payment Options',
      icon: DollarSign,
      color: 'bg-lime-500',
      fields: paymentFields,
      expanded: false
    });
  }

  // ========================================
  // 12. FAQs
  // ========================================
  const faqs = knowledge.faqs || data.faqs || [];
  if (faqs.length > 0) {
    const faqFields: ImportedField[] = [];

    faqs.forEach((faq: any, i: number) => {
      addField(faqFields, `faq_${i}`,
        faq.question || `FAQ ${i + 1}`,
        faq,
        `knowledge.faqs.${i}`,
        source,
        faq.answer ? faq.answer.substring(0, 80) + '...' : ''
      );
    });

    if (faqFields.length > 0) {
      categories.push({
        id: 'faqs',
        label: `FAQs (${faqFields.length})`,
        icon: MessageSquare,
        color: 'bg-amber-500',
        fields: faqFields,
        expanded: false
      });
    }
  }

  // ========================================
  // 13. POLICIES
  // ========================================
  const policies = knowledge.policies || data.policies || {};
  const policyFields: ImportedField[] = [];

  addField(policyFields, 'returnPolicy', 'Return Policy', policies.returnPolicy, 'knowledge.policies.returnPolicy', source);
  addField(policyFields, 'returnWindow', 'Return Window', policies.returnWindow, 'knowledge.policies.returnWindow', source);
  addField(policyFields, 'refundPolicy', 'Refund Policy', policies.refundPolicy, 'knowledge.policies.refundPolicy', source);
  addField(policyFields, 'refundTimeline', 'Refund Timeline', policies.refundTimeline, 'knowledge.policies.refundTimeline', source);
  addField(policyFields, 'cancellationPolicy', 'Cancellation Policy', policies.cancellationPolicy, 'knowledge.policies.cancellationPolicy', source);
  addField(policyFields, 'cancellationFee', 'Cancellation Fee', policies.cancellationFee, 'knowledge.policies.cancellationFee', source);
  addField(policyFields, 'exchangePolicy', 'Exchange Policy', policies.exchangePolicy, 'knowledge.policies.exchangePolicy', source);
  addField(policyFields, 'warrantyPolicy', 'Warranty Policy', policies.warrantyPolicy, 'knowledge.policies.warrantyInfo', source);
  addField(policyFields, 'shippingPolicy', 'Shipping Policy', policies.shippingPolicy, 'knowledge.policies.shippingInfo', source);
  addField(policyFields, 'deliveryTimeline', 'Delivery Timeline', policies.deliveryTimeline, 'knowledge.policies.deliveryInfo', source);
  addField(policyFields, 'freeShippingThreshold', 'Free Shipping Min', policies.freeShippingThreshold, 'knowledge.policies.freeShippingThreshold', source);

  if (policyFields.length > 0) {
    categories.push({
      id: 'policies',
      label: `Policies (${policyFields.length})`,
      icon: FileText,
      color: 'bg-slate-500',
      fields: policyFields,
      expanded: false
    });
  }

  // ========================================
  // 14-19. INVENTORY ITEMS
  // ========================================
  const menuItems = inventory.menuItems || data.menuItems || [];
  if (menuItems.length > 0) {
    const menuFields: ImportedField[] = [];
    menuItems.forEach((item: any, i: number) => {
      const vegIndicator = item.isVeg === true ? '🟢' : item.isVeg === false ? '🔴' : '';
      addField(menuFields, `menu_${i}`,
        `${vegIndicator} ${item.name || `Item ${i + 1}`}`,
        item, `inventory.menuItems.${i}`, source,
        `${item.category || ''} ${item.price ? `- $${item.price}` : ''}`
      );
    });
    if (menuFields.length > 0) {
      categories.push({ id: 'menu', label: `Menu Items (${menuFields.length})`, icon: Utensils, color: 'bg-orange-600', fields: menuFields, expanded: false });
    }
  }

  const rooms = inventory.rooms || data.rooms || [];
  if (rooms.length > 0) {
    const roomFields: ImportedField[] = [];
    rooms.forEach((room: any, i: number) => {
      addField(roomFields, `room_${i}`, room.name || `Room ${i + 1}`, room, `inventory.rooms.${i}`, source,
        `${room.category || ''} ${room.price ? `- $${room.price}/${room.priceUnit || 'night'}` : ''}`
      );
    });
    if (roomFields.length > 0) {
      categories.push({ id: 'rooms', label: `Room Types (${roomFields.length})`, icon: Bed, color: 'bg-indigo-600', fields: roomFields, expanded: false });
    }
  }

  const products = inventory.products || data.products || [];
  if (products.length > 0) {
    const productFields: ImportedField[] = [];
    products.forEach((product: any, i: number) => {
      addField(productFields, `inv_product_${i}`, product.name || `Product ${i + 1}`, product, `inventory.products.${i}`, source,
        `${product.category || ''} ${product.price ? `$${product.price}` : ''}`
      );
    });
    if (productFields.length > 0) {
      categories.push({ id: 'retail-products', label: `Products (${productFields.length})`, icon: ShoppingBag, color: 'bg-teal-500', fields: productFields, expanded: false });
    }
  }

  const services = inventory.services || data.services || [];
  if (services.length > 0) {
    const serviceFields: ImportedField[] = [];
    services.forEach((service: any, i: number) => {
      addField(serviceFields, `inv_service_${i}`, service.name || `Service ${i + 1}`, service, `inventory.services.${i}`, source,
        `${service.category || ''} ${service.price ? `$${service.price}` : ''} ${service.duration || ''}`
      );
    });
    if (serviceFields.length > 0) {
      categories.push({ id: 'healthcare-services', label: `Services (${serviceFields.length})`, icon: Stethoscope, color: 'bg-red-600', fields: serviceFields, expanded: false });
    }
  }

  const properties = inventory.properties || data.properties || [];
  if (properties.length > 0) {
    const propertyFields: ImportedField[] = [];
    properties.forEach((property: any, i: number) => {
      addField(propertyFields, `property_${i}`, property.title || `Property ${i + 1}`, property, `inventory.properties.${i}`, source,
        `${property.type || ''} - ${property.location || ''}`
      );
    });
    if (propertyFields.length > 0) {
      categories.push({ id: 'properties', label: `Properties (${propertyFields.length})`, icon: Home, color: 'bg-violet-500', fields: propertyFields, expanded: false });
    }
  }

  const courses = inventory.courses || data.courses || [];
  if (courses.length > 0) {
    const courseFields: ImportedField[] = [];
    courses.forEach((course: any, i: number) => {
      addField(courseFields, `course_${i}`, course.name || `Course ${i + 1}`, course, `inventory.courses.${i}`, source,
        `${course.duration || ''} ${course.mode || ''} ${course.price ? `$${course.price}` : ''}`
      );
    });
    if (courseFields.length > 0) {
      categories.push({ id: 'courses', label: `Courses (${courseFields.length})`, icon: GraduationCap, color: 'bg-yellow-600', fields: courseFields, expanded: false });
    }
  }

  // ========================================
  // 20. TEAM MEMBERS
  // ========================================
  const team = data.team || [];
  if (team.length > 0) {
    const teamFields: ImportedField[] = [];
    team.forEach((member: any, i: number) => {
      addField(teamFields, `team_${i}`, member.name || `Team Member ${i + 1}`, member, `team.${i}`, source,
        `${member.role || member.designation || ''} ${member.department ? `- ${member.department}` : ''}`
      );
    });
    if (teamFields.length > 0) {
      categories.push({ id: 'team', label: `Team (${teamFields.length})`, icon: Users, color: 'bg-sky-500', fields: teamFields, expanded: false });
    }
  }

  // ========================================
  // 21. CASE STUDIES
  // ========================================
  const caseStudies = data.caseStudies || [];
  if (caseStudies.length > 0) {
    const caseFields: ImportedField[] = [];
    caseStudies.forEach((cs: any, i: number) => {
      addField(caseFields, `case_${i}`, cs.title || `Case Study ${i + 1}`, cs, `caseStudies.${i}`, source,
        `${cs.client || ''} - ${cs.industry || ''}`
      );
    });
    if (caseFields.length > 0) {
      categories.push({ id: 'case-studies', label: `Case Studies (${caseFields.length})`, icon: Briefcase, color: 'bg-neutral-600', fields: caseFields, expanded: false });
    }
  }

  // ========================================
  // 22. AWARDS & CREDENTIALS
  // ========================================
  const trustFields: ImportedField[] = [];

  const awards = data.awards || [];
  awards.forEach((award: any, i: number) => {
    addField(trustFields, `award_${i}`,
      typeof award === 'string' ? award : (award.name || `Award ${i + 1}`),
      award, `awards.${i}`, source,
      typeof award === 'object' ? `${award.year || ''} ${award.awardedBy || ''}` : ''
    );
  });

  const certifications = data.certifications || [];
  certifications.forEach((cert: any, i: number) => {
    addField(trustFields, `cert_${i}`,
      typeof cert === 'string' ? cert : (cert.name || `Certification ${i + 1}`),
      cert, `certifications.${i}`, source,
      typeof cert === 'object' ? `${cert.issuedBy || ''}` : ''
    );
  });

  addField(trustFields, 'accreditations', 'Accreditations', data.accreditations, 'accreditations', source);
  addField(trustFields, 'partnerships', 'Partnerships', data.partnerships, 'partnerships', source);
  addField(trustFields, 'clients', 'Notable Clients', data.clients, 'clients', source);
  addField(trustFields, 'featuredIn', 'Featured In', data.featuredIn, 'featuredIn', source);

  if (trustFields.length > 0) {
    categories.push({ id: 'trust', label: `Trust & Credentials (${trustFields.length})`, icon: Award, color: 'bg-yellow-500', fields: trustFields, expanded: false });
  }

  // ========================================
  // 23. INDUSTRY-SPECIFIC DATA
  // ========================================
  const industryData = data.industrySpecificData || {};
  const industryFields: ImportedField[] = [];

  addField(industryFields, 'cuisineTypes', 'Cuisine Types', industryData.cuisineTypes, 'industrySpecificData.cuisineTypes', source);
  addField(industryFields, 'dietaryOptions', 'Dietary Options', industryData.dietaryOptions, 'industrySpecificData.dietaryOptions', source);
  addField(industryFields, 'diningOptions', 'Dining Options', industryData.diningOptions, 'industrySpecificData.diningStyles', source);
  addField(industryFields, 'averageCost', 'Average Cost for Two', industryData.averageCost, 'industrySpecificData.averageCostForTwo', source);
  addField(industryFields, 'seatingCapacity', 'Seating Capacity', industryData.seatingCapacity, 'industrySpecificData.seatingCapacity', source);
  addField(industryFields, 'starRating', 'Star Rating', industryData.starRating, 'industrySpecificData.starRating', source);
  addField(industryFields, 'checkInTime', 'Check-in Time', industryData.checkInTime, 'industrySpecificData.checkIn', source);
  addField(industryFields, 'checkOutTime', 'Check-out Time', industryData.checkOutTime, 'industrySpecificData.checkOut', source);
  addField(industryFields, 'hotelAmenities', 'Hotel Amenities', industryData.hotelAmenities, 'industrySpecificData.amenities', source);
  addField(industryFields, 'medicalSpecializations', 'Medical Specializations', industryData.medicalSpecializations, 'industrySpecificData.specializations', source);
  addField(industryFields, 'insuranceAccepted', 'Insurance Accepted', industryData.insuranceAccepted, 'industrySpecificData.insurance', source);
  addField(industryFields, 'emergencyServices', 'Emergency Services', industryData.emergencyServices, 'industrySpecificData.emergency', source);
  addField(industryFields, 'founders', 'Founders', industryData.founders || data.founders, 'industrySpecificData.founders', source);
  addField(industryFields, 'teamSize', 'Team Size', industryData.teamSize || data.teamSize, 'industrySpecificData.teamSize', source);

  if (industryFields.length > 0) {
    categories.push({ id: 'industry-specific', label: `Industry Details (${industryFields.length})`, icon: Info, color: 'bg-gray-500', fields: industryFields, expanded: false });
  }

  return categories;
}

/**
 * Extract testimonials from imported data
 */
function extractTestimonials(data: any, source: 'google' | 'website'): TestimonialItem[] {
  const testimonials: TestimonialItem[] = [];
  const rawTestimonials = data?.testimonials || [];
  const reviews = data?.reviews || [];

  // Process testimonials
  rawTestimonials.forEach((t: any, i: number) => {
    if (t.quote || t.text) {
      const quote = t.quote || t.text;
      testimonials.push({
        id: `${source}_testimonial_${i}`,
        quote,
        author: t.author || t.name,
        role: t.role,
        location: t.location,
        rating: t.rating,
        date: t.date,
        platform: t.platform || source,
        verified: t.verified,
        productService: t.productService,
        source,
        sentiment: analyzeSentiment(quote),
        selected: true
      });
    }
  });

  // Process reviews (from Google)
  reviews.forEach((r: any, i: number) => {
    if (r.text) {
      // Safely parse date
      let reviewDate: string | undefined;
      try {
        if (r.time && typeof r.time === 'number' && r.time > 0) {
          const date = new Date(r.time * 1000);
          if (!isNaN(date.getTime())) {
            reviewDate = date.toISOString();
          }
        } else if (r.date && typeof r.date === 'string') {
          reviewDate = r.date;
        }
      } catch {
        reviewDate = undefined;
      }

      testimonials.push({
        id: `${source}_review_${i}`,
        quote: r.text,
        author: r.authorName || r.author,
        rating: r.rating,
        date: reviewDate,
        platform: 'Google',
        source,
        sentiment: analyzeSentiment(r.text),
        selected: true
      });
    }
  });

  return testimonials;
}

// ========================================
// MAIN PAGE COMPONENT
// ========================================

export default function ImportCenterPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Core state
  const [loading, setLoading] = useState(true);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [persona, setPersona] = useState<Partial<BusinessPersona>>({});

  // View state
  const [activeTab, setActiveTab] = useState<ViewTab>('import');

  // Import source state
  const [activeSource, setActiveSource] = useState<'google' | 'website' | null>(null);

  // Google import state
  const [googleSearch, setGoogleSearch] = useState('');
  const [googleResults, setGoogleResults] = useState<any[]>([]);
  const [googleSearching, setGoogleSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [isGoogleImporting, setIsGoogleImporting] = useState(false);
  const [googleImportedData, setGoogleImportedData] = useState<ImportedCategory[]>([]);
  const [googleRawData, setGoogleRawData] = useState<any>(null);

  // Website import state
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [websiteError, setWebsiteError] = useState<string | null>(null);
  const [isWebsiteImporting, setIsWebsiteImporting] = useState(false);
  const [websiteImportedData, setWebsiteImportedData] = useState<ImportedCategory[]>([]);
  const [websiteRawData, setWebsiteRawData] = useState<any>(null);

  // Merge state
  const [mergeFields, setMergeFields] = useState<MergeField[]>([]);
  const [mergeFilter, setMergeFilter] = useState<'all' | 'conflicts' | 'google' | 'website'>('all');

  // Testimonials state
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [expandedTestimonial, setExpandedTestimonial] = useState<string | null>(null);

  // Applying to profile
  const [isApplying, setIsApplying] = useState(false);

  // Editing state
  const [editingField, setEditingField] = useState<EditingField | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Get partnerId from user claims
  const userPartnerId = (user as any)?.customClaims?.partnerId;

  // Load business persona
  useEffect(() => {
    const loadPersona = async () => {
      if (!userPartnerId) {
        setLoading(false);
        return;
      }
      try {
        setPartnerId(userPartnerId);
        const result = await getBusinessPersonaAction(userPartnerId);
        if (result.success && result.persona) {
          setPersona(result.persona);

          // Load previously saved import data into state
          if (result.persona.importedData?.google) {
            const googleData = result.persona.importedData.google;
            setGoogleRawData(googleData.rawData);
            // Reconstruct categories with icons
            if (googleData.categories) {
              const categories: ImportedCategory[] = googleData.categories.map((cat: any) => ({
                id: cat.id,
                label: cat.label,
                icon: getCategoryIcon(cat.id),
                color: getCategoryColor(cat.id),
                fields: cat.fields || [],
                expanded: false
              }));
              setGoogleImportedData(categories);
            }
          }
          if (result.persona.importedData?.website) {
            const websiteData = result.persona.importedData.website;
            setWebsiteRawData(websiteData.rawData);
            // Reconstruct categories with icons
            if (websiteData.categories) {
              const categories: ImportedCategory[] = websiteData.categories.map((cat: any) => ({
                id: cat.id,
                label: cat.label,
                icon: getCategoryIcon(cat.id),
                color: getCategoryColor(cat.id),
                fields: cat.fields || [],
                expanded: false
              }));
              setWebsiteImportedData(categories);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load persona:', err);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    if (!authLoading) loadPersona();
  }, [userPartnerId, authLoading]);

  // Build merge fields when data changes
  useEffect(() => {
    if (googleRawData || websiteRawData) {
      buildMergeFields();
    }
  }, [googleRawData, websiteRawData]);

  // Build testimonials when data changes
  useEffect(() => {
    const allTestimonials: TestimonialItem[] = [];
    if (googleRawData) {
      allTestimonials.push(...extractTestimonials(googleRawData, 'google'));
    }
    if (websiteRawData) {
      allTestimonials.push(...extractTestimonials(websiteRawData, 'website'));
    }
    setTestimonials(allTestimonials);
  }, [googleRawData, websiteRawData]);

  // Build merge fields from both sources
  const buildMergeFields = () => {
    const fields: MergeField[] = [];
    const processedKeys = new Set<string>();

    const addMergeField = (key: string, label: string, path: string, googleVal: any, websiteVal: any, category: string) => {
      if (processedKeys.has(key)) return;
      if (googleVal === undefined && websiteVal === undefined) return;
      if (googleVal === null && websiteVal === null) return;
      if (googleVal === '' && websiteVal === '') return;

      processedKeys.add(key);
      fields.push({
        fieldKey: key,
        label,
        path,
        googleValue: googleVal,
        websiteValue: websiteVal,
        selectedSource: websiteVal !== undefined && websiteVal !== null && websiteVal !== '' ? 'website' :
          googleVal !== undefined && googleVal !== null && googleVal !== '' ? 'google' : 'none',
        category
      });
    };

    // Identity fields
    const gId = googleRawData?.identity || {};
    const wId = websiteRawData?.identity || {};

    addMergeField('businessName', 'Business Name', 'identity.name', gId.businessName || gId.name, wId.businessName || wId.name, 'Identity');
    addMergeField('tagline', 'Tagline', 'personality.tagline', googleRawData?.personality?.tagline, websiteRawData?.personality?.tagline, 'Identity');
    addMergeField('description', 'Description', 'personality.description', googleRawData?.personality?.description, websiteRawData?.personality?.description, 'Identity');
    addMergeField('phone', 'Phone', 'identity.phone', gId.phone, wId.phone, 'Contact');
    addMergeField('email', 'Email', 'identity.email', gId.email, wId.email, 'Contact');
    addMergeField('website', 'Website', 'identity.website', gId.website, wId.website, 'Contact');
    addMergeField('address', 'Address', 'identity.address', gId.address, wId.address, 'Location');
    addMergeField('operatingHours', 'Operating Hours', 'identity.operatingHours', gId.operatingHours, wId.operatingHours, 'Location');

    // Social media
    const gSocial = gId.socialMedia || {};
    const wSocial = wId.socialMedia || {};
    addMergeField('instagram', 'Instagram', 'identity.socialMedia.instagram', gSocial.instagram, wSocial.instagram, 'Social');
    addMergeField('facebook', 'Facebook', 'identity.socialMedia.facebook', gSocial.facebook, wSocial.facebook, 'Social');
    addMergeField('linkedin', 'LinkedIn', 'identity.socialMedia.linkedin', gSocial.linkedin, wSocial.linkedin, 'Social');
    addMergeField('twitter', 'Twitter', 'identity.socialMedia.twitter', gSocial.twitter, wSocial.twitter, 'Social');

    // Brand
    const gPers = googleRawData?.personality || {};
    const wPers = websiteRawData?.personality || {};
    addMergeField('missionStatement', 'Mission', 'personality.missionStatement', gPers.missionStatement, wPers.missionStatement, 'Brand');
    addMergeField('visionStatement', 'Vision', 'personality.visionStatement', gPers.visionStatement, wPers.visionStatement, 'Brand');
    addMergeField('story', 'Story', 'personality.story', gPers.story, wPers.story, 'Brand');
    addMergeField('brandValues', 'Values', 'personality.brandValues', gPers.brandValues, wPers.brandValues, 'Brand');
    addMergeField('uniqueSellingPoints', 'USPs', 'personality.uniqueSellingPoints', gPers.uniqueSellingPoints, wPers.uniqueSellingPoints, 'Brand');

    setMergeFields(fields);
  };

  // Google places search
  const debouncedSearch = useCallback(async (query: string) => {
    if (query.length < 3) {
      setGoogleResults([]);
      return;
    }

    setGoogleSearching(true);
    try {
      const result = await searchBusinessesAction(query);
      if (result.success && result.results) {
        setGoogleResults(result.results);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setGoogleSearching(false);
    }
  }, []);

  // Handle Google import - AUTO-SAVES to Firestore immediately
  const handleGoogleImport = async () => {
    if (!selectedPlace) {
      toast.error('Please select a business first');
      return;
    }
    if (!partnerId) {
      toast.error('Partner ID not found');
      return;
    }
    setIsGoogleImporting(true);
    try {
      const result = await autoFillProfileAction(selectedPlace.placeId);
      if (result.success && result.profile) {
        console.log('[ImportCenter] Google import data:', result.profile);
        setGoogleRawData(result.profile);
        const categories = extractImportedCategories(result.profile as any, 'google');
        setGoogleImportedData(categories);

        // AUTO-SAVE: Save imported data to Firestore immediately
        const importedDataUpdate = {
          importedData: {
            ...(persona.importedData || {}),
            google: {
              rawData: result.profile,
              categories: categories.map(c => ({
                id: c.id,
                label: c.label,
                fields: c.fields.map(f => ({
                  id: f.id,
                  label: f.label,
                  value: f.value,
                  displayValue: f.displayValue,
                  path: f.path,
                  source: f.source,
                  selected: f.selected
                }))
              })),
              importedAt: new Date().toISOString(),
              placeName: selectedPlace.name,
              placeId: selectedPlace.placeId
            }
          },
          importHistory: {
            ...persona.importHistory,
            google: {
              lastImportedAt: new Date(),
              placeId: selectedPlace.placeId,
              placeName: selectedPlace.name,
              fieldsImported: categories.flatMap(c => c.fields.map(f => f.path)),
              status: 'success' as const
            }
          }
        };

        await saveBusinessPersonaAction(partnerId, importedDataUpdate as any);
        setPersona(prev => ({ ...prev, ...importedDataUpdate }));
        toast.success(`Imported & saved ${categories.reduce((a, c) => a + c.fields.length, 0)} fields from Google!`);
      } else {
        toast.error(result.error || 'Failed to import from Google');
      }
    } catch (err: any) {
      toast.error(err.message || 'Import failed');
    } finally {
      setIsGoogleImporting(false);
    }
  };

  // Handle website import - AUTO-SAVES to Firestore immediately
  const handleWebsiteImport = async () => {
    if (!websiteUrl.trim()) {
      toast.error('Please enter a website URL');
      return;
    }
    if (!partnerId) {
      toast.error('Partner ID not found');
      return;
    }
    setIsWebsiteImporting(true);
    setWebsiteError(null);
    try {
      console.log('[ImportCenter] Starting website import for:', websiteUrl);
      const result = await scrapeWebsiteAction(websiteUrl, {
        includeSubpages: true,
        maxPages: 5,
      });

      if (!result.success || !result.profile) {
        setWebsiteError(result.error || 'Failed to import from website');
        toast.error(result.error || 'Failed to import from website');
        return;
      }

      console.log('[ImportCenter] Website import data:', result.profile);
      setWebsiteRawData(result.profile);
      const categories = extractImportedCategories(result.profile as any, 'website');
      setWebsiteImportedData(categories);

      // AUTO-SAVE: Save imported data to Firestore immediately
      const importedDataUpdate = {
        importedData: {
          ...(persona.importedData || {}),
          website: {
            rawData: result.profile,
            categories: categories.map(c => ({
              id: c.id,
              label: c.label,
              fields: c.fields.map(f => ({
                id: f.id,
                label: f.label,
                value: f.value,
                displayValue: f.displayValue,
                path: f.path,
                source: f.source,
                selected: f.selected
              }))
            })),
            importedAt: new Date().toISOString(),
            url: websiteUrl,
            pagesScraped: result.pagesScraped
          }
        },
        importHistory: {
          ...persona.importHistory,
          website: {
            lastImportedAt: new Date(),
            url: websiteUrl,
            pagesScraped: result.pagesScraped,
            fieldsImported: categories.flatMap(c => c.fields.map(f => f.path)),
            status: 'success' as const
          }
        }
      };

      await saveBusinessPersonaAction(partnerId, importedDataUpdate as any);
      setPersona(prev => ({ ...prev, ...importedDataUpdate }));
      toast.success(`Imported & saved ${categories.reduce((a, c) => a + c.fields.length, 0)} fields from ${result.pagesScraped?.length || 1} pages!`);
    } catch (err: any) {
      console.error('[ImportCenter] Website import error:', err);
      setWebsiteError(err.message || 'Failed to import from website');
      toast.error('Failed to import from website');
    } finally {
      setIsWebsiteImporting(false);
    }
  };

  // Toggle field selection
  const toggleFieldSelection = (sourceType: 'google' | 'website', categoryId: string, fieldId: string) => {
    const setData = sourceType === 'google' ? setGoogleImportedData : setWebsiteImportedData;
    setData(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          fields: cat.fields.map(f => f.id === fieldId ? { ...f, selected: !f.selected } : f)
        };
      }
      return cat;
    }));
  };

  // Toggle category expansion
  const toggleCategoryExpansion = (sourceType: 'google' | 'website', categoryId: string) => {
    const setData = sourceType === 'google' ? setGoogleImportedData : setWebsiteImportedData;
    setData(prev => prev.map(cat =>
      cat.id === categoryId ? { ...cat, expanded: !cat.expanded } : cat
    ));
  };

  // Select all in category
  const selectAllInCategory = (sourceType: 'google' | 'website', categoryId: string, selected: boolean) => {
    const setData = sourceType === 'google' ? setGoogleImportedData : setWebsiteImportedData;
    setData(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        return { ...cat, fields: cat.fields.map(f => ({ ...f, selected })) };
      }
      return cat;
    }));
  };

  // Clear import data
  const clearImportData = (sourceType: 'google' | 'website') => {
    if (sourceType === 'google') {
      setGoogleImportedData([]);
      setGoogleRawData(null);
      setGoogleSearch('');
      setSelectedPlace(null);
      setGoogleResults([]);
    } else {
      setWebsiteImportedData([]);
      setWebsiteRawData(null);
      setWebsiteUrl('');
      setWebsiteError(null);
    }
    toast.success(`${sourceType === 'google' ? 'Google' : 'Website'} import cleared`);
  };

  // Toggle merge field source
  const toggleMergeSource = (fieldKey: string, source: 'google' | 'website' | 'none') => {
    setMergeFields(prev => prev.map(f =>
      f.fieldKey === fieldKey ? { ...f, selectedSource: source } : f
    ));
  };

  // Toggle testimonial selection
  const toggleTestimonialSelection = (id: string) => {
    setTestimonials(prev => prev.map(t =>
      t.id === id ? { ...t, selected: !t.selected } : t
    ));
  };

  // Apply from Import tab
  const applyFromImport = async () => {
    if (!partnerId) {
      toast.error('No partner ID found');
      return;
    }

    const allSelectedFields: ImportedField[] = [
      ...googleImportedData.flatMap(c => c.fields.filter(f => f.selected)),
      ...websiteImportedData.flatMap(c => c.fields.filter(f => f.selected))
    ];

    if (allSelectedFields.length === 0) {
      toast.error('Please select at least one field to apply');
      return;
    }

    setIsApplying(true);
    try {
      const updatedPersona: any = JSON.parse(JSON.stringify(persona));

      allSelectedFields.forEach(field => {
        const pathParts = field.path.split('.');
        let current: any = updatedPersona;

        for (let i = 0; i < pathParts.length - 1; i++) {
          const part = pathParts[i];
          const nextPart = pathParts[i + 1];
          const isNextIndex = !isNaN(parseInt(nextPart));

          if (!current[part]) {
            current[part] = isNextIndex ? [] : {};
          }
          current = current[part];
        }

        const lastPart = pathParts[pathParts.length - 1];
        current[lastPart] = field.value;
      });

      updatedPersona.importHistory = {
        ...updatedPersona.importHistory,
        ...(googleImportedData.length > 0 && {
          google: { lastImportedAt: new Date(), placeId: selectedPlace?.placeId, placeName: selectedPlace?.mainText, status: 'success' as const }
        }),
        ...(websiteImportedData.length > 0 && {
          website: { lastImportedAt: new Date(), url: websiteUrl, status: 'success' as const }
        })
      };

      await saveBusinessPersonaAction(partnerId, updatedPersona);
      setPersona(updatedPersona);

      toast.success(`${allSelectedFields.length} fields applied to profile!`);
      router.push('/partner/settings');
    } catch (err: any) {
      toast.error(err.message || 'Failed to apply data');
    } finally {
      setIsApplying(false);
    }
  };

  // Apply from Merge tab
  const applyFromMerge = async () => {
    if (!partnerId) {
      toast.error('No partner ID found');
      return;
    }

    const selectedMergeFields = mergeFields.filter(f => f.selectedSource !== 'none');
    const selectedTestimonialItems = testimonials.filter(t => t.selected);

    if (selectedMergeFields.length === 0 && selectedTestimonialItems.length === 0) {
      toast.error('Please select at least one field to apply');
      return;
    }

    setIsApplying(true);
    try {
      const updatedPersona: any = JSON.parse(JSON.stringify(persona));

      selectedMergeFields.forEach(field => {
        const value = field.selectedSource === 'google' ? field.googleValue : field.websiteValue;
        if (value === undefined || value === null) return;

        const pathParts = field.path.split('.');
        let current: any = updatedPersona;

        for (let i = 0; i < pathParts.length - 1; i++) {
          const part = pathParts[i];
          if (!current[part]) {
            current[part] = {};
          }
          current = current[part];
        }

        const lastPart = pathParts[pathParts.length - 1];
        current[lastPart] = value;
      });

      // Add selected testimonials
      if (selectedTestimonialItems.length > 0) {
        updatedPersona.testimonials = selectedTestimonialItems.map(t => ({
          quote: t.quote,
          author: t.author,
          role: t.role,
          rating: t.rating,
          platform: t.platform,
          date: t.date,
          source: t.source
        }));
      }

      updatedPersona.importHistory = {
        ...updatedPersona.importHistory,
        merged: { lastMergedAt: new Date(), fieldsCount: selectedMergeFields.length, testimonialsCount: selectedTestimonialItems.length }
      };

      await saveBusinessPersonaAction(partnerId, updatedPersona);
      setPersona(updatedPersona);

      toast.success(`Merged ${selectedMergeFields.length} fields and ${selectedTestimonialItems.length} testimonials!`);
      router.push('/partner/settings');
    } catch (err: any) {
      toast.error(err.message || 'Failed to apply merged data');
    } finally {
      setIsApplying(false);
    }
  };

  // Counts
  const totalSelectedCount = useMemo(() => {
    return [
      ...googleImportedData.flatMap(c => c.fields),
      ...websiteImportedData.flatMap(c => c.fields)
    ].filter(f => f.selected).length;
  }, [googleImportedData, websiteImportedData]);

  const totalFieldCount = useMemo(() => {
    return [
      ...googleImportedData.flatMap(c => c.fields),
      ...websiteImportedData.flatMap(c => c.fields)
    ].length;
  }, [googleImportedData, websiteImportedData]);

  const mergeSelectedCount = useMemo(() => {
    return mergeFields.filter(f => f.selectedSource !== 'none').length + testimonials.filter(t => t.selected).length;
  }, [mergeFields, testimonials]);

  const conflictsCount = useMemo(() => {
    return mergeFields.filter(f => f.googleValue && f.websiteValue && f.googleValue !== f.websiteValue).length;
  }, [mergeFields]);

  // Testimonials insights
  const testimonialInsights = useMemo(() => {
    const total = testimonials.length;
    const withRating = testimonials.filter(t => t.rating);
    const avgRating = withRating.length > 0
      ? withRating.reduce((sum, t) => sum + (t.rating || 0), 0) / withRating.length
      : 0;
    const positive = testimonials.filter(t => t.sentiment === 'positive').length;
    const neutral = testimonials.filter(t => t.sentiment === 'neutral').length;
    const negative = testimonials.filter(t => t.sentiment === 'negative').length;
    const fromGoogle = testimonials.filter(t => t.source === 'google').length;
    const fromWebsite = testimonials.filter(t => t.source === 'website').length;
    const verified = testimonials.filter(t => t.verified).length;

    return { total, avgRating, positive, neutral, negative, fromGoogle, fromWebsite, verified };
  }, [testimonials]);

  const filteredMergeFields = useMemo(() => {
    switch (mergeFilter) {
      case 'conflicts':
        return mergeFields.filter(f => f.googleValue && f.websiteValue && f.googleValue !== f.websiteValue);
      case 'google':
        return mergeFields.filter(f => f.googleValue);
      case 'website':
        return mergeFields.filter(f => f.websiteValue);
      default:
        return mergeFields;
    }
  }, [mergeFields, mergeFilter]);

  // Extract and MERGE saved import data from persona.importedData (both sources combined)
  const savedDataCategories = useMemo((): ImportedCategory[] => {
    const categories: ImportedCategory[] = [];
    const categoryMap = new Map<string, ImportedCategory>();

    // Helper to add fields from a source
    const addFieldsFromSource = (sourceData?: { categories?: Array<any> }) => {
      if (!sourceData?.categories) return;
      sourceData.categories.forEach((cat: any) => {
        if (!categoryMap.has(cat.id)) {
          categoryMap.set(cat.id, {
            id: cat.id,
            label: cat.label,
            icon: getCategoryIcon(cat.id),
            color: getCategoryColor(cat.id),
            fields: [],
            expanded: false
          });
        }
        const category = categoryMap.get(cat.id)!;
        cat.fields?.forEach((field: any) => {
          // Check if field already exists (merge - prefer first occurrence)
          const existingIndex = category.fields.findIndex(f => f.path === field.path);
          if (existingIndex === -1) {
            category.fields.push({
              id: field.id,
              label: field.label,
              value: field.value,
              displayValue: field.displayValue,
              path: field.path,
              source: field.source,
              selected: field.selected ?? true
            });
          }
        });
      });
    };

    // Merge Google and Website imports
    addFieldsFromSource(persona.importedData?.google);
    addFieldsFromSource(persona.importedData?.website);

    categoryMap.forEach(cat => {
      if (cat.fields.length > 0) {
        categories.push(cat);
      }
    });

    return categories;
  }, [persona.importedData]);

  const savedDataFieldCount = useMemo(() => {
    return savedDataCategories.reduce((sum, cat) => sum + cat.fields.length, 0);
  }, [savedDataCategories]);

  // Clear all imported data
  const handleClearImports = async () => {
    if (!partnerId) return;
    if (!confirm('Are you sure you want to clear all imported data? This cannot be undone.')) return;

    setLoading(true);
    try {
      await saveBusinessPersonaAction(partnerId, {
        importedData: undefined
      } as any);
      setPersona(prev => ({ ...prev, importedData: undefined }));
      setGoogleImportedData([]);
      setWebsiteImportedData([]);
      setGoogleRawData(null);
      setWebsiteRawData(null);
      toast.success('Import data cleared');
    } catch (err: any) {
      toast.error(err.message || 'Failed to clear import data');
    } finally {
      setLoading(false);
    }
  };

  // Apply saved import data to the main profile using AI-powered transformation
  const handleApplyToProfile = async () => {
    if (!partnerId || savedDataCategories.length === 0) return;

    setIsApplying(true);
    try {
      // Collect all import data from persona.importedData
      const importedData = (persona?.importedData || {}) as any;
      const googleData = (importedData.google || {}) as any;
      const websiteData = (importedData.website || {}) as any;

      // Merge Google and Website data (Google takes priority)
      const mergedImportData = {
        // Identity fields
        identity: {
          ...(websiteData.identity || {}),
          ...(googleData.identity || {}),
        },
        // Personality fields
        personality: {
          ...(websiteData.personality || {}),
          ...(googleData.personality || {}),
        },
        // Knowledge fields
        knowledge: {
          ...(websiteData.knowledge || {}),
          ...(googleData.knowledge || {}),
        },
        // Customer profile
        customerProfile: {
          ...(websiteData.customerProfile || {}),
          ...(googleData.customerProfile || {}),
        },
        // Industry specific data
        industrySpecificData: {
          ...(websiteData.industrySpecificData || {}),
          ...(googleData.industrySpecificData || {}),
        },
        // Top-level fields
        services: googleData.services || websiteData.services,
        products: googleData.products || websiteData.products,
        faqs: googleData.faqs || googleData.knowledge?.faqs || websiteData.faqs,
        targetAudience: googleData.targetAudience || websiteData.targetAudience,
        uniqueSellingPoints: googleData.uniqueSellingPoints || websiteData.uniqueSellingPoints,
        paymentMethods: googleData.paymentMethods || googleData.knowledge?.paymentMethods || websiteData.paymentMethods,
        operatingHours: googleData.operatingHours || googleData.identity?.operatingHours,
        socialMedia: googleData.socialMedia || googleData.identity?.socialMedia,
      };

      // Use the AI-powered transformation action
      const transformResult = await applyImportToProfileAction(mergedImportData, persona);

      if (!transformResult.success || !transformResult.profile) {
        toast.error(transformResult.error || 'Failed to process import data');
        return;
      }

      // Also include manually selected fields from UI
      const manualUpdates: any = {};
      savedDataCategories.forEach(category => {
        category.fields.forEach(field => {
          if (field.selected) {
            const pathParts = field.path.split('.');
            let current = manualUpdates;
            for (let i = 0; i < pathParts.length - 1; i++) {
              if (!current[pathParts[i]]) {
                current[pathParts[i]] = {};
              }
              current = current[pathParts[i]];
            }
            current[pathParts[pathParts.length - 1]] = field.value;
          }
        });
      });

      // Merge AI-transformed data with manual selections
      const finalUpdates = {
        ...transformResult.profile,
        ...manualUpdates,
        // Deep merge identity
        identity: {
          ...transformResult.profile.identity,
          ...(manualUpdates.identity || {}),
        },
        // Deep merge personality
        personality: {
          ...transformResult.profile.personality,
          ...(manualUpdates.personality || {}),
        },
        // Deep merge knowledge
        knowledge: {
          ...transformResult.profile.knowledge,
          ...(manualUpdates.knowledge || {}),
        },
      };

      // Save to main profile
      const result = await saveBusinessPersonaAction(partnerId, finalUpdates);

      if (result.success) {
        const fieldsCount = transformResult.fieldsUpdated?.length || 0;
        toast.success(`Applied ${fieldsCount} fields to profile successfully!`);
        router.push('/partner/settings');
      } else {
        toast.error(result.message || 'Failed to apply');
      }
    } catch (err: any) {
      console.error('[ApplyToProfile] Error:', err);
      toast.error(err.message || 'Failed to apply to profile');
    } finally {
      setIsApplying(false);
    }
  };

  // Handle editing a field
  const handleEditField = (field: ImportedField, categoryId: string) => {
    setEditingField({
      field,
      categoryId,
      newValue: field.value,
    });
  };

  // Handle saving an edited field
  const handleSaveFieldEdit = async () => {
    if (!editingField || !partnerId) return;

    setIsSavingEdit(true);
    try {
      // Build the update object using the field path
      const pathParts = editingField.field.path.split('.');
      const updateObj: any = {};
      let current = updateObj;

      for (let i = 0; i < pathParts.length - 1; i++) {
        current[pathParts[i]] = {};
        current = current[pathParts[i]];
      }
      current[pathParts[pathParts.length - 1]] = editingField.newValue;

      // Save to Firestore
      const result = await saveBusinessPersonaAction(partnerId, updateObj);

      if (result.success) {
        // Update local persona state
        const updatedPersona = JSON.parse(JSON.stringify(persona));
        let personaCurrent: any = updatedPersona;
        for (let i = 0; i < pathParts.length - 1; i++) {
          if (!personaCurrent[pathParts[i]]) {
            personaCurrent[pathParts[i]] = {};
          }
          personaCurrent = personaCurrent[pathParts[i]];
        }
        personaCurrent[pathParts[pathParts.length - 1]] = editingField.newValue;
        setPersona(updatedPersona);

        toast.success('Field updated successfully!');
        setEditingField(null);
      } else {
        toast.error(result.message || 'Failed to save');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save edit');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Refresh saved data from Firestore
  const handleRefreshSavedData = async () => {
    if (!partnerId) return;
    setLoading(true);
    try {
      const result = await getBusinessPersonaAction(partnerId);
      if (result.success && result.persona) {
        setPersona(result.persona);
        toast.success('Data refreshed from Firestore');
      }
    } catch (err) {
      toast.error('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const hasImportedData = googleImportedData.length > 0 || websiteImportedData.length > 0;

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/partner/settings')}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-slate-900">Import Center</h1>
                <p className="text-xs text-slate-500">Import, merge, and apply data to your profile</p>
              </div>
            </div>

            {/* Apply Button based on active tab */}
            {activeTab === 'import' && totalFieldCount > 0 && (
              <button
                onClick={applyFromImport}
                disabled={isApplying || totalSelectedCount === 0}
                className={cn(
                  "px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all",
                  totalSelectedCount > 0
                    ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                )}
              >
                {isApplying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Apply {totalSelectedCount > 0 ? `(${totalSelectedCount})` : ''} to Profile
              </button>
            )}

            {activeTab === 'merge' && mergeFields.length > 0 && (
              <button
                onClick={applyFromMerge}
                disabled={isApplying || mergeSelectedCount === 0}
                className={cn(
                  "px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all",
                  mergeSelectedCount > 0
                    ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                )}
              >
                {isApplying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Merge className="w-4 h-4" />}
                Apply Merged ({mergeSelectedCount})
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 -mb-px">
            <button
              onClick={() => setActiveTab('import')}
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                activeTab === 'import'
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              <Database className="w-4 h-4" />
              Import
              {totalFieldCount > 0 && (
                <span className="text-xs bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">
                  {totalFieldCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('merge')}
              disabled={!hasImportedData}
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                activeTab === 'merge'
                  ? "border-emerald-600 text-emerald-600"
                  : hasImportedData
                    ? "border-transparent text-slate-500 hover:text-slate-700"
                    : "border-transparent text-slate-300 cursor-not-allowed"
              )}
            >
              <Merge className="w-4 h-4" />
              Merge
              {conflictsCount > 0 && (
                <span className="text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full">
                  {conflictsCount} conflicts
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('testimonials')}
              disabled={testimonials.length === 0}
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                activeTab === 'testimonials'
                  ? "border-amber-600 text-amber-600"
                  : testimonials.length > 0
                    ? "border-transparent text-slate-500 hover:text-slate-700"
                    : "border-transparent text-slate-300 cursor-not-allowed"
              )}>
              <Star className="w-4 h-4" />
              Testimonials
              {testimonials.length > 0 && (
                <span className="text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full">
                  {testimonials.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                activeTab === 'saved'
                  ? "border-teal-600 text-teal-600"
                  : savedDataFieldCount > 0
                    ? "border-transparent text-slate-500 hover:text-slate-700"
                    : "border-transparent text-slate-300 cursor-not-allowed"
              )}
              disabled={savedDataFieldCount === 0}
            >
              <Database className="w-4 h-4" />
              Saved Data
              {savedDataFieldCount > 0 && (
                <span className="text-xs bg-teal-100 text-teal-600 px-1.5 py-0.5 rounded-full">
                  {savedDataFieldCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* ========================================
            IMPORT TAB
        ======================================== */}
        {activeTab === 'import' && (
          <div className="space-y-6">
            {/* Import Source Cards */}
            <div className="grid grid-cols-2 gap-4">
              {/* Google Import Card */}
              <button
                onClick={() => setActiveSource(activeSource === 'google' ? null : 'google')}
                className={cn(
                  "p-5 rounded-xl border-2 text-left transition-all",
                  activeSource === 'google'
                    ? "border-blue-400 bg-blue-50 ring-2 ring-blue-200"
                    : googleImportedData.length > 0
                      ? "border-blue-200 bg-blue-50/50 hover:bg-blue-50"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Search className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">Google Business</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {googleImportedData.length > 0
                        ? `${googleImportedData.reduce((a, c) => a + c.fields.length, 0)} fields imported`
                        : 'Search & import from Google'}
                    </p>
                    {googleImportedData.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs text-emerald-600 font-medium">Ready</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>

              {/* Website Import Card */}
              <button
                onClick={() => setActiveSource(activeSource === 'website' ? null : 'website')}
                className={cn(
                  "p-5 rounded-xl border-2 text-left transition-all",
                  activeSource === 'website'
                    ? "border-purple-400 bg-purple-50 ring-2 ring-purple-200"
                    : websiteImportedData.length > 0
                      ? "border-purple-200 bg-purple-50/50 hover:bg-purple-50"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Globe className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">Website Import</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {websiteImportedData.length > 0
                        ? `${websiteImportedData.reduce((a, c) => a + c.fields.length, 0)} fields imported`
                        : 'Scrape your website'}
                    </p>
                    {websiteImportedData.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs text-emerald-600 font-medium">Ready</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            </div>

            {/* Active Import Panel */}
            {activeSource && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                {activeSource === 'google' ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                        <Search className="w-5 h-5 text-blue-600" />
                        Search Google Business
                      </h3>
                      {googleImportedData.length > 0 && (
                        <button onClick={() => clearImportData('google')} className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1">
                          <Trash2 className="w-4 h-4" /> Clear
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 relative">
                        {selectedPlace ? (
                          <div className="flex items-center justify-between px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div>
                              <div className="font-medium text-blue-900">{selectedPlace.mainText}</div>
                              <div className="text-sm text-blue-600">{selectedPlace.secondaryText}</div>
                            </div>
                            <button onClick={() => { setSelectedPlace(null); setGoogleSearch(''); }} className="p-1 hover:bg-blue-100 rounded">
                              <X className="w-4 h-4 text-blue-500" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <input
                              type="text"
                              value={googleSearch}
                              onChange={e => {
                                setGoogleSearch(e.target.value);
                                if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                                searchTimeoutRef.current = setTimeout(() => debouncedSearch(e.target.value), 300);
                              }}
                              placeholder="Search your business on Google..."
                              className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                            />
                            {googleSearching && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                              </div>
                            )}
                            {googleResults.length > 0 && (
                              <div className="absolute z-20 top-14 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                                {googleResults.map(r => (
                                  <button
                                    key={r.placeId}
                                    onClick={() => { setSelectedPlace(r); setGoogleSearch(r.mainText); setGoogleResults([]); }}
                                    className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                                  >
                                    <div className="font-medium text-slate-900">{r.mainText}</div>
                                    <div className="text-xs text-slate-500">{r.secondaryText}</div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      <button
                        onClick={handleGoogleImport}
                        disabled={isGoogleImporting || !selectedPlace}
                        className={cn(
                          "px-6 py-3 rounded-lg text-sm font-medium flex items-center gap-2",
                          selectedPlace ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-slate-100 text-slate-400 cursor-not-allowed"
                        )}
                      >
                        {isGoogleImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        Import
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-purple-600" />
                        Import from Website
                      </h3>
                      {websiteImportedData.length > 0 && (
                        <button onClick={() => clearImportData('website')} className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1">
                          <Trash2 className="w-4 h-4" /> Clear
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1 relative">
                        <input
                          type="url"
                          value={websiteUrl}
                          onChange={e => { setWebsiteUrl(e.target.value); setWebsiteError(null); }}
                          placeholder="Enter your website URL (e.g., www.yourbusiness.com)"
                          className={cn(
                            "w-full px-4 py-3 rounded-lg bg-slate-50 border text-sm focus:outline-none focus:ring-2 focus:ring-purple-300",
                            websiteError ? "border-red-300" : "border-slate-200"
                          )}
                        />
                        {websiteUrl && (
                          <a href={websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`} target="_blank" rel="noopener noreferrer" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-600">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                      <button
                        onClick={handleWebsiteImport}
                        disabled={isWebsiteImporting || !websiteUrl.trim()}
                        className={cn(
                          "px-6 py-3 rounded-lg text-sm font-medium flex items-center gap-2",
                          websiteUrl.trim() ? "bg-purple-600 text-white hover:bg-purple-700" : "bg-slate-100 text-slate-400 cursor-not-allowed"
                        )}
                      >
                        {isWebsiteImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                        Import
                      </button>
                    </div>

                    {websiteError && (
                      <div className="px-4 py-2 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{websiteError}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Imported Data Sections */}
            {hasImportedData && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900">Imported Data</h2>
                  <p className="text-sm text-slate-500">{totalSelectedCount} of {totalFieldCount} fields selected</p>
                </div>

                {/* Google Imported Data */}
                {googleImportedData.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-5 py-4 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Search className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-blue-900">From Google Business</span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{googleImportedData.length} categories</span>
                      </div>
                      <span className="text-sm text-blue-600">{googleImportedData.flatMap(c => c.fields).filter(f => f.selected).length} selected</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {googleImportedData.map(category => (
                        <CategorySection
                          key={category.id}
                          category={category}
                          sourceType="google"
                          onToggleExpand={() => toggleCategoryExpansion('google', category.id)}
                          onToggleField={(fieldId) => toggleFieldSelection('google', category.id, fieldId)}
                          onSelectAll={(selected) => selectAllInCategory('google', category.id, selected)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Website Imported Data */}
                {websiteImportedData.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="px-5 py-4 bg-purple-50 border-b border-purple-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-purple-600" />
                        <span className="font-semibold text-purple-900">From Website</span>
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{websiteImportedData.length} categories</span>
                      </div>
                      <span className="text-sm text-purple-600">{websiteImportedData.flatMap(c => c.fields).filter(f => f.selected).length} selected</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {websiteImportedData.map(category => (
                        <CategorySection
                          key={category.id}
                          category={category}
                          sourceType="website"
                          onToggleExpand={() => toggleCategoryExpansion('website', category.id)}
                          onToggleField={(fieldId) => toggleFieldSelection('website', category.id, fieldId)}
                          onSelectAll={(selected) => selectAllInCategory('website', category.id, selected)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            {!hasImportedData && !activeSource && (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Database className="w-8 h-8 text-indigo-500" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Start importing data</h3>
                <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
                  Select a source above to import your business data. Import from both sources to use the Merge feature.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ========================================
            MERGE TAB
        ======================================== */}
        {activeTab === 'merge' && (
          <div className="space-y-6">
            {/* Merge Header */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Merge className="w-5 h-5 text-emerald-600" />
                    Merge Data Sources
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Compare and choose the best data from each source
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">{mergeSelectedCount} fields selected</span>
                </div>
              </div>

              {/* Filter buttons */}
              <div className="flex gap-2">
                {[
                  { key: 'all', label: 'All Fields', count: mergeFields.length },
                  { key: 'conflicts', label: 'Conflicts', count: conflictsCount },
                  { key: 'google', label: 'Google Only', count: mergeFields.filter(f => f.googleValue && !f.websiteValue).length },
                  { key: 'website', label: 'Website Only', count: mergeFields.filter(f => f.websiteValue && !f.googleValue).length },
                ].map(filter => (
                  <button
                    key={filter.key}
                    onClick={() => setMergeFilter(filter.key as any)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5",
                      mergeFilter === filter.key
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    {filter.label}
                    <span className="text-xs opacity-60">({filter.count})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Merge Fields */}
            {filteredMergeFields.length > 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="divide-y divide-slate-100">
                  {filteredMergeFields.map(field => (
                    <MergeFieldRow
                      key={field.fieldKey}
                      field={field}
                      onToggleSource={toggleMergeSource}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Filter className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">No fields match this filter</h3>
                <p className="text-sm text-slate-500">Try selecting a different filter above</p>
              </div>
            )}
          </div>
        )}

        {/* ========================================
            TESTIMONIALS TAB
        ======================================== */}
        {activeTab === 'testimonials' && (
          <div className="space-y-6">
            {/* Testimonials Insights */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Star className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-900">
                      {testimonialInsights.avgRating.toFixed(1)}
                    </div>
                    <div className="text-xs text-slate-500">Avg Rating</div>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star
                      key={i}
                      className={cn(
                        "w-4 h-4",
                        i <= Math.round(testimonialInsights.avgRating)
                          ? "text-amber-400 fill-amber-400"
                          : "text-slate-200"
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="text-2xl font-bold text-slate-900 mb-1">{testimonialInsights.total}</div>
                <div className="text-sm text-slate-500 mb-3">Total Reviews</div>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1 text-xs">
                    <Search className="w-3 h-3 text-blue-500" />
                    <span className="text-slate-600">{testimonialInsights.fromGoogle}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <Globe className="w-3 h-3 text-purple-500" />
                    <span className="text-slate-600">{testimonialInsights.fromWebsite}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="text-sm font-medium text-slate-900 mb-3">Sentiment</div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ThumbsUp className="w-4 h-4 text-emerald-500" />
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${(testimonialInsights.positive / testimonialInsights.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-600 w-8">{testimonialInsights.positive}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Minus className="w-4 h-4 text-slate-400" />
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-400 rounded-full"
                        style={{ width: `${(testimonialInsights.neutral / testimonialInsights.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-600 w-8">{testimonialInsights.neutral}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ThumbsDown className="w-4 h-4 text-red-500" />
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 rounded-full"
                        style={{ width: `${(testimonialInsights.negative / testimonialInsights.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-600 w-8">{testimonialInsights.negative}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="text-sm font-medium text-slate-900 mb-3">Selection</div>
                <div className="text-2xl font-bold text-indigo-600 mb-1">
                  {testimonials.filter(t => t.selected).length}
                </div>
                <div className="text-xs text-slate-500">of {testimonials.length} selected</div>
                <button
                  onClick={() => setTestimonials(prev => prev.map(t => ({ ...t, selected: true })))}
                  className="mt-2 text-xs text-indigo-600 hover:text-indigo-700"
                >
                  Select all
                </button>
              </div>
            </div>

            {/* Testimonials List */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Quote className="w-5 h-5 text-amber-600" />
                  <span className="font-semibold text-amber-900">Customer Testimonials</span>
                </div>
                <span className="text-sm text-amber-600">
                  {testimonials.filter(t => t.selected).length} selected for profile
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {testimonials.map(testimonial => (
                  <TestimonialRow
                    key={testimonial.id}
                    testimonial={testimonial}
                    expanded={expandedTestimonial === testimonial.id}
                    onToggleExpand={() => setExpandedTestimonial(
                      expandedTestimonial === testimonial.id ? null : testimonial.id
                    )}
                    onToggleSelect={() => toggleTestimonialSelection(testimonial.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================
            SAVED DATA TAB
        ======================================== */}
        {activeTab === 'saved' && (
          <div className="space-y-6">
            {/* Saved Data Header */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Database className="w-5 h-5 text-teal-600" />
                    Merged Import Data
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Combined data from all imports. Review and apply to your profile.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRefreshSavedData}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 bg-slate-100 text-slate-600 hover:bg-slate-200"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Refresh
                  </button>
                  {savedDataCategories.length > 0 && (
                    <button
                      onClick={handleClearImports}
                      disabled={loading}
                      className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 bg-red-50 text-red-600 hover:bg-red-100"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear All
                    </button>
                  )}
                </div>
              </div>

              {/* Import History Summary */}
              {persona.importHistory && (
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
                  {persona.importHistory.google?.lastImportedAt && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <Search className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="text-sm font-medium text-blue-900">Google Business</div>
                        <div className="text-xs text-blue-600">
                          {persona.importHistory.google.placeName || 'Imported'} • {new Date(persona.importHistory.google.lastImportedAt as any).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  )}
                  {persona.importHistory.website?.lastImportedAt && (
                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                      <Globe className="w-5 h-5 text-purple-600" />
                      <div>
                        <div className="text-sm font-medium text-purple-900">Website</div>
                        <div className="text-xs text-purple-600">
                          {persona.importHistory.website.url || 'Imported'} • {new Date(persona.importHistory.website.lastImportedAt as any).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Saved Data Categories */}
            {savedDataCategories.length > 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 bg-teal-50 border-b border-teal-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Database className="w-5 h-5 text-teal-600" />
                    <span className="font-semibold text-teal-900">Profile Data</span>
                    <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">{savedDataCategories.length} categories</span>
                  </div>
                  <span className="text-sm text-teal-600">{savedDataFieldCount} fields</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {savedDataCategories.map(category => (
                    <SavedCategorySection
                      key={category.id}
                      category={category}
                      onEditField={(field) => handleEditField(field, category.id)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Database className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">No saved data yet</h3>
                <p className="text-sm text-slate-500 mb-4">
                  Import data from Google Business or your website to get started
                </p>
                <button
                  onClick={() => setActiveTab('import')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                >
                  Go to Import
                </button>
              </div>
            )}

            {/* Apply to Profile Button */}
            {savedDataCategories.length > 0 && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-emerald-900">Ready to Apply?</h3>
                    <p className="text-sm text-emerald-700 mt-1">
                      Send {savedDataFieldCount} fields to your main business profile
                    </p>
                  </div>
                  <button
                    onClick={handleApplyToProfile}
                    disabled={isApplying}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-200"
                  >
                    {isApplying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    Apply to Profile
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Edit Field Modal */}
        {editingField && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">Edit Field</h3>
                <button
                  onClick={() => setEditingField(null)}
                  className="p-1 hover:bg-slate-100 rounded"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <label className="text-sm font-medium text-slate-700 mb-1 block">
                    {editingField.field.label}
                  </label>
                  <div className="text-xs text-slate-500 mb-2">Path: {editingField.field.path}</div>
                  {typeof editingField.newValue === 'string' ? (
                    editingField.newValue.length > 100 ? (
                      <textarea
                        value={editingField.newValue}
                        onChange={(e) => setEditingField({ ...editingField, newValue: e.target.value })}
                        rows={4}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                      />
                    ) : (
                      <input
                        type="text"
                        value={editingField.newValue}
                        onChange={(e) => setEditingField({ ...editingField, newValue: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                      />
                    )
                  ) : Array.isArray(editingField.newValue) ? (
                    <textarea
                      value={editingField.newValue.join(', ')}
                      onChange={(e) => setEditingField({ ...editingField, newValue: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                      placeholder="Enter values separated by commas"
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                    />
                  ) : typeof editingField.newValue === 'object' ? (
                    <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-500">
                      Complex objects must be edited in the main Settings page
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={String(editingField.newValue)}
                      onChange={(e) => setEditingField({ ...editingField, newValue: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300"
                    />
                  )}
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  onClick={() => setEditingField(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveFieldEdit}
                  disabled={isSavingEdit}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 flex items-center gap-2"
                >
                  {isSavingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ========================================
// CATEGORY SECTION COMPONENT
// ========================================

function CategorySection({
  category,
  sourceType,
  onToggleExpand,
  onToggleField,
  onSelectAll
}: {
  category: ImportedCategory;
  sourceType: 'google' | 'website';
  onToggleExpand: () => void;
  onToggleField: (fieldId: string) => void;
  onSelectAll: (selected: boolean) => void;
}) {
  const Icon = category.icon;
  const selectedCount = category.fields.filter(f => f.selected).length;
  const allSelected = selectedCount === category.fields.length;

  return (
    <div>
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors"
      >
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", category.color)}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 text-left">
          <h4 className="font-medium text-slate-900">{category.label}</h4>
          <p className="text-xs text-slate-500">{selectedCount} of {category.fields.length} selected</p>
        </div>
        {category.expanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
      </button>

      {category.expanded && (
        <div className="px-4 pb-4">
          <div className="flex items-center justify-end mb-2">
            <button
              onClick={(e) => { e.stopPropagation(); onSelectAll(!allSelected); }}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {allSelected ? 'Deselect all' : 'Select all'}
            </button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {category.fields.map(field => (
              <div
                key={field.id}
                onClick={() => onToggleField(field.id)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all",
                  field.selected
                    ? "bg-indigo-50 border border-indigo-200"
                    : "bg-slate-50 border border-slate-200 hover:bg-slate-100"
                )}
              >
                <div className={cn(
                  "w-5 h-5 rounded-md flex items-center justify-center border-2 transition-colors flex-shrink-0",
                  field.selected ? "bg-indigo-600 border-indigo-600" : "bg-white border-slate-300"
                )}>
                  {field.selected && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-slate-900">{field.label}</div>
                  <div className="text-xs text-slate-500 truncate">{field.displayValue}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ========================================
// SAVED CATEGORY SECTION COMPONENT
// ========================================

function SavedCategorySection({
  category,
  onEditField
}: {
  category: ImportedCategory;
  onEditField: (field: ImportedField) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const Icon = category.icon;

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors"
      >
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", category.color)}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 text-left">
          <h4 className="font-medium text-slate-900">{category.label}</h4>
          <p className="text-xs text-slate-500">{category.fields.length} fields saved</p>
        </div>
        {expanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {category.fields.map(field => (
              <div
                key={field.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-slate-900">{field.label}</div>
                  <div className="text-xs text-slate-500 truncate">{field.displayValue}</div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onEditField(field); }}
                  className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                  title="Edit this field"
                >
                  <Edit3 className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ========================================
// MERGE FIELD ROW COMPONENT
// ========================================

function MergeFieldRow({
  field,
  onToggleSource
}: {
  field: MergeField;
  onToggleSource: (fieldKey: string, source: 'google' | 'website' | 'none') => void;
}) {
  const hasConflict = field.googleValue && field.websiteValue &&
    JSON.stringify(field.googleValue) !== JSON.stringify(field.websiteValue);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-900">{field.label}</span>
          <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{field.category}</span>
          {hasConflict && (
            <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Conflict
            </span>
          )}
        </div>
        <button
          onClick={() => onToggleSource(field.fieldKey, 'none')}
          className={cn(
            "text-xs px-2 py-1 rounded transition-colors",
            field.selectedSource === 'none'
              ? "bg-slate-200 text-slate-600"
              : "text-slate-400 hover:text-slate-600"
          )}
        >
          Skip
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Google Value */}
        <button
          onClick={() => field.googleValue && onToggleSource(field.fieldKey, 'google')}
          disabled={!field.googleValue}
          className={cn(
            "p-3 rounded-lg border-2 text-left transition-all",
            field.selectedSource === 'google'
              ? "border-blue-400 bg-blue-50"
              : field.googleValue
                ? "border-slate-200 bg-slate-50 hover:border-blue-200"
                : "border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed"
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <Search className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-600">Google</span>
            {field.selectedSource === 'google' && (
              <CheckCircle2 className="w-4 h-4 text-blue-600 ml-auto" />
            )}
          </div>
          <div className="text-sm text-slate-700 line-clamp-2">
            {field.googleValue ? formatDisplayValue(field.googleValue, 100) : 'No data'}
          </div>
        </button>

        {/* Website Value */}
        <button
          onClick={() => field.websiteValue && onToggleSource(field.fieldKey, 'website')}
          disabled={!field.websiteValue}
          className={cn(
            "p-3 rounded-lg border-2 text-left transition-all",
            field.selectedSource === 'website'
              ? "border-purple-400 bg-purple-50"
              : field.websiteValue
                ? "border-slate-200 bg-slate-50 hover:border-purple-200"
                : "border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed"
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-medium text-purple-600">Website</span>
            {field.selectedSource === 'website' && (
              <CheckCircle2 className="w-4 h-4 text-purple-600 ml-auto" />
            )}
          </div>
          <div className="text-sm text-slate-700 line-clamp-2">
            {field.websiteValue ? formatDisplayValue(field.websiteValue, 100) : 'No data'}
          </div>
        </button>
      </div>
    </div>
  );
}

// ========================================
// TESTIMONIAL ROW COMPONENT
// ========================================

function TestimonialRow({
  testimonial,
  expanded,
  onToggleExpand,
  onToggleSelect
}: {
  testimonial: TestimonialItem;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleSelect: () => void;
}) {
  const sentimentConfig = {
    positive: { icon: ThumbsUp, color: 'text-emerald-500', bg: 'bg-emerald-50', label: 'Positive' },
    neutral: { icon: Minus, color: 'text-slate-400', bg: 'bg-slate-50', label: 'Neutral' },
    negative: { icon: ThumbsDown, color: 'text-red-500', bg: 'bg-red-50', label: 'Negative' }
  };

  const sentiment = sentimentConfig[testimonial.sentiment || 'neutral'];
  const SentimentIcon = sentiment.icon;

  return (
    <div className={cn("p-4 transition-colors", testimonial.selected ? "bg-amber-50/30" : "")}>
      <div className="flex items-start gap-3">
        {/* Selection checkbox */}
        <button
          onClick={onToggleSelect}
          className={cn(
            "w-5 h-5 rounded-md flex items-center justify-center border-2 transition-colors flex-shrink-0 mt-1",
            testimonial.selected ? "bg-amber-500 border-amber-500" : "bg-white border-slate-300"
          )}
        >
          {testimonial.selected && <Check className="w-3 h-3 text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {testimonial.rating && (
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star
                    key={i}
                    className={cn(
                      "w-3.5 h-3.5",
                      i <= testimonial.rating! ? "text-amber-400 fill-amber-400" : "text-slate-200"
                    )}
                  />
                ))}
              </div>
            )}
            <div className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded text-xs", sentiment.bg)}>
              <SentimentIcon className={cn("w-3 h-3", sentiment.color)} />
              <span className={sentiment.color}>{sentiment.label}</span>
            </div>
            {testimonial.verified && (
              <span className="text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                <Shield className="w-3 h-3" /> Verified
              </span>
            )}
            {testimonial.platform && (
              <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                {testimonial.platform}
              </span>
            )}
            <span className={cn(
              "text-xs px-1.5 py-0.5 rounded",
              testimonial.source === 'google' ? "text-blue-600 bg-blue-50" : "text-purple-600 bg-purple-50"
            )}>
              {testimonial.source === 'google' ? 'Google' : 'Website'}
            </span>
          </div>

          {/* Quote */}
          <p className={cn(
            "text-sm text-slate-700",
            expanded ? "" : "line-clamp-2"
          )}>
            "{testimonial.quote}"
          </p>

          {/* Author & Meta */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              {testimonial.author && (
                <span className="font-medium text-slate-700">— {testimonial.author}</span>
              )}
              {testimonial.role && <span>{testimonial.role}</span>}
              {testimonial.location && <span>• {testimonial.location}</span>}
              {testimonial.date && (
                <span>• {new Date(testimonial.date).toLocaleDateString()}</span>
              )}
            </div>
            <button
              onClick={onToggleExpand}
              className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              {expanded ? (
                <>
                  <EyeOff className="w-3 h-3" /> Less
                </>
              ) : (
                <>
                  <Eye className="w-3 h-3" /> More
                </>
              )}
            </button>
          </div>

          {/* Expanded details */}
          {expanded && testimonial.productService && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                <span className="font-medium">Related to:</span> {testimonial.productService}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
