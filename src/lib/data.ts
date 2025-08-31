
import type { Student, Family, Fee, Teacher, TeacherAttendance, Class } from './types';

export const students: Student[] = [
  { id: 'S001', name: 'Ali Khan', fatherName: 'Ahmed Khan', class: '5th', admissionDate: '2023-03-15', familyId: '1', status: 'Active', phone: '03001234567', address: '123, Main St, Lahore', dob: '2013-05-20', photoUrl: 'https://picsum.photos/seed/S001/100/100', cnic: '35202-1111111-1' },
  { id: 'S002', name: 'Fatima Ahmed', fatherName: 'Zubair Ahmed', class: '3rd', admissionDate: '2022-04-01', familyId: '2', status: 'Active', phone: '03217654321', address: '456, Park Ave, Karachi', dob: '2015-08-10', photoUrl: 'https://picsum.photos/seed/S002/100/100', cnic: '42101-2222222-2' },
  { id: 'S003', name: 'Bilal Raza', fatherName: 'Ahmed Khan', class: '8th', admissionDate: '2021-08-20', familyId: '1', status: 'Active', phone: '03001234567', address: '123, Main St, Lahore', dob: '2010-01-30', photoUrl: 'https://picsum.photos/seed/S003/100/100', cnic: '35202-3333333-3' },
  { id: 'S004', name: 'Ayesha Malik', fatherName: 'Imran Malik', class: '5th', admissionDate: '2023-09-10', familyId: '3', status: 'Active', phone: '03339876543', address: '789, Gulberg, Lahore', dob: '2013-11-25', photoUrl: 'https://picsum.photos/seed/S004/100/100', cnic: '35202-4444444-4' },
  { id: 'S005', name: 'Usman Ali', fatherName: 'Tariq Ali', class: '3rd', admissionDate: '2022-07-22', familyId: '4', status: 'Inactive', phone: '03451122334', address: 'G-10, Islamabad', dob: '2015-02-15', photoUrl: 'https://picsum.photos/seed/S005/100/100', cnic: '17301-5555555-5' },
];

export const families: Family[] = [
    { id: '1', fatherName: 'Ahmed Khan', profession: 'Engineer', phone: '03001234567', address: '123, Main St, Lahore', cnic: '35202-0000001-1' },
    { id: '2', fatherName: 'Zubair Ahmed', profession: 'Doctor', phone: '03217654321', address: '456, Park Ave, Karachi', cnic: '42101-0000002-1' },
    { id: '3', fatherName: 'Imran Malik', profession: 'Businessman', phone: '03339876543', address: '789, Gulberg, Lahore', cnic: '35202-0000003-1' },
    { id: '4', fatherName: 'Tariq Ali', profession: 'Teacher', phone: '03451122334', address: 'G-10, Islamabad', cnic: '17301-0000004-1' },
];

export const classes: Class[] = [
    { id: 'C01', name: 'Nursery' },
    { id: 'C02', name: 'KG' },
    { id: 'C03', name: '1st' },
    { id: 'C04', name: '2nd' },
    { id: 'C05', name: '3rd' },
    { id: 'C06', name: '4th' },
    { id: 'C07', name: '5th' },
    { id: 'C08', name: '6th' },
    { id: 'C09', name: '7th' },
    { id: 'C10', name: '8th' },
    { id: 'C11', name: '9th' },
    { id: 'C12', name: '10th' },
];

export const teachers: Teacher[] = [
    { id: 'T01', name: 'Sana Javed', fatherName: 'Javed Iqbal', phone: '03112233445', education: 'M.Sc. Physics', salary: 60000, photoUrl: 'https://picsum.photos/seed/T01/200' },
    { id: 'T02', name: 'Rashid Mehmood', fatherName: 'Mehmood Ali', phone: '03223344556', education: 'M.A. English', salary: 55000, photoUrl: 'https://picsum.photos/seed/T02/200' },
];

export const teacherAttendances: TeacherAttendance[] = [
    // Example data for the last few days
    { teacherId: 'T01', date: '2024-05-20', status: 'Present' },
    { teacherId: 'T02', date: '2024-05-20', status: 'Present' },
    { teacherId: 'T01', date: '2024-05-21', status: 'Present' },
    { teacherId: 'T02', date: '2024-05-21', status: 'Absent' },
    { teacherId: 'T01', date: '2024-05-22', status: 'Leave' },
    { teacherId: 'T02', date: '2024-05-22', status: 'Present' },
];


export const fees: Fee[] = [
    { id: 'FEE01', familyId: '1', amount: 5000, month: 'April', year: 2024, paymentDate: '', status: 'Unpaid' },
    { id: 'FEE02', familyId: '2', amount: 3500, month: 'April', year: 2024, paymentDate: '', status: 'Unpaid' },
    { id: 'FEE03', familyId: '1', amount: 5000, month: 'May', year: 2024, status: 'Unpaid', paymentDate: '' },
    { id: 'FEE04', familyId: '3', amount: 4000, month: 'May', year: 2024, status: 'Unpaid', paymentDate: '' },
    { id: 'FEE05', familyId: '2', amount: 3500, month: 'May', year: 2024, paymentDate: '', status: 'Unpaid' },
    { id: 'FEE06', familyId: '4', amount: 3000, month: 'May', year: 2024, status: 'Unpaid', paymentDate: '' },
];
