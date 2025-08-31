
'use client';

import { useSettings } from '@/context/settings-context';
import { ReactNode } from 'react';
import { Inter, Roboto, Open_Sans, Lato, Montserrat, Poppins } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-roboto',
});
const openSans = Open_Sans({ subsets: ['latin'], variable: '--font-open-sans' });
const lato = Lato({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-lato',
});
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat' });
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

const fontMap = {
  inter,
  roboto,
  'open-sans': openSans,
  lato,
  montserrat,
  poppins,
};

export function FontWrapper({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  
  const selectedFont = fontMap[settings.font] || inter;

  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${roboto.variable} ${openSans.variable} ${lato.variable} ${montserrat.variable} ${poppins.variable}`}>
      <body className={`antialiased ${selectedFont.variable}`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
