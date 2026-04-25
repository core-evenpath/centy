/**
 * Country-Aware Auto-Fill Configuration
 * 
 * Provides country-specific platform configs, payment methods, registrations,
 * and certifications for the business auto-fill system.
 * 
 * Market Priority: US (primary) > IN > AE > GB
 */

// ============================================================
// TYPES
// ============================================================

export type SupportedCountry = 'US' | 'IN' | 'AE' | 'GB';

export const DEFAULT_COUNTRY: SupportedCountry = 'US';

export interface PlatformInfo {
    name: string;
    domain: string;
    searchUrl?: string;
    priority: number;
    dataAvailable: string[];
}

export interface PaymentMethodInfo {
    id: string;
    name: string;
    type: 'card' | 'digital_wallet' | 'bank_transfer' | 'cash' | 'bnpl' | 'upi';
    popular: boolean;
}

export interface RegistrationInfo {
    id: string;
    name: string;
    fullName: string;
    applicableTo: string[];
    verificationUrl?: string;
}

export interface CountryAutoFillConfig {
    code: SupportedCountry;
    name: string;
    flag: string;
    phoneCode: string;
    currency: { code: string; symbol: string; position: 'before' | 'after' };
    locale: string;

    platforms: {
        reviews: PlatformInfo[];
        food: PlatformInfo[];
        hotels: PlatformInfo[];
        healthcare: PlatformInfo[];
        realEstate: PlatformInfo[];
        ecommerce: PlatformInfo[];
        directories: PlatformInfo[];
        jobs: PlatformInfo[];
    };

    paymentMethods: PaymentMethodInfo[];
    registrations: RegistrationInfo[];

    certifications: {
        hospitality: string[];
        healthcare: string[];
        food: string[];
        education: string[];
        finance: string[];
        general: string[];
    };

    address: {
        postalCodeName: string;
        postalCodePattern: RegExp;
        stateLabel: string;
        components: string[];
    };

    search: {
        suffix: string;
        languages: string[];
        businessSuffixes: string[];
    };
}

