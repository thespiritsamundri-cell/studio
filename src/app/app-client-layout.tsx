
"use client";

import { useSettings, SettingsProvider } from "@/context/settings-context";
import React, { useEffect, ReactNode, useState } from "react";
import { fontMap, inter } from "./font-config";
import { Toaster } from "@/components/ui/toaster";
import { Preloader } from "@/components/ui/preloader";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

const ClientLoader = dynamic(
  () => import("lucide-react").then((mod) => mod.Loader2),
  { ssr: false }
);


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

function AppContent({ children }: { children: React.ReactNode }) {
  const { settings, isSettingsInitialized } = useSettings();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [previousPath, setPreviousPath] = useState(pathname);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Effect for Page Title
  useEffect(() => {
    if (isSettingsInitialized) {
      const pageTitle = getTitleFromPathname(pathname);
      const schoolName = settings.schoolName || 'EduCentral';
      document.title = `${pageTitle} | ${schoolName}`;
    }
  }, [pathname, settings.schoolName, isSettingsInitialized]);


  // Effect for Favicon and Manifest
  useEffect(() => {
    if (isSettingsInitialized) {
      const key = new Date().getTime(); // Generate a unique key on settings change
      
      // Favicon
      let faviconLink = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!faviconLink) {
        faviconLink = document.createElement('link');
        faviconLink.rel = 'icon';
        document.head.appendChild(faviconLink);
      }
      const faviconUrl = settings.favicon || '/favicon.ico';
      faviconLink.href = `${faviconUrl}?v=${key}`;
      
      // Manifest
      let manifestLink = document.querySelector("link[rel='manifest']") as HTMLLinkElement;
      if (!manifestLink) {
          manifestLink = document.createElement('link');
          manifestLink.rel = 'manifest';
          document.head.appendChild(manifestLink);
      }
      manifestLink.href = `/manifest.json?v=${key}`;
    }
  }, [isSettingsInitialized, settings.favicon, settings.schoolName]);
  
  // Effect for Font and Theme Colors ONLY
  useEffect(() => {
    if (isSettingsInitialized) {
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
    }
  }, [isSettingsInitialized, settings.font, settings.themeColors]);

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

  // Show initial loader only on the client after mounting, if settings are not ready.
  if (isMounted && !isSettingsInitialized && pathname !== '/') {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background">
        <ClientLoader className="h-8 w-8 animate-spin" />
      </div>
    );
  }


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


export default function AppClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SettingsProvider>
        <AppContent>{children}</AppContent>
    </SettingsProvider>
  );
}
