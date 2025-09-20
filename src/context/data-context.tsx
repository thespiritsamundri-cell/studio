

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, writeBatch, query, where, getDocs, setDoc, getDoc, runTransaction } from 'firebase/firestore';
import type { Student, Family, Fee, Teacher, TeacherAttendance, Class, Exam, ActivityLog, Expense, Timetable, TimetableData, Attendance, Alumni, User, PermissionSet, AppNotification } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from './settings-context';
import { createUserWithEmailAndPassword as createUserAuth, onAuthStateChanged } from 'firebase/auth';

const defaultPermissions: PermissionSet = {
    dashboard: false, families: false, admissions: false, students: false, classes: false,
    teachers: false, timetable: false, feeCollection: false, feeVouchers: false,
    income: false, expenses: false, accounts: false, reports: false,
    yearbook: false, attendance: false, examSystem: false, alumni: false,
    settings: false, archived: false,
};


interface DataContextType {
  students: Student[];
  families: Family[];
  fees: Fee[];
  teachers: Teacher[];
  attendances: Attendance[];
  teacherAttendances: TeacherAttendance[];
  alumni: Alumni[];
  classes: Class[];
  exams: Exam[];
  activityLog: ActivityLog[];
  expenses: Expense[];
  timetables: Timetable[];
  users: User[];
  notifications: AppNotification[];
  userRole: User['role'] | null;
  userPermissions: PermissionSet;
  isDataInitialized: boolean;
  hasPermission: (permission: keyof PermissionSet) => boolean;
  addStudent: (student: Student) => Promise<void>;
  updateStudent: (id: string, student: Partial<Student>) => Promise<void>;
  updateAlumni: (id: string, alumni: Partial<Alumni>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  addFamily: (family: Family) => Promise<void>;
  updateFamily: (id: string, family: Partial<Family>) => Promise<void>;
  deleteFamily: (id: string) => Promise<void>;
  addFee: (feeData: Omit<Fee, 'id'>) => Promise<string | undefined>;
  updateFee: (id: string, fee: Partial<Fee>) => Promise<void>;
  deleteFee: (id: string) => void;
  addTeacher: (teacher: Omit<Teacher, 'id'>) => Promise<void>;
  updateTeacher: (id: string, teacher: Partial<Teacher>) => Promise<void>;
  deleteTeacher: (id: string) => Promise<void>;
  saveStudentAttendance: (attendances: Attendance[], date: string, className: string) => Promise<void>;
  saveTeacherAttendance: (attendances: TeacherAttendance[]) => Promise<void>;
  addClass: (newClass: Class) => Promise<void>;
  updateClass: (id: string, updatedClass: Partial<Class>) => Promise<void>;
  deleteClass: (id: string) => Promise<void>;
  addExam: (exam: Exam) => Promise<void>;
  updateExam: (id: string, exam: Partial<Exam>) => Promise<void>;
  deleteExam: (id: string) => Promise<void>;
  addActivityLog: (activity: Omit<ActivityLog, 'id' | 'timestamp' | 'user'>) => Promise<void>;
  clearActivityLog: () => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  updateTimetable: (classId: string, data: TimetableData, timeSlots?: string[], breakAfterPeriod?: number, breakDuration?: string) => Promise<void>;
  updateUser: (id: string, data: Partial<User>) => Promise<void>;
  createUser: (email: string, pass: string, name: string, permissions: PermissionSet) => Promise<void>;
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  loadData: (data: any) => Promise<void>;
  seedDatabase: () => Promise<void>;
  deleteAllData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

function getDateTimeId() {
  const now = new Date();
  const date = now.toISOString().split("T")[0];
  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hourStr = hours.toString().padStart(2, "0");
  return `${date}_${hourStr}-${minutes}_${ampm}`;
}


export function DataProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { settings } = useSettings();
  const [students, setStudents] = useState<Student[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [teacherAttendances, setTeacherAttendances] = useState<TeacherAttendance[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [userRole, setUserRole] = useState<User['role'] | null>(null);
  const [userPermissions, setUserPermissions] = useState<PermissionSet>(defaultPermissions);
  const [isDataInitialized, setIsDataInitialized] = useState(false);
  const [currentUserName, setCurrentUserName] = useState('System');

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userDocRef = doc(db, 'users', user.uid);
            const userUnsubscribe = onSnapshot(userDocRef, (userDocSnap) => {
                 if (!userDocSnap.exists()) {
                    console.error("User document not found in Firestore!");
                    auth.signOut();
                    return;
                }
                const userData = userDocSnap.data() as User;
                setUserRole(userData.role);
                setUserPermissions(userData.permissions || defaultPermissions);
                setCurrentUserName(userData.name || 'Unknown User');

                const generalCollections = [
                    'students', 'families', 'fees', 'teachers', 'attendances', 
                    'teacherAttendances', 'alumni', 'classes', 'exams', 'activityLog', 
                    'expenses', 'timetables', 'users'
                ];
                
                const setterMap: { [key: string]: React.Dispatch<React.SetStateAction<any[]>> } = {
                    students: setStudents, families: setFamilies, fees: setFees, teachers: setTeachers,
                    attendances: setAttendances, teacherAttendances: setTeacherAttendances, alumni: setAlumni,
                    classes: setClasses, exams: setExams, activityLog: setActivityLog, expenses: setExpenses,
                    timetables: setTimetables, users: setUsers, notifications: setNotifications
                };
            
                const listeners = generalCollections.map(collectionName => {
                    const setter = setterMap[collectionName];
                    return onSnapshot(collection(db, collectionName), (snapshot) => {
                        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        if (collectionName === 'activityLog') {
                            data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                        }
                        setter(data as any);
                    }, (error) => console.error(`Error fetching ${collectionName}:`, error));
                });
    
                if (userData.role === 'super_admin') {
                    const adminCollections = ['notifications'];
                    adminCollections.forEach(collectionName => {
                        const setter = setterMap[collectionName];
                        const unsub = onSnapshot(collection(db, collectionName), (snapshot) => {
                            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                             if (collectionName === 'notifications') {
                                data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                            }
                            setter(data as any);
                        }, (error) => console.error(`Error fetching ${collectionName}:`, error));
                        listeners.push(unsub);
                    });
                } else {
                    setNotifications([]);
                }
                
                setIsDataInitialized(true);
                
                return () => listeners.forEach(unsub => unsub());
            });
            
            return () => userUnsubscribe();
        } else {
            setIsDataInitialized(false);
            setUserRole(null);
            setUserPermissions(defaultPermissions);
            setCurrentUserName('System');
            // Clear all data on logout
            [setStudents, setFamilies, setFees, setTeachers, setAttendances, setTeacherAttendances, setAlumni, setClasses, setExams, setActivityLog, setExpenses, setTimetables, setUsers, setNotifications].forEach(setter => setter([]));
        }
    });

