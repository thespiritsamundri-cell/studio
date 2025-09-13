

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
import { Loader2, X, School } from 'lucide-react';
import { useSettings } from '@/context/settings-context';
import LockPage from '../lock/page';
import { Preloader } from '@/components/ui/preloader';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import Image from 'next/image';


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
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState('Welcome');

  useEffect(() => {
    if (!loading && !user) {
      sessionStorage.removeItem('welcomeShown'); // Clear on logout/unauthenticated
      router.replace('/');
    }
    if (!loading && user) {
        if (sessionStorage.getItem('isUnlocked') === 'true') {
            setWelcomeMessage('Welcome Back');
            setShowWelcome(true);
            sessionStorage.removeItem('isUnlocked'); // Clear the flag
        } else if (!sessionStorage.getItem('welcomeShown')) {
            setWelcomeMessage('Welcome');
            setShowWelcome(true);
            sessionStorage.setItem('welcomeShown', 'true');
        }
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
     return (
        <>
            {children}
            <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
                <DialogContent className="sm:max-w-md text-center">
                     {welcomeMessage === 'Welcome' ? (
                        <>
                            <DialogHeader className="items-center">
                                {settings.schoolLogo ? (
                                    <Image src={settings.schoolLogo} alt="School Logo" width={60} height={60} className="rounded-full object-contain mb-2"/>
                                ) : (
                                    <School className="w-12 h-12 text-primary mb-2"/>
                                )}
                                <DialogTitle className="text-2xl">{welcomeMessage} to {settings.schoolName}</DialogTitle>
                                <DialogDescription>{format(new Date(), 'EEEE, MMMM do, yyyy')}</DialogDescription>
                            </DialogHeader>
                            <div className="py-8">
                               <p className="text-sm text-muted-foreground">Developed by Mian Mudassar</p>
                            </div>
                        </>
                    ) : (
                         <>
                            <DialogHeader className="items-center">
                                {settings.schoolLogo ? (
                                    <Image src={settings.schoolLogo} alt="School Logo" width={60} height={60} className="rounded-full object-contain mb-2"/>
                                ) : (
                                    <School className="w-12 h-12 text-primary mb-2"/>
                                )}
                                 <DialogTitle className="text-2xl">{welcomeMessage}</DialogTitle>
                            </DialogHeader>
                            <div className="py-8">
                               <p className="text-sm text-muted-foreground">Developed by Mian Mudassar</p>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
     );
  }

  return null;
}


export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();
  const [welcomeVariant, setWelcomeVariant] = useState<'welcome' | 'welcome-back' | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const hasBeenWelcomed = sessionStorage.getItem('hasBeenWelcomed');
    const unlocked = sessionStorage.getItem('unlocked');
    
    if (unlocked === 'true') {
        setWelcomeVariant('welcome-back');
        setShowWelcome(true);
        sessionStorage.removeItem('unlocked');
    } else if (!hasBeenWelcomed) {
        setWelcomeVariant('welcome');
        setShowWelcome(true);
        sessionStorage.setItem('hasBeenWelcomed', 'true');
    }

  }, []);

  if (isClient && pathname === '/lock') {
      return <LockPage />;
  }

  return (
    <AuthWrapper>
      <DataProvider>
        {isClient && <InactivityDetector />}
        <SidebarProvider>
          {welcomeVariant && <WelcomeDialog open={showWelcome} onOpenChange={setShowWelcome} variant={welcomeVariant} />}
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