// ============================================================
// 🇺🇸 UNITED STATES - PRIMARY MARKET (DEFAULT)
// ============================================================
const US_CONFIG: CountryAutoFillConfig = {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    phoneCode: '+1',
    currency: { code: 'USD', symbol: '$', position: 'before' },
    locale: 'en-US',

    platforms: {
        reviews: [
            { name: 'Google', domain: 'google.com', priority: 1, dataAvailable: ['rating', 'reviews', 'photos', 'hours'] },
            { name: 'Yelp', domain: 'yelp.com', priority: 2, dataAvailable: ['rating', 'reviews', 'photos', 'menu', 'prices'] },
            { name: 'Better Business Bureau', domain: 'bbb.org', priority: 3, dataAvailable: ['rating', 'accreditation', 'complaints'] },
            { name: 'Angi', domain: 'angi.com', priority: 4, dataAvailable: ['rating', 'reviews', 'pricing'] },
            { name: 'Thumbtack', domain: 'thumbtack.com', priority: 5, dataAvailable: ['rating', 'reviews', 'pricing'] },
        ],
        food: [
            { name: 'Yelp', domain: 'yelp.com', priority: 1, dataAvailable: ['menu', 'prices', 'rating', 'reviews', 'photos'] },
            { name: 'DoorDash', domain: 'doordash.com', priority: 2, dataAvailable: ['menu', 'prices', 'hours'] },
            { name: 'UberEats', domain: 'ubereats.com', priority: 3, dataAvailable: ['menu', 'prices'] },
            { name: 'Grubhub', domain: 'grubhub.com', priority: 4, dataAvailable: ['menu', 'prices'] },
            { name: 'OpenTable', domain: 'opentable.com', priority: 5, dataAvailable: ['menu', 'rating', 'reviews', 'reservations'] },
            { name: 'Resy', domain: 'resy.com', priority: 6, dataAvailable: ['reservations', 'menu'] },
            { name: 'TripAdvisor', domain: 'tripadvisor.com', priority: 7, dataAvailable: ['rating', 'reviews'] },
        ],
        hotels: [
            { name: 'TripAdvisor', domain: 'tripadvisor.com', priority: 1, dataAvailable: ['rooms', 'prices', 'rating', 'reviews', 'photos'] },
            { name: 'Expedia', domain: 'expedia.com', priority: 2, dataAvailable: ['rooms', 'prices', 'rating', 'amenities'] },
            { name: 'Hotels.com', domain: 'hotels.com', priority: 3, dataAvailable: ['rooms', 'prices', 'rating'] },
            { name: 'Booking.com', domain: 'booking.com', priority: 4, dataAvailable: ['rooms', 'prices', 'rating', 'reviews'] },
            { name: 'Kayak', domain: 'kayak.com', priority: 5, dataAvailable: ['rooms', 'prices'] },
            { name: 'Priceline', domain: 'priceline.com', priority: 6, dataAvailable: ['rooms', 'prices'] },
        ],
        healthcare: [
            { name: 'Zocdoc', domain: 'zocdoc.com', priority: 1, dataAvailable: ['doctors', 'services', 'insurance', 'fees', 'rating', 'reviews'] },
            { name: 'Healthgrades', domain: 'healthgrades.com', priority: 2, dataAvailable: ['doctors', 'rating', 'reviews', 'credentials'] },
            { name: 'Vitals', domain: 'vitals.com', priority: 3, dataAvailable: ['doctors', 'rating', 'reviews'] },
            { name: 'WebMD', domain: 'doctor.webmd.com', priority: 4, dataAvailable: ['doctors', 'services'] },
            { name: 'U.S. News Health', domain: 'health.usnews.com', priority: 5, dataAvailable: ['hospital_rankings', 'doctors'] },
        ],
        realEstate: [
            { name: 'Zillow', domain: 'zillow.com', priority: 1, dataAvailable: ['listings', 'prices', 'agent_info', 'history'] },
            { name: 'Redfin', domain: 'redfin.com', priority: 2, dataAvailable: ['listings', 'prices', 'agent_stats'] },
            { name: 'Realtor.com', domain: 'realtor.com', priority: 3, dataAvailable: ['listings', 'prices', 'agent_info'] },
            { name: 'Trulia', domain: 'trulia.com', priority: 4, dataAvailable: ['listings', 'prices', 'neighborhood'] },
            { name: 'Compass', domain: 'compass.com', priority: 5, dataAvailable: ['listings', 'prices'] },
        ],
        ecommerce: [
            { name: 'Amazon', domain: 'amazon.com', priority: 1, dataAvailable: ['products', 'prices', 'rating', 'reviews'] },
            { name: 'Walmart', domain: 'walmart.com', priority: 2, dataAvailable: ['products', 'prices', 'rating'] },
            { name: 'Target', domain: 'target.com', priority: 3, dataAvailable: ['products', 'prices'] },
            { name: 'Best Buy', domain: 'bestbuy.com', priority: 4, dataAvailable: ['products', 'prices', 'rating'] },
        ],
        directories: [
            { name: 'Yelp', domain: 'yelp.com', priority: 1, dataAvailable: ['contact', 'hours', 'rating', 'reviews'] },
            { name: 'Better Business Bureau', domain: 'bbb.org', priority: 2, dataAvailable: ['accreditation', 'complaints', 'rating'] },
            { name: 'Yellow Pages', domain: 'yellowpages.com', priority: 3, dataAvailable: ['contact', 'hours'] },
            { name: 'Manta', domain: 'manta.com', priority: 4, dataAvailable: ['company_info', 'revenue'] },
        ],
        jobs: [
            { name: 'LinkedIn', domain: 'linkedin.com', priority: 1, dataAvailable: ['company_info', 'team_size', 'jobs', 'employees'] },
            { name: 'Glassdoor', domain: 'glassdoor.com', priority: 2, dataAvailable: ['reviews', 'salaries', 'culture', 'ceo_approval'] },
            { name: 'Indeed', domain: 'indeed.com', priority: 3, dataAvailable: ['reviews', 'salaries', 'jobs'] },
        ],
    },

    paymentMethods: [
        { id: 'credit_card', name: 'Credit Card', type: 'card', popular: true },
        { id: 'debit_card', name: 'Debit Card', type: 'card', popular: true },
        { id: 'apple_pay', name: 'Apple Pay', type: 'digital_wallet', popular: true },
        { id: 'google_pay', name: 'Google Pay', type: 'digital_wallet', popular: true },
        { id: 'venmo', name: 'Venmo', type: 'digital_wallet', popular: true },
        { id: 'paypal', name: 'PayPal', type: 'digital_wallet', popular: true },
        { id: 'zelle', name: 'Zelle', type: 'bank_transfer', popular: true },
        { id: 'cash', name: 'Cash', type: 'cash', popular: true },
        { id: 'cashapp', name: 'Cash App', type: 'digital_wallet', popular: false },
        { id: 'affirm', name: 'Affirm', type: 'bnpl', popular: false },
        { id: 'klarna', name: 'Klarna', type: 'bnpl', popular: false },
        { id: 'afterpay', name: 'Afterpay', type: 'bnpl', popular: false },
        { id: 'ach', name: 'ACH Transfer', type: 'bank_transfer', popular: false },
    ],

    registrations: [
        { id: 'ein', name: 'EIN', fullName: 'Employer Identification Number', applicableTo: ['all'] },
        { id: 'llc', name: 'LLC', fullName: 'Limited Liability Company', applicableTo: ['all'] },
        { id: 'corporation', name: 'Corp/Inc', fullName: 'Corporation', applicableTo: ['all'] },
        { id: 'dba', name: 'DBA', fullName: 'Doing Business As', applicableTo: ['all'] },
        { id: 'state_license', name: 'State Business License', fullName: 'State Business License', applicableTo: ['all'] },
        { id: 'fda', name: 'FDA Registration', fullName: 'Food and Drug Administration', applicableTo: ['food', 'healthcare'] },
        { id: 'health_permit', name: 'Health Permit', fullName: 'Health Department Permit', applicableTo: ['food'] },
        { id: 'liquor_license', name: 'Liquor License', fullName: 'Alcoholic Beverage License', applicableTo: ['food'] },
        { id: 'hipaa', name: 'HIPAA', fullName: 'HIPAA Compliant', applicableTo: ['healthcare'] },
        { id: 'real_estate_license', name: 'Real Estate License', fullName: 'State Real Estate License', applicableTo: ['real_estate'] },
        { id: 'contractor_license', name: 'Contractor License', fullName: 'State Contractor License', applicableTo: ['services'] },
        { id: 'insurance', name: 'Insurance', fullName: 'Liability Insurance', applicableTo: ['all'] },
        { id: 'bonded', name: 'Bonded', fullName: 'Surety Bond', applicableTo: ['services'] },
    ],

    certifications: {
        hospitality: ['AAA Diamond Rating', 'Forbes Travel Guide', 'Green Key Eco-Rating', 'LEED Certified', 'TripAdvisor Travelers Choice'],
        healthcare: ['JCI Accredited', 'AAAHC', 'CARF', 'NCQA', 'HIPAA Compliant', 'URAC', 'DNV Healthcare'],
        food: ['FDA Registered', 'USDA Organic', 'Non-GMO Verified', 'ServSafe Certified', 'SQF Certified', 'Gluten-Free Certified'],
        education: ['ABET Accredited', 'AACSB Accredited', 'ABA Approved', 'CAEP Accredited', 'WASC Accredited', 'HLC Accredited'],
        finance: ['SEC Registered', 'FINRA Member', 'CFP', 'CFA', 'CPA', 'Series 7/66 Licensed'],
        general: ['BBB Accredited', 'ISO 9001', 'ISO 27001', 'B Corp Certified', 'Women-Owned (WBENC)', 'Minority-Owned (NMSDC)', 'Veteran-Owned'],
    },

    address: {
        postalCodeName: 'ZIP Code',
        postalCodePattern: /^\d{5}(-\d{4})?$/,
        stateLabel: 'State',
        components: ['street', 'suite', 'city', 'state', 'zip'],
    },

    search: {
        suffix: ' USA',
        languages: ['en'],
        businessSuffixes: ['LLC', 'Inc', 'Corp', 'Co', 'Ltd', 'LP', 'LLP', 'PC', 'PLLC'],
    },
};

