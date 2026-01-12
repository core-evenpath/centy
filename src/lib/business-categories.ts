/**
 * Business Categories with Google Places Type Mappings
 * 
 * This provides a unified categorization system that maps between:
 * 1. User-friendly category names (what users see)
 * 2. Google Places types (for auto-fill consistency)
 * 3. Internal industry categories (for backend storage)
 * 
 * When a business is auto-filled from Google Places, we use the mapping
 * to suggest relevant sub-categories. When users manually select, we
 * store the Google Places type for consistency.
 */

import { IndustryCategory } from './business-persona-types';

/**
 * A sub-category with Google Places type mapping
 */
export interface SubCategory {
    id: string;
    label: string;
    googlePlacesTypes: string[]; // Google Places types that map to this category
    keywords?: string[]; // Additional keywords for matching
}

/**
 * A main business category containing sub-categories
 */
export interface BusinessCategory {
    id: string;
    label: string;
    iconName: 'Landmark' | 'GraduationCap' | 'Heart' | 'Briefcase' | 'ShoppingBag' | 'UtensilsCrossed' | 'ShoppingCart' | 'Sparkles' | 'Car' | 'Plane' | 'Building' | 'PartyPopper' | 'Wrench' | 'MoreHorizontal';
    industryCategory: IndustryCategory;
    subCategories: SubCategory[];
}

/**
 * Selected category stored in the business profile
 */
export interface SelectedBusinessCategory {
    mainCategoryId: string;
    subCategoryId: string;
    label: string;
    googlePlacesTypes: string[];
}

/**
 * Complete business categories with Google Places mappings
 */
