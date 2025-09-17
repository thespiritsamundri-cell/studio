

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, writeBatch, query, where, getDocs, setDoc, getDoc, runTransaction } from 'firebase/firestore';
import type { Student, Family, Fee, Teacher, TeacherAttendance, Class, Exam, ActivityLog, Expense, Timetable, TimetableData, Attendance, Alumni, Session } from '@/lib/types';
import { students as initialStudents, families as initialFamilies, fees as initialFees, teachers as initialTeachers, teacherAttendances as initialTeacherAttendances, classes as initialClasses, exams as initialExams, expenses as initialExpenses, timetables as initialTimetables } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getMonth, format } from 'date-fns';
import { useSettings } from './settings-context';
import { sendWhatsAppMessage } from '@/services/whatsapp-service';
import { onAuthStateChanged } from 'firebase/auth';


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
  sessions: Session[];
  addStudent: (student: Student) => Promise<void>;
  updateStudent: (id: string, student: Partial<Student>) => Promise<void>;
  updateAlumni: (id: string, alumni: Partial<Alumni>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  addFamily: (family: Family) => Promise<void>;
  updateFamily: (id: string, family: Partial<Family>) => Promise<void>;
  deleteFamily: (id: string) => Promise<void>;
  addFee: (feeData: Omit<Fee, 'id'>) => Promise<string | undefined>;
  updateFee: (id: string, fee: Partial<Fee>) => Promise<void>;
  deleteFee: (id: string) => Promise<void>;
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
  addActivityLog: (activity: Omit<ActivityLog, 'id' | 'timestamp'>) => Promise<void>;
  clearActivityLog: () => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  updateTimetable: (classId: string, data: TimetableData, timeSlots?: string[], breakAfterPeriod?: number, breakDuration?: string) => Promise<void>;
  signOutSession: (sessionId: string) => Promise<void>;
  loadData: (data: any) => Promise<void>;
  seedDatabase: () => Promise<void>;
  deleteAllData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Function to format current date-time as ID
function getDateTimeId() {
  const now = new Date();

  // Date part (YYYY-MM-DD)
  const date = now.toISOString().split("T")[0];

  // Time part (12-hour format with AM/PM)
  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12;
  hours = hours ? hours : 12; // 0 -> 12
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
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for Firebase auth state to be confirmed
    const unsubscribeAuth = onAuthStateChanged(auth, user => {
        if (user) {
            // User is signed in, set up Firestore listeners
            const collections: { [key: string]: React.Dispatch<React.SetStateAction<any[]>> } = {
                students: setStudents,
                families: setFamilies,
                fees: setFees,
                teachers: setTeachers,
                attendances: setAttendances,
                teacherAttendances: setTeacherAttendances,
                alumni: setAlumni,
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
                if (name === 'activityLog') {
                  // Sort activity log by timestamp descending
                  data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                }
                setter(data);
              }, (error) => {
                console.error(`Error fetching ${name}:`, error);
                toast({ title: `Error Fetching ${name}`, description: "Could not connect to the database.", variant: "destructive" });
              });
            });

            const sessionUnsub = onSnapshot(collection(db, 'sessions'), (snapshot) => {
                const sessionData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Session[];
                setSessions(sessionData);
            }, (error) => {
                console.error("Error fetching sessions:", error);
            });
            unsubscribers.push(sessionUnsub);
            setLoading(false);

            // Return a cleanup function that unsubscribes from all listeners
            return () => unsubscribers.forEach(unsub => unsub());

        } else {
            // User is signed out, clear all data and stop loading
            setStudents([]);
            setFamilies([]);
            setFees([]);
            setTeachers([]);
            setAttendances([]);
            setTeacherAttendances([]);
            setClasses([]);
            setAlumni([]);
            setExams([]);
            setActivityLog([]);
            setExpenses([]);
            setTimetables([]);
            setSessions([]);
            setLoading(false);
        }
    });

    return () => unsubscribeAuth(); // Cleanup auth listener on component unmount
  }, [toast]);
  

  const addActivityLog = async (activity: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    try {
        const newLogId = getDateTimeId();
        const newLogEntry = {
            ...activity,
            id: newLogId,
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
      await addActivityLog({ user: 'Admin', action: 'Clear History', description: 'Cleared the entire activity log history.' });
      toast({ title: 'Activity Log Cleared', description: 'All history has been permanently deleted.' });
    } catch (e) {
      console.error('Error clearing activity log: ', e);
      toast({ title: 'Error Clearing History', description: 'Could not clear the activity log.', variant: 'destructive' });
    }
  };

  const updateDocFactory = <T extends {}>(collectionName: string, actionName: string, descriptionFn: (doc: T & {id: string}) => string) => async (id: string, docData: Partial<T>) => {
     try {
        await setDoc(doc(db, collectionName, id), docData, { merge: true });
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
        await addActivityLog({ user: 'Admin', action: 'Graduate Student', description: `Graduated student: ${studentData.name || ''} (ID: ${id}).` });
        toast({ title: "Student Graduated", description: `${studentData.name || ''} has been moved to alumni.` });
      } catch (e) {
        console.error("Error graduating student:", e);
        toast({ title: "Graduation Failed", variant: "destructive" });
      }
    } else {
      try {
        await setDoc(studentRef, studentData, { merge: true });
        await addActivityLog({ user: 'Admin', action: 'Update Student', description: `Updated details for student: ${studentData.name || ''} (ID: ${id}).` });
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
        await addActivityLog({ user: 'Admin', action: 'Archive Student', description: `Archived student: ${studentToArchive.name} (ID: ${studentId}).`});
    } catch (e) {
        console.error("Error archiving student:", e);
        toast({ title: "Archive Failed", description: "Could not archive student.", variant: "destructive" });
    }
  };

  // --- ALUMNI ---
    const updateAlumni = async (id: string, alumniData: Partial<Alumni & { status?: Student['status'] }>) => {
    const alumniRef = doc(db, 'alumni', id);

    // Check if the alumnus is being moved back to students
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
            status: alumniData.status || 'Active', // Default to Active if no status is given
          };

          const studentRef = doc(db, 'students', id);
          transaction.set(studentRef, reactivatedStudent);
          transaction.delete(alumniRef);
        });

        await addActivityLog({ user: 'Admin', action: 'Reactivate Student', description: `Re-activated student: ${alumniData.name || ''} (ID: ${id}) from alumni.` });
        toast({ title: "Student Re-activated", description: `${alumniData.name || ''} has been moved back to the active students list.` });
      
      } catch (e) {
        console.error("Error reactivating student:", e);
        toast({ title: "Reactivation Failed", variant: "destructive" });
      }
    } else {
      // Just update the alumni record
      try {
        const { status, ...restOfAlumniData } = alumniData; // Remove status if it exists
        await setDoc(alumniRef, restOfAlumniData, { merge: true });
        await addActivityLog({ user: 'Admin', action: 'Update Alumni', description: `Updated details for alumnus: ${alumniData.name || ''} (ID: ${id}).` });
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
      await addActivityLog({ user: 'Admin', action: 'Add Family', description: `Added new family: ${family.fatherName} (ID: ${family.id}).` });
    } catch (e) {
      console.error('Error adding family:', e);
      toast({ title: 'Error Adding Family', variant: 'destructive' });
    }
  };
  const updateFamily = updateDocFactory<Family>('families', 'Update Family', d => `Updated details for family: ${d.fatherName || ''} (ID: ${d.id}).`);
  const deleteFamily = async (id: string) => {
    try {
      const batch = writeBatch(db);

      // Delete family document
      const familyRef = doc(db, 'families', id);
      batch.delete(familyRef);

      // Query and delete associated students
      const studentsQuery = query(collection(db, 'students'), where('familyId', '==', id));
      const studentsSnapshot = await getDocs(studentsQuery);
      studentsSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      // Query and delete associated fees
      const feesQuery = query(collection(db, 'fees'), where('familyId', '==', id));
      const feesSnapshot = await getDocs(feesQuery);
      feesSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      await addActivityLog({
        user: 'Admin',
        action: 'Delete Family',
        description: `Deleted family ID: ${id} along with ${studentsSnapshot.size} student(s) and ${feesSnapshot.size} fee record(s).`,
      });

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
        return newDocRef.id;
    } catch (e) {
        console.error('Error adding fee:', e);
        toast({ title: 'Error Adding Fee', description: 'Could not create a new fee record.', variant: 'destructive' });
    }
  };
  const updateFee = async (id: string, feeData: Partial<Fee>) => {
    try {
        await setDoc(doc(db, 'fees', id), feeData, { merge: true });
    } catch(e) {
        console.error('Error updating fee', e);
        toast({ title: 'Error Updating Fee', variant: 'destructive' });
    }
  };
  const deleteFee = async (id: string) => {
     try {
        await deleteDoc(doc(db, 'fees', id));
     } catch(e) {
        console.error('Error deleting fee', e);
     }
  };
  
  // --- TEACHER ---
  const addTeacher = async (teacher: Omit<Teacher, 'id'>) => {
    try {
      const newId = `T${Date.now()}`;
      await setDoc(doc(db, "teachers", newId), { ...teacher, id: newId });
      await addActivityLog({ user: 'Admin', action: 'Add Teacher', description: `Added new teacher: ${teacher.name}.` });
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
  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    try {
      const newDoc = await addDoc(collection(db, 'expenses'), expense);
      await addActivityLog({ user: 'Admin', action: 'Add Expense', description: `Added expense of PKR ${expense.amount} for ${expense.category}.` });
    } catch (e) {
      console.error('Error adding expense:', e);
      toast({ title: 'Error Adding Expense', variant: 'destructive' });
    }
  };
  const updateExpense = async (id: string, expense: Partial<Expense>) => {
    try {
        await updateDoc(doc(db, 'expenses', id), expense);
        await addActivityLog({ user: 'Admin', action: 'Update Expense', description: `Updated expense for ${expense.category || ''}.` });
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
      await addActivityLog({ user: 'Admin', action: 'Delete Expense', description: `Deleted expense: ${expenseToDelete.description}.` });
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
            const docId = `${att.studentId}_${att.date}`;
            const docRef = doc(db, 'attendances', docId);
            batch.set(docRef, att);
        });
        await batch.commit();
        await addActivityLog({ user: 'Admin', action: 'Save Student Attendance', description: `Saved attendance for class ${className} on date: ${date}.` });

        // Post-save checks for deactivation
        const studentsToCheck = newAttendances.filter(a => a.status === 'Absent').map(a => a.studentId);
        for (const studentId of studentsToCheck) {
            const student = students.find(s => s.id === studentId);
            if (!student || student.status !== 'Active') continue;

            const start = startOfMonth(new Date(date));
            const end = endOfMonth(new Date(date));
            const monthlyRecords = attendances.filter(a => a.studentId === studentId && new Date(a.date) >= start && new Date(a.date) <= end);
            const absenceCount = monthlyRecords.filter(r => r.status === 'Absent').length;

            if (absenceCount >= 3) {
                await updateStudent(studentId, { status: 'Inactive' });
                const family = families.find(f => f.id === student.familyId);
                toast({
                    title: 'Student Deactivated',
                    description: `${student.name} has been automatically deactivated due to ${absenceCount} absences.`,
                    variant: 'destructive',
                });
                addActivityLog({ user: 'System', action: 'Auto-deactivate Student', description: `Deactivated ${student.name} for ${absenceCount} absences.` });

                if (family && settings.automatedMessages?.studentDeactivation.enabled) {
                    const template = settings.messageTemplates?.find(t => t.id === settings.automatedMessages?.studentDeactivation.templateId);
                    if (template) {
                        let message = template.content;
                        message = message.replace(/{student_name}/g, student.name);
                        message = message.replace(/{father_name}/g, student.fatherName);
                        try {
                            const result = await sendWhatsAppMessage(family.phone, message, settings);
                            if (result.success) {
                                addActivityLog({ user: 'System', action: 'Send Deactivation Notice', description: `Sent deactivation notice to parents of ${student.name}.` });
                            } else {
                                throw new Error(result.error);
                            }
                        } catch (e: any) {
                            console.error(`Failed to send deactivation message for ${student.name}:`, e);
                            toast({ title: "WhatsApp Failed", description: `Could not send deactivation notice for ${student.name}. Error: ${e.message}`, variant: "destructive" });
                        }
                    }
                }

            }
        }
    } catch (e) {
        console.error('Error saving student attendance: ', e);
        toast({ title: 'Error Saving Attendance', variant: 'destructive' });
    }
};

  const saveTeacherAttendance = async (newAttendances: TeacherAttendance[]) => {
    const date = newAttendances[0]?.date;
    if (!date) return;
  
    try {
        const batch = writeBatch(db);
        
        for (const att of newAttendances) {
            const docId = `${att.teacherId}_${att.date}`;
            const docRef = doc(db, 'teacherAttendances', docId);
            batch.set(docRef, att);
        }
    
        await batch.commit();
        await addActivityLog({ user: 'Admin', action: 'Save Teacher Attendance', description: `Saved teacher attendance for date: ${date}.` });

        // Post-save check for late/absence policy
        const teacherIdsToCheck = [...new Set(newAttendances.map(a => a.teacherId))];
        
        for (const teacherId of teacherIdsToCheck) {
            const teacher = teachers.find(t => t.id === teacherId);
            if (!teacher || teacher.status !== 'Active') continue;

            const start = startOfMonth(new Date(date));
            const end = endOfMonth(new Date(date));
            
            const monthlyAttendance = teacherAttendances.filter(a => a.teacherId === teacherId && new Date(a.date) >= start && new Date(a.date) <= end);
            
            const lateCount = monthlyAttendance.filter(a => a.status === 'Late').length;
            const absenceLeaveCount = monthlyAttendance.filter(a => a.status === 'Absent' || a.status === 'Leave').length;

            let reason = '';
            if (lateCount >= 4) {
                reason = `accumulating ${lateCount} late marks`;
            } else if (absenceLeaveCount >= 3) {
                reason = `accumulating ${absenceLeaveCount} absences/leaves`;
            }

            if (reason) {
                await updateTeacher(teacherId, { status: 'Inactive' });
                toast({
                    title: 'Teacher Deactivated',
                    description: `${teacher.name} has been automatically deactivated. ${reason}.`,
                    variant: 'destructive'
                });
                addActivityLog({ user: 'System', action: 'Auto-deactivate Teacher', description: `Deactivated ${teacher.name} for ${reason}.` });
                
                if (settings.automatedMessages?.teacherDeactivation.enabled) {
                    const template = settings.messageTemplates?.find(t => t.id === settings.automatedMessages?.teacherDeactivation.templateId);
                    if (template) {
                        let message = template.content;
                        message = message.replace(/{teacher_name}/g, teacher.name);
                        try {

                            const result = await sendWhatsAppMessage(teacher.phone, message, settings);

                            if (result.success) {
                                addActivityLog({ user: 'System', action: 'Send Deactivation Notice', description: `Sent deactivation notice to ${teacher.name}.` });
                            } else {
                                throw new Error(result.error);
                            }
                        } catch(e: any) {

                             console.error(`Failed to send deactivation message to ${teacher.name}:`, e);
                             toast({ title: "WhatsApp Failed", description: `Could not send deactivation notice to ${teacher.name}. Error: ${e.message}`, variant: "destructive"});
                        }
                    }
                }
            }
        }

    } catch (e) {
      console.error('Error saving teacher attendance: ', e);
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

  const signOutSession = async (sessionId: string) => {
    try {
        await deleteDoc(doc(db, 'sessions', sessionId));
        await addActivityLog({user: 'Admin', action: 'Sign Out Session', description: `Remotely signed out session ID: ${sessionId}`});
    } catch (e) {
        console.error("Error signing out session:", e);
        toast({ title: 'Error Signing Out', variant: 'destructive'});
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

  const deleteAllData = async () => {
    toast({ title: "Deleting All Data...", description: "This is irreversible and may take some time." });
    
    const collectionNames = ['students', 'families', 'fees', 'teachers', 'attendances', 'teacherAttendances', 'classes', 'exams', 'expenses', 'timetables', 'activityLog', 'meta', 'alumni', 'sessions'];

    try {
      const batch = writeBatch(db);
      for (const name of collectionNames) {
        const collRef = collection(db, name);
        const snapshot = await getDocs(collRef);
        snapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        console.log(`Scheduled deletion for all documents in ${name}.`);
      }
      
      await batch.commit();
      
      toast({ title: "Factory Reset Complete", description: "All application data has been permanently deleted." });
      
    } catch (error) {
      console.error("Error during factory reset:", error);
      toast({ title: "Deletion Failed", description: "Could not delete all data. Check console for details.", variant: "destructive" });
      throw error;
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
      attendances,
      teacherAttendances,
      alumni,
      classes,
      exams,
      activityLog,
      expenses,
      timetables,
      sessions,
      addStudent,
      updateStudent, 
      updateAlumni,
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
      saveStudentAttendance,
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
      signOutSession,
      loadData,
      seedDatabase,
      deleteAllData,
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


    
