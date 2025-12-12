// src/lib/business-persona-types.ts
// Essential business data types for customer communication

/**
 * Core business identity - the essential information every business needs
 * to communicate effectively with customers
 */
export interface BusinessIdentity {
    // Basic Info (captured at signup)
    name: string;                       // Business name
    industry: BusinessIndustry | null;  // What type of business

    // Contact Info (essential for customers)
    email: string;                      // Primary business email
    phone: string;                      // Primary business phone
    whatsAppNumber?: string;            // WhatsApp business number
    website?: string;                   // Business website

    // Social Media
    socialMedia?: SocialMediaLinks;

    // Location (for local businesses)
    address?: BusinessAddress;
    serviceArea?: string;               // "Greater Mumbai" or "India-wide"
    timezone: string;                   // For operating hours
    currency: string;                   // Default currency code (INR, USD, etc.)

    // Operating Info
    operatingHours: OperatingHours;     // When customers can reach you

    // Last update tracking
    lastUpdated: Date;
    completenessScore: number;          // 0-100%
}

export interface SocialMediaLinks {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
    googleBusiness?: string;
}

/**
 * Business personality - how the business communicates
 */
export interface BusinessPersonality {
    // Brand Voice
    voiceTone: VoiceTone[];
    communicationStyle: 'concise' | 'detailed' | 'conversational';
    languagePreference: string[];       // "English", "Hindi", "Tamil", etc.

    // Business Description
    tagline?: string;                   // One-liner about business
    description: string;                // What the business does
    uniqueSellingPoints: string[];      // What makes them different

    // Brand values
    brandValues?: string[];             // "Quality", "Trust", "Innovation"
    foundedYear?: number;               // Since 2015

    // Customer interaction preferences
    responseTimeExpectation: 'immediate' | 'within_hour' | 'within_day' | 'custom';
    customResponseTime?: string;        // If custom, what time?
    escalationPreferences: EscalationPreferences;

    // Greeting style
    greetingStyle?: 'formal' | 'casual' | 'personalized';
    customGreeting?: string;            // "Welcome to XYZ! How can we help?"
}

export type VoiceTone = 'professional' | 'friendly' | 'casual' | 'formal' | 'playful' | 'empathetic' | 'authoritative' | 'warm' | 'energetic' | 'calm';

/**
 * Customer engagement data - understanding who they serve
 */
export interface CustomerProfile {
    // Who are the customers
    targetAudience: string;             // "Small business owners", "Students", etc.
    customerDemographics?: string[];    // "Young professionals", "Families", etc.
    commonQueries: string[];            // Most frequent questions customers ask
    peakContactTimes?: string[];        // When customers usually reach out

    // Customer journey touchpoints
    typicalJourneyStages: string[];     // "Discovery, Inquiry, Purchase, Support"

    // Pain points customers have
    customerPainPoints: string[];

    // How customers usually find you
    acquisitionChannels?: string[];     // "Google", "Instagram", "Word of mouth"
}

/**
 * Key business content that AI needs to know
 */
export interface BusinessKnowledge {
    // Products/Services
    productsOrServices: ProductService[];
    serviceCategories?: string[];       // For grouping products

    // Pricing (if applicable)
    hasPricing: boolean;
    pricingModel?: 'fixed' | 'custom' | 'subscription' | 'hourly' | 'project_based';
    pricingHighlights?: string;         // "Starting from ₹999" or "Custom quotes"
    acceptedPayments?: string[];        // "UPI", "Card", "Cash", "Net Banking"

    // Policies
    policies: BusinessPolicies;

    // FAQs - auto-generated from common queries + manually added
    faqs: FrequentlyAskedQuestion[];

    // Special offers
    currentOffers?: SpecialOffer[];

    // Certifications/Awards
    certifications?: string[];
    awards?: string[];
}

export interface ProductService {
    id: string;
    name: string;
    description: string;
    category?: string;
    priceRange?: string;
    duration?: string;                  // For services: "30 mins", "1 hour"
    isPopular?: boolean;
    isFeatured?: boolean;
    availability?: 'always' | 'limited' | 'seasonal' | 'by_appointment';
}

export interface SpecialOffer {
    id: string;
    title: string;
    description: string;
    validUntil?: string;
    termsAndConditions?: string;
    promoCode?: string;
}

export interface BusinessAddress {
    street?: string;
    area?: string;
    city: string;
    state: string;
    postalCode?: string;
    country: string;
    googleMapsUrl?: string;
    landmark?: string;
    directions?: string;                // "Opposite to XYZ Mall"
}

export interface OperatingHours {
    isOpen24x7: boolean;
    schedule?: WeeklySchedule;
    holidays?: string[];                // Major holidays when closed
    specialNote?: string;               // "Closed on 2nd Saturdays"
    appointmentOnly?: boolean;          // By appointment only
    onlineAlways?: boolean;             // Online services always available
}

