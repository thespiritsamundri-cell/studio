
'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Student } from '@/lib/types';
import type { SchoolSettings } from '@/context/settings-context';
import Image from 'next/image';
import { format } from 'date-fns';

interface AllStudentsPrintReportProps {
  students: Student[];
  date: Date | null;
  settings: SchoolSettings;
}

export const AllStudentsPrintReport = React.forwardRef<HTMLDivElement, AllStudentsPrintReportProps>(
  ({ students, date, settings }, ref) => {
    return (
      <div ref={ref} className="p-8 font-sans bg-white text-black">
        <header className="text-center mb-6">
          {settings.schoolLogo && (
            <Image src={settings.schoolLogo} alt="School Logo" width={60} height={60} className="object-contain mx-auto mb-2" />
          )}
          <h1 className="text-2xl font-bold uppercase">{settings.schoolName}</h1>
          <p className="text-sm text-gray-500">{settings.schoolAddress}</p>
          <p className="text-sm text-gray-500">Phone: {settings.schoolPhone}</p>
          <h2 className="text-xl font-semibold mt-4">All Students Report</h2>
          <p className="text-sm text-gray-500">Date: {date ? format(date, 'PPP') : ''} | Total Students: {students.length}</p>
        </header>

        <main className="mt-8">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Father's Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Admission Date</TableHead>
                <TableHead>Phone</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>{student.id}</TableCell>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>{student.fatherName}</TableCell>
                  <TableCell>{student.class}</TableCell>
                  <TableCell>{student.status}</TableCell>
                  <TableCell>{student.admissionDate}</TableCell>
                  <TableCell>{student.phone}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </main>
        
        <footer className="mt-12 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
          <p>This is a computer-generated report.</p>
          <p>&copy; {new Date().getFullYear()} {settings.schoolName}. All rights reserved.</p>
        </footer>
      </div>
    );
  }
);

AllStudentsPrintReport.displayName = 'AllStudentsPrintReport';