export const BUSINESS_CATEGORIES: BusinessCategory[] = [
    {
        id: 'finance',
        label: 'Finance & Banking',
        iconName: 'Landmark',
        industryCategory: 'finance',
        subCategories: [
            { id: 'microfinance', label: 'Microfinance / NBFC', googlePlacesTypes: ['finance', 'bank'], keywords: ['nbfc', 'microfinance', 'loan'] },
            { id: 'insurance', label: 'Insurance Agent / Broker', googlePlacesTypes: ['insurance_agency'], keywords: ['insurance', 'policy'] },
            { id: 'mutual_fund', label: 'Mutual Fund Distributor', googlePlacesTypes: ['finance'], keywords: ['mutual fund', 'investment'] },
            { id: 'loan_dsa', label: 'Loan DSA / Personal Loans', googlePlacesTypes: ['finance', 'bank'], keywords: ['loan', 'dsa', 'personal loan'] },
            { id: 'collection', label: 'Collection Agency', googlePlacesTypes: ['finance'], keywords: ['collection', 'recovery'] },
            { id: 'ca_tax', label: 'CA / Tax Consultant', googlePlacesTypes: ['accounting'], keywords: ['ca', 'chartered accountant', 'tax', 'gst'] },
            { id: 'wealth_manager', label: 'Wealth Manager / PMS', googlePlacesTypes: ['finance'], keywords: ['wealth', 'pms', 'portfolio'] },
            { id: 'stock_broker', label: 'Stock Broker / Trading', googlePlacesTypes: ['finance'], keywords: ['stock', 'trading', 'equity'] },
            { id: 'credit_card', label: 'Credit Card Agent', googlePlacesTypes: ['finance', 'bank'], keywords: ['credit card'] },
            { id: 'chit_fund', label: 'Chit Fund / Nidhi Company', googlePlacesTypes: ['finance'], keywords: ['chit', 'nidhi'] },
            { id: 'forex', label: 'Foreign Exchange / Remittance', googlePlacesTypes: ['finance'], keywords: ['forex', 'currency', 'remittance'] },
            { id: 'fintech', label: 'Payment Gateway / Fintech', googlePlacesTypes: ['finance'], keywords: ['payment', 'fintech', 'upi'] },
        ]
    },
    {
        id: 'education',
        label: 'Education & Training',
        iconName: 'GraduationCap',
        industryCategory: 'education',
        subCategories: [
            { id: 'study_abroad', label: 'Study Abroad Consultant', googlePlacesTypes: ['university'], keywords: ['study abroad', 'overseas education'] },
            { id: 'test_prep', label: 'IELTS / GRE / GMAT Coaching', googlePlacesTypes: ['school'], keywords: ['ielts', 'gre', 'gmat', 'toefl'] },
            { id: 'school', label: 'School (K-12)', googlePlacesTypes: ['school', 'primary_school', 'secondary_school'], keywords: ['school', 'cbse', 'icse'] },
            { id: 'college', label: 'College / University', googlePlacesTypes: ['university'], keywords: ['college', 'university', 'degree'] },
            { id: 'coaching', label: 'Coaching Center (IIT/NEET/UPSC)', googlePlacesTypes: ['school'], keywords: ['coaching', 'iit', 'neet', 'upsc'] },
            { id: 'tuition', label: 'Tuition / Home Tutoring', googlePlacesTypes: ['school'], keywords: ['tuition', 'tutor', 'home tutor'] },
            { id: 'online_course', label: 'Online Course Platform', googlePlacesTypes: ['school'], keywords: ['online course', 'e-learning'] },
            { id: 'skill_training', label: 'Skill Training Institute', googlePlacesTypes: ['school'], keywords: ['skill', 'vocational', 'training'] },
            { id: 'language', label: 'Language Classes', googlePlacesTypes: ['school'], keywords: ['language', 'english', 'foreign language'] },
            { id: 'music_dance', label: 'Music / Dance Academy', googlePlacesTypes: ['school'], keywords: ['music', 'dance', 'academy'] },
            { id: 'driving', label: 'Driving School', googlePlacesTypes: ['driving_school'], keywords: ['driving', 'license'] },
            { id: 'playschool', label: 'Playschool / Daycare', googlePlacesTypes: ['school'], keywords: ['playschool', 'preschool', 'daycare', 'creche'] },
        ]
    },
    {
        id: 'healthcare',
        label: 'Medical & Healthcare',
        iconName: 'Heart',
        industryCategory: 'healthcare',
        subCategories: [
            { id: 'clinic', label: 'Clinic / Polyclinic', googlePlacesTypes: ['doctor', 'health'], keywords: ['clinic', 'polyclinic'] },
            { id: 'hospital', label: 'Hospital', googlePlacesTypes: ['hospital'], keywords: ['hospital', 'medical center'] },
            { id: 'diagnostic', label: 'Diagnostic Lab / Pathology', googlePlacesTypes: ['health'], keywords: ['lab', 'pathology', 'diagnostic', 'blood test'] },
            { id: 'pharmacy', label: 'Pharmacy / Medical Store', googlePlacesTypes: ['pharmacy'], keywords: ['pharmacy', 'medical store', 'chemist'] },
            { id: 'dentist', label: 'Dentist / Dental Clinic', googlePlacesTypes: ['dentist'], keywords: ['dentist', 'dental', 'teeth'] },
            { id: 'eye', label: 'Eye Clinic / Optician', googlePlacesTypes: ['doctor'], keywords: ['eye', 'optician', 'ophthalmology'] },
            { id: 'physio', label: 'Physiotherapy / Rehab', googlePlacesTypes: ['physiotherapist'], keywords: ['physio', 'physiotherapy', 'rehab'] },
            { id: 'ayurveda', label: 'Ayurveda / Homeopathy', googlePlacesTypes: ['doctor', 'health'], keywords: ['ayurveda', 'homeopathy', 'alternative'] },
            { id: 'ivf', label: 'IVF / Fertility Clinic', googlePlacesTypes: ['doctor', 'hospital'], keywords: ['ivf', 'fertility', 'infertility'] },
            { id: 'veterinary', label: 'Veterinary / Pet Clinic', googlePlacesTypes: ['veterinary_care'], keywords: ['vet', 'veterinary', 'pet clinic'] },
            { id: 'home_health', label: 'Home Healthcare', googlePlacesTypes: ['health'], keywords: ['home healthcare', 'nursing', 'caregiver'] },
            { id: 'mental_health', label: 'Mental Health / Therapy', googlePlacesTypes: ['doctor', 'health'], keywords: ['mental health', 'psychology', 'therapy', 'counseling'] },
        ]
    },
    {
        id: 'professional',
        label: 'Professional Services',
        iconName: 'Briefcase',
        industryCategory: 'services',
        subCategories: [
            { id: 'real_estate_agent', label: 'Real Estate Agent / Broker', googlePlacesTypes: ['real_estate_agency'], keywords: ['real estate', 'property', 'broker'] },
            { id: 'property_developer', label: 'Property Developer / Builder', googlePlacesTypes: ['real_estate_agency'], keywords: ['builder', 'developer', 'construction'] },
            { id: 'lawyer', label: 'Law Firm / Advocate', googlePlacesTypes: ['lawyer'], keywords: ['lawyer', 'advocate', 'legal', 'law firm'] },
            { id: 'architect', label: 'Architect / Interior Designer', googlePlacesTypes: ['general_contractor'], keywords: ['architect', 'interior', 'design'] },
            { id: 'hr_recruitment', label: 'HR / Recruitment Agency', googlePlacesTypes: ['employment_agency'], keywords: ['hr', 'recruitment', 'staffing', 'placement'] },
            { id: 'marketing', label: 'Marketing / Digital Agency', googlePlacesTypes: ['marketing_agency'], keywords: ['marketing', 'digital', 'advertising', 'seo'] },
            { id: 'it_services', label: 'IT Services / Software Company', googlePlacesTypes: ['point_of_interest'], keywords: ['it', 'software', 'tech', 'development'] },
            { id: 'accounting', label: 'Accounting / Bookkeeping', googlePlacesTypes: ['accounting'], keywords: ['accounting', 'bookkeeping', 'audit'] },
            { id: 'consultant', label: 'Management Consultant', googlePlacesTypes: ['point_of_interest'], keywords: ['consultant', 'consulting', 'management'] },
            { id: 'pr', label: 'PR / Communications Agency', googlePlacesTypes: ['point_of_interest'], keywords: ['pr', 'public relations', 'communications'] },
            { id: 'translation', label: 'Translation / Documentation', googlePlacesTypes: ['point_of_interest'], keywords: ['translation', 'documentation', 'notary'] },
            { id: 'notary', label: 'Notary / Registration Services', googlePlacesTypes: ['point_of_interest'], keywords: ['notary', 'registration', 'stamp'] },
        ]
    },
    {
        id: 'retail',
        label: 'Retail & Shopping',
        iconName: 'ShoppingBag',
        industryCategory: 'retail',
        subCategories: [
            { id: 'ecommerce', label: 'E-commerce / D2C Brand', googlePlacesTypes: ['store'], keywords: ['ecommerce', 'd2c', 'online store'] },
            { id: 'fashion', label: 'Fashion / Clothing Store', googlePlacesTypes: ['clothing_store'], keywords: ['fashion', 'clothing', 'apparel'] },
            { id: 'electronics', label: 'Electronics / Gadgets', googlePlacesTypes: ['electronics_store'], keywords: ['electronics', 'mobile', 'gadgets'] },
            { id: 'jewelry', label: 'Jewelry / Watches', googlePlacesTypes: ['jewelry_store'], keywords: ['jewelry', 'jewellery', 'watches', 'gold'] },
            { id: 'furniture', label: 'Furniture / Home Decor', googlePlacesTypes: ['furniture_store', 'home_goods_store'], keywords: ['furniture', 'home decor', 'interior'] },
            { id: 'grocery', label: 'Grocery / Supermarket', googlePlacesTypes: ['supermarket', 'grocery_or_supermarket'], keywords: ['grocery', 'supermarket', 'kirana'] },
            { id: 'pharmacy_retail', label: 'Pharmacy / Health Products', googlePlacesTypes: ['pharmacy'], keywords: ['pharmacy', 'health products'] },
            { id: 'books', label: 'Books / Stationery', googlePlacesTypes: ['book_store'], keywords: ['books', 'stationery', 'bookstore'] },
            { id: 'sports', label: 'Sports / Fitness Equipment', googlePlacesTypes: ['store'], keywords: ['sports', 'fitness', 'equipment'] },
            { id: 'baby', label: 'Baby / Kids Products', googlePlacesTypes: ['store'], keywords: ['baby', 'kids', 'children'] },
            { id: 'pet_supplies', label: 'Pet Supplies', googlePlacesTypes: ['pet_store'], keywords: ['pet', 'pet supplies', 'pet shop'] },
            { id: 'wholesale', label: 'Wholesale / B2B Distributor', googlePlacesTypes: ['store'], keywords: ['wholesale', 'b2b', 'distributor'] },
        ]
    },
    {
        id: 'restaurant',
        label: 'Restaurant & Dining',
        iconName: 'UtensilsCrossed',
        industryCategory: 'food_beverage',
        subCategories: [
            { id: 'fine_dining', label: 'Fine Dining Restaurant', googlePlacesTypes: ['restaurant'], keywords: ['fine dining', 'upscale', 'gourmet'] },
            { id: 'casual_dining', label: 'Casual Dining / Family Restaurant', googlePlacesTypes: ['restaurant'], keywords: ['casual dining', 'family restaurant'] },
            { id: 'qsr', label: 'Quick Service Restaurant (QSR)', googlePlacesTypes: ['restaurant', 'meal_takeaway'], keywords: ['qsr', 'fast food', 'quick service'] },
            { id: 'cloud_kitchen', label: 'Cloud Kitchen / Delivery Only', googlePlacesTypes: ['meal_delivery', 'restaurant'], keywords: ['cloud kitchen', 'delivery', 'ghost kitchen'] },
            { id: 'cafe', label: 'Cafe / Coffee Shop', googlePlacesTypes: ['cafe'], keywords: ['cafe', 'coffee', 'coffee shop'] },
            { id: 'bakery', label: 'Bakery / Confectionery', googlePlacesTypes: ['bakery'], keywords: ['bakery', 'cakes', 'confectionery'] },
            { id: 'dessert', label: 'Ice Cream / Dessert Parlor', googlePlacesTypes: ['restaurant', 'food'], keywords: ['ice cream', 'dessert', 'sweet'] },
            { id: 'food_truck', label: 'Food Truck / Street Food', googlePlacesTypes: ['restaurant', 'food'], keywords: ['food truck', 'street food'] },
            { id: 'bar', label: 'Bar / Pub / Brewery', googlePlacesTypes: ['bar', 'night_club'], keywords: ['bar', 'pub', 'brewery', 'lounge'] },
            { id: 'catering', label: 'Catering Service', googlePlacesTypes: ['meal_delivery', 'restaurant'], keywords: ['catering', 'event catering'] },
        ]
    },
    {
        id: 'food_grocery',
        label: 'Food & Grocery',
        iconName: 'ShoppingCart',
        industryCategory: 'retail',
        subCategories: [
            { id: 'grocery_delivery', label: 'Grocery Delivery / Kirana', googlePlacesTypes: ['grocery_or_supermarket', 'convenience_store'], keywords: ['grocery', 'kirana', 'delivery'] },
            { id: 'organic', label: 'Organic / Health Food Store', googlePlacesTypes: ['grocery_or_supermarket', 'health'], keywords: ['organic', 'health food', 'natural'] },
            { id: 'meat_fish', label: 'Meat / Fish / Poultry Shop', googlePlacesTypes: ['food'], keywords: ['meat', 'fish', 'poultry', 'butcher'] },
            { id: 'dairy', label: 'Dairy / Milk Delivery', googlePlacesTypes: ['food'], keywords: ['dairy', 'milk', 'paneer'] },
            { id: 'fruits_veg', label: 'Fruit / Vegetable Vendor', googlePlacesTypes: ['food'], keywords: ['fruits', 'vegetables', 'sabzi'] },
            { id: 'dry_fruits', label: 'Dry Fruits / Spices', googlePlacesTypes: ['food'], keywords: ['dry fruits', 'spices', 'masala'] },
            { id: 'bakery_supplies', label: 'Bakery Supplies / Ingredients', googlePlacesTypes: ['food'], keywords: ['baking', 'ingredients', 'supplies'] },
            { id: 'tiffin', label: 'Tiffin / Meal Subscription', googlePlacesTypes: ['meal_delivery'], keywords: ['tiffin', 'meal', 'subscription', 'dabba'] },
            { id: 'water', label: 'Water / Beverage Delivery', googlePlacesTypes: ['food'], keywords: ['water', 'beverage', 'can'] },
            { id: 'farm', label: 'Farm / Agricultural Products', googlePlacesTypes: ['food'], keywords: ['farm', 'agricultural', 'farmer'] },
        ]
    },
    {
        id: 'beauty',
        label: 'Beauty, Spa & Wellness',
        iconName: 'Sparkles',
        industryCategory: 'beauty_wellness',
        subCategories: [
            { id: 'hair_salon', label: 'Hair Salon / Barbershop', googlePlacesTypes: ['hair_care', 'beauty_salon'], keywords: ['salon', 'haircut', 'barber'] },
            { id: 'beauty_salon', label: 'Beauty Salon / Parlor', googlePlacesTypes: ['beauty_salon'], keywords: ['beauty', 'parlor', 'facial'] },
            { id: 'spa', label: 'Spa / Wellness Center', googlePlacesTypes: ['spa'], keywords: ['spa', 'wellness', 'massage'] },
            { id: 'nail', label: 'Nail Art / Nail Salon', googlePlacesTypes: ['beauty_salon'], keywords: ['nail', 'manicure', 'pedicure'] },
            { id: 'skin', label: 'Skin Clinic / Dermatology', googlePlacesTypes: ['doctor', 'beauty_salon'], keywords: ['skin', 'dermatology', 'skincare'] },
            { id: 'cosmetic', label: 'Hair Transplant / Cosmetic', googlePlacesTypes: ['doctor', 'health'], keywords: ['hair transplant', 'cosmetic', 'plastic surgery'] },
            { id: 'gym', label: 'Gym / Fitness Center', googlePlacesTypes: ['gym'], keywords: ['gym', 'fitness', 'workout'] },
            { id: 'yoga', label: 'Yoga / Pilates Studio', googlePlacesTypes: ['gym'], keywords: ['yoga', 'pilates', 'meditation'] },
            { id: 'makeup_artist', label: 'Makeup Artist / Bridal', googlePlacesTypes: ['beauty_salon'], keywords: ['makeup', 'bridal', 'artist'] },
            { id: 'tattoo', label: 'Tattoo / Piercing Studio', googlePlacesTypes: ['point_of_interest'], keywords: ['tattoo', 'piercing'] },
            { id: 'wellness_retreat', label: 'Ayurvedic / Wellness Retreat', googlePlacesTypes: ['spa', 'health'], keywords: ['ayurvedic', 'retreat', 'wellness'] },
            { id: 'personal_trainer', label: 'Personal Trainer / Nutrition', googlePlacesTypes: ['gym'], keywords: ['trainer', 'nutrition', 'diet'] },
        ]
    },
    {
        id: 'automotive',
        label: 'Automotive',
        iconName: 'Car',
        industryCategory: 'automotive',
        subCategories: [
            { id: 'car_dealer_new', label: 'Car Dealership (New)', googlePlacesTypes: ['car_dealer'], keywords: ['car dealer', 'showroom', 'new car'] },
            { id: 'car_dealer_used', label: 'Used Car Dealer', googlePlacesTypes: ['car_dealer'], keywords: ['used car', 'second hand', 'pre-owned'] },
            { id: 'two_wheeler', label: 'Two-Wheeler Dealership', googlePlacesTypes: ['car_dealer'], keywords: ['bike', 'scooter', 'two wheeler'] },
            { id: 'car_service', label: 'Car Service Center', googlePlacesTypes: ['car_repair'], keywords: ['car service', 'mechanic', 'garage'] },
            { id: 'car_wash', label: 'Car Wash / Detailing', googlePlacesTypes: ['car_wash'], keywords: ['car wash', 'detailing', 'cleaning'] },
            { id: 'spare_parts', label: 'Spare Parts / Accessories', googlePlacesTypes: ['car_repair'], keywords: ['spare parts', 'accessories', 'auto parts'] },
            { id: 'tyre_battery', label: 'Tyre / Battery Shop', googlePlacesTypes: ['car_repair'], keywords: ['tyre', 'battery', 'puncture'] },
            { id: 'car_rental', label: 'Car Rental / Leasing', googlePlacesTypes: ['car_rental'], keywords: ['car rental', 'leasing', 'self drive'] },
            { id: 'driving_school', label: 'Driving School', googlePlacesTypes: ['driving_school'], keywords: ['driving school', 'license'] },
            { id: 'auto_insurance', label: 'Auto Insurance Agent', googlePlacesTypes: ['insurance_agency'], keywords: ['auto insurance', 'motor insurance'] },
            { id: 'ev', label: 'EV Charging / Services', googlePlacesTypes: ['point_of_interest'], keywords: ['ev', 'electric vehicle', 'charging'] },
            { id: 'fleet', label: 'Fleet Management / Transport', googlePlacesTypes: ['point_of_interest'], keywords: ['fleet', 'transport', 'logistics'] },
        ]
    },
    {
        id: 'travel',
        label: 'Travel & Transportation',
        iconName: 'Plane',
        industryCategory: 'hospitality',
        subCategories: [
            { id: 'travel_agent', label: 'Travel Agent / Tour Operator', googlePlacesTypes: ['travel_agency'], keywords: ['travel agent', 'tour', 'holiday'] },
            { id: 'visa', label: 'Visa / Immigration Consultant', googlePlacesTypes: ['travel_agency'], keywords: ['visa', 'immigration', 'passport'] },
            { id: 'passport', label: 'Passport / Documentation Services', googlePlacesTypes: ['point_of_interest'], keywords: ['passport', 'documentation'] },
            { id: 'flight_train', label: 'Flight / Train Booking Agent', googlePlacesTypes: ['travel_agency'], keywords: ['flight', 'train', 'booking'] },
            { id: 'cab', label: 'Cab / Taxi Service', googlePlacesTypes: ['taxi_stand'], keywords: ['cab', 'taxi', 'ola', 'uber'] },
            { id: 'bus', label: 'Bus Operator / Travels', googlePlacesTypes: ['bus_station'], keywords: ['bus', 'travels', 'volvo'] },
            { id: 'carpool', label: 'Car Pool / Ride Sharing', googlePlacesTypes: ['point_of_interest'], keywords: ['carpool', 'ride sharing'] },
            { id: 'logistics', label: 'Logistics / Courier', googlePlacesTypes: ['point_of_interest'], keywords: ['logistics', 'courier', 'shipping'] },
            { id: 'packers', label: 'Packers and Movers', googlePlacesTypes: ['moving_company'], keywords: ['packers', 'movers', 'relocation'] },
            { id: 'airport_transfer', label: 'Airport Transfers / Chauffeur', googlePlacesTypes: ['taxi_stand'], keywords: ['airport', 'transfer', 'chauffeur'] },
            { id: 'cruise', label: 'Cruise / Luxury Travel', googlePlacesTypes: ['travel_agency'], keywords: ['cruise', 'luxury', 'yacht'] },
            { id: 'adventure', label: 'Adventure / Trekking Tours', googlePlacesTypes: ['travel_agency'], keywords: ['adventure', 'trekking', 'camping'] },
        ]
    },
    {
        id: 'hotel',
        label: 'Hotel & Lodging',
        iconName: 'Building',
        industryCategory: 'hospitality',
        subCategories: [
            { id: 'hotel_resort', label: 'Hotel / Resort', googlePlacesTypes: ['hotel', 'resort', 'lodging'], keywords: ['hotel', 'resort', '5 star'] },
            { id: 'budget_hotel', label: 'Budget Hotel / Lodge', googlePlacesTypes: ['lodging'], keywords: ['budget', 'lodge', 'affordable'] },
            { id: 'boutique', label: 'Boutique Hotel / B&B', googlePlacesTypes: ['lodging'], keywords: ['boutique', 'b&b', 'bed and breakfast'] },
            { id: 'service_apt', label: 'Service Apartment / Homestay', googlePlacesTypes: ['lodging'], keywords: ['service apartment', 'homestay', 'airbnb'] },
            { id: 'pg_hostel', label: 'PG / Hostel', googlePlacesTypes: ['lodging'], keywords: ['pg', 'hostel', 'paying guest'] },
            { id: 'villa', label: 'Villa / Holiday Home Rental', googlePlacesTypes: ['lodging'], keywords: ['villa', 'holiday home', 'vacation rental'] },
            { id: 'guest_house', label: 'Dharamshala / Guest House', googlePlacesTypes: ['guest_house', 'lodging'], keywords: ['dharamshala', 'guest house'] },
            { id: 'camping', label: 'Camping / Glamping', googlePlacesTypes: ['campground', 'lodging'], keywords: ['camping', 'glamping', 'tent'] },
            { id: 'corporate_guest', label: 'Corporate Guest House', googlePlacesTypes: ['lodging'], keywords: ['corporate', 'guest house'] },
            { id: 'wedding_venue', label: 'Wedding / Event Venue', googlePlacesTypes: ['event_venue', 'lodging'], keywords: ['wedding', 'event', 'venue', 'banquet'] },
        ]
    },
    {
        id: 'events',
        label: 'Events & Entertainment',
        iconName: 'PartyPopper',
        industryCategory: 'services',
        subCategories: [
            { id: 'wedding_planner', label: 'Wedding Planner', googlePlacesTypes: ['point_of_interest'], keywords: ['wedding planner', 'wedding'] },
            { id: 'event_mgmt', label: 'Event Management Company', googlePlacesTypes: ['point_of_interest'], keywords: ['event', 'management', 'corporate event'] },
            { id: 'party_planner', label: 'Party / Birthday Planner', googlePlacesTypes: ['point_of_interest'], keywords: ['party', 'birthday', 'celebration'] },
            { id: 'photographer', label: 'Photographer / Videographer', googlePlacesTypes: ['point_of_interest'], keywords: ['photographer', 'videographer', 'photo'] },
            { id: 'decorator', label: 'Decorator / Florist', googlePlacesTypes: ['florist'], keywords: ['decorator', 'florist', 'flowers'] },
            { id: 'dj', label: 'DJ / Live Band / Artist', googlePlacesTypes: ['point_of_interest'], keywords: ['dj', 'band', 'music', 'artist'] },
            { id: 'caterer', label: 'Caterer / Food Service', googlePlacesTypes: ['meal_delivery', 'restaurant'], keywords: ['caterer', 'catering', 'food'] },
            { id: 'tent_house', label: 'Tent House / Rental', googlePlacesTypes: ['point_of_interest'], keywords: ['tent', 'rental', 'pandal'] },
            { id: 'invitation', label: 'Invitation / Printing', googlePlacesTypes: ['point_of_interest'], keywords: ['invitation', 'printing', 'cards'] },
            { id: 'mehendi', label: 'Mehendi / Makeup Artist', googlePlacesTypes: ['beauty_salon'], keywords: ['mehendi', 'makeup', 'henna'] },
            { id: 'anchor', label: 'Anchor / Emcee', googlePlacesTypes: ['point_of_interest'], keywords: ['anchor', 'emcee', 'host'] },
            { id: 'movie_theater', label: 'Movie Theater / Multiplex', googlePlacesTypes: ['movie_theater'], keywords: ['movie', 'cinema', 'multiplex'] },
        ]
    },
    {
        id: 'home_services',
        label: 'Home Services',
        iconName: 'Wrench',
        industryCategory: 'services',
        subCategories: [
            { id: 'plumber', label: 'Plumber / Electrician', googlePlacesTypes: ['plumber', 'electrician'], keywords: ['plumber', 'electrician', 'plumbing'] },
            { id: 'ac_repair', label: 'AC / Appliance Repair', googlePlacesTypes: ['point_of_interest'], keywords: ['ac', 'appliance', 'repair'] },
            { id: 'carpenter', label: 'Carpenter / Furniture Repair', googlePlacesTypes: ['point_of_interest'], keywords: ['carpenter', 'furniture', 'woodwork'] },
            { id: 'painter', label: 'Painter / Renovation', googlePlacesTypes: ['painter'], keywords: ['painter', 'painting', 'renovation'] },
            { id: 'pest_control', label: 'Pest Control', googlePlacesTypes: ['point_of_interest'], keywords: ['pest control', 'termite', 'cockroach'] },
            { id: 'cleaning', label: 'Home Cleaning / Deep Cleaning', googlePlacesTypes: ['point_of_interest'], keywords: ['cleaning', 'deep cleaning', 'housekeeping'] },
            { id: 'laundry', label: 'Laundry / Dry Cleaning', googlePlacesTypes: ['laundry'], keywords: ['laundry', 'dry cleaning', 'ironing'] },
            { id: 'security', label: 'Security / CCTV Installation', googlePlacesTypes: ['point_of_interest'], keywords: ['security', 'cctv', 'surveillance'] },
            { id: 'interior', label: 'Interior Design / Decoration', googlePlacesTypes: ['point_of_interest'], keywords: ['interior', 'design', 'decoration'] },
            { id: 'gardening', label: 'Gardening / Landscaping', googlePlacesTypes: ['point_of_interest'], keywords: ['gardening', 'landscaping', 'lawn'] },
            { id: 'solar', label: 'Solar / Renewable Energy', googlePlacesTypes: ['point_of_interest'], keywords: ['solar', 'renewable', 'energy'] },
            { id: 'smart_home', label: 'Home Automation / Smart Home', googlePlacesTypes: ['point_of_interest'], keywords: ['smart home', 'automation', 'iot'] },
        ]
    },
    {
        id: 'other',
        label: 'Other',
        iconName: 'MoreHorizontal',
        industryCategory: 'other',
        subCategories: [
            { id: 'ngo', label: 'NGO / Charitable Trust', googlePlacesTypes: ['point_of_interest'], keywords: ['ngo', 'charity', 'foundation'] },
            { id: 'religious', label: 'Religious Organization', googlePlacesTypes: ['church', 'hindu_temple', 'mosque'], keywords: ['temple', 'church', 'mosque', 'gurudwara'] },
            { id: 'govt', label: 'Government Office', googlePlacesTypes: ['local_government_office'], keywords: ['government', 'govt', 'office'] },
            { id: 'utility', label: 'Utility Provider', googlePlacesTypes: ['point_of_interest'], keywords: ['electricity', 'water', 'utility'] },
            { id: 'community', label: 'Community Association', googlePlacesTypes: ['point_of_interest'], keywords: ['community', 'association', 'society'] },
        ]
    },
];

