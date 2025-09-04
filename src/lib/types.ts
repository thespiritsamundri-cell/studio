

export interface Student {
  id: string;
  name: string;
  fatherName: string;
  class: string;
  section?: string;
  admissionDate: string;
  familyId: string;
  status: 'Active' | 'Inactive';
  phone: string;
  alternatePhone?: string;
  address: string;
  dob: string;
  photoUrl: string;
  cnic?: string;
}

export interface Family {
  id:string;
  fatherName: string;
  phone: string;
  address: string;
  cnic?: string;
  profession?: string;
}

export interface Teacher {
  id: string;
  name: string;
  fatherName: string;
  phone: string;
  education: string;
  salary: number;
  photoUrl: string;
  assignedSubjects?: string[];
  // Props for printing, not stored in DB
  schoolName?: string;
  schoolAddress?: string;
  schoolLogo?: string;
}

export interface Attendance {
  studentId: string;
  date: string;
  status: 'Present' | 'Absent' | 'Leave';
}

export interface TeacherAttendance {
  id: string;
  teacherId: string;
  date: string; // YYYY-MM-DD
  status: 'Present' | 'Absent' | 'Leave';
}

export interface Fee {
  id: string;
  familyId: string;
  amount: number;
  month: string;
  year: number;
  paymentDate: string;
  status: 'Paid' | 'Unpaid';
  originalChallanId?: string; // Used for paid records to link back to the original fee challan
  paymentMethod?: string;
}

export interface Class {
    id: string;
    name: string;
    sections: string[];
    subjects: string[];
    // Props for printing, not stored in DB
    schoolName?: string;
    schoolAddress?: string;
    schoolLogo?: string;
}

export interface ExamResult {
    studentId: string;
    marks: {
        [subject: string]: number;
    };
}

export interface Exam {
    id: string;
    name: string;
    class: string;
    results: ExamResult[];
    subjectTotals: {
        [subject: string]: number;
    };
}

export interface Grade {
    name: string;
    minPercentage: number;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  description: string;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  vendor?: string;
}

export interface TimetableCell {
    subject: string;
    teacherId: string;
}
export type TimetableRow = (TimetableCell | null)[];
export type TimetableData = TimetableRow;

export interface Timetable {
  classId: string;
  data: TimetableData;
  timeSlots?: string[];
  breakAfterPeriod?: number;
  breakDuration?: string;
}
