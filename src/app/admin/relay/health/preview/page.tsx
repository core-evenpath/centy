import { db as adminDb } from '@/lib/firebase-admin';
import PreviewPanel from './PreviewPanel';
import { BOOKING_PREVIEW_SCRIPTS } from '@/lib/relay/preview/booking-scripts';
import { COMMERCE_PREVIEW_SCRIPTS } from '@/lib/relay/preview/commerce-scripts';
import type { AnyPreviewScript } from '@/lib/relay/preview/scripts-index';
import { getPartnerEngines } from '@/lib/relay/engine-recipes';
import type { Partner } from '@/lib/types';

interface PageProps {
  searchParams: Promise<{ partnerId?: string }>;
}

export default async function PreviewCopilotPage({ searchParams }: PageProps) {
  const { partnerId: partnerIdParam } = await searchParams;
  const partnerId = partnerIdParam ?? '';

  let partnerLabel = partnerId;
  let partnerEngines: string[] = [];
  if (partnerId) {
    try {
      const doc = await adminDb.collection('partners').doc(partnerId).get();
      const data = doc.data() as (Partner & { [key: string]: unknown }) | undefined;
      partnerLabel =
        (data?.businessName as string | undefined) ??
        (data as { name?: string } | undefined)?.name ??
        partnerId;
      if (data) partnerEngines = getPartnerEngines(data);
    } catch {
      // Fall back to raw id; no engines → booking scripts only.
    }
  }

  // Engine-gated script list: booking scripts always shown (Phase 1
  // legacy); commerce scripts added when the partner has commerce.
  const scripts: AnyPreviewScript[] = [...BOOKING_PREVIEW_SCRIPTS];
  if (partnerEngines.includes('commerce')) {
    scripts.push(...COMMERCE_PREVIEW_SCRIPTS);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 11, color: '#7a7a70', marginBottom: 4 }}>
          <a href="/admin/relay/health" style={{ color: '#7a7a70', textDecoration: 'none' }}>
            ← Back to Relay Health
          </a>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#1a1a18' }}>
          Preview Copilot
        </h1>
        <div style={{ fontSize: 12, color: '#7a7a70', marginTop: 4 }}>
          Sandboxed orchestrator runs against <strong>{partnerLabel || 'no partner'}</strong> · {scripts.length} scripts
        </div>
      </div>

      {partnerId ? (
        <PreviewPanel partnerId={partnerId} scripts={scripts} />
      ) : (
        <div style={{ padding: 24, textAlign: 'center', color: '#7a7a70', fontSize: 12, background: '#ffffff', border: '1px dashed #d4d0c8', borderRadius: 12 }}>
          No partner selected. Return to Relay Health and pick a partner first.
        </div>
      )}
    </div>
  );
}
