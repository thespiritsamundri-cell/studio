

'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Teacher, TeacherAttendance } from '@/lib/types';
import { School } from 'lucide-react';
import type { SchoolSettings } from '@/context/settings-context';
import Image from 'next/image';
import { format, isSunday } from 'date-fns';

type AttendanceStatus = 'Present' | 'Absent' | 'Leave' | 'Late';
interface TeacherAttendancePrintReportProps {
  teachers: Teacher[];
  daysInMonth: Date[];
  attendanceData: { teacher: Teacher, attendanceByDate: Record<string, TeacherAttendance | undefined> }[];
  month: Date;
  settings: SchoolSettings;
}

export const TeacherAttendancePrintReport = React.forwardRef<HTMLDivElement, TeacherAttendancePrintReportProps>(
  ({ teachers, daysInMonth, attendanceData, month, settings }, ref) => {

    const getStatusContent = (attendanceRecord: TeacherAttendance | undefined, day: Date) => {
      if (isSunday(day)) {
        return <span style={{ fontWeight: 'bold', color: '#a1a1aa' }}>SUN</span>
      }
      if (!attendanceRecord) return <span style={{ color: '#a1a1aa' }}>-</span>;
      
      const { status, time } = attendanceRecord;
  
      const statusChar = (() => {
           switch(status) {
              case 'Present': return <span style={{ color: 'green', fontWeight: 'bold' }}>P</span>;
              case 'Absent': return <span style={{ color: 'red', fontWeight: 'bold' }}>A</span>;
              case 'Leave': return <span style={{ color: 'orange', fontWeight: 'bold' }}>L</span>;
              case 'Late': return <span style={{ color: '#f97316', fontWeight: 'bold' }}>LT</span>;
              default: return <span style={{ color: '#a1a1aa' }}>-</span>;
          }
      })();
  
      return (
          <div>
              <div>{statusChar}</div>
              {(status === 'Present' || status === 'Late') && time && (
                  <div style={{ fontSize: '8px', color: '#6b7280' }}>{time}</div>
              )}
          </div>
      );
    };
    
    return (
      <div ref={ref} className="p-4 font-sans bg-white text-black text-xs">
        <header className="flex items-center justify-between pb-4 border-b border-gray-300">
          <div className="flex items-center gap-4">
             {settings.schoolLogo ? (
              <Image src={settings.schoolLogo} alt="School Logo" width={64} height={64} className="object-contain" />
            ) : (
              <School className="w-16 h-16 text-blue-500" />
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{settings.schoolName}</h1>
              <p className="text-sm text-gray-500">{settings.schoolAddress}</p>
              <p className="text-sm text-gray-500">Phone: {settings.schoolPhone}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-semibold text-gray-700">Teacher Attendance Report</h2>
            <p className="text-sm text-gray-500">Month: {format(month, 'MMMM yyyy')}</p>
          </div>
        </header>

        <main className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[120px] p-1 border">Teacher</TableHead>
                {daysInMonth.map(day => (
                    <TableHead key={day.toISOString()} className="text-center p-1 border" style={isSunday(day) ? {backgroundColor: '#f3f4f6'} : {}}>
                        {format(day, 'd')}
                    </TableHead>
                ))}
                <TableHead className="text-center p-1 border text-green-600">P</TableHead>
                <TableHead className="text-center p-1 border text-red-600">A</TableHead>
                <TableHead className="text-center p-1 border text-orange-500">LT</TableHead>
                <TableHead className="text-center p-1 border text-yellow-500">L</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceData.map(({ teacher, attendanceByDate }) => {
                const summary = { present: 0, absent: 0, late: 0, leave: 0 };
                Object.values(attendanceByDate).forEach(record => {
                    if (record) {
                        if (record.status === 'Present') summary.present++;
                        else if (record.status === 'Absent') summary.absent++;
                        else if (record.status === 'Late') summary.late++;
                        else if (record.status === 'Leave') summary.leave++;
                    }
                });

                return (
                    <TableRow key={teacher.id}>
                        <TableCell className="font-medium p-1 border">{teacher.name}</TableCell>
                        {daysInMonth.map(day => (
                            <TableCell key={day.toISOString()} className="text-center p-1 h-12 border" style={isSunday(day) ? {backgroundColor: '#f3f4f6'} : {}}>
                                {getStatusContent(attendanceByDate[format(day, 'yyyy-MM-dd')], day)}
                            </TableCell>
                        ))}
                        <TableCell className="text-center font-bold p-1 border">{summary.present}</TableCell>
                        <TableCell className="text-center font-bold p-1 border">{summary.absent}</TableCell>
                        <TableCell className="text-center font-bold p-1 border">{summary.late}</TableCell>
                        <TableCell className="text-center font-bold p-1 border">{summary.leave}</TableCell>
                    </TableRow>
                );
              })}
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
