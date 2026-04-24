// ── Legacy slug aliases ─────────────────────────────────────────────
//
// Remaining from the Relay-schema-separation rollout: partner-side
// `businessModules` docs created before PR E3 may still carry
// `moduleSlug: 'moduleItems'` (pre-rename). The Relay-aware
// `getSystemModuleAction` normalises those inputs via this map so
// reads still succeed without requiring a data backfill.
//
// Removed in a follow-up once partner data is confirmed migrated
// (or we accept that legacy docs will surface 'module not found'
// errors for a small cohort).

export const LEGACY_SLUG_ALIASES: Record<string, string> = {
  moduleItems: 'items',
};
