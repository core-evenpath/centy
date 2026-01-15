/**
 * Industry-Specific Expertise Configurations
 * 
 * This file contains the expertise section configurations for all 15 industries
 */

import type { IndustryExpertiseConfig } from './business-profile-ui-schema';

// ============================================
// RETAIL EXPERTISE
// ============================================
export const RETAIL_EXPERTISE: IndustryExpertiseConfig = {
    industryId: 'retail',
    industryName: 'Retail',
    subSections: [
        {
            id: 'store-info',
            title: 'Store Information',
            icon: '🏪',
            // REMOVED: storeType dropdown - now driven by category selection
            fields: [
                { key: 'productCategories', label: 'Product Categories', type: 'tags', placeholder: 'e.g., Electronics, Fashion, Home Decor', schemaPath: 'industrySpecificData.productCategories', gridSpan: 2 },
                { key: 'brands', label: 'Brands Available', type: 'tags', placeholder: 'Add brands you carry...', schemaPath: 'industrySpecificData.brands', gridSpan: 2 },
                { key: 'storeSize', label: 'Store Size (sq ft)', type: 'number', placeholder: 'e.g., 2000', schemaPath: 'industrySpecificData.storeSize' },
            ],
        },
        {
            id: 'shopping-experience',
            title: 'Shopping Experience',
            icon: '🛒',
            fields: [
                {
                    key: 'paymentModes', label: 'Payment Modes', type: 'checkbox-group', options: [
                        { value: 'cash', label: 'Cash' },
                        { value: 'card', label: 'Credit/Debit Card' },
                        { value: 'upi', label: 'UPI' },
                        { value: 'bnpl', label: 'Buy Now Pay Later' },
                        { value: 'emi', label: 'EMI Available' },
                    ], schemaPath: 'industrySpecificData.paymentModes', gridSpan: 2
                },
                { key: 'trialAvailable', label: 'Trial/Demo Available', type: 'toggle', schemaPath: 'industrySpecificData.trialAvailable' },
                { key: 'giftWrapping', label: 'Gift Wrapping', type: 'toggle', schemaPath: 'industrySpecificData.giftWrapping' },
                { key: 'loyaltyProgram', label: 'Loyalty Program', type: 'toggle', schemaPath: 'industrySpecificData.loyaltyProgram' },
            ],
        },
        {
            id: 'delivery-returns',
            title: 'Delivery & Returns',
            icon: '📦',
            fields: [
                { key: 'homeDelivery', label: 'Home Delivery', type: 'toggle', schemaPath: 'industrySpecificData.homeDelivery' },
                { key: 'freeDeliveryAbove', label: 'Free Delivery Above', type: 'currency', placeholder: 'e.g., 500', schemaPath: 'industrySpecificData.freeDeliveryAbove', showCondition: { field: 'homeDelivery', operator: 'equals', value: true } },
                {
                    key: 'returnPolicy', label: 'Return Policy', type: 'select', options: [
                        { value: 'no_returns', label: 'No Returns' },
                        { value: '7_days', label: '7 Days Return' },
                        { value: '15_days', label: '15 Days Return' },
                        { value: '30_days', label: '30 Days Return' },
                        { value: 'exchange_only', label: 'Exchange Only' },
                    ], schemaPath: 'industrySpecificData.returnPolicy'
                },
                { key: 'warrantyOffered', label: 'Warranty Offered', type: 'toggle', schemaPath: 'industrySpecificData.warrantyOffered' },
            ],
        },
    ],
};

// ============================================
// HEALTHCARE EXPERTISE
// ============================================
export const HEALTHCARE_EXPERTISE: IndustryExpertiseConfig = {
    industryId: 'healthcare',
    industryName: 'Healthcare',
    subSections: [
        {
            id: 'practice-info',
            title: 'Practice Information',
            icon: '🏥',
            // REMOVED: facilityType dropdown - now driven by category selection
            fields: [
                { key: 'specializations', label: 'Specializations', type: 'tags', placeholder: 'e.g., Cardiology, Pediatrics, Orthopedics', schemaPath: 'industrySpecificData.specializations', gridSpan: 2 },
                { key: 'doctors', label: 'Number of Doctors', type: 'number', placeholder: 'e.g., 5', schemaPath: 'industrySpecificData.doctorCount' },
                { key: 'bedCount', label: 'Bed Capacity', type: 'number', placeholder: 'e.g., 50', schemaPath: 'industrySpecificData.bedCount' },
            ],
        },
        {
            id: 'appointments',
            title: 'Appointments & Booking',
            icon: '📅',
            fields: [
                { key: 'appointmentRequired', label: 'Appointment Required', type: 'toggle', schemaPath: 'industrySpecificData.appointmentRequired' },
                { key: 'walkInsAccepted', label: 'Walk-ins Accepted', type: 'toggle', schemaPath: 'industrySpecificData.walkInsAccepted' },
                { key: 'onlineBooking', label: 'Online Booking Available', type: 'toggle', schemaPath: 'industrySpecificData.onlineBooking' },
                { key: 'teleconsultation', label: 'Teleconsultation Available', type: 'toggle', schemaPath: 'industrySpecificData.teleconsultation' },
                { key: 'emergencyServices', label: '24/7 Emergency Services', type: 'toggle', schemaPath: 'industrySpecificData.emergencyServices' },
                { key: 'homeVisits', label: 'Home Visits Available', type: 'toggle', schemaPath: 'industrySpecificData.homeVisits' },
            ],
        },
        {
            id: 'insurance-pricing',
            title: 'Insurance & Pricing',
            icon: '💳',
            fields: [
                { key: 'insuranceAccepted', label: 'Insurance Accepted', type: 'toggle', schemaPath: 'industrySpecificData.insuranceAccepted' },
                { key: 'insuranceProviders', label: 'Insurance Providers', type: 'tags', placeholder: 'e.g., Star Health, ICICI Lombard', schemaPath: 'industrySpecificData.insuranceProviders', showCondition: { field: 'insuranceAccepted', operator: 'equals', value: true }, gridSpan: 2 },
                { key: 'consultationFee', label: 'Consultation Fee', type: 'currency', placeholder: 'e.g., 500', schemaPath: 'industrySpecificData.consultationFee' },
                { key: 'paymentPlans', label: 'EMI/Payment Plans', type: 'toggle', schemaPath: 'industrySpecificData.paymentPlans' },
            ],
        },
    ],
};

// ============================================
// EDUCATION EXPERTISE
// ============================================
export const EDUCATION_EXPERTISE: IndustryExpertiseConfig = {
    industryId: 'education',
    industryName: 'Education',
    subSections: [
        {
            // RENAMED: Removed institutionType dropdown - now driven by category selection
            id: 'courses-info',
            title: 'Courses & Programs',
            icon: '🎓',
            fields: [
                { key: 'subjects', label: 'Subjects/Courses Offered', type: 'tags', placeholder: 'e.g., Mathematics, Science, Programming', schemaPath: 'industrySpecificData.subjects', gridSpan: 2 },
                { key: 'boards', label: 'Boards/Affiliations', type: 'tags', placeholder: 'e.g., CBSE, ICSE, State Board', schemaPath: 'industrySpecificData.boards', gridSpan: 2 },
                { key: 'ageGroups', label: 'Age Groups Served', type: 'tags', placeholder: 'e.g., 5-10 years, College students', schemaPath: 'industrySpecificData.ageGroups' },
            ],
        },
        {
            id: 'learning-mode',
            title: 'Learning Mode',
            icon: '💻',
            showForFunctions: ['tutoring', 'coaching_center', 'school', 'vocational_training'],

            fields: [
                {
                    key: 'deliveryMode', label: 'Delivery Mode', type: 'checkbox-group', options: [
                        { value: 'in_person', label: 'In-Person Classes' },
                        { value: 'online_live', label: 'Live Online Classes' },
                        { value: 'recorded', label: 'Pre-Recorded Videos' },
                        { value: 'hybrid', label: 'Hybrid (Both)' },
                    ], schemaPath: 'industrySpecificData.deliveryMode', gridSpan: 2
                },
                { key: 'batchSize', label: 'Typical Batch Size', type: 'text', placeholder: 'e.g., 15-20 students', schemaPath: 'industrySpecificData.batchSize' },
                { key: 'personalAttention', label: 'One-on-One Available', type: 'toggle', schemaPath: 'industrySpecificData.personalAttention' },
                { key: 'studyMaterials', label: 'Study Materials Provided', type: 'toggle', schemaPath: 'industrySpecificData.studyMaterials' },
            ],
        },
        {
            id: 'fees-admission',
            title: 'Fees & Admission',
            icon: '📝',
            fields: [
                { key: 'feeRange', label: 'Fee Range', type: 'text', placeholder: 'e.g., ₹5,000 - ₹15,000 per month', schemaPath: 'industrySpecificData.feeRange' },
                { key: 'democlassAvailable', label: 'Demo/Trial Class', type: 'toggle', schemaPath: 'industrySpecificData.demoClassAvailable' },
                { key: 'installmentPayment', label: 'Installment Payment', type: 'toggle', schemaPath: 'industrySpecificData.installmentPayment' },
                { key: 'admissionProcess', label: 'Admission Process', type: 'textarea', placeholder: 'Describe your admission process...', schemaPath: 'industrySpecificData.admissionProcess', gridSpan: 2 },
            ],
        },
    ],
};

