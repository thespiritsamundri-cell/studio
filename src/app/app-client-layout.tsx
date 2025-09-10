
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
  if (pathname === '/dashboard') return 'Dashboard';

  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return 'Dashboard';
  
  const lastPart = parts[parts.length - 1];
  
  if (lastPart === 'details' || lastPart === 'edit') {
    const parent = parts[parts.length - 2] || '';
    return parent.charAt(0).toUpperCase() + parent.slice(1) + ' ' + lastPart.charAt(0).toUpperCase() + lastPart.slice(1);
  }
  
  return lastPart.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
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
    const head = document.getElementsByTagName("head")[0];
    // Remove any existing favicon link
    const existingFavicon = document.querySelector("link[rel~='icon']");
    if (existingFavicon) {
      head.removeChild(existingFavicon);
    }
  
    // Create and append the new favicon link
    const newFavicon = document.createElement("link");
    newFavicon.rel = "icon";
    // Append a timestamp to the URL to force the browser to reload the icon, bypassing the cache.
    newFavicon.href = `${settings.favicon || "/favicon.ico"}?v=${new Date().getTime()}`;
    head.appendChild(newFavicon);
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