export interface WeeklySchedule {
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;
    sunday: DaySchedule;
}

export interface DaySchedule {
    isOpen: boolean;
    openTime?: string;  // "09:00"
    closeTime?: string; // "18:00"
    breakTime?: { start: string; end: string }; // Lunch break
}

export interface EscalationPreferences {
    escalateOnHumanRequest: boolean;
    escalationKeywords: string[];
    escalateOnComplaint: boolean;
    escalateOnUrgent?: boolean;
    escalationContactEmail?: string;
    escalationContactPhone?: string;
    escalationMessage?: string;         // Message shown when escalating
}

export interface BusinessPolicies {
    returnPolicy?: string;
    refundPolicy?: string;
    warrantyInfo?: string;
    shippingInfo?: string;
    deliveryInfo?: string;
    cancellationPolicy?: string;
    privacyPolicy?: string;
    termsOfService?: string;
    paymentTerms?: string;
    customPolicies?: { name: string; content: string }[];
}

export interface FrequentlyAskedQuestion {
    id: string;
    question: string;
    answer: string;
    category?: string;
    isAutoGenerated?: boolean;
    keywords?: string[];                // For better matching
}

/**
 * Industry types with associated question flows
 */
export type BusinessIndustry = {
    id: string;
    name: string;
    category: IndustryCategory;
    icon: string;
    suggestedQuestions: string[];
    typicalPolicies: string[];
    commonProducts?: string[];
};

export type IndustryCategory =
    | 'retail'           // Shops, e-commerce
    | 'food_beverage'    // Restaurants, cafes, bakeries
    | 'services'         // Consulting, agencies, freelancers
    | 'healthcare'       // Clinics, wellness, fitness
    | 'education'        // Schools, tutoring, coaching
    | 'hospitality'      // Hotels, travel
    | 'real_estate'      // Property, construction
    | 'finance'          // Banking, insurance, accounting
    | 'technology'       // IT, SaaS, apps
    | 'manufacturing'    // B2B, factories
    | 'automotive'       // Car dealers, service centers
    | 'beauty_wellness'  // Salons, spas, gyms
    | 'events'           // Event planners, photographers
    | 'home_services'    // Plumbers, electricians, cleaners
    | 'other';

/**
 * Industry presets - tailored questions and suggestions per industry
 */