// ============================================
// HOSPITALITY EXPERTISE
// ============================================
export const HOSPITALITY_EXPERTISE: IndustryExpertiseConfig = {
    industryId: 'hospitality',
    industryName: 'Hospitality',
    subSections: [
        {
            id: 'property-info',
            title: 'Property Information',
            icon: '🏨',
            // REMOVED: propertyType dropdown - now driven by category selection
            fields: [
                {
                    key: 'starRating', label: 'Star Rating', type: 'select', options: [
                        { value: '1', label: '1 Star' },
                        { value: '2', label: '2 Stars' },
                        { value: '3', label: '3 Stars' },
                        { value: '4', label: '4 Stars' },
                        { value: '5', label: '5 Stars' },
                        { value: 'unrated', label: 'Unrated' },
                    ], schemaPath: 'industrySpecificData.starRating'
                },
                { key: 'totalRooms', label: 'Total Rooms', type: 'number', placeholder: 'e.g., 50', schemaPath: 'industrySpecificData.totalRooms' },
                { key: 'roomTypes', label: 'Room Types', type: 'tags', placeholder: 'e.g., Deluxe, Suite, Family Room', schemaPath: 'industrySpecificData.roomTypes', gridSpan: 2 },
            ],
        },
        {
            id: 'amenities',
            title: 'Amenities & Facilities',
            icon: '🏊',
            fields: [
                {
                    key: 'amenities', label: 'Amenities', type: 'checkbox-group', options: [
                        { value: 'wifi', label: 'Free WiFi' },
                        { value: 'parking', label: 'Parking' },
                        { value: 'pool', label: 'Swimming Pool' },
                        { value: 'gym', label: 'Gym/Fitness Center' },
                        { value: 'spa', label: 'Spa' },
                        { value: 'restaurant', label: 'In-house Restaurant' },
                        { value: 'bar', label: 'Bar' },
                        { value: 'room_service', label: '24/7 Room Service' },
                        { value: 'laundry', label: 'Laundry Service' },
                        { value: 'airport_transfer', label: 'Airport Transfer' },
                    ], schemaPath: 'industrySpecificData.amenities', gridSpan: 2
                },
                { key: 'petFriendly', label: 'Pet Friendly', type: 'toggle', schemaPath: 'industrySpecificData.petFriendly' },
                { key: 'wheelchairAccessible', label: 'Wheelchair Accessible', type: 'toggle', schemaPath: 'industrySpecificData.wheelchairAccessible' },
            ],
        },
        {
            id: 'booking-policies',
            title: 'Booking & Policies',
            icon: '📋',
            fields: [
                { key: 'checkInTime', label: 'Check-in Time', type: 'text', placeholder: 'e.g., 2:00 PM', schemaPath: 'industrySpecificData.checkInTime' },
                { key: 'checkOutTime', label: 'Check-out Time', type: 'text', placeholder: 'e.g., 11:00 AM', schemaPath: 'industrySpecificData.checkOutTime' },
                { key: 'cancellationPolicy', label: 'Cancellation Policy', type: 'textarea', placeholder: 'Describe your cancellation policy...', schemaPath: 'industrySpecificData.cancellationPolicy', gridSpan: 2 },
                { key: 'priceRange', label: 'Price Range (per night)', type: 'text', placeholder: 'e.g., ₹3,000 - ₹15,000', schemaPath: 'industrySpecificData.priceRange' },
            ],
        },
    ],
};

// ============================================
// REAL ESTATE EXPERTISE
// ============================================
export const REAL_ESTATE_EXPERTISE: IndustryExpertiseConfig = {
    industryId: 'real_estate',
    industryName: 'Real Estate',
    subSections: [
        {
            id: 'property-scope',
            title: 'Property Scope',
            icon: '🏗️',
            // REMOVED: businessType dropdown - now driven by category selection
            fields: [
                {
                    key: 'propertyTypes', label: 'Property Types', type: 'checkbox-group', options: [
                        { value: 'residential', label: 'Residential' },
                        { value: 'commercial', label: 'Commercial' },
                        { value: 'industrial', label: 'Industrial' },
                        { value: 'land', label: 'Land/Plots' },
                    ], schemaPath: 'industrySpecificData.propertyTypes', gridSpan: 2
                },
                {
                    key: 'transactionTypes', label: 'Transaction Types', type: 'checkbox-group', options: [
                        { value: 'sale', label: 'Sale' },
                        { value: 'rent', label: 'Rent/Lease' },
                        { value: 'pg', label: 'PG/Co-living' },
                    ], schemaPath: 'industrySpecificData.transactionTypes'
                },
            ],
        },
        {
            id: 'coverage',
            title: 'Coverage & Expertise',
            icon: '📍',
            fields: [
                { key: 'operatingAreas', label: 'Operating Areas', type: 'tags', placeholder: 'e.g., Whitefield, Koramangala, HSR Layout', schemaPath: 'industrySpecificData.operatingAreas', gridSpan: 2 },
                {
                    key: 'priceSegment', label: 'Price Segment', type: 'checkbox-group', options: [
                        { value: 'budget', label: 'Budget (< ₹50L)' },
                        { value: 'mid_range', label: 'Mid Range (₹50L - 1Cr)' },
                        { value: 'premium', label: 'Premium (₹1Cr - 3Cr)' },
                        { value: 'luxury', label: 'Luxury (> ₹3Cr)' },
                    ], schemaPath: 'industrySpecificData.priceSegment', gridSpan: 2
                },
                { key: 'reraRegistered', label: 'RERA Registered', type: 'toggle', schemaPath: 'industrySpecificData.reraRegistered' },
                { key: 'reraNumber', label: 'RERA Number', type: 'text', placeholder: 'e.g., PRGO02191819', schemaPath: 'industrySpecificData.reraNumber', showCondition: { field: 'reraRegistered', operator: 'equals', value: true } },
            ],
        },
        {
            id: 'services',
            title: 'Services Offered',
            icon: '🔧',
            fields: [
                {
                    key: 'services', label: 'Services', type: 'checkbox-group', options: [
                        { value: 'site_visits', label: 'Site Visits' },
                        { value: 'legal_assistance', label: 'Legal Assistance' },
                        { value: 'loan_assistance', label: 'Home Loan Assistance' },
                        { value: 'vastu_consultation', label: 'Vastu Consultation' },
                        { value: 'interior_design', label: 'Interior Design' },
                        { value: 'property_valuation', label: 'Property Valuation' },
                    ], schemaPath: 'industrySpecificData.services', gridSpan: 2
                },
                { key: 'virtualTours', label: 'Virtual Tours Available', type: 'toggle', schemaPath: 'industrySpecificData.virtualTours' },
            ],
        },
    ],
};

