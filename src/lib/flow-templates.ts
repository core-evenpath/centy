import type {
  SystemFlowTemplate,
  FlowStage,
  FlowTransition,
  FlowSettings,
  FlowStageType,
  IntentSignal,
} from './types-flow-engine';

function stage(
  id: string,
  type: FlowStageType,
  label: string,
  blockTypes: string[],
  triggerIntents: IntentSignal[],
  exitIntents: IntentSignal[],
  opts: Partial<FlowStage> = {}
): FlowStage {
  const scoreMap: Record<FlowStageType, number> = {
    greeting: 1, discovery: 2, showcase: 3, comparison: 4,
    social_proof: 3, conversion: 5, objection: 1, handoff: 0, followup: 1,
  };
  return {
    id, type, label, blockTypes, triggerIntents, exitIntents,
    leadScoreImpact: scoreMap[type],
    ...opts,
  };
}

function tr(from: string, to: string, condition: IntentSignal | 'auto' | 'fallback', priority: number): FlowTransition {
  return { fromStageId: from, toStageId: to, condition, priority };
}

const HOTELS_RESORTS: SystemFlowTemplate = {
  id: 'flow_hotels_resorts',
  name: 'Hotel Booking Journey',
  industryId: 'hospitality',
  functionId: 'hotels_resorts',
  industryName: 'Hospitality & Accommodation',
  functionName: 'Hotels & Resorts',
  description: 'Guided journey from room browsing to booking with comparison support',
  stages: [
    stage('hr_greeting', 'greeting', 'Welcome', ['greeting', 'quick_actions'], [], ['browsing', 'pricing', 'booking'], { isEntry: true }),
    stage('hr_discovery', 'discovery', 'Browse Rooms', ['rooms', 'catalog', 'gallery'], ['browsing'], ['comparing', 'booking', 'pricing']),
    stage('hr_comparison', 'comparison', 'Compare Rooms', ['compare'], ['comparing'], ['booking', 'pricing']),
    stage('hr_conversion', 'conversion', 'Book Room', ['book', 'reserve'], ['booking'], ['contact', 'inquiry']),
    stage('hr_handoff', 'handoff', 'Contact Hotel', ['handoff', 'contact'], ['contact', 'complaint', 'urgent'], [], { isExit: true }),
  ],
  transitions: [
    tr('hr_greeting', 'hr_discovery', 'browsing', 10),
    tr('hr_greeting', 'hr_conversion', 'booking', 20),
    tr('hr_greeting', 'hr_handoff', 'contact', 15),
    tr('hr_discovery', 'hr_comparison', 'comparing', 10),
    tr('hr_discovery', 'hr_conversion', 'booking', 20),
    tr('hr_discovery', 'hr_handoff', 'contact', 5),
    tr('hr_comparison', 'hr_conversion', 'booking', 20),
    tr('hr_comparison', 'hr_discovery', 'browsing', 5),
    tr('hr_conversion', 'hr_handoff', 'contact', 10),
    tr('hr_conversion', 'hr_discovery', 'browsing', 5),
    tr('hr_handoff', 'hr_discovery', 'browsing', 5),
    tr('hr_greeting', 'hr_discovery', 'fallback', 1),
  ],
  settings: {
    handoffThreshold: 12,
    maxTurnsBeforeHandoff: 15,
    enableLeadCapture: false,
    leadCaptureFields: ['name', 'phone', 'email'],
    enablePromos: true,
    promoTriggerStage: 'showcase',
    enableTestimonials: true,
    testimonialTriggerAfter: 6,
    fallbackBehavior: 'quick_actions',
  },
};

