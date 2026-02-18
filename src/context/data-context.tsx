

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, writeBatch, query, where, getDocs, setDoc, getDoc, runTransaction } from 'firebase/firestore';
import type { Student, Family, Fee, Teacher, TeacherAttendance, Class, Exam, ActivityLog, Expense, Timetable, TimetableData, Attendance, Alumni, User, PermissionSet, AppNotification, Session } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from './settings-context';
import { createUserWithEmailAndPassword as createUserAuth, onAuthStateChanged } from 'firebase/auth';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, getYear, getMonth, addMonths, subMonths } from 'date-fns';

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
  sessions: Session[];
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
  generateMonthlyFees: () => Promise<number>;
  addTeacher: (teacher: Omit<Teacher, 'id'>) => Promise<void>;
  updateTeacher: (id: string, teacher: Partial<Teacher>) => Promise<void>;
  deleteTeacher: (id: string) => Promise<void>;
  saveStudentAttendance: (attendances: Attendance[], date: string, className: string) => Promise<void>;
  saveTeacherAttendance: (attendances: TeacherAttendance[]) => Promise<void>;
  addClass: (newClass: Class) => Promise<void>;
  updateClass: (id: string, updatedClass: Partial<Class>) => Promise<void>;
  deleteClass: (id: string) => Promise<void>;
  addExam: (exam: Omit<Exam, 'id' | 'results'>) => Promise<string | undefined>;
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
  signOutSession: (sessionId: string) => Promise<void>;
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
  const [sessions, setSessions] = useState<Session[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [userRole, setUserRole] = useState<User['role'] | null>(null);
  const [userPermissions, setUserPermissions] = useState<PermissionSet>(defaultPermissions);
  const [isDataInitialized, setIsDataInitialized] = useState(false);
  const [currentUserName, setCurrentUserName] = useState('System');

  const addActivityLog = useCallback(async (activity: Omit<ActivityLog, 'id' | 'timestamp' | 'user'>) => {
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
  }, [currentUserName]);

  const addNotification = useCallback(async (notification: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => {
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
  }, [users]);

  const addFee = useCallback(async (feeData: Omit<Fee, 'id'>) => {
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
  }, [toast, userRole, families, addNotification]);

  const generateMonthlyFees = useCallback(async (): Promise<number> => {
    const currentDate = new Date();
    let generatedCount = 0;
    const monthOrder = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    try {
        for (const family of families) {
            const hasActiveStudents = students.some(s => s.familyId === family.id && s.status === 'Active');
            if (!hasActiveStudents) continue;

            const familyFees = fees.filter(f => f.familyId === family.id);
            const lastTuitionFee = familyFees
                .filter(f => !['Registration', 'Annual', 'Admission'].some(type => f.month.includes(type)))
                .sort((a, b) => {
                    const dateA = new Date(a.year, monthOrder.indexOf(a.month));
                    const dateB = new Date(b.year, monthOrder.indexOf(b.month));
                    return dateB.getTime() - dateA.getTime();
                })[0];
            
            if (!lastTuitionFee) continue;

            let nextFeeDate = new Date(lastTuitionFee.year, monthOrder.indexOf(lastTuitionFee.month));
            nextFeeDate = addMonths(nextFeeDate, 1);
            
            while (nextFeeDate <= currentDate) {
                const month = format(nextFeeDate, 'MMMM');
                const year = getYear(nextFeeDate);

                const feeAlreadyExists = familyFees.some(f => f.month === month && f.year === year);
                if (!feeAlreadyExists) {
                    await addFee({
                        familyId: family.id,
                        amount: lastTuitionFee.amount,
                        month: month,
                        year: year,
                        status: 'Unpaid',
                        paymentDate: ''
                    });
                    generatedCount++;
                }
                
                nextFeeDate = addMonths(nextFeeDate, 1);
            }
        }
        
        if (generatedCount > 0) {
            toast({ title: 'Fees Generated', description: `Automatically generated ${generatedCount} new monthly fee challans.`});
            await addActivityLog({ action: 'Auto-Generate Fees', description: `Automatically generated ${generatedCount} new monthly fee challans.` });
        }
        return generatedCount;
    } catch (error) {
        console.error("Error during automatic fee generation:", error);
        toast({ title: 'Fee Generation Failed', description: 'An error occurred during automatic fee generation.', variant: 'destructive' });
        return 0;
    }
  }, [families, students, fees, addFee, addActivityLog, toast]);

  const hasPermission = useCallback((permission: keyof PermissionSet) => {
    if (userRole === 'super_admin') return true;
    return userPermissions[permission] || false;
  }, [userRole, userPermissions]);

  useEffect(() => {
    if (!isDataInitialized || !hasPermission('feeCollection')) return;

    const runAutoFeeGeneration = async () => {
      const today = new Date();
      const isFirstDay = today.getDate() === 1;

      if (!isFirstDay) {
        return;
      }
      
      const currentMonthKey = `feeGeneration-${format(today, 'yyyy-MM')}`;
      const hasRunThisMonth = localStorage.getItem(currentMonthKey);

      if (hasRunThisMonth) {
        return;
      }

      console.log('Running automatic monthly fee generation...');
      const count = await generateMonthlyFees();
      
      if (count >= 0) {
        localStorage.setItem(currentMonthKey, 'true');
      }
    };

    runAutoFeeGeneration();

  }, [isDataInitialized, generateMonthlyFees, hasPermission]);


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
                    'expenses', 'timetables', 'users', 'sessions'
                ];
                
                const setterMap: { [key: string]: React.Dispatch<React.SetStateAction<any[]>> } = {
                    students: setStudents, families: setFamilies, fees: setFees, teachers: setTeachers,
                    attendances: setAttendances, teacherAttendances: setTeacherAttendances, alumni: setAlumni,
                    classes: setClasses, exams: setExams, activityLog: setActivityLog, expenses: setExpenses,
                    timetables: setTimetables, users: setUsers, sessions: setSessions, notifications: setNotifications
                };
            
                const listeners = generalCollections.map(collectionName => {
                    const setter = setterMap[collectionName];
                    let q = collection(db, collectionName);
                    // For sessions, only fetch for the current user
                    if (collectionName === 'sessions') {
                       q = query(q, where('userId', '==', user.uid));
                    }

                    return onSnapshot(q, (snapshot) => {
                        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                        if (['activityLog', 'sessions'].includes(collectionName)) {
                            data.sort((a, b) => new Date(b.lastAccess || b.timestamp).getTime() - new Date(a.lastAccess || a.timestamp).getTime());
                        }
                        if (collectionName === 'singleSubjectTests') {
                            data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
            [setStudents, setFamilies, setFees, setTeachers, setAttendances, setTeacherAttendances, setAlumni, setClasses, setExams, setActivityLog, setExpenses, setTimetables, setUsers, setSessions, setNotifications].forEach(setter => setter([]));
        }
    });

    return () => unsubscribeAuth();
  }, []);
  
  const clearActivityLog = useCallback(async () => {
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
  }, [addActivityLog, toast]);

  const updateDocFactory = useCallback((collectionName: string, actionName: string, descriptionFn: (doc: any) => string) => async (id: string, docData: Partial<any>) => {
     try {
        await setDoc(doc(db, collectionName, id), docData, { merge: true });
        await addActivityLog({ action: actionName, description: descriptionFn({ ...docData, id }) });
    } catch (e) {
        console.error(`Error updating ${collectionName}:`, e);
        toast({ title: `Error updating ${collectionName}`, variant: "destructive" });
    }
  }, [addActivityLog, toast]);
  
  const createUser = useCallback(async (email: string, pass: string, name: string, permissions: PermissionSet) => {
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
  }, [addActivityLog]);

  const updateUser = useCallback(updateDocFactory<User>('users', 'Update User Permissions', d => `Updated permissions for ${d.email}.`), [updateDocFactory]);
  
  const signOutSession = useCallback(async (sessionId: string) => {
     try {
        await deleteDoc(doc(db, 'sessions', sessionId));
        await addActivityLog({ action: 'Sign Out Session', description: `Remotely signed out session ${sessionId}.` });
     } catch (e) {
        console.error("Error signing out session: ", e);
     }
  }, [addActivityLog]);


  // --- STUDENT ---
  const addStudent = useCallback(async (student: Student) => {
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
  }, [userRole, addNotification, toast]);

  const updateStudent = useCallback(async (id: string, studentData: Partial<Student>) => {
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
  }, [addActivityLog, toast]);
  
  const deleteStudent = useCallback(async (studentId: string) => {
    const studentToArchive = students.find((s) => s.id === studentId);
    if (!studentToArchive) return;
    try {
        await updateDoc(doc(db, 'students', studentId), { status: 'Archived' });
        await addActivityLog({ action: 'Archive Student', description: `Archived student: ${studentToArchive.name} (ID: ${studentId}).`});
    } catch (e) {
        console.error("Error archiving student:", e);
        toast({ title: "Archive Failed", description: "Could not archive student.", variant: "destructive" });
    }
  }, [students, addActivityLog, toast]);

  // --- ALUMNI ---
    const updateAlumni = useCallback(async (id: string, alumniData: Partial<Alumni & { status?: Student['status'] }>) => {
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
  }, [addActivityLog, toast]);

  // --- FAMILY ---
  const addFamily = useCallback(async (family: Family) => {
    try {
      await setDoc(doc(db, "families", family.id), family);
      await addActivityLog({ action: 'Add Family', description: `Added new family: ${family.fatherName} (ID: ${family.id}).` });
    } catch (e) {
      console.error('Error adding family:', e);
      toast({ title: 'Error Adding Family', variant: 'destructive' });
    }
  }, [addActivityLog, toast]);

  const updateFamily = useCallback(updateDocFactory<Family>('families', 'Update Family', d => `Updated details for family: ${d.fatherName || ''} (ID: ${d.id}).`), [updateDocFactory]);
  
  const deleteFamily = useCallback(async (id: string) => {
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
  }, [addActivityLog, toast]);

  // --- FEE ---
  const updateFee = useCallback(async (id: string, feeData: Partial<Fee>) => {
    try { await setDoc(doc(db, 'fees', id), feeData, { merge: true }); } 
    catch(e) { console.error('Error updating fee', e); toast({ title: 'Error Updating Fee', variant: 'destructive' }); }
  }, [toast]);
    
const deleteFee = useCallback(async (id: string) => {
    const feeToDelete = fees.find(f => f.id === id);
    if (!feeToDelete) {
        toast({ title: 'Fee record not found in local data.', variant: 'destructive' });
        return;
    }
    
    // This is for paid income records being reversed.
    if (feeToDelete.status === 'Paid') {
        try {
            await runTransaction(db, async (transaction) => {
                const paidFeeRef = doc(db, "fees", id);
                const feeDoc = await transaction.get(paidFeeRef);

                if (!feeDoc.exists()) {
                    // This is the "ghost" entry case. It's not in the DB, so we just inform the user.
                    // The onSnapshot listener will automatically clear it from the UI upon its next refresh.
                    console.warn(`Attempted to delete a non-existent paid fee record: ${id}. The UI will refresh.`);
                    return; // Exit transaction gracefully
                }
                
                const paidFeeData = feeDoc.data() as Fee;
                if (!paidFeeData.familyId) {
                     throw new Error("Cannot reverse fee: Family ID is missing from the paid record.");
                }

                // Re-create the unpaid fee.
                const newUnpaidFee: Omit<Fee, 'id'> = {
                    familyId: paidFeeData.familyId,
                    amount: paidFeeData.amount,
                    month: paidFeeData.month,
                    year: paidFeeData.year,
                    status: 'Unpaid',
                    paymentDate: '',
                };
                const newFeeRef = doc(collection(db, 'fees'));
                transaction.set(newFeeRef, newUnpaidFee);
                
                // Delete the paid fee record.
                transaction.delete(paidFeeRef);
            });

            toast({ title: "Income Reversed", description: `PKR ${feeToDelete.amount.toLocaleString()} has been added back to Family ${feeToDelete.familyId}'s dues.` });
            await addActivityLog({ action: 'Reverse Income', description: `Reversed income of PKR ${feeToDelete.amount.toLocaleString()} for Family ID ${feeToDelete.familyId}.` });
        
        } catch (error: any) {
            console.error('Error reversing fee:', error);
            toast({ title: "Error Reversing Income", description: error.message, variant: "destructive" });
        }
    } else {
        // This handles deleting an "Unpaid" challan
        try {
            await deleteDoc(doc(db, 'fees', id));
            toast({ title: "Challan Deleted", description: `Unpaid challan for Family ${feeToDelete.familyId} was deleted.` });
            await addActivityLog({ action: 'Delete Challan', description: `Deleted unpaid challan ID ${id} for Family ${feeToDelete.familyId}.` });
        } catch (e: any) {
             console.error('Error deleting unpaid challan:', e);
             toast({ title: 'Error Deleting Challan', description: e.message, variant: 'destructive' });
        }
    }
}, [fees, addActivityLog, toast]);

  
  // --- TEACHER ---
  const addTeacher = useCallback(async (teacher: Omit<Teacher, 'id'>) => {
    try {
      const newId = `T${Date.now()}`;
      await setDoc(doc(db, "teachers", newId), { ...teacher, id: newId });
      await addActivityLog({ action: 'Add Teacher', description: `Added new teacher: ${teacher.name}.` });
    } catch (e) {
      console.error('Error adding teacher:', e);
      toast({ title: 'Error Adding Teacher', variant: 'destructive' });
    }
  }, [addActivityLog, toast]);

  const updateTeacher = useCallback(updateDocFactory<Teacher>('teachers', 'Update Teacher', d => `Updated details for teacher: ${d.name || ''} (ID: ${d.id}).`), [updateDocFactory]);

  const deleteTeacher = useCallback(async (id: string) => {
    const teacherToDelete = teachers.find(t => t.id === id);
    if (!teacherToDelete) return;
    try {
      await deleteDoc(doc(db, 'teachers', id));
      await addActivityLog({ action: 'Delete Teacher', description: `Deleted teacher: ${teacherToDelete.name}.` });
    } catch (e) {
      console.error('Error deleting teacher:', e);
      toast({ title: 'Error Deleting Teacher', variant: 'destructive' });
    }
  }, [teachers, addActivityLog, toast]);
  
  // --- CLASS ---
  const addClass = useCallback(async (classData: Class) => {
    try {
      await setDoc(doc(db, "classes", classData.id), classData);
      await addActivityLog({ action: 'Add Class', description: `Created new class: ${classData.name}.` });
    } catch(e) {
      console.error('Error adding class:', e);
      toast({ title: 'Error Adding Class', variant: 'destructive' });
    }
  }, [addActivityLog, toast]);

  const updateClass = useCallback(updateDocFactory<Class>('classes', 'Update Class', d => `Updated class: ${d.name || ''}.`), [updateDocFactory]);
  
  const deleteClass = useCallback(async (id: string) => {
    const classToDelete = classes.find(c => c.id === id);
    if (!classToDelete) return;
    try {
      await deleteDoc(doc(db, 'classes', id));
      await addActivityLog({ action: 'Delete Class', description: `Deleted class: ${classToDelete.name}.` });
    } catch (e) {
      console.error('Error deleting class:', e);
      toast({ title: 'Error Deleting Class', variant: 'destructive' });
    }
  }, [classes, addActivityLog, toast]);
  
  // --- EXAM ---
  const addExam = useCallback(async (examData: Omit<Exam, 'id' | 'results'>) => {
    try {
        const newExam = {
            ...examData,
            id: `EXAM-${Date.now()}`,
            results: []
        };
        await setDoc(doc(db, 'exams', newExam.id), newExam);
        await addActivityLog({ action: 'Create Exam', description: `Created exam "${examData.name}" for class ${examData.class}.` });
        return newExam.id;
    } catch (e) {
        console.error('Error adding exam:', e);
        toast({ title: 'Error Creating Exam', variant: 'destructive' });
    }
  }, [addActivityLog, toast]);

  const updateExam = useCallback(updateDocFactory<Exam>('exams', 'Save Exam Results', d => `Saved results for exam: ${d.name || ''} (${d.class || ''}).`), [updateDocFactory]);
  
  const deleteExam = useCallback(async (id: string) => {
    const examToDelete = exams.find(e => e.id === id);
    if (!examToDelete) return;
    try {
      await deleteDoc(doc(db, 'exams', id));
      await addActivityLog({ action: 'Delete Exam', description: `Deleted exam: ${examToDelete.name}.` });
    } catch (e) {
      console.error('Error deleting exam:', e);
      toast({ title: 'Error Deleting Exam', variant: 'destructive' });
    }
  }, [exams, addActivityLog, toast]);

    // --- EXPENSE ---
    const addExpense = useCallback(async (expense: Omit<Expense, 'id'>) => {
        try {
            const docRef = await addDoc(collection(db, "expenses"), expense);
            await updateDoc(docRef, { id: docRef.id });
            
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
    }, [userRole, addNotification, addActivityLog, toast]);

    const updateExpense = useCallback(async (id: string, expenseData: Partial<Expense>) => {
      try {
        const expenseRef = doc(db, 'expenses', id);
        await setDoc(expenseRef, expenseData, { merge: true });
        await addActivityLog({ action: 'Update Expense', description: `Updated expense ID: ${id}.` });
      } catch (e) {
        console.error(`Error updating expense:`, e);
        toast({ title: `Error updating expense`, variant: "destructive" });
      }
    }, [addActivityLog, toast]);
    
    const deleteExpense = useCallback(async (id: string) => {
        const expenseToDelete = expenses.find(exp => exp.id === id);
        if (!expenseToDelete) return;
        try {
          await deleteDoc(doc(db, 'expenses', id));
          await addActivityLog({ action: 'Delete Expense', description: `Deleted expense: ${expenseToDelete.description}.` });
          toast({ title: 'Expense Deleted', description: 'The expense record has been deleted.' });
        } catch (e) {
          console.error('Error deleting expense:', e);
          toast({ title: 'Error Deleting Expense', variant: 'destructive' });
        }
    }, [expenses, addActivityLog, toast]);

  // --- ATTENDANCE ---
  const saveStudentAttendance = useCallback(async (newAttendances: Attendance[], date: string, className: string) => {
    if (!date || !className) return;
    try {
        const batch = writeBatch(db);
        newAttendances.forEach(att => {
            batch.set(doc(db, 'attendances', `${att.studentId}_${att.date}`), att);
        });
        await batch.commit();
        await addActivityLog({ action: 'Save Student Attendance', description: `Saved attendance for class ${className} on date: ${date}.` });
    } catch (e) { console.error('Error saving student attendance: ', e); }
  }, [addActivityLog]);

  const saveTeacherAttendance = useCallback(async (newAttendances: TeacherAttendance[]) => {
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
  }, [addActivityLog]);
  
  const updateTimetable = useCallback(async (classId: string, data: TimetableData, timeSlots?: string[], breakAfterPeriod?: number, breakDuration?: string) => {
    try {
        const timetableRef = doc(db, 'timetables', classId);
        await setDoc(timetableRef, { classId, data, timeSlots, breakAfterPeriod, breakDuration }, { merge: true });
        const className = classes.find(c => c.id === classId)?.name || classId;
        await addActivityLog({ action: 'Update Timetable', description: `Updated timetable for class ${className}.` });
    } catch (e) {
        console.error('Error updating timetable', e);
        toast({ title: 'Error saving timetable', variant: 'destructive'});
    }
  }, [classes, addActivityLog, toast]);
  
  const markNotificationAsRead = useCallback(async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { isRead: true });
    } catch (e) {
      console.error("Error marking notification as read:", e);
    }
  }, []);

  const seedDatabase = async () => { console.log('seedDatabase called'); };
  const deleteAllData = async () => { console.log('deleteAllData called'); };
  const loadData = async (data: any) => { console.log('loadData called'); };

  const contextValue = {
      students, families, fees, teachers, attendances, teacherAttendances, alumni,
      classes, exams, activityLog, expenses, timetables, users, sessions, notifications,
      userRole, userPermissions, isDataInitialized, hasPermission,
      addStudent, updateStudent, updateAlumni, deleteStudent, addFamily, updateFamily, 
      deleteFamily, addFee, updateFee, deleteFee, generateMonthlyFees, addTeacher, updateTeacher,
      deleteTeacher, saveStudentAttendance, saveTeacherAttendance, addClass,
      updateClass, deleteClass, addExam, updateExam, deleteExam, addActivityLog,
      clearActivityLog, addExpense, updateExpense, deleteExpense, updateTimetable,
      updateUser, createUser, signOutSession, addNotification, markNotificationAsRead,
      loadData, seedDatabase, deleteAllData,
  };

  return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) throw new Error('useData must be used within a DataProvider');
  return context;
}
