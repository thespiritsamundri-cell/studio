
'use client';

import type { ReactNode } from 'react';
import { SidebarProvider, Sidebar } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Header } from '@/components/layout/header';
import { DataProvider } from '@/context/data-context';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

function AuthWrapper({ children }: { children: ReactNode }) {
  const [user, loading, error] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p className="text-destructive">Error: {error.message}</p>
      </div>
    );
  }

  if (user) {
     return <>{children}</>;
  }

  return null;
}


export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthWrapper>
      <DataProvider>
        <SidebarProvider>
          <div className="flex min-h-screen w-full bg-muted/40">
            <Sidebar>
              <SidebarNav />
            </Sidebar>
            <div className="flex flex-1 flex-col">
              <Header />
              <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 lg:p-8">
                {children}
              </main>
            </div>
          </div>
        </SidebarProvider>
      </DataProvider>
    </AuthWrapper>
  );
}
