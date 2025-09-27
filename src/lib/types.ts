

export interface PermissionSet {
  dashboard: boolean;
  families: boolean;
  admissions: boolean;
  students: boolean;
  classes: boolean;
  teachers: boolean;
  timetable: boolean;
  feeCollection: boolean;
  feeVouchers: boolean;
  income: boolean;
  expenses: boolean;
  accounts: boolean;
  reports: boolean;
  yearbook: boolean;
  attendance: boolean;
  examSystem: boolean;
  alumni: boolean;
  settings: boolean;
  archived: boolean;
}


export interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'custom';
  permissions: PermissionSet;
}

export interface Student {
  id: string;
  name: string;
  fatherName: string;
  class: string;
  section?: string;
  admissionDate: string;
  familyId: string;
  status: 'Active' | 'Inactive' | 'Archived' | 'Graduated';
  phone: string;
  alternatePhone?: string;
  address: string;
  dob: string;
  photoUrl: string;
  cnic?: string;
  gender?: 'Male' | 'Female' | 'Other';
}

export interface Alumni extends Omit<Student, 'status'> {
  graduationYear: number;
}

export interface Family {
  id:string;
  fatherName: string;
  phone: string;
  address: string;
  cnic?: string;
  profession?: string;
  status?: 'Active' | 'Archived';
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
  status: 'Active' | 'Inactive';
}

export interface Attendance {
  studentId: string;
  date: string;
  status: 'Present' | 'Absent' | 'Leave';
}

export interface TeacherAttendance {
  id?: string;
  teacherId: string;
  date: string; // YYYY-MM-DD
  status: 'Present' | 'Absent' | 'Leave' | 'Late';
}

export interface Fee {
  id: string;
  familyId: string;
  amount: number;
  month: string;
  year: number;
  paymentDate: string; // Only populated for 'Paid' records
  status: 'Paid' | 'Unpaid';
  originalChallanId?: string; // Links a 'Paid' record to the original 'Unpaid' challan ID
  paymentMethod?: string; // e.g., 'Cash', 'Bank Transfer'
  receiptId?: string; // Unique ID for the transaction
  transactionFeeIds?: string[]; // IDs of all other fees paid in the same transaction
}


export interface Receipt {
  id: string;
  family: Family;
  students: Student[];
  paidFees: Fee[];
  totalDues: number;
  paidAmount: number;
  remainingDues: number;
  paymentMethod: string;
  qrCodeDataUri: string;
  createdAt: string;
}

export interface Class {
    id: string;
    name: string;
    sections: string[];
    subjects: string[];
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
    section?: string;
    results: ExamResult[];
    subjectTotals: {
        [subject: string]: number;
    };
}

export interface SingleSubjectTest {
    id: string;
    testName: string;
    class: string;
    section?: string;
    subject: string;
    date: string;
    totalMarks: number;
    results: {
        [studentId: string]: number | undefined;
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
  recipientCount?: number;
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

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
}

export interface Session {
  id: string;
  userId: string;
  loginTime: string;
  lastAccess: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
}

export interface AppNotification {
    id: string;
    title: string;
    description: string;
    timestamp: string;
    isRead: boolean;
    link?: string;
}


// Add this at the end
export interface YearbookData {
    year: number;
    financial: {
        totalIncome: number;
        totalExpenses: number;
        netProfit: number;
        monthlyBreakdown: { name: string, income: number, expenses: number }[];
    },
    admissions: {
        totalAdmissions: number;
        monthlyAdmissions: { name: string, count: number }[];
        classDistribution: { name: string, value: number, fill: string }[];
    },
    academic: {
        passCount: number;
        failCount: number;
        topStudents: { id: string, name: string, class: string, percentage: number }[];
    }
}
