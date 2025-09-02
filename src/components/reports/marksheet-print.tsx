
'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { SchoolSettings } from '@/context/settings-context';
import { School } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';

interface MarksheetData {
  studentId: string;
  studentName: string;
  marks: { [subject: string]: number };
  obtainedMarks: number;
  totalMarks: number;
  percentage: number;
  position?: number;
}

interface MarksheetPrintReportProps {
  examName: string;
  className: string;
  subjects: string[];
  marksheetData: MarksheetData[];
  settings: SchoolSettings;
}

export const MarksheetPrintReport = React.forwardRef<HTMLDivElement, MarksheetPrintReportProps>(
  ({ examName, className, subjects, marksheetData, settings }, ref) => {

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
            <h2 className="text-2xl font-semibold text-gray-700">Marksheet</h2>
            <p className="text-sm text-gray-500">Date: {format(new Date(), 'PPP')}</p>
          </div>
        </header>
        
        <div className="text-center my-6">
            <h3 className="text-xl font-bold">{examName} - {settings.academicYear}</h3>
            <p className="text-lg font-semibold">Class: {className}</p>
        </div>

        <main className="mt-8">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Roll No.</TableHead>
                <TableHead>Student Name</TableHead>
                {subjects.map(s => <TableHead key={s} className="text-center">{s}</TableHead>)}
                <TableHead className="text-center font-bold">Obtained</TableHead>
                <TableHead className="text-center font-bold">Total</TableHead>
                <TableHead className="text-center font-bold">%</TableHead>
                <TableHead className="text-center font-bold">Position</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {marksheetData.map((row) => (
                <TableRow key={row.studentId}>
                  <TableCell>{row.studentId}</TableCell>
                  <TableCell className="font-medium">{row.studentName}</TableCell>
                  {subjects.map(subject => (
                      <TableCell key={subject} className="text-center">{row.marks[subject] || '-'}</TableCell>
                  ))}
                  <TableCell className="text-center font-semibold">{row.obtainedMarks}</TableCell>
                  <TableCell className="text-center">{row.totalMarks}</TableCell>
                  <TableCell className="text-center font-semibold">{row.percentage.toFixed(2)}%</TableCell>
                  <TableCell className="text-center font-bold">{row.position}</TableCell>
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

MarksheetPrintReport.displayName = 'MarksheetPrintReport';
