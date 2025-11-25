// src/app/partner/(protected)/settings/layout.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { LayoutDashboard, Users, Shield, Settings, Sparkles } from 'lucide-react';

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string;
    title: string;
    icon: React.ReactNode;
  }[];
}

function SidebarNav({ className, items, ...props }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1",
        className
      )}
      {...props}
    >
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            pathname === item.href
              ? "bg-muted hover:bg-muted"
              : "hover:bg-transparent hover:underline",
            "justify-start"
          )}
        >
          <span className="mr-2">{item.icon}</span>
          {item.title}
        </Link>
      ))}
    </nav>
  );
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sidebarNavItems = [
    {
      title: "General",
      href: "/partner/settings",
      icon: <Settings className="w-4 h-4" />,
    },
    {
      title: "Dashboard",
      href: "/partner/settings/dashboard",
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      title: "Employees",
      href: "/partner/settings/employees",
      icon: <Users className="w-4 h-4" />,
    },
    {
      title: "Admins",
      href: "/partner/settings/admins",
      icon: <Shield className="w-4 h-4" />,
    },
  ];

  return (
    <div className="hidden space-y-6 p-10 pb-16 md:block">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your workspace settings and team preferences.
        </p>
      </div>
      <div className="my-6 border-t" />
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="-mx-4 lg:w-1/5">
          <SidebarNav items={sidebarNavItems} />
        </aside>
        <div className="flex-1 lg:max-w-2xl">{children}</div>
      </div>
    </div>
  );
}