export const INDUSTRY_PRESETS: Record<IndustryCategory, {
    name: string;
    emoji: string;
    description: string;
    industries: { id: string; name: string; icon: string }[];
    typicalQuestions: string[];
    suggestedPolicies: string[];
    voiceSuggestion: VoiceTone[];
    suggestedPayments: string[];
    exampleDescription: string;
    suggestedUSPs: string[];
}> = {
    retail: {
        name: 'Retail & E-commerce',
        emoji: '🛍️',
        description: 'Shops, stores, online selling',
        industries: [
            { id: 'clothing', name: 'Clothing & Fashion', icon: '👗' },
            { id: 'electronics', name: 'Electronics', icon: '📱' },
            { id: 'home_goods', name: 'Home & Garden', icon: '🏠' },
            { id: 'books', name: 'Books & Stationery', icon: '📚' },
            { id: 'jewelry', name: 'Jewelry & Accessories', icon: '💎' },
            { id: 'general_store', name: 'General Store', icon: '🛒' },
            { id: 'grocery', name: 'Grocery & Supermarket', icon: '🥬' },
            { id: 'pharmacy', name: 'Pharmacy & Medical Store', icon: '💊' },
        ],
        typicalQuestions: [
            'What are your store timings?',
            'Do you offer home delivery?',
            'What is your return policy?',
            'Do you have this item in stock?',
            'Can I pay by card/UPI?',
            'Do you have any ongoing offers?',
        ],
        suggestedPolicies: ['Return Policy', 'Shipping Policy', 'Exchange Policy'],
        voiceSuggestion: ['friendly', 'professional'],
        suggestedPayments: ['Cash', 'UPI', 'Credit/Debit Card', 'Net Banking'],
        exampleDescription: 'We are a family-owned store offering quality products at affordable prices. Visit us for a great shopping experience!',
        suggestedUSPs: ['Wide selection', 'Competitive prices', 'Quality products', 'Easy returns', 'Home delivery'],
    },
    food_beverage: {
        name: 'Food & Beverage',
        emoji: '🍽️',
        description: 'Restaurants, cafes, food delivery',
        industries: [
            { id: 'restaurant', name: 'Restaurant', icon: '🍽️' },
            { id: 'cafe', name: 'Cafe & Coffee Shop', icon: '☕' },
            { id: 'bakery', name: 'Bakery & Confectionery', icon: '🥐' },
            { id: 'catering', name: 'Catering Services', icon: '🍱' },
            { id: 'cloud_kitchen', name: 'Cloud Kitchen', icon: '🥡' },
            { id: 'bar', name: 'Bar & Pub', icon: '🍺' },
            { id: 'food_truck', name: 'Food Truck', icon: '🚚' },
            { id: 'ice_cream', name: 'Ice Cream & Desserts', icon: '🍦' },
        ],
        typicalQuestions: [
            'What are today\'s specials?',
            'Do you take reservations?',
            'Do you deliver to my area?',
            'Is your food vegetarian/vegan friendly?',
            'What are your opening hours?',
            'Do you have any offers?',
        ],
        suggestedPolicies: ['Delivery Policy', 'Cancellation Policy', 'Allergy Information'],
        voiceSuggestion: ['friendly', 'warm'],
        suggestedPayments: ['Cash', 'UPI', 'Card', 'Zomato/Swiggy'],
        exampleDescription: 'Serving delicious homestyle food made with fresh ingredients. Dine-in, takeaway, and delivery available!',
        suggestedUSPs: ['Fresh ingredients', 'Homestyle cooking', 'Quick delivery', 'Hygienic preparation', 'Great taste'],
    },
    services: {
        name: 'Professional Services',
        emoji: '💼',
        description: 'Consulting, agencies, freelancing',
        industries: [
            { id: 'consulting', name: 'Business Consulting', icon: '💼' },
            { id: 'agency', name: 'Marketing/Creative Agency', icon: '🎨' },
            { id: 'freelancer', name: 'Freelancer', icon: '💻' },
            { id: 'legal', name: 'Legal Services', icon: '⚖️' },
            { id: 'accounting', name: 'Accounting & Tax', icon: '📊' },
            { id: 'hr', name: 'HR & Recruitment', icon: '👥' },
            { id: 'writing', name: 'Content & Writing', icon: '✍️' },
            { id: 'design', name: 'Design Services', icon: '🎨' },
        ],
        typicalQuestions: [
            'What services do you offer?',
            'How much do you charge?',
            'Can I see your portfolio?',
            'What is your experience?',
            'Do you offer free consultations?',
            'What is your turnaround time?',
        ],
        suggestedPolicies: ['Payment Terms', 'Cancellation Policy', 'Service Agreement'],
        voiceSuggestion: ['professional', 'authoritative'],
        suggestedPayments: ['Bank Transfer', 'UPI', 'PayPal', 'Invoice'],
        exampleDescription: 'Expert consulting services to help your business grow. We bring experience and proven strategies to every project.',
        suggestedUSPs: ['Expert team', 'Proven results', 'Customized solutions', 'On-time delivery', 'Competitive rates'],
    },
    healthcare: {
        name: 'Healthcare',
        emoji: '🏥',
        description: 'Clinics, hospitals, medical services',
        industries: [
            { id: 'clinic', name: 'Clinic/Hospital', icon: '🏥' },
            { id: 'dental', name: 'Dental Care', icon: '🦷' },
            { id: 'eye_care', name: 'Eye Care/Optician', icon: '👁️' },
            { id: 'physiotherapy', name: 'Physiotherapy', icon: '🏃' },
            { id: 'mental_health', name: 'Mental Health', icon: '🧠' },
            { id: 'veterinary', name: 'Veterinary', icon: '🐾' },
            { id: 'diagnostics', name: 'Lab & Diagnostics', icon: '🔬' },
            { id: 'ayurveda', name: 'Ayurveda & Alternative', icon: '🌿' },
        ],
        typicalQuestions: [
            'What are your consultation hours?',
            'Do you accept insurance?',
            'How do I book an appointment?',
            'What is the consultation fee?',
            'Is the doctor available today?',
            'Do you have home visit services?',
        ],
        suggestedPolicies: ['Appointment Policy', 'Payment Policy', 'Cancellation Policy', 'Emergency Contact'],
        voiceSuggestion: ['professional', 'empathetic', 'calm'],
        suggestedPayments: ['Cash', 'UPI', 'Card', 'Insurance'],
        exampleDescription: 'Providing compassionate healthcare with experienced doctors and modern facilities. Your health is our priority.',
        suggestedUSPs: ['Experienced doctors', 'Modern equipment', 'Caring staff', 'Convenient timing', 'Insurance accepted'],
    },
    education: {
        name: 'Education & Training',
        emoji: '🎓',
        description: 'Schools, coaching, online courses',
        industries: [
            { id: 'school', name: 'School/College', icon: '🎓' },
            { id: 'tutoring', name: 'Tutoring/Coaching', icon: '📖' },
            { id: 'edtech', name: 'Online Courses', icon: '🖥️' },
            { id: 'language', name: 'Language Training', icon: '🗣️' },
            { id: 'skill', name: 'Skill Development', icon: '🛠️' },
            { id: 'test_prep', name: 'Test Preparation', icon: '📝' },
            { id: 'music', name: 'Music & Arts', icon: '🎵' },
            { id: 'sports', name: 'Sports Training', icon: '⚽' },
        ],
        typicalQuestions: [
            'What courses do you offer?',
            'What are the fees?',
            'How do I enroll?',
            'Is there a demo class?',
            'What are the batch timings?',
            'Do you provide certificates?',
        ],
        suggestedPolicies: ['Refund Policy', 'Attendance Policy', 'Certification Details'],
        voiceSuggestion: ['professional', 'friendly', 'energetic'],
        suggestedPayments: ['Bank Transfer', 'UPI', 'Card', 'EMI'],
        exampleDescription: 'Quality education with experienced teachers and proven curriculum. Join us to achieve your learning goals!',
        suggestedUSPs: ['Experienced faculty', 'Small batch sizes', 'Personalized attention', 'Proven results', 'Flexible timings'],
    },
    hospitality: {
        name: 'Hospitality & Travel',
        emoji: '🏨',
        description: 'Hotels, travel, tours',
        industries: [
            { id: 'hotel', name: 'Hotel/Resort', icon: '🏨' },
            { id: 'travel', name: 'Travel Agency', icon: '✈️' },
            { id: 'homestay', name: 'Homestay/BnB', icon: '🏡' },
            { id: 'tour', name: 'Tour Operator', icon: '🗺️' },
            { id: 'event_venue', name: 'Event Venue', icon: '🎪' },
            { id: 'adventure', name: 'Adventure Sports', icon: '🏔️' },
        ],
        typicalQuestions: [
            'What are your room rates?',
            'Is breakfast included?',
            'What is the check-in time?',
            'Do you have WiFi?',
            'Can I cancel my booking?',
            'Do you have airport pickup?',
        ],
        suggestedPolicies: ['Booking Policy', 'Cancellation Policy', 'Check-in/Check-out Times'],
        voiceSuggestion: ['professional', 'friendly', 'warm'],
        suggestedPayments: ['Card', 'UPI', 'Bank Transfer', 'OTA Platforms'],
        exampleDescription: 'Your comfort is our priority. Experience warm hospitality and memorable stays with us.',
        suggestedUSPs: ['Prime location', 'Clean rooms', 'Friendly staff', 'Great amenities', 'Value for money'],
    },
    real_estate: {
        name: 'Real Estate',
        emoji: '🏢',
        description: 'Properties, construction, interiors',
        industries: [
            { id: 'property', name: 'Property Dealer/Broker', icon: '🏢' },
            { id: 'developer', name: 'Builder/Developer', icon: '🏗️' },
            { id: 'interior', name: 'Interior Design', icon: '🛋️' },
            { id: 'architect', name: 'Architecture', icon: '📐' },
            { id: 'rental', name: 'Rental Services', icon: '🏠' },
            { id: 'coworking', name: 'Coworking Space', icon: '🖥️' },
        ],
        typicalQuestions: [
            'What properties are available?',
            'What is the price range?',
            'Can I schedule a site visit?',
            'Do you help with documentation?',
            'What is the possession timeline?',
            'Are home loans available?',
        ],
        suggestedPolicies: ['Booking Terms', 'Payment Schedule', 'Documentation Requirements'],
        voiceSuggestion: ['professional', 'authoritative'],
        suggestedPayments: ['Bank Transfer', 'Cheque', 'Home Loan'],
        exampleDescription: 'Find your dream property with us. Trusted real estate services with complete transparency.',
        suggestedUSPs: ['Wide property range', 'Legal assistance', 'Best prices', 'Trusted developers', 'End-to-end support'],
    },
    finance: {
        name: 'Finance & Insurance',
        emoji: '💰',
        description: 'Banking, insurance, investments',
        industries: [
            { id: 'accounting', name: 'Accounting/CA', icon: '📊' },
            { id: 'insurance', name: 'Insurance', icon: '🛡️' },
            { id: 'investment', name: 'Investment Advisory', icon: '📈' },
            { id: 'loans', name: 'Loans & Credit', icon: '💰' },
            { id: 'tax', name: 'Tax Services', icon: '📑' },
            { id: 'financial_planning', name: 'Financial Planning', icon: '🎯' },
        ],
        typicalQuestions: [
            'What services do you provide?',
            'What are your fees?',
            'How do I get started?',
            'What documents do I need?',
            'Can you help with tax filing?',
            'What returns can I expect?',
        ],
        suggestedPolicies: ['Fee Structure', 'Privacy Policy', 'Disclaimer'],
        voiceSuggestion: ['professional', 'authoritative', 'calm'],
        suggestedPayments: ['Bank Transfer', 'Cheque', 'UPI'],
        exampleDescription: 'Expert financial services to secure your future. Trusted advice for all your money matters.',
        suggestedUSPs: ['Expert guidance', 'Transparent fees', 'Personalized plans', 'Regulatory compliant', 'Long-term relationships'],
    },
    technology: {
        name: 'Technology & IT',
        emoji: '💻',
        description: 'Software, apps, IT services',
        industries: [
            { id: 'it_services', name: 'IT Services', icon: '💻' },
            { id: 'saas', name: 'SaaS/Software', icon: '☁️' },
            { id: 'app_dev', name: 'App Development', icon: '📱' },
            { id: 'web_dev', name: 'Web Development', icon: '🌐' },
            { id: 'support', name: 'Tech Support', icon: '🔧' },
            { id: 'cybersecurity', name: 'Cybersecurity', icon: '🔒' },
            { id: 'data', name: 'Data & Analytics', icon: '📊' },
        ],
        typicalQuestions: [
            'What services do you offer?',
            'What is the pricing?',
            'Can I see your portfolio?',
            'What is the timeline?',
            'Do you provide support?',
            'What technologies do you use?',
        ],
        suggestedPolicies: ['SLA', 'Refund Policy', 'Support Policy', 'NDA'],
        voiceSuggestion: ['professional', 'friendly'],
        suggestedPayments: ['Bank Transfer', 'UPI', 'International Cards', 'PayPal'],
        exampleDescription: 'Innovative technology solutions for modern businesses. We build, deploy, and support your digital needs.',
        suggestedUSPs: ['Latest technology', 'Experienced team', 'Scalable solutions', '24/7 support', 'Agile delivery'],
    },
    manufacturing: {
        name: 'Manufacturing & B2B',
        emoji: '🏭',
        description: 'Factories, wholesale, supplies',
        industries: [
            { id: 'manufacturing', name: 'Manufacturing', icon: '🏭' },
            { id: 'wholesale', name: 'Wholesale/Distribution', icon: '📦' },
            { id: 'supplier', name: 'Supplier', icon: '🚚' },
            { id: 'packaging', name: 'Packaging', icon: '📦' },
            { id: 'printing', name: 'Printing', icon: '🖨️' },
            { id: 'textile', name: 'Textile & Garments', icon: '🧵' },
        ],
        typicalQuestions: [
            'What is the minimum order quantity?',
            'Can I get a quote?',
            'What are the payment terms?',
            'What is the lead time?',
            'Do you ship internationally?',
            'Can you provide samples?',
        ],
        suggestedPolicies: ['Payment Terms', 'Shipping Policy', 'Bulk Discount Policy', 'Quality Guarantee'],
        voiceSuggestion: ['professional', 'formal'],
        suggestedPayments: ['Bank Transfer', 'LC', 'Cheque'],
        exampleDescription: 'Quality manufacturing and reliable supply chain. Your trusted B2B partner for all bulk requirements.',
        suggestedUSPs: ['Competitive pricing', 'Quality assurance', 'Timely delivery', 'Custom orders', 'Pan-India delivery'],
    },
    automotive: {
        name: 'Automotive',
        emoji: '🚗',
        description: 'Car dealers, service, parts',
        industries: [
            { id: 'car_dealer', name: 'Car Dealer', icon: '🚗' },
            { id: 'service_center', name: 'Service Center', icon: '🔧' },
            { id: 'spare_parts', name: 'Spare Parts', icon: '⚙️' },
            { id: 'bike_dealer', name: 'Bike Dealer', icon: '🏍️' },
            { id: 'car_wash', name: 'Car Wash/Detailing', icon: '🚿' },
            { id: 'driving_school', name: 'Driving School', icon: '🎓' },
        ],
        typicalQuestions: [
            'What vehicles are available?',
            'What is the price?',
            'Do you offer test drives?',
            'What is the warranty?',
            'Do you provide servicing?',
            'Are EMI options available?',
        ],
        suggestedPolicies: ['Warranty Policy', 'Exchange Policy', 'Service Guarantee'],
        voiceSuggestion: ['professional', 'friendly'],
        suggestedPayments: ['Cash', 'Bank Transfer', 'EMI', 'Loan'],
        exampleDescription: 'Your trusted automotive partner. Quality vehicles and expert service at competitive prices.',
        suggestedUSPs: ['Wide selection', 'Genuine parts', 'Expert technicians', 'Warranty included', 'Financing available'],
    },
    beauty_wellness: {
        name: 'Beauty & Wellness',
        emoji: '💇',
        description: 'Salons, spas, fitness',
        industries: [
            { id: 'salon', name: 'Salon', icon: '💇' },
            { id: 'spa', name: 'Spa & Massage', icon: '💆' },
            { id: 'gym', name: 'Gym & Fitness', icon: '🏋️' },
            { id: 'yoga', name: 'Yoga Studio', icon: '🧘' },
            { id: 'skincare', name: 'Skincare Clinic', icon: '✨' },
            { id: 'makeup', name: 'Makeup Artist', icon: '💄' },
        ],
        typicalQuestions: [
            'What services do you offer?',
            'How do I book an appointment?',
            'What are your prices?',
            'Do you have packages?',
            'What are your timings?',
            'Do you do home visits?',
        ],
        suggestedPolicies: ['Appointment Policy', 'Cancellation Policy', 'Hygiene Standards'],
        voiceSuggestion: ['friendly', 'warm', 'empathetic'],
        suggestedPayments: ['Cash', 'UPI', 'Card', 'Packages'],
        exampleDescription: 'Look and feel your best with our expert beauty and wellness services. Self-care that you deserve!',
        suggestedUSPs: ['Expert stylists', 'Premium products', 'Hygienic environment', 'Relaxing ambiance', 'Personalized care'],
    },
    events: {
        name: 'Events & Entertainment',
        emoji: '🎉',
        description: 'Event planning, photography, DJ',
        industries: [
            { id: 'event_planner', name: 'Event Planner', icon: '🎉' },
            { id: 'photographer', name: 'Photography', icon: '📸' },
            { id: 'videographer', name: 'Videography', icon: '🎬' },
            { id: 'dj', name: 'DJ/Entertainment', icon: '🎧' },
            { id: 'decorator', name: 'Decorator', icon: '🎈' },
            { id: 'caterer', name: 'Caterer', icon: '🍽️' },
        ],
        typicalQuestions: [
            'What is your availability?',
            'What packages do you offer?',
            'Can I see your portfolio?',
            'What is your pricing?',
            'Do you travel outside the city?',
            'How do I book?',
        ],
        suggestedPolicies: ['Booking Policy', 'Cancellation Policy', 'Delivery Timeline'],
        voiceSuggestion: ['friendly', 'energetic', 'professional'],
        suggestedPayments: ['Advance Payment', 'Bank Transfer', 'UPI'],
        exampleDescription: 'Making your special moments unforgettable. Professional event services with a creative touch!',
        suggestedUSPs: ['Creative approach', 'Experienced team', 'Timely delivery', 'Customized packages', 'Best value'],
    },
    home_services: {
        name: 'Home Services',
        emoji: '🏠',
        description: 'Repairs, cleaning, maintenance',
        industries: [
            { id: 'plumber', name: 'Plumbing', icon: '🔧' },
            { id: 'electrician', name: 'Electrical', icon: '⚡' },
            { id: 'cleaning', name: 'Cleaning Services', icon: '🧹' },
            { id: 'pest_control', name: 'Pest Control', icon: '🪲' },
            { id: 'ac_repair', name: 'AC/Appliance Repair', icon: '❄️' },
            { id: 'carpenter', name: 'Carpentry', icon: '🪚' },
            { id: 'painter', name: 'Painting', icon: '🎨' },
            { id: 'security', name: 'Security Services', icon: '🔒' },
        ],
        typicalQuestions: [
            'Do you service my area?',
            'What is the visiting charge?',
            'How soon can you come?',
            'What is the warranty on work?',
            'Do you provide an estimate first?',
            'Are you available on weekends?',
        ],
        suggestedPolicies: ['Service Guarantee', 'Pricing Transparency', 'Emergency Services'],
        voiceSuggestion: ['friendly', 'professional'],
        suggestedPayments: ['Cash', 'UPI', 'After Service'],
        exampleDescription: 'Reliable home services at your doorstep. Quality work, fair prices, and customer satisfaction guaranteed!',
        suggestedUSPs: ['Trained professionals', 'On-time arrival', 'Fair pricing', 'Warranty on work', 'Same-day service'],
    },
    other: {
        name: 'Other',
        emoji: '🏢',
        description: 'NGOs, communities, others',
        industries: [
            { id: 'ngo', name: 'NGO/Non-profit', icon: '🤝' },
            { id: 'religious', name: 'Religious Organization', icon: '🙏' },
            { id: 'community', name: 'Community Group', icon: '👥' },
            { id: 'government', name: 'Government Office', icon: '🏛️' },
            { id: 'other', name: 'Other', icon: '🏢' },
        ],
        typicalQuestions: [
            'What do you do?',
            'How can I get involved?',
            'What are your contact details?',
            'Where are you located?',
            'What are your timings?',
            'How can I donate?',
        ],
        suggestedPolicies: ['Privacy Policy'],
        voiceSuggestion: ['friendly', 'empathetic'],
        suggestedPayments: ['Bank Transfer', 'UPI', 'Online Donation'],
        exampleDescription: 'Making a positive impact in our community. Join us in our mission to create change.',
        suggestedUSPs: ['Transparent operations', 'Community focused', 'Impactful work', 'Volunteer opportunities'],
    },
};