// ============================================
// SERVICES EXPERTISE (Professional Services)
// ============================================
export const SERVICES_EXPERTISE: IndustryExpertiseConfig = {
    industryId: 'services',
    industryName: 'Professional Services',
    subSections: [
        {
            // RENAMED: Removed serviceType dropdown - now driven by category selection
            id: 'services-info',
            title: 'Service Information',
            icon: '💼',
            fields: [
                { key: 'servicesOffered', label: 'Services Offered', type: 'tags', placeholder: 'e.g., Tax Filing, Company Registration, GST', schemaPath: 'industrySpecificData.servicesOffered', gridSpan: 2 },
                { key: 'industries', label: 'Industries Served', type: 'tags', placeholder: 'e.g., Startups, Healthcare, E-commerce', schemaPath: 'industrySpecificData.industriesServed', gridSpan: 2 },
            ],
        },
        {
            id: 'engagement',
            title: 'Engagement Model',
            icon: '🤝',
            fields: [
                {
                    key: 'engagementTypes', label: 'Engagement Types', type: 'checkbox-group', options: [
                        { value: 'project', label: 'Project-based' },
                        { value: 'retainer', label: 'Retainer/Monthly' },
                        { value: 'hourly', label: 'Hourly' },
                        { value: 'fixed_price', label: 'Fixed Price' },
                    ], schemaPath: 'industrySpecificData.engagementTypes', gridSpan: 2
                },
                { key: 'remoteWork', label: 'Remote Work Available', type: 'toggle', schemaPath: 'industrySpecificData.remoteWork' },
                { key: 'onsiteAvailable', label: 'On-site Available', type: 'toggle', schemaPath: 'industrySpecificData.onsiteAvailable' },
                { key: 'minEngagement', label: 'Minimum Engagement', type: 'text', placeholder: 'e.g., ₹25,000 or 10 hours', schemaPath: 'industrySpecificData.minEngagement' },
            ],
        },
        {
            id: 'expertise',
            title: 'Expertise & Team',
            icon: '👥',
            showForFunctions: ['ca_firm', 'tax_consultant', 'law_firm', 'marketing_agency'],

            fields: [
                {
                    key: 'teamSize', label: 'Team Size', type: 'select', options: [
                        { value: 'solo', label: 'Solo/Freelancer' },
                        { value: 'small', label: '2-5 people' },
                        { value: 'medium', label: '6-20 people' },
                        { value: 'large', label: '20+ people' },
                    ], schemaPath: 'industrySpecificData.teamSize'
                },
                { key: 'experienceYears', label: 'Years of Experience', type: 'number', placeholder: 'e.g., 10', schemaPath: 'industrySpecificData.experienceYears' },
                { key: 'keyExpertise', label: 'Key Expertise', type: 'tags', placeholder: 'e.g., M&A, Tax Planning, Digital Marketing', schemaPath: 'industrySpecificData.keyExpertise', gridSpan: 2, aiSuggestionEnabled: true },
            ],
        },
    ],
};

// ============================================
// BEAUTY & WELLNESS EXPERTISE
// ============================================
export const BEAUTY_WELLNESS_EXPERTISE: IndustryExpertiseConfig = {
    industryId: 'beauty_wellness',
    industryName: 'Beauty & Wellness',
    subSections: [
        {
            // RENAMED: Removed businessType dropdown - now driven by category selection
            id: 'services-info',
            title: 'Services & Offerings',
            icon: '💅',
            fields: [
                { key: 'servicesOffered', label: 'Services Offered', type: 'tags', placeholder: 'e.g., Haircut, Facial, Massage, Personal Training', schemaPath: 'industrySpecificData.servicesOffered', gridSpan: 2 },
                {
                    key: 'targetGender', label: 'Target Gender', type: 'radio', options: [
                        { value: 'unisex', label: 'Unisex' },
                        { value: 'women', label: 'Women Only' },
                        { value: 'men', label: 'Men Only' },
                    ], schemaPath: 'industrySpecificData.targetGender'
                },
            ],
        },
        {
            id: 'booking-pricing',
            title: 'Booking & Pricing',
            icon: '📅',
            fields: [
                { key: 'appointmentRequired', label: 'Appointment Required', type: 'toggle', schemaPath: 'industrySpecificData.appointmentRequired' },
                { key: 'walkInsAccepted', label: 'Walk-ins Accepted', type: 'toggle', schemaPath: 'industrySpecificData.walkInsAccepted' },
                { key: 'homeService', label: 'Home Service Available', type: 'toggle', schemaPath: 'industrySpecificData.homeService' },
                { key: 'priceRange', label: 'Price Range', type: 'text', placeholder: 'e.g., ₹500 - ₹5,000', schemaPath: 'industrySpecificData.priceRange' },
                { key: 'membershipPlans', label: 'Membership Plans', type: 'toggle', schemaPath: 'industrySpecificData.membershipPlans' },
                { key: 'packages', label: 'Package Deals', type: 'toggle', schemaPath: 'industrySpecificData.packages' },
            ],
        },
        {
            id: 'facility',
            title: 'Facility & Staff',
            icon: '🏢',
            showForFunctions: ['beauty_salon', 'spa', 'gym', 'yoga_studio'],

            fields: [
                { key: 'staffCount', label: 'Number of Staff', type: 'number', placeholder: 'e.g., 8', schemaPath: 'industrySpecificData.staffCount' },
                { key: 'brands', label: 'Brands Used', type: 'tags', placeholder: 'e.g., L\'Oreal, Schwarzkopf, The Body Shop', schemaPath: 'industrySpecificData.brands', gridSpan: 2 },
                {
                    key: 'amenities', label: 'Amenities', type: 'checkbox-group', options: [
                        { value: 'ac', label: 'Air Conditioned' },
                        { value: 'parking', label: 'Parking' },
                        { value: 'wifi', label: 'Free WiFi' },
                        { value: 'refreshments', label: 'Complimentary Refreshments' },
                        { value: 'private_rooms', label: 'Private Rooms' },
                    ], schemaPath: 'industrySpecificData.amenities', gridSpan: 2
                },
            ],
        },
    ],
};

