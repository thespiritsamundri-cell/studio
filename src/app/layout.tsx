
import './globals.css'
import './print-styles.css'
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
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6a3fdc" />

      </head>
      <body className={`${fontVariables} font-sans antialiased`} suppressHydrationWarning>

          <AppClientLayout>
            {children}
          </AppClientLayout>
      </body>
    </html>
  )
}
