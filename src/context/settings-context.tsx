
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Grade, MessageTemplate } from '@/lib/types';
import {
  students as initialStudents,
  families as initialFamilies,
  fees as initialFees,
  teachers as initialTeachers,
  teacherAttendances as initialTeacherAttendances,
  classes as initialClasses,
  exams as initialExams,
  expenses as initialExpenses,
  timetables as initialTimetables
} from '@/lib/data';

export interface SchoolSettings {
  schoolName: string;
  academicYear: string;
  schoolAddress: string;
  schoolPhone: string;
  schoolLogo: string;
  favicon: string;
  whatsappApiUrl: string;
  whatsappApiKey: string;
  whatsappInstanceId: string;
  whatsappPriority: string;
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
  };
  autofillLogin?: boolean;
}

const defaultSettings: SchoolSettings = {
  schoolName: 'The Spirit School Samundri',
  academicYear: '2025-2026',
  schoolAddress: '123 Education Lane, Knowledge City, Pakistan',
  schoolPhone: '+92 300 1234567',
  schoolLogo: '/logo.png',
  favicon: '/favicon.ico',
  whatsappApiUrl: '',
  whatsappApiKey: '',
  whatsappInstanceId: '',
  whatsappPriority: '10',
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
    { id: '2', name: 'Fee Reminder', content: "Dear {father_name}, this is a reminder that your child's fee is due. Total amount: {total_dues}." },
    { id: '3', name: 'Admission Confirmation', content: 'Welcome to {school_name}! We are delighted to confirm the admission of {student_name} in Class {class}.' }
  ],
  automatedMessages: {
    admission: { enabled: true, templateId: '3' },
    absentee: { enabled: true, templateId: '1' },
    payment: { enabled: true, templateId: '2' },
  },
  autofillLogin: true,
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

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('schoolSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (error) {
      console.error('Failed to parse settings from localStorage', error);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('schoolSettings', JSON.stringify(settings));
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
