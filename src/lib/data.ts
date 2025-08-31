import type { Student, Family, Fee } from './types';

export const students: Student[] = [
  { id: 'S001', name: 'Ali Khan', fatherName: 'Ahmed Khan', class: '5th', admissionDate: '2023-03-15', familyId: 'F001', status: 'Active', phone: '03001234567', address: '123, Main St, Lahore', dob: '2013-05-20', photoUrl: 'https://picsum.photos/seed/S001/100/100' },
  { id: 'S002', name: 'Fatima Ahmed', fatherName: 'Zubair Ahmed', class: '3rd', admissionDate: '2022-04-01', familyId: 'F002', status: 'Active', phone: '03217654321', address: '456, Park Ave, Karachi', dob: '2015-08-10', photoUrl: 'https://picsum.photos/seed/S002/100/100' },
  { id: 'S003', name: 'Bilal Raza', fatherName: 'Ahmed Khan', class: '8th', admissionDate: '2021-08-20', familyId: 'F001', status: 'Active', phone: '03001234567', address: '123, Main St, Lahore', dob: '2010-01-30', photoUrl: 'https://picsum.photos/seed/S003/100/100' },
  { id: 'S004', name: 'Ayesha Malik', fatherName: 'Imran Malik', class: '5th', admissionDate: '2023-09-10', familyId: 'F003', status: 'Active', phone: '03339876543', address: '789, Gulberg, Lahore', dob: '2013-11-25', photoUrl: 'https://picsum.photos/seed/S004/100/100' },
  { id: 'S005', name: 'Usman Ali', fatherName: 'Tariq Ali', class: '3rd', admissionDate: '2022-07-22', familyId: 'F004', status: 'Inactive', phone: '03451122334', address: 'G-10, Islamabad', dob: '2015-02-15', photoUrl: 'https://picsum.photos/seed/S005/100/100' },
];

export const families: Family[] = [
    { id: 'F001', fatherName: 'Ahmed Khan', phone: '03001234567', address: '123, Main St, Lahore' },
    { id: 'F002', fatherName: 'Zubair Ahmed', phone: '03217654321', address: '456, Park Ave, Karachi' },
    { id: 'F003', fatherName: 'Imran Malik', phone: '03339876543', address: '789, Gulberg, Lahore' },
    { id: 'F004', fatherName: 'Tariq Ali', phone: '03451122334', address: 'G-10, Islamabad' },
];

export const fees: Fee[] = [
    { id: 'FEE01', familyId: 'F001', amount: 5000, month: 'April', year: 2024, paymentDate: '2024-04-05', status: 'Paid' },
    { id: 'FEE02', familyId: 'F002', amount: 3500, month: 'April', year: 2024, paymentDate: '2024-04-08', status: 'Paid' },
    { id: 'FEE03', familyId: 'F001', amount: 5000, month: 'May', year: 2024, status: 'Unpaid', paymentDate: '' },
]