/**
 * Quick setup templates based on business type
 */
export interface QuickSetupTemplate {
    id: string;
    name: string;
    description: string;
    industry: IndustryCategory;
    personality: Partial<BusinessPersonality>;
    exampleFAQs: FrequentlyAskedQuestion[];
    exampleProducts: ProductService[];
}

/**
 * Complete Business Persona - unified across the platform
 */
export interface BusinessPersona {
    identity: BusinessIdentity;
    personality: BusinessPersonality;
    customerProfile: CustomerProfile;
    knowledge: BusinessKnowledge;

    // Setup progress
    setupProgress: SetupProgress;

    // AI-generated enhancements
    aiSuggestions?: AIBusinessSuggestions;

    // Metadata
    createdAt: Date;
    updatedAt: Date;
    version: number;
}

export interface SetupProgress {
    basicInfo: boolean;
    contactInfo: boolean;
    operatingHours: boolean;
    businessDescription: boolean;
    customerProfile: boolean;
    productsServices: boolean;
    policies: boolean;
    faqs: boolean;

    overallPercentage: number;
    nextRecommendedStep: keyof SetupProgress;
}

export interface AIBusinessSuggestions {
    suggestedFAQs: FrequentlyAskedQuestion[];
    suggestedVoiceTones: VoiceTone[];
    suggestedTagline: string;
    commonQueries: string[];
    suggestedUSPs: string[];
    generatedAt: Date;
}

