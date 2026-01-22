// src/lib/field-registry.ts
// Canonical Field Registry - Single source of truth for all business data fields
// This file defines field mappings, transforms, and utilities for the Import Center

import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { parseAddress, parseOperatingHoursFromGoogle } from '@/lib/business-data-parsers';
import type { BusinessPersona, BusinessAddress, OperatingHours } from '@/lib/business-persona-types';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type ImportSource = 'google' | 'website' | 'manual' | 'csv' | 'api';

export type FieldCategory =
  | 'identity'
  | 'contact'
  | 'social'
  | 'brand'
  | 'audience'
  | 'competitive'
  | 'credentials'
  | 'team'
  | 'industry'
  | 'success'
  | 'knowledge';

export type FieldTransform =
  | 'address'
  | 'operatingHours'
  | 'socialMedia'
  | 'industry'
  | 'phoneNumber'
  | 'currency'
  | 'stringArray'
  | 'objectArray';

export interface FieldDefinition {
  targetPath: string;
  label: string;
  category: FieldCategory;
  iconName: string;
  critical?: boolean;
  multiline?: boolean;
  sourcePaths: string[];
  transform?: FieldTransform;
  industries?: string[];
  countries?: string[];
  subCategories?: string[];
}

export interface ImportedFieldValue {
  value: any;
  source: ImportSource;
  confidence?: number;
  extractedAt: string;
  rawPath?: string;
}

export interface MergeField {
  definition: FieldDefinition;
  values: Partial<Record<ImportSource, any>>;
  selectedSource: ImportSource | 'custom' | 'none';
  finalValue: any;
  customValue?: any;
  hasConflict: boolean;
}

export interface TransformContext {
  country?: string;
  industry?: string;
  subCategory?: string;
}

export interface TaxonomyFilter {
  industry?: string;
  country?: string;
  subCategory?: string;
}

export interface ImportMetadata {
  importedAt: string;
  sources: ImportSource[];
  fieldsUpdated: number;
  productsImported: number;
  testimonialsImported: number;
  fieldSources: Record<string, {
    source: ImportSource;
    importedAt: string;
    confidence?: number;
  }>;
}

export interface CategoryConfig {
  id: FieldCategory;
  label: string;
  iconName: string;
  color: string;
  description: string;
}

// =============================================================================
// CATEGORY CONFIGURATION
// =============================================================================

export const CATEGORY_CONFIG: CategoryConfig[] = [
  {
    id: 'identity',
    label: 'Business Identity',
    iconName: 'Building2',
    color: 'blue',
    description: 'Core business information like name, description, and industry',
  },
  {
    id: 'contact',
    label: 'Contact & Location',
    iconName: 'MapPin',
    color: 'green',
    description: 'Phone, email, address, and operating hours',
  },
  {
    id: 'social',
    label: 'Social Media',
    iconName: 'Share2',
    color: 'purple',
    description: 'Social media profiles and online presence',
  },
  {
    id: 'brand',
    label: 'Brand & Messaging',
    iconName: 'Sparkles',
    color: 'amber',
    description: 'Mission, vision, values, and brand story',
  },
  {
    id: 'audience',
    label: 'Target Audience',
    iconName: 'Users',
    color: 'cyan',
    description: 'Customer demographics and pain points',
  },
  {
    id: 'competitive',
    label: 'Competitive Position',
    iconName: 'Target',
    color: 'red',
    description: 'Differentiators and market positioning',
  },
  {
    id: 'credentials',
    label: 'Credentials',
    iconName: 'Award',
    color: 'yellow',
    description: 'Certifications, awards, and accreditations',
  },
  {
    id: 'team',
    label: 'Team',
    iconName: 'UserCircle',
    color: 'indigo',
    description: 'Team members and key people',
  },
  {
    id: 'industry',
    label: 'Industry Specific',
    iconName: 'Briefcase',
    color: 'slate',
    description: 'Industry-specific fields and data',
  },
  {
    id: 'success',
    label: 'Success Stories',
    iconName: 'Trophy',
    color: 'emerald',
    description: 'Case studies, stats, and notable clients',
  },
  {
    id: 'knowledge',
    label: 'Knowledge Base',
    iconName: 'BookOpen',
    color: 'orange',
    description: 'Products, services, FAQs, and policies',
  },
];

// =============================================================================
// FIELD REGISTRY
// =============================================================================

