
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
}

const StudentReportCard = ({ student, tests, subject, settings }: { student: Student, tests: SingleSubjectTest[], subject: string, settings: SchoolSettings }) => {
  const studentTests = tests.filter(test => test.results[student.id] !== undefined);
  
  const grandTotalMarks = studentTests.reduce((total, test) => total + test.totalMarks, 0);
  const grandObtainedMarks = studentTests.reduce((total, test) => total + (test.results[student.id] || 0), 0);

  const cellStyle: React.CSSProperties = {
    border: '1px solid #ccc',
    padding: '6px',
    textAlign: 'center'
  };
  const headerCellStyle: React.CSSProperties = { ...cellStyle, fontWeight: 'bold', backgroundColor: '#f2f2f2' };

  return (
    <div className="printable-page p-8 font-sans bg-white text-black text-sm">
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

      <div className="my-6 space-y-2">
        <div className="flex items-center gap-4 p-2 border rounded-md">
            <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-600"/>
                <span className="font-bold">Student:</span> {student.name}
            </div>
             <div className="flex items-center gap-2">
                <span className="font-bold">Class:</span> {student.class}
            </div>
             <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-gray-600"/>
                <span className="font-bold">Subject:</span> {subject}
            </div>
        </div>
      </div>

      <main>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={headerCellStyle}>Test Name</th>
              <th style={headerCellStyle}>Date</th>
              <th style={headerCellStyle}>Obtained Marks</th>
              <th style={headerCellStyle}>Total Marks</th>
              <th style={headerCellStyle}>Percentage</th>
            </tr>
          </thead>
          <tbody>
            {studentTests.map(test => (
              <tr key={test.id}>
                <td style={{...cellStyle, textAlign: 'left'}}>{test.testName}</td>
                <td style={cellStyle}>{format(new Date(test.date), 'dd-MM-yyyy')}</td>
                <td style={cellStyle}>{test.results[student.id]}</td>
                <td style={cellStyle}>{test.totalMarks}</td>
                <td style={{...cellStyle, fontWeight: 'bold'}}>{(((test.results[student.id] || 0) / test.totalMarks) * 100).toFixed(1)}%</td>
              </tr>
            ))}
            {studentTests.length === 0 && (
                <tr><td colSpan={5} style={cellStyle}>No tests recorded for this student in this subject.</td></tr>
            )}
          </tbody>
           <tfoot>
            <tr className="bg-gray-200 font-bold">
                <td colSpan={2} style={headerCellStyle}>Grand Total</td>
                <td style={headerCellStyle}>{grandObtainedMarks}</td>
                <td style={headerCellStyle}>{grandTotalMarks}</td>
                <td style={headerCellStyle}>{grandTotalMarks > 0 ? `${((grandObtainedMarks / grandTotalMarks) * 100).toFixed(1)}%` : 'N/A'}</td>
            </tr>
           </tfoot>
        </table>
      </main>

      <footer className="mt-24 pt-4 border-t border-gray-400 text-center text-xs text-gray-500">
        <p>&copy; {new Date().getFullYear()} {settings.schoolName}. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export const SubjectSummaryPrintReport = React.forwardRef<HTMLDivElement, SubjectSummaryPrintReportProps>(
  ({ students, tests, subject, className, settings }, ref) => {
    return (
      <div ref={ref}>
        {students.map(student => (
          <StudentReportCard key={student.id} student={student} tests={tests} subject={subject} settings={settings} />
        ))}
      </div>
    );
  }
);

SubjectSummaryPrintReport.displayName = 'SubjectSummaryPrintReport';
