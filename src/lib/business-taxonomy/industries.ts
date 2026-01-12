/**
 * Global Industries & Business Functions
 * 
 * This is the country-agnostic base taxonomy.
 * Country-specific labels are applied via overrides.
 */

import { Industry, BusinessFunction, Specialization } from './types';

/**
 * 14 Global Industries
 */
export const INDUSTRIES: Industry[] = [
    { industryId: 'financial_services', name: 'Financial Services', iconName: 'Landmark', description: 'Banking, lending, insurance, and financial advisory' },
    { industryId: 'education_learning', name: 'Education & Learning', iconName: 'GraduationCap', description: 'Schools, training, and educational services' },
    { industryId: 'healthcare_medical', name: 'Healthcare & Medical Services', iconName: 'Heart', description: 'Medical care, diagnostics, and health services' },
    { industryId: 'business_professional', name: 'Business & Professional Services', iconName: 'Briefcase', description: 'Consulting, legal, IT, and business services' },
    { industryId: 'retail_commerce', name: 'Retail & Commerce', iconName: 'ShoppingBag', description: 'Physical and online retail stores' },
    { industryId: 'food_beverage', name: 'Food & Beverage (F&B)', iconName: 'UtensilsCrossed', description: 'Restaurants, cafes, and food service' },
    { industryId: 'food_supply', name: 'Food Supply & Distribution', iconName: 'ShoppingCart', description: 'Grocery, produce, and food wholesale' },
    { industryId: 'personal_wellness', name: 'Personal Care & Wellness', iconName: 'Sparkles', description: 'Beauty, fitness, and wellness services' },
    { industryId: 'automotive_mobility', name: 'Automotive & Mobility', iconName: 'Car', description: 'Vehicle sales, service, and mobility' },
    { industryId: 'travel_transport', name: 'Travel, Transport & Logistics', iconName: 'Plane', description: 'Travel agencies, transport, and logistics' },
    { industryId: 'hospitality', name: 'Hospitality & Accommodation', iconName: 'Building', description: 'Hotels, lodging, and hospitality' },
    { industryId: 'events_entertainment', name: 'Events, Media & Entertainment', iconName: 'PartyPopper', description: 'Event planning, media, and entertainment' },
    { industryId: 'home_property', name: 'Home & Property Services', iconName: 'Wrench', description: 'Home maintenance and property services' },
    { industryId: 'public_nonprofit', name: 'Public, Non-Profit & Utilities', iconName: 'MoreHorizontal', description: 'Government, NGOs, and public services' },
];

/**
 * Business Functions organized by Industry
 */
