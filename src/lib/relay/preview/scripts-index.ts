// Unified Preview Copilot scripts index.
//
// Booking scripts (M13), Commerce scripts (commerce.M08), and Lead
// scripts (lead.M08) live in separate registries so each can keep
// tight per-engine types. The admin panel needs a single array + a
// single lookup function that spans all three. This module provides
// them without collapsing the registries into a looser shared type.

import { BOOKING_PREVIEW_SCRIPTS, type PreviewScript as BookingPreviewScript } from './booking-scripts';
import {
  COMMERCE_PREVIEW_SCRIPTS,
  type CommercePreviewScript,
} from './commerce-scripts';
import {
  LEAD_PREVIEW_SCRIPTS,
  type LeadPreviewScript,
} from './lead-scripts';

export type AnyPreviewScript =
  | BookingPreviewScript
  | CommercePreviewScript
  | LeadPreviewScript;

export const ALL_PREVIEW_SCRIPTS: readonly AnyPreviewScript[] = [
  ...BOOKING_PREVIEW_SCRIPTS,
  ...COMMERCE_PREVIEW_SCRIPTS,
  ...LEAD_PREVIEW_SCRIPTS,
];

export function getAnyScriptById(id: string): AnyPreviewScript | undefined {
  return ALL_PREVIEW_SCRIPTS.find((s) => s.id === id);
}

// Keep sub-vertical label lookup centralized — the admin panel groups
// scripts by sub-vertical, so it needs human-readable labels that cover
// all three engines' sub-vertical enums.
export const SUB_VERTICAL_LABELS: Record<string, string> = {
  // booking
  hotel: 'Hotel',
  clinic: 'Clinic',
  wellness: 'Wellness',
  ticketing: 'Ticketing',
  'airport-transfer': 'Airport Transfer',
  // commerce
  'general-retail': 'General Retail',
  'food-delivery': 'Food Delivery',
  'food-supply': 'Food Supply',
  subscription: 'Subscription',
  // lead
  'financial-services': 'Financial Services',
  'professional-services': 'Professional Services',
  'real-estate-b2b': 'Real Estate / B2B',
};
