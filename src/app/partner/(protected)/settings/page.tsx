"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getPartnerProfileAction } from '@/actions/get-partner-profile';
import { getBusinessPersonaAction, saveBusinessPersonaAction, clearBusinessPersonaAction } from '@/actions/business-persona-actions';

import { getPartnerInvitationCodesAction, generateEmployeeInvitationCodeAction, cancelInvitationCodeAction } from '@/actions/partner-invitation-management';
import { searchBusinessesAction, autoFillProfileAction, getEmptyProfileAction, mapInventoryToPersonaAction, processForRAGAction } from '@/actions/business-autofill-actions';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Partner } from '@/lib/types';
import type {
  BusinessPersona,
  IndustryCategory,
  OperatingHours,
  ProductService,
  FrequentlyAskedQuestion
} from '@/lib/business-persona-types';
import ProfileDocuments from '@/components/partner/settings/ProfileDocuments';
import ProfileSummary from '@/components/partner/settings/ProfileSummary';
import FieldConnectionAudit from '@/components/partner/settings/FieldConnectionAudit';
import BusinessProfileAgent from '@/components/partner/settings/BusinessProfileAgent';
import AutoFillPreviewModal from '@/components/partner/settings/AutoFillPreviewModal';
import BusinessProfileView from '@/components/partner/settings/BusinessProfileView';

