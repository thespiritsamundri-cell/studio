import './globals.css'
import './print-styles.css'
import { Toaster } from '@/components/ui/toaster'
import { SettingsProvider } from '@/context/settings-context'
import AppClientLayout, { fontVariables } from './app-client-layout'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata = {
  title: 'School Management System',
  description: 'A comprehensive school management system.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} ${fontVariables}`}>
        <SettingsProvider>
          <AppClientLayout>
            {children}
            <Toaster />
          </AppClientLayout>
        </SettingsProvider>
      </body>
    </html>
  );
}
