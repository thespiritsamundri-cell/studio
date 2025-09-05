

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, writeBatch, query, where, getDocs, setDoc } from 'firebase/firestore';
import type { Student, Family, Fee, Teacher, TeacherAttendance, Class, Exam, ActivityLog, Expense, Timetable, TimetableData } from '@/lib/types';
import { students as initialStudents, families as initialFamilies, fees as initialFees, teachers as initialTeachers, teacherAttendances as initialTeacherAttendances, classes as initialClasses, exams as initialExams, expenses as initialExpenses, timetables as initialTimetables } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';


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
  addStudent: (student: Omit<Student, 'id'>) => Promise<void>;
  updateStudent: (id: string, student: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  addFamily: (family: Omit<Family, 'id'>) => Promise<void>;
  updateFamily: (id: string, family: Partial<Family>) => Promise<void>;
  deleteFamily: (id: string) => Promise<void>;
  addFee: (fee: Omit<Fee, 'id'>) => Promise<void>;
  updateFee: (id: string, fee: Partial<Fee>) => Promise<void>;
  deleteFee: (id: string) => Promise<void>;
  addTeacher: (teacher: Omit<Teacher, 'id'>) => Promise<void>;
  updateTeacher: (id: string, teacher: Partial<Teacher>) => Promise<void>;
  deleteTeacher: (id: string) => Promise<void>;
  saveTeacherAttendance: (attendances: TeacherAttendance[]) => Promise<void>;
  addClass: (newClass: Omit<Class, 'id'>) => Promise<void>;
  updateClass: (id: string, updatedClass: Partial<Class>) => Promise<void>;
  deleteClass: (id: string) => Promise<void>;
  addExam: (exam: Omit<Exam, 'id'>) => Promise<void>;
  updateExam: (id: string, exam: Partial<Exam>) => Promise<void>;
  deleteExam: (id: string) => Promise<void>;
  addActivityLog: (activity: Omit<ActivityLog, 'id' | 'timestamp'>) => Promise<void>;
  clearActivityLog: () => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  updateTimetable: (classId: string, data: TimetableData, timeSlots?: string[], breakAfterPeriod?: number, breakDuration?: string) => Promise<void>;
  loadData: (data: any) => Promise<void>;
  seedDatabase: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const collections = {
      students: setStudents,
      families: setFamilies,
      fees: setFees,
      teachers: setTeachers,
      teacherAttendances: setTeacherAttendances,
      classes: setClasses,
      exams: setExams,
      activityLog: setActivityLog,
      expenses: setExpenses,
      timetables: setTimetables,
    };

    const unsubscribers = Object.entries(collections).map(([name, setter]) => {
      const collRef = collection(db, name);
      return onSnapshot(collRef, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
        if(name === 'activityLog') {
            data.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        }
        setter(data);
      }, (error) => {
        console.error(`Error fetching ${name}:`, error);
        toast({ title: `Error Fetching ${name}`, description: "Could not connect to the database. Please check your Firebase setup and security rules.", variant: "destructive"});
      });
    });
    
    setLoading(false);

    // Unsubscribe from all listeners on cleanup
    return () => unsubscribers.forEach(unsub => unsub());
  }, [toast]);

  const addActivityLog = async (activity: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    try {
        const newLogEntry = {
            ...activity,
            timestamp: new Date().toISOString(),
        };
        await addDoc(collection(db, 'activityLog'), newLogEntry);
    } catch(e) {
        console.error("Error adding activity log: ", e);
    }
  };
  
  const clearActivityLog = async () => {
    try {
      const activityLogRef = collection(db, 'activityLog');
      const snapshot = await getDocs(activityLogRef);
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      await addActivityLog({ user: 'Admin', action: 'Clear History', description: 'Cleared the entire activity log history.' });
      toast({ title: 'Activity Log Cleared', description: 'All history has been permanently deleted.' });
    } catch (e) {
      console.error('Error clearing activity log: ', e);
      toast({ title: 'Error Clearing History', description: 'Could not clear the activity log.', variant: 'destructive' });
    }
  };

  // Generic CRUD Functions
  const addDocFactory = <T extends { id: string }>(collectionName: string, actionName: string, descriptionFn: (doc: T) => string) => async (docData: Omit<T, 'id'>) => {
    try {
        const docRef = await addDoc(collection(db, collectionName), docData);
        await addActivityLog({ user: 'Admin', action: actionName, description: descriptionFn({ ...docData, id: docRef.id } as T) });
    } catch (e) {
        console.error(`Error adding ${collectionName}:`, e);
        toast({ title: `Error adding ${collectionName}`, variant: "destructive" });
    }
  }

  const updateDocFactory = <T extends {}>(collectionName: string, actionName: string, descriptionFn: (doc: T & {id: string}) => string) => async (id: string, docData: Partial<T>) => {
     try {
        await updateDoc(doc(db, collectionName, id), docData);
        await addActivityLog({ user: 'Admin', action: actionName, description: descriptionFn({ ...docData, id } as T & {id: string}) });
    } catch (e) {
        console.error(`Error updating ${collectionName}:`, e);
        toast({ title: `Error updating ${collectionName}`, variant: "destructive" });
    }
  }
  
  const deleteDocFactory = (collectionName: string, actionName: string, descriptionFn: (doc: any) => string, stateSetter: React.Dispatch<React.SetStateAction<any[]>>) => async (id: string) => {
    const originalState = [...(stateSetter as any)()];
    // Optimistically update UI
    stateSetter(prev => prev.filter(d => d.id !== id));
    try {
        await deleteDoc(doc(db, collectionName, id));
        const docToDelete = originalState.find(d => d.id === id);
        if (docToDelete) {
           await addActivityLog({ user: 'Admin', action: actionName, description: descriptionFn(docToDelete) });
        }
    } catch (e) {
        console.error(`Error deleting ${collectionName}:`, e);
        // Revert UI on error
        stateSetter(originalState);
        toast({ title: `Error deleting ${collectionName}`, variant: "destructive" });
    }
  }

  const addStudent = addDocFactory<Student>('students', 'Add Student', d => `Admitted new student: ${d.name} (ID: ${d.id}) in Class ${d.class}.`);
  const updateStudent = updateDocFactory<Student>('students', 'Update Student', d => `Updated details for student: ${d.name || ''} (ID: ${d.id}).`);
  
  const deleteStudent = async (id: string) => {
      const studentToDelete = students.find(s => s.id === id);
      if (!studentToDelete) return;
      
      // Optimistic UI update
      setStudents(prev => prev.filter(s => s.id !== id));

      try {
          const batch = writeBatch(db);
          batch.delete(doc(db, 'students', id));

          const examsToUpdate = exams.filter(exam => exam.results.some(result => result.studentId === id));
          for (const exam of examsToUpdate) {
              const newResults = exam.results.filter(result => result.studentId !== id);
              const examRef = doc(db, 'exams', exam.id);
              batch.update(examRef, { results: newResults });
          }

          await batch.commit();
          await addActivityLog({ user: 'Admin', action: 'Delete Student', description: `Deleted student: ${studentToDelete.name} (ID: ${id}) and all associated exam results.` });
      } catch (e) {
           console.error("Error deleting student:", e);
           // Revert UI on error
           setStudents(students);
           toast({ title: `Error deleting student`, variant: "destructive" });
      }
  };
  
  const addFamily = addDocFactory<Family>('families', 'Add Family', d => `Added new family: ${d.fatherName} (ID: ${d.id}).`);
  const updateFamily = updateDocFactory<Family>('families', 'Update Family', d => `Updated details for family: ${d.fatherName || ''} (ID: ${d.id}).`);
  const deleteFamily = async (id: string) => {
      const family = families.find(f => f.id === id);
      if (!family) return;
      
      // Optimistic UI update
      setFamilies(prev => prev.filter(f => f.id !== id));
      const studentsOfFamily = students.filter(s => s.familyId === id);
      setStudents(prev => prev.filter(s => s.familyId !== id));
      setFees(prev => prev.filter(f => f.familyId !== id));

      try {
        const batch = writeBatch(db);
        batch.delete(doc(db, "families", id));

        const associatedStudentIds: string[] = [];
        const studentsQuery = query(collection(db, "students"), where("familyId", "==", id));
        const studentDocs = await getDocs(studentsQuery);
        studentDocs.forEach(studentDoc => {
          associatedStudentIds.push(studentDoc.id);
          batch.delete(studentDoc.ref)
        });

        const feesQuery = query(collection(db, "fees"), where("familyId", "==", id));
        const feeDocs = await getDocs(feesQuery);
        feeDocs.forEach(doc => batch.delete(doc.ref));

        await batch.commit();
        
        await addActivityLog({ user: 'Admin', action: 'Delete Family', description: `Deleted family: ${family.fatherName} (ID: ${id}) and all associated data.` });

      } catch(e) {
        console.error("Error deleting family and associated data:", e);
        // Revert UI changes on error
        setFamilies(families);
        setStudents(students);
        setFees(fees);
        toast({ title: 'Error Deleting Family', description: 'Could not delete family and their students/fees.', variant: 'destructive' });
      }
  };

  const addFee = addDocFactory<Fee>('fees', 'Add Fee', d => `Fee generated for family ${d.familyId} for ${d.month} ${d.year}.`);
  const updateFee = updateDocFactory<Fee>('fees', 'Update Fee', d => `Fee ${d.id} updated.`);
  const deleteFee = deleteDocFactory('fees', 'Delete Fee', d => `Fee ${d.id} deleted.`, setFees);
  
  const addTeacher = addDocFactory<Teacher>('teachers', 'Add Teacher', d => `Added new teacher: ${d.name}.`);
  const updateTeacher = updateDocFactory<Teacher>('teachers', 'Update Teacher', d => `Updated teacher: ${d.name || ''}.`);
  const deleteTeacher = deleteDocFactory('teachers', 'Delete Teacher', d => `Deleted teacher: ${d.name}.`, setTeachers);
  
  const addClass = addDocFactory<Class>('classes', 'Add Class', d => `Created new class: ${d.name}.`);
  const updateClass = updateDocFactory<Class>('classes', 'Update Class', d => `Updated class: ${d.name || ''}.`);
  const deleteClass = deleteDocFactory('classes', 'Delete Class', d => `Deleted class: ${d.name}.`, setClasses);
  
  const addExam = addDocFactory<Exam>('exams', 'Create Exam', d => `Created exam "${d.name}" for class ${d.class}.`);
  const updateExam = updateDocFactory<Exam>('exams', 'Save Exam Results', d => `Saved results for exam: ${d.name || ''} (${d.class || ''}).`);
  const deleteExam = deleteDocFactory('exams', 'Delete Exam', d => `Deleted exam: ${d.name} (${d.class}).`, setExams);
  
  const addExpense = addDocFactory<Expense>('expenses', 'Add Expense', d => `Added expense of PKR ${d.amount} for ${d.category}.`);
  const updateExpense = updateDocFactory<Expense>('expenses', 'Update Expense', d => `Updated expense for ${d.category || ''}.`);
  const deleteExpense = deleteDocFactory('expenses', 'Delete Expense', d => `Deleted expense of PKR ${d.amount} for ${d.category}.`, setExpenses);

  const saveTeacherAttendance = async (newAttendances: TeacherAttendance[]) => {
    const date = newAttendances[0]?.date;
    if (!date) return;

    try {
        const batch = writeBatch(db);
        const q = query(collection(db, "teacherAttendances"), where("date", "==", date));
        const existingDocs = await getDocs(q);
        existingDocs.forEach(doc => batch.delete(doc.ref)); // Delete old records for the day

        newAttendances.forEach(att => {
            const docRef = doc(collection(db, "teacherAttendances"));
            batch.set(docRef, att);
        });

        await batch.commit();
        await addActivityLog({ user: 'Admin', action: 'Save Teacher Attendance', description: `Saved teacher attendance for date: ${date}.` });
    } catch(e) {
        console.error("Error saving teacher attendance: ", e);
        toast({ title: 'Error Saving Attendance', variant: 'destructive' });
    }
  };
  
  const updateTimetable = async (classId: string, data: TimetableData, timeSlots?: string[], breakAfterPeriod?: number, breakDuration?: string) => {
    try {
        const timetableRef = doc(db, 'timetables', classId);
        await updateDoc(timetableRef, { classId, data, timeSlots, breakAfterPeriod, breakDuration });
        const className = classes.find(c => c.id === classId)?.name || classId;
        await addActivityLog({ user: 'Admin', action: 'Update Timetable', description: `Updated timetable for class ${className}.` });
    } catch (e) {
        console.error('Error updating timetable', e);
        toast({ title: 'Error saving timetable', variant: 'destructive'});
    }
  };

  const seedDatabase = async () => {
    toast({ title: "Seeding Database...", description: "This may take a moment."});
    try {
        const batch = writeBatch(db);

        // A helper function to add a dataset to the batch
        const addToBatch = (data: any[], collectionName: string) => {
            data.forEach(item => {
                const { id, ...rest } = item;
                const docRef = doc(db, collectionName, id);
                batch.set(docRef, rest);
            });
        };

        addToBatch(initialStudents, 'students');
        addToBatch(initialFamilies, 'families');
        addToBatch(initialFees, 'fees');
        addToBatch(initialTeachers, 'teachers');
        addToBatch(initialTeacherAttendances, 'teacherAttendances');
        addToBatch(initialClasses, 'classes');
        addToBatch(initialExams, 'exams');
        addToBatch(initialExpenses, 'expenses');
        initialTimetables.forEach(item => {
             const { classId, ...rest } = item;
             const docRef = doc(db, 'timetables', classId);
             batch.set(docRef, rest);
        })

        await batch.commit();
        toast({ title: "Database Seeded", description: "Sample data has been added to your database."});
        addActivityLog({ user: 'Admin', action: 'Seed Database', description: 'Populated Firestore with initial sample data.'});
    } catch (error) {
        console.error("Error seeding database: ", error);
        toast({ title: "Seeding Failed", description: "Could not add sample data to the database.", variant: "destructive" });
    }
  };


  // This function is for manual data import, e.g., from a backup file.
  // It's a placeholder and needs robust implementation based on backup structure.
  const loadData = async (data: any) => {
      console.log("Load data function called, but it's a placeholder.", data);
      toast({ title: "Data Loading Not Implemented", description: "This functionality requires a robust implementation to avoid data corruption."});
  };

  const contextValue = {
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
      clearActivityLog,
      addExpense,
      updateExpense,
      deleteExpense,
      updateTimetable,
      loadData,
      seedDatabase,
  };


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