export const FIELD_REGISTRY: FieldDefinition[] = [
  // ---------------------------------------------------------------------------
  // IDENTITY FIELDS (Universal)
  // ---------------------------------------------------------------------------
  {
    targetPath: 'identity.name',
    label: 'Business Name',
    category: 'identity',
    iconName: 'Building2',
    critical: true,
    sourcePaths: [
      'identity.name',
      'identity.businessName',
      'name',
      'businessName',
      'displayName',
      'title',
      'companyName',
    ],
  },
  {
    targetPath: 'identity.legalName',
    label: 'Legal Name',
    category: 'identity',
    iconName: 'FileText',
    sourcePaths: [
      'identity.legalName',
      'legalName',
      'registeredName',
      'corporateName',
    ],
  },
  {
    targetPath: 'personality.tagline',
    label: 'Tagline',
    category: 'identity',
    iconName: 'MessageSquare',
    critical: true,
    sourcePaths: [
      'personality.tagline',
      'identity.tagline',
      'tagline',
      'slogan',
      'motto',
      'catchphrase',
    ],
  },
  {
    targetPath: 'personality.description',
    label: 'Business Description',
    category: 'identity',
    iconName: 'AlignLeft',
    critical: true,
    multiline: true,
    sourcePaths: [
      'personality.description',
      'identity.description',
      'description',
      'about',
      'summary',
      'overview',
      'businessDescription',
      'companyDescription',
    ],
  },
  // FIX #1: Changed from 'industry' to 'identity.industry' to match UI schema
  {
    targetPath: 'identity.industry',
    label: 'Industry',
    category: 'identity',
    iconName: 'Briefcase',
    critical: true,
    transform: 'industry',
    sourcePaths: [
      'identity.industry',
      'industry',
      'businessCategory',
      'category',
      'primaryCategory',
      'types',
      'industryType',
    ],
  },
  // FIX #2: Changed from 'identity.yearEstablished' to 'identity.foundedYear' to match UI schema
  {
    targetPath: 'identity.foundedYear',
    label: 'Year Established',
    category: 'identity',
    iconName: 'Calendar',
    sourcePaths: [
      'identity.foundedYear',
      'identity.yearEstablished',
      'yearEstablished',
      'foundedYear',
      'established',
      'personality.foundedYear',
      'since',
    ],
  },
  {
    targetPath: 'identity.founders',
    label: 'Founders',
    category: 'identity',
    iconName: 'Users',
    transform: 'stringArray',
    sourcePaths: [
      'identity.founders',
      'founders',
      'foundedBy',
      'founder',
    ],
  },
  {
    targetPath: 'identity.teamSize',
    label: 'Team Size',
    category: 'identity',
    iconName: 'Users',
    sourcePaths: [
      'identity.teamSize',
      'teamSize',
      'employeeCount',
      'employees',
      'staff',
      'numberOfEmployees',
    ],
  },
  // FIX #3: Changed from 'identity.languages' to 'personality.languagePreference' to match UI schema
  {
    targetPath: 'personality.languagePreference',
    label: 'Languages Spoken',
    category: 'identity',
    iconName: 'Globe',
    transform: 'stringArray',
    sourcePaths: [
      'personality.languagePreference',
      'identity.languages',
      'languages',
      'languagesSpoken',
      'supportedLanguages',
    ],
  },
  {
    targetPath: 'identity.timezone',
    label: 'Timezone',
    category: 'identity',
    iconName: 'Clock',
    sourcePaths: [
      'identity.timezone',
      'timezone',
      'timeZone',
      'tz',
    ],
  },

  // ---------------------------------------------------------------------------
  // CONTACT FIELDS (Universal)
  // ---------------------------------------------------------------------------
  {
    targetPath: 'identity.phone',
    label: 'Phone Number',
    category: 'contact',
    iconName: 'Phone',
    critical: true,
    transform: 'phoneNumber',
    sourcePaths: [
      'identity.phone',
      'phone',
      'phoneNumber',
      'telephone',
      'contact.phone',
      'nationalPhoneNumber',
      'internationalPhoneNumber',
      'formattedPhoneNumber',
    ],
  },
  {
    targetPath: 'identity.email',
    label: 'Email Address',
    category: 'contact',
    iconName: 'Mail',
    critical: true,
    sourcePaths: [
      'identity.email',
      'email',
      'emailAddress',
      'contact.email',
      'businessEmail',
    ],
  },
  {
    targetPath: 'identity.website',
    label: 'Website',
    category: 'contact',
    iconName: 'Globe',
    critical: true,
    sourcePaths: [
      'identity.website',
      'website',
      'websiteUri',
      'url',
      'websiteUrl',
      'siteUrl',
    ],
  },
  {
    targetPath: 'identity.whatsAppNumber',
    label: 'WhatsApp Number',
    category: 'contact',
    iconName: 'MessageCircle',
    transform: 'phoneNumber',
    sourcePaths: [
      'identity.whatsAppNumber',
      'whatsAppNumber',
      'whatsapp',
      'whatsApp',
    ],
  },
  {
    targetPath: 'identity.address',
    label: 'Address',
    category: 'contact',
    iconName: 'MapPin',
    critical: true,
    transform: 'address',
    sourcePaths: [
      'identity.address',
      'address',
      'formattedAddress',
      'location',
      'businessAddress',
      'addressComponents',
      'adrFormatAddress',
    ],
  },
  {
    targetPath: 'identity.operatingHours',
    label: 'Operating Hours',
    category: 'contact',
    iconName: 'Clock',
    transform: 'operatingHours',
    sourcePaths: [
      'identity.operatingHours',
      'operatingHours',
      'hours',
      'openingHours',
      'businessHours',
      'regularOpeningHours',
      'currentOpeningHours',
    ],
  },
  {
    targetPath: 'identity.googleMapsUrl',
    label: 'Google Maps URL',
    category: 'contact',
    iconName: 'Map',
    sourcePaths: [
      'identity.googleMapsUrl',
      'googleMapsUrl',
      'googleMapsUri',
      'mapsUrl',
      'googleMapsLink',
    ],
  },
  {
    targetPath: 'identity.plusCode',
    label: 'Plus Code',
    category: 'contact',
    iconName: 'Hash',
    sourcePaths: [
      'identity.plusCode',
      'plusCode',
      'plusCode.globalCode',
      'plusCode.compoundCode',
    ],
  },

  // ---------------------------------------------------------------------------
  // SOCIAL MEDIA FIELDS (Universal)
  // ---------------------------------------------------------------------------
  {
    targetPath: 'identity.socialMedia.instagram',
    label: 'Instagram',
    category: 'social',
    iconName: 'Instagram',
    transform: 'socialMedia',
    sourcePaths: [
      'identity.socialMedia.instagram',
      'socialMedia.instagram',
      'instagram',
      'instagramUrl',
      'onlinePresence.instagram',
    ],
  },
  {
    targetPath: 'identity.socialMedia.facebook',
    label: 'Facebook',
    category: 'social',
    iconName: 'Facebook',
    transform: 'socialMedia',
    sourcePaths: [
      'identity.socialMedia.facebook',
      'socialMedia.facebook',
      'facebook',
      'facebookUrl',
      'onlinePresence.facebook',
    ],
  },
  {
    targetPath: 'identity.socialMedia.linkedin',
    label: 'LinkedIn',
    category: 'social',
    iconName: 'Linkedin',
    transform: 'socialMedia',
    sourcePaths: [
      'identity.socialMedia.linkedin',
      'socialMedia.linkedin',
      'linkedin',
      'linkedinUrl',
      'onlinePresence.linkedin',
    ],
  },
  {
    targetPath: 'identity.socialMedia.twitter',
    label: 'Twitter/X',
    category: 'social',
    iconName: 'Twitter',
    transform: 'socialMedia',
    sourcePaths: [
      'identity.socialMedia.twitter',
      'socialMedia.twitter',
      'twitter',
      'twitterUrl',
      'x',
      'onlinePresence.twitter',
    ],
  },
  {
    targetPath: 'identity.socialMedia.youtube',
    label: 'YouTube',
    category: 'social',
    iconName: 'Youtube',
    transform: 'socialMedia',
    sourcePaths: [
      'identity.socialMedia.youtube',
      'socialMedia.youtube',
      'youtube',
      'youtubeUrl',
      'onlinePresence.youtube',
    ],
  },
  {
    targetPath: 'identity.socialMedia.googleBusiness',
    label: 'Google Business',
    category: 'social',
    iconName: 'Store',
    sourcePaths: [
      'identity.socialMedia.googleBusiness',
      'socialMedia.googleBusiness',
      'googleBusiness',
      'googleBusinessUrl',
      'googleMapsUri',
    ],
  },

  // ---------------------------------------------------------------------------
  // BRAND & MESSAGING FIELDS (Universal)
  // ---------------------------------------------------------------------------
  {
    targetPath: 'personality.missionStatement',
    label: 'Mission Statement',
    category: 'brand',
    iconName: 'Target',
    multiline: true,
    sourcePaths: [
      'personality.missionStatement',
      'missionStatement',
      'mission',
      'ourMission',
    ],
  },
  {
    targetPath: 'personality.visionStatement',
    label: 'Vision Statement',
    category: 'brand',
    iconName: 'Eye',
    multiline: true,
    sourcePaths: [
      'personality.visionStatement',
      'visionStatement',
      'vision',
      'ourVision',
    ],
  },
  {
    targetPath: 'personality.brandValues',
    label: 'Core Values',
    category: 'brand',
    iconName: 'Heart',
    transform: 'stringArray',
    sourcePaths: [
      'personality.brandValues',
      'brandValues',
      'coreValues',
      'values',
      'ourValues',
    ],
  },
  {
    targetPath: 'personality.uniqueSellingPoints',
    label: 'Unique Selling Points',
    category: 'brand',
    iconName: 'Star',
    transform: 'stringArray',
    sourcePaths: [
      'personality.uniqueSellingPoints',
      'uniqueSellingPoints',
      'usps',
      'highlights',
      'keyFeatures',
      'whyChooseUs',
    ],
  },
  {
    targetPath: 'personality.brandStory',
    label: 'Brand Story',
    category: 'brand',
    iconName: 'BookOpen',
    multiline: true,
    sourcePaths: [
      'personality.brandStory',
      'brandStory',
      'ourStory',
      'aboutUs',
      'companyStory',
      'history',
    ],
  },
  {
    targetPath: 'personality.slogan',
    label: 'Slogan',
    category: 'brand',
    iconName: 'Quote',
    sourcePaths: [
      'personality.slogan',
      'slogan',
      'catchphrase',
      'brandSlogan',
    ],
  },

  // ---------------------------------------------------------------------------
  // AUDIENCE FIELDS (Universal)
  // ---------------------------------------------------------------------------
  {
    targetPath: 'customerProfile.targetAudience',
    label: 'Target Audience',
    category: 'audience',
    iconName: 'Users',
    multiline: true,
    sourcePaths: [
      'customerProfile.targetAudience',
      'targetAudience',
      'audience',
      'targetMarket',
      'idealCustomer',
    ],
  },
  {
    targetPath: 'customerProfile.customerDemographics',
    label: 'Customer Demographics',
    category: 'audience',
    iconName: 'BarChart2',
    multiline: true,
    sourcePaths: [
      'customerProfile.customerDemographics',
      'customerDemographics',
      'demographics',
      'customerProfile',
    ],
  },
  {
    targetPath: 'customerProfile.commonQueries',
    label: 'Common Customer Queries',
    category: 'audience',
    iconName: 'HelpCircle',
    transform: 'stringArray',
    sourcePaths: [
      'customerProfile.commonQueries',
      'commonQueries',
      'frequentQuestions',
      'customerQuestions',
    ],
  },
  {
    targetPath: 'customerProfile.customerPainPoints',
    label: 'Customer Pain Points',
    category: 'audience',
    iconName: 'AlertCircle',
    transform: 'stringArray',
    sourcePaths: [
      'customerProfile.customerPainPoints',
      'customerPainPoints',
      'painPoints',
      'challenges',
      'problems',
    ],
  },
  {
    targetPath: 'customerProfile.acquisitionChannels',
    label: 'Acquisition Channels',
    category: 'audience',
    iconName: 'TrendingUp',
    transform: 'stringArray',
    sourcePaths: [
      'customerProfile.acquisitionChannels',
      'acquisitionChannels',
      'marketingChannels',
      'leadSources',
    ],
  },

  // ---------------------------------------------------------------------------
  // COMPETITIVE POSITION FIELDS (Universal)
  // ---------------------------------------------------------------------------
  {
    targetPath: 'competitive.differentiators',
    label: 'Key Differentiators',
    category: 'competitive',
    iconName: 'Zap',
    transform: 'stringArray',
    sourcePaths: [
      'competitive.differentiators',
      'differentiators',
      'whatMakesUsDifferent',
      'uniqueFeatures',
    ],
  },
  {
    targetPath: 'competitive.competitiveAdvantages',
    label: 'Competitive Advantages',
    category: 'competitive',
    iconName: 'Shield',
    transform: 'stringArray',
    sourcePaths: [
      'competitive.competitiveAdvantages',
      'competitiveAdvantages',
      'advantages',
      'strengths',
    ],
  },
  {
    targetPath: 'competitive.marketPosition',
    label: 'Market Position',
    category: 'competitive',
    iconName: 'Compass',
    sourcePaths: [
      'competitive.marketPosition',
      'marketPosition',
      'positioning',
      'marketSegment',
    ],
  },
  {
    targetPath: 'competitive.priceLevel',
    label: 'Price Level',
    category: 'competitive',
    iconName: 'DollarSign',
    sourcePaths: [
      'competitive.priceLevel',
      'priceLevel',
      'priceRange',
      'priceTier',
      'pricing',
    ],
  },

  // ---------------------------------------------------------------------------
  // CREDENTIALS FIELDS (Universal)
  // ---------------------------------------------------------------------------
  {
    targetPath: 'knowledge.certifications',
    label: 'Certifications',
    category: 'credentials',
    iconName: 'Award',
    transform: 'stringArray',
    sourcePaths: [
      'knowledge.certifications',
      'certifications',
      'certificates',
      'credentials',
    ],
  },
  {
    targetPath: 'knowledge.awards',
    label: 'Awards',
    category: 'credentials',
    iconName: 'Trophy',
    transform: 'stringArray',
    sourcePaths: [
      'knowledge.awards',
      'awards',
      'honors',
      'recognition',
      'achievements',
    ],
  },
  {
    targetPath: 'knowledge.accreditations',
    label: 'Accreditations',
    category: 'credentials',
    iconName: 'CheckCircle',
    transform: 'stringArray',
    sourcePaths: [
      'knowledge.accreditations',
      'accreditations',
      'affiliations',
      'memberships',
    ],
  },
  {
    targetPath: 'knowledge.registrations',
    label: 'Registrations',
    category: 'credentials',
    iconName: 'FileCheck',
    transform: 'stringArray',
    sourcePaths: [
      'knowledge.registrations',
      'registrations',
      'licenses',
      'permits',
    ],
  },

  // ---------------------------------------------------------------------------
  // TEAM FIELDS (Universal)
  // ---------------------------------------------------------------------------
  {
    targetPath: 'team.teamMembers',
    label: 'Team Members',
    category: 'team',
    iconName: 'Users',
    transform: 'objectArray',
    sourcePaths: [
      'team.teamMembers',
      'teamMembers',
      'team',
      'staff',
      'employees',
    ],
  },
  {
    targetPath: 'team.keyPeople',
    label: 'Key People',
    category: 'team',
    iconName: 'UserCircle',
    transform: 'objectArray',
    sourcePaths: [
      'team.keyPeople',
      'keyPeople',
      'leadership',
      'management',
      'executives',
    ],
  },

  // ---------------------------------------------------------------------------
  // KNOWLEDGE FIELDS (Universal)
  // ---------------------------------------------------------------------------
  {
    targetPath: 'knowledge.productsOrServices',
    label: 'Services',
    category: 'knowledge',
    iconName: 'Briefcase',
    transform: 'objectArray',
    sourcePaths: [
      'knowledge.productsOrServices',
      'productsOrServices',
      'services',
      'offerings',
    ],
  },
  {
    targetPath: 'knowledge.products',
    label: 'Products',
    category: 'knowledge',
    iconName: 'Package',
    transform: 'objectArray',
    sourcePaths: [
      'knowledge.products',
      'products',
      'productCatalog',
      'items',
    ],
  },
  {
    targetPath: 'knowledge.acceptedPayments',
    label: 'Payment Methods',
    category: 'knowledge',
    iconName: 'CreditCard',
    transform: 'stringArray',
    sourcePaths: [
      'knowledge.acceptedPayments',
      'acceptedPayments',
      'paymentMethods',
      'paymentOptions',
      'payments',
    ],
  },
  {
    targetPath: 'knowledge.faqs',
    label: 'FAQs',
    category: 'knowledge',
    iconName: 'HelpCircle',
    transform: 'objectArray',
    sourcePaths: [
      'knowledge.faqs',
      'faqs',
      'faq',
      'frequentlyAskedQuestions',
    ],
  },

  // ---------------------------------------------------------------------------
  // COUNTRY-SPECIFIC FIELDS - INDIA (IN)
  // ---------------------------------------------------------------------------
  {
    targetPath: 'industrySpecificData.gstin',
    label: 'GSTIN',
    category: 'credentials',
    iconName: 'FileText',
    countries: ['IN'],
    sourcePaths: [
      'industrySpecificData.gstin',
      'gstin',
      'gstNumber',
      'gstIn',
    ],
  },
  {
    targetPath: 'industrySpecificData.pan',
    label: 'PAN',
    category: 'credentials',
    iconName: 'CreditCard',
    countries: ['IN'],
    sourcePaths: [
      'industrySpecificData.pan',
      'pan',
      'panNumber',
    ],
  },
  {
    targetPath: 'industrySpecificData.fssaiLicense',
    label: 'FSSAI License',
    category: 'credentials',
    iconName: 'ShieldCheck',
    countries: ['IN'],
    industries: ['food_beverage'],
    sourcePaths: [
      'industrySpecificData.fssaiLicense',
      'fssaiLicense',
      'fssai',
      'foodLicense',
    ],
  },
  {
    targetPath: 'industrySpecificData.drugLicense',
    label: 'Drug License',
    category: 'credentials',
    iconName: 'Pill',
    countries: ['IN'],
    industries: ['healthcare'],
    sourcePaths: [
      'industrySpecificData.drugLicense',
      'drugLicense',
      'pharmacyLicense',
    ],
  },
  {
    targetPath: 'industrySpecificData.reraNumber',
    label: 'RERA Number',
    category: 'credentials',
    iconName: 'Building',
    countries: ['IN'],
    industries: ['real_estate'],
    sourcePaths: [
      'industrySpecificData.reraNumber',
      'reraNumber',
      'rera',
      'reraRegistration',
    ],
  },
  {
    targetPath: 'industrySpecificData.upiId',
    label: 'UPI ID',
    category: 'contact',
    iconName: 'Smartphone',
    countries: ['IN'],
    sourcePaths: [
      'industrySpecificData.upiId',
      'upiId',
      'upi',
      'vpa',
    ],
  },

  // ---------------------------------------------------------------------------
  // COUNTRY-SPECIFIC FIELDS - USA (US)
  // ---------------------------------------------------------------------------
  {
    targetPath: 'industrySpecificData.ein',
    label: 'EIN',
    category: 'credentials',
    iconName: 'FileText',
    countries: ['US'],
    sourcePaths: [
      'industrySpecificData.ein',
      'ein',
      'employerIdentificationNumber',
      'federalTaxId',
    ],
  },
  {
    targetPath: 'industrySpecificData.stateTaxId',
    label: 'State Tax ID',
    category: 'credentials',
    iconName: 'FileText',
    countries: ['US'],
    sourcePaths: [
      'industrySpecificData.stateTaxId',
      'stateTaxId',
      'stateId',
    ],
  },
  {
    targetPath: 'industrySpecificData.npiNumber',
    label: 'NPI Number',
    category: 'credentials',
    iconName: 'Stethoscope',
    countries: ['US'],
    industries: ['healthcare'],
    sourcePaths: [
      'industrySpecificData.npiNumber',
      'npiNumber',
      'npi',
      'nationalProviderIdentifier',
    ],
  },
  {
    targetPath: 'industrySpecificData.realtorLicense',
    label: 'Realtor License',
    category: 'credentials',
    iconName: 'Home',
    countries: ['US'],
    industries: ['real_estate'],
    sourcePaths: [
      'industrySpecificData.realtorLicense',
      'realtorLicense',
      'realEstateLicense',
    ],
  },

  // ---------------------------------------------------------------------------
  // COUNTRY-SPECIFIC FIELDS - UAE (AE)
  // ---------------------------------------------------------------------------
  {
    targetPath: 'industrySpecificData.tradeLicense',
    label: 'Trade License',
    category: 'credentials',
    iconName: 'FileText',
    countries: ['AE'],
    sourcePaths: [
      'industrySpecificData.tradeLicense',
      'tradeLicense',
      'businessLicense',
    ],
  },
  {
    targetPath: 'industrySpecificData.trnNumber',
    label: 'TRN Number',
    category: 'credentials',
    iconName: 'Receipt',
    countries: ['AE'],
    sourcePaths: [
      'industrySpecificData.trnNumber',
      'trnNumber',
      'trn',
      'taxRegistrationNumber',
    ],
  },
  {
    targetPath: 'industrySpecificData.emiratesId',
    label: 'Emirates ID',
    category: 'credentials',
    iconName: 'IdCard',
    countries: ['AE'],
    sourcePaths: [
      'industrySpecificData.emiratesId',
      'emiratesId',
      'eid',
    ],
  },

  // ---------------------------------------------------------------------------
  // INDUSTRY-SPECIFIC FIELDS - HEALTHCARE
  // ---------------------------------------------------------------------------
  {
    targetPath: 'industrySpecificData.doctors',
    label: 'Doctors',
    category: 'team',
    iconName: 'Stethoscope',
    industries: ['healthcare'],
    transform: 'objectArray',
    sourcePaths: [
      'industrySpecificData.doctors',
      'doctors',
      'physicians',
      'medicalStaff',
    ],
  },
  {
    targetPath: 'industrySpecificData.facilities',
    label: 'Facilities',
    category: 'knowledge',
    iconName: 'Building2',
    industries: ['healthcare'],
    transform: 'stringArray',
    sourcePaths: [
      'industrySpecificData.facilities',
      'facilities',
      'equipment',
      'infrastructure',
    ],
  },
  {
    targetPath: 'industrySpecificData.bedCount',
    label: 'Bed Count',
    category: 'knowledge',
    iconName: 'BedDouble',
    industries: ['healthcare'],
    subCategories: ['hospital', 'clinic'],
    sourcePaths: [
      'industrySpecificData.bedCount',
      'bedCount',
      'beds',
      'numberOfBeds',
    ],
  },
  {
    targetPath: 'industrySpecificData.diagnosticTests',
    label: 'Diagnostic Tests',
    category: 'knowledge',
    iconName: 'TestTube2',
    industries: ['healthcare'],
    transform: 'stringArray',
    sourcePaths: [
      'industrySpecificData.diagnosticTests',
      'diagnosticTests',
      'tests',
      'labTests',
    ],
  },
  {
    targetPath: 'industrySpecificData.emergencyServices',
    label: 'Emergency Services',
    category: 'knowledge',
    iconName: 'Siren',
    industries: ['healthcare'],
    sourcePaths: [
      'industrySpecificData.emergencyServices',
      'emergencyServices',
      'emergency',
      'hasEmergency',
    ],
  },
  {
    targetPath: 'industrySpecificData.insuranceAccepted',
    label: 'Insurance Accepted',
    category: 'knowledge',
    iconName: 'ShieldCheck',
    industries: ['healthcare'],
    transform: 'stringArray',
    sourcePaths: [
      'industrySpecificData.insuranceAccepted',
      'insuranceAccepted',
      'acceptedInsurance',
      'insuranceProviders',
    ],
  },
  {
    targetPath: 'industrySpecificData.consultationTypes',
    label: 'Consultation Types',
    category: 'knowledge',
    iconName: 'Video',
    industries: ['healthcare'],
    transform: 'stringArray',
    sourcePaths: [
      'industrySpecificData.consultationTypes',
      'consultationTypes',
      'appointmentTypes',
    ],
  },
  {
    targetPath: 'industrySpecificData.specializations',
    label: 'Specializations',
    category: 'knowledge',
    iconName: 'Star',
    industries: ['healthcare'],
    transform: 'stringArray',
    sourcePaths: [
      'industrySpecificData.specializations',
      'specializations',
      'specialties',
      'departments',
    ],
  },

  // ---------------------------------------------------------------------------
  // INDUSTRY-SPECIFIC FIELDS - HOSPITALITY
  // ---------------------------------------------------------------------------
  {
    targetPath: 'industrySpecificData.roomTypes',
    label: 'Room Types',
    category: 'knowledge',
    iconName: 'BedDouble',
    industries: ['hospitality'],
    transform: 'objectArray',
    sourcePaths: [
      'industrySpecificData.roomTypes',
      'roomTypes',
      'rooms',
      'accommodations',
    ],
  },
  {
    targetPath: 'industrySpecificData.amenities',
    label: 'Amenities',
    category: 'knowledge',
    iconName: 'Sparkles',
    industries: ['hospitality'],
    transform: 'stringArray',
    sourcePaths: [
      'industrySpecificData.amenities',
      'amenities',
      'facilities',
      'features',
    ],
  },
  {
    targetPath: 'industrySpecificData.checkInTime',
    label: 'Check-in Time',
    category: 'contact',
    iconName: 'Clock',
    industries: ['hospitality'],
    sourcePaths: [
      'industrySpecificData.checkInTime',
      'checkInTime',
      'checkIn',
    ],
  },
  {
    targetPath: 'industrySpecificData.checkOutTime',
    label: 'Check-out Time',
    category: 'contact',
    iconName: 'Clock',
    industries: ['hospitality'],
    sourcePaths: [
      'industrySpecificData.checkOutTime',
      'checkOutTime',
      'checkOut',
    ],
  },
  {
    targetPath: 'industrySpecificData.starRating',
    label: 'Star Rating',
    category: 'identity',
    iconName: 'Star',
    industries: ['hospitality'],
    sourcePaths: [
      'industrySpecificData.starRating',
      'starRating',
      'rating',
      'hotelRating',
    ],
  },
  {
    targetPath: 'industrySpecificData.totalRooms',
    label: 'Total Rooms',
    category: 'knowledge',
    iconName: 'Hash',
    industries: ['hospitality'],
    sourcePaths: [
      'industrySpecificData.totalRooms',
      'totalRooms',
      'numberOfRooms',
      'roomCount',
    ],
  },

  // ---------------------------------------------------------------------------
  // INDUSTRY-SPECIFIC FIELDS - FOOD & BEVERAGE
  // ---------------------------------------------------------------------------
  {
    targetPath: 'industrySpecificData.cuisineTypes',
    label: 'Cuisine Types',
    category: 'knowledge',
    iconName: 'UtensilsCrossed',
    industries: ['food_beverage'],
    transform: 'stringArray',
    sourcePaths: [
      'industrySpecificData.cuisineTypes',
      'cuisineTypes',
      'cuisines',
      'cuisine',
      'foodType',
    ],
  },
  {
    targetPath: 'industrySpecificData.menuHighlights',
    label: 'Menu Highlights',
    category: 'knowledge',
    iconName: 'Utensils',
    industries: ['food_beverage'],
    transform: 'stringArray',
    sourcePaths: [
      'industrySpecificData.menuHighlights',
      'menuHighlights',
      'popularDishes',
      'signatures',
      'specialties',
    ],
  },
  {
    targetPath: 'industrySpecificData.dietaryOptions',
    label: 'Dietary Options',
    category: 'knowledge',
    iconName: 'Leaf',
    industries: ['food_beverage'],
    transform: 'stringArray',
    sourcePaths: [
      'industrySpecificData.dietaryOptions',
      'dietaryOptions',
      'dietaryRestrictions',
      'vegetarian',
      'vegan',
    ],
  },
  {
    targetPath: 'industrySpecificData.seatingCapacity',
    label: 'Seating Capacity',
    category: 'knowledge',
    iconName: 'Users',
    industries: ['food_beverage'],
    sourcePaths: [
      'industrySpecificData.seatingCapacity',
      'seatingCapacity',
      'capacity',
      'seats',
    ],
  },
  {
    targetPath: 'industrySpecificData.deliveryPartners',
    label: 'Delivery Partners',
    category: 'knowledge',
    iconName: 'Truck',
    industries: ['food_beverage'],
    transform: 'stringArray',
    sourcePaths: [
      'industrySpecificData.deliveryPartners',
      'deliveryPartners',
      'delivery',
      'foodDelivery',
    ],
  },
  {
    targetPath: 'industrySpecificData.hygieneRating',
    label: 'Hygiene Rating',
    category: 'credentials',
    iconName: 'ShieldCheck',
    industries: ['food_beverage'],
    sourcePaths: [
      'industrySpecificData.hygieneRating',
      'hygieneRating',
      'foodSafetyRating',
    ],
  },

  // ---------------------------------------------------------------------------
  // INDUSTRY-SPECIFIC FIELDS - RETAIL
  // ---------------------------------------------------------------------------
  {
    targetPath: 'industrySpecificData.productCategories',
    label: 'Product Categories',
    category: 'knowledge',
    iconName: 'Grid',
    industries: ['retail'],
    transform: 'stringArray',
    sourcePaths: [
      'industrySpecificData.productCategories',
      'productCategories',
      'categories',
      'departments',
    ],
  },
  {
    targetPath: 'industrySpecificData.brands',
    label: 'Brands',
    category: 'knowledge',
    iconName: 'Tag',
    industries: ['retail'],
    transform: 'stringArray',
    sourcePaths: [
      'industrySpecificData.brands',
      'brands',
      'brandsCataloged',
      'brandsCarried',
    ],
  },
  {
    targetPath: 'industrySpecificData.priceRange',
    label: 'Price Range',
    category: 'competitive',
    iconName: 'DollarSign',
    industries: ['retail', 'real_estate'],
    sourcePaths: [
      'industrySpecificData.priceRange',
      'priceRange',
      'priceLevel',
      'pricing',
    ],
  },
  {
    targetPath: 'industrySpecificData.deliveryOptions',
    label: 'Delivery Options',
    category: 'knowledge',
    iconName: 'Truck',
    industries: ['retail'],
    transform: 'stringArray',
    sourcePaths: [
      'industrySpecificData.deliveryOptions',
      'deliveryOptions',
      'shipping',
      'deliveryMethods',
    ],
  },
  {
    targetPath: 'industrySpecificData.returnPolicy',
    label: 'Return Policy',
    category: 'knowledge',
    iconName: 'RotateCcw',
    industries: ['retail'],
    multiline: true,
    sourcePaths: [
      'industrySpecificData.returnPolicy',
      'returnPolicy',
      'returns',
      'knowledge.policies.return',
    ],
  },
  {
    targetPath: 'industrySpecificData.onlineStore',
    label: 'Online Store URL',
    category: 'contact',
    iconName: 'ShoppingCart',
    industries: ['retail'],
    sourcePaths: [
      'industrySpecificData.onlineStore',
      'onlineStore',
      'ecommerceUrl',
      'shopUrl',
    ],
  },

  // ---------------------------------------------------------------------------
  // INDUSTRY-SPECIFIC FIELDS - REAL ESTATE
  // ---------------------------------------------------------------------------
  {
    targetPath: 'industrySpecificData.propertyTypes',
    label: 'Property Types',
    category: 'knowledge',
    iconName: 'Home',
    industries: ['real_estate'],
    transform: 'stringArray',
    sourcePaths: [
      'industrySpecificData.propertyTypes',
      'propertyTypes',
      'properties',
      'realEstateTypes',
    ],
  },
  {
    targetPath: 'industrySpecificData.locationsServed',
    label: 'Locations Served',
    category: 'knowledge',
    iconName: 'MapPin',
    industries: ['real_estate'],
    transform: 'stringArray',
    sourcePaths: [
      'industrySpecificData.locationsServed',
      'locationsServed',
      'serviceAreas',
      'markets',
    ],
  },
  {
    targetPath: 'industrySpecificData.projectsCompleted',
    label: 'Projects Completed',
    category: 'success',
    iconName: 'CheckCircle',
    industries: ['real_estate'],
    sourcePaths: [
      'industrySpecificData.projectsCompleted',
      'projectsCompleted',
      'completedProjects',
      'portfolio',
    ],
  },
  {
    targetPath: 'industrySpecificData.reraRegistration',
    label: 'RERA Registration',
    category: 'credentials',
    iconName: 'FileCheck',
    industries: ['real_estate'],
    sourcePaths: [
      'industrySpecificData.reraRegistration',
      'reraRegistration',
      'rera',
      'reraNumber',
    ],
  },

  // ---------------------------------------------------------------------------
  // INDUSTRY-SPECIFIC FIELDS - EDUCATION
  // ---------------------------------------------------------------------------
  {
    targetPath: 'industrySpecificData.coursesOffered',
    label: 'Courses Offered',
    category: 'knowledge',
    iconName: 'GraduationCap',
    industries: ['education'],
    transform: 'objectArray',
    sourcePaths: [
      'industrySpecificData.coursesOffered',
      'coursesOffered',
      'courses',
      'programs',
    ],
  },
  {
    targetPath: 'industrySpecificData.facultyCount',
    label: 'Faculty Count',
    category: 'team',
    iconName: 'Users',
    industries: ['education'],
    sourcePaths: [
      'industrySpecificData.facultyCount',
      'facultyCount',
      'teachers',
      'faculty',
    ],
  },
  {
    targetPath: 'industrySpecificData.studentCount',
    label: 'Student Count',
    category: 'success',
    iconName: 'Users',
    industries: ['education'],
    sourcePaths: [
      'industrySpecificData.studentCount',
      'studentCount',
      'students',
      'enrollment',
    ],
  },
  {
    targetPath: 'industrySpecificData.placementRate',
    label: 'Placement Rate',
    category: 'success',
    iconName: 'TrendingUp',
    industries: ['education'],
    sourcePaths: [
      'industrySpecificData.placementRate',
      'placementRate',
      'placement',
      'jobPlacement',
    ],
  },
  {
    targetPath: 'industrySpecificData.affiliations',
    label: 'Affiliations',
    category: 'credentials',
    iconName: 'Link',
    industries: ['education'],
    transform: 'stringArray',
    sourcePaths: [
      'industrySpecificData.affiliations',
      'affiliations',
      'accreditations',
      'universities',
    ],
  },
];

