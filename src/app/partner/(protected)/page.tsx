// src/app/partner/(protected)/page.tsx
"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function PartnerRootPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to messaging as the main partner page
    router.replace('/partner/messaging');
  }, [router]);

  return null;
}
