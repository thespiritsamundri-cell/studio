
import { Inter, Roboto, Open_Sans, Lato, Montserrat, Poppins } from 'next/font/google';

export const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
export const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-roboto',
});
export const openSans = Open_Sans({ subsets: ['latin'], variable: '--font-open-sans' });
export const lato = Lato({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-lato',
});
export const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
});
export const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

export const fontMap = {
  inter,
  roboto,
  'open-sans': openSans,
  lato,
  montserrat,
  poppins,
};

export const fontVariables = Object.values(fontMap).map(font => font.variable).join(' ');
