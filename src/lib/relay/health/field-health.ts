// Re-export the field-health primitives from the existing
// `binding-health` module so the health checker speaks a consistent
// vocabulary and doesn't duplicate logic.

export { computeHealth, isEmpty, summarizeHealth, HEALTH_STYLES } from '../binding-health';
export type { Health } from '../binding-health';
