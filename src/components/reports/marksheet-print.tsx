
'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { SchoolSettings } from '@/context/settings-context';
import { School } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';

interface MarksheetData {
  studentId: string;
  studentName: string;
  marks: { [subject: string]: number };
  obtainedMarks: number;
  totalMarks: number;
  percentage: number;
  position?: number;
}

interface MarksheetPrintReportProps {
  examName: string;
  className: string;
  subjects: string[];
  marksheetData: MarksheetData[];
  settings: SchoolSettings;
}

export const MarksheetPrintReport = React.forwardRef<HTMLDivElement, MarksheetPrintReportProps>(
  ({ examName, className, subjects, marksheetData, settings }, ref) => {
    // Style for table cells to ensure borders are visible on print
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
            <p className="text-sm text-gray-500">Date: {format(new Date(), 'PPP')}</p>
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
                <th style={{...headerCellStyle, textAlign: 'left'}}>Student Name</th>
                {subjects.map(s => <th key={s} style={headerCellStyle}>{s}</th>)}
                <th style={headerCellStyle}>Obtained</th>
                <th style={headerCellStyle}>Total</th>
                <th style={headerCellStyle}>%</th>
                <th style={headerCellStyle}>Position</th>
              </tr>
            </thead>
            <tbody>
              {marksheetData.map((row) => (
                <tr key={row.studentId}>
                  <td style={cellStyle}>{row.studentId}</td>
                  <td style={studentNameCellStyle}>{row.studentName}</td>
                  {subjects.map(subject => (
                      <td key={subject} style={cellStyle}>{row.marks[subject] || '-'}</td>
                  ))}
                  <td style={{...cellStyle, fontWeight: 'bold'}}>{row.obtainedMarks}</td>
                  <td style={cellStyle}>{row.totalMarks}</td>
                  <td style={{...cellStyle, fontWeight: 'bold'}}>{row.percentage.toFixed(2)}%</td>
                  <td style={{...cellStyle, fontWeight: 'bold'}}>{row.position}</td>
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

MarksheetPrintReport.displayName = 'MarksheetPrintReport';
