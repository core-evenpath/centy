
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, CheckSquare, Users, Home, User, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';

interface BottomNavigationProps {
  userRole?: 'employee' | 'partner_admin' | 'admin';
}

export default function BottomNavigation({ userRole = 'employee' }: BottomNavigationProps) {
  const pathname = usePathname();

  const getNavigationItems = () => {
    switch (userRole) {
      case 'employee':
        return [
          { name: 'Home', href: '/employee/chat', icon: Home }, // Changed to chat as default
          { name: 'Tasks', href: '/employee/tasks', icon: CheckSquare },
          { name: 'Chat', href: '/employee/chat', icon: MessageSquare },
          { name: 'Profile', href: '/employee/profile', icon: User }
        ];
      case 'partner_admin':
        return [
          { name: 'Dashboard', href: '/partner', icon: Home },
          { name: 'Mission', href: '/partner/mission-control', icon: Zap },
          { name: 'Chat', href: '/employee/chat', icon: MessageSquare },
          { name: 'Team', href: '/partner/team', icon: Users }
        ];
      case 'admin':
        return [
          { name: 'Overview', href: '/admin', icon: Home },
          { name: 'Partners', href: '/admin/partners', icon: Users },
          { name: 'Chat', href: '/employee/chat', icon: MessageSquare },
          { name: 'Settings', href: '/admin/settings', icon: User }
        ];
      default:
        return [];
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50 safe-area-bottom">
      <nav className="grid grid-cols-4 h-16">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/employee/chat' && item.href !== '/employee' && pathname.startsWith(item.href)) ||
            (item.name === 'Home' && pathname === '/employee') ||
            (item.name === 'Chat' && (pathname === '/employee/chat' || pathname === '/employee'));
          
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-1 transition-colors relative",
                isActive
                  ? "text-blue-600 bg-blue-50/50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-blue-600 rounded-full" />
              )}
              
              <div className="flex flex-col items-center justify-center flex-1">
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium leading-tight">{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
