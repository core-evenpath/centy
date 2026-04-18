// Commerce flow template — B2B food supply / wholesale.
//
// Covers: fresh_produce, meat_fish, dairy_beverage, packaged_specialty,
// grocery_delivery, food_wholesale, farm_agricultural, organic_health_foods.

import type { SystemFlowTemplate } from '@/lib/types-flow-engine';
import { defaultSettings } from '@/lib/flow-templates';

export const FOOD_SUPPLY_FLOW_TEMPLATE: SystemFlowTemplate = {
  id: 'commerce_tpl_food_supply',
  name: 'Commerce Flow — Food Supply / Wholesale',
  industryId: 'food_supply',
  functionId: 'food_wholesale',
  industryName: 'Food Supply & Distribution',
  functionName: 'Wholesale / B2B Supply',
  description: 'Commerce-engine flow for wholesalers / distributors / farms: catalog → bulk-order → delivery scheduling → recurring.',
  engine: 'commerce',
  serviceIntentBreaks: ['track-order', 'cancel-order', 'modify-order'],
  settings: defaultSettings(),
  stages: [
    { id: 'fs_greeting', type: 'greeting', label: 'Welcome', blockTypes: ['greeting', 'suggestions'], intentTriggers: ['browsing'], leadScoreImpact: 1, isEntry: true },
    { id: 'fs_discovery', type: 'discovery', label: 'Browse Catalog', blockTypes: ['fs_product_card', 'catalog_browser', 'stock_status', 'supplier_profile'], intentTriggers: ['browsing', 'returning'], leadScoreImpact: 2 },
    { id: 'fs_showcase', type: 'showcase', label: 'Product Detail', blockTypes: ['fs_product_detail', 'wholesale_pricing', 'cert_compliance', 'quality_report'], intentTriggers: ['pricing', 'inquiry'], leadScoreImpact: 3 },
    { id: 'fs_conversion', type: 'conversion', label: 'Bulk Order', blockTypes: ['bulk_order', 'delivery_scheduler', 'sample_request', 'cart'], intentTriggers: ['booking', 'schedule'], leadScoreImpact: 5 },
    { id: 'fs_followup', type: 'followup', label: 'Standing Orders', blockTypes: ['recurring_order', 'buyer_review'], intentTriggers: ['returning'], leadScoreImpact: 2 },
    { id: 'fs_handoff', type: 'handoff', label: 'Contact Sales', blockTypes: ['contact'], intentTriggers: ['contact', 'complaint', 'urgent'], leadScoreImpact: 0, isExit: true },
  ],
  transitions: [
    { from: 'fs_greeting', to: 'fs_discovery', trigger: 'browsing' },
    { from: 'fs_greeting', to: 'fs_conversion', trigger: 'booking', priority: 1 },
    { from: 'fs_greeting', to: 'fs_handoff', trigger: 'contact' },
    { from: 'fs_discovery', to: 'fs_showcase', trigger: 'pricing' },
    { from: 'fs_discovery', to: 'fs_showcase', trigger: 'inquiry' },
    { from: 'fs_discovery', to: 'fs_conversion', trigger: 'booking', priority: 1 },
    { from: 'fs_discovery', to: 'fs_handoff', trigger: 'contact' },
    { from: 'fs_showcase', to: 'fs_conversion', trigger: 'booking', priority: 1 },
    { from: 'fs_showcase', to: 'fs_discovery', trigger: 'browsing' },
    { from: 'fs_showcase', to: 'fs_handoff', trigger: 'contact' },
    { from: 'fs_conversion', to: 'fs_followup', trigger: 'returning' },
    { from: 'fs_conversion', to: 'fs_handoff', trigger: 'contact' },
    { from: 'fs_followup', to: 'fs_handoff', trigger: 'contact' },
    { from: 'fs_discovery', to: 'fs_handoff', trigger: 'complaint' },
    { from: 'fs_showcase', to: 'fs_handoff', trigger: 'complaint' },
    { from: 'fs_conversion', to: 'fs_handoff', trigger: 'complaint' },
    { from: 'fs_followup', to: 'fs_handoff', trigger: 'complaint' },
  ],
};
