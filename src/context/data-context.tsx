
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Student, Family, Fee, Teacher, TeacherAttendance, Class } from '@/lib/types';
import { students as initialStudents, families as initialFamilies, fees as initialFees, teachers as initialTeachers, teacherAttendances as initialTeacherAttendances, classes as initialClasses } from '@/lib/data';

interface DataContextType {
  students: Student[];
  families: Family[];
  fees: Fee[];
  teachers: Teacher[];
  teacherAttendances: TeacherAttendance[];
  classes: Class[];
  addStudent: (student: Student) => void;
  updateStudent: (id: string, student: Student) => void;
  deleteStudent: (id: string) => void;
  addFamily: (family: Family) => void;
  updateFamily: (id: string, family: Family) => void;
  deleteFamily: (id: string) => void;
  addFee: (fee: Fee) => void;
  updateFee: (id: string, fee: Fee) => void;
  deleteFee: (id: string) => void;
  addTeacher: (teacher: Teacher) => void;
  updateTeacher: (id: string, teacher: Teacher) => void;
  deleteTeacher: (id: string) => void;
  saveTeacherAttendance: (attendances: TeacherAttendance[]) => void;
  addClass: (newClass: Class) => void;
  updateClass: (id: string, updatedClass: Class) => void;
  deleteClass: (id: string) => void;
  loadData: (data: { students: Student[], families: Family[], fees: Fee[], teachers: Teacher[], teacherAttendances: TeacherAttendance[], classes: Class[] }) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teacherAttendances, setTeacherAttendances] = useState<TeacherAttendance[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const savedStudents = window.localStorage.getItem('schoolStudents');
      const savedFamilies = window.localStorage.getItem('schoolFamilies');
      const savedFees = window.localStorage.getItem('schoolFees');
      const savedTeachers = window.localStorage.getItem('schoolTeachers');
      const savedTeacherAttendances = window.localStorage.getItem('schoolTeacherAttendances');
      const savedClasses = window.localStorage.getItem('schoolClasses');
      
      setStudents(savedStudents ? JSON.parse(savedStudents) : initialStudents);
      setFamilies(savedFamilies ? JSON.parse(savedFamilies) : initialFamilies);
      setFees(savedFees ? JSON.parse(savedFees) : initialFees);
      setTeachers(savedTeachers ? JSON.parse(savedTeachers) : initialTeachers);
      setTeacherAttendances(savedTeacherAttendances ? JSON.parse(savedTeacherAttendances) : initialTeacherAttendances);
      setClasses(savedClasses ? JSON.parse(savedClasses) : initialClasses);

    } catch (error) {
      console.error('Error reading from localStorage', error);
      // Set initial data if localStorage fails
      setStudents(initialStudents);
      setFamilies(initialFamilies);
      setFees(initialFees);
      setTeachers(initialTeachers);
      setTeacherAttendances(initialTeacherAttendances);
      setClasses(initialClasses);
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      try {
        window.localStorage.setItem('schoolStudents', JSON.stringify(students));
        window.localStorage.setItem('schoolFamilies', JSON.stringify(families));
        window.localStorage.setItem('schoolFees', JSON.stringify(fees));
        window.localStorage.setItem('schoolTeachers', JSON.stringify(teachers));
        window.localStorage.setItem('schoolTeacherAttendances', JSON.stringify(teacherAttendances));
        window.localStorage.setItem('schoolClasses', JSON.stringify(classes));
      } catch (error) {
        console.error('Error writing to localStorage', error);
      }
    }
  }, [students, families, fees, teachers, teacherAttendances, classes, isClient]);

  const addStudent = (student: Student) => setStudents(prev => [...prev, student]);
  const updateStudent = (id: string, updatedStudent: Student) => setStudents(prev => prev.map(s => s.id === id ? updatedStudent : s));
  const deleteStudent = (id: string) => setStudents(prev => prev.filter(s => s.id !== id));

  const addFamily = (family: Family) => setFamilies(prev => [...prev, family]);
  const updateFamily = (id: string, updatedFamily: Family) => setFamilies(prev => prev.map(f => f.id === id ? updatedFamily : f));
  const deleteFamily = (id: string) => {
    setFamilies(prev => prev.filter(f => f.id !== id));
    setStudents(prev => prev.filter(s => s.familyId !== id));
    setFees(prev => prev.filter(f => f.familyId !== id));
  };
  
  const addFee = (fee: Fee) => setFees(prev => [...prev, fee]);
  const updateFee = (id: string, updatedFee: Fee) => setFees(prev => prev.map(f => f.id === id ? updatedFee : f));
  const deleteFee = (id: string) => setFees(prev => prev.filter(f => f.id !== id));

  const addTeacher = (teacher: Teacher) => setTeachers(prev => [...prev, teacher]);
  const updateTeacher = (id: string, updatedTeacher: Teacher) => setTeachers(prev => prev.map(t => t.id === id ? updatedTeacher : t));
  const deleteTeacher = (id: string) => setTeachers(prev => prev.filter(t => t.id !== id));
  
  const saveTeacherAttendance = (newAttendances: TeacherAttendance[]) => {
    const date = newAttendances[0]?.date;
    if (!date) return;
    
    setTeacherAttendances(prev => {
        const otherDateAttendances = prev.filter(att => att.date !== date);
        return [...otherDateAttendances, ...newAttendances];
    });
  }

  const addClass = (newClass: Class) => setClasses(prev => [...prev, newClass]);
  const updateClass = (id: string, updatedClass: Class) => setClasses(prev => prev.map(c => c.id === id ? updatedClass : c));
  const deleteClass = (id: string) => setClasses(prev => prev.filter(c => c.id !== id));

  const loadData = (data: { students: Student[], families: Family[], fees: Fee[], teachers: Teacher[], teacherAttendances: TeacherAttendance[], classes: Class[] }) => {
    setStudents(data.students || []);
    setFamilies(data.families || []);
    setFees(data.fees || []);
    setTeachers(data.teachers || []);
    setTeacherAttendances(data.teacherAttendances || []);
    setClasses(data.classes || []);
  };

  const contextValue = React.useMemo(() => ({ 
      students, 
      families, 
      fees,
      teachers,
      teacherAttendances,
      classes,
      addStudent,
      updateStudent, 
      deleteStudent,
      addFamily,
      updateFamily, 
      deleteFamily,
      addFee,
      updateFee,
      deleteFee,
      addTeacher,
      updateTeacher,
      deleteTeacher,
      saveTeacherAttendance,
      addClass,
      updateClass,
      deleteClass,
      loadData 
    }), [students, families, fees, teachers, teacherAttendances, classes]);


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
