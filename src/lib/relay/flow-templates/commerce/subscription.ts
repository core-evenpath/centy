// Commerce flow template — subscription / recurring purchase.
//
// Covers: health_wellness_retail (subscribe-and-save variants),
// online_learning (course subscriptions), grocery_convenience
// (recurring delivery), and any D2C partner whose funnel emphasizes
// recurring commerce.

import type { SystemFlowTemplate } from '@/lib/types-flow-engine';
import { defaultSettings } from '@/lib/flow-templates';

export const SUBSCRIPTION_FLOW_TEMPLATE: SystemFlowTemplate = {
  id: 'commerce_tpl_subscription',
  name: 'Commerce Flow — Subscription',
  industryId: 'retail_commerce',
  functionId: 'online_learning',
  industryName: 'Retail & Commerce',
  functionName: 'Subscription / Recurring',
  description: 'Commerce-engine flow for subscription-led partners: product fit → frequency selector → commit.',
  engine: 'commerce',
  serviceIntentBreaks: ['track-order', 'cancel-order', 'modify-order'],
  settings: defaultSettings(),
  stages: [
    { id: 'sub_greeting', type: 'greeting', label: 'Welcome', blockTypes: ['greeting', 'suggestions'], intentTriggers: ['browsing'], leadScoreImpact: 1, isEntry: true },
    { id: 'sub_discovery', type: 'discovery', label: 'Find Fit', blockTypes: ['skin_quiz', 'product_card'], intentTriggers: ['browsing', 'returning'], leadScoreImpact: 2 },
    { id: 'sub_showcase', type: 'showcase', label: 'Details & Bundle', blockTypes: ['product_detail', 'bundle', 'promo'], intentTriggers: ['pricing', 'inquiry'], leadScoreImpact: 3 },
    { id: 'sub_conversion', type: 'conversion', label: 'Subscribe', blockTypes: ['subscription', 'cart'], intentTriggers: ['booking'], leadScoreImpact: 5 },
    { id: 'sub_handoff', type: 'handoff', label: 'Contact', blockTypes: ['contact'], intentTriggers: ['contact', 'complaint', 'urgent'], leadScoreImpact: 0, isExit: true },
  ],
  transitions: [
    { from: 'sub_greeting', to: 'sub_discovery', trigger: 'browsing' },
    { from: 'sub_greeting', to: 'sub_conversion', trigger: 'booking', priority: 1 },
    { from: 'sub_greeting', to: 'sub_handoff', trigger: 'contact' },
    { from: 'sub_discovery', to: 'sub_showcase', trigger: 'pricing' },
    { from: 'sub_discovery', to: 'sub_showcase', trigger: 'inquiry' },
    { from: 'sub_discovery', to: 'sub_conversion', trigger: 'booking', priority: 1 },
    { from: 'sub_discovery', to: 'sub_handoff', trigger: 'contact' },
    { from: 'sub_showcase', to: 'sub_conversion', trigger: 'booking', priority: 1 },
    { from: 'sub_showcase', to: 'sub_discovery', trigger: 'browsing' },
    { from: 'sub_showcase', to: 'sub_handoff', trigger: 'contact' },
    { from: 'sub_conversion', to: 'sub_handoff', trigger: 'contact' },
    { from: 'sub_discovery', to: 'sub_handoff', trigger: 'complaint' },
    { from: 'sub_showcase', to: 'sub_handoff', trigger: 'complaint' },
    { from: 'sub_conversion', to: 'sub_handoff', trigger: 'complaint' },
  ],
};
