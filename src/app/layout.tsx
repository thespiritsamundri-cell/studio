import './globals.css'
import './print-styles.css'
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
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6a3fdc" />
        <link
          rel="apple-touch-icon"
          href="https://i.postimg.cc/qNbqmzs0/The-Spirit.jpg"
        />
      </head>
      <body
        className={`${fontVariables} font-sans antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppClientLayout>{children}</AppClientLayout>
        </ThemeProvider>
      </body>
    </html>
  )
}
