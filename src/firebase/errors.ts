// src/firebase/errors.ts
import type { SecurityRuleContext } from '../lib/types';

export class FirestorePermissionError extends Error {
  public context: SecurityRuleContext;
  public serverError?: any;

  constructor({ path, operation, requestResourceData, serverError }: SecurityRuleContext & { serverError?: any }) {
    const message = `Firestore Permission Denied: The following request was denied by security rules:
    
    Operation: ${operation.toUpperCase()}
    Path: ${path}
    
    ${requestResourceData ? `Request Data:
    ${JSON.stringify(requestResourceData, null, 2)}` : ''}

    This error is being surfaced by the application's contextual error handling system.
    `;
    
    super(message);
    this.name = 'FirestorePermissionError';
    this.context = { path, operation, requestResourceData };
    this.serverError = serverError;

    // This is for V8 to capture the stack trace.
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FirestorePermissionError);
    }
  }
}
