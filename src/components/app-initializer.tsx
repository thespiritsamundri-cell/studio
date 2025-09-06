
"use client"

import { useSettings } from "@/context/settings-context";
import { useEffect } from "react";
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

export function AppInitializer() {
    const { settings } = useSettings();
    const selectedFont = fontMap[settings.font as keyof typeof fontMap] || inter;

    useEffect(() => {
        document.title = settings.schoolName || 'School Management System';

        let favicon = document.querySelector("link[rel~='icon']");
        if (!favicon) {
            favicon = document.createElement('link');
            favicon.setAttribute("rel", "icon");
            document.head.appendChild(favicon);
        }
        favicon.setAttribute("href", settings.favicon || "/favicon.ico");

        document.body.className = `antialiased ${selectedFont.variable}`;

        if (settings.themeColors) {
            const root = document.documentElement;
            Object.entries(settings.themeColors).forEach(([key, value]) => {
                root.style.setProperty(`--${key}`, value);
            });
        }
    }, [settings, selectedFont]);

    return null;
}
