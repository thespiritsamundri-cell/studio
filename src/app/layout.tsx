import './globals.css'
import './print-styles.css'
import AppClientLayout from '@/app/app-client-layout'
import { fontVariables } from '@/app/font-config'
import { ThemeProvider } from '@/components/layout/theme-provider'
import { SettingsProvider } from '@/context/settings-context'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
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