// =============================================================================
// TRANSFORM FUNCTIONS
// =============================================================================

export const TRANSFORMS: Record<FieldTransform, (raw: any, context?: TransformContext) => any> = {
  address: (raw: any, ctx?: TransformContext): BusinessAddress | null => {
    if (!raw) return null;

    if (typeof raw === 'object' && !Array.isArray(raw)) {
      if (raw.addressComponents) {
        return parseAddressFromGoogle(raw.addressComponents);
      }
      return parseAddress(raw);
    }

    if (typeof raw === 'string') {
      return {
        street: raw,
        area: '',
        city: '',
        state: '',
        postalCode: '',
        country: ctx?.country || '',
      };
    }

    return null;
  },

  operatingHours: (raw: any, ctx?: TransformContext): OperatingHours | null => {
    if (!raw) return null;

    if (raw.isOpen24x7 !== undefined || raw.schedule) {
      return raw as OperatingHours;
    }

    if (raw.weekdayText && Array.isArray(raw.weekdayText)) {
      return parseOperatingHoursFromGoogle(raw.weekdayText);
    }

    if (raw.weekdayDescriptions && Array.isArray(raw.weekdayDescriptions)) {
      return parseOperatingHoursFromGoogle(raw.weekdayDescriptions);
    }

    if (typeof raw === 'boolean') {
      return { isOpen24x7: raw, schedule: {} };
    }

    return null;
  },

  socialMedia: (raw: any, ctx?: TransformContext): string | null => {
    if (!raw) return null;

    if (typeof raw === 'string') {
      return raw;
    }

    if (typeof raw === 'object' && raw.url) {
      return raw.url;
    }

    if (typeof raw === 'object' && raw.uri) {
      return raw.uri;
    }

    return null;
  },

  industry: (raw: any, ctx?: TransformContext): { category: string; name: string; subCategory?: string } | null => {
    if (!raw) return null;

    if (typeof raw === 'object' && raw.category) {
      return raw;
    }

    if (typeof raw === 'string') {
      const normalized = raw.toLowerCase().replace(/[^a-z]/g, '_');
      return {
        category: normalized,
        name: raw,
      };
    }

    if (Array.isArray(raw) && raw.length > 0) {
      const first = raw[0];
      return {
        category: typeof first === 'string' ? first.toLowerCase() : 'other',
        name: typeof first === 'string' ? first : String(first),
      };
    }

    return null;
  },

  phoneNumber: (raw: any, ctx?: TransformContext): string | null => {
    if (!raw) return null;

    let phone = String(raw).trim();
    phone = phone.replace(/[\s\-\(\)\.]/g, '');

    if (ctx?.country === 'IN' && !phone.startsWith('+')) {
      if (phone.length === 10) {
        phone = '+91' + phone;
      }
    } else if (ctx?.country === 'US' && !phone.startsWith('+')) {
      if (phone.length === 10) {
        phone = '+1' + phone;
      }
    }

    return phone || null;
  },

  currency: (raw: any, ctx?: TransformContext): string | null => {
    if (!raw) return null;

    if (typeof raw === 'string') {
      return raw.toUpperCase();
    }

    if (typeof raw === 'object' && raw.code) {
      return raw.code.toUpperCase();
    }

    const countryToCurrency: Record<string, string> = {
      IN: 'INR',
      US: 'USD',
      AE: 'AED',
      GB: 'GBP',
      SG: 'SGD',
    };

    return ctx?.country ? countryToCurrency[ctx.country] || null : null;
  },

  stringArray: (raw: any): string[] | null => {
    if (!raw) return null;

    if (Array.isArray(raw)) {
      return raw.map(item => {
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && item.name) return item.name;
        if (typeof item === 'object' && item.value) return item.value;
        return String(item);
      }).filter(Boolean);
    }

    if (typeof raw === 'string') {
      return raw.split(/[,;|]/).map(s => s.trim()).filter(Boolean);
    }

    return null;
  },

  objectArray: (raw: any): any[] | null => {
    if (!raw) return null;

    if (Array.isArray(raw)) {
      return raw;
    }

    if (typeof raw === 'object') {
      return [raw];
    }

    return null;
  },
};

