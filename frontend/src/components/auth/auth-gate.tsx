'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { PageLoader } from '@/components/ui/page-loader';

const PUBLIC_PATHS = new Set(['/login', '/register']);

export function AuthGate({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isPublic = PUBLIC_PATHS.has(pathname);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated && !isPublic) {
      router.replace('/login');
      return;
    }

    if (isAuthenticated && isPublic) {
      router.replace('/projects');
    }
  }, [isAuthenticated, isLoading, isPublic, router]);

  if (isLoading) {
    return <PageLoader label="Checking session..." />;
  }

  if (!isAuthenticated && !isPublic) {
    return <PageLoader label="Redirecting to login..." />;
  }

  if (isAuthenticated && isPublic) {
    return <PageLoader label="Redirecting..." />;
  }

  return <>{children}</>;
}
