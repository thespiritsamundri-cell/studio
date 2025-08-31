
'use client';

import type { ReactNode } from 'react';
import { SidebarProvider, Sidebar } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { Header } from '@/components/layout/header';
import { SettingsProvider } from '@/context/settings-context';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <Sidebar collapsible="icon">
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
    </SettingsProvider>
  );
}
