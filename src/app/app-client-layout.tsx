
"use client";

import { useSettings } from "@/context/settings-context";
import React, { useEffect, ReactNode, useState } from "react";
import { fontMap, inter } from "./font-config";
import { Toaster } from "@/components/ui/toaster";
import { Preloader } from "@/components/ui/preloader";
import { usePathname } from "next/navigation";

function getTitleFromPathname(pathname: string): string {
  if (pathname === '/lock') return 'Locked';
  if (pathname === '/') return 'Login';
  
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return 'Dashboard';
  
  const pageName = parts[parts.length - 1].replace(/-/g, ' ');
  
  return pageName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}


export default function AppClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { settings } = useSettings();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [previousPath, setPreviousPath] = useState(pathname);

  // Effect for Page Title
  useEffect(() => {
    const pageTitle = getTitleFromPathname(pathname);
    const schoolName = settings.schoolName || 'EduCentral';
    document.title = `${pageTitle} | ${schoolName}`;
  }, [pathname, settings.schoolName]);


  // Effect for Favicon ONLY
  useEffect(() => {
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    // Use a timestamp as a key to force browser to reload the icon
    const faviconUrl = settings.favicon || '/favicon.ico';
    link.href = `${faviconUrl}?v=${new Date().getTime()}`;
  }, [settings.favicon]);
  
  // Effect for Font and Theme Colors ONLY
  useEffect(() => {
    const selectedFont = fontMap[settings.font as keyof typeof fontMap] || inter;
    
    const allFontClasses = Object.values(fontMap).map(font => font.variable);
    document.body.classList.remove(...allFontClasses);
    document.body.classList.add(selectedFont.variable);

    if (settings.themeColors) {
        const root = document.documentElement;
        for (const [key, value] of Object.entries(settings.themeColors)) {
            root.style.setProperty(`--${key}`, value);
        }
    }
  }, [settings.font, settings.themeColors]);

   useEffect(() => {
    if (pathname !== previousPath) {
      setLoading(true);
      const timer = setTimeout(() => {
        setLoading(false);
        setPreviousPath(pathname);
      }, 500); // Simulate loading time

      return () => clearTimeout(timer);
    }
  }, [pathname, previousPath]);


  return (
      <>
          {loading && settings.preloaderEnabled && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-sm">
                  <Preloader style={settings.preloaderStyle} />
              </div>
          )}
          {children}
          <Toaster />
      </>
  );
}
