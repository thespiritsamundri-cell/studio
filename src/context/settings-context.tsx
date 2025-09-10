

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Grade, MessageTemplate } from '@/lib/types';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';


export interface SchoolSettings {
  schoolName: string;
  academicYear: string;
  schoolAddress: string;
  schoolPhone: string;
  schoolEmail: string;
  schoolLogo: string;
  favicon: string;
  principalSignature: string;
  whatsappApiUrl: string;
  whatsappApiKey: string;
  whatsappInstanceId: string;
  whatsappPriority: string;
  whatsappProvider: 'ultramsg' | 'official';
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

const defaultSettings: SchoolSettings = {
  schoolName: 'The Spirit School Samundri',
  academicYear: '2025-2026',
  schoolAddress: '123 Education Lane, Knowledge City, Pakistan',
  schoolPhone: '+92 300 1234567',
  schoolEmail: 'info@thespiritschool.edu.pk',
  schoolLogo: '/logo.png',
  favicon: '/logo.png',
  principalSignature: '',
  whatsappApiUrl: '',
  whatsappApiKey: '',
  whatsappInstanceId: '',
  whatsappPriority: '10',
  whatsappProvider: 'ultramsg',
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
  setSettings: React.Dispatch<React.SetStateAction<SchoolSettings>>;
}>({
  settings: defaultSettings,
  setSettings: () => {},
});

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<SchoolSettings>(defaultSettings);
  const [isInitialized, setIsInitialized] = useState(false);

  // Function to save only branding assets to Firestore
  const saveBrandingToFirestore = async (logoUrl: string, faviconUrl: string) => {
    try {
      const brandingRef = doc(db, 'branding', 'school-assets');
      await setDoc(brandingRef, { schoolLogo: logoUrl, favicon: faviconUrl }, { merge: true });
    } catch (error) {
      console.error("Failed to save branding assets to Firestore:", error);
    }
  };


  useEffect(() => {
    // Load all settings from localStorage and branding from Firestore
    const loadSettings = async () => {
      let combinedSettings = { ...defaultSettings };
      
      // 1. Load general settings from localStorage
      try {
        const savedSettings = localStorage.getItem('schoolSettings');
        if (savedSettings) {
          combinedSettings = { ...combinedSettings, ...JSON.parse(savedSettings) };
        }
      } catch (error) {
        console.error('Failed to parse settings from localStorage', error);
      }

      // 2. Load branding from Firestore, which overwrites local values
      try {
          const brandingRef = doc(db, 'branding', 'school-assets');
          const docSnap = await getDoc(brandingRef);
          if (docSnap.exists()) {
              const firestoreBranding = docSnap.data();
              combinedSettings.schoolLogo = firestoreBranding.schoolLogo || combinedSettings.schoolLogo;
              combinedSettings.favicon = firestoreBranding.favicon || combinedSettings.favicon;
          }
      } catch (error) {
          console.error("Failed to load branding from Firestore:", error);
      }
      
      setSettings(combinedSettings);
      setIsInitialized(true);
    };

    loadSettings();
  }, []);

  useEffect(() => {
    if (isInitialized) {
        // Save general settings to localStorage
        const { schoolLogo, favicon, ...otherSettings } = settings;
        localStorage.setItem('schoolSettings', JSON.stringify(otherSettings));

        // Save branding to Firestore
        saveBrandingToFirestore(schoolLogo, favicon);
    }
  }, [settings, isInitialized]);

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
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
