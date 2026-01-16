'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getBusinessPersonaAction, saveBusinessPersonaAction } from '@/actions/business-persona-actions';
import { searchBusinessesAction, autoFillProfileAction } from '@/actions/business-autofill-actions';
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
  Home, ShoppingBag, Utensils, Bed, GraduationCap, Stethoscope
} from 'lucide-react';
import type { BusinessPersona } from '@/lib/business-persona-types';

// ========================================
// TYPES
// ========================================

interface ImportedField {
  id: string;
  label: string;
  value: any;
  displayValue: string;
  path: string;
  source: 'google' | 'website';
  selected: boolean;
}

interface ImportedCategory {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  fields: ImportedField[];
  expanded: boolean;
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
    // Handle address objects
    if (value.street || value.city) {
      const parts = [value.street, value.area, value.city, value.state, value.country].filter(Boolean);
      return parts.join(', ');
    }
    // Handle operating hours
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
  source: 'google' | 'website',
  customDisplay?: string
) {
  if (value !== null && value !== undefined && value !== '' &&
      !(Array.isArray(value) && value.length === 0)) {
    fields.push({
      id,
      label,
      value,
      displayValue: customDisplay || formatDisplayValue(value),
      path,
      source,
      selected: true
    });
  }
}

/**
 * COMPREHENSIVE extraction of ALL imported data organized by category
 */
