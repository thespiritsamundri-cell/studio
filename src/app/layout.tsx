
'use client';

import './globals.css';
import './print-styles.css';
import { Toaster } from '@/components/ui/toaster';
import { SettingsProvider, useSettings } from '@/context/settings-context';
import { FontWrapper } from '@/components/layout/font-wrapper';
import { useEffect } from 'react';

function AppContent({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();

  useEffect(() => {
    document.title = settings.schoolName || 'EduCentral';
    const link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (link) {
      link.href = settings.favicon || '/favicon.ico';
    } else {
        const newLink = document.createElement('link');
        newLink.rel = 'icon';
        newLink.href = settings.favicon || '/favicon.ico';
        document.head.appendChild(newLink);
    }
  }, [settings.schoolName, settings.favicon]);

  return <>{children}</>;
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SettingsProvider>
      <FontWrapper>
          <AppContent>
            {children}
          </AppContent>
          <Toaster />
      </FontWrapper>
    </SettingsProvider>
  );
}
