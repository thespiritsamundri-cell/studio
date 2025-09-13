
'use client';

import React from 'react';
import type { Student, Exam, Class, Grade } from '@/lib/types';
import type { SchoolSettings } from '@/context/settings-context';
import Image from 'next/image';

interface ResultCardPrintProps {
  students: Student[];
  exams: Exam[];
  settings: SchoolSettings;
  classes: Class[];
  remarks: string;
  printOrientation: 'portrait' | 'landscape';
}

const ResultCard = ({ student, exams, settings, classes, remarks, printOrientation }: { student: Student, exams: Exam[], settings: SchoolSettings, classes: Class[], remarks: string, printOrientation: 'portrait' | 'landscape' }) => {
    const studentClassInfo = classes.find(c => c.name === student.class);
    const subjects = studentClassInfo?.subjects || [];
    
    const getGrade = (percentage: number) => {
        if (!settings.gradingSystem || settings.gradingSystem.length === 0) {
            if (percentage >= 90) return 'A+';
            if (percentage >= 80) return 'A';
            if (percentage >= 70) return 'B';
            if (percentage >= 60) return 'C';
            if (percentage >= 50) return 'D';
            if (percentage >= 40) return 'E';
            return 'F';
        }
        const sortedGrades = [...settings.gradingSystem].sort((a, b) => b.minPercentage - a.minPercentage);
        for (const grade of sortedGrades) {
            if (percentage >= grade.minPercentage) {
                return grade.name;
            }
        }
        return 'F'; 
    };
    
    const grandTotalMarks = exams.reduce((total, exam) => {
        const result = exam.results.find(r => r.studentId === student.id);
        if (!result) return total;
        return total + subjects.reduce((subTotal, subject) => {
            const subjectTotal = exam.subjectTotals[subject] || 0;
            return subTotal + subjectTotal;
        }, 0);
    }, 0);

    const grandObtainedMarks = exams.reduce((total, exam) => {
        const result = exam.results.find(r => r.studentId === student.id);
        if (!result) return total;
        return total + subjects.reduce((subTotal, subject) => subTotal + (result.marks[subject] || 0), 0);
    }, 0);

    const grandPercentage = grandTotalMarks > 0 ? (grandObtainedMarks / grandTotalMarks * 100) : 0;


    return (
        <div className="p-6 font-sans bg-white text-black border-4 border-double border-gray-800 w-full mx-auto relative" data-orientation={printOrientation}>
             {settings.schoolLogo && (
                <div className="absolute inset-0 flex items-center justify-center z-0">
                    <Image src={settings.schoolLogo} alt="Watermark" width={300} height={300} className="object-contain opacity-10" />
                </div>
            )}
            <div className="relative z-10">
                <div className="text-center mb-4">
                    {settings.schoolLogo && <Image src={settings.schoolLogo} alt="School Logo" width={80} height={80} className="object-contain mx-auto mb-2" />}
                    <h1 className="text-3xl font-bold text-gray-800">{settings.schoolName}</h1>
                    <p className="text-sm text-gray-500">{settings.schoolAddress}</p>
                    <p className="text-sm text-gray-500">Phone: {settings.schoolPhone}</p>
                    <h2 className="text-2xl font-semibold mt-2 underline">Progress Report Card</h2>
                </div>
                
                <div className="flex justify-between items-center my-4 border-y-2 border-gray-800 py-2">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        <div><span className="font-bold">Student Name:</span> {student.name}</div>
                        <div><span className="font-bold">Father's Name:</span> {student.fatherName}</div>
                        <div><span className="font-bold">Student ID:</span> {student.id}</div>
                        <div><span className="font-bold">Class:</span> {student.class}</div>
                    </div>
                    <Image
                        src={student.photoUrl}
                        alt="Student Photo"
                        width={80}
                        height={80}
                        className="object-cover rounded-md border-2 border-gray-300"
                        data-ai-hint="student photo"
                    />
                </div>

                <table className="w-full border-collapse border border-gray-400 text-sm">
                    <thead>
                        <tr className="bg-gray-200">
                            <th rowSpan={2} className="font-bold border border-gray-400 p-1 align-bottom">Subjects</th>
                            {exams.map(exam => (
                                 <th key={exam.id} colSpan={2} className="text-center font-bold border border-gray-400 p-1">
                                     {exam.name}
                                 </th>
                            ))}
                            <th colSpan={3} className="text-center font-bold border border-gray-400 p-1">Grand Total</th>
                        </tr>
                        <tr className="bg-gray-200">
                           {exams.map(exam => (
                                <React.Fragment key={exam.id}>
                                    <th className="font-bold border border-gray-400 p-1">Obtained</th>
                                    <th className="font-bold border border-gray-400 p-1">Total</th>
                                </React.Fragment>
                           ))}
                             <th className="font-bold border border-gray-400 p-1">Obt. / Total</th>
                             <th className="font-bold border border-gray-400 p-1">%</th>
                             <th className="font-bold border border-gray-400 p-1">Grade</th>
                        </tr>
                    </thead>
                    <tbody>
                        {subjects.map(subject => {
                            let subjectTotalMarks = 0;
                            let subjectObtainedMarks = 0;
                            
                            exams.forEach(exam => {
                                const result = exam.results.find(r => r.studentId === student.id);
                                const marks = result?.marks[subject] ?? 0;
                                const total = exam.subjectTotals[subject] || 0;
                                subjectTotalMarks += total;
                                subjectObtainedMarks += marks;
                            });

                            const subjectPercentage = subjectTotalMarks > 0 ? (subjectObtainedMarks / subjectTotalMarks * 100) : 0;
                            
                            return (
                                <tr key={subject}>
                                    <td className="font-medium border border-gray-400 p-1">{subject}</td>
                                    {exams.map(exam => {
                                        const result = exam.results.find(r => r.studentId === student.id);
                                        const marks = result?.marks[subject] ?? '-';
                                        const total = exam.subjectTotals[subject] || 0;
                                        return (
                                            <React.Fragment key={exam.id}>
                                                <td className="text-center border border-gray-400 p-1">{marks}</td>
                                                <td className="text-center border border-gray-400 p-1">{total}</td>
                                            </React.Fragment>
                                        );
                                    })}
                                    <td className="text-center border border-gray-400 p-1 font-semibold">{subjectObtainedMarks}/{subjectTotalMarks}</td>
                                    <td className="text-center border border-gray-400 p-1 font-semibold">{subjectPercentage.toFixed(1)}%</td>
                                    <td className="text-center border border-gray-400 p-1 font-semibold">{getGrade(subjectPercentage)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                
                <div className="mt-6 grid grid-cols-4 gap-4 text-center">
                    <div className="border border-gray-400 p-2 rounded-lg">
                        <h4 className="font-bold text-sm">Grand Total</h4>
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
                        <h4 className="font-bold text-sm">Grade</h4>
                        <p className="text-lg font-semibold">{getGrade(grandPercentage)}</p>
                    </div>
                </div>
                
                <div className="mt-6 grid grid-cols-2 items-end gap-4">
                    <div className="space-y-2">
                        <div>
                            <h4 className="font-bold">Remarks:</h4>
                            <p className="mt-1 border-b border-gray-500 min-h-6">{remarks}</p>
                        </div>
                        {settings.gradingSystem && settings.gradingSystem.length > 0 && (
                             <div className="border p-2 rounded-md">
                                <h4 className="font-bold text-center mb-1">Grading System</h4>
                                <div className="grid grid-cols-3 text-center text-xs">
                                    {settings.gradingSystem.map((g: Grade, i: number) => (
                                        <span key={i}><b>{g.name}</b>: {g.minPercentage}%+</span>
                                    ))}
                                </div>
                            </div>
                        )}
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
  ({ students, exams, settings, classes, remarks, printOrientation }, ref) => {
    return (
      <div ref={ref} data-orientation={printOrientation}>
        {students.map(student => (
            <div key={student.id} className="printable-page">
              <ResultCard student={student} exams={exams} settings={settings} classes={classes} remarks={remarks} printOrientation={printOrientation} />
            </div>
        ))}
      </div>
    );
  }
);

ResultCardPrint.displayName = 'ResultCardPrint';
