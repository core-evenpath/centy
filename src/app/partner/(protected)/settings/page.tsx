"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getPartnerProfileAction } from '@/actions/get-partner-profile';
import { getBusinessPersonaAction, saveBusinessPersonaAction } from '@/actions/business-persona-actions';

import { getPartnerInvitationCodesAction, generateEmployeeInvitationCodeAction, cancelInvitationCodeAction } from '@/actions/partner-invitation-management';
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
import SettingsAIChat from '@/components/partner/settings/SettingsAIChat';

const SettingsUltimate = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // State
  const [activeTab, setActiveTab] = useState('profile');
  const [selectedBusinessTypes, setSelectedBusinessTypes] = useState<string[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>('identity');
  const [showAICoach, setShowAICoach] = useState(true);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState<{ name: string; phone: string; role: 'employee' | 'partner_admin' }>({ name: '', phone: '', role: 'employee' });
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [teamFilter, setTeamFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      // Identity
      'name': 'identity.name',
      'tagline': 'personality.tagline',
      'description': 'personality.description',
      'founded': 'industrySpecificData.founded',
      'teamSize': 'industrySpecificData.teamSize',
      'usps': 'personality.uniqueSellingPoints',
      'category': 'identity.industry.name', // Approximate

      // Contact
      'phone': 'identity.phone',
      'whatsapp': 'identity.whatsAppNumber',
      'email': 'identity.email',
      'website': 'identity.website',
      'address': 'identity.address.street', // Simplified
      'officeAddress': 'identity.address.street',
      'serviceAreas': 'identity.serviceArea',

      // Availability
      'hoursType': 'identity.operatingHours.specialNote', // Store type here or custom field
      'schedule': 'identity.operatingHours.schedule',
      'responseTime': 'personality.responseTimeExpectation',
      'bookingLink': 'industrySpecificData.bookingLink',

      // Services / Products
      'services': 'knowledge.productsOrServices',
      'products': 'knowledge.productsOrServices',
      'consultationFee': 'knowledge.pricingHighlights',
      'paymentMethods': 'knowledge.acceptedPayments',
      'pricingNote': 'industrySpecificData.pricingNote',
      'priceRange': 'knowledge.pricingHighlights', // visual reuse

      // Credentials / Policies
      'certifications': 'knowledge.certifications',
      'awards': 'knowledge.awards',
      'faqs': 'knowledge.faqs',
      'returnPolicy': 'knowledge.policies.returnPolicy',
      'refundPolicy': 'knowledge.policies.refundPolicy',
      'cancellation': 'knowledge.policies.cancellationPolicy',
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
          { key: 'founded', label: 'Founded', type: 'text' },
          { key: 'teamSize', label: 'Team Size', type: 'select', options: ['Solo', '2-5', '5-10', '10-50', '50+'] },
          { key: 'usps', label: 'What Makes You Special', type: 'tags' },
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
        title: 'Property Types',
        icon: '🏘️',
        fields: [
          { key: 'types', label: 'Property Types', type: 'tags' },
          { key: 'segments', label: 'Segments', type: 'tags' },
          { key: 'priceRange', label: 'Price Range', type: 'text' },
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
          { key: 'services', label: 'Services', type: 'tags' },
          { key: 'treatments', label: 'Treatments', type: 'tags' },
          { key: 'consultationFee', label: 'Consultation Fee', type: 'text', required: true },
          { key: 'followUpFee', label: 'Follow-up Fee', type: 'text' },
        ]
      },
      insurance: {
        title: 'Insurance & Payments',
        icon: '💳',
        fields: [
          { key: 'insuranceAccepted', label: 'Insurance Accepted', type: 'tags' },
          { key: 'tpa', label: 'TPA Tie-ups', type: 'tags' },
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
          { key: 'roomTypes', label: 'Room Types', type: 'tags' },
          { key: 'priceRange', label: 'Price Range', type: 'text' },
          { key: 'checkIn', label: 'Check-in Time', type: 'text' },
          { key: 'checkOut', label: 'Check-out Time', type: 'text' },
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
          { key: 'pets', label: 'Pet Policy', type: 'text' },
          { key: 'children', label: 'Children Policy', type: 'text' },
          { key: 'faqs', label: 'FAQs', type: 'faq' },
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
              onClick={() => setShowAICoach(!showAICoach)}
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
                <span className="text-xs text-emerald-100">{showAICoach ? 'Hide' : 'Show'} Coach →</span>
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
        <div className={cn("transition-all duration-300", showAICoach && activeTab === 'profile' ? 'mr-0 xl:mr-80' : '')}>
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
                                    className={cn(field.type === 'textarea' || field.type === 'faq' || field.type === 'list' || field.type === 'schedule' ? 'col-span-1 md:col-span-2' : '')}
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
              </div>
            )}
          </div>
        </div>

        {/* AI Profile Coach Panel */}
        {showAICoach && activeTab === 'profile' && (
          <div className="hidden xl:flex w-80 bg-white border-l border-slate-200 fixed right-0 top-0 bottom-0 flex-col z-30 shadow-xl">
            <div className="px-4 py-4 border-b border-slate-200 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🧠</span>
                  <div>
                    <h3 className="font-bold text-sm">AI Profile Coach</h3>
                    <p className="text-xs text-emerald-100">Improving your AI</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAICoach(false)}
                  className="text-white/70 hover:text-white text-lg"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Score */}
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <div className="text-4xl font-bold text-slate-900">{profileScore}%</div>
                <div className="text-sm text-slate-500 mb-3">Profile Score</div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full" style={{ width: `${profileScore}%` }} />
                </div>
              </div>

              {/* AI Chat Button */}
              <button
                onClick={() => setShowAIChat(true)}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium text-sm hover:from-indigo-700 hover:to-purple-700 transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <span>✨</span>
                Update Profile with AI
              </button>

              {/* Quick Tips */}
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Quick Tips</h4>
                <div className="space-y-2">
                  <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                    <p className="text-xs text-indigo-700">
                      <strong>AI Chat:</strong> Say "Update my hours" or "Add a service" to make changes instantly
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                    <p className="text-xs text-emerald-700">
                      <strong>Documents:</strong> AI can read your uploaded documents and extract business info
                    </p>
                  </div>
                </div>
              </div>

              {/* Suggestions */}
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Priority Actions</h4>
                <div className="text-sm text-slate-500 text-center py-4">
                  {profileScore === 100 ? "Great job! Profile complete." : "Add more details to reach 100%."}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <p className="text-xs text-center text-slate-500">
                Changes here sync to your Inbox AI automatically
              </p>
            </div>
          </div>
        )}

        {/* AI Chat Panel */}
        {partnerId && (
          <SettingsAIChat
            partnerId={partnerId}
            persona={persona}
            onPersonaUpdated={handlePersonaRefresh}
            isOpen={showAIChat}
            onClose={() => setShowAIChat(false)}
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
