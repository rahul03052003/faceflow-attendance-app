
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  ScanFace,
  BarChart3,
  Users,
  Bot,
  Settings,
  LifeBuoy,
  Book,
} from 'lucide-react';
import type { NavItem } from '@/lib/types';
import { useUser } from '@/firebase';

export const ALL_NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['Teacher'] },
  { href: '/capture', label: 'Capture Attendance', icon: ScanFace, roles: ['Teacher'] },
  { href: '/reports', label: 'Attendance Reports', icon: BarChart3, roles: ['Teacher'] },
  { href: '/users', label: 'User Management', icon: Users, roles: ['Admin', 'Teacher'] },
  { href: '/subjects', label: 'Subjects', icon: Book, roles: ['Teacher'] },
  { href: '/settings', label: 'Settings', icon: Settings, roles: ['Admin', 'Teacher'] },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  if (pathname === '/login') {
    return null; // Don't show sidebar on login page
  }
  
  const userRole = user?.role || 'Teacher';

  const navItems = ALL_NAV_ITEMS.filter(item => item.roles.includes(userRole));

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
          <Bot className="h-8 w-8 text-primary" />
          <span className="text-lg font-semibold">SentientAttend</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={{ children: item.label }}
              >
                <Link href={item.href} prefetch={true}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip={{ children: 'Support' }}>
              <LifeBuoy />
              <span>Support</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