// ============================================
// FINANCE EXPERTISE
// ============================================
export const FINANCE_EXPERTISE: IndustryExpertiseConfig = {
    industryId: 'finance',
    industryName: 'Finance',
    subSections: [
        {
            // RENAMED: Removed businessType dropdown - now driven by category selection
            id: 'services-offerings',
            title: 'Services & Offerings',
            icon: '🏦',
            fields: [
                {
                    key: 'primaryServices', label: 'Primary Services', type: 'multi-select', options: [
                        { value: 'mutual_funds', label: 'Mutual Fund Distribution', description: 'SIP, Lumpsum investments' },
                        { value: 'equity', label: 'Equity/Stock Advisory', description: 'Direct equity recommendations' },
                        { value: 'insurance_life', label: 'Life Insurance', description: 'Term, ULIP, Endowment' },
                        { value: 'insurance_health', label: 'Health Insurance', description: 'Individual, Family floater' },
                        { value: 'insurance_general', label: 'General Insurance', description: 'Motor, Home, Travel' },
                        { value: 'tax_planning', label: 'Tax Planning & Filing', description: 'ITR, Tax saving strategies' },
                        { value: 'retirement_planning', label: 'Retirement Planning', description: 'NPS, Pension plans' },
                        { value: 'loan_home', label: 'Home Loans', description: 'Housing finance' },
                        { value: 'loan_personal', label: 'Personal Loans', description: 'Unsecured lending' },
                        { value: 'loan_business', label: 'Business Loans', description: 'MSME, Working capital' },
                        { value: 'loan_lap', label: 'Loan Against Property', description: 'Secured loans' },
                        { value: 'fixed_deposits', label: 'Fixed Deposits', description: 'Bank & Corporate FDs' },
                        { value: 'bonds', label: 'Bonds & Debentures', description: 'Government & Corporate bonds' },
                        { value: 'pms', label: 'Portfolio Management (PMS)', description: 'Discretionary services' },
                        { value: 'aif', label: 'Alternative Investments (AIF)', description: 'Cat I, II, III AIFs' },
                        { value: 'estate_planning', label: 'Estate Planning', description: 'Wills, Trusts, Succession' },
                    ], schemaPath: 'industrySpecificData.primaryServices', gridSpan: 2
                },
                { key: 'specializations', label: 'Specializations', type: 'tags', placeholder: 'e.g., NRI Taxation, Startup Funding, HNI Wealth Management', schemaPath: 'industrySpecificData.specializations', aiSuggestionEnabled: true, gridSpan: 2 },
            ],
        },
        {
            // NEW: Section-level condition - Investment products for investment-focused functions
            id: 'investment-products',
            title: 'Investment Products',
            icon: '📊',
            showForFunctions: ['mutual_fund_distributor', 'investment_advisor', 'wealth_manager', 'stock_broker', 'financial_planner'],
            fields: [
                {
                    key: 'investmentProducts', label: 'Investment Products', type: 'checkbox-group', options: [
                        { value: 'equity_mf', label: 'Equity Mutual Funds' },
                        { value: 'debt_mf', label: 'Debt Mutual Funds' },
                        { value: 'hybrid_mf', label: 'Hybrid/Balanced Funds' },
                        { value: 'index_funds', label: 'Index Funds & ETFs' },
                        { value: 'elss', label: 'ELSS (Tax Saving)' },
                        { value: 'direct_equity', label: 'Direct Equity' },
                        { value: 'ipo', label: 'IPO Advisory' },
                        { value: 'nps', label: 'NPS' },
                        { value: 'ppf_epf', label: 'PPF/EPF' },
                        { value: 'gold', label: 'Gold/Silver (SGB, ETF)' },
                        { value: 'real_estate_funds', label: 'REITs/InvITs' },
                        { value: 'international', label: 'International Funds' },
                    ], schemaPath: 'industrySpecificData.investmentProducts', gridSpan: 2
                },
            ],
        },
        {
            // NEW: Section-level condition - Insurance products only for insurance agents
            id: 'insurance-products',
            title: 'Insurance Products',
            icon: '🛡️',
            showForFunctions: ['insurance_agent'],
            fields: [
                {
                    key: 'insuranceProducts', label: 'Insurance Products', type: 'checkbox-group', options: [
                        { value: 'term_life', label: 'Term Life Insurance' },
                        { value: 'whole_life', label: 'Whole Life Insurance' },
                        { value: 'ulip', label: 'ULIP' },
                        { value: 'endowment', label: 'Endowment Plans' },
                        { value: 'health_individual', label: 'Health - Individual' },
                        { value: 'health_family', label: 'Health - Family Floater' },
                        { value: 'health_senior', label: 'Health - Senior Citizen' },
                        { value: 'critical_illness', label: 'Critical Illness' },
                        { value: 'motor', label: 'Motor Insurance' },
                        { value: 'home', label: 'Home Insurance' },
                        { value: 'travel', label: 'Travel Insurance' },
                        { value: 'group_insurance', label: 'Group/Corporate Insurance' },
                    ], schemaPath: 'industrySpecificData.insuranceProducts', gridSpan: 2
                },
                { key: 'insuranceCompanies', label: 'Insurance Companies', type: 'tags', placeholder: 'e.g., LIC, HDFC Life, ICICI Prudential', schemaPath: 'industrySpecificData.insuranceCompanies', gridSpan: 2 },
            ],
        },
        {
            // NEW: Section-level condition - Loan products only for lending functions
            id: 'loan-products',
            title: 'Loan Products',
            icon: '💳',
            showForFunctions: ['loan_agent', 'microfinance', 'nbfc'],
            fields: [
                {
                    key: 'loanProducts', label: 'Loan Products', type: 'checkbox-group', options: [
                        { value: 'home_loan', label: 'Home Loan' },
                        { value: 'home_loan_bt', label: 'Home Loan Balance Transfer' },
                        { value: 'lap', label: 'Loan Against Property' },
                        { value: 'personal_loan', label: 'Personal Loan' },
                        { value: 'business_loan', label: 'Business Loan' },
                        { value: 'msme_loan', label: 'MSME/Mudra Loan' },
                        { value: 'car_loan', label: 'Car Loan' },
                        { value: 'education_loan', label: 'Education Loan' },
                        { value: 'gold_loan', label: 'Gold Loan' },
                        { value: 'credit_card', label: 'Credit Cards' },
                        { value: 'overdraft', label: 'Overdraft Facility' },
                        { value: 'working_capital', label: 'Working Capital' },
                    ], schemaPath: 'industrySpecificData.loanProducts', gridSpan: 2
                },
                { key: 'lendingPartners', label: 'Lending Partners', type: 'tags', placeholder: 'e.g., HDFC, ICICI, Bajaj Finance', schemaPath: 'industrySpecificData.lendingPartners', gridSpan: 2 },
            ],
        },
        {
            id: 'regulatory-info',
            title: 'Regulatory & Compliance',
            icon: '📜',
            fields: [
                // ARN Number - only for Mutual Fund Distributors
                {
                    key: 'arnNumber',
                    label: 'AMFI ARN Number',
                    type: 'text',
                    placeholder: 'e.g., ARN-123456',
                    schemaPath: 'industrySpecificData.arnNumber',
                    showForFunctions: ['mutual_fund_distributor'],
                    requiredForFunctions: ['mutual_fund_distributor'],
                },
                // SEBI Registration - for investment advisors, stock brokers, wealth managers
                {
                    key: 'sebiRegNumber',
                    label: 'SEBI Registration No.',
                    type: 'text',
                    placeholder: 'e.g., INA000012345',
                    schemaPath: 'industrySpecificData.sebiRegNumber',
                    showForFunctions: ['investment_advisor', 'stock_broker', 'wealth_manager'],
                },
                // IRDAI License - only for Insurance Agents
                {
                    key: 'irdaiLicenseNumber',
                    label: 'IRDAI License No.',
                    type: 'text',
                    placeholder: 'e.g., IRDAI/DB/123',
                    schemaPath: 'industrySpecificData.irdaiLicenseNumber',
                    showForFunctions: ['insurance_agent'],
                    requiredForFunctions: ['insurance_agent'],
                },
                // RBI Registration - for NBFCs and microfinance
                {
                    key: 'rbiRegistration',
                    label: 'RBI Registration No.',
                    type: 'text',
                    placeholder: 'e.g., N-13.02215',
                    schemaPath: 'industrySpecificData.rbiRegistration',
                    showForFunctions: ['microfinance', 'nbfc', 'fintech'],
                },
                // ICAI Membership - for CA firms
                {
                    key: 'icaiMembershipNumber',
                    label: 'ICAI Membership No.',
                    type: 'text',
                    placeholder: 'e.g., 123456',
                    schemaPath: 'industrySpecificData.icaiMembershipNumber',
                    showForFunctions: ['ca_firm', 'tax_consultant'],
                },
                // GST Number - India only
                {
                    key: 'gstNumber',
                    label: 'GST Number',
                    type: 'text',
                    placeholder: 'e.g., 29ABCDE1234F1Z5',
                    schemaPath: 'industrySpecificData.gstNumber',
                    showForCountries: ['IN'],
                },
                // Professional certifications - all functions
                { key: 'professionalCertifications', label: 'Professional Certifications', type: 'tags', placeholder: 'e.g., CFP, CFA, NISM Series', schemaPath: 'industrySpecificData.professionalCertifications', gridSpan: 2 },
                { key: 'insuranceCover', label: 'Professional Indemnity Insurance', type: 'toggle', schemaPath: 'industrySpecificData.insuranceCover' },
                { key: 'insuranceCoverAmount', label: 'Indemnity Cover Amount', type: 'currency', placeholder: 'e.g., 5000000', schemaPath: 'industrySpecificData.insuranceCoverAmount', showCondition: { field: 'insuranceCover', operator: 'equals', value: true } },
            ],
        },
        {
            id: 'client-segments',
            title: 'Client Segments & Approach',
            icon: '👥',
            fields: [
                {
                    key: 'clientTypes', label: 'Client Types Served', type: 'checkbox-group', options: [
                        { value: 'salaried', label: 'Salaried Individuals' },
                        { value: 'self_employed', label: 'Self-Employed/Professionals' },
                        { value: 'business_owners', label: 'Business Owners' },
                        { value: 'hni', label: 'HNI (High Net Worth)' },
                        { value: 'uhni', label: 'UHNI (Ultra High Net Worth)' },
                        { value: 'nri', label: 'NRI/OCI' },
                        { value: 'senior_citizens', label: 'Senior Citizens' },
                        { value: 'women', label: 'Women-focused' },
                        { value: 'msme', label: 'MSME/Startups' },
                        { value: 'corporate', label: 'Corporate/Institutions' },
                    ], schemaPath: 'industrySpecificData.clientTypes', gridSpan: 2
                },
                // Portfolio-related fields - only for investment functions
                {
                    key: 'minInvestment',
                    label: 'Minimum Investment/Portfolio',
                    type: 'currency',
                    placeholder: 'e.g., 100000',
                    helpText: 'Minimum portfolio size you typically work with',
                    schemaPath: 'industrySpecificData.minInvestment',
                    showForFunctions: ['mutual_fund_distributor', 'investment_advisor', 'wealth_manager'],
                },
                {
                    key: 'typicalPortfolio',
                    label: 'Typical Client Portfolio Size',
                    type: 'select',
                    options: [
                        { value: 'under_1l', label: 'Under ₹1 Lakh' },
                        { value: '1l_5l', label: '₹1-5 Lakhs' },
                        { value: '5l_25l', label: '₹5-25 Lakhs' },
                        { value: '25l_1cr', label: '₹25L - 1 Crore' },
                        { value: '1cr_5cr', label: '₹1-5 Crores' },
                        { value: 'above_5cr', label: 'Above ₹5 Crores' },
                    ],
                    schemaPath: 'industrySpecificData.typicalPortfolio',
                    showForFunctions: ['mutual_fund_distributor', 'investment_advisor', 'wealth_manager'],
                },
                {
                    key: 'investmentApproach', label: 'Investment Approach', type: 'multi-select', options: [
                        { value: 'goal_based', label: 'Goal-Based Planning' },
                        { value: 'risk_profiled', label: 'Risk-Profiled Allocation' },
                        { value: 'value_investing', label: 'Value Investing' },
                        { value: 'growth_investing', label: 'Growth Investing' },
                        { value: 'passive', label: 'Passive/Index-based' },
                        { value: 'active', label: 'Active Management' },
                        { value: 'tactical', label: 'Tactical Asset Allocation' },
                        { value: 'holistic', label: 'Holistic Financial Planning' },
                    ], schemaPath: 'industrySpecificData.investmentApproach', gridSpan: 2,
                    showForFunctions: ['mutual_fund_distributor', 'investment_advisor', 'wealth_manager', 'financial_planner', 'stock_broker'],
                },
                {
                    key: 'consultationModes',
                    label: 'Consultation Modes',
                    type: 'checkbox-group',
                    options: [
                        { value: 'in_person', label: 'In-Person' },
                        { value: 'video_call', label: 'Video Call' },
                        { value: 'phone', label: 'Phone' },
                        { value: 'whatsapp', label: 'WhatsApp' },
                        { value: 'email', label: 'Email' },
                    ],
                    schemaPath: 'industrySpecificData.consultationModes',
                    gridSpan: 2
                },
            ],
        },
        {
            id: 'fees-consultation',
            title: 'Fees & Consultation',
            icon: '💰',
            fields: [
                {
                    key: 'feeStructure', label: 'Fee Structure', type: 'radio', options: [
                        { value: 'commission_only', label: 'Commission-only (from product)', description: 'No direct fee to client' },
                        { value: 'fee_only', label: 'Fee-only (no commissions)', description: 'Direct fee, no product commissions' },
                        { value: 'fee_based', label: 'Fee-based (hybrid)', description: 'Fee + reduced commissions' },
                        { value: 'aum_based', label: 'AUM-based fee', description: '% of assets managed' },
                        { value: 'flat_fee', label: 'Flat fee per service', description: 'Fixed fee for each service' },
                        { value: 'hourly', label: 'Hourly consultation', description: 'Pay per hour of advice' },
                    ], schemaPath: 'industrySpecificData.feeStructure', gridSpan: 2
                },
                { key: 'consultationFee', label: 'Initial Consultation Fee', type: 'currency', placeholder: 'e.g., 1000 or 0 for free', helpText: 'Fee for first meeting/call', schemaPath: 'industrySpecificData.consultationFee' },
                { key: 'freeConsultation', label: 'Free First Consultation', type: 'toggle', schemaPath: 'industrySpecificData.freeConsultation' },
                { key: 'financialPlanFee', label: 'Financial Plan Fee', type: 'text', placeholder: 'e.g., ₹5,000 - ₹25,000', schemaPath: 'industrySpecificData.financialPlanFee' },
                { key: 'aumFeePercent', label: 'AUM Fee (%)', type: 'text', placeholder: 'e.g., 1% - 1.5% per annum', schemaPath: 'industrySpecificData.aumFeePercent', showCondition: { field: 'feeStructure', operator: 'equals', value: 'aum_based' } },
                { key: 'onlineConsultation', label: 'Online/Video Consultation', type: 'toggle', schemaPath: 'industrySpecificData.onlineConsultation' },
                { key: 'homeVisits', label: 'Home/Office Visits Available', type: 'toggle', schemaPath: 'industrySpecificData.homeVisits' },
                { key: 'bookingLink', label: 'Consultation Booking Link', type: 'url', placeholder: 'e.g., Calendly link', schemaPath: 'industrySpecificData.bookingLink' },
            ],
        },
        {
            id: 'experience-credentials',
            title: 'Experience & Credentials',
            icon: '🏆',
            collapsible: true,
            defaultExpanded: false,
            fields: [
                { key: 'yearsInBusiness', label: 'Years in Business', type: 'number', placeholder: 'e.g., 10', schemaPath: 'industrySpecificData.yearsInBusiness' },
                { key: 'clientsServed', label: 'Clients Served', type: 'text', placeholder: 'e.g., 500+ families', schemaPath: 'industrySpecificData.clientsServed' },
                {
                    key: 'aumManaged',
                    label: 'AUM Managed (approx)',
                    type: 'text',
                    placeholder: 'e.g., ₹50 Crores',
                    schemaPath: 'industrySpecificData.aumManaged',
                    showForFunctions: ['mutual_fund_distributor', 'investment_advisor', 'wealth_manager'],
                },
                {
                    key: 'teamSize', label: 'Team Size', type: 'select', options: [
                        { value: 'solo', label: 'Solo Practitioner' },
                        { value: '2-5', label: '2-5 members' },
                        { value: '6-15', label: '6-15 members' },
                        { value: '16-50', label: '16-50 members' },
                        { value: '50+', label: '50+ members' },
                    ], schemaPath: 'industrySpecificData.teamSize'
                },
                { key: 'awards', label: 'Awards & Recognition', type: 'tags', placeholder: 'e.g., MDRT, Best Advisor Award', schemaPath: 'industrySpecificData.awards', gridSpan: 2 },
                { key: 'mediaFeatures', label: 'Media Features', type: 'tags', placeholder: 'e.g., ET Wealth, Mint, CNBC', schemaPath: 'industrySpecificData.mediaFeatures', gridSpan: 2 },
            ],
        },
    ],
};

