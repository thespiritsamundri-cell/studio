
"use client";

import { useSettings } from "@/context/settings-context";
import React, { useEffect, ReactNode, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Preloader } from "@/components/ui/preloader";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";


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

export default function AppClientEffects({ children }: { children: ReactNode }) {
  const { settings, isSettingsInitialized } = useSettings();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [previousPath, setPreviousPath] = useState(pathname);

  // Page Title, Favicon, Font, and Theme Effects
  useEffect(() => {
    if (isSettingsInitialized) {
      // Title
      const pageTitle = getTitleFromPathname(pathname);
      const schoolName = settings.schoolName || 'EduCentral';
      document.title = `${pageTitle} | ${schoolName}`;

      // Favicon & Manifest
      const key = new Date().getTime();
      let faviconLink = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!faviconLink) {
        faviconLink = document.createElement('link');
        faviconLink.rel = 'icon';
        document.head.appendChild(faviconLink);
      }
      faviconLink.href = `${settings.favicon || '/favicon.ico'}?v=${key}`;
      
      let manifestLink = document.querySelector("link[rel='manifest']") as HTMLLinkElement;
      if (!manifestLink) {
        manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        document.head.appendChild(manifestLink);
      }
      manifestLink.href = `/manifest.json?v=${key}`;

      // Font
      document.body.className = `font-sans`;
    }
  }, [isSettingsInitialized, settings, pathname]);

  // Page transition loader effect
  useEffect(() => {
    if (pathname !== previousPath) {
      setLoading(true);
      const timer = setTimeout(() => {
        setLoading(false);
        setPreviousPath(pathname);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [pathname, previousPath]);

  if (!isSettingsInitialized && pathname !== '/') {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  const preloaderStyle = settings.preloaderStyle || 'style1';

  return (
    <>
      {loading && settings.preloaderEnabled && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Preloader style={preloaderStyle} />
        </div>
      )}
      {children}
      <Toaster />
    </>
  );
}

    
