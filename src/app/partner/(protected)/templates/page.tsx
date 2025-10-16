// This file is being replaced by /ideabox/page.tsx and is no longer needed.
// It can be safely deleted.
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DeprecatedTemplatesPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/partner/ideabox');
  }, [router]);

  return null;
}