const FULL_SERVICE_RESTAURANT: SystemFlowTemplate = {
  id: 'flow_full_service_restaurant',
  name: 'Restaurant Discovery Journey',
  industryId: 'food_beverage',
  functionId: 'full_service_restaurant',
  industryName: 'Food & Beverage',
  functionName: 'Full Service Restaurant',
  description: 'Menu browsing with promos and reservation flow',
  stages: [
    stage('fsr_greeting', 'greeting', 'Welcome', ['greeting', 'quick_actions'], [], ['browsing', 'booking'], { isEntry: true }),
    stage('fsr_discovery', 'discovery', 'Browse Menu', ['menu', 'catalog'], ['browsing'], ['booking', 'promo', 'location']),
    stage('fsr_showcase', 'showcase', 'Specials & Promos', ['promo', 'menu'], ['promo', 'pricing'], ['booking', 'location']),
    stage('fsr_conversion', 'conversion', 'Reserve Table', ['book', 'reserve'], ['booking'], ['contact', 'location']),
    stage('fsr_objection', 'objection', 'Location & Info', ['location', 'info'], ['location', 'inquiry'], ['booking'], { isExit: true }),
  ],
  transitions: [
    tr('fsr_greeting', 'fsr_discovery', 'browsing', 10),
    tr('fsr_greeting', 'fsr_conversion', 'booking', 20),
    tr('fsr_greeting', 'fsr_objection', 'location', 15),
    tr('fsr_discovery', 'fsr_showcase', 'promo', 10),
    tr('fsr_discovery', 'fsr_showcase', 'pricing', 10),
    tr('fsr_discovery', 'fsr_conversion', 'booking', 20),
    tr('fsr_discovery', 'fsr_objection', 'location', 10),
    tr('fsr_showcase', 'fsr_conversion', 'booking', 20),
    tr('fsr_showcase', 'fsr_discovery', 'browsing', 5),
    tr('fsr_conversion', 'fsr_objection', 'location', 10),
    tr('fsr_conversion', 'fsr_discovery', 'browsing', 5),
    tr('fsr_greeting', 'fsr_discovery', 'fallback', 1),
  ],
  settings: {
    handoffThreshold: 10,
    maxTurnsBeforeHandoff: 12,
    enableLeadCapture: false,
    leadCaptureFields: ['name', 'phone'],
    enablePromos: true,
    promoTriggerStage: 'showcase',
    enableTestimonials: false,
    fallbackBehavior: 'quick_actions',
  },
};

const FITNESS_GYM: SystemFlowTemplate = {
  id: 'flow_fitness_gym',
  name: 'Fitness Membership Journey',
  industryId: 'personal_wellness',
  functionId: 'fitness_gym',
  industryName: 'Personal Care & Wellness',
  functionName: 'Fitness & Gym',
  description: 'Schedule browsing, pricing comparison, and membership sign-up',
  stages: [
    stage('fg_greeting', 'greeting', 'Welcome', ['greeting', 'quick_actions'], [], ['schedule', 'pricing', 'booking'], { isEntry: true }),
    stage('fg_showcase_schedule', 'showcase', 'Class Schedule', ['schedule', 'classes'], ['schedule', 'browsing'], ['pricing', 'booking']),
    stage('fg_showcase_pricing', 'showcase', 'Membership Plans', ['pricing'], ['pricing'], ['booking', 'contact']),
    stage('fg_social_proof', 'social_proof', 'Member Reviews', ['testimonials'], [], ['pricing', 'booking']),
    stage('fg_conversion', 'conversion', 'Sign Up', ['lead_capture'], ['booking'], ['contact']),
    stage('fg_handoff', 'handoff', 'Talk to Us', ['handoff', 'contact'], ['contact', 'complaint', 'urgent'], [], { isExit: true }),
  ],
  transitions: [
    tr('fg_greeting', 'fg_showcase_schedule', 'schedule', 15),
    tr('fg_greeting', 'fg_showcase_schedule', 'browsing', 10),
    tr('fg_greeting', 'fg_showcase_pricing', 'pricing', 15),
    tr('fg_greeting', 'fg_conversion', 'booking', 20),
    tr('fg_greeting', 'fg_handoff', 'contact', 15),
    tr('fg_showcase_schedule', 'fg_showcase_pricing', 'pricing', 15),
    tr('fg_showcase_schedule', 'fg_conversion', 'booking', 20),
    tr('fg_showcase_pricing', 'fg_conversion', 'booking', 20),
    tr('fg_showcase_pricing', 'fg_showcase_schedule', 'schedule', 10),
    tr('fg_social_proof', 'fg_conversion', 'booking', 20),
    tr('fg_social_proof', 'fg_showcase_pricing', 'pricing', 10),
    tr('fg_conversion', 'fg_handoff', 'contact', 10),
    tr('fg_greeting', 'fg_showcase_schedule', 'fallback', 1),
  ],
  settings: {
    handoffThreshold: 10,
    maxTurnsBeforeHandoff: 14,
    enableLeadCapture: true,
    leadCaptureFields: ['name', 'phone', 'email'],
    enablePromos: true,
    promoTriggerStage: 'showcase',
    enableTestimonials: true,
    testimonialTriggerAfter: 4,
    fallbackBehavior: 'quick_actions',
  },
};

