import type { BlockConfig, BlockState, ContentStudioState, MappedFeature } from './types';

/**
 * Map a single block config + its runtime state into a MappedFeature.
 *
 * BUG 2 FIX: truthy check on `dataProvided` so string "true", number 1,
 * or boolean true all count as ready.
 */
function mapBlock(block: BlockConfig, state?: BlockState): MappedFeature {
    const hasData = !!state?.dataProvided;
    const isAuto = !!block.autoConfigured;

    return {
        id: block.blockId,
        icon: block.icon || 'box',
        customer: block.customerLabel,
        you: block.partnerAction,
        priority: block.priority,
        items: state?.itemCount ?? 0,
        source: state?.sourceRef ?? state?.sourceType ?? null,
        ready: hasData || isAuto,
        auto: isAuto,
        depends: block.dependsOn ?? undefined,
        missReason: block.missReason ?? undefined,
        backend: block.backendRequired,
        templateCols: block.templateColumns ?? undefined,
    };
}

export function mapAllFeatures(
    blocks: BlockConfig[],
    state?: ContentStudioState
): MappedFeature[] {
    return blocks.map(b => mapBlock(b, state?.blockStates?.[b.blockId]));
}

/**
 * Split features into independent / dependent and compute progress.
 *
 * BUG 3 FIX: `isEmpty` is true only when the partner hasn't manually
 * provided any data. Auto-configured features no longer suppress the
 * progress view.
 *
 * BUG 4 FIX: Dependent features are surfaced as their own group so the
 * UI can render them in a dedicated section instead of dropping them.
 */
export function partitionFeatures(features: MappedFeature[]) {
    const independent = features.filter(f => !f.depends);
    const dependent = features.filter(f => !!f.depends);

    const ready = independent.filter(f => f.ready);
    const notReady = independent.filter(f => !f.ready);

    const total = independent.length;
    const readyCount = ready.length;
    const pct = total > 0 ? Math.round((readyCount / total) * 100) : 100;

    const hasAnyManualData = ready.some(f => !f.auto);
    const isEmpty = readyCount === 0 || (!hasAnyManualData && notReady.length > 0);
    const isComplete = pct === 100;

    return {
        all: features,
        independent,
        dependent,
        ready,
        notReady,
        readyCount,
        total,
        pct,
        isEmpty,
        isComplete,
    };
}
