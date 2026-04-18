// Booking seed templates (M15).
//
// Five plausible, schema-valid starter items per booking module. All
// content is generic (no real names, addresses, or phone numbers),
// INR currency, empty image arrays (partners upload their own).
//
// Shape matches the `ModuleItem.fields` free-form record — keys align
// with the target module's `ModuleFieldDefinition.id` values defined
// in `src/lib/modules/seed-modules.ts`.

export interface SeedTemplateItem {
  name: string;
  description?: string;
  category: string;
  price?: number;
  currency: string;
  images: string[];
  fields: Record<string, unknown>;
  sortOrder: number;
  isActive: boolean;
}

export interface SeedTemplate {
  id: string;
  label: string;
  description: string;
  /** Module slug items are appended to (e.g. 'room_inventory'). */
  moduleSlug: string;
  items: SeedTemplateItem[];
}

// ── ROOMS — 5 items, room_inventory module, category: rooms ──────────

export const ROOMS_SEED: SeedTemplate = {
  id: 'booking.rooms',
  label: 'Sample rooms',
  description: '5 rooms (standard → premium suite) with occupancy, view, and amenity mixes',
  moduleSlug: 'room_inventory',
  items: [
    {
      name: 'Standard Room',
      description: 'Cozy room with essential amenities for solo travellers or couples',
      category: 'rooms',
      price: 3500,
      currency: 'INR',
      images: [],
      fields: {
        bed_type: 'Queen',
        room_size: 220,
        max_occupancy: 2,
        view_type: 'City',
        amenities: ['AC', 'WiFi', 'TV'],
        floor_number: 2,
        is_smoking: false,
        accessibility: false,
        check_in_time: '14:00',
        check_out_time: '11:00',
      },
      sortOrder: 1,
      isActive: true,
    },
    {
      name: 'Deluxe Room',
      description: 'Spacious room with upgraded amenities and workspace',
      category: 'rooms',
      price: 5200,
      currency: 'INR',
      images: [],
      fields: {
        bed_type: 'King',
        room_size: 320,
        max_occupancy: 2,
        view_type: 'Garden',
        amenities: ['AC', 'WiFi', 'TV', 'Workspace', 'Coffee Maker'],
        floor_number: 4,
        is_smoking: false,
        accessibility: false,
        check_in_time: '14:00',
        check_out_time: '11:00',
      },
      sortOrder: 2,
      isActive: true,
    },
    {
      name: 'Twin Room',
      description: 'Two single beds — suited for friends or colleagues travelling together',
      category: 'rooms',
      price: 4100,
      currency: 'INR',
      images: [],
      fields: {
        bed_type: 'Twin',
        room_size: 260,
        max_occupancy: 2,
        view_type: 'City',
        amenities: ['AC', 'WiFi', 'TV'],
        floor_number: 3,
        is_smoking: false,
        accessibility: false,
        check_in_time: '14:00',
        check_out_time: '11:00',
      },
      sortOrder: 3,
      isActive: true,
    },
    {
      name: 'Family Suite',
      description: 'Separate living area and bedroom — fits a family of four',
      category: 'rooms',
      price: 8500,
      currency: 'INR',
      images: [],
      fields: {
        bed_type: 'King',
        room_size: 480,
        max_occupancy: 4,
        view_type: 'Garden',
        amenities: ['AC', 'WiFi', 'TV', 'Mini Bar', 'Safe', 'Balcony'],
        floor_number: 5,
        is_smoking: false,
        accessibility: true,
        check_in_time: '14:00',
        check_out_time: '11:00',
      },
      sortOrder: 4,
      isActive: true,
    },
    {
      name: 'Premium Suite',
      description: 'Top-tier suite with lounge, terrace, and full amenities',
      category: 'rooms',
      price: 14500,
      currency: 'INR',
      images: [],
      fields: {
        bed_type: 'King',
        room_size: 720,
        max_occupancy: 3,
        view_type: 'Ocean',
        amenities: ['AC', 'WiFi', 'TV', 'Mini Bar', 'Safe', 'Balcony', 'Bathtub', 'Workspace', 'Coffee Maker', 'Room Service'],
        floor_number: 10,
        is_smoking: false,
        accessibility: false,
        check_in_time: '14:00',
        check_out_time: '11:00',
      },
      sortOrder: 5,
      isActive: true,
    },
  ],
};