const DENTAL_CARE: SystemFlowTemplate = {
  id: 'flow_dental_care',
  name: 'Dental Care Journey',
  industryId: 'healthcare_medical',
  functionId: 'dental_care',
  industryName: 'Healthcare & Medical Services',
  functionName: 'Dental Care',
  description: 'Service discovery with trust-building and appointment booking',
  stages: [
    stage('dc_greeting', 'greeting', 'Welcome', ['greeting', 'quick_actions'], [], ['browsing', 'booking', 'inquiry'], { isEntry: true }),
    stage('dc_discovery', 'discovery', 'Our Services', ['services'], ['browsing'], ['booking', 'inquiry', 'pricing']),
    stage('dc_social_proof', 'social_proof', 'Patient Reviews', ['testimonials'], [], ['booking', 'pricing']),
    stage('dc_conversion', 'conversion', 'Book Appointment', ['lead_capture'], ['booking'], ['contact', 'inquiry']),
    stage('dc_handoff', 'handoff', 'Contact Clinic', ['handoff', 'contact'], ['contact', 'complaint', 'urgent'], [], { isExit: true }),
  ],
  transitions: [
    tr('dc_greeting', 'dc_discovery', 'browsing', 10),
    tr('dc_greeting', 'dc_conversion', 'booking', 20),
    tr('dc_greeting', 'dc_handoff', 'contact', 15),
    tr('dc_greeting', 'dc_handoff', 'urgent', 25),
    tr('dc_discovery', 'dc_social_proof', 'auto', 5),
    tr('dc_discovery', 'dc_conversion', 'booking', 20),
    tr('dc_discovery', 'dc_handoff', 'contact', 10),
    tr('dc_social_proof', 'dc_conversion', 'booking', 20),
    tr('dc_social_proof', 'dc_discovery', 'browsing', 5),
    tr('dc_conversion', 'dc_handoff', 'contact', 10),
    tr('dc_greeting', 'dc_discovery', 'fallback', 1),
  ],
  settings: {
    handoffThreshold: 8,
    maxTurnsBeforeHandoff: 12,
    enableLeadCapture: true,
    leadCaptureFields: ['name', 'phone', 'email'],
    enablePromos: false,
    enableTestimonials: true,
    testimonialTriggerAfter: 3,
    fallbackBehavior: 'text',
  },
};

const REAL_ESTATE: SystemFlowTemplate = {
  id: 'flow_real_estate',
  name: 'Property Discovery Journey',
  industryId: 'home_property',
  functionId: 'real_estate',
  industryName: 'Home & Property Services',
  functionName: 'Real Estate',
  description: 'Property browsing, comparison, and lead capture',
  stages: [
    stage('re_greeting', 'greeting', 'Welcome', ['greeting', 'quick_actions'], [], ['browsing', 'comparing'], { isEntry: true }),
    stage('re_discovery', 'discovery', 'Browse Properties', ['listings', 'catalog', 'gallery'], ['browsing'], ['comparing', 'booking', 'pricing']),
    stage('re_comparison', 'comparison', 'Compare Properties', ['compare'], ['comparing'], ['booking', 'contact']),
    stage('re_conversion', 'conversion', 'Request Details', ['lead_capture'], ['booking', 'pricing'], ['contact']),
    stage('re_handoff', 'handoff', 'Talk to Agent', ['handoff', 'contact'], ['contact', 'complaint', 'urgent'], [], { isExit: true }),
  ],
  transitions: [
    tr('re_greeting', 're_discovery', 'browsing', 10),
    tr('re_greeting', 're_conversion', 'booking', 20),
    tr('re_greeting', 're_handoff', 'contact', 15),
    tr('re_discovery', 're_comparison', 'comparing', 15),
    tr('re_discovery', 're_conversion', 'booking', 20),
    tr('re_discovery', 're_handoff', 'contact', 10),
    tr('re_comparison', 're_conversion', 'booking', 20),
    tr('re_comparison', 're_discovery', 'browsing', 5),
    tr('re_conversion', 're_handoff', 'contact', 10),
    tr('re_conversion', 're_discovery', 'browsing', 5),
    tr('re_greeting', 're_discovery', 'fallback', 1),
  ],
  settings: {
    handoffThreshold: 10,
    maxTurnsBeforeHandoff: 15,
    enableLeadCapture: true,
    leadCaptureFields: ['name', 'phone', 'email'],
    enablePromos: false,
    enableTestimonials: true,
    testimonialTriggerAfter: 5,
    fallbackBehavior: 'quick_actions',
  },
};