/**
 * Onboarding steps for guided setup
 */
export interface OnboardingStep {
    id: string;
    title: string;
    description: string;
    isRequired: boolean;
    isComplete: boolean;
    fields: string[];
    estimatedMinutes: number;
}

export const DEFAULT_ONBOARDING_STEPS: OnboardingStep[] = [
    {
        id: 'basics',
        title: 'Business Basics',
        description: 'Tell us about your business',
        isRequired: true,
        isComplete: false,
        fields: ['name', 'industry', 'description'],
        estimatedMinutes: 2,
    },
    {
        id: 'contact',
        title: 'Contact Info',
        description: 'How can customers reach you?',
        isRequired: true,
        isComplete: false,
        fields: ['phone', 'email', 'address'],
        estimatedMinutes: 2,
    },
    {
        id: 'hours',
        title: 'Availability',
        description: 'When are you available?',
        isRequired: true,
        isComplete: false,
        fields: ['operatingHours'],
        estimatedMinutes: 2,
    },
    {
        id: 'personality',
        title: 'Brand Voice',
        description: 'How should AI represent you?',
        isRequired: false,
        isComplete: false,
        fields: ['voiceTone', 'communicationStyle'],
        estimatedMinutes: 1,
    },
    {
        id: 'products',
        title: 'Products & Services',
        description: 'What do you offer?',
        isRequired: false,
        isComplete: false,
        fields: ['productsOrServices'],
        estimatedMinutes: 3,
    },
    {
        id: 'faqs',
        title: 'Common Questions',
        description: 'What do customers ask?',
        isRequired: false,
        isComplete: false,
        fields: ['faqs'],
        estimatedMinutes: 2,
    },
];

