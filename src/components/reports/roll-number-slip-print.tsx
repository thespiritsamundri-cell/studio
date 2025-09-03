
'use client';

import React from 'react';
import type { Student } from '@/lib/types';
import type { SchoolSettings } from '@/context/settings-context';
import Image from 'next/image';
import type { DateSheetItem } from '@/app/(dashboard)/roll-number-slips/page';
import { format, parseISO } from 'date-fns';

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
        try {
            // The input type="date" provides 'YYYY-MM-DD' which parseISO handles correctly.
            return format(parseISO(dateString), 'dd-MM-yyyy');
        } catch (error) {
            console.error("Date formatting error:", error);
            // Fallback for any other unexpected format
            return dateString;
        }
    }
    
    return (
        <div className="p-4 font-sans bg-white text-black border-2 border-black w-full mx-auto relative slip-wrapper flex flex-col h-full">
            {/* Watermark */}
            {settings.schoolLogo && (
                <div className="absolute inset-0 flex items-center justify-center z-0">
                    <Image src={settings.schoolLogo} alt="Watermark" width={300} height={300} className="object-contain opacity-10" />
                </div>
            )}
            
            <div className="relative z-10 flex flex-col h-full">
                {/* Header */}
                <header className="text-center mb-4">
                    {settings.schoolLogo && <Image src={settings.schoolLogo} alt="School Logo" width={50} height={50} className="object-contain mx-auto" />}
                    <h1 className="text-2xl font-bold text-black">{settings.schoolName}</h1>
                    <p className="text-xs text-gray-700">{settings.schoolAddress}</p>
                    <p className="text-xs text-gray-700">Phone: {settings.schoolPhone}</p>
                    <div className="border-b-2 border-t-2 border-black mt-2 py-1">
                        <h2 className="text-lg font-semibold">{examName}</h2>
                    </div>
                </header>
                
                {/* Roll Number */}
                <div className="text-center my-2">
                    <span className="font-bold text-lg border-2 border-black rounded-full px-6 py-1">ROLL NO: {rollNo}</span>
                </div>

                {/* Student Info & Photo */}
                <section className="flex justify-between items-start my-4">
                     <div className="grid grid-cols-1 gap-1 text-sm">
                        <div><span className="font-bold">Student ID:</span> {student.id}</div>
                        <div><span className="font-bold">Student Name:</span> {student.name}</div>
                        <div><span className="font-bold">Father's Name:</span> {student.fatherName}</div>
                        <div><span className="font-bold">Class:</span> {student.class} {student.section ? `(${student.section})` : ''}</div>
                    </div>
                    <Image
                        src={student.photoUrl}
                        alt="Student Photo"
                        width={90}
                        height={110}
                        className="object-cover rounded-md border-2 border-gray-500"
                        data-ai-hint="student photo"
                    />
                </section>

                {/* Date Sheet */}
                <section className="flex-grow">
                    <h3 className="text-base font-bold text-center mb-1 underline">Date Sheet</h3>
                    <table className="w-full border-collapse border border-black text-xs">
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
                <footer className="mt-auto pt-4 space-y-4">
                    <div>
                        <h3 className="text-sm font-bold underline">Instructions:</h3>
                        <div className="whitespace-pre-wrap text-xs mt-1 p-2 border rounded-md font-urdu">{instructions}</div>
                    </div>
                    <div className="flex justify-between items-end pt-2 border-t-2 border-black">
                         <div className="text-[10px] text-gray-600">
                            <p>Generated on: {new Date().toLocaleDateString()}</p>
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
                         <div className="flex flex-col items-center">
                            {settings.principalSignature ? (
                                <Image src={settings.principalSignature} alt="Principal's Signature" width={120} height={50} className="object-contain" />
                            ) : (
                                <div className="h-[50px]"></div>
                            )}
                            <div className="border-t-2 border-gray-800 w-48 text-center pt-1">
                                <p className="font-bold text-xs">Principal's Signature</p>
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
    
    return (
      <div ref={ref}>
        {students.map((student, index) => (
            <Slip 
                key={student.id}
                student={student} 
                settings={settings}
                examName={examName}
                dateSheet={dateSheet}
                instructions={instructions}
                rollNo={startRollNo + index}
                qrCode={qrCodes[student.id]}
            />
        ))}
      </div>
    );
  }
);

RollNumberSlipPrint.displayName = 'RollNumberSlipPrint';