export const BUSINESS_FUNCTIONS: BusinessFunction[] = [
    // ==========================================
    // 1. FINANCIAL SERVICES
    // ==========================================
    { functionId: 'retail_banking', industryId: 'financial_services', name: 'Retail Banking', googlePlacesTypes: ['bank'], keywords: ['bank', 'savings', 'checking'] },
    { functionId: 'alternative_lending', industryId: 'financial_services', name: 'Alternative Lending / Non-Bank Lending', googlePlacesTypes: ['finance'], keywords: ['nbfc', 'microfinance', 'lending'] },
    { functionId: 'consumer_lending', industryId: 'financial_services', name: 'Consumer Lending', googlePlacesTypes: ['finance', 'bank'], keywords: ['loan', 'personal loan', 'consumer'] },
    { functionId: 'commercial_lending', industryId: 'financial_services', name: 'Commercial Lending', googlePlacesTypes: ['finance', 'bank'], keywords: ['business loan', 'commercial'] },
    { functionId: 'payments_processing', industryId: 'financial_services', name: 'Payments & Processing', googlePlacesTypes: ['finance'], keywords: ['payment', 'processing', 'gateway'] },
    { functionId: 'wealth_management', industryId: 'financial_services', name: 'Wealth & Asset Management', googlePlacesTypes: ['finance'], keywords: ['wealth', 'asset', 'investment', 'portfolio'] },
    { functionId: 'insurance_brokerage', industryId: 'financial_services', name: 'Insurance Brokerage', googlePlacesTypes: ['insurance_agency'], keywords: ['insurance', 'broker', 'policy'] },
    { functionId: 'accounting_tax', industryId: 'financial_services', name: 'Accounting & Tax Advisory', googlePlacesTypes: ['accounting'], keywords: ['accountant', 'tax', 'audit', 'bookkeeping'] },
    { functionId: 'investment_trading', industryId: 'financial_services', name: 'Investment & Trading Services', googlePlacesTypes: ['finance'], keywords: ['stock', 'trading', 'securities'] },
    { functionId: 'forex_remittance', industryId: 'financial_services', name: 'Foreign Exchange & Remittance', googlePlacesTypes: ['finance'], keywords: ['forex', 'currency', 'remittance', 'exchange'] },
    { functionId: 'credit_debt', industryId: 'financial_services', name: 'Credit Advisory & Debt Services', googlePlacesTypes: ['finance'], keywords: ['credit', 'debt', 'collection', 'recovery'] },
    { functionId: 'fintech', industryId: 'financial_services', name: 'Financial Technology (Fintech)', googlePlacesTypes: ['finance'], keywords: ['fintech', 'digital', 'neobank'] },
    { functionId: 'community_savings', industryId: 'financial_services', name: 'Community Savings Groups', googlePlacesTypes: ['finance'], keywords: ['savings', 'community', 'cooperative'] },

    // ==========================================
    // 2. EDUCATION & LEARNING
    // ==========================================
    { functionId: 'early_childhood', industryId: 'education_learning', name: 'Early Childhood Education', googlePlacesTypes: ['school'], keywords: ['preschool', 'daycare', 'kindergarten', 'playschool'] },
    { functionId: 'k12_education', industryId: 'education_learning', name: 'K–12 Education', googlePlacesTypes: ['school', 'primary_school', 'secondary_school'], keywords: ['school', 'high school', 'elementary'] },
    { functionId: 'higher_education', industryId: 'education_learning', name: 'Higher Education', googlePlacesTypes: ['university'], keywords: ['college', 'university', 'degree'] },
    { functionId: 'test_preparation', industryId: 'education_learning', name: 'Test Preparation', googlePlacesTypes: ['school'], keywords: ['test prep', 'exam', 'coaching'] },
    { functionId: 'language_learning', industryId: 'education_learning', name: 'Language Learning', googlePlacesTypes: ['school'], keywords: ['language', 'english', 'foreign language'] },
    { functionId: 'skill_vocational', industryId: 'education_learning', name: 'Skill Development & Vocational Training', googlePlacesTypes: ['school'], keywords: ['skill', 'vocational', 'training', 'certification'] },
    { functionId: 'corporate_training', industryId: 'education_learning', name: 'Corporate Training', googlePlacesTypes: ['school'], keywords: ['corporate', 'professional development', 'training'] },
    { functionId: 'online_learning', industryId: 'education_learning', name: 'Online Learning Platform', googlePlacesTypes: ['point_of_interest'], keywords: ['online', 'e-learning', 'edtech', 'course'] },
    { functionId: 'academic_counseling', industryId: 'education_learning', name: 'Academic Consulting & Counseling', googlePlacesTypes: ['school'], keywords: ['counseling', 'study abroad', 'admission'] },
    { functionId: 'creative_arts', industryId: 'education_learning', name: 'Creative Arts Education', googlePlacesTypes: ['school'], keywords: ['music', 'dance', 'art', 'drama'] },

    // ==========================================
    // 3. HEALTHCARE & MEDICAL SERVICES
    // ==========================================
    { functionId: 'primary_care', industryId: 'healthcare_medical', name: 'Primary Care Clinics', googlePlacesTypes: ['doctor', 'health'], keywords: ['clinic', 'doctor', 'physician', 'gp'] },
    { functionId: 'hospitals', industryId: 'healthcare_medical', name: 'Hospitals & Medical Centers', googlePlacesTypes: ['hospital'], keywords: ['hospital', 'medical center'] },
    { functionId: 'diagnostic_imaging', industryId: 'healthcare_medical', name: 'Diagnostic & Imaging Services', googlePlacesTypes: ['health'], keywords: ['diagnostic', 'lab', 'imaging', 'pathology', 'x-ray'] },
    { functionId: 'pharmacy_retail', industryId: 'healthcare_medical', name: 'Pharmacy & Medical Retail', googlePlacesTypes: ['pharmacy'], keywords: ['pharmacy', 'chemist', 'drugstore'] },
    { functionId: 'dental_care', industryId: 'healthcare_medical', name: 'Dental Care', googlePlacesTypes: ['dentist'], keywords: ['dentist', 'dental', 'orthodontist'] },
    { functionId: 'vision_care', industryId: 'healthcare_medical', name: 'Vision & Eye Care', googlePlacesTypes: ['doctor'], keywords: ['eye', 'optician', 'ophthalmology', 'optometrist'] },
    { functionId: 'mental_health', industryId: 'healthcare_medical', name: 'Mental Health Services', googlePlacesTypes: ['doctor', 'health'], keywords: ['mental health', 'psychology', 'therapy', 'counseling', 'psychiatrist'] },
    { functionId: 'physical_therapy', industryId: 'healthcare_medical', name: 'Physical Therapy & Rehabilitation', googlePlacesTypes: ['physiotherapist'], keywords: ['physio', 'physiotherapy', 'rehab', 'physical therapy'] },
    { functionId: 'alternative_medicine', industryId: 'healthcare_medical', name: 'Alternative & Traditional Medicine', googlePlacesTypes: ['doctor', 'health'], keywords: ['alternative', 'traditional', 'holistic', 'naturopathy'] },
    { functionId: 'home_healthcare', industryId: 'healthcare_medical', name: 'Home Healthcare', googlePlacesTypes: ['health'], keywords: ['home health', 'nursing', 'caregiver', 'home care'] },
    { functionId: 'veterinary', industryId: 'healthcare_medical', name: 'Veterinary Services', googlePlacesTypes: ['veterinary_care'], keywords: ['vet', 'veterinary', 'animal', 'pet clinic'] },

    // ==========================================
    // 4. BUSINESS & PROFESSIONAL SERVICES
    // ==========================================
    { functionId: 'real_estate', industryId: 'business_professional', name: 'Real Estate Services', googlePlacesTypes: ['real_estate_agency'], keywords: ['real estate', 'property', 'broker', 'agent'] },
    { functionId: 'construction_dev', industryId: 'business_professional', name: 'Construction & Property Development', googlePlacesTypes: ['general_contractor'], keywords: ['builder', 'developer', 'construction'] },
    { functionId: 'legal_services', industryId: 'business_professional', name: 'Legal Services', googlePlacesTypes: ['lawyer'], keywords: ['lawyer', 'attorney', 'legal', 'advocate', 'law firm'] },
    { functionId: 'architecture_design', industryId: 'business_professional', name: 'Architecture & Design', googlePlacesTypes: ['general_contractor'], keywords: ['architect', 'interior', 'design'] },
    { functionId: 'hr_recruitment', industryId: 'business_professional', name: 'Human Resources & Recruitment', googlePlacesTypes: ['employment_agency'], keywords: ['hr', 'recruitment', 'staffing', 'hiring'] },
    { functionId: 'marketing_advertising', industryId: 'business_professional', name: 'Marketing & Advertising', googlePlacesTypes: ['marketing_agency'], keywords: ['marketing', 'advertising', 'digital', 'agency'] },
    { functionId: 'software_it', industryId: 'business_professional', name: 'Software & IT Services', googlePlacesTypes: ['point_of_interest'], keywords: ['software', 'it', 'tech', 'development', 'saas'] },
    { functionId: 'consulting_advisory', industryId: 'business_professional', name: 'Consulting & Advisory', googlePlacesTypes: ['point_of_interest'], keywords: ['consultant', 'consulting', 'advisory', 'management'] },
    { functionId: 'pr_communications', industryId: 'business_professional', name: 'Public Relations & Communications', googlePlacesTypes: ['point_of_interest'], keywords: ['pr', 'public relations', 'communications', 'media'] },
    { functionId: 'translation_docs', industryId: 'business_professional', name: 'Translation & Documentation', googlePlacesTypes: ['point_of_interest'], keywords: ['translation', 'documentation', 'interpreter'] },
    { functionId: 'notary_compliance', industryId: 'business_professional', name: 'Notary & Compliance Services', googlePlacesTypes: ['point_of_interest'], keywords: ['notary', 'compliance', 'registration'] },

    // ==========================================
    // 5. RETAIL & COMMERCE
    // ==========================================
    { functionId: 'physical_retail', industryId: 'retail_commerce', name: 'Physical Retail Store', googlePlacesTypes: ['store'], keywords: ['store', 'shop', 'retail'] },
    { functionId: 'ecommerce_d2c', industryId: 'retail_commerce', name: 'E-commerce / D2C Brand', googlePlacesTypes: ['store'], keywords: ['ecommerce', 'd2c', 'online store'] },
    { functionId: 'fashion_apparel', industryId: 'retail_commerce', name: 'Fashion & Apparel', googlePlacesTypes: ['clothing_store'], keywords: ['fashion', 'clothing', 'apparel'] },
    { functionId: 'electronics_gadgets', industryId: 'retail_commerce', name: 'Electronics & Gadgets', googlePlacesTypes: ['electronics_store'], keywords: ['electronics', 'mobile', 'gadgets', 'computer'] },
    { functionId: 'jewelry_luxury', industryId: 'retail_commerce', name: 'Jewelry & Luxury Goods', googlePlacesTypes: ['jewelry_store'], keywords: ['jewelry', 'luxury', 'watches', 'gold'] },
    { functionId: 'furniture_home', industryId: 'retail_commerce', name: 'Furniture & Home Goods', googlePlacesTypes: ['furniture_store', 'home_goods_store'], keywords: ['furniture', 'home decor', 'interior'] },
    { functionId: 'grocery_convenience', industryId: 'retail_commerce', name: 'Grocery & Convenience Retail', googlePlacesTypes: ['supermarket', 'grocery_or_supermarket', 'convenience_store'], keywords: ['grocery', 'supermarket', 'convenience'] },
    { functionId: 'health_wellness_retail', industryId: 'retail_commerce', name: 'Health & Wellness Retail', googlePlacesTypes: ['pharmacy', 'store'], keywords: ['health', 'wellness', 'supplements'] },
    { functionId: 'books_stationery', industryId: 'retail_commerce', name: 'Books & Stationery', googlePlacesTypes: ['book_store'], keywords: ['books', 'stationery', 'bookstore'] },
    { functionId: 'sports_outdoor', industryId: 'retail_commerce', name: 'Sports & Outdoor Goods', googlePlacesTypes: ['store'], keywords: ['sports', 'outdoor', 'fitness equipment'] },
    { functionId: 'baby_kids', industryId: 'retail_commerce', name: 'Baby & Kids Products', googlePlacesTypes: ['store'], keywords: ['baby', 'kids', 'children', 'toys'] },
    { functionId: 'pet_supplies', industryId: 'retail_commerce', name: 'Pet Supplies', googlePlacesTypes: ['pet_store'], keywords: ['pet', 'pet supplies', 'pet shop'] },
    { functionId: 'wholesale_distribution', industryId: 'retail_commerce', name: 'Wholesale & Distribution', googlePlacesTypes: ['store'], keywords: ['wholesale', 'b2b', 'distributor'] },

    // ==========================================
    // 6. FOOD & BEVERAGE (F&B)
    // ==========================================
    { functionId: 'full_service_restaurant', industryId: 'food_beverage', name: 'Full-Service Restaurant', googlePlacesTypes: ['restaurant'], keywords: ['restaurant', 'fine dining', 'sit-down'] },
    { functionId: 'casual_dining', industryId: 'food_beverage', name: 'Casual Dining', googlePlacesTypes: ['restaurant'], keywords: ['casual dining', 'family restaurant'] },
    { functionId: 'qsr', industryId: 'food_beverage', name: 'Quick Service Restaurant (QSR)', googlePlacesTypes: ['restaurant', 'meal_takeaway'], keywords: ['qsr', 'fast food', 'quick service'] },
    { functionId: 'beverage_cafe', industryId: 'food_beverage', name: 'Beverage-Focused (Cafe, Tea, Juice)', googlePlacesTypes: ['cafe'], keywords: ['cafe', 'coffee', 'tea', 'juice', 'beverage'] },
    { functionId: 'bakery_desserts', industryId: 'food_beverage', name: 'Bakery & Desserts', googlePlacesTypes: ['bakery'], keywords: ['bakery', 'desserts', 'cakes', 'pastry'] },
    { functionId: 'cloud_kitchen', industryId: 'food_beverage', name: 'Food Production / Cloud Kitchen', googlePlacesTypes: ['meal_delivery', 'restaurant'], keywords: ['cloud kitchen', 'ghost kitchen', 'delivery only'] },
    { functionId: 'catering_events', industryId: 'food_beverage', name: 'Catering & Events Food', googlePlacesTypes: ['meal_delivery', 'restaurant'], keywords: ['catering', 'events', 'party food'] },
    { functionId: 'bars_pubs', industryId: 'food_beverage', name: 'Bars, Pubs & Breweries', googlePlacesTypes: ['bar', 'night_club'], keywords: ['bar', 'pub', 'brewery', 'lounge'] },
    { functionId: 'street_food', industryId: 'food_beverage', name: 'Street Food & Mobile Vendors', googlePlacesTypes: ['restaurant', 'food'], keywords: ['street food', 'food truck', 'mobile'] },

    // ==========================================
    // 7. FOOD SUPPLY & DISTRIBUTION
    // ==========================================
    { functionId: 'grocery_delivery', industryId: 'food_supply', name: 'Grocery Delivery', googlePlacesTypes: ['grocery_or_supermarket', 'convenience_store'], keywords: ['grocery', 'delivery'] },
    { functionId: 'fresh_produce', industryId: 'food_supply', name: 'Fresh Produce Supply', googlePlacesTypes: ['food'], keywords: ['fruits', 'vegetables', 'produce', 'fresh'] },
    { functionId: 'meat_fish', industryId: 'food_supply', name: 'Meat, Fish & Poultry Supply', googlePlacesTypes: ['food'], keywords: ['meat', 'fish', 'poultry', 'butcher', 'seafood'] },
    { functionId: 'dairy_beverage', industryId: 'food_supply', name: 'Dairy & Beverage Distribution', googlePlacesTypes: ['food'], keywords: ['dairy', 'milk', 'beverage'] },
    { functionId: 'packaged_specialty', industryId: 'food_supply', name: 'Packaged & Specialty Foods', googlePlacesTypes: ['food'], keywords: ['packaged', 'specialty', 'gourmet'] },
    { functionId: 'organic_health_foods', industryId: 'food_supply', name: 'Organic & Health Foods', googlePlacesTypes: ['grocery_or_supermarket', 'health'], keywords: ['organic', 'health food', 'natural'] },
    { functionId: 'farm_agricultural', industryId: 'food_supply', name: 'Farm Produce & Agricultural Supply', googlePlacesTypes: ['food'], keywords: ['farm', 'agricultural', 'farmer'] },
    { functionId: 'food_wholesale', industryId: 'food_supply', name: 'Food Wholesale & B2B Supply', googlePlacesTypes: ['food'], keywords: ['wholesale', 'b2b', 'bulk'] },

    // ==========================================
    // 8. PERSONAL CARE & WELLNESS
    // ==========================================
    { functionId: 'hair_beauty', industryId: 'personal_wellness', name: 'Hair & Beauty Services', googlePlacesTypes: ['hair_care', 'beauty_salon'], keywords: ['salon', 'haircut', 'barber', 'beauty'] },
    { functionId: 'skin_aesthetic', industryId: 'personal_wellness', name: 'Skin & Aesthetic Clinics', googlePlacesTypes: ['doctor', 'beauty_salon'], keywords: ['skin', 'dermatology', 'aesthetic', 'skincare'] },
    { functionId: 'spa_wellness', industryId: 'personal_wellness', name: 'Spas & Wellness Centers', googlePlacesTypes: ['spa'], keywords: ['spa', 'wellness', 'massage', 'relaxation'] },
    { functionId: 'fitness_gym', industryId: 'personal_wellness', name: 'Fitness Centers & Gyms', googlePlacesTypes: ['gym'], keywords: ['gym', 'fitness', 'workout', 'exercise'] },
    { functionId: 'yoga_mindfulness', industryId: 'personal_wellness', name: 'Yoga & Mindfulness Studios', googlePlacesTypes: ['gym'], keywords: ['yoga', 'pilates', 'meditation', 'mindfulness'] },
    { functionId: 'personal_training', industryId: 'personal_wellness', name: 'Personal Training & Nutrition', googlePlacesTypes: ['gym'], keywords: ['trainer', 'nutrition', 'diet', 'fitness coach'] },
    { functionId: 'cosmetic_surgery', industryId: 'personal_wellness', name: 'Cosmetic & Reconstructive Services', googlePlacesTypes: ['doctor', 'health'], keywords: ['cosmetic', 'plastic surgery', 'hair transplant'] },
    { functionId: 'body_art', industryId: 'personal_wellness', name: 'Body Art & Tattoo Studios', googlePlacesTypes: ['point_of_interest'], keywords: ['tattoo', 'piercing', 'body art'] },
    { functionId: 'wellness_retreat', industryId: 'personal_wellness', name: 'Holistic & Wellness Retreats', googlePlacesTypes: ['spa', 'health'], keywords: ['retreat', 'holistic', 'wellness', 'ayurvedic'] },

    // ==========================================
    // 9. AUTOMOTIVE & MOBILITY
    // ==========================================
    { functionId: 'vehicle_sales_new', industryId: 'automotive_mobility', name: 'Vehicle Sales (New)', googlePlacesTypes: ['car_dealer'], keywords: ['car dealer', 'showroom', 'new car'] },
    { functionId: 'vehicle_sales_used', industryId: 'automotive_mobility', name: 'Vehicle Sales (Used)', googlePlacesTypes: ['car_dealer'], keywords: ['used car', 'pre-owned', 'second hand'] },
    { functionId: 'motorcycle_sales', industryId: 'automotive_mobility', name: 'Motorcycle & Two-Wheeler Sales', googlePlacesTypes: ['car_dealer'], keywords: ['motorcycle', 'bike', 'scooter', 'two wheeler'] },
    { functionId: 'vehicle_maintenance', industryId: 'automotive_mobility', name: 'Vehicle Maintenance & Repair', googlePlacesTypes: ['car_repair'], keywords: ['car service', 'mechanic', 'garage', 'repair'] },
    { functionId: 'car_wash', industryId: 'automotive_mobility', name: 'Car Wash & Detailing', googlePlacesTypes: ['car_wash'], keywords: ['car wash', 'detailing', 'cleaning'] },
    { functionId: 'auto_parts', industryId: 'automotive_mobility', name: 'Auto Parts & Accessories', googlePlacesTypes: ['car_repair'], keywords: ['spare parts', 'accessories', 'auto parts'] },
    { functionId: 'tires_batteries', industryId: 'automotive_mobility', name: 'Tires & Batteries', googlePlacesTypes: ['car_repair'], keywords: ['tyre', 'tire', 'battery', 'puncture'] },
    { functionId: 'vehicle_rental', industryId: 'automotive_mobility', name: 'Vehicle Rental & Leasing', googlePlacesTypes: ['car_rental'], keywords: ['car rental', 'leasing', 'self drive'] },
    { functionId: 'driving_education', industryId: 'automotive_mobility', name: 'Driving Education', googlePlacesTypes: ['driving_school'], keywords: ['driving school', 'license', 'learner'] },
    { functionId: 'auto_insurance', industryId: 'automotive_mobility', name: 'Auto Insurance Services', googlePlacesTypes: ['insurance_agency'], keywords: ['auto insurance', 'motor insurance', 'vehicle insurance'] },
    { functionId: 'ev_infrastructure', industryId: 'automotive_mobility', name: 'EV Infrastructure & Charging', googlePlacesTypes: ['point_of_interest'], keywords: ['ev', 'electric vehicle', 'charging', 'ev station'] },
    { functionId: 'fleet_services', industryId: 'automotive_mobility', name: 'Fleet & Mobility Services', googlePlacesTypes: ['point_of_interest'], keywords: ['fleet', 'mobility', 'transport'] },

    // ==========================================
    // 10. TRAVEL, TRANSPORT & LOGISTICS
    // ==========================================
    { functionId: 'travel_agency', industryId: 'travel_transport', name: 'Travel Agencies & Tour Operators', googlePlacesTypes: ['travel_agency'], keywords: ['travel agent', 'tour', 'holiday', 'vacation'] },
    { functionId: 'visa_immigration', industryId: 'travel_transport', name: 'Visa & Immigration Services', googlePlacesTypes: ['travel_agency'], keywords: ['visa', 'immigration', 'passport'] },
    { functionId: 'ticketing_booking', industryId: 'travel_transport', name: 'Ticketing & Booking Services', googlePlacesTypes: ['travel_agency'], keywords: ['flight', 'train', 'booking', 'ticketing'] },
    { functionId: 'taxi_ride', industryId: 'travel_transport', name: 'Taxi & Ride Services', googlePlacesTypes: ['taxi_stand'], keywords: ['taxi', 'cab', 'ride', 'ola', 'uber'] },
    { functionId: 'public_transport', industryId: 'travel_transport', name: 'Public & Private Transport Operators', googlePlacesTypes: ['bus_station'], keywords: ['bus', 'transport', 'operator'] },
    { functionId: 'logistics_courier', industryId: 'travel_transport', name: 'Logistics & Courier Services', googlePlacesTypes: ['point_of_interest'], keywords: ['logistics', 'courier', 'shipping', 'delivery'] },
    { functionId: 'moving_relocation', industryId: 'travel_transport', name: 'Moving & Relocation Services', googlePlacesTypes: ['moving_company'], keywords: ['packers', 'movers', 'relocation'] },
    { functionId: 'airport_transfer', industryId: 'travel_transport', name: 'Airport Transfers & Chauffeur', googlePlacesTypes: ['taxi_stand'], keywords: ['airport', 'transfer', 'chauffeur', 'limo'] },
    { functionId: 'luxury_adventure', industryId: 'travel_transport', name: 'Luxury & Adventure Travel', googlePlacesTypes: ['travel_agency'], keywords: ['luxury', 'adventure', 'cruise', 'trekking'] },

    // ==========================================
    // 11. HOSPITALITY & ACCOMMODATION
    // ==========================================
    { functionId: 'hotels_resorts', industryId: 'hospitality', name: 'Hotels & Resorts', googlePlacesTypes: ['hotel', 'resort', 'lodging'], keywords: ['hotel', 'resort', '5 star'] },
    { functionId: 'budget_accommodation', industryId: 'hospitality', name: 'Budget Accommodation', googlePlacesTypes: ['lodging'], keywords: ['budget', 'lodge', 'affordable', 'hostel'] },
    { functionId: 'boutique_bnb', industryId: 'hospitality', name: 'Boutique Hotels & B&Bs', googlePlacesTypes: ['lodging'], keywords: ['boutique', 'b&b', 'bed and breakfast'] },
    { functionId: 'serviced_apartments', industryId: 'hospitality', name: 'Serviced Apartments', googlePlacesTypes: ['lodging'], keywords: ['service apartment', 'furnished', 'extended stay'] },
    { functionId: 'shared_accommodation', industryId: 'hospitality', name: 'Shared Accommodation & Hostels', googlePlacesTypes: ['lodging'], keywords: ['hostel', 'shared', 'dorm'] },
    { functionId: 'vacation_rentals', industryId: 'hospitality', name: 'Vacation Rentals & Villas', googlePlacesTypes: ['lodging'], keywords: ['villa', 'vacation rental', 'airbnb', 'holiday home'] },
    { functionId: 'guest_houses', industryId: 'hospitality', name: 'Guest Houses', googlePlacesTypes: ['guest_house', 'lodging'], keywords: ['guest house', 'guesthouse'] },
    { functionId: 'camping_glamping', industryId: 'hospitality', name: 'Camping & Glamping', googlePlacesTypes: ['campground', 'lodging'], keywords: ['camping', 'glamping', 'tent'] },
    { functionId: 'corporate_housing', industryId: 'hospitality', name: 'Corporate Housing', googlePlacesTypes: ['lodging'], keywords: ['corporate', 'business travel', 'executive'] },
    { functionId: 'event_venues', industryId: 'hospitality', name: 'Event & Wedding Venues', googlePlacesTypes: ['event_venue', 'lodging'], keywords: ['wedding', 'event', 'venue', 'banquet'] },

    // ==========================================
    // 12. EVENTS, MEDIA & ENTERTAINMENT
    // ==========================================
    { functionId: 'event_planning', industryId: 'events_entertainment', name: 'Event Planning & Management', googlePlacesTypes: ['point_of_interest'], keywords: ['event', 'planner', 'management'] },
    { functionId: 'wedding_private', industryId: 'events_entertainment', name: 'Wedding & Private Events', googlePlacesTypes: ['point_of_interest'], keywords: ['wedding', 'private event', 'celebration'] },
    { functionId: 'corporate_events', industryId: 'events_entertainment', name: 'Corporate Events', googlePlacesTypes: ['point_of_interest'], keywords: ['corporate', 'conference', 'seminar'] },
    { functionId: 'photography_video', industryId: 'events_entertainment', name: 'Photography & Videography', googlePlacesTypes: ['point_of_interest'], keywords: ['photographer', 'videographer', 'photo', 'video'] },
    { functionId: 'decor_floral', industryId: 'events_entertainment', name: 'Decor & Floral Services', googlePlacesTypes: ['florist'], keywords: ['decorator', 'florist', 'flowers', 'decor'] },
    { functionId: 'live_entertainment', industryId: 'events_entertainment', name: 'Live Entertainment & Artists', googlePlacesTypes: ['point_of_interest'], keywords: ['dj', 'band', 'artist', 'musician', 'performer'] },
    { functionId: 'av_production', industryId: 'events_entertainment', name: 'Audio / Visual & Production', googlePlacesTypes: ['point_of_interest'], keywords: ['av', 'audio', 'visual', 'production', 'sound'] },
    { functionId: 'printing_invitations', industryId: 'events_entertainment', name: 'Printing & Invitations', googlePlacesTypes: ['point_of_interest'], keywords: ['printing', 'invitation', 'cards'] },
    { functionId: 'hosts_anchors', industryId: 'events_entertainment', name: 'Hosts & Anchors', googlePlacesTypes: ['point_of_interest'], keywords: ['anchor', 'emcee', 'host', 'mc'] },
    { functionId: 'cinemas_theaters', industryId: 'events_entertainment', name: 'Cinemas & Theaters', googlePlacesTypes: ['movie_theater'], keywords: ['cinema', 'movie', 'theater', 'multiplex'] },

    // ==========================================
    // 13. HOME & PROPERTY SERVICES
    // ==========================================
    { functionId: 'plumbing_electrical', industryId: 'home_property', name: 'Plumbing & Electrical Services', googlePlacesTypes: ['plumber', 'electrician'], keywords: ['plumber', 'electrician', 'plumbing', 'electrical'] },
    { functionId: 'appliance_repair', industryId: 'home_property', name: 'Appliance Repair & Maintenance', googlePlacesTypes: ['point_of_interest'], keywords: ['appliance', 'repair', 'ac', 'hvac'] },
    { functionId: 'carpentry_furniture', industryId: 'home_property', name: 'Carpentry & Furniture Services', googlePlacesTypes: ['point_of_interest'], keywords: ['carpenter', 'furniture', 'woodwork'] },
    { functionId: 'painting_renovation', industryId: 'home_property', name: 'Painting & Renovation', googlePlacesTypes: ['painter'], keywords: ['painter', 'painting', 'renovation', 'remodel'] },
    { functionId: 'pest_control', industryId: 'home_property', name: 'Pest Control', googlePlacesTypes: ['point_of_interest'], keywords: ['pest control', 'exterminator', 'termite'] },
    { functionId: 'cleaning_housekeeping', industryId: 'home_property', name: 'Cleaning & Housekeeping', googlePlacesTypes: ['point_of_interest'], keywords: ['cleaning', 'housekeeping', 'maid'] },
    { functionId: 'laundry_drycleaning', industryId: 'home_property', name: 'Laundry & Dry Cleaning', googlePlacesTypes: ['laundry'], keywords: ['laundry', 'dry cleaning', 'ironing'] },
    { functionId: 'security_surveillance', industryId: 'home_property', name: 'Security & Surveillance', googlePlacesTypes: ['point_of_interest'], keywords: ['security', 'cctv', 'surveillance', 'guard'] },
    { functionId: 'landscaping_gardening', industryId: 'home_property', name: 'Landscaping & Gardening', googlePlacesTypes: ['point_of_interest'], keywords: ['landscaping', 'gardening', 'lawn', 'garden'] },
    { functionId: 'solar_renewable', industryId: 'home_property', name: 'Solar & Renewable Energy', googlePlacesTypes: ['point_of_interest'], keywords: ['solar', 'renewable', 'energy', 'green'] },
    { functionId: 'home_automation', industryId: 'home_property', name: 'Home Automation & Smart Systems', googlePlacesTypes: ['point_of_interest'], keywords: ['smart home', 'automation', 'iot'] },

    // ==========================================
    // 14. PUBLIC, NON-PROFIT & UTILITIES
    // ==========================================
    { functionId: 'government', industryId: 'public_nonprofit', name: 'Government Offices', googlePlacesTypes: ['local_government_office'], keywords: ['government', 'govt', 'municipal'] },
    { functionId: 'ngo_nonprofit', industryId: 'public_nonprofit', name: 'NGOs & Non-Profits', googlePlacesTypes: ['point_of_interest'], keywords: ['ngo', 'charity', 'foundation', 'nonprofit'] },
    { functionId: 'religious', industryId: 'public_nonprofit', name: 'Religious Organizations', googlePlacesTypes: ['church', 'hindu_temple', 'mosque', 'synagogue'], keywords: ['temple', 'church', 'mosque', 'religious'] },
    { functionId: 'community_association', industryId: 'public_nonprofit', name: 'Community Associations', googlePlacesTypes: ['point_of_interest'], keywords: ['community', 'association', 'society', 'club'] },
    { functionId: 'utilities', industryId: 'public_nonprofit', name: 'Utilities & Infrastructure Providers', googlePlacesTypes: ['point_of_interest'], keywords: ['utility', 'electricity', 'water', 'gas'] },
    { functionId: 'cultural_institutions', industryId: 'public_nonprofit', name: 'Educational & Cultural Institutions', googlePlacesTypes: ['museum', 'library'], keywords: ['museum', 'library', 'cultural', 'arts'] },
];