const SettingsUltimate = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // State
  const [activeTab, setActiveTab] = useState('profile');
  const [selectedBusinessTypes, setSelectedBusinessTypes] = useState<string[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>('identity');
  const [showAIChat, setShowAIChat] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState<{ name: string; phone: string; role: 'employee' | 'partner_admin' }>({ name: '', phone: '', role: 'employee' });
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [teamFilter, setTeamFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Business Auto-Fill State
  const [autoFillSearch, setAutoFillSearch] = useState('');
  const [autoFillResults, setAutoFillResults] = useState<any[]>([]);
  const [autoFillSearching, setAutoFillSearching] = useState(false);
  const [autoFilling, setAutoFilling] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [showAutoFillPreview, setShowAutoFillPreview] = useState(false);
  const [autoFillPreviewData, setAutoFillPreviewData] = useState<any>(null);
  const [isApplyingAutoFill, setIsApplyingAutoFill] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // RAG Processing State
  const [ragProcessing, setRagProcessing] = useState(false);
  const [ragStatus, setRagStatus] = useState<{
    processed: boolean;
    lastProcessedAt?: Date;
    documentId?: string;
    itemCounts?: { reviews: number; faqs: number; inventory: boolean };
  } | null>(null);

  // Debounced search function
  const debouncedSearch = useCallback(async (query: string) => {
    if (query.length < 3) {
      setAutoFillResults([]);
      return;
    }

    setAutoFillSearching(true);
    try {
      const result = await searchBusinessesAction(query);
      if (result.success && result.results) {
        setAutoFillResults(result.results);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setAutoFillSearching(false);
    }
  }, []);

  // Data State
  const [partner, setPartner] = useState<Partner | null>(null);
  const [persona, setPersona] = useState<Partial<BusinessPersona>>({});
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [integrations, setIntegrations] = useState<any[]>([]);

  // Derived State
  const partnerId = user?.customClaims?.partnerId;
  const userRole = user?.customClaims?.role || 'member';
  const isAdmin = userRole === 'partner_admin' || userRole === 'Super Admin';
  const profileScore = persona.setupProgress?.overallPercentage || 0;

  // Initialize Data
  useEffect(() => {
    if (activeTab === 'profile' && !loading && !persona.identity?.industry) {
      // If persona loaded but no industry, show onboarding
      // But only if we are not loading.
      // Actually, let's rely on the fetch logic.
    }
  }, [loading, activeTab, persona]);

  useEffect(() => {
    if (!partnerId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Partner, Persona, and Invitations
        const [profileResult, personaResult, invitationsResult] = await Promise.all([
          getPartnerProfileAction(partnerId),
          getBusinessPersonaAction(partnerId),
          getPartnerInvitationCodesAction(partnerId)
        ]);

        if (profileResult.success && profileResult.partner) {
          setPartner(profileResult.partner);
        }

        if (personaResult.success && personaResult.persona) {
          setPersona(personaResult.persona);
          // Set initial business type from persona
          // Load saved business types (could be single category or array)
          const savedCategory = personaResult.persona.identity?.industry?.category;
          if (savedCategory) {
            // Support both old single-value and new multi-value format
            if (Array.isArray(savedCategory)) {
              setSelectedBusinessTypes(savedCategory);
            } else {
              setSelectedBusinessTypes([savedCategory]);
            }
          } else if (personaResult.isNewPersona) {
            setShowOnboarding(true);
          }

          // Load RAG status from persona
          const savedRagStatus = personaResult.persona.industrySpecificData?.ragStatus;
          if (savedRagStatus?.processed) {
            setRagStatus({
              processed: true,
              lastProcessedAt: savedRagStatus.lastProcessedAt,
              documentId: savedRagStatus.documentId,
              itemCounts: {
                reviews: personaResult.persona.industrySpecificData?.fetchedReviews?.length || 0,
                faqs: personaResult.persona.knowledge?.faqs?.length || 0,
                inventory: !!(
                  personaResult.persona.roomTypes?.length ||
                  personaResult.persona.menuItems?.length ||
                  personaResult.persona.productCatalog?.length ||
                  personaResult.persona.propertyListings?.length ||
                  personaResult.persona.healthcareServices?.length
                ),
              },
            });
          }
        }

        if (invitationsResult.success && invitationsResult.invitations) {
          setInvitations(invitationsResult.invitations);
        }

        // 2. Fetch Team Members
        const teamRef = collection(db, "teamMembers");
        const q = query(teamRef, where("partnerId", "==", partnerId));
        const snapshot = await getDocs(q);
        const members = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTeamMembers(members);

        // 3. Fetch Integrations Status (Mock or Real)
        // Check WhatsApp from partner data
        const waConnected = !!profileResult.partner?.whatsAppPhone;
        // Check Telegram
        const tgConnected = !!profileResult.partner?.telegramConfig?.isConnected;

        setIntegrations([
          { id: 'whatsapp', name: 'WhatsApp Business', icon: '💬', status: waConnected ? 'connected' : 'not_connected', account: profileResult.partner?.whatsAppPhone },
          { id: 'telegram', name: 'Telegram', icon: '✈️', status: tgConnected ? 'connected' : 'not_connected', account: profileResult.partner?.telegramConfig?.botUsername },
          { id: 'sms', name: 'SMS (Twilio)', icon: '📱', status: 'not_connected', account: null }, // Placeholder
          { id: 'email', name: 'Email', icon: '✉️', status: 'connected', account: profileResult.partner?.email },
        ]);

      } catch (error) {
        console.error("Error fetching settings data:", error);
        toast.error("Failed to load settings data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [partnerId]);


  // Field Updates Logic
  const handleFieldUpdate = async (path: string, value: any) => {
    if (!partnerId) return;

    // Update local state immediately for UI responsiveness
    setPersona(prev => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current: any = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newData;
    });

    // Debounced save could be better, but for now strict save on blur/change
    try {
      // Construct partial update object
      const updateObj: any = {};
      const keys = path.split('.');
      if (keys.length === 1) updateObj[keys[0]] = value;
      else if (keys.length === 2) updateObj[keys[0]] = { [keys[1]]: value };
      else if (keys.length === 3) updateObj[keys[0]] = { [keys[1]]: { [keys[2]]: value } };

      // For arrays like USPs, we need to pass the whole array, which we do via value

      await saveBusinessPersonaAction(partnerId, updateObj as Partial<BusinessPersona>);
    } catch (e) {
      console.error("Save failed", e);
      toast.error("Failed to save changes");
    }
  };

  const handleSendInvite = async () => {
    if (!partnerId || !user?.uid) return;
    setSaving(true);
    try {
      const result = await generateEmployeeInvitationCodeAction({
        name: inviteForm.name,
        phoneNumber: inviteForm.phone,
        role: inviteForm.role,
        partnerId: partnerId,
        invitedBy: user.uid
      });

      if (result.success && result.invitationCode) {
        setGeneratedCode(result.invitationCode);
        toast.success("Invitation generated!");
        // Refresh invitations
        const invResults = await getPartnerInvitationCodesAction(partnerId);
        if (invResults.success) setInvitations(invResults.invitations || []);
      } else {
        toast.error(result.message || "Failed to generate invitation");
      }
    } catch (error) {
      toast.error("Error sending invitation");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelInvite = async (invitationId: string) => {
    if (!partnerId) return;
    try {
      const result = await cancelInvitationCodeAction(partnerId, invitationId);
      if (result.success) {
        toast.success("Invitation cancelled");
        setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      }
    } catch (er) {
      toast.error("Failed to cancel invitation");
    }
  };

  // Refresh persona data after AI chat updates
  const handlePersonaRefresh = async () => {
    if (!partnerId) return;
    try {
      const personaResult = await getBusinessPersonaAction(partnerId);
      if (personaResult.success && personaResult.persona) {
        setPersona(personaResult.persona);
        toast.success("Profile updated by AI");
      }
    } catch (error) {
      console.error("Error refreshing persona:", error);
    }
  };

  // Helper to map UI fields to Schema paths
  const getFieldPath = (section: string, fieldKey: string): string => {
    // Map simplified UI keys to actual BusinessPersona schema paths
    const mappings: Record<string, string> = {
      // ============ IDENTITY ============
      'name': 'identity.name',
      'tagline': 'personality.tagline',
      'description': 'personality.description',
      'foundedYear': 'personality.foundedYear',
      'usps': 'personality.uniqueSellingPoints',
      'category': 'identity.industry.name',
      'languages': 'personality.languagePreference',

      // ============ CONTACT ============
      'phone': 'identity.phone',
      'whatsapp': 'identity.whatsAppNumber',
      'email': 'identity.email',
      'website': 'identity.website',
      'address': 'identity.address.street',
      'officeAddress': 'identity.address.street',
      'office': 'identity.address.street',
      'serviceAreas': 'identity.serviceArea',

      // ============ SOCIAL MEDIA ============
      'instagram': 'identity.socialMedia.instagram',
      'facebook': 'identity.socialMedia.facebook',
      'linkedin': 'identity.socialMedia.linkedin',
      'youtube': 'identity.socialMedia.youtube',
      'googleBusiness': 'identity.socialMedia.googleBusiness',
      'twitter': 'identity.socialMedia.twitter',

      // ============ AVAILABILITY / HOURS ============
      'hoursType': 'identity.operatingHours.specialNote',
      'schedule': 'identity.operatingHours.schedule',
      'responseTime': 'personality.responseTimeExpectation',
      'bookingLink': 'identity.website',
      'supportHours': 'identity.operatingHours.specialNote',

      // ============ SERVICES / PRODUCTS ============
      'services': 'knowledge.productsOrServices',
      'products': 'knowledge.productsOrServices',
      'consultationFee': 'knowledge.pricingHighlights',
      'paymentMethods': 'knowledge.acceptedPayments',
      'pricingNote': 'knowledge.pricingHighlights',
      'priceRange': 'knowledge.pricingHighlights',

      // ============ CREDENTIALS / EXPERIENCE ============
      'certifications': 'knowledge.certifications',
      'awards': 'knowledge.awards',
      'experience': 'industrySpecificData.experience',
      'clients': 'industrySpecificData.notableClients',

      // ============ POLICIES ============
      'faqs': 'knowledge.faqs',
      'returnPolicy': 'knowledge.policies.returnPolicy',
      'refundPolicy': 'knowledge.policies.refundPolicy',
      'refund': 'knowledge.policies.refundPolicy',
      'cancellation': 'knowledge.policies.cancellationPolicy',
      'shippingPolicy': 'knowledge.policies.shippingInfo',
      'deliveryPolicy': 'knowledge.policies.deliveryInfo',
      'returnWindow': 'industrySpecificData.returnWindow',

      // ============ RETAIL / E-COMMERCE ============
      'deliveryZones': 'industrySpecificData.deliveryZones',
      'deliveryTime': 'industrySpecificData.deliveryTime',
      'shippingCost': 'industrySpecificData.shippingCost',
      'freeShippingMin': 'industrySpecificData.freeShippingMin',
      'categories': 'knowledge.serviceCategories',
      'bestsellers': 'industrySpecificData.bestsellers',
      'codLimit': 'industrySpecificData.codLimit',
      'currentOffers': 'knowledge.currentOffers',

      // ============ REAL ESTATE ============
      'reraNumber': 'industrySpecificData.reraNumber',
      'specialization': 'industrySpecificData.specialization',
      'cities': 'industrySpecificData.citiesCovered',
      'localities': 'industrySpecificData.keyLocalities',
      'projects': 'industrySpecificData.featuredProjects',
      'types': 'industrySpecificData.propertyTypes',
      'segments': 'industrySpecificData.segments',
      'commission': 'industrySpecificData.commissionStructure',
      'buyingProcess': 'industrySpecificData.buyingProcess',
      'documents': 'industrySpecificData.documentsRequired',

      // ============ HEALTHCARE ============
      'type': 'industrySpecificData.establishmentType',
      'emergency': 'industrySpecificData.emergencyNumber',
      'emergencyHours': 'industrySpecificData.emergencyHours',
      'healthcareServices': 'healthcareServices',
      'diagnosticTests': 'diagnosticTests',
      'followUpFee': 'industrySpecificData.followUpFee',
      'homeCollection': 'industrySpecificData.homeCollection',
      'reportTime': 'industrySpecificData.reportTime',
      'insuranceAccepted': 'industrySpecificData.insuranceAccepted',
      'tpa': 'industrySpecificData.tpaPartners',
      'cashlessAvailable': 'industrySpecificData.cashlessAvailable',

      // ============ FOOD & RESTAURANT ============
      'cuisine': 'restaurantInfo.cuisineTypes',
      'cuisineTypes': 'restaurantInfo.cuisineTypes',
      'diningStyles': 'restaurantInfo.diningStyles',
      'ambiance': 'industrySpecificData.ambiance',
      'reservationLink': 'industrySpecificData.reservationLink',
      'seating': 'restaurantInfo.seatingCapacity',
      'seatingCapacity': 'restaurantInfo.seatingCapacity',
      'averageCost': 'restaurantInfo.averageCostForTwo',
      'pureVeg': 'restaurantInfo.pureVeg',
      'alcoholServed': 'restaurantInfo.alcoholServed',
      'delivery': 'industrySpecificData.deliveryHours',
      'lastOrder': 'industrySpecificData.lastOrderTime',
      'happyHours': 'industrySpecificData.happyHours',
      'specialties': 'industrySpecificData.signatureDishes',
      'dietary': 'industrySpecificData.dietaryOptions',
      'platforms': 'restaurantInfo.deliveryPartners',
      'deliveryPartners': 'restaurantInfo.deliveryPartners',
      'deliveryRadius': 'restaurantInfo.deliveryRadius',
      'minOrder': 'restaurantInfo.minimumOrder',
      'deliveryFee': 'restaurantInfo.deliveryFee',
      'cateringMin': 'industrySpecificData.cateringMinimum',

      // ============ EDUCATION ============
      'subjects': 'industrySpecificData.subjects',
      'courses': 'knowledge.productsOrServices',
      'boards': 'industrySpecificData.boards',
      'ageGroups': 'industrySpecificData.ageGroups',
      'feeRange': 'knowledge.pricingHighlights',
      'batches': 'industrySpecificData.batchTimings',
      'batchSize': 'industrySpecificData.batchSize',
      'faculty': 'industrySpecificData.facultyMembers',
      'method': 'industrySpecificData.teachingMethods',
      'eligibility': 'industrySpecificData.eligibility',
      'results': 'industrySpecificData.resultsAndPlacements',

      // ============ FINANCE ============
      'registrations': 'industrySpecificData.registrations',
      'minInvestment': 'industrySpecificData.minimumInvestment',
      'feeStructure': 'industrySpecificData.feeStructure',
      'aum': 'industrySpecificData.aum',
      'riskDisclosure': 'industrySpecificData.riskDisclosure',
      'disclaimer': 'industrySpecificData.disclaimer',

      // ============ HOSPITALITY ============
      'starRating': 'industrySpecificData.starRating',
      'nearbyAttractions': 'industrySpecificData.nearbyAttractions',
      'checkIn': 'hotelPolicies.checkIn.time',
      'checkOut': 'hotelPolicies.checkOut.time',
      'checkInTime': 'hotelPolicies.checkIn.time',
      'checkOutTime': 'hotelPolicies.checkOut.time',
      'petPolicy': 'hotelPolicies.petPolicy',
      'childPolicy': 'hotelPolicies.childPolicy',
      'amenities': 'hotelAmenities',
      'dining': 'industrySpecificData.diningOptions',
      'policies': 'industrySpecificData.hotelPoliciesText',
      'eventsCapacity': 'industrySpecificData.eventsCapacity',
      'eventServices': 'industrySpecificData.eventServices',

      // ============ INVENTORY FIELDS (STRUCTURED) ============
      'propertyListings': 'propertyListings',
      'productCatalog': 'productCatalog',
      'menuItems': 'menuItems',
      'roomTypes': 'roomTypes',
    };

    return mappings[fieldKey] || `industrySpecificData.${fieldKey}`;
  };

  const getFieldValue = (path: string) => {
    const keys = path.split('.');
    let current: any = persona;
    for (const key of keys) {
      if (current === undefined || current === null) return undefined;
      current = current[key];
    }
    return current;
  };


  // Configuration Data
  const businessTypes = [
    { id: 'services', icon: '💼', name: 'Professional Services', desc: 'Consulting, Legal, Agency' },
    { id: 'real_estate', icon: '🏠', name: 'Real Estate', desc: 'Agents, Brokers, Property' },
    { id: 'finance', icon: '💰', name: 'Financial Services', desc: 'Advisors, Insurance, Loans' },
    { id: 'retail', icon: '🛒', name: 'Retail & E-Commerce', desc: 'Stores, Shops, D2C' },
    { id: 'healthcare', icon: '🏥', name: 'Healthcare', desc: 'Clinics, Doctors, Wellness' },
    { id: 'education', icon: '📚', name: 'Education', desc: 'Coaching, Courses, Tutoring' },
    { id: 'food_beverage', icon: '🍕', name: 'Food & Restaurant', desc: 'Restaurant, Cloud Kitchen' },
    { id: 'hospitality', icon: '🏨', name: 'Hospitality', desc: 'Hotels, Travel, Events' },
    { id: 'custom', icon: '🔧', name: 'Custom / Other', desc: 'Build your own profile' },
  ];

  // Industry Fields Configuration
  const industryData: Record<string, any> = {
    services: {
      identity: {
        title: 'Business Identity',
        icon: '🏢',
        fields: [
          { key: 'name', label: 'Business Name', type: 'text', required: true },
          { key: 'tagline', label: 'Tagline', type: 'text', placeholder: 'e.g., Your success is our mission' },
          { key: 'description', label: 'About', type: 'textarea', required: true },
          { key: 'foundedYear', label: 'Founded Year', type: 'text', placeholder: 'e.g., 2015' },
          { key: 'usps', label: 'What Makes You Special', type: 'tags' },
          { key: 'languages', label: 'Languages Spoken', type: 'tags', placeholder: 'English, Hindi' },
        ]
      },
      contact: {
        title: 'Contact & Reach',
        icon: '📍',
        fields: [
          { key: 'phone', label: 'Phone', type: 'phone', required: true },
          { key: 'whatsapp', label: 'WhatsApp', type: 'phone', placeholder: 'Same as phone if blank' },
          { key: 'email', label: 'Email', type: 'email', required: true },
          { key: 'website', label: 'Website', type: 'url' },
          { key: 'address', label: 'Office Address', type: 'address' },
          { key: 'serviceAreas', label: 'Service Areas', type: 'tags' },
          { key: 'instagram', label: 'Instagram', type: 'url', placeholder: '@yourbusiness' },
          { key: 'linkedin', label: 'LinkedIn', type: 'url' },
        ]
      },
      availability: {
        title: 'Availability',
        icon: '🕐',
        fields: [
          { key: 'hoursType', label: 'Working Hours', type: 'select', options: ['24/7', 'Business Hours', 'By Appointment', 'Custom'] },
          { key: 'schedule', label: 'Schedule', type: 'schedule' },
          { key: 'responseTime', label: 'Typical Response Time', type: 'select', options: ['Instant', 'Within 1 hour', 'Within 2 hours', 'Same day', 'Next business day'] },
          { key: 'bookingLink', label: 'Booking Link', type: 'url', placeholder: 'Calendly, Cal.com, etc.' },
        ]
      },
      services: {
        title: 'Services & Pricing',
        icon: '💼',
        fields: [
          { key: 'services', label: 'Services Offered', type: 'list' },
          { key: 'consultationFee', label: 'Initial Consultation', type: 'text', placeholder: 'Free 30-min call' },
          { key: 'paymentMethods', label: 'Payment Methods', type: 'tags' },
          { key: 'pricingNote', label: 'Pricing Note', type: 'text' },
        ]
      },
      credentials: {
        title: 'Credentials',
        icon: '🏆',
        fields: [
          { key: 'experience', label: 'Years in Business', type: 'text' },
          { key: 'certifications', label: 'Certifications', type: 'tags' },
          { key: 'clients', label: 'Notable Clients', type: 'tags' },
        ]
      },
      knowledge: {
        title: 'FAQs & Policies',
        icon: '❓',
        fields: [
          { key: 'faqs', label: 'FAQs', type: 'faq' },
          { key: 'cancellation', label: 'Cancellation Policy', type: 'textarea' },
          { key: 'refund', label: 'Refund Policy', type: 'textarea' },
        ]
      },
    },
    retail: {
      identity: {
        title: 'Store Profile',
        icon: '🛒',
        fields: [
          { key: 'name', label: 'Store Name', type: 'text', required: true },
          { key: 'tagline', label: 'Tagline', type: 'text' },
          { key: 'description', label: 'About Your Store', type: 'textarea', required: true },
          { key: 'category', label: 'Primary Category', type: 'select', options: ['Fashion', 'Electronics', 'Home & Living', 'Beauty', 'Food', 'Other'] },
          { key: 'usps', label: 'Why Shop With Us', type: 'tags' },
        ]
      },
      contact: {
        title: 'Support & Contact',
        icon: '📞',
        fields: [
          { key: 'phone', label: 'Support Phone', type: 'phone', required: true },
          { key: 'email', label: 'Support Email', type: 'email', required: true },
          { key: 'whatsapp', label: 'WhatsApp Support', type: 'phone' },
          { key: 'supportHours', label: 'Support Hours', type: 'text' },
        ]
      },
      shipping: {
        title: 'Shipping & Delivery',
        icon: '🚚',
        fields: [
          { key: 'deliveryZones', label: 'Delivery Zones', type: 'tags', required: true },
          { key: 'deliveryTime', label: 'Delivery Time', type: 'text', placeholder: 'e.g., 3-5 business days' },
          { key: 'shippingCost', label: 'Shipping Cost', type: 'text' },
          { key: 'freeShippingMin', label: 'Free Shipping Above', type: 'text', placeholder: 'e.g., ₹499' },
        ]
      },
      products: {
        title: 'Products & Catalog',
        icon: '📦',
        fields: [
          { key: 'categories', label: 'Product Categories', type: 'tags', required: true },
          { key: 'priceRange', label: 'Price Range', type: 'text' },
          { key: 'bestsellers', label: 'Bestsellers', type: 'tags' },
          { key: 'productCatalog', label: 'Product Inventory', type: 'inventory', inventoryType: 'products', hint: 'Add your products with pricing and variants' },
        ]
      },
      payments: {
        title: 'Payments & Offers',
        icon: '💳',
        fields: [
          { key: 'paymentMethods', label: 'Payment Methods', type: 'tags' },
          { key: 'codLimit', label: 'COD Limit', type: 'text', placeholder: 'e.g., Up to ₹5,000' },
          { key: 'currentOffers', label: 'Current Offers', type: 'tags' },
        ]
      },
      policies: {
        title: 'Policies',
        icon: '📋',
        fields: [
          { key: 'returnPolicy', label: 'Return Policy', type: 'textarea', required: true, aiSuggest: true },
          { key: 'returnWindow', label: 'Return Window', type: 'select', options: ['7 days', '15 days', '30 days', 'No returns'] },
          { key: 'refundPolicy', label: 'Refund Policy', type: 'textarea' },
          { key: 'faqs', label: 'FAQs', type: 'faq' },
        ]
      },
    },
    real_estate: {
      identity: {
        title: 'Agency Profile',
        icon: '🏠',
        fields: [
          { key: 'name', label: 'Agency/Agent Name', type: 'text', required: true },
          { key: 'reraNumber', label: 'RERA Registration', type: 'text', required: true },
          { key: 'description', label: 'About', type: 'textarea' },
          { key: 'experience', label: 'Years of Experience', type: 'text' },
          { key: 'specialization', label: 'Specialization', type: 'tags' },
        ]
      },
      contact: {
        title: 'Contact & Office',
        icon: '📍',
        fields: [
          { key: 'phone', label: 'Phone', type: 'phone', required: true },
          { key: 'whatsapp', label: 'WhatsApp', type: 'phone' },
          { key: 'email', label: 'Email', type: 'email', required: true },
          { key: 'officeAddress', label: 'Office Address', type: 'address' },
        ]
      },
      areas: {
        title: 'Operating Areas',
        icon: '🗺️',
        fields: [
          { key: 'cities', label: 'Cities Covered', type: 'tags', required: true },
          { key: 'localities', label: 'Key Localities', type: 'tags' },
          { key: 'projects', label: 'Featured Projects', type: 'tags' },
        ]
      },
      properties: {
        title: 'Property Types & Listings',
        icon: '🏘️',
        fields: [
          { key: 'types', label: 'Property Types', type: 'tags' },
          { key: 'segments', label: 'Segments', type: 'tags' },
          { key: 'priceRange', label: 'Price Range', type: 'text' },
          { key: 'propertyListings', label: 'Your Listings', type: 'inventory', inventoryType: 'properties', hint: 'Add properties you are selling or renting' },
        ]
      },
      services: {
        title: 'Services & Fees',
        icon: '🤝',
        fields: [
          { key: 'services', label: 'Services', type: 'tags' },
          { key: 'commission', label: 'Commission Structure', type: 'text' },
        ]
      },
      knowledge: {
        title: 'Buyer/Seller Info',
        icon: '❓',
        fields: [
          { key: 'buyingProcess', label: 'Buying Process', type: 'textarea' },
          { key: 'documents', label: 'Documents Required', type: 'tags' },
          { key: 'faqs', label: 'FAQs', type: 'faq' },
        ]
      },
    },
    healthcare: {
      identity: {
        title: 'Practice Profile',
        icon: '🏥',
        fields: [
          { key: 'name', label: 'Clinic/Practice Name', type: 'text', required: true },
          { key: 'type', label: 'Type', type: 'select', options: ['Clinic', 'Hospital', 'Diagnostic Center', 'Pharmacy', 'Wellness Center'] },
          { key: 'specialization', label: 'Specialization', type: 'tags', required: true },
          { key: 'description', label: 'About', type: 'textarea' },
        ]
      },
      contact: {
        title: 'Contact & Location',
        icon: '📍',
        fields: [
          { key: 'phone', label: 'Phone', type: 'phone', required: true },
          { key: 'emergency', label: 'Emergency Number', type: 'phone' },
          { key: 'email', label: 'Email', type: 'email' },
          { key: 'address', label: 'Address', type: 'address', required: true },
        ]
      },
      timing: {
        title: 'Consultation Hours',
        icon: '🕐',
        fields: [
          { key: 'schedule', label: 'OPD Timing', type: 'schedule' },
          { key: 'emergencyHours', label: 'Emergency Hours', type: 'text' },
          { key: 'bookingLink', label: 'Online Booking', type: 'url' },
        ]
      },
      services: {
        title: 'Services & Fees',
        icon: '💊',
        fields: [
          { key: 'consultationFee', label: 'Consultation Fee', type: 'text', required: true },
          { key: 'followUpFee', label: 'Follow-up Fee', type: 'text' },
          { key: 'healthcareServices', label: 'Services & Treatments', type: 'inventory', inventoryType: 'healthcare', hint: 'Add your consultations, treatments, and procedures with pricing' },
        ]
      },
      diagnostics: {
        title: 'Diagnostics & Tests',
        icon: '🔬',
        fields: [
          { key: 'diagnosticTests', label: 'Tests & Packages', type: 'inventory', inventoryType: 'diagnostics', hint: 'Add lab tests and health packages you offer' },
          { key: 'homeCollection', label: 'Home Sample Collection', type: 'select', options: ['Available', 'Not Available'] },
          { key: 'reportTime', label: 'Report Delivery Time', type: 'text' },
        ]
      },
      insurance: {
        title: 'Insurance & Payments',
        icon: '💳',
        fields: [
          { key: 'insuranceAccepted', label: 'Insurance Accepted', type: 'tags' },
          { key: 'tpa', label: 'TPA Tie-ups', type: 'tags' },
          { key: 'cashlessAvailable', label: 'Cashless Treatment', type: 'select', options: ['Available', 'Not Available'] },
          { key: 'paymentMethods', label: 'Payment Methods', type: 'tags' },
          { key: 'faqs', label: 'Patient FAQs', type: 'faq' },
        ]
      },
    },
    food_beverage: {
      identity: {
        title: 'Restaurant Profile',
        icon: '🍕',
        fields: [
          { key: 'name', label: 'Restaurant Name', type: 'text', required: true },
          { key: 'cuisine', label: 'Cuisine Type', type: 'tags', required: true },
          { key: 'type', label: 'Type', type: 'select', options: ['Fine Dining', 'Casual Dining', 'QSR', 'Cafe', 'Cloud Kitchen', 'Food Truck'] },
          { key: 'description', label: 'About', type: 'textarea' },
          { key: 'ambiance', label: 'Ambiance', type: 'tags' },
        ]
      },
      contact: {
        title: 'Location & Reservations',
        icon: '📍',
        fields: [
          { key: 'phone', label: 'Phone', type: 'phone', required: true },
          { key: 'address', label: 'Address', type: 'address', required: true },
          { key: 'reservationLink', label: 'Reservation Link', type: 'url' },
          { key: 'seating', label: 'Seating Capacity', type: 'text' },
        ]
      },
      timing: {
        title: 'Operating Hours',
        icon: '🕐',
        fields: [
          { key: 'schedule', label: 'Dine-in Hours', type: 'schedule' },
          { key: 'delivery', label: 'Delivery Hours', type: 'text' },
          { key: 'lastOrder', label: 'Last Order Time', type: 'text' },
          { key: 'happyHours', label: 'Happy Hours', type: 'text' },
        ]
      },
      menu: {
        title: 'Menu & Specialties',
        icon: '📜',
        fields: [
          { key: 'categories', label: 'Menu Categories', type: 'tags' },
          { key: 'specialties', label: 'Signature Dishes', type: 'tags' },
          { key: 'priceRange', label: 'Price Range (per person)', type: 'text' },
          { key: 'dietary', label: 'Dietary Options', type: 'tags' },
          { key: 'menuItems', label: 'Menu Items', type: 'inventory', inventoryType: 'menu', hint: 'Add your dishes with pricing and dietary info' },
        ]
      },
      delivery: {
        title: 'Ordering & Delivery',
        icon: '🛵',
        fields: [
          { key: 'platforms', label: 'Order Platforms', type: 'tags' },
          { key: 'deliveryRadius', label: 'Delivery Radius', type: 'text' },
          { key: 'minOrder', label: 'Minimum Order', type: 'text' },
          { key: 'deliveryFee', label: 'Delivery Fee', type: 'text' },
        ]
      },
      more: {
        title: 'More Info',
        icon: '❓',
        fields: [
          { key: 'cateringMin', label: 'Catering Minimum', type: 'text' },
          { key: 'faqs', label: 'FAQs', type: 'faq' },
        ]
      },
    },
    education: {
      identity: {
        title: 'Institute Profile',
        icon: '📚',
        fields: [
          { key: 'name', label: 'Institute Name', type: 'text', required: true },
          { key: 'type', label: 'Type', type: 'select', options: ['Coaching Center', 'Online Platform', 'Tutor', 'School', 'College', 'Training Institute'] },
          { key: 'subjects', label: 'Subjects/Skills', type: 'tags', required: true },
          { key: 'description', label: 'About', type: 'textarea' },
        ]
      },
      contact: {
        title: 'Contact & Campus',
        icon: '📍',
        fields: [
          { key: 'phone', label: 'Phone', type: 'phone', required: true },
          { key: 'whatsapp', label: 'WhatsApp', type: 'phone' },
          { key: 'email', label: 'Email', type: 'email' },
          { key: 'address', label: 'Address', type: 'address' },
        ]
      },
      courses: {
        title: 'Courses & Fees',
        icon: '🎓',
        fields: [
          { key: 'courses', label: 'Courses Offered', type: 'list' },
          { key: 'boards', label: 'Boards/Exams', type: 'tags' },
          { key: 'ageGroups', label: 'Age Groups', type: 'tags' },
          { key: 'feeRange', label: 'Fee Range', type: 'text' },
        ]
      },
      schedule: {
        title: 'Batches & Timing',
        icon: '🕐',
        fields: [
          { key: 'batches', label: 'Batch Timings', type: 'tags' },
          { key: 'batchSize', label: 'Batch Size', type: 'text' },
        ]
      },
      faculty: {
        title: 'Faculty & Methods',
        icon: '👨‍🏫',
        fields: [
          { key: 'faculty', label: 'Faculty Members', type: 'list' },
          { key: 'method', label: 'Teaching Method', type: 'tags' },
        ]
      },
      admissions: {
        title: 'Admissions & Results',
        icon: '🏆',
        fields: [
          { key: 'eligibility', label: 'Eligibility', type: 'text' },
          { key: 'results', label: 'Results/Placements', type: 'textarea' },
          { key: 'faqs', label: 'FAQs', type: 'faq' },
        ]
      },
    },
    finance: {
      identity: {
        title: 'Firm Profile',
        icon: '💰',
        fields: [
          { key: 'name', label: 'Firm Name', type: 'text', required: true },
          { key: 'type', label: 'Type', type: 'select', options: ['Financial Advisor', 'Insurance Agent', 'Loan Agent', 'CA/Tax Consultant', 'Wealth Manager'] },
          { key: 'registrations', label: 'Registrations', type: 'tags', required: true },
          { key: 'description', label: 'About', type: 'textarea' },
        ]
      },
      contact: {
        title: 'Contact & Office',
        icon: '📍',
        fields: [
          { key: 'phone', label: 'Phone', type: 'phone', required: true },
          { key: 'email', label: 'Email', type: 'email', required: true },
          { key: 'website', label: 'Website', type: 'url' },
          { key: 'office', label: 'Office Address', type: 'address' },
        ]
      },
      services: {
        title: 'Services & Products',
        icon: '📊',
        fields: [
          { key: 'services', label: 'Services', type: 'tags' },
          { key: 'products', label: 'Products Offered', type: 'tags' },
          { key: 'minInvestment', label: 'Minimum Investment', type: 'text' },
          { key: 'feeStructure', label: 'Fee Structure', type: 'textarea' },
        ]
      },
      credentials: {
        title: 'Credentials & Compliance',
        icon: '🏆',
        fields: [
          { key: 'certifications', label: 'Certifications', type: 'tags' },
          { key: 'experience', label: 'Years of Experience', type: 'text' },
          { key: 'aum', label: 'AUM (if applicable)', type: 'text' },
        ]
      },
      knowledge: {
        title: 'Disclosures & FAQs',
        icon: '❓',
        fields: [
          { key: 'riskDisclosure', label: 'Risk Disclosure', type: 'textarea' },
          { key: 'disclaimer', label: 'Disclaimer', type: 'textarea' },
          { key: 'faqs', label: 'FAQs', type: 'faq' },
        ]
      },
    },
    hospitality: {
      identity: {
        title: 'Property Profile',
        icon: '🏨',
        fields: [
          { key: 'name', label: 'Property Name', type: 'text', required: true },
          { key: 'type', label: 'Type', type: 'select', options: ['Hotel', 'Resort', 'Homestay', 'Villa', 'Service Apartment', 'Event Venue'] },
          { key: 'starRating', label: 'Star Rating', type: 'select', options: ['Budget', '3 Star', '4 Star', '5 Star', 'Luxury'] },
          { key: 'description', label: 'About', type: 'textarea' },
        ]
      },
      contact: {
        title: 'Contact & Location',
        icon: '📍',
        fields: [
          { key: 'phone', label: 'Phone', type: 'phone', required: true },
          { key: 'email', label: 'Email', type: 'email' },
          { key: 'address', label: 'Address', type: 'address', required: true },
          { key: 'nearbyAttractions', label: 'Nearby Attractions', type: 'tags' },
        ]
      },
      rooms: {
        title: 'Rooms & Rates',
        icon: '🛏️',
        fields: [
          { key: 'priceRange', label: 'Price Range', type: 'text' },
          { key: 'checkIn', label: 'Check-in Time', type: 'text' },
          { key: 'checkOut', label: 'Check-out Time', type: 'text' },
          { key: 'roomTypes', label: 'Room Inventory', type: 'inventory', inventoryType: 'rooms', hint: 'Add your room categories with pricing' },
        ]
      },
      amenities: {
        title: 'Amenities & Services',
        icon: '🏊',
        fields: [
          { key: 'amenities', label: 'Amenities', type: 'tags' },
          { key: 'dining', label: 'Dining Options', type: 'tags' },
        ]
      },
      policies: {
        title: 'Policies',
        icon: '📋',
        fields: [
          { key: 'cancellation', label: 'Cancellation Policy', type: 'textarea' },
          { key: 'petPolicy', label: 'Pet Policy', type: 'text' },
          { key: 'childPolicy', label: 'Children Policy', type: 'text' },
          { key: 'faqs', label: 'FAQs', type: 'faq' },
        ]
      },
    },
    // Custom / Other business type
    custom: {
      identity: {
        title: 'Business Profile',
        icon: '🏢',
        fields: [
          { key: 'name', label: 'Business Name', type: 'text', required: true },
          { key: 'tagline', label: 'Tagline', type: 'text', placeholder: 'One line about your business' },
          { key: 'description', label: 'What You Do', type: 'textarea', required: true, placeholder: 'Describe your business in detail' },
          { key: 'usps', label: 'What Makes You Unique', type: 'tags' },
          { key: 'languages', label: 'Languages', type: 'tags' },
        ]
      },
      contact: {
        title: 'Contact Information',
        icon: '📞',
        fields: [
          { key: 'phone', label: 'Phone', type: 'phone', required: true },
          { key: 'whatsapp', label: 'WhatsApp', type: 'phone' },
          { key: 'email', label: 'Email', type: 'email' },
          { key: 'website', label: 'Website', type: 'url' },
          { key: 'address', label: 'Address', type: 'address' },
        ]
      },
      availability: {
        title: 'Availability',
        icon: '🕐',
        fields: [
          { key: 'hoursType', label: 'Working Hours', type: 'select', options: ['24/7', 'Business Hours', 'By Appointment', 'Custom'] },
          { key: 'schedule', label: 'Schedule', type: 'schedule' },
          { key: 'responseTime', label: 'Response Time', type: 'select', options: ['Instant', 'Within 1 hour', 'Within 2 hours', 'Same day', 'Next business day'] },
        ]
      },
      offerings: {
        title: 'Products / Services',
        icon: '📦',
        fields: [
          { key: 'services', label: 'What You Offer', type: 'list' },
          { key: 'priceRange', label: 'Price Range', type: 'text', placeholder: 'e.g., Starting from ₹500' },
          { key: 'paymentMethods', label: 'Payment Methods', type: 'tags' },
        ]
      },
      knowledge: {
        title: 'FAQs & Policies',
        icon: '❓',
        fields: [
          { key: 'faqs', label: 'Frequently Asked Questions', type: 'faq' },
          { key: 'refundPolicy', label: 'Refund/Return Policy', type: 'textarea' },
          { key: 'cancellation', label: 'Cancellation Policy', type: 'textarea' },
        ]
      },
    },
  };

  // Merge sections from all selected business types
  // This creates a combined set of sections, avoiding duplicates by section key
  const getMergedSections = () => {
    const typesToUse = selectedBusinessTypes.length > 0 ? selectedBusinessTypes : ['services'];
    const mergedSections: Record<string, any> = {};
    const sectionSources: Record<string, string[]> = {}; // Track which types contributed each section

    typesToUse.forEach(type => {
      const industryConfig = industryData[type] || {};
      Object.entries(industryConfig).forEach(([sectionKey, sectionData]: [string, any]) => {
        if (!mergedSections[sectionKey]) {
          mergedSections[sectionKey] = { ...sectionData, fields: [...sectionData.fields] };
          sectionSources[sectionKey] = [type];
        } else {
          // Merge fields from this type, avoiding duplicates by field key
          const existingFieldKeys = new Set(mergedSections[sectionKey].fields.map((f: any) => f.key));
          sectionData.fields.forEach((field: any) => {
            if (!existingFieldKeys.has(field.key)) {
              mergedSections[sectionKey].fields.push(field);
            }
          });
          sectionSources[sectionKey].push(type);
        }
      });
    });

    return { sections: Object.entries(mergedSections), sectionSources };
  };

  const { sections, sectionSources } = getMergedSections();

  // Helper to toggle business type selection
  const toggleBusinessType = (typeId: string) => {
    // Compute new types first
    const newTypes = selectedBusinessTypes.includes(typeId)
      ? selectedBusinessTypes.filter(t => t !== typeId)
      : [...selectedBusinessTypes, typeId];

    // Update local state
    setSelectedBusinessTypes(newTypes);

    // Save to backend (outside setState to avoid render-phase updates)
    handleFieldUpdate('identity.industry.category', newTypes);
  };

  const navItems = [
    { id: 'profile', label: 'Business Profile', icon: '🏢', desc: 'Your business data' },
    { id: 'team', label: 'Team', icon: '👥', desc: 'Members & access' },
    { id: 'account', label: 'Account', icon: '⚙️', desc: 'Personal & workspace' },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: '🔐', desc: 'Integrations & tools', badge: 'Admin' }] : []),
  ];

  const getCompletionForSection = (sectionKey: string, sectionData: any) => {
    // Calculate completion based on filled fields
    if (!sectionData?.fields) return 100;

    let filledCount = 0;
    let totalCount = 0;

    sectionData.fields.forEach((field: any) => {
      totalCount++;
      const schemaPath = getFieldPath(sectionKey, field.key);
      const value = getFieldValue(schemaPath);
      if (value && (Array.isArray(value) ? value.length > 0 : true)) {
        filledCount++;
      }
    });

    return totalCount > 0 ? Math.round((filledCount / totalCount) * 100) : 100;
  };

  const roleLabels: Record<string, string> = {
    owner: 'Owner',
    partner_admin: 'Admin',
    employee: 'Team Member',
    member: 'Member',
    'Super Admin': 'Super Admin'
  };

  const roleColors: Record<string, string> = {
    owner: 'bg-purple-100 text-purple-700',
    partner_admin: 'bg-blue-100 text-blue-700',
    employee: 'bg-slate-100 text-slate-600',
    member: 'bg-slate-100 text-slate-600',
    'Super Admin': 'bg-red-100 text-red-700'
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full z-20">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
              {partner?.businessName?.[0] || 'C'}
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-sm truncate max-w-[140px]">{partner?.businessName || 'My Business'}</h1>
              <p className="text-xs text-slate-500">{partner?.plan || 'Free'} Plan</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all",
                activeTab === item.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              <span className="text-lg">{item.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{item.label}</span>
                  {item.badge && (
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded",
                      activeTab === item.id ? 'bg-white/20' : 'bg-orange-100 text-orange-700'
                    )}>{item.badge}</span>
                  )}
                </div>
                <span className={cn("text-xs line-clamp-1", activeTab === item.id ? 'text-slate-300' : 'text-slate-400')}>
                  {item.desc}
                </span>
              </div>
            </button>
          ))}
        </nav>

        {/* Profile Score Widget */}
        {activeTab === 'profile' && (
          <div className="p-3 border-t border-slate-100">
            <div
              onClick={() => setShowAIChat(true)}
              className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 text-white cursor-pointer hover:opacity-95 transition-opacity"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">Profile Score</span>
                <span className="text-2xl font-bold">{profileScore}%</span>
              </div>
              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: `${profileScore}%` }} />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-emerald-100">AI Suggestions</span>
                <span className="text-xs text-emerald-100">Open Agent →</span>
              </div>
            </div>
          </div>
        )}

        {/* User */}
        <div className="p-3 border-t border-slate-100">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 bg-gradient-to-br from-slate-600 to-slate-800 rounded-full flex items-center justify-center text-white text-sm font-medium overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
              ) : (
                user?.displayName?.[0] || user?.email?.[0] || 'U'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{user?.displayName || 'User'}</p>
              <p className="text-xs text-slate-500">{roleLabels[userRole]}</p>
            </div>
            <button className="text-slate-400 hover:text-slate-600">⚙️</button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64 min-w-0">
        <div className="transition-all duration-300">
          <div className="max-w-4xl mx-auto p-4 md:p-8">

            {/* ===== BUSINESS PROFILE TAB ===== */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Business Profile</h2>
                    <p className="text-slate-500">Data that powers your AI agents</p>
                  </div>
                  {/* Mobile AI Chat Button */}
                  <button
                    onClick={() => setShowAIChat(true)}
                    className="xl:hidden flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium text-sm hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm"
                  >
                    <span>✨</span>
                    <span className="hidden sm:inline">AI Update</span>
                  </button>
                </div>

                {/* Business Auto-Fill Card */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                      <span className="text-white text-lg">🔍</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Auto-Fill Business Profile</h3>
                      <p className="text-sm text-slate-500">Search for your business to auto-populate fields from online data</p>
                    </div>
                  </div>

                  {/* Search Input */}
                  <div className="relative mb-3">
                    <input
                      type="text"
                      value={autoFillSearch}
                      onChange={(e) => {
                        const query = e.target.value;
                        setAutoFillSearch(query);
                        setSelectedPlace(null);

                        // Clear existing timeout
                        if (searchTimeoutRef.current) {
                          clearTimeout(searchTimeoutRef.current);
                        }

                        // Debounce search by 300ms
                        searchTimeoutRef.current = setTimeout(() => {
                          debouncedSearch(query);
                        }, 300);
                      }}
                      placeholder="Search for your business (e.g., 'Taj Hotel Mumbai')"
                      className="w-full px-4 py-3 pr-10 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                    {autoFillSearching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>

                  {/* Search Results Dropdown */}
                  {autoFillResults.length > 0 && !selectedPlace && (
                    <div className="mb-3 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-64 overflow-y-auto">
                      {autoFillResults.map((place) => (
                        <button
                          key={place.placeId}
                          onClick={() => {
                            setSelectedPlace(place);
                            setAutoFillSearch(place.mainText);
                            setAutoFillResults([]);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-indigo-50 border-b border-slate-100 last:border-b-0 transition-colors"
                        >
                          <div className="font-medium text-slate-900">{place.mainText}</div>
                          <div className="text-sm text-slate-500">{place.secondaryText}</div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Selected Place + Action Buttons */}
                  {selectedPlace && (
                    <div className="mb-3 p-3 bg-white border border-indigo-200 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-slate-900">{selectedPlace.mainText}</div>
                          <div className="text-sm text-slate-500">{selectedPlace.secondaryText}</div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedPlace(null);
                            setAutoFillSearch('');
                          }}
                          className="text-slate-400 hover:text-red-500 p-1"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={async () => {
                        if (!selectedPlace) {
                          toast.error('Please search and select a business first');
                          return;
                        }

                        setAutoFilling(true);
                        try {
                          const result = await autoFillProfileAction(selectedPlace.placeId);
                          if (result.success && result.profile) {
                            setAutoFillPreviewData(result.profile);
                            setShowAutoFillPreview(true);
                          } else {
                            toast.error(result.error || 'Failed to fetch business data');
                          }
                        } catch (err: any) {
                          toast.error(err.message || 'Auto-fill failed');
                        } finally {
                          setAutoFilling(false);
                        }
                      }}
                      disabled={!selectedPlace || autoFilling}
                      className={cn(
                        "flex-1 px-4 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2",
                        selectedPlace && !autoFilling
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700"
                          : "bg-slate-100 text-slate-400 cursor-not-allowed"
                      )}
                    >
                      {autoFilling ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Researching...</span>
                        </>
                      ) : (
                        <>
                          <span>✨</span>
                          <span>Auto-Fill Profile</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={async () => {
                        if (confirm('Are you sure you want to clear all business profile data? This will remove ALL data including inventory, reviews, and industry-specific information. This cannot be undone.')) {
                          try {
                            // Use the dedicated clear function that does FULL REPLACE (not merge)
                            const result = await clearBusinessPersonaAction(partnerId!);
                            if (result.success && result.persona) {
                              setPersona(result.persona);
                              setSelectedBusinessTypes([]);
                              setAutoFillSearch('');
                              setSelectedPlace(null);
                              toast.success('All profile data has been cleared completely');
                            } else {
                              toast.error(result.message || 'Failed to clear data');
                            }
                          } catch (err: any) {
                            toast.error(err.message || 'Failed to clear data');
                          }
                        }
                      }}
                      className="px-4 py-2.5 border border-red-200 text-red-600 rounded-xl font-medium text-sm hover:bg-red-50 transition-all flex items-center gap-2"
                    >
                      <span>🗑️</span>
                      <span>Clear All</span>
                    </button>
                  </div>

                  <p className="mt-3 text-xs text-slate-500">
                    Uses Google Places API + AI research to find and fill business information from the web
                  </p>
                </div>

                {/* RAG Processing Card */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                      <span className="text-white text-lg">🧠</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">AI Knowledge Base (RAG)</h3>
                      <p className="text-sm text-slate-500">Process business data for AI training</p>
                    </div>
                    {/* Status Indicator */}
                    {ragStatus?.processed && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 border border-emerald-200 rounded-lg">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-xs font-medium text-emerald-700">RAG Active</span>
                      </div>
                    )}
                  </div>

                  {/* RAG Status Display */}
                  {ragStatus?.processed && (
                    <div className="mb-4 p-3 bg-white/80 border border-emerald-100 rounded-xl">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <div>
                            <span className="text-slate-500">Last processed:</span>{' '}
                            <span className="font-medium text-slate-700">
                              {ragStatus.lastProcessedAt
                                ? new Date(ragStatus.lastProcessedAt).toLocaleString()
                                : 'Unknown'}
                            </span>
                          </div>
                          {ragStatus.documentId && (
                            <div className="text-xs text-slate-400 font-mono">
                              ID: {ragStatus.documentId.slice(0, 20)}...
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          {ragStatus.itemCounts && (
                            <>
                              {ragStatus.itemCounts.reviews > 0 && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                  {ragStatus.itemCounts.reviews} reviews
                                </span>
                              )}
                              {ragStatus.itemCounts.faqs > 0 && (
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                                  {ragStatus.itemCounts.faqs} FAQs
                                </span>
                              )}
                              {ragStatus.itemCounts.inventory && (
                                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded">
                                  Inventory
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* RAG Actions */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={async () => {
                        if (!partnerId) {
                          toast.error('Partner ID not found');
                          return;
                        }

                        // Check if we have data to process
                        const hasData = persona.identity?.businessName ||
                          persona.knowledge?.faqs?.length ||
                          persona.knowledge?.productsOrServices?.length ||
                          persona.industrySpecificData?.fetchedReviews?.length ||
                          persona.roomTypes?.length ||
                          persona.menuItems?.length ||
                          persona.productCatalog?.length ||
                          persona.propertyListings?.length ||
                          persona.healthcareServices?.length;

                        if (!hasData) {
                          toast.error('No business data to process. Please auto-fill or add data first.');
                          return;
                        }

                        setRagProcessing(true);
                        try {
                          // Build a combined data object from persona for RAG
                          const ragData = {
                            source: {
                              fetchedAt: new Date(),
                              placeId: persona.industrySpecificData?.placeId || 'manual',
                            },
                            identity: persona.identity,
                            knowledge: persona.knowledge,
                            personality: persona.personality,
                            customerProfile: persona.customerProfile,
                            reviews: persona.industrySpecificData?.fetchedReviews || [],
                            testimonials: persona.industrySpecificData?.testimonials || [],
                            onlinePresence: persona.industrySpecificData?.onlinePresence || [],
                            pressMedia: [],
                            photos: persona.industrySpecificData?.fetchedPhotos || [],
                            inventory: {
                              rooms: persona.roomTypes?.map(r => ({ name: r.name, description: r.description })),
                              menuItems: persona.menuItems?.map(m => ({ name: m.name, description: m.description })),
                              products: persona.productCatalog?.map(p => ({ name: p.name, description: p.description })),
                              properties: persona.propertyListings?.map(p => ({ title: p.title, description: p.description })),
                              services: persona.healthcareServices?.map(s => ({ name: s.name, description: s.description })),
                            },
                            fromTheWeb: persona.industrySpecificData?.fromTheWeb,
                            industrySpecificData: persona.industrySpecificData,
                          };

                          const result = await processForRAGAction(partnerId, ragData as any);

                          if (!result.success) {
                            throw new Error(result.error || 'Failed to process for RAG');
                          }

                          // Update RAG status
                          setRagStatus({
                            processed: true,
                            lastProcessedAt: new Date(),
                            documentId: result.ragDocumentId,
                            itemCounts: {
                              reviews: ragData.reviews?.length || 0,
                              faqs: persona.knowledge?.faqs?.length || 0,
                              inventory: !!(
                                persona.roomTypes?.length ||
                                persona.menuItems?.length ||
                                persona.productCatalog?.length ||
                                persona.propertyListings?.length ||
                                persona.healthcareServices?.length
                              ),
                            },
                          });

                          // Save RAG status to persona
                          const updatedPersona = {
                            ...persona,
                            industrySpecificData: {
                              ...persona.industrySpecificData,
                              ragStatus: {
                                processed: true,
                                lastProcessedAt: new Date(),
                                documentId: result.ragDocumentId,
                              },
                            },
                          };
                          await saveBusinessPersonaAction(partnerId, updatedPersona);
                          setPersona(updatedPersona);

                          toast.success(result.message || 'Data processed for AI training!');
                        } catch (err: any) {
                          toast.error(err.message || 'Failed to process for RAG');
                        } finally {
                          setRagProcessing(false);
                        }
                      }}
                      disabled={ragProcessing}
                      className={cn(
                        "flex-1 px-4 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2",
                        ragProcessing
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700"
                      )}
                    >
                      {ragProcessing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <span>🧠</span>
                          <span>{ragStatus?.processed ? 'Re-process for RAG' : 'Process for RAG'}</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="mt-3 text-xs text-slate-500">
                    Processes your business profile, inventory, reviews, and FAQs for the AI knowledge base used in inbox and broadcast
                  </p>
                </div>

                {/* Auto-Fill Preview Modal */}
                {showAutoFillPreview && autoFillPreviewData && (
                  <AutoFillPreviewModal
                    data={autoFillPreviewData}
                    onClose={() => setShowAutoFillPreview(false)}
                    isApplying={isApplyingAutoFill}
                    onApply={async (selectedData) => {
                      try {
                        setIsApplyingAutoFill(true);

                        // Use the server action to properly map inventory to schema
                        const result = await mapInventoryToPersonaAction(selectedData, persona);

                        if (!result.success || !result.persona) {
                          throw new Error(result.error || 'Failed to map inventory');
                        }

                        const mergedPersona = result.persona;

                        setPersona(mergedPersona);
                        await saveBusinessPersonaAction(partnerId!, mergedPersona);

                        // Set business type based on detected industry
                        if (selectedData.identity?.industry) {
                          const industryMap: Record<string, string> = {
                            'hospitality': 'hospitality',
                            'food_beverage': 'food_restaurant',
                            'retail': 'retail_ecommerce',
                            'healthcare': 'healthcare',
                            'real_estate': 'real_estate',
                            'education': 'education',
                            'finance': 'finance',
                          };
                          const mappedType = industryMap[selectedData.identity.industry];
                          if (mappedType && !selectedBusinessTypes.includes(mappedType)) {
                            setSelectedBusinessTypes([...selectedBusinessTypes, mappedType]);
                          }
                        }

                        // Show success with inventory counts
                        const inv = selectedData.inventory;
                        const counts = [];
                        if (inv?.rooms?.length) counts.push(`${inv.rooms.length} rooms`);
                        if (inv?.menuItems?.length) counts.push(`${inv.menuItems.length} menu items`);
                        if (inv?.products?.length) counts.push(`${inv.products.length} products`);
                        if (inv?.properties?.length) counts.push(`${inv.properties.length} properties`);
                        if (inv?.services?.length) counts.push(`${inv.services.length} services`);

                        const message = counts.length > 0
                          ? `Profile updated! Imported: ${counts.join(', ')}`
                          : 'Profile updated with selected data!';

                        toast.success(message);
                        setShowAutoFillPreview(false);
                        setAutoFillSearch('');
                        setSelectedPlace(null);
                      } catch (err: any) {
                        toast.error(err.message || 'Failed to apply data');
                      } finally {
                        setIsApplyingAutoFill(false);
                      }
                    }}
                  />
                )}

                {/* Business Types Selection Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-slate-900">What does your business do?</h3>
                      <p className="text-sm text-slate-500">Select all that apply — we'll customize your profile fields</p>
                    </div>
                    {selectedBusinessTypes.length > 0 && (
                      <span className="text-xs px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full font-medium">
                        {selectedBusinessTypes.length} selected
                      </span>
                    )}
                  </div>

                  {/* Selected Types Summary */}
                  {selectedBusinessTypes.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4 p-3 bg-slate-50 rounded-xl">
                      {selectedBusinessTypes.map(typeId => {
                        const type = businessTypes.find(t => t.id === typeId);
                        return type ? (
                          <span
                            key={typeId}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm shadow-sm"
                          >
                            <span>{type.icon}</span>
                            <span className="font-medium text-slate-700">{type.name}</span>
                            <button
                              onClick={() => toggleBusinessType(typeId)}
                              className="ml-1 text-slate-400 hover:text-red-500 transition-colors"
                            >
                              ×
                            </button>
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}

                  {/* Business Type Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {businessTypes.map(type => {
                      const isSelected = selectedBusinessTypes.includes(type.id);
                      return (
                        <button
                          key={type.id}
                          onClick={() => toggleBusinessType(type.id)}
                          className={cn(
                            "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center group",
                            isSelected
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-slate-100 bg-slate-50 hover:border-slate-200 hover:bg-slate-100'
                          )}
                        >
                          {/* Checkbox indicator */}
                          <div className={cn(
                            "absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs transition-all",
                            isSelected
                              ? 'bg-indigo-500 text-white'
                              : 'bg-slate-200 text-transparent group-hover:bg-slate-300'
                          )}>
                            ✓
                          </div>
                          <span className="text-2xl">{type.icon}</span>
                          <span className={cn(
                            "text-sm font-medium leading-tight",
                            isSelected ? 'text-indigo-700' : 'text-slate-700'
                          )}>
                            {type.name}
                          </span>
                          <span className="text-[10px] text-slate-500 leading-tight hidden sm:block">
                            {type.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Empty state prompt */}
                  {selectedBusinessTypes.length === 0 && (
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
                      <p className="text-sm text-amber-800">
                        👆 Select at least one business type to customize your profile fields
                      </p>
                    </div>
                  )}
                </div>

                {/* New Business Profile View - Modern Card-Based UI */}
                <BusinessProfileView
                  persona={persona}
                  partnerId={partnerId!}
                  onFieldUpdate={handleFieldUpdate}
                  onRefresh={handlePersonaRefresh}
                  isAdmin={isAdmin}
                />

                {/* Legacy Detailed Sections Header - Hidden by default, toggle to show */}
                <details className="mt-6 group">
                  <summary className="flex items-center justify-between cursor-pointer list-none">
                    <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <span>Detailed Fields</span>
                      <span className="text-xs text-slate-400 font-normal">(Advanced)</span>
                    </h4>
                    <span className="text-xs text-slate-500 group-open:hidden">Click to expand</span>
                    <span className="text-xs text-slate-500 hidden group-open:inline">Click to collapse</span>
                  </summary>
                  <div className="mt-3">

                {/* Sections */}
                <div className="space-y-3">
                  {sections.map(([key, section]: any) => {
                    const isExpanded = expandedSection === key;
                    const completion = getCompletionForSection(key, section);

                    return (
                      <div
                        key={key}
                        className={cn(
                          "bg-white rounded-2xl border-2 transition-all",
                          isExpanded ? 'border-primary/20 shadow-sm' : 'border-slate-100'
                        )}
                      >
                        <button
                          onClick={() => setExpandedSection(isExpanded ? null : key)}
                          className="w-full px-5 py-4 flex items-center gap-4 text-left"
                        >
                          <div className="w-11 h-11 bg-slate-50 rounded-xl flex items-center justify-center text-xl">
                            {section.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900">{section.title}</span>
                              {/* Show which business types contributed this section */}
                              {sectionSources[key] && sectionSources[key].length > 1 && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded ml-2">
                                  {sectionSources[key].length} types
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={cn("h-full rounded-full", completion === 100 ? 'bg-emerald-500' : 'bg-amber-500')}
                                  style={{ width: `${completion}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-400">{completion}%</span>
                            </div>
                          </div>
                          <span className={cn("text-slate-400 transition-transform", isExpanded ? 'rotate-180' : '')}>
                            ▼
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="px-5 pb-5 border-t border-slate-100">
                            <div className="pt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                              {section.fields.map((field: any) => {
                                const schemaPath = getFieldPath(key, field.key);
                                const fieldValue = getFieldValue(schemaPath);

                                return (
                                  <div
                                    key={field.key}
                                    className={cn(field.type === 'textarea' || field.type === 'faq' || field.type === 'list' || field.type === 'schedule' || field.type === 'inventory' ? 'col-span-1 md:col-span-2' : '')}
                                  >
                                    <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
                                      {field.label}
                                      {field.required && <span className="text-red-500">*</span>}
                                      {field.aiSuggest && (
                                        <span className="ml-auto text-xs text-indigo-600 cursor-pointer hover:text-indigo-700">
                                          ✨ AI suggest
                                        </span>
                                      )}
                                    </label>

                                    {/* RENDER FIELD INPUTS BASED ON TYPE */}
                                    {field.type === 'text' || field.type === 'phone' || field.type === 'email' || field.type === 'url' ? (
                                      <input
                                        type={field.type === 'phone' ? 'tel' : field.type === 'email' ? 'email' : 'text'}
                                        value={typeof fieldValue === 'string' ? fieldValue : (typeof fieldValue === 'number' ? String(fieldValue) : '')}
                                        onChange={(e) => handleFieldUpdate(schemaPath, e.target.value)}
                                        placeholder={field.placeholder || ''}
                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                      />
                                    ) : field.type === 'textarea' ? (
                                      <textarea
                                        value={typeof fieldValue === 'string' ? fieldValue : ''}
                                        onChange={(e) => handleFieldUpdate(schemaPath, e.target.value)}
                                        placeholder={field.placeholder || ''}
                                        rows={3}
                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                      />
                                    ) : field.type === 'tags' ? (
                                      <div className="flex flex-wrap gap-2 p-2 border border-slate-200 rounded-xl min-h-[42px]">
                                        {Array.isArray(fieldValue) && fieldValue.map((tag: any, idx: number) => {
                                          // Handle both string tags and ProductService objects - ensure displayText is always a string
                                          const displayText = typeof tag === 'string'
                                            ? tag
                                            : String(tag?.name || tag?.id || `Item ${idx + 1}`);
                                          const tagKey = typeof tag === 'string' ? tag : String(tag?.id || `tag-${idx}`);

                                          return (
                                            <span key={tagKey} className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm flex items-center gap-1">
                                              {displayText}
                                              <button
                                                onClick={() => {
                                                  const newTags = (fieldValue || []).filter((_: any, i: number) => i !== idx);
                                                  handleFieldUpdate(schemaPath, newTags);
                                                }}
                                                className="text-slate-400 hover:text-slate-600"
                                              >
                                                ×
                                              </button>
                                            </span>
                                          );
                                        })}
                                        <input
                                          type="text"
                                          placeholder="Add & Enter..."
                                          className="flex-1 min-w-[80px] outline-none text-sm bg-transparent"
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              e.preventDefault();
                                              const val = e.currentTarget.value.trim();
                                              if (val) {
                                                // For productsOrServices, create a ProductService object
                                                const isProductField = schemaPath.includes('productsOrServices');
                                                const newItem = isProductField
                                                  ? { id: `ps-${Date.now()}`, name: val, description: '' }
                                                  : val;
                                                const newTags = [...(Array.isArray(fieldValue) ? fieldValue : []), newItem];
                                                handleFieldUpdate(schemaPath, newTags);
                                                e.currentTarget.value = '';
                                              }
                                            }
                                          }}
                                        />
                                      </div>
                                    ) : field.type === 'select' ? (
                                      <select
                                        value={typeof fieldValue === 'string' ? fieldValue : ''}
                                        onChange={(e) => handleFieldUpdate(schemaPath, e.target.value)}
                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                                      >
                                        <option value="">Select...</option>
                                        {Array.isArray(field.options) && field.options.map((opt: string) => (
                                          <option key={String(opt)} value={String(opt)}>{String(opt)}</option>
                                        ))}
                                      </select>
                                    ) : field.type === 'address' ? (
                                      <input
                                        type="text"
                                        value={typeof fieldValue === 'string' ? fieldValue : (typeof fieldValue === 'object' && fieldValue !== null ? (fieldValue.street || fieldValue.city || '') : '')}
                                        onChange={(e) => handleFieldUpdate(schemaPath, e.target.value)}
                                        placeholder="Enter address..."
                                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                      />
                                    ) : field.type === 'schedule' || field.type === 'faq' || field.type === 'list' ? (
                                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                        <p className="text-xs text-slate-500 mb-2">Use the AI assistant to manage {field.label.toLowerCase()}</p>
                                        <button
                                          onClick={() => setShowAIChat(true)}
                                          className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                                        >
                                          ✨ Open AI Assistant
                                        </button>
                                      </div>
                                    ) : field.type === 'inventory' ? (
                                      <div className="p-4 bg-gradient-to-br from-slate-50 to-indigo-50 border border-slate-200 rounded-xl space-y-4">
                                        {/* Import/Export Bar */}
                                        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                                          <div className="flex items-center gap-2">
                                            <span className="text-lg">
                                              {field.inventoryType === 'properties' ? '🏠' :
                                               field.inventoryType === 'products' ? '📦' :
                                               field.inventoryType === 'menu' ? '🍽️' :
                                               field.inventoryType === 'rooms' ? '🛏️' :
                                               field.inventoryType === 'healthcare' ? '💊' :
                                               field.inventoryType === 'diagnostics' ? '🔬' : '📋'}
                                            </span>
                                            <div>
                                              <p className="text-sm font-semibold text-slate-800">{field.label}</p>
                                              <p className="text-xs text-slate-500">{field.hint || 'Manage your catalog'}</p>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <button
                                              onClick={() => {
                                                // Export functionality - download as CSV
                                                const items = Array.isArray(fieldValue) ? fieldValue : [];
                                                if (items.length === 0) {
                                                  alert('No items to export');
                                                  return;
                                                }
                                                const headers = Object.keys(items[0]).filter(k => !['id', 'createdAt', 'updatedAt'].includes(k));
                                                const csvContent = [
                                                  headers.join(','),
                                                  ...items.map(item => headers.map(h => {
                                                    const val = item[h];
                                                    if (val === null || val === undefined) return '';
                                                    if (typeof val === 'object') return JSON.stringify(val).replace(/,/g, ';');
                                                    return String(val).replace(/,/g, ';');
                                                  }).join(','))
                                                ].join('\n');
                                                const blob = new Blob([csvContent], { type: 'text/csv' });
                                                const url = URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = `${field.key}-export.csv`;
                                                a.click();
                                                URL.revokeObjectURL(url);
                                              }}
                                              className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1"
                                            >
                                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                              </svg>
                                              Export
                                            </button>
                                            <label className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1">
                                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                              </svg>
                                              Import CSV
                                              <input
                                                type="file"
                                                accept=".csv"
                                                className="hidden"
                                                onChange={(e) => {
                                                  const file = e.target.files?.[0];
                                                  if (!file) return;
                                                  const reader = new FileReader();
                                                  reader.onload = (event) => {
                                                    const text = event.target?.result as string;
                                                    const lines = text.split('\n').filter(l => l.trim());
                                                    if (lines.length < 2) return;
                                                    const headers = lines[0].split(',').map(h => h.trim());
                                                    const items = lines.slice(1).map((line, idx) => {
                                                      const values = line.split(',');
                                                      const item: any = { id: `import-${Date.now()}-${idx}` };
                                                      headers.forEach((h, i) => {
                                                        item[h] = values[i]?.trim() || '';
                                                      });
                                                      // Ensure required fields
                                                      item.name = item.name || 'Imported Item';
                                                      item.price = parseFloat(item.price) || 0;
                                                      item.createdAt = new Date();
                                                      item.updatedAt = new Date();
                                                      return item;
                                                    });
                                                    const current = Array.isArray(fieldValue) ? fieldValue : [];
                                                    handleFieldUpdate(schemaPath, [...current, ...items]);
                                                    alert(`Imported ${items.length} items`);
                                                  };
                                                  reader.readAsText(file);
                                                  e.target.value = '';
                                                }}
                                              />
                                            </label>
                                          </div>
                                        </div>

                                        {/* Quick Add Form */}
                                        <div className="space-y-3">
                                          <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-slate-800">Quick Add</p>
                                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">
                                              {field.inventoryType === 'properties' ? '🏠' :
                                               field.inventoryType === 'products' ? '📦' :
                                               field.inventoryType === 'menu' ? '🍽️' :
                                               field.inventoryType === 'rooms' ? '🛏️' :
                                               field.inventoryType === 'healthcare' ? '💊' :
                                               field.inventoryType === 'diagnostics' ? '🔬' : '📋'}
                                            </span>
                                          </div>

                                          {/* Dynamic fields based on inventory type */}
                                          {field.inventoryType === 'products' && (
                                            <div className="space-y-2">
                                              <div className="grid grid-cols-4 gap-2">
                                                <input type="text" placeholder="Product name *" className="col-span-2 px-3 py-2 border border-slate-200 rounded-lg text-sm" id={`${field.key}-name`} />
                                                <input type="text" placeholder="SKU/Code" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" id={`${field.key}-sku`} />
                                                <input type="text" placeholder="Price (₹) *" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" id={`${field.key}-price`} />
                                              </div>
                                              <div className="grid grid-cols-4 gap-2">
                                                <input type="text" placeholder="MRP (₹)" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" id={`${field.key}-mrp`} />
                                                <input type="text" placeholder="Category" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" id={`${field.key}-category`} />
                                                <input type="number" placeholder="Stock Qty" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" id={`${field.key}-stock`} />
                                                <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" id={`${field.key}-condition`}>
                                                  <option value="new">New</option>
                                                  <option value="refurbished">Refurbished</option>
                                                  <option value="used">Used</option>
                                                </select>
                                              </div>
                                              <textarea placeholder="Short description..." className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" rows={2} id={`${field.key}-desc`} />
                                            </div>
                                          )}
                                          {field.inventoryType === 'properties' && (
                                            <div className="space-y-2">
                                              <div className="grid grid-cols-4 gap-2">
                                                <input type="text" placeholder="Property title *" className="col-span-2 px-3 py-2 border border-slate-200 rounded-lg text-sm" id={`${field.key}-name`} />
                                                <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" id={`${field.key}-type`}>
                                                  <option value="apartment">Apartment</option>
                                                  <option value="villa">Villa</option>
                                                  <option value="independent_house">Independent House</option>
                                                  <option value="plot">Plot</option>
                                                  <option value="commercial">Commercial</option>
                                                  <option value="office">Office</option>
                                                  <option value="shop">Shop</option>
                                                  <option value="pg">PG/Hostel</option>
                                                </select>
                                                <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" id={`${field.key}-transaction`}>
                                                  <option value="sale">For Sale</option>
                                                  <option value="rent">For Rent</option>
                                                  <option value="lease">For Lease</option>
                                                </select>
                                              </div>
                                              <div className="grid grid-cols-5 gap-2">
                                                <input type="text" placeholder="Price (₹) *" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" id={`${field.key}-price`} />
                                                <input type="number" placeholder="BHK" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" id={`${field.key}-bedrooms`} />
                                                <input type="number" placeholder="Baths" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" id={`${field.key}-bathrooms`} />
                                                <input type="number" placeholder="Sq.ft" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" id={`${field.key}-area`} />
                                                <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" id={`${field.key}-furnishing`}>
                                                  <option value="unfurnished">Unfurnished</option>
                                                  <option value="semi-furnished">Semi-Furnished</option>
                                                  <option value="fully-furnished">Fully Furnished</option>
                                                </select>
                                              </div>
                                              <div className="grid grid-cols-3 gap-2">
                                                <input type="text" placeholder="Locality *" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" id={`${field.key}-locality`} />
                                                <input type="text" placeholder="City *" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" id={`${field.key}-city`} />
                                                <input type="text" placeholder="RERA ID (if any)" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" id={`${field.key}-rera`} />
                                              </div>
                                            </div>
                                          )}
                                          {field.inventoryType === 'menu' && (
                                            <div className="space-y-2">
                                              <div className="grid grid-cols-5 gap-2">
                                                <input type="text" placeholder="Dish name *" className="col-span-2 px-3 py-2 border border-slate-200 rounded-lg text-sm" id={`${field.key}-name`} />
                                                <input type="text" placeholder="Price (₹) *" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" id={`${field.key}-price`} />
                                                <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" id={`${field.key}-veg`}>
                                                  <option value="veg">🟢 Veg</option>
                                                  <option value="non_veg">🔴 Non-Veg</option>
                                                  <option value="egg">🟡 Egg</option>
                                                  <option value="vegan">🌱 Vegan</option>
                                                </select>
                                                <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" id={`${field.key}-spice`}>
                                                  <option value="none">No Spice</option>
                                                  <option value="mild">Mild 🌶️</option>
                                                  <option value="medium">Medium 🌶️🌶️</option>
                                                  <option value="hot">Hot 🌶️🌶️🌶️</option>
                                                </select>
                                              </div>
                                              <div className="grid grid-cols-4 gap-2">
                                                <input type="text" placeholder="Category (e.g., Starters)" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" id={`${field.key}-category`} />
                                                <input type="text" placeholder="Cuisine (e.g., North Indian)" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" id={`${field.key}-cuisine`} />
                                                <input type="text" placeholder="Prep time (e.g., 15 mins)" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" id={`${field.key}-prepTime`} />
                                                <input type="text" placeholder="Serves (e.g., 2-3)" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" id={`${field.key}-serves`} />
                                              </div>
                                              <div className="flex gap-4 text-xs">
                                                <label className="flex items-center gap-1.5">
                                                  <input type="checkbox" id={`${field.key}-bestseller`} className="rounded" /> Bestseller
                                                </label>
                                                <label className="flex items-center gap-1.5">
                                                  <input type="checkbox" id={`${field.key}-chefSpecial`} className="rounded" /> Chef's Special
                                                </label>
                                                <label className="flex items-center gap-1.5">
                                                  <input type="checkbox" id={`${field.key}-jain`} className="rounded" /> Jain Option
                                                </label>
                                                <label className="flex items-center gap-1.5">
                                                  <input type="checkbox" id={`${field.key}-glutenFree`} className="rounded" /> Gluten-Free
                                                </label>
                                              </div>
                                            </div>
                                          )}
                                          {field.inventoryType === 'rooms' && (
                                            <div className="space-y-2">
                                              <div className="grid grid-cols-4 gap-2">
                                                <input type="text" placeholder="Room name (e.g., Deluxe) *" className="col-span-2 px-3 py-2 border border-slate-200 rounded-lg text-sm" id={`${field.key}-name`} />
                                                <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" id={`${field.key}-category`}>
                                                  <option value="standard">Standard</option>
                                                  <option value="deluxe">Deluxe</option>
                                                  <option value="superior">Superior</option>
                                                  <option value="premium">Premium</option>
                                                  <option value="suite">Suite</option>
                                                  <option value="villa">Villa</option>
                                                </select>
                                                <input type="text" placeholder="Price/night (₹) *" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" id={`${field.key}-price`} />
                                              </div>
                                              <div className="grid grid-cols-5 gap-2">
                                                <input type="number" placeholder="Max Guests *" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" id={`${field.key}-guests`} />
                                                <input type="number" placeholder="Adults" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" id={`${field.key}-adults`} />
                                                <input type="number" placeholder="Children" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" id={`${field.key}-children`} />
                                                <input type="number" placeholder="Size (sq.ft)" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" id={`${field.key}-size`} />
                                                <input type="number" placeholder="Total Rooms" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" id={`${field.key}-totalRooms`} />
                                              </div>
                                              <div className="grid grid-cols-3 gap-2">
                                                <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" id={`${field.key}-bedType`}>
                                                  <option value="king">King Bed</option>
                                                  <option value="queen">Queen Bed</option>
                                                  <option value="double">Double Bed</option>
                                                  <option value="twin">Twin Beds</option>
                                                  <option value="single">Single Bed</option>
                                                </select>
                                                <input type="text" placeholder="View (e.g., Sea View)" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" id={`${field.key}-view`} />
                                                <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" id={`${field.key}-cancellation`}>
                                                  <option value="free">Free Cancellation</option>
                                                  <option value="flexible">Flexible</option>
                                                  <option value="moderate">Moderate</option>
                                                  <option value="strict">Strict</option>
                                                  <option value="non_refundable">Non-Refundable</option>
                                                </select>
                                              </div>
                                              <input type="text" placeholder="Amenities (comma separated: AC, TV, WiFi, Mini Bar...)" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" id={`${field.key}-amenities`} />
                                            </div>
                                          )}
                                          {field.inventoryType === 'healthcare' && (
                                            <div className="space-y-2">
                                              <div className="grid grid-cols-4 gap-2">
                                                <input type="text" placeholder="Service name *" className="col-span-2 px-3 py-2 border border-slate-200 rounded-lg text-sm" id={`${field.key}-name`} />
                                                <input type="text" placeholder="Fee (₹) *" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" id={`${field.key}-price`} />
                                                <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" id={`${field.key}-category`}>
                                                  <option value="consultation">Consultation</option>
                                                  <option value="treatment">Treatment</option>
                                                  <option value="procedure">Procedure</option>
                                                  <option value="therapy">Therapy</option>
                                                  <option value="checkup">Health Checkup</option>
                                                  <option value="surgery">Surgery</option>
                                                  <option value="vaccination">Vaccination</option>
                                                </select>
                                              </div>
                                              <div className="grid grid-cols-4 gap-2">
                                                <input type="text" placeholder="Duration (e.g., 30 mins)" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" id={`${field.key}-duration`} />
                                                <input type="text" placeholder="Department" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" id={`${field.key}-department`} />
                                                <input type="text" placeholder="Follow-up fee (₹)" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" id={`${field.key}-followUpFee`} />
                                                <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" id={`${field.key}-consultType`}>
                                                  <option value="in_person">In-Person</option>
                                                  <option value="video">Video Call</option>
                                                  <option value="phone">Phone</option>
                                                  <option value="home_visit">Home Visit</option>
                                                </select>
                                              </div>
                                              <div className="flex gap-4 text-xs">
                                                <label className="flex items-center gap-1.5">
                                                  <input type="checkbox" id={`${field.key}-insurance`} className="rounded" /> Insurance Covered
                                                </label>
                                                <label className="flex items-center gap-1.5">
                                                  <input type="checkbox" id={`${field.key}-emergency`} className="rounded" /> Emergency Available
                                                </label>
                                              </div>
                                            </div>
                                          )}
                                          {field.inventoryType === 'diagnostics' && (
                                            <div className="space-y-2">
                                              <div className="grid grid-cols-4 gap-2">
                                                <input type="text" placeholder="Test name *" className="col-span-2 px-3 py-2 border border-slate-200 rounded-lg text-sm" id={`${field.key}-name`} />
                                                <input type="text" placeholder="Price (₹) *" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" id={`${field.key}-price`} />
                                                <input type="text" placeholder="MRP (₹)" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" id={`${field.key}-mrp`} />
                                              </div>
                                              <div className="grid grid-cols-4 gap-2">
                                                <input type="text" placeholder="Category (e.g., Blood Test)" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" id={`${field.key}-category`} />
                                                <select className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white" id={`${field.key}-sampleType`}>
                                                  <option value="Blood">Blood</option>
                                                  <option value="Urine">Urine</option>
                                                  <option value="Stool">Stool</option>
                                                  <option value="Swab">Swab</option>
                                                  <option value="None">None (Imaging)</option>
                                                </select>
                                                <input type="text" placeholder="Report time (e.g., 24 hrs)" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" id={`${field.key}-reportTime`} />
                                                <input type="number" placeholder="Parameters" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" id={`${field.key}-parameters`} />
                                              </div>
                                              <div className="flex gap-4 text-xs">
                                                <label className="flex items-center gap-1.5">
                                                  <input type="checkbox" id={`${field.key}-fasting`} className="rounded" /> Fasting Required
                                                </label>
                                                <label className="flex items-center gap-1.5">
                                                  <input type="checkbox" id={`${field.key}-homeCollection`} className="rounded" defaultChecked /> Home Collection
                                                </label>
                                                <label className="flex items-center gap-1.5">
                                                  <input type="checkbox" id={`${field.key}-isPackage`} className="rounded" /> Health Package
                                                </label>
                                              </div>
                                            </div>
                                          )}

                                          <div className="flex gap-2">
                                            <button
                                              onClick={() => {
                                                const nameEl = document.getElementById(`${field.key}-name`) as HTMLInputElement;
                                                const priceEl = document.getElementById(`${field.key}-price`) as HTMLInputElement;
                                                if (nameEl?.value) {
                                                  const newItem: any = {
                                                    id: `${Date.now()}`,
                                                    name: nameEl.value,
                                                    price: priceEl?.value ? parseFloat(priceEl.value) : 0,
                                                    createdAt: new Date(),
                                                    updatedAt: new Date(),
                                                  };

                                                  // Products - E-Commerce
                                                  if (field.inventoryType === 'products') {
                                                    const skuEl = document.getElementById(`${field.key}-sku`) as HTMLInputElement;
                                                    const mrpEl = document.getElementById(`${field.key}-mrp`) as HTMLInputElement;
                                                    const categoryEl = document.getElementById(`${field.key}-category`) as HTMLInputElement;
                                                    const stockEl = document.getElementById(`${field.key}-stock`) as HTMLInputElement;
                                                    const conditionEl = document.getElementById(`${field.key}-condition`) as HTMLSelectElement;
                                                    const descEl = document.getElementById(`${field.key}-desc`) as HTMLTextAreaElement;

                                                    newItem.sku = skuEl?.value || '';
                                                    newItem.productCode = skuEl?.value || '';
                                                    newItem.category = categoryEl?.value || '';
                                                    newItem.condition = conditionEl?.value || 'new';
                                                    newItem.description = descEl?.value || '';
                                                    newItem.shortDescription = descEl?.value?.substring(0, 100) || '';
                                                    newItem.pricing = {
                                                      price: newItem.price,
                                                      mrp: mrpEl?.value ? parseFloat(mrpEl.value) : undefined,
                                                      currency: 'INR',
                                                      taxInclusive: true,
                                                    };
                                                    newItem.inventory = {
                                                      trackInventory: !!stockEl?.value,
                                                      inStock: true,
                                                      stockQuantity: stockEl?.value ? parseInt(stockEl.value) : undefined,
                                                      allowBackorder: false,
                                                    };
                                                    newItem.status = 'active';
                                                    newItem.visibility = 'visible';
                                                    newItem.hasVariants = false;
                                                    newItem.media = { images: [] };
                                                    newItem.shipping = { shipsWithin: '2-3 days', freeShipping: false };
                                                    newItem.promotion = { isPopular: false, isFeatured: false, isNewArrival: true, isOnSale: !!mrpEl?.value };
                                                    newItem.tags = [];
                                                    // Clear extra fields
                                                    if (skuEl) skuEl.value = '';
                                                    if (mrpEl) mrpEl.value = '';
                                                    if (categoryEl) categoryEl.value = '';
                                                    if (stockEl) stockEl.value = '';
                                                    if (descEl) descEl.value = '';
                                                  }

                                                  // Properties - Real Estate
                                                  if (field.inventoryType === 'properties') {
                                                    const typeEl = document.getElementById(`${field.key}-type`) as HTMLSelectElement;
                                                    const transactionEl = document.getElementById(`${field.key}-transaction`) as HTMLSelectElement;
                                                    const bedroomsEl = document.getElementById(`${field.key}-bedrooms`) as HTMLInputElement;
                                                    const bathroomsEl = document.getElementById(`${field.key}-bathrooms`) as HTMLInputElement;
                                                    const areaEl = document.getElementById(`${field.key}-area`) as HTMLInputElement;
                                                    const furnishingEl = document.getElementById(`${field.key}-furnishing`) as HTMLSelectElement;
                                                    const localityEl = document.getElementById(`${field.key}-locality`) as HTMLInputElement;
                                                    const cityEl = document.getElementById(`${field.key}-city`) as HTMLInputElement;
                                                    const reraEl = document.getElementById(`${field.key}-rera`) as HTMLInputElement;

                                                    newItem.title = newItem.name;
                                                    newItem.type = typeEl?.value || 'apartment';
                                                    newItem.transactionType = transactionEl?.value || 'sale';
                                                    newItem.status = 'available';
                                                    newItem.location = {
                                                      locality: localityEl?.value || '',
                                                      city: cityEl?.value || '',
                                                      state: '',
                                                      country: 'India',
                                                    };
                                                    newItem.configuration = {
                                                      bedrooms: bedroomsEl?.value ? parseInt(bedroomsEl.value) : undefined,
                                                      bathrooms: bathroomsEl?.value ? parseInt(bathroomsEl.value) : undefined,
                                                    };
                                                    newItem.area = {
                                                      carpet: { value: areaEl?.value ? parseInt(areaEl.value) : 0, unit: 'sqft' },
                                                    };
                                                    newItem.pricing = {
                                                      price: newItem.price,
                                                      priceType: 'negotiable',
                                                    };
                                                    newItem.features = {
                                                      furnishing: furnishingEl?.value || 'unfurnished',
                                                      possession: 'ready_to_move',
                                                    };
                                                    newItem.amenities = [];
                                                    newItem.media = { images: [] };
                                                    newItem.legal = { reraId: reraEl?.value || undefined };
                                                    newItem.contact = { type: 'owner' };
                                                    newItem.visibility = { isActive: true, isFeatured: false, showPrice: true, showContact: true };
                                                    newItem.currency = 'INR';
                                                    // Clear extra fields
                                                    if (localityEl) localityEl.value = '';
                                                    if (cityEl) cityEl.value = '';
                                                    if (bedroomsEl) bedroomsEl.value = '';
                                                    if (bathroomsEl) bathroomsEl.value = '';
                                                    if (areaEl) areaEl.value = '';
                                                    if (reraEl) reraEl.value = '';
                                                  }

                                                  // Menu Items - Restaurant
                                                  if (field.inventoryType === 'menu') {
                                                    const vegEl = document.getElementById(`${field.key}-veg`) as HTMLSelectElement;
                                                    const spiceEl = document.getElementById(`${field.key}-spice`) as HTMLSelectElement;
                                                    const categoryEl = document.getElementById(`${field.key}-category`) as HTMLInputElement;
                                                    const cuisineEl = document.getElementById(`${field.key}-cuisine`) as HTMLInputElement;
                                                    const prepTimeEl = document.getElementById(`${field.key}-prepTime`) as HTMLInputElement;
                                                    const servesEl = document.getElementById(`${field.key}-serves`) as HTMLInputElement;
                                                    const bestsellerEl = document.getElementById(`${field.key}-bestseller`) as HTMLInputElement;
                                                    const chefSpecialEl = document.getElementById(`${field.key}-chefSpecial`) as HTMLInputElement;
                                                    const jainEl = document.getElementById(`${field.key}-jain`) as HTMLInputElement;
                                                    const glutenFreeEl = document.getElementById(`${field.key}-glutenFree`) as HTMLInputElement;

                                                    const vegType = vegEl?.value || 'veg';
                                                    newItem.categoryId = categoryEl?.value || '';
                                                    newItem.cuisine = cuisineEl?.value || '';
                                                    newItem.pricing = {
                                                      price: newItem.price,
                                                      currency: 'INR',
                                                      hasVariants: false,
                                                      isCombo: false,
                                                      taxInclusive: true,
                                                    };
                                                    newItem.dietary = {
                                                      type: vegType,
                                                      isVegetarian: vegType === 'veg' || vegType === 'vegan',
                                                      isVegan: vegType === 'vegan',
                                                      isGlutenFree: glutenFreeEl?.checked || false,
                                                      isJainFriendly: jainEl?.checked || false,
                                                    };
                                                    newItem.spiceLevel = spiceEl?.value || 'medium';
                                                    newItem.availability = {
                                                      isAvailable: true,
                                                      isActive: true,
                                                    };
                                                    newItem.preparation = {
                                                      prepTime: prepTimeEl?.value || '15-20 mins',
                                                      servesCount: servesEl?.value || '',
                                                    };
                                                    newItem.customizations = { enabled: false, options: [] };
                                                    newItem.media = {};
                                                    newItem.promotion = {
                                                      isPopular: bestsellerEl?.checked || false,
                                                      isChefSpecial: chefSpecialEl?.checked || false,
                                                      isNewItem: true,
                                                      isBestSeller: bestsellerEl?.checked || false,
                                                    };
                                                    newItem.ordering = {};
                                                    newItem.displayOrder = 0;
                                                    // Clear extra fields
                                                    if (categoryEl) categoryEl.value = '';
                                                    if (cuisineEl) cuisineEl.value = '';
                                                    if (prepTimeEl) prepTimeEl.value = '';
                                                    if (servesEl) servesEl.value = '';
                                                    if (bestsellerEl) bestsellerEl.checked = false;
                                                    if (chefSpecialEl) chefSpecialEl.checked = false;
                                                    if (jainEl) jainEl.checked = false;
                                                    if (glutenFreeEl) glutenFreeEl.checked = false;
                                                  }

                                                  // Rooms - Hospitality
                                                  if (field.inventoryType === 'rooms') {
                                                    const categoryEl = document.getElementById(`${field.key}-category`) as HTMLSelectElement;
                                                    const guestsEl = document.getElementById(`${field.key}-guests`) as HTMLInputElement;
                                                    const adultsEl = document.getElementById(`${field.key}-adults`) as HTMLInputElement;
                                                    const childrenEl = document.getElementById(`${field.key}-children`) as HTMLInputElement;
                                                    const sizeEl = document.getElementById(`${field.key}-size`) as HTMLInputElement;
                                                    const totalRoomsEl = document.getElementById(`${field.key}-totalRooms`) as HTMLInputElement;
                                                    const bedTypeEl = document.getElementById(`${field.key}-bedType`) as HTMLSelectElement;
                                                    const viewEl = document.getElementById(`${field.key}-view`) as HTMLInputElement;
                                                    const cancellationEl = document.getElementById(`${field.key}-cancellation`) as HTMLSelectElement;
                                                    const amenitiesEl = document.getElementById(`${field.key}-amenities`) as HTMLInputElement;

                                                    newItem.category = categoryEl?.value || 'deluxe';
                                                    newItem.occupancy = {
                                                      baseOccupancy: 2,
                                                      maxOccupancy: guestsEl?.value ? parseInt(guestsEl.value) : 2,
                                                      maxAdults: adultsEl?.value ? parseInt(adultsEl.value) : 2,
                                                      maxChildren: childrenEl?.value ? parseInt(childrenEl.value) : 0,
                                                      infantsAllowed: true,
                                                      extraBedAvailable: true,
                                                    };
                                                    newItem.bedding = {
                                                      beds: [{ type: bedTypeEl?.value || 'king', count: 1 }],
                                                    };
                                                    newItem.specifications = {
                                                      size: { value: sizeEl?.value ? parseInt(sizeEl.value) : 300, unit: 'sqft' },
                                                      view: viewEl?.value || '',
                                                    };
                                                    newItem.amenities = {
                                                      inRoom: amenitiesEl?.value?.split(',').map(s => s.trim()).filter(Boolean) || ['AC', 'TV', 'WiFi'],
                                                      bathroom: ['Shower', 'Toiletries'],
                                                      entertainment: [],
                                                      comfort: [],
                                                      food: ['Electric Kettle'],
                                                    };
                                                    newItem.pricing = {
                                                      basePrice: newItem.price,
                                                      currency: 'INR',
                                                      taxInclusive: false,
                                                    };
                                                    newItem.availability = {
                                                      totalRooms: totalRoomsEl?.value ? parseInt(totalRoomsEl.value) : 1,
                                                      isActive: true,
                                                      instantBooking: true,
                                                      cancellationPolicy: cancellationEl?.value || 'flexible',
                                                      prepaymentRequired: true,
                                                    };
                                                    newItem.media = { images: [] };
                                                    newItem.displayOrder = 0;
                                                    // Clear extra fields
                                                    if (guestsEl) guestsEl.value = '';
                                                    if (adultsEl) adultsEl.value = '';
                                                    if (childrenEl) childrenEl.value = '';
                                                    if (sizeEl) sizeEl.value = '';
                                                    if (totalRoomsEl) totalRoomsEl.value = '';
                                                    if (viewEl) viewEl.value = '';
                                                    if (amenitiesEl) amenitiesEl.value = '';
                                                  }

                                                  // Healthcare Services
                                                  if (field.inventoryType === 'healthcare') {
                                                    const categoryEl = document.getElementById(`${field.key}-category`) as HTMLSelectElement;
                                                    const durationEl = document.getElementById(`${field.key}-duration`) as HTMLInputElement;
                                                    const departmentEl = document.getElementById(`${field.key}-department`) as HTMLInputElement;
                                                    const followUpFeeEl = document.getElementById(`${field.key}-followUpFee`) as HTMLInputElement;
                                                    const consultTypeEl = document.getElementById(`${field.key}-consultType`) as HTMLSelectElement;
                                                    const insuranceEl = document.getElementById(`${field.key}-insurance`) as HTMLInputElement;
                                                    const emergencyEl = document.getElementById(`${field.key}-emergency`) as HTMLInputElement;

                                                    newItem.category = categoryEl?.value || 'consultation';
                                                    newItem.department = departmentEl?.value || '';
                                                    newItem.pricing = {
                                                      price: newItem.price,
                                                      priceType: 'fixed',
                                                      currency: 'INR',
                                                      followUpFee: followUpFeeEl?.value ? parseFloat(followUpFeeEl.value) : undefined,
                                                      insuranceCovered: insuranceEl?.checked || false,
                                                    };
                                                    newItem.availability = {
                                                      isAvailable: true,
                                                      slotDuration: 30,
                                                      consultationType: [consultTypeEl?.value || 'in_person'],
                                                      emergencyAvailable: emergencyEl?.checked || false,
                                                    };
                                                    newItem.details = {
                                                      duration: durationEl?.value || '30 mins',
                                                    };
                                                    newItem.media = {};
                                                    newItem.visibility = {
                                                      isActive: true,
                                                      isFeatured: false,
                                                      isPopular: false,
                                                      showPrice: true,
                                                    };
                                                    // Clear extra fields
                                                    if (durationEl) durationEl.value = '';
                                                    if (departmentEl) departmentEl.value = '';
                                                    if (followUpFeeEl) followUpFeeEl.value = '';
                                                    if (insuranceEl) insuranceEl.checked = false;
                                                    if (emergencyEl) emergencyEl.checked = false;
                                                  }

                                                  // Diagnostic Tests
                                                  if (field.inventoryType === 'diagnostics') {
                                                    const mrpEl = document.getElementById(`${field.key}-mrp`) as HTMLInputElement;
                                                    const categoryEl = document.getElementById(`${field.key}-category`) as HTMLInputElement;
                                                    const sampleTypeEl = document.getElementById(`${field.key}-sampleType`) as HTMLSelectElement;
                                                    const reportTimeEl = document.getElementById(`${field.key}-reportTime`) as HTMLInputElement;
                                                    const parametersEl = document.getElementById(`${field.key}-parameters`) as HTMLInputElement;
                                                    const fastingEl = document.getElementById(`${field.key}-fasting`) as HTMLInputElement;
                                                    const homeCollectionEl = document.getElementById(`${field.key}-homeCollection`) as HTMLInputElement;
                                                    const isPackageEl = document.getElementById(`${field.key}-isPackage`) as HTMLInputElement;

                                                    newItem.category = categoryEl?.value || 'Blood Test';
                                                    newItem.mrp = mrpEl?.value ? parseFloat(mrpEl.value) : undefined;
                                                    newItem.currency = 'INR';
                                                    newItem.sampleType = sampleTypeEl?.value || 'Blood';
                                                    newItem.reportTime = reportTimeEl?.value || '24 hours';
                                                    newItem.parameterCount = parametersEl?.value ? parseInt(parametersEl.value) : undefined;
                                                    newItem.fastingRequired = fastingEl?.checked || false;
                                                    newItem.homeCollectionAvailable = homeCollectionEl?.checked || true;
                                                    newItem.walkInAvailable = true;
                                                    newItem.appointmentRequired = false;
                                                    newItem.isActive = true;
                                                    newItem.isPopular = false;
                                                    newItem.isPackage = isPackageEl?.checked || false;
                                                    // Clear extra fields
                                                    if (mrpEl) mrpEl.value = '';
                                                    if (categoryEl) categoryEl.value = '';
                                                    if (reportTimeEl) reportTimeEl.value = '';
                                                    if (parametersEl) parametersEl.value = '';
                                                    if (fastingEl) fastingEl.checked = false;
                                                    if (homeCollectionEl) homeCollectionEl.checked = true;
                                                    if (isPackageEl) isPackageEl.checked = false;
                                                  }

                                                  const current = Array.isArray(fieldValue) ? fieldValue : [];
                                                  handleFieldUpdate(schemaPath, [...current, newItem]);
                                                  // Clear main inputs
                                                  nameEl.value = '';
                                                  if (priceEl) priceEl.value = '';
                                                }
                                              }}
                                              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                                            >
                                              + Add Item
                                            </button>
                                            <button
                                              onClick={() => setShowAIChat(true)}
                                              className="px-4 py-2 border border-indigo-300 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors"
                                            >
                                              ✨ AI Assistant
                                            </button>
                                          </div>
                                        </div>

                                        {/* Existing Items List */}
                                        {fieldValue && Array.isArray(fieldValue) && fieldValue.length > 0 && (
                                          <div className="border-t border-slate-200 pt-3">
                                            <p className="text-xs font-medium text-slate-600 mb-2">
                                              {fieldValue.length} {field.inventoryType === 'properties' ? 'properties' :
                                               field.inventoryType === 'products' ? 'products' :
                                               field.inventoryType === 'menu' ? 'items' :
                                               field.inventoryType === 'rooms' ? 'rooms' :
                                               field.inventoryType === 'healthcare' ? 'services' :
                                               field.inventoryType === 'diagnostics' ? 'tests' : 'items'}
                                            </p>
                                            <div className="space-y-1.5 max-h-32 overflow-y-auto">
                                              {fieldValue.slice(0, 5).map((item: any, idx: number) => (
                                                <div key={item.id || idx} className="flex items-center justify-between py-1.5 px-2 bg-white rounded-lg border border-slate-100">
                                                  <div className="flex items-center gap-2">
                                                    <span className="text-sm text-slate-800">{item.name || item.title}</span>
                                                    {item.price && <span className="text-xs text-slate-500">₹{item.price}</span>}
                                                    {item.isVegetarian !== undefined && (
                                                      <span className={`text-xs ${item.isVegetarian ? 'text-green-600' : 'text-red-600'}`}>
                                                        {item.isVegetarian ? '●' : '●'}
                                                      </span>
                                                    )}
                                                  </div>
                                                  <button
                                                    onClick={() => {
                                                      const updated = fieldValue.filter((_: any, i: number) => i !== idx);
                                                      handleFieldUpdate(schemaPath, updated);
                                                    }}
                                                    className="text-slate-400 hover:text-red-500 text-xs"
                                                  >
                                                    ✕
                                                  </button>
                                                </div>
                                              ))}
                                              {fieldValue.length > 5 && (
                                                <p className="text-xs text-slate-500 text-center py-1">+{fieldValue.length - 5} more items</p>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="p-2 border border-dashed border-slate-300 rounded-xl text-xs text-slate-500">
                                        Field type '{field.type}' not yet fully implemented in demo
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                  </div>
                </details>

                {/* Business Documents Section */}
                {partnerId && (
                  <div className="mt-6 bg-white rounded-2xl border border-slate-200 p-5">
                    <ProfileDocuments partnerId={partnerId} />
                  </div>
                )}
              </div>
            )}

            {/* ===== TEAM TAB ===== */}
            {activeTab === 'team' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Team</h2>
                    <p className="text-slate-500">Manage members and access levels</p>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setGeneratedCode(null);
                        setInviteForm({ name: '', phone: '', role: 'employee' });
                        setShowInviteModal(true);
                      }}
                      className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800"
                    >
                      + Invite Member
                    </button>
                  )}
                </div>

                {/* Team List */}
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Members</span>
                    </div>
                    {teamMembers.length > 0 ? teamMembers.map((member, i) => (
                      <div
                        key={member.id}
                        className={cn(
                          "px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors",
                          i !== teamMembers.length - 1 ? 'border-b border-slate-100' : ''
                        )}
                      >
                        <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-medium bg-gradient-to-br from-indigo-500 to-purple-600">
                          {member.name?.[0] || member.email?.[0] || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900">{member.name}</span>
                          </div>
                          <div className="text-sm text-slate-500">{member.email}</div>
                        </div>
                        <div className="text-right">
                          <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium", roleColors[member.role] || roleColors['employee'])}>
                            {roleLabels[member.role] || member.role}
                          </span>
                        </div>
                        {isAdmin && (
                          <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                            •••
                          </button>
                        )}
                      </div>
                    )) : (
                      <div className="p-8 text-center text-slate-500">No active members found</div>
                    )}
                  </div>

                  {/* Pending Invitations */}
                  {invitations.filter(inv => inv.status === 'pending').length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                      <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Invitations</span>
                      </div>
                      {invitations.filter(inv => inv.status === 'pending').map((inv, i, arr) => (
                        <div
                          key={inv.id}
                          className={cn(
                            "px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors",
                            i !== arr.length - 1 ? 'border-b border-slate-100' : ''
                          )}
                        >
                          <div className="w-11 h-11 rounded-full flex items-center justify-center text-slate-400 bg-slate-100">
                            📩
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-900">{inv.name}</span>
                              <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded uppercase font-bold">Pending</span>
                            </div>
                            <div className="text-sm text-slate-500">{inv.phoneNumber}</div>
                          </div>
                          <div className="text-right flex items-center gap-4">
                            <div className="text-right mr-2">
                              <div className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                                {inv.invitationCode}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-1 uppercase">{roleLabels[inv.role] || inv.role}</div>
                            </div>
                            {isAdmin && (
                              <button
                                onClick={() => handleCancelInvite(inv.id)}
                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                title="Cancel Invitation"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ===== ACCOUNT TAB ===== */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Account</h2>
                  <p className="text-slate-500">Personal and workspace settings</p>
                </div>

                {/* Profile */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">Your Profile</h3>
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="relative mx-auto md:mx-0">
                      <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl font-bold text-white overflow-hidden">
                        {user?.photoURL ? (
                          <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                        ) : (
                          user?.displayName?.[0] || 'U'
                        )}
                      </div>
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-slate-500 font-medium">Full Name</label>
                        <input type="text" value={user?.displayName || ''} readOnly className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 font-medium">Email</label>
                        <input type="email" value={user?.email || ''} readOnly className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Workspace */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">Workspace</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-500 font-medium">Workspace Name</label>
                      <input type="text" defaultValue={partner?.businessName || ''} className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 font-medium">Workspace ID</label>
                      <div className="mt-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-500 line-clamp-1">
                        {partnerId}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===== ADMIN TAB ===== */}
            {activeTab === 'admin' && isAdmin && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Admin Settings</h2>
                  <p className="text-slate-500">Integrations, templates, and advanced controls</p>
                </div>

                {/* Messaging Integrations */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-semibold text-slate-900">Messaging Integrations</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {integrations.map(integration => (
                      <div
                        key={integration.id}
                        className={cn(
                          "p-4 rounded-xl border-2",
                          integration.status === 'connected' ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{integration.icon}</span>
                            <span className="font-medium text-slate-900">{integration.name}</span>
                          </div>
                          {integration.status === 'connected' ? (
                            <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">Connected</span>
                          ) : (
                            <button
                              onClick={() => router.push(`/partner/apps/${integration.id === 'whatsapp' ? 'whatsapp-api' : integration.id}`)}
                              className="text-xs px-2 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            >
                              Connect
                            </button>
                          )}
                        </div>
                        {integration.account && (
                          <p className="text-sm text-slate-500 truncate">{integration.account}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Agent Settings */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">AI Agent Behavior</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-slate-100">
                      <div>
                        <p className="font-medium text-slate-900">Human handoff escalation</p>
                        <p className="text-sm text-slate-500">When AI is unsure, escalate to human</p>
                      </div>
                      <select
                        value={persona.personality?.escalationPreferences?.escalateOnHumanRequest ? 'always' : 'keyword'}
                        onChange={(e) => handleFieldUpdate('personality.escalationPreferences.escalateOnHumanRequest', e.target.value === 'always')}
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white"
                      >
                        <option value="always">Always escalate</option>
                        <option value="keyword">On Keywords</option>
                      </select>
                    </div>
                  </div>
                </div>
                {/* Field Connection Audit */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <FieldConnectionAudit />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Business Profile Agent - Intercom-style Chat */}
        {partnerId && (
          <BusinessProfileAgent
            partnerId={partnerId}
            persona={persona}
            onPersonaUpdated={handlePersonaRefresh}
            open={showAIChat}
            onOpenChange={setShowAIChat}
          />
        )}
      </div>

      {/* Business Type Onboarding Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200 shrink-0">
              <h2 className="text-xl font-bold text-slate-900">What type of business are you?</h2>
              <p className="text-slate-500 mt-1">This customizes your profile fields and AI suggestions</p>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto">
              {businessTypes.map(type => {
                const isSelected = selectedBusinessTypes.includes(type.id);
                return (
                  <button
                    key={type.id}
                    onClick={() => toggleBusinessType(type.id)}
                    className={cn(
                      "p-4 rounded-xl border-2 text-left transition-all relative",
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-slate-200 hover:border-slate-300'
                    )}
                  >
                    {/* Checkbox */}
                    <div className={cn(
                      "absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-sm",
                      isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-400'
                    )}>
                      {isSelected ? '✓' : ''}
                    </div>
                    <div className="text-2xl mb-2">{type.icon}</div>
                    <h3 className="font-semibold text-slate-900">{type.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{type.desc}</p>
                  </button>
                );
              })}
            </div>
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
              <span className="text-sm text-slate-600">
                {selectedBusinessTypes.length} type{selectedBusinessTypes.length !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => setShowOnboarding(false)}
                disabled={selectedBusinessTypes.length === 0}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900">Invite Team Member</h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              {generatedCode ? (
                <div className="text-center py-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <p className="text-sm text-emerald-800 font-medium mb-2">Invitation Code Generated!</p>
                  <div className="text-3xl font-mono font-bold text-slate-900 tracking-widest mb-4">
                    {generatedCode}
                  </div>
                  <p className="text-xs text-emerald-600 px-6">
                    Share this code with <b>{inviteForm.name}</b>.
                    They can use it to join your workspace at login.
                  </p>
                  <button
                    onClick={() => {
                      if (navigator?.clipboard) {
                        navigator.clipboard.writeText(generatedCode);
                        toast.success("Code copied!");
                      } else {
                        toast.error("Could not access clipboard. Please copy manually.");
                      }
                    }}
                    className="mt-6 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
                  >
                    Copy Code
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g., Alex Johnson"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={inviteForm.name}
                      onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+91..."
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={inviteForm.phone}
                      onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Role</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setInviteForm({ ...inviteForm, role: 'employee' })}
                        className={cn(
                          "py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all",
                          inviteForm.role === 'employee' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200'
                        )}
                      >
                        Member
                      </button>
                      <button
                        onClick={() => setInviteForm({ ...inviteForm, role: 'partner_admin' })}
                        className={cn(
                          "py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all",
                          inviteForm.role === 'partner_admin' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200'
                        )}
                      >
                        Admin
                      </button>
                    </div>
                  </div>

                  <button
                    disabled={saving || !inviteForm.name || !inviteForm.phone}
                    onClick={handleSendInvite}
                    className="w-full py-3 bg-slate-900 text-white rounded-xl text-sm font-bold mt-4 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {saving ? 'Generating...' : 'Generate Invite Code'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SettingsUltimate;
