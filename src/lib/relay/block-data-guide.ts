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

const beverageCafeGuide: FunctionDataGuide = {
    functionId: 'beverage_cafe',
    functionName: 'Beverage-Focused (Cafe, Tea, Juice)',
    primaryModuleSlug: 'food_menu',
    sections: [
        {
            id: 'food_menu',
            name: 'Drink & Food Menu',
            description:
                'Your core catalog: drinks, food items, prices, and descriptions. This feeds the Menu Item Card, Drink Menu, and Daily Specials blocks.',
            howTo:
                'Add items manually, import a CSV, or let AI Auto-fill pull from your website. Each item needs at minimum a name and price.',
            blocks: [
                { id: 'menu_item', label: 'Menu Item Card' },
                { id: 'drink_menu', label: 'Drink Menu' },
                { id: 'daily_specials', label: 'Daily Specials' },
            ],
            moduleSlug: 'food_menu',
            route: '/partner/relay/modules/food_menu',
            ctaLabel: 'Open menu editor',
            status: 'required',
        },
        {
            id: 'menu_categories',
            name: 'Menu Categories',
            description:
                'Group menu items into categories (Coffee, Tea, Juice, Pastries). Categories render the Category Browser block.',
            howTo:
                'In the menu editor, assign each item to a category. Categories appear automatically once items are tagged.',
            blocks: [{ id: 'category_browser', label: 'Category Browser' }],
            moduleSlug: 'food_menu',
            route: '/partner/relay/modules/food_menu',
            ctaLabel: 'Set categories',
            status: 'optional',
        },
        {
            id: 'dietary_tags',
            name: 'Dietary Tags',
            description:
                'Vegan, vegetarian, gluten-free, and allergen flags on each menu item. Drives the Dietary Filter block.',
            howTo:
                'Toggle is_veg, is_vegan, and allergen fields on each item. The filter block picks up whichever tags you use.',
            blocks: [{ id: 'dietary_filter', label: 'Dietary Filter' }],
            moduleSlug: 'food_menu',
            route: '/partner/relay/modules/food_menu',
            ctaLabel: 'Tag items',
            status: 'optional',
        },
        {
            id: 'nutrition',
            name: 'Nutrition Info',
            description:
                'Calories, serving size, allergens per item. Drives the Nutrition Info block.',
            howTo:
                'Fill calories, serving_size, and allergens on the items you want nutrition details for.',
            blocks: [{ id: 'nutrition', label: 'Nutrition Info' }],
            moduleSlug: 'food_menu',
            route: '/partner/relay/modules/food_menu',
            ctaLabel: 'Add nutrition fields',
            status: 'optional',
        },
        {
            id: 'order_customizer',
            name: 'Order Options',
            description:
                'Sizes, modifiers, and add-ons for ordering. No data model yet — the block shows a design preview.',
            blocks: [{ id: 'order_customizer', label: 'Order Customizer' }],
            status: 'design_only',
        },
        {
            id: 'diner_reviews',
            name: 'Diner Reviews',
            description:
                'Customer reviews and ratings. No data model yet — the block shows a design preview.',
            blocks: [{ id: 'diner_review', label: 'Diner Reviews' }],
            status: 'design_only',
        },
    ],
};

const GUIDES: Record<string, FunctionDataGuide> = {
    beverage_cafe: beverageCafeGuide,
};

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
            route: `/partner/relay/modules/${moduleSlug}`,
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
