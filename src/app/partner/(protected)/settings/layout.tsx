// src/app/partner/(protected)/settings/layout.tsx
"use client";

import React from 'react';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full bg-background overflow-y-auto">
      {children}
    </div>
  );
}
