
"use client";

import { useSettings } from "@/context/settings-context";
import React, { useEffect, ReactNode, useState } from "react";
import { fontMap, inter } from "./font-config";
import { Toaster } from "@/components/ui/toaster";
import { Preloader } from "@/components/ui/preloader";
import { usePathname } from "next/navigation";

export default function AppClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { settings } = useSettings();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // This code now runs only on the client, after hydration
    document.title = settings.schoolName || "EduCentral";
    
    let favicon = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!favicon) {
      favicon = document.createElement("link");
      favicon.rel = "icon";
      document.getElementsByTagName("head")[0].appendChild(favicon);
    }
    favicon.href = settings.favicon || "/favicon.ico";

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

  }, [settings]);

  useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleComplete = () => setLoading(false);
    
    // This is a simplified way to detect page transitions with Next.js App Router
    // A more robust solution might use `next/navigation` events if they become available
    // for this purpose. For now, we listen to pathname changes.
    handleComplete(); // Ensure loading is false on initial load

    return () => {
        // This is a placeholder for a more robust event listener system
        // Since we can't directly hook into `router.events` in App Router,
        // we'll rely on the top-level loading indicators for now.
    };
  }, [pathname]);

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
