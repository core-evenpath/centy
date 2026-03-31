# Phase 4: RelayFullPage Rewrite — Complete

## File Modified
- `src/components/relay/RelayFullPage.tsx` (full rewrite)

## View States
- **bento** (default) — renders RelayBentoGrid with storefront data, loading spinner while fetching
- **chat** — full conversational UI with ChatHeader, ModuleBar, message list, ChatInputBar

## State Management
- `view` — 'bento' | 'chat'
- `messages` — ChatMessage[] with id, role, content, block, type, divider
- `storefrontData` — fetched on mount via getRelayStorefrontDataAction
- `stage` — current conversation stage (greeting, discovery, presentation, action, handoff)
- `activeModule` — currently selected module slug
- `sending` — API call in progress

## Message Flow
```
BentoGrid click → enterChat(moduleSlug)
  ├─ moduleSlug set → auto-sends "Show me {name}" → API
  └─ null → shows welcome message with suggestions

ModuleBar pill click → handleModuleSwitch
  → inserts Divider + "Show me {label}" → API

ChatInputBar send → handleSend
  → appends user message → API

API response → appends bot message with block
  → updates stage from response type
```

## Transitions
- Bento → Chat: module click or ask input
- Chat → Bento: Home button in ModuleBar (reset)

## Props (unchanged)
- `partnerId: string`
- `config: RelayConfig`
