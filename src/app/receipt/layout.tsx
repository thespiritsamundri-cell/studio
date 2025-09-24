
'use client';

import { DataProvider } from '@/context/data-context';
import { SettingsProvider } from '@/context/settings-context';
import { ReactNode } from 'react';

// A lightweight layout for public-facing pages that still need data context.
export default function PublicDataLayout({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
        <DataProvider>{children}</DataProvider>
    </SettingsProvider>
  );
}
