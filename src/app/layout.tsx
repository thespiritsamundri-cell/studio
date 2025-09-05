import './globals.css'
import './print-styles.css'
import { Toaster } from '@/components/ui/toaster'
import { SettingsProvider } from '@/context/settings-context'
import AppClientLayout from '@/app/app-client-layout'
import { fontVariables } from '@/app/font-config'

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
      <body className={`${fontVariables} font-sans antialiased`}>
        <SettingsProvider>
          <AppClientLayout>{children}</AppClientLayout>
          <Toaster />
        </SettingsProvider>
      </body>
    </html>
  )
}
