// src/lib/business-type-agents.ts
// Agent templates and configurations based on business type/industry

import { AgentRole, AgentTone, AgentStyle, AgentLength, EscalationSettings, LeadQualificationSettings, CampaignSettings } from './partnerhub-types';
import { IndustryCategory, VoiceTone } from './business-persona-types';

// ============================================================================
// AGENT TEMPLATE TYPES
// ============================================================================

export interface AgentTemplate {
    id: string;
    role: AgentRole | 'custom';
    name: string;
    description: string;
    avatar: string;
    icon: string;

    // Default personality settings
    tones: AgentTone[];
    style: AgentStyle;
    responseLength: AgentLength;

    // Pre-configured settings
    escalationSettings: EscalationSettings;
    leadSettings?: LeadQualificationSettings;
    campaignSettings?: CampaignSettings;

    // Industry-specific
    useCases: string[];
    bestFor: string;
    sampleResponses?: string[];
    suggestedFAQs?: { question: string; answer: string }[];

    // Visual
    gradient: string;
    bgLight: string;
    textColor: string;
    borderColor: string;
}

export interface IndustryAgentConfig {
    industryCategory: IndustryCategory;
    recommendedAgents: AgentRole[];
    agentOverrides: {
        [key in AgentRole]?: Partial<AgentTemplate>;
    };
    customAgentSuggestions: {
        name: string;
        description: string;
        useCases: string[];
    }[];
}

// ============================================================================
// BASE AGENT TEMPLATES (Default configurations)
// ============================================================================

export const BASE_AGENT_TEMPLATES: Record<AgentRole, AgentTemplate> = {
    [AgentRole.CUSTOMER_CARE]: {
        id: 'customer_care',
        role: AgentRole.CUSTOMER_CARE,
        name: 'Customer Support',
        description: 'Handles questions and concerns from existing customers',
        avatar: 'Bot',
        icon: 'HeadphonesIcon',
        tones: ['professional', 'empathetic'],
        style: 'conversational',
        responseLength: 'moderate',
        escalationSettings: {
            onHumanRequest: true,
            humanRequestKeywords: ['human', 'person', 'agent', 'manager', 'speak to someone', 'real person'],
            onFrustration: true,
            frustrationThreshold: 3,
            onNoAnswer: true,
            noAnswerAttempts: 2,
            onSensitiveTopics: true,
            sensitiveTopics: ['refund', 'complaint', 'legal', 'lawyer', 'sue'],
            escalationMessage: "I understand this is important to you. Let me connect you with a team member who can help you better.",
        },
        useCases: [
            'Order status inquiries',
            'Return & refund questions',
            'Product troubleshooting',
            'Account issues',
            'General inquiries',
        ],
        bestFor: 'Inbox conversations with existing customers',
        gradient: 'from-blue-500 to-blue-600',
        bgLight: 'bg-blue-50',
        textColor: 'text-blue-600',
        borderColor: 'border-blue-200',
    },
    [AgentRole.SALES_ASSISTANT]: {
        id: 'sales_assistant',
        role: AgentRole.SALES_ASSISTANT,
        name: 'Sales Assistant',
        description: 'Helps potential customers learn about your offerings and converts inquiries',
        avatar: 'Zap',
        icon: 'TrendingUpIcon',
        tones: ['friendly', 'professional'],
        style: 'conversational',
        responseLength: 'moderate',
        escalationSettings: {
            onHumanRequest: true,
            humanRequestKeywords: ['human', 'person', 'call me', 'speak to sales', 'talk to someone'],
            onFrustration: false,
            frustrationThreshold: 3,
            onNoAnswer: true,
            noAnswerAttempts: 2,
            onSensitiveTopics: false,
            sensitiveTopics: [],
            escalationMessage: "I'd be happy to have someone from our team reach out to you personally!",
        },
        leadSettings: {
            askBudget: false,
            budgetQuestion: '',
            askAuthority: false,
            authorityQuestion: '',
            askNeed: true,
            needQuestion: 'What are you looking for today?',
            askTimeline: false,
            timelineQuestion: '',
            hotLeadAction: 'notify_email',
            warmLeadAction: 'add_pipeline',
            coldLeadAction: 'nurture',
            products: [],
        },
        useCases: [
            'Product/service questions',
            'Pricing inquiries',
            'Feature comparisons',
            'Booking appointments',
            'Quote requests',
        ],
        bestFor: 'Converting inquiries into customers',
        gradient: 'from-amber-500 to-orange-500',
        bgLight: 'bg-amber-50',
        textColor: 'text-amber-600',
        borderColor: 'border-amber-200',
    },
    [AgentRole.MARKETING_COMMS]: {
        id: 'marketing_comms',
        role: AgentRole.MARKETING_COMMS,
        name: 'Marketing & Outreach',
        description: 'Sends birthday wishes, promotions, updates, and re-engagement messages',
        avatar: 'Sparkles',
        icon: 'MegaphoneIcon',
        tones: ['friendly', 'creative'],
        style: 'casual',
        responseLength: 'brief',
        escalationSettings: {
            onHumanRequest: true,
            humanRequestKeywords: ['unsubscribe', 'stop', 'opt out', 'remove me'],
            onFrustration: false,
            frustrationThreshold: 3,
            onNoAnswer: false,
            noAnswerAttempts: 2,
            onSensitiveTopics: false,
            sensitiveTopics: [],
            escalationMessage: "",
        },
        campaignSettings: {
            enableBirthday: true,
            birthdayDaysBefore: 0,
            birthdayChannel: 'whatsapp',
            birthdayIncludeOffer: false,
            enableAnniversary: false,
            enableWelcome: true,
            enableThankYou: false,
            holidays: [],
            brandColors: ['#4F46E5'],
            imageStyle: 'modern',
            includeLogo: true,
            maxMessagesPerMonth: 4,
            quietHoursStart: '21:00',
            quietHoursEnd: '08:00',
            requireApprovalOver: 100,
        },
        useCases: [
            'Birthday wishes',
            'Promotional messages',
            'New arrival alerts',
            'Re-engagement campaigns',
            'Seasonal offers',
        ],
        bestFor: 'Automated outreach campaigns',
        gradient: 'from-purple-500 to-pink-500',
        bgLight: 'bg-purple-50',
        textColor: 'text-purple-600',
        borderColor: 'border-purple-200',
    },
};

// ============================================================================
// INDUSTRY-SPECIFIC AGENT CONFIGURATIONS
// ============================================================================