// ============================================
// TECHNOLOGY EXPERTISE
// ============================================
export const TECHNOLOGY_EXPERTISE: IndustryExpertiseConfig = {
    industryId: 'technology',
    industryName: 'Technology',
    subSections: [
        {
            // RENAMED: Removed businessType dropdown - now driven by category selection
            id: 'tech-stack',
            title: 'Technology & Services',
            icon: '💻',
            showForFunctions: ['software_company', 'it_services', 'saas'],

            fields: [
                { key: 'techStack', label: 'Tech Stack', type: 'tags', placeholder: 'e.g., React, Node.js, AWS, Python', schemaPath: 'industrySpecificData.techStack', gridSpan: 2 },
                { key: 'industries', label: 'Industries Served', type: 'tags', placeholder: 'e.g., Healthcare, Fintech, E-commerce', schemaPath: 'industrySpecificData.industriesServed', gridSpan: 2 },
            ],
        },
        {
            id: 'engagement',
            title: 'Engagement Model',
            icon: '🤝',
            fields: [
                {
                    key: 'engagementModels', label: 'Engagement Models', type: 'checkbox-group', options: [
                        { value: 'project', label: 'Fixed-Price Projects' },
                        { value: 'dedicated_team', label: 'Dedicated Team' },
                        { value: 'staff_augmentation', label: 'Staff Augmentation' },
                        { value: 'subscription', label: 'Subscription/SaaS' },
                        { value: 'support', label: 'Support/Maintenance' },
                    ], schemaPath: 'industrySpecificData.engagementModels', gridSpan: 2
                },
                {
                    key: 'teamSize', label: 'Team Size', type: 'select', options: [
                        { value: '1-5', label: '1-5 developers' },
                        { value: '6-20', label: '6-20 developers' },
                        { value: '21-50', label: '21-50 developers' },
                        { value: '50+', label: '50+ developers' },
                    ], schemaPath: 'industrySpecificData.teamSize'
                },
                { key: 'remoteFirst', label: 'Remote-First', type: 'toggle', schemaPath: 'industrySpecificData.remoteFirst' },
            ],
        },
        {
            id: 'product-info',
            title: 'Product/Service Details',
            icon: '📦',
            showForFunctions: ['software_company', 'saas'],

            fields: [
                { key: 'productName', label: 'Product Name', type: 'text', placeholder: 'e.g., CloudSync Pro', schemaPath: 'industrySpecificData.productName' },
                { key: 'freeTrialAvailable', label: 'Free Trial Available', type: 'toggle', schemaPath: 'industrySpecificData.freeTrialAvailable' },
                {
                    key: 'pricingModel', label: 'Pricing Model', type: 'select', options: [
                        { value: 'free', label: 'Free' },
                        { value: 'freemium', label: 'Freemium' },
                        { value: 'subscription', label: 'Subscription' },
                        { value: 'one_time', label: 'One-time Purchase' },
                        { value: 'usage_based', label: 'Usage-based' },
                        { value: 'custom', label: 'Custom Pricing' },
                    ], schemaPath: 'industrySpecificData.pricingModel'
                },
                { key: 'integrations', label: 'Key Integrations', type: 'tags', placeholder: 'e.g., Slack, Salesforce, Zapier', schemaPath: 'industrySpecificData.integrations', gridSpan: 2 },
            ],
        },
    ],
};

