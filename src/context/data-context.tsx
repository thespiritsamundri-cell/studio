

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
  addStudent: (student: Student) => Promise<void>;
  updateStudent: (id: string, student: Partial<Student>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  addFamily: (family: Family) => Promise<void>;
  updateFamily: (id: string, family: Partial<Family>) => Promise<void>;
  deleteFamily: (id: string) => Promise<void>;
  restoreFamily: (id: string) => Promise<void>;
  deleteFamilyPermanently: (id: string) => Promise<void>;
  addFee: (fee: Fee) => Promise<void>;
  updateFee: (id: string, fee: Partial<Fee>) => Promise<void>;
  deleteFee: (id: string) => Promise<void>;
  addTeacher: (teacher: Teacher) => Promise<void>;
  updateTeacher: (id: string, teacher: Partial<Teacher>) => Promise<void>;
  deleteTeacher: (id: string) => Promise<void>;
  saveTeacherAttendance: (attendances: TeacherAttendance[]) => Promise<void>;
  addClass: (newClass: Class) => Promise<void>;
  updateClass: (id: string, updatedClass: Partial<Class>) => Promise<void>;
  deleteClass: (id: string) => Promise<void>;
  addExam: (exam: Exam) => Promise<void>;
  updateExam: (id: string, exam: Partial<Exam>) => Promise<void>;
  deleteExam: (id: string) => Promise<void>;
  addActivityLog: (activity: Omit<ActivityLog, 'id' | 'timestamp'>) => Promise<void>;
  clearActivityLog: () => Promise<void>;
  addExpense: (expense: Expense) => Promise<void>;
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

  const updateDocFactory = <T extends {}>(collectionName: string, actionName: string, descriptionFn: (doc: T & {id: string}) => string) => async (id: string, docData: Partial<T>) => {
     try {
        await updateDoc(doc(db, collectionName, id), docData);
        await addActivityLog({ user: 'Admin', action: actionName, description: descriptionFn({ ...docData, id } as T & {id: string}) });
    } catch (e) {
        console.error(`Error updating ${collectionName}:`, e);
        toast({ title: `Error updating ${collectionName}`, variant: "destructive" });
    }
  }

  // --- STUDENT ---
  const addStudent = async (student: Student) => {
    try {
      await setDoc(doc(db, "students", student.id), student);
      await addActivityLog({ user: 'Admin', action: 'Add Student', description: `Admitted new student: ${student.name} (ID: ${student.id}) in Class ${student.class}.` });
    } catch (e) {
      console.error('Error adding student:', e);
      toast({ title: 'Error Adding Student', description: 'Could not save the new student to the database.', variant: 'destructive' });
    }
  };
  const updateStudent = updateDocFactory<Student>('students', 'Update Student', d => `Updated details for student: ${d.name || ''} (ID: ${d.id}).`);
  
  const deleteStudent = async (studentId: string) => {
    const studentToArchive = students.find((s) => s.id === studentId);
    if (!studentToArchive) return;
    try {
        await updateDoc(doc(db, 'students', studentId), { status: 'Archived' });
        await addActivityLog({ user: 'Admin', action: 'Archive Student', description: `Archived student: ${studentToArchive.name} (ID: ${studentId}).`});
    } catch (e) {
        console.error("Error archiving student:", e);
        toast({ title: "Archive Failed", description: "Could not archive student.", variant: "destructive" });
    }
  };

  // --- FAMILY ---
  const addFamily = async (family: Family) => {
    try {
      await setDoc(doc(db, "families", family.id), family);
      await addActivityLog({ user: 'Admin', action: 'Add Family', description: `Added new family: ${family.fatherName} (ID: ${family.id}).` });
    } catch (e) {
      console.error('Error adding family:', e);
      toast({ title: 'Error Adding Family', variant: 'destructive' });
    }
  };
  const updateFamily = updateDocFactory<Family>('families', 'Update Family', d => `Updated details for family: ${d.fatherName || ''} (ID: ${d.id}).`);
  const deleteFamily = async (familyId: string) => {
    const familyToArchive = families.find((f) => f.id === familyId);
    if (!familyToArchive) return;

    try {
        const batch = writeBatch(db);
        
        batch.update(doc(db, "families", familyId), { status: 'Archived' });

        const studentQuery = query(collection(db, "students"), where("familyId", "==", familyId));
        const studentDocs = await getDocs(studentQuery);
        studentDocs.forEach(doc => {
            batch.update(doc.ref, { status: 'Archived' });
        });
        
        await batch.commit();
        await addActivityLog({ user: 'Admin', action: 'Archive Family', description: `Archived family: ${familyToArchive.fatherName} (ID: ${familyId}) and all associated students.` });
        toast({ title: 'Family Archived', description: 'The family and all its students have been moved to the archive.' });
    } catch (e: any) {
        console.error("Error archiving family:", e);
        toast({ title: "Archive Failed", description: "Could not archive the family and its students.", variant: "destructive" });
    }
  };
  
  const restoreFamily = async (familyId: string) => {
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, "families", familyId), { status: 'Active' });
      const studentQuery = query(collection(db, 'students'), where('familyId', '==', familyId));
      const studentDocs = await getDocs(studentQuery);
      studentDocs.forEach(sDoc => {
        batch.update(sDoc.ref, { status: 'Active' });
      });
      await batch.commit();
      toast({ title: 'Family Restored', description: 'The family and its students have been restored.' });
    } catch (e) {
      console.error('Error restoring family: ', e);
      toast({ title: 'Restore Failed', variant: 'destructive' });
    }
  };

  const deleteFamilyPermanently = async (familyId: string) => {
    try {
      const batch = writeBatch(db);
      
      // Delete family
      batch.delete(doc(db, 'families', familyId));

      // Delete students
      const studentQuery = query(collection(db, 'students'), where('familyId', '==', familyId));
      const studentDocs = await getDocs(studentQuery);
      studentDocs.forEach(doc => batch.delete(doc.ref));

      // Delete fees
      const feeQuery = query(collection(db, 'fees'), where('familyId', '==', familyId));
      const feeDocs = await getDocs(feeQuery);
      feeDocs.forEach(doc => batch.delete(doc.ref));
      
      await batch.commit();
      toast({ title: 'Family Deleted Permanently', variant: 'destructive'});
    } catch (e) {
      console.error('Error permanently deleting family: ', e);
      toast({ title: 'Deletion Failed', variant: 'destructive' });
    }
  };

  // --- FEE ---
  const addFee = async (fee: Fee) => {
    try {
      await setDoc(doc(db, "fees", fee.id), fee);
    } catch(e) {
       console.error('Error adding fee', e);
    }
  };
  const updateFee = updateDocFactory<Fee>('fees', 'Update Fee', d => `Fee ${d.id} updated.`);
  const deleteFee = async (id: string) => {
     try {
        await deleteDoc(doc(db, 'fees', id));
     } catch(e) {
        console.error('Error deleting fee', e);
     }
  };
  
  // --- TEACHER ---
  const addTeacher = async (teacher: Teacher) => {
    try {
      await setDoc(doc(db, "teachers", teacher.id), teacher);
      await addActivityLog({ user: 'Admin', action: 'Add Teacher', description: `Added new teacher: ${teacher.name}.` });
    } catch (e) {
      console.error('Error adding teacher:', e);
      toast({ title: 'Error Adding Teacher', variant: 'destructive' });
    }
  };
  const updateTeacher = updateDocFactory<Teacher>('teachers', 'Update Teacher', d => `Updated teacher: ${d.name || ''}.`);
  const deleteTeacher = async (id: string) => {
    const teacherToDelete = teachers.find(t => t.id === id);
    if (!teacherToDelete) return;
    try {
      await deleteDoc(doc(db, 'teachers', id));
      await addActivityLog({ user: 'Admin', action: 'Delete Teacher', description: `Deleted teacher: ${teacherToDelete.name}.` });
    } catch (e) {
      console.error('Error deleting teacher:', e);
      toast({ title: 'Error Deleting Teacher', variant: 'destructive' });
    }
  };
  
  // --- CLASS ---
  const addClass = async (classData: Class) => {
    try {
      await setDoc(doc(db, "classes", classData.id), classData);
      await addActivityLog({ user: 'Admin', action: 'Add Class', description: `Created new class: ${classData.name}.` });
    } catch(e) {
      console.error('Error adding class:', e);
      toast({ title: 'Error Adding Class', variant: 'destructive' });
    }
  };
  const updateClass = updateDocFactory<Class>('classes', 'Update Class', d => `Updated class: ${d.name || ''}.`);
  const deleteClass = async (id: string) => {
    const classToDelete = classes.find(c => c.id === id);
    if (!classToDelete) return;
    try {
      await deleteDoc(doc(db, 'classes', id));
      await addActivityLog({ user: 'Admin', action: 'Delete Class', description: `Deleted class: ${classToDelete.name}.` });
    } catch (e) {
      console.error('Error deleting class:', e);
      toast({ title: 'Error Deleting Class', variant: 'destructive' });
    }
  };
  
  // --- EXAM ---
  const addExam = async (exam: Exam) => {
    try {
      await setDoc(doc(db, 'exams', exam.id), exam);
      await addActivityLog({ user: 'Admin', action: 'Create Exam', description: `Created exam "${exam.name}" for class ${exam.class}.` });
    } catch (e) {
      console.error('Error adding exam:', e);
      toast({ title: 'Error Creating Exam', variant: 'destructive' });
    }
  };
  const updateExam = updateDocFactory<Exam>('exams', 'Save Exam Results', d => `Saved results for exam: ${d.name || ''} (${d.class || ''}).`);
  const deleteExam = async (id: string) => {
    const examToDelete = exams.find(e => e.id === id);
    if (!examToDelete) return;
    try {
      await deleteDoc(doc(db, 'exams', id));
      await addActivityLog({ user: 'Admin', action: 'Delete Exam', description: `Deleted exam: ${examToDelete.name}.` });
    } catch (e) {
      console.error('Error deleting exam:', e);
      toast({ title: 'Error Deleting Exam', variant: 'destructive' });
    }
  };
  
  // --- EXPENSE ---
  const addExpense = async (expense: Expense) => {
    try {
      await setDoc(doc(db, 'expenses', expense.id), expense);
      await addActivityLog({ user: 'Admin', action: 'Add Expense', description: `Added expense of PKR ${expense.amount} for ${expense.category}.` });
    } catch (e) {
      console.error('Error adding expense:', e);
      toast({ title: 'Error Adding Expense', variant: 'destructive' });
    }
  };
  const updateExpense = updateDocFactory<Expense>('expenses', 'Update Expense', d => `Updated expense for ${d.category || ''}.`);
  const deleteExpense = async (id: string) => {
    const expenseToDelete = expenses.find(e => e.id === id);
    if (!expenseToDelete) return;
    try {
      await deleteDoc(doc(db, 'expenses', id));
      await addActivityLog({ user: 'Admin', action: 'Delete Expense', description: `Deleted expense: ${expenseToDelete.description}.` });
    } catch (e) {
      console.error('Error deleting expense:', e);
      toast({ title: 'Error Deleting Expense', variant: 'destructive' });
    }
  };

  // --- OTHER ---
  const saveTeacherAttendance = async (newAttendances: TeacherAttendance[]) => {
    const date = newAttendances[0]?.date;
    if (!date) return;

    try {
        const batch = writeBatch(db);
        const q = query(collection(db, "teacherAttendances"), where("date", "==", date));
        const existingDocs = await getDocs(q);
        existingDocs.forEach(doc => batch.delete(doc.ref));

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
        await setDoc(timetableRef, { classId, data, timeSlots, breakAfterPeriod, breakDuration }, { merge: true });
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
      restoreFamily,
      deleteFamilyPermanently,
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
