// Stage-level health: for each canonical stage, count how many of the
// stage's blocks are renderable vs missing. Pure.

import { isBlockRenderable } from './block-health';
import type { BlockSnapshot, StageHealth, HealthStatus } from './types';

export function computeStageHealth(
  stageId: string,
  stageBlocks: BlockSnapshot[],
): StageHealth {
  const blockCount = stageBlocks.length;
  const blocksWithData = stageBlocks.filter(isBlockRenderable).length;

  let status: HealthStatus;
  if (blockCount === 0) {
    // Stage not represented at all by any enabled partner block.
    status = 'red';
  } else if (blocksWithData === 0) {
    // Stage has blocks but none renderable.
    status = 'red';
  } else if (blocksWithData < blockCount) {
    // Partial coverage — flow suggests more blocks than are populated.
    status = 'amber';
  } else {
    status = 'green';
  }

  return { stageId, status, blockCount, blocksWithData };
}
