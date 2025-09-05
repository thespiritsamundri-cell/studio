
"use client";

import { useSettings } from "@/context/settings-context";
import React, { useEffect } from "react";
import { fontMap, inter } from "./font-config";

export default function AppClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { settings } = useSettings();

  useEffect(() => {
    document.title = settings.schoolName || "EduCentral";
    let favicon = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!favicon) {
      favicon = document.createElement("link");
      favicon.rel = "icon";
      document.getElementsByTagName("head")[0].appendChild(favicon);
    }
    favicon.href = settings.favicon || "/favicon.ico";

    const selectedFont = fontMap[settings.font as keyof typeof fontMap] || inter;
    
    // Get all possible font class names from the font map values
    const allFontClasses = Object.values(fontMap).map(font => font.className);
    
    // Remove any of the known font classes from the body
    document.body.classList.remove(...allFontClasses);

    // Add the currently selected font class
    document.body.classList.add(selectedFont.className);


    // Apply theme colors
    if (settings.themeColors) {
        const root = document.documentElement;
        for (const [key, value] of Object.entries(settings.themeColors)) {
            root.style.setProperty(`--${key}`, value);
        }
    }
  }, [settings]);

  return <>{children}</>;
}
