'use server';

import { v4 as uuidv4 } from 'uuid';
import type {
  StandardizedImportDataPoint,
  StandardizedImportStorage,
  ImportDataExport,
  BusinessPersona
} from '@/lib/business-persona-types';
import { db } from '@/lib/firebase-admin';

// ============================================
// CANONICAL FIELD MAP
// Maps semantic keys to canonical BusinessPersona paths
// ============================================

interface CanonicalFieldMapping {
  canonicalPath: string;  // Dot-notation path in BusinessPersona
  transform?: (value: any) => any;  // Optional transform function
  merge?: 'replace' | 'append' | 'merge';  // How to handle existing values
}

const CANONICAL_FIELD_MAP: Record<string, CanonicalFieldMapping> = {
  // === IDENTITY ===
  'business_name': { canonicalPath: 'identity.name' },
  'phone': { canonicalPath: 'identity.phone' },
  'phone_international': { canonicalPath: 'identity.phone' },
  'email': { canonicalPath: 'identity.email' },
  'website': { canonicalPath: 'identity.website' },
  'address': { canonicalPath: 'identity.address' },
  'address_formatted': { canonicalPath: 'identity.address' },
  'operating_hours': { canonicalPath: 'identity.operatingHours' },
  'languages': { canonicalPath: 'identity.languages', merge: 'append' },
  'year_established': { canonicalPath: 'personality.foundedYear', transform: (v) => typeof v === 'string' ? parseInt(v, 10) : v },
  'business_types': { canonicalPath: 'industrySpecificData.businessTypes', merge: 'append' },
  'whatsapp': { canonicalPath: 'identity.whatsAppNumber' },
  'industry': { canonicalPath: 'industrySpecificData.industry' },
  'timezone': { canonicalPath: 'identity.timezone' },
  'currency': { canonicalPath: 'identity.currency' },

  // === SOCIAL MEDIA (Comprehensive) ===
  'social_media': { canonicalPath: 'identity.socialMedia', merge: 'merge' },
  // Core platforms
  'instagram': { canonicalPath: 'identity.socialMedia.instagram' },
  'facebook': { canonicalPath: 'identity.socialMedia.facebook' },
  'linkedin': { canonicalPath: 'identity.socialMedia.linkedin' },
  'twitter': { canonicalPath: 'identity.socialMedia.twitter' },
  'youtube': { canonicalPath: 'identity.socialMedia.youtube' },
  'tiktok': { canonicalPath: 'identity.socialMedia.tiktok' },
  'pinterest': { canonicalPath: 'identity.socialMedia.pinterest' },
  'snapchat': { canonicalPath: 'identity.socialMedia.snapchat' },
  'threads': { canonicalPath: 'identity.socialMedia.threads' },
  // Messaging platforms
  'telegram': { canonicalPath: 'identity.socialMedia.telegram' },
  'wechat': { canonicalPath: 'identity.socialMedia.wechat' },
  'line': { canonicalPath: 'identity.socialMedia.line' },
  // Business/Review platforms
  'google_business': { canonicalPath: 'identity.socialMedia.googleBusiness' },
  'google_maps_url': { canonicalPath: 'identity.googleMapsUrl' },
  'yelp': { canonicalPath: 'identity.socialMedia.yelp' },
  'tripadvisor': { canonicalPath: 'identity.socialMedia.tripadvisor' },
  'trustpilot': { canonicalPath: 'identity.socialMedia.trustpilot' },
  'glassdoor': { canonicalPath: 'identity.socialMedia.glassdoor' },
  // Food/Restaurant platforms
  'zomato': { canonicalPath: 'identity.socialMedia.zomato' },
  'swiggy': { canonicalPath: 'identity.socialMedia.swiggy' },
  'ubereats': { canonicalPath: 'identity.socialMedia.ubereats' },
  'doordash': { canonicalPath: 'identity.socialMedia.doordash' },
  'grubhub': { canonicalPath: 'identity.socialMedia.grubhub' },
  'opentable': { canonicalPath: 'identity.socialMedia.opentable' },
  // Real Estate platforms
  'zillow': { canonicalPath: 'identity.socialMedia.zillow' },
  'realtor': { canonicalPath: 'identity.socialMedia.realtor' },
  'trulia': { canonicalPath: 'identity.socialMedia.trulia' },
  'houzz': { canonicalPath: 'identity.socialMedia.houzz' },
  'redfin': { canonicalPath: 'identity.socialMedia.redfin' },
  // Travel/Hotel platforms
  'booking': { canonicalPath: 'identity.socialMedia.booking' },
  'airbnb': { canonicalPath: 'identity.socialMedia.airbnb' },
  'expedia': { canonicalPath: 'identity.socialMedia.expedia' },
  // Professional/Portfolio
  'github': { canonicalPath: 'identity.socialMedia.github' },
  'behance': { canonicalPath: 'identity.socialMedia.behance' },
  'dribbble': { canonicalPath: 'identity.socialMedia.dribbble' },

  // === PERSONALITY / BRAND ===
  'tagline': { canonicalPath: 'personality.tagline' },
  'description': { canonicalPath: 'personality.description' },
  'unique_selling_points': { canonicalPath: 'personality.uniqueSellingPoints', merge: 'append' },
  'brand_values': { canonicalPath: 'personality.brandValues', merge: 'append' },
  'mission_statement': { canonicalPath: 'personality.missionStatement' },
  'vision_statement': { canonicalPath: 'personality.visionStatement' },
  'story': { canonicalPath: 'personality.story' },
  'voice_tone': { canonicalPath: 'personality.voiceTone' },
  'communication_style': { canonicalPath: 'personality.communicationStyle' },
  'greeting_style': { canonicalPath: 'personality.greetingStyle' },

  // === CUSTOMER PROFILE / AUDIENCE & POSITIONING ===
  'target_audience': { canonicalPath: 'customerProfile.targetAudience' },
  'primary_audience': { canonicalPath: 'customerProfile.primaryAudience' },
  'customer_type': { canonicalPath: 'customerProfile.customerType' },
  'age_group': { canonicalPath: 'customerProfile.ageGroup', merge: 'append' },
  'income_segment': { canonicalPath: 'customerProfile.incomeSegment', merge: 'append' },
  'pain_points': { canonicalPath: 'customerProfile.painPoints', merge: 'append' },
  'customer_pain_points': { canonicalPath: 'customerProfile.customerPainPoints', merge: 'append' },
  'differentiators': { canonicalPath: 'customerProfile.differentiators', merge: 'append' },
  'value_propositions': { canonicalPath: 'customerProfile.valuePropositions', merge: 'append' },
  'objection_handlers': { canonicalPath: 'customerProfile.objectionHandlers', merge: 'append' },
  'ideal_customer_profile': { canonicalPath: 'customerProfile.idealCustomerProfile' },
  'demographics': { canonicalPath: 'customerProfile.customerDemographics', merge: 'append' },
  'common_queries': { canonicalPath: 'customerProfile.commonQueries', merge: 'append' },
  'acquisition_channels': { canonicalPath: 'customerProfile.acquisitionChannels', merge: 'append' },
  'peak_contact_times': { canonicalPath: 'customerProfile.peakContactTimes', merge: 'append' },
  'typical_journey_stages': { canonicalPath: 'customerProfile.typicalJourneyStages', merge: 'append' },

  // === KNOWLEDGE / TRUST & SUPPORT ===
  'services': { canonicalPath: 'knowledge.productsOrServices', merge: 'append', transform: transformServicesToProducts },
  'products': { canonicalPath: 'knowledge.productsOrServices', merge: 'append', transform: transformServicesToProducts },
  'products_services': { canonicalPath: 'knowledge.productsOrServices', merge: 'append' },
  'faqs': { canonicalPath: 'knowledge.faqs', merge: 'append', transform: transformFaqs },
  'policies': { canonicalPath: 'knowledge.policies', merge: 'merge' },
  'payment_methods': { canonicalPath: 'knowledge.acceptedPayments', merge: 'append' },
  'certifications': { canonicalPath: 'knowledge.certifications', merge: 'append' },
  'licenses': { canonicalPath: 'industrySpecificData.registrations', merge: 'append' },
  'registrations': { canonicalPath: 'industrySpecificData.registrations', merge: 'append' },
  'awards': { canonicalPath: 'knowledge.awards', merge: 'append' },
  'service_categories': { canonicalPath: 'knowledge.serviceCategories', merge: 'append' },
  'case_studies': { canonicalPath: 'knowledge.caseStudies', merge: 'append' },
  'key_stats': { canonicalPath: 'knowledge.keyStats', merge: 'append' },
  'notable_clients': { canonicalPath: 'industrySpecificData.notableClients', merge: 'append' },
  'years_in_business': { canonicalPath: 'industrySpecificData.yearsInBusiness' },
  'employee_count': { canonicalPath: 'industrySpecificData.employeeCount' },
  'team_size': { canonicalPath: 'industrySpecificData.employeeCount' },
  'team': { canonicalPath: 'knowledge.teamMembers', merge: 'append' },
  'pricing_model': { canonicalPath: 'knowledge.pricingModel' },
  'pricing_highlights': { canonicalPath: 'knowledge.pricingHighlights' },
  'current_offers': { canonicalPath: 'knowledge.currentOffers', merge: 'append' },
  'guarantees': { canonicalPath: 'knowledge.guarantees', merge: 'append' },

  // === REPUTATION ===
  'google_rating': { canonicalPath: 'industrySpecificData.googleRating' },
  'review_count': { canonicalPath: 'industrySpecificData.googleReviewCount' },
  'reviews': { canonicalPath: 'webIntelligence.reviews', merge: 'append' },
  'testimonials': { canonicalPath: 'testimonials', merge: 'append', transform: transformTestimonials },
  'online_presence': { canonicalPath: 'webIntelligence.onlinePresence', merge: 'append' },
  'press_media': { canonicalPath: 'webIntelligence.pressMentions', merge: 'append' },

  // === INDUSTRY SPECIFIC ===
  'industry_data': { canonicalPath: 'industrySpecificData', merge: 'merge' },
  'specializations': { canonicalPath: 'industrySpecificData.specialization', merge: 'append' },
  'areas_served': { canonicalPath: 'industrySpecificData.areasServed', merge: 'append' },
  'team_members': { canonicalPath: 'knowledge.teamMembers', merge: 'append' },
  'price_level': { canonicalPath: 'industrySpecificData.priceLevel' },
  'process_steps': { canonicalPath: 'industrySpecificData.processSteps', merge: 'append' },
  'client_types': { canonicalPath: 'industrySpecificData.clientTypes', merge: 'append' },
  'project_types': { canonicalPath: 'industrySpecificData.projectTypes', merge: 'append' },

  // === INVENTORY (Industry-Specific) ===
  'menu_items': { canonicalPath: 'menuItems', merge: 'append' },
  'menu_categories': { canonicalPath: 'menuCategories', merge: 'append' },
  'room_types': { canonicalPath: 'roomTypes', merge: 'append' },
  'hotel_amenities': { canonicalPath: 'hotelAmenities', merge: 'append' },
  'product_catalog': { canonicalPath: 'productCatalog', merge: 'append' },
  'property_listings': { canonicalPath: 'propertyListings', merge: 'append' },
  'healthcare_services': { canonicalPath: 'healthcareServices', merge: 'append' },

  // === MEDIA ===
  'photos': { canonicalPath: 'webIntelligence.photos', merge: 'append' },
  'logo': { canonicalPath: 'identity.logo' },
  'cover_image': { canonicalPath: 'identity.coverImage' },
};

