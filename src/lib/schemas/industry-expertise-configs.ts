/**
 * Industry-Specific Expertise Configurations
 *
 * This file contains the expertise section configurations for all 15 industries
 * Enhanced with icons for all checkbox-group/multi-select fields
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
            fields: [
                {
                    key: 'storeType', label: 'Store Type', type: 'checkbox-group', options: [
                        { value: 'physical', label: 'Physical Store', icon: '🏬' },
                        { value: 'online', label: 'Online Store', icon: '🌐' },
                        { value: 'popup', label: 'Pop-up Shop', icon: '🎪' },
                        { value: 'kiosk', label: 'Kiosk/Counter', icon: '🏪' },
                        { value: 'warehouse', label: 'Warehouse/Outlet', icon: '🏭' },
                    ], schemaPath: 'industrySpecificData.storeType', gridSpan: 2
                },
                {
                    key: 'productCategories', label: 'Product Categories', type: 'checkbox-group', options: [
                        { value: 'electronics', label: 'Electronics', icon: '📱' },
                        { value: 'fashion', label: 'Fashion & Apparel', icon: '👕' },
                        { value: 'footwear', label: 'Footwear', icon: '👟' },
                        { value: 'jewelry', label: 'Jewelry & Watches', icon: '💎' },
                        { value: 'home_decor', label: 'Home Decor', icon: '🏠' },
                        { value: 'furniture', label: 'Furniture', icon: '🛋️' },
                        { value: 'grocery', label: 'Grocery', icon: '🛒' },
                        { value: 'sports', label: 'Sports & Fitness', icon: '⚽' },
                        { value: 'toys', label: 'Toys & Games', icon: '🎮' },
                        { value: 'books', label: 'Books & Stationery', icon: '📚' },
                        { value: 'health', label: 'Health & Personal Care', icon: '💊' },
                        { value: 'baby', label: 'Baby & Kids', icon: '👶' },
                    ], schemaPath: 'industrySpecificData.productCategories', gridSpan: 2
                },
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
                        { value: 'cash', label: 'Cash', icon: '💵' },
                        { value: 'card', label: 'Credit/Debit Card', icon: '💳' },
                        { value: 'upi', label: 'UPI', icon: '📱' },
                        { value: 'bnpl', label: 'Buy Now Pay Later', icon: '🔄' },
                        { value: 'emi', label: 'EMI Available', icon: '📅' },
                        { value: 'wallet', label: 'Digital Wallet', icon: '👛' },
                        { value: 'cheque', label: 'Cheque', icon: '📝' },
                    ], schemaPath: 'industrySpecificData.paymentModes', gridSpan: 2
                },
                {
                    key: 'shoppingFeatures', label: 'Shopping Features', type: 'checkbox-group', options: [
                        { value: 'trial', label: 'Trial/Demo Available', icon: '🔍' },
                        { value: 'gift_wrap', label: 'Gift Wrapping', icon: '🎁' },
                        { value: 'loyalty', label: 'Loyalty Program', icon: '⭐' },
                        { value: 'personal_shopper', label: 'Personal Shopper', icon: '👔' },
                        { value: 'alterations', label: 'Alterations', icon: '✂️' },
                        { value: 'gift_cards', label: 'Gift Cards', icon: '🎴' },
                        { value: 'price_match', label: 'Price Match', icon: '💰' },
                    ], schemaPath: 'industrySpecificData.shoppingFeatures', gridSpan: 2
                },
            ],
        },
        {
            id: 'delivery-returns',
            title: 'Delivery & Returns',
            icon: '📦',
            fields: [
                {
                    key: 'deliveryOptions', label: 'Delivery Options', type: 'checkbox-group', options: [
                        { value: 'home_delivery', label: 'Home Delivery', icon: '🏠' },
                        { value: 'store_pickup', label: 'Store Pickup', icon: '🏬' },
                        { value: 'curbside', label: 'Curbside Pickup', icon: '🚗' },
                        { value: 'same_day', label: 'Same Day Delivery', icon: '⚡' },
                        { value: 'express', label: 'Express Delivery', icon: '🚀' },
                        { value: 'scheduled', label: 'Scheduled Delivery', icon: '📅' },
                    ], schemaPath: 'industrySpecificData.deliveryOptions', gridSpan: 2
                },
                { key: 'freeDeliveryAbove', label: 'Free Delivery Above', type: 'currency', placeholder: 'e.g., 500', schemaPath: 'industrySpecificData.freeDeliveryAbove' },
                {
                    key: 'returnPolicy', label: 'Return Policy', type: 'checkbox-group', options: [
                        { value: 'no_returns', label: 'No Returns', icon: '🚫' },
                        { value: '7_days', label: '7 Days Return', icon: '7️⃣' },
                        { value: '15_days', label: '15 Days Return', icon: '📅' },
                        { value: '30_days', label: '30 Days Return', icon: '📆' },
                        { value: 'exchange_only', label: 'Exchange Only', icon: '🔄' },
                        { value: 'store_credit', label: 'Store Credit', icon: '🎫' },
                    ], schemaPath: 'industrySpecificData.returnPolicy', gridSpan: 2
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
            fields: [
                {
                    key: 'facilityType', label: 'Facility Type', type: 'checkbox-group', options: [
                        { value: 'clinic', label: 'Clinic', icon: '🏥' },
                        { value: 'hospital', label: 'Hospital', icon: '🏨' },
                        { value: 'diagnostic_center', label: 'Diagnostic Center', icon: '🔬' },
                        { value: 'pharmacy', label: 'Pharmacy', icon: '💊' },
                        { value: 'wellness_center', label: 'Wellness Center', icon: '🧘' },
                        { value: 'telehealth', label: 'Telehealth', icon: '📱' },
                        { value: 'nursing_home', label: 'Nursing Home', icon: '🏠' },
                        { value: 'lab', label: 'Pathology Lab', icon: '🧪' },
                    ], schemaPath: 'industrySpecificData.facilityType', gridSpan: 2
                },
                {
                    key: 'specializations', label: 'Specializations', type: 'checkbox-group', options: [
                        { value: 'general', label: 'General Medicine', icon: '👨‍⚕️' },
                        { value: 'cardiology', label: 'Cardiology', icon: '❤️' },
                        { value: 'orthopedics', label: 'Orthopedics', icon: '🦴' },
                        { value: 'pediatrics', label: 'Pediatrics', icon: '👶' },
                        { value: 'gynecology', label: 'Gynecology', icon: '🤰' },
                        { value: 'dermatology', label: 'Dermatology', icon: '🧴' },
                        { value: 'ophthalmology', label: 'Ophthalmology', icon: '👁️' },
                        { value: 'dentistry', label: 'Dentistry', icon: '🦷' },
                        { value: 'psychiatry', label: 'Psychiatry', icon: '🧠' },
                        { value: 'physiotherapy', label: 'Physiotherapy', icon: '💪' },
                        { value: 'ent', label: 'ENT', icon: '👂' },
                        { value: 'neurology', label: 'Neurology', icon: '🧠' },
                    ], schemaPath: 'industrySpecificData.specializations', gridSpan: 2
                },
                { key: 'doctors', label: 'Number of Doctors', type: 'number', placeholder: 'e.g., 5', schemaPath: 'industrySpecificData.doctorCount' },
                { key: 'bedCount', label: 'Bed Capacity', type: 'number', placeholder: 'e.g., 50', schemaPath: 'industrySpecificData.bedCount' },
            ],
        },
        {
            id: 'appointments',
            title: 'Appointments & Services',
            icon: '📅',
            fields: [
                {
                    key: 'appointmentTypes', label: 'Appointment Types', type: 'checkbox-group', options: [
                        { value: 'walk_in', label: 'Walk-in', icon: '🚶' },
                        { value: 'scheduled', label: 'Scheduled', icon: '📅' },
                        { value: 'online_booking', label: 'Online Booking', icon: '🌐' },
                        { value: 'teleconsult', label: 'Teleconsultation', icon: '📹' },
                        { value: 'home_visit', label: 'Home Visit', icon: '🏠' },
                        { value: 'emergency', label: '24/7 Emergency', icon: '🚨' },
                    ], schemaPath: 'industrySpecificData.appointmentTypes', gridSpan: 2
                },
                {
                    key: 'diagnosticServices', label: 'Diagnostic Services', type: 'checkbox-group', options: [
                        { value: 'blood_test', label: 'Blood Tests', icon: '🩸' },
                        { value: 'xray', label: 'X-Ray', icon: '🩻' },
                        { value: 'mri', label: 'MRI', icon: '🧲' },
                        { value: 'ct_scan', label: 'CT Scan', icon: '📷' },
                        { value: 'ultrasound', label: 'Ultrasound', icon: '📡' },
                        { value: 'ecg', label: 'ECG', icon: '💓' },
                        { value: 'endoscopy', label: 'Endoscopy', icon: '🔬' },
                        { value: 'home_collection', label: 'Home Sample Collection', icon: '🏠' },
                    ], schemaPath: 'industrySpecificData.diagnosticServices', gridSpan: 2
                },
            ],
        },
        {
            id: 'insurance-pricing',
            title: 'Insurance & Pricing',
            icon: '💳',
            fields: [
                {
                    key: 'insuranceOptions', label: 'Insurance & Payment', type: 'checkbox-group', options: [
                        { value: 'cashless', label: 'Cashless Insurance', icon: '💳' },
                        { value: 'reimbursement', label: 'Reimbursement', icon: '💰' },
                        { value: 'govt_schemes', label: 'Govt Schemes (Ayushman)', icon: '🏛️' },
                        { value: 'corporate_tie', label: 'Corporate Tie-ups', icon: '🏢' },
                        { value: 'emi', label: 'EMI/Payment Plans', icon: '📅' },
                    ], schemaPath: 'industrySpecificData.insuranceOptions', gridSpan: 2
                },
                { key: 'insuranceProviders', label: 'Insurance Providers', type: 'tags', placeholder: 'e.g., Star Health, ICICI Lombard', schemaPath: 'industrySpecificData.insuranceProviders', gridSpan: 2 },
                { key: 'consultationFee', label: 'Consultation Fee', type: 'currency', placeholder: 'e.g., 500', schemaPath: 'industrySpecificData.consultationFee' },
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
            id: 'institution-info',
            title: 'Institution Information',
            icon: '🎓',
            fields: [
                {
                    key: 'institutionType', label: 'Institution Type', type: 'checkbox-group', options: [
                        { value: 'school', label: 'School (K-12)', icon: '🏫' },
                        { value: 'college', label: 'College/University', icon: '🎓' },
                        { value: 'coaching', label: 'Coaching Institute', icon: '📚' },
                        { value: 'tutoring', label: 'Private Tutoring', icon: '👨‍🏫' },
                        { value: 'skill_training', label: 'Skill Training', icon: '🛠️' },
                        { value: 'online_platform', label: 'Online Platform', icon: '💻' },
                        { value: 'preschool', label: 'Preschool/Playschool', icon: '🧒' },
                        { value: 'language', label: 'Language School', icon: '🗣️' },
                    ], schemaPath: 'industrySpecificData.institutionType', gridSpan: 2
                },
                {
                    key: 'subjects', label: 'Subjects/Courses', type: 'checkbox-group', options: [
                        { value: 'math', label: 'Mathematics', icon: '🔢' },
                        { value: 'science', label: 'Science', icon: '🔬' },
                        { value: 'english', label: 'English', icon: '📖' },
                        { value: 'programming', label: 'Programming', icon: '💻' },
                        { value: 'business', label: 'Business/Commerce', icon: '📊' },
                        { value: 'arts', label: 'Arts & Humanities', icon: '🎨' },
                        { value: 'music', label: 'Music', icon: '🎵' },
                        { value: 'dance', label: 'Dance', icon: '💃' },
                        { value: 'sports', label: 'Sports', icon: '⚽' },
                        { value: 'competitive', label: 'Competitive Exams', icon: '🏆' },
                        { value: 'languages', label: 'Foreign Languages', icon: '🌍' },
                        { value: 'vocational', label: 'Vocational Training', icon: '🔧' },
                    ], schemaPath: 'industrySpecificData.subjects', gridSpan: 2
                },
                { key: 'boards', label: 'Boards/Affiliations', type: 'tags', placeholder: 'e.g., CBSE, ICSE, State Board', schemaPath: 'industrySpecificData.boards', gridSpan: 2 },
            ],
        },
        {
            id: 'learning-mode',
            title: 'Learning Mode',
            icon: '💻',
            fields: [
                {
                    key: 'deliveryMode', label: 'Delivery Mode', type: 'checkbox-group', options: [
                        { value: 'in_person', label: 'In-Person Classes', icon: '🏫' },
                        { value: 'online_live', label: 'Live Online', icon: '📹' },
                        { value: 'recorded', label: 'Recorded Videos', icon: '🎬' },
                        { value: 'hybrid', label: 'Hybrid', icon: '🔄' },
                        { value: 'self_paced', label: 'Self-Paced', icon: '⏱️' },
                        { value: 'one_on_one', label: 'One-on-One', icon: '👤' },
                    ], schemaPath: 'industrySpecificData.deliveryMode', gridSpan: 2
                },
                {
                    key: 'learningFeatures', label: 'Learning Features', type: 'checkbox-group', options: [
                        { value: 'study_materials', label: 'Study Materials', icon: '📚' },
                        { value: 'practice_tests', label: 'Practice Tests', icon: '📝' },
                        { value: 'doubt_clearing', label: 'Doubt Clearing', icon: '❓' },
                        { value: 'progress_tracking', label: 'Progress Tracking', icon: '📈' },
                        { value: 'certificates', label: 'Certificates', icon: '🏅' },
                        { value: 'placement', label: 'Placement Support', icon: '💼' },
                    ], schemaPath: 'industrySpecificData.learningFeatures', gridSpan: 2
                },
                { key: 'batchSize', label: 'Typical Batch Size', type: 'text', placeholder: 'e.g., 15-20 students', schemaPath: 'industrySpecificData.batchSize' },
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
// HOSPITALITY EXPERTISE (Fixed: Room types as checkbox-group)
// ============================================
export const HOSPITALITY_EXPERTISE: IndustryExpertiseConfig = {
    industryId: 'hospitality',
    industryName: 'Hospitality',
    subSections: [
        {
            id: 'property-info',
            title: 'Property Information',
            icon: '🏨',
            fields: [
                {
                    key: 'propertyType', label: 'Property Type', type: 'checkbox-group', options: [
                        { value: 'hotel', label: 'Hotel', icon: '🏨' },
                        { value: 'resort', label: 'Resort', icon: '🏝️' },
                        { value: 'boutique', label: 'Boutique Hotel', icon: '🏛️' },
                        { value: 'guesthouse', label: 'Guest House', icon: '🏠' },
                        { value: 'hostel', label: 'Hostel', icon: '🛏️' },
                        { value: 'homestay', label: 'Homestay', icon: '🏡' },
                        { value: 'service_apt', label: 'Service Apartment', icon: '🏢' },
                        { value: 'villa', label: 'Villa', icon: '🏰' },
                    ], schemaPath: 'industrySpecificData.propertyType', gridSpan: 2
                },
                {
                    key: 'roomTypes', label: 'Room Types Available', type: 'checkbox-group', options: [
                        { value: 'standard', label: 'Standard', icon: '🛏️' },
                        { value: 'deluxe', label: 'Deluxe', icon: '🛋️' },
                        { value: 'superior', label: 'Superior', icon: '⭐' },
                        { value: 'suite', label: 'Suite', icon: '👑' },
                        { value: 'family', label: 'Family Room', icon: '👨‍👩‍👧' },
                        { value: 'twin', label: 'Twin Room', icon: '🛏️' },
                        { value: 'single', label: 'Single Room', icon: '1️⃣' },
                        { value: 'dormitory', label: 'Dormitory', icon: '🏘️' },
                        { value: 'presidential', label: 'Presidential Suite', icon: '🌟' },
                        { value: 'honeymoon', label: 'Honeymoon Suite', icon: '💕' },
                        { value: 'accessible', label: 'Accessible Room', icon: '♿' },
                        { value: 'penthouse', label: 'Penthouse', icon: '🏙️' },
                    ], schemaPath: 'industrySpecificData.roomTypes', gridSpan: 2
                },
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
            ],
        },
        {
            id: 'amenities',
            title: 'Amenities & Facilities',
            icon: '🏊',
            fields: [
                {
                    key: 'roomAmenities', label: 'Room Amenities', type: 'checkbox-group', options: [
                        { value: 'ac', label: 'Air Conditioning', icon: '❄️' },
                        { value: 'wifi', label: 'Free WiFi', icon: '📶' },
                        { value: 'tv', label: 'TV', icon: '📺' },
                        { value: 'minibar', label: 'Minibar', icon: '🍷' },
                        { value: 'safe', label: 'Safe', icon: '🔐' },
                        { value: 'balcony', label: 'Balcony', icon: '🌅' },
                        { value: 'bathtub', label: 'Bathtub', icon: '🛁' },
                        { value: 'workspace', label: 'Work Desk', icon: '💼' },
                        { value: 'coffee', label: 'Coffee/Tea Maker', icon: '☕' },
                        { value: 'iron', label: 'Iron', icon: '👔' },
                        { value: 'hairdryer', label: 'Hair Dryer', icon: '💨' },
                        { value: 'toiletries', label: 'Toiletries', icon: '🧴' },
                    ], schemaPath: 'industrySpecificData.roomAmenities', gridSpan: 2
                },
                {
                    key: 'propertyAmenities', label: 'Property Amenities', type: 'checkbox-group', options: [
                        { value: 'pool', label: 'Swimming Pool', icon: '🏊' },
                        { value: 'gym', label: 'Gym/Fitness', icon: '🏋️' },
                        { value: 'spa', label: 'Spa', icon: '💆' },
                        { value: 'restaurant', label: 'Restaurant', icon: '🍽️' },
                        { value: 'bar', label: 'Bar/Lounge', icon: '🍸' },
                        { value: 'room_service', label: '24/7 Room Service', icon: '🛎️' },
                        { value: 'parking', label: 'Parking', icon: '🅿️' },
                        { value: 'laundry', label: 'Laundry', icon: '🧺' },
                        { value: 'concierge', label: 'Concierge', icon: '🎩' },
                        { value: 'business', label: 'Business Center', icon: '💻' },
                        { value: 'kids_area', label: 'Kids Play Area', icon: '🎠' },
                        { value: 'garden', label: 'Garden', icon: '🌳' },
                    ], schemaPath: 'industrySpecificData.propertyAmenities', gridSpan: 2
                },
                {
                    key: 'accessibility', label: 'Accessibility', type: 'checkbox-group', options: [
                        { value: 'wheelchair', label: 'Wheelchair Access', icon: '♿' },
                        { value: 'elevator', label: 'Elevator', icon: '🛗' },
                        { value: 'pet_friendly', label: 'Pet Friendly', icon: '🐕' },
                        { value: 'smoking_rooms', label: 'Smoking Rooms', icon: '🚬' },
                    ], schemaPath: 'industrySpecificData.accessibility', gridSpan: 2
                },
            ],
        },
        {
            id: 'booking-policies',
            title: 'Booking & Policies',
            icon: '📋',
            fields: [
                {
                    key: 'mealPlans', label: 'Meal Plans', type: 'checkbox-group', options: [
                        { value: 'ep', label: 'Room Only (EP)', icon: '🛏️' },
                        { value: 'cp', label: 'With Breakfast (CP)', icon: '🥐' },
                        { value: 'map', label: 'Half Board (MAP)', icon: '🍽️' },
                        { value: 'ap', label: 'Full Board (AP)', icon: '🍴' },
                        { value: 'all_inclusive', label: 'All Inclusive', icon: '🎉' },
                    ], schemaPath: 'industrySpecificData.mealPlans', gridSpan: 2
                },
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
            id: 'business-type',
            title: 'Business Type',
            icon: '🏗️',
            fields: [
                {
                    key: 'businessType', label: 'Business Type', type: 'checkbox-group', options: [
                        { value: 'developer', label: 'Developer/Builder', icon: '🏗️' },
                        { value: 'broker', label: 'Broker/Agent', icon: '🤝' },
                        { value: 'property_mgmt', label: 'Property Management', icon: '🏢' },
                        { value: 'consultancy', label: 'Consultancy', icon: '📋' },
                        { value: 'interior', label: 'Interior Design', icon: '🎨' },
                    ], schemaPath: 'industrySpecificData.businessType', gridSpan: 2
                },
                {
                    key: 'propertyTypes', label: 'Property Types', type: 'checkbox-group', options: [
                        { value: 'apartment', label: 'Apartment', icon: '🏢' },
                        { value: 'villa', label: 'Villa/House', icon: '🏡' },
                        { value: 'plot', label: 'Plot/Land', icon: '🗺️' },
                        { value: 'commercial', label: 'Commercial', icon: '🏬' },
                        { value: 'office', label: 'Office Space', icon: '💼' },
                        { value: 'retail', label: 'Retail/Shop', icon: '🏪' },
                        { value: 'warehouse', label: 'Warehouse', icon: '🏭' },
                        { value: 'farmland', label: 'Farmland', icon: '🌾' },
                    ], schemaPath: 'industrySpecificData.propertyTypes', gridSpan: 2
                },
                {
                    key: 'transactionTypes', label: 'Transaction Types', type: 'checkbox-group', options: [
                        { value: 'sale', label: 'Sale', icon: '🏷️' },
                        { value: 'rent', label: 'Rent/Lease', icon: '🔑' },
                        { value: 'pg', label: 'PG/Co-living', icon: '🏘️' },
                        { value: 'resale', label: 'Resale', icon: '🔄' },
                    ], schemaPath: 'industrySpecificData.transactionTypes', gridSpan: 2
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
                        { value: 'budget', label: 'Budget (< ₹50L)', icon: '💵' },
                        { value: 'mid_range', label: 'Mid Range (₹50L-1Cr)', icon: '💰' },
                        { value: 'premium', label: 'Premium (₹1Cr-3Cr)', icon: '💎' },
                        { value: 'luxury', label: 'Luxury (> ₹3Cr)', icon: '👑' },
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
                        { value: 'site_visits', label: 'Site Visits', icon: '🚗' },
                        { value: 'legal', label: 'Legal Assistance', icon: '⚖️' },
                        { value: 'loan', label: 'Home Loan Help', icon: '🏦' },
                        { value: 'vastu', label: 'Vastu Consultation', icon: '🧭' },
                        { value: 'interior', label: 'Interior Design', icon: '🎨' },
                        { value: 'valuation', label: 'Property Valuation', icon: '📊' },
                        { value: 'virtual_tour', label: 'Virtual Tours', icon: '🎥' },
                        { value: 'documentation', label: 'Documentation', icon: '📄' },
                    ], schemaPath: 'industrySpecificData.services', gridSpan: 2
                },
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
            id: 'service-type',
            title: 'Service Information',
            icon: '💼',
            fields: [
                {
                    key: 'serviceType', label: 'Service Category', type: 'checkbox-group', options: [
                        { value: 'consulting', label: 'Consulting', icon: '💡' },
                        { value: 'legal', label: 'Legal Services', icon: '⚖️' },
                        { value: 'accounting', label: 'Accounting/CA', icon: '📊' },
                        { value: 'marketing', label: 'Marketing', icon: '📢' },
                        { value: 'it_services', label: 'IT Services', icon: '💻' },
                        { value: 'recruitment', label: 'Recruitment/HR', icon: '👥' },
                        { value: 'design', label: 'Design Services', icon: '🎨' },
                        { value: 'writing', label: 'Writing/Content', icon: '✍️' },
                        { value: 'translation', label: 'Translation', icon: '🌐' },
                        { value: 'training', label: 'Training', icon: '📚' },
                    ], schemaPath: 'industrySpecificData.serviceType', gridSpan: 2
                },
                { key: 'servicesOffered', label: 'Specific Services', type: 'tags', placeholder: 'e.g., Tax Filing, Company Registration, GST', schemaPath: 'industrySpecificData.servicesOffered', gridSpan: 2 },
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
                        { value: 'project', label: 'Project-based', icon: '📋' },
                        { value: 'retainer', label: 'Retainer/Monthly', icon: '📅' },
                        { value: 'hourly', label: 'Hourly', icon: '⏱️' },
                        { value: 'fixed_price', label: 'Fixed Price', icon: '💰' },
                        { value: 'success_fee', label: 'Success Fee', icon: '🏆' },
                        { value: 'subscription', label: 'Subscription', icon: '🔄' },
                    ], schemaPath: 'industrySpecificData.engagementTypes', gridSpan: 2
                },
                {
                    key: 'workMode', label: 'Work Mode', type: 'checkbox-group', options: [
                        { value: 'remote', label: 'Remote', icon: '🏠' },
                        { value: 'onsite', label: 'On-site', icon: '🏢' },
                        { value: 'hybrid', label: 'Hybrid', icon: '🔄' },
                    ], schemaPath: 'industrySpecificData.workMode', gridSpan: 2
                },
                { key: 'minEngagement', label: 'Minimum Engagement', type: 'text', placeholder: 'e.g., ₹25,000 or 10 hours', schemaPath: 'industrySpecificData.minEngagement' },
            ],
        },
        {
            id: 'expertise',
            title: 'Expertise & Team',
            icon: '👥',
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
            id: 'business-info',
            title: 'Business Information',
            icon: '💅',
            fields: [
                {
                    key: 'businessType', label: 'Business Type', type: 'checkbox-group', options: [
                        { value: 'salon', label: 'Salon', icon: '💇' },
                        { value: 'spa', label: 'Spa', icon: '💆' },
                        { value: 'gym', label: 'Gym/Fitness', icon: '🏋️' },
                        { value: 'yoga', label: 'Yoga Studio', icon: '🧘' },
                        { value: 'beauty_parlor', label: 'Beauty Parlor', icon: '💄' },
                        { value: 'wellness', label: 'Wellness Center', icon: '🌿' },
                        { value: 'at_home', label: 'At-Home Services', icon: '🏠' },
                        { value: 'medspa', label: 'Medical Spa', icon: '💉' },
                    ], schemaPath: 'industrySpecificData.businessType', gridSpan: 2
                },
                {
                    key: 'services', label: 'Services Offered', type: 'checkbox-group', options: [
                        { value: 'haircut', label: 'Haircut', icon: '✂️' },
                        { value: 'hair_color', label: 'Hair Coloring', icon: '🎨' },
                        { value: 'hair_treatment', label: 'Hair Treatment', icon: '💆' },
                        { value: 'facial', label: 'Facial', icon: '🧖' },
                        { value: 'makeup', label: 'Makeup', icon: '💄' },
                        { value: 'manicure', label: 'Manicure', icon: '💅' },
                        { value: 'pedicure', label: 'Pedicure', icon: '🦶' },
                        { value: 'massage', label: 'Massage', icon: '🙌' },
                        { value: 'waxing', label: 'Waxing', icon: '🦵' },
                        { value: 'threading', label: 'Threading', icon: '👁️' },
                        { value: 'bridal', label: 'Bridal Services', icon: '👰' },
                        { value: 'personal_training', label: 'Personal Training', icon: '💪' },
                    ], schemaPath: 'industrySpecificData.services', gridSpan: 2
                },
                {
                    key: 'targetGender', label: 'Target Gender', type: 'checkbox-group', options: [
                        { value: 'unisex', label: 'Unisex', icon: '👥' },
                        { value: 'women', label: 'Women Only', icon: '👩' },
                        { value: 'men', label: 'Men Only', icon: '👨' },
                    ], schemaPath: 'industrySpecificData.targetGender'
                },
            ],
        },
        {
            id: 'booking-pricing',
            title: 'Booking & Pricing',
            icon: '📅',
            fields: [
                {
                    key: 'bookingOptions', label: 'Booking Options', type: 'checkbox-group', options: [
                        { value: 'walk_in', label: 'Walk-ins', icon: '🚶' },
                        { value: 'appointment', label: 'Appointment', icon: '📅' },
                        { value: 'online', label: 'Online Booking', icon: '🌐' },
                        { value: 'home_service', label: 'Home Service', icon: '🏠' },
                    ], schemaPath: 'industrySpecificData.bookingOptions', gridSpan: 2
                },
                {
                    key: 'pricingOptions', label: 'Pricing Options', type: 'checkbox-group', options: [
                        { value: 'membership', label: 'Membership Plans', icon: '💳' },
                        { value: 'packages', label: 'Package Deals', icon: '📦' },
                        { value: 'loyalty', label: 'Loyalty Program', icon: '⭐' },
                        { value: 'gift_cards', label: 'Gift Cards', icon: '🎁' },
                    ], schemaPath: 'industrySpecificData.pricingOptions', gridSpan: 2
                },
                { key: 'priceRange', label: 'Price Range', type: 'text', placeholder: 'e.g., ₹500 - ₹5,000', schemaPath: 'industrySpecificData.priceRange' },
            ],
        },
        {
            id: 'facility',
            title: 'Facility & Amenities',
            icon: '🏢',
            fields: [
                { key: 'staffCount', label: 'Number of Staff', type: 'number', placeholder: 'e.g., 8', schemaPath: 'industrySpecificData.staffCount' },
                { key: 'brands', label: 'Brands Used', type: 'tags', placeholder: 'e.g., L\'Oreal, Schwarzkopf, The Body Shop', schemaPath: 'industrySpecificData.brands', gridSpan: 2 },
                {
                    key: 'amenities', label: 'Amenities', type: 'checkbox-group', options: [
                        { value: 'ac', label: 'Air Conditioned', icon: '❄️' },
                        { value: 'parking', label: 'Parking', icon: '🅿️' },
                        { value: 'wifi', label: 'Free WiFi', icon: '📶' },
                        { value: 'refreshments', label: 'Refreshments', icon: '☕' },
                        { value: 'private_rooms', label: 'Private Rooms', icon: '🚪' },
                        { value: 'lockers', label: 'Lockers', icon: '🔐' },
                        { value: 'shower', label: 'Shower', icon: '🚿' },
                        { value: 'steam_sauna', label: 'Steam/Sauna', icon: '♨️' },
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
            id: 'business-type',
            title: 'Business Type',
            icon: '🏦',
            fields: [
                {
                    key: 'businessType', label: 'Business Type', type: 'checkbox-group', options: [
                        { value: 'bank', label: 'Bank/NBFC', icon: '🏦' },
                        { value: 'insurance', label: 'Insurance', icon: '🛡️' },
                        { value: 'investment', label: 'Investment Advisory', icon: '📈' },
                        { value: 'loan', label: 'Loan Provider', icon: '💰' },
                        { value: 'accounting', label: 'Accounting Firm', icon: '📊' },
                        { value: 'wealth', label: 'Wealth Management', icon: '💎' },
                        { value: 'fintech', label: 'Fintech', icon: '📱' },
                        { value: 'forex', label: 'Forex', icon: '💱' },
                    ], schemaPath: 'industrySpecificData.businessType', gridSpan: 2
                },
                {
                    key: 'servicesOffered', label: 'Services Offered', type: 'checkbox-group', options: [
                        { value: 'savings', label: 'Savings Account', icon: '🏦' },
                        { value: 'loans', label: 'Loans', icon: '💵' },
                        { value: 'mutual_funds', label: 'Mutual Funds', icon: '📊' },
                        { value: 'stocks', label: 'Stocks/Equity', icon: '📈' },
                        { value: 'insurance', label: 'Insurance', icon: '🛡️' },
                        { value: 'tax_filing', label: 'Tax Filing', icon: '📝' },
                        { value: 'retirement', label: 'Retirement Planning', icon: '🎯' },
                        { value: 'real_estate', label: 'Real Estate Investment', icon: '🏢' },
                        { value: 'fd', label: 'Fixed Deposits', icon: '🔒' },
                        { value: 'sip', label: 'SIP', icon: '📅' },
                    ], schemaPath: 'industrySpecificData.servicesOffered', gridSpan: 2
                },
                { key: 'regulatoryBody', label: 'Regulatory Body', type: 'tags', placeholder: 'e.g., RBI, SEBI, IRDAI', schemaPath: 'industrySpecificData.regulatoryBody' },
            ],
        },
        {
            id: 'licensing',
            title: 'Licensing & Compliance',
            icon: '📜',
            fields: [
                {
                    key: 'licenses', label: 'Licenses Held', type: 'checkbox-group', options: [
                        { value: 'amfi', label: 'AMFI Registered', icon: '📋' },
                        { value: 'irda', label: 'IRDA Licensed', icon: '🛡️' },
                        { value: 'sebi_ria', label: 'SEBI RIA', icon: '📊' },
                        { value: 'sebi_ra', label: 'SEBI RA', icon: '📈' },
                        { value: 'rbi', label: 'RBI Registered', icon: '🏦' },
                        { value: 'ca', label: 'Chartered Accountant', icon: '📝' },
                    ], schemaPath: 'industrySpecificData.licenses', gridSpan: 2
                },
                { key: 'registrationNumber', label: 'Registration Number', type: 'text', placeholder: 'e.g., ARN-123456', schemaPath: 'industrySpecificData.registrationNumber' },
                { key: 'insuranceCover', label: 'Professional Indemnity', type: 'toggle', schemaPath: 'industrySpecificData.insuranceCover' },
            ],
        },
        {
            id: 'client-info',
            title: 'Client Information',
            icon: '👥',
            fields: [
                {
                    key: 'clientTypes', label: 'Client Types', type: 'checkbox-group', options: [
                        { value: 'individual', label: 'Individual/Retail', icon: '👤' },
                        { value: 'hni', label: 'HNI', icon: '💎' },
                        { value: 'sme', label: 'SME/Business', icon: '🏪' },
                        { value: 'corporate', label: 'Corporate', icon: '🏢' },
                        { value: 'nri', label: 'NRI', icon: '🌍' },
                        { value: 'senior', label: 'Senior Citizens', icon: '👴' },
                    ], schemaPath: 'industrySpecificData.clientTypes', gridSpan: 2
                },
                { key: 'minInvestment', label: 'Minimum Investment', type: 'currency', placeholder: 'e.g., 10000', schemaPath: 'industrySpecificData.minInvestment' },
                {
                    key: 'feeStructure', label: 'Fee Structure', type: 'select', options: [
                        { value: 'commission', label: 'Commission-based' },
                        { value: 'fee_only', label: 'Fee-only' },
                        { value: 'hybrid', label: 'Hybrid' },
                        { value: 'free', label: 'Free (Product-based)' },
                    ], schemaPath: 'industrySpecificData.feeStructure'
                },
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
            id: 'business-type',
            title: 'Business Type',
            icon: '💻',
            fields: [
                {
                    key: 'businessType', label: 'Business Type', type: 'checkbox-group', options: [
                        { value: 'saas', label: 'SaaS Product', icon: '☁️' },
                        { value: 'software_dev', label: 'Software Development', icon: '💻' },
                        { value: 'it_services', label: 'IT Services', icon: '🔧' },
                        { value: 'app_dev', label: 'App Development', icon: '📱' },
                        { value: 'web_dev', label: 'Web Development', icon: '🌐' },
                        { value: 'ai_ml', label: 'AI/ML Solutions', icon: '🤖' },
                        { value: 'cybersecurity', label: 'Cybersecurity', icon: '🔐' },
                        { value: 'cloud', label: 'Cloud Services', icon: '☁️' },
                        { value: 'data', label: 'Data Analytics', icon: '📊' },
                        { value: 'iot', label: 'IoT Solutions', icon: '📡' },
                    ], schemaPath: 'industrySpecificData.businessType', gridSpan: 2
                },
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
                        { value: 'project', label: 'Fixed-Price Projects', icon: '📋' },
                        { value: 'dedicated_team', label: 'Dedicated Team', icon: '👥' },
                        { value: 'staff_aug', label: 'Staff Augmentation', icon: '➕' },
                        { value: 'subscription', label: 'Subscription/SaaS', icon: '🔄' },
                        { value: 'support', label: 'Support/Maintenance', icon: '🛠️' },
                        { value: 'consulting', label: 'Consulting', icon: '💡' },
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
            fields: [
                { key: 'productName', label: 'Product Name', type: 'text', placeholder: 'e.g., CloudSync Pro', schemaPath: 'industrySpecificData.productName' },
                {
                    key: 'productFeatures', label: 'Product Features', type: 'checkbox-group', options: [
                        { value: 'free_trial', label: 'Free Trial', icon: '🆓' },
                        { value: 'freemium', label: 'Freemium Tier', icon: '🎁' },
                        { value: 'api', label: 'API Access', icon: '🔌' },
                        { value: 'white_label', label: 'White Label', icon: '🏷️' },
                        { value: 'custom', label: 'Customization', icon: '⚙️' },
                        { value: 'support_24x7', label: '24/7 Support', icon: '🛎️' },
                    ], schemaPath: 'industrySpecificData.productFeatures', gridSpan: 2
                },
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
            id: 'business-type',
            title: 'Business Type',
            icon: '🚗',
            fields: [
                {
                    key: 'businessType', label: 'Business Type', type: 'checkbox-group', options: [
                        { value: 'dealership', label: 'Car Dealership', icon: '🏪' },
                        { value: 'service_center', label: 'Service Center', icon: '🔧' },
                        { value: 'spare_parts', label: 'Spare Parts', icon: '⚙️' },
                        { value: 'used_cars', label: 'Used Car Dealer', icon: '🚙' },
                        { value: 'rental', label: 'Car Rental', icon: '🔑' },
                        { value: 'accessories', label: 'Accessories', icon: '🎨' },
                        { value: 'detailing', label: 'Car Wash/Detailing', icon: '🧽' },
                        { value: 'insurance', label: 'Auto Insurance', icon: '🛡️' },
                    ], schemaPath: 'industrySpecificData.businessType', gridSpan: 2
                },
                { key: 'brands', label: 'Brands Handled', type: 'tags', placeholder: 'e.g., Maruti, Hyundai, Tata, BMW', schemaPath: 'industrySpecificData.brands', gridSpan: 2 },
                {
                    key: 'vehicleTypes', label: 'Vehicle Types', type: 'checkbox-group', options: [
                        { value: 'cars', label: 'Cars', icon: '🚗' },
                        { value: 'suvs', label: 'SUVs', icon: '🚙' },
                        { value: 'bikes', label: 'Two-Wheelers', icon: '🏍️' },
                        { value: 'commercial', label: 'Commercial', icon: '🚛' },
                        { value: 'ev', label: 'Electric Vehicles', icon: '⚡' },
                        { value: 'luxury', label: 'Luxury Cars', icon: '🏎️' },
                        { value: 'vintage', label: 'Vintage/Classic', icon: '🚘' },
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
                        { value: 'sales', label: 'Sales', icon: '🏷️' },
                        { value: 'service', label: 'Service/Repair', icon: '🔧' },
                        { value: 'insurance', label: 'Insurance', icon: '🛡️' },
                        { value: 'finance', label: 'Financing', icon: '💰' },
                        { value: 'exchange', label: 'Exchange', icon: '🔄' },
                        { value: 'test_drive', label: 'Test Drive', icon: '🚗' },
                        { value: 'pickup_drop', label: 'Pickup & Drop', icon: '🚐' },
                        { value: 'roadside', label: 'Roadside Assistance', icon: '🆘' },
                        { value: 'bodywork', label: 'Body Work', icon: '🛠️' },
                        { value: 'painting', label: 'Painting', icon: '🎨' },
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
            fields: [
                { key: 'serviceBays', label: 'Number of Service Bays', type: 'number', placeholder: 'e.g., 10', schemaPath: 'industrySpecificData.serviceBays' },
                { key: 'showroomSize', label: 'Showroom Size (sq ft)', type: 'number', placeholder: 'e.g., 5000', schemaPath: 'industrySpecificData.showroomSize' },
                {
                    key: 'facilityFeatures', label: 'Facility Features', type: 'checkbox-group', options: [
                        { value: 'genuine_parts', label: 'Genuine Parts', icon: '✅' },
                        { value: 'loaner', label: 'Loaner Vehicle', icon: '🚗' },
                        { value: 'waiting_lounge', label: 'Waiting Lounge', icon: '🛋️' },
                        { value: 'cafe', label: 'Cafeteria', icon: '☕' },
                        { value: 'kids_area', label: 'Kids Area', icon: '🎠' },
                        { value: 'wifi', label: 'Free WiFi', icon: '📶' },
                    ], schemaPath: 'industrySpecificData.facilityFeatures', gridSpan: 2
                },
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
            id: 'business-type',
            title: 'Business Type',
            icon: '🎉',
            fields: [
                {
                    key: 'businessType', label: 'Business Type', type: 'checkbox-group', options: [
                        { value: 'event_planner', label: 'Event Planner', icon: '📋' },
                        { value: 'wedding_planner', label: 'Wedding Planner', icon: '💒' },
                        { value: 'photographer', label: 'Photographer', icon: '📷' },
                        { value: 'videographer', label: 'Videographer', icon: '🎥' },
                        { value: 'caterer', label: 'Caterer', icon: '🍽️' },
                        { value: 'decorator', label: 'Decorator', icon: '🎨' },
                        { value: 'venue', label: 'Venue', icon: '🏛️' },
                        { value: 'dj', label: 'DJ/Entertainment', icon: '🎧' },
                        { value: 'florist', label: 'Florist', icon: '💐' },
                        { value: 'makeup', label: 'Makeup Artist', icon: '💄' },
                    ], schemaPath: 'industrySpecificData.businessType', gridSpan: 2
                },
                {
                    key: 'eventTypes', label: 'Event Types', type: 'checkbox-group', options: [
                        { value: 'wedding', label: 'Wedding', icon: '💍' },
                        { value: 'corporate', label: 'Corporate', icon: '💼' },
                        { value: 'birthday', label: 'Birthday', icon: '🎂' },
                        { value: 'concert', label: 'Concert', icon: '🎤' },
                        { value: 'conference', label: 'Conference', icon: '🎙️' },
                        { value: 'exhibition', label: 'Exhibition', icon: '🖼️' },
                        { value: 'baby_shower', label: 'Baby Shower', icon: '👶' },
                        { value: 'engagement', label: 'Engagement', icon: '💑' },
                        { value: 'anniversary', label: 'Anniversary', icon: '🥂' },
                        { value: 'graduation', label: 'Graduation', icon: '🎓' },
                    ], schemaPath: 'industrySpecificData.eventTypes', gridSpan: 2
                },
                { key: 'experienceYears', label: 'Years of Experience', type: 'number', placeholder: 'e.g., 8', schemaPath: 'industrySpecificData.experienceYears' },
            ],
        },
        {
            id: 'capacity',
            title: 'Capacity & Coverage',
            icon: '📍',
            fields: [
                { key: 'maxCapacity', label: 'Max Guest Capacity', type: 'number', placeholder: 'e.g., 500', schemaPath: 'industrySpecificData.maxCapacity' },
                {
                    key: 'venueTypes', label: 'Venue Types (if venue)', type: 'checkbox-group', options: [
                        { value: 'indoor', label: 'Indoor', icon: '🏢' },
                        { value: 'outdoor', label: 'Outdoor', icon: '🌳' },
                        { value: 'poolside', label: 'Poolside', icon: '🏊' },
                        { value: 'rooftop', label: 'Rooftop', icon: '🌆' },
                        { value: 'banquet', label: 'Banquet Hall', icon: '🏛️' },
                        { value: 'lawn', label: 'Lawn/Garden', icon: '🌿' },
                    ], schemaPath: 'industrySpecificData.venueTypes', gridSpan: 2
                },
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
                    key: 'pricingModel', label: 'Pricing Model', type: 'checkbox-group', options: [
                        { value: 'package', label: 'Package-based', icon: '📦' },
                        { value: 'hourly', label: 'Hourly Rate', icon: '⏱️' },
                        { value: 'per_event', label: 'Per Event', icon: '🎉' },
                        { value: 'custom', label: 'Custom Quote', icon: '📝' },
                        { value: 'per_plate', label: 'Per Plate (catering)', icon: '🍽️' },
                    ], schemaPath: 'industrySpecificData.pricingModel', gridSpan: 2
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
            id: 'service-type',
            title: 'Service Type',
            icon: '🔧',
            fields: [
                {
                    key: 'serviceType', label: 'Service Type', type: 'checkbox-group', options: [
                        { value: 'plumbing', label: 'Plumbing', icon: '🔧' },
                        { value: 'electrical', label: 'Electrical', icon: '⚡' },
                        { value: 'carpentry', label: 'Carpentry', icon: '🪚' },
                        { value: 'cleaning', label: 'Cleaning', icon: '🧹' },
                        { value: 'painting', label: 'Painting', icon: '🎨' },
                        { value: 'pest_control', label: 'Pest Control', icon: '🐛' },
                        { value: 'appliance', label: 'Appliance Repair', icon: '🔌' },
                        { value: 'ac_service', label: 'AC Service', icon: '❄️' },
                        { value: 'interior', label: 'Interior Work', icon: '🏠' },
                        { value: 'gardening', label: 'Gardening', icon: '🌱' },
                    ], schemaPath: 'industrySpecificData.serviceType', gridSpan: 2
                },
                { key: 'servicesOffered', label: 'Specific Services', type: 'tags', placeholder: 'e.g., Leak Repair, Wiring, Deep Cleaning', schemaPath: 'industrySpecificData.servicesOffered', gridSpan: 2 },
                { key: 'brandsServiced', label: 'Brands Serviced', type: 'tags', placeholder: 'e.g., LG, Samsung, Voltas', schemaPath: 'industrySpecificData.brandsServiced', gridSpan: 2 },
            ],
        },
        {
            id: 'coverage',
            title: 'Coverage & Availability',
            icon: '📍',
            fields: [
                { key: 'serviceAreas', label: 'Service Areas', type: 'tags', placeholder: 'e.g., Koramangala, HSR Layout, Whitefield', schemaPath: 'industrySpecificData.serviceAreas', gridSpan: 2 },
                {
                    key: 'availability', label: 'Availability', type: 'checkbox-group', options: [
                        { value: 'same_day', label: 'Same Day Service', icon: '⚡' },
                        { value: 'emergency', label: '24/7 Emergency', icon: '🚨' },
                        { value: 'scheduled', label: 'Scheduled Visits', icon: '📅' },
                        { value: 'online_booking', label: 'Online Booking', icon: '🌐' },
                        { value: 'weekend', label: 'Weekend Available', icon: '📆' },
                    ], schemaPath: 'industrySpecificData.availability', gridSpan: 2
                },
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
                        { value: 'cash', label: 'Cash', icon: '💵' },
                        { value: 'upi', label: 'UPI', icon: '📱' },
                        { value: 'card', label: 'Card', icon: '💳' },
                        { value: 'online', label: 'Online Transfer', icon: '🏦' },
                        { value: 'wallet', label: 'Digital Wallet', icon: '👛' },
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
            fields: [
                {
                    key: 'manufacturingType', label: 'Manufacturing Type', type: 'checkbox-group', options: [
                        { value: 'oem', label: 'OEM Manufacturer', icon: '🏭' },
                        { value: 'odm', label: 'ODM Manufacturer', icon: '🎨' },
                        { value: 'contract', label: 'Contract Manufacturing', icon: '📝' },
                        { value: 'custom', label: 'Custom Manufacturing', icon: '⚙️' },
                        { value: 'assembly', label: 'Assembly', icon: '🔩' },
                        { value: 'processing', label: 'Processing', icon: '🔄' },
                    ], schemaPath: 'industrySpecificData.manufacturingType', gridSpan: 2
                },
                {
                    key: 'productTypes', label: 'Products Manufactured', type: 'checkbox-group', options: [
                        { value: 'machinery', label: 'Machinery', icon: '⚙️' },
                        { value: 'electronics', label: 'Electronics', icon: '📱' },
                        { value: 'textiles', label: 'Textiles', icon: '👕' },
                        { value: 'food', label: 'Food Products', icon: '🍽️' },
                        { value: 'chemicals', label: 'Chemicals', icon: '🧪' },
                        { value: 'metals', label: 'Metal Products', icon: '🔩' },
                        { value: 'plastics', label: 'Plastics', icon: '🧴' },
                        { value: 'furniture', label: 'Furniture', icon: '🪑' },
                        { value: 'automotive', label: 'Auto Parts', icon: '🚗' },
                        { value: 'pharma', label: 'Pharmaceuticals', icon: '💊' },
                    ], schemaPath: 'industrySpecificData.productTypes', gridSpan: 2
                },
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
                {
                    key: 'capabilities', label: 'Capabilities', type: 'checkbox-group', options: [
                        { value: 'customization', label: 'Customization', icon: '🎨' },
                        { value: 'prototyping', label: 'Prototyping', icon: '🔬' },
                        { value: 'design', label: 'Design Services', icon: '📐' },
                        { value: 'tooling', label: 'Tooling', icon: '🔧' },
                        { value: 'export', label: 'Export Capable', icon: '🌍' },
                        { value: 'packaging', label: 'Custom Packaging', icon: '📦' },
                    ], schemaPath: 'industrySpecificData.capabilities', gridSpan: 2
                },
            ],
        },
        {
            id: 'certifications',
            title: 'Certifications & Quality',
            icon: '✅',
            fields: [
                {
                    key: 'certifications', label: 'Certifications', type: 'checkbox-group', options: [
                        { value: 'iso_9001', label: 'ISO 9001', icon: '📋' },
                        { value: 'iso_14001', label: 'ISO 14001', icon: '🌿' },
                        { value: 'ce', label: 'CE Marking', icon: '🇪🇺' },
                        { value: 'bis', label: 'BIS', icon: '🇮🇳' },
                        { value: 'fda', label: 'FDA', icon: '🏥' },
                        { value: 'gmp', label: 'GMP', icon: '💊' },
                        { value: 'rohs', label: 'RoHS', icon: '♻️' },
                        { value: 'ohsas', label: 'OHSAS', icon: '⚠️' },
                    ], schemaPath: 'industrySpecificData.certifications', gridSpan: 2
                },
                { key: 'qualityControl', label: 'Quality Control Process', type: 'textarea', placeholder: 'Describe your QC process...', schemaPath: 'industrySpecificData.qualityControlProcess', gridSpan: 2 },
            ],
        },
    ],
};

// ============================================
// TRAVEL, TRANSPORT & LOGISTICS EXPERTISE
// ============================================
export const TRAVEL_TRANSPORT_EXPERTISE: IndustryExpertiseConfig = {
    industryId: 'travel_transport',
    industryName: 'Travel, Transport & Logistics',
    subSections: [
        {
            id: 'business-type',
            title: 'Business Type',
            icon: '🚀',
            fields: [
                {
                    key: 'businessType', label: 'Business Type', type: 'checkbox-group', options: [
                        { value: 'travel_agency', label: 'Travel Agency', icon: '✈️' },
                        { value: 'tour_operator', label: 'Tour Operator', icon: '🗺️' },
                        { value: 'taxi_service', label: 'Taxi/Cab Service', icon: '🚕' },
                        { value: 'ride_share', label: 'Ride Share', icon: '🚗' },
                        { value: 'car_rental', label: 'Car Rental', icon: '🚙' },
                        { value: 'bike_rental', label: 'Bike/Scooter Rental', icon: '🏍️' },
                        { value: 'bus_operator', label: 'Bus Operator', icon: '🚌' },
                        { value: 'courier', label: 'Courier/Parcel', icon: '📦' },
                        { value: 'freight', label: 'Freight/Cargo', icon: '🚛' },
                        { value: 'moving', label: 'Packers & Movers', icon: '📦' },
                        { value: 'warehouse', label: 'Warehousing', icon: '🏭' },
                        { value: 'last_mile', label: 'Last Mile Delivery', icon: '🛵' },
                    ], schemaPath: 'industrySpecificData.businessType', gridSpan: 2
                },
                {
                    key: 'serviceTypes', label: 'Service Types', type: 'checkbox-group', options: [
                        { value: 'local', label: 'Local/City', icon: '🏙️' },
                        { value: 'outstation', label: 'Outstation', icon: '🛣️' },
                        { value: 'airport', label: 'Airport Transfers', icon: '✈️' },
                        { value: 'corporate', label: 'Corporate Services', icon: '💼' },
                        { value: 'events', label: 'Events & Weddings', icon: '🎉' },
                        { value: 'tours', label: 'Tours & Sightseeing', icon: '🗽' },
                        { value: 'international', label: 'International', icon: '🌍' },
                    ], schemaPath: 'industrySpecificData.serviceTypes', gridSpan: 2
                },
                {
                    key: 'operatingModel', label: 'Operating Model', type: 'checkbox-group', options: [
                        { value: 'b2c', label: 'Direct to Customer (B2C)', icon: '👤' },
                        { value: 'b2b', label: 'Business to Business (B2B)', icon: '🏢' },
                        { value: 'marketplace', label: 'Marketplace/Aggregator', icon: '📱' },
                    ], schemaPath: 'industrySpecificData.operatingModel'
                },
            ],
        },
        {
            id: 'fleet-coverage',
            title: 'Fleet & Coverage',
            icon: '🚗',
            fields: [
                {
                    key: 'vehicleTypes', label: 'Vehicle Types', type: 'checkbox-group', options: [
                        { value: 'sedan', label: 'Sedan', icon: '🚗' },
                        { value: 'suv', label: 'SUV/MUV', icon: '🚙' },
                        { value: 'luxury', label: 'Luxury/Premium', icon: '🏎️' },
                        { value: 'hatchback', label: 'Hatchback', icon: '🚘' },
                        { value: 'van', label: 'Van/Tempo', icon: '🚐' },
                        { value: 'bus', label: 'Bus/Coach', icon: '🚌' },
                        { value: 'bike', label: 'Bike/Scooter', icon: '🏍️' },
                        { value: 'auto', label: 'Auto Rickshaw', icon: '🛺' },
                        { value: 'truck', label: 'Truck/Lorry', icon: '🚛' },
                        { value: 'container', label: 'Container', icon: '📦' },
                        { value: 'ev', label: 'Electric Vehicle', icon: '⚡' },
                    ], schemaPath: 'industrySpecificData.vehicleTypes', gridSpan: 2
                },
                { key: 'fleetSize', label: 'Fleet Size', type: 'number', placeholder: 'e.g., 50 vehicles', schemaPath: 'industrySpecificData.fleetSize' },
                { key: 'operatingCities', label: 'Operating Cities', type: 'tags', placeholder: 'e.g., Mumbai, Delhi, Bangalore', schemaPath: 'industrySpecificData.operatingCities', gridSpan: 2 },
                { key: 'serviceCoverage', label: 'Service Coverage Area', type: 'text', placeholder: 'e.g., All of Maharashtra, Pan India', schemaPath: 'industrySpecificData.serviceCoverage' },
            ],
        },
        {
            id: 'booking-pricing',
            title: 'Booking & Pricing',
            icon: '💳',
            fields: [
                {
                    key: 'bookingModes', label: 'Booking Methods', type: 'checkbox-group', options: [
                        { value: 'app', label: 'Mobile App', icon: '📱' },
                        { value: 'website', label: 'Website', icon: '🌐' },
                        { value: 'phone', label: 'Phone Call', icon: '📞' },
                        { value: 'whatsapp', label: 'WhatsApp', icon: '💬' },
                        { value: 'walk_in', label: 'Walk-in/Counter', icon: '🚶' },
                        { value: 'aggregator', label: 'Via Aggregators', icon: '📲' },
                    ], schemaPath: 'industrySpecificData.bookingModes', gridSpan: 2
                },
                {
                    key: 'pricingModel', label: 'Pricing Model', type: 'checkbox-group', options: [
                        { value: 'per_km', label: 'Per Kilometer', icon: '📏' },
                        { value: 'per_hour', label: 'Per Hour', icon: '⏱️' },
                        { value: 'fixed', label: 'Fixed Route Price', icon: '💰' },
                        { value: 'package', label: 'Package/Bundle', icon: '📦' },
                        { value: 'subscription', label: 'Subscription', icon: '🔄' },
                        { value: 'auction', label: 'Bid/Auction', icon: '🔨' },
                    ], schemaPath: 'industrySpecificData.pricingModel', gridSpan: 2
                },
                { key: 'basePrice', label: 'Starting Price', type: 'currency', placeholder: 'e.g., 100', helpText: 'Minimum fare or base rate', schemaPath: 'industrySpecificData.basePrice' },
                { key: 'advanceBooking', label: 'Advance Booking', type: 'toggle', helpText: 'Accept bookings in advance?', schemaPath: 'industrySpecificData.advanceBooking' },
                { key: 'instantBooking', label: 'Instant Booking', type: 'toggle', helpText: 'On-demand service available?', schemaPath: 'industrySpecificData.instantBooking' },
            ],
        },
        {
            id: 'features-policies',
            title: 'Features & Policies',
            icon: '⭐',
            collapsible: true,
            defaultExpanded: false,
            fields: [
                {
                    key: 'features', label: 'Features', type: 'checkbox-group', options: [
                        { value: 'gps_tracking', label: 'GPS Tracking', icon: '📍' },
                        { value: 'live_eta', label: 'Live ETA', icon: '⏰' },
                        { value: 'driver_profile', label: 'Driver Profiles', icon: '👤' },
                        { value: 'ac', label: 'AC Vehicles', icon: '❄️' },
                        { value: 'wifi', label: 'WiFi', icon: '📶' },
                        { value: 'insurance', label: 'Insurance Included', icon: '🛡️' },
                        { value: 'multiple_stops', label: 'Multiple Stops', icon: '📍' },
                        { value: 'luggage', label: 'Luggage Assistance', icon: '🧳' },
                        { value: 'child_seat', label: 'Child Seat', icon: '👶' },
                        { value: 'pet_friendly', label: 'Pet Friendly', icon: '🐕' },
                        { value: 'wheelchair', label: 'Wheelchair Accessible', icon: '♿' },
                        { value: 'female_driver', label: 'Female Driver Option', icon: '👩' },
                    ], schemaPath: 'industrySpecificData.features', gridSpan: 2
                },
                {
                    key: 'paymentModes', label: 'Payment Options', type: 'checkbox-group', options: [
                        { value: 'cash', label: 'Cash', icon: '💵' },
                        { value: 'card', label: 'Card', icon: '💳' },
                        { value: 'upi', label: 'UPI', icon: '📱' },
                        { value: 'wallet', label: 'Digital Wallet', icon: '👛' },
                        { value: 'corporate', label: 'Corporate Billing', icon: '🏢' },
                        { value: 'cod', label: 'COD (for logistics)', icon: '📦' },
                    ], schemaPath: 'industrySpecificData.paymentModes', gridSpan: 2
                },
                { key: 'cancellationPolicy', label: 'Cancellation Policy', type: 'textarea', placeholder: 'Describe your cancellation terms...', schemaPath: 'industrySpecificData.cancellationPolicy', gridSpan: 2 },
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
                        { value: 'on_site', label: 'On-Site/In-Person', icon: '🏢' },
                        { value: 'remote', label: 'Remote/Online', icon: '🌐' },
                        { value: 'hybrid', label: 'Hybrid', icon: '🔄' },
                        { value: 'delivery', label: 'Delivery-based', icon: '📦' },
                    ], schemaPath: 'industrySpecificData.serviceMode', gridSpan: 2
                },
                {
                    key: 'availability', label: 'Availability', type: 'checkbox-group', options: [
                        { value: 'appointment', label: 'By Appointment', icon: '📅' },
                        { value: 'walk_in', label: 'Walk-ins Welcome', icon: '🚶' },
                        { value: 'online_booking', label: 'Online Booking', icon: '🌐' },
                        { value: '24_7', label: '24/7 Available', icon: '🕐' },
                    ], schemaPath: 'industrySpecificData.availability', gridSpan: 2
                },
            ],
        },
    ],
};

// ============================================
// ALL INDUSTRY EXPERTISE CONFIGS
// ============================================
export const ALL_INDUSTRY_EXPERTISE: Record<string, IndustryExpertiseConfig> = {
    food_beverage: {
        industryId: 'food_beverage',
        industryName: 'Food & Beverage',
        subSections: [], // Defined in main file
    },
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
    travel_transport: TRAVEL_TRANSPORT_EXPERTISE,
    other: OTHER_EXPERTISE,
};
