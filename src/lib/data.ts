

import type { Student, Family, Fee, Teacher, TeacherAttendance, Class, Exam, ActivityLog, Expense, Timetable } from './types';

export const students: Student[] = [
  { id: '1', name: 'Ali Khan', fatherName: 'Ahmed Khan', class: '5th', section: 'A', admissionDate: '2023-03-15', familyId: '1', status: 'Active', phone: '03001234567', address: '123, Main St, Lahore', dob: '2013-05-20', photoUrl: 'https://picsum.photos/seed/S001/100/100', cnic: '35202-1111111-1' },
  { id: '2', name: 'Fatima Ahmed', fatherName: 'Zubair Ahmed', class: '3rd', section: 'Rose', admissionDate: '2022-04-01', familyId: '2', status: 'Active', phone: '03217654321', address: '456, Park Ave, Karachi', dob: '2015-08-10', photoUrl: 'https://picsum.photos/seed/S002/100/100', cnic: '42101-2222222-2' },
  { id: '3', name: 'Bilal Raza', fatherName: 'Ahmed Khan', class: '8th', section: 'B', admissionDate: '2021-08-20', familyId: '1', status: 'Active', phone: '03001234567', address: '123, Main St, Lahore', dob: '2010-01-30', photoUrl: 'https://picsum.photos/seed/S003/100/100', cnic: '35202-3333333-3' },
  { id: '4', name: 'Ayesha Malik', fatherName: 'Imran Malik', class: '5th', section: 'B', admissionDate: '2023-09-10', familyId: '3', status: 'Active', phone: '03339876543', address: '789, Gulberg, Lahore', dob: '2013-11-25', photoUrl: 'https://picsum.photos/seed/S004/100/100', cnic: '35202-4444444-4' },
  { id: '5', name: 'Usman Ali', fatherName: 'Tariq Ali', class: '3rd', section: 'Jasmine', admissionDate: '2022-07-22', familyId: '4', status: 'Inactive', phone: '03451122334', address: 'G-10, Islamabad', dob: '2015-02-15', photoUrl: 'https://picsum.photos/seed/S005/100/100', cnic: '17301-5555555-5' },
];

export const families: Family[] = [
    { id: '1', fatherName: 'Ahmed Khan', profession: 'Engineer', phone: '03001234567', address: '123, Main St, Lahore', cnic: '35202-0000001-1' },
    { id: '2', fatherName: 'Zubair Ahmed', profession: 'Doctor', phone: '03217654321', address: '456, Park Ave, Karachi', cnic: '42101-0000002-1' },
    { id: '3', fatherName: 'Imran Malik', profession: 'Businessman', phone: '03339876543', address: '789, Gulberg, Lahore', cnic: '35202-0000003-1' },
    { id: '4', fatherName: 'Tariq Ali', profession: 'Teacher', phone: '03451122334', address: 'G-10, Islamabad', cnic: '17301-0000004-1' },
];

export const classes: Class[] = [
    { id: 'C01', name: 'Nursery', sections: ['Rose', 'Jasmine'], subjects: ['English', 'Urdu', 'Maths', 'Coloring'] },
    { id: 'C02', name: 'KG', sections: ['A', 'B'], subjects: ['English', 'Urdu', 'Maths', 'General Knowledge'] },
    { id: 'C03', name: '1st', sections: ['A', 'B'], subjects: ['English', 'Urdu', 'Maths', 'Science', 'Social Studies'] },
    { id: 'C04', name: '2nd', sections: ['A', 'B'], subjects: ['English', 'Urdu', 'Maths', 'Science', 'Social Studies'] },
    { id: 'C05', name: '3rd', sections: ['A'], subjects: ['English', 'Urdu', 'Maths', 'Science', 'Social Studies', 'Computer'] },
    { id: 'C06', name: '4th', sections: ['A', 'B'], subjects: ['English', 'Urdu', 'Maths', 'Science', 'Social Studies', 'Computer'] },
    { id: 'C07', name: '5th', sections: ['A', 'B', 'C'], subjects: ['English', 'Urdu', 'Maths', 'Science', 'Social Studies', 'Computer', 'Islamiat'] },
    { id: 'C08', name: '6th', sections: ['A', 'B'], subjects: ['English', 'Urdu', 'Maths', 'Science', 'History', 'Geography', 'Computer'] },
    { id: 'C09', name: '7th', sections: ['A', 'B'], subjects: ['English', 'Urdu', 'Maths', 'Science', 'History', 'Geography', 'Computer'] },
    { id: 'C10', name: '8th', sections: ['A', 'B'], subjects: ['English', 'Urdu', 'Maths', 'Physics', 'Chemistry', 'Biology', 'Computer'] },
    { id: 'C11', name: '9th', sections: [], subjects: ['English', 'Urdu', 'Maths', 'Physics', 'Chemistry', 'Biology', 'Computer', 'Pak Studies'] },
    { id: 'C12', name: '10th', sections: [], subjects: ['English', 'Urdu', 'Maths', 'Physics', 'Chemistry', 'Biology', 'Computer', 'Pak Studies'] },
];