/**
 * Language options for India
 */
export const SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ta', name: 'Tamil' },
    { code: 'te', name: 'Telugu' },
    { code: 'mr', name: 'Marathi' },
    { code: 'bn', name: 'Bengali' },
    { code: 'gu', name: 'Gujarati' },
    { code: 'kn', name: 'Kannada' },
    { code: 'ml', name: 'Malayalam' },
    { code: 'pa', name: 'Punjabi' },
    { code: 'or', name: 'Odia' },
];

/**
 * Common payment methods in India
 */
export const COMMON_PAYMENT_METHODS = [
    { id: 'cash', name: 'Cash', icon: '💵' },
    { id: 'upi', name: 'UPI (GPay, PhonePe, Paytm)', icon: '📱' },
    { id: 'card', name: 'Credit/Debit Card', icon: '💳' },
    { id: 'netbanking', name: 'Net Banking', icon: '🏦' },
    { id: 'wallet', name: 'Digital Wallets', icon: '👛' },
    { id: 'emi', name: 'EMI', icon: '📅' },
    { id: 'cheque', name: 'Cheque', icon: '📝' },
    { id: 'cod', name: 'Cash on Delivery', icon: '📦' },
    { id: 'bank_transfer', name: 'Bank Transfer/NEFT/RTGS', icon: '🏛️' },
];

