// Block-level health: rolls up field healths + flow reference + module
// connection. Pure function — no I/O, no mutation.

import type { BlockHealth, BlockSnapshot, FlowSnapshot } from './types';

function isBlockRenderable(block: BlockSnapshot): boolean {
  if (!block.enabled) return false;
  // A block is renderable if all required fields are bound AND resolve
  // to non-empty, or the block has no required fields at all.
  for (const field of block.requiredFields) {
    const b = block.fieldBindings[field];
    if (!b || !b.bound || !b.resolvedNonEmpty) return false;
  }
  return true;
}

export function computeBlockHealth(
  block: BlockSnapshot,
  flow: FlowSnapshot | null,
): BlockHealth {
  let fieldsOk = 0;
  let fieldsEmpty = 0;
  let fieldsMissing = 0;

  for (const field of block.requiredFields) {
    const b = block.fieldBindings[field];
    if (!b || !b.bound) fieldsMissing++;
    else if (!b.resolvedNonEmpty) fieldsEmpty++;
    else fieldsOk++;
  }
  for (const field of block.optionalFields) {
    const b = block.fieldBindings[field];
    if (b && b.bound) {
      if (b.resolvedNonEmpty) fieldsOk++;
      else fieldsEmpty++;
    }
  }

  // Field-health roll-up for the block's `status`:
  //   missing required field  → 'missing'
  //   no missing but any empty → 'empty'
  //   any ok                   → 'ok'
  //   nothing bound at all     → 'skipped'
  let status: BlockHealth['status'];
  if (fieldsMissing > 0) status = 'missing';
  else if (fieldsEmpty > 0) status = 'empty';
  else if (fieldsOk > 0) status = 'ok';
  else status = 'skipped';

  // Flow-reference: is this block referenced by any flow stage?
  let hasFlowReference = false;
  if (flow) {
    for (const s of flow.stages) {
      if (s.blockIds.includes(block.id)) { hasFlowReference = true; break; }
    }
  }

  const hasModuleConnection = block.moduleSlug !== null;

  return {
    blockId: block.id,
    status,
    hasFlowReference,
    hasModuleConnection,
    fieldsOk,
    fieldsEmpty,
    fieldsMissing,
  };
}

export { isBlockRenderable };