// Transform functions
function transformServicesToProducts(value: any): any[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item, idx) => {
      if (typeof item === 'string') {
        return { id: `svc_${idx}`, name: item, description: '', isService: true };
      }
      return { id: item.id || `svc_${idx}`, ...item };
    });
  }
  return [];
}

function transformFaqs(value: any): any[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((faq, idx) => ({
      id: faq.id || `faq_${idx}`,
      question: faq.question || faq.q || '',
      answer: faq.answer || faq.a || '',
      category: faq.category || 'General',
    }));
  }
  return [];
}

function transformTestimonials(value: any): any[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((t, idx) => ({
      id: t.id || `testimonial_${idx}`,
      quote: t.quote || t.text || '',
      author: t.author || t.name || 'Anonymous',
      rating: t.rating,
      date: t.date,
      source: t.source || 'website',
    }));
  }
  return [];
}

// ============================================
// SOURCE KEY MAPPINGS
// ============================================

// Semantic key mapping for Google data
const GOOGLE_KEY_MAP: Record<string, { key: string; category: string; label: string }> = {
  // Raw Google Places API fields
  'name': { key: 'business_name', category: 'identity', label: 'Business Name' },
  'formatted_phone_number': { key: 'phone', category: 'contact', label: 'Phone' },
  'international_phone_number': { key: 'phone_international', category: 'contact', label: 'International Phone' },
  'formatted_address': { key: 'address_formatted', category: 'contact', label: 'Address' },
  'website': { key: 'website', category: 'contact', label: 'Website' },
  'rating': { key: 'google_rating', category: 'reputation', label: 'Google Rating' },
  'user_ratings_total': { key: 'review_count', category: 'reputation', label: 'Review Count' },
  'types': { key: 'business_types', category: 'identity', label: 'Business Types' },
  'opening_hours': { key: 'operating_hours', category: 'operations', label: 'Operating Hours' },
  'opening_hours.weekday_text': { key: 'operating_hours', category: 'operations', label: 'Operating Hours' },
  'reviews': { key: 'reviews', category: 'reputation', label: 'Customer Reviews' },
  'photos': { key: 'photos', category: 'media', label: 'Photos' },
  'url': { key: 'google_maps_url', category: 'contact', label: 'Google Maps URL' },
  'price_level': { key: 'price_level', category: 'industry', label: 'Price Level' },
  'editorialSummary': { key: 'description', category: 'identity', label: 'Description' },
  'editorial_summary': { key: 'description', category: 'identity', label: 'Description' },

  // Mapped from autofill profile structure - Identity
  'identity.name': { key: 'business_name', category: 'identity', label: 'Business Name' },
  'identity.businessName': { key: 'business_name', category: 'identity', label: 'Business Name' },
  'identity.phone': { key: 'phone', category: 'contact', label: 'Phone' },
  'identity.email': { key: 'email', category: 'contact', label: 'Email' },
  'identity.website': { key: 'website', category: 'contact', label: 'Website' },
  'identity.address': { key: 'address', category: 'contact', label: 'Address' },
  'identity.operatingHours': { key: 'operating_hours', category: 'operations', label: 'Operating Hours' },
  'identity.languages': { key: 'languages', category: 'identity', label: 'Languages' },
  'identity.yearEstablished': { key: 'year_established', category: 'identity', label: 'Year Established' },
  'identity.socialMedia': { key: 'social_media', category: 'contact', label: 'Social Media' },
  'identity.googleMapsUrl': { key: 'google_maps_url', category: 'contact', label: 'Google Maps URL' },
  'identity.industry': { key: 'industry', category: 'identity', label: 'Industry' },
  'identity.location': { key: 'location', category: 'contact', label: 'Location' },

  // Social Media - Individual platforms from identity.socialMedia
  'identity.socialMedia.instagram': { key: 'instagram', category: 'social', label: 'Instagram' },
  'identity.socialMedia.facebook': { key: 'facebook', category: 'social', label: 'Facebook' },
  'identity.socialMedia.linkedin': { key: 'linkedin', category: 'social', label: 'LinkedIn' },
  'identity.socialMedia.twitter': { key: 'twitter', category: 'social', label: 'Twitter' },
  'identity.socialMedia.youtube': { key: 'youtube', category: 'social', label: 'YouTube' },
  'identity.socialMedia.tiktok': { key: 'tiktok', category: 'social', label: 'TikTok' },
  'identity.socialMedia.pinterest': { key: 'pinterest', category: 'social', label: 'Pinterest' },
  'identity.socialMedia.snapchat': { key: 'snapchat', category: 'social', label: 'Snapchat' },
  'identity.socialMedia.threads': { key: 'threads', category: 'social', label: 'Threads' },
  'identity.socialMedia.whatsapp': { key: 'whatsapp', category: 'social', label: 'WhatsApp' },
  'identity.socialMedia.telegram': { key: 'telegram', category: 'social', label: 'Telegram' },
  'identity.socialMedia.googleBusiness': { key: 'google_business', category: 'social', label: 'Google Business' },
  'identity.socialMedia.yelp': { key: 'yelp', category: 'social', label: 'Yelp' },
  'identity.socialMedia.tripadvisor': { key: 'tripadvisor', category: 'social', label: 'TripAdvisor' },

  // Personality
  'personality.tagline': { key: 'tagline', category: 'identity', label: 'Tagline' },
  'personality.description': { key: 'description', category: 'identity', label: 'Description' },
  'personality.uniqueSellingPoints': { key: 'unique_selling_points', category: 'identity', label: 'USPs' },
  'personality.brandValues': { key: 'brand_values', category: 'identity', label: 'Brand Values' },
  'personality.missionStatement': { key: 'mission_statement', category: 'identity', label: 'Mission Statement' },
  'personality.visionStatement': { key: 'vision_statement', category: 'identity', label: 'Vision Statement' },
  'personality.story': { key: 'story', category: 'identity', label: 'Brand Story' },
  'personality.voiceTone': { key: 'voice_tone', category: 'identity', label: 'Voice Tone' },
  'personality.foundedYear': { key: 'year_established', category: 'identity', label: 'Founded Year' },

  // Knowledge
  'knowledge.productsOrServices': { key: 'products_services', category: 'offerings', label: 'Products & Services' },
  'knowledge.services': { key: 'services', category: 'offerings', label: 'Services' },
  'knowledge.products': { key: 'products', category: 'offerings', label: 'Products' },
  'knowledge.faqs': { key: 'faqs', category: 'knowledge', label: 'FAQs' },
  'knowledge.policies': { key: 'policies', category: 'knowledge', label: 'Policies' },
  'knowledge.certifications': { key: 'certifications', category: 'credentials', label: 'Certifications' },
  'knowledge.awards': { key: 'awards', category: 'credentials', label: 'Awards' },
  'knowledge.acceptedPayments': { key: 'payment_methods', category: 'operations', label: 'Payment Methods' },
  'knowledge.serviceCategories': { key: 'service_categories', category: 'offerings', label: 'Service Categories' },
  'knowledge.teamMembers': { key: 'team_members', category: 'team', label: 'Team Members' },

  // Customer Profile / Audience & Positioning
  'customerProfile.targetAudience': { key: 'target_audience', category: 'audience', label: 'Target Audience' },
  'customerProfile.primaryAudience': { key: 'primary_audience', category: 'audience', label: 'Primary Audience' },
  'customerProfile.customerType': { key: 'customer_type', category: 'audience', label: 'Customer Type' },
  'customerProfile.ageGroup': { key: 'age_group', category: 'audience', label: 'Age Group' },
  'customerProfile.incomeSegment': { key: 'income_segment', category: 'audience', label: 'Income Segment' },
  'customerProfile.painPoints': { key: 'pain_points', category: 'audience', label: 'Pain Points' },
  'customerProfile.customerPainPoints': { key: 'customer_pain_points', category: 'audience', label: 'Customer Pain Points' },
  'customerProfile.differentiators': { key: 'differentiators', category: 'audience', label: 'Differentiators' },
  'customerProfile.valuePropositions': { key: 'value_propositions', category: 'audience', label: 'Value Propositions' },
  'customerProfile.objectionHandlers': { key: 'objection_handlers', category: 'audience', label: 'Objection Handlers' },
  'customerProfile.idealCustomerProfile': { key: 'ideal_customer_profile', category: 'audience', label: 'Ideal Customer' },
  'customerProfile.customerDemographics': { key: 'demographics', category: 'audience', label: 'Demographics' },
  'customerProfile.commonQueries': { key: 'common_queries', category: 'audience', label: 'Common Queries' },
  'customerProfile.acquisitionChannels': { key: 'acquisition_channels', category: 'audience', label: 'Acquisition Channels' },

  // Industry Specific / Trust & Support
  'industrySpecificData': { key: 'industry_data', category: 'industry', label: 'Industry Data' },
  'industrySpecificData.googleRating': { key: 'google_rating', category: 'reputation', label: 'Google Rating' },
  'industrySpecificData.googleReviewCount': { key: 'review_count', category: 'reputation', label: 'Review Count' },
  'industrySpecificData.specialization': { key: 'specializations', category: 'industry', label: 'Specializations' },
  'industrySpecificData.areasServed': { key: 'areas_served', category: 'industry', label: 'Areas Served' },
  'industrySpecificData.yearsInBusiness': { key: 'years_in_business', category: 'trust', label: 'Years in Business' },
  'industrySpecificData.employeeCount': { key: 'employee_count', category: 'trust', label: 'Employee Count' },
  'industrySpecificData.notableClients': { key: 'notable_clients', category: 'trust', label: 'Notable Clients' },
  'industrySpecificData.registrations': { key: 'registrations', category: 'trust', label: 'Registrations' },
  'industrySpecificData.licenses': { key: 'licenses', category: 'trust', label: 'Licenses' },

  // Trust & Support - Knowledge
  'knowledge.caseStudies': { key: 'case_studies', category: 'trust', label: 'Case Studies' },
  'knowledge.keyStats': { key: 'key_stats', category: 'trust', label: 'Key Stats' },

  // Testimonials
  'testimonials': { key: 'testimonials', category: 'reputation', label: 'Testimonials' },

  // ========== NESTED SCRAPER STRUCTURES (For Google autofill profile) ==========
  // customerInsights nested object
  'customerInsights': { key: 'customer_insights', category: 'audience', label: 'Customer Insights' },
  'customerInsights.painPoints': { key: 'pain_points', category: 'audience', label: 'Pain Points' },
  'customerInsights.valuePropositions': { key: 'value_propositions', category: 'audience', label: 'Value Propositions' },
  'customerInsights.targetAgeGroups': { key: 'age_group', category: 'audience', label: 'Target Age Groups' },
  'customerInsights.incomeSegments': { key: 'income_segment', category: 'audience', label: 'Income Segments' },
  'customerInsights.targetAudience': { key: 'target_audience', category: 'audience', label: 'Target Audience' },
  'customerInsights.customerType': { key: 'customer_type', category: 'audience', label: 'Customer Type' },
  'customerInsights.demographics': { key: 'demographics', category: 'audience', label: 'Demographics' },

  // competitiveIntel nested object
  'competitiveIntel': { key: 'competitive_intel', category: 'audience', label: 'Competitive Intel' },
  'competitiveIntel.differentiators': { key: 'differentiators', category: 'audience', label: 'Differentiators' },
  'competitiveIntel.competitiveAdvantages': { key: 'differentiators', category: 'audience', label: 'Competitive Advantages' },
  'competitiveIntel.uniqueFeatures': { key: 'differentiators', category: 'audience', label: 'Unique Features' },
  'competitiveIntel.marketPosition': { key: 'value_propositions', category: 'audience', label: 'Market Position' },
  'competitiveIntel.targetMarket': { key: 'target_audience', category: 'audience', label: 'Target Market' },

  // Direct audience fields that might come from Google
  'targetAudience': { key: 'target_audience', category: 'audience', label: 'Target Audience' },
  'targetCustomers': { key: 'primary_audience', category: 'audience', label: 'Target Customers' },
  'painPoints': { key: 'pain_points', category: 'audience', label: 'Pain Points' },
  'differentiators': { key: 'differentiators', category: 'audience', label: 'Differentiators' },
  'valuePropositions': { key: 'value_propositions', category: 'audience', label: 'Value Propositions' },
  'usps': { key: 'differentiators', category: 'audience', label: 'USPs' },
  'uniqueSellingPoints': { key: 'differentiators', category: 'audience', label: 'USPs' },
};

