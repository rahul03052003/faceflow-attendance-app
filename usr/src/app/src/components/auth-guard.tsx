
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
      // Check if user is allowed to access the current page
      const userRole = user.role || 'Teacher';
      const allowedNavItems = ALL_NAV_ITEMS.filter(item => item.roles.includes(userRole));
      const isAllowed = allowedNavItems.some(item => {
        // Special handling for /users to avoid redirect loops if both roles have it
        if (pathname === '/users') {
            return item.href === '/users' && item.roles.includes(userRole);
        }
        return item.href === pathname;
      });

      // The home page '/' is only for Teachers, so admins should be redirected.
      if (userRole === 'Admin' && pathname === '/') {
        router.push('/reports');
        return;
      }
      
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
