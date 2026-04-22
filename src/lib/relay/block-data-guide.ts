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
