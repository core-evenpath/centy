// Process-local Health cache (M07).
//
// Not a Server Action module on purpose — Next.js `'use server'` files
// require every export to be an async function, but this cache is
// in-memory and exposes synchronous accessors. Callers in the Server
// Actions file (`src/actions/relay-health-actions.ts`) import from here.

import type { EngineHealthDoc } from './health';
import type { Engine } from './engine-types';

const CACHE_TTL_MS = 30_000;

interface CacheEntry {
  doc: EngineHealthDoc;
  loadedAt: number;
}

const cache = new Map<string, CacheEntry>();

function cacheKey(partnerId: string, engine: Engine): string {
  return `${partnerId}_${engine}`;
}

export function getCachedHealth(
  partnerId: string,
  engine: Engine,
  now: number = Date.now(),
): EngineHealthDoc | null {
  const hit = cache.get(cacheKey(partnerId, engine));
  if (!hit) return null;
  if (now - hit.loadedAt >= CACHE_TTL_MS) return null;
  return hit.doc;
}

export function setCachedHealth(
  partnerId: string,
  engine: Engine,
  doc: EngineHealthDoc,
  now: number = Date.now(),
): void {
  cache.set(cacheKey(partnerId, engine), { doc, loadedAt: now });
}

export function invalidateHealthCache(
  partnerId: string,
  engine?: Engine,
): void {
  if (engine) {
    cache.delete(cacheKey(partnerId, engine));
  } else {
    for (const key of Array.from(cache.keys())) {
      if (key.startsWith(`${partnerId}_`)) cache.delete(key);
    }
  }
}
