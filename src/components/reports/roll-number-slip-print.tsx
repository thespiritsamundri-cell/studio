
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
}

const Slip = ({ student, settings, examName, dateSheet, instructions }: { student: Student, settings: SchoolSettings, examName: string, dateSheet: DateSheetItem[], instructions: string }) => {
    return (
        <div className="p-4 font-sans bg-white text-black border-2 border-black w-full mx-auto relative printable-page" style={{ breakInside: 'avoid' }}>
            {settings.schoolLogo && (
                <div className="absolute inset-0 flex items-center justify-center z-0">
                    <Image src={settings.schoolLogo} alt="Watermark" width={300} height={300} className="object-contain opacity-10" />
                </div>
            )}
            <div className="relative z-10">
                <header className="text-center mb-4">
                    {settings.schoolLogo && <Image src={settings.schoolLogo} alt="School Logo" width={60} height={60} className="object-contain mx-auto mb-2" />}
                    <h1 className="text-2xl font-bold text-black">{settings.schoolName}</h1>
                    <p className="text-sm text-gray-700">{settings.schoolAddress}</p>
                    <p className="text-sm text-gray-700">Phone: {settings.schoolPhone}</p>
                    <h2 className="text-xl font-semibold mt-2 border-y-2 border-black py-1">{examName}</h2>
                </header>

                <section className="flex justify-between items-center my-4">
                     <div className="grid grid-cols-1 gap-1 text-sm">
                        <div><span className="font-bold">Student ID:</span> {student.id}</div>
                        <div><span className="font-bold">Student Name:</span> {student.name}</div>
                        <div><span className="font-bold">Father's Name:</span> {student.fatherName}</div>
                        <div><span className="font-bold">Class:</span> {student.class} {student.section ? `(${student.section})` : ''}</div>
                    </div>
                    <Image
                        src={student.photoUrl}
                        alt="Student Photo"
                        width={100}
                        height={100}
                        className="object-cover rounded-md border-2 border-gray-500"
                        data-ai-hint="student photo"
                    />
                </section>

                <section>
                    <h3 className="text-lg font-bold text-center mb-2 underline">Date Sheet</h3>
                    <table className="w-full border-collapse border border-black text-sm">
                        <thead className="bg-gray-200">
                            <tr>
                                <th className="border border-black p-2">Subject</th>
                                <th className="border border-black p-2">Date</th>
                                <th className="border border-black p-2">Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dateSheet.filter(item => item.date && item.time).map(item => (
                                <tr key={item.subject}>
                                    <td className="border border-black p-2 font-medium">{item.subject}</td>
                                    <td className="border border-black p-2 text-center">{item.date}</td>
                                    <td className="border border-black p-2 text-center">{item.time}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                <section className="mt-4">
                    <h3 className="text-lg font-bold underline">Instructions:</h3>
                    <div className="whitespace-pre-wrap text-sm mt-1 p-2 border rounded-md font-urdu">{instructions}</div>
                </section>

                <footer className="mt-8 flex justify-between items-end">
                     <div className="text-xs text-gray-600">
                        <p>Generated on: {new Date().toLocaleDateString()}</p>
                        <p>&copy; {new Date().getFullYear()} {settings.schoolName}</p>
                     </div>
                     <div className="flex flex-col items-center">
                        {settings.principalSignature ? (
                            <Image src={settings.principalSignature} alt="Principal's Signature" width={120} height={50} className="object-contain" />
                        ) : (
                            <div className="h-[50px]"></div>
                        )}
                        <div className="border-t-2 border-gray-800 w-40 text-center pt-1">
                            <p className="font-bold text-sm">Principal's Signature</p>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}

export const RollNumberSlipPrint = React.forwardRef<HTMLDivElement, RollNumberSlipPrintProps>(
  ({ students, settings, examName, dateSheet, instructions }, ref) => {
    return (
      <div ref={ref} className="space-y-4">
        {students.map(student => (
            <Slip 
                key={student.id}
                student={student} 
                settings={settings}
                examName={examName}
                dateSheet={dateSheet}
                instructions={instructions}
            />
        ))}
      </div>
    );
  }
);

RollNumberSlipPrint.displayName = 'RollNumberSlipPrint';
