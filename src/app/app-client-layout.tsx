
"use client";

import { SettingsProvider } from "@/context/settings-context";
import { ThemeProvider } from "@/components/layout/theme-provider";
import React, { ReactNode } from "react";
import AppClientEffects from "./app-client-effects";

export default function AppClientLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SettingsProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AppClientEffects>{children}</AppClientEffects>
      </ThemeProvider>
    </SettingsProvider>
  );
}
