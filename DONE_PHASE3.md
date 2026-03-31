# Phase 3: BentoGrid Welcome Screen — Complete

## File Created
- `src/components/relay/RelayBentoGrid.tsx`

## Component
- `RelayBentoGrid` (default export) — dynamic welcome screen for Relay chat frame

## Props (`RelayBentoGridProps`)
- `brand` — name + tagline
- `modules` — array of module entries (id, slug, name, description, iconName, blockType, itemCount, category)
- `contact` — optional phone/email/website/whatsapp
- `usp` — optional string array
- `hasRag` — whether partner has RAG knowledge base
- `theme` — RelayTheme
- `onModuleClick(moduleSlug)` — callback when module card clicked
- `onAsk()` — callback to open chat/ask input

## Bento Item Generation Logic

**2+ modules path:**
1. "What we offer" (large, full width) — overview with module count
2. First Products-category module (medium)
3. First Services-category module (medium)
4. "Contact" (small) — if contact data exists
5. "Quick answers" (small) — if hasRag
6. Up to 3 remaining modules (small)

**< 2 modules path:**
1. Brand welcome (large, full width)
2. "Ask anything" (medium)
3. "Contact us" (medium) — if contact data exists
4. Single module card if one exists

## Layout
- Brand header with Radio icon + name + tagline
- CSS grid (2 columns, 8px gap), first item spans full width
- Bottom "Ask about {name}..." input bar with Sparkles icon

## Icon Resolution
- String-to-LucideIcon map (ICON_MAP) with 30 icons
- Fallback to `Layers` for unknown icon names