// ── AMENITIES — 5 items, room_inventory module, category: amenities ───
// (Amenities are surfaced by the `amenities` block which also reads
// from room_inventory with a category filter.)

export const AMENITIES_SEED: SeedTemplate = {
  id: 'booking.amenities',
  label: 'Sample amenities',
  description: '5 property amenities (pool, spa, gym, restaurant, business centre)',
  moduleSlug: 'room_inventory',
  items: [
    {
      name: 'Swimming Pool',
      description: 'Outdoor pool open 6am–10pm; heated in winter',
      category: 'amenities',
      currency: 'INR',
      images: [],
      fields: {
        amenities: ['Pool'],
        floor_number: 0,
        is_smoking: false,
      },
      sortOrder: 1,
      isActive: true,
    },
    {
      name: 'Fitness Centre',
      description: 'Cardio + strength equipment; 24h access for in-house guests',
      category: 'amenities',
      currency: 'INR',
      images: [],
      fields: {
        amenities: ['Gym'],
        floor_number: 1,
        is_smoking: false,
      },
      sortOrder: 2,
      isActive: true,
    },
    {
      name: 'Spa & Wellness',
      description: 'Full-service spa with massage, facials, and sauna',
      category: 'amenities',
      currency: 'INR',
      images: [],
      fields: {
        amenities: ['Spa'],
        floor_number: 1,
        is_smoking: false,
      },
      sortOrder: 3,
      isActive: true,
    },
    {
      name: 'In-house Restaurant',
      description: 'Multi-cuisine dining open 7am–11pm',
      category: 'amenities',
      currency: 'INR',
      images: [],
      fields: {
        amenities: ['Restaurant'],
        floor_number: 1,
        is_smoking: false,
      },
      sortOrder: 4,
      isActive: true,
    },
    {
      name: 'Business Centre',
      description: 'Meeting rooms, printing, and video-conference facilities',
      category: 'amenities',
      currency: 'INR',
      images: [],
      fields: {
        amenities: ['Workspace'],
        floor_number: 2,
        is_smoking: false,
      },
      sortOrder: 5,
      isActive: true,
    },
  ],
};

// ── HOUSE RULES — 5 items ────────────────────────────────────────────

export const HOUSE_RULES_SEED: SeedTemplate = {
  id: 'booking.house_rules',
  label: 'Sample house rules',
  description: '5 standard policies (check-in/out times, pets, smoking, quiet hours, cancellation)',
  moduleSlug: 'room_inventory',
  items: [
    {
      name: 'Check-in from 2 PM',
      description: 'Early check-in subject to availability. Late check-in (after 11 PM) requires advance notice.',
      category: 'house_rules',
      currency: 'INR',
      images: [],
      fields: { check_in_time: '14:00', check_out_time: '11:00' },
      sortOrder: 1,
      isActive: true,
    },
    {
      name: 'No smoking indoors',
      description: 'Smoking is prohibited in all rooms and common areas. Designated smoking zones are available outdoors.',
      category: 'house_rules',
      currency: 'INR',
      images: [],
      fields: { is_smoking: false },
      sortOrder: 2,
      isActive: true,
    },
    {
      name: 'Pets not allowed',
      description: 'Pets are not permitted, with the exception of registered service animals.',
      category: 'house_rules',
      currency: 'INR',
      images: [],
      fields: {},
      sortOrder: 3,
      isActive: true,
    },
    {
      name: 'Quiet hours 10 PM–7 AM',
      description: 'Please keep noise to a minimum during quiet hours to respect other guests.',
      category: 'house_rules',
      currency: 'INR',
      images: [],
      fields: {},
      sortOrder: 4,
      isActive: true,
    },
    {
      name: 'Free cancellation up to 48h',
      description: 'Cancel up to 48 hours before check-in for a full refund. After that, the first night is charged.',
      category: 'house_rules',
      currency: 'INR',
      images: [],
      fields: {},
      sortOrder: 5,
      isActive: true,
    },
  ],
};

// ── LOCAL EXPERIENCES — 5 items ──────────────────────────────────────

