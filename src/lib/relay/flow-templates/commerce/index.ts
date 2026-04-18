// Commerce flow templates registry (P2.commerce.M03).
//
// Keyed by `functionId`. Multiple functionIds share a template (e.g.,
// all retail-style D2C sub-verticals share GENERAL_RETAIL). Mirrors
// the Booking flow-templates registry pattern from Phase 1 M05.

import type { SystemFlowTemplate } from '@/lib/types-flow-engine';
import { GENERAL_RETAIL_FLOW_TEMPLATE } from './general-retail';
import { FOOD_DELIVERY_FLOW_TEMPLATE } from './food-delivery';
import { FOOD_SUPPLY_FLOW_TEMPLATE } from './food-supply';
import { SUBSCRIPTION_FLOW_TEMPLATE } from './subscription';

export {
  GENERAL_RETAIL_FLOW_TEMPLATE,
  FOOD_DELIVERY_FLOW_TEMPLATE,
  FOOD_SUPPLY_FLOW_TEMPLATE,
  SUBSCRIPTION_FLOW_TEMPLATE,
};

export const COMMERCE_FLOW_TEMPLATES: Readonly<Record<string, SystemFlowTemplate>> = {
  // Retail / D2C (13) — GENERAL_RETAIL covers this cluster
  ecommerce_d2c:         GENERAL_RETAIL_FLOW_TEMPLATE,
  physical_retail:       GENERAL_RETAIL_FLOW_TEMPLATE,
  fashion_apparel:       GENERAL_RETAIL_FLOW_TEMPLATE,
  electronics_gadgets:   GENERAL_RETAIL_FLOW_TEMPLATE,
  jewelry_luxury:        GENERAL_RETAIL_FLOW_TEMPLATE,
  furniture_home:        GENERAL_RETAIL_FLOW_TEMPLATE,
  grocery_convenience:   GENERAL_RETAIL_FLOW_TEMPLATE,
  health_wellness_retail:GENERAL_RETAIL_FLOW_TEMPLATE,
  books_stationery:      GENERAL_RETAIL_FLOW_TEMPLATE,
  sports_outdoor:        GENERAL_RETAIL_FLOW_TEMPLATE,
  baby_kids:             GENERAL_RETAIL_FLOW_TEMPLATE,
  pet_supplies:          GENERAL_RETAIL_FLOW_TEMPLATE,
  pharmacy_retail:       GENERAL_RETAIL_FLOW_TEMPLATE,

  // Food & Beverage ordering (7) — FOOD_DELIVERY
  full_service_restaurant: FOOD_DELIVERY_FLOW_TEMPLATE,
  casual_dining:           FOOD_DELIVERY_FLOW_TEMPLATE,
  qsr:                     FOOD_DELIVERY_FLOW_TEMPLATE,
  beverage_cafe:           FOOD_DELIVERY_FLOW_TEMPLATE,
  bakery_desserts:         FOOD_DELIVERY_FLOW_TEMPLATE,
  cloud_kitchen:           FOOD_DELIVERY_FLOW_TEMPLATE,
  street_food:             FOOD_DELIVERY_FLOW_TEMPLATE,

  // Food Supply / B2B (8) — FOOD_SUPPLY
  fresh_produce:        FOOD_SUPPLY_FLOW_TEMPLATE,
  meat_fish:            FOOD_SUPPLY_FLOW_TEMPLATE,
  dairy_beverage:       FOOD_SUPPLY_FLOW_TEMPLATE,
  packaged_specialty:   FOOD_SUPPLY_FLOW_TEMPLATE,
  grocery_delivery:     FOOD_SUPPLY_FLOW_TEMPLATE,
  food_wholesale:       FOOD_SUPPLY_FLOW_TEMPLATE,
  farm_agricultural:    FOOD_SUPPLY_FLOW_TEMPLATE,
  organic_health_foods: FOOD_SUPPLY_FLOW_TEMPLATE,

  // Subscription-focused (fit for services + online-learning)
  online_learning:  SUBSCRIPTION_FLOW_TEMPLATE,

  // Commerce-secondary (where commerce is in engine list but not primary)
  // — mapped to the closest-fit commerce template so the orchestrator has
  // a flow to resolve when the user intent lands in commerce.
  bars_pubs:             FOOD_DELIVERY_FLOW_TEMPLATE,
  carpentry_furniture:   GENERAL_RETAIL_FLOW_TEMPLATE,
  laundry_drycleaning:   GENERAL_RETAIL_FLOW_TEMPLATE,
  vision_care:           GENERAL_RETAIL_FLOW_TEMPLATE,

  // Other commerce-primary fn entries from the M03 recipe
  auto_parts:           GENERAL_RETAIL_FLOW_TEMPLATE,
  tires_batteries:      GENERAL_RETAIL_FLOW_TEMPLATE,
  forex_remittance:     GENERAL_RETAIL_FLOW_TEMPLATE,
  translation_docs:     GENERAL_RETAIL_FLOW_TEMPLATE,
  logistics_courier:    GENERAL_RETAIL_FLOW_TEMPLATE,
  decor_floral:         GENERAL_RETAIL_FLOW_TEMPLATE,
  printing_invitations: GENERAL_RETAIL_FLOW_TEMPLATE,
  wholesale_distribution: FOOD_SUPPLY_FLOW_TEMPLATE,
};

export function getCommerceFlowTemplate(
  functionId: string | null | undefined,
): SystemFlowTemplate | null {
  if (!functionId) return null;
  return COMMERCE_FLOW_TEMPLATES[functionId] ?? null;
}
