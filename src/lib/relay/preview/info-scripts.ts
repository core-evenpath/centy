// Info preview scripts (P2.info.M08).
//
// 8 scripts × 3 sub-verticals = 24 scripts. Info themes are narrower
// than any other engine:
//   1. Find hours / open status
//   2. Find location / directions
//   3. Find contact / phone
//   4. Check status / outages
//   5. Browse services / directory
//   6. Schedule / timetable lookup (read-only)
//   7. Forms / documents (download)
//   8. Escalate to service (service-overlay break)

import type { PreviewScript as BookingPreviewScript } from './booking-scripts';

export type InfoSubVertical =
  | 'public-transport'
  | 'government'
  | 'utilities';

export interface InfoPreviewScript extends Omit<BookingPreviewScript, 'subVertical' | 'engine'> {
  engine: 'info';
  subVertical: InfoSubVertical;
}

const T = (content: string) => ({ role: 'user' as const, content });

// ── Public Transport ──────────────────────────────────────────────────

const PUBLIC_TRANSPORT_SCRIPTS: InfoPreviewScript[] = [
  {
    id: 'pt-01-hours',
    engine: 'info',
    subVertical: 'public-transport',
    label: 'Find operating hours',
    description: 'User asks when service operates',
    turns: [T('hi'), T('what are your operating hours'), T('when does the last bus run')],
  },
  {
    id: 'pt-02-location',
    engine: 'info',
    subVertical: 'public-transport',
    label: 'Find station location',
    description: 'User asks where the nearest station is',
    turns: [T('where is the nearest station'), T('how do I get there'), T('show me directions')],
  },
  {
    id: 'pt-03-contact',
    engine: 'info',
    subVertical: 'public-transport',
    label: 'Find contact info',
    description: 'User asks how to contact the operator',
    turns: [T('how do I contact you'), T('what is your phone number'), T('show me contact info')],
  },
  {
    id: 'pt-04-status',
    engine: 'info',
    subVertical: 'public-transport',
    label: 'Check service status',
    description: 'User checks for delays or disruptions',
    turns: [T('is there a delay today'), T('any service disruptions'), T('whats the current status')],
  },
  {
    id: 'pt-05-directory',
    engine: 'info',
    subVertical: 'public-transport',
    label: 'Browse routes',
    description: 'User browses available routes',
    turns: [T('what routes do you run'), T('show me all available lines'), T('what services do you offer')],
  },
  {
    id: 'pt-06-timetable',
    engine: 'info',
    subVertical: 'public-transport',
    label: 'Read timetable (info mode)',
    description: 'User looks up timetable departures',
    turns: [T('when does the next train depart'), T('show me the timetable'), T('what are the next departures')],
  },
  {
    id: 'pt-07-forms',
    engine: 'info',
    subVertical: 'public-transport',
    label: 'Forms / passes',
    description: 'User asks about forms or application passes',
    turns: [T('what forms do I need'), T('where can I download a pass application'), T('documents for senior pass')],
  },
  {
    id: 'pt-08-escalate',
    engine: 'info',
    subVertical: 'public-transport',
    label: 'Escalate to service (overlay break)',
    description: 'User has a specific complaint / service issue',
    turns: [T('I lost my pass on the bus'), T('track my refund request'), T('status of my complaint')],
  },
];

// ── Government ────────────────────────────────────────────────────────