// ============================================================
// 🇮🇳 INDIA - SECONDARY MARKET
// ============================================================
const IN_CONFIG: CountryAutoFillConfig = {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    phoneCode: '+91',
    currency: { code: 'INR', symbol: '₹', position: 'before' },
    locale: 'en-IN',

    platforms: {
        reviews: [
            { name: 'Google', domain: 'google.co.in', priority: 1, dataAvailable: ['rating', 'reviews', 'photos'] },
            { name: 'Justdial', domain: 'justdial.com', priority: 2, dataAvailable: ['rating', 'reviews', 'contact'] },
            { name: 'Sulekha', domain: 'sulekha.com', priority: 3, dataAvailable: ['rating', 'reviews'] },
            { name: 'IndiaMART', domain: 'indiamart.com', priority: 4, dataAvailable: ['products', 'contact'] },
        ],
        food: [
            { name: 'Zomato', domain: 'zomato.com', priority: 1, dataAvailable: ['menu', 'prices', 'rating', 'reviews', 'photos'] },
            { name: 'Swiggy', domain: 'swiggy.com', priority: 2, dataAvailable: ['menu', 'prices', 'rating'] },
            { name: 'EazyDiner', domain: 'eazydiner.com', priority: 3, dataAvailable: ['menu', 'rating', 'reviews'] },
            { name: 'Dineout', domain: 'dineout.co.in', priority: 4, dataAvailable: ['menu', 'offers', 'rating'] },
            { name: 'TripAdvisor', domain: 'tripadvisor.in', priority: 5, dataAvailable: ['rating', 'reviews'] },
        ],
        hotels: [
            { name: 'MakeMyTrip', domain: 'makemytrip.com', priority: 1, dataAvailable: ['rooms', 'prices', 'rating', 'amenities'] },
            { name: 'Goibibo', domain: 'goibibo.com', priority: 2, dataAvailable: ['rooms', 'prices', 'rating'] },
            { name: 'OYO', domain: 'oyorooms.com', priority: 3, dataAvailable: ['rooms', 'prices'] },
            { name: 'Booking.com', domain: 'booking.com', priority: 4, dataAvailable: ['rooms', 'prices', 'rating', 'reviews'] },
            { name: 'Agoda', domain: 'agoda.com', priority: 5, dataAvailable: ['rooms', 'prices', 'rating'] },
            { name: 'TripAdvisor', domain: 'tripadvisor.in', priority: 6, dataAvailable: ['rating', 'reviews', 'photos'] },
        ],
        healthcare: [
            { name: 'Practo', domain: 'practo.com', priority: 1, dataAvailable: ['doctors', 'services', 'fees', 'rating', 'reviews'] },
            { name: 'Lybrate', domain: 'lybrate.com', priority: 2, dataAvailable: ['doctors', 'services', 'fees'] },
            { name: '1mg', domain: '1mg.com', priority: 3, dataAvailable: ['tests', 'prices', 'medicines'] },
            { name: 'Apollo 24|7', domain: 'apollo247.com', priority: 4, dataAvailable: ['doctors', 'services'] },
        ],
        realEstate: [
            { name: '99acres', domain: '99acres.com', priority: 1, dataAvailable: ['listings', 'prices', 'contact'] },
            { name: 'MagicBricks', domain: 'magicbricks.com', priority: 2, dataAvailable: ['listings', 'prices'] },
            { name: 'Housing.com', domain: 'housing.com', priority: 3, dataAvailable: ['listings', 'prices', 'builder_info'] },
            { name: 'NoBroker', domain: 'nobroker.in', priority: 4, dataAvailable: ['listings', 'prices'] },
            { name: 'Square Yards', domain: 'squareyards.com', priority: 5, dataAvailable: ['listings', 'prices'] },
        ],
        ecommerce: [
            { name: 'Amazon India', domain: 'amazon.in', priority: 1, dataAvailable: ['products', 'prices', 'rating'] },
            { name: 'Flipkart', domain: 'flipkart.com', priority: 2, dataAvailable: ['products', 'prices', 'rating'] },
            { name: 'Myntra', domain: 'myntra.com', priority: 3, dataAvailable: ['products', 'prices'] },
            { name: 'Nykaa', domain: 'nykaa.com', priority: 4, dataAvailable: ['products', 'prices', 'rating'] },
        ],
        directories: [
            { name: 'Justdial', domain: 'justdial.com', priority: 1, dataAvailable: ['contact', 'rating', 'reviews'] },
            { name: 'Sulekha', domain: 'sulekha.com', priority: 2, dataAvailable: ['contact', 'services'] },
            { name: 'IndiaMART', domain: 'indiamart.com', priority: 3, dataAvailable: ['products', 'contact'] },
            { name: 'TradeIndia', domain: 'tradeindia.com', priority: 4, dataAvailable: ['products', 'contact'] },
        ],
        jobs: [
            { name: 'LinkedIn', domain: 'linkedin.com', priority: 1, dataAvailable: ['company_info', 'team_size'] },
            { name: 'Naukri', domain: 'naukri.com', priority: 2, dataAvailable: ['company_info', 'reviews', 'jobs'] },
            { name: 'Glassdoor', domain: 'glassdoor.co.in', priority: 3, dataAvailable: ['reviews', 'salaries'] },
            { name: 'AmbitionBox', domain: 'ambitionbox.com', priority: 4, dataAvailable: ['reviews', 'salaries'] },
        ],
    },

    paymentMethods: [
        { id: 'upi', name: 'UPI', type: 'upi', popular: true },
        { id: 'gpay', name: 'Google Pay', type: 'digital_wallet', popular: true },
        { id: 'phonepe', name: 'PhonePe', type: 'digital_wallet', popular: true },
        { id: 'paytm', name: 'Paytm', type: 'digital_wallet', popular: true },
        { id: 'cash', name: 'Cash', type: 'cash', popular: true },
        { id: 'credit_card', name: 'Credit Card', type: 'card', popular: true },
        { id: 'debit_card', name: 'Debit Card', type: 'card', popular: true },
        { id: 'net_banking', name: 'Net Banking', type: 'bank_transfer', popular: false },
        { id: 'amazonpay', name: 'Amazon Pay', type: 'digital_wallet', popular: false },
        { id: 'cred', name: 'CRED', type: 'digital_wallet', popular: false },
        { id: 'bhim', name: 'BHIM', type: 'upi', popular: false },
    ],

    registrations: [
        { id: 'gstin', name: 'GSTIN', fullName: 'Goods and Services Tax Identification Number', applicableTo: ['all'] },
        { id: 'pan', name: 'PAN', fullName: 'Permanent Account Number', applicableTo: ['all'] },
        { id: 'cin', name: 'CIN', fullName: 'Corporate Identity Number', applicableTo: ['all'], verificationUrl: 'https://www.mca.gov.in' },
        { id: 'fssai', name: 'FSSAI', fullName: 'Food Safety and Standards Authority of India', applicableTo: ['food'] },
        { id: 'rera', name: 'RERA', fullName: 'Real Estate Regulatory Authority', applicableTo: ['real_estate'], verificationUrl: 'https://rera.gov.in' },
        { id: 'shop_est', name: 'Shop & Establishment', fullName: 'Shop and Establishment License', applicableTo: ['all'] },
        { id: 'trade_license', name: 'Trade License', fullName: 'Municipal Trade License', applicableTo: ['all'] },
        { id: 'mci', name: 'MCI/NMC', fullName: 'Medical Council Registration', applicableTo: ['healthcare'] },
        { id: 'drug_license', name: 'Drug License', fullName: 'Drug License', applicableTo: ['healthcare'] },
        { id: 'msme', name: 'MSME/Udyam', fullName: 'MSME Registration', applicableTo: ['all'] },
    ],

    certifications: {
        hospitality: ['FHRAI Member', 'HRACC Certified', 'Green Hotel Certification', 'ISO 22000', 'India Tourism Approved'],
        healthcare: ['NABH', 'NABL', 'JCI', 'QCI', 'ISO 9001', 'ISO 15189'],
        food: ['FSSAI', 'ISO 22000', 'HACCP', 'Veg/Non-Veg License', 'Eat Right India', 'Hygiene Rating'],
        education: ['AICTE Approved', 'UGC Recognized', 'NAAC Accredited', 'NBA Accredited', 'NIRF Ranked'],
        finance: ['RBI Registered', 'SEBI Registered', 'IRDAI Licensed', 'AMFI Registered', 'PFRDA Licensed'],
        general: ['ISO 9001', 'ISO 14001', 'MSME Registered', 'Startup India', 'Make in India'],
    },

    address: {
        postalCodeName: 'Pincode',
        postalCodePattern: /^[1-9][0-9]{5}$/,
        stateLabel: 'State',
        components: ['building', 'street', 'locality', 'landmark', 'city', 'state', 'pincode'],
    },

    search: {
        suffix: ' India',
        languages: ['en', 'hi'],
        businessSuffixes: ['Pvt Ltd', 'Private Limited', 'LLP', 'Ltd', 'Limited', 'Proprietorship'],
    },
};

