"use client";

import React from 'react';

type PartnerHeaderProps = {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
};

export default function PartnerHeader({ title, subtitle, actions }: PartnerHeaderProps) {
  return (
    <header className="bg-card border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-headline text-foreground">{title}</h1>
          <p className="text-muted-foreground mt-1">{subtitle}</p>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}