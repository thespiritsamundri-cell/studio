
'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Student } from '@/lib/types';
import type { SchoolSettings } from '@/context/settings-context';
import Image from 'next/image';
import { format } from 'date-fns';

interface BlankMarksheetData extends Student {}

interface BlankMarksheetPrintProps {
  testName: string;
  className: string;
  subject: string;
  students: BlankMarksheetData[];
  totalMarks: number;
  settings: SchoolSettings;
}

export const BlankMarksheetPrint = React.forwardRef<HTMLDivElement, BlankMarksheetPrintProps>(
  ({ testName, className, subject, students, totalMarks, settings }, ref) => {
    
    const cellStyle: React.CSSProperties = {
        border: '1px solid #ccc',
        padding: '8px',
    };
     const headerCellStyle: React.CSSProperties = {
        ...cellStyle,
        fontWeight: 'bold',
        backgroundColor: '#f2f2f2',
        textAlign: 'center'
    };
    const studentNameCellStyle: React.CSSProperties = {
        ...cellStyle,
        textAlign: 'left'
    };
    const emptyCellStyle: React.CSSProperties = {
        ...cellStyle,
        height: '30px', // Provide vertical space for writing
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
            <h3 className="text-xl font-semibold">
                <span className="font-bold">Class :</span> {className} &nbsp;&nbsp;|&nbsp;&nbsp; <span className="font-bold">Subject :</span> {subject} &nbsp;&nbsp;|&nbsp;&nbsp; <span className="font-bold">Test :</span> {testName}
            </h3>
        </div>

        <main className="mt-8">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={headerCellStyle}>Roll No.</th>
                <th style={studentNameCellStyle}>Student Name</th>
                <th style={headerCellStyle}>Obtained Marks</th>
                <th style={headerCellStyle}>Total Marks</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td style={{...cellStyle, textAlign: 'center'}}>{student.id}</td>
                  <td style={studentNameCellStyle}>{student.name}</td>
                  <td style={emptyCellStyle}></td>
                  <td style={{...cellStyle, textAlign: 'center'}}>{totalMarks}</td>
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

BlankMarksheetPrint.displayName = 'BlankMarksheetPrint';
