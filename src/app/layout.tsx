import './globals.css'
import './print-styles.css'
import { SettingsProvider } from '@/context/settings-context'
import AppClientLayout from './app-client-layout'
import { fontVariables } from './font-config'

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
      <body className={fontVariables}>
        <SettingsProvider>
          <AppClientLayout>
            {children}
          </AppClientLayout>
        </SettingsProvider>
      </body>
    </html>
  )
}
