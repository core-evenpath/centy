import { RESERVED_SUBDOMAINS } from '@/lib/types-relay';

export function getRelayUrl(slug: string): string {
  if (process.env.NODE_ENV === 'development') {
    return `http://${slug}.localhost:3000`;
  }
  return `https://${slug}.pingbox.io`;
}

export function isRelaySubdomain(hostname: string): boolean {
  if (hostname.endsWith('.pingbox.io')) {
    const sub = hostname.replace('.pingbox.io', '');
    return sub.length > 0 && !RESERVED_SUBDOMAINS.has(sub);
  }
  if (hostname.includes('.localhost')) {
    const sub = hostname.split('.localhost')[0];
    return sub.length > 0 && !RESERVED_SUBDOMAINS.has(sub);
  }
  return false;
}
