// ── Relay admin page intro ──────────────────────────────────────────
//
// Consistent intro strip placed on every /admin/relay/* page, directly
// under the shared RelaySubNav. Keep copy concise — this is "what is
// this page for?", not a manual.
//
// Cross-page navigation lives in RelaySubNav; this component no longer
// accepts ad-hoc links. If a page needs page-specific callouts (e.g.
// "deep link into a specific module editor"), render those inline in
// the page itself rather than pushing them up here.

interface Props {
  title: string;
  description: string;
}

export default function RelayPageIntro({ title, description }: Props) {
  return (
    <section
      style={{
        padding: '14px 18px',
        borderRadius: 10,
        background: '#ffffff',
        border: '1px solid #e8e4dc',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: '#7a7a70',
            textTransform: 'uppercase',
            letterSpacing: 1.2,
          }}
        >
          Admin · Relay
        </span>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a18', margin: 0 }}>{title}</h1>
      </div>
      <p
        style={{
          margin: 0,
          fontSize: 13,
          lineHeight: 1.55,
          color: '#3d3d38',
          maxWidth: 780,
        }}
      >
        {description}
      </p>
    </section>
  );
}
