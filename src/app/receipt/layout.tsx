
'use client';

import { SettingsProvider } from '@/context/settings-context';
import { ReactNode } from 'react';
import { Toaster } from '@/components/ui/toaster';
import AppClientEffects from '@/app/app-client-effects';

// A lightweight layout for public-facing pages that only needs settings.
export default function PublicReceiptLayout({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <AppClientEffects>
        {children}
        <Toaster />
      </AppClientEffects>
    </SettingsProvider>
  );
}
