'use client';

import React from 'react';
import type { Student } from '@/lib/types';
import type { SchoolSettings } from '@/context/settings-context';
import Image from 'next/image';

interface StudentIdCardPrintProps {
  students: Student[];
  settings: SchoolSettings;
  qrCodes: Record<string, string>;
}

const IDCard = ({ student, settings, qrCode }: { student: Student, settings: SchoolSettings, qrCode?: string }) => {
    return (
        <div className="relative w-[324px] h-[204px] bg-white text-black shadow-lg rounded-2xl overflow-hidden font-sans border-2 border-primary/20">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'url(/geometric-pattern.svg)', backgroundSize: '300px' }}></div>
            
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 h-16 bg-primary/80 backdrop-blur-sm rounded-b-xl flex items-center px-3 gap-3">
                 {settings.schoolLogo && <Image src={settings.schoolLogo} alt="School Logo" width={32} height={32} className="object-contain rounded-full bg-white p-0.5" />}
                 <div>
                    <h1 className="text-sm font-extrabold text-white uppercase tracking-wider">{settings.schoolName}</h1>
                    <p className="text-[8px] text-white/90">{settings.schoolAddress}</p>
                 </div>
            </div>

            <div className="absolute top-20 left-4">
                 <Image
                    src={student.photoUrl}
                    alt="Student Photo"
                    width={80}
                    height={100}
                    className="object-cover rounded-md border-2 border-white shadow-md"
                    data-ai-hint="student photo"
                />
            </div>

            <div className="absolute top-16 right-3 text-right w-48">
                <h2 className="text-xl font-bold text-primary truncate" title={student.name}>{student.name}</h2>
                <p className="text-xs text-muted-foreground font-medium">{student.fatherName}</p>
                <div className="mt-4 space-y-1 text-xs">
                    <div className="flex justify-end gap-2">
                        <span className="font-bold">Roll No:</span>
                        <span>{student.id}</span>
                    </div>
                     <div className="flex justify-end gap-2">
                        <span className="font-bold">Class:</span>
                        <span>{student.class} {student.section ? `(${student.section})` : ''}</span>
                    </div>
                     <div className="flex justify-end gap-2">
                        <span className="font-bold">Phone:</span>
                        <span>{student.phone}</span>
                    </div>
                </div>
            </div>
            
            <div className="absolute bottom-3 right-3">
                {qrCode && <Image src={qrCode} alt="QR Code" width={40} height={40} />}
            </div>

            <div className="absolute bottom-1 left-4 text-[9px] font-semibold text-primary">
                 <p>Academic Year: {settings.academicYear}</p>
            </div>
        </div>
    );
};

export const StudentIdCardPrint = React.forwardRef<HTMLDivElement, StudentIdCardPrintProps>(
  ({ students, settings, qrCodes }, ref) => {
    
    const studentGroups: Student[][] = [];
    for (let i = 0; i < students.length; i += 8) {
      studentGroups.push(students.slice(i, i + 8));
    }

    return (
      <div ref={ref} className="bg-gray-200">
        {studentGroups.map((group, pageIndex) => (
          <div key={pageIndex} className="printable-page p-4 grid grid-cols-2 grid-rows-4 gap-4 bg-white">
            {group.map((student) => (
               <IDCard 
                    key={student.id}
                    student={student} 
                    settings={settings}
                    qrCode={qrCodes[student.id]}
                />
            ))}
          </div>
        ))}
      </div>
    );
  }
);

StudentIdCardPrint.displayName = 'StudentIdCardPrint';
