

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Grade, MessageTemplate } from '@/lib/types';

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

export interface SchoolSettings {
  schoolName: string;
  schoolAddress: string;
  schoolPhone: string;
  schoolLogo: string;
  favicon: string;
  principalSignature: string;
  academicYear: string;
  admissionConfirmationTemplate: string;
  whatsappApiUrl: string;
  whatsappApiKey: string; // This will be the token for UltraMSG
  whatsappInstanceId?: string; // For providers like UltraMSG
  whatsappPriority?: string; // For providers like UltraMSG
  whatsappActive: boolean;
  whatsappConnectionStatus: 'untested' | 'connected' | 'failed';
  messageDelay: number;
  historyClearPin?: string;
  themeColors?: Partial<ThemeColors>;
  font: 'inter' | 'roboto' | 'open-sans' | 'lato' | 'montserrat' | 'poppins';
  subjects?: { [className: string]: string[] };
  gradingSystem?: Grade[];
  expenseCategories?: string[];
  messageTemplates?: MessageTemplate[];
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
  favicon: '',
  principalSignature: '',
  academicYear: '2024-2025',
  admissionConfirmationTemplate: 'Welcome to {school_name}!\n\nDear {father_name},\nWe are pleased to confirm the admission of your child, {student_name}, into Class {class}. We look forward to a successful academic year together.',
  whatsappApiUrl: '',
  whatsappApiKey: '',
  whatsappInstanceId: '',
  whatsappPriority: '10',
  whatsappActive: false,
  whatsappConnectionStatus: 'untested',
  messageDelay: 2,
  historyClearPin: '',
  themeColors: {},
  font: 'inter',
  gradingSystem: [
    { name: 'A+', minPercentage: 90 },
    { name: 'A', minPercentage: 80 },
    { name: 'B', minPercentage: 70 },
    { name: 'C', minPercentage: 60 },
    { name: 'D', minPercentage: 50 },
    { name: 'E', minPercentage: 40 },
    { name: 'F', minPercentage: 0 },
  ],
  expenseCategories: [
    'Salaries', 'Utilities', 'Rent', 'Maintenance', 'Supplies', 'Marketing', 'Transportation', 'Miscellaneous'
  ],
  messageTemplates: [
    { id: 'TPL_ABSENT', name: 'Absentee Notice', content: 'Dear {father_name},\nThis is to inform you that your child, {student_name} of class {class}, was absent today. Please contact the school office. \nRegards, {school_name}' },
    { id: 'TPL_PAYMENT', name: 'Payment Receipt', content: 'Dear {father_name},\nWe have received a payment of PKR {paid_amount}. Your new balance is PKR {remaining_dues}. Thank you.\n{school_name}' },
    { id: 'TPL_REMINDER', name: 'Fee Reminder', content: 'Dear {father_name},\nThis is a friendly reminder that the school fee is due. Kindly clear the dues at your earliest convenience to avoid any late charges.'},
    { id: 'TPL_GENERAL', name: 'General Notice', content: 'Dear Parents,\nThis is to inform you that...' },
  ]
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
        // Merge with defaults to ensure all keys are present
        const mergedSettings = { ...defaultSettings, ...parsedSettings };
        setSettings(mergedSettings);
        
        // Apply theme colors on initial load
        if (mergedSettings.themeColors) {
            Object.entries(mergedSettings.themeColors).forEach(([key, value]) => {
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