/**
 * Specializations (Optional Level 3)
 */
export const SPECIALIZATIONS: Specialization[] = [
    // Financial Services
    { specializationId: 'microloans', functionId: 'alternative_lending', name: 'Microloans' },
    { specializationId: 'credit_cards', functionId: 'consumer_lending', name: 'Credit Cards' },
    { specializationId: 'mortgage', functionId: 'consumer_lending', name: 'Mortgage Advisory' },
    { specializationId: 'payroll', functionId: 'payments_processing', name: 'Payroll & Invoicing' },
    { specializationId: 'collections', functionId: 'credit_debt', name: 'Collections & Recovery' },

    // Education
    { specializationId: 'stem', functionId: 'skill_vocational', name: 'STEM' },
    { specializationId: 'exam_prep', functionId: 'test_preparation', name: 'Exam Prep' },
    { specializationId: 'professional_cert', functionId: 'corporate_training', name: 'Professional Certification' },
    { specializationId: 'music_dance', functionId: 'creative_arts', name: 'Music / Dance' },
    { specializationId: 'driving', functionId: 'skill_vocational', name: 'Driving Instruction' },

    // Healthcare
    { specializationId: 'fertility', functionId: 'primary_care', name: 'Fertility' },
    { specializationId: 'dermatology', functionId: 'primary_care', name: 'Dermatology' },
    { specializationId: 'pediatrics', functionId: 'primary_care', name: 'Pediatrics' },
    { specializationId: 'geriatric', functionId: 'primary_care', name: 'Geriatric Care' },

    // Professional Services
    { specializationId: 'saas', functionId: 'software_it', name: 'SaaS' },
    { specializationId: 'mgmt_consulting', functionId: 'consulting_advisory', name: 'Management Consulting' },
    { specializationId: 'interior_design', functionId: 'architecture_design', name: 'Interior Design' },
    { specializationId: 'branding', functionId: 'marketing_advertising', name: 'Branding' },
];