function parseAddressFromGoogle(components: any[]): BusinessAddress {
  const address: BusinessAddress = {
    street: '',
    area: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  };

  if (!Array.isArray(components)) return address;

  for (const component of components) {
    const types = component.types || [];
    const value = component.longText || component.long_name || '';

    if (types.includes('street_number') || types.includes('route')) {
      address.street = address.street
        ? `${address.street} ${value}`
        : value;
    } else if (types.includes('sublocality') || types.includes('sublocality_level_1')) {
      address.area = value;
    } else if (types.includes('locality')) {
      address.city = value;
    } else if (types.includes('administrative_area_level_1')) {
      address.state = value;
    } else if (types.includes('postal_code')) {
      address.postalCode = value;
    } else if (types.includes('country')) {
      address.country = component.shortText || component.short_name || value;
    }
  }

  return address;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) return undefined;

  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }

  return current;
}

function setNestedValue(obj: any, path: string, value: any): void {
  if (!path) return;

  const parts = path.split('.');
  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current) || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part];
  }

  current[parts[parts.length - 1]] = value;
}

export function extractValue(
  data: Record<string, any>,
  field: FieldDefinition,
  source: ImportSource,
  context?: TransformContext
): any {
  if (!data) return null;

  let value: any = null;

  for (const path of field.sourcePaths) {
    if (path.startsWith('onlinePresence.')) {
      const platform = path.split('.')[1];
      value = extractFromOnlinePresence(data, platform);
      if (value !== null && value !== undefined) break;
    } else {
      value = getNestedValue(data, path);
      if (value !== null && value !== undefined) break;
    }
  }

  if (value !== null && value !== undefined && field.transform) {
    const transformer = TRANSFORMS[field.transform];
    if (transformer) {
      value = transformer(value, context);
    }
  }

  return value;
}

