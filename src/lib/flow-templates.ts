import type { FlowSettings, FlowStage, FlowTransition, SystemFlowTemplate, FlowStageType, IntentSignal } from './types-flow-engine';
import { getSubVertical, getBlocksForFunction } from '@/app/admin/relay/blocks/previews/registry';

// ---------------------------------------------------------------------------
// Shared defaults
// ---------------------------------------------------------------------------
function defaultSettings(overrides?: Partial<FlowSettings>): FlowSettings {
  return {
    handoffThreshold: 15,
    maxTurnsBeforeHandoff: 12,
    enableLeadCapture: true,
    leadCaptureFields: ['name', 'phone', 'email'],
    showTestimonials: true,
    showPromos: true,
    leadCaptureAfterTurn: 3,
    fallbackBehavior: 'quick_actions',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// 1. Hotels & Resorts
// ---------------------------------------------------------------------------
const hotelsResorts: SystemFlowTemplate = {
  id: 'tpl_hotels_resorts',
  name: 'Hotels & Resorts Flow',
  industryId: 'hospitality',
  functionId: 'hotels_resorts',
  industryName: 'Hospitality & Accommodation',
  functionName: 'Hotels & Resorts',
  description: 'Guides visitors from room browsing through comparison to booking, with handoff for complex requests.',
  settings: defaultSettings(),
  stages: [
    {
      id: 'hr_greeting',
      type: 'greeting',
      label: 'Welcome',
      blockTypes: ['greeting', 'welcome'],
      intentTriggers: ['browsing'],
      leadScoreImpact: 1,
      isEntry: true,
    },
    {
      id: 'hr_discovery',
      type: 'discovery',
      label: 'Browse Rooms',
      blockTypes: ['rooms', 'gallery', 'quick_actions'],
      intentTriggers: ['browsing', 'returning'],
      leadScoreImpact: 2,
    },
    {
      id: 'hr_comparison',
      type: 'comparison',
      label: 'Compare Rooms',
      blockTypes: ['compare'],
      intentTriggers: ['comparing'],
      leadScoreImpact: 4,
    },
    {
      id: 'hr_conversion',
      type: 'conversion',
      label: 'Book Room',
      blockTypes: ['book', 'reserve'],
      intentTriggers: ['booking'],
      leadScoreImpact: 5,
    },
    {
      id: 'hr_handoff',
      type: 'handoff',
      label: 'Contact Staff',
      blockTypes: ['contact', 'handoff'],
      intentTriggers: ['contact', 'complaint', 'urgent'],
      leadScoreImpact: 0,
      isExit: true,
    },
  ],
  transitions: [
    { from: 'hr_greeting', to: 'hr_discovery', trigger: 'browsing' },
    { from: 'hr_greeting', to: 'hr_conversion', trigger: 'booking', priority: 1 },
    { from: 'hr_greeting', to: 'hr_handoff', trigger: 'contact' },
    { from: 'hr_discovery', to: 'hr_comparison', trigger: 'comparing' },
    { from: 'hr_discovery', to: 'hr_conversion', trigger: 'booking', priority: 1 },
    { from: 'hr_discovery', to: 'hr_handoff', trigger: 'contact' },
    { from: 'hr_comparison', to: 'hr_conversion', trigger: 'booking', priority: 1 },
    { from: 'hr_comparison', to: 'hr_discovery', trigger: 'browsing' },
    { from: 'hr_comparison', to: 'hr_handoff', trigger: 'contact' },
    { from: 'hr_conversion', to: 'hr_handoff', trigger: 'contact' },
    { from: 'hr_conversion', to: 'hr_discovery', trigger: 'browsing' },
    { from: 'hr_discovery', to: 'hr_handoff', trigger: 'complaint' },
    { from: 'hr_discovery', to: 'hr_handoff', trigger: 'urgent' },
    { from: 'hr_comparison', to: 'hr_handoff', trigger: 'complaint' },
    { from: 'hr_conversion', to: 'hr_handoff', trigger: 'complaint' },
  ],
};

// ---------------------------------------------------------------------------
// 2. Full-Service Restaurant
// ---------------------------------------------------------------------------
const fullServiceRestaurant: SystemFlowTemplate = {
  id: 'tpl_full_service_restaurant',
  name: 'Full-Service Restaurant Flow',
  industryId: 'food_beverage',
  functionId: 'full_service_restaurant',
  industryName: 'Food & Beverage',
  functionName: 'Full-Service Restaurant',
  description: 'Takes visitors from menu browsing through promos to reservation, with location info for walk-ins.',
  settings: defaultSettings(),
  stages: [
    {
      id: 'fsr_greeting',
      type: 'greeting',
      label: 'Welcome',
      blockTypes: ['greeting', 'welcome'],
      intentTriggers: ['browsing'],
      leadScoreImpact: 1,
      isEntry: true,
    },
    {
      id: 'fsr_discovery',
      type: 'discovery',
      label: 'Browse Menu',
      blockTypes: ['menu', 'catalog'],
      intentTriggers: ['browsing', 'returning'],
      leadScoreImpact: 2,
    },
    {
      id: 'fsr_showcase',
      type: 'showcase',
      label: 'Promos & Deals',
      blockTypes: ['promo', 'deal'],
      intentTriggers: ['promo', 'pricing'],
      leadScoreImpact: 3,
    },
    {
      id: 'fsr_conversion',
      type: 'conversion',
      label: 'Reserve Table',
      blockTypes: ['reserve', 'book'],
      intentTriggers: ['booking', 'schedule'],
      leadScoreImpact: 5,
    },
    {
      id: 'fsr_handoff',
      type: 'handoff',
      label: 'Location & Contact',
      blockTypes: ['location', 'contact'],
      intentTriggers: ['location', 'contact', 'complaint', 'urgent'],
      leadScoreImpact: 0,
      isExit: true,
    },
  ],
  transitions: [
    { from: 'fsr_greeting', to: 'fsr_discovery', trigger: 'browsing' },
    { from: 'fsr_greeting', to: 'fsr_conversion', trigger: 'booking', priority: 1 },
    { from: 'fsr_greeting', to: 'fsr_handoff', trigger: 'location' },
    { from: 'fsr_discovery', to: 'fsr_showcase', trigger: 'promo' },
    { from: 'fsr_discovery', to: 'fsr_showcase', trigger: 'pricing' },
    { from: 'fsr_discovery', to: 'fsr_conversion', trigger: 'booking', priority: 1 },
    { from: 'fsr_discovery', to: 'fsr_handoff', trigger: 'contact' },
    { from: 'fsr_showcase', to: 'fsr_conversion', trigger: 'booking', priority: 1 },
    { from: 'fsr_showcase', to: 'fsr_discovery', trigger: 'browsing' },
    { from: 'fsr_conversion', to: 'fsr_handoff', trigger: 'location' },
    { from: 'fsr_conversion', to: 'fsr_handoff', trigger: 'contact' },
    { from: 'fsr_discovery', to: 'fsr_handoff', trigger: 'complaint' },
    { from: 'fsr_showcase', to: 'fsr_handoff', trigger: 'complaint' },
    { from: 'fsr_conversion', to: 'fsr_handoff', trigger: 'complaint' },
  ],
};

// ---------------------------------------------------------------------------
// 3. Fitness Centers & Gyms
// ---------------------------------------------------------------------------
const fitnessGym: SystemFlowTemplate = {
  id: 'tpl_fitness_gym',
  name: 'Fitness & Gym Flow',
  industryId: 'personal_wellness',
  functionId: 'fitness_gym',
  industryName: 'Personal Care & Wellness',
  functionName: 'Fitness Centers & Gyms',
  description: 'Guides visitors through class schedules and pricing to lead capture for trial memberships.',
  settings: defaultSettings(),
  stages: [
    {
      id: 'fg_greeting',
      type: 'greeting',
      label: 'Welcome',
      blockTypes: ['greeting', 'welcome'],
      intentTriggers: ['browsing'],
      leadScoreImpact: 1,
      isEntry: true,
    },
    {
      id: 'fg_discovery',
      type: 'discovery',
      label: 'Classes & Schedule',
      blockTypes: ['schedule', 'classes', 'activities'],
      intentTriggers: ['browsing', 'schedule', 'returning'],
      leadScoreImpact: 2,
    },
    {
      id: 'fg_showcase',
      type: 'showcase',
      label: 'Pricing & Plans',
      blockTypes: ['pricing', 'plans'],
      intentTriggers: ['pricing'],
      leadScoreImpact: 3,
    },
    {
      id: 'fg_conversion',
      type: 'conversion',
      label: 'Get Started',
      blockTypes: ['lead_capture', 'form'],
      intentTriggers: ['booking'],
      leadScoreImpact: 5,
    },
    {
      id: 'fg_handoff',
      type: 'handoff',
      label: 'Contact Gym',
      blockTypes: ['contact', 'handoff'],
      intentTriggers: ['contact', 'complaint', 'urgent'],
      leadScoreImpact: 0,
      isExit: true,
    },
  ],
  transitions: [
    { from: 'fg_greeting', to: 'fg_discovery', trigger: 'browsing' },
    { from: 'fg_greeting', to: 'fg_discovery', trigger: 'schedule' },
    { from: 'fg_greeting', to: 'fg_showcase', trigger: 'pricing' },
    { from: 'fg_greeting', to: 'fg_conversion', trigger: 'booking', priority: 1 },
    { from: 'fg_discovery', to: 'fg_showcase', trigger: 'pricing' },
    { from: 'fg_discovery', to: 'fg_conversion', trigger: 'booking', priority: 1 },
    { from: 'fg_discovery', to: 'fg_handoff', trigger: 'contact' },
    { from: 'fg_showcase', to: 'fg_conversion', trigger: 'booking', priority: 1 },
    { from: 'fg_showcase', to: 'fg_discovery', trigger: 'browsing' },
    { from: 'fg_showcase', to: 'fg_handoff', trigger: 'contact' },
    { from: 'fg_conversion', to: 'fg_handoff', trigger: 'contact' },
    { from: 'fg_discovery', to: 'fg_handoff', trigger: 'complaint' },
    { from: 'fg_showcase', to: 'fg_handoff', trigger: 'complaint' },
    { from: 'fg_conversion', to: 'fg_handoff', trigger: 'complaint' },
  ],
};

// ---------------------------------------------------------------------------
// 4. Dental Care
// ---------------------------------------------------------------------------
const dentalCare: SystemFlowTemplate = {
  id: 'tpl_dental_care',
  name: 'Dental Care Flow',
  industryId: 'healthcare_medical',
  functionId: 'dental_care',
  industryName: 'Healthcare & Medical Services',
  functionName: 'Dental Care',
  description: 'Walks patients through services and social proof to appointment booking or lead capture.',
  settings: defaultSettings({ showPromos: false }),
  stages: [
    {
      id: 'dc_greeting',
      type: 'greeting',
      label: 'Welcome',
      blockTypes: ['greeting', 'welcome'],
      intentTriggers: ['browsing'],
      leadScoreImpact: 1,
      isEntry: true,
    },
    {
      id: 'dc_discovery',
      type: 'discovery',
      label: 'Services & Treatments',
      blockTypes: ['services', 'treatments'],
      intentTriggers: ['browsing', 'inquiry', 'returning'],
      leadScoreImpact: 2,
    },
    {
      id: 'dc_social_proof',
      type: 'social_proof',
      label: 'Patient Reviews',
      blockTypes: ['testimonials', 'reviews'],
      intentTriggers: ['comparing'],
      leadScoreImpact: 3,
    },
    {
      id: 'dc_conversion',
      type: 'conversion',
      label: 'Book Appointment',
      blockTypes: ['lead_capture', 'appointment'],
      intentTriggers: ['booking', 'schedule'],
      leadScoreImpact: 5,
    },
    {
      id: 'dc_handoff',
      type: 'handoff',
      label: 'Contact Clinic',
      blockTypes: ['contact', 'handoff'],
      intentTriggers: ['contact', 'complaint', 'urgent'],
      leadScoreImpact: 0,
      isExit: true,
    },
  ],
  transitions: [
    { from: 'dc_greeting', to: 'dc_discovery', trigger: 'browsing' },
    { from: 'dc_greeting', to: 'dc_conversion', trigger: 'booking', priority: 1 },
    { from: 'dc_greeting', to: 'dc_handoff', trigger: 'contact' },
    { from: 'dc_discovery', to: 'dc_social_proof', trigger: 'comparing' },
    { from: 'dc_discovery', to: 'dc_conversion', trigger: 'booking', priority: 1 },
    { from: 'dc_discovery', to: 'dc_conversion', trigger: 'schedule' },
    { from: 'dc_discovery', to: 'dc_handoff', trigger: 'contact' },
    { from: 'dc_social_proof', to: 'dc_conversion', trigger: 'booking', priority: 1 },
    { from: 'dc_social_proof', to: 'dc_discovery', trigger: 'browsing' },
    { from: 'dc_social_proof', to: 'dc_handoff', trigger: 'contact' },
    { from: 'dc_conversion', to: 'dc_handoff', trigger: 'contact' },
    { from: 'dc_discovery', to: 'dc_handoff', trigger: 'complaint' },
    { from: 'dc_discovery', to: 'dc_handoff', trigger: 'urgent' },
    { from: 'dc_conversion', to: 'dc_handoff', trigger: 'complaint' },
  ],
};

// ---------------------------------------------------------------------------
// 5. Real Estate
// ---------------------------------------------------------------------------
const realEstate: SystemFlowTemplate = {
  id: 'tpl_real_estate',
  name: 'Real Estate Flow',
  industryId: 'business_professional',
  functionId: 'real_estate',
  industryName: 'Business & Professional Services',
  functionName: 'Real Estate Services',
  description: 'Takes property seekers from listing browsing through comparison to lead capture for viewings.',
  settings: defaultSettings({ showPromos: false }),
  stages: [
    {
      id: 're_greeting',
      type: 'greeting',
      label: 'Welcome',
      blockTypes: ['greeting', 'welcome'],
      intentTriggers: ['browsing'],
      leadScoreImpact: 1,
      isEntry: true,
    },
    {
      id: 're_discovery',
      type: 'discovery',
      label: 'Browse Listings',
      blockTypes: ['listings', 'gallery'],
      intentTriggers: ['browsing', 'returning'],
      leadScoreImpact: 2,
    },
    {
      id: 're_comparison',
      type: 'comparison',
      label: 'Compare Properties',
      blockTypes: ['compare'],
      intentTriggers: ['comparing'],
      leadScoreImpact: 4,
    },
    {
      id: 're_conversion',
      type: 'conversion',
      label: 'Schedule Viewing',
      blockTypes: ['lead_capture', 'form'],
      intentTriggers: ['booking', 'schedule'],
      leadScoreImpact: 5,
    },
    {
      id: 're_handoff',
      type: 'handoff',
      label: 'Contact Agent',
      blockTypes: ['contact', 'handoff'],
      intentTriggers: ['contact', 'complaint', 'urgent'],
      leadScoreImpact: 0,
      isExit: true,
    },
  ],
  transitions: [
    { from: 're_greeting', to: 're_discovery', trigger: 'browsing' },
    { from: 're_greeting', to: 're_conversion', trigger: 'booking', priority: 1 },
    { from: 're_greeting', to: 're_handoff', trigger: 'contact' },
    { from: 're_discovery', to: 're_comparison', trigger: 'comparing' },
    { from: 're_discovery', to: 're_conversion', trigger: 'booking', priority: 1 },
    { from: 're_discovery', to: 're_handoff', trigger: 'contact' },
    { from: 're_comparison', to: 're_conversion', trigger: 'booking', priority: 1 },
    { from: 're_comparison', to: 're_discovery', trigger: 'browsing' },
    { from: 're_comparison', to: 're_handoff', trigger: 'contact' },
    { from: 're_conversion', to: 're_handoff', trigger: 'contact' },
    { from: 're_discovery', to: 're_handoff', trigger: 'complaint' },
    { from: 're_comparison', to: 're_handoff', trigger: 'complaint' },
    { from: 're_conversion', to: 're_handoff', trigger: 'complaint' },
  ],
};

// ---------------------------------------------------------------------------
// 6. E-commerce / D2C
// ---------------------------------------------------------------------------
const ecommerceD2c: SystemFlowTemplate = {
  id: 'tpl_ecommerce_d2c',
  name: 'E-commerce D2C Flow',
  industryId: 'retail_commerce',
  functionId: 'ecommerce_d2c',
  industryName: 'Retail & Commerce',
  functionName: 'E-commerce / D2C Brand',
  description: 'Guides shoppers from product browsing through comparison and promos to purchase.',
  settings: defaultSettings(),
  stages: [
    {
      id: 'ec_greeting',
      type: 'greeting',
      label: 'Welcome',
      blockTypes: ['greeting', 'welcome'],
      intentTriggers: ['browsing'],
      leadScoreImpact: 1,
      isEntry: true,
    },
    {
      id: 'ec_discovery',
      type: 'discovery',
      label: 'Browse Products',
      blockTypes: ['products', 'catalog'],
      intentTriggers: ['browsing', 'returning'],
      leadScoreImpact: 2,
    },
    {
      id: 'ec_comparison',
      type: 'comparison',
      label: 'Compare Products',
      blockTypes: ['compare'],
      intentTriggers: ['comparing'],
      leadScoreImpact: 4,
    },
    {
      id: 'ec_showcase',
      type: 'showcase',
      label: 'Deals & Promos',
      blockTypes: ['promo', 'deal'],
      intentTriggers: ['promo', 'pricing'],
      leadScoreImpact: 3,
    },
    {
      id: 'ec_handoff',
      type: 'handoff',
      label: 'Contact Support',
      blockTypes: ['contact', 'handoff'],
      intentTriggers: ['contact', 'complaint', 'urgent'],
      leadScoreImpact: 0,
      isExit: true,
    },
  ],
  transitions: [
    { from: 'ec_greeting', to: 'ec_discovery', trigger: 'browsing' },
    { from: 'ec_greeting', to: 'ec_showcase', trigger: 'promo' },
    { from: 'ec_greeting', to: 'ec_handoff', trigger: 'contact' },
    { from: 'ec_discovery', to: 'ec_comparison', trigger: 'comparing' },
    { from: 'ec_discovery', to: 'ec_showcase', trigger: 'promo' },
    { from: 'ec_discovery', to: 'ec_showcase', trigger: 'pricing' },
    { from: 'ec_discovery', to: 'ec_handoff', trigger: 'contact' },
    { from: 'ec_comparison', to: 'ec_showcase', trigger: 'promo' },
    { from: 'ec_comparison', to: 'ec_discovery', trigger: 'browsing' },
    { from: 'ec_comparison', to: 'ec_handoff', trigger: 'contact' },
    { from: 'ec_showcase', to: 'ec_discovery', trigger: 'browsing' },
    { from: 'ec_showcase', to: 'ec_handoff', trigger: 'contact' },
    { from: 'ec_discovery', to: 'ec_handoff', trigger: 'complaint' },
    { from: 'ec_comparison', to: 'ec_handoff', trigger: 'complaint' },
    { from: 'ec_showcase', to: 'ec_handoff', trigger: 'complaint' },
  ],
};

// ---------------------------------------------------------------------------
// 7. Hair & Beauty Services
// ---------------------------------------------------------------------------
const hairBeauty: SystemFlowTemplate = {
  id: 'tpl_hair_beauty',
  name: 'Hair & Beauty Flow',
  industryId: 'personal_wellness',
  functionId: 'hair_beauty',
  industryName: 'Personal Care & Wellness',
  functionName: 'Hair & Beauty Services',
  description: 'Walks clients from service browsing through schedule viewing to booking appointments.',
  settings: defaultSettings(),
  stages: [
    {
      id: 'hb_greeting',
      type: 'greeting',
      label: 'Welcome',
      blockTypes: ['greeting', 'welcome'],
      intentTriggers: ['browsing'],
      leadScoreImpact: 1,
      isEntry: true,
    },
    {
      id: 'hb_discovery',
      type: 'discovery',
      label: 'Services & Treatments',
      blockTypes: ['services', 'treatments'],
      intentTriggers: ['browsing', 'inquiry', 'returning'],
      leadScoreImpact: 2,
    },
    {
      id: 'hb_showcase',
      type: 'showcase',
      label: 'Schedule & Availability',
      blockTypes: ['schedule', 'slots'],
      intentTriggers: ['schedule', 'pricing'],
      leadScoreImpact: 3,
    },
    {
      id: 'hb_conversion',
      type: 'conversion',
      label: 'Book Appointment',
      blockTypes: ['book', 'appointment'],
      intentTriggers: ['booking'],
      leadScoreImpact: 5,
    },
    {
      id: 'hb_handoff',
      type: 'handoff',
      label: 'Contact Salon',
      blockTypes: ['contact', 'handoff'],
      intentTriggers: ['contact', 'complaint', 'urgent'],
      leadScoreImpact: 0,
      isExit: true,
    },
  ],
  transitions: [
    { from: 'hb_greeting', to: 'hb_discovery', trigger: 'browsing' },
    { from: 'hb_greeting', to: 'hb_conversion', trigger: 'booking', priority: 1 },
    { from: 'hb_greeting', to: 'hb_showcase', trigger: 'schedule' },
    { from: 'hb_greeting', to: 'hb_handoff', trigger: 'contact' },
    { from: 'hb_discovery', to: 'hb_showcase', trigger: 'schedule' },
    { from: 'hb_discovery', to: 'hb_showcase', trigger: 'pricing' },
    { from: 'hb_discovery', to: 'hb_conversion', trigger: 'booking', priority: 1 },
    { from: 'hb_discovery', to: 'hb_handoff', trigger: 'contact' },
    { from: 'hb_showcase', to: 'hb_conversion', trigger: 'booking', priority: 1 },
    { from: 'hb_showcase', to: 'hb_discovery', trigger: 'browsing' },
    { from: 'hb_showcase', to: 'hb_handoff', trigger: 'contact' },
    { from: 'hb_conversion', to: 'hb_handoff', trigger: 'contact' },
    { from: 'hb_discovery', to: 'hb_handoff', trigger: 'complaint' },
    { from: 'hb_showcase', to: 'hb_handoff', trigger: 'complaint' },
    { from: 'hb_conversion', to: 'hb_handoff', trigger: 'complaint' },
  ],
};

// ---------------------------------------------------------------------------
// 8. Plumbing & Electrical
// ---------------------------------------------------------------------------
const plumbingElectrical: SystemFlowTemplate = {
  id: 'tpl_plumbing_electrical',
  name: 'Plumbing & Electrical Flow',
  industryId: 'home_property',
  functionId: 'plumbing_electrical',
  industryName: 'Home & Property Services',
  functionName: 'Plumbing & Electrical Services',
  description: 'Guides homeowners from service discovery through pricing to lead capture and urgent handoff.',
  settings: defaultSettings({ showTestimonials: false }),
  stages: [
    {
      id: 'pe_greeting',
      type: 'greeting',
      label: 'Welcome',
      blockTypes: ['greeting', 'welcome'],
      intentTriggers: ['browsing'],
      leadScoreImpact: 1,
      isEntry: true,
    },
    {
      id: 'pe_discovery',
      type: 'discovery',
      label: 'Services',
      blockTypes: ['services', 'info'],
      intentTriggers: ['browsing', 'inquiry', 'returning'],
      leadScoreImpact: 2,
    },
    {
      id: 'pe_showcase',
      type: 'showcase',
      label: 'Pricing',
      blockTypes: ['pricing', 'packages'],
      intentTriggers: ['pricing'],
      leadScoreImpact: 3,
    },
    {
      id: 'pe_conversion',
      type: 'conversion',
      label: 'Request Service',
      blockTypes: ['lead_capture', 'form'],
      intentTriggers: ['booking', 'schedule'],
      leadScoreImpact: 5,
    },
    {
      id: 'pe_handoff',
      type: 'handoff',
      label: 'Emergency Contact',
      blockTypes: ['handoff', 'connect'],
      intentTriggers: ['contact', 'complaint', 'urgent'],
      leadScoreImpact: 0,
      isExit: true,
    },
  ],
  transitions: [
    { from: 'pe_greeting', to: 'pe_discovery', trigger: 'browsing' },
    { from: 'pe_greeting', to: 'pe_handoff', trigger: 'urgent', priority: 2 },
    { from: 'pe_greeting', to: 'pe_conversion', trigger: 'booking', priority: 1 },
    { from: 'pe_greeting', to: 'pe_handoff', trigger: 'contact' },
    { from: 'pe_discovery', to: 'pe_showcase', trigger: 'pricing' },
    { from: 'pe_discovery', to: 'pe_conversion', trigger: 'booking', priority: 1 },
    { from: 'pe_discovery', to: 'pe_handoff', trigger: 'contact' },
    { from: 'pe_discovery', to: 'pe_handoff', trigger: 'urgent', priority: 2 },
    { from: 'pe_showcase', to: 'pe_conversion', trigger: 'booking', priority: 1 },
    { from: 'pe_showcase', to: 'pe_discovery', trigger: 'browsing' },
    { from: 'pe_showcase', to: 'pe_handoff', trigger: 'contact' },
    { from: 'pe_conversion', to: 'pe_handoff', trigger: 'contact' },
    { from: 'pe_discovery', to: 'pe_handoff', trigger: 'complaint' },
    { from: 'pe_showcase', to: 'pe_handoff', trigger: 'complaint' },
    { from: 'pe_conversion', to: 'pe_handoff', trigger: 'complaint' },
  ],
};

// ---------------------------------------------------------------------------
// Template registry
// ---------------------------------------------------------------------------
export const SYSTEM_FLOW_TEMPLATES: SystemFlowTemplate[] = [
  hotelsResorts,
  fullServiceRestaurant,
  fitnessGym,
  dentalCare,
  realEstate,
  ecommerceD2c,
  hairBeauty,
  plumbingElectrical,
];

export function getFlowTemplateForFunction(functionId: string): SystemFlowTemplate | null {
  return SYSTEM_FLOW_TEMPLATES.find((t) => t.functionId === functionId) ?? null;
}

export function getDefaultFlowForIndustry(industryId: string): SystemFlowTemplate | null {
  return SYSTEM_FLOW_TEMPLATES.find((t) => t.industryId === industryId) ?? null;
}

// ---------------------------------------------------------------------------
// Auto-generation helpers for sub-vertical flows
// ---------------------------------------------------------------------------

const STAGE_LABELS: Record<string, string> = {
  greeting: 'Welcome',
  discovery: 'Browse',
  showcase: 'Details',
  comparison: 'Compare',
  social_proof: 'Reviews',
  conversion: 'Book / Buy',
  objection: 'Concerns',
  handoff: 'Contact',
};

const STAGE_INTENTS: Record<string, IntentSignal[]> = {
  greeting: ['browsing'],
  discovery: ['browsing', 'returning'],
  showcase: ['pricing', 'inquiry'],
  comparison: ['comparing'],
  social_proof: ['comparing'],
  conversion: ['booking', 'schedule'],
  objection: ['complaint'],
  handoff: ['contact', 'complaint', 'urgent'],
};

const STAGE_SCORES: Record<string, number> = {
  greeting: 1,
  discovery: 2,
  showcase: 3,
  comparison: 4,
  social_proof: 3,
  conversion: 5,
  objection: 2,
  handoff: 0,
};

const STAGE_ORDER: FlowStageType[] = [
  'greeting', 'discovery', 'showcase', 'comparison',
  'social_proof', 'conversion', 'objection', 'handoff',
];

function buildStandardTransitions(stages: FlowStage[]): FlowTransition[] {
  const transitions: FlowTransition[] = [];
  const stageIds = new Map(stages.map(s => [s.type, s.id]));
  const handoffId = stageIds.get('handoff');
  const discoveryId = stageIds.get('discovery');
  const conversionId = stageIds.get('conversion');
  const greetingId = stageIds.get('greeting');

  // greeting → discovery (browsing)
  if (greetingId && discoveryId) {
    transitions.push({ from: greetingId, to: discoveryId, trigger: 'browsing' });
  }
  // greeting → conversion (booking, high priority)
  if (greetingId && conversionId) {
    transitions.push({ from: greetingId, to: conversionId, trigger: 'booking', priority: 1 });
  }
  // greeting → handoff (contact)
  if (greetingId && handoffId) {
    transitions.push({ from: greetingId, to: handoffId, trigger: 'contact' });
  }

  // discovery → showcase/comparison/conversion
  if (discoveryId) {
    const showcaseId = stageIds.get('showcase');
    const comparisonId = stageIds.get('comparison');
    if (showcaseId) transitions.push({ from: discoveryId, to: showcaseId, trigger: 'pricing' });
    if (comparisonId) transitions.push({ from: discoveryId, to: comparisonId, trigger: 'comparing' });
    if (conversionId) transitions.push({ from: discoveryId, to: conversionId, trigger: 'booking', priority: 1 });
    if (handoffId) transitions.push({ from: discoveryId, to: handoffId, trigger: 'contact' });
  }

  // showcase → conversion, comparison, handoff
  const showcaseId = stageIds.get('showcase');
  if (showcaseId) {
    if (conversionId) transitions.push({ from: showcaseId, to: conversionId, trigger: 'booking', priority: 1 });
    if (discoveryId) transitions.push({ from: showcaseId, to: discoveryId, trigger: 'browsing' });
    if (handoffId) transitions.push({ from: showcaseId, to: handoffId, trigger: 'contact' });
  }

  // comparison → conversion, discovery, handoff
  const comparisonId = stageIds.get('comparison');
  if (comparisonId) {
    if (conversionId) transitions.push({ from: comparisonId, to: conversionId, trigger: 'booking', priority: 1 });
    if (discoveryId) transitions.push({ from: comparisonId, to: discoveryId, trigger: 'browsing' });
    if (handoffId) transitions.push({ from: comparisonId, to: handoffId, trigger: 'contact' });
  }

  // social_proof → conversion, discovery, handoff
  const socialProofId = stageIds.get('social_proof');
  if (socialProofId) {
    if (conversionId) transitions.push({ from: socialProofId, to: conversionId, trigger: 'booking', priority: 1 });
    if (discoveryId) transitions.push({ from: socialProofId, to: discoveryId, trigger: 'browsing' });
    if (handoffId) transitions.push({ from: socialProofId, to: handoffId, trigger: 'contact' });
  }

  // conversion → handoff
  if (conversionId && handoffId) {
    transitions.push({ from: conversionId, to: handoffId, trigger: 'contact' });
  }

  // complaint escalation: every non-handoff stage → handoff
  if (handoffId) {
    for (const s of stages) {
      if (s.type !== 'handoff' && s.type !== 'greeting') {
        const alreadyHasComplaint = transitions.some(
          t => t.from === s.id && t.to === handoffId && t.trigger === 'complaint',
        );
        if (!alreadyHasComplaint) {
          transitions.push({ from: s.id, to: handoffId, trigger: 'complaint' });
        }
      }
    }
  }

  return transitions;
}

/**
 * Auto-generates a SystemFlowTemplate for any sub-vertical using its block registry data.
 * Returns hand-crafted template if one exists, otherwise builds from block stages.
 */
export function generateFlowForSubVertical(functionId: string): SystemFlowTemplate | null {
  // Prefer hand-crafted template if available
  const existing = getFlowTemplateForFunction(functionId);
  if (existing) return existing;

  const result = getSubVertical(functionId);
  if (!result) return null;
  const { vertical, subVertical } = result;
  const blocks = getBlocksForFunction(functionId);

  // Group block IDs by their stage
  const blocksByStage: Record<string, string[]> = {};
  for (const b of blocks) {
    if (!blocksByStage[b.stage]) blocksByStage[b.stage] = [];
    blocksByStage[b.stage].push(b.id);
  }

  // Create a short prefix for stage IDs from the functionId
  const prefix = functionId.replace(/[^a-z0-9]/g, '_').substring(0, 10);

  // Build stages only for stage types that have blocks
  const stages: FlowStage[] = STAGE_ORDER
    .filter(stageType => blocksByStage[stageType]?.length > 0)
    .map(stageType => ({
      id: `${prefix}_${stageType}`,
      type: stageType,
      label: STAGE_LABELS[stageType] || stageType,
      blockTypes: blocksByStage[stageType],
      intentTriggers: STAGE_INTENTS[stageType] || ['browsing'],
      leadScoreImpact: STAGE_SCORES[stageType] || 1,
      ...(stageType === 'greeting' ? { isEntry: true } : {}),
      ...(stageType === 'handoff' ? { isExit: true } : {}),
    }));

  if (stages.length === 0) return null;

  const transitions = buildStandardTransitions(stages);

  return {
    id: `tpl_${functionId}`,
    name: `${subVertical.name} Flow`,
    industryId: vertical.industryId,
    functionId,
    industryName: vertical.name,
    functionName: subVertical.name,
    description: `Auto-generated flow for ${subVertical.name}`,
    settings: defaultSettings(),
    stages,
    transitions,
  };
}
