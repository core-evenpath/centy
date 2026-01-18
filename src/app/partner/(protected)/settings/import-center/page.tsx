'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getBusinessPersonaAction, saveBusinessPersonaAction } from '@/actions/business-persona-actions';
import { searchBusinessesAction, autoFillProfileAction, applyImportToProfileAction } from '@/actions/business-autofill-actions';
import { scrapeWebsiteAction } from '@/actions/website-scrape-actions';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Download,
  GitMerge,
  Package,
  Quote,
  Wand2,
  Rocket,
  Loader2,
} from 'lucide-react';
import type { BusinessPersona } from '@/lib/business-persona-types';
import {
  ImportTab,
  ReviewTab,
  ProductsTab,
  TestimonialsTab,
  AISuggestionsTab,
  ApplyTab,
} from '@/components/partner/settings/import-center/tabs';
import { SuccessScreen } from '@/components/partner/settings/import-center/screens';
import type {
  ImportCenterTab,
  MergeField,
  ImportedProduct,
  EnrichedTestimonial,
  AISuggestion,
  ImportStats,
  FieldSource,
} from '@/components/partner/settings/import-center/types';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  Sparkles,
  FileText,
  Target,
  BookOpen,
  BadgeCheck,
  Users,
  GraduationCap,
  Flag,
} from 'lucide-react';

// ========================================
// HELPER FUNCTIONS
// ========================================

function analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  const positiveWords = [
    'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'best',
    'perfect', 'awesome', 'outstanding', 'exceptional', 'highly recommend',
    'impressed', 'friendly', 'professional', 'delicious', 'beautiful',
  ];
  const negativeWords = [
    'bad', 'terrible', 'awful', 'worst', 'horrible', 'disappointed', 'poor',
    'never again', 'waste', 'rude', 'slow', 'dirty', 'overpriced', 'avoid',
  ];

  const lowerText = text.toLowerCase();
  let positiveScore = 0;
  let negativeScore = 0;

  positiveWords.forEach((word) => {
    if (lowerText.includes(word)) positiveScore++;
  });
  negativeWords.forEach((word) => {
    if (lowerText.includes(word)) negativeScore++;
  });

  if (positiveScore > negativeScore) return 'positive';
  if (negativeScore > positiveScore) return 'negative';
  return 'neutral';
}

// Get nested value from object by path
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

// ========================================
// MAIN PAGE COMPONENT
// ========================================

