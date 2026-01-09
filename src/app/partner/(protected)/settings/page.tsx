"use client";

import React, { useState, useEffect } from 'react';

const SettingsUltimate = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [businessType, setBusinessType] = useState('professional');
  const [expandedSection, setExpandedSection] = useState('identity');
  const [showAICoach, setShowAICoach] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [teamFilter, setTeamFilter] = useState('all');
  const [editingField, setEditingField] = useState(null);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const profileScore = 72;
  const isAdmin = true;

  const user = {
    name: "Hariharan K",
    email: "hari@evenpath.com",
    phone: "+91 98765 43210",
    role: "owner",
    avatar: "H",
    plan: "Pro",
    memberSince: "Jan 2024",
  };

  const workspace = {
    name: "Evenpath Technologies",
    id: "ws_evenpath",
    region: "India",
    currency: "INR",
    timezone: "Asia/Kolkata",
  };

  const businessTypes = [
    { id: 'professional', icon: '💼', name: 'Professional Services', desc: 'Consulting, Legal, Agency' },
    { id: 'realestate', icon: '🏠', name: 'Real Estate', desc: 'Agents, Brokers, Property' },
    { id: 'financial', icon: '💰', name: 'Financial Services', desc: 'Advisors, Insurance, Loans' },
    { id: 'ecommerce', icon: '🛒', name: 'E-Commerce', desc: 'Online Store, D2C' },
    { id: 'healthcare', icon: '🏥', name: 'Healthcare', desc: 'Clinics, Doctors, Wellness' },
    { id: 'education', icon: '📚', name: 'Education', desc: 'Coaching, Courses, Tutoring' },
    { id: 'food', icon: '🍕', name: 'Food & Restaurant', desc: 'Restaurant, Cloud Kitchen' },
    { id: 'hospitality', icon: '🏨', name: 'Hospitality', desc: 'Hotels, Travel, Events' },
  ];

  const industryData = {
    professional: {
      identity: {
        title: 'Business Identity',
        icon: '🏢',
        fields: [
          { key: 'name', label: 'Business Name', type: 'text', value: 'Evenpath Technologies', required: true },
          { key: 'tagline', label: 'Tagline', type: 'text', value: 'Strategy that delivers results', placeholder: 'e.g., Your success is our mission' },
          { key: 'description', label: 'About', type: 'textarea', value: 'Expert consulting services to help your business grow.', required: true },
          { key: 'founded', label: 'Founded', type: 'text', value: '2020' },
          { key: 'teamSize', label: 'Team Size', type: 'select', value: '5-10', options: ['Solo', '2-5', '5-10', '10-50', '50+'] },
          { key: 'usps', label: 'What Makes You Special', type: 'tags', value: ['Expert team', 'Proven results', 'Custom solutions'] },
        ]
      },
      contact: {
        title: 'Contact & Reach',
        icon: '📍',
        fields: [
          { key: 'phone', label: 'Phone', type: 'phone', value: '+91 98765 43210', required: true },
          { key: 'whatsapp', label: 'WhatsApp', type: 'phone', value: '', placeholder: 'Same as phone if blank' },
          { key: 'email', label: 'Email', type: 'email', value: 'hello@evenpath.com', required: true },
          { key: 'website', label: 'Website', type: 'url', value: 'https://evenpath.com' },
          { key: 'address', label: 'Office Address', type: 'address', value: 'Ooty, Tamil Nadu' },
          { key: 'serviceAreas', label: 'Service Areas', type: 'tags', value: ['Pan India', 'Remote'] },
        ]
      },
      availability: {
        title: 'Availability',
        icon: '🕐',
        fields: [
          { key: 'hoursType', label: 'Working Hours', type: 'select', value: 'custom', options: ['24/7', 'Business Hours', 'By Appointment', 'Custom'] },
          { key: 'schedule', label: 'Schedule', type: 'schedule', value: { mon: '9-6', tue: '9-6', wed: '9-6', thu: '9-6', fri: '9-6', sat: '10-2', sun: 'closed' } },
          { key: 'responseTime', label: 'Typical Response Time', type: 'select', value: 'within-2-hours', options: ['Instant', 'Within 1 hour', 'Within 2 hours', 'Same day', 'Next business day'] },
          { key: 'bookingLink', label: 'Booking Link', type: 'url', value: '', placeholder: 'Calendly, Cal.com, etc.' },
        ]
      },
      services: {
        title: 'Services & Pricing',
        icon: '💼',
        fields: [
          { key: 'services', label: 'Services Offered', type: 'list', value: [
            { name: 'Business Strategy', price: '₹15,000/session', duration: '2 hours' },
            { name: 'Market Research', price: '₹50,000', duration: '2 weeks' },
          ]},
          { key: 'consultationFee', label: 'Initial Consultation', type: 'text', value: 'Free 30-min call' },
          { key: 'paymentMethods', label: 'Payment Methods', type: 'tags', value: ['UPI', 'Bank Transfer', 'Credit Card'] },
          { key: 'pricingNote', label: 'Pricing Note', type: 'text', value: 'Custom quotes for large projects' },
        ]
      },
      credentials: {
        title: 'Credentials',
        icon: '🏆',
        fields: [
          { key: 'experience', label: 'Years in Business', type: 'text', value: '4 years' },
          { key: 'certifications', label: 'Certifications', type: 'tags', value: ['ISO 9001', 'Google Partner'] },
          { key: 'clients', label: 'Notable Clients', type: 'tags', value: [] },
          { key: 'caseStudies', label: 'Case Studies', type: 'number', value: 0 },
        ]
      },
      knowledge: {
        title: 'FAQs & Policies',
        icon: '❓',
        fields: [
          { key: 'faqs', label: 'FAQs', type: 'faq', value: [
            { q: 'How do I get started?', a: 'Book a free consultation call and we\'ll discuss your needs.' },
          ]},
          { key: 'cancellation', label: 'Cancellation Policy', type: 'textarea', value: '24-hour notice required for cancellations.' },
          { key: 'refund', label: 'Refund Policy', type: 'textarea', value: '' },
          { key: 'nda', label: 'NDA Available', type: 'toggle', value: true },
        ]
      },
    },
    ecommerce: {
      identity: {
        title: 'Store Profile',
        icon: '🛒',
        fields: [
          { key: 'name', label: 'Store Name', type: 'text', value: '', required: true },
          { key: 'tagline', label: 'Tagline', type: 'text', value: '' },
          { key: 'description', label: 'About Your Store', type: 'textarea', value: '', required: true },
          { key: 'category', label: 'Primary Category', type: 'select', value: '', options: ['Fashion', 'Electronics', 'Home & Living', 'Beauty', 'Food', 'Other'] },
          { key: 'usps', label: 'Why Shop With Us', type: 'tags', value: [] },
        ]
      },
      contact: {
        title: 'Support & Contact',
        icon: '📞',
        fields: [
          { key: 'supportPhone', label: 'Support Phone', type: 'phone', value: '', required: true },
          { key: 'supportEmail', label: 'Support Email', type: 'email', value: '', required: true },
          { key: 'supportHours', label: 'Support Hours', type: 'text', value: '' },
          { key: 'whatsapp', label: 'WhatsApp Support', type: 'phone', value: '' },
          { key: 'social', label: 'Social Media', type: 'social', value: {} },
        ]
      },
      shipping: {
        title: 'Shipping & Delivery',
        icon: '🚚',
        fields: [
          { key: 'deliveryZones', label: 'Delivery Zones', type: 'tags', value: [], required: true },
          { key: 'deliveryTime', label: 'Delivery Time', type: 'text', value: '', placeholder: 'e.g., 3-5 business days' },
          { key: 'shippingCost', label: 'Shipping Cost', type: 'text', value: '' },
          { key: 'freeShippingMin', label: 'Free Shipping Above', type: 'text', value: '', placeholder: 'e.g., ₹499' },
          { key: 'expressAvailable', label: 'Express Delivery', type: 'toggle', value: false },
        ]
      },
      products: {
        title: 'Products & Catalog',
        icon: '📦',
        fields: [
          { key: 'categories', label: 'Product Categories', type: 'tags', value: [], required: true },
          { key: 'priceRange', label: 'Price Range', type: 'text', value: '' },
          { key: 'bestsellers', label: 'Bestsellers', type: 'tags', value: [] },
          { key: 'newArrivals', label: 'Highlight New Arrivals', type: 'toggle', value: true },
        ]
      },
      payments: {
        title: 'Payments & Offers',
        icon: '💳',
        fields: [
          { key: 'paymentMethods', label: 'Payment Methods', type: 'tags', value: ['UPI', 'Credit Card', 'Debit Card'] },
          { key: 'cod', label: 'Cash on Delivery', type: 'toggle', value: true },
          { key: 'codLimit', label: 'COD Limit', type: 'text', value: '', placeholder: 'e.g., Up to ₹5,000' },
          { key: 'emi', label: 'EMI Available', type: 'toggle', value: false },
          { key: 'currentOffers', label: 'Current Offers', type: 'tags', value: [] },
        ]
      },
      policies: {
        title: 'Policies',
        icon: '📋',
        fields: [
          { key: 'returnPolicy', label: 'Return Policy', type: 'textarea', value: '', required: true, aiSuggest: true },
          { key: 'returnWindow', label: 'Return Window', type: 'select', value: '7', options: ['7 days', '15 days', '30 days', 'No returns'] },
          { key: 'refundPolicy', label: 'Refund Policy', type: 'textarea', value: '' },
          { key: 'exchangePolicy', label: 'Exchange Policy', type: 'textarea', value: '' },
          { key: 'faqs', label: 'FAQs', type: 'faq', value: [] },
        ]
      },
    },
    realestate: {
      identity: {
        title: 'Agency Profile',
        icon: '🏠',
        fields: [
          { key: 'name', label: 'Agency/Agent Name', type: 'text', value: '', required: true },
          { key: 'reraNumber', label: 'RERA Registration', type: 'text', value: '', required: true },
          { key: 'description', label: 'About', type: 'textarea', value: '' },
          { key: 'experience', label: 'Years of Experience', type: 'text', value: '' },
          { key: 'specialization', label: 'Specialization', type: 'tags', value: [] },
        ]
      },
      contact: {
        title: 'Contact & Office',
        icon: '📍',
        fields: [
          { key: 'phone', label: 'Phone', type: 'phone', value: '', required: true },
          { key: 'whatsapp', label: 'WhatsApp', type: 'phone', value: '' },
          { key: 'email', label: 'Email', type: 'email', value: '', required: true },
          { key: 'officeAddress', label: 'Office Address', type: 'address', value: '' },
        ]
      },
      areas: {
        title: 'Operating Areas',
        icon: '🗺️',
        fields: [
          { key: 'cities', label: 'Cities Covered', type: 'tags', value: [], required: true },
          { key: 'localities', label: 'Key Localities', type: 'tags', value: [] },
          { key: 'projects', label: 'Featured Projects', type: 'tags', value: [] },
        ]
      },
      properties: {
        title: 'Property Types',
        icon: '🏘️',
        fields: [
          { key: 'types', label: 'Property Types', type: 'tags', value: ['Apartments', 'Villas', 'Plots'] },
          { key: 'segments', label: 'Segments', type: 'tags', value: ['Residential', 'Commercial'] },
          { key: 'priceRange', label: 'Price Range', type: 'text', value: '' },
          { key: 'virtualTours', label: 'Virtual Tours Available', type: 'toggle', value: false },
        ]
      },
      services: {
        title: 'Services & Fees',
        icon: '🤝',
        fields: [
          { key: 'services', label: 'Services', type: 'tags', value: ['Buying', 'Selling', 'Renting'] },
          { key: 'commission', label: 'Commission Structure', type: 'text', value: '' },
          { key: 'homeLoans', label: 'Home Loan Assistance', type: 'toggle', value: true },
          { key: 'legalHelp', label: 'Legal Documentation Help', type: 'toggle', value: true },
        ]
      },
      knowledge: {
        title: 'Buyer/Seller Info',
        icon: '❓',
        fields: [
          { key: 'buyingProcess', label: 'Buying Process', type: 'textarea', value: '' },
          { key: 'documents', label: 'Documents Required', type: 'tags', value: [] },
          { key: 'faqs', label: 'FAQs', type: 'faq', value: [] },
        ]
      },
    },
    healthcare: {
      identity: {
        title: 'Practice Profile',
        icon: '🏥',
        fields: [
          { key: 'name', label: 'Clinic/Practice Name', type: 'text', value: '', required: true },
          { key: 'type', label: 'Type', type: 'select', value: '', options: ['Clinic', 'Hospital', 'Diagnostic Center', 'Pharmacy', 'Wellness Center'] },
          { key: 'specialization', label: 'Specialization', type: 'tags', value: [], required: true },
          { key: 'description', label: 'About', type: 'textarea', value: '' },
        ]
      },
      contact: {
        title: 'Contact & Location',
        icon: '📍',
        fields: [
          { key: 'phone', label: 'Phone', type: 'phone', value: '', required: true },
          { key: 'emergency', label: 'Emergency Number', type: 'phone', value: '' },
          { key: 'email', label: 'Email', type: 'email', value: '' },
          { key: 'address', label: 'Address', type: 'address', value: '', required: true },
          { key: 'parking', label: 'Parking Available', type: 'toggle', value: false },
        ]
      },
      timing: {
        title: 'Consultation Hours',
        icon: '🕐',
        fields: [
          { key: 'opdTiming', label: 'OPD Timing', type: 'schedule', value: {} },
          { key: 'emergencyHours', label: 'Emergency Hours', type: 'text', value: '' },
          { key: 'appointmentRequired', label: 'Appointment Required', type: 'toggle', value: true },
          { key: 'walkIn', label: 'Walk-ins Accepted', type: 'toggle', value: false },
          { key: 'bookingLink', label: 'Online Booking', type: 'url', value: '' },
        ]
      },
      services: {
        title: 'Services & Fees',
        icon: '💊',
        fields: [
          { key: 'services', label: 'Services', type: 'tags', value: [] },
          { key: 'treatments', label: 'Treatments', type: 'tags', value: [] },
          { key: 'consultationFee', label: 'Consultation Fee', type: 'text', value: '', required: true },
          { key: 'followUpFee', label: 'Follow-up Fee', type: 'text', value: '' },
        ]
      },
      doctors: {
        title: 'Practitioners',
        icon: '👨‍⚕️',
        fields: [
          { key: 'doctors', label: 'Doctors/Practitioners', type: 'list', value: [] },
          { key: 'qualifications', label: 'Key Qualifications', type: 'tags', value: [] },
        ]
      },
      insurance: {
        title: 'Insurance & Payments',
        icon: '💳',
        fields: [
          { key: 'insuranceAccepted', label: 'Insurance Accepted', type: 'tags', value: [] },
          { key: 'tpa', label: 'TPA Tie-ups', type: 'tags', value: [] },
          { key: 'paymentMethods', label: 'Payment Methods', type: 'tags', value: ['Cash', 'UPI', 'Card'] },
          { key: 'faqs', label: 'Patient FAQs', type: 'faq', value: [] },
        ]
      },
    },
    food: {
      identity: {
        title: 'Restaurant Profile',
        icon: '🍕',
        fields: [
          { key: 'name', label: 'Restaurant Name', type: 'text', value: '', required: true },
          { key: 'cuisine', label: 'Cuisine Type', type: 'tags', value: [], required: true },
          { key: 'type', label: 'Type', type: 'select', value: '', options: ['Fine Dining', 'Casual Dining', 'QSR', 'Cafe', 'Cloud Kitchen', 'Food Truck'] },
          { key: 'description', label: 'About', type: 'textarea', value: '' },
          { key: 'ambiance', label: 'Ambiance', type: 'tags', value: [] },
        ]
      },
      contact: {
        title: 'Location & Reservations',
        icon: '📍',
        fields: [
          { key: 'phone', label: 'Phone', type: 'phone', value: '', required: true },
          { key: 'address', label: 'Address', type: 'address', value: '', required: true },
          { key: 'reservations', label: 'Reservations', type: 'toggle', value: false },
          { key: 'reservationLink', label: 'Reservation Link', type: 'url', value: '' },
          { key: 'seating', label: 'Seating Capacity', type: 'text', value: '' },
          { key: 'parking', label: 'Parking', type: 'toggle', value: false },
        ]
      },
      timing: {
        title: 'Operating Hours',
        icon: '🕐',
        fields: [
          { key: 'dineIn', label: 'Dine-in Hours', type: 'schedule', value: {} },
          { key: 'delivery', label: 'Delivery Hours', type: 'text', value: '' },
          { key: 'lastOrder', label: 'Last Order Time', type: 'text', value: '' },
          { key: 'happyHours', label: 'Happy Hours', type: 'text', value: '' },
        ]
      },
      menu: {
        title: 'Menu & Specialties',
        icon: '📜',
        fields: [
          { key: 'categories', label: 'Menu Categories', type: 'tags', value: [] },
          { key: 'specialties', label: 'Signature Dishes', type: 'tags', value: [] },
          { key: 'priceRange', label: 'Price Range (per person)', type: 'text', value: '' },
          { key: 'dietary', label: 'Dietary Options', type: 'tags', value: ['Vegetarian', 'Vegan', 'Jain'] },
          { key: 'alcohol', label: 'Serves Alcohol', type: 'toggle', value: false },
        ]
      },
      delivery: {
        title: 'Ordering & Delivery',
        icon: '🛵',
        fields: [
          { key: 'platforms', label: 'Order Platforms', type: 'tags', value: ['Zomato', 'Swiggy', 'Direct'] },
          { key: 'ownDelivery', label: 'Own Delivery', type: 'toggle', value: false },
          { key: 'deliveryRadius', label: 'Delivery Radius', type: 'text', value: '' },
          { key: 'minOrder', label: 'Minimum Order', type: 'text', value: '' },
          { key: 'deliveryFee', label: 'Delivery Fee', type: 'text', value: '' },
          { key: 'packaging', label: 'Eco-friendly Packaging', type: 'toggle', value: false },
        ]
      },
      more: {
        title: 'More Info',
        icon: '❓',
        fields: [
          { key: 'events', label: 'Events & Catering', type: 'toggle', value: false },
          { key: 'cateringMin', label: 'Catering Minimum', type: 'text', value: '' },
          { key: 'allergyInfo', label: 'Allergy Information Available', type: 'toggle', value: true },
          { key: 'faqs', label: 'FAQs', type: 'faq', value: [] },
        ]
      },
    },
    education: {
      identity: {
        title: 'Institute Profile',
        icon: '📚',
        fields: [
          { key: 'name', label: 'Institute Name', type: 'text', value: '', required: true },
          { key: 'type', label: 'Type', type: 'select', value: '', options: ['Coaching Center', 'Online Platform', 'Tutor', 'School', 'College', 'Training Institute'] },
          { key: 'subjects', label: 'Subjects/Skills', type: 'tags', value: [], required: true },
          { key: 'description', label: 'About', type: 'textarea', value: '' },
        ]
      },
      contact: {
        title: 'Contact & Campus',
        icon: '📍',
        fields: [
          { key: 'phone', label: 'Phone', type: 'phone', value: '', required: true },
          { key: 'whatsapp', label: 'WhatsApp', type: 'phone', value: '' },
          { key: 'email', label: 'Email', type: 'email', value: '' },
          { key: 'address', label: 'Address', type: 'address', value: '' },
          { key: 'online', label: 'Online Classes Available', type: 'toggle', value: false },
        ]
      },
      courses: {
        title: 'Courses & Fees',
        icon: '🎓',
        fields: [
          { key: 'courses', label: 'Courses Offered', type: 'list', value: [] },
          { key: 'boards', label: 'Boards/Exams', type: 'tags', value: [] },
          { key: 'ageGroups', label: 'Age Groups', type: 'tags', value: [] },
          { key: 'feeRange', label: 'Fee Range', type: 'text', value: '' },
          { key: 'demoClass', label: 'Demo Class Available', type: 'toggle', value: true },
        ]
      },
      schedule: {
        title: 'Batches & Timing',
        icon: '🕐',
        fields: [
          { key: 'batches', label: 'Batch Timings', type: 'tags', value: [] },
          { key: 'batchSize', label: 'Batch Size', type: 'text', value: '' },
          { key: 'flexibility', label: 'Flexible Timing', type: 'toggle', value: false },
          { key: 'weekend', label: 'Weekend Batches', type: 'toggle', value: false },
        ]
      },
      faculty: {
        title: 'Faculty & Methods',
        icon: '👨‍🏫',
        fields: [
          { key: 'faculty', label: 'Faculty Members', type: 'list', value: [] },
          { key: 'method', label: 'Teaching Method', type: 'tags', value: [] },
          { key: 'materials', label: 'Study Materials', type: 'toggle', value: true },
          { key: 'tests', label: 'Regular Tests', type: 'toggle', value: true },
        ]
      },
      admissions: {
        title: 'Admissions & Results',
        icon: '🏆',
        fields: [
          { key: 'admissionOpen', label: 'Admissions Open', type: 'toggle', value: true },
          { key: 'eligibility', label: 'Eligibility', type: 'text', value: '' },
          { key: 'results', label: 'Results/Placements', type: 'textarea', value: '' },
          { key: 'faqs', label: 'FAQs', type: 'faq', value: [] },
        ]
      },
    },
    financial: {
      identity: {
        title: 'Firm Profile',
        icon: '💰',
        fields: [
          { key: 'name', label: 'Firm Name', type: 'text', value: '', required: true },
          { key: 'type', label: 'Type', type: 'select', value: '', options: ['Financial Advisor', 'Insurance Agent', 'Loan Agent', 'CA/Tax Consultant', 'Wealth Manager'] },
          { key: 'registrations', label: 'Registrations', type: 'tags', value: [], required: true },
          { key: 'description', label: 'About', type: 'textarea', value: '' },
        ]
      },
      contact: {
        title: 'Contact & Office',
        icon: '📍',
        fields: [
          { key: 'phone', label: 'Phone', type: 'phone', value: '', required: true },
          { key: 'email', label: 'Email', type: 'email', value: '', required: true },
          { key: 'website', label: 'Website', type: 'url', value: '' },
          { key: 'office', label: 'Office Address', type: 'address', value: '' },
          { key: 'virtualMeetings', label: 'Virtual Meetings', type: 'toggle', value: true },
        ]
      },
      services: {
        title: 'Services & Products',
        icon: '📊',
        fields: [
          { key: 'services', label: 'Services', type: 'tags', value: [] },
          { key: 'products', label: 'Products Offered', type: 'tags', value: [] },
          { key: 'minInvestment', label: 'Minimum Investment', type: 'text', value: '' },
          { key: 'feeStructure', label: 'Fee Structure', type: 'textarea', value: '' },
        ]
      },
      credentials: {
        title: 'Credentials & Compliance',
        icon: '🏆',
        fields: [
          { key: 'certifications', label: 'Certifications', type: 'tags', value: [] },
          { key: 'experience', label: 'Years of Experience', type: 'text', value: '' },
          { key: 'aum', label: 'AUM (if applicable)', type: 'text', value: '' },
        ]
      },
      knowledge: {
        title: 'Disclosures & FAQs',
        icon: '❓',
        fields: [
          { key: 'riskDisclosure', label: 'Risk Disclosure', type: 'textarea', value: '' },
          { key: 'disclaimer', label: 'Disclaimer', type: 'textarea', value: '' },
          { key: 'faqs', label: 'FAQs', type: 'faq', value: [] },
        ]
      },
    },
    hospitality: {
      identity: {
        title: 'Property Profile',
        icon: '🏨',
        fields: [
          { key: 'name', label: 'Property Name', type: 'text', value: '', required: true },
          { key: 'type', label: 'Type', type: 'select', value: '', options: ['Hotel', 'Resort', 'Homestay', 'Villa', 'Service Apartment', 'Event Venue'] },
          { key: 'starRating', label: 'Star Rating', type: 'select', value: '', options: ['Budget', '3 Star', '4 Star', '5 Star', 'Luxury'] },
          { key: 'description', label: 'About', type: 'textarea', value: '' },
        ]
      },
      contact: {
        title: 'Contact & Location',
        icon: '📍',
        fields: [
          { key: 'phone', label: 'Phone', type: 'phone', value: '', required: true },
          { key: 'email', label: 'Email', type: 'email', value: '' },
          { key: 'address', label: 'Address', type: 'address', value: '', required: true },
          { key: 'nearbyAttractions', label: 'Nearby Attractions', type: 'tags', value: [] },
        ]
      },
      rooms: {
        title: 'Rooms & Rates',
        icon: '🛏️',
        fields: [
          { key: 'roomTypes', label: 'Room Types', type: 'tags', value: [] },
          { key: 'priceRange', label: 'Price Range', type: 'text', value: '' },
          { key: 'checkIn', label: 'Check-in Time', type: 'text', value: '' },
          { key: 'checkOut', label: 'Check-out Time', type: 'text', value: '' },
        ]
      },
      amenities: {
        title: 'Amenities & Services',
        icon: '🏊',
        fields: [
          { key: 'amenities', label: 'Amenities', type: 'tags', value: [] },
          { key: 'dining', label: 'Dining Options', type: 'tags', value: [] },
          { key: 'events', label: 'Event Spaces', type: 'toggle', value: false },
          { key: 'spa', label: 'Spa/Wellness', type: 'toggle', value: false },
        ]
      },
      policies: {
        title: 'Policies',
        icon: '📋',
        fields: [
          { key: 'cancellation', label: 'Cancellation Policy', type: 'textarea', value: '' },
          { key: 'pets', label: 'Pet Policy', type: 'text', value: '' },
          { key: 'children', label: 'Children Policy', type: 'text', value: '' },
          { key: 'faqs', label: 'FAQs', type: 'faq', value: [] },
        ]
      },
    },
  };

  const currentIndustry = industryData[businessType] || industryData.professional;
  const sections = Object.entries(currentIndustry);

  const team = [
    { id: 1, name: "Hariharan K", email: "hari@evenpath.com", role: "owner", status: "active", avatar: "H", lastActive: "Now" },
    { id: 2, name: "Priya Sharma", email: "priya@evenpath.com", role: "admin", status: "active", avatar: "P", lastActive: "2h ago" },
    { id: 3, name: "Rahul Menon", email: "rahul@evenpath.com", role: "member", status: "active", avatar: "R", lastActive: "1d ago" },
    { id: 4, name: "Anita Joshi", email: "anita@evenpath.com", role: "member", status: "invited", avatar: "A", lastActive: "Pending" },
  ];

  const aiSuggestions = [
    { id: 1, priority: 'critical', section: 'services', text: 'Add at least 3 services with pricing', impact: '+12%' },
    { id: 2, priority: 'high', section: 'credentials', text: 'Add certifications to build trust', impact: '+8%' },
    { id: 3, priority: 'high', section: 'knowledge', text: 'Add 5 FAQs for common questions', impact: '+10%' },
    { id: 4, priority: 'medium', section: 'identity', text: 'Add a compelling tagline', impact: '+3%' },
  ];

  const messagingTemplates = [
    { id: 1, name: 'Welcome Message', channel: 'whatsapp', status: 'active', lastEdited: '2 days ago' },
    { id: 2, name: 'Appointment Reminder', channel: 'whatsapp', status: 'active', lastEdited: '1 week ago' },
    { id: 3, name: 'Follow-up', channel: 'sms', status: 'draft', lastEdited: '3 days ago' },
    { id: 4, name: 'Payment Confirmation', channel: 'whatsapp', status: 'active', lastEdited: '5 days ago' },
  ];

  const integrations = [
    { id: 'whatsapp', name: 'WhatsApp Business', icon: '💬', status: 'connected', account: '+91 98765 43210' },
    { id: 'telegram', name: 'Telegram', icon: '✈️', status: 'not_connected', account: null },
    { id: 'sms', name: 'SMS (Twilio)', icon: '📱', status: 'connected', account: 'Evenpath' },
    { id: 'email', name: 'Email', icon: '✉️', status: 'connected', account: 'hello@evenpath.com' },
  ];

  const roleLabels = { owner: 'Owner', admin: 'Admin', member: 'Team Member' };
  const roleColors = { owner: 'bg-purple-100 text-purple-700', admin: 'bg-blue-100 text-blue-700', member: 'bg-slate-100 text-slate-600' };
  const priorityColors = { critical: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-blue-500', low: 'bg-slate-400' };

  const navItems = [
    { id: 'profile', label: 'Business Profile', icon: '🏢', desc: 'Your business data' },
    { id: 'team', label: 'Team', icon: '👥', desc: 'Members & access' },
    { id: 'account', label: 'Account', icon: '⚙️', desc: 'Personal & workspace' },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: '🔐', desc: 'Integrations & templates', badge: 'Admin' }] : []),
  ];

  const filteredTeam = teamFilter === 'all' ? team : team.filter(t => t.role === teamFilter);

  const getCompletionForSection = (sectionKey) => {
    const section = currentIndustry[sectionKey];
    if (!section) return 100;
    const filled = section.fields.filter(f => {
      if (Array.isArray(f.value)) return f.value.length > 0;
      if (typeof f.value === 'object') return Object.keys(f.value).length > 0;
      return f.value && f.value !== '';
    }).length;
    return Math.round((filled / section.fields.length) * 100);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
              E
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-sm">{workspace.name}</h1>
              <p className="text-xs text-slate-500">{user.plan} Plan</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all ${
                activeTab === item.id
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      activeTab === item.id ? 'bg-white/20' : 'bg-orange-100 text-orange-700'
                    }`}>{item.badge}</span>
                  )}
                </div>
                <span className={`text-xs ${activeTab === item.id ? 'text-slate-300' : 'text-slate-400'}`}>
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
                <span className="text-xs text-emerald-100">{aiSuggestions.length} suggestions</span>
                <span className="text-xs text-emerald-100">{showAICoach ? 'Hide' : 'Show'} Coach →</span>
              </div>
            </div>
          </div>
        )}

        {/* User */}
        <div className="p-3 border-t border-slate-100">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 bg-gradient-to-br from-slate-600 to-slate-800 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {user.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
              <p className="text-xs text-slate-500">{roleLabels[user.role]}</p>
            </div>
            <button className="text-slate-400 hover:text-slate-600">⚙️</button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64">
        <div className={`transition-all ${showAICoach && activeTab === 'profile' ? 'mr-80' : ''}`}>
          <div className="max-w-4xl mx-auto p-8">

            {/* ===== BUSINESS PROFILE TAB ===== */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Business Profile</h2>
                    <p className="text-slate-500">Data that powers your AI agents</p>
                  </div>
                  <button className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 flex items-center gap-2">
                    <span>Preview AI</span>
                    <span>→</span>
                  </button>
                </div>

                {/* Business Type Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-2xl">
                        {businessTypes.find(t => t.id === businessType)?.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {businessTypes.find(t => t.id === businessType)?.name}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {businessTypes.find(t => t.id === businessType)?.desc}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowOnboarding(true)}
                      className="text-sm text-indigo-600 font-medium hover:text-indigo-700"
                    >
                      Change type →
                    </button>
                  </div>

                  {/* Mini type selector */}
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {businessTypes.map(type => (
                      <button
                        key={type.id}
                        onClick={() => setBusinessType(type.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap transition-all ${
                          businessType === type.id
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <span>{type.icon}</span>
                        <span className="text-sm font-medium">{type.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sections */}
                <div className="space-y-3">
                  {sections.map(([key, section]) => {
                    const isExpanded = expandedSection === key;
                    const completion = getCompletionForSection(key);
                    const hasCritical = aiSuggestions.some(s => s.section === key && s.priority === 'critical');

                    return (
                      <div
                        key={key}
                        className={`bg-white rounded-2xl border-2 transition-all ${
                          isExpanded ? 'border-slate-300 shadow-sm' : hasCritical ? 'border-red-200' : 'border-slate-200'
                        }`}
                      >
                        <button
                          onClick={() => setExpandedSection(isExpanded ? null : key)}
                          className="w-full px-5 py-4 flex items-center gap-4 text-left"
                        >
                          <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center text-xl">
                            {section.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900">{section.title}</span>
                              {hasCritical && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${completion === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                  style={{ width: `${completion}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-400">{completion}%</span>
                            </div>
                          </div>
                          <span className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                            ▼
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="px-5 pb-5 border-t border-slate-100">
                            <div className="pt-5 grid grid-cols-2 gap-4">
                              {section.fields.map(field => (
                                <div
                                  key={field.key}
                                  className={`${field.type === 'textarea' || field.type === 'faq' || field.type === 'list' || field.type === 'schedule' ? 'col-span-2' : ''}`}
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

                                  {field.type === 'text' || field.type === 'phone' || field.type === 'email' || field.type === 'url' || field.type === 'number' ? (
                                    <input
                                      type={field.type === 'phone' ? 'tel' : field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}
                                      defaultValue={field.value}
                                      placeholder={field.placeholder || ''}
                                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
                                  ) : field.type === 'textarea' ? (
                                    <textarea
                                      defaultValue={field.value}
                                      placeholder={field.placeholder || ''}
                                      rows={3}
                                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                    />
                                  ) : field.type === 'select' ? (
                                    <select
                                      defaultValue={field.value}
                                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                                    >
                                      <option value="">Select...</option>
                                      {field.options?.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                      ))}
                                    </select>
                                  ) : field.type === 'tags' ? (
                                    <div className="flex flex-wrap gap-2 p-2 border border-slate-200 rounded-xl min-h-[42px]">
                                      {(field.value || []).map(tag => (
                                        <span key={tag} className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm flex items-center gap-1">
                                          {tag}
                                          <button className="text-slate-400 hover:text-slate-600">×</button>
                                        </span>
                                      ))}
                                      <input
                                        type="text"
                                        placeholder="Add..."
                                        className="flex-1 min-w-[80px] outline-none text-sm"
                                      />
                                    </div>
                                  ) : field.type === 'toggle' ? (
                                    <div className="flex items-center gap-3">
                                      <button className={`w-11 h-6 rounded-full transition-colors ${field.value ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                                        <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${field.value ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                      </button>
                                      <span className="text-sm text-slate-600">{field.value ? 'Yes' : 'No'}</span>
                                    </div>
                                  ) : field.type === 'faq' ? (
                                    <div className="space-y-2">
                                      {(field.value || []).map((faq, i) => (
                                        <div key={i} className="p-3 bg-slate-50 rounded-xl">
                                          <p className="font-medium text-sm text-slate-900">Q: {faq.q}</p>
                                          <p className="text-sm text-slate-600 mt-1">A: {faq.a}</p>
                                        </div>
                                      ))}
                                      <button className="w-full p-3 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-500 hover:border-slate-300 hover:text-slate-600">
                                        + Add FAQ
                                      </button>
                                    </div>
                                  ) : field.type === 'list' ? (
                                    <div className="space-y-2">
                                      {(field.value || []).map((item, i) => (
                                        <div key={i} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                                          <div>
                                            <p className="font-medium text-sm text-slate-900">{item.name}</p>
                                            <p className="text-xs text-slate-500">{item.price} {item.duration && `• ${item.duration}`}</p>
                                          </div>
                                          <button className="text-slate-400 hover:text-slate-600">✎</button>
                                        </div>
                                      ))}
                                      <button className="w-full p-3 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-500 hover:border-slate-300">
                                        + Add {field.label.replace('s Offered', '').replace('s', '')}
                                      </button>
                                    </div>
                                  ) : field.type === 'address' ? (
                                    <input
                                      type="text"
                                      defaultValue={field.value}
                                      placeholder="Enter address..."
                                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                  ) : field.type === 'schedule' ? (
                                    <div className="grid grid-cols-7 gap-2">
                                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                        <div key={day} className="text-center">
                                          <div className="text-xs font-medium text-slate-500 mb-1">{day}</div>
                                          <input
                                            type="text"
                                            defaultValue={field.value?.[day.toLowerCase()] || ''}
                                            placeholder="Off"
                                            className="w-full px-1 py-1.5 border border-slate-200 rounded-lg text-xs text-center focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  ) : null}
                                </div>
                              ))}
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
                  <button className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800">
                    + Invite Member
                  </button>
                </div>

                {/* Filters */}
                <div className="flex gap-2">
                  {[
                    { id: 'all', label: 'All', count: team.length },
                    { id: 'owner', label: 'Owners', count: team.filter(t => t.role === 'owner').length },
                    { id: 'admin', label: 'Admins', count: team.filter(t => t.role === 'admin').length },
                    { id: 'member', label: 'Members', count: team.filter(t => t.role === 'member').length },
                  ].map(filter => (
                    <button
                      key={filter.id}
                      onClick={() => setTeamFilter(filter.id)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        teamFilter === filter.id
                          ? 'bg-slate-900 text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {filter.label}
                      <span className={`ml-1.5 ${teamFilter === filter.id ? 'text-slate-300' : 'text-slate-400'}`}>
                        {filter.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Team List */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  {filteredTeam.map((member, i) => (
                    <div
                      key={member.id}
                      className={`px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors ${
                        i !== filteredTeam.length - 1 ? 'border-b border-slate-100' : ''
                      }`}
                    >
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-medium ${
                        member.status === 'active' ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-slate-300'
                      }`}>
                        {member.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">{member.name}</span>
                          {member.status === 'invited' && (
                            <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">Pending</span>
                          )}
                        </div>
                        <div className="text-sm text-slate-500">{member.email}</div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${roleColors[member.role]}`}>
                          {roleLabels[member.role]}
                        </span>
                        <div className="text-xs text-slate-400 mt-1">{member.lastActive}</div>
                      </div>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                        •••
                      </button>
                    </div>
                  ))}
                </div>

                {/* Roles Explanation */}
                <div className="bg-slate-50 rounded-2xl p-5">
                  <h3 className="font-semibold text-slate-900 mb-3">Role Permissions</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors.owner}`}>Owner</span>
                      </div>
                      <ul className="text-xs text-slate-600 space-y-1">
                        <li>✓ Full access</li>
                        <li>✓ Billing & subscription</li>
                        <li>✓ Delete workspace</li>
                      </ul>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors.admin}`}>Admin</span>
                      </div>
                      <ul className="text-xs text-slate-600 space-y-1">
                        <li>✓ Manage team</li>
                        <li>✓ Edit all settings</li>
                        <li>✓ View analytics</li>
                      </ul>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors.member}`}>Member</span>
                      </div>
                      <ul className="text-xs text-slate-600 space-y-1">
                        <li>✓ View conversations</li>
                        <li>✓ Reply to messages</li>
                        <li>✓ Basic settings</li>
                      </ul>
                    </div>
                  </div>
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
                  <div className="flex gap-6">
                    <div className="relative">
                      <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl font-bold text-white">
                        {user.avatar}
                      </div>
                      <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-sm shadow-sm hover:bg-slate-50">
                        ✎
                      </button>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-slate-500 font-medium">Full Name</label>
                        <input type="text" defaultValue={user.name} className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 font-medium">Email</label>
                        <input type="email" defaultValue={user.email} className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 font-medium">Phone</label>
                        <input type="tel" defaultValue={user.phone} className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 font-medium">Role</label>
                        <div className="mt-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600">
                          {roleLabels[user.role]} (cannot change)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Workspace */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">Workspace</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-500 font-medium">Workspace Name</label>
                      <input type="text" defaultValue={workspace.name} className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 font-medium">Workspace ID</label>
                      <div className="mt-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-500">
                        {workspace.id}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 font-medium">Region</label>
                      <select defaultValue={workspace.region} className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white">
                        <option>India</option>
                        <option>United States</option>
                        <option>Europe</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 font-medium">Timezone</label>
                      <select defaultValue={workspace.timezone} className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white">
                        <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                        <option value="America/New_York">America/New_York (EST)</option>
                        <option value="Europe/London">Europe/London (GMT)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 font-medium">Default Currency</label>
                      <select defaultValue={workspace.currency} className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white">
                        <option value="INR">🇮🇳 INR (₹)</option>
                        <option value="USD">🇺🇸 USD ($)</option>
                        <option value="EUR">🇪🇺 EUR (€)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 font-medium">Primary Language</label>
                      <select className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white">
                        <option>English</option>
                        <option>Hindi</option>
                        <option>Tamil</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Subscription */}
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg">Pro Plan</h3>
                        <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">Active</span>
                      </div>
                      <p className="text-indigo-100 text-sm">Unlimited messages • 10 team members • Priority support</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">₹2,999</div>
                      <div className="text-xs text-indigo-200">/month</div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
                    <div className="text-sm text-indigo-100">
                      Next billing: Feb 15, 2025
                    </div>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium">
                        View Invoices
                      </button>
                      <button className="px-4 py-2 bg-white text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-50">
                        Manage Plan
                      </button>
                    </div>
                  </div>
                </div>

                {/* Security */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">Security</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b border-slate-100">
                      <div>
                        <p className="font-medium text-slate-900">Password</p>
                        <p className="text-sm text-slate-500">Last changed 45 days ago</p>
                      </div>
                      <button className="text-indigo-600 font-medium text-sm hover:text-indigo-700">Change</button>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-slate-100">
                      <div>
                        <p className="font-medium text-slate-900">Two-Factor Authentication</p>
                        <p className="text-sm text-slate-500">Add extra security to your account</p>
                      </div>
                      <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200">
                        Enable
                      </button>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium text-slate-900">Active Sessions</p>
                        <p className="text-sm text-slate-500">2 devices currently logged in</p>
                      </div>
                      <button className="text-indigo-600 font-medium text-sm hover:text-indigo-700">Manage</button>
                    </div>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-white rounded-2xl border-2 border-red-200 p-6">
                  <h3 className="font-semibold text-red-600 mb-2">Danger Zone</h3>
                  <p className="text-sm text-slate-500 mb-4">Irreversible and destructive actions</p>
                  <div className="flex gap-3">
                    <button className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50">
                      Export All Data
                    </button>
                    <button className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50">
                      Delete Workspace
                    </button>
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
                    <button className="text-sm text-indigo-600 font-medium">+ Add Integration</button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {integrations.map(integration => (
                      <div
                        key={integration.id}
                        className={`p-4 rounded-xl border-2 ${
                          integration.status === 'connected' ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{integration.icon}</span>
                            <span className="font-medium text-slate-900">{integration.name}</span>
                          </div>
                          {integration.status === 'connected' ? (
                            <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">Connected</span>
                          ) : (
                            <button className="text-xs px-2 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                              Connect
                            </button>
                          )}
                        </div>
                        {integration.account && (
                          <p className="text-sm text-slate-500">{integration.account}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Message Templates */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="font-semibold text-slate-900">Message Templates</h3>
                      <p className="text-sm text-slate-500">Pre-approved templates for WhatsApp & SMS</p>
                    </div>
                    <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800">
                      + Create Template
                    </button>
                  </div>
                  <div className="space-y-3">
                    {messagingTemplates.map(template => (
                      <div
                        key={template.id}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{template.channel === 'whatsapp' ? '💬' : '📱'}</span>
                          <div>
                            <p className="font-medium text-slate-900">{template.name}</p>
                            <p className="text-xs text-slate-500">
                              {template.channel.toUpperCase()} • Edited {template.lastEdited}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            template.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {template.status}
                          </span>
                          <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg">
                            ✎
                          </button>
                        </div>
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
                        <p className="font-medium text-slate-900">Auto-respond to messages</p>
                        <p className="text-sm text-slate-500">AI will automatically reply to incoming messages</p>
                      </div>
                      <button className="w-11 h-6 bg-emerald-500 rounded-full">
                        <div className="w-5 h-5 bg-white rounded-full shadow translate-x-5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-slate-100">
                      <div>
                        <p className="font-medium text-slate-900">Human handoff threshold</p>
                        <p className="text-sm text-slate-500">When AI is unsure, escalate to human</p>
                      </div>
                      <select className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white">
                        <option>Low confidence</option>
                        <option>Medium confidence</option>
                        <option>High confidence</option>
                        <option>Never</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium text-slate-900">Response delay</p>
                        <p className="text-sm text-slate-500">Add human-like delay to responses</p>
                      </div>
                      <select className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white">
                        <option>Instant</option>
                        <option>1-3 seconds</option>
                        <option>3-5 seconds</option>
                        <option>5-10 seconds</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* API & Webhooks */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">API & Webhooks</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-slate-500 font-medium">API Key</label>
                      <div className="mt-1 flex gap-2">
                        <input
                          type="password"
                          value="sk_live_xxxxxxxxxxxxxxxx"
                          readOnly
                          className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
                        />
                        <button className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200">
                          Copy
                        </button>
                        <button className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200">
                          Regenerate
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 font-medium">Webhook URL</label>
                      <div className="mt-1 flex gap-2">
                        <input
                          type="url"
                          placeholder="https://your-server.com/webhook"
                          className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm"
                        />
                        <button className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Profile Coach Panel */}
        {showAICoach && activeTab === 'profile' && (
          <div className="w-80 bg-white border-l border-slate-200 fixed right-0 top-0 bottom-0 flex flex-col">
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
                <p className="text-xs text-slate-400 mt-2">+28% to unlock full AI potential</p>
              </div>

              {/* Suggestions */}
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Priority Actions</h4>
                <div className="space-y-2">
                  {aiSuggestions.map(suggestion => (
                    <div
                      key={suggestion.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 hover:border-slate-300 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <div className={`w-2 h-2 rounded-full mt-1.5 ${priorityColors[suggestion.priority]}`} />
                        <div className="flex-1">
                          <p className="text-sm text-slate-700">{suggestion.text}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-emerald-600 font-medium">{suggestion.impact}</span>
                            <button className="text-xs text-indigo-600 font-medium hover:text-indigo-700">
                              Fix →
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Tips */}
              <div className="bg-indigo-50 rounded-xl p-4">
                <h4 className="font-medium text-indigo-900 text-sm mb-2">💡 Pro Tip</h4>
                <p className="text-xs text-indigo-700">
                  For {businessTypes.find(t => t.id === businessType)?.name}, customers most often ask about pricing and availability. Make sure these are complete!
                </p>
              </div>
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-slate-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ask me to update anything..."
                  className="flex-1 px-3 py-2.5 bg-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button className="px-3 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700">
                  ➤
                </button>
              </div>
              <div className="flex gap-2 mt-2">
                <button className="px-2 py-1 bg-slate-100 rounded-lg text-xs text-slate-600 hover:bg-slate-200">
                  Add FAQ
                </button>
                <button className="px-2 py-1 bg-slate-100 rounded-lg text-xs text-slate-600 hover:bg-slate-200">
                  Add service
                </button>
                <button className="px-2 py-1 bg-slate-100 rounded-lg text-xs text-slate-600 hover:bg-slate-200">
                  Fix all
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Business Type Onboarding Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">What type of business are you?</h2>
              <p className="text-slate-500 mt-1">This customizes your profile fields and AI suggestions</p>
            </div>
            <div className="p-6 grid grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto">
              {businessTypes.map(type => (
                <button
                  key={type.id}
                  onClick={() => {
                    setBusinessType(type.id);
                    setShowOnboarding(false);
                  }}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    businessType === type.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-2xl mb-2">{type.icon}</div>
                  <h3 className="font-semibold text-slate-900">{type.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{type.desc}</p>
                </button>
              ))}
            </div>
            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => setShowOnboarding(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowOnboarding(false)}
                className="px-6 py-2 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsUltimate;