// Semantic key mapping for Website data
const WEBSITE_KEY_MAP: Record<string, { key: string; category: string; label: string }> = {
  // Direct website scrape fields
  'businessName': { key: 'business_name', category: 'identity', label: 'Business Name' },
  'description': { key: 'description', category: 'identity', label: 'Description' },
  'shortDescription': { key: 'description', category: 'identity', label: 'Description' },
  'phone': { key: 'phone', category: 'contact', label: 'Phone' },
  'email': { key: 'email', category: 'contact', label: 'Email' },
  'address': { key: 'address', category: 'contact', label: 'Address' },
  'services': { key: 'services', category: 'offerings', label: 'Services' },
  'products': { key: 'products', category: 'offerings', label: 'Products' },
  'socialMedia': { key: 'social_media', category: 'contact', label: 'Social Media' },
  'onlinePresence': { key: 'social_media', category: 'contact', label: 'Online Presence' },
  'testimonials': { key: 'testimonials', category: 'reputation', label: 'Testimonials' },
  'faqs': { key: 'faqs', category: 'knowledge', label: 'FAQs' },
  'faq': { key: 'faqs', category: 'knowledge', label: 'FAQs' },
  'team': { key: 'team_members', category: 'team', label: 'Team Members' },
  'tagline': { key: 'tagline', category: 'identity', label: 'Tagline' },
  'mission': { key: 'mission_statement', category: 'identity', label: 'Mission' },
  'vision': { key: 'vision_statement', category: 'identity', label: 'Vision' },
  'about': { key: 'story', category: 'identity', label: 'About' },
  'story': { key: 'story', category: 'identity', label: 'Story' },
  'values': { key: 'brand_values', category: 'identity', label: 'Values' },
  'coreValues': { key: 'brand_values', category: 'identity', label: 'Core Values' },
  'awards': { key: 'awards', category: 'credentials', label: 'Awards' },
  'certifications': { key: 'certifications', category: 'credentials', label: 'Certifications' },
  'accreditations': { key: 'certifications', category: 'credentials', label: 'Accreditations' },
  'operatingHours': { key: 'operating_hours', category: 'operations', label: 'Operating Hours' },
  'openingHours': { key: 'operating_hours', category: 'operations', label: 'Opening Hours' },

  // Mapped from scraper profile structure - Identity
  'identity.name': { key: 'business_name', category: 'identity', label: 'Business Name' },
  'identity.businessName': { key: 'business_name', category: 'identity', label: 'Business Name' },
  'identity.phone': { key: 'phone', category: 'contact', label: 'Phone' },
  'identity.email': { key: 'email', category: 'contact', label: 'Email' },
  'identity.website': { key: 'website', category: 'contact', label: 'Website' },
  'identity.address': { key: 'address', category: 'contact', label: 'Address' },
  'identity.operatingHours': { key: 'operating_hours', category: 'operations', label: 'Operating Hours' },
  'identity.socialMedia': { key: 'social_media', category: 'contact', label: 'Social Media' },
  'identity.languages': { key: 'languages', category: 'identity', label: 'Languages' },
  'identity.yearEstablished': { key: 'year_established', category: 'identity', label: 'Year Established' },
  'identity.founders': { key: 'team_members', category: 'team', label: 'Founders' },
  'identity.teamSize': { key: 'team_size', category: 'team', label: 'Team Size' },
  'identity.industry': { key: 'industry', category: 'identity', label: 'Industry' },
  'identity.location': { key: 'location', category: 'contact', label: 'Location' },

  // Social Media - Individual platforms from identity.socialMedia (comprehensive)
  'identity.socialMedia.instagram': { key: 'instagram', category: 'social', label: 'Instagram' },
  'identity.socialMedia.facebook': { key: 'facebook', category: 'social', label: 'Facebook' },
  'identity.socialMedia.linkedin': { key: 'linkedin', category: 'social', label: 'LinkedIn' },
  'identity.socialMedia.twitter': { key: 'twitter', category: 'social', label: 'Twitter' },
  'identity.socialMedia.youtube': { key: 'youtube', category: 'social', label: 'YouTube' },
  'identity.socialMedia.tiktok': { key: 'tiktok', category: 'social', label: 'TikTok' },
  'identity.socialMedia.pinterest': { key: 'pinterest', category: 'social', label: 'Pinterest' },
  'identity.socialMedia.snapchat': { key: 'snapchat', category: 'social', label: 'Snapchat' },
  'identity.socialMedia.threads': { key: 'threads', category: 'social', label: 'Threads' },
  'identity.socialMedia.whatsapp': { key: 'whatsapp', category: 'social', label: 'WhatsApp' },
  'identity.socialMedia.telegram': { key: 'telegram', category: 'social', label: 'Telegram' },
  'identity.socialMedia.wechat': { key: 'wechat', category: 'social', label: 'WeChat' },
  'identity.socialMedia.line': { key: 'line', category: 'social', label: 'LINE' },
  'identity.socialMedia.googleBusiness': { key: 'google_business', category: 'social', label: 'Google Business' },
  'identity.socialMedia.yelp': { key: 'yelp', category: 'social', label: 'Yelp' },
  'identity.socialMedia.tripadvisor': { key: 'tripadvisor', category: 'social', label: 'TripAdvisor' },
  'identity.socialMedia.trustpilot': { key: 'trustpilot', category: 'social', label: 'Trustpilot' },
  'identity.socialMedia.glassdoor': { key: 'glassdoor', category: 'social', label: 'Glassdoor' },
  'identity.socialMedia.zomato': { key: 'zomato', category: 'social', label: 'Zomato' },
  'identity.socialMedia.swiggy': { key: 'swiggy', category: 'social', label: 'Swiggy' },
  'identity.socialMedia.ubereats': { key: 'ubereats', category: 'social', label: 'UberEats' },
  'identity.socialMedia.doordash': { key: 'doordash', category: 'social', label: 'DoorDash' },
  'identity.socialMedia.grubhub': { key: 'grubhub', category: 'social', label: 'Grubhub' },
  'identity.socialMedia.opentable': { key: 'opentable', category: 'social', label: 'OpenTable' },
  'identity.socialMedia.zillow': { key: 'zillow', category: 'social', label: 'Zillow' },
  'identity.socialMedia.realtor': { key: 'realtor', category: 'social', label: 'Realtor' },
  'identity.socialMedia.trulia': { key: 'trulia', category: 'social', label: 'Trulia' },
  'identity.socialMedia.houzz': { key: 'houzz', category: 'social', label: 'Houzz' },
  'identity.socialMedia.redfin': { key: 'redfin', category: 'social', label: 'Redfin' },
  'identity.socialMedia.booking': { key: 'booking', category: 'social', label: 'Booking.com' },
  'identity.socialMedia.airbnb': { key: 'airbnb', category: 'social', label: 'Airbnb' },
  'identity.socialMedia.expedia': { key: 'expedia', category: 'social', label: 'Expedia' },
  'identity.socialMedia.github': { key: 'github', category: 'social', label: 'GitHub' },
  'identity.socialMedia.behance': { key: 'behance', category: 'social', label: 'Behance' },
  'identity.socialMedia.dribbble': { key: 'dribbble', category: 'social', label: 'Dribbble' },

  // Personality
  'personality.tagline': { key: 'tagline', category: 'identity', label: 'Tagline' },
  'personality.description': { key: 'description', category: 'identity', label: 'Description' },
  'personality.uniqueSellingPoints': { key: 'unique_selling_points', category: 'identity', label: 'USPs' },
  'personality.brandValues': { key: 'brand_values', category: 'identity', label: 'Brand Values' },
  'personality.missionStatement': { key: 'mission_statement', category: 'identity', label: 'Mission Statement' },
  'personality.visionStatement': { key: 'vision_statement', category: 'identity', label: 'Vision Statement' },
  'personality.story': { key: 'story', category: 'identity', label: 'Brand Story' },
  'personality.voiceTone': { key: 'voice_tone', category: 'identity', label: 'Voice Tone' },
  'personality.foundedYear': { key: 'year_established', category: 'identity', label: 'Founded Year' },

  // Knowledge
  'knowledge.productsOrServices': { key: 'products_services', category: 'offerings', label: 'Products & Services' },
  'knowledge.services': { key: 'services', category: 'offerings', label: 'Services' },
  'knowledge.products': { key: 'products', category: 'offerings', label: 'Products' },
  'knowledge.faqs': { key: 'faqs', category: 'knowledge', label: 'FAQs' },
  'knowledge.policies': { key: 'policies', category: 'knowledge', label: 'Policies' },
  'knowledge.certifications': { key: 'certifications', category: 'credentials', label: 'Certifications' },
  'knowledge.awards': { key: 'awards', category: 'credentials', label: 'Awards' },
  'knowledge.acceptedPayments': { key: 'payment_methods', category: 'operations', label: 'Payment Methods' },
  'knowledge.paymentMethods': { key: 'payment_methods', category: 'operations', label: 'Payment Methods' },
  'knowledge.serviceCategories': { key: 'service_categories', category: 'offerings', label: 'Service Categories' },
  'knowledge.teamMembers': { key: 'team_members', category: 'team', label: 'Team Members' },
  'knowledge.keyPeople': { key: 'team_members', category: 'team', label: 'Key People' },

  // Customer Profile / Audience & Positioning
  'customerProfile.targetAudience': { key: 'target_audience', category: 'audience', label: 'Target Audience' },
  'customerProfile.primaryAudience': { key: 'primary_audience', category: 'audience', label: 'Primary Audience' },
  'customerProfile.customerType': { key: 'customer_type', category: 'audience', label: 'Customer Type' },
  'customerProfile.ageGroup': { key: 'age_group', category: 'audience', label: 'Age Group' },
  'customerProfile.incomeSegment': { key: 'income_segment', category: 'audience', label: 'Income Segment' },
  'customerProfile.painPoints': { key: 'pain_points', category: 'audience', label: 'Pain Points' },
  'customerProfile.customerPainPoints': { key: 'customer_pain_points', category: 'audience', label: 'Customer Pain Points' },
  'customerProfile.differentiators': { key: 'differentiators', category: 'audience', label: 'Differentiators' },
  'customerProfile.valuePropositions': { key: 'value_propositions', category: 'audience', label: 'Value Propositions' },
  'customerProfile.objectionHandlers': { key: 'objection_handlers', category: 'audience', label: 'Objection Handlers' },
  'customerProfile.idealCustomerProfile': { key: 'ideal_customer_profile', category: 'audience', label: 'Ideal Customer' },
  'customerProfile.customerDemographics': { key: 'demographics', category: 'audience', label: 'Demographics' },
  'customerProfile.commonQueries': { key: 'common_queries', category: 'audience', label: 'Common Queries' },
  'customerProfile.acquisitionChannels': { key: 'acquisition_channels', category: 'audience', label: 'Acquisition Channels' },

  // Industry Specific / Trust & Support
  'industrySpecificData': { key: 'industry_data', category: 'industry', label: 'Industry Data' },
  'industrySpecificData.specialization': { key: 'specializations', category: 'industry', label: 'Specializations' },
  'industrySpecificData.areasServed': { key: 'areas_served', category: 'industry', label: 'Areas Served' },
  'industrySpecificData.clientTypes': { key: 'customer_type', category: 'audience', label: 'Client Types' },
  'industrySpecificData.projectTypes': { key: 'service_categories', category: 'offerings', label: 'Project Types' },
  'industrySpecificData.yearsInBusiness': { key: 'years_in_business', category: 'trust', label: 'Years in Business' },
  'industrySpecificData.employeeCount': { key: 'employee_count', category: 'trust', label: 'Employee Count' },
  'industrySpecificData.notableClients': { key: 'notable_clients', category: 'trust', label: 'Notable Clients' },
  'industrySpecificData.registrations': { key: 'registrations', category: 'trust', label: 'Registrations' },
  'industrySpecificData.licenses': { key: 'licenses', category: 'trust', label: 'Licenses' },

  // Trust & Support - Knowledge
  'knowledge.caseStudies': { key: 'case_studies', category: 'trust', label: 'Case Studies' },
  'knowledge.keyStats': { key: 'key_stats', category: 'trust', label: 'Key Stats' },

  // Direct website scrape fields for Audience & Trust
  'targetAudience': { key: 'target_audience', category: 'audience', label: 'Target Audience' },
  'target_audience': { key: 'target_audience', category: 'audience', label: 'Target Audience' },
  'targetCustomers': { key: 'primary_audience', category: 'audience', label: 'Target Customers' },
  'target_customers': { key: 'primary_audience', category: 'audience', label: 'Target Customers' },
  'idealCustomer': { key: 'ideal_customer_profile', category: 'audience', label: 'Ideal Customer' },
  'ideal_customer': { key: 'ideal_customer_profile', category: 'audience', label: 'Ideal Customer' },
  'customerTypes': { key: 'customer_type', category: 'audience', label: 'Customer Types' },
  'customer_types': { key: 'customer_type', category: 'audience', label: 'Customer Types' },
  'whoWeServe': { key: 'primary_audience', category: 'audience', label: 'Who We Serve' },
  'who_we_serve': { key: 'primary_audience', category: 'audience', label: 'Who We Serve' },
  'ourCustomers': { key: 'primary_audience', category: 'audience', label: 'Our Customers' },
  'our_customers': { key: 'primary_audience', category: 'audience', label: 'Our Customers' },
  'audience': { key: 'target_audience', category: 'audience', label: 'Audience' },
  'demographics': { key: 'demographics', category: 'audience', label: 'Demographics' },
  'customerDemographics': { key: 'demographics', category: 'audience', label: 'Customer Demographics' },
  'ageGroups': { key: 'age_group', category: 'audience', label: 'Age Groups' },
  'age_groups': { key: 'age_group', category: 'audience', label: 'Age Groups' },
  'targetAge': { key: 'age_group', category: 'audience', label: 'Target Age' },

  // Pain points and value propositions
  'painPoints': { key: 'pain_points', category: 'audience', label: 'Pain Points' },
  'pain_points': { key: 'pain_points', category: 'audience', label: 'Pain Points' },
  'customerProblems': { key: 'pain_points', category: 'audience', label: 'Customer Problems' },
  'customer_problems': { key: 'pain_points', category: 'audience', label: 'Customer Problems' },
  'problemsSolved': { key: 'pain_points', category: 'audience', label: 'Problems Solved' },
  'problems_solved': { key: 'pain_points', category: 'audience', label: 'Problems Solved' },
  'challenges': { key: 'pain_points', category: 'audience', label: 'Challenges' },
  'customerChallenges': { key: 'pain_points', category: 'audience', label: 'Customer Challenges' },

  // Differentiators and USPs
  'differentiators': { key: 'differentiators', category: 'audience', label: 'Differentiators' },
  'uniqueSellingPoints': { key: 'differentiators', category: 'audience', label: 'USPs' },
  'unique_selling_points': { key: 'differentiators', category: 'audience', label: 'USPs' },
  'usps': { key: 'differentiators', category: 'audience', label: 'USPs' },
  'whyChooseUs': { key: 'differentiators', category: 'audience', label: 'Why Choose Us' },
  'why_choose_us': { key: 'differentiators', category: 'audience', label: 'Why Choose Us' },
  'whyUs': { key: 'differentiators', category: 'audience', label: 'Why Us' },
  'why_us': { key: 'differentiators', category: 'audience', label: 'Why Us' },
  'whatMakesUsDifferent': { key: 'differentiators', category: 'audience', label: 'What Makes Us Different' },
  'competitive_advantage': { key: 'differentiators', category: 'audience', label: 'Competitive Advantage' },
  'competitiveAdvantage': { key: 'differentiators', category: 'audience', label: 'Competitive Advantage' },
  'strengths': { key: 'differentiators', category: 'audience', label: 'Strengths' },
  'ourAdvantages': { key: 'differentiators', category: 'audience', label: 'Our Advantages' },

  // Value propositions
  'valuePropositions': { key: 'value_propositions', category: 'audience', label: 'Value Propositions' },
  'value_propositions': { key: 'value_propositions', category: 'audience', label: 'Value Propositions' },
  'valueProps': { key: 'value_propositions', category: 'audience', label: 'Value Props' },
  'benefits': { key: 'value_propositions', category: 'audience', label: 'Benefits' },
  'customerBenefits': { key: 'value_propositions', category: 'audience', label: 'Customer Benefits' },
  'customer_benefits': { key: 'value_propositions', category: 'audience', label: 'Customer Benefits' },
  'keyBenefits': { key: 'value_propositions', category: 'audience', label: 'Key Benefits' },
  'key_benefits': { key: 'value_propositions', category: 'audience', label: 'Key Benefits' },
  'whatWeOffer': { key: 'value_propositions', category: 'audience', label: 'What We Offer' },
  'ourPromise': { key: 'value_propositions', category: 'audience', label: 'Our Promise' },

  // Objection handlers
  'objectionHandlers': { key: 'objection_handlers', category: 'audience', label: 'Objection Handlers' },
  'objection_handlers': { key: 'objection_handlers', category: 'audience', label: 'Objection Handlers' },
  'commonObjections': { key: 'objection_handlers', category: 'audience', label: 'Common Objections' },
  'common_objections': { key: 'objection_handlers', category: 'audience', label: 'Common Objections' },
  'concerns': { key: 'objection_handlers', category: 'audience', label: 'Concerns' },
  'customerConcerns': { key: 'objection_handlers', category: 'audience', label: 'Customer Concerns' },

  // B2B/B2C indicators
  'businessModel': { key: 'customer_type', category: 'audience', label: 'Business Model' },
  'business_model': { key: 'customer_type', category: 'audience', label: 'Business Model' },
  'b2b': { key: 'customer_type', category: 'audience', label: 'B2B' },
  'b2c': { key: 'customer_type', category: 'audience', label: 'B2C' },
  'clientTypes': { key: 'customer_type', category: 'audience', label: 'Client Types' },
  'client_types': { key: 'customer_type', category: 'audience', label: 'Client Types' },
  'segmentServed': { key: 'customer_type', category: 'audience', label: 'Segment Served' },
  'marketSegment': { key: 'customer_type', category: 'audience', label: 'Market Segment' },
  'market_segment': { key: 'customer_type', category: 'audience', label: 'Market Segment' },

  // ========== NESTED SCRAPER STRUCTURES ==========
  // customerInsights nested object (from website scraper AI extraction)
  'customerInsights': { key: 'customer_insights', category: 'audience', label: 'Customer Insights' },
  'customerInsights.painPoints': { key: 'pain_points', category: 'audience', label: 'Pain Points' },
  'customerInsights.valuePropositions': { key: 'value_propositions', category: 'audience', label: 'Value Propositions' },
  'customerInsights.targetAgeGroups': { key: 'age_group', category: 'audience', label: 'Target Age Groups' },
  'customerInsights.incomeSegments': { key: 'income_segment', category: 'audience', label: 'Income Segments' },
  'customerInsights.targetAudience': { key: 'target_audience', category: 'audience', label: 'Target Audience' },
  'customerInsights.customerType': { key: 'customer_type', category: 'audience', label: 'Customer Type' },
  'customerInsights.demographics': { key: 'demographics', category: 'audience', label: 'Demographics' },
  'customerInsights.buyingMotivations': { key: 'value_propositions', category: 'audience', label: 'Buying Motivations' },
  'customerInsights.commonObjections': { key: 'objection_handlers', category: 'audience', label: 'Common Objections' },
  'customerInsights.purchaseFrequency': { key: 'common_queries', category: 'audience', label: 'Purchase Frequency' },

  // competitiveIntel nested object (from website scraper AI extraction)
  'competitiveIntel': { key: 'competitive_intel', category: 'audience', label: 'Competitive Intel' },
  'competitiveIntel.differentiators': { key: 'differentiators', category: 'audience', label: 'Differentiators' },
  'competitiveIntel.competitiveAdvantages': { key: 'differentiators', category: 'audience', label: 'Competitive Advantages' },
  'competitiveIntel.uniqueFeatures': { key: 'differentiators', category: 'audience', label: 'Unique Features' },
  'competitiveIntel.marketPosition': { key: 'value_propositions', category: 'audience', label: 'Market Position' },
  'competitiveIntel.pricingStrategy': { key: 'pricing_model', category: 'knowledge', label: 'Pricing Strategy' },
  'competitiveIntel.targetMarket': { key: 'target_audience', category: 'audience', label: 'Target Market' },

  // aiExtracted nested object (from AI-powered website scraping)
  'aiExtracted': { key: 'ai_extracted', category: 'other', label: 'AI Extracted Data' },
  'aiExtracted.targetAudience': { key: 'target_audience', category: 'audience', label: 'Target Audience' },
  'aiExtracted.customerType': { key: 'customer_type', category: 'audience', label: 'Customer Type' },
  'aiExtracted.painPoints': { key: 'pain_points', category: 'audience', label: 'Pain Points' },
  'aiExtracted.valuePropositions': { key: 'value_propositions', category: 'audience', label: 'Value Propositions' },
  'aiExtracted.differentiators': { key: 'differentiators', category: 'audience', label: 'Differentiators' },
  'aiExtracted.usps': { key: 'differentiators', category: 'audience', label: 'USPs' },
  'aiExtracted.demographics': { key: 'demographics', category: 'audience', label: 'Demographics' },
  'aiExtracted.ageGroups': { key: 'age_group', category: 'audience', label: 'Age Groups' },
  'aiExtracted.incomeSegment': { key: 'income_segment', category: 'audience', label: 'Income Segment' },

  // Additional nested structures
  'marketingData': { key: 'marketing_data', category: 'audience', label: 'Marketing Data' },
  'marketingData.targetAudience': { key: 'target_audience', category: 'audience', label: 'Target Audience' },
  'marketingData.idealCustomer': { key: 'ideal_customer_profile', category: 'audience', label: 'Ideal Customer' },
  'marketingData.buyerPersona': { key: 'ideal_customer_profile', category: 'audience', label: 'Buyer Persona' },

  'clientList': { key: 'notable_clients', category: 'trust', label: 'Client List' },
  'clients': { key: 'notable_clients', category: 'trust', label: 'Clients' },
  'caseStudies': { key: 'case_studies', category: 'trust', label: 'Case Studies' },
  'yearsInBusiness': { key: 'years_in_business', category: 'trust', label: 'Years in Business' },
  'founded': { key: 'year_established', category: 'identity', label: 'Founded' },
  'teamSize': { key: 'employee_count', category: 'trust', label: 'Team Size' },
  'employees': { key: 'employee_count', category: 'trust', label: 'Employees' },
  'licenses': { key: 'licenses', category: 'trust', label: 'Licenses' },

  // From the web section
  'fromTheWeb.additionalInfo': { key: 'additional_info', category: 'other', label: 'Additional Info' },
  'fromTheWeb.otherFindings': { key: 'other_findings', category: 'other', label: 'Other Findings' },

  // Online Presence & Press
  'onlinePresence': { key: 'online_presence', category: 'reputation', label: 'Online Presence' },
  'pressMedia': { key: 'press_media', category: 'reputation', label: 'Press & Media' },

  // Inventory (Industry-Specific)
  'inventory.rooms': { key: 'room_types', category: 'inventory', label: 'Room Types' },
  'inventory.menuItems': { key: 'menu_items', category: 'inventory', label: 'Menu Items' },
  'inventory.products': { key: 'product_catalog', category: 'inventory', label: 'Product Catalog' },
  'inventory.services': { key: 'healthcare_services', category: 'inventory', label: 'Healthcare Services' },
  'inventory.properties': { key: 'property_listings', category: 'inventory', label: 'Property Listings' },

  // Testimonials & Reviews
  'testimonials': { key: 'testimonials', category: 'reputation', label: 'Testimonials' },
  'reviews': { key: 'reviews', category: 'reputation', label: 'Reviews' },

  // Direct root-level mappings (for data that comes at root level)
  'instagram': { key: 'instagram', category: 'social', label: 'Instagram' },
  'facebook': { key: 'facebook', category: 'social', label: 'Facebook' },
  'linkedin': { key: 'linkedin', category: 'social', label: 'LinkedIn' },
  'twitter': { key: 'twitter', category: 'social', label: 'Twitter' },
  'youtube': { key: 'youtube', category: 'social', label: 'YouTube' },
  'tiktok': { key: 'tiktok', category: 'social', label: 'TikTok' },
  'whatsapp': { key: 'whatsapp', category: 'social', label: 'WhatsApp' },
};