const ECOMMERCE_D2C: SystemFlowTemplate = {
  id: 'flow_ecommerce_d2c',
  name: 'E-Commerce Shopping Journey',
  industryId: 'retail_commerce',
  functionId: 'ecommerce_d2c',
  industryName: 'Retail & Commerce',
  functionName: 'E-Commerce D2C',
  description: 'Product browsing, comparison, and promo-driven conversion',
  stages: [
    stage('ec_greeting', 'greeting', 'Welcome', ['greeting', 'quick_actions'], [], ['browsing', 'promo'], { isEntry: true }),
    stage('ec_discovery', 'discovery', 'Browse Products', ['products', 'catalog'], ['browsing'], ['comparing', 'promo', 'booking']),
    stage('ec_comparison', 'comparison', 'Compare Products', ['compare'], ['comparing'], ['booking', 'promo']),
    stage('ec_showcase', 'showcase', 'Deals & Offers', ['promo'], ['promo', 'pricing'], ['booking', 'contact']),
    stage('ec_handoff', 'handoff', 'Customer Support', ['handoff', 'contact'], ['contact', 'complaint', 'urgent'], [], { isExit: true }),
  ],
  transitions: [
    tr('ec_greeting', 'ec_discovery', 'browsing', 10),
    tr('ec_greeting', 'ec_showcase', 'promo', 15),
    tr('ec_greeting', 'ec_handoff', 'contact', 15),
    tr('ec_discovery', 'ec_comparison', 'comparing', 15),
    tr('ec_discovery', 'ec_showcase', 'promo', 10),
    tr('ec_discovery', 'ec_showcase', 'pricing', 10),
    tr('ec_discovery', 'ec_handoff', 'contact', 5),
    tr('ec_comparison', 'ec_showcase', 'promo', 10),
    tr('ec_comparison', 'ec_discovery', 'browsing', 5),
    tr('ec_showcase', 'ec_discovery', 'browsing', 5),
    tr('ec_showcase', 'ec_handoff', 'contact', 10),
    tr('ec_greeting', 'ec_discovery', 'fallback', 1),
  ],
  settings: {
    handoffThreshold: 12,
    maxTurnsBeforeHandoff: 15,
    enableLeadCapture: false,
    leadCaptureFields: ['name', 'email'],
    enablePromos: true,
    promoTriggerStage: 'showcase',
    enableTestimonials: true,
    testimonialTriggerAfter: 5,
    fallbackBehavior: 'quick_actions',
  },
};

const HAIR_BEAUTY: SystemFlowTemplate = {
  id: 'flow_hair_beauty',
  name: 'Salon Booking Journey',
  industryId: 'personal_wellness',
  functionId: 'hair_beauty',
  industryName: 'Personal Care & Wellness',
  functionName: 'Hair & Beauty',
  description: 'Service browsing, availability check, and appointment booking',
  stages: [
    stage('hb_greeting', 'greeting', 'Welcome', ['greeting', 'quick_actions'], [], ['browsing', 'schedule', 'booking'], { isEntry: true }),
    stage('hb_discovery', 'discovery', 'Our Services', ['services'], ['browsing'], ['schedule', 'booking', 'pricing']),
    stage('hb_showcase', 'showcase', 'Availability', ['schedule'], ['schedule'], ['booking', 'pricing']),
    stage('hb_conversion', 'conversion', 'Book Appointment', ['book'], ['booking'], ['contact']),
    stage('hb_handoff', 'handoff', 'Contact Salon', ['handoff', 'contact'], ['contact', 'complaint', 'urgent'], [], { isExit: true }),
  ],
  transitions: [
    tr('hb_greeting', 'hb_discovery', 'browsing', 10),
    tr('hb_greeting', 'hb_showcase', 'schedule', 15),
    tr('hb_greeting', 'hb_conversion', 'booking', 20),
    tr('hb_greeting', 'hb_handoff', 'contact', 15),
    tr('hb_discovery', 'hb_showcase', 'schedule', 15),
    tr('hb_discovery', 'hb_showcase', 'pricing', 10),
    tr('hb_discovery', 'hb_conversion', 'booking', 20),
    tr('hb_showcase', 'hb_conversion', 'booking', 20),
    tr('hb_showcase', 'hb_discovery', 'browsing', 5),
    tr('hb_conversion', 'hb_handoff', 'contact', 10),
    tr('hb_conversion', 'hb_discovery', 'browsing', 5),
    tr('hb_greeting', 'hb_discovery', 'fallback', 1),
  ],
  settings: {
    handoffThreshold: 10,
    maxTurnsBeforeHandoff: 12,
    enableLeadCapture: false,
    leadCaptureFields: ['name', 'phone'],
    enablePromos: true,
    promoTriggerStage: 'showcase',
    enableTestimonials: true,
    testimonialTriggerAfter: 4,
    fallbackBehavior: 'quick_actions',
  },
};

