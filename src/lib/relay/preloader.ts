import { RelaySessionCache } from './session-cache';
import { getPreloadableBlocks, getBlock } from './registry';
import { DEFAULT_THEME } from './types';
import type { BlockDefinition, BlockTheme, RelaySessionData } from './types';

// ── Types ─────────────────────────────────────────────────────────────

export interface PreloadedBlock {
  blockId: string;
  definition: BlockDefinition;
  data: Record<string, any>;
  theme: BlockTheme;
}

// ── Build session cache ───────────────────────────────────────────────

export function buildRelaySession(data: RelaySessionData): RelaySessionCache {
  return new RelaySessionCache(data);
}

// ── Pre-resolve preloadable blocks ────────────────────────────────────

export function resolvePreloadData(cache: RelaySessionCache): PreloadedBlock[] {
  const category = cache.getCategory();
  const preloadable = getPreloadableBlocks(category);
  const results: PreloadedBlock[] = [];

  // Build a theme from partner brand, falling back to DEFAULT_THEME
  const brand = cache.getBrand();
  const theme: BlockTheme = {
    ...DEFAULT_THEME,
    accent: brand.accentColor || DEFAULT_THEME.accent,
  };

  for (const definition of preloadable) {
    const entry = getBlock(definition.id);
    if (!entry) continue;

    const contract = definition.dataContract;
    const data: Record<string, any> = {};

    // Map required fields from cache items
    const items = cache.getItems();
    for (const field of contract.required) {
      const value = resolveFieldFromItems(items, field.field);
      if (value !== undefined) {
        data[field.field] = value;
      }
    }

    // Map optional fields from cache items
    for (const field of contract.optional) {
      const value = resolveFieldFromItems(items, field.field);
      if (value !== undefined) {
        data[field.field] = value;
      }
    }

    // Also pull contact info for support blocks
    if (definition.family === 'support') {
      const contact = cache.getContact();
      if (contact.whatsapp) data.whatsapp = contact.whatsapp;
      if (contact.phone) data.phone = contact.phone;
      if (contact.email) data.email = contact.email;
    }

    // Fall back to sample data for any missing required fields
    for (const field of contract.required) {
      if (data[field.field] === undefined && definition.sampleData[field.field] !== undefined) {
        data[field.field] = definition.sampleData[field.field];
      }
    }

    results.push({
      blockId: definition.id,
      definition,
      data,
      theme,
    });
  }

  return results;
}

// ── Helpers ───────────────────────────────────────────────────────────

function resolveFieldFromItems(
  items: { raw: Record<string, any> }[],
  fieldName: string
): any {
  // Check the first item that has this field
  for (const item of items) {
    if (item.raw[fieldName] !== undefined) {
      return item.raw[fieldName];
    }
  }
  return undefined;
}
