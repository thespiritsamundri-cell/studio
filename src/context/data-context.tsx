
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
  addFamily: (family: Family) => void;
  addFee: (fee: Fee) => void;
  updateFee: (id: string, fee: Fee) => void;
  loadData: (data: { students: Student[], families: Family[], fees: Fee[] }) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [families, setFamilies] = useState<Family[]>(initialFamilies);
  const [fees, setFees] = useState<Fee[]>(initialFees);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const savedStudents = window.localStorage.getItem('schoolStudents');
      const savedFamilies = window.localStorage.getItem('schoolFamilies');
      const savedFees = window.localStorage.getItem('schoolFees');
      
      if (savedStudents) setStudents(JSON.parse(savedStudents));
      if (savedFamilies) setFamilies(JSON.parse(savedFamilies));
      if (savedFees) setFees(JSON.parse(savedFees));
    } catch (error) {
      console.error('Error reading from localStorage', error);
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

  const addFamily = (family: Family) => {
    setFamilies(prev => [...prev, family]);
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
      addFamily, 
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