/**
 * Transform raw Google Places data to standardized format
 */
export async function standardizeGoogleImportData(
  rawData: any,
  placeId: string,
  placeName: string,
  checkedFields: Record<string, boolean> = {}
): Promise<StandardizedImportStorage> {
  const sessionId = uuidv4();
  const importedAt = new Date().toISOString();
  const dataPoints: StandardizedImportDataPoint[] = [];

  function extractDataPoints(obj: any, pathPrefix: string = '') {
    if (!obj || typeof obj !== 'object') return;

    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) continue;

      const fullPath = pathPrefix ? `${pathPrefix}.${key}` : key;
      const mapping = GOOGLE_KEY_MAP[fullPath] || GOOGLE_KEY_MAP[key];

      if (mapping) {
        const dataPoint: StandardizedImportDataPoint = {
          id: `google_${mapping.key}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          key: mapping.key,
          value: value as any,
          source: 'google',
          checked: checkedFields[fullPath] ?? checkedFields[key] ?? true,
          confidence: 0.95, // Google data is generally high confidence
          imported_at: importedAt,
          raw_context: {
            original_key: key,
            original_path: fullPath,
            extraction_method: 'direct',
          },
          display_label: mapping.label,
          category: mapping.category,
        };
        dataPoints.push(dataPoint);
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        // Recurse into nested objects
        extractDataPoints(value, fullPath);
      } else if (Array.isArray(value) && value.length > 0) {
        // Handle arrays that aren't mapped - store as unmapped
        const unmappedPoint: StandardizedImportDataPoint = {
          id: `google_unmapped_${key}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          key: `unmapped_${key}`,
          value: value,
          source: 'google',
          checked: false,
          confidence: 0.7,
          imported_at: importedAt,
          raw_context: {
            original_key: key,
            original_path: fullPath,
            extraction_method: 'direct',
          },
          display_label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          category: 'unmapped',
        };
        dataPoints.push(unmappedPoint);
      }
    }
  }

  extractDataPoints(rawData);

  return {
    version: '1.0',
    data_points: dataPoints,
    import_session: {
      id: sessionId,
      source: 'google',
      source_identifier: placeId,
      imported_at: importedAt,
    },
    raw_data_backup: rawData,
  };
}

