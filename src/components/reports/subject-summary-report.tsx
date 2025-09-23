
'use client';

import React from 'react';
import type { Student, SingleSubjectTest } from '@/lib/types';
import type { SchoolSettings } from '@/context/settings-context';
import { School, User, BookOpen } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';

interface SubjectSummaryPrintReportProps {
  students: Student[];
  tests: SingleSubjectTest[];
  subject: string;
  className: string;
  settings: SchoolSettings;
  fontSize: number;
}

export const SubjectSummaryPrintReport = React.forwardRef<HTMLDivElement, SubjectSummaryPrintReportProps>(
  ({ students, tests, subject, className, settings, fontSize }, ref) => {
    
    const cellStyle: React.CSSProperties = {
      border: '1px solid #999',
      padding: '4px',
      textAlign: 'center',
      whiteSpace: 'nowrap',
    };
    const headerCellStyle: React.CSSProperties = { ...cellStyle, fontWeight: 'bold', backgroundColor: '#f2f2f2' };
    const nameCellStyle: React.CSSProperties = { ...cellStyle, textAlign: 'left', minWidth: '150px' };

    const sortedTests = tests.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
      <div ref={ref} className="p-8 font-sans bg-white text-black" style={{ fontSize: `${fontSize}px` }}>
        <header className="flex items-start justify-between pb-4 border-b border-gray-400">
          <div className="flex items-center gap-4">
            {settings.schoolLogo && <Image src={settings.schoolLogo} alt="School Logo" width={64} height={64} className="object-contain" />}
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{settings.schoolName}</h1>
              <p className="text-sm text-gray-500">{settings.schoolAddress}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-semibold text-gray-700">Subject Progress Report</h2>
            <p className="text-sm text-gray-500">Date: {format(new Date(), 'PPP')}</p>
          </div>
        </header>

        <div className="my-6 text-center">
            <h3 className="text-xl font-bold">
                Class: {className} | Subject: {subject}
            </h3>
        </div>

        <main>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
            <thead>
              <tr>
                <th rowSpan={2} style={nameCellStyle}>Student Name</th>
                {sortedTests.map(test => (
                  <th key={test.id} style={headerCellStyle}>
                      {test.testName}
                      <br/>
                      ({format(new Date(test.date), 'dd-MMM-yy')})
                  </th>
                ))}
                <th rowSpan={2} style={headerCellStyle}>Overall %</th>
              </tr>
              <tr>
                {sortedTests.map(test => (
                  <th key={`${test.id}-total`} style={headerCellStyle}>
                    Total: {test.totalMarks}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
                {students.map(student => {
                    let grandTotalMarks = 0;
                    let grandObtainedMarks = 0;

                    sortedTests.forEach(test => {
                        grandTotalMarks += test.totalMarks;
                        grandObtainedMarks += test.results[student.id] || 0;
                    });
                    
                    const overallPercentage = grandTotalMarks > 0 ? ((grandObtainedMarks / grandTotalMarks) * 100) : 0;

                    return (
                        <tr key={student.id}>
                            <td style={nameCellStyle}>{student.name}</td>
                            {sortedTests.map(test => (
                                <td key={test.id} style={cellStyle}>
                                    {test.results[student.id] ?? '-'}
                                </td>
                            ))}
                            <td style={{...cellStyle, fontWeight: 'bold'}}>{overallPercentage.toFixed(1)}%</td>
                        </tr>
                    );
                })}
                 {students.length === 0 && (
                    <tr><td colSpan={sortedTests.length + 2} style={cellStyle}>No students in this class.</td></tr>
                 )}
            </tbody>
          </table>
        </main>

        <footer className="mt-12 pt-4 border-t border-gray-400 text-center text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} {settings.schoolName}. All Rights Reserved.</p>
        </footer>
      </div>
    );
  }
);

SubjectSummaryPrintReport.displayName = 'SubjectSummaryPrintReport';
