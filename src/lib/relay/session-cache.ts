import type {
  RelaySessionData,
  SessionModuleItem,
  SessionBrand,
  SessionContact,
  SessionFlowDefinition,
  SessionBlockOverride,
} from './types';

const DEFAULT_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

export class RelaySessionCache {
  private data: RelaySessionData;
  private moduleIndex: Map<string, SessionModuleItem[]>;

  constructor(data: RelaySessionData) {
    this.data = data;
    this.moduleIndex = new Map();

    for (const item of data.items) {
      const slug = item.moduleSlug;
      if (!this.moduleIndex.has(slug)) {
        this.moduleIndex.set(slug, []);
      }
      this.moduleIndex.get(slug)!.push(item);
    }
  }

  getItems(): SessionModuleItem[] {
    return this.data.items;
  }

  filterItems(moduleSlug?: string, tags?: string[]): SessionModuleItem[] {
    let result = this.data.items;

    if (moduleSlug) {
      result = this.moduleIndex.get(moduleSlug) || [];
    }

    if (tags && tags.length > 0) {
      const tagSet = new Set(tags.map((t) => t.toLowerCase()));
      result = result.filter((item) =>
        item.tags?.some((t) => tagSet.has(t.toLowerCase()))
      );
    }

    return result;
  }

  searchItems(query: string): SessionModuleItem[] {
    if (!query.trim()) return this.data.items;

    const lower = query.toLowerCase();
    return this.data.items.filter((item) => {
      if (item.name.toLowerCase().includes(lower)) return true;
      if (item.description?.toLowerCase().includes(lower)) return true;
      if (item.tags?.some((t) => t.toLowerCase().includes(lower))) return true;
      return false;
    });
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
