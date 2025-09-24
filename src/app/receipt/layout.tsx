
'use client';

import { DataProvider } from '@/context/data-context';
import { ReactNode } from 'react';

export default function ReceiptLayout({ children }: { children: ReactNode }) {
  return <DataProvider>{children}</DataProvider>;
}