/**
 * Supported currencies
 */
export const SUPPORTED_CURRENCIES = [
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
    { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
    { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
    { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
    { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', flag: '🇸🇦' },
    { code: 'QAR', name: 'Qatari Riyal', symbol: '﷼', flag: '🇶🇦' },
    { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك', flag: '🇰🇼' },
    { code: 'BHD', name: 'Bahraini Dinar', symbol: '.د.ب', flag: '🇧🇭' },
    { code: 'OMR', name: 'Omani Rial', symbol: 'ر.ع.', flag: '🇴🇲' },
    { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾' },
    { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭' },
    { code: 'NPR', name: 'Nepalese Rupee', symbol: 'रू', flag: '🇳🇵' },
    { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs', flag: '🇱🇰' },
    { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', flag: '🇧🇩' },
];

/**
 * Get currency symbol from code
 */
export function getCurrencySymbol(code: string): string {
    const currency = SUPPORTED_CURRENCIES.find(c => c.code === code);
    return currency?.symbol || code;
}

/**
 * Valid Payment Method Type
 */
export interface PaymentMethod {
    id: string;
    name: string;
    icon: string;
}

/**
 * Region Configuration for Personalization
 */
export interface RegionConfig {
    id: string;
    name: string;
    flag: string;
    currency: string;
    timezone: string;
    paymentMethods: PaymentMethod[];
}

export const SUPPORTED_REGIONS: RegionConfig[] = [
    {
        id: 'IN',
        name: 'India',
        flag: '🇮🇳',
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        paymentMethods: [
            { id: 'upi', name: 'UPI (GPay, PhonePe, Paytm)', icon: '📱' },
            { id: 'card', name: 'Credit/Debit Card', icon: '💳' },
            { id: 'netbanking', name: 'Net Banking', icon: '🏦' },
            { id: 'cash', name: 'Cash', icon: '💵' },
            { id: 'emi', name: 'EMI / Pay Later', icon: '📅' },
        ]
    },
    {
        id: 'US',
        name: 'United States',
        flag: '🇺🇸',
        currency: 'USD',
        timezone: 'America/New_York',
        paymentMethods: [
            { id: 'card', name: 'Credit/Debit Card', icon: '💳' },
            { id: 'ach', name: 'Bank Transfer (ACH)', icon: '🏦' },
            { id: 'paypal', name: 'PayPal', icon: '🅿️' },
            { id: 'zelle', name: 'Zelle', icon: '💸' },
            { id: 'venmo', name: 'Venmo', icon: 'V' },
            { id: 'cash', name: 'Cash', icon: '💵' },
        ]
    },
    {
        id: 'UK',
        name: 'United Kingdom',
        flag: '🇬🇧',
        currency: 'GBP',
        timezone: 'Europe/London',
        paymentMethods: [
            { id: 'card', name: 'Credit/Debit Card', icon: '💳' },
            { id: 'bank', name: 'Bank Transfer (BACS)', icon: '🏦' },
            { id: 'paypal', name: 'PayPal', icon: '🅿️' },
            { id: 'apple', name: 'Apple Pay', icon: '🍎' },
            { id: 'cash', name: 'Cash', icon: '💵' },
        ]
    },
    {
        id: 'EU',
        name: 'Europe (Eurozone)',
        flag: '🇪🇺',
        currency: 'EUR',
        timezone: 'Europe/Paris',
        paymentMethods: [
            { id: 'card', name: 'Credit/Debit Card', icon: '💳' },
            { id: 'sepa', name: 'SEPA Transfer', icon: '🏦' },
            { id: 'paypal', name: 'PayPal', icon: '🅿️' },
            { id: 'cash', name: 'Cash', icon: '💵' },
        ]
    },
    {
        id: 'AE',
        name: 'United Arab Emirates',
        flag: '🇦🇪',
        currency: 'AED',
        timezone: 'Asia/Dubai',
        paymentMethods: [
            { id: 'card', name: 'Credit/Debit Card', icon: '💳' },
            { id: 'bank', name: 'Bank Transfer', icon: '🏦' },
            { id: 'cash', name: 'Cash', icon: '💵' },
            { id: 'cheque', name: 'Cheque', icon: '📝' },
        ]
    },
    {
        id: 'GLOBAL',
        name: 'Rest of World',
        flag: '🌍',
        currency: 'USD',
        timezone: 'UTC',
        paymentMethods: [
            { id: 'card', name: 'Credit/Debit Card', icon: '💳' },
            { id: 'bank', name: 'Bank Transfer', icon: '🏦' },
            { id: 'paypal', name: 'PayPal', icon: '🅿️' },
            { id: 'cash', name: 'Cash', icon: '💵' },
        ]
    }
];

export function getPaymentMethodsForRegion(countryCode?: string): PaymentMethod[] {
    // If no country code, try to infer from common logic or return Global
    if (!countryCode) return COMMON_PAYMENT_METHODS;

    // Try to find exact match
    const region = SUPPORTED_REGIONS.find(r => r.id === countryCode);
    if (region) return region.paymentMethods;

    // Fallback to Global if not found
    return SUPPORTED_REGIONS.find(r => r.id === 'GLOBAL')?.paymentMethods || COMMON_PAYMENT_METHODS;
}

/**
 * Format price with currency
 */
export function formatPrice(amount: number, currencyCode: string): string {
    const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
    if (!currency) return `${currencyCode} ${amount}`;

    // Format number with commas
    const formattedAmount = new Intl.NumberFormat('en-IN', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
    }).format(amount);

    return `${currency.symbol}${formattedAmount}`;
}