export const INDUSTRY_AGENT_CONFIGS: Record<IndustryCategory, IndustryAgentConfig> = {
    retail: {
        industryCategory: 'retail',
        recommendedAgents: [AgentRole.CUSTOMER_CARE, AgentRole.SALES_ASSISTANT, AgentRole.MARKETING_COMMS],
        agentOverrides: {
            [AgentRole.CUSTOMER_CARE]: {
                name: 'Shopping Assistant',
                description: 'Helps customers with orders, returns, and product questions',
                useCases: [
                    'Order tracking & status',
                    'Return & exchange requests',
                    'Product availability',
                    'Size & fit guidance',
                    'Delivery inquiries',
                ],
                escalationSettings: {
                    onHumanRequest: true,
                    humanRequestKeywords: ['human', 'person', 'agent', 'manager', 'speak to someone'],
                    onFrustration: true,
                    frustrationThreshold: 2,
                    onNoAnswer: true,
                    noAnswerAttempts: 2,
                    onSensitiveTopics: true,
                    sensitiveTopics: ['refund', 'damaged', 'wrong item', 'missing order', 'complaint'],
                    escalationMessage: "I understand your concern. Let me connect you with our customer care team right away.",
                },
                suggestedFAQs: [
                    { question: 'How can I track my order?', answer: 'You can track your order using the tracking link sent to your email/phone, or share your order ID and I can help you check the status.' },
                    { question: 'What is your return policy?', answer: 'We offer easy returns within [X] days of delivery. Items must be unused with original tags.' },
                    { question: 'Do you offer cash on delivery?', answer: 'Yes, we offer COD for orders within [location]. For prepaid orders, you can use UPI, cards, or net banking.' },
                ],
            },
            [AgentRole.SALES_ASSISTANT]: {
                name: 'Product Expert',
                description: 'Helps shoppers find the right products and make purchase decisions',
                useCases: [
                    'Product recommendations',
                    'Price & discount info',
                    'Stock availability',
                    'Product comparisons',
                    'Special offers',
                ],
                leadSettings: {
                    askBudget: true,
                    budgetQuestion: 'What budget range works for you?',
                    askAuthority: false,
                    authorityQuestion: '',
                    askNeed: true,
                    needQuestion: 'What are you shopping for today?',
                    askTimeline: false,
                    timelineQuestion: '',
                    hotLeadAction: 'notify_email',
                    warmLeadAction: 'add_pipeline',
                    coldLeadAction: 'nurture',
                    products: [],
                },
            },
            [AgentRole.MARKETING_COMMS]: {
                name: 'Promo Manager',
                description: 'Sends sale alerts, new arrivals, and personalized offers',
                useCases: [
                    'Sale announcements',
                    'New arrivals alerts',
                    'Restocked items',
                    'Personalized recommendations',
                    'Festival offers',
                ],
            },
        },
        customAgentSuggestions: [
            { name: 'Size Advisor', description: 'Helps customers find their perfect size', useCases: ['Size recommendations', 'Fit guidance', 'Measurement help'] },
            { name: 'Gift Finder', description: 'Helps find perfect gifts for any occasion', useCases: ['Gift suggestions', 'Budget-based picks', 'Occasion guidance'] },
        ],
    },

    food_beverage: {
        industryCategory: 'food_beverage',
        recommendedAgents: [AgentRole.CUSTOMER_CARE, AgentRole.SALES_ASSISTANT, AgentRole.MARKETING_COMMS],
        agentOverrides: {
            [AgentRole.CUSTOMER_CARE]: {
                name: 'Order Support',
                description: 'Handles order issues, complaints, and delivery inquiries',
                tones: ['friendly', 'empathetic'],
                useCases: [
                    'Order status & tracking',
                    'Missing items',
                    'Quality complaints',
                    'Delivery delays',
                    'Refund requests',
                ],
                escalationSettings: {
                    onHumanRequest: true,
                    humanRequestKeywords: ['human', 'person', 'manager', 'owner', 'speak to someone'],
                    onFrustration: true,
                    frustrationThreshold: 2,
                    onNoAnswer: true,
                    noAnswerAttempts: 2,
                    onSensitiveTopics: true,
                    sensitiveTopics: ['food poisoning', 'sick', 'allergy', 'refund', 'hair in food', 'complaint'],
                    escalationMessage: "I'm really sorry about this. Let me immediately connect you with our manager to resolve this.",
                },
                suggestedFAQs: [
                    { question: 'Where is my order?', answer: 'Let me check your order status. Could you share your order ID or phone number?' },
                    { question: 'Something is missing from my order', answer: 'I apologize for the missing item! Please share your order details and I\'ll help resolve this immediately.' },
                    { question: 'Can I modify my order?', answer: 'Orders can be modified within [X] minutes of placing. Let me check if we can still make changes.' },
                ],
            },
            [AgentRole.SALES_ASSISTANT]: {
                name: 'Menu Assistant',
                description: 'Helps customers explore the menu and place orders',
                tones: ['friendly', 'casual'],
                useCases: [
                    'Menu recommendations',
                    'Today\'s specials',
                    'Dietary options (veg/vegan)',
                    'Ingredient questions',
                    'Combo suggestions',
                ],
                leadSettings: {
                    askBudget: false,
                    budgetQuestion: '',
                    askAuthority: false,
                    authorityQuestion: '',
                    askNeed: true,
                    needQuestion: 'What are you in the mood for today?',
                    askTimeline: true,
                    timelineQuestion: 'When would you like to receive your order?',
                    hotLeadAction: 'notify_email',
                    warmLeadAction: 'add_pipeline',
                    coldLeadAction: 'nurture',
                    products: [],
                },
            },
            [AgentRole.MARKETING_COMMS]: {
                name: 'Foodie Updates',
                description: 'Sends daily specials, new dishes, and exclusive offers',
                tones: ['friendly', 'creative'],
                useCases: [
                    'Daily specials',
                    'New menu items',
                    'Weekend offers',
                    'Festival specials',
                    'Loyalty rewards',
                ],
                campaignSettings: {
                    enableBirthday: true,
                    birthdayDaysBefore: 0,
                    birthdayChannel: 'whatsapp',
                    birthdayIncludeOffer: true,
                    enableAnniversary: false,
                    enableWelcome: true,
                    enableThankYou: true,
                    holidays: [
                        { name: 'Diwali', enabled: true },
                        { name: 'Christmas', enabled: true },
                        { name: 'New Year', enabled: true },
                    ],
                    brandColors: ['#FF6B35'],
                    imageStyle: 'playful',
                    includeLogo: true,
                    maxMessagesPerMonth: 8,
                    quietHoursStart: '22:00',
                    quietHoursEnd: '09:00',
                    requireApprovalOver: 50,
                },
            },
        },
        customAgentSuggestions: [
            { name: 'Reservation Bot', description: 'Handles table bookings and reservations', useCases: ['Table booking', 'Party reservations', 'Timing availability'] },
            { name: 'Catering Assistant', description: 'Helps with bulk/catering orders', useCases: ['Bulk orders', 'Event catering', 'Custom menus'] },
        ],
    },

    services: {
        industryCategory: 'services',
        recommendedAgents: [AgentRole.SALES_ASSISTANT, AgentRole.CUSTOMER_CARE],
        agentOverrides: {
            [AgentRole.CUSTOMER_CARE]: {
                name: 'Client Support',
                description: 'Handles client inquiries and project-related questions',
                tones: ['professional', 'empathetic'],
                useCases: [
                    'Project status updates',
                    'Invoice queries',
                    'Scope clarifications',
                    'Timeline questions',
                    'Feedback collection',
                ],
                escalationSettings: {
                    onHumanRequest: true,
                    humanRequestKeywords: ['human', 'person', 'manager', 'partner', 'senior', 'escalate'],
                    onFrustration: true,
                    frustrationThreshold: 2,
                    onNoAnswer: true,
                    noAnswerAttempts: 2,
                    onSensitiveTopics: true,
                    sensitiveTopics: ['contract', 'legal', 'dispute', 'termination', 'refund', 'unhappy'],
                    escalationMessage: "I understand this needs personal attention. Let me connect you with the right person on our team.",
                },
            },
            [AgentRole.SALES_ASSISTANT]: {
                name: 'Business Development',
                description: 'Qualifies leads and explains service offerings',
                tones: ['professional', 'consultative'],
                style: 'formal',
                useCases: [
                    'Service explanations',
                    'Pricing discussions',
                    'Consultation booking',
                    'Portfolio sharing',
                    'Proposal requests',
                ],
                leadSettings: {
                    askBudget: true,
                    budgetQuestion: 'Do you have a budget range in mind for this project?',
                    askAuthority: true,
                    authorityQuestion: 'Are you the decision maker for this project?',
                    askNeed: true,
                    needQuestion: 'What challenges are you looking to solve?',
                    askTimeline: true,
                    timelineQuestion: 'When are you looking to start this project?',
                    hotLeadAction: 'notify_email',
                    warmLeadAction: 'schedule_followup',
                    coldLeadAction: 'nurture',
                    products: [],
                },
            },
            [AgentRole.MARKETING_COMMS]: {
                name: 'Newsletter Manager',
                description: 'Sends industry insights, case studies, and service updates',
                tones: ['professional', 'creative'],
                useCases: [
                    'Industry insights',
                    'Case study shares',
                    'Service updates',
                    'Webinar invites',
                    'Thought leadership',
                ],
            },
        },
        customAgentSuggestions: [
            { name: 'Proposal Assistant', description: 'Helps create and explain proposals', useCases: ['Proposal details', 'Scope clarification', 'Cost breakdown'] },
            { name: 'Onboarding Guide', description: 'Helps new clients get started', useCases: ['Getting started', 'Documentation', 'Process walkthrough'] },
        ],
    },

    healthcare: {
        industryCategory: 'healthcare',
        recommendedAgents: [AgentRole.CUSTOMER_CARE, AgentRole.SALES_ASSISTANT],
        agentOverrides: {
            [AgentRole.CUSTOMER_CARE]: {
                name: 'Patient Support',
                description: 'Helps patients with appointments, reports, and general queries',
                tones: ['professional', 'empathetic'],
                style: 'formal',
                useCases: [
                    'Appointment scheduling',
                    'Report inquiries',
                    'Doctor availability',
                    'Prescription refills',
                    'Insurance queries',
                ],
                escalationSettings: {
                    onHumanRequest: true,
                    humanRequestKeywords: ['human', 'person', 'doctor', 'nurse', 'emergency', 'urgent'],
                    onFrustration: true,
                    frustrationThreshold: 2,
                    onNoAnswer: true,
                    noAnswerAttempts: 1,
                    onSensitiveTopics: true,
                    sensitiveTopics: ['emergency', 'pain', 'bleeding', 'serious', 'dying', 'medical advice', 'diagnosis'],
                    escalationMessage: "I understand this is important. Let me immediately connect you with our medical staff.",
                },
                suggestedFAQs: [
                    { question: 'How do I book an appointment?', answer: 'You can book an appointment by calling us, through our website, or I can help you schedule right here. Which doctor would you like to see?' },
                    { question: 'What are the consultation fees?', answer: 'Consultation fees vary by doctor and specialty. I can share the fee structure for your required service.' },
                    { question: 'Do you accept insurance?', answer: 'Yes, we accept various insurance providers. Please share your insurance details and I can verify coverage.' },
                ],
            },
            [AgentRole.SALES_ASSISTANT]: {
                name: 'Health Advisor',
                description: 'Explains services, packages, and helps with health program inquiries',
                tones: ['professional', 'empathetic'],
                useCases: [
                    'Health package details',
                    'Service explanations',
                    'Pricing information',
                    'Specialist consultations',
                    'Second opinion requests',
                ],
                leadSettings: {
                    askBudget: false,
                    budgetQuestion: '',
                    askAuthority: false,
                    authorityQuestion: '',
                    askNeed: true,
                    needQuestion: 'What health concern would you like to address?',
                    askTimeline: true,
                    timelineQuestion: 'When would you like to schedule your visit?',
                    hotLeadAction: 'notify_email',
                    warmLeadAction: 'add_pipeline',
                    coldLeadAction: 'nurture',
                    products: [],
                },
            },
            [AgentRole.MARKETING_COMMS]: {
                name: 'Health Updates',
                description: 'Sends appointment reminders, health tips, and checkup reminders',
                tones: ['professional', 'empathetic'],
                useCases: [
                    'Appointment reminders',
                    'Health tips',
                    'Checkup reminders',
                    'Vaccination schedules',
                    'Health camp notifications',
                ],
                campaignSettings: {
                    enableBirthday: true,
                    birthdayDaysBefore: 0,
                    birthdayChannel: 'whatsapp',
                    birthdayIncludeOffer: false,
                    enableAnniversary: false,
                    enableWelcome: true,
                    enableThankYou: true,
                    holidays: [],
                    brandColors: ['#059669'],
                    imageStyle: 'modern',
                    includeLogo: true,
                    maxMessagesPerMonth: 4,
                    quietHoursStart: '21:00',
                    quietHoursEnd: '08:00',
                    requireApprovalOver: 100,
                },
            },
        },
        customAgentSuggestions: [
            { name: 'Appointment Scheduler', description: 'Dedicated assistant for booking appointments', useCases: ['Book appointments', 'Reschedule', 'Cancel bookings'] },
            { name: 'Lab Report Helper', description: 'Helps patients understand their reports', useCases: ['Report explanations', 'Download reports', 'Share with doctors'] },
        ],
    },

    education: {
        industryCategory: 'education',
        recommendedAgents: [AgentRole.SALES_ASSISTANT, AgentRole.CUSTOMER_CARE, AgentRole.MARKETING_COMMS],
        agentOverrides: {
            [AgentRole.CUSTOMER_CARE]: {
                name: 'Student Support',
                description: 'Helps students and parents with course-related queries',
                tones: ['friendly', 'professional'],
                useCases: [
                    'Course information',
                    'Schedule queries',
                    'Fee structure',
                    'Certificate requests',
                    'Attendance issues',
                ],
                suggestedFAQs: [
                    { question: 'What courses do you offer?', answer: 'We offer courses in [subjects]. Each course is designed to help students achieve their learning goals effectively.' },
                    { question: 'What are the batch timings?', answer: 'We have flexible batch timings - morning, afternoon, and evening slots. Let me share the current schedule.' },
                    { question: 'Is there a demo class?', answer: 'Yes! We offer a free demo class so you can experience our teaching methodology. Would you like to schedule one?' },
                ],
            },
            [AgentRole.SALES_ASSISTANT]: {
                name: 'Admissions Counselor',
                description: 'Helps prospective students understand programs and enroll',
                tones: ['friendly', 'professional'],
                useCases: [
                    'Course details',
                    'Admission process',
                    'Fee information',
                    'Demo class booking',
                    'Batch availability',
                ],
                leadSettings: {
                    askBudget: false,
                    budgetQuestion: '',
                    askAuthority: true,
                    authorityQuestion: 'Are you inquiring for yourself or for your child?',
                    askNeed: true,
                    needQuestion: 'What subject or skill would you like to learn?',
                    askTimeline: true,
                    timelineQuestion: 'When are you looking to start?',
                    hotLeadAction: 'notify_email',
                    warmLeadAction: 'schedule_followup',
                    coldLeadAction: 'nurture',
                    products: [],
                },
            },
            [AgentRole.MARKETING_COMMS]: {
                name: 'Education Updates',
                description: 'Sends course updates, batch announcements, and achievement highlights',
                tones: ['friendly', 'creative'],
                useCases: [
                    'New batch announcements',
                    'Exam reminders',
                    'Result celebrations',
                    'Workshop invites',
                    'Parent-teacher meet reminders',
                ],
            },
        },
        customAgentSuggestions: [
            { name: 'Homework Helper', description: 'Assists students with study questions', useCases: ['Subject help', 'Doubt clearing', 'Practice problems'] },
            { name: 'Career Counselor', description: 'Guides students on career paths', useCases: ['Career guidance', 'Course recommendations', 'Industry insights'] },
        ],
    },

    hospitality: {
        industryCategory: 'hospitality',
        recommendedAgents: [AgentRole.SALES_ASSISTANT, AgentRole.CUSTOMER_CARE, AgentRole.MARKETING_COMMS],
        agentOverrides: {
            [AgentRole.CUSTOMER_CARE]: {
                name: 'Guest Services',
                description: 'Assists guests with stay-related queries and requests',
                tones: ['professional', 'friendly'],
                useCases: [
                    'Booking modifications',
                    'Room service requests',
                    'Amenity information',
                    'Check-in/out queries',
                    'Complaint handling',
                ],
                escalationSettings: {
                    onHumanRequest: true,
                    humanRequestKeywords: ['human', 'person', 'manager', 'duty manager', 'front desk'],
                    onFrustration: true,
                    frustrationThreshold: 2,
                    onNoAnswer: true,
                    noAnswerAttempts: 2,
                    onSensitiveTopics: true,
                    sensitiveTopics: ['refund', 'complaint', 'dirty', 'unsafe', 'bed bugs', 'overcharged'],
                    escalationMessage: "I sincerely apologize for the inconvenience. Let me connect you with our duty manager immediately.",
                },
            },
            [AgentRole.SALES_ASSISTANT]: {
                name: 'Reservations',
                description: 'Handles booking inquiries and helps guests plan their stay',
                tones: ['professional', 'friendly'],
                useCases: [
                    'Room availability',
                    'Rate inquiries',
                    'Package details',
                    'Booking assistance',
                    'Group bookings',
                ],
                leadSettings: {
                    askBudget: true,
                    budgetQuestion: 'What\'s your budget per night?',
                    askAuthority: false,
                    authorityQuestion: '',
                    askNeed: true,
                    needQuestion: 'What type of room or experience are you looking for?',
                    askTimeline: true,
                    timelineQuestion: 'What are your check-in and check-out dates?',
                    hotLeadAction: 'notify_email',
                    warmLeadAction: 'add_pipeline',
                    coldLeadAction: 'nurture',
                    products: [],
                },
            },
            [AgentRole.MARKETING_COMMS]: {
                name: 'Travel Promotions',
                description: 'Sends special offers, seasonal packages, and loyalty rewards',
                tones: ['friendly', 'creative'],
                useCases: [
                    'Seasonal offers',
                    'Early bird deals',
                    'Loyalty rewards',
                    'Festival packages',
                    'Last-minute deals',
                ],
            },
        },
        customAgentSuggestions: [
            { name: 'Concierge', description: 'Recommends local attractions and activities', useCases: ['Local recommendations', 'Activity booking', 'Transport arrangements'] },
            { name: 'Event Planner', description: 'Helps plan events and conferences', useCases: ['Event spaces', 'Catering options', 'AV requirements'] },
        ],
    },

    real_estate: {
        industryCategory: 'real_estate',
        recommendedAgents: [AgentRole.SALES_ASSISTANT, AgentRole.CUSTOMER_CARE],
        agentOverrides: {
            [AgentRole.CUSTOMER_CARE]: {
                name: 'Property Support',
                description: 'Assists with documentation, possession, and post-sale queries',
                tones: ['professional', 'empathetic'],
                useCases: [
                    'Documentation status',
                    'Possession updates',
                    'Payment schedule',
                    'Construction progress',
                    'Maintenance requests',
                ],
            },
            [AgentRole.SALES_ASSISTANT]: {
                name: 'Property Consultant',
                description: 'Helps prospects find the right property and schedule visits',
                tones: ['professional', 'consultative'],
                useCases: [
                    'Property listings',
                    'Site visit scheduling',
                    'Price negotiations',
                    'Loan assistance',
                    'Legal documentation',
                ],
                leadSettings: {
                    askBudget: true,
                    budgetQuestion: 'What\'s your budget range for the property?',
                    askAuthority: true,
                    authorityQuestion: 'Are you the primary decision maker?',
                    askNeed: true,
                    needQuestion: 'What type of property are you looking for? (BHK, location preference)',
                    askTimeline: true,
                    timelineQuestion: 'When are you planning to make this purchase?',
                    hotLeadAction: 'notify_email',
                    warmLeadAction: 'schedule_followup',
                    coldLeadAction: 'nurture',
                    products: [],
                },
            },
            [AgentRole.MARKETING_COMMS]: {
                name: 'Property Updates',
                description: 'Sends new project launches, price updates, and investment opportunities',
                tones: ['professional', 'creative'],
                useCases: [
                    'New project launches',
                    'Price revisions',
                    'Investment opportunities',
                    'Open house invites',
                    'Construction milestones',
                ],
            },
        },
        customAgentSuggestions: [
            { name: 'Home Loan Advisor', description: 'Helps with loan calculations and bank tie-ups', useCases: ['EMI calculation', 'Bank options', 'Document requirements'] },
            { name: 'Interior Consultant', description: 'Helps with interior design and furnishing', useCases: ['Design suggestions', 'Vendor connections', 'Budget planning'] },
        ],
    },

    finance: {
        industryCategory: 'finance',
        recommendedAgents: [AgentRole.CUSTOMER_CARE, AgentRole.SALES_ASSISTANT],
        agentOverrides: {
            [AgentRole.CUSTOMER_CARE]: {
                name: 'Account Support',
                description: 'Handles account queries, statements, and service requests',
                tones: ['professional', 'formal'],
                useCases: [
                    'Account inquiries',
                    'Statement requests',
                    'Transaction queries',
                    'Service complaints',
                    'Document requests',
                ],
                escalationSettings: {
                    onHumanRequest: true,
                    humanRequestKeywords: ['human', 'person', 'manager', 'supervisor', 'escalate'],
                    onFrustration: true,
                    frustrationThreshold: 2,
                    onNoAnswer: true,
                    noAnswerAttempts: 1,
                    onSensitiveTopics: true,
                    sensitiveTopics: ['fraud', 'unauthorized', 'dispute', 'legal', 'lost card', 'stolen', 'regulatory'],
                    escalationMessage: "I understand the urgency. Let me immediately connect you with our senior support team.",
                },
            },
            [AgentRole.SALES_ASSISTANT]: {
                name: 'Financial Advisor',
                description: 'Explains products and helps clients make informed decisions',
                tones: ['professional', 'consultative'],
                style: 'formal',
                useCases: [
                    'Product explanations',
                    'Investment options',
                    'Insurance plans',
                    'Loan products',
                    'Tax planning',
                ],
                leadSettings: {
                    askBudget: true,
                    budgetQuestion: 'How much are you looking to invest or save?',
                    askAuthority: true,
                    authorityQuestion: 'Will this be a joint decision or are you the primary decision maker?',
                    askNeed: true,
                    needQuestion: 'What are your financial goals? (growth, security, tax saving)',
                    askTimeline: true,
                    timelineQuestion: 'What\'s your investment horizon?',
                    hotLeadAction: 'notify_email',
                    warmLeadAction: 'schedule_followup',
                    coldLeadAction: 'nurture',
                    products: [],
                },
            },
            [AgentRole.MARKETING_COMMS]: {
                name: 'Finance Updates',
                description: 'Sends market updates, new products, and financial tips',
                tones: ['professional', 'formal'],
                useCases: [
                    'Market updates',
                    'New product launches',
                    'Policy renewals',
                    'Tax deadlines',
                    'Financial tips',
                ],
            },
        },
        customAgentSuggestions: [
            { name: 'Tax Calculator', description: 'Helps with tax calculations and savings', useCases: ['Tax estimation', 'Savings suggestions', 'Filing deadlines'] },
            { name: 'Loan Calculator', description: 'Helps calculate EMIs and eligibility', useCases: ['EMI calculation', 'Eligibility check', 'Rate comparison'] },
        ],
    },

    technology: {
        industryCategory: 'technology',
        recommendedAgents: [AgentRole.CUSTOMER_CARE, AgentRole.SALES_ASSISTANT],
        agentOverrides: {
            [AgentRole.CUSTOMER_CARE]: {
                name: 'Tech Support',
                description: 'Helps users with technical issues and product queries',
                tones: ['professional', 'friendly'],
                useCases: [
                    'Technical troubleshooting',
                    'Feature questions',
                    'Bug reports',
                    'Account issues',
                    'Integration help',
                ],
                suggestedFAQs: [
                    { question: 'How do I reset my password?', answer: 'You can reset your password by clicking "Forgot Password" on the login page. You\'ll receive a reset link via email.' },
                    { question: 'Is my data secure?', answer: 'Yes, we use industry-standard encryption and security measures to protect your data. We are compliant with [relevant certifications].' },
                    { question: 'How do I integrate with my existing tools?', answer: 'We offer integrations with popular tools. Check our documentation or I can guide you through the setup process.' },
                ],
            },
            [AgentRole.SALES_ASSISTANT]: {
                name: 'Solutions Consultant',
                description: 'Explains product features and helps find the right plan',
                tones: ['professional', 'consultative'],
                useCases: [
                    'Product demos',
                    'Feature comparisons',
                    'Pricing plans',
                    'Enterprise solutions',
                    'Custom requirements',
                ],
                leadSettings: {
                    askBudget: true,
                    budgetQuestion: 'What\'s your budget for this solution?',
                    askAuthority: true,
                    authorityQuestion: 'Are you evaluating this for your team or company?',
                    askNeed: true,
                    needQuestion: 'What problem are you trying to solve?',
                    askTimeline: true,
                    timelineQuestion: 'When are you looking to implement this?',
                    hotLeadAction: 'notify_email',
                    warmLeadAction: 'schedule_followup',
                    coldLeadAction: 'nurture',
                    products: [],
                },
            },
            [AgentRole.MARKETING_COMMS]: {
                name: 'Product Updates',
                description: 'Sends feature releases, tips, and product news',
                tones: ['professional', 'friendly'],
                useCases: [
                    'Feature releases',
                    'Product tips',
                    'Webinar invites',
                    'Case studies',
                    'Community updates',
                ],
            },
        },
        customAgentSuggestions: [
            { name: 'Onboarding Guide', description: 'Helps new users get started', useCases: ['Setup walkthrough', 'Feature tours', 'Best practices'] },
            { name: 'API Assistant', description: 'Helps developers with integration', useCases: ['API documentation', 'Code samples', 'Troubleshooting'] },
        ],
    },

    manufacturing: {
        industryCategory: 'manufacturing',
        recommendedAgents: [AgentRole.SALES_ASSISTANT, AgentRole.CUSTOMER_CARE],
        agentOverrides: {
            [AgentRole.CUSTOMER_CARE]: {
                name: 'Order Support',
                description: 'Handles B2B order queries, shipping, and quality issues',
                tones: ['professional', 'formal'],
                useCases: [
                    'Order status',
                    'Shipping updates',
                    'Quality complaints',
                    'Invoice queries',
                    'Return requests',
                ],
            },
            [AgentRole.SALES_ASSISTANT]: {
                name: 'Business Development',
                description: 'Handles B2B inquiries, quotes, and bulk orders',
                tones: ['professional', 'formal'],
                useCases: [
                    'Product specifications',
                    'Bulk pricing',
                    'Custom orders',
                    'Sample requests',
                    'Partnership inquiries',
                ],
                leadSettings: {
                    askBudget: true,
                    budgetQuestion: 'What\'s your expected order volume or budget?',
                    askAuthority: true,
                    authorityQuestion: 'Are you the procurement decision maker?',
                    askNeed: true,
                    needQuestion: 'What products are you looking for?',
                    askTimeline: true,
                    timelineQuestion: 'When do you need the delivery?',
                    hotLeadAction: 'notify_email',
                    warmLeadAction: 'schedule_followup',
                    coldLeadAction: 'add_newsletter',
                    products: [],
                },
            },
            [AgentRole.MARKETING_COMMS]: {
                name: 'Trade Updates',
                description: 'Sends new product launches and industry updates',
                tones: ['professional', 'formal'],
                useCases: [
                    'New product launches',
                    'Price updates',
                    'Trade show invites',
                    'Industry news',
                    'Catalog updates',
                ],
            },
        },
        customAgentSuggestions: [
            { name: 'Quote Generator', description: 'Helps create custom quotes', useCases: ['Quick quotes', 'Bulk pricing', 'Custom specifications'] },
            { name: 'Quality Assurance', description: 'Handles quality-related queries', useCases: ['Quality certificates', 'Test reports', 'Compliance info'] },
        ],
    },

    automotive: {
        industryCategory: 'automotive',
        recommendedAgents: [AgentRole.SALES_ASSISTANT, AgentRole.CUSTOMER_CARE, AgentRole.MARKETING_COMMS],
        agentOverrides: {
            [AgentRole.CUSTOMER_CARE]: {
                name: 'Service Advisor',
                description: 'Helps with service bookings, warranty, and vehicle issues',
                tones: ['professional', 'friendly'],
                useCases: [
                    'Service bookings',
                    'Warranty claims',
                    'Spare parts',
                    'Vehicle issues',
                    'Roadside assistance',
                ],
            },
            [AgentRole.SALES_ASSISTANT]: {
                name: 'Vehicle Consultant',
                description: 'Helps customers find and buy the right vehicle',
                tones: ['professional', 'friendly'],
                useCases: [
                    'Vehicle recommendations',
                    'Test drive booking',
                    'Price quotations',
                    'Finance options',
                    'Trade-in evaluation',
                ],
                leadSettings: {
                    askBudget: true,
                    budgetQuestion: 'What\'s your budget for the vehicle?',
                    askAuthority: true,
                    authorityQuestion: 'Who else will be involved in this decision?',
                    askNeed: true,
                    needQuestion: 'What type of vehicle are you looking for? (sedan, SUV, hatchback)',
                    askTimeline: true,
                    timelineQuestion: 'When are you planning to make the purchase?',
                    hotLeadAction: 'notify_email',
                    warmLeadAction: 'schedule_followup',
                    coldLeadAction: 'nurture',
                    products: [],
                },
            },
            [AgentRole.MARKETING_COMMS]: {
                name: 'Auto Updates',
                description: 'Sends service reminders, offers, and new model launches',
                tones: ['professional', 'friendly'],
                useCases: [
                    'Service reminders',
                    'New model launches',
                    'Exchange offers',
                    'Festival deals',
                    'Insurance renewals',
                ],
            },
        },
        customAgentSuggestions: [
            { name: 'Finance Calculator', description: 'Helps calculate EMIs and loan options', useCases: ['EMI calculator', 'Loan comparison', 'Down payment options'] },
            { name: 'Insurance Advisor', description: 'Helps with vehicle insurance', useCases: ['Insurance quotes', 'Claim assistance', 'Policy renewal'] },
        ],
    },

    beauty_wellness: {
        industryCategory: 'beauty_wellness',
        recommendedAgents: [AgentRole.SALES_ASSISTANT, AgentRole.CUSTOMER_CARE, AgentRole.MARKETING_COMMS],
        agentOverrides: {
            [AgentRole.CUSTOMER_CARE]: {
                name: 'Booking Support',
                description: 'Handles appointments, rescheduling, and service queries',
                tones: ['friendly', 'empathetic'],
                useCases: [
                    'Appointment booking',
                    'Rescheduling',
                    'Service information',
                    'Cancellations',
                    'Feedback collection',
                ],
                suggestedFAQs: [
                    { question: 'How do I book an appointment?', answer: 'You can book easily through our app, website, or right here! Just tell me your preferred service and time.' },
                    { question: 'What is your cancellation policy?', answer: 'We request at least [X] hours notice for cancellations. Last-minute cancellations may incur a fee.' },
                    { question: 'Do you do home visits?', answer: 'Yes, we offer home services for select treatments. Let me share the available options and pricing.' },
                ],
            },
            [AgentRole.SALES_ASSISTANT]: {
                name: 'Beauty Consultant',
                description: 'Recommends services and packages based on needs',
                tones: ['friendly', 'empathetic'],
                useCases: [
                    'Service recommendations',
                    'Package deals',
                    'Membership benefits',
                    'Product suggestions',
                    'Bridal packages',
                ],
                leadSettings: {
                    askBudget: true,
                    budgetQuestion: 'Do you have a budget in mind?',
                    askAuthority: false,
                    authorityQuestion: '',
                    askNeed: true,
                    needQuestion: 'What service or treatment are you interested in?',
                    askTimeline: true,
                    timelineQuestion: 'When would you like to schedule your appointment?',
                    hotLeadAction: 'notify_email',
                    warmLeadAction: 'add_pipeline',
                    coldLeadAction: 'nurture',
                    products: [],
                },
            },
            [AgentRole.MARKETING_COMMS]: {
                name: 'Beauty Updates',
                description: 'Sends offers, new services, and self-care tips',
                tones: ['friendly', 'creative'],
                useCases: [
                    'Special offers',
                    'New service launches',
                    'Beauty tips',
                    'Seasonal packages',
                    'Loyalty rewards',
                ],
                campaignSettings: {
                    enableBirthday: true,
                    birthdayDaysBefore: 1,
                    birthdayChannel: 'whatsapp',
                    birthdayIncludeOffer: true,
                    enableAnniversary: true,
                    enableWelcome: true,
                    enableThankYou: true,
                    holidays: [
                        { name: 'Valentine\'s Day', enabled: true },
                        { name: 'Mother\'s Day', enabled: true },
                        { name: 'Diwali', enabled: true },
                    ],
                    brandColors: ['#EC4899'],
                    imageStyle: 'elegant',
                    includeLogo: true,
                    maxMessagesPerMonth: 6,
                    quietHoursStart: '21:00',
                    quietHoursEnd: '09:00',
                    requireApprovalOver: 50,
                },
            },
        },
        customAgentSuggestions: [
            { name: 'Skin Advisor', description: 'Recommends treatments based on skin type', useCases: ['Skin analysis', 'Treatment recommendations', 'Product suggestions'] },
            { name: 'Membership Advisor', description: 'Explains membership benefits', useCases: ['Membership plans', 'Benefits comparison', 'Sign-up assistance'] },
        ],
    },

    events: {
        industryCategory: 'events',
        recommendedAgents: [AgentRole.SALES_ASSISTANT, AgentRole.CUSTOMER_CARE],
        agentOverrides: {
            [AgentRole.CUSTOMER_CARE]: {
                name: 'Event Support',
                description: 'Handles booking queries, changes, and event-day questions',
                tones: ['friendly', 'professional'],
                useCases: [
                    'Booking status',
                    'Schedule changes',
                    'Delivery timeline',
                    'Payment queries',
                    'Post-event feedback',
                ],
            },
            [AgentRole.SALES_ASSISTANT]: {
                name: 'Event Planner',
                description: 'Helps clients plan and customize their events',
                tones: ['friendly', 'creative'],
                useCases: [
                    'Package details',
                    'Custom quotes',
                    'Availability check',
                    'Portfolio sharing',
                    'Venue suggestions',
                ],
                leadSettings: {
                    askBudget: true,
                    budgetQuestion: 'What\'s your budget for this event?',
                    askAuthority: true,
                    authorityQuestion: 'Are you the main contact for this event?',
                    askNeed: true,
                    needQuestion: 'What type of event are you planning?',
                    askTimeline: true,
                    timelineQuestion: 'When is your event date?',
                    hotLeadAction: 'notify_email',
                    warmLeadAction: 'schedule_followup',
                    coldLeadAction: 'nurture',
                    products: [],
                },
            },
            [AgentRole.MARKETING_COMMS]: {
                name: 'Event Promos',
                description: 'Sends seasonal offers and portfolio updates',
                tones: ['creative', 'friendly'],
                useCases: [
                    'Seasonal packages',
                    'Early bird offers',
                    'New portfolio additions',
                    'Testimonial highlights',
                    'Last-minute availability',
                ],
            },
        },
        customAgentSuggestions: [
            { name: 'Vendor Coordinator', description: 'Helps coordinate with multiple vendors', useCases: ['Vendor recommendations', 'Schedule coordination', 'Budget management'] },
            { name: 'Portfolio Showcase', description: 'Shares work samples and testimonials', useCases: ['Portfolio browsing', 'Style matching', 'Client reviews'] },
        ],
    },

    home_services: {
        industryCategory: 'home_services',
        recommendedAgents: [AgentRole.CUSTOMER_CARE, AgentRole.SALES_ASSISTANT],
        agentOverrides: {
            [AgentRole.CUSTOMER_CARE]: {
                name: 'Service Support',
                description: 'Handles service requests, complaints, and follow-ups',
                tones: ['professional', 'friendly'],
                useCases: [
                    'Service requests',
                    'Technician ETA',
                    'Quality issues',
                    'Warranty claims',
                    'Feedback collection',
                ],
                suggestedFAQs: [
                    { question: 'What areas do you service?', answer: 'We service [area/city]. Please share your location and I can confirm if we cover your area.' },
                    { question: 'How much do you charge?', answer: 'Our charges depend on the type of service. Basic visits start at [X]. I can provide an exact estimate based on your requirement.' },
                    { question: 'When can you come?', answer: 'We typically offer same-day or next-day service. Let me check our available slots for you.' },
                ],
            },
            [AgentRole.SALES_ASSISTANT]: {
                name: 'Service Advisor',
                description: 'Books services and explains offerings',
                tones: ['professional', 'friendly'],
                useCases: [
                    'Service booking',
                    'Price estimates',
                    'Package deals',
                    'Annual contracts',
                    'Emergency services',
                ],
                leadSettings: {
                    askBudget: false,
                    budgetQuestion: '',
                    askAuthority: false,
                    authorityQuestion: '',
                    askNeed: true,
                    needQuestion: 'What service do you need help with?',
                    askTimeline: true,
                    timelineQuestion: 'When do you need this service?',
                    hotLeadAction: 'notify_email',
                    warmLeadAction: 'add_pipeline',
                    coldLeadAction: 'nurture',
                    products: [],
                },
            },
            [AgentRole.MARKETING_COMMS]: {
                name: 'Home Care Tips',
                description: 'Sends maintenance reminders and seasonal offers',
                tones: ['friendly', 'professional'],
                useCases: [
                    'Maintenance reminders',
                    'Seasonal offers',
                    'New service launches',
                    'Annual service reminders',
                    'DIY tips',
                ],
            },
        },
        customAgentSuggestions: [
            { name: 'Emergency Dispatcher', description: 'Handles urgent service requests', useCases: ['Emergency booking', 'Priority dispatch', 'Status updates'] },
            { name: 'AMC Manager', description: 'Manages annual maintenance contracts', useCases: ['AMC renewals', 'Service scheduling', 'Contract details'] },
        ],
    },

    other: {
        industryCategory: 'other',
        recommendedAgents: [AgentRole.CUSTOMER_CARE, AgentRole.SALES_ASSISTANT],
        agentOverrides: {
            [AgentRole.CUSTOMER_CARE]: {
                name: 'General Support',
                description: 'Handles general inquiries and support requests',
                tones: ['professional', 'friendly'],
                useCases: [
                    'General inquiries',
                    'Information requests',
                    'Feedback collection',
                    'Complaint handling',
                    'Service queries',
                ],
            },
            [AgentRole.SALES_ASSISTANT]: {
                name: 'Information Guide',
                description: 'Provides information and helps with inquiries',
                tones: ['friendly', 'professional'],
                useCases: [
                    'Information sharing',
                    'Service details',
                    'Contact information',
                    'Process guidance',
                    'Volunteer inquiries',
                ],
            },
            [AgentRole.MARKETING_COMMS]: {
                name: 'Updates & News',
                description: 'Sends organizational updates and news',
                tones: ['friendly', 'professional'],
                useCases: [
                    'Event announcements',
                    'Newsletter updates',
                    'Impact stories',
                    'Volunteer opportunities',
                    'Donation reminders',
                ],
            },
        },
        customAgentSuggestions: [],
    },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get agent templates for a specific industry
 */
export function getAgentTemplatesForIndustry(industryCategory: IndustryCategory): AgentTemplate[] {
    const config = INDUSTRY_AGENT_CONFIGS[industryCategory] || INDUSTRY_AGENT_CONFIGS.other;

    return config.recommendedAgents.map(role => {
        const baseTemplate = { ...BASE_AGENT_TEMPLATES[role] };
        const overrides = config.agentOverrides[role] || {};

        return {
            ...baseTemplate,
            ...overrides,
            // Merge escalation settings properly
            escalationSettings: {
                ...baseTemplate.escalationSettings,
                ...(overrides.escalationSettings || {}),
            },
            // Merge lead settings properly if exists
            leadSettings: baseTemplate.leadSettings ? {
                ...baseTemplate.leadSettings,
                ...(overrides.leadSettings || {}),
            } : overrides.leadSettings,
            // Merge campaign settings properly if exists
            campaignSettings: baseTemplate.campaignSettings ? {
                ...baseTemplate.campaignSettings,
                ...(overrides.campaignSettings || {}),
            } : overrides.campaignSettings,
        } as AgentTemplate;
    });
}

/**
 * Get recommended custom agents for an industry
 */
export function getCustomAgentSuggestionsForIndustry(industryCategory: IndustryCategory) {
    const config = INDUSTRY_AGENT_CONFIGS[industryCategory] || INDUSTRY_AGENT_CONFIGS.other;
    return config.customAgentSuggestions;
}

/**
 * Get a single agent template with industry overrides
 */
export function getAgentTemplate(role: AgentRole, industryCategory?: IndustryCategory): AgentTemplate {
    const baseTemplate = { ...BASE_AGENT_TEMPLATES[role] };

    if (!industryCategory) return baseTemplate;

    const config = INDUSTRY_AGENT_CONFIGS[industryCategory];
    if (!config) return baseTemplate;

    const overrides = config.agentOverrides[role] || {};

    return {
        ...baseTemplate,
        ...overrides,
        escalationSettings: {
            ...baseTemplate.escalationSettings,
            ...(overrides.escalationSettings || {}),
        },
        leadSettings: baseTemplate.leadSettings ? {
            ...baseTemplate.leadSettings,
            ...(overrides.leadSettings || {}),
        } : overrides.leadSettings,
        campaignSettings: baseTemplate.campaignSettings ? {
            ...baseTemplate.campaignSettings,
            ...(overrides.campaignSettings || {}),
        } : overrides.campaignSettings,
    } as AgentTemplate;
}

/**
 * Create a blank custom agent template
 */
export function createBlankCustomAgent(): Omit<AgentTemplate, 'id'> {
    return {
        role: 'custom',
        name: '',
        description: '',
        avatar: 'Bot',
        icon: 'BotIcon',
        tones: ['professional', 'friendly'],
        style: 'conversational',
        responseLength: 'moderate',
        escalationSettings: {
            onHumanRequest: true,
            humanRequestKeywords: ['human', 'person', 'agent'],
            onFrustration: true,
            frustrationThreshold: 3,
            onNoAnswer: true,
            noAnswerAttempts: 2,
            onSensitiveTopics: false,
            sensitiveTopics: [],
            escalationMessage: "Let me connect you with someone who can help you better.",
        },
        useCases: [],
        bestFor: '',
        gradient: 'from-slate-500 to-slate-600',
        bgLight: 'bg-slate-50',
        textColor: 'text-slate-600',
        borderColor: 'border-slate-200',
    };
}

/**
 * Map voice tones from business persona to agent tones
 */
export function mapVoiceTonesToAgentTones(voiceTones: VoiceTone[]): AgentTone[] {
    const mapping: Record<VoiceTone, AgentTone> = {
        'professional': 'professional',
        'friendly': 'friendly',
        'casual': 'casual',
        'formal': 'formal',
        'playful': 'creative',
        'empathetic': 'empathetic',
        'authoritative': 'professional',
        'warm': 'friendly',
        'energetic': 'creative',
        'calm': 'empathetic',
    };

    return voiceTones.map(tone => mapping[tone] || 'professional');
}

/**
 * Get suggested FAQs for an agent based on industry
 */
export function getSuggestedFAQsForAgent(role: AgentRole, industryCategory: IndustryCategory): { question: string; answer: string }[] {
    const config = INDUSTRY_AGENT_CONFIGS[industryCategory];
    if (!config) return [];

    const overrides = config.agentOverrides[role];
    return overrides?.suggestedFAQs || [];
}
