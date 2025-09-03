
'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Student, Exam, Class } from '@/lib/types';
import type { SchoolSettings } from '@/context/settings-context';
import Image from 'next/image';
import { useData } from '@/context/data-context';

interface ResultCardPrintProps {
  students: Student[];
  exams: Exam[];
  settings: SchoolSettings;
  classes: Class[];
}

const ResultCard = ({ student, exams, settings, classes }: { student: Student, exams: Exam[], settings: SchoolSettings, classes: Class[] }) => {
    const studentClassInfo = classes.find(c => c.name === student.class);
    const subjects = studentClassInfo?.subjects || [];
    
    const getGrade = (percentage: number) => {
        if (percentage >= 90) return 'A+';
        if (percentage >= 80) return 'A';
        if (percentage >= 70) return 'B';
        if (percentage >= 60) return 'C';
        if (percentage >= 50) return 'D';
        if (percentage >= 40) return 'E';
        return 'F';
    };

    const overall = exams.map(exam => {
        const total = Object.values(exam.subjectTotals).reduce((a,b) => a+b, 0);
        const result = exam.results.find(r => r.studentId === student.id);
        const obtained = result ? Object.values(result.marks).reduce((a,b) => a+b, 0) : 0;
        const percentage = total > 0 ? ((obtained / total) * 100) : 0;
        const grade = getGrade(percentage);
        return { total, obtained, percentage: percentage.toFixed(2), grade };
    });
    
    const grandTotalMarks = overall.reduce((acc, curr) => acc + curr.total, 0);
    const grandObtainedMarks = overall.reduce((acc, curr) => acc + curr.obtained, 0);
    const grandPercentage = grandTotalMarks > 0 ? (grandObtainedMarks / grandTotalMarks * 100) : 0;


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
            <table className="w-full border-collapse border border-gray-400">
                <thead>
                    <tr className="bg-gray-200">
                        <th className="font-bold border border-gray-400 p-2">Subjects</th>
                        {exams.map(exam => (
                             <th key={exam.id} className="text-center font-bold border border-gray-400 p-2">{exam.name}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {subjects.map(subject => (
                        <tr key={subject}>
                            <td className="font-medium border border-gray-400 p-2">{subject}</td>
                            {exams.map(exam => {
                                const result = exam.results.find(r => r.studentId === student.id);
                                const marks = result?.marks[subject] ?? '-';
                                return <td key={exam.id} className="text-center border border-gray-400 p-2">{marks}</td>;
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
            
             {/* Summary Section */}
            <div className="mt-6 grid grid-cols-4 gap-4 text-center">
                <div className="border border-gray-400 p-2 rounded-lg">
                    <h4 className="font-bold text-sm">Total Marks</h4>
                    <p className="text-lg font-semibold">{grandTotalMarks}</p>
                </div>
                 <div className="border border-gray-400 p-2 rounded-lg">
                    <h4 className="font-bold text-sm">Obtained Marks</h4>
                    <p className="text-lg font-semibold">{grandObtainedMarks}</p>
                </div>
                 <div className="border border-gray-400 p-2 rounded-lg">
                    <h4 className="font-bold text-sm">Percentage</h4>
                    <p className="text-lg font-semibold">{grandPercentage.toFixed(2)}%</p>
                </div>
                 <div className="border border-gray-400 p-2 rounded-lg">
                    <h4 className="font-bold text-sm">Overall Grade</h4>
                    <p className="text-lg font-semibold">{getGrade(grandPercentage)}</p>
                </div>
            </div>
            
            {/* Remarks and Signature */}
            <div className="mt-8 grid grid-cols-2 items-end">
                <div>
                    <h4 className="font-bold">Remarks:</h4>
                    <p className="mt-1">Congratulations on your hard work!</p>
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


export const ResultCardPrint = React.forwardRef<HTMLDivElement, Omit<ResultCardPrintProps, 'classes'>>(
  ({ students, exams, settings }, ref) => {
    const { classes } = useData();
    return (
      <div ref={ref}>
        {students.map(student => (
            <ResultCard key={student.id} student={student} exams={exams} settings={settings} classes={classes} />
        ))}
      </div>
    );
  }
);

ResultCardPrint.displayName = 'ResultCardPrint';
