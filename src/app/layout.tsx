
import type { Metadata } from 'next';
import './globals.css';
import './print-styles.css';
import { Toaster } from '@/components/ui/toaster';
import { SettingsProvider } from '@/context/settings-context';
import { FontWrapper } from '@/components/layout/font-wrapper';

export const metadata: Metadata = {
  title: 'EduCentral',
  description: 'Modern School Management System',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SettingsProvider>
      <FontWrapper>
          {children}
          <Toaster />
      </FontWrapper>
    </SettingsProvider>
  );
}