function extractFromOnlinePresence(data: any, platform: string): string | null {
  const onlinePresence = data.onlinePresence || data.webIntelligence?.onlinePresence;

  if (!Array.isArray(onlinePresence)) return null;

  const platformLower = platform.toLowerCase();
  const entry = onlinePresence.find((item: any) => {
    const itemPlatform = (item.platform || item.type || item.source || '').toLowerCase();
    return itemPlatform === platformLower || itemPlatform.includes(platformLower);
  });

  return entry?.url || entry?.link || entry?.sourceUrl || null;
}

function fieldMatchesTaxonomy(field: FieldDefinition, taxonomy?: TaxonomyFilter): boolean {
  if (!taxonomy) return true;

  if (field.industries && field.industries.length > 0) {
    if (!taxonomy.industry || !field.industries.includes(taxonomy.industry)) {
      return false;
    }
  }

  if (field.countries && field.countries.length > 0) {
    if (!taxonomy.country || !field.countries.includes(taxonomy.country)) {
      return false;
    }
  }

  if (field.subCategories && field.subCategories.length > 0) {
    if (!taxonomy.subCategory || !field.subCategories.includes(taxonomy.subCategory)) {
      return false;
    }
  }

  return true;
}

export function buildMergeFields(
  sources: Partial<Record<ImportSource, any>>,
  taxonomy?: TaxonomyFilter
): MergeField[] {
  const mergeFields: MergeField[] = [];

  const applicableFields = FIELD_REGISTRY.filter(field =>
    fieldMatchesTaxonomy(field, taxonomy)
  );

  const context: TransformContext = {
    country: taxonomy?.country,
    industry: taxonomy?.industry,
    subCategory: taxonomy?.subCategory,
  };

  for (const field of applicableFields) {
    const values: Partial<Record<ImportSource, any>> = {};
    let hasAnyValue = false;

    for (const [source, data] of Object.entries(sources)) {
      if (data) {
        const value = extractValue(data, field, source as ImportSource, context);
        if (value !== null && value !== undefined) {
          values[source as ImportSource] = value;
          hasAnyValue = true;
        }
      }
    }

    if (hasAnyValue) {
      const uniqueValues = new Set(
        Object.values(values)
          .filter(v => v !== null && v !== undefined)
          .map(v => JSON.stringify(v))
      );
      const hasConflict = uniqueValues.size > 1;

      let selectedSource: ImportSource | 'custom' | 'none' = 'none';
      if (values.website !== undefined) {
        selectedSource = 'website';
      } else if (values.google !== undefined) {
        selectedSource = 'google';
      } else {
        const firstSource = Object.keys(values)[0] as ImportSource;
        if (firstSource) {
          selectedSource = firstSource;
        }
      }

      const finalValue = selectedSource !== 'none' && selectedSource !== 'custom'
        ? values[selectedSource]
        : null;

      mergeFields.push({
        definition: field,
        values,
        selectedSource,
        finalValue,
        hasConflict,
      });
    }
  }

  return mergeFields;
}

