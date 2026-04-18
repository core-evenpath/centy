// Commerce flow template — general retail / D2C ecommerce.
//
// Covers: ecommerce_d2c, physical_retail, fashion_apparel,
// electronics_gadgets, jewelry_luxury, furniture_home,
// grocery_convenience, health_wellness_retail, books_stationery,
// sports_outdoor, baby_kids, pet_supplies, pharmacy_retail.

import type { SystemFlowTemplate } from '@/lib/types-flow-engine';
import { defaultSettings } from '@/lib/flow-templates';

export const GENERAL_RETAIL_FLOW_TEMPLATE: SystemFlowTemplate = {
  id: 'commerce_tpl_general_retail',
  name: 'Commerce Flow — General Retail',
  industryId: 'retail_commerce',
  functionId: 'ecommerce_d2c',
  industryName: 'Retail & Commerce',
  functionName: 'General Retail',
  description: 'Commerce-engine flow for retail / D2C partners: browse → detail → compare → add-to-cart → checkout.',
  engine: 'commerce',
  serviceIntentBreaks: ['track-order', 'cancel-order', 'modify-order'],
  settings: defaultSettings(),
  stages: [
    { id: 'gr_greeting', type: 'greeting', label: 'Welcome', blockTypes: ['greeting', 'suggestions'], intentTriggers: ['browsing'], leadScoreImpact: 1, isEntry: true },
    { id: 'gr_discovery', type: 'discovery', label: 'Browse Catalog', blockTypes: ['product_card', 'skin_quiz'], intentTriggers: ['browsing', 'returning'], leadScoreImpact: 2 },
    { id: 'gr_showcase', type: 'showcase', label: 'Product Detail', blockTypes: ['product_detail', 'bundle', 'promo'], intentTriggers: ['pricing', 'inquiry'], leadScoreImpact: 3 },
    { id: 'gr_comparison', type: 'comparison', label: 'Compare', blockTypes: ['compare'], intentTriggers: ['comparing'], leadScoreImpact: 4 },
    { id: 'gr_conversion', type: 'conversion', label: 'Cart & Checkout', blockTypes: ['cart', 'subscription'], intentTriggers: ['booking', 'schedule'], leadScoreImpact: 5 },
    { id: 'gr_handoff', type: 'handoff', label: 'Contact Support', blockTypes: ['contact'], intentTriggers: ['contact', 'complaint', 'urgent'], leadScoreImpact: 0, isExit: true },
  ],
  transitions: [
    { from: 'gr_greeting', to: 'gr_discovery', trigger: 'browsing' },
    { from: 'gr_greeting', to: 'gr_conversion', trigger: 'booking', priority: 1 },
    { from: 'gr_greeting', to: 'gr_handoff', trigger: 'contact' },
    { from: 'gr_discovery', to: 'gr_showcase', trigger: 'pricing' },
    { from: 'gr_discovery', to: 'gr_showcase', trigger: 'inquiry' },
    { from: 'gr_discovery', to: 'gr_comparison', trigger: 'comparing' },
    { from: 'gr_discovery', to: 'gr_conversion', trigger: 'booking', priority: 1 },
    { from: 'gr_discovery', to: 'gr_handoff', trigger: 'contact' },
    { from: 'gr_showcase', to: 'gr_comparison', trigger: 'comparing' },
    { from: 'gr_showcase', to: 'gr_conversion', trigger: 'booking', priority: 1 },
    { from: 'gr_showcase', to: 'gr_discovery', trigger: 'browsing' },
    { from: 'gr_showcase', to: 'gr_handoff', trigger: 'contact' },
    { from: 'gr_comparison', to: 'gr_conversion', trigger: 'booking', priority: 1 },
    { from: 'gr_comparison', to: 'gr_discovery', trigger: 'browsing' },
    { from: 'gr_comparison', to: 'gr_handoff', trigger: 'contact' },
    { from: 'gr_conversion', to: 'gr_handoff', trigger: 'contact' },
    { from: 'gr_discovery', to: 'gr_handoff', trigger: 'complaint' },
    { from: 'gr_showcase', to: 'gr_handoff', trigger: 'complaint' },
    { from: 'gr_comparison', to: 'gr_handoff', trigger: 'complaint' },
    { from: 'gr_conversion', to: 'gr_handoff', trigger: 'complaint' },
  ],
};
