'use client';

// ── IngestMount ────────────────────────────────────────────────────────
//
// Convenience wrapper so callers only need to drop one component next
// to the page body and call `ingest.startIngest()` elsewhere. Mounts
// both modals and wires them to the shared hook.

import SourcePickerModal from './SourcePickerModal';
import ReviewModal from './ReviewModal';
import type { UseAIIngestReturn } from '@/hooks/useAIIngest';

interface Props {
  ingest: UseAIIngestReturn;
  moduleName: string;
}

export default function IngestMount({ ingest, moduleName }: Props) {
  return (
    <>
      <SourcePickerModal
        open={ingest.pickerOpen}
        onClose={ingest.closeAll}
        onSubmit={ingest.handleSourceSubmit}
        loading={ingest.loading}
        moduleName={moduleName}
      />
      <ReviewModal
        open={ingest.reviewOpen}
        onClose={ingest.closeAll}
        result={ingest.result}
        onConfirm={ingest.handleConfirm}
        saving={ingest.saving}
      />
    </>
  );
}