// ============================================
// AUTOMOTIVE EXPERTISE
// ============================================
export const AUTOMOTIVE_EXPERTISE: IndustryExpertiseConfig = {
    industryId: 'automotive',
    industryName: 'Automotive',
    subSections: [
        {
            // RENAMED: Removed businessType dropdown - now driven by category selection
            id: 'vehicles-brands',
            title: 'Vehicles & Brands',
            icon: '🚗',
            fields: [
                { key: 'brands', label: 'Brands Handled', type: 'tags', placeholder: 'e.g., Maruti, Hyundai, Tata, BMW', schemaPath: 'industrySpecificData.brands', gridSpan: 2 },
                {
                    key: 'vehicleTypes', label: 'Vehicle Types', type: 'checkbox-group', options: [
                        { value: 'cars', label: 'Cars' },
                        { value: 'suvs', label: 'SUVs' },
                        { value: 'bikes', label: 'Two-Wheelers' },
                        { value: 'commercial', label: 'Commercial Vehicles' },
                        { value: 'ev', label: 'Electric Vehicles' },
                    ], schemaPath: 'industrySpecificData.vehicleTypes', gridSpan: 2
                },
            ],
        },
        {
            id: 'services',
            title: 'Services Offered',
            icon: '🔧',
            fields: [
                {
                    key: 'services', label: 'Services', type: 'checkbox-group', options: [
                        { value: 'sales', label: 'Sales' },
                        { value: 'service', label: 'Service/Repair' },
                        { value: 'insurance', label: 'Insurance' },
                        { value: 'finance', label: 'Financing' },
                        { value: 'exchange', label: 'Exchange' },
                        { value: 'test_drive', label: 'Test Drive' },
                        { value: 'pickup_drop', label: 'Pickup & Drop' },
                    ], schemaPath: 'industrySpecificData.services', gridSpan: 2
                },
                { key: 'authorizedDealer', label: 'Authorized Dealer', type: 'toggle', schemaPath: 'industrySpecificData.authorizedDealer' },
                { key: 'multibranchWarranty', label: 'Multi-branch Warranty', type: 'toggle', schemaPath: 'industrySpecificData.multibranchWarranty' },
            ],
        },
        {
            id: 'facility',
            title: 'Facility Details',
            icon: '🏢',
            showForFunctions: ['car_dealer', 'auto_repair'],

            fields: [
                { key: 'serviceBays', label: 'Number of Service Bays', type: 'number', placeholder: 'e.g., 10', schemaPath: 'industrySpecificData.serviceBays' },
                { key: 'showroomSize', label: 'Showroom Size (sq ft)', type: 'number', placeholder: 'e.g., 5000', schemaPath: 'industrySpecificData.showroomSize' },
                { key: 'genuineParts', label: 'Genuine Parts Only', type: 'toggle', schemaPath: 'industrySpecificData.genuineParts' },
                { key: 'loaner', label: 'Loaner Vehicle Available', type: 'toggle', schemaPath: 'industrySpecificData.loanerAvailable' },
            ],
        },
    ],
};

// ============================================
// EVENTS EXPERTISE
// ============================================
export const EVENTS_EXPERTISE: IndustryExpertiseConfig = {
    industryId: 'events',
    industryName: 'Events',
    subSections: [
        {
            // RENAMED: Removed businessType dropdown - now driven by category selection
            id: 'event-details',
            title: 'Event Details',
            icon: '🎉',
            fields: [
                { key: 'eventTypes', label: 'Event Types', type: 'tags', placeholder: 'e.g., Weddings, Corporate, Birthday, Concerts', schemaPath: 'industrySpecificData.eventTypes', gridSpan: 2 },
                { key: 'experienceYears', label: 'Years of Experience', type: 'number', placeholder: 'e.g., 8', schemaPath: 'industrySpecificData.experienceYears' },
            ],
        },
        {
            id: 'capacity',
            title: 'Capacity & Coverage',
            icon: '📍',
            showForFunctions: ['event_planner', 'event_venue', 'catering'],

            fields: [
                { key: 'maxCapacity', label: 'Max Guest Capacity', type: 'number', placeholder: 'e.g., 500', schemaPath: 'industrySpecificData.maxCapacity' },
                { key: 'travelWilling', label: 'Willing to Travel', type: 'toggle', schemaPath: 'industrySpecificData.travelWilling' },
                { key: 'coverageAreas', label: 'Coverage Areas', type: 'tags', placeholder: 'e.g., Bangalore, Mysore, Goa', schemaPath: 'industrySpecificData.coverageAreas', gridSpan: 2 },
                { key: 'destinationEvents', label: 'Destination Events', type: 'toggle', schemaPath: 'industrySpecificData.destinationEvents' },
            ],
        },
        {
            id: 'pricing',
            title: 'Pricing & Packages',
            icon: '💰',
            fields: [
                {
                    key: 'pricingModel', label: 'Pricing Model', type: 'select', options: [
                        { value: 'package', label: 'Package-based' },
                        { value: 'hourly', label: 'Hourly Rate' },
                        { value: 'per_event', label: 'Per Event' },
                        { value: 'custom', label: 'Custom Quote' },
                    ], schemaPath: 'industrySpecificData.pricingModel'
                },
                { key: 'startingPrice', label: 'Starting Price', type: 'currency', placeholder: 'e.g., 50000', schemaPath: 'industrySpecificData.startingPrice' },
                { key: 'advanceRequired', label: 'Advance Required (%)', type: 'number', placeholder: 'e.g., 50', schemaPath: 'industrySpecificData.advanceRequired' },
                { key: 'portfolio', label: 'Portfolio Link', type: 'url', placeholder: 'Link to your portfolio', schemaPath: 'industrySpecificData.portfolioLink', gridSpan: 2 },
            ],
        },
    ],
};

// ============================================
// HOME SERVICES EXPERTISE
// ============================================
export const HOME_SERVICES_EXPERTISE: IndustryExpertiseConfig = {
    industryId: 'home_services',
    industryName: 'Home Services',
    subSections: [
        {
            // RENAMED: Removed serviceType dropdown - now driven by category selection
            id: 'services-info',
            title: 'Services Information',
            icon: '🔧',
            fields: [
                { key: 'servicesOffered', label: 'Specific Services', type: 'tags', placeholder: 'e.g., Leak Repair, Wiring, Deep Cleaning', schemaPath: 'industrySpecificData.servicesOffered', gridSpan: 2 },
                { key: 'brandsServiced', label: 'Brands Serviced', type: 'tags', placeholder: 'e.g., LG, Samsung, Voltas', schemaPath: 'industrySpecificData.brandsServiced', gridSpan: 2 },
            ],
        },
        {
            id: 'coverage',
            title: 'Coverage & Availability',
            icon: '📍',
            showForFunctions: ['plumber', 'electrician', 'cleaning_service', 'carpenter', 'pest_control'],

            fields: [
                { key: 'serviceAreas', label: 'Service Areas', type: 'tags', placeholder: 'e.g., Koramangala, HSR Layout, Whitefield', schemaPath: 'industrySpecificData.serviceAreas', gridSpan: 2 },
                { key: 'sameDay', label: 'Same Day Service', type: 'toggle', schemaPath: 'industrySpecificData.sameDayService' },
                { key: 'emergencyService', label: '24/7 Emergency Service', type: 'toggle', schemaPath: 'industrySpecificData.emergencyService' },
                { key: 'onlineBooking', label: 'Online Booking', type: 'toggle', schemaPath: 'industrySpecificData.onlineBooking' },
                { key: 'responseTime', label: 'Typical Response Time', type: 'text', placeholder: 'e.g., Within 2 hours', schemaPath: 'industrySpecificData.responseTime' },
            ],
        },
        {
            id: 'pricing-warranty',
            title: 'Pricing & Warranty',
            icon: '💰',
            fields: [
                { key: 'visitingCharge', label: 'Visiting Charge', type: 'currency', placeholder: 'e.g., 199', schemaPath: 'industrySpecificData.visitingCharge' },
                { key: 'warrantyOffered', label: 'Warranty on Service', type: 'toggle', schemaPath: 'industrySpecificData.warrantyOffered' },
                { key: 'warrantyPeriod', label: 'Warranty Period', type: 'text', placeholder: 'e.g., 30 days', schemaPath: 'industrySpecificData.warrantyPeriod', showCondition: { field: 'warrantyOffered', operator: 'equals', value: true } },
                {
                    key: 'paymentModes', label: 'Payment Modes', type: 'checkbox-group', options: [
                        { value: 'cash', label: 'Cash' },
                        { value: 'upi', label: 'UPI' },
                        { value: 'card', label: 'Card' },
                        { value: 'online', label: 'Online Transfer' },
                    ], schemaPath: 'industrySpecificData.paymentModes', gridSpan: 2
                },
            ],
        },
    ],
};

