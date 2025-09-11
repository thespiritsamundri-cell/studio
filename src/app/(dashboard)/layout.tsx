

'use client';

import type { ReactNode } from 'react';
import { SidebarProvider, Sidebar } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Header } from '@/components/layout/header';
import { DataProvider } from '@/context/data-context';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useSettings } from '@/context/settings-context';
import LockPage from '../lock/page';
import { Preloader } from '@/components/ui/preloader';
import { WelcomeDialog } from '@/components/layout/welcome-dialog';

function InactivityDetector() {
  const router = useRouter();
  const { settings } = useSettings();
  const inactivityTimer = useRef<NodeJS.Timeout>();
  
  const handleLock = () => {
    // Only lock if we are not already on the lock page
    if (window.location.pathname !== '/lock') {
      sessionStorage.setItem('lockedFrom', window.location.pathname);
      router.push('/lock');
    }
  }

  const resetTimer = () => {
    if (!settings.autoLockEnabled) return;
    
    clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(handleLock, (settings.autoLockDuration || 300) * 1000);
  };

  useEffect(() => {
    if (!settings.autoLockEnabled) {
      clearTimeout(inactivityTimer.current);
      return;
    }

    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    
    const eventHandler = () => resetTimer();

    events.forEach(event => window.addEventListener(event, eventHandler));
    resetTimer(); // Start the timer initially

    return () => {
      events.forEach(event => window.removeEventListener(event, eventHandler));
      clearTimeout(inactivityTimer.current);
    };
  }, [settings.autoLockEnabled, settings.autoLockDuration, router]);

  return null;
}


function AuthWrapper({ children }: { children: ReactNode }) {
  const [user, loading, error] = useAuthState(auth);
  const router = useRouter();
  const { settings } = useSettings();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/');
    }
  }, [user, loading, router]);
  
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        {settings.preloaderEnabled ? <Preloader style={settings.preloaderStyle} /> : <Loader2 className="h-8 w-8 animate-spin" />}
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
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();
  const [showWelcome, setShowWelcome] = useState(false);
  const [isWelcomeBack, setIsWelcomeBack] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Check if we're coming back from the lock screen
    const unlocked = sessionStorage.getItem('unlocked');
    if (unlocked === 'true') {
        setIsWelcomeBack(true);
        setShowWelcome(true);
        sessionStorage.removeItem('unlocked');
    } else if (pathname === '/dashboard') {
        const welcomeShownForThisNav = sessionStorage.getItem('welcomeShownForThisNav');
        if (welcomeShownForThisNav !== 'true') {
            setIsWelcomeBack(false);
            setShowWelcome(true);
            sessionStorage.setItem('welcomeShownForThisNav', 'true');
        }
    } else {
        sessionStorage.removeItem('welcomeShownForThisNav');
    }
  }, [pathname]);

  if (isClient && pathname === '/lock') {
      return <LockPage />;
  }

  return (
    <AuthWrapper>
      <DataProvider>
        {isClient && <InactivityDetector />}
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
        {isClient && <WelcomeDialog open={showWelcome} onOpenChange={setShowWelcome} isWelcomeBack={isWelcomeBack} />}
      </DataProvider>
    </AuthWrapper>
  );
}
