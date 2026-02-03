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
            description: 'Core details about your healthcare facility',
            fields: [
                {
                    key: 'specializations',
                    label: 'Medical Specializations',
                    type: 'tags',
                    placeholder: 'e.g., Cardiology, Pediatrics, Orthopedics, Dermatology',
                    helpText: 'All medical specializations offered at your facility',
                    schemaPath: 'industrySpecificData.specializations',
                    aiSuggestionEnabled: true,
                    gridSpan: 2,
                    validation: { required: true },
                },
                {
                    key: 'facilityType',
                    label: 'Facility Type',
                    type: 'select',
                    options: [
                        { value: 'clinic', label: 'Clinic / Polyclinic' },
                        { value: 'hospital', label: 'Hospital' },
                        { value: 'nursing_home', label: 'Nursing Home' },
                        { value: 'diagnostic_center', label: 'Diagnostic Center' },
                        { value: 'pharmacy', label: 'Pharmacy' },
                        { value: 'specialty_center', label: 'Specialty Center' },
                        { value: 'daycare', label: 'Day Care Center' },
                    ],
                    schemaPath: 'industrySpecificData.facilityType',
                },
                {
                    key: 'establishedYear',
                    label: 'Established Year',
                    type: 'number',
                    placeholder: 'e.g., 2005',
                    schemaPath: 'industrySpecificData.establishedYear',
                },
                {
                    key: 'doctorCount',
                    label: 'Number of Doctors',
                    type: 'number',
                    placeholder: 'e.g., 15',
                    schemaPath: 'industrySpecificData.doctorCount',
                    showForFunctions: ['hospitals', 'primary_care'],
                },
                {
                    key: 'bedCount',
                    label: 'Bed Capacity',
                    type: 'number',
                    placeholder: 'e.g., 50',
                    schemaPath: 'industrySpecificData.bedCount',
                    showForFunctions: ['hospitals'],
                },
                {
                    key: 'icuBeds',
                    label: 'ICU Beds',
                    type: 'number',
                    placeholder: 'e.g., 10',
                    schemaPath: 'industrySpecificData.icuBeds',
                    showForFunctions: ['hospitals'],
                },
                {
                    key: 'operationTheaters',
                    label: 'Operation Theaters',
                    type: 'number',
                    placeholder: 'e.g., 3',
                    schemaPath: 'industrySpecificData.operationTheaters',
                    showForFunctions: ['hospitals'],
                },
            ],
        },
        {
            id: 'treatments-services',
            title: 'Treatments & Services',
            icon: '💉',
            description: 'Medical treatments and services offered',
            fields: [
                {
                    key: 'treatmentsOffered',
                    label: 'Treatments Offered',
                    type: 'tags',
                    placeholder: 'e.g., Angioplasty, Joint Replacement, IVF, Dialysis',
                    helpText: 'Major treatments and procedures you specialize in',
                    schemaPath: 'industrySpecificData.treatmentsOffered',
                    aiSuggestionEnabled: true,
                    gridSpan: 2,
                },
                {
                    key: 'diagnosticServices',
                    label: 'Diagnostic Services',
                    type: 'checkbox-group',
                    options: [
                        { value: 'pathology', label: 'Pathology Lab' },
                        { value: 'xray', label: 'X-Ray' },
                        { value: 'ultrasound', label: 'Ultrasound' },
                        { value: 'ct_scan', label: 'CT Scan' },
                        { value: 'mri', label: 'MRI' },
                        { value: 'ecg', label: 'ECG/EKG' },
                        { value: 'echo', label: 'Echocardiogram' },
                        { value: 'endoscopy', label: 'Endoscopy' },
                        { value: 'mammography', label: 'Mammography' },
                        { value: 'dexa', label: 'DEXA Scan' },
                    ],
                    schemaPath: 'industrySpecificData.diagnosticServices',
                    gridSpan: 2,
                    showForFunctions: ['diagnostic_imaging', 'hospitals'],
                },
                {
                    key: 'testCategories',
                    label: 'Test Categories',
                    type: 'tags',
                    placeholder: 'e.g., Blood Tests, Thyroid Profile, Liver Function',
                    schemaPath: 'industrySpecificData.testCategories',
                    gridSpan: 2,
                    showForFunctions: ['diagnostic_imaging'],
                },
                {
                    key: 'healthPackages',
                    label: 'Health Packages',
                    type: 'tags',
                    placeholder: 'e.g., Full Body Checkup, Cardiac Package, Women\'s Health',
                    schemaPath: 'industrySpecificData.healthPackages',
                    showForFunctions: ['diagnostic_imaging', 'hospitals', 'primary_care'],
                    gridSpan: 2,
                },
                {
                    key: 'surgeryTypes',
                    label: 'Surgery Types',
                    type: 'checkbox-group',
                    options: [
                        { value: 'general', label: 'General Surgery' },
                        { value: 'orthopedic', label: 'Orthopedic Surgery' },
                        { value: 'cardiac', label: 'Cardiac Surgery' },
                        { value: 'neuro', label: 'Neurosurgery' },
                        { value: 'laparoscopic', label: 'Laparoscopic/Minimally Invasive' },
                        { value: 'robotic', label: 'Robotic Surgery' },
                        { value: 'cosmetic', label: 'Cosmetic Surgery' },
                        { value: 'dental', label: 'Dental Surgery' },
                        { value: 'eye', label: 'Eye Surgery' },
                    ],
                    schemaPath: 'industrySpecificData.surgeryTypes',
                    gridSpan: 2,
                    showForFunctions: ['hospitals'],
                },
            ],
        },
        {
            id: 'credentials-compliance',
            title: 'Credentials & Accreditation',
            icon: '📜',
            description: 'Licenses, certifications, and quality standards',
            fields: [
                {
                    key: 'accreditations',
                    label: 'Accreditations',
                    type: 'checkbox-group',
                    options: [
                        { value: 'nabh', label: 'NABH (National)' },
                        { value: 'nabl', label: 'NABL (Lab)' },
                        { value: 'jci', label: 'JCI (International)' },
                        { value: 'iso_9001', label: 'ISO 9001' },
                        { value: 'iso_15189', label: 'ISO 15189 (Lab)' },
                        { value: 'cap', label: 'CAP (Pathology)' },
                    ],
                    schemaPath: 'industrySpecificData.accreditations',
                    gridSpan: 2,
                    showForCountries: ['IN'],
                },
                {
                    key: 'registrationNumber',
                    label: 'Hospital/Clinic Registration No.',
                    type: 'text',
                    placeholder: 'e.g., MH/MUM/12345',
                    schemaPath: 'industrySpecificData.registrationNumber',
                    showForCountries: ['IN'],
                },
                {
                    key: 'clinicalEstablishmentAct',
                    label: 'Clinical Establishment Act License',
                    type: 'toggle',
                    schemaPath: 'industrySpecificData.clinicalEstablishmentAct',
                    showForCountries: ['IN'],
                },
                {
                    key: 'drugLicenseNumber',
                    label: 'Drug License Number',
                    type: 'text',
                    placeholder: 'e.g., MH-MUM-1234',
                    schemaPath: 'industrySpecificData.drugLicenseNumber',
                    showForFunctions: ['pharmacy_retail'],
                    showForCountries: ['IN'],
                },
                {
                    key: 'pcpndtRegistration',
                    label: 'PCPNDT Registration',
                    type: 'text',
                    placeholder: 'PCPNDT registration number',
                    helpText: 'Required for ultrasound facilities',
                    schemaPath: 'industrySpecificData.pcpndtRegistration',
                    showForFunctions: ['diagnostic_imaging', 'hospitals'],
                    showForCountries: ['IN'],
                },
                {
                    key: 'aerbiLicense',
                    label: 'AERB License',
                    type: 'toggle',
                    helpText: 'For X-ray/CT/radiology equipment',
                    schemaPath: 'industrySpecificData.aerbiLicense',
                    showForFunctions: ['diagnostic_imaging', 'hospitals'],
                    showForCountries: ['IN'],
                },
                {
                    key: 'bwcLicense',
                    label: 'Bio-Medical Waste License',
                    type: 'toggle',
                    schemaPath: 'industrySpecificData.bwcLicense',
                    showForCountries: ['IN'],
                },
                {
                    key: 'qualityCertifications',
                    label: 'Other Certifications',
                    type: 'tags',
                    placeholder: 'e.g., Green OT Certified, Baby Friendly Hospital',
                    schemaPath: 'industrySpecificData.qualityCertifications',
                    gridSpan: 2,
                },
            ],
        },
        {
            id: 'doctors-team',
            title: 'Doctors & Medical Team',
            icon: '👨‍⚕️',
            description: 'Information about your medical professionals',
            fields: [
                {
                    key: 'leadDoctors',
                    label: 'Lead Doctors / Specialists',
                    type: 'tags',
                    placeholder: 'e.g., Dr. Sharma (Cardiologist), Dr. Patel (Orthopedic)',
                    helpText: 'Key doctors with their specializations',
                    schemaPath: 'industrySpecificData.leadDoctors',
                    gridSpan: 2,
                },
                {
                    key: 'doctorQualifications',
                    label: 'Doctor Qualifications',
                    type: 'tags',
                    placeholder: 'e.g., MBBS, MD, MS, DM, MCh, DNB',
                    schemaPath: 'industrySpecificData.doctorQualifications',
                    gridSpan: 2,
                },
                {
                    key: 'totalExperience',
                    label: 'Combined Experience (Years)',
                    type: 'text',
                    placeholder: 'e.g., 100+ years combined',
                    schemaPath: 'industrySpecificData.totalExperience',
                },
                {
                    key: 'nursingStaff',
                    label: 'Nursing Staff Count',
                    type: 'number',
                    placeholder: 'e.g., 30',
                    schemaPath: 'industrySpecificData.nursingStaff',
                    showForFunctions: ['hospitals'],
                },
                {
                    key: 'languagesSpoken',
                    label: 'Languages Spoken',
                    type: 'tags',
                    placeholder: 'e.g., English, Hindi, Tamil, Kannada',
                    schemaPath: 'industrySpecificData.languagesSpoken',
                    gridSpan: 2,
                },
            ],
        },
        {
            id: 'appointments-booking',
            title: 'Appointments & Booking',
            icon: '📅',
            description: 'How patients can book and visit',
            fields: [
                {
                    key: 'appointmentRequired',
                    label: 'Appointment Required',
                    type: 'toggle',
                    schemaPath: 'industrySpecificData.appointmentRequired',
                },
                {
                    key: 'walkInsAccepted',
                    label: 'Walk-ins Accepted',
                    type: 'toggle',
                    schemaPath: 'industrySpecificData.walkInsAccepted',
                },
                {
                    key: 'onlineBooking',
                    label: 'Online Booking Available',
                    type: 'toggle',
                    schemaPath: 'industrySpecificData.onlineBooking',
                },
                {
                    key: 'bookingPlatforms',
                    label: 'Booking Platforms',
                    type: 'checkbox-group',
                    options: [
                        { value: 'practo', label: 'Practo' },
                        { value: 'lybrate', label: 'Lybrate' },
                        { value: 'justdial', label: 'JustDial' },
                        { value: 'credihealth', label: 'Credihealth' },
                        { value: 'own_website', label: 'Own Website' },
                        { value: 'whatsapp', label: 'WhatsApp Booking' },
                    ],
                    schemaPath: 'industrySpecificData.bookingPlatforms',
                    showCondition: { field: 'onlineBooking', operator: 'equals', value: true },
                    gridSpan: 2,
                    showForCountries: ['IN'],
                },
                {
                    key: 'teleconsultation',
                    label: 'Teleconsultation Available',
                    type: 'toggle',
                    schemaPath: 'industrySpecificData.teleconsultation',
                },
                {
                    key: 'teleconsultPlatform',
                    label: 'Teleconsult Platform',
                    type: 'text',
                    placeholder: 'e.g., Practo, Own App, Zoom',
                    schemaPath: 'industrySpecificData.teleconsultPlatform',
                    showCondition: { field: 'teleconsultation', operator: 'equals', value: true },
                },
                {
                    key: 'emergencyServices',
                    label: '24/7 Emergency Services',
                    type: 'toggle',
                    schemaPath: 'industrySpecificData.emergencyServices',
                    showForFunctions: ['hospitals'],
                },
                {
                    key: 'ambulanceService',
                    label: 'Ambulance Service',
                    type: 'toggle',
                    schemaPath: 'industrySpecificData.ambulanceService',
                    showForFunctions: ['hospitals'],
                },
                {
                    key: 'homeVisits',
                    label: 'Home Visits Available',
                    type: 'toggle',
                    schemaPath: 'industrySpecificData.homeVisits',
                },
                {
                    key: 'homeCollectionRadius',
                    label: 'Home Collection Radius',
                    type: 'text',
                    placeholder: 'e.g., 10 km',
                    schemaPath: 'industrySpecificData.homeCollectionRadius',
                    showForFunctions: ['diagnostic_imaging'],
                },
                {
                    key: 'avgWaitTime',
                    label: 'Average Wait Time',
                    type: 'text',
                    placeholder: 'e.g., 15-20 minutes',
                    schemaPath: 'industrySpecificData.avgWaitTime',
                },
            ],
        },
        {
            id: 'insurance-pricing',
            title: 'Insurance & Pricing',
            icon: '💳',
            description: 'Payment options and insurance tie-ups',
            fields: [
                {
                    key: 'consultationFee',
                    label: 'Consultation Fee',
                    type: 'currency',
                    placeholder: 'e.g., 500',
                    schemaPath: 'industrySpecificData.consultationFee',
                    showForFunctions: ['primary_care', 'dental_care', 'vision_care', 'mental_health'],
                },
                {
                    key: 'followUpFee',
                    label: 'Follow-up Fee',
                    type: 'currency',
                    placeholder: 'e.g., 300',
                    schemaPath: 'industrySpecificData.followUpFee',
                    showForFunctions: ['primary_care', 'dental_care', 'vision_care', 'mental_health'],
                },
                {
                    key: 'teleconsultFee',
                    label: 'Teleconsultation Fee',
                    type: 'currency',
                    placeholder: 'e.g., 400',
                    schemaPath: 'industrySpecificData.teleconsultFee',
                    showCondition: { field: 'teleconsultation', operator: 'equals', value: true },
                },
                {
                    key: 'insuranceAccepted',
                    label: 'Insurance Accepted',
                    type: 'toggle',
                    schemaPath: 'industrySpecificData.insuranceAccepted',
                },
                {
                    key: 'insuranceProviders',
                    label: 'Insurance Partners',
                    type: 'tags',
                    placeholder: 'e.g., Star Health, HDFC Ergo, ICICI Lombard, Ayushman Bharat',
                    schemaPath: 'industrySpecificData.insuranceProviders',
                    showCondition: { field: 'insuranceAccepted', operator: 'equals', value: true },
                    gridSpan: 2,
                },
                {
                    key: 'tpaEmpaneled',
                    label: 'TPA Empaneled',
                    type: 'tags',
                    placeholder: 'e.g., Medi Assist, Paramount, Vidal Health',
                    schemaPath: 'industrySpecificData.tpaEmpaneled',
                    showCondition: { field: 'insuranceAccepted', operator: 'equals', value: true },
                    gridSpan: 2,
                    showForCountries: ['IN'],
                },
                {
                    key: 'cghs',
                    label: 'CGHS Empaneled',
                    type: 'toggle',
                    schemaPath: 'industrySpecificData.cghs',
                    showForCountries: ['IN'],
                },
                {
                    key: 'esic',
                    label: 'ESIC Recognized',
                    type: 'toggle',
                    schemaPath: 'industrySpecificData.esic',
                    showForCountries: ['IN'],
                },
                {
                    key: 'paymentModes',
                    label: 'Payment Modes',
                    type: 'checkbox-group',
                    options: [
                        { value: 'cash', label: 'Cash' },
                        { value: 'card', label: 'Credit/Debit Card' },
                        { value: 'upi', label: 'UPI' },
                        { value: 'netbanking', label: 'Net Banking' },
                        { value: 'emi', label: 'EMI Available' },
                        { value: 'cheque', label: 'Cheque' },
                    ],
                    schemaPath: 'industrySpecificData.paymentModes',
                    gridSpan: 2,
                },
                {
                    key: 'emiPartners',
                    label: 'EMI Partners',
                    type: 'tags',
                    placeholder: 'e.g., Bajaj Finserv, HDFC, ICICI',
                    schemaPath: 'industrySpecificData.emiPartners',
                },
            ],
        },
        {
            id: 'patient-experience',
            title: 'Patient Experience',
            icon: '⭐',
            description: 'Facilities and amenities for patients',
            collapsible: true,
            defaultExpanded: false,
            fields: [
                {
                    key: 'facilities',
                    label: 'Facilities',
                    type: 'checkbox-group',
                    options: [
                        { value: 'parking', label: 'Parking' },
                        { value: 'wheelchair', label: 'Wheelchair Access' },
                        { value: 'lift', label: 'Lift/Elevator' },
                        { value: 'cafeteria', label: 'Cafeteria' },
                        { value: 'pharmacy_inhouse', label: 'In-house Pharmacy' },
                        { value: 'atm', label: 'ATM' },
                        { value: 'wifi', label: 'Free WiFi' },
                        { value: 'ac', label: 'Air Conditioned' },
                        { value: 'attendant_room', label: 'Attendant Room' },
                    ],
                    schemaPath: 'industrySpecificData.facilities',
                    gridSpan: 2,
                },
                {
                    key: 'roomTypes',
                    label: 'Room Types',
                    type: 'checkbox-group',
                    options: [
                        { value: 'general_ward', label: 'General Ward' },
                        { value: 'semi_private', label: 'Semi-Private' },
                        { value: 'private', label: 'Private Room' },
                        { value: 'deluxe', label: 'Deluxe/Suite' },
                        { value: 'icu', label: 'ICU' },
                        { value: 'nicu', label: 'NICU' },
                    ],
                    schemaPath: 'industrySpecificData.roomTypes',
                    showForFunctions: ['hospitals'],
                    gridSpan: 2,
                },
                {
                    key: 'reportDelivery',
                    label: 'Report Delivery',
                    type: 'checkbox-group',
                    options: [
                        { value: 'same_day', label: 'Same Day Reports' },
                        { value: 'online_portal', label: 'Online Portal Access' },
                        { value: 'whatsapp', label: 'WhatsApp Delivery' },
                        { value: 'email', label: 'Email Reports' },
                        { value: 'hard_copy', label: 'Hard Copy' },
                    ],
                    schemaPath: 'industrySpecificData.reportDelivery',
                    showForFunctions: ['diagnostic_imaging'],
                    gridSpan: 2,
                },
                {
                    key: 'averageRating',
                    label: 'Average Patient Rating',
                    type: 'text',
                    placeholder: 'e.g., 4.5/5 on Google',
                    schemaPath: 'industrySpecificData.averageRating',
                },
                {
                    key: 'patientsTreated',
                    label: 'Patients Treated (Lifetime)',
                    type: 'text',
                    placeholder: 'e.g., 50,000+ patients',
                    schemaPath: 'industrySpecificData.patientsTreated',
                },
                {
                    key: 'surgerySuccessRate',
                    label: 'Surgery Success Rate',
                    type: 'text',
                    placeholder: 'e.g., 99.5%',
                    schemaPath: 'industrySpecificData.surgerySuccessRate',
                    showForFunctions: ['hospitals'],
                },
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
            id: 'courses-programs',
            title: 'Courses & Programs',
            icon: '🎓',
            description: 'Academic programs and subjects offered',
            fields: [
                {
                    key: 'subjects',
                    label: 'Subjects/Courses Offered',
                    type: 'tags',
                    placeholder: 'e.g., Mathematics, Science, Programming, English',
                    helpText: 'All subjects and courses you teach',
                    schemaPath: 'industrySpecificData.subjects',
                    aiSuggestionEnabled: true,
                    gridSpan: 2,
                    validation: { required: true },
                },
                {
                    key: 'boards',
                    label: 'Boards/Affiliations',
                    type: 'tags',
                    placeholder: 'e.g., CBSE, ICSE, IB, State Board, Cambridge',
                    schemaPath: 'industrySpecificData.boards',
                    gridSpan: 2,
                    showForFunctions: ['k12_education', 'early_childhood'],
                },
                {
                    key: 'examsFocused',
                    label: 'Exams Focused',
                    type: 'checkbox-group',
                    options: [
                        { value: 'jee_main', label: 'JEE Main' },
                        { value: 'jee_advanced', label: 'JEE Advanced' },
                        { value: 'neet', label: 'NEET' },
                        { value: 'upsc', label: 'UPSC Civil Services' },
                        { value: 'cat', label: 'CAT/MBA Entrance' },
                        { value: 'gate', label: 'GATE' },
                        { value: 'clat', label: 'CLAT (Law)' },
                        { value: 'nda', label: 'NDA/CDS' },
                        { value: 'ssc', label: 'SSC/Bank Exams' },
                        { value: 'state_psc', label: 'State PSC' },
                    ],
                    schemaPath: 'industrySpecificData.examsFocused',
                    gridSpan: 2,
                    showForFunctions: ['test_preparation'],
                    showForCountries: ['IN'],
                },
                {
                    key: 'classesOffered',
                    label: 'Classes/Grades',
                    type: 'checkbox-group',
                    options: [
                        { value: 'nursery_kg', label: 'Nursery - KG' },
                        { value: 'class_1_5', label: 'Class 1-5' },
                        { value: 'class_6_8', label: 'Class 6-8' },
                        { value: 'class_9_10', label: 'Class 9-10' },
                        { value: 'class_11_12', label: 'Class 11-12' },
                        { value: 'undergraduate', label: 'Undergraduate' },
                        { value: 'postgraduate', label: 'Postgraduate' },
                        { value: 'working_professionals', label: 'Working Professionals' },
                    ],
                    schemaPath: 'industrySpecificData.classesOffered',
                    gridSpan: 2,
                },
                {
                    key: 'programTypes',
                    label: 'Program Types',
                    type: 'checkbox-group',
                    options: [
                        { value: 'undergraduate', label: 'Undergraduate (Bachelor\'s)' },
                        { value: 'postgraduate', label: 'Postgraduate (Master\'s)' },
                        { value: 'mba', label: 'MBA / Business Programs' },
                        { value: 'phd', label: 'PhD / Doctoral' },
                        { value: 'diploma', label: 'Diploma / Certificate' },
                        { value: 'pathway', label: 'Pathway / Foundation' },
                        { value: 'language', label: 'Language Courses' },
                        { value: 'summer', label: 'Summer Programs' },
                        { value: 'exchange', label: 'Exchange Programs' },
                    ],
                    schemaPath: 'industrySpecificData.programTypes',
                    gridSpan: 2,
                    showForFunctions: ['academic_counseling', 'higher_education'],
                },
            ],
        },
        {
            id: 'study-abroad',
            title: 'Study Abroad Services',
            icon: '🌍',
            description: 'Countries and programs for overseas education',
            showForFunctions: ['academic_counseling'],
            fields: [
                {
                    key: 'primaryDestinations',
                    label: 'Primary Destination Countries',
                    type: 'checkbox-group',
                    options: [
                        { value: 'usa', label: '🇺🇸 United States' },
                        { value: 'uk', label: '🇬🇧 United Kingdom' },
                        { value: 'canada', label: '🇨🇦 Canada' },
                        { value: 'australia', label: '🇦🇺 Australia' },
                        { value: 'germany', label: '🇩🇪 Germany' },
                        { value: 'ireland', label: '🇮🇪 Ireland' },
                        { value: 'new_zealand', label: '🇳🇿 New Zealand' },
                        { value: 'singapore', label: '🇸🇬 Singapore' },
                        { value: 'dubai', label: '🇦🇪 UAE/Dubai' },
                        { value: 'france', label: '🇫🇷 France' },
                        { value: 'netherlands', label: '🇳🇱 Netherlands' },
                        { value: 'switzerland', label: '🇨🇭 Switzerland' },
                    ],
                    helpText: 'Countries where you have strong placement track record',
                    schemaPath: 'industrySpecificData.primaryDestinations',
                    gridSpan: 2,
                    validation: { required: true },
                },
                {
                    key: 'otherDestinations',
                    label: 'Other Destinations',
                    type: 'tags',
                    placeholder: 'Add other countries you work with...',
                    schemaPath: 'industrySpecificData.otherDestinations',
                    gridSpan: 2,
                },
                {
                    key: 'fieldsOfStudy',
                    label: 'Fields of Study Expertise',
                    type: 'tags',
                    placeholder: 'e.g., Engineering, Business, Medicine, Arts, Data Science',
                    helpText: 'Academic fields you specialize in placing students',
                    schemaPath: 'industrySpecificData.fieldsOfStudy',
                    aiSuggestionEnabled: true,
                    gridSpan: 2,
                },
                {
                    key: 'consultingServices',
                    label: 'Consulting Services',
                    type: 'checkbox-group',
                    options: [
                        { value: 'university_selection', label: 'University Selection & Shortlisting' },
                        { value: 'profile_building', label: 'Profile Building & Gap Analysis' },
                        { value: 'application_assistance', label: 'Application Assistance' },
                        { value: 'sop_writing', label: 'SOP / Essay Writing Support' },
                        { value: 'lor_guidance', label: 'LOR Guidance' },
                        { value: 'interview_prep', label: 'Interview Preparation' },
                        { value: 'scholarship_guidance', label: 'Scholarship Guidance' },
                        { value: 'visa_assistance', label: 'Visa Application Assistance' },
                        { value: 'accommodation', label: 'Accommodation Assistance' },
                        { value: 'travel_booking', label: 'Travel Booking' },
                        { value: 'forex', label: 'Forex Services' },
                        { value: 'pre_departure', label: 'Pre-Departure Orientation' },
                        { value: 'post_arrival', label: 'Post-Arrival Support' },
                    ],
                    schemaPath: 'industrySpecificData.consultingServices',
                    gridSpan: 2,
                },
                {
                    key: 'educationLoans',
                    label: 'Education Loan Assistance',
                    type: 'toggle',
                    schemaPath: 'industrySpecificData.educationLoans',
                },
                {
                    key: 'loanPartners',
                    label: 'Loan Partners',
                    type: 'tags',
                    placeholder: 'e.g., HDFC Credila, Prodigy Finance, MPOWER, Avanse',
                    schemaPath: 'industrySpecificData.loanPartners',
                    showCondition: { field: 'educationLoans', operator: 'equals', value: true },
                    gridSpan: 2,
                },
            ],
        },
        {
            id: 'university-partnerships',
            title: 'University Network',
            icon: '🏛️',
            description: 'Partner universities and placement track record',
            showForFunctions: ['academic_counseling'],
            fields: [
                {
                    key: 'partnerUniversities',
                    label: 'Partner Universities',
                    type: 'tags',
                    placeholder: 'Universities where you are an official representative...',
                    helpText: 'Universities with direct partnership/representation',
                    schemaPath: 'industrySpecificData.partnerUniversities',
                    gridSpan: 2,
                },
                {
                    key: 'universityTier',
                    label: 'University Tier Focus',
                    type: 'checkbox-group',
                    options: [
                        { value: 'ivy_league', label: 'Ivy League / Oxbridge' },
                        { value: 'top_50', label: 'Top 50 Global Rankings' },
                        { value: 'top_100', label: 'Top 100 Global Rankings' },
                        { value: 'top_200', label: 'Top 200 Global Rankings' },
                        { value: 'regional', label: 'Regional Universities' },
                        { value: 'community', label: 'Community Colleges' },
                        { value: 'affordable', label: 'Affordable Options' },
                    ],
                    schemaPath: 'industrySpecificData.universityTier',
                    gridSpan: 2,
                },
                {
                    key: 'admissionSuccessRate',
                    label: 'Admission Success Rate',
                    type: 'text',
                    placeholder: 'e.g., 95% visa success rate',
                    schemaPath: 'industrySpecificData.admissionSuccessRate',
                },
                {
                    key: 'studentsPlaced',
                    label: 'Students Placed (Lifetime)',
                    type: 'text',
                    placeholder: 'e.g., 5,000+ students',
                    schemaPath: 'industrySpecificData.studentsPlaced',
                },
                {
                    key: 'scholarshipsSecured',
                    label: 'Scholarships Secured',
                    type: 'text',
                    placeholder: 'e.g., ₹50+ Crores in scholarships',
                    schemaPath: 'industrySpecificData.scholarshipsSecured',
                },
                {
                    key: 'notableUniversityAdmits',
                    label: 'Notable University Admits',
                    type: 'tags',
                    placeholder: 'e.g., MIT, Stanford, Oxford, Cambridge',
                    schemaPath: 'industrySpecificData.notableUniversityAdmits',
                    gridSpan: 2,
                },
            ],
        },
        {
            id: 'test-preparation',
            title: 'Test Preparation',
            icon: '📝',
            description: 'Standardized test coaching and preparation',
            showForFunctions: ['test_preparation', 'academic_counseling', 'language_learning'],
            fields: [
                {
                    key: 'testPrepOffered',
                    label: 'Tests Offered',
                    type: 'checkbox-group',
                    options: [
                        { value: 'ielts', label: 'IELTS' },
                        { value: 'toefl', label: 'TOEFL' },
                        { value: 'pte', label: 'PTE Academic' },
                        { value: 'duolingo', label: 'Duolingo English Test' },
                        { value: 'gre', label: 'GRE' },
                        { value: 'gmat', label: 'GMAT' },
                        { value: 'sat', label: 'SAT' },
                        { value: 'act', label: 'ACT' },
                        { value: 'german_language', label: 'German Language (A1-C1)' },
                        { value: 'french_language', label: 'French Language' },
                        { value: 'japanese_language', label: 'Japanese (JLPT)' },
                    ],
                    schemaPath: 'industrySpecificData.testPrepOffered',
                    gridSpan: 2,
                },
                {
                    key: 'testCenter',
                    label: 'Authorized Test Center',
                    type: 'checkbox-group',
                    options: [
                        { value: 'ielts_idp', label: 'IDP IELTS Center' },
                        { value: 'ielts_bc', label: 'British Council IELTS' },
                        { value: 'pte_center', label: 'PTE Test Center' },
                        { value: 'toefl_center', label: 'TOEFL iBT Center' },
                    ],
                    schemaPath: 'industrySpecificData.testCenter',
                    gridSpan: 2,
                },
                {
                    key: 'averageScoreImprovement',
                    label: 'Average Score Improvement',
                    type: 'text',
                    placeholder: 'e.g., 1.5 bands IELTS, 50+ points GRE',
                    schemaPath: 'industrySpecificData.averageScoreImprovement',
                },
                {
                    key: 'mockTestsIncluded',
                    label: 'Mock Tests Included',
                    type: 'number',
                    placeholder: 'e.g., 10',
                    schemaPath: 'industrySpecificData.mockTestsIncluded',
                },
            ],
        },
        {
            id: 'faculty-credentials',
            title: 'Faculty & Credentials',
            icon: '👨‍🏫',
            description: 'Teaching staff qualifications and accreditations',
            fields: [
                {
                    key: 'totalFaculty',
                    label: 'Total Faculty',
                    type: 'number',
                    placeholder: 'e.g., 25',
                    schemaPath: 'industrySpecificData.totalFaculty',
                },
                {
                    key: 'facultyQualifications',
                    label: 'Faculty Qualifications',
                    type: 'tags',
                    placeholder: 'e.g., IITians, Ex-ALLEN, PhDs, CAs',
                    helpText: 'Notable qualifications of your teaching staff',
                    schemaPath: 'industrySpecificData.facultyQualifications',
                    gridSpan: 2,
                },
                {
                    key: 'accreditations',
                    label: 'Accreditations & Memberships',
                    type: 'checkbox-group',
                    options: [
                        { value: 'icef', label: 'ICEF Certified Agent' },
                        { value: 'airc', label: 'AIRC Certified' },
                        { value: 'nafsa', label: 'NAFSA Member' },
                        { value: 'pier', label: 'PIER Certified' },
                        { value: 'british_council', label: 'British Council Registered' },
                        { value: 'education_usa', label: 'EducationUSA Adviser' },
                        { value: 'mcie', label: 'MCIE Registered (India)' },
                    ],
                    schemaPath: 'industrySpecificData.accreditations',
                    gridSpan: 2,
                    showForFunctions: ['academic_counseling'],
                    showForCountries: ['IN'],
                },
                {
                    key: 'yearsInBusiness',
                    label: 'Years in Business',
                    type: 'number',
                    placeholder: 'e.g., 15',
                    schemaPath: 'industrySpecificData.yearsInBusiness',
                },
                {
                    key: 'studentsEnrolled',
                    label: 'Students Enrolled (Current)',
                    type: 'text',
                    placeholder: 'e.g., 500+ students',
                    schemaPath: 'industrySpecificData.studentsEnrolled',
                },
                {
                    key: 'awards',
                    label: 'Awards & Recognition',
                    type: 'tags',
                    placeholder: 'e.g., Best Coaching Institute 2023, Education Excellence Award',
                    schemaPath: 'industrySpecificData.awards',
                    gridSpan: 2,
                },
            ],
        },
        {
            id: 'learning-mode',
            title: 'Learning Mode & Infrastructure',
            icon: '💻',
            description: 'How classes are conducted and facilities available',
            fields: [
                {
                    key: 'deliveryMode',
                    label: 'Delivery Mode',
                    type: 'checkbox-group',
                    options: [
                        { value: 'in_person', label: 'In-Person Classes' },
                        { value: 'online_live', label: 'Live Online Classes' },
                        { value: 'recorded', label: 'Pre-Recorded Videos' },
                        { value: 'hybrid', label: 'Hybrid (Both)' },
                        { value: 'self_paced', label: 'Self-Paced Learning' },
                    ],
                    schemaPath: 'industrySpecificData.deliveryMode',
                    gridSpan: 2,
                },
                {
                    key: 'batchSize',
                    label: 'Typical Batch Size',
                    type: 'text',
                    placeholder: 'e.g., 15-20 students',
                    schemaPath: 'industrySpecificData.batchSize',
                },
                {
                    key: 'personalAttention',
                    label: 'One-on-One Available',
                    type: 'toggle',
                    schemaPath: 'industrySpecificData.personalAttention',
                },
                {
                    key: 'doubtClearing',
                    label: 'Doubt Clearing Sessions',
                    type: 'toggle',
                    schemaPath: 'industrySpecificData.doubtClearing',
                },
                {
                    key: 'studyMaterials',
                    label: 'Study Materials Provided',
                    type: 'toggle',
                    schemaPath: 'industrySpecificData.studyMaterials',
                },
                {
                    key: 'onlinePortal',
                    label: 'Online Learning Portal',
                    type: 'toggle',
                    schemaPath: 'industrySpecificData.onlinePortal',
                },
                {
                    key: 'mobileApp',
                    label: 'Mobile App Available',
                    type: 'toggle',
                    schemaPath: 'industrySpecificData.mobileApp',
                },
                {
                    key: 'facilities',
                    label: 'Facilities',
                    type: 'checkbox-group',
                    options: [
                        { value: 'ac_classrooms', label: 'AC Classrooms' },
                        { value: 'library', label: 'Library' },
                        { value: 'computer_lab', label: 'Computer Lab' },
                        { value: 'smart_boards', label: 'Smart Boards/Projectors' },
                        { value: 'cafeteria', label: 'Cafeteria' },
                        { value: 'parking', label: 'Parking' },
                        { value: 'hostel', label: 'Hostel Facility' },
                        { value: 'transport', label: 'Transport Facility' },
                    ],
                    schemaPath: 'industrySpecificData.facilities',
                    gridSpan: 2,
                },
            ],
        },
        {
            id: 'fees-admission',
            title: 'Fees & Admission',
            icon: '💰',
            description: 'Fee structure and enrollment process',
            fields: [
                {
                    key: 'feeModel',
                    label: 'Fee Model',
                    type: 'radio',
                    options: [
                        { value: 'per_course', label: 'Per Course' },
                        { value: 'monthly', label: 'Monthly' },
                        { value: 'quarterly', label: 'Quarterly' },
                        { value: 'annual', label: 'Annual' },
                        { value: 'package', label: 'Complete Package' },
                    ],
                    schemaPath: 'industrySpecificData.feeModel',
                    gridSpan: 2,
                },
                {
                    key: 'feeRange',
                    label: 'Fee Range',
                    type: 'text',
                    placeholder: 'e.g., ₹5,000 - ₹50,000',
                    schemaPath: 'industrySpecificData.feeRange',
                },
                {
                    key: 'consultationFee',
                    label: 'Initial Consultation Fee',
                    type: 'text',
                    placeholder: 'e.g., Free / ₹500 / ₹2,000',
                    schemaPath: 'industrySpecificData.consultationFee',
                    showForFunctions: ['academic_counseling'],
                },
                {
                    key: 'demoClassAvailable',
                    label: 'Demo/Trial Class',
                    type: 'toggle',
                    schemaPath: 'industrySpecificData.demoClassAvailable',
                },
                {
                    key: 'installmentPayment',
                    label: 'Installment Payment',
                    type: 'toggle',
                    schemaPath: 'industrySpecificData.installmentPayment',
                },
                {
                    key: 'scholarshipsAvailable',
                    label: 'Scholarships Available',
                    type: 'toggle',
                    schemaPath: 'industrySpecificData.scholarshipsAvailable',
                },
                {
                    key: 'admissionProcess',
                    label: 'Admission Process',
                    type: 'textarea',
                    placeholder: 'Describe your admission/enrollment process...',
                    schemaPath: 'industrySpecificData.admissionProcess',
                    gridSpan: 2,
                },
                {
                    key: 'intakesSupported',
                    label: 'Intakes Supported',
                    type: 'checkbox-group',
                    options: [
                        { value: 'fall', label: 'Fall (Aug-Sep)' },
                        { value: 'spring', label: 'Spring (Jan-Feb)' },
                        { value: 'summer', label: 'Summer (May-Jun)' },
                        { value: 'rolling', label: 'Rolling Admissions' },
                    ],
                    schemaPath: 'industrySpecificData.intakesSupported',
                    gridSpan: 2,
                    showForFunctions: ['academic_counseling'],
                },
            ],
        },
        {
            id: 'success-metrics',
            title: 'Success Stories & Results',
            icon: '🏆',
            description: 'Track record and student achievements',
            collapsible: true,
            defaultExpanded: false,
            fields: [
                {
                    key: 'selectionRate',
                    label: 'Selection/Pass Rate',
                    type: 'text',
                    placeholder: 'e.g., 85% selection rate in JEE',
                    schemaPath: 'industrySpecificData.selectionRate',
                },
                {
                    key: 'topRankers',
                    label: 'Top Rankers/Achievers',
                    type: 'tags',
                    placeholder: 'e.g., AIR 15 in NEET 2023, 8.5 IELTS scorer',
                    schemaPath: 'industrySpecificData.topRankers',
                    gridSpan: 2,
                },
                {
                    key: 'alumniNetwork',
                    label: 'Notable Alumni',
                    type: 'tags',
                    placeholder: 'e.g., Working at Google, Studying at Harvard',
                    schemaPath: 'industrySpecificData.alumniNetwork',
                    gridSpan: 2,
                },
                {
                    key: 'mediaFeatures',
                    label: 'Media Features',
                    type: 'tags',
                    placeholder: 'e.g., Featured in Times of India, Education Today',
                    schemaPath: 'industrySpecificData.mediaFeatures',
                    gridSpan: 2,
                },
                {
                    key: 'googleRating',
                    label: 'Google Rating',
                    type: 'text',
                    placeholder: 'e.g., 4.7/5 (500+ reviews)',
                    schemaPath: 'industrySpecificData.googleRating',
                },
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
            id: 'services-menu',
            title: 'Services & Menu',
            icon: '💅',
            description: 'Treatments and services you offer',
            fields: [
                {
                    key: 'servicesOffered',
                    label: 'Services Offered',
                    type: 'tags',
                    placeholder: 'e.g., Haircut, Facial, Massage, Manicure, Waxing',
                    helpText: 'List all services you provide',
                    schemaPath: 'industrySpecificData.servicesOffered',
                    aiSuggestionEnabled: true,
                    gridSpan: 2,
                    validation: { required: true },
                },
                {
                    key: 'salonServices',
                    label: 'Salon Services',
                    type: 'checkbox-group',
                    options: [
                        { value: 'haircut_men', label: 'Haircut (Men)' },
                        { value: 'haircut_women', label: 'Haircut (Women)' },
                        { value: 'hair_color', label: 'Hair Coloring' },
                        { value: 'hair_treatment', label: 'Hair Treatment (Keratin, Spa)' },
                        { value: 'bridal_makeup', label: 'Bridal Makeup' },
                        { value: 'party_makeup', label: 'Party Makeup' },
                        { value: 'facial', label: 'Facial' },
                        { value: 'cleanup', label: 'Cleanup' },
                        { value: 'threading', label: 'Threading' },
                        { value: 'waxing', label: 'Waxing' },
                        { value: 'manicure', label: 'Manicure' },
                        { value: 'pedicure', label: 'Pedicure' },
                        { value: 'nail_art', label: 'Nail Art' },
                        { value: 'mehendi', label: 'Mehendi / Henna' },
                    ],
                    schemaPath: 'industrySpecificData.salonServices',
                    gridSpan: 2,
                    showForFunctions: ['beauty_salon'],
                },
                {
                    key: 'spaServices',
                    label: 'Spa & Wellness Services',
                    type: 'checkbox-group',
                    options: [
                        { value: 'swedish_massage', label: 'Swedish Massage' },
                        { value: 'deep_tissue', label: 'Deep Tissue Massage' },
                        { value: 'thai_massage', label: 'Thai Massage' },
                        { value: 'ayurvedic', label: 'Ayurvedic Treatments' },
                        { value: 'aromatherapy', label: 'Aromatherapy' },
                        { value: 'body_scrub', label: 'Body Scrub' },
                        { value: 'body_wrap', label: 'Body Wrap' },
                        { value: 'steam_sauna', label: 'Steam/Sauna' },
                        { value: 'jacuzzi', label: 'Jacuzzi' },
                        { value: 'reflexology', label: 'Reflexology' },
                    ],
                    schemaPath: 'industrySpecificData.spaServices',
                    gridSpan: 2,
                    showForFunctions: ['spa', 'beauty_salon'],
                },
                {
                    key: 'fitnessServices',
                    label: 'Fitness Services',
                    type: 'checkbox-group',
                    options: [
                        { value: 'gym', label: 'Gym / Weight Training' },
                        { value: 'cardio', label: 'Cardio Zone' },
                        { value: 'group_classes', label: 'Group Fitness Classes' },
                        { value: 'personal_training', label: 'Personal Training' },
                        { value: 'crossfit', label: 'CrossFit' },
                        { value: 'zumba', label: 'Zumba' },
                        { value: 'aerobics', label: 'Aerobics' },
                        { value: 'yoga', label: 'Yoga Classes' },
                        { value: 'pilates', label: 'Pilates' },
                        { value: 'swimming', label: 'Swimming Pool' },
                        { value: 'martial_arts', label: 'Martial Arts' },
                    ],
                    schemaPath: 'industrySpecificData.fitnessServices',
                    gridSpan: 2,
                    showForFunctions: ['gym_fitness', 'yoga_studio'],
                },
                {
                    key: 'yogaStyles',
                    label: 'Yoga Styles',
                    type: 'checkbox-group',
                    options: [
                        { value: 'hatha', label: 'Hatha Yoga' },
                        { value: 'vinyasa', label: 'Vinyasa Flow' },
                        { value: 'ashtanga', label: 'Ashtanga Yoga' },
                        { value: 'power', label: 'Power Yoga' },
                        { value: 'hot_yoga', label: 'Hot Yoga / Bikram' },
                        { value: 'yin', label: 'Yin Yoga' },
                        { value: 'prenatal', label: 'Prenatal Yoga' },
                        { value: 'kundalini', label: 'Kundalini Yoga' },
                        { value: 'meditation', label: 'Meditation Sessions' },
                        { value: 'pranayama', label: 'Pranayama' },
                    ],
                    schemaPath: 'industrySpecificData.yogaStyles',
                    gridSpan: 2,
                    showForFunctions: ['yoga_studio'],
                },
                {
                    key: 'targetGender',
                    label: 'Target Clientele',
                    type: 'radio',
                    options: [
                        { value: 'unisex', label: 'Unisex' },
                        { value: 'women', label: 'Women Only' },
                        { value: 'men', label: 'Men Only' },
                    ],
                    schemaPath: 'industrySpecificData.targetGender',
                },
            ],
        },
        {
            id: 'team-expertise',
            title: 'Team & Expertise',
            icon: '👩‍🎨',
            description: 'Your staff and their qualifications',
            fields: [
                {
                    key: 'staffCount',
                    label: 'Total Staff',
                    type: 'number',
                    placeholder: 'e.g., 12',
                    schemaPath: 'industrySpecificData.staffCount',
                },
                {
                    key: 'stylistsCount',
                    label: 'Senior Stylists/Therapists',
                    type: 'number',
                    placeholder: 'e.g., 5',
                    schemaPath: 'industrySpecificData.stylistsCount',
                    showForFunctions: ['beauty_salon', 'spa'],
                },
                {
                    key: 'trainersCount',
                    label: 'Certified Trainers',
                    type: 'number',
                    placeholder: 'e.g., 8',
                    schemaPath: 'industrySpecificData.trainersCount',
                    showForFunctions: ['gym_fitness', 'yoga_studio'],
                },
                {
                    key: 'certifications',
                    label: 'Staff Certifications',
                    type: 'tags',
                    placeholder: 'e.g., Certified Yoga Instructor, ACE Certified, L\'Oreal Certified',
                    schemaPath: 'industrySpecificData.certifications',
                    gridSpan: 2,
                },
                {
                    key: 'specializations',
                    label: 'Team Specializations',
                    type: 'tags',
                    placeholder: 'e.g., Bridal Expert, Sports Injury Specialist, Ayurveda Therapist',
                    schemaPath: 'industrySpecificData.specializations',
                    gridSpan: 2,
                },
                {
                    key: 'yearsInBusiness',
                    label: 'Years in Business',
                    type: 'number',
                    placeholder: 'e.g., 10',
                    schemaPath: 'industrySpecificData.yearsInBusiness',
                },
                {
                    key: 'clientsServed',
                    label: 'Clients Served (Lifetime)',
                    type: 'text',
                    placeholder: 'e.g., 10,000+ happy clients',
                    schemaPath: 'industrySpecificData.clientsServed',
                },
            ],
        },
        {
            id: 'products-brands',
            title: 'Products & Brands',
            icon: '✨',
            description: 'Products and brands used',
            fields: [
                {
                    key: 'brandsUsed',
                    label: 'Brands Used',
                    type: 'tags',
                    placeholder: 'e.g., L\'Oreal, Schwarzkopf, MAC, Forest Essentials',
                    helpText: 'Premium brands you use for treatments',
                    schemaPath: 'industrySpecificData.brandsUsed',
                    gridSpan: 2,
                },
                {
                    key: 'productsForSale',
                    label: 'Products for Sale',
                    type: 'toggle',
                    helpText: 'Do you retail beauty/wellness products?',
                    schemaPath: 'industrySpecificData.productsForSale',
                },
                {
                    key: 'productBrands',
                    label: 'Retail Brands',
                    type: 'tags',
                    placeholder: 'e.g., The Body Shop, Kama Ayurveda, MyProtein',
                    schemaPath: 'industrySpecificData.productBrands',
                    showCondition: { field: 'productsForSale', operator: 'equals', value: true },
                    gridSpan: 2,
                },
                {
                    key: 'organicProducts',
                    label: 'Organic/Natural Products',
                    type: 'toggle',
                    schemaPath: 'industrySpecificData.organicProducts',
                },
                {
                    key: 'equipmentBrands',
                    label: 'Equipment Brands',
                    type: 'tags',
                    placeholder: 'e.g., Technogym, Life Fitness, Hammer Strength',
                    schemaPath: 'industrySpecificData.equipmentBrands',
                    showForFunctions: ['gym_fitness'],
                    gridSpan: 2,
                },
            ],
        },
        {
            id: 'facility-amenities',
            title: 'Facility & Amenities',
            icon: '🏢',
            description: 'Your space and facilities',
            fields: [
                {
                    key: 'facilitySize',
                    label: 'Facility Size (sq ft)',
                    type: 'number',
                    placeholder: 'e.g., 2000',
                    schemaPath: 'industrySpecificData.facilitySize',
                },
                {
                    key: 'workstations',
                    label: 'Workstations/Chairs',
                    type: 'number',
                    placeholder: 'e.g., 10',
                    schemaPath: 'industrySpecificData.workstations',
                    showForFunctions: ['beauty_salon'],
                },
                {
                    key: 'treatmentRooms',
                    label: 'Treatment Rooms',
                    type: 'number',
                    placeholder: 'e.g., 5',
                    schemaPath: 'industrySpecificData.treatmentRooms',
                    showForFunctions: ['spa'],
                },
                {
                    key: 'amenities',
                    label: 'Amenities',
                    type: 'checkbox-group',
                    options: [
                        { value: 'ac', label: 'Air Conditioned' },
                        { value: 'parking', label: 'Parking' },
                        { value: 'wifi', label: 'Free WiFi' },
                        { value: 'refreshments', label: 'Complimentary Refreshments' },
                        { value: 'private_rooms', label: 'Private Treatment Rooms' },
                        { value: 'couple_rooms', label: 'Couple Rooms' },
                        { value: 'locker_rooms', label: 'Locker Rooms' },
                        { value: 'shower', label: 'Shower Facilities' },
                        { value: 'steam_room', label: 'Steam Room' },
                        { value: 'sauna', label: 'Sauna' },
                        { value: 'changing_room', label: 'Changing Rooms' },
                        { value: 'magazine_entertainment', label: 'Magazines/Entertainment' },
                    ],
                    schemaPath: 'industrySpecificData.amenities',
                    gridSpan: 2,
                },
                {
                    key: 'ambiance',
                    label: 'Ambiance',
                    type: 'tags',
                    placeholder: 'e.g., Modern, Luxury, Zen, Boutique, Premium',
                    schemaPath: 'industrySpecificData.ambiance',
                    aiSuggestionEnabled: true,
                },
            ],
        },
        {
            id: 'booking-pricing',
            title: 'Booking & Pricing',
            icon: '📅',
            description: 'How clients can book and pricing structure',
            fields: [
                {
                    key: 'appointmentRequired',
                    label: 'Appointment Required',
                    type: 'toggle',
                    schemaPath: 'industrySpecificData.appointmentRequired',
                },
                {
                    key: 'walkInsAccepted',
                    label: 'Walk-ins Accepted',
                    type: 'toggle',
                    schemaPath: 'industrySpecificData.walkInsAccepted',
                },
                {
                    key: 'onlineBooking',
                    label: 'Online Booking',
                    type: 'toggle',
                    schemaPath: 'industrySpecificData.onlineBooking',
                },
                {
                    key: 'bookingPlatforms',
                    label: 'Booking Platforms',
                    type: 'checkbox-group',
                    options: [
                        { value: 'own_website', label: 'Own Website' },
                        { value: 'whatsapp', label: 'WhatsApp' },
                        { value: 'urban_company', label: 'Urban Company' },
                        { value: 'justdial', label: 'JustDial' },
                        { value: 'google', label: 'Google Reserve' },
                    ],
                    schemaPath: 'industrySpecificData.bookingPlatforms',
                    showCondition: { field: 'onlineBooking', operator: 'equals', value: true },
                    gridSpan: 2,
                    showForCountries: ['IN'],
                },
                {
                    key: 'homeService',
                    label: 'Home Service Available',
                    type: 'toggle',
                    schemaPath: 'industrySpecificData.homeService',
                },
                {
                    key: 'homeServiceRadius',
                    label: 'Home Service Radius',
                    type: 'text',
                    placeholder: 'e.g., 10 km',
                    schemaPath: 'industrySpecificData.homeServiceRadius',
                    showCondition: { field: 'homeService', operator: 'equals', value: true },
                },
                {
                    key: 'priceRange',
                    label: 'Price Range',
                    type: 'text',
                    placeholder: 'e.g., ₹500 - ₹5,000',
                    schemaPath: 'industrySpecificData.priceRange',
                },
                {
                    key: 'membershipPlans',
                    label: 'Membership Plans',
                    type: 'toggle',
                    schemaPath: 'industrySpecificData.membershipPlans',
                },
                {
                    key: 'membershipTypes',
                    label: 'Membership Types',
                    type: 'checkbox-group',
                    options: [
                        { value: 'monthly', label: 'Monthly' },
                        { value: 'quarterly', label: 'Quarterly' },
                        { value: 'half_yearly', label: 'Half Yearly' },
                        { value: 'annual', label: 'Annual' },
                        { value: 'lifetime', label: 'Lifetime' },
                        { value: 'pay_per_session', label: 'Pay Per Session' },
                    ],
                    schemaPath: 'industrySpecificData.membershipTypes',
                    showCondition: { field: 'membershipPlans', operator: 'equals', value: true },
                    gridSpan: 2,
                },
                {
                    key: 'packages',
                    label: 'Package Deals Available',
                    type: 'toggle',
                    schemaPath: 'industrySpecificData.packages',
                },
                {
                    key: 'trialSession',
                    label: 'Trial Session Available',
                    type: 'toggle',
                    schemaPath: 'industrySpecificData.trialSession',
                },
            ],
        },
        {
            id: 'hygiene-standards',
            title: 'Hygiene & Standards',
            icon: '🛡️',
            description: 'Safety and hygiene practices',
            collapsible: true,
            defaultExpanded: false,
            fields: [
                {
                    key: 'hygieneStandards',
                    label: 'Hygiene Practices',
                    type: 'checkbox-group',
                    options: [
                        { value: 'disposable_tools', label: 'Disposable Tools (where applicable)' },
                        { value: 'sterilization', label: 'Equipment Sterilization' },
                        { value: 'sanitization', label: 'Regular Sanitization' },
                        { value: 'fresh_linens', label: 'Fresh Linens per Client' },
                        { value: 'trained_staff', label: 'Hygiene Trained Staff' },
                        { value: 'masks_gloves', label: 'Masks & Gloves Used' },
                    ],
                    schemaPath: 'industrySpecificData.hygieneStandards',
                    gridSpan: 2,
                },
                {
                    key: 'covidSafetyMeasures',
                    label: 'Additional Safety Measures',
                    type: 'tags',
                    placeholder: 'e.g., Temperature Check, Sanitizer Stations, Limited Capacity',
                    schemaPath: 'industrySpecificData.covidSafetyMeasures',
                    gridSpan: 2,
                },
                {
                    key: 'googleRating',
                    label: 'Google Rating',
                    type: 'text',
                    placeholder: 'e.g., 4.8/5 (200+ reviews)',
                    schemaPath: 'industrySpecificData.googleRating',
                },
                {
                    key: 'awards',
                    label: 'Awards & Recognition',
                    type: 'tags',
                    placeholder: 'e.g., Best Salon 2023, Times Award Winner',
                    schemaPath: 'industrySpecificData.awards',
                    gridSpan: 2,
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

