import { db as adminDb } from '@/lib/firebase-admin';
import { BUSINESS_FUNCTIONS } from '@/lib/business-taxonomy/industries';
import OnboardingPicker from './OnboardingPicker';

export default async function OnboardingRelayPage() {
  let partners: Array<{ id: string; label: string }> = [];
  try {
    const snap = await adminDb.collection('partners').limit(50).get();
    partners = snap.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;
      const label =
        (data.businessName as string | undefined) ??
        (data.name as string | undefined) ??
        d.id;
      return { id: d.id, label };
    });
    partners.sort((a, b) => a.label.localeCompare(b.label));
  } catch {
    // Empty fallback.
  }

  const functions = BUSINESS_FUNCTIONS.map((f) => ({
    functionId: f.functionId,
    name: f.name,
    industryId: f.industryId,
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: '#1a1a18' }}>
          Relay Onboarding
        </h1>
        <div style={{ fontSize: 12, color: '#7a7a70', marginTop: 4 }}>
          Pick a partner and a business function — the rest is derived deterministically from the M03 recipe. Booking partners get starter blocks + a cloned flow template; non-booking engines get written to <code>partner.engines</code> only.
        </div>
      </div>
      <OnboardingPicker partners={partners} functions={functions} />
    </div>
  );
}
