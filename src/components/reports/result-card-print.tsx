
'use client';

import React from 'react';
import type { Student, Exam, Class } from '@/lib/types';
import type { SchoolSettings } from '@/context/settings-context';
import Image from 'next/image';

interface ResultCardPrintProps {
  students: Student[];
  exams: Exam[];
  settings: SchoolSettings;
  classes: Class[];
  remarks: string;
}

const ResultCard = ({ student, exams, settings, classes, remarks }: { student: Student, exams: Exam[], settings: SchoolSettings, classes: Class[], remarks: string }) => {
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
    
    const grandTotalMarks = exams.reduce((acc, exam) => acc + Object.values(exam.subjectTotals).reduce((a,b) => a+b, 0), 0);
    const grandObtainedMarks = exams.reduce((acc, exam) => {
        const result = exam.results.find(r => r.studentId === student.id);
        const obtained = result ? Object.values(result.marks).reduce((a,b) => a+b, 0) : 0;
        return acc + obtained;
    }, 0);
    const grandPercentage = grandTotalMarks > 0 ? (grandObtainedMarks / grandTotalMarks * 100) : 0;


    return (
        <div className="p-6 font-sans bg-white text-black border-4 border-double border-gray-800 w-full mx-auto relative" style={{ breakAfter: 'page', pageBreakAfter: 'always' }}>
            {/* Watermark */}
            {settings.schoolLogo && (
                <div className="absolute inset-0 flex items-center justify-center z-0">
                    <Image src={settings.schoolLogo} alt="Watermark" width={300} height={300} className="object-contain opacity-10" />
                </div>
            )}
            <div className="relative z-10">
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
                <table className="w-full border-collapse border border-gray-400 text-sm">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="font-bold border border-gray-400 p-1">Subjects</th>
                            {exams.map(exam => (
                                 <th key={exam.id} className="text-center font-bold border border-gray-400 p-1">
                                     {exam.name}
                                     <span className="font-normal block"> (out of {Object.values(exam.subjectTotals).reduce((a, b) => a + b, 0)})</span>
                                 </th>
                            ))}
                            <th className="text-center font-bold border border-gray-400 p-1">Total</th>
                            <th className="text-center font-bold border border-gray-400 p-1">%</th>
                            <th className="text-center font-bold border border-gray-400 p-1">Grade</th>
                        </tr>
                    </thead>
                    <tbody>
                        {subjects.map(subject => {
                            let subjectTotalMarks = 0;
                            let subjectObtainedMarks = 0;
                            
                            return (
                                <tr key={subject}>
                                    <td className="font-medium border border-gray-400 p-1">{subject}</td>
                                    {exams.map(exam => {
                                        const result = exam.results.find(r => r.studentId === student.id);
                                        const marks = result?.marks[subject] ?? '-';
                                        const total = exam.subjectTotals[subject] || 0;
                                        subjectTotalMarks += total;
                                        subjectObtainedMarks += (typeof marks === 'number' ? marks : 0);
                                        return <td key={exam.id} className="text-center border border-gray-400 p-1">{marks} / {total}</td>;
                                    })}
                                    <td className="text-center border border-gray-400 p-1 font-semibold">{subjectObtainedMarks} / {subjectTotalMarks}</td>
                                    <td className="text-center border border-gray-400 p-1 font-semibold">{subjectTotalMarks > 0 ? ((subjectObtainedMarks/subjectTotalMarks) * 100).toFixed(1) : '0'}%</td>
                                    <td className="text-center border border-gray-400 p-1 font-semibold">{getGrade(subjectTotalMarks > 0 ? (subjectObtainedMarks/subjectTotalMarks) * 100 : 0)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                
                 {/* Summary Section */}
                <div className="mt-6 grid grid-cols-4 gap-4 text-center">
                    <div className="border border-gray-400 p-2 rounded-lg">
                        <h4 className="font-bold text-sm">Grand Total Marks</h4>
                        <p className="text-lg font-semibold">{grandTotalMarks}</p>
                    </div>
                     <div className="border border-gray-400 p-2 rounded-lg">
                        <h4 className="font-bold text-sm">Obtained Marks</h4>
                        <p className="text-lg font-semibold">{grandObtainedMarks}</p>
                    </div>
                     <div className="border border-gray-400 p-2 rounded-lg">
                        <h4 className="font-bold text-sm">Overall Percentage</h4>
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
                        <p className="mt-1 border-b border-gray-500 min-h-6">{remarks}</p>
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
        </div>
    );
};


export const ResultCardPrint = React.forwardRef<HTMLDivElement, ResultCardPrintProps>(
  ({ students, exams, settings, classes, remarks }, ref) => {
    return (
      <div ref={ref}>
        {students.map(student => (
            <ResultCard key={student.id} student={student} exams={exams} settings={settings} classes={classes} remarks={remarks} />
        ))}
      </div>
    );
  }
);

ResultCardPrint.displayName = 'ResultCardPrint';
