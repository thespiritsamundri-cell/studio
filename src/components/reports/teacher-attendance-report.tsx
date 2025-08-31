
'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Teacher } from '@/lib/types';
import { School } from 'lucide-react';
import { useSettings } from '@/context/settings-context';
import Image from 'next/image';
import { format } from 'date-fns';
import { Badge } from '../ui/badge';

type AttendanceStatus = 'Present' | 'Absent' | 'Leave';
interface TeacherAttendancePrintReportProps {
  teachers: Teacher[];
  daysInMonth: Date[];
  attendanceData: { teacher: Teacher, attendanceByDate: Record<string, AttendanceStatus | undefined> }[];
  month: Date;
}

export const TeacherAttendancePrintReport = React.forwardRef<HTMLDivElement, TeacherAttendancePrintReportProps>(
  ({ teachers, daysInMonth, attendanceData, month }, ref) => {
    const { settings } = useSettings();

    const getStatusBadge = (status: AttendanceStatus | undefined) => {
      if (!status) return <span style={{ color: '#a1a1aa' }}>-</span>; // gray-400
      switch(status) {
          case 'Present': return <span style={{ color: 'green' }}>P</span>;
          case 'Absent': return <span style={{ color: 'red' }}>A</span>;
          case 'Leave': return <span style={{ color: 'orange' }}>L</span>;
          default: return <span style={{ color: '#a1a1aa' }}>-</span>;
      }
    };
    
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
            <h2 className="text-2xl font-semibold text-gray-700">Teacher Attendance Report</h2>
            <p className="text-sm text-gray-500">Month: {format(month, 'MMMM yyyy')}</p>
          </div>
        </header>

        <main className="mt-8">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Teacher</TableHead>
                {daysInMonth.map(day => (
                    <TableHead key={day.toISOString()} className="text-center">{format(day, 'd')}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceData.map(({ teacher, attendanceByDate }) => (
                <TableRow key={teacher.id}>
                    <TableCell className="font-medium">{teacher.name}</TableCell>
                    {daysInMonth.map(day => (
                        <TableCell key={day.toISOString()} className="text-center text-xs">
                            {getStatusBadge(attendanceByDate[format(day, 'yyyy-MM-dd')])}
                        </TableCell>
                    ))}
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

TeacherAttendancePrintReport.displayName = 'TeacherAttendancePrintReport';