// ============================================
// MANUFACTURING EXPERTISE
// ============================================
export const MANUFACTURING_EXPERTISE: IndustryExpertiseConfig = {
    industryId: 'manufacturing',
    industryName: 'Manufacturing',
    subSections: [
        {
            id: 'business-info',
            title: 'Business Information',
            icon: '🏭',
            // REMOVED: manufacturingType dropdown - now driven by category selection
            fields: [
                { key: 'productTypes', label: 'Products Manufactured', type: 'tags', placeholder: 'e.g., Machinery, Electronics, Textiles', schemaPath: 'industrySpecificData.productTypes', gridSpan: 2 },
                { key: 'industries', label: 'Industries Served', type: 'tags', placeholder: 'e.g., Automotive, Aerospace, Healthcare', schemaPath: 'industrySpecificData.industriesServed', gridSpan: 2 },
            ],
        },
        {
            id: 'capabilities',
            title: 'Capabilities',
            icon: '⚙️',
            fields: [
                { key: 'productionCapacity', label: 'Monthly Production Capacity', type: 'text', placeholder: 'e.g., 10,000 units', schemaPath: 'industrySpecificData.productionCapacity' },
                { key: 'moq', label: 'Minimum Order Quantity', type: 'text', placeholder: 'e.g., 100 units', schemaPath: 'industrySpecificData.moq' },
                { key: 'leadTime', label: 'Typical Lead Time', type: 'text', placeholder: 'e.g., 2-3 weeks', schemaPath: 'industrySpecificData.leadTime' },
                { key: 'customization', label: 'Customization Available', type: 'toggle', schemaPath: 'industrySpecificData.customizationAvailable' },
                { key: 'exportCapable', label: 'Export Capable', type: 'toggle', schemaPath: 'industrySpecificData.exportCapable' },
            ],
        },
        {
            id: 'certifications',
            title: 'Certifications & Quality',
            icon: '✅',
            fields: [
                { key: 'certifications', label: 'Certifications', type: 'tags', placeholder: 'e.g., ISO 9001, CE, BIS', schemaPath: 'industrySpecificData.certifications', gridSpan: 2 },
                { key: 'qualityControl', label: 'Quality Control Process', type: 'textarea', placeholder: 'Describe your QC process...', schemaPath: 'industrySpecificData.qualityControlProcess', gridSpan: 2 },
            ],
        },
    ],
};

// ============================================
// OTHER/GENERIC EXPERTISE
// ============================================
export const OTHER_EXPERTISE: IndustryExpertiseConfig = {
    industryId: 'other',
    industryName: 'Other',
    subSections: [
        {
            id: 'general-info',
            title: 'Business Details',
            icon: '📋',
            fields: [
                { key: 'businessNature', label: 'Nature of Business', type: 'textarea', placeholder: 'Describe what your business does...', schemaPath: 'industrySpecificData.businessNature', gridSpan: 2 },
                { key: 'productsServices', label: 'Products/Services', type: 'tags', placeholder: 'Add your main offerings...', schemaPath: 'industrySpecificData.productsServices', gridSpan: 2 },
                { key: 'targetMarket', label: 'Target Market', type: 'tags', placeholder: 'Who are your customers?', schemaPath: 'industrySpecificData.targetMarket', gridSpan: 2 },
            ],
        },
        {
            id: 'operations',
            title: 'Operations',
            icon: '⚙️',
            fields: [
                {
                    key: 'serviceMode', label: 'Service Mode', type: 'checkbox-group', options: [
                        { value: 'on_site', label: 'On-Site/In-Person' },
                        { value: 'remote', label: 'Remote/Online' },
                        { value: 'hybrid', label: 'Hybrid' },
                    ], schemaPath: 'industrySpecificData.serviceMode', gridSpan: 2
                },
                { key: 'appointmentRequired', label: 'Appointment Required', type: 'toggle', schemaPath: 'industrySpecificData.appointmentRequired' },
                { key: 'walkInsAccepted', label: 'Walk-ins Accepted', type: 'toggle', schemaPath: 'industrySpecificData.walkInsAccepted' },
            ],
        },
    ],
};

