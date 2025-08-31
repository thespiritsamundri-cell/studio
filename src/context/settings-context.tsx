
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
  const [settings, setSettings] = useState<SchoolSettings>(defaultSettings);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const savedSettings = window.localStorage.getItem('schoolSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error reading from localStorage', error);
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      try {
        window.localStorage.setItem('schoolSettings', JSON.stringify(settings));
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