/**
 * Transform raw website scrape data to standardized format
 */
export async function standardizeWebsiteImportData(
  rawData: any,
  url: string,
  pagesScraped: string[] = [],
  checkedFields: Record<string, boolean> = {}
): Promise<StandardizedImportStorage> {
  const sessionId = uuidv4();
  const importedAt = new Date().toISOString();
  const dataPoints: StandardizedImportDataPoint[] = [];

  function extractDataPoints(obj: any, pathPrefix: string = '') {
    if (!obj || typeof obj !== 'object') return;

    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) continue;

      const fullPath = pathPrefix ? `${pathPrefix}.${key}` : key;
      const mapping = WEBSITE_KEY_MAP[fullPath] || WEBSITE_KEY_MAP[key];

      if (mapping) {
        const dataPoint: StandardizedImportDataPoint = {
          id: `website_${mapping.key}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          key: mapping.key,
          value: value as any,
          source: 'website',
          checked: checkedFields[fullPath] ?? checkedFields[key] ?? true,
          confidence: 0.8, // Website data slightly lower confidence than Google
          imported_at: importedAt,
          raw_context: {
            original_key: key,
            original_path: fullPath,
            extraction_method: (rawData as any)._aiExtracted ? 'ai' : 'direct',
          },
          display_label: mapping.label,
          category: mapping.category,
        };
        dataPoints.push(dataPoint);
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        extractDataPoints(value, fullPath);
      } else if (typeof value === 'string' && value.length > 0) {
        // Store non-mapped string values as unmapped
        const unmappedPoint: StandardizedImportDataPoint = {
          id: `website_unmapped_${key}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          key: `unmapped_${key}`,
          value: value,
          source: 'website',
          checked: false,
          confidence: 0.6,
          imported_at: importedAt,
          raw_context: {
            original_key: key,
            original_path: fullPath,
            extraction_method: 'direct',
          },
          display_label: key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()),
          category: 'unmapped',
        };
        dataPoints.push(unmappedPoint);
      }
    }
  }

  extractDataPoints(rawData);

  return {
    version: '1.0',
    data_points: dataPoints,
    import_session: {
      id: sessionId,
      source: 'website',
      source_identifier: url,
      imported_at: importedAt,
      pages_scraped: pagesScraped,
    },
    raw_data_backup: rawData,
  };
}