function extractImportedCategories(data: any, source: 'google' | 'website'): ImportedCategory[] {
  const categories: ImportedCategory[] = [];

  // Safely access nested data
  const identity = data?.identity || {};
  const personality = data?.personality || {};
  const knowledge = data?.knowledge || {};
  const customerProfile = data?.customerProfile || {};
  const inventory = data?.inventory || {};

  // ========================================
  // 1. BUSINESS IDENTITY
  // ========================================
  const identityFields: ImportedField[] = [];

  addField(identityFields, 'identity.businessName', 'Business Name', identity.businessName || identity.name, 'identity.name', source);
  addField(identityFields, 'identity.legalName', 'Legal Name', identity.legalName, 'identity.legalName', source);
  addField(identityFields, 'personality.tagline', 'Tagline', personality.tagline || identity.tagline, 'personality.tagline', source);
  addField(identityFields, 'personality.description', 'Description', personality.description || identity.description, 'personality.description', source);
  addField(identityFields, 'identity.shortDescription', 'Short Description', personality.shortDescription || identity.shortDescription, 'personality.shortDescription', source);
  addField(identityFields, 'identity.industry', 'Industry', identity.industry, 'identity.industry.name', source);
  addField(identityFields, 'identity.subIndustry', 'Sub-Industry', identity.subIndustry, 'identity.subIndustry', source);
  addField(identityFields, 'identity.businessType', 'Business Type', identity.businessType, 'identity.businessType', source);
  addField(identityFields, 'identity.yearEstablished', 'Year Established', identity.yearEstablished, 'personality.foundedYear', source);
  addField(identityFields, 'identity.languages', 'Languages', identity.languages, 'personality.languagePreference', source);

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

  addField(contactFields, 'identity.phone', 'Primary Phone', identity.phone, 'identity.phone', source);
  addField(contactFields, 'identity.secondaryPhone', 'Secondary Phone', identity.secondaryPhone, 'identity.secondaryPhone', source);
  addField(contactFields, 'identity.whatsapp', 'WhatsApp', identity.whatsapp, 'identity.whatsAppNumber', source);
  addField(contactFields, 'identity.tollFree', 'Toll-Free', identity.tollFree, 'identity.tollFree', source);
  addField(contactFields, 'identity.email', 'Primary Email', identity.email, 'identity.email', source);
  addField(contactFields, 'identity.supportEmail', 'Support Email', identity.supportEmail, 'identity.supportEmail', source);
  addField(contactFields, 'identity.salesEmail', 'Sales Email', identity.salesEmail, 'identity.salesEmail', source);
  addField(contactFields, 'identity.bookingEmail', 'Booking Email', identity.bookingEmail, 'identity.bookingEmail', source);
  addField(contactFields, 'identity.website', 'Website', identity.website, 'identity.website', source);

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

  if (identity.address && (identity.address.street || identity.address.city)) {
    addField(locationFields, 'identity.address', 'Address', identity.address, 'identity.address', source);
  }

  if (identity.locations && identity.locations.length > 0) {
    identity.locations.forEach((loc: any, i: number) => {
      addField(locationFields, `identity.locations.${i}`, `Location: ${loc.name || `Branch ${i + 1}`}`, loc, `identity.locations.${i}`, source,
        `${loc.address || ''} ${loc.isHeadquarters ? '(HQ)' : ''}`);
    });
  }

  addField(locationFields, 'identity.serviceAreas', 'Service Areas', identity.serviceAreas, 'identity.serviceArea', source);
  addField(locationFields, 'identity.deliveryZones', 'Delivery Zones', identity.deliveryZones, 'identity.deliveryZones', source);
  addField(locationFields, 'identity.internationalShipping', 'International Shipping', identity.internationalShipping, 'identity.internationalShipping', source);

  if (identity.operatingHours) {
    addField(locationFields, 'identity.operatingHours', 'Operating Hours', identity.operatingHours, 'identity.operatingHours', source);
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
  const social = identity.socialMedia || {};

  addField(socialFields, 'identity.socialMedia.instagram', 'Instagram', social.instagram, 'identity.socialMedia.instagram', source);
  addField(socialFields, 'identity.socialMedia.facebook', 'Facebook', social.facebook, 'identity.socialMedia.facebook', source);
  addField(socialFields, 'identity.socialMedia.linkedin', 'LinkedIn', social.linkedin, 'identity.socialMedia.linkedin', source);
  addField(socialFields, 'identity.socialMedia.twitter', 'Twitter/X', social.twitter, 'identity.socialMedia.twitter', source);
  addField(socialFields, 'identity.socialMedia.youtube', 'YouTube', social.youtube, 'identity.socialMedia.youtube', source);
  addField(socialFields, 'identity.socialMedia.pinterest', 'Pinterest', social.pinterest, 'identity.socialMedia.pinterest', source);
  addField(socialFields, 'identity.socialMedia.tiktok', 'TikTok', social.tiktok, 'identity.socialMedia.tiktok', source);
  addField(socialFields, 'identity.socialMedia.googleBusiness', 'Google Business', social.googleBusiness, 'identity.socialMedia.googleBusiness', source);

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

  addField(brandFields, 'personality.missionStatement', 'Mission Statement', personality.missionStatement, 'personality.missionStatement', source);
  addField(brandFields, 'personality.visionStatement', 'Vision Statement', personality.visionStatement, 'personality.visionStatement', source);
  addField(brandFields, 'personality.story', 'Brand Story', personality.story, 'personality.story', source);
  addField(brandFields, 'personality.brandValues', 'Brand Values', personality.brandValues, 'personality.brandValues', source);
  addField(brandFields, 'personality.uniqueSellingPoints', 'Unique Selling Points', personality.uniqueSellingPoints, 'personality.uniqueSellingPoints', source);

  if (personality.brandVoice) {
    addField(brandFields, 'personality.brandVoice.tone', 'Brand Tone', personality.brandVoice.tone, 'personality.voiceTone', source);
    addField(brandFields, 'personality.brandVoice.style', 'Communication Style', personality.brandVoice.style, 'personality.communicationStyle', source);
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
  // 6. TARGET AUDIENCE
  // ========================================
  const audienceFields: ImportedField[] = [];

  addField(audienceFields, 'customerProfile.targetAudience', 'Target Audience', customerProfile.targetAudience, 'customerProfile.targetAudience', source);
  addField(audienceFields, 'customerProfile.customerPainPoints', 'Customer Pain Points', customerProfile.customerPainPoints, 'customerProfile.customerPainPoints', source);

  if (audienceFields.length > 0) {
    categories.push({
      id: 'audience',
      label: 'Target Audience',
      icon: Target,
      color: 'bg-orange-500',
      fields: audienceFields,
      expanded: false
    });
  }

  // ========================================
  // 7. PRODUCTS & SERVICES (Individual items)
  // ========================================
  const productsOrServices = knowledge.productsOrServices || [];
  if (productsOrServices.length > 0) {
    const productFields: ImportedField[] = [];

    productsOrServices.forEach((item: any, i: number) => {
      const priceStr = item.price ? ` - ${item.priceUnit || ''}${item.price}` : '';
      addField(productFields, `knowledge.productsOrServices.${i}`,
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
  const packages = knowledge.packages || [];
  if (packages.length > 0) {
    const packageFields: ImportedField[] = [];

    packages.forEach((pkg: any, i: number) => {
      addField(packageFields, `knowledge.packages.${i}`,
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
  const pricingTiers = knowledge.pricingTiers || [];
  if (pricingTiers.length > 0) {
    const pricingFields: ImportedField[] = [];

    pricingTiers.forEach((tier: any, i: number) => {
      addField(pricingFields, `knowledge.pricingTiers.${i}`,
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
  const currentOffers = knowledge.currentOffers || [];
  if (currentOffers.length > 0) {
    const offerFields: ImportedField[] = [];

    currentOffers.forEach((offer: any, i: number) => {
      addField(offerFields, `knowledge.currentOffers.${i}`,
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

  addField(paymentFields, 'knowledge.paymentMethods', 'Payment Methods', knowledge.paymentMethods, 'knowledge.acceptedPayments', source);
  addField(paymentFields, 'knowledge.acceptedCards', 'Accepted Cards', knowledge.acceptedCards, 'knowledge.acceptedCards', source);
  addField(paymentFields, 'knowledge.emiAvailable', 'EMI Available', knowledge.emiAvailable, 'knowledge.emiAvailable', source);
  addField(paymentFields, 'knowledge.codAvailable', 'COD Available', knowledge.codAvailable, 'knowledge.codAvailable', source);

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
  // 12. FAQs (Individual items)
  // ========================================
  const faqs = knowledge.faqs || [];
  if (faqs.length > 0) {
    const faqFields: ImportedField[] = [];

    faqs.forEach((faq: any, i: number) => {
      addField(faqFields, `knowledge.faqs.${i}`,
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
  const policies = knowledge.policies || {};
  const policyFields: ImportedField[] = [];

  addField(policyFields, 'knowledge.policies.returnPolicy', 'Return Policy', policies.returnPolicy, 'knowledge.policies.returnPolicy', source);
  addField(policyFields, 'knowledge.policies.returnWindow', 'Return Window', policies.returnWindow, 'knowledge.policies.returnWindow', source);
  addField(policyFields, 'knowledge.policies.refundPolicy', 'Refund Policy', policies.refundPolicy, 'knowledge.policies.refundPolicy', source);
  addField(policyFields, 'knowledge.policies.refundTimeline', 'Refund Timeline', policies.refundTimeline, 'knowledge.policies.refundTimeline', source);
  addField(policyFields, 'knowledge.policies.cancellationPolicy', 'Cancellation Policy', policies.cancellationPolicy, 'knowledge.policies.cancellationPolicy', source);
  addField(policyFields, 'knowledge.policies.cancellationFee', 'Cancellation Fee', policies.cancellationFee, 'knowledge.policies.cancellationFee', source);
  addField(policyFields, 'knowledge.policies.exchangePolicy', 'Exchange Policy', policies.exchangePolicy, 'knowledge.policies.exchangePolicy', source);
  addField(policyFields, 'knowledge.policies.warrantyPolicy', 'Warranty Policy', policies.warrantyPolicy, 'knowledge.policies.warrantyInfo', source);
  addField(policyFields, 'knowledge.policies.shippingPolicy', 'Shipping Policy', policies.shippingPolicy, 'knowledge.policies.shippingInfo', source);
  addField(policyFields, 'knowledge.policies.deliveryTimeline', 'Delivery Timeline', policies.deliveryTimeline, 'knowledge.policies.deliveryInfo', source);
  addField(policyFields, 'knowledge.policies.freeShippingThreshold', 'Free Shipping Min', policies.freeShippingThreshold, 'knowledge.policies.freeShippingThreshold', source);

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
  // 14. INVENTORY - MENU ITEMS (Restaurants)
  // ========================================
  const menuItems = inventory.menuItems || [];
  if (menuItems.length > 0) {
    const menuFields: ImportedField[] = [];

    menuItems.forEach((item: any, i: number) => {
      const vegIndicator = item.isVeg === true ? '🟢' : item.isVeg === false ? '🔴' : '';
      addField(menuFields, `inventory.menuItems.${i}`,
        `${vegIndicator} ${item.name || `Item ${i + 1}`}`,
        item,
        `menuItems.${i}`,
        source,
        `${item.category || ''} ${item.price ? `- ₹${item.price}` : ''}`
      );
    });

    if (menuFields.length > 0) {
      categories.push({
        id: 'menu',
        label: `Menu Items (${menuFields.length})`,
        icon: Utensils,
        color: 'bg-orange-600',
        fields: menuFields,
        expanded: false
      });
    }
  }

  // ========================================
  // 15. INVENTORY - ROOMS (Hotels)
  // ========================================
  const rooms = inventory.rooms || [];
  if (rooms.length > 0) {
    const roomFields: ImportedField[] = [];

    rooms.forEach((room: any, i: number) => {
      addField(roomFields, `inventory.rooms.${i}`,
        room.name || `Room ${i + 1}`,
        room,
        `roomTypes.${i}`,
        source,
        `${room.category || ''} ${room.price ? `- ₹${room.price}/${room.priceUnit || 'night'}` : ''} ${room.maxOccupancy ? `(Max ${room.maxOccupancy})` : ''}`
      );
    });

    if (roomFields.length > 0) {
      categories.push({
        id: 'rooms',
        label: `Room Types (${roomFields.length})`,
        icon: Bed,
        color: 'bg-indigo-600',
        fields: roomFields,
        expanded: false
      });
    }
  }

  // ========================================
  // 16. INVENTORY - PRODUCTS (Retail)
  // ========================================
  const products = inventory.products || [];
  if (products.length > 0) {
    const productFields: ImportedField[] = [];

    products.forEach((product: any, i: number) => {
      const discount = product.mrp && product.price ? `(${Math.round((1 - product.price / product.mrp) * 100)}% off)` : '';
      addField(productFields, `inventory.products.${i}`,
        product.name || `Product ${i + 1}`,
        product,
        `productCatalog.${i}`,
        source,
        `${product.category || ''} ${product.price ? `₹${product.price}` : ''} ${discount}`
      );
    });

    if (productFields.length > 0) {
      categories.push({
        id: 'retail-products',
        label: `Products (${productFields.length})`,
        icon: ShoppingBag,
        color: 'bg-teal-500',
        fields: productFields,
        expanded: false
      });
    }
  }

  // ========================================
  // 17. INVENTORY - SERVICES (Healthcare)
  // ========================================
  const services = inventory.services || [];
  if (services.length > 0) {
    const serviceFields: ImportedField[] = [];

    services.forEach((service: any, i: number) => {
      addField(serviceFields, `inventory.services.${i}`,
        service.name || `Service ${i + 1}`,
        service,
        `healthcareServices.${i}`,
        source,
        `${service.category || ''} ${service.price ? `₹${service.price}` : ''} ${service.duration || ''}`
      );
    });

    if (serviceFields.length > 0) {
      categories.push({
        id: 'healthcare-services',
        label: `Healthcare Services (${serviceFields.length})`,
        icon: Stethoscope,
        color: 'bg-red-600',
        fields: serviceFields,
        expanded: false
      });
    }
  }

  // ========================================
  // 18. INVENTORY - PROPERTIES (Real Estate)
  // ========================================
  const properties = inventory.properties || [];
  if (properties.length > 0) {
    const propertyFields: ImportedField[] = [];

    properties.forEach((property: any, i: number) => {
      addField(propertyFields, `inventory.properties.${i}`,
        property.title || `Property ${i + 1}`,
        property,
        `propertyListings.${i}`,
        source,
        `${property.type || ''} ${property.subType || ''} - ${property.location || ''}`
      );
    });

    if (propertyFields.length > 0) {
      categories.push({
        id: 'properties',
        label: `Properties (${propertyFields.length})`,
        icon: Home,
        color: 'bg-violet-500',
        fields: propertyFields,
        expanded: false
      });
    }
  }

  // ========================================
  // 19. INVENTORY - COURSES (Education)
  // ========================================
  const courses = inventory.courses || [];
  if (courses.length > 0) {
    const courseFields: ImportedField[] = [];

    courses.forEach((course: any, i: number) => {
      addField(courseFields, `inventory.courses.${i}`,
        course.name || `Course ${i + 1}`,
        course,
        `courses.${i}`,
        source,
        `${course.duration || ''} ${course.mode || ''} ${course.price ? `₹${course.price}` : ''}`
      );
    });

    if (courseFields.length > 0) {
      categories.push({
        id: 'courses',
        label: `Courses (${courseFields.length})`,
        icon: GraduationCap,
        color: 'bg-yellow-600',
        fields: courseFields,
        expanded: false
      });
    }
  }

  // ========================================
  // 20. TEAM MEMBERS
  // ========================================
  const team = data.team || [];
  if (team.length > 0) {
    const teamFields: ImportedField[] = [];

    team.forEach((member: any, i: number) => {
      addField(teamFields, `team.${i}`,
        member.name || `Team Member ${i + 1}`,
        member,
        `team.${i}`,
        source,
        `${member.role || member.designation || ''} ${member.department ? `- ${member.department}` : ''}`
      );
    });

    if (teamFields.length > 0) {
      categories.push({
        id: 'team',
        label: `Team (${teamFields.length})`,
        icon: Users,
        color: 'bg-sky-500',
        fields: teamFields,
        expanded: false
      });
    }
  }

  // ========================================
  // 21. TESTIMONIALS
  // ========================================
  const testimonials = data.testimonials || [];
  if (testimonials.length > 0) {
    const testimonialFields: ImportedField[] = [];

    testimonials.forEach((t: any, i: number) => {
      const stars = t.rating ? '⭐'.repeat(Math.min(t.rating, 5)) : '';
      addField(testimonialFields, `testimonials.${i}`,
        `${stars} ${t.author || `Review ${i + 1}`}`,
        t,
        `testimonials.${i}`,
        source,
        `"${(t.quote || '').substring(0, 60)}..."`
      );
    });

    if (testimonialFields.length > 0) {
      categories.push({
        id: 'testimonials',
        label: `Testimonials (${testimonialFields.length})`,
        icon: Star,
        color: 'bg-amber-500',
        fields: testimonialFields,
        expanded: false
      });
    }
  }

  // ========================================
  // 22. CASE STUDIES
  // ========================================
  const caseStudies = data.caseStudies || [];
  if (caseStudies.length > 0) {
    const caseFields: ImportedField[] = [];

    caseStudies.forEach((cs: any, i: number) => {
      addField(caseFields, `caseStudies.${i}`,
        cs.title || `Case Study ${i + 1}`,
        cs,
        `caseStudies.${i}`,
        source,
        `${cs.client || ''} - ${cs.industry || ''}`
      );
    });

    if (caseFields.length > 0) {
      categories.push({
        id: 'case-studies',
        label: `Case Studies (${caseFields.length})`,
        icon: Briefcase,
        color: 'bg-neutral-600',
        fields: caseFields,
        expanded: false
      });
    }
  }

  // ========================================
  // 23. AWARDS & CREDENTIALS
  // ========================================
  const trustFields: ImportedField[] = [];

  const awards = data.awards || [];
  awards.forEach((award: any, i: number) => {
    addField(trustFields, `awards.${i}`,
      typeof award === 'string' ? award : (award.name || `Award ${i + 1}`),
      award,
      `knowledge.awards.${i}`,
      source,
      typeof award === 'object' ? `${award.year || ''} ${award.awardedBy || ''}` : ''
    );
  });

  const certifications = data.certifications || [];
  certifications.forEach((cert: any, i: number) => {
    addField(trustFields, `certifications.${i}`,
      typeof cert === 'string' ? cert : (cert.name || `Certification ${i + 1}`),
      cert,
      `knowledge.certifications.${i}`,
      source,
      typeof cert === 'object' ? `${cert.issuedBy || ''}` : ''
    );
  });

  addField(trustFields, 'accreditations', 'Accreditations', data.accreditations, 'accreditations', source);
  addField(trustFields, 'partnerships', 'Partnerships', data.partnerships, 'partnerships', source);
  addField(trustFields, 'clients', 'Notable Clients', data.clients, 'clients', source);
  addField(trustFields, 'featuredIn', 'Featured In', data.featuredIn, 'featuredIn', source);

  if (trustFields.length > 0) {
    categories.push({
      id: 'trust',
      label: `Trust & Credentials (${trustFields.length})`,
      icon: Award,
      color: 'bg-yellow-500',
      fields: trustFields,
      expanded: false
    });
  }

  // ========================================
  // 24. INDUSTRY-SPECIFIC DATA
  // ========================================
  const industryData = data.industrySpecificData || {};
  const industryFields: ImportedField[] = [];

  // Restaurant specific
  addField(industryFields, 'industry.cuisineTypes', 'Cuisine Types', industryData.cuisineTypes, 'restaurantInfo.cuisineTypes', source);
  addField(industryFields, 'industry.dietaryOptions', 'Dietary Options', industryData.dietaryOptions, 'restaurantInfo.dietaryOptions', source);
  addField(industryFields, 'industry.diningOptions', 'Dining Options', industryData.diningOptions, 'restaurantInfo.diningStyles', source);
  addField(industryFields, 'industry.averageCost', 'Average Cost for Two', industryData.averageCost, 'restaurantInfo.averageCostForTwo', source);
  addField(industryFields, 'industry.seatingCapacity', 'Seating Capacity', industryData.seatingCapacity, 'restaurantInfo.seatingCapacity', source);

  // Hotel specific
  addField(industryFields, 'industry.starRating', 'Star Rating', industryData.starRating, 'hotelPolicies.starRating', source);
  addField(industryFields, 'industry.checkInTime', 'Check-in Time', industryData.checkInTime, 'hotelPolicies.checkIn.time', source);
  addField(industryFields, 'industry.checkOutTime', 'Check-out Time', industryData.checkOutTime, 'hotelPolicies.checkOut.time', source);
  addField(industryFields, 'industry.hotelAmenities', 'Hotel Amenities', industryData.hotelAmenities, 'hotelAmenities', source);

  // Healthcare specific
  addField(industryFields, 'industry.medicalSpecializations', 'Medical Specializations', industryData.medicalSpecializations, 'healthcareSpecializations', source);
  addField(industryFields, 'industry.insuranceAccepted', 'Insurance Accepted', industryData.insuranceAccepted, 'healthcareInsurance', source);
  addField(industryFields, 'industry.emergencyServices', 'Emergency Services', industryData.emergencyServices, 'healthcareEmergency', source);

  // Real Estate specific
  addField(industryFields, 'industry.reraNumber', 'RERA Number', industryData.reraNumber, 'reraNumber', source);
  addField(industryFields, 'industry.developerName', 'Developer Name', industryData.developerName, 'developerName', source);
  addField(industryFields, 'industry.banksApproved', 'Banks Approved', industryData.banksApproved, 'banksApproved', source);

  if (industryFields.length > 0) {
    categories.push({
      id: 'industry-specific',
      label: `Industry Details (${industryFields.length})`,
      icon: Info,
      color: 'bg-gray-500',
      fields: industryFields,
      expanded: false
    });
  }

  return categories;
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

  // Import source state
  const [activeSource, setActiveSource] = useState<'google' | 'website' | null>(null);

  // Google import state
  const [googleSearch, setGoogleSearch] = useState('');
  const [googleResults, setGoogleResults] = useState<any[]>([]);
  const [googleSearching, setGoogleSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [isGoogleImporting, setIsGoogleImporting] = useState(false);
  const [googleImportedData, setGoogleImportedData] = useState<ImportedCategory[]>([]);

  // Website import state
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [websiteError, setWebsiteError] = useState<string | null>(null);
  const [isWebsiteImporting, setIsWebsiteImporting] = useState(false);
  const [websiteImportedData, setWebsiteImportedData] = useState<ImportedCategory[]>([]);

  // Applying to profile
  const [isApplying, setIsApplying] = useState(false);

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

  // Google places search - using searchBusinessesAction like settings page
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

  // Handle Google import
  const handleGoogleImport = async () => {
    if (!selectedPlace) {
      toast.error('Please select a business first');
      return;
    }
    setIsGoogleImporting(true);
    try {
      const result = await autoFillProfileAction(selectedPlace.placeId);
      if (result.success && result.profile) {
        console.log('[ImportCenter] Google import data:', result.profile);
        const categories = extractImportedCategories(result.profile as any, 'google');
        setGoogleImportedData(categories);
        toast.success(`Imported ${categories.reduce((a, c) => a + c.fields.length, 0)} fields from Google!`);
      } else {
        toast.error(result.error || 'Failed to import from Google');
      }
    } catch (err: any) {
      toast.error(err.message || 'Import failed');
    } finally {
      setIsGoogleImporting(false);
    }
  };

  // Handle website import - matching settings page implementation
  const handleWebsiteImport = async () => {
    if (!websiteUrl.trim()) {
      toast.error('Please enter a website URL');
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
      console.log('[ImportCenter] Pages analyzed:', result.pagesScraped?.length);

      const categories = extractImportedCategories(result.profile as any, 'website');
      setWebsiteImportedData(categories);
      toast.success(`Imported ${categories.reduce((a, c) => a + c.fields.length, 0)} fields from ${result.pagesScraped?.length || 1} pages!`);
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
        return {
          ...cat,
          fields: cat.fields.map(f => ({ ...f, selected }))
        };
      }
      return cat;
    }));
  };

  // Clear import data
  const clearImportData = (sourceType: 'google' | 'website') => {
    if (sourceType === 'google') {
      setGoogleImportedData([]);
      setGoogleSearch('');
      setSelectedPlace(null);
      setGoogleResults([]);
    } else {
      setWebsiteImportedData([]);
      setWebsiteUrl('');
      setWebsiteError(null);
    }
    toast.success(`${sourceType === 'google' ? 'Google' : 'Website'} import cleared`);
  };

  // Apply selected data to profile
  const applyToProfile = async () => {
    if (!partnerId) {
      toast.error('No partner ID found');
      return;
    }

    // Collect all selected fields
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
      // Build the updated persona by applying selected fields
      const updatedPersona: any = JSON.parse(JSON.stringify(persona));

      allSelectedFields.forEach(field => {
        const pathParts = field.path.split('.');
        let current: any = updatedPersona;

        // Navigate to the parent, creating objects as needed
        for (let i = 0; i < pathParts.length - 1; i++) {
          const part = pathParts[i];
          // Check if next part is a number (array index)
          const nextPart = pathParts[i + 1];
          const isNextIndex = !isNaN(parseInt(nextPart));

          if (!current[part]) {
            current[part] = isNextIndex ? [] : {};
          }
          current = current[part];
        }

        // Set the value
        const lastPart = pathParts[pathParts.length - 1];
        current[lastPart] = field.value;
      });

      // Update import history
      updatedPersona.importHistory = {
        ...updatedPersona.importHistory,
        ...(googleImportedData.length > 0 && {
          google: {
            lastImportedAt: new Date(),
            placeId: selectedPlace?.placeId,
            placeName: selectedPlace?.mainText,
            status: 'success' as const,
          }
        }),
        ...(websiteImportedData.length > 0 && {
          website: {
            lastImportedAt: new Date(),
            url: websiteUrl,
            status: 'success' as const,
          }
        })
      };

      // Save to backend
      await saveBusinessPersonaAction(partnerId, updatedPersona);
      setPersona(updatedPersona);

      toast.success(`${allSelectedFields.length} fields applied to profile!`);

      // Clear the imported data after applying
      setGoogleImportedData([]);
      setWebsiteImportedData([]);

      // Navigate back to profile
      router.push('/partner/settings');
    } catch (err: any) {
      toast.error(err.message || 'Failed to apply data');
    } finally {
      setIsApplying(false);
    }
  };

  // Count selected fields
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/partner/settings')}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Import Center</h1>
              <p className="text-xs text-slate-500">Import and select data for your profile</p>
            </div>
          </div>

          {totalFieldCount > 0 && (
            <button
              onClick={applyToProfile}
              disabled={isApplying || totalSelectedCount === 0}
              className={cn(
                "px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all",
                totalSelectedCount > 0
                  ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              )}
            >
              {isApplying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Apply {totalSelectedCount > 0 ? `(${totalSelectedCount})` : ''} to Profile
            </button>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Import Source Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
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
                    ? `${googleImportedData.reduce((a, c) => a + c.fields.length, 0)} fields in ${googleImportedData.length} categories`
                    : 'Search & import from Google'}
                </p>
                {googleImportedData.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs text-emerald-600 font-medium">Data ready to apply</span>
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
                    ? `${websiteImportedData.reduce((a, c) => a + c.fields.length, 0)} fields in ${websiteImportedData.length} categories`
                    : 'Import from your website'}
                </p>
                {websiteImportedData.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs text-emerald-600 font-medium">Data ready to apply</span>
                  </div>
                )}
              </div>
            </div>
          </button>
        </div>

        {/* Active Import Panel */}
        {activeSource && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8 shadow-sm">
            {activeSource === 'google' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Search className="w-5 h-5 text-blue-600" />
                    Search Google Business
                  </h3>
                  {googleImportedData.length > 0 && (
                    <button
                      onClick={() => clearImportData('google')}
                      className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear
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
                        <button
                          onClick={() => {
                            setSelectedPlace(null);
                            setGoogleSearch('');
                          }}
                          className="p-1 hover:bg-blue-100 rounded"
                        >
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
                                onClick={() => {
                                  setSelectedPlace(r);
                                  setGoogleSearch(r.mainText);
                                  setGoogleResults([]);
                                }}
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
                      selectedPlace
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
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
                    <button
                      onClick={() => clearImportData('website')}
                      className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="url"
                      value={websiteUrl}
                      onChange={e => {
                        setWebsiteUrl(e.target.value);
                        setWebsiteError(null);
                      }}
                      placeholder="Enter your website URL (e.g., www.yourbusiness.com)"
                      className={cn(
                        "w-full px-4 py-3 rounded-lg bg-slate-50 border text-sm focus:outline-none focus:ring-2 focus:ring-purple-300",
                        websiteError ? "border-red-300" : "border-slate-200"
                      )}
                    />
                    {websiteUrl && (
                      <a
                        href={websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-600"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                  <button
                    onClick={handleWebsiteImport}
                    disabled={isWebsiteImporting || !websiteUrl.trim()}
                    className={cn(
                      "px-6 py-3 rounded-lg text-sm font-medium flex items-center gap-2",
                      websiteUrl.trim()
                        ? "bg-purple-600 text-white hover:bg-purple-700"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
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
        {(googleImportedData.length > 0 || websiteImportedData.length > 0) && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Imported Data</h2>
              <div className="flex items-center gap-4">
                <p className="text-sm text-slate-500">
                  {totalSelectedCount} of {totalFieldCount} fields selected
                </p>
              </div>
            </div>

            {/* Google Imported Data */}
            {googleImportedData.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Search className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-blue-900">From Google Business</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      {googleImportedData.length} categories
                    </span>
                  </div>
                  <span className="text-sm text-blue-600">
                    {googleImportedData.flatMap(c => c.fields).filter(f => f.selected).length} selected
                  </span>
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
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                      {websiteImportedData.length} categories
                    </span>
                  </div>
                  <span className="text-sm text-purple-600">
                    {websiteImportedData.flatMap(c => c.fields).filter(f => f.selected).length} selected
                  </span>
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
        {googleImportedData.length === 0 && websiteImportedData.length === 0 && !activeSource && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Database className="w-8 h-8 text-indigo-500" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Start importing data</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
              Select a source above to import your business data. You can import from both sources and select which fields to apply to your profile.
            </p>
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
        {category.expanded ? (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronRight className="w-5 h-5 text-slate-400" />
        )}
      </button>

      {category.expanded && (
        <div className="px-4 pb-4">
          <div className="flex items-center justify-end mb-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectAll(!allSelected);
              }}
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
                  field.selected
                    ? "bg-indigo-600 border-indigo-600"
                    : "bg-white border-slate-300"
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
