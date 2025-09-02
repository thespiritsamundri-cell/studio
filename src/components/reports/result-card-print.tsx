
'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Student, Exam } from '@/lib/types';
import { School } from 'lucide-react';
import type { SchoolSettings } from '@/context/settings-context';
import Image from 'next/image';

interface ResultCardPrintProps {
  students: Student[];
  exams: Exam[];
  settings: SchoolSettings;
}

const ResultCard = ({ student, exams, settings }: { student: Student, exams: Exam[], settings: SchoolSettings }) => {
    const subjects = settings.subjects?.[student.class] || [];
    
    const getGrade = (percentage: number) => {
        if (percentage >= 90) return 'A+';
        if (percentage >= 80) return 'A';
        if (percentage >= 70) return 'B';
        if (percentage >= 60) return 'C';
        if (percentage >= 50) return 'D';
        if (percentage >= 40) return 'E';
        return 'F';
    };

    return (
        <div className="p-6 font-sans bg-white text-black border-4 border-double border-gray-800 w-full mx-auto" style={{ breakAfter: 'page', pageBreakAfter: 'always' }}>
            {/* Header */}
            <div className="text-center mb-4">
                {settings.schoolLogo && <Image src={settings.schoolLogo} alt="School Logo" width={80} height={80} className="object-contain mx-auto mb-2" />}
                <h1 className="text-3xl font-bold text-gray-800">{settings.schoolName}</h1>
                <p className="text-sm text-gray-500">{settings.schoolAddress}</p>
                <p className="text-sm text-gray-500">Phone: {settings.schoolPhone}</p>
                <h2 className="text-2xl font-semibold mt-2 underline">Progress Report Card</h2>
            </div>
            
            {/* Student Info */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 border-y-2 border-gray-800 py-2 my-4 text-sm">
                <div><span className="font-bold">Student Name:</span> {student.name}</div>
                <div><span className="font-bold">Father's Name:</span> {student.fatherName}</div>
                <div><span className="font-bold">Student ID:</span> {student.id}</div>
                <div><span className="font-bold">Class:</span> {student.class}</div>
            </div>

            {/* Marks Table */}
            <Table className="border">
                <TableHeader>
                    <TableRow className="bg-gray-200">
                        <TableHead className="font-bold border-r">Subjects</TableHead>
                        {exams.map(exam => (
                            <TableHead key={exam.id} className="text-center font-bold border-r">{exam.name}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {subjects.map(subject => (
                        <TableRow key={subject}>
                            <TableCell className="font-medium border-r">{subject}</TableCell>
                            {exams.map(exam => {
                                const result = exam.results.find(r => r.studentId === student.id);
                                const marks = result?.marks[subject] ?? '-';
                                return <TableCell key={exam.id} className="text-center border-r">{marks}</TableCell>;
                            })}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            
            {/* Summary Section */}
            <div className="mt-4">
                 <Table className="border">
                    <TableBody>
                        <TableRow>
                            <TableCell className="font-bold">Total Marks</TableCell>
                            {exams.map(exam => {
                                const total = Object.values(exam.subjectTotals).reduce((a,b) => a+b, 0);
                                return <TableCell key={exam.id} className="text-center font-bold">{total}</TableCell>;
                            })}
                        </TableRow>
                        <TableRow>
                            <TableCell className="font-bold">Obtained Marks</TableCell>
                            {exams.map(exam => {
                                const result = exam.results.find(r => r.studentId === student.id);
                                const obtained = result ? Object.values(result.marks).reduce((a,b) => a+b, 0) : 0;
                                return <TableCell key={exam.id} className="text-center font-bold">{obtained}</TableCell>;
                            })}
                        </TableRow>
                        <TableRow>
                            <TableCell className="font-bold">Percentage</TableCell>
                            {exams.map(exam => {
                                const total = Object.values(exam.subjectTotals).reduce((a,b) => a+b, 0);
                                const result = exam.results.find(r => r.studentId === student.id);
                                const obtained = result ? Object.values(result.marks).reduce((a,b) => a+b, 0) : 0;
                                const percentage = total > 0 ? ((obtained / total) * 100).toFixed(2) : 0;
                                return <TableCell key={exam.id} className="text-center font-bold">{percentage}%</TableCell>;
                            })}
                        </TableRow>
                        <TableRow>
                            <TableCell className="font-bold">Grade</TableCell>
                             {exams.map(exam => {
                                const total = Object.values(exam.subjectTotals).reduce((a,b) => a+b, 0);
                                const result = exam.results.find(r => r.studentId === student.id);
                                const obtained = result ? Object.values(result.marks).reduce((a,b) => a+b, 0) : 0;
                                const percentage = total > 0 ? ((obtained / total) * 100) : 0;
                                return <TableCell key={exam.id} className="text-center font-bold">{getGrade(percentage)}</TableCell>;
                            })}
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
            
            {/* Remarks and Signature */}
            <div className="mt-6 grid grid-cols-2 items-end">
                <div>
                    <h4 className="font-bold">Remarks:</h4>
                    <p className="mt-2">Congratulations on your hard work!</p>
                    <div className="border-b border-gray-500 mt-2"></div>
                    <div className="border-b border-gray-500 mt-2"></div>
                </div>
                 <div className="flex flex-col items-center">
                    {settings.principalSignature ? (
                        <Image src={settings.principalSignature} alt="Principal's Signature" width={150} height={60} className="object-contain" />
                    ) : (
                        <div className="h-[60px]"></div>
                    )}
                    <div className="border-t-2 border-gray-600 w-48 text-center pt-1">
                        <p className="font-bold">Principal's Signature</p>
                    </div>
                </div>
            </div>
        </div>
    );
};


export const ResultCardPrint = React.forwardRef<HTMLDivElement, ResultCardPrintProps>(
  ({ students, exams, settings }, ref) => {
    return (
      <div ref={ref}>
        {students.map(student => (
            <ResultCard key={student.id} student={student} exams={exams} settings={settings} />
        ))}
      </div>
    );
  }
);

ResultCardPrint.displayName = 'ResultCardPrint';

    