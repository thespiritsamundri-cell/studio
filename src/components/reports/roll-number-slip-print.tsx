
'use client';

import React from 'react';
import type { Student } from '@/lib/types';
import type { SchoolSettings } from '@/context/settings-context';
import Image from 'next/image';
import type { DateSheetItem } from '@/app/(dashboard)/roll-number-slips/page';
import { format } from 'date-fns';

interface RollNumberSlipPrintProps {
  students: Student[];
  settings: SchoolSettings;
  examName: string;
  dateSheet: DateSheetItem[];
  instructions: string;
  startRollNo: number;
  qrCodes: Record<string, string>;
}

const Slip = ({ student, settings, examName, dateSheet, instructions, rollNo, qrCode }: { student: Student, settings: SchoolSettings, examName:string, dateSheet: DateSheetItem[], instructions: string, rollNo: number, qrCode?: string }) => {
    
    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        // Handle cases where date might not be in ISO format but 'yyyy-mm-dd'
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString; // Return original if invalid
            // add a day to fix timezone issues
            date.setDate(date.getDate() + 1);
            return format(date, 'dd-MM-yyyy');
        } catch {
            return dateString;
        }
    }
    
    return (
        <div className="p-4 font-sans bg-white text-black border-2 border-black w-full mx-auto relative slip-wrapper">
            {/* Watermark */}
            {settings.schoolLogo && (
                <div className="absolute inset-0 flex items-center justify-center z-0">
                    <Image src={settings.schoolLogo} alt="Watermark" width={300} height={300} className="object-contain opacity-10" />
                </div>
            )}
            
            <div className="relative z-10 flex flex-col h-full">
                {/* Header */}
                <header className="text-center mb-2">
                    {settings.schoolLogo && <Image src={settings.schoolLogo} alt="School Logo" width={50} height={50} className="object-contain mx-auto" />}
                    <h1 className="text-xl font-bold uppercase" style={{color: '#005baa'}}>{settings.schoolName}</h1>
                    <p className="text-[10px] text-gray-700">{settings.schoolAddress}</p>
                    <p className="text-[10px] text-gray-700">Phone: {settings.schoolPhone}</p>
                    <div className="border-b-2 border-t-2 border-blue-800 mt-1 py-0.5" style={{borderColor: '#005baa'}}>
                        <h2 className="text-base font-semibold" style={{color: '#005baa'}}>{examName}</h2>
                    </div>
                </header>

                {/* Student Info & Photo */}
                <section className="flex justify-between items-start my-2">
                     <div className="grid grid-cols-1 gap-1.5 text-xs w-2/3">
                        <div className="flex">
                            <span className="font-bold w-28">ROLL NO:</span>
                            <span className="font-bold border-b border-black flex-1">{rollNo}</span>
                        </div>
                        <div className="flex">
                           <span className="font-bold w-28">STUDENT NAME:</span>
                           <span className="border-b border-black flex-1">{student.name}</span>
                        </div>
                         <div className="flex">
                           <span className="font-bold w-28">FATHER'S NAME:</span>
                           <span className="border-b border-black flex-1">{student.fatherName}</span>
                        </div>
                        <div className="flex">
                           <span className="font-bold w-28">CLASS:</span>
                           <span className="border-b border-black flex-1">{student.class} {student.section ? `(${student.section})` : ''}</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-center w-1/3 pl-4">
                        <div className="w-24 h-28 border-2 border-gray-400 flex items-center justify-center">
                            <Image
                                src={student.photoUrl}
                                alt="Student Photo"
                                width={96}
                                height={112}
                                className="object-cover w-full h-full"
                                data-ai-hint="student photo"
                            />
                        </div>
                         {qrCode && (
                            <Image
                                src={qrCode}
                                alt="QR Code"
                                width={60}
                                height={60}
                                className="mt-1"
                            />
                        )}
                    </div>
                </section>

                {/* Date Sheet */}
                <section className="flex-grow my-2">
                    <h3 className="text-sm font-bold text-center mb-1 underline">DATE SHEET</h3>
                    <table className="w-full border-collapse border border-black text-[10px]">
                        <thead className="bg-gray-200">
                            <tr>
                                <th className="border border-black p-1">Subject</th>
                                <th className="border border-black p-1">Date</th>
                                <th className="border border-black p-1">Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dateSheet.map(item => (
                                <tr key={item.subject}>
                                    <td className="border border-black p-1 font-medium">{item.subject}</td>
                                    <td className="border border-black p-1 text-center">{formatDate(item.date)}</td>
                                    <td className="border border-black p-1 text-center">{item.time || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                {/* Instructions & Footer */}
                <footer className="mt-auto pt-2 space-y-2">
                    <div className="p-2 border border-yellow-500 bg-yellow-100 rounded-md">
                        <h3 className="text-xs font-bold underline">Instructions:</h3>
                        <div className="whitespace-pre-wrap text-[9px] mt-1 font-urdu">{instructions}</div>
                    </div>
                    <div className="flex justify-between items-end pt-1 border-t-2 border-black">
                         <div className="text-[8px] text-gray-600">
                            <p>Issue Date: {format(new Date(), 'dd-MM-yyyy')}</p>
                         </div>
                         <div className="flex flex-col items-center">
                            <div className="h-[30px]">
                            {settings.principalSignature && (
                                <Image src={settings.principalSignature} alt="Principal's Signature" width={100} height={30} className="object-contain" />
                            )}
                            </div>
                            <div className="border-t-2 border-gray-800 w-40 text-center pt-0.5">
                                <p className="font-bold text-[10px]">Controller of Examinations</p>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}

export const RollNumberSlipPrint = React.forwardRef<HTMLDivElement, RollNumberSlipPrintProps>(
  ({ students, settings, examName, dateSheet, instructions, startRollNo, qrCodes }, ref) => {
    
    // Group students into pairs for printing
    const studentPairs: (Student[])[] = [];
    for (let i = 0; i < students.length; i += 2) {
      studentPairs.push(students.slice(i, i + 2));
    }

    return (
      <div ref={ref}>
        {studentPairs.map((pair, pageIndex) => (
          <div key={pageIndex} className="printable-page">
            {pair.map((student, studentIndexInPair) => {
                const overallIndex = pageIndex * 2 + studentIndexInPair;
                return (
                    <Slip 
                        key={student.id}
                        student={student} 
                        settings={settings}
                        examName={examName}
                        dateSheet={dateSheet}
                        instructions={instructions}
                        rollNo={startRollNo + overallIndex}
                        qrCode={qrCodes[student.id]}
                    />
                )
            })}
             {/* If there's only one student in the pair (last page), add a placeholder to maintain layout */}
            {pair.length === 1 && <div className="slip-wrapper invisible"></div>}
          </div>
        ))}
      </div>
    );
  }
);

RollNumberSlipPrint.displayName = 'RollNumberSlipPrint';
