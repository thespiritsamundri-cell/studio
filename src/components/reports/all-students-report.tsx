
'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Student } from '@/lib/types';
import { School } from 'lucide-react';
import { useSettings } from '@/context/settings-context';
import Image from 'next/image';
import { format } from 'date-fns';

interface AllStudentsPrintReportProps {
  students: Student[];
  date: Date | null;
}

export const AllStudentsPrintReport = React.forwardRef<HTMLDivElement, AllStudentsPrintReportProps>(
  ({ students, date }, ref) => {
    const { settings } = useSettings();

    return (
      <div ref={ref} className="p-8 font-sans bg-white text-black">
        <header className="flex items-center justify-between pb-4 border-b border-gray-300">
          <div className="flex items-center gap-4">
             {settings.schoolLogo ? (
              <Image src={settings.schoolLogo} alt="School Logo" width={64} height={64} className="object-contain" />
            ) : (
              <School className="w-16 h-16 text-blue-500" />
            )}
            <div>
              <h1 className="text-4xl font-bold text-gray-800">{settings.schoolName}</h1>
              <p className="text-sm text-gray-500">{settings.schoolAddress}</p>
              <p className="text-sm text-gray-500">Phone: {settings.schoolPhone}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-semibold text-gray-700">All Students Report</h2>
            <p className="text-sm text-gray-500">Date: {date ? format(date, 'PPP') : ''}</p>
            <p className="text-sm text-gray-500">Total Students: {students.length}</p>
          </div>
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
