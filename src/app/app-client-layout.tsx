
"use client";

import { useSettings } from "@/context/settings-context";
import React, { useEffect, ReactNode } from "react";
import { fontMap, inter } from "./font-config";
import { Toaster } from "@/components/ui/toaster";

export default function AppClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { settings } = useSettings();

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

  return <>{children}<Toaster /></>;
}
