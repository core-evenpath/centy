import Link from 'next/link';

// ── Relay admin page header ─────────────────────────────────────────
//
// Consistent intro strip placed at the top of every /admin/relay/*
// page so admins know what each surface is for at a glance. Keep copy
// concise — this is "what is this page?", not a manual.

interface Props {
  title: string;
  description: string;
  /** Optional sibling-page quick-jump links shown inline under the copy. */
  links?: Array<{ href: string; label: string }>;
}

export default function RelayPageIntro({ title, description, links }: Props) {
  return (
    <section
      style={{
        padding: '16px 20px',
        borderRadius: 12,
        background: '#f7f3ec',
        border: '1px solid #e8e4dc',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
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
      {links && links.length > 0 && (
        <div style={{ display: 'flex', gap: 14, marginTop: 2, flexWrap: 'wrap' }}>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#4a4a42',
                textDecoration: 'none',
                borderBottom: '1px dotted #b8b4ac',
              }}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
