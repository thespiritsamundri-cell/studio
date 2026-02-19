
'use client';

import React from 'react';
import type { Student, Attendance } from '@/lib/types';
import type { SchoolSettings } from '@/context/settings-context';
import { format, isSunday } from 'date-fns';

const getStatusContent = (status: 'Present' | 'Absent' | 'Leave' | undefined) => {
    if (!status) return { text: '-', color: 'transparent', textColor: '#000' };
    switch(status) {
        case 'Present': return { text: 'P', color: '#dcfce7', textColor: '#14532d' };
        case 'Absent': return { text: 'A', color: '#dc2626', textColor: '#ffffff' };
        case 'Leave': return { text: 'L', color: '#fef08a', textColor: '#713f12' };
        default: return { text: '-', color: 'transparent', textColor: '#000' };
    }
};

interface ClassAttendancePrintReportProps {
  students: Student[];
  daysInMonth: Date[];
  attendanceData: { student: Student, attendanceByDate: Record<string, Attendance | undefined>, summary: any }[];
  month: Date;
  settings: SchoolSettings;
}

export const ClassAttendancePrintReport = React.forwardRef<HTMLDivElement, ClassAttendancePrintReportProps>(
  ({ students, daysInMonth, attendanceData, month, settings }, ref) => {
    
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
          <h2 className="text-lg font-semibold mt-2">Student Monthly Attendance Report</h2>
          <p className="text-sm">{format(month, 'MMMM, yyyy')}</p>
        </header>

        <main>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                <th style={{...cellStyle, textAlign: 'left', fontWeight: 'bold', width: '150px'}}>Student Name</th>
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
              {attendanceData.map(({ student, attendanceByDate, summary }) => (
                <tr key={student.id}>
                    <td style={{...cellStyle, textAlign: 'left', whiteSpace: 'nowrap'}}>{student.name}</td>
                    {daysInMonth.map(day => {
                        const record = attendanceByDate[format(day, 'yyyy-MM-dd')];
                        const { text, color, textColor } = getStatusContent(record?.status);
                        const finalStyle: React.CSSProperties = isSunday(day) 
                            ? {...cellStyle, backgroundColor: '#f3f4f6', color: '#ef4444', fontWeight: 'bold'}
                            : {...cellStyle, backgroundColor: color, color: textColor, fontWeight: 'bold'};
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
              ))}
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
ClassAttendancePrintReport.displayName = 'ClassAttendancePrintReport';