/**
 * Get all Google Places types mapped in our categories
 */
export function getAllGooglePlacesTypes(): string[] {
    const types = new Set<string>();
    BUSINESS_CATEGORIES.forEach(cat => {
        cat.subCategories.forEach(sub => {
            sub.googlePlacesTypes.forEach(t => types.add(t));
        });
    });
    return Array.from(types);
}

/**
 * Find matching sub-categories for a Google Places type
 */
export function findCategoriesForGoogleType(googleType: string): { category: BusinessCategory; subCategory: SubCategory }[] {
    const matches: { category: BusinessCategory; subCategory: SubCategory }[] = [];

    BUSINESS_CATEGORIES.forEach(cat => {
        cat.subCategories.forEach(sub => {
            if (sub.googlePlacesTypes.includes(googleType)) {
                matches.push({ category: cat, subCategory: sub });
            }
        });
    });

    return matches;
}

/**
 * Find category by sub-category ID
 */
export function findCategoryBySubId(subCategoryId: string): { category: BusinessCategory; subCategory: SubCategory } | null {
    for (const cat of BUSINESS_CATEGORIES) {
        const sub = cat.subCategories.find(s => s.id === subCategoryId);
        if (sub) {
            return { category: cat, subCategory: sub };
        }
    }
    return null;
}

/**
 * Convert selected sub-categories to stored format
 */
export function toSelectedCategories(subCategoryIds: string[]): SelectedBusinessCategory[] {
    return subCategoryIds.map(id => {
        const found = findCategoryBySubId(id);
        if (!found) return null;
        return {
            mainCategoryId: found.category.id,
            subCategoryId: found.subCategory.id,
            label: found.subCategory.label,
            googlePlacesTypes: found.subCategory.googlePlacesTypes,
        };
    }).filter(Boolean) as SelectedBusinessCategory[];
}
