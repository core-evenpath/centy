// src/app/partner/(protected)/settings/layout.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import PartnerHeader from '../../../../components/partner/PartnerHeader';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const tabs = [
    { value: 'dashboard', label: 'Dashboard', href: '/partner/settings/dashboard' },
    { value: 'employees', label: 'Employees', href: '/partner/settings/employees' },
    { value: 'admins', label: 'Admins', href: '/partner/settings/admins' },
  ];

  const currentTab = pathname.includes('/dashboard') 
    ? 'dashboard' 
    : pathname.includes('/employees') 
    ? 'employees' 
    : pathname.includes('/admins')
    ? 'admins'
    : 'dashboard';

  return (
    <>
      <PartnerHeader
        title="Settings"
        subtitle="Manage your workspace configuration and team members"
      />
      <div className="flex-1 overflow-auto">
        <div className="p-6 pb-0">
          <Tabs value={currentTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              {tabs.map((tab) => (
                <Link key={tab.value} href={tab.href}>
                  <TabsTrigger value={tab.value} className="w-full">
                    {tab.label}
                  </TabsTrigger>
                </Link>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </>
  );
}
