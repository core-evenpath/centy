'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// ── Relay admin sub-nav ─────────────────────────────────────────────
//
// Persistent tab strip shown at the top of every /admin/relay/* page.
// One source of truth for the "admin relay" surface list — adding a
// new page means adding one row here, not updating N places.
//
// Active-tab detection uses `usePathname()` with prefix matching so
// nested routes (e.g. /admin/relay/data/[slug] later) still light
// up the right tab.

interface NavEntry {
  href: string;
  label: string;
  /** One-liner shown as tooltip. Pulled from the page's own intro blurb. */
  hint?: string;
}

const ENTRIES: NavEntry[] = [
  {
    href: '/admin/relay',
    label: 'Overview',
    hint: 'Command center — stats, diagnostics, and quick actions.',
  },
  {
    href: '/admin/relay/blocks',
    label: 'Block Registry',
    hint: 'The master catalog of every block across every vertical.',
  },
  {
    href: '/admin/relay/engine',
    label: 'Block Engine',
    hint: 'Engine-scoped view: which blocks fire per engine, by stage.',
  },
  {
    href: '/admin/relay/data',
    label: 'Data',
    hint: 'Which Relay blocks have the data they need, where drift lives.',
  },
  {
    href: '/admin/relay/flows',
    label: 'Flow Editor',
    hint: 'Design and preview conversation flows per sub-vertical.',
  },
  {
    href: '/admin/relay/health',
    label: 'Relay Health',
    hint: 'Partner-scoped engine diagnostics.',
  },
];

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  // `/admin/relay` must only match itself, not its children.
  if (href === '/admin/relay') return pathname === '/admin/relay';
  return pathname === href || pathname.startsWith(href + '/');
}

export default function RelaySubNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Relay admin sections"
      style={{
        display: 'flex',
        gap: 4,
        padding: 4,
        background: '#efeadf',
        borderRadius: 10,
        overflowX: 'auto',
      }}
    >
      {ENTRIES.map((entry) => {
        const active = isActive(pathname, entry.href);
        return (
          <Link
            key={entry.href}
            href={entry.href}
            title={entry.hint}
            aria-current={active ? 'page' : undefined}
            style={{
              padding: '7px 14px',
              borderRadius: 7,
              fontSize: 12,
              fontWeight: 600,
              color: active ? '#1a1a18' : '#5f5e58',
              background: active ? '#ffffff' : 'transparent',
              boxShadow: active ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              transition: 'background 120ms ease, color 120ms ease',
            }}
          >
            {entry.label}
          </Link>
        );
      })}
    </nav>
  );
}
