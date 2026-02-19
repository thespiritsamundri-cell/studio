import './globals.css'
import AppClientLayout from '@/app/app-client-layout'

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
        <meta name="theme-color" content="#4f46e5" />
      </head>
      <body suppressHydrationWarning>
          <AppClientLayout>
            {children}
          </AppClientLayout>
      </body>
    </html>
  )
}