// ============================================
// FOOD & BEVERAGE EXPERTISE
// ============================================
export const FOOD_BEVERAGE_EXPERTISE: IndustryExpertiseConfig = {
    industryId: 'food_beverage',
    industryName: 'Food & Beverage',
    subSections: [
        {
            id: 'cuisine-style',
            title: 'Cuisine & Style',
            icon: '🍽️',
            fields: [
                {
                    key: 'cuisineTypes',
                    label: 'Cuisine Types',
                    type: 'tags',
                    placeholder: 'Add cuisines...',
                    helpText: 'e.g., North Indian, Chinese, Italian, Multi-cuisine',
                    validation: { required: true },
                    schemaPath: 'restaurantInfo.cuisineTypes',
                    fetchable: true,
                    gridSpan: 2,
                },
                {
                    key: 'primaryCuisine',
                    label: 'Primary Cuisine',
                    type: 'select',
                    options: [
                        { value: 'north_indian', label: 'North Indian' },
                        { value: 'south_indian', label: 'South Indian' },
                        { value: 'chinese', label: 'Chinese' },
                        { value: 'italian', label: 'Italian' },
                        { value: 'continental', label: 'Continental' },
                        { value: 'mughlai', label: 'Mughlai' },
                        { value: 'thai', label: 'Thai' },
                        { value: 'japanese', label: 'Japanese' },
                        { value: 'mexican', label: 'Mexican' },
                        { value: 'multi_cuisine', label: 'Multi-Cuisine' },
                        { value: 'other', label: 'Other' },
                    ],
                    schemaPath: 'restaurantInfo.primaryCuisine',
                },
                {
                    key: 'diningStyle',
                    label: 'Dining Style',
                    type: 'multi-select',
                    options: [
                        { value: 'fine_dining', label: 'Fine Dining', description: 'Upscale, formal experience' },
                        { value: 'casual_dining', label: 'Casual Dining', description: 'Relaxed, mid-range' },
                        { value: 'qsr', label: 'Quick Service (QSR)', description: 'Fast food, counter service' },
                        { value: 'cafe', label: 'Café', description: 'Coffee, snacks, light meals' },
                        { value: 'bar_lounge', label: 'Bar / Lounge', description: 'Focus on drinks' },
                        { value: 'cloud_kitchen', label: 'Cloud Kitchen', description: 'Delivery only' },
                        { value: 'food_truck', label: 'Food Truck', description: 'Mobile vendor' },
                        { value: 'takeaway', label: 'Takeaway', description: 'Primarily packed food' },
                    ],
                    schemaPath: 'restaurantInfo.diningStyles',
                    fetchable: true,
                    gridSpan: 2,
                },
                {
                    key: 'ambiance',
                    label: 'Ambiance & Vibe',
                    type: 'tags',
                    placeholder: 'Describe your atmosphere...',
                    helpText: 'e.g., Family-friendly, Romantic, Rooftop, Live music, Pet-friendly',
                    schemaPath: 'industrySpecificData.ambiance',
                    aiSuggestionEnabled: true,
                    gridSpan: 2,
                },
            ],
        },
        {
            id: 'dining-experience',
            title: 'Dining Experience',
            icon: '🪑',
            fields: [
                {
                    key: 'seatingCapacity',
                    label: 'Seating Capacity',
                    type: 'number',
                    placeholder: 'e.g., 80',
                    schemaPath: 'restaurantInfo.seatingCapacity',
                    fetchable: true,
                },
                {
                    key: 'seatingTypes',
                    label: 'Seating Options',
                    type: 'checkbox-group',
                    options: [
                        { value: 'indoor', label: 'Indoor' },
                        { value: 'outdoor', label: 'Outdoor' },
                        { value: 'rooftop', label: 'Rooftop' },
                        { value: 'private_dining', label: 'Private Dining' },
                        { value: 'bar_seating', label: 'Bar Seating' },
                        { value: 'booth', label: 'Booth/Cabin' },
                    ],
                    schemaPath: 'restaurantInfo.seatingTypes',
                },
                {
                    key: 'reservationMode',
                    label: 'Reservations',
                    type: 'radio',
                    options: [
                        { value: 'required', label: 'Required' },
                        { value: 'recommended', label: 'Recommended' },
                        { value: 'walk_in', label: 'Walk-in Only' },
                        { value: 'both', label: 'Both Walk-in & Reservations' },
                    ],
                    schemaPath: 'restaurantInfo.reservationMode',
                },
                {
                    key: 'reservationLink',
                    label: 'Reservation Link',
                    type: 'url',
                    placeholder: 'e.g., Dineout, EazyDiner, or your booking page',
                    schemaPath: 'industrySpecificData.reservationLink',
                    showCondition: { field: 'reservationMode', operator: 'notEquals', value: 'walk_in' },
                },
                {
                    key: 'averageCostForTwo',
                    label: 'Average Cost for Two',
                    type: 'currency',
                    placeholder: 'e.g., 800',
                    helpText: 'Approximate cost for 2 people (without alcohol)',
                    schemaPath: 'restaurantInfo.averageCostForTwo',
                    fetchable: true,
                },
                {
                    key: 'priceRange',
                    label: 'Price Segment',
                    type: 'select',
                    options: [
                        { value: '$', label: '$ - Budget Friendly', description: 'Under ₹300 for two' },
                        { value: '$$', label: '$$ - Mid Range', description: '₹300-800 for two' },
                        { value: '$$$', label: '$$$ - Premium', description: '₹800-1500 for two' },
                        { value: '$$$$', label: '$$$$ - Luxury', description: 'Above ₹1500 for two' },
                    ],
                    schemaPath: 'restaurantInfo.priceRange',
                },
            ],
        },
        {
            id: 'dietary-policies',
            title: 'Dietary & Policies',
            icon: '🥗',
            fields: [
                {
                    key: 'pureVeg',
                    label: 'Pure Vegetarian',
                    type: 'toggle',
                    helpText: 'No non-veg items served at all',
                    schemaPath: 'restaurantInfo.pureVeg',
                    fetchable: true,
                },
                {
                    key: 'dietaryOptions',
                    label: 'Dietary Options Available',
                    type: 'checkbox-group',
                    options: [
                        { value: 'vegetarian', label: 'Vegetarian' },
                        { value: 'vegan', label: 'Vegan' },
                        { value: 'eggetarian', label: 'Eggetarian' },
                        { value: 'jain', label: 'Jain' },
                        { value: 'gluten_free', label: 'Gluten-Free' },
                        { value: 'halal', label: 'Halal' },
                        { value: 'keto', label: 'Keto-Friendly' },
                        { value: 'sugar_free', label: 'Sugar-Free' },
                    ],
                    schemaPath: 'industrySpecificData.dietaryOptions',
                    gridSpan: 2,
                },
                {
                    key: 'alcoholServed',
                    label: 'Alcohol Served',
                    type: 'toggle',
                    schemaPath: 'restaurantInfo.alcoholServed',
                    fetchable: true,
                },
                {
                    key: 'hookahAvailable',
                    label: 'Hookah Available',
                    type: 'toggle',
                    schemaPath: 'restaurantInfo.hookahAvailable',
                    showCondition: { field: 'alcoholServed', operator: 'equals', value: true },
                },
                {
                    key: 'signatureDishes',
                    label: 'Signature Dishes',
                    type: 'tags',
                    placeholder: 'Add your must-try dishes...',
                    helpText: 'Your bestsellers and chef specials',
                    schemaPath: 'industrySpecificData.signatureDishes',
                    aiSuggestionEnabled: true,
                    gridSpan: 2,
                },
            ],
        },
        {
            id: 'delivery-setup',
            title: 'Delivery & Ordering',
            icon: '🛵',
            fields: [
                {
                    key: 'homeDelivery',
                    label: 'Home Delivery Available',
                    type: 'toggle',
                    schemaPath: 'restaurantInfo.homeDelivery',
                },
                {
                    key: 'takeaway',
                    label: 'Takeaway Available',
                    type: 'toggle',
                    schemaPath: 'restaurantInfo.takeaway',
                },
                {
                    key: 'deliveryPartners',
                    label: 'Delivery Partners',
                    type: 'checkbox-group',
                    options: [
                        { value: 'zomato', label: 'Zomato' },
                        { value: 'swiggy', label: 'Swiggy' },
                        { value: 'uber_eats', label: 'Uber Eats' },
                        { value: 'dunzo', label: 'Dunzo' },
                        { value: 'own_delivery', label: 'Own Delivery Fleet' },
                    ],
                    schemaPath: 'restaurantInfo.deliveryPartners',
                    showCondition: { field: 'homeDelivery', operator: 'equals', value: true },
                    gridSpan: 2,
                },
                {
                    key: 'deliveryRadius',
                    label: 'Delivery Radius',
                    type: 'text',
                    placeholder: 'e.g., 5 km',
                    schemaPath: 'restaurantInfo.deliveryRadius',
                    showCondition: { field: 'homeDelivery', operator: 'equals', value: true },
                },
                {
                    key: 'minimumOrder',
                    label: 'Minimum Order Value',
                    type: 'currency',
                    placeholder: 'e.g., 200',
                    schemaPath: 'restaurantInfo.minimumOrder',
                    showCondition: { field: 'homeDelivery', operator: 'equals', value: true },
                },
                {
                    key: 'deliveryFee',
                    label: 'Delivery Fee',
                    type: 'currency',
                    placeholder: 'e.g., 30',
                    helpText: 'Enter 0 if free delivery',
                    schemaPath: 'restaurantInfo.deliveryFee',
                    showCondition: { field: 'homeDelivery', operator: 'equals', value: true },
                },
                {
                    key: 'freeDeliveryAbove',
                    label: 'Free Delivery Above',
                    type: 'currency',
                    placeholder: 'e.g., 500',
                    schemaPath: 'restaurantInfo.freeDeliveryAbove',
                    showCondition: { field: 'homeDelivery', operator: 'equals', value: true },
                },
                {
                    key: 'deliveryHours',
                    label: 'Delivery Hours',
                    type: 'text',
                    placeholder: 'e.g., 11 AM - 10 PM',
                    schemaPath: 'industrySpecificData.deliveryHours',
                    showCondition: { field: 'homeDelivery', operator: 'equals', value: true },
                },
                {
                    key: 'lastOrderTime',
                    label: 'Last Order Time',
                    type: 'text',
                    placeholder: 'e.g., 10:30 PM',
                    schemaPath: 'industrySpecificData.lastOrderTime',
                },
            ],
        },
        {
            id: 'special-services',
            title: 'Special Services',
            icon: '🎉',
            collapsible: true,
            defaultExpanded: false,
            fields: [
                {
                    key: 'cateringAvailable',
                    label: 'Catering Services',
                    type: 'toggle',
                    schemaPath: 'industrySpecificData.cateringAvailable',
                },
                {
                    key: 'cateringMinimum',
                    label: 'Minimum Catering Order',
                    type: 'currency',
                    placeholder: 'e.g., 5000',
                    schemaPath: 'industrySpecificData.cateringMinimum',
                    showCondition: { field: 'cateringAvailable', operator: 'equals', value: true },
                },
                {
                    key: 'partyBooking',
                    label: 'Private Party Booking',
                    type: 'toggle',
                    schemaPath: 'industrySpecificData.partyBooking',
                },
                {
                    key: 'partyCapacity',
                    label: 'Max Party Capacity',
                    type: 'number',
                    placeholder: 'e.g., 50',
                    schemaPath: 'industrySpecificData.partyCapacity',
                    showCondition: { field: 'partyBooking', operator: 'equals', value: true },
                },
                {
                    key: 'happyHours',
                    label: 'Happy Hours',
                    type: 'text',
                    placeholder: 'e.g., 4 PM - 7 PM, Mon-Thu',
                    schemaPath: 'industrySpecificData.happyHours',
                    showCondition: { field: 'alcoholServed', operator: 'equals', value: true },
                },
                {
                    key: 'liveMusic',
                    label: 'Live Music / Entertainment',
                    type: 'toggle',
                    schemaPath: 'restaurantInfo.liveMusic',
                },
                {
                    key: 'entertainmentSchedule',
                    label: 'Entertainment Schedule',
                    type: 'text',
                    placeholder: 'e.g., Live band on Fri-Sat, 8 PM',
                    schemaPath: 'industrySpecificData.entertainmentSchedule',
                    showCondition: { field: 'liveMusic', operator: 'equals', value: true },
                },
            ],
        },
    ],
};


// ============================================
// ALL INDUSTRY EXPERTISE CONFIGS
// ============================================
export const ALL_INDUSTRY_EXPERTISE: Record<string, IndustryExpertiseConfig> = {
    food_beverage: FOOD_BEVERAGE_EXPERTISE,
    retail: RETAIL_EXPERTISE,
    healthcare: HEALTHCARE_EXPERTISE,
    education: EDUCATION_EXPERTISE,
    hospitality: HOSPITALITY_EXPERTISE,
    real_estate: REAL_ESTATE_EXPERTISE,
    services: SERVICES_EXPERTISE,
    beauty_wellness: BEAUTY_WELLNESS_EXPERTISE,
    finance: FINANCE_EXPERTISE,
    technology: TECHNOLOGY_EXPERTISE,
    automotive: AUTOMOTIVE_EXPERTISE,
    events: EVENTS_EXPERTISE,
    home_services: HOME_SERVICES_EXPERTISE,
    manufacturing: MANUFACTURING_EXPERTISE,
    other: OTHER_EXPERTISE,
};

