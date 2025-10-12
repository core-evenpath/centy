
// src/hooks/use-auth.tsx
"use client";

import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import type { FirebaseAuthUser, AuthState } from '../lib/types';

// Define a default, unauthenticated state
const defaultAuthState: AuthState = {
  user: null,
  loading: true,
  error: null,
  isAuthenticated: false,
};

const AuthContext = createContext<AuthState>(defaultAuthState);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(defaultAuthState);

  useEffect(() => {
    // This listener is the core of Firebase's web auth.
    // It fires once on initial page load and then again whenever the user's auth state changes.
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in.
        try {
          // Force a token refresh to get the latest custom claims.
          const tokenResult = await user.getIdTokenResult(true); 
          const claims = tokenResult.claims;
          
          // Set the state with the authenticated user and their claims.
          setAuthState({
            user: {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              emailVerified: user.emailVerified,
              phoneNumber: user.phoneNumber,
              customClaims: {
                ...claims,
                token: tokenResult.token // Add the token to the claims
              },
            } as FirebaseAuthUser,
            loading: false, // Auth check is complete.
            error: null,
            isAuthenticated: true,
          });
        } catch (error: any) {
          console.error("Error fetching user token with claims:", error);
          // If claims fail, still log the user in but with an error state.
          setAuthState({ 
            user: {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              emailVerified: user.emailVerified,
              phoneNumber: user.phoneNumber,
              customClaims: {},
            } as FirebaseAuthUser, 
            loading: false, 
            error: "Failed to fetch user roles and permissions.", 
            isAuthenticated: true,
          });
        }
      } else {
        // User is signed out.
        // Reset the state to its default unauthenticated values.
        setAuthState({
          user: null,
          loading: false, // Auth check is complete.
          error: null,
          isAuthenticated: false,
        });
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []); // Empty dependency array ensures this effect runs only once on mount.

  return <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
