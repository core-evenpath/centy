import type {
  BlockDefinition,
  BlockRegistryEntry,
  BlockComponentProps,
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

/**
 * @deprecated Use getGlobalBlockConfigs() from block-config-service for listing.
 * Kept for server actions that need rich BlockDefinition data (dataContract, sampleData).
 */
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
