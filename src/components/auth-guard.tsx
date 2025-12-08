
'use client';

import { useUser } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { ALL_NAV_ITEMS } from '@/components/layout/app-sidebar';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    if (!user && pathname !== '/login') {
      router.push('/login');
      return;
    }

    if (user && pathname === '/login') {
      // Redirect logged-in users away from the login page
      const userRole = user.role || 'Teacher';
      const homePage = userRole === 'Admin' ? '/reports' : '/';
      router.push(homePage);
      return;
    }
    
    if (user && pathname !== '/login') {
      const userRole = user.role || 'Teacher';
      
      // Allow access to the archive page for both roles
      if (pathname === '/reports/archive') {
          return;
      }
      
      // Check if user is allowed to access the current page
      const allowedNavItems = ALL_NAV_ITEMS.filter(item => item.roles.includes(userRole));
      const isAllowed = allowedNavItems.some(item => item.href === pathname);
      
      if (!isAllowed) {
        // If not allowed, redirect to their default home page
        const homePage = userRole === 'Admin' ? '/reports' : '/';
        router.push(homePage);
      }
    }
  }, [user, isLoading, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // If user is not loaded and not on login page, show loading to prevent flicker
  if (!user && pathname !== '/login') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  return <>{children}</>;
}
