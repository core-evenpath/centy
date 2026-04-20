// P1.M04 — commit-boundary identity gate.
//
// Per ADR-P4-01 §Anon handling: cart mutations and hold creation work
// for anon sessions; transaction commit actions (order-create, booking-
// confirm, space-confirm, service-ticket-start) require a resolved
// contactId. This helper is the enforcement rail.
//
// Upstream anon actions (cart-actions, booking-actions hold creation)
// do NOT call this helper. Importing it at the top of those files
// would be a misuse — only commit-stage actions should gate on
// identity.

import type { RelaySession } from '../session-types';
import { getSessionIdentity } from '../session-store';

export class IdentityRequiredError extends Error {
  readonly code = 'IDENTITY_REQUIRED' as const;
  constructor(message?: string) {
    super(
      message ??
        'This action requires a resolved contact. Call resolveContact + setSessionIdentity first.',
    );
    this.name = 'IdentityRequiredError';
  }
}

/**
 * Throws `IdentityRequiredError` if the session has no resolved
 * `contactId`; returns the contactId otherwise. Used by transaction
 * commit actions (order-create, booking-confirm, space-confirm,
 * service-ticket-start) per ADR-P4-01 §Anon handling.
 */
export function requireIdentityOrThrow(session: RelaySession | null): string {
  const { contactId } = getSessionIdentity(session);
  if (!contactId) {
    throw new IdentityRequiredError();
  }
  return contactId;
}
