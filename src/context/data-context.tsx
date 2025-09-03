

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Student, Family, Fee, Teacher, TeacherAttendance, Class, Exam, ActivityLog, Expense, Timetable, TimetableData } from '@/lib/types';
import { students as initialStudents, families as initialFamilies, fees as initialFees, teachers as initialTeachers, teacherAttendances as initialTeacherAttendances, classes as initialClasses, exams as initialExams, expenses as initialExpenses, timetables as initialTimetables } from '@/lib/data';

interface DataContextType {
  students: Student[];
  families: Family[];
  fees: Fee[];
  teachers: Teacher[];
  teacherAttendances: TeacherAttendance[];
  classes: Class[];
  exams: Exam[];
  activityLog: ActivityLog[];
  expenses: Expense[];
  timetables: Timetable[];
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
  addExam: (exam: Exam) => void;
  updateExam: (id: string, exam: Exam) => void;
  deleteExam: (id: string) => void;
  addActivityLog: (activity: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  addExpense: (expense: Expense) => void;
  updateExpense: (id: string, expense: Expense) => void;
  deleteExpense: (id: string) => void;
  updateTimetable: (classId: string, data: TimetableData, timeSlots?: string[], breakAfterPeriod?: number, breakDuration?: string) => void;
  loadData: (data: { students: Student[], families: Family[], fees: Fee[], teachers: Teacher[], teacherAttendances: TeacherAttendance[], classes: Class[], exams: Exam[], expenses: Expense[], timetables?: Timetable[], activityLog?: ActivityLog[] }) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teacherAttendances, setTeacherAttendances] = useState<TeacherAttendance[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [timetables, setTimetables] = useState<Timetable[]>([]);
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
      const savedExams = window.localStorage.getItem('schoolExams');
      const savedActivityLog = window.localStorage.getItem('schoolActivityLog');
      const savedExpenses = window.localStorage.getItem('schoolExpenses');
      const savedTimetables = window.localStorage.getItem('schoolTimetables');
      
      setStudents(savedStudents ? JSON.parse(savedStudents) : initialStudents);
      setFamilies(savedFamilies ? JSON.parse(savedFamilies) : initialFamilies);
      setFees(savedFees ? JSON.parse(savedFees) : initialFees);
      setTeachers(savedTeachers ? JSON.parse(savedTeachers) : initialTeachers);
      setTeacherAttendances(savedTeacherAttendances ? JSON.parse(savedTeacherAttendances) : initialTeacherAttendances);
      setClasses(savedClasses ? JSON.parse(savedClasses) : initialClasses);
      setExams(savedExams ? JSON.parse(savedExams) : initialExams);
      setActivityLog(savedActivityLog ? JSON.parse(savedActivityLog) : []);
      setExpenses(savedExpenses ? JSON.parse(savedExpenses) : initialExpenses);
      setTimetables(savedTimetables ? JSON.parse(savedTimetables) : initialTimetables);

    } catch (error) {
      console.error('Error reading from localStorage', error);
      // Set initial data if localStorage fails
      setStudents(initialStudents);
      setFamilies(initialFamilies);
      setFees(initialFees);
      setTeachers(initialTeachers);
      setTeacherAttendances(initialTeacherAttendances);
      setClasses(initialClasses);
      setExams(initialExams);
      setActivityLog([]);
      setExpenses(initialExpenses);
      setTimetables(initialTimetables);
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
        window.localStorage.setItem('schoolExams', JSON.stringify(exams));
        window.localStorage.setItem('schoolActivityLog', JSON.stringify(activityLog));
        window.localStorage.setItem('schoolExpenses', JSON.stringify(expenses));
        window.localStorage.setItem('schoolTimetables', JSON.stringify(timetables));
      } catch (error) {
        console.error('Error writing to localStorage', error);
      }
    }
  }, [students, families, fees, teachers, teacherAttendances, classes, exams, activityLog, expenses, timetables, isClient]);

  const addActivityLog = (activity: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    const newLogEntry: ActivityLog = {
      ...activity,
      id: `LOG-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    setActivityLog(prev => [newLogEntry, ...prev].slice(0, 200)); // Keep last 200 logs
  };

  const addStudent = (student: Student) => {
    setStudents(prev => [...prev, student]);
    addActivityLog({ user: 'Admin', action: 'Add Student', description: `Admitted new student: ${student.name} (ID: ${student.id}) in Class ${student.class}.` });
  };
  const updateStudent = (id: string, updatedStudent: Student) => {
    setStudents(prev => prev.map(s => s.id === id ? updatedStudent : s));
    addActivityLog({ user: 'Admin', action: 'Update Student', description: `Updated details for student: ${updatedStudent.name} (ID: ${id}).` });
  };
  const deleteStudent = (id: string) => {
    const student = students.find(s => s.id === id);
    setStudents(prev => prev.filter(s => s.id !== id));
    if (student) {
        addActivityLog({ user: 'Admin', action: 'Delete Student', description: `Deleted student: ${student.name} (ID: ${id}).` });
    }
  };

  const addFamily = (family: Family) => {
    setFamilies(prev => [...prev, family]);
    addActivityLog({ user: 'Admin', action: 'Add Family', description: `Added new family: ${family.fatherName} (ID: ${family.id}).` });
  };
  const updateFamily = (id: string, updatedFamily: Family) => {
    setFamilies(prev => prev.map(f => f.id === id ? updatedFamily : f));
     addActivityLog({ user: 'Admin', action: 'Update Family', description: `Updated details for family: ${updatedFamily.fatherName} (ID: ${id}).` });
  };
  const deleteFamily = (id: string) => {
    const family = families.find(f => f.id === id);
    setFamilies(prev => prev.filter(f => f.id !== id));
    setStudents(prev => prev.filter(s => s.familyId !== id));
    setFees(prev => prev.filter(f => f.familyId !== id));
    if (family) {
        addActivityLog({ user: 'Admin', action: 'Delete Family', description: `Deleted family: ${family.fatherName} (ID: ${id}) and all associated data.` });
    }
  };
  
  const addFee = (fee: Fee) => {
    setFees(prev => [...prev, fee]);
    if (fee.status === 'Paid') {
        const family = families.find(f => f.id === fee.familyId);
        addActivityLog({ user: 'Admin', action: 'Collect Fee', description: `Collected PKR ${fee.amount} from family ${family?.fatherName} (${fee.familyId}) for ${fee.month}.` });
    }
  };
  const updateFee = (id: string, updatedFee: Fee) => setFees(prev => prev.map(f => f.id === id ? updatedFee : f));
  const deleteFee = (id: string) => setFees(prev => prev.filter(f => f.id !== id));

  const addTeacher = (teacher: Teacher) => {
    setTeachers(prev => [...prev, teacher]);
    addActivityLog({ user: 'Admin', action: 'Add Teacher', description: `Added new teacher: ${teacher.name}.` });
  };
  const updateTeacher = (id: string, updatedTeacher: Teacher) => {
    setTeachers(prev => prev.map(t => t.id === id ? updatedTeacher : t));
    addActivityLog({ user: 'Admin', action: 'Update Teacher', description: `Updated details for teacher: ${updatedTeacher.name}.` });
  };
  const deleteTeacher = (id: string) => {
    const teacher = teachers.find(t => t.id === id);
    setTeachers(prev => prev.filter(t => t.id !== id));
    if (teacher) {
       addActivityLog({ user: 'Admin', action: 'Delete Teacher', description: `Deleted teacher: ${teacher.name}.` });
    }
  };
  
  const saveTeacherAttendance = (newAttendances: TeacherAttendance[]) => {
    const date = newAttendances[0]?.date;
    if (!date) return;
    
    setTeacherAttendances(prev => {
        const otherDateAttendances = prev.filter(att => att.date !== date);
        return [...otherDateAttendances, ...newAttendances];
    });
    addActivityLog({ user: 'Admin', action: 'Save Teacher Attendance', description: `Saved teacher attendance for date: ${date}.` });
  }

  const addClass = (newClass: Class) => {
    setClasses(prev => [...prev, newClass]);
    addActivityLog({ user: 'Admin', action: 'Add Class', description: `Created new class: ${newClass.name}.` });
  };
  const updateClass = (id: string, updatedClass: Class) => {
    setClasses(prev => prev.map(c => c.id === id ? updatedClass : c));
    addActivityLog({ user: 'Admin', action: 'Update Class', description: `Updated class: ${updatedClass.name}.` });
  };
  const deleteClass = (id: string) => {
    const classToDelete = classes.find(c => c.id === id);
    setClasses(prev => prev.filter(c => c.id !== id));
    if(classToDelete) {
        addActivityLog({ user: 'Admin', action: 'Delete Class', description: `Deleted class: ${classToDelete.name}.` });
    }
  };
  
  const addExam = (exam: Exam) => {
    setExams(prev => [...prev, exam]);
    addActivityLog({ user: 'Admin', action: 'Create Exam', description: `Created exam "${exam.name}" for class ${exam.class}.` });
  };
  const updateExam = (id: string, updatedExam: Exam) => {
    setExams(prev => prev.map(e => e.id === id ? updatedExam : e));
    addActivityLog({ user: 'Admin', action: 'Save Exam Results', description: `Saved results for exam: ${updatedExam.name} (${updatedExam.class}).` });
  };
  const deleteExam = (id: string) => {
    const exam = exams.find(e => e.id === id);
    setExams(prev => prev.filter(e => e.id !== id));
    if (exam) {
        addActivityLog({ user: 'Admin', action: 'Delete Exam', description: `Deleted exam: ${exam.name} (${exam.class}).` });
    }
  };

  const addExpense = (expense: Expense) => {
    setExpenses(prev => [...prev, expense]);
    addActivityLog({ user: 'Admin', action: 'Add Expense', description: `Added expense of PKR ${expense.amount} for ${expense.category}: ${expense.description}.` });
  };
  const updateExpense = (id: string, updatedExpense: Expense) => {
    setExpenses(prev => prev.map(e => e.id === id ? updatedExpense : e));
    addActivityLog({ user: 'Admin', action: 'Update Expense', description: `Updated expense for ${updatedExpense.category}.` });
  };
  const deleteExpense = (id: string) => {
    const expense = expenses.find(e => e.id === id);
    setExpenses(prev => prev.filter(e => e.id !== id));
     if (expense) {
        addActivityLog({ user: 'Admin', action: 'Delete Expense', description: `Deleted expense of PKR ${expense.amount} for ${expense.category}.` });
    }
  };

  const updateTimetable = (classId: string, data: TimetableData, timeSlots?: string[], breakAfterPeriod?: number, breakDuration?: string) => {
    setTimetables(prev => {
        const existing = prev.find(t => t.classId === classId);
        if (existing) {
            return prev.map(t => t.classId === classId ? { ...t, data, timeSlots, breakAfterPeriod, breakDuration } : t);
        }
        return [...prev, { classId, data, timeSlots, breakAfterPeriod, breakDuration }];
    });
    const className = classes.find(c => c.id === classId)?.name || classId;
    addActivityLog({ user: 'Admin', action: 'Update Timetable', description: `Updated timetable for class ${className}.` });
  };

  const loadData = (data: { students: Student[], families: Family[], fees: Fee[], teachers: Teacher[], teacherAttendances: TeacherAttendance[], classes: Class[], exams: Exam[], expenses: Expense[], timetables?: Timetable[], activityLog?: ActivityLog[] }) => {
    setStudents(data.students || []);
    setFamilies(data.families || []);
    setFees(data.fees || []);
    setTeachers(data.teachers || []);
    setTeacherAttendances(data.teacherAttendances || []);
    setClasses(data.classes || []);
    setExams(data.exams || []);
    setExpenses(data.expenses || []);
    setTimetables(data.timetables || []);
    setActivityLog(data.activityLog || []);
    addActivityLog({ user: 'Admin', action: 'Restore Backup', description: 'Restored all application data from a backup file.' });
  };

  const contextValue = React.useMemo(() => ({ 
      students, 
      families, 
      fees,
      teachers,
      teacherAttendances,
      classes,
      exams,
      activityLog,
      expenses,
      timetables,
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
      addExam,
      updateExam,
      deleteExam,
      addActivityLog,
      addExpense,
      updateExpense,
      deleteExpense,
      updateTimetable,
      loadData 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [students, families, fees, teachers, teacherAttendances, classes, exams, activityLog, expenses, timetables]);


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