    return () => unsubscribeAuth();
  }, []);
  
  const hasPermission = useCallback((permission: keyof PermissionSet) => {
    if (userRole === 'super_admin') return true;
    return userPermissions[permission] || false;
  }, [userRole, userPermissions]);
  

  const addActivityLog = async (activity: Omit<ActivityLog, 'id' | 'timestamp' | 'user'>) => {
    try {
        const newLogId = getDateTimeId();
        const newLogEntry: ActivityLog = {
            ...activity,
            id: newLogId,
            user: currentUserName,
            timestamp: new Date().toISOString(),
        };
        await setDoc(doc(db, 'activityLog', newLogId), newLogEntry);
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
      await addActivityLog({ action: 'Clear History', description: 'Cleared the entire activity log history.' });
      toast({ title: 'Activity Log Cleared', description: 'All history has been permanently deleted.' });
    } catch (e) {
      console.error('Error clearing activity log: ', e);
      toast({ title: 'Error Clearing History', description: 'Could not clear the activity log.', variant: 'destructive' });
    }
  };

  const updateDocFactory = <T extends {}>(collectionName: string, actionName: string, descriptionFn: (doc: T & {id: string}) => string) => async (id: string, docData: Partial<T>) => {
     try {
        await setDoc(doc(db, collectionName, id), docData, { merge: true });
        await addActivityLog({ action: actionName, description: descriptionFn({ ...docData, id } as T & {id: string}) });
    } catch (e) {
        console.error(`Error updating ${collectionName}:`, e);
        toast({ title: `Error updating ${collectionName}`, variant: "destructive" });
    }
  }
  
  const createUser = async (email: string, pass: string, name: string, permissions: PermissionSet) => {
      try {
        const userCredential = await createUserAuth(auth, email, pass);
        const user = userCredential.user;
        if(user) {
           await setDoc(doc(db, 'users', user.uid), {
               id: user.uid,
               name,
               email,
               role: 'custom',
               permissions
           });
           await addActivityLog({ action: 'Create User', description: `Created new user: ${name}.`});
        }
      } catch (error: any) {
         console.error("Error creating user:", error);
         if (error.code === 'auth/email-already-in-use') {
             throw new Error('This email address is already in use by another account.');
         } else if (error.code === 'auth/weak-password') {
             throw new Error('The password is too weak. It must be at least 6 characters long.');
         }
         throw new Error(error.message || 'An unknown error occurred during user creation.');
      }
  };
  const updateUser = updateDocFactory<User>('users', 'Update User Permissions', d => `Updated permissions for ${d.email}.`);


  // --- STUDENT ---
  const addStudent = async (student: Student) => {
    try {
      await setDoc(doc(db, "students", student.id), student);
      if (userRole !== 'super_admin') {
        await addNotification({
            title: 'New Admission',
            description: `New student ${student.name} admitted to class ${student.class}.`,
            link: `/students/details/${student.id}`
        });
      }
    } catch (e) {
      console.error('Error adding student:', e);
      toast({ title: 'Error Adding Student', description: 'Could not save the new student to the database.', variant: 'destructive' });
    }
  };

  const updateStudent = async (id: string, studentData: Partial<Student>) => {
    const studentRef = doc(db, 'students', id);
  
    if (studentData.status === 'Graduated') {
      try {
        await runTransaction(db, async (transaction) => {
          const studentDoc = await transaction.get(studentRef);
          if (!studentDoc.exists()) {
            throw "Student document does not exist!";
          }
          const finalStudentData = { ...studentDoc.data(), ...studentData };
          const { status, ...restOfStudentData } = finalStudentData;
          const alumniData: Alumni = {
            ...(restOfStudentData as Omit<Student, 'status'>),
            graduationYear: new Date().getFullYear(),
          };
          const alumniRef = doc(db, 'alumni', id);
          transaction.set(alumniRef, alumniData);
          transaction.delete(studentRef);
        });
        await addActivityLog({ action: 'Graduate Student', description: `Graduated student: ${studentData.name || ''} (ID: ${id}).` });
        toast({ title: "Student Graduated", description: `${studentData.name || ''} has been moved to alumni.` });
      } catch (e) {
        console.error("Error graduating student:", e);
        toast({ title: "Graduation Failed", variant: "destructive" });
      }
    } else {
      try {
        await setDoc(studentRef, studentData, { merge: true });
        await addActivityLog({ action: 'Update Student', description: `Updated details for student: ${studentData.name || ''} (ID: ${id}).` });
      } catch (e) {
        console.error("Error updating student:", e);
        toast({ title: "Error updating student", variant: "destructive" });
      }
    }
  };
  
  const deleteStudent = async (studentId: string) => {
    const studentToArchive = students.find((s) => s.id === studentId);
    if (!studentToArchive) return;
    try {
        await updateDoc(doc(db, 'students', studentId), { status: 'Archived' });
        await addActivityLog({ action: 'Archive Student', description: `Archived student: ${studentToArchive.name} (ID: ${studentId}).`});
    } catch (e) {
        console.error("Error archiving student:", e);
        toast({ title: "Archive Failed", description: "Could not archive student.", variant: "destructive" });
    }
  };

  // --- ALUMNI ---
    const updateAlumni = async (id: string, alumniData: Partial<Alumni & { status?: Student['status'] }>) => {
    const alumniRef = doc(db, 'alumni', id);

    if (alumniData.status && alumniData.status !== 'Graduated') {
      try {
        await runTransaction(db, async (transaction) => {
          const alumniDoc = await transaction.get(alumniRef);
          if (!alumniDoc.exists()) {
            throw "Alumni document does not exist!";
          }
          
          const { graduationYear, ...studentData } = alumniDoc.data();
          const reactivatedStudent: Student = {
            ...(studentData as Omit<Alumni, 'graduationYear'>),
            ...(alumniData as Partial<Student>),
            status: alumniData.status || 'Active',
          };

          const studentRef = doc(db, 'students', id);
          transaction.set(studentRef, reactivatedStudent);
          transaction.delete(alumniRef);
        });

        await addActivityLog({ action: 'Reactivate Student', description: `Re-activated student: ${alumniData.name || ''} (ID: ${id}) from alumni.` });
        toast({ title: "Student Re-activated", description: `${alumniData.name || ''} has been moved back to the active students list.` });
      
      } catch (e) {
        console.error("Error reactivating student:", e);
        toast({ title: "Reactivation Failed", variant: "destructive" });
      }
    } else {
      try {
        const { status, ...restOfAlumniData } = alumniData;
        await setDoc(alumniRef, restOfAlumniData, { merge: true });
        await addActivityLog({ action: 'Update Alumni', description: `Updated details for alumnus: ${alumniData.name || ''} (ID: ${id}).` });
      } catch (e) {
        console.error("Error updating alumnus:", e);
        toast({ title: "Error updating alumnus", variant: "destructive" });
      }
    }
  };

  // --- FAMILY ---
  const addFamily = async (family: Family) => {
    try {
      await setDoc(doc(db, "families", family.id), family);
      await addActivityLog({ action: 'Add Family', description: `Added new family: ${family.fatherName} (ID: ${family.id}).` });
    } catch (e) {
      console.error('Error adding family:', e);
      toast({ title: 'Error Adding Family', variant: 'destructive' });
    }
  };
  const updateFamily = updateDocFactory<Family>('families', 'Update Family', d => `Updated details for family: ${d.fatherName || ''} (ID: ${d.id}).`);
  const deleteFamily = async (id: string) => {
    try {
      const batch = writeBatch(db);
      const familyRef = doc(db, 'families', id);
      batch.delete(familyRef);
      const studentsQuery = query(collection(db, 'students'), where('familyId', '==', id));
      const studentsSnapshot = await getDocs(studentsQuery);
      studentsSnapshot.forEach((doc) => batch.delete(doc.ref));
      const feesQuery = query(collection(db, 'fees'), where('familyId', '==', id));
      const feesSnapshot = await getDocs(feesQuery);
      feesSnapshot.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      await addActivityLog({ action: 'Delete Family', description: `Deleted family ID: ${id} and associated records.`});
      toast({ title: 'Family Deleted', description: 'The family and all associated records have been permanently deleted.' });
    } catch (e) {
      console.error('Error deleting family and associated data:', e);
      toast({ title: 'Error Deleting Family', variant: 'destructive' });
    }
  };

  // --- FEE ---
  const addFee = async (feeData: Omit<Fee, 'id'>) => {
    try {
        const newDocRef = await addDoc(collection(db, "fees"), feeData);
        if (userRole !== 'super_admin' && feeData.status === 'Paid') {
            const family = families.find(f => f.id === feeData.familyId);
            await addNotification({
                title: 'Fee Collected',
                description: `PKR ${feeData.amount.toLocaleString()} collected from ${family?.fatherName} (Family ID: ${feeData.familyId})`,
                link: `/income?familyId=${feeData.familyId}`
            });
        }
        return newDocRef.id;
    } catch (e) {
        console.error('Error adding fee:', e);
        toast({ title: 'Error Adding Fee', variant: 'destructive' });
    }
  };
  const updateFee = async (id: string, feeData: Partial<Fee>) => {
    try { await setDoc(doc(db, 'fees', id), feeData, { merge: true }); } 
    catch(e) { console.error('Error updating fee', e); toast({ title: 'Error Updating Fee', variant: 'destructive' }); }
  };
  const deleteFee = async (id: string) => {
     try { await deleteDoc(doc(db, 'fees', id)); } 
     catch(e) { console.error('Error deleting fee', e); }
  };
  
  // --- TEACHER ---
  const addTeacher = async (teacher: Omit<Teacher, 'id'>) => {
    try {
      const newId = `T${Date.now()}`;
      await setDoc(doc(db, "teachers", newId), { ...teacher, id: newId });
      await addActivityLog({ action: 'Add Teacher', description: `Added new teacher: ${teacher.name}.` });
    } catch (e) {
      console.error('Error adding teacher:', e);
      toast({ title: 'Error Adding Teacher', variant: 'destructive' });
    }
  };
  const updateTeacher = updateDocFactory<Teacher>('teachers', 'Update Teacher', d => `Updated details for teacher: ${d.name || ''} (ID: ${d.id}).`);
  const deleteTeacher = async (id: string) => {
    const teacherToDelete = teachers.find(t => t.id === id);
    if (!teacherToDelete) return;
    try {
      await deleteDoc(doc(db, 'teachers', id));
      await addActivityLog({ action: 'Delete Teacher', description: `Deleted teacher: ${teacherToDelete.name}.` });
    } catch (e) {
      console.error('Error deleting teacher:', e);
      toast({ title: 'Error Deleting Teacher', variant: 'destructive' });
    }
  };
  
  // --- CLASS ---
  const addClass = async (classData: Class) => {
    try {
      await setDoc(doc(db, "classes", classData.id), classData);
      await addActivityLog({ action: 'Add Class', description: `Created new class: ${classData.name}.` });
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
      await addActivityLog({ action: 'Delete Class', description: `Deleted class: ${classToDelete.name}.` });
    } catch (e) {
      console.error('Error deleting class:', e);
      toast({ title: 'Error Deleting Class', variant: 'destructive' });
    }
  };
  
  // --- EXAM ---
  const addExam = async (exam: Exam) => {
    try {
      await setDoc(doc(db, 'exams', exam.id), exam);
      await addActivityLog({ action: 'Create Exam', description: `Created exam "${exam.name}" for class ${exam.class}.` });
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
      await addActivityLog({ action: 'Delete Exam', description: `Deleted exam: ${examToDelete.name}.` });
    } catch (e) {
      console.error('Error deleting exam:', e);
      toast({ title: 'Error Deleting Exam', variant: 'destructive' });
    }
  };
  
  // --- EXPENSE ---
  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    try {
      const newId = `EXP-${Date.now()}`;
      await setDoc(doc(db, "expenses", newId), { id: newId, ...expense });
      if (userRole !== 'super_admin') {
        await addNotification({
            title: 'New Expense Added',
            description: `An expense of PKR ${expense.amount.toLocaleString()} for ${expense.category} was added.`,
            link: `/expenses`
        });
      }
      await addActivityLog({ action: 'Add Expense', description: `Added expense of PKR ${expense.amount} for ${expense.category}.` });
    } catch (e) {
      console.error('Error adding expense:', e);
      toast({ title: 'Error Adding Expense', variant: 'destructive' });
    }
  };
  const updateExpense = async (id: string, expense: Partial<Expense>) => {
    try {
        await setDoc(doc(db, 'expenses', id), expense, { merge: true });
        await addActivityLog({ action: 'Update Expense', description: `Updated expense for ${expense.category || ''}.` });
    } catch (e) {
        console.error(`Error updating expense:`, e);
        toast({ title: `Error updating expense`, variant: "destructive" });
    }
  };
  const deleteExpense = async (id: string) => {
    const expenseToDelete = expenses.find(e => e.id === id);
    if (!expenseToDelete) return;
    try {
      await deleteDoc(doc(db, 'expenses', id));
      await addActivityLog({ action: 'Delete Expense', description: `Deleted expense: ${expenseToDelete.description}.` });
    } catch (e) {
      console.error('Error deleting expense:', e);
      toast({ title: 'Error Deleting Expense', variant: 'destructive' });
    }
  };

  // --- ATTENDANCE ---
  const saveStudentAttendance = async (newAttendances: Attendance[], date: string, className: string) => {
    if (!date || !className) return;
    try {
        const batch = writeBatch(db);
        newAttendances.forEach(att => {
            batch.set(doc(db, 'attendances', `${att.studentId}_${att.date}`), att);
        });
        await batch.commit();
        await addActivityLog({ action: 'Save Student Attendance', description: `Saved attendance for class ${className} on date: ${date}.` });
    } catch (e) { console.error('Error saving student attendance: ', e); }
};

  const saveTeacherAttendance = async (newAttendances: TeacherAttendance[]) => {
    const date = newAttendances[0]?.date;
    if (!date) return;
    try {
        const batch = writeBatch(db);
        newAttendances.forEach(att => {
            batch.set(doc(db, 'teacherAttendances', `${att.teacherId}_${att.date}`), att);
        });
        await batch.commit();
        await addActivityLog({ action: 'Save Teacher Attendance', description: `Saved teacher attendance for date: ${date}.` });
    } catch (e) { console.error('Error saving teacher attendance: ', e); }
  };
  
  const updateTimetable = async (classId: string, data: TimetableData, timeSlots?: string[], breakAfterPeriod?: number, breakDuration?: string) => {
    try {
        const timetableRef = doc(db, 'timetables', classId);
        await setDoc(timetableRef, { classId, data, timeSlots, breakAfterPeriod, breakDuration }, { merge: true });
        const className = classes.find(c => c.id === classId)?.name || classId;
        await addActivityLog({ action: 'Update Timetable', description: `Updated timetable for class ${className}.` });
    } catch (e) {
        console.error('Error updating timetable', e);
        toast({ title: 'Error saving timetable', variant: 'destructive'});
    }
  };
  
  // --- NOTIFICATIONS ---
  const addNotification = async (notification: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => {
      const superAdmin = users.find(u => u.role === 'super_admin');
      if (!superAdmin) return;
      try {
          const newNotif: Omit<AppNotification, 'id'> = {
              ...notification,
              timestamp: new Date().toISOString(),
              isRead: false,
          };
          await addDoc(collection(db, 'notifications'), newNotif);
      } catch (e) {
          console.error("Error adding notification:", e);
      }
  };
  const markNotificationAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { isRead: true });
    } catch (e) {
      console.error("Error marking notification as read:", e);
    }
  };

  const seedDatabase = async () => { console.log('seedDatabase called'); };
  const deleteAllData = async () => { console.log('deleteAllData called'); };
  const loadData = async (data: any) => { console.log('loadData called'); };

  const contextValue = {
      students, families, fees, teachers, attendances, teacherAttendances, alumni,
      classes, exams, activityLog, expenses, timetables, users, notifications,
      userRole, userPermissions, isDataInitialized, hasPermission,
      addStudent, updateStudent, updateAlumni, deleteStudent, addFamily, updateFamily, 
      deleteFamily, addFee, updateFee, deleteFee, addTeacher, updateTeacher,
      deleteTeacher, saveStudentAttendance, saveTeacherAttendance, addClass,
      updateClass, deleteClass, addExam, updateExam, deleteExam, addActivityLog,
      clearActivityLog, addExpense, updateExpense, deleteExpense, updateTimetable,
      updateUser, createUser, addNotification, markNotificationAsRead,
      loadData, seedDatabase, deleteAllData,
  };

  return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) throw new Error('useData must be used within a DataProvider');
  return context;
}
