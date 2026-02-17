
'use client';

import React from 'react';
import type { Teacher, TeacherAttendance } from '@/lib/types';
import type { SchoolSettings } from '@/context/settings-context';
import { School } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '../ui/badge';

interface IndividualTeacherAttendancePrintReportProps {
  teacher: Teacher;
  daysInMonth: Date[];
  attendanceForMonth: Record<string, TeacherAttendance | undefined>;
  summary: { present: number; absent: number; late: number; leave: number; };
  month: Date;
  settings: SchoolSettings;
}

export const IndividualTeacherAttendancePrintReport = React.forwardRef<HTMLDivElement, IndividualTeacherAttendancePrintReportProps>(
  ({ teacher, daysInMonth, attendanceForMonth, summary, month, settings }, ref) => {
    
    return (
      <div ref={ref} className="p-8 font-sans bg-white text-black max-w-4xl mx-auto">
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
            <h2 className="text-2xl font-semibold text-gray-700">Monthly Attendance Report</h2>
            <p className="text-sm text-gray-500">Month: {format(month, 'MMMM yyyy')}</p>
          </div>
        </header>

        <section className="my-6 p-4 border rounded-lg bg-gray-50">
            <div className="grid grid-cols-3 gap-4">
                <div><span className="font-semibold">Teacher Name:</span> {teacher.name}</div>
                <div><span className="font-semibold">Teacher ID:</span> {teacher.id}</div>
                <div><span className="font-semibold">Education:</span> {teacher.education}</div>
            </div>
        </section>

        <main className="mt-8">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Date</TableHead>
                <TableHead className="w-[120px]">Day</TableHead>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead>Time In</TableHead>
                <TableHead>Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {daysInMonth.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const record = attendanceForMonth[dateStr];
                return (
                    <TableRow key={dateStr}>
                        <TableCell>{format(day, 'dd-MMM-yyyy')}</TableCell>
                        <TableCell>{format(day, 'EEEE')}</TableCell>
                        <TableCell>
                            {record ? (
                                <Badge variant={
                                    record.status === 'Present' ? 'default' : 
                                    record.status === 'Absent' ? 'destructive' :
                                    'secondary'
                                } className={
                                    record.status === 'Present' ? 'bg-green-600' :
                                    record.status === 'Late' ? 'bg-orange-500' : ''
                                }>
                                    {record.status}
                                </Badge>
                            ) : '-'}
                        </TableCell>
                        <TableCell>{record?.time || '-'}</TableCell>
                        <TableCell></TableCell>
                    </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </main>

        <section className="mt-8 grid grid-cols-4 gap-4 text-center">
            <div className="p-2 border rounded-md bg-green-100"><span className="font-semibold">Present:</span> {summary.present}</div>
            <div className="p-2 border rounded-md bg-red-100"><span className="font-semibold">Absent:</span> {summary.absent}</div>
            <div className="p-2 border rounded-md bg-orange-100"><span className="font-semibold">Late:</span> {summary.late}</div>
            <div className="p-2 border rounded-md bg-yellow-100"><span className="font-semibold">On Leave:</span> {summary.leave}</div>
        </section>
        
        <footer className="mt-24 pt-8 grid grid-cols-2 gap-16 text-center text-sm">
            <div>
                <div className="border-t-2 border-black pt-2">Teacher's Signature</div>
            </div>
             <div>
                <div className="border-t-2 border-black pt-2">Principal's Signature</div>
            </div>
        </footer>
      </div>
    );
  }
);

IndividualTeacherAttendancePrintReport.displayName = 'IndividualTeacherAttendancePrintReport';
