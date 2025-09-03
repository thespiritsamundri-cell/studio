

'use client';

import React from 'react';
import type { Teacher } from '@/lib/types';
import type { SchoolSettings } from '@/context/settings-context';
import { School } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';

interface TeacherSchedulePrintProps {
  teacher: Teacher;
  schedule: { period: number; class: string; subject: string; time: string }[];
  settings: SchoolSettings;
}

export const TeacherSchedulePrint = React.forwardRef<HTMLDivElement, TeacherSchedulePrintProps>(
  ({ teacher, schedule, settings }, ref) => {
    
    const cellStyle: React.CSSProperties = {
        border: '1px solid #000',
        padding: '4px',
        height: 'auto',
        textAlign: 'center',
        fontSize: '11px',
        verticalAlign: 'top'
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
            {settings.schoolLogo && <Image src={settings.schoolLogo} alt="School Logo" width={64} height={64} className="object-contain" />}
            <div>
              <h1 className="text-3xl font-bold">{settings.schoolName}</h1>
              <p className="text-sm">{settings.schoolAddress}</p>
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
                        <th style={headerStyle}>Period</th>
                        <th style={headerStyle}>Time</th>
                        <th style={headerStyle}>Class</th>
                        <th style={headerStyle}>Subject</th>
                    </tr>
                </thead>
                <tbody>
                     {schedule.length > 0 ? (
                        schedule.map((entry) => (
                            <tr key={`${entry.period}-${entry.class}`}>
                                <td style={cellStyle}>{entry.period}</td>
                                <td style={cellStyle}>{entry.time || '-'}</td>
                                <td style={cellStyle}>{entry.class}</td>
                                <td style={cellStyle}>{entry.subject}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={4} style={{...cellStyle, color: '#6b7280'}}>No periods scheduled.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </main>
        
        <footer className="flex justify-between items-center mt-24 pt-4 border-t-2 border-black">
            <div className="w-1/3 text-center">
                <p className="border-t-2 border-black pt-1">Teacher Signature</p>
            </div>
            <div className="w-1/3 text-center">
                <p>&copy; {new Date().getFullYear()} {settings.schoolName}</p>
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
