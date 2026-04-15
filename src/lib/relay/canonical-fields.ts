/**
 * Canonical Fields Metadata
 *
 * Humanized metadata for every canonical field id that can appear in
 * the Data Map pane on /partner/relay/blocks. Keeps labels, groupings,
 * and required-ness in one place so the UI doesn't have to derive them
 * from scattered block contracts.
 *
 * A canonical id ("business.phone", "products.items") is the shared
 * vocabulary between block contracts and partner data bindings. This
 * file gives each id a face for the UI.
 */

export type CanonicalFieldKind = 'scalar' | 'collection';

export interface CanonicalFieldMeta {
  id: string;
  label: string;
  group: string;
  kind: CanonicalFieldKind;
  // If any block declares this field as required, the Data Map row
  // shows a warning when the binding is missing.
  required: boolean;
  // Short description shown in the Data Map row + binding editor.
  description?: string;
}

// Explicit registry for the canonical ids in use today. Anything not
// listed falls through to `inferMeta()` so new ids introduced by
// contracts still render sensibly.
const REGISTRY: CanonicalFieldMeta[] = [
  {
    id: 'business.name',
    label: 'Business name',
    group: 'Business profile',
    kind: 'scalar',
    required: true,
    description: 'Your brand name, shown in greetings and contact blocks.',
  },
  {
    id: 'business.tagline',
    label: 'Tagline',
    group: 'Business profile',
    kind: 'scalar',
    required: false,
    description: 'A short line about what you do.',
  },
  {
    id: 'business.phone',
    label: 'Phone',
    group: 'Business profile',
    kind: 'scalar',
    required: false,
    description: 'Primary phone number for visitors to reach you.',
  },
  {
    id: 'business.email',
    label: 'Email',
    group: 'Business profile',
    kind: 'scalar',
    required: false,
    description: 'Primary email address.',
  },
  {
    id: 'business.whatsapp',
    label: 'WhatsApp',
    group: 'Business profile',
    kind: 'scalar',
    required: false,
  },
  {
    id: 'business.website',
    label: 'Website',
    group: 'Business profile',
    kind: 'scalar',
    required: false,
  },
  {
    id: 'welcome.message',
    label: 'Welcome message',
    group: 'Business profile',
    kind: 'scalar',
    required: false,
    description: 'Optional override for the greeting block.',
  },
  {
    id: 'products.items',
    label: 'Product catalog',
    group: 'Catalogs',
    kind: 'collection',
    required: true,
    description: 'Feeds product cards, comparisons, and detail views.',
  },
  {
    id: 'menu.items',
    label: 'Menu',
    group: 'Catalogs',
    kind: 'collection',
    required: true,
    description: 'Dishes, prices, and categories for F&B partners.',
  },
  {
    id: 'services.items',
    label: 'Services',
    group: 'Catalogs',
    kind: 'collection',
    required: true,
    description: 'Services with duration and pricing.',
  },
];

const BY_ID = new Map(REGISTRY.map(m => [m.id, m]));

// Fallback: infer label/group/kind from the id shape.
//   "business.foo" → {label: "Foo", group: "Business profile", kind: scalar}
//   "widget.items" → {label: "Widget", group: "Catalogs", kind: collection}
function inferMeta(id: string): CanonicalFieldMeta {
  const [ns, rest = ''] = id.split('.', 2);
  const isCollection = rest === 'items';
  const label = isCollection
    ? ns.charAt(0).toUpperCase() + ns.slice(1)
    : rest
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, c => c.toUpperCase());
  const group = ns === 'business'
    ? 'Business profile'
    : isCollection
      ? 'Catalogs'
      : 'Other';
  return {
    id,
    label,
    group,
    kind: isCollection ? 'collection' : 'scalar',
    required: false,
  };
}

export function getCanonicalFieldMeta(id: string): CanonicalFieldMeta {
  return BY_ID.get(id) ?? inferMeta(id);
}

// Group a list of canonical ids by their `group` field, preserving a
// stable display order: Business profile → Catalogs → anything else.
const GROUP_ORDER = ['Business profile', 'Catalogs', 'Other'];

export function groupCanonicalIds(
  ids: string[],
): Array<{ group: string; fields: CanonicalFieldMeta[] }> {
  const buckets = new Map<string, CanonicalFieldMeta[]>();
  for (const id of ids) {
    const meta = getCanonicalFieldMeta(id);
    const arr = buckets.get(meta.group) ?? [];
    arr.push(meta);
    buckets.set(meta.group, arr);
  }
  const groups: Array<{ group: string; fields: CanonicalFieldMeta[] }> = [];
  for (const name of GROUP_ORDER) {
    const fields = buckets.get(name);
    if (fields && fields.length > 0) {
      groups.push({ group: name, fields: fields.sort((a, b) => a.label.localeCompare(b.label)) });
      buckets.delete(name);
    }
  }
  // Any remaining custom groups, alphabetical.
  for (const [name, fields] of Array.from(buckets.entries()).sort()) {
    groups.push({ group: name, fields: fields.sort((a, b) => a.label.localeCompare(b.label)) });
  }
  return groups;
}