// ============================================================
// 🇦🇪 UNITED ARAB EMIRATES - TERTIARY MARKET
// ============================================================
const AE_CONFIG: CountryAutoFillConfig = {
    code: 'AE',
    name: 'United Arab Emirates',
    flag: '🇦🇪',
    phoneCode: '+971',
    currency: { code: 'AED', symbol: 'AED', position: 'before' },
    locale: 'en-AE',

    platforms: {
        reviews: [
            { name: 'Google', domain: 'google.ae', priority: 1, dataAvailable: ['rating', 'reviews', 'photos'] },
            { name: 'TripAdvisor', domain: 'tripadvisor.com', priority: 2, dataAvailable: ['rating', 'reviews'] },
            { name: 'Facebook', domain: 'facebook.com', priority: 3, dataAvailable: ['rating', 'reviews'] },
        ],
        food: [
            { name: 'Zomato', domain: 'zomato.com', priority: 1, dataAvailable: ['menu', 'prices', 'rating', 'reviews'] },
            { name: 'Talabat', domain: 'talabat.com', priority: 2, dataAvailable: ['menu', 'prices'] },
            { name: 'Deliveroo', domain: 'deliveroo.ae', priority: 3, dataAvailable: ['menu', 'prices'] },
            { name: 'Careem NOW', domain: 'careem.com', priority: 4, dataAvailable: ['menu', 'prices'] },
            { name: 'Noon Food', domain: 'noon.com', priority: 5, dataAvailable: ['menu', 'prices'] },
        ],
        hotels: [
            { name: 'Booking.com', domain: 'booking.com', priority: 1, dataAvailable: ['rooms', 'prices', 'rating', 'reviews'] },
            { name: 'Expedia', domain: 'expedia.ae', priority: 2, dataAvailable: ['rooms', 'prices'] },
            { name: 'TripAdvisor', domain: 'tripadvisor.com', priority: 3, dataAvailable: ['rating', 'reviews'] },
            { name: 'Agoda', domain: 'agoda.com', priority: 4, dataAvailable: ['rooms', 'prices', 'rating'] },
        ],
        healthcare: [
            { name: 'Vezeeta', domain: 'vezeeta.com', priority: 1, dataAvailable: ['doctors', 'services', 'fees'] },
            { name: 'DoctorUna', domain: 'doctoruna.com', priority: 2, dataAvailable: ['doctors', 'fees', 'rating'] },
            { name: 'Okadoc', domain: 'okadoc.com', priority: 3, dataAvailable: ['doctors', 'services'] },
            { name: 'Meddy', domain: 'meddy.com', priority: 4, dataAvailable: ['doctors', 'fees'] },
        ],
        realEstate: [
            { name: 'Bayut', domain: 'bayut.com', priority: 1, dataAvailable: ['listings', 'prices', 'agent_info'] },
            { name: 'Property Finder', domain: 'propertyfinder.ae', priority: 2, dataAvailable: ['listings', 'prices'] },
            { name: 'Dubizzle', domain: 'dubizzle.com', priority: 3, dataAvailable: ['listings', 'prices'] },
        ],
        ecommerce: [
            { name: 'Amazon UAE', domain: 'amazon.ae', priority: 1, dataAvailable: ['products', 'prices', 'rating'] },
            { name: 'Noon', domain: 'noon.com', priority: 2, dataAvailable: ['products', 'prices', 'rating'] },
            { name: 'Namshi', domain: 'namshi.com', priority: 3, dataAvailable: ['products', 'prices'] },
        ],
        directories: [
            { name: 'Yellow Pages UAE', domain: 'yellowpages-uae.com', priority: 1, dataAvailable: ['contact'] },
            { name: 'Dubizzle', domain: 'dubizzle.com', priority: 2, dataAvailable: ['contact', 'services'] },
        ],
        jobs: [
            { name: 'LinkedIn', domain: 'linkedin.com', priority: 1, dataAvailable: ['company_info', 'team_size'] },
            { name: 'Bayt', domain: 'bayt.com', priority: 2, dataAvailable: ['company_info', 'jobs'] },
            { name: 'GulfTalent', domain: 'gulftalent.com', priority: 3, dataAvailable: ['jobs', 'company_info'] },
        ],
    },

    paymentMethods: [
        { id: 'credit_card', name: 'Credit Card', type: 'card', popular: true },
        { id: 'debit_card', name: 'Debit Card', type: 'card', popular: true },
        { id: 'apple_pay', name: 'Apple Pay', type: 'digital_wallet', popular: true },
        { id: 'samsung_pay', name: 'Samsung Pay', type: 'digital_wallet', popular: true },
        { id: 'cash', name: 'Cash', type: 'cash', popular: true },
        { id: 'tabby', name: 'Tabby', type: 'bnpl', popular: true },
        { id: 'tamara', name: 'Tamara', type: 'bnpl', popular: false },
        { id: 'bank_transfer', name: 'Bank Transfer', type: 'bank_transfer', popular: false },
    ],

    registrations: [
        { id: 'trade_license', name: 'Trade License', fullName: 'DED/Free Zone Trade License', applicableTo: ['all'] },
        { id: 'trn', name: 'TRN', fullName: 'Tax Registration Number (VAT)', applicableTo: ['all'] },
        { id: 'dtcm', name: 'DTCM', fullName: 'Dubai Tourism License', applicableTo: ['hospitality', 'travel'] },
        { id: 'dha', name: 'DHA', fullName: 'Dubai Health Authority License', applicableTo: ['healthcare'] },
        { id: 'municipality', name: 'Municipality Permit', fullName: 'Food Control Department Permit', applicableTo: ['food'] },
        { id: 'rera_dubai', name: 'RERA', fullName: 'Real Estate Regulatory Agency', applicableTo: ['real_estate'] },
    ],

    certifications: {
        hospitality: ['DTCM Classified', 'Green Globe', 'ISO 9001', 'Halal Certified', 'Dubai Tourism Star Rating'],
        healthcare: ['DHA Accredited', 'JCI', 'ISO 15189', 'CAP Accredited'],
        food: ['HACCP', 'ISO 22000', 'Halal Certified', 'Municipality Grade A', 'Dubai Municipality Food Safety'],
        education: ['KHDA Rated', 'MOE Accredited', 'CAA Licensed'],
        finance: ['DFSA Regulated', 'CBUAE Licensed', 'SCA Regulated'],
        general: ['ISO 9001', 'Dubai SME', 'Made in UAE', 'Emirates Quality Mark'],
    },

    address: {
        postalCodeName: 'P.O. Box',
        postalCodePattern: /^\d+$/,
        stateLabel: 'Emirate',
        components: ['building', 'street', 'area', 'city', 'emirate', 'po_box'],
    },

    search: {
        suffix: ' Dubai UAE',
        languages: ['en', 'ar'],
        businessSuffixes: ['LLC', 'FZ-LLC', 'FZCO', 'FZE', 'Est', 'L.L.C'],
    },
};