export function applyMergeFieldsToPersona(
  mergeFields: MergeField[],
  products: Array<{ id: string; name: string; description: string; category?: string; pricing?: string; features?: string[]; selected: boolean }>,
  testimonials: Array<{ id: string; quote: string; author?: string; rating?: number; date?: string; sentiment: string; selected: boolean }>
): {
  persona: Partial<BusinessPersona>;
  updatedPaths: string[];
  metadata: ImportMetadata;
} {
  const persona: Partial<BusinessPersona> = {};
  const updatedPaths: string[] = [];
  const fieldSources: ImportMetadata['fieldSources'] = {};
  const sourcesUsed = new Set<ImportSource>();

  const now = new Date().toISOString();

  for (const mergeField of mergeFields) {
    const value = mergeField.selectedSource === 'custom'
      ? mergeField.customValue
      : mergeField.finalValue;

    if (value !== null && value !== undefined) {
      const path = mergeField.definition.targetPath;
      setNestedValue(persona, path, value);
      updatedPaths.push(path);

      if (mergeField.selectedSource !== 'custom' && mergeField.selectedSource !== 'none') {
        sourcesUsed.add(mergeField.selectedSource);
        fieldSources[path] = {
          source: mergeField.selectedSource,
          importedAt: now,
        };
      }
    }
  }

  const selectedProducts = products.filter(p => p.selected);
  if (selectedProducts.length > 0) {
    const productsOrServices = selectedProducts.map(p => ({
      name: p.name,
      description: p.description,
      category: p.category,
      pricing: p.pricing,
      features: p.features,
    }));
    setNestedValue(persona, 'knowledge.productsOrServices', productsOrServices);
    updatedPaths.push('knowledge.productsOrServices');
  }

  const selectedTestimonials = testimonials.filter(t => t.selected);
  if (selectedTestimonials.length > 0) {
    const mappedTestimonials = selectedTestimonials.map(t => ({
      id: t.id,
      quote: t.quote,
      author: t.author,
      rating: t.rating,
      date: t.date,
      sentiment: t.sentiment,
    }));
    setNestedValue(persona, 'testimonials', mappedTestimonials);
    updatedPaths.push('testimonials');
  }

  const metadata: ImportMetadata = {
    importedAt: now,
    sources: Array.from(sourcesUsed),
    fieldsUpdated: updatedPaths.length,
    productsImported: selectedProducts.length,
    testimonialsImported: selectedTestimonials.length,
    fieldSources,
  };

  return { persona, updatedPaths, metadata };
}