const GOVERNMENT_SCRIPTS: InfoPreviewScript[] = [
  {
    id: 'gov-01-hours',
    engine: 'info',
    subVertical: 'government',
    label: 'Find office hours',
    description: 'User asks when a government office is open',
    turns: [T('hi'), T('when is the office open'), T('are you open on saturday')],
  },
  {
    id: 'gov-02-location',
    engine: 'info',
    subVertical: 'government',
    label: 'Find office location',
    description: 'User asks where a department is located',
    turns: [T('where is the registry office'), T('how do I get there'), T('whats the address')],
  },
  {
    id: 'gov-03-contact',
    engine: 'info',
    subVertical: 'government',
    label: 'Find department contact',
    description: 'User asks for a department phone',
    turns: [T('phone number for the registry'), T('how do I contact tax office'), T('contact info for permits')],
  },
  {
    id: 'gov-04-status',
    engine: 'info',
    subVertical: 'government',
    label: 'Services status',
    description: 'User checks current service availability',
    turns: [T('is the office open today'), T('any disruptions'), T('current status')],
  },
  {
    id: 'gov-05-directory',
    engine: 'info',
    subVertical: 'government',
    label: 'Browse services',
    description: 'User browses available government services',
    turns: [T('what services do you offer'), T('show me your departments'), T('list all services')],
  },
  {
    id: 'gov-06-timetable',
    engine: 'info',
    subVertical: 'government',
    label: 'Appointment availability (info mode)',
    description: 'User checks when appointments are available (read-only)',
    turns: [T('when are appointments available'), T('whats the waiting time'), T('next available slot')],
  },
  {
    id: 'gov-07-forms',
    engine: 'info',
    subVertical: 'government',
    label: 'Forms / documents',
    description: 'User looks up required forms',
    turns: [T('what forms do I need for a permit'), T('download the application'), T('show me birth certificate form')],
  },
  {
    id: 'gov-08-escalate',
    engine: 'info',
    subVertical: 'government',
    label: 'Escalate to service (overlay break)',
    description: 'User has a specific application question',
    turns: [T('status of my application'), T('track my permit request'), T('where is my document')],
  },
];

// ── Utilities ─────────────────────────────────────────────────────────

const UTILITIES_SCRIPTS: InfoPreviewScript[] = [
  {
    id: 'util-01-hours',
    engine: 'info',
    subVertical: 'utilities',
    label: 'Find customer-service hours',
    description: 'User asks about customer-service hours',
    turns: [T('hi'), T('what are your customer service hours'), T('is someone available tonight')],
  },
  {
    id: 'util-02-location',
    engine: 'info',
    subVertical: 'utilities',
    label: 'Find service-center location',
    description: 'User asks where payment centers are',
    turns: [T('where can I pay in person'), T('location of service center'), T('walk-in center near me')],
  },
  {
    id: 'util-03-contact',
    engine: 'info',
    subVertical: 'utilities',
    label: 'Emergency contact',
    description: 'User asks for emergency / outage line',
    turns: [T('emergency number'), T('how do I report an outage'), T('contact info for urgent issues')],
  },
  {
    id: 'util-04-outage',
    engine: 'info',
    subVertical: 'utilities',
    label: 'Check outage status',
    description: 'User checks for known outages',
    turns: [T('is there a power outage in my area'), T('whats the current status'), T('show me the outage map')],
  },
  {
    id: 'util-05-directory',
    engine: 'info',
    subVertical: 'utilities',
    label: 'Browse service categories',
    description: 'User browses utility offerings',
    turns: [T('what services do you provide'), T('show me all categories'), T('what utilities do you manage')],
  },
  {
    id: 'util-06-timetable',
    engine: 'info',
    subVertical: 'utilities',
    label: 'Maintenance schedule',
    description: 'User checks planned maintenance schedule',
    turns: [T('when is the next scheduled maintenance'), T('planned outages this month'), T('maintenance calendar')],
  },
  {
    id: 'util-07-forms',
    engine: 'info',
    subVertical: 'utilities',
    label: 'Forms / new-connection',
    description: 'User asks about new-connection or disconnect forms',
    turns: [T('how do I apply for a new connection'), T('disconnect form'), T('name-change application')],
  },
  {
    id: 'util-08-escalate',
    engine: 'info',
    subVertical: 'utilities',
    label: 'Escalate to service (overlay break)',
    description: 'User has a specific bill / meter issue',
    turns: [T('status of my complaint'), T('track my refund'), T('whats wrong with my bill')],
  },
];

// ── Registry ──────────────────────────────────────────────────────────

export const INFO_PREVIEW_SCRIPTS: readonly InfoPreviewScript[] = [
  ...PUBLIC_TRANSPORT_SCRIPTS,
  ...GOVERNMENT_SCRIPTS,
  ...UTILITIES_SCRIPTS,
];

export function getInfoScriptsBySubVertical(
  subVertical: InfoSubVertical,
): InfoPreviewScript[] {
  return INFO_PREVIEW_SCRIPTS.filter((s) => s.subVertical === subVertical);
}

export function getInfoScriptById(id: string): InfoPreviewScript | undefined {
  return INFO_PREVIEW_SCRIPTS.find((s) => s.id === id);
}
