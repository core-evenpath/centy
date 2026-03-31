# Phase 2: Relay UI Primitives — Complete

## File Created
- `src/components/relay/primitives.tsx`

## Exported Components (12)
1. **IconBox** — Lucide icon in a rounded box (`IconBoxProps`)
2. **BotAvatar** — Circle with Radio icon in accent color (`BotAvatarProps`)
3. **UserBubble** — Right-aligned user message bubble (`UserBubbleProps`)
4. **BotBubble** — Left-aligned bot message with avatar (`BotBubbleProps`)
5. **SuggestionPills** — Horizontal wrap of pill buttons (`SuggestionPillsProps`)
6. **Divider** — Horizontal line with centered label (`DividerProps`)
7. **Nudge** — Action prompt bar with variant styles (`NudgeProps`)
8. **ModuleBar** — Sticky scrollable module navigation (`ModuleBarProps`, `ModuleBarItem`)
9. **StageIndicator** — Conversation stage pill (`StageIndicatorProps`)
10. **TypingIndicator** — Animated typing dots (`TypingIndicatorProps`)
11. **ChatHeader** — Top bar with brand + stage (`ChatHeaderProps`)
12. **ChatInputBar** — Bottom input with send button (`ChatInputBarProps`)

## Exported Constants
- `RELAY_KEYFRAMES` — CSS keyframes string for relay-pulse animation

## Patterns
- All inline styles, no Tailwind/CSS modules
- No emojis — all visual indicators use lucide-react icons
- Imports RelayTheme from `@/components/relay/blocks/types`
- Hover states managed with useState where needed
