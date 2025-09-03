
'use client';

import React from 'react';
import type { Teacher } from '@/lib/types';
import { School } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';

interface TeacherSchedulePrintProps {
  teacher: Teacher;
  schedule: { [day: string]: { period: number; class: string; subject: string; section?: string, time: string }[] };
  daysOfWeek: string[];
}

export const TeacherSchedulePrint = React.forwardRef<HTMLDivElement, TeacherSchedulePrintProps>(
  ({ teacher, schedule, daysOfWeek }, ref) => {
    
    const periodHeaders = Array.from({ length: 8 }, (_, i) => `Period ${i + 1}`);

    const cellStyle: React.CSSProperties = {
        border: '1px solid #000',
        padding: '4px',
        height: '60px',
        textAlign: 'center',
        fontSize: '11px',
    };
    
    const headerStyle: React.CSSProperties = {
        ...cellStyle,
        fontWeight: 'bold',
        height: 'auto',
        backgroundColor: '#e5e7eb' // gray-200
    };

    return (
      <div ref={ref} className="p-8 font-sans bg-white text-black">
        <header className="flex items-center justify-between pb-4 border-b-2 border-black">
          <div className="flex items-center gap-4">
            {teacher.schoolLogo && <Image src={teacher.schoolLogo} alt="School Logo" width={64} height={64} className="object-contain" />}
            <div>
              <h1 className="text-3xl font-bold">{teacher.schoolName}</h1>
              <p className="text-sm">{teacher.schoolAddress}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-semibold">Teacher Schedule</h2>
            <p>Date: {format(new Date(), 'dd-MM-yyyy')}</p>
          </div>
        </header>

        <main className="mt-6">
            <h3 className="text-xl font-bold text-center mb-4">Teacher: {teacher.name}</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th style={headerStyle}>Day</th>
                        {periodHeaders.map(header => <th key={header} style={headerStyle}>{header}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {daysOfWeek.map(day => (
                        <tr key={day}>
                            <td style={{...cellStyle, fontWeight: 'bold'}}>{day}</td>
                            {periodHeaders.map((period, periodIndex) => {
                                const entry = schedule[day]?.find(e => e.period === (periodIndex + 1));
                                return (
                                    <td key={period} style={cellStyle}>
                                        {entry ? (
                                            <div>
                                                <p className="font-bold">{entry.class}</p>
                                                <p>{entry.subject}</p>
                                                <p className="text-gray-500 text-xs">{entry.time}</p>
                                            </div>
                                        ) : null}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </main>
        
        <footer className="flex justify-between items-center mt-24 pt-4 border-t-2 border-black">
            <div className="w-1/3 text-center">
                <p className="border-t-2 border-black pt-1">Teacher Signature</p>
            </div>
            <div className="w-1/3 text-center">
                <p>&copy; {new Date().getFullYear()} {teacher.schoolName}</p>
            </div>
            <div className="w-1/3 text-center">
                 <p className="border-t-2 border-black pt-1">Principal Signature</p>
            </div>
        </footer>
      </div>
    );
  }
);
TeacherSchedulePrint.displayName = 'TeacherSchedulePrint';
