
'use client';

import React from 'react';
import type { Student } from '@/lib/types';
import type { SchoolSettings } from '@/context/settings-context';
import Image from 'next/image';
import type { DateSheetItem } from '@/app/(dashboard)/roll-number-slips/page';

interface RollNumberSlipPrintProps {
  students: Student[];
  settings: SchoolSettings;
  examName: string;
  dateSheet: DateSheetItem[];
  instructions: string;
  startRollNo: number;
  layout: '1' | '2';
}

const Slip = ({ student, settings, examName, dateSheet, instructions, rollNo }: { student: Student, settings: SchoolSettings, examName: string, dateSheet: DateSheetItem[], instructions: string, rollNo: number }) => {
    return (
        <div className="p-4 font-sans bg-white text-black border-2 border-black w-full mx-auto relative slip-wrapper" style={{ breakInside: 'avoid' }}>
            {settings.schoolLogo && (
                <div className="absolute inset-0 flex items-center justify-center z-0">
                    <Image src={settings.schoolLogo} alt="Watermark" width={300} height={300} className="object-contain opacity-10" />
                </div>
            )}
            <div className="relative z-10 flex flex-col h-full">
                <header className="text-center mb-2">
                    {settings.schoolLogo && <Image src={settings.schoolLogo} alt="School Logo" width={50} height={50} className="object-contain mx-auto" />}
                    <h1 className="text-2xl font-bold text-black">{settings.schoolName}</h1>
                    <p className="text-xs text-gray-700">{settings.schoolAddress}</p>
                    <p className="text-xs text-gray-700">Phone: {settings.schoolPhone}</p>
                    <h2 className="text-lg font-semibold mt-1 border-y-2 border-black py-1">{examName}</h2>
                </header>
                
                <div className="text-center my-2">
                    <span className="font-bold text-xl border-2 border-black rounded-full px-4 py-1">ROLL NO: {rollNo}</span>
                </div>

                <section className="flex justify-between items-center my-2">
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
                        height={90}
                        className="object-cover rounded-md border-2 border-gray-500"
                        data-ai-hint="student photo"
                    />
                </section>

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
                                    <td className="border border-black p-1 text-center">{item.date || '-'}</td>
                                    <td className="border border-black p-1 text-center">{item.time || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                <section className="mt-2">
                    <h3 className="text-base font-bold underline">Instructions:</h3>
                    <div className="whitespace-pre-wrap text-xs mt-1 p-1 border rounded-md font-urdu">{instructions}</div>
                </section>

                <footer className="mt-4 flex justify-between items-end pt-1 border-t-2 border-gray-400">
                     <div className="text-[10px] text-gray-600">
                        <p>Generated on: {new Date().toLocaleDateString()}</p>
                     </div>
                     <div className="flex flex-col items-center">
                        {settings.principalSignature ? (
                            <Image src={settings.principalSignature} alt="Principal's Signature" width={100} height={40} className="object-contain" />
                        ) : (
                            <div className="h-[40px]"></div>
                        )}
                        <div className="border-t-2 border-gray-800 w-36 text-center pt-1">
                            <p className="font-bold text-xs">Principal's Signature</p>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}

export const RollNumberSlipPrint = React.forwardRef<HTMLDivElement, RollNumberSlipPrintProps>(
  ({ students, settings, examName, dateSheet, instructions, startRollNo, layout }, ref) => {
    return (
      <div ref={ref} data-print-layout={layout}>
        {students.map((student, index) => (
            <Slip 
                key={student.id}
                student={student} 
                settings={settings}
                examName={examName}
                dateSheet={dateSheet}
                instructions={instructions}
                rollNo={startRollNo + index}
            />
        ))}
      </div>
    );
  }
);

RollNumberSlipPrint.displayName = 'RollNumberSlipPrint';
