
'use client';

import React from 'react';
import type { Student, Class } from '@/lib/types';
import type { SchoolSettings } from '@/context/settings-context';
import { format, isSunday } from 'date-fns';
import Image from 'next/image';

interface BlankAttendanceSheetProps {
  classInfo: Class;
  students: Student[];
  daysInMonth: Date[];
  month: Date;
  settings: SchoolSettings;
}

export const BlankAttendanceSheet = React.forwardRef<HTMLDivElement, BlankAttendanceSheetProps>(
  ({ classInfo, students, daysInMonth, month, settings }, ref) => {
    const cellStyle: React.CSSProperties = {
        border: '1px solid #ddd',
        padding: '2px',
        textAlign: 'center',
        fontSize: '10px',
        width: '24px',
        height: '40px' // Taller for manual entry
    };

    return (
      <div ref={ref} className="p-4 font-sans bg-white text-black">
        <header className="text-center mb-4">
          {settings.schoolLogo && (
            <Image src={settings.schoolLogo} alt="School Logo" width={60} height={60} className="object-contain mx-auto mb-2" />
          )}
          <h1 className="text-2xl font-bold uppercase">{settings.schoolName}</h1>
          <p className="text-sm">{settings.schoolPhone}</p>
          <h2 className="text-lg font-semibold mt-2">Attendance Sheet</h2>
        </header>

        <div className="flex justify-between items-center text-sm mt-4 mb-4 px-2">
            <span><strong className="font-bold">Class:</strong> {classInfo.name}</span>
            <span><strong className="font-bold">Month:</strong> {format(month, 'MMMM, yyyy')}</span>
            <span><strong className="font-bold">Teacher's Name:</strong> ........................................</span>
        </div>

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
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                    <td style={{...cellStyle, textAlign: 'left', whiteSpace: 'nowrap'}}>{student.name}</td>
                    {daysInMonth.map(day => {
                        const finalStyle: React.CSSProperties = isSunday(day) 
                            ? {...cellStyle, backgroundColor: '#f3f4f6' }
                            : cellStyle;
                        return (
                            <td key={day.toISOString()} style={finalStyle}>
                                {isSunday(day) ? <span style={{color: '#ef4444', fontWeight: 'bold'}}>S</span> : ''}
                            </td>
                        );
                    })}
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
BlankAttendanceSheet.displayName = 'BlankAttendanceSheet';
