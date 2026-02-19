'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Student } from '@/lib/types';
import { School } from 'lucide-react';
import type { SchoolSettings } from '@/context/settings-context';
import Image from 'next/image';
import { format } from 'date-fns';

interface DailyAttendancePrintReportProps {
  className: string;
  date: Date;
  students: Student[];
  attendance: Record<string, { status: 'Present' | 'Absent' | 'Leave'; remarks?: string }>;
  settings: SchoolSettings;
}

export const DailyAttendancePrintReport = React.forwardRef<HTMLDivElement, DailyAttendancePrintReportProps>(
  ({ className, date, students, attendance, settings }, ref) => {
    const presentCount = Object.values(attendance).filter(s => s.status === 'Present').length;
    const absentCount = Object.values(attendance).filter(s => s.status === 'Absent').length;
    const leaveCount = Object.values(attendance).filter(s => s.status === 'Leave').length;

    return (
      <div ref={ref} className="p-8 font-sans bg-white text-black">
        <header className="flex items-center justify-between pb-4 border-b">
          <div className="flex items-center gap-4">
            {settings.schoolLogo ? (
              <Image src={settings.schoolLogo} alt="School Logo" width={48} height={48} className="object-contain" />
            ) : (
              <School className="w-12 h-12 text-primary" />
            )}
            <div>
              <h1 className="text-3xl font-bold">{settings.schoolName}</h1>
              <p className="text-sm text-muted-foreground">{settings.schoolAddress}</p>
              <p className="text-sm text-muted-foreground">Phone: {settings.schoolPhone}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-semibold">Daily Attendance Report</h2>
            <p className="text-sm">Date: {date ? format(date, 'PPP') : ''}</p>
          </div>
        </header>

        <div className="my-6 flex justify-between items-center">
          <div>
              <span className="font-bold">Class:</span> {className}
          </div>
          <div className="flex gap-4 text-sm">
              <span><span className='font-bold'>Total Students:</span> {students.length}</span>
              <span className='text-green-600'><span className='font-bold'>Present:</span> {presentCount}</span>
              <span className='text-red-600'><span className='font-bold'>Absent:</span> {absentCount}</span>
              <span className='text-yellow-600'><span className='font-bold'>On Leave:</span> {leaveCount}</span>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Roll No.</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead>Father Name</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium">{student.id}</TableCell>
                <TableCell>{student.name}</TableCell>
                <TableCell>{student.fatherName}</TableCell>
                <TableCell>{attendance[student.id]?.remarks || ''}</TableCell>
                <TableCell className="text-right font-medium"
                  style={{
                      color: attendance[student.id]?.status === 'Present' ? 'green' : attendance[student.id]?.status === 'Absent' ? 'red' : 'orange'
                  }}
                >{attendance[student.id]?.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        <footer className="mt-8 pt-4 border-t text-center text-xs text-muted-foreground">
          <p>This is a computer-generated report and does not require a signature.</p>
          <p>&copy; {new Date().getFullYear()} {settings.schoolName}. All rights reserved.</p>
        </footer>
      </div>
    );
  }
);

DailyAttendancePrintReport.displayName = 'DailyAttendancePrintReport';
