import type {
  BlockDefinition,
  BlockRegistryEntry,
  BlockComponentProps,
  BlockMatch,
  DataContract,
  FieldSpec,
} from './types';

const registry = new Map<string, BlockRegistryEntry>();

export function registerBlock(
  definition: BlockDefinition,
  component: React.ComponentType<BlockComponentProps>
): void {
  if (registry.has(definition.id)) {
    console.warn(`Block "${definition.id}" already registered. Overwriting.`);
  }
  registry.set(definition.id, { definition, component });
}

export function getBlock(blockId: string): BlockRegistryEntry | undefined {
  return registry.get(blockId);
}

export function listBlocks(filters?: {
  family?: string;
  category?: string;
  preloadable?: boolean;
}): BlockDefinition[] {
  const defs: BlockDefinition[] = [];
  registry.forEach((entry) => {
    const d = entry.definition;
    if (filters?.family && d.family !== filters.family) return;
    if (filters?.category && !d.applicableCategories.includes(filters.category)) return;
    if (filters?.preloadable !== undefined && d.preloadable !== filters.preloadable) return;
    defs.push(d);
  });
  return defs;
}

export function getBlocksByFamily(family: string): BlockDefinition[] {
  return listBlocks({ family });
}

export function getBlocksForCategory(categoryId: string): BlockDefinition[] {
  return listBlocks({ category: categoryId });
}

export function matchBlocksToIntent(
  message: string,
  availableBlockIds: string[]
): BlockMatch[] {
  const matches: BlockMatch[] = [];
  const lower = message.toLowerCase();

  for (const blockId of availableBlockIds) {
    const entry = registry.get(blockId);
    if (!entry) continue;
    const triggers = entry.definition.intentTriggers;

    for (const kw of triggers.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        matches.push({ blockId, confidence: 0.8, matchedBy: 'keyword' });
        break;
      }
    }

    if (!matches.find((m) => m.blockId === blockId)) {
      for (const pattern of triggers.queryPatterns) {
        const regex = new RegExp(
          pattern.replace(/\*/g, '.*').replace(/\?/g, '.'),
          'i'
        );
        if (regex.test(message)) {
          matches.push({ blockId, confidence: 0.7, matchedBy: 'pattern' });
          break;
        }
      }
    }
  }

  matches.sort((a, b) => b.confidence - a.confidence);
  return matches;
}

export function computeDataContract(blockIds: string[]): DataContract {
  const requiredMap = new Map<string, FieldSpec>();
  const optionalMap = new Map<string, FieldSpec>();

  for (const id of blockIds) {
    const entry = registry.get(id);
    if (!entry) continue;
    const contract = entry.definition.dataContract;

    for (const f of contract.required) {
      requiredMap.set(f.field, f);
    }
    for (const f of contract.optional) {
      if (!requiredMap.has(f.field)) {
        optionalMap.set(f.field, f);
      }
    }
  }

  return {
    required: Array.from(requiredMap.values()),
    optional: Array.from(optionalMap.values()),
  };
}

export function getPreloadableBlocks(categoryId?: string): BlockDefinition[] {
  return listBlocks({ category: categoryId, preloadable: true });
}

export function getRegistrySize(): number {
  return registry.size;
}

export function clearRegistry(): void {
  registry.clear();
}
