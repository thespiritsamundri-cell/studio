
import './globals.css'
import './print-styles.css'
import AppClientLayout from '@/app/app-client-layout'
import { Inter, Roboto, Lato, Montserrat, Open_Sans as OpenSans, Oswald, Playfair_Display as PlayfairDisplay, Source_Sans_Pro as SourceSansPro, Merriweather, Noto_Nastaliq_Urdu as NotoNastaliqUrdu } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const roboto = Roboto({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-roboto' });
const lato = Lato({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-lato' });
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat' });
const open_sans = OpenSans({ subsets: ['latin'], variable: '--font-open_sans' });
const oswald = Oswald({ subsets: ['latin'], variable: '--font-oswald' });
const playfair_display = PlayfairDisplay({ subsets: ['latin'], variable: '--font-playfair_display' });
const source_sans_pro = SourceSansPro({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-source_sans_pro' });
const merriweather = Merriweather({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-merriweather' });
const noto_nastaliq_urdu = NotoNastaliqUrdu({ subsets: ['arabic'], weight: ['400', '700'], variable: '--font-noto_nastaliq_urdu' });


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
      <body className={`${inter.variable} ${roboto.variable} ${lato.variable} ${montserrat.variable} ${open_sans.variable} ${oswald.variable} ${playfair_display.variable} ${source_sans_pro.variable} ${merriweather.variable} ${noto_nastaliq_urdu.variable}`} suppressHydrationWarning>
          <AppClientLayout>
            {children}
          </AppClientLayout>
      </body>
    </html>
  )
}