// ============================================================
// 🇬🇧 UNITED KINGDOM - QUATERNARY MARKET
// ============================================================
const GB_CONFIG: CountryAutoFillConfig = {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    phoneCode: '+44',
    currency: { code: 'GBP', symbol: '£', position: 'before' },
    locale: 'en-GB',

    platforms: {
        reviews: [
            { name: 'Google', domain: 'google.co.uk', priority: 1, dataAvailable: ['rating', 'reviews', 'photos'] },
            { name: 'Trustpilot', domain: 'trustpilot.com', priority: 2, dataAvailable: ['rating', 'reviews'] },
            { name: 'Yell', domain: 'yell.com', priority: 3, dataAvailable: ['contact', 'rating'] },
            { name: 'Checkatrade', domain: 'checkatrade.com', priority: 4, dataAvailable: ['rating', 'reviews', 'verified'] },
        ],
        food: [
            { name: 'TripAdvisor', domain: 'tripadvisor.co.uk', priority: 1, dataAvailable: ['menu', 'rating', 'reviews'] },
            { name: 'Deliveroo', domain: 'deliveroo.co.uk', priority: 2, dataAvailable: ['menu', 'prices'] },
            { name: 'Just Eat', domain: 'just-eat.co.uk', priority: 3, dataAvailable: ['menu', 'prices', 'rating'] },
            { name: 'UberEats', domain: 'ubereats.com/gb', priority: 4, dataAvailable: ['menu', 'prices'] },
            { name: 'OpenTable', domain: 'opentable.co.uk', priority: 5, dataAvailable: ['rating', 'reviews', 'reservations'] },
        ],
        hotels: [
            { name: 'Booking.com', domain: 'booking.com', priority: 1, dataAvailable: ['rooms', 'prices', 'rating', 'reviews'] },
            { name: 'TripAdvisor', domain: 'tripadvisor.co.uk', priority: 2, dataAvailable: ['rating', 'reviews'] },
            { name: 'Hotels.com', domain: 'uk.hotels.com', priority: 3, dataAvailable: ['rooms', 'prices', 'rating'] },
            { name: 'Expedia', domain: 'expedia.co.uk', priority: 4, dataAvailable: ['rooms', 'prices'] },
        ],
        healthcare: [
            { name: 'NHS', domain: 'nhs.uk', priority: 1, dataAvailable: ['services', 'rating', 'wait_times'] },
            { name: 'Doctify', domain: 'doctify.com', priority: 2, dataAvailable: ['doctors', 'rating', 'reviews'] },
            { name: 'Private Healthcare UK', domain: 'privatehealth.co.uk', priority: 3, dataAvailable: ['services', 'fees'] },
            { name: 'TopDoctors', domain: 'topdoctors.co.uk', priority: 4, dataAvailable: ['doctors', 'rating'] },
        ],
        realEstate: [
            { name: 'Rightmove', domain: 'rightmove.co.uk', priority: 1, dataAvailable: ['listings', 'prices', 'agent_info'] },
            { name: 'Zoopla', domain: 'zoopla.co.uk', priority: 2, dataAvailable: ['listings', 'prices', 'estimates'] },
            { name: 'OnTheMarket', domain: 'onthemarket.com', priority: 3, dataAvailable: ['listings', 'prices'] },
        ],
        ecommerce: [
            { name: 'Amazon UK', domain: 'amazon.co.uk', priority: 1, dataAvailable: ['products', 'prices', 'rating'] },
            { name: 'Argos', domain: 'argos.co.uk', priority: 2, dataAvailable: ['products', 'prices'] },
            { name: 'John Lewis', domain: 'johnlewis.com', priority: 3, dataAvailable: ['products', 'prices'] },
        ],
        directories: [
            { name: 'Yell', domain: 'yell.com', priority: 1, dataAvailable: ['contact', 'rating'] },
            { name: 'Companies House', domain: 'find-and-update.company-information.service.gov.uk', priority: 2, dataAvailable: ['company_info', 'filings'] },
            { name: 'FreeIndex', domain: 'freeindex.co.uk', priority: 3, dataAvailable: ['contact', 'reviews'] },
        ],
        jobs: [
            { name: 'LinkedIn', domain: 'linkedin.com', priority: 1, dataAvailable: ['company_info', 'team_size', 'jobs'] },
            { name: 'Glassdoor', domain: 'glassdoor.co.uk', priority: 2, dataAvailable: ['reviews', 'salaries', 'culture'] },
            { name: 'Indeed', domain: 'indeed.co.uk', priority: 3, dataAvailable: ['reviews', 'jobs'] },
            { name: 'Reed', domain: 'reed.co.uk', priority: 4, dataAvailable: ['jobs'] },
        ],
    },

    paymentMethods: [
        { id: 'credit_card', name: 'Credit Card', type: 'card', popular: true },
        { id: 'debit_card', name: 'Debit Card', type: 'card', popular: true },
        { id: 'apple_pay', name: 'Apple Pay', type: 'digital_wallet', popular: true },
        { id: 'google_pay', name: 'Google Pay', type: 'digital_wallet', popular: true },
        { id: 'paypal', name: 'PayPal', type: 'digital_wallet', popular: true },
        { id: 'bank_transfer', name: 'Bank Transfer', type: 'bank_transfer', popular: true },
        { id: 'cash', name: 'Cash', type: 'cash', popular: true },
        { id: 'klarna', name: 'Klarna', type: 'bnpl', popular: true },
        { id: 'clearpay', name: 'Clearpay', type: 'bnpl', popular: false },
        { id: 'contactless', name: 'Contactless', type: 'card', popular: true },
    ],

    registrations: [
        { id: 'company_number', name: 'Company Number', fullName: 'Companies House Registration', applicableTo: ['all'], verificationUrl: 'https://find-and-update.company-information.service.gov.uk' },
        { id: 'vat', name: 'VAT Number', fullName: 'VAT Registration', applicableTo: ['all'] },
        { id: 'fca', name: 'FCA', fullName: 'Financial Conduct Authority', applicableTo: ['finance'] },
        { id: 'cqc', name: 'CQC', fullName: 'Care Quality Commission', applicableTo: ['healthcare'] },
        { id: 'fsa_rating', name: 'FSA Rating', fullName: 'Food Standards Agency', applicableTo: ['food'], verificationUrl: 'https://ratings.food.gov.uk' },
        { id: 'ico', name: 'ICO', fullName: 'Information Commissioner Office', applicableTo: ['all'] },
        { id: 'hmrc', name: 'HMRC', fullName: 'HMRC Registration', applicableTo: ['all'] },
    ],

    certifications: {
        hospitality: ['AA Star Rating', 'Visit England', 'Green Tourism', 'ISO 14001', 'Good Hotel Guide'],
        healthcare: ['CQC Rating', 'ISO 13485', 'JCI', 'UKAS Accredited', 'NHS Approved'],
        food: ['FSA Rating 5', 'Organic Certified', 'Red Tractor', 'SALSA', 'BRC Certified', 'Soil Association'],
        education: ['Ofsted Rating', 'QAA', 'TEF Rating', 'ISI Accredited'],
        finance: ['FCA Authorised', 'PRA Regulated', 'ISO 27001', 'Chartered Status'],
        general: ['ISO 9001', 'B Corp', 'Investors in People', 'Cyber Essentials', 'Which? Trusted Trader'],
    },

    address: {
        postalCodeName: 'Postcode',
        postalCodePattern: /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i,
        stateLabel: 'County',
        components: ['building', 'street', 'town', 'county', 'postcode'],
    },

    search: {
        suffix: ' UK',
        languages: ['en'],
        businessSuffixes: ['Ltd', 'Limited', 'PLC', 'LLP', 'CIC'],
    },
};

