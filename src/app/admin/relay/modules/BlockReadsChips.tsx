'use client';

// ── Block reads chips ───────────────────────────────────────────────
//
// Renders a block's declared `reads` (from the schema contract) as a
// chip row, with drift highlighting. Each chip that appears in
// `driftFields` is styled amber — those are fields the block reads
// but the module's live schema doesn't expose. Everything else is
// muted — "field is wired".
//
// Reused by both ConnectedBlockCard and DarkBlockCard.

interface Props {
  reads?: string[];
  driftFields?: string[];
  /** When true, shows a subtle "unannotated" note instead of an empty row. */
  showUnannotated?: boolean;
}

export default function BlockReadsChips({
  reads,
  driftFields,
  showUnannotated = true,
}: Props) {
  if (!reads || reads.length === 0) {
    if (!showUnannotated) return null;
    return (
      <p className="text-[11px] text-muted-foreground italic">
        Block hasn't declared which module fields it reads yet.
      </p>
    );
  }

  const drift = new Set(driftFields ?? []);

  return (
    <div className="flex flex-wrap gap-1">
      {reads.map((field) => {
        const isDrift = drift.has(field);
        return (
          <span
            key={field}
            title={
              isDrift
                ? 'This field is read by the block but not present in the module schema.'
                : undefined
            }
            className={[
              'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium border',
              isDrift
                ? 'border-amber-300 bg-amber-50 text-amber-800'
                : 'border-slate-200 bg-slate-50 text-slate-700',
            ].join(' ')}
          >
            {isDrift ? '⚠ ' : ''}
            {field}
          </span>
        );
      })}
    </div>
  );
}
