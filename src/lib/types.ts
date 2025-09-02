

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
}

export interface Attendance {
  studentId: string;
  date: string;
  status: 'Present' | 'Absent' | 'Leave';
}

export interface TeacherAttendance {
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

    