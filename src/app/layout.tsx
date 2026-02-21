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
        <link rel="apple-touch-icon" href="https://i.postimg.cc/zbjqz3Zv/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="https://i.postimg.cc/R6RvSq5q/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="https://i.postimg.cc/mzwTLhfg/favicon-16x16.png" />
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