export async function savePersonaToFirestore(
  partnerId: string,
  persona: Partial<BusinessPersona>,
  metadata: ImportMetadata
): Promise<{ success: boolean; error?: string }> {
  try {
    const partnerRef = doc(db, 'partners', partnerId);

    const updateData: Record<string, any> = {
      businessPersona: {
        ...persona,
        updatedAt: Timestamp.now(),
      },
      _importMeta: {
        ...metadata,
        lastImportedAt: Timestamp.now(),
      },
      _fieldSources: metadata.fieldSources,
      updatedAt: Timestamp.now(),
    };

    await setDoc(partnerRef, updateData, { merge: true });

    return { success: true };
  } catch (error) {
    console.error('Error saving persona to Firestore:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// =============================================================================
// FIELD RETRIEVAL UTILITIES
// =============================================================================

export function getFieldsByCategory(
  category: FieldCategory,
  taxonomy?: TaxonomyFilter
): FieldDefinition[] {
  return FIELD_REGISTRY.filter(field =>
    field.category === category && fieldMatchesTaxonomy(field, taxonomy)
  );
}

export function getFieldsForIndustry(
  industry: string,
  country?: string
): FieldDefinition[] {
  return FIELD_REGISTRY.filter(field => {
    if (!field.industries || field.industries.length === 0) {
      if (field.countries && field.countries.length > 0) {
        return country ? field.countries.includes(country) : false;
      }
      return true;
    }

    if (!field.industries.includes(industry)) {
      return false;
    }

    if (field.countries && field.countries.length > 0) {
      return country ? field.countries.includes(country) : false;
    }

    return true;
  });
}

export function getApplicableFields(taxonomy: TaxonomyFilter): FieldDefinition[] {
  return FIELD_REGISTRY.filter(field => fieldMatchesTaxonomy(field, taxonomy));
}

export function getFieldByPath(targetPath: string): FieldDefinition | undefined {
  return FIELD_REGISTRY.find(field => field.targetPath === targetPath);
}

export function getCriticalFields(taxonomy?: TaxonomyFilter): FieldDefinition[] {
  return FIELD_REGISTRY.filter(field =>
    field.critical && fieldMatchesTaxonomy(field, taxonomy)
  );
}

export function getCategoryConfig(categoryId: FieldCategory): CategoryConfig | undefined {
  return CATEGORY_CONFIG.find(cat => cat.id === categoryId);
}

export function getCategoriesWithFields(taxonomy?: TaxonomyFilter): CategoryConfig[] {
  const categoriesWithFields = new Set<FieldCategory>();

  for (const field of FIELD_REGISTRY) {
    if (fieldMatchesTaxonomy(field, taxonomy)) {
      categoriesWithFields.add(field.category);
    }
  }

  return CATEGORY_CONFIG.filter(cat => categoriesWithFields.has(cat.id));
}