/**
 * Export standardized import data grouped by key
 * This is the deterministic export mechanism for downstream consumers
 */
export async function exportStandardizedImportData(
  partnerId: string
): Promise<{ success: boolean; export?: ImportDataExport; error?: string }> {
  if (!db) {
    return { success: false, error: 'Database unavailable' };
  }

  try {
    const partnerRef = db.collection('partners').doc(partnerId);
    const partnerDoc = await partnerRef.get();

    if (!partnerDoc.exists) {
      return { success: false, error: 'Partner not found' };
    }

    const data = partnerDoc.data();
    const persona = data?.businessPersona || {};
    const standardizedImports = persona.standardizedImports || {};

    const allDataPoints: StandardizedImportDataPoint[] = [];
    const sources: ImportDataExport['sources'] = {};

    // Collect Google data points
    if (standardizedImports.google?.data_points) {
      allDataPoints.push(...standardizedImports.google.data_points);
      sources.google = {
        place_id: standardizedImports.google.import_session?.source_identifier,
        place_name: persona.importedData?.google?.placeName,
        imported_at: standardizedImports.google.import_session?.imported_at || '',
      };
    }

    // Collect Website data points
    if (standardizedImports.website?.data_points) {
      allDataPoints.push(...standardizedImports.website.data_points);
      sources.website = {
        url: standardizedImports.website.import_session?.source_identifier,
        pages_scraped: standardizedImports.website.import_session?.pages_scraped,
        imported_at: standardizedImports.website.import_session?.imported_at || '',
      };
    }

    // Group by key
    const dataByKey: Record<string, StandardizedImportDataPoint[]> = {};
    for (const point of allDataPoints) {
      if (!dataByKey[point.key]) {
        dataByKey[point.key] = [];
      }
      dataByKey[point.key].push(point);
    }

    const exportData: ImportDataExport = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      partner_id: partnerId,
      data_by_key: dataByKey,
      sources,
    };

    return { success: true, export: exportData };
  } catch (error: any) {
    console.error('[ExportImportData] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Update checked status for a data point
 * Called when user toggles checkbox in Import Center UI
 */
export async function updateImportDataPointCheckedStatus(
  partnerId: string,
  dataPointId: string,
  checked: boolean,
  source: 'google' | 'website'
): Promise<{ success: boolean; error?: string }> {
  if (!db) {
    return { success: false, error: 'Database unavailable' };
  }

  try {
    const partnerRef = db.collection('partners').doc(partnerId);
    const partnerDoc = await partnerRef.get();

    if (!partnerDoc.exists) {
      return { success: false, error: 'Partner not found' };
    }

    const data = partnerDoc.data();
    const persona = data?.businessPersona || {};
    const standardizedImports = persona.standardizedImports || {};
    const sourceStorage = standardizedImports[source];

    if (!sourceStorage?.data_points) {
      return { success: false, error: 'No import data found' };
    }

    // Find and update the data point
    const updatedDataPoints = sourceStorage.data_points.map((point: StandardizedImportDataPoint) => {
      if (point.id === dataPointId) {
        return { ...point, checked };
      }
      return point;
    });

    // Save back
    await partnerRef.update({
      [`businessPersona.standardizedImports.${source}.data_points`]: updatedDataPoints,
    });

    return { success: true };
  } catch (error: any) {
    console.error('[UpdateCheckedStatus] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get standardized import data for a partner
 */
export async function getStandardizedImportData(
  partnerId: string
): Promise<{
  success: boolean;
  google?: StandardizedImportStorage;
  website?: StandardizedImportStorage;
  error?: string
}> {
  if (!db) {
    return { success: false, error: 'Database unavailable' };
  }

  try {
    const partnerRef = db.collection('partners').doc(partnerId);
    const partnerDoc = await partnerRef.get();

    if (!partnerDoc.exists) {
      return { success: false, error: 'Partner not found' };
    }

    const data = partnerDoc.data();
    const standardizedImports = data?.businessPersona?.standardizedImports || {};

    return {
      success: true,
      google: standardizedImports.google,
      website: standardizedImports.website,
    };
  } catch (error: any) {
    console.error('[GetStandardizedImportData] Error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// CANONICAL PROFILE MAPPING
// ============================================

/**
 * Set a value at a dot-notation path in an object
 */
function setNestedValue(obj: any, path: string, value: any, merge: 'replace' | 'append' | 'merge' = 'replace'): void {
  const parts = path.split('.');
  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current[part]) {
      current[part] = {};
    }
    current = current[part];
  }

  const lastKey = parts[parts.length - 1];

  if (merge === 'append' && Array.isArray(current[lastKey])) {
    // Append to existing array
    if (Array.isArray(value)) {
      current[lastKey] = [...current[lastKey], ...value];
    } else {
      current[lastKey].push(value);
    }
  } else if (merge === 'merge' && typeof current[lastKey] === 'object' && typeof value === 'object') {
    // Merge objects
    current[lastKey] = { ...current[lastKey], ...value };
  } else {
    // Replace value
    current[lastKey] = value;
  }
}

/**
 * Get a value at a dot-notation path in an object
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

/**
 * Map standardized import data to canonical BusinessPersona profile
 * This is the deterministic mapping function that ensures data goes to the right place
 */
export async function mapStandardizedDataToCanonicalProfile(
  standardizedImports: {
    google?: StandardizedImportStorage;
    website?: StandardizedImportStorage;
  },
  existingPersona?: Partial<BusinessPersona>,
  options: {
    onlyChecked?: boolean;  // Only map data points that user checked
    preferSource?: 'google' | 'website';  // Prefer one source over another for conflicts
  } = {}
): Promise<{
  success: boolean;
  profile?: Partial<BusinessPersona>;
  mappedFields?: string[];
  unmappedData?: StandardizedImportDataPoint[];
  error?: string;
}> {
  try {
    console.log('[MapStandardizedData] Starting canonical mapping...');

    const { onlyChecked = true, preferSource = 'website' } = options;

    // Collect all data points from both sources
    const allDataPoints: StandardizedImportDataPoint[] = [];

    if (standardizedImports.google?.data_points) {
      allDataPoints.push(...standardizedImports.google.data_points);
    }
    if (standardizedImports.website?.data_points) {
      allDataPoints.push(...standardizedImports.website.data_points);
    }

    // Filter by checked status if requested
    const dataPointsToMap = onlyChecked
      ? allDataPoints.filter(dp => dp.checked)
      : allDataPoints;

    // Group by semantic key to handle conflicts
    const byKey: Record<string, StandardizedImportDataPoint[]> = {};
    for (const dp of dataPointsToMap) {
      if (!byKey[dp.key]) {
        byKey[dp.key] = [];
      }
      byKey[dp.key].push(dp);
    }

    // Start with existing persona or empty object
    const profile: Partial<BusinessPersona> = existingPersona
      ? JSON.parse(JSON.stringify(existingPersona))  // Deep clone
      : {};

    const mappedFields: string[] = [];
    const unmappedData: StandardizedImportDataPoint[] = [];

    // Process each semantic key
    for (const [semanticKey, dataPoints] of Object.entries(byKey)) {
      const mapping = CANONICAL_FIELD_MAP[semanticKey];

      if (!mapping) {
        // No canonical mapping - goes to unmapped/additional data
        unmappedData.push(...dataPoints);
        continue;
      }

      // Choose the best data point if there are multiple
      let selectedDataPoint: StandardizedImportDataPoint;

      if (dataPoints.length === 1) {
        selectedDataPoint = dataPoints[0];
      } else {
        // Multiple data points - resolve conflict
        // Sort by: 1) Preferred source, 2) Higher confidence, 3) More recent
        const sorted = [...dataPoints].sort((a, b) => {
          // Preferred source first
          if (a.source === preferSource && b.source !== preferSource) return -1;
          if (b.source === preferSource && a.source !== preferSource) return 1;

          // Higher confidence second
          if (a.confidence !== b.confidence) return b.confidence - a.confidence;

          // More recent third
          return new Date(b.imported_at).getTime() - new Date(a.imported_at).getTime();
        });

        selectedDataPoint = sorted[0];
      }

      // Apply transform if defined
      let value = selectedDataPoint.value;
      if (mapping.transform) {
        value = mapping.transform(value);
      }

      // Set the value in the profile
      setNestedValue(profile, mapping.canonicalPath, value, mapping.merge);
      mappedFields.push(mapping.canonicalPath);
    }

    // Handle unmapped data - store in webIntelligence.otherUsefulData
    if (unmappedData.length > 0) {
      if (!profile.webIntelligence) {
        profile.webIntelligence = {};
      }

      const existingOther = (profile.webIntelligence as any).otherUsefulData || [];

      (profile.webIntelligence as any).otherUsefulData = [
        ...existingOther,
        ...unmappedData
          .filter(dp => !dp.key.startsWith('unmapped_'))  // Skip already-unmapped items
          .map(dp => ({
            key: dp.display_label || dp.key,
            value: typeof dp.value === 'string' ? dp.value : JSON.stringify(dp.value),
            source: dp.source,
          })),
      ];
    }

    console.log('[MapStandardizedData] Complete. Mapped fields:', mappedFields.length, 'Unmapped:', unmappedData.length);

    return {
      success: true,
      profile,
      mappedFields,
      unmappedData,
    };
  } catch (error: any) {
    console.error('[MapStandardizedData] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Apply standardized import data to a partner's canonical profile
 * This is the main entry point for transferring data from import-center to settings
 */
export async function applyStandardizedImportToProfile(
  partnerId: string,
  options: {
    onlyChecked?: boolean;
    preferSource?: 'google' | 'website';
  } = {}
): Promise<{
  success: boolean;
  mappedFields?: string[];
  unmappedCount?: number;
  error?: string;
}> {
  if (!db) {
    return { success: false, error: 'Database unavailable' };
  }

  try {
    // Get current partner data
    const partnerRef = db.collection('partners').doc(partnerId);
    const partnerDoc = await partnerRef.get();

    if (!partnerDoc.exists) {
      return { success: false, error: 'Partner not found' };
    }

    const data = partnerDoc.data();
    const existingPersona = data?.businessPersona || {};
    const standardizedImports = existingPersona.standardizedImports || {};

    if (!standardizedImports.google && !standardizedImports.website) {
      return { success: false, error: 'No standardized import data found' };
    }

    // Map the standardized data to canonical profile
    const mappingResult = await mapStandardizedDataToCanonicalProfile(
      standardizedImports,
      existingPersona,
      options
    );

    if (!mappingResult.success || !mappingResult.profile) {
      return { success: false, error: mappingResult.error };
    }

    // Save the mapped profile
    await partnerRef.update({
      businessPersona: mappingResult.profile,
    });

    return {
      success: true,
      mappedFields: mappingResult.mappedFields,
      unmappedCount: mappingResult.unmappedData?.length || 0,
    };
  } catch (error: any) {
    console.error('[ApplyStandardizedImport] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get mapping preview without applying changes
 * Useful for showing users what will be mapped before they confirm
 */
export async function previewStandardizedImportMapping(
  partnerId: string,
  options: {
    onlyChecked?: boolean;
    preferSource?: 'google' | 'website';
  } = {}
): Promise<{
  success: boolean;
  preview?: {
    mappedFields: Array<{
      canonicalPath: string;
      value: any;
      source: 'google' | 'website';
      confidence: number;
    }>;
    unmappedData: Array<{
      key: string;
      value: any;
      source: 'google' | 'website';
      displayLabel?: string;
    }>;
  };
  error?: string;
}> {
  if (!db) {
    return { success: false, error: 'Database unavailable' };
  }

  try {
    const partnerRef = db.collection('partners').doc(partnerId);
    const partnerDoc = await partnerRef.get();

    if (!partnerDoc.exists) {
      return { success: false, error: 'Partner not found' };
    }

    const data = partnerDoc.data();
    const standardizedImports = data?.businessPersona?.standardizedImports || {};

    const { onlyChecked = true, preferSource = 'website' } = options;

    // Collect all data points
    const allDataPoints: StandardizedImportDataPoint[] = [];

    if (standardizedImports.google?.data_points) {
      allDataPoints.push(...standardizedImports.google.data_points);
    }
    if (standardizedImports.website?.data_points) {
      allDataPoints.push(...standardizedImports.website.data_points);
    }

    const dataPointsToMap = onlyChecked
      ? allDataPoints.filter(dp => dp.checked)
      : allDataPoints;

    // Group by key
    const byKey: Record<string, StandardizedImportDataPoint[]> = {};
    for (const dp of dataPointsToMap) {
      if (!byKey[dp.key]) {
        byKey[dp.key] = [];
      }
      byKey[dp.key].push(dp);
    }

    const mappedFields: Array<{
      canonicalPath: string;
      value: any;
      source: 'google' | 'website';
      confidence: number;
    }> = [];

    const unmappedData: Array<{
      key: string;
      value: any;
      source: 'google' | 'website';
      displayLabel?: string;
    }> = [];

    for (const [semanticKey, dataPoints] of Object.entries(byKey)) {
      const mapping = CANONICAL_FIELD_MAP[semanticKey];

      if (!mapping) {
        // Unmapped
        for (const dp of dataPoints) {
          unmappedData.push({
            key: dp.key,
            value: dp.value,
            source: dp.source,
            displayLabel: dp.display_label,
          });
        }
        continue;
      }

      // Select best data point
      const sorted = [...dataPoints].sort((a, b) => {
        if (a.source === preferSource && b.source !== preferSource) return -1;
        if (b.source === preferSource && a.source !== preferSource) return 1;
        if (a.confidence !== b.confidence) return b.confidence - a.confidence;
        return new Date(b.imported_at).getTime() - new Date(a.imported_at).getTime();
      });

      const selected = sorted[0];
      let value = selected.value;
      if (mapping.transform) {
        value = mapping.transform(value);
      }

      mappedFields.push({
        canonicalPath: mapping.canonicalPath,
        value,
        source: selected.source,
        confidence: selected.confidence,
      });
    }

    return {
      success: true,
      preview: {
        mappedFields,
        unmappedData,
      },
    };
  } catch (error: any) {
    console.error('[PreviewMapping] Error:', error);
    return { success: false, error: error.message };
  }
}
