'use client';

import { SettingsProvider } from '@/context/settings-context';
import { ReactNode } from 'react';
import { Toaster } from '@/components/ui/toaster';

// A lightweight layout for public-facing pages that only needs settings.
export default function PublicVoucherLayout({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
        {children}
        <Toaster />
    </SettingsProvider>
  );
}