// ============================================================
// COUNTRY CONFIGURATIONS REGISTRY
// ============================================================
export const COUNTRY_CONFIGS: Record<SupportedCountry, CountryAutoFillConfig> = {
    US: US_CONFIG,
    IN: IN_CONFIG,
    AE: AE_CONFIG,
    GB: GB_CONFIG,
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get country configuration by code
 * Defaults to US if country not found
 */
export function getCountryConfig(countryCode?: string): CountryAutoFillConfig {
    if (!countryCode) return COUNTRY_CONFIGS[DEFAULT_COUNTRY];
    const code = countryCode.toUpperCase() as SupportedCountry;
    return COUNTRY_CONFIGS[code] || COUNTRY_CONFIGS[DEFAULT_COUNTRY];
}

/**
 * Get list of supported countries
 */
export function getSupportedCountries(): Array<{ code: SupportedCountry; name: string; flag: string }> {
    return [
        { code: 'US', name: 'United States', flag: '🇺🇸' },
        { code: 'IN', name: 'India', flag: '🇮🇳' },
        { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
        { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
    ];
}

// formatCurrency removed (PR fix-14): exported but never imported by
// any consumer. The canonical formatter is `formatMoney(amount,
// currency)` in `src/lib/currency.ts` — country code is no longer the
// right key. Use `countryToRegion` + `regionToDefaultCurrency` from
// the currency module if you need a country → currency derivation.

/**
 * Get phone format prefix for a country
 */
export function getPhoneFormat(countryCode?: string): string {
    const config = getCountryConfig(countryCode);
    return config.phoneCode;
}

/**
 * Detect country from address components
 */
export function detectCountryFromAddress(addressComponents?: { country?: string }): SupportedCountry {
    if (!addressComponents?.country) return DEFAULT_COUNTRY;

    const country = addressComponents.country.toLowerCase();

    // Map common country names to codes
    const countryMap: Record<string, SupportedCountry> = {
        'united states': 'US',
        'usa': 'US',
        'us': 'US',
        'america': 'US',
        'india': 'IN',
        'united arab emirates': 'AE',
        'uae': 'AE',
        'dubai': 'AE',
        'abu dhabi': 'AE',
        'united kingdom': 'GB',
        'uk': 'GB',
        'great britain': 'GB',
        'england': 'GB',
        'scotland': 'GB',
        'wales': 'GB',
    };

    return countryMap[country] || DEFAULT_COUNTRY;
}

/**
 * Get relevant platforms for a given industry category
 */
export function getRelevantPlatforms(
    industryHint: string,
    countryCode?: string
): PlatformInfo[] {
    const config = getCountryConfig(countryCode);
    const platforms: PlatformInfo[] = [...config.platforms.reviews, ...config.platforms.directories];

    const industry = industryHint.toLowerCase();

    if (industry.includes('hotel') || industry.includes('hospitality') || industry.includes('lodging')) {
        platforms.push(...config.platforms.hotels);
    }
    if (industry.includes('food') || industry.includes('restaurant') || industry.includes('cafe')) {
        platforms.push(...config.platforms.food);
    }
    if (industry.includes('health') || industry.includes('medical') || industry.includes('clinic')) {
        platforms.push(...config.platforms.healthcare);
    }
    if (industry.includes('real') || industry.includes('property')) {
        platforms.push(...config.platforms.realEstate);
    }
    if (industry.includes('retail') || industry.includes('store') || industry.includes('shop')) {
        platforms.push(...config.platforms.ecommerce);
    }

    // Dedupe by domain and sort by priority
    const seen = new Set<string>();
    return platforms
        .filter(p => {
            if (seen.has(p.domain)) return false;
            seen.add(p.domain);
            return true;
        })
        .sort((a, b) => a.priority - b.priority);
}

/**
 * Get relevant registrations for a given industry
 */
export function getRelevantRegistrations(
    industryHint: string,
    countryCode?: string
): RegistrationInfo[] {
    const config = getCountryConfig(countryCode);
    const industry = industryHint.toLowerCase();

    return config.registrations.filter(r =>
        r.applicableTo.includes('all') ||
        r.applicableTo.some(a => industry.includes(a))
    );
}

/**
 * Get relevant certifications for a given industry
 */
export function getRelevantCertifications(
    industryHint: string,
    countryCode?: string
): string[] {
    const config = getCountryConfig(countryCode);
    const certs = new Set<string>(config.certifications.general);

    const industry = industryHint.toLowerCase();

    Object.entries(config.certifications).forEach(([key, certList]) => {
        if (industry.includes(key) && Array.isArray(certList)) {
            certList.forEach(c => certs.add(c));
        }
    });

    return Array.from(certs);
}
