import { RESERVED_SUBDOMAINS } from '@/lib/types-relay';

const RELAY_DOMAIN = process.env.NEXT_PUBLIC_RELAY_DOMAIN || 'pingbox.io';

export function getRelayUrl(slug: string): string {
  if (process.env.NODE_ENV === 'development') {
    return `http://${slug}.localhost:9002`;
  }
  return `https://${slug}.${RELAY_DOMAIN}`;
}

export function isRelaySubdomain(hostname: string): boolean {
  if (hostname.endsWith(`.${RELAY_DOMAIN}`)) {
    const sub = hostname.replace(`.${RELAY_DOMAIN}`, '');
    return sub.length > 0 && !RESERVED_SUBDOMAINS.has(sub);
  }
  if (hostname.includes('.localhost')) {
    const sub = hostname.split('.localhost')[0];
    return sub.length > 0 && !RESERVED_SUBDOMAINS.has(sub);
  }
  return false;
}
