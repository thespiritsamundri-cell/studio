
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type HexColor = string;

interface ThemeColors {
  background: HexColor;
  foreground: HexColor;
  card: HexColor;
  'card-foreground': HexColor;
  popover: HexColor;
  'popover-foreground': HexColor;
  primary: HexColor;
  'primary-foreground': HexColor;
  secondary: HexColor;
  'secondary-foreground': HexColor;
  muted: HexColor;
  'muted-foreground': HexColor;
  accent: HexColor;
  'accent-foreground': HexColor;
  destructive: HexColor;
  'destructive-foreground-': HexColor;
  border: HexColor;
  input: HexColor;
  ring: HexColor;
  'sidebar-background': HexColor;
  'sidebar-foreground': HexColor;
  'sidebar-primary': HexColor;
  'sidebar-primary-foreground': HexColor;
  'sidebar-accent': HexColor;
  'sidebar-accent-foreground': HexColor;
  'sidebar-border': HexColor;
  'sidebar-ring': HexColor;
}

interface SchoolSettings {
  schoolName: string;
  schoolAddress: string;
  schoolPhone: string;
  schoolLogo: string;
  academicYear: string;
  whatsappApiUrl: string;
  whatsappApiKey: string;
  whatsappActive: boolean;
  messageDelay: number;
  themeColors?: Partial<ThemeColors>;
  font: 'inter' | 'roboto' | 'open-sans' | 'lato' | 'montserrat' | 'poppins';
}

interface SettingsContextType {
  settings: SchoolSettings;
  setSettings: React.Dispatch<React.SetStateAction<SchoolSettings>>;
}

const defaultSettings: SchoolSettings = {
  schoolName: 'EduCentral',
  schoolAddress: '123 Education Lane, Knowledge City, Pakistan',
  schoolPhone: '+92 300 1234567',
  schoolLogo: '',
  academicYear: '2024-2025',
  whatsappApiUrl: '',
  whatsappApiKey: '',
  whatsappActive: false,
  messageDelay: 2,
  themeColors: {},
  font: 'inter',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Helper function to convert hex to HSL string
const hexToHsl = (hex: string): string => {
    if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex)) {
        // Return original value if it's not a valid hex color
        return hex;
    }

    let r, g, b;
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else {
        r = parseInt(hex.substring(1, 3), 16);
        g = parseInt(hex.substring(3, 5), 16);
        b = parseInt(hex.substring(5, 7), 16);
    }

    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SchoolSettings>(defaultSettings);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const savedSettings = window.localStorage.getItem('schoolSettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
        // Apply theme colors on initial load
        if (parsedSettings.themeColors) {
            Object.entries(parsedSettings.themeColors).forEach(([key, value]) => {
                document.documentElement.style.setProperty(`--${key}`, hexToHsl(value as string));
            });
        }
      }
    } catch (error) {
      console.error('Error reading from localStorage', error);
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      try {
        window.localStorage.setItem('schoolSettings', JSON.stringify(settings));
        // Apply theme colors whenever they change
        if (settings.themeColors) {
            Object.entries(settings.themeColors).forEach(([key, value]) => {
                document.documentElement.style.setProperty(`--${key}`, hexToHsl(value as string));
            });
        }
      } catch (error) {
        console.error('Error writing to localStorage', error);
      }
    }
  }, [settings, isClient]);

  const contextValue = React.useMemo(() => ({ settings, setSettings }), [settings, setSettings]);


  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
