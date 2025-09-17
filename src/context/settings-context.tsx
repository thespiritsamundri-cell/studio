'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import type { Grade, MessageTemplate } from '@/lib/types';

import { onAuthStateChanged } from 'firebase/auth';

export interface SchoolSettings {
  schoolName: string;
  academicYear: string;
  schoolAddress: string;
  schoolPhone: string;
  schoolEmail: string;
  schoolLogo: string;
  favicon: string;
  principalSignature: string;

  // 🔹 UltraMSG
  whatsappApiUrl: string;
  whatsappInstanceId: string;
  whatsappApiKey: string;
  whatsappPriority: string;

  // 🔹 Official WhatsApp Business API
  whatsappPhoneNumberId?: string;
  whatsappAccessToken?: string;

  // 🔹 Common
  whatsappProvider?: 'ultramsg' | 'official' | 'none';
  whatsappConnectionStatus: 'untested' | 'connected' | 'failed';

  messageDelay: number;
  historyClearPin?: string;
  autoLockEnabled?: boolean;
  autoLockDuration?: number;
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
  schoolLogo: 'https://i.postimg.cc/Xv35Y5XZ/The-Spirit.jpg',
  favicon: 'https://i.postimg.cc/Xv35Y5XZ/The-Spirit.jpg',
  principalSignature: 'https://i.postimg.cc/XXXXXXX/signature.png',

  whatsappApiUrl: 'https://api.ultramsg.com/instance141491/',
  whatsappApiKey: '4e8f26fx3a2yi942',
  whatsappInstanceId: 'instance141491',
  whatsappPriority: '10',
  whatsappProvider: 'ultramsg',
  whatsappConnectionStatus: 'untested',
  whatsappPhoneNumberId: '',
  whatsappAccessToken: '',

  messageDelay: 2,
  historyClearPin: '1234',
  autoLockEnabled: true,
  autoLockDuration: 300,
  themeColors: {
    primary: '#6a3fdc',
    background: '#f0f2f5',
    accent: '#e9e1ff',
    'sidebar-background': '#2c2a4a',
    'sidebar-foreground': '#f8f9fa',
    'sidebar-accent': '#403d6d',
    'sidebar-accent-foreground': '#ffffff',
  },
  font: 'inter',

  gradingSystem: [
    { name: 'A+', minPercentage: 90 },
    { name: 'A', minPercentage: 80 },
    { name: 'B', minPercentage: 70 },
    { name: 'C', minPercentage: 60 },
    { name: 'D', minPercentage: 50 },
    { name: 'F', minPercentage: 0 },
  ],

  expenseCategories: [
    'Salaries',
    'Utilities',
    'Rent',
    'Maintenance',
    'Supplies',
    'Marketing',
    'Transportation',
    'Miscellaneous',
  ],

  messageTemplates: [
    {
      id: '1',
      name: 'Absentee Notice',
      content:
        'Dear {father_name}, your child {student_name} of class {class} is absent from school today. Please contact us.',
    },
    {
      id: '2',
      name: 'Fee Payment Receipt',
      content:
        'Dear {father_name}, a fee payment of PKR {paid_amount} has been received. Your remaining balance is now PKR {remaining_dues}. Thank you!',
    },
    {
      id: '3',
      name: 'Admission Confirmation',
      content:
        'Welcome to {school_name}! We are delighted to confirm the admission of {student_name} in Class {class}.',
    },
    {
      id: '4',
      name: 'Student Deactivation Notice',
      content:
        'Dear {father_name}, your child, {student_name}, has been marked inactive due to 3 or more absences this month. Please contact the school office to discuss this matter.',
    },
    {
      id: '5',
      name: 'Teacher Deactivation Notice',
      content:
        'Dear {teacher_name}, your status has been set to Inactive due to your attendance record. Please contact the principal.',
    },
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
  isSettingsInitialized: boolean;
}>({
  settings: defaultSettings,
  setSettings: () => {},
  isSettingsInitialized: false,
});

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettingsState] = useState<SchoolSettings>(defaultSettings);
  const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    let unsubscribeDb: (() => void) | undefined;

    if (isLoggedIn) {
      const settingsDocRef = doc(db, 'Settings', 'School Settings');
      unsubscribeDb = onSnapshot(settingsDocRef, (doc) => {
        if (doc.exists()) {
          const dbSettings = doc.data() as Partial<SchoolSettings>;
          setSettingsState(prev => ({ ...defaultSettings, ...prev, ...dbSettings }));
        } else {
          setDoc(settingsDocRef, defaultSettings);
        }
        setIsSettingsInitialized(true);
      }, (error) => {
        console.error("Error fetching settings from Firestore:", error);
        setIsSettingsInitialized(true);
      });
    } else {
      setSettingsState(defaultSettings);
      setIsSettingsInitialized(true);
    }
    
    return () => {
      if (unsubscribeDb) {
        unsubscribeDb();
      }
    };
  }, [isLoggedIn]);

  const handleSetSettings = (newSettings: React.SetStateAction<SchoolSettings>) => {
    const updatedSettings = typeof newSettings === 'function' ? newSettings(settings) : newSettings;
    
    setSettingsState(updatedSettings);
    
    if(isLoggedIn) {
        const settingsDocRef = doc(db, 'Settings', 'School Settings');
        setDoc(settingsDocRef, updatedSettings, { merge: true }).catch(error => {
            console.error("Failed to save settings to Firestore:", error);
        });
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, setSettings: handleSetSettings, isSettingsInitialized }}>
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
};