const PLUMBING_ELECTRICAL: SystemFlowTemplate = {
  id: 'flow_plumbing_electrical',
  name: 'Home Service Request Journey',
  industryId: 'home_property',
  functionId: 'plumbing_electrical',
  industryName: 'Home & Property Services',
  functionName: 'Plumbing & Electrical',
  description: 'Service listing, pricing transparency, and lead capture for callbacks',
  stages: [
    stage('pe_greeting', 'greeting', 'Welcome', ['greeting', 'quick_actions'], [], ['browsing', 'pricing', 'booking', 'urgent'], { isEntry: true }),
    stage('pe_discovery', 'discovery', 'Our Services', ['services'], ['browsing'], ['pricing', 'booking']),
    stage('pe_showcase', 'showcase', 'Service Pricing', ['pricing'], ['pricing'], ['booking', 'contact']),
    stage('pe_conversion', 'conversion', 'Request Service', ['lead_capture'], ['booking'], ['contact']),
    stage('pe_handoff', 'handoff', 'Call Now', ['handoff', 'contact'], ['contact', 'complaint', 'urgent'], [], { isExit: true }),
  ],
  transitions: [
    tr('pe_greeting', 'pe_discovery', 'browsing', 10),
    tr('pe_greeting', 'pe_showcase', 'pricing', 15),
    tr('pe_greeting', 'pe_conversion', 'booking', 20),
    tr('pe_greeting', 'pe_handoff', 'urgent', 25),
    tr('pe_greeting', 'pe_handoff', 'contact', 15),
    tr('pe_discovery', 'pe_showcase', 'pricing', 15),
    tr('pe_discovery', 'pe_conversion', 'booking', 20),
    tr('pe_discovery', 'pe_handoff', 'urgent', 25),
    tr('pe_showcase', 'pe_conversion', 'booking', 20),
    tr('pe_showcase', 'pe_discovery', 'browsing', 5),
    tr('pe_conversion', 'pe_handoff', 'contact', 10),
    tr('pe_greeting', 'pe_discovery', 'fallback', 1),
  ],
  settings: {
    handoffThreshold: 8,
    maxTurnsBeforeHandoff: 10,
    enableLeadCapture: true,
    leadCaptureFields: ['name', 'phone', 'email'],
    enablePromos: false,
    enableTestimonials: true,
    testimonialTriggerAfter: 3,
    fallbackBehavior: 'handoff',
  },
};

export const SYSTEM_FLOW_TEMPLATES: SystemFlowTemplate[] = [
  HOTELS_RESORTS,
  FULL_SERVICE_RESTAURANT,
  FITNESS_GYM,
  DENTAL_CARE,
  REAL_ESTATE,
  ECOMMERCE_D2C,
  HAIR_BEAUTY,
  PLUMBING_ELECTRICAL,
];

const TEMPLATE_BY_FUNCTION = new Map(
  SYSTEM_FLOW_TEMPLATES.map(t => [t.functionId, t])
);

const INDUSTRY_DEFAULT_FUNCTION: Record<string, string> = {
  hospitality: 'hotels_resorts',
  food_beverage: 'full_service_restaurant',
  personal_wellness: 'fitness_gym',
  healthcare_medical: 'dental_care',
  home_property: 'real_estate',
  retail_commerce: 'ecommerce_d2c',
};

export function getFlowTemplateForFunction(functionId: string): SystemFlowTemplate | null {
  return TEMPLATE_BY_FUNCTION.get(functionId) || null;
}

export function getDefaultFlowForIndustry(industryId: string): SystemFlowTemplate | null {
  const functionId = INDUSTRY_DEFAULT_FUNCTION[industryId];
  if (!functionId) return null;
  return TEMPLATE_BY_FUNCTION.get(functionId) || null;
}
