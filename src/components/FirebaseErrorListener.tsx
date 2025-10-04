// src/components/FirebaseErrorListener.tsx
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '../firebase/error-emitter';
import { FirestorePermissionError } from '../firebase/errors';

export default function FirebaseErrorListener() {
  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // In a Next.js development environment, uncaught errors are
      // automatically displayed in an overlay. We throw the error
      // here to leverage that built-in developer experience.
      //
      // In production, you might want to log this to a service
      // like Sentry, LogRocket, etc. instead of throwing.
      if (process.env.NODE_ENV === 'development') {
        // We throw it in a timeout to break out of the current event loop tick.
        // This ensures it's caught by Next.js's error boundary.
        setTimeout(() => {
          throw error;
        }, 0);
      } else {
        // Production logging
        console.error("Caught Firestore Permission Error:", {
            message: error.message,
            context: error.context,
            stack: error.stack,
        });
      }
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  // This component does not render anything to the DOM
  return null;
}