export const LOCAL_EXPERIENCES_SEED: SeedTemplate = {
  id: 'booking.local_experiences',
  label: 'Sample local experiences',
  description: '5 nearby activities (heritage tour, cooking class, nature trail, beach day, spa package)',
  moduleSlug: 'room_inventory',
  items: [
    {
      name: 'Old City Heritage Walk',
      description: 'Guided 3-hour walking tour through the historic quarter',
      category: 'local_experiences',
      price: 1200,
      currency: 'INR',
      images: [],
      fields: { max_occupancy: 10 },
      sortOrder: 1,
      isActive: true,
    },
    {
      name: 'Regional Cooking Class',
      description: '90-minute hands-on class with a local chef, ingredients included',
      category: 'local_experiences',
      price: 1800,
      currency: 'INR',
      images: [],
      fields: { max_occupancy: 8 },
      sortOrder: 2,
      isActive: true,
    },
    {
      name: 'Nature Trail & Bird-watching',
      description: 'Morning trek with naturalist, binoculars provided',
      category: 'local_experiences',
      price: 900,
      currency: 'INR',
      images: [],
      fields: { max_occupancy: 12 },
      sortOrder: 3,
      isActive: true,
    },
    {
      name: 'Beach Day Package',
      description: 'Transfer + loungers + lunch at a nearby beach',
      category: 'local_experiences',
      price: 2500,
      currency: 'INR',
      images: [],
      fields: { max_occupancy: 4 },
      sortOrder: 4,
      isActive: true,
    },
    {
      name: 'Spa & Wellness Half-day',
      description: '3-hour spa journey with two treatments of your choice',
      category: 'local_experiences',
      price: 4500,
      currency: 'INR',
      images: [],
      fields: { max_occupancy: 2 },
      sortOrder: 5,
      isActive: true,
    },
  ],
};

// ── MEAL PLANS — 5 items ─────────────────────────────────────────────

export const MEAL_PLANS_SEED: SeedTemplate = {
  id: 'booking.meal_plans',
  label: 'Sample meal plans',
  description: '5 standard plans (room-only, B&B, half-board, full-board, all-inclusive)',
  moduleSlug: 'room_inventory',
  items: [
    {
      name: 'Room Only',
      description: 'No meals included',
      category: 'meal_plans',
      price: 0,
      currency: 'INR',
      images: [],
      fields: {},
      sortOrder: 1,
      isActive: true,
    },
    {
      name: 'Bed & Breakfast',
      description: 'Buffet breakfast included each morning',
      category: 'meal_plans',
      price: 600,
      currency: 'INR',
      images: [],
      fields: {},
      sortOrder: 2,
      isActive: true,
    },
    {
      name: 'Half Board',
      description: 'Breakfast + dinner (beverages excluded)',
      category: 'meal_plans',
      price: 1400,
      currency: 'INR',
      images: [],
      fields: {},
      sortOrder: 3,
      isActive: true,
    },
    {
      name: 'Full Board',
      description: 'Breakfast + lunch + dinner (beverages excluded)',
      category: 'meal_plans',
      price: 2200,
      currency: 'INR',
      images: [],
      fields: {},
      sortOrder: 4,
      isActive: true,
    },
    {
      name: 'All-inclusive',
      description: 'All meals + soft drinks + house beverages',
      category: 'meal_plans',
      price: 3500,
      currency: 'INR',
      images: [],
      fields: {},
      sortOrder: 5,
      isActive: true,
    },
  ],
};

// ── Registry ─────────────────────────────────────────────────────────

export const BOOKING_SEED_TEMPLATES: Readonly<Record<string, SeedTemplate>> = {
  [ROOMS_SEED.id]: ROOMS_SEED,
  [AMENITIES_SEED.id]: AMENITIES_SEED,
  [HOUSE_RULES_SEED.id]: HOUSE_RULES_SEED,
  [LOCAL_EXPERIENCES_SEED.id]: LOCAL_EXPERIENCES_SEED,
  [MEAL_PLANS_SEED.id]: MEAL_PLANS_SEED,
};

export function getSeedTemplate(id: string): SeedTemplate | undefined {
  return BOOKING_SEED_TEMPLATES[id];
}

export function listSeedTemplates(): SeedTemplate[] {
  return Object.values(BOOKING_SEED_TEMPLATES);
}
