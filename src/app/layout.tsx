import './globals.css'
import './print-styles.css'
import { SettingsProvider } from '@/context/settings-context'
import AppClientLayout from '@/app/app-client-layout'
import { fontVariables } from '@/app/font-config'
import { ThemeProvider } from '@/components/layout/theme-provider'

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
          <AppClientLayout>
            {children}
          </AppClientLayout>
        </ThemeProvider>
      </body>
    </html>
  )
}
