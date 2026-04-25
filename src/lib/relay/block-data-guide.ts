// ── Block Data Guide ─────────────────────────────────────────────────
//
// Per-functionId checklist of data sections the partner needs to populate
// before the Relay blocks can render real content. For now we hand-curate
// one guide per taxonomy function; eventually this can be derived from the
// block registry + data contracts.
//
// Shape:
//   - one FunctionDataGuide per functionId
//   - each guide has N DataSection rows
//   - each DataSection names a human-friendly data bucket and which blocks
//     consume it, plus (when applicable) the partner route that edits
//     that bucket

export interface BlockRef {
    id: string;
    label: string;
}

export type DataSectionStatus = 'required' | 'optional' | 'design_only';

export interface DataSection {
    id: string;
    name: string;
    description: string;
    howTo?: string;
    blocks: BlockRef[];
    /** Partner module slug backing this section (e.g. 'food_menu'). */
    moduleSlug?: string;
    /** Deep link to the editor. Omit when status is 'design_only'. */
    route?: string;
    ctaLabel?: string;
    status: DataSectionStatus;
}

export interface FunctionDataGuide {
    functionId: string;
    functionName: string;
    /** Hint for the bento tiles that drive this guide. */
    primaryModuleSlug?: string;
    sections: DataSection[];
}

// PR fix-21: removed `beverageCafeGuide` curated entry. Its sections
// referenced the stale `food_menu` slug which no longer exists in the
// vertical-prefixed schema set (the actual slug is `food_beverage_menu`).
// The mismatch made every section silently render empty + collide with
// the auto-derived guide. Auto-derive (mergeGuideWithRegistry +
// buildGuideFromBlocks) now owns every functionId, no exceptions.

const GUIDES: Record<string, FunctionDataGuide> = {};

export function getDataGuideForFunction(
    functionId: string | undefined | null,
): FunctionDataGuide | null {
    if (!functionId) return null;
    return GUIDES[functionId] ?? null;
}

export function getSectionForBlock(
    guide: FunctionDataGuide,
    blockId: string,
): DataSection | null {
    return guide.sections.find((s) => s.blocks.some((b) => b.id === blockId)) ?? null;
}

// ── Registry-derived fallback guide ──────────────────────────────────
//
// For taxonomies we haven't hand-curated yet (everything except
// beverage_cafe today) we derive a guide straight from the block
// registry: group blocks by `module` slug → one section per module,
// with blocks listed underneath. Blocks without a backing module slot
// into a "design_only" section so the partner still sees them in the
// checklist.
//
// The result is deliberately lower-fidelity than the curated guides
// (generic description, no howTo), but it makes the "Data you need to
// upload" panel useful for *every* block, not just beverage_cafe.

export interface RegistryBlockInfo {
    id: string;
    label: string;
    module: string | null;
    desc?: string;
}

function humanizeSlug(slug: string): string {
    return slug
        .split('_')
        .filter(Boolean)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' ');
}

export function buildGuideFromBlocks(
    functionId: string,
    functionName: string,
    blocks: RegistryBlockInfo[],
): FunctionDataGuide {
    const byModule = new Map<string, RegistryBlockInfo[]>();
    const designOnly: RegistryBlockInfo[] = [];

    for (const b of blocks) {
        if (b.module) {
            const arr = byModule.get(b.module) ?? [];
            arr.push(b);
            byModule.set(b.module, arr);
        } else {
            designOnly.push(b);
        }
    }

    const sections: DataSection[] = [];

    for (const [moduleSlug, moduleBlocks] of byModule.entries()) {
        const name = humanizeSlug(moduleSlug);
        sections.push({
            id: moduleSlug,
            name,
            description: `Backs ${moduleBlocks.length} block${
                moduleBlocks.length === 1 ? '' : 's'
            } in your chat. Add items here and they'll show up automatically.`,
            howTo:
                'Open the module editor, add entries manually or import a CSV, and every block that reads from this module will pick them up.',
            blocks: moduleBlocks.map((b) => ({ id: b.id, label: b.label })),
            moduleSlug,
            route: `/partner/relay/data/${moduleSlug}`,
            ctaLabel: 'Open module editor',
            status: 'required',
        });
    }

    if (designOnly.length > 0) {
        sections.push({
            id: 'design_only',
            name: 'Preview-only blocks',
            description:
                "These blocks ship with built-in visuals and don't need partner data yet. They'll render with design samples in Test Chat.",
            blocks: designOnly.map((b) => ({ id: b.id, label: b.label })),
            status: 'design_only',
        });
    }

    return {
        functionId,
        functionName,
        sections,
    };
}

// Merge the curated guide (if any) with a registry-derived fallback so
// blocks added to a vertical after the guide was written still show up.
// Curated sections win when they collide by `moduleSlug`.
export function mergeGuideWithRegistry(
    curated: FunctionDataGuide | null,
    registry: FunctionDataGuide,
): FunctionDataGuide {
    if (!curated) return registry;
    const curatedSlugs = new Set(
        curated.sections.map((s) => s.moduleSlug).filter((s): s is string => !!s),
    );
    const extras = registry.sections.filter(
        (s) => s.moduleSlug && !curatedSlugs.has(s.moduleSlug),
    );
    return {
        ...curated,
        sections: [...curated.sections, ...extras],
    };
}
