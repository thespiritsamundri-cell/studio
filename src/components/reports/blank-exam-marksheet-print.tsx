
'use client';

import React from 'react';
import type { Student } from '@/lib/types';
import type { SchoolSettings } from '@/context/settings-context';
import Image from 'next/image';
import { format } from 'date-fns';

interface BlankExamMarksheetPrintProps {
  examName: string;
  className: string;
  subjects: string[];
  students: Student[];
  subjectTotals: { [subject: string]: number };
  settings: SchoolSettings;
}

export const BlankExamMarksheetPrint = React.forwardRef<HTMLDivElement, BlankExamMarksheetPrintProps>(
  ({ examName, className, subjects, students, subjectTotals, settings }, ref) => {
    
    const cellStyle: React.CSSProperties = {
        border: '1px solid #ccc',
        padding: '8px',
        textAlign: 'center'
    };
    const headerCellStyle: React.CSSProperties = {
        ...cellStyle,
        fontWeight: 'bold',
        backgroundColor: '#f2f2f2'
    };
     const studentNameCellStyle: React.CSSProperties = {
        ...cellStyle,
        textAlign: 'left'
    };
    const emptyCellStyle: React.CSSProperties = {
        ...cellStyle,
        height: '30px', 
    };

    return (
      <div ref={ref} className="p-8 font-sans bg-white text-black text-sm">
        <header className="flex items-start justify-between pb-4 border-b border-gray-300">
          <div className="flex items-center gap-4">
            {settings.schoolLogo && (
              <Image src={settings.schoolLogo} alt="School Logo" width={64} height={64} className="object-contain" />
            )}
            <div>
              <h1 className="text-4xl font-bold text-gray-800">{settings.schoolName}</h1>
              <p className="text-base text-gray-500">{settings.schoolAddress}</p>
              <p className="text-base text-gray-500">Phone: {settings.schoolPhone}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-semibold text-gray-700">Blank Marksheet</h2>
            <p className="text-base text-gray-500">Date: {format(new Date(), 'PPP')}</p>
          </div>
        </header>
        
        <div className="text-center my-6">
            <h3 className="text-xl font-bold">{examName}</h3>
            <p className="text-lg font-semibold">Class: {className}</p>
        </div>

        <main className="mt-8">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={headerCellStyle}>Roll No.</th>
                <th style={studentNameCellStyle}>Student Name</th>
                {subjects.map(s => <th key={s} style={headerCellStyle}>{s}<br/>({subjectTotals[s] || 100})</th>)}
                <th style={headerCellStyle}>Obtained</th>
                <th style={headerCellStyle}>Total</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td style={cellStyle}>{student.id}</td>
                  <td style={studentNameCellStyle}>{student.name}</td>
                  {subjects.map(subject => (
                      <td key={subject} style={emptyCellStyle}></td>
                  ))}
                  <td style={emptyCellStyle}></td>
                  <td style={cellStyle}>{Object.values(subjectTotals).reduce((a, b) => a + b, 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </main>
        
        <footer className="mt-12 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
          <p>This is a computer-generated report.</p>
          <p>&copy; {new Date().getFullYear()} {settings.schoolName}. All rights reserved.</p>
        </footer>
      </div>
    );
  }
);

BlankExamMarksheetPrint.displayName = 'BlankExamMarksheetPrint';
