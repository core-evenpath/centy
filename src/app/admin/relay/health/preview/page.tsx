import { db as adminDb } from '@/lib/firebase-admin';
import PreviewPanel from './PreviewPanel';
import { BOOKING_PREVIEW_SCRIPTS } from '@/lib/relay/preview/booking-scripts';

interface PageProps {
  searchParams: Promise<{ partnerId?: string }>;
}

export default async function PreviewCopilotPage({ searchParams }: PageProps) {
  const { partnerId: partnerIdParam } = await searchParams;
  const partnerId = partnerIdParam ?? '';

  let partnerLabel = partnerId;
  if (partnerId) {
    try {
      const doc = await adminDb.collection('partners').doc(partnerId).get();
      const data = doc.data() as Record<string, unknown> | undefined;
      partnerLabel =
        (data?.businessName as string | undefined) ??
        (data?.name as string | undefined) ??
        partnerId;
    } catch {
      // Fall back to raw id.
    }
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
          Sandboxed orchestrator runs against <strong>{partnerLabel || 'no partner'}</strong> · {BOOKING_PREVIEW_SCRIPTS.length} booking scripts
        </div>
      </div>

      {partnerId ? (
        <PreviewPanel
          partnerId={partnerId}
          scripts={[...BOOKING_PREVIEW_SCRIPTS]}
        />
      ) : (
        <div style={{ padding: 24, textAlign: 'center', color: '#7a7a70', fontSize: 12, background: '#ffffff', border: '1px dashed #d4d0c8', borderRadius: 12 }}>
          No partner selected. Return to Relay Health and pick a partner first.
        </div>
      )}
    </div>
  );
}
