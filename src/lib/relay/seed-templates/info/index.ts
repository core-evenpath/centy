// Info seed templates (P2.info.M07).
//
// Info partners serve directories, schedules, locations, and status
// displays. Seed templates are small, factual, schema-valid. No PII.

import type { SeedTemplate } from '../commerce/index';

export type { SeedTemplate };

// ── LOCATIONS — 5 items, moduleLocations ────────────────────────────

export const LOCATIONS_SEED: SeedTemplate = {
  id: 'info.locations',
  label: 'Sample locations',
  description: '5 location entries demonstrating pu_office_locator + facility blocks',
  moduleSlug: 'moduleLocations',
  items: [
    {
      name: 'Main Office',
      description: 'Primary office with full services. Weekday hours.',
      category: 'primary',
      currency: 'INR',
      images: [],
      fields: { address: 'Sample Street 1', hours: 'Mon-Fri 9-18', services: 'all' },
      sortOrder: 1,
      isActive: true,
    },
    {
      name: 'Branch Office — North',
      description: 'North-region branch with core services.',
      category: 'branch',
      currency: 'INR',
      images: [],
      fields: { address: 'Sample Street 10 North', hours: 'Mon-Fri 10-17', services: 'core' },
      sortOrder: 2,
      isActive: true,
    },
    {
      name: 'Branch Office — South',
      description: 'South-region branch with core services.',
      category: 'branch',
      currency: 'INR',
      images: [],
      fields: { address: 'Sample Street 10 South', hours: 'Mon-Fri 10-17', services: 'core' },
      sortOrder: 3,
      isActive: true,
    },
    {
      name: 'Information Kiosk',
      description: 'Walk-up kiosk with directions and printed materials.',
      category: 'kiosk',
      currency: 'INR',
      images: [],
      fields: { address: 'Central Plaza', hours: '24/7', services: 'directions-only' },
      sortOrder: 4,
      isActive: true,
    },
    {
      name: 'Regional Headquarters',
      description: 'Regional HQ with executive and strategic services.',
      category: 'hq',
      currency: 'INR',
      images: [],
      fields: { address: 'Regional HQ Complex', hours: 'Mon-Fri 9-17', services: 'executive' },
      sortOrder: 5,
      isActive: true,
    },
  ],
};

// ── SCHEDULES — 5 items, moduleSchedules ────────────────────────────

export const SCHEDULES_SEED: SeedTemplate = {
  id: 'info.schedules',
  label: 'Sample schedules',
  description: '5 schedule entries for tl_schedule_grid + class_schedule-style blocks',
  moduleSlug: 'moduleSchedules',
  items: [
    {
      name: 'Weekday Morning',
      description: 'Morning weekday schedule block.',
      category: 'weekday',
      currency: 'INR',
      images: [],
      fields: { dayPattern: 'mon-fri', timeStart: '06:00', timeEnd: '12:00', frequency: '15-min' },
      sortOrder: 1,
      isActive: true,
    },
    {
      name: 'Weekday Afternoon',
      description: 'Afternoon weekday schedule block.',
      category: 'weekday',
      currency: 'INR',
      images: [],
      fields: { dayPattern: 'mon-fri', timeStart: '12:00', timeEnd: '18:00', frequency: '15-min' },
      sortOrder: 2,
      isActive: true,
    },
    {
      name: 'Weekday Evening',
      description: 'Evening weekday schedule block.',
      category: 'weekday',
      currency: 'INR',
      images: [],
      fields: { dayPattern: 'mon-fri', timeStart: '18:00', timeEnd: '23:00', frequency: '30-min' },
      sortOrder: 3,
      isActive: true,
    },
    {
      name: 'Weekend',
      description: 'Weekend schedule with reduced frequency.',
      category: 'weekend',
      currency: 'INR',
      images: [],
      fields: { dayPattern: 'sat-sun', timeStart: '08:00', timeEnd: '22:00', frequency: '30-min' },
      sortOrder: 4,
      isActive: true,
    },
    {
      name: 'Holiday',
      description: 'Holiday schedule with limited service.',
      category: 'holiday',
      currency: 'INR',
      images: [],
      fields: { dayPattern: 'holiday', timeStart: '10:00', timeEnd: '18:00', frequency: '1-hour' },
      sortOrder: 5,
      isActive: true,
    },
  ],
};

// ── STATUS ENTRIES — 5 items, moduleStatusEntries ───────────────────

export const STATUS_ENTRIES_SEED: SeedTemplate = {
  id: 'info.status_entries',
  label: 'Sample status entries',
  description: '5 status entries for pu_outage_status + related info blocks',
  moduleSlug: 'moduleStatusEntries',
  items: [
    {
      name: 'Water Service',
      description: 'Current operational status of water service.',
      category: 'utility',
      currency: 'INR',
      images: [],
      fields: { serviceType: 'water', defaultStatus: 'operational' },
      sortOrder: 1,
      isActive: true,
    },
    {
      name: 'Electricity',
      description: 'Current operational status of electrical grid.',
      category: 'utility',
      currency: 'INR',
      images: [],
      fields: { serviceType: 'electricity', defaultStatus: 'operational' },
      sortOrder: 2,
      isActive: true,
    },
    {
      name: 'Gas Supply',
      description: 'Current operational status of gas supply.',
      category: 'utility',
      currency: 'INR',
      images: [],
      fields: { serviceType: 'gas', defaultStatus: 'operational' },
      sortOrder: 3,
      isActive: true,
    },
    {
      name: 'Internet / Broadband',
      description: 'Current operational status of internet services.',
      category: 'connectivity',
      currency: 'INR',
      images: [],
      fields: { serviceType: 'broadband', defaultStatus: 'operational' },
      sortOrder: 4,
      isActive: true,
    },
    {
      name: 'Public Transit',
      description: 'Current operational status of transit network.',
      category: 'transit',
      currency: 'INR',
      images: [],
      fields: { serviceType: 'transit', defaultStatus: 'operational' },
      sortOrder: 5,
      isActive: true,
    },
  ],
};

// ── Registry ────────────────────────────────────────────────────────

export const INFO_SEED_TEMPLATES: Readonly<Record<string, SeedTemplate>> = {
  [LOCATIONS_SEED.id]: LOCATIONS_SEED,
  [SCHEDULES_SEED.id]: SCHEDULES_SEED,
  [STATUS_ENTRIES_SEED.id]: STATUS_ENTRIES_SEED,
};

export function getInfoSeedTemplate(id: string): SeedTemplate | undefined {
  return INFO_SEED_TEMPLATES[id];
}

export function listInfoSeedTemplates(): SeedTemplate[] {
  return Object.values(INFO_SEED_TEMPLATES);
}
