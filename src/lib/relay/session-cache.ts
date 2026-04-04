import type {
  RelaySessionData,
  SessionModuleItem,
  SessionBrand,
  SessionContact,
  SessionFlowDefinition,
  SessionBlockOverride,
} from './types';

const DEFAULT_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

export interface SearchResult {
  item: SessionModuleItem;
  score: number;
}

export interface FilterOptions {
  category?: string;
  priceMin?: number;
  priceMax?: number;
  tags?: string[];
  limit?: number;
}

export class RelaySessionCache {
  private data: RelaySessionData;
  private moduleIndex: Map<string, SessionModuleItem[]>;
  private itemIndex: Map<string, SessionModuleItem>;
  private categoriesCache: string[] | null = null;

  constructor(data: RelaySessionData) {
    this.data = data;
    this.moduleIndex = new Map();
    this.itemIndex = new Map();

    for (const item of data.items) {
      // Module index
      const slug = item.moduleSlug;
      if (!this.moduleIndex.has(slug)) {
        this.moduleIndex.set(slug, []);
      }
      this.moduleIndex.get(slug)!.push(item);

      // Item index (by id)
      this.itemIndex.set(item.id, item);
    }
  }

  getItems(): SessionModuleItem[] {
    return this.data.items;
  }

  getItem(id: string): SessionModuleItem | undefined {
    return this.itemIndex.get(id);
  }

  getItemCount(): number {
    return this.data.items.length;
  }

  getCategories(): string[] {
    if (this.categoriesCache) return this.categoriesCache;
    const cats = new Set<string>();
    for (const item of this.data.items) {
      if (item.moduleSlug) cats.add(item.moduleSlug);
      const rawCat = item.raw?.category;
      if (typeof rawCat === 'string' && rawCat) cats.add(rawCat);
    }
    this.categoriesCache = Array.from(cats);
    return this.categoriesCache;
  }

  hasRag(): boolean {
    return this.data.items.length > 0;
  }

  filterItems(opts?: FilterOptions): SessionModuleItem[] {
    let result = this.data.items;

    if (opts?.category) {
      const cat = opts.category.toLowerCase();
      result = result.filter(
        (item) =>
          item.moduleSlug.toLowerCase() === cat ||
          (typeof item.raw?.category === 'string' &&
            item.raw.category.toLowerCase() === cat)
      );
    }

    if (opts?.tags && opts.tags.length > 0) {
      const tagSet = new Set(opts.tags.map((t) => t.toLowerCase()));
      result = result.filter((item) =>
        item.tags?.some((t) => tagSet.has(t.toLowerCase()))
      );
    }

    if (opts?.priceMin !== undefined && opts.priceMin !== null) {
      const min = opts.priceMin;
      result = result.filter((item) => item.price !== undefined && item.price >= min);
    }

    if (opts?.priceMax !== undefined && opts.priceMax !== null) {
      const max = opts.priceMax;
      result = result.filter((item) => item.price !== undefined && item.price <= max);
    }

    if (opts?.limit && opts.limit > 0) {
      result = result.slice(0, opts.limit);
    }

    return result;
  }

  searchItems(query: string, limit?: number): SearchResult[] {
    if (!query.trim()) {
      const results = this.data.items.map((item) => ({ item, score: 1 }));
      return limit ? results.slice(0, limit) : results;
    }

    const lower = query.toLowerCase();
    const terms = lower.split(/\s+/).filter((t) => t.length > 1);
    const results: SearchResult[] = [];

    for (const item of this.data.items) {
      let score = 0;
      const nameLower = item.name.toLowerCase();
      const descLower = item.description?.toLowerCase() || '';

      // Exact name match
      if (nameLower === lower) {
        score += 10;
      } else if (nameLower.includes(lower)) {
        score += 5;
      }

      // Term-level matching
      for (const term of terms) {
        if (nameLower.includes(term)) score += 3;
        if (descLower.includes(term)) score += 2;
        if (item.tags?.some((t) => t.toLowerCase().includes(term))) score += 2;
      }

      if (score > 0) {
        results.push({ item, score });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return limit ? results.slice(0, limit) : results;
  }

  getBrand(): SessionBrand {
    return this.data.brand;
  }

  getContact(): SessionContact {
    return this.data.contact;
  }

  getCategory(): string {
    return this.data.category;
  }

  getFlow(): SessionFlowDefinition | undefined {
    return this.data.flow;
  }

  getBlockOverrides(): SessionBlockOverride[] {
    return this.data.blockOverrides;
  }

  getVisibleBlockIds(): string[] {
    return this.data.blockOverrides
      .filter((o) => o.isVisible)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((o) => o.blockId);
  }

  isStale(maxAgeMs: number = DEFAULT_MAX_AGE_MS): boolean {
    return Date.now() - this.data.cachedAt > maxAgeMs;
  }

  getData(): RelaySessionData {
    return this.data;
  }
}
