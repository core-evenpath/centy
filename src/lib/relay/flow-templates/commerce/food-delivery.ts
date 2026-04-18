// Commerce flow template — food ordering / delivery.
//
// Covers: full_service_restaurant, casual_dining, qsr, beverage_cafe,
// bakery_desserts, cloud_kitchen, street_food.

import type { SystemFlowTemplate } from '@/lib/types-flow-engine';
import { defaultSettings } from '@/lib/flow-templates';

export const FOOD_DELIVERY_FLOW_TEMPLATE: SystemFlowTemplate = {
  id: 'commerce_tpl_food_delivery',
  name: 'Commerce Flow — Food Ordering',
  industryId: 'food_beverage',
  functionId: 'qsr',
  industryName: 'Food & Beverage',
  functionName: 'Food Ordering / Delivery',
  description: 'Commerce-engine flow for restaurants / cafes / cloud-kitchens: menu → customize → order → pay.',
  engine: 'commerce',
  serviceIntentBreaks: ['track-order', 'cancel-order', 'modify-order'],
  settings: defaultSettings(),
  stages: [
    { id: 'fd_greeting', type: 'greeting', label: 'Welcome', blockTypes: ['greeting', 'suggestions'], intentTriggers: ['browsing'], leadScoreImpact: 1, isEntry: true },
    { id: 'fd_discovery', type: 'discovery', label: 'Browse Menu', blockTypes: ['menu_item', 'category_browser', 'dietary_filter', 'drink_menu'], intentTriggers: ['browsing', 'returning'], leadScoreImpact: 2 },
    { id: 'fd_showcase', type: 'showcase', label: 'Dish Detail', blockTypes: ['menu_detail', 'daily_specials', 'combo_meal', 'nutrition', 'promo'], intentTriggers: ['pricing', 'inquiry'], leadScoreImpact: 3 },
    { id: 'fd_conversion', type: 'conversion', label: 'Customize & Order', blockTypes: ['order_customizer', 'cart'], intentTriggers: ['booking'], leadScoreImpact: 5 },
    { id: 'fd_handoff', type: 'handoff', label: 'Contact', blockTypes: ['contact'], intentTriggers: ['contact', 'complaint', 'urgent'], leadScoreImpact: 0, isExit: true },
  ],
  transitions: [
    { from: 'fd_greeting', to: 'fd_discovery', trigger: 'browsing' },
    { from: 'fd_greeting', to: 'fd_conversion', trigger: 'booking', priority: 1 },
    { from: 'fd_greeting', to: 'fd_handoff', trigger: 'contact' },
    { from: 'fd_discovery', to: 'fd_showcase', trigger: 'pricing' },
    { from: 'fd_discovery', to: 'fd_showcase', trigger: 'inquiry' },
    { from: 'fd_discovery', to: 'fd_conversion', trigger: 'booking', priority: 1 },
    { from: 'fd_discovery', to: 'fd_handoff', trigger: 'contact' },
    { from: 'fd_showcase', to: 'fd_conversion', trigger: 'booking', priority: 1 },
    { from: 'fd_showcase', to: 'fd_discovery', trigger: 'browsing' },
    { from: 'fd_showcase', to: 'fd_handoff', trigger: 'contact' },
    { from: 'fd_conversion', to: 'fd_handoff', trigger: 'contact' },
    { from: 'fd_discovery', to: 'fd_handoff', trigger: 'complaint' },
    { from: 'fd_showcase', to: 'fd_handoff', trigger: 'complaint' },
    { from: 'fd_conversion', to: 'fd_handoff', trigger: 'complaint' },
  ],
};
