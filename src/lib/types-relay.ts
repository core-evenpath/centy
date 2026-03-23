export interface RelaySlugValidation {
  valid: boolean;
  error?: 'too_short' | 'too_long' | 'invalid_chars' | 'reserved' | 'taken' | 'hyphen_boundary';
}

export const RESERVED_SUBDOMAINS = new Set([
  'www', 'api', 'app', 'admin', 'partner', 'relay',
  'mail', 'smtp', 'ftp', 'docs', 'help', 'support',
  'status', 'blog', 'cdn', 'assets', 'static',
  'dev', 'staging', 'test', 'demo',
]);