export default function ImportCenterPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Core state
  const [loading, setLoading] = useState(true);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [persona, setPersona] = useState<Partial<BusinessPersona>>({});
  const [partnerIndustry, setPartnerIndustry] = useState<string | null>(null);
  const [partnerCountry, setPartnerCountry] = useState<string | null>(null);

  // View state
  const [activeTab, setActiveTab] = useState<ImportCenterTab>('import');

  // Import state
  const [googleImported, setGoogleImported] = useState(false);
  const [websiteImported, setWebsiteImported] = useState(false);
  const [googleSearch, setGoogleSearch] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [importing, setImporting] = useState<'google' | 'website' | null>(null);

  // Google search state
  const [googleResults, setGoogleResults] = useState<any[]>([]);
  const [googleSearching, setGoogleSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [googleSearchError, setGoogleSearchError] = useState<string | null>(null);
  const [websiteError, setWebsiteError] = useState<string | null>(null);

  // Raw imported data
  const [googleRawData, setGoogleRawData] = useState<any>(null);
  const [websiteRawData, setWebsiteRawData] = useState<any>(null);

  // Merge state
  const [mergeFields, setMergeFields] = useState<MergeField[]>([]);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Products state
  const [products, setProducts] = useState<ImportedProduct[]>([]);

  // Testimonials state
  const [testimonials, setTestimonials] = useState<EnrichedTestimonial[]>([]);

  // AI Suggestions state
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [suggestionFilter, setSuggestionFilter] = useState<'all' | 'core' | 'products' | 'testimonials'>('all');

  // Apply state - expanded sections for final review
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    identity: true,
    contact: false,
    social: false,
    brand: false,
    audience: false,
    competitive: false,
    credentials: false,
    team: false,
    industry: false,
    success: false,
    knowledge: false,
    products: false,
    testimonials: false,
    suggestions: false,
  });
  const [isApplying, setIsApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  // Get partnerId from user claims
  const userPartnerId = (user as any)?.customClaims?.partnerId;

  // ========================================
  // DATA LOADING
  // ========================================

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
          setPartnerIndustry(result.persona.identity?.industry?.category || null);
          setPartnerCountry(result.persona.identity?.address?.country || null);

          // Load previously saved import data
          if (result.persona.importedData?.google) {
            setGoogleRawData(result.persona.importedData.google.rawData);
            setGoogleImported(true);
          }
          if (result.persona.importedData?.website) {
            setWebsiteRawData(result.persona.importedData.website.rawData);
            setWebsiteImported(true);
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

  // ========================================
  // BUILD MERGE FIELDS
  // ========================================

  useEffect(() => {
    if (googleImported || websiteImported) {
      buildMergeFields();
      extractProducts();
      extractTestimonials();
      generateSuggestions();
    }
    // Also rebuild when industry changes (adds industry-specific fields)
  }, [googleRawData, websiteRawData, googleImported, websiteImported, partnerIndustry]);

  // Helper to extract value from multiple possible paths
  const extractValue = (data: any, paths: string[]): any => {
    if (!data) return null;
    for (const path of paths) {
      const val = getNestedValue(data, path);
      if (val !== null && val !== undefined && val !== '' &&
          !(Array.isArray(val) && val.length === 0) &&
          !(typeof val === 'object' && Object.keys(val).length === 0)) {
        return val;
      }
    }
    return null;
  };

  const buildMergeFields = () => {
    // COMPREHENSIVE field definitions with paths that match both:
    // 1. AutoFilledProfile structure (identity.*, personality.*, customerProfile.*, knowledge.*)
    // 2. Raw Gemini response (customerInsights.*, competitiveIntel.*, successMetrics.*, industryData.*)
    // 3. fromTheWeb unmapped data
    const fieldDefinitions = [
      // === IDENTITY ===
      { key: 'identity.name', label: 'Business Name', icon: Building2, critical: true, category: 'identity' as const,
        paths: ['identity.name', 'identity.businessName', 'businessName', 'name'] },
      { key: 'identity.legalName', label: 'Legal Name', icon: FileText, category: 'identity' as const,
        paths: ['identity.legalName', 'legalName'] },
      { key: 'personality.tagline', label: 'Tagline', icon: Sparkles, critical: true, category: 'identity' as const,
        paths: ['personality.tagline', 'identity.tagline', 'tagline'] },
      { key: 'personality.description', label: 'Description', icon: FileText, critical: true, multiline: true, category: 'identity' as const,
        paths: ['personality.description', 'identity.description', 'description', 'shortDescription', 'editorialSummary'] },
      { key: 'identity.industry', label: 'Industry', icon: Building2, category: 'identity' as const,
        paths: ['identity.industry', 'industry'] },
      { key: 'identity.yearEstablished', label: 'Year Established', icon: Clock, category: 'identity' as const,
        paths: ['identity.yearEstablished', 'yearEstablished', 'personality.foundedYear', 'foundedYear'] },
      { key: 'identity.languages', label: 'Languages', icon: Flag, category: 'identity' as const,
        paths: ['identity.languages', 'languages', 'personality.languagePreference'] },
      { key: 'identity.founders', label: 'Founders/Leadership', icon: Users, category: 'identity' as const,
        paths: ['identity.founders', 'founders', 'leadership', 'founder'] },
      { key: 'identity.teamSize', label: 'Team Size', icon: Users, category: 'identity' as const,
        paths: ['identity.teamSize', 'teamSize', 'employeeCount'] },

      // === CONTACT ===
      { key: 'identity.phone', label: 'Primary Phone', icon: Phone, critical: true, category: 'contact' as const,
        paths: ['identity.phone', 'contact.primaryPhone', 'phone', 'internationalPhone'] },
      { key: 'identity.email', label: 'Primary Email', icon: Mail, critical: true, category: 'contact' as const,
        paths: ['identity.email', 'contact.primaryEmail', 'email'] },
      { key: 'identity.website', label: 'Website', icon: FileText, category: 'contact' as const,
        paths: ['identity.website', 'website'] },
      { key: 'identity.whatsAppNumber', label: 'WhatsApp', icon: Phone, category: 'contact' as const,
        paths: ['identity.whatsAppNumber', 'identity.whatsapp', 'whatsapp'] },
      { key: 'identity.address', label: 'Address', icon: MapPin, critical: true, category: 'contact' as const,
        paths: ['identity.address', 'address', 'formattedAddress'] },
      { key: 'identity.operatingHours', label: 'Operating Hours', icon: Clock, category: 'contact' as const,
        paths: ['identity.operatingHours', 'operatingHours', 'openingHours'] },
      { key: 'identity.googleMapsUrl', label: 'Google Maps URL', icon: MapPin, category: 'contact' as const,
        paths: ['identity.googleMapsUrl', 'googleMapsUrl'] },

      // === SOCIAL MEDIA ===
      { key: 'identity.socialMedia.instagram', label: 'Instagram', icon: FileText, category: 'social' as const,
        paths: ['identity.socialMedia.instagram', 'socialMedia.instagram'] },
      { key: 'identity.socialMedia.facebook', label: 'Facebook', icon: FileText, category: 'social' as const,
        paths: ['identity.socialMedia.facebook', 'socialMedia.facebook'] },
      { key: 'identity.socialMedia.linkedin', label: 'LinkedIn', icon: FileText, category: 'social' as const,
        paths: ['identity.socialMedia.linkedin', 'socialMedia.linkedin'] },
      { key: 'identity.socialMedia.twitter', label: 'Twitter/X', icon: FileText, category: 'social' as const,
        paths: ['identity.socialMedia.twitter', 'socialMedia.twitter'] },
      { key: 'identity.socialMedia.youtube', label: 'YouTube', icon: FileText, category: 'social' as const,
        paths: ['identity.socialMedia.youtube', 'socialMedia.youtube'] },
      { key: 'identity.socialMedia.tiktok', label: 'TikTok', icon: FileText, category: 'social' as const,
        paths: ['identity.socialMedia.tiktok', 'socialMedia.tiktok'] },
      { key: 'identity.socialMedia.pinterest', label: 'Pinterest', icon: FileText, category: 'social' as const,
        paths: ['identity.socialMedia.pinterest', 'socialMedia.pinterest'] },
      { key: 'identity.socialMedia.threads', label: 'Threads', icon: FileText, category: 'social' as const,
        paths: ['identity.socialMedia.threads', 'socialMedia.threads'] },
      { key: 'identity.socialMedia.snapchat', label: 'Snapchat', icon: FileText, category: 'social' as const,
        paths: ['identity.socialMedia.snapchat', 'socialMedia.snapchat'] },
      { key: 'identity.socialMedia.whatsapp', label: 'WhatsApp Business', icon: FileText, category: 'social' as const,
        paths: ['identity.socialMedia.whatsappBusiness', 'socialMedia.whatsapp', 'identity.whatsapp'] },
      { key: 'identity.socialMedia.telegram', label: 'Telegram', icon: FileText, category: 'social' as const,
        paths: ['identity.socialMedia.telegram', 'socialMedia.telegram'] },
      { key: 'identity.socialMedia.googleBusiness', label: 'Google Business', icon: FileText, category: 'social' as const,
        paths: ['identity.socialMedia.googleBusiness', 'socialMedia.googleBusiness', 'googleMapsUrl'] },
      { key: 'identity.socialMedia.yelp', label: 'Yelp', icon: FileText, category: 'social' as const,
        paths: ['identity.socialMedia.yelp', 'socialMedia.yelp'] },
      { key: 'identity.socialMedia.tripadvisor', label: 'TripAdvisor', icon: FileText, category: 'social' as const,
        paths: ['identity.socialMedia.tripadvisor', 'socialMedia.tripadvisor'] },
      { key: 'identity.socialMedia.trustpilot', label: 'Trustpilot', icon: FileText, category: 'social' as const,
        paths: ['identity.socialMedia.trustpilot', 'socialMedia.trustpilot'] },
      { key: 'identity.socialMedia.zillow', label: 'Zillow', icon: FileText, category: 'social' as const,
        paths: ['identity.socialMedia.zillow', 'socialMedia.zillow'] },
      { key: 'identity.socialMedia.houzz', label: 'Houzz', icon: FileText, category: 'social' as const,
        paths: ['identity.socialMedia.houzz', 'socialMedia.houzz'] },
      { key: 'identity.socialMedia.github', label: 'GitHub', icon: FileText, category: 'social' as const,
        paths: ['identity.socialMedia.github', 'socialMedia.github'] },
      { key: 'identity.socialMedia.behance', label: 'Behance', icon: FileText, category: 'social' as const,
        paths: ['identity.socialMedia.behance', 'socialMedia.behance'] },

      // === BRAND & VALUES ===
      { key: 'personality.missionStatement', label: 'Mission Statement', icon: Target, category: 'brand' as const,
        paths: ['personality.missionStatement', 'missionStatement', 'mission'] },
      { key: 'personality.visionStatement', label: 'Vision Statement', icon: Target, category: 'brand' as const,
        paths: ['personality.visionStatement', 'visionStatement', 'vision'] },
      { key: 'personality.story', label: 'Brand Story', icon: BookOpen, multiline: true, category: 'brand' as const,
        paths: ['personality.story', 'story', 'founderStory', 'brandStory', 'about'] },
      { key: 'personality.brandValues', label: 'Brand Values', icon: Flag, category: 'brand' as const,
        paths: ['personality.brandValues', 'brandValues', 'values', 'coreValues'] },
      { key: 'personality.uniqueSellingPoints', label: 'USPs', icon: Sparkles, critical: true, category: 'brand' as const,
        paths: ['personality.uniqueSellingPoints', 'uniqueSellingPoints', 'usps', 'differentiators'] },
      { key: 'personality.voiceTone', label: 'Brand Voice Tone', icon: FileText, category: 'brand' as const,
        paths: ['personality.voiceTone', 'brandVoice.tone', 'voiceTone'] },

      // === TARGET AUDIENCE (from customerProfile AND raw customerInsights) ===
      { key: 'customerProfile.targetAudience', label: 'Target Audience', icon: Users, category: 'audience' as const,
        paths: ['customerProfile.targetAudience', 'targetAudience', 'customerInsights.targetAudience'] },
      { key: 'customerProfile.painPoints', label: 'Customer Pain Points', icon: Target, category: 'audience' as const,
        paths: ['customerProfile.painPoints', 'customerProfile.customerPainPoints', 'customerInsights.painPoints', 'painPoints'] },
      { key: 'customerProfile.idealCustomerProfile', label: 'Ideal Customer', icon: Users, category: 'audience' as const,
        paths: ['customerProfile.idealCustomerProfile', 'customerInsights.idealCustomerProfile', 'idealCustomerProfile'] },
      { key: 'customerProfile.ageGroup', label: 'Target Age Groups', icon: Users, category: 'audience' as const,
        paths: ['customerProfile.ageGroup', 'customerInsights.targetAgeGroups', 'targetAgeGroups', 'ageGroup'] },
      { key: 'customerProfile.incomeSegment', label: 'Income Segments', icon: Users, category: 'audience' as const,
        paths: ['customerProfile.incomeSegment', 'customerInsights.incomeSegments', 'incomeSegments'] },
      { key: 'customerProfile.valuePropositions', label: 'Value Propositions', icon: Sparkles, category: 'audience' as const,
        paths: ['customerProfile.valuePropositions', 'customerInsights.valuePropositions', 'valuePropositions'] },

      // === COMPETITIVE INTEL (from customerProfile AND raw competitiveIntel) ===
      { key: 'customerProfile.differentiators', label: 'Key Differentiators', icon: Sparkles, category: 'competitive' as const,
        paths: ['customerProfile.differentiators', 'competitiveIntel.differentiators', 'differentiators', 'competitiveAdvantages'] },
      { key: 'customerProfile.objectionHandlers', label: 'Objection Handlers', icon: Target, category: 'competitive' as const,
        paths: ['customerProfile.objectionHandlers', 'competitiveIntel.objectionHandlers', 'objectionHandlers'] },
      { key: 'customerProfile.competitiveAdvantages', label: 'Competitive Advantages', icon: Sparkles, category: 'competitive' as const,
        paths: ['customerProfile.competitiveAdvantages', 'competitiveIntel.competitiveAdvantages', 'competitiveAdvantages'] },
      { key: 'customerProfile.marketPosition', label: 'Market Position', icon: Building2, category: 'competitive' as const,
        paths: ['customerProfile.marketPosition', 'competitiveIntel.marketPosition', 'marketPosition', 'priceLevel'] },

      // === CREDENTIALS (from knowledge AND raw) ===
      { key: 'knowledge.certifications', label: 'Certifications', icon: BadgeCheck, category: 'credentials' as const,
        paths: ['knowledge.certifications', 'certifications', 'industrySpecificData.certifications', 'industrySpecificData.accreditations'] },
      { key: 'knowledge.awards', label: 'Awards', icon: BadgeCheck, category: 'credentials' as const,
        paths: ['knowledge.awards', 'awards', 'industrySpecificData.awards'] },
      { key: 'knowledge.accreditations', label: 'Accreditations', icon: BadgeCheck, category: 'credentials' as const,
        paths: ['knowledge.accreditations', 'accreditations', 'industrySpecificData.accreditations'] },
      { key: 'knowledge.registrations', label: 'Business Registrations', icon: BadgeCheck, category: 'credentials' as const,
        paths: ['knowledge.registrations', 'registrations', 'businessRegistrations'] },

      // === TEAM ===
      { key: 'knowledge.teamMembers', label: 'Team Members', icon: Users, category: 'team' as const,
        paths: ['knowledge.teamMembers', 'teamMembers', 'team', 'employees'] },
      { key: 'knowledge.keyPeople', label: 'Key People/Doctors', icon: Users, category: 'team' as const,
        paths: ['knowledge.keyPeople', 'keyPeople', 'leadership', 'doctors', 'industrySpecificData.doctors'] },

      // === SERVICES & PRODUCTS (CRITICAL) ===
      { key: 'knowledge.services', label: 'Services Offered', icon: GraduationCap, critical: true, category: 'industry' as const,
        paths: ['knowledge.services', 'services', 'knowledge.productsOrServices', 'inventory.services'] },
      { key: 'knowledge.products', label: 'Products', icon: GraduationCap, category: 'industry' as const,
        paths: ['knowledge.products', 'products', 'inventory.products', 'inventory.menuItems'] },
      { key: 'knowledge.paymentMethods', label: 'Payment Methods', icon: BadgeCheck, category: 'industry' as const,
        paths: ['knowledge.paymentMethods', 'paymentMethods', 'acceptedPayments'] },

      // === INDUSTRY SPECIFIC (dynamic based on partnerIndustry) ===
      // Common industry fields from industryData
      { key: 'industrySpecificData.specializations', label: 'Specializations', icon: GraduationCap, category: 'industry' as const,
        paths: ['industrySpecificData.specializations', 'specializations', 'fromTheWeb.rawIndustryData.specializations'] },
      { key: 'industrySpecificData.facilityType', label: 'Facility Type', icon: Building2, category: 'industry' as const,
        paths: ['industrySpecificData.facilityType', 'facilityType', 'placeType'] },

      // Healthcare specific - mapped from industryData and fromTheWeb
      ...(partnerIndustry === 'healthcare' ? [
        { key: 'industrySpecificData.doctors', label: 'Doctors', icon: Users, category: 'industry' as const,
          paths: ['industrySpecificData.doctors', 'fromTheWeb.rawIndustryData.doctors', 'doctors'] },
        { key: 'industrySpecificData.facilities', label: 'Medical Facilities', icon: GraduationCap, category: 'industry' as const,
          paths: ['industrySpecificData.facilities', 'fromTheWeb.rawIndustryData.facilities', 'facilities'] },
        { key: 'industrySpecificData.bedCount', label: 'Bed Capacity', icon: Building2, category: 'industry' as const,
          paths: ['industrySpecificData.bedCount', 'fromTheWeb.rawIndustryData.bedCount', 'bedCount'] },
        { key: 'industrySpecificData.diagnosticTests', label: 'Diagnostic Tests', icon: GraduationCap, category: 'industry' as const,
          paths: ['industrySpecificData.diagnosticTests', 'fromTheWeb.rawIndustryData.diagnosticTests', 'diagnosticTests'] },
        { key: 'industrySpecificData.emergencyServices', label: 'Emergency Services', icon: BadgeCheck, category: 'industry' as const,
          paths: ['industrySpecificData.emergencyServices', 'fromTheWeb.rawIndustryData.emergencyServices', 'emergencyServices'] },
        { key: 'industrySpecificData.insuranceAccepted', label: 'Insurance Partners', icon: BadgeCheck, category: 'industry' as const,
          paths: ['industrySpecificData.insuranceAccepted', 'fromTheWeb.rawIndustryData.insuranceAccepted', 'insuranceAccepted'] },
        { key: 'industrySpecificData.consultationTypes', label: 'Consultation Types', icon: GraduationCap, category: 'industry' as const,
          paths: ['industrySpecificData.consultationTypes', 'fromTheWeb.rawIndustryData.consultationTypes', 'consultationTypes'] },
      ] : []),

      // Food & Beverage / Hospitality specific
      ...(partnerIndustry === 'food_beverage' || partnerIndustry === 'hospitality' ? [
        { key: 'industrySpecificData.cuisineTypes', label: 'Cuisine Types', icon: GraduationCap, category: 'industry' as const,
          paths: ['industrySpecificData.cuisineTypes', 'fromTheWeb.rawIndustryData.cuisineTypes', 'cuisineTypes'] },
        { key: 'industrySpecificData.dietaryOptions', label: 'Dietary Options', icon: GraduationCap, category: 'industry' as const,
          paths: ['industrySpecificData.dietaryOptions', 'fromTheWeb.rawIndustryData.dietaryOptions', 'dietaryOptions'] },
        { key: 'industrySpecificData.seatingCapacity', label: 'Seating Capacity', icon: Users, category: 'industry' as const,
          paths: ['industrySpecificData.seatingCapacity', 'fromTheWeb.rawIndustryData.seatingCapacity', 'seatingCapacity'] },
        { key: 'industrySpecificData.averageCost', label: 'Average Cost for Two', icon: BadgeCheck, category: 'industry' as const,
          paths: ['industrySpecificData.averageCost', 'fromTheWeb.rawIndustryData.averageCost', 'averageCost'] },
        { key: 'industrySpecificData.deliveryPartners', label: 'Delivery Partners', icon: Building2, category: 'industry' as const,
          paths: ['industrySpecificData.deliveryPartners', 'fromTheWeb.rawIndustryData.deliveryPartners', 'deliveryPartners'] },
        { key: 'industrySpecificData.specialties', label: 'Signature Dishes', icon: Sparkles, category: 'industry' as const,
          paths: ['industrySpecificData.specialties', 'fromTheWeb.rawIndustryData.specialties', 'specialties'] },
        { key: 'industrySpecificData.starRating', label: 'Star Rating', icon: BadgeCheck, category: 'industry' as const,
          paths: ['industrySpecificData.starRating', 'fromTheWeb.rawIndustryData.starRating', 'starRating'] },
        { key: 'industrySpecificData.totalRooms', label: 'Total Rooms', icon: Building2, category: 'industry' as const,
          paths: ['industrySpecificData.totalRooms', 'fromTheWeb.rawIndustryData.totalRooms', 'totalRooms'] },
        { key: 'industrySpecificData.amenities', label: 'Amenities', icon: GraduationCap, category: 'industry' as const,
          paths: ['industrySpecificData.amenities', 'fromTheWeb.rawIndustryData.amenities', 'amenities'] },
        { key: 'industrySpecificData.bookingPartners', label: 'Booking Platforms', icon: Building2, category: 'industry' as const,
          paths: ['industrySpecificData.bookingPartners', 'fromTheWeb.rawIndustryData.bookingPartners', 'bookingPartners'] },
      ] : []),

      // Education / Services specific
      ...(partnerIndustry === 'education' || partnerIndustry === 'services' ? [
        { key: 'industrySpecificData.coursesOffered', label: 'Courses Offered', icon: GraduationCap, category: 'industry' as const,
          paths: ['industrySpecificData.coursesOffered', 'fromTheWeb.rawIndustryData.courses', 'coursesOffered'] },
        { key: 'industrySpecificData.facultyCount', label: 'Faculty Count', icon: Users, category: 'industry' as const,
          paths: ['industrySpecificData.facultyCount', 'facultyCount'] },
        { key: 'industrySpecificData.studentCount', label: 'Student Count', icon: Users, category: 'industry' as const,
          paths: ['industrySpecificData.studentCount', 'studentCount'] },
        { key: 'industrySpecificData.placementRate', label: 'Placement Rate', icon: BadgeCheck, category: 'industry' as const,
          paths: ['industrySpecificData.placementRate', 'placementRate'] },
      ] : []),

      // Retail specific
      ...(partnerIndustry === 'retail' ? [
        { key: 'industrySpecificData.productCategories', label: 'Product Categories', icon: GraduationCap, category: 'industry' as const,
          paths: ['industrySpecificData.productCategories', 'fromTheWeb.rawIndustryData.productCategories', 'productCategories'] },
        { key: 'industrySpecificData.brands', label: 'Brands Available', icon: Building2, category: 'industry' as const,
          paths: ['industrySpecificData.brands', 'fromTheWeb.rawIndustryData.brands', 'brands'] },
        { key: 'industrySpecificData.priceRange', label: 'Price Range', icon: BadgeCheck, category: 'industry' as const,
          paths: ['industrySpecificData.priceRange', 'fromTheWeb.rawIndustryData.priceRange', 'priceRange'] },
        { key: 'industrySpecificData.deliveryOptions', label: 'Delivery Options', icon: Building2, category: 'industry' as const,
          paths: ['industrySpecificData.deliveryOptions', 'fromTheWeb.rawIndustryData.deliveryOptions', 'deliveryOptions'] },
        { key: 'industrySpecificData.returnPolicy', label: 'Return Policy', icon: FileText, category: 'industry' as const,
          paths: ['industrySpecificData.returnPolicy', 'fromTheWeb.rawIndustryData.returnPolicy', 'returnPolicy'] },
        { key: 'industrySpecificData.onlineStore', label: 'E-commerce Store', icon: FileText, category: 'industry' as const,
          paths: ['industrySpecificData.onlineStore', 'fromTheWeb.rawIndustryData.onlineStore', 'onlineStore'] },
      ] : []),

      // Real Estate specific
      ...(partnerIndustry === 'real_estate' ? [
        { key: 'industrySpecificData.propertyTypes', label: 'Property Types', icon: Building2, category: 'industry' as const,
          paths: ['industrySpecificData.propertyTypes', 'fromTheWeb.rawIndustryData.propertyTypes', 'propertyTypes'] },
        { key: 'industrySpecificData.locations', label: 'Service Areas', icon: MapPin, category: 'industry' as const,
          paths: ['industrySpecificData.locations', 'fromTheWeb.rawIndustryData.locations', 'serviceAreas', 'locations'] },
        { key: 'industrySpecificData.reraRegistration', label: 'RERA/License Number', icon: BadgeCheck, category: 'industry' as const,
          paths: ['industrySpecificData.reraRegistration', 'fromTheWeb.rawIndustryData.registrationNumber', 'registrations.RERA', 'reraRegistration'] },
        { key: 'industrySpecificData.projectsCompleted', label: 'Projects Completed', icon: BadgeCheck, category: 'industry' as const,
          paths: ['industrySpecificData.projectsCompleted', 'fromTheWeb.rawIndustryData.projectsCompleted', 'projectsCompleted'] },
      ] : []),

      // === SUCCESS METRICS (from knowledge AND raw successMetrics) ===
      { key: 'knowledge.caseStudies', label: 'Case Studies', icon: FileText, category: 'success' as const,
        paths: ['knowledge.caseStudies', 'successMetrics.caseStudies', 'caseStudies', 'successStories'] },
      { key: 'knowledge.keyStats', label: 'Key Statistics', icon: BadgeCheck, category: 'success' as const,
        paths: ['knowledge.keyStats', 'successMetrics.keyStats', 'keyStats', 'statistics'] },
      { key: 'industrySpecificData.notableClients', label: 'Notable Clients', icon: Users, category: 'success' as const,
        paths: ['industrySpecificData.notableClients', 'successMetrics.notableClients', 'notableClients', 'clients'] },
      { key: 'onlinePresence', label: 'Online Reviews Summary', icon: BadgeCheck, category: 'success' as const,
        paths: ['onlinePresence', 'onlineReviews'] },
      { key: 'pressMedia', label: 'Press/Media Coverage', icon: FileText, category: 'success' as const,
        paths: ['pressMedia', 'mediaCoverage', 'press'] },

      // === DEEP EXTRACTION FIELDS (from enhanced AI scraping) ===
      { key: 'industrySpecificData.areasServed', label: 'Areas Served', icon: MapPin, category: 'industry' as const,
        paths: ['industrySpecificData.areasServed', 'fromTheWeb.areasServed', 'serviceAreas', 'areasServed'] },
      { key: 'industrySpecificData.clientTypes', label: 'Client Types', icon: Users, category: 'audience' as const,
        paths: ['industrySpecificData.clientTypes', 'fromTheWeb.clientTypes', 'clientTypes'] },
      { key: 'industrySpecificData.projectTypes', label: 'Project Types', icon: Building2, category: 'industry' as const,
        paths: ['industrySpecificData.projectTypes', 'fromTheWeb.projectTypes', 'projectTypes'] },
      { key: 'industrySpecificData.processSteps', label: 'Process Steps', icon: FileText, category: 'industry' as const,
        paths: ['industrySpecificData.processSteps', 'fromTheWeb.processSteps', 'processSteps'] },
      { key: 'industrySpecificData.differentiators', label: 'Key Differentiators', icon: Sparkles, category: 'competitive' as const,
        paths: ['industrySpecificData.differentiators', 'differentiators', 'competitiveAdvantages'] },
      { key: 'industrySpecificData.additionalServices', label: 'Additional Services', icon: GraduationCap, category: 'industry' as const,
        paths: ['industrySpecificData.additionalServices', 'additionalServices'] },

      // === KNOWLEDGE/FAQ ===
      { key: 'knowledge.faqs', label: 'FAQs', icon: FileText, category: 'knowledge' as const,
        paths: ['knowledge.faqs', 'faqs', 'faq', 'frequentlyAskedQuestions'] },
      { key: 'knowledge.policies', label: 'Policies', icon: FileText, category: 'knowledge' as const,
        paths: ['knowledge.policies', 'policies', 'cancellationPolicy', 'returnPolicy'] },
      { key: 'fromTheWeb.otherFindings', label: 'Additional Web Findings', icon: FileText, category: 'knowledge' as const,
        paths: ['fromTheWeb.otherFindings', 'fromTheWeb', 'rawWebData.otherFindings'] },
    ];

    const fields: MergeField[] = [];

    fieldDefinitions.forEach((def) => {
      const googleVal = extractValue(googleRawData, def.paths);
      const websiteVal = extractValue(websiteRawData, def.paths);

      // Only add fields that have at least one value
      if (googleVal || websiteVal) {
        const hasConflict = googleVal && websiteVal && JSON.stringify(googleVal) !== JSON.stringify(websiteVal);

        let selectedSource: FieldSource = 'none';
        let finalValue = null;

        // Prefer website value, then google
        if (websiteVal) {
          selectedSource = 'website';
          finalValue = websiteVal;
        } else if (googleVal) {
          selectedSource = 'google';
          finalValue = googleVal;
        }

        fields.push({
          key: def.key,
          label: def.label,
          icon: def.icon,
          category: def.category,
          critical: def.critical,
          multiline: def.multiline,
          googleValue: googleVal,
          websiteValue: websiteVal,
          finalValue,
          selectedSource,
          hasConflict,
        });
      }
    });

    setMergeFields(fields);
  };

  const extractProducts = () => {
    const allProducts: ImportedProduct[] = [];
    const seenNames = new Set<string>(); // Avoid duplicates

    const addProduct = (p: any, index: number, source: FieldSource, categoryOverride?: string) => {
      const name = p.name || p.title || p.roomType || p.serviceName || `Item ${index + 1}`;
      const normalizedName = name.toLowerCase().trim();

      // Skip duplicates
      if (seenNames.has(normalizedName)) return;
      seenNames.add(normalizedName);

      allProducts.push({
        id: `${source}_product_${allProducts.length}`,
        name,
        description: p.description || p.shortDescription || p.details || '',
        category: categoryOverride || p.category || 'General',
        pricing: p.price
          ? `${p.priceUnit || p.currency || '$'}${p.price}${p.priceType ? ` ${p.priceType}` : ''}`
          : p.pricing || p.priceRange || '',
        features: p.features || p.amenities || p.highlights || [],
        popular: p.popular || p.featured || p.recommended || false,
        selected: true,
        source,
      });
    };

    const processProducts = (data: any, source: FieldSource) => {
      // Standard products/services paths
      const productsData = data?.knowledge?.productsOrServices || data?.productsOrServices || data?.products || [];
      productsData.forEach((p: any, index: number) => addProduct(p, index, source));

      // Services
      const services = data?.knowledge?.services || data?.services || data?.inventory?.services || [];
      services.forEach((s: any, index: number) => addProduct(s, index, source, 'Service'));

      // Hospitality - Rooms
      const rooms = data?.inventory?.rooms || data?.industrySpecificData?.rooms || data?.fromTheWeb?.rawIndustryData?.rooms || [];
      rooms.forEach((r: any, index: number) => addProduct(r, index, source, 'Room'));

      // Food & Beverage - Menu Items
      const menuItems = data?.inventory?.menuItems || data?.industrySpecificData?.menuItems || data?.fromTheWeb?.rawIndustryData?.menuItems || [];
      menuItems.forEach((m: any, index: number) => addProduct(m, index, source, 'Menu Item'));

      // Real Estate - Properties
      const properties = data?.inventory?.properties || data?.industrySpecificData?.properties || data?.fromTheWeb?.rawIndustryData?.properties || [];
      properties.forEach((p: any, index: number) => addProduct(p, index, source, 'Property'));

      // Healthcare - Treatments/Procedures
      const treatments = data?.inventory?.treatments || data?.industrySpecificData?.treatments || data?.fromTheWeb?.rawIndustryData?.treatments || [];
      treatments.forEach((t: any, index: number) => addProduct(t, index, source, 'Treatment'));

      // Courses (Education)
      const courses = data?.inventory?.courses || data?.industrySpecificData?.coursesOffered || data?.fromTheWeb?.rawIndustryData?.courses || [];
      courses.forEach((c: any, index: number) => addProduct(c, index, source, 'Course'));

      // Packages/Plans
      const packages = data?.inventory?.packages || data?.packages || data?.plans || [];
      packages.forEach((pkg: any, index: number) => addProduct(pkg, index, source, 'Package'));
    };

    if (googleRawData) processProducts(googleRawData, 'google');
    if (websiteRawData) processProducts(websiteRawData, 'website');

    setProducts(allProducts);
  };

  const extractTestimonials = () => {
    const allTestimonials: EnrichedTestimonial[] = [];

    const processTestimonials = (data: any, source: FieldSource) => {
      const rawTestimonials = data?.testimonials || [];
      const reviews = data?.reviews || [];

      rawTestimonials.forEach((t: any, i: number) => {
        const quote = t.quote || t.text;
        if (quote) {
          allTestimonials.push({
            id: `${source}_testimonial_${i}`,
            quote,
            author: t.author || t.name,
            rating: t.rating,
            date: t.date,
            source,
            verified: t.verified,
            outcome: t.outcome,
            sentiment: analyzeSentiment(quote),
            keywords: t.keywords || [],
            selected: true,
            highlighted: (t.rating === 5 && t.outcome) || false,
          });
        }
      });

      reviews.forEach((r: any, i: number) => {
        if (r.text) {
          let reviewDate: string | undefined;
          try {
            if (r.time && typeof r.time === 'number' && r.time > 0) {
              const date = new Date(r.time * 1000);
              if (!isNaN(date.getTime())) {
                reviewDate = date.toISOString();
              }
            }
          } catch {
            reviewDate = undefined;
          }

          allTestimonials.push({
            id: `${source}_review_${i}`,
            quote: r.text,
            author: r.authorName || r.author,
            rating: r.rating,
            date: reviewDate,
            source,
            verified: true,
            outcome: undefined,
            sentiment: analyzeSentiment(r.text),
            keywords: [],
            selected: true,
            highlighted: r.rating === 5,
          });
        }
      });
    };

    if (googleRawData) processTestimonials(googleRawData, 'google');
    if (websiteRawData) processTestimonials(websiteRawData, 'website');

    setTestimonials(allTestimonials);
  };

  const generateSuggestions = () => {
    // Generate AI suggestions based on imported data
    const newSuggestions: AISuggestion[] = [];

    // Check tagline
    const tagline = mergeFields.find((f) => f.key === 'identity.tagline')?.finalValue;
    if (tagline && typeof tagline === 'string') {
      newSuggestions.push({
        id: 's1',
        type: 'improvement',
        priority: 'high',
        title: 'Strengthen Your Tagline',
        field: 'identity.tagline',
        current: tagline,
        suggested: tagline.includes('98%') ? tagline : `${tagline} | 98% Success Rate`,
        reason: 'Include specific numbers for credibility and trust.',
        category: 'core',
        applied: false,
      });
    }

    // Check for neutral reviews
    const neutralReviews = testimonials.filter((t) => t.sentiment === 'neutral');
    if (neutralReviews.length > 0) {
      newSuggestions.push({
        id: 's2',
        type: 'gap',
        priority: 'high',
        title: 'Respond to Neutral Reviews',
        current: `${neutralReviews.length} reviews need responses`,
        suggested: 'Add thoughtful responses to address concerns',
        reason: '53% of customers expect businesses to respond to reviews.',
        category: 'testimonials',
        applied: false,
      });
    }

    // Check for testimonials with outcomes
    const testimonialsWithOutcome = testimonials.filter((t) => t.outcome);
    if (testimonialsWithOutcome.length >= 2) {
      newSuggestions.push({
        id: 's3',
        type: 'highlight',
        priority: 'high',
        title: 'Feature Success Stories',
        current: `${testimonialsWithOutcome.length} testimonials with outcomes`,
        suggested: 'Create a dedicated success stories section',
        reason: 'Success stories address ROI concerns and build trust.',
        category: 'testimonials',
        applied: false,
      });
    }

    // Check for video testimonials
    newSuggestions.push({
      id: 's4',
      type: 'missing',
      priority: 'medium',
      title: 'Add Video Testimonials',
      current: 'No videos',
      suggested: 'Record 3-5 video testimonials from happy customers',
      reason: 'Video testimonials have 2x conversion impact.',
      category: 'testimonials',
      applied: false,
    });

    setSuggestions(newSuggestions);
  };

  // ========================================
  // GOOGLE SEARCH
  // ========================================

  const handleGoogleSearchChange = useCallback(async (value: string) => {
    setGoogleSearch(value);
    setSelectedPlace(null);
    setGoogleSearchError(null);

    if (value.length < 3) {
      setGoogleResults([]);
      return;
    }

    setGoogleSearching(true);
    try {
      console.log('[ImportCenter] Searching for:', value);
      const result = await searchBusinessesAction(value);
      console.log('[ImportCenter] Search result:', { success: result.success, status: result.status, resultsCount: result.results?.length, error: result.error });

      if (!result.success) {
        setGoogleSearchError(result.error || 'Search failed');
        setGoogleResults([]);
        toast.error(result.error || 'Search failed');
      } else if (result.results && result.results.length > 0) {
        setGoogleResults(result.results);
        setGoogleSearchError(null);
      } else {
        setGoogleResults([]);
        // Show feedback for empty results
        if (result.status === 'ZERO_RESULTS') {
          setGoogleSearchError('No businesses found. Try a different search term.');
        } else if (result.status === 'OK') {
          // API returned OK but no predictions
          setGoogleSearchError('No matching businesses found. Try a more specific name or location.');
        }
      }
    } catch (err: any) {
      console.error('Search error:', err);
      setGoogleSearchError(err.message || 'Search failed');
      toast.error('Search failed. Please try again.');
    } finally {
      setGoogleSearching(false);
    }
  }, []);

  // ========================================
  // IMPORT HANDLERS
  // ========================================

  const handleGoogleImport = async () => {
    if (!selectedPlace || !partnerId) {
      toast.error('Please select a business first');
      return;
    }

    setImporting('google');
    try {
      const result = await autoFillProfileAction(selectedPlace.placeId);
      if (result.success && result.profile) {
        setGoogleRawData(result.profile);
        setGoogleImported(true);

        // Auto-save to Firestore
        const placeName = selectedPlace.mainText || selectedPlace.name || selectedPlace.description;
        const importedDataUpdate = {
          importedData: {
            ...(persona.importedData || {}),
            google: {
              rawData: result.profile,
              importedAt: new Date().toISOString(),
              placeName,
              placeId: selectedPlace.placeId,
            },
          },
          importHistory: {
            ...persona.importHistory,
            google: {
              lastImportedAt: new Date(),
              placeId: selectedPlace.placeId,
              placeName,
              status: 'success' as const,
            },
          },
        };

        await saveBusinessPersonaAction(partnerId, importedDataUpdate as any);
        setPersona((prev) => ({ ...prev, ...importedDataUpdate }));
        toast.success('Imported from Google successfully!');
      } else {
        toast.error(result.error || 'Failed to import from Google');
      }
    } catch (err: any) {
      toast.error(err.message || 'Import failed');
    } finally {
      setImporting(null);
    }
  };

  const handleWebsiteImport = async () => {
    if (!websiteUrl.trim() || !partnerId) {
      toast.error('Please enter a website URL');
      return;
    }

    setImporting('website');
    setWebsiteError(null);
    try {
      const result = await scrapeWebsiteAction(websiteUrl, {
        includeSubpages: true,
        maxPages: 5,
      });

      if (!result.success || !result.profile) {
        setWebsiteError(result.error || 'Failed to import from website');
        toast.error(result.error || 'Failed to import from website');
        return;
      }

      setWebsiteRawData(result.profile);
      setWebsiteImported(true);

      // Auto-save to Firestore
      const importedDataUpdate = {
        importedData: {
          ...(persona.importedData || {}),
          website: {
            rawData: result.profile,
            importedAt: new Date().toISOString(),
            url: websiteUrl,
            pagesScraped: result.pagesScraped,
          },
        },
        importHistory: {
          ...persona.importHistory,
          website: {
            lastImportedAt: new Date(),
            url: websiteUrl,
            pagesScraped: result.pagesScraped,
            status: 'success' as const,
          },
        },
      };

      await saveBusinessPersonaAction(partnerId, importedDataUpdate as any);
      setPersona((prev) => ({ ...prev, ...importedDataUpdate }));
      toast.success(`Imported from ${result.pagesScraped?.length || 1} pages!`);
    } catch (err: any) {
      setWebsiteError(err.message || 'Failed to import');
      toast.error('Failed to import from website');
    } finally {
      setImporting(null);
    }
  };

  const handleGoogleClear = async () => {
    if (!partnerId) return;

    setGoogleImported(false);
    setGoogleSearch('');
    setSelectedPlace(null);
    setGoogleResults([]);
    setGoogleRawData(null);
    setGoogleSearchError(null);

    // Update Firestore
    const updated = {
      importedData: {
        ...(persona.importedData || {}),
        google: null,
      },
    };
    await saveBusinessPersonaAction(partnerId, updated as any);
    setPersona((prev) => ({ ...prev, ...updated }));
    toast.success('Google import cleared');
  };

  const handleWebsiteClear = async () => {
    if (!partnerId) return;

    setWebsiteImported(false);
    setWebsiteUrl('');
    setWebsiteRawData(null);
    setWebsiteError(null);

    // Update Firestore
    const updated = {
      importedData: {
        ...(persona.importedData || {}),
        website: null,
      },
    };
    await saveBusinessPersonaAction(partnerId, updated as any);
    setPersona((prev) => ({ ...prev, ...updated }));
    toast.success('Website import cleared');
  };

  // ========================================
  // MERGE HANDLERS
  // ========================================

  const handleSelectSource = (fieldKey: string, source: FieldSource) => {
    setMergeFields((prev) =>
      prev.map((f) =>
        f.key === fieldKey
          ? {
              ...f,
              selectedSource: source,
              finalValue: source === 'google' ? f.googleValue : f.websiteValue,
            }
          : f
      )
    );
  };

  const handleStartEdit = (field: MergeField) => {
    setEditingField(field.key);
    setEditValue(Array.isArray(field.finalValue) ? field.finalValue.join(', ') : field.finalValue || '');
  };

  const handleSaveEdit = (fieldKey: string) => {
    setMergeFields((prev) =>
      prev.map((f) =>
        f.key === fieldKey
          ? { ...f, finalValue: editValue, selectedSource: 'custom' as FieldSource }
          : f
      )
    );
    setEditingField(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  // ========================================
  // PRODUCT HANDLERS
  // ========================================

  const handleToggleProduct = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p))
    );
  };

  const handleSelectAllProducts = () => {
    setProducts((prev) => prev.map((p) => ({ ...p, selected: true })));
  };

  // ========================================
  // TESTIMONIAL HANDLERS
  // ========================================

  const handleToggleTestimonial = (id: string) => {
    setTestimonials((prev) =>
      prev.map((t) => (t.id === id ? { ...t, selected: !t.selected } : t))
    );
  };

  const handleHighlightTestimonial = (id: string) => {
    setTestimonials((prev) =>
      prev.map((t) => (t.id === id ? { ...t, highlighted: !t.highlighted } : t))
    );
  };

  const handleSelectPositive = () => {
    setTestimonials((prev) =>
      prev.map((t) => ({ ...t, selected: t.sentiment === 'positive' }))
    );
  };

  const handleFeatureBest = () => {
    setTestimonials((prev) =>
      prev.map((t) => ({ ...t, highlighted: t.rating === 5 && Boolean(t.outcome) }))
    );
  };

  // ========================================
  // AI SUGGESTION HANDLERS
  // ========================================

  const handleApplySuggestion = (id: string) => {
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, applied: true } : s))
    );
  };

  const handleDismissSuggestion = (id: string) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
  };

  const handleApplyAllHighPriority = () => {
    const highPriority = suggestions.filter((s) => s.priority === 'high' && !s.applied);
    highPriority.forEach((s) => handleApplySuggestion(s.id));
  };

  // ========================================
  // APPLY TO PROFILE
  // ========================================

  const handleApplyToProfile = async (selectedTags?: string[]) => {
    if (!partnerId) {
      toast.error('Partner ID not found');
      return;
    }

    setIsApplying(true);
    try {
      // Build payload from merge fields
      const updates: any = {};

      mergeFields.forEach((field) => {
        if (field.finalValue) {
          const pathParts = field.key.split('.');
          let current = updates;

          for (let i = 0; i < pathParts.length - 1; i++) {
            if (!current[pathParts[i]]) {
              current[pathParts[i]] = {};
            }
            current = current[pathParts[i]];
          }
          current[pathParts[pathParts.length - 1]] = field.finalValue;
        }
      });

      // Add selected products
      const selectedProducts = products.filter((p) => p.selected);
      if (selectedProducts.length > 0) {
        updates.knowledge = updates.knowledge || {};
        updates.knowledge.productsOrServices = selectedProducts.map((p) => ({
          name: p.name,
          description: p.description,
          category: p.category,
          price: p.pricing,
          features: p.features,
          featured: p.popular,
        }));
      }

      // Add selected testimonials
      const selectedTestimonials = testimonials.filter((t) => t.selected);
      if (selectedTestimonials.length > 0) {
        updates.testimonials = selectedTestimonials.map((t) => ({
          quote: t.quote,
          author: t.author,
          rating: t.rating,
          date: t.date,
          source: t.source,
          highlighted: t.highlighted,
          outcome: t.outcome,
        }));
      }

      // Add AI-suggested tags
      if (selectedTags && selectedTags.length > 0) {
        updates.tags = selectedTags;
      }

      // Add import metadata
      updates.importHistory = {
        ...persona.importHistory,
        lastAppliedAt: new Date(),
        appliedFields: mergeFields.filter((f) => f.finalValue).map((f) => f.key),
        appliedProducts: selectedProducts.length,
        appliedTestimonials: selectedTestimonials.length,
        appliedSuggestions: suggestions.filter((s) => s.applied).map((s) => s.id),
        appliedTags: selectedTags?.length || 0,
      };

      // Also use AI-powered transformation if available
      const rawMergedData = {
        ...googleRawData,
        ...websiteRawData,
      };

      const transformResult = await applyImportToProfileAction(rawMergedData, persona);

      if (transformResult.success && transformResult.profile) {
        // Merge AI-transformed data with manual selections
        const finalUpdates = {
          ...transformResult.profile,
          ...updates,
          identity: {
            ...transformResult.profile.identity,
            ...updates.identity,
          },
          personality: {
            ...transformResult.profile.personality,
            ...updates.personality,
          },
          knowledge: {
            ...transformResult.profile.knowledge,
            ...updates.knowledge,
          },
        };

        await saveBusinessPersonaAction(partnerId, finalUpdates);
      } else {
        // Fall back to just manual updates
        await saveBusinessPersonaAction(partnerId, updates);
      }

      setApplied(true);
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to apply to profile');
    } finally {
      setIsApplying(false);
    }
  };

  // ========================================
  // COMPUTED VALUES
  // ========================================

  const googleStats: ImportStats = useMemo(() => {
    if (!googleRawData) return { fields: 0, products: 0, testimonials: 0 };

    // Count actual fields with values
    const countFields = (obj: any, prefix = ''): number => {
      if (!obj || typeof obj !== 'object') return obj ? 1 : 0;
      if (Array.isArray(obj)) return obj.length > 0 ? 1 : 0;
      return Object.entries(obj).reduce((count, [key, val]) => {
        if (val !== null && val !== undefined && val !== '') {
          if (typeof val === 'object' && !Array.isArray(val)) {
            return count + countFields(val, `${prefix}${key}.`);
          }
          return count + 1;
        }
        return count;
      }, 0);
    };

    const fieldCount = countFields(googleRawData.identity) +
      countFields(googleRawData.personality) +
      countFields(googleRawData.customerProfile) +
      countFields(googleRawData.knowledge) +
      countFields(googleRawData.industrySpecificData);

    // Count products from all inventory types
    const productCount = (googleRawData.knowledge?.productsOrServices || []).length +
      (googleRawData.inventory?.rooms || []).length +
      (googleRawData.inventory?.menuItems || []).length +
      (googleRawData.inventory?.services || []).length +
      (googleRawData.inventory?.properties || []).length +
      (googleRawData.products || []).length;

    const testimonialCount = (googleRawData.reviews || []).length +
      (googleRawData.testimonials || []).length;

    return { fields: fieldCount || 10, products: productCount, testimonials: testimonialCount };
  }, [googleRawData]);

  const websiteStats: ImportStats = useMemo(() => {
    if (!websiteRawData) return { fields: 0, products: 0, testimonials: 0 };

    // Count actual fields with values
    const countFields = (obj: any): number => {
      if (!obj || typeof obj !== 'object') return obj ? 1 : 0;
      if (Array.isArray(obj)) return obj.length > 0 ? 1 : 0;
      return Object.entries(obj).reduce((count, [key, val]) => {
        if (val !== null && val !== undefined && val !== '') {
          if (typeof val === 'object' && !Array.isArray(val)) {
            return count + countFields(val);
          }
          return count + 1;
        }
        return count;
      }, 0);
    };

    const fieldCount = countFields(websiteRawData.identity) +
      countFields(websiteRawData.personality) +
      countFields(websiteRawData.customerProfile) +
      countFields(websiteRawData.knowledge) +
      countFields(websiteRawData.industrySpecificData);

    // Count products from all inventory types
    const productCount = (websiteRawData.knowledge?.productsOrServices || []).length +
      (websiteRawData.inventory?.rooms || []).length +
      (websiteRawData.inventory?.menuItems || []).length +
      (websiteRawData.inventory?.services || []).length +
      (websiteRawData.inventory?.properties || []).length +
      (websiteRawData.products || []).length;

    const testimonialCount = (websiteRawData.testimonials || []).length;

    return { fields: fieldCount || 18, products: productCount, testimonials: testimonialCount };
  }, [websiteRawData]);

  const conflictCount = mergeFields.filter((f) => f.hasConflict).length;
  const resolvedCount = mergeFields.filter((f) => f.hasConflict && f.selectedSource !== 'none').length;
  const hasUnresolvedConflicts = conflictCount > resolvedCount;
  const filledFields = mergeFields.filter((f) => f.finalValue).length;

  const selectedProducts = products.filter((p) => p.selected);
  const selectedTestimonials = testimonials.filter((t) => t.selected);
  const appliedSuggestions = suggestions.filter((s) => s.applied);
  const pendingSuggestions = suggestions.filter((s) => !s.applied);
  const highPrioritySuggestions = pendingSuggestions.filter((s) => s.priority === 'high');

  const canProceed = googleImported || websiteImported;

  // ========================================
  // TAB CONFIG
  // ========================================

  const tabs = [
    { id: 'import' as ImportCenterTab, label: 'Import', icon: Download, badge: null },
    {
      id: 'merge' as ImportCenterTab,
      label: 'Review',
      icon: GitMerge,
      badge: conflictCount > 0 ? conflictCount : null,
      badgeType: hasUnresolvedConflicts ? 'warning' : 'success',
    },
    { id: 'products' as ImportCenterTab, label: 'Products', icon: Package, badge: selectedProducts.length },
    { id: 'testimonials' as ImportCenterTab, label: 'Testimonials', icon: Quote, badge: selectedTestimonials.length },
    {
      id: 'ai' as ImportCenterTab,
      label: 'AI',
      icon: Wand2,
      badge: highPrioritySuggestions.length,
      highlight: true,
    },
    { id: 'final' as ImportCenterTab, label: 'Apply', icon: Rocket, highlight: true },
  ];

  // ========================================
  // RENDER
  // ========================================

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (applied) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
        <SuccessScreen
          stats={{
            fields: filledFields,
            products: selectedProducts.length,
            testimonials: selectedTestimonials.length,
          }}
          onReset={() => setApplied(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/partner/settings')}
                className="p-2 hover:bg-slate-100 rounded-xl"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-slate-900">Import Center</h1>
                <p className="text-xs text-slate-500">
                  {partnerCountry && `${partnerCountry}`}
                  {partnerIndustry && ` • ${partnerIndustry}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {canProceed && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-sm text-emerald-700 font-medium">Saved</span>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 -mb-px overflow-x-auto pb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                disabled={tab.id !== 'import' && !canProceed}
                className={`px-3 py-3 text-sm font-medium border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? tab.highlight
                      ? 'border-purple-600 text-purple-600'
                      : 'border-indigo-600 text-indigo-600'
                    : tab.id !== 'import' && !canProceed
                      ? 'border-transparent text-slate-300 cursor-not-allowed'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.badge !== null && tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                      tab.badgeType === 'warning'
                        ? 'bg-amber-100 text-amber-700'
                        : tab.highlight
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'import' && (
          <ImportTab
            googleImported={googleImported}
            websiteImported={websiteImported}
            googleSearch={googleSearch}
            websiteUrl={websiteUrl}
            importing={importing}
            googleStats={googleStats}
            websiteStats={websiteStats}
            googleResults={googleResults}
            searching={googleSearching}
            selectedPlace={selectedPlace}
            googleSearchError={googleSearchError}
            websiteError={websiteError}
            onGoogleSearchChange={handleGoogleSearchChange}
            onWebsiteUrlChange={setWebsiteUrl}
            onGoogleImport={handleGoogleImport}
            onWebsiteImport={handleWebsiteImport}
            onGoogleClear={handleGoogleClear}
            onWebsiteClear={handleWebsiteClear}
            onSelectPlace={setSelectedPlace}
            onProceed={() => setActiveTab('merge')}
            conflictCount={conflictCount}
            filledFields={filledFields}
          />
        )}

        {activeTab === 'merge' && (
          <ReviewTab
            mergeFields={mergeFields}
            conflictCount={conflictCount}
            resolvedCount={resolvedCount}
            editingField={editingField}
            editValue={editValue}
            onSelectSource={handleSelectSource}
            onStartEdit={handleStartEdit}
            onEditChange={setEditValue}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={handleCancelEdit}
          />
        )}

        {activeTab === 'products' && (
          <ProductsTab
            products={products}
            onToggleProduct={handleToggleProduct}
            onSelectAll={handleSelectAllProducts}
            onAddProducts={(newProducts) => setProducts(prev => [...prev, ...newProducts])}
          />
        )}

        {activeTab === 'testimonials' && (
          <TestimonialsTab
            testimonials={testimonials}
            onToggleTestimonial={handleToggleTestimonial}
            onHighlightTestimonial={handleHighlightTestimonial}
            onSelectPositive={handleSelectPositive}
            onFeatureBest={handleFeatureBest}
          />
        )}

        {activeTab === 'ai' && (
          <AISuggestionsTab
            suggestions={suggestions}
            filter={suggestionFilter}
            onFilterChange={setSuggestionFilter}
            onApplySuggestion={handleApplySuggestion}
            onDismissSuggestion={handleDismissSuggestion}
            onApplyAllHighPriority={handleApplyAllHighPriority}
          />
        )}

        {activeTab === 'final' && (
          <ApplyTab
            mergeFields={mergeFields}
            products={products}
            testimonials={testimonials}
            suggestions={suggestions}
            expandedSections={expandedSections}
            hasUnresolvedConflicts={hasUnresolvedConflicts}
            highPrioritySuggestions={highPrioritySuggestions}
            isApplying={isApplying}
            onToggleSection={(section) =>
              setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
            }
            onNavigateToTab={setActiveTab}
            onApply={handleApplyToProfile}
          />
        )}
      </div>
    </div>
  );
}