export const teachers: Teacher[] = [
    { id: 'T01', name: 'Sana Javed', fatherName: 'Javed Iqbal', phone: '03112233445', education: 'M.Sc. Physics', salary: 60000, photoUrl: 'https://picsum.photos/seed/T01/200', assignedSubjects: ['Physics', 'Maths'] },
    { id: 'T02', name: 'Rashid Mehmood', fatherName: 'Mehmood Ali', phone: '03223344556', education: 'M.A. English', salary: 55000, photoUrl: 'https://picsum.photos/seed/T02/200', assignedSubjects: ['English', 'Social Studies'] },
];

export const teacherAttendances: TeacherAttendance[] = [
    { id: 'TA01', teacherId: 'T01', date: '2024-05-20', status: 'Present' },
    { id: 'TA02', teacherId: 'T02', date: '2024-05-20', status: 'Present' },
    { id: 'TA03', teacherId: 'T01', date: '2024-05-21', status: 'Present' },
    { id: 'TA04', teacherId: 'T02', date: '2024-05-21', status: 'Absent' },
    { id: 'TA05', teacherId: 'T01', date: '2024-05-22', status: 'Leave' },
    { id: 'TA06', teacherId: 'T02', date: '2024-05-22', status: 'Present' },
];

export const fees: Fee[] = [
    { id: 'A001', familyId: '1', amount: 5000, month: 'April', year: 2024, paymentDate: '', status: 'Unpaid' },
    { id: 'A002', familyId: '2', amount: 3500, month: 'April', year: 2024, paymentDate: '', status: 'Unpaid' },
    { id: 'A003', familyId: '1', amount: 5000, month: 'May', year: 2024, status: 'Unpaid', paymentDate: '' },
    { id: 'A004', familyId: '3', amount: 4000, month: 'May', year: 2024, status: 'Unpaid', paymentDate: '' },
    { id: 'A005', familyId: '2', amount: 3500, month: 'May', year: 2024, paymentDate: '', status: 'Unpaid' },
    { id: 'A006', familyId: '4', amount: 3000, month: 'May', year: 2024, status: 'Unpaid', paymentDate: '' },
];

export const exams: Exam[] = [
    {
        id: 'EXAM-1685026800000',
        name: 'Mid-Term',
        class: '5th',
        subjectTotals: {
            'English': 100,
            'Urdu': 100,
            'Maths': 100,
            'Science': 75,
            'Social Studies': 75,
            'Computer': 50,
            'Islamiat': 50,
        },
        results: [
            {
                studentId: '1',
                marks: {
                    'English': 85,
                    'Urdu': 88,
                    'Maths': 92,
                    'Science': 65,
                    'Social Studies': 70,
                    'Computer': 45,
                    'Islamiat': 48,
                },
            },
            {
                studentId: '4',
                marks: {
                    'English': 78,
                    'Urdu': 82,
                    'Maths': 85,
                    'Science': 60,
                    'Social Studies': 68,
                    'Computer': 40,
                    'Islamiat': 42,
                },
            },
        ],
    },
];

export const activityLog: ActivityLog[] = [];

export const expenses: Expense[] = [
    { id: 'EXP001', date: '2024-05-20', category: 'Salaries', description: 'Teacher salaries for May', amount: 115000, vendor: 'Staff' },
    { id: 'EXP002', date: '2024-05-18', category: 'Utilities', description: 'Electricity Bill', amount: 15000, vendor: 'WAPDA' },
    { id: 'EXP003', date: '2024-05-15', category: 'Supplies', description: 'Stationery purchase', amount: 8000, vendor: 'Lahore Book Depot' },
];

export const timetables: Timetable[] = [];
