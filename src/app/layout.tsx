import './globals.css'
import './print-styles.css'
import { SettingsProvider } from '@/context/settings-context'
import AppClientLayout from '@/app/app-client-layout'
import { fontVariables } from '@/app/font-config'
import { ThemeProvider } from '@/components/layout/theme-provider'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  manifest: '/manifest.json',
}


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className={`${fontVariables} font-sans antialiased`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SettingsProvider>
            <AppClientLayout>
              {children}
            </AppClientLayout>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
