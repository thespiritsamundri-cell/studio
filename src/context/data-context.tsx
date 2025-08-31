
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Student, Family, Fee } from '@/lib/types';
import { students as initialStudents, families as initialFamilies, fees as initialFees } from '@/lib/data';

interface DataContextType {
  students: Student[];
  families: Family[];
  fees: Fee[];
  addStudent: (student: Student) => void;
  updateStudent: (id: string, student: Student) => void;
  deleteStudent: (id: string) => void;
  addFamily: (family: Family) => void;
  updateFamily: (id: string, family: Family) => void;
  deleteFamily: (id: string) => void;
  addFee: (fee: Fee) => void;
  updateFee: (id: string, fee: Fee) => void;
  loadData: (data: { students: Student[], families: Family[], fees: Fee[] }) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const savedStudents = window.localStorage.getItem('schoolStudents');
      const savedFamilies = window.localStorage.getItem('schoolFamilies');
      const savedFees = window.localStorage.getItem('schoolFees');
      
      setStudents(savedStudents ? JSON.parse(savedStudents) : initialStudents);
      setFamilies(savedFamilies ? JSON.parse(savedFamilies) : initialFamilies);
      setFees(savedFees ? JSON.parse(savedFees) : initialFees);
    } catch (error) {
      console.error('Error reading from localStorage', error);
      // Set initial data if localStorage fails
      setStudents(initialStudents);
      setFamilies(initialFamilies);
      setFees(initialFees);
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      try {
        window.localStorage.setItem('schoolStudents', JSON.stringify(students));
        window.localStorage.setItem('schoolFamilies', JSON.stringify(families));
        window.localStorage.setItem('schoolFees', JSON.stringify(fees));
      } catch (error) {
        console.error('Error writing to localStorage', error);
      }
    }
  }, [students, families, fees, isClient]);

  const addStudent = (student: Student) => {
    setStudents(prev => [...prev, student]);
  };
  
  const updateStudent = (id: string, updatedStudent: Student) => {
    setStudents(prev => prev.map(s => s.id === id ? updatedStudent : s));
  };
  
  const deleteStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
  };

  const addFamily = (family: Family) => {
    setFamilies(prev => [...prev, family]);
  };

  const updateFamily = (id: string, updatedFamily: Family) => {
    setFamilies(prev => prev.map(f => f.id === id ? updatedFamily : f));
  };

  const deleteFamily = (id: string) => {
    setFamilies(prev => prev.filter(f => f.id !== id));
    // Also delete students and fees associated with this family
    setStudents(prev => prev.filter(s => s.familyId !== id));
    setFees(prev => prev.filter(f => f.familyId !== id));
  };
  
  const addFee = (fee: Fee) => {
    setFees(prev => [...prev, fee]);
  };

  const updateFee = (id: string, updatedFee: Fee) => {
    setFees(prev => prev.map(f => f.id === id ? updatedFee : f));
  }

  const loadData = (data: { students: Student[], families: Family[], fees: Fee[] }) => {
    setStudents(data.students);
    setFamilies(data.families);
    setFees(data.fees);
  };

  const contextValue = React.useMemo(() => ({ 
      students, 
      families, 
      fees, 
      addStudent,
      updateStudent, 
      deleteStudent,
      addFamily,
      updateFamily, 
      deleteFamily,
      addFee,
      updateFee,
      loadData 
    }), [students, families, fees]);


  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

    