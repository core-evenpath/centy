/**
 * Canonical vertical list for Content Studio.
 *
 * Kept in its own non-`'use server'` module so plain value constants can be
 * imported from both server-action files and client components without
 * tripping Next.js's "server-only exports async functions" rule.
 */

export const VERTICAL_IDS = [
    'ecommerce',
    'education',
    'automotive',
    'business',
    'events_entertainment',
    'financial_services',
    'food_beverage',
    'food_supply',
    'healthcare',
    'home_property',
    'hospitality',
    'personal_wellness',
    'public_nonprofit',
    'travel_transport',
] as const;

export type VerticalId = (typeof VERTICAL_IDS)[number];
