
'use client';

import { SettingsProvider } from '@/context/settings-context';
import { ReactNode } from 'react';

// A lightweight layout for public-facing pages that only needs settings.
export default function PublicDataLayout({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
        {children}
    </SettingsProvider>
  );
}
