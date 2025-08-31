
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SchoolSettings {
  schoolName: string;
  schoolAddress: string;
  schoolPhone: string;
  schoolLogo: string;
  academicYear: string;
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
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SchoolSettings>(() => {
    // Lazy initialization from localStorage
    if (typeof window === 'undefined') {
      return defaultSettings;
    }
    try {
      const savedSettings = window.localStorage.getItem('schoolSettings');
      return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
    } catch (error) {
      console.error('Error reading from localStorage', error);
      return defaultSettings;
    }
  });

  useEffect(() => {
    // Persist to localStorage whenever settings change
    try {
      window.localStorage.setItem('schoolSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error writing to localStorage', error);
    }
  }, [settings]);

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
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
