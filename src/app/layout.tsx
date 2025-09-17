
import './globals.css'
import './print-styles.css'
import AppClientLayout from '@/app/app-client-layout'
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });


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
      <body className={`${inter.variable}`} suppressHydrationWarning>
          <AppClientLayout>
            {children}
          </AppClientLayout>
      </body>
    </html>
  )
}
