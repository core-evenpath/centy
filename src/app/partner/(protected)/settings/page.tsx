// src/app/partner/(protected)/settings/page.tsx
"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard as the default settings page
    router.replace('/partner/settings/dashboard');
  }, [router]);

  return null;
}
