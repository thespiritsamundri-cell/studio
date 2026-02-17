

'use client';

import React from 'react';
import type { Teacher, TeacherAttendance } from '@/lib/types';
import type { SchoolSettings } from '@/context/settings-context';
import { format, isSunday } from 'date-fns';

interface TeacherAttendancePrintReportProps {
  teachers: Teacher[];
  daysInMonth: Date[];
  attendanceData: { teacher: Teacher, attendanceByDate: Record<string, TeacherAttendance | undefined> }[];
  month: Date;
  settings: SchoolSettings;
}

const getStatusContent = (status: 'Present' | 'Absent' | 'Leave' | 'Late' | undefined) => {
    if (!status) return { text: '-', color: 'transparent' };
    switch(status) {
        case 'Present': return { text: 'P', color: '#dcfce7' }; // green-100
        case 'Absent': return { text: 'A', color: '#fee2e2' }; // red-100
        case 'Leave': return { text: 'L', color: '#fef9c3' }; // yellow-100
        case 'Late': return { text: 'P', color: '#dcfce7' }; // Late is also Present
        default: return { text: '-', color: 'transparent' };
    }
};

export const TeacherAttendancePrintReport = React.forwardRef<HTMLDivElement, TeacherAttendancePrintReportProps>(
  ({ teachers, daysInMonth, attendanceData, month, settings }, ref) => {
    
    const cellStyle: React.CSSProperties = {
        border: '1px solid #ddd',
        padding: '2px',
        textAlign: 'center',
        fontSize: '10px',
        width: '24px',
        height: '24px'
    };
    
    return (
      <div ref={ref} className="p-4 font-sans bg-white text-black">
        <header className="text-center mb-4">
          <h1 className="text-2xl font-bold">{settings.schoolName}</h1>
          <p className="text-sm">{settings.schoolPhone}</p>
          <h2 className="text-lg font-semibold mt-2">Teacher Monthly Attendance Report</h2>
          <p className="text-sm">{format(month, 'MMMM, yyyy')}</p>
        </header>

        <main>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                <th style={{...cellStyle, textAlign: 'left', fontWeight: 'bold', width: '150px'}}>Teacher Name</th>
                {daysInMonth.map(day => (
                    <th key={day.toISOString()} style={{...cellStyle, fontWeight: 'bold', padding: '4px 2px'}}>
                        {format(day, 'd')}
                    </th>
                ))}
                <th style={{...cellStyle, fontWeight: 'bold', backgroundColor: '#dcfce7'}}>P</th>
                <th style={{...cellStyle, fontWeight: 'bold', backgroundColor: '#fee2e2'}}>A</th>
                <th style={{...cellStyle, fontWeight: 'bold', backgroundColor: '#fef9c3'}}>L</th>
              </tr>
            </thead>
            <tbody>
              {attendanceData.map(({ teacher, attendanceByDate }) => {
                const summary = { present: 0, absent: 0, leave: 0 };
                Object.entries(attendanceByDate).forEach(([date, record]) => {
                    if (record && !isSunday(new Date(date))) {
                        if (record.status === 'Present' || record.status === 'Late') summary.present++;
                        else if (record.status === 'Absent') summary.absent++;
                        else if (record.status === 'Leave') summary.leave++;
                    }
                });

                return (
                    <tr key={teacher.id}>
                        <td style={{...cellStyle, textAlign: 'left', whiteSpace: 'nowrap'}}>{teacher.name}</td>
                        {daysInMonth.map(day => {
                            const record = attendanceByDate[format(day, 'yyyy-MM-dd')];
                            const { text, color } = getStatusContent(record?.status);
                            const finalStyle = isSunday(day) 
                                ? {...cellStyle, backgroundColor: '#f3f4f6', color: '#a1a1aa'}
                                : {...cellStyle, backgroundColor: color};
                            return (
                                <td key={day.toISOString()} style={finalStyle}>
                                    {isSunday(day) ? 'S' : text}
                                </td>
                            );
                        })}
                        <td style={cellStyle}>{summary.present}</td>
                        <td style={cellStyle}>{summary.absent}</td>
                        <td style={cellStyle}>{summary.leave}</td>
                    </tr>
                );
              })}
            </tbody>
          </table>
        </main>
        
        <footer className="mt-8 pt-4 text-center text-xs text-gray-500">
          <p>Copyright © {new Date().getFullYear()} {settings.schoolName}. Developed by SchoolUP.</p>
        </footer>
      </div>
    );
  }
);
TeacherAttendancePrintReport.displayName = 'TeacherAttendancePrintReport';

    