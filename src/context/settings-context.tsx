
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import type { Grade, MessageTemplate } from '@/lib/types';

export interface SchoolSettings {
  schoolName: string;
  academicYear: string;
  schoolAddress: string;
  schoolPhone: string;
  schoolEmail: string;
  schoolLogo: string;
  favicon: string;
  principalSignature: string;
  // For UltraMSG
  whatsappApiUrl: string;
  whatsappInstanceId: string;
  whatsappApiKey: string; // Token for UltraMSG
  whatsappPriority: string;
  // For Official WhatsApp Business API
  whatsappPhoneNumberId?: string;
  whatsappAccessToken?: string;
  
  whatsappProvider: 'ultramsg' | 'official';
  whatsappActive: boolean; // Main toggle for WhatsApp functionality
  whatsappConnectionStatus: 'untested' | 'connected' | 'failed';
  messageDelay: number;
  historyClearPin?: string;
  autoLockEnabled?: boolean;
  autoLockDuration?: number; // in seconds
  themeColors?: { [key: string]: string };
  font: 'inter' | 'roboto' | 'open-sans' | 'lato' | 'montserrat' | 'poppins';
  gradingSystem: Grade[];
  expenseCategories: string[];
  messageTemplates?: MessageTemplate[];
  automatedMessages?: {
    admission: { enabled: boolean; templateId: string };
    absentee: { enabled: boolean; templateId: string };
    payment: { enabled: boolean; templateId: string };
    studentDeactivation: { enabled: boolean; templateId: string };
    teacherDeactivation: { enabled: boolean; templateId: string };
  };
  autofillLogin?: boolean;
  preloaderEnabled?: boolean;
  preloaderStyle?: string;
}

export const defaultSettings: SchoolSettings = {
  schoolName: 'The Spirit School Samundri',
  academicYear: '2025-2026',
  schoolAddress: '123 Education Lane, Knowledge City, Pakistan',
  schoolPhone: '+92 309 9969535',
  schoolEmail: 'info@thespiritschool.edu.pk',
  schoolLogo: 'https://firebasestorage.googleapis.com/v0/b/educentral-mxfgr.appspot.com/o/settings%2FschoolLogo%2Flogo.png?alt=media&token=e1f06b6f-7f6a-4565-b17a-8b9a07106517',
  favicon: 'https://firebasestorage.googleapis.com/v0/b/educentral-mxfgr.appspot.com/o/settings%2Ffavicon%2Ffavicon.ico?alt=media&token=48c8b4a2-996a-4523-832f-410a3c26b527',
  principalSignature: 'https://firebasestorage.googleapis.com/v0/b/educentral-mxfgr.appspot.com/o/settings%2FprincipalSignature%2Fsignature.png?alt=media&token=8a5c3789-9a74-4b53-8b5e-404391694f8d',
  whatsappApiUrl: 'https://api.ultramsg.com',
  whatsappApiKey: '4e8f26fx3a2yi942',
  whatsappInstanceId: 'instance141491',
  whatsappPriority: '10',
  whatsappProvider: 'ultramsg',
  whatsappActive: true,
  whatsappConnectionStatus: 'untested',
  messageDelay: 2,
  historyClearPin: '1234',
  autoLockEnabled: true,
  autoLockDuration: 300,
  themeColors: {},
  font: 'inter',
  gradingSystem: [
    { name: 'A+', minPercentage: 90 },
    { name: 'A', minPercentage: 80 },
    { name: 'B', minPercentage: 70 },
    { name: 'C', minPercentage: 60 },
    { name: 'D', minPercentage: 50 },
    { name: 'F', minPercentage: 0 },
  ],
  expenseCategories: ['Salaries', 'Utilities', 'Rent', 'Maintenance', 'Supplies', 'Marketing', 'Transportation', 'Miscellaneous'],
  messageTemplates: [
    { id: '1', name: 'Absentee Notice', content: 'Dear {father_name}, your child {student_name} of class {class} is absent from school today. Please contact us.' },
    { id: '2', name: 'Fee Payment Receipt', content: "Dear {father_name}, a fee payment of PKR {paid_amount} has been received. Your remaining balance is now PKR {remaining_dues}. Thank you!" },
    { id: '3', name: 'Admission Confirmation', content: 'Welcome to {school_name}! We are delighted to confirm the admission of {student_name} in Class {class}.' },
    { id: '4', name: 'Student Deactivation Notice', content: 'Dear {father_name}, your child, {student_name}, has been marked inactive due to 3 or more absences this month. Please contact the school office to discuss this matter.'},
    { id: '5', name: 'Teacher Deactivation Notice', content: 'Dear {teacher_name}, your status has been set to Inactive due to your attendance record. Please contact the principal.'}
  ],
  automatedMessages: {
    admission: { enabled: true, templateId: '3' },
    absentee: { enabled: true, templateId: '1' },
    payment: { enabled: true, templateId: '2' },
    studentDeactivation: { enabled: true, templateId: '4' },
    teacherDeactivation: { enabled: true, templateId: '5' },
  },
  autofillLogin: true,
  preloaderEnabled: true,
  preloaderStyle: 'style2',
};

export const SettingsContext = createContext<{
  settings: SchoolSettings;
  setSettings: (newSettings: React.SetStateAction<SchoolSettings>) => void;
}>({
  settings: defaultSettings,
  setSettings: () => {},
});

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettingsState] = useState<SchoolSettings>(defaultSettings);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const settingsDocRef = doc(db, 'Settings', 'School Settings');
    const unsubscribe = onSnapshot(settingsDocRef, (doc) => {
      if (doc.exists()) {
        const dbSettings = doc.data() as Partial<SchoolSettings>;
        // Merge with defaults to ensure all keys are present
        setSettingsState(prev => ({ ...defaultSettings, ...prev, ...dbSettings }));
      } else {
        // If no settings in DB, use defaults and save them.
        setDoc(settingsDocRef, defaultSettings);
      }
      setIsInitialized(true);
    }, (error) => {
      console.error("Error fetching settings from Firestore:", error);
      // Fallback to local storage or defaults if Firestore fails
      try {
        const savedSettings = localStorage.getItem('schoolSettings');
        if (savedSettings) {
            setSettingsState(JSON.parse(savedSettings));
        }
      } catch (localError) {
        console.error("Could not read from localStorage either:", localError);
      }
       setIsInitialized(true);
    });

    return () => unsubscribe();
  }, []);

  const handleSetSettings = (newSettings: React.SetStateAction<SchoolSettings>) => {
    const updatedSettings = typeof newSettings === 'function' ? newSettings(settings) : newSettings;
    
    // Set state locally immediately for responsiveness
    setSettingsState(updatedSettings);

    // Save to Firestore
    const settingsDocRef = doc(db, 'Settings', 'School Settings');
    setDoc(settingsDocRef, updatedSettings, { merge: true }).catch(error => {
        console.error("Failed to save settings to Firestore:", error);
    });
    
    // Also save to localStorage as a fallback/for offline
    try {
        localStorage.setItem('schoolSettings', JSON.stringify(updatedSettings));
    } catch (e) {
        console.warn("Could not save settings to localStorage:", e);
    }
  };
  
  if (!isInitialized) {
      return null;
  }

  return (
    <SettingsContext.Provider value={{ settings, setSettings: handleSetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
