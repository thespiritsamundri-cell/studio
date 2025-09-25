
'use client';

import React from 'react';
import type { Teacher } from '@/lib/types';
import type { SchoolSettings } from '@/context/settings-context';
import Image from 'next/image';

interface TeacherIdCardPrintProps {
  teachers: Teacher[];
  settings: SchoolSettings;
  qrCodes: Record<string, string>;
}

const IDCard = ({ teacher, settings, qrCode }: { teacher: Teacher, settings: SchoolSettings, qrCode?: string }) => {
    return (
        <div className="relative w-[220px] h-[350px] bg-white text-black shadow-lg rounded-2xl overflow-hidden font-sans border-2 border-primary/20 flex flex-col">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'url(/geometric-pattern.svg)', backgroundSize: '300px' }}></div>
            
            {/* Header */}
            <div className="flex flex-col items-center justify-center p-3 text-center border-b-4 border-primary/80">
                 {settings.schoolLogo && <Image src={settings.schoolLogo} alt="School Logo" width={50} height={50} className="object-contain rounded-full bg-white p-0.5" />}
                 <h1 className="text-sm font-extrabold text-black uppercase tracking-wider mt-2">{settings.schoolName}</h1>
                 <p className="text-[8px] text-gray-600">{settings.schoolAddress}</p>
            </div>

            <div className="flex flex-col items-center p-3">
                 <Image
                    src={teacher.photoUrl}
                    alt="Teacher Photo"
                    width={80}
                    height={80}
                    className="object-cover rounded-full border-4 border-primary/20 shadow-md"
                    data-ai-hint="teacher photo"
                />
                 <div className="mt-2 text-center">
                     <h2 className="text-lg font-bold text-primary">{teacher.name}</h2>
                     <p className="text-xs text-muted-foreground font-medium">Teacher</p>
                </div>
            </div>
            
            <div className="px-4 mt-2 space-y-1.5 text-xs text-gray-700 flex-grow">
                <InfoRow label="ID" value={teacher.id} />
                <InfoRow label="Father's Name" value={teacher.fatherName} />
                <InfoRow label="Phone" value={teacher.phone} />
                <InfoRow label="Education" value={teacher.education} />
                <InfoRow label="Subjects" value={teacher.assignedSubjects?.join(', ') || 'N/A'} />
            </div>

            <div className="flex justify-between items-end p-2 mt-2">
                 <p className="text-[9px] font-semibold text-primary">
                 {settings.academicYear}
                </p>
                {qrCode && <Image src={qrCode} alt="QR Code" width={40} height={40} />}
            </div>
        </div>
    );
};

const InfoRow = ({ label, value }: { label: string, value: string }) => (
    <div className="flex justify-between border-b pb-0.5">
        <span className="font-bold text-gray-500">{label}:</span>
        <span className="font-medium text-right ml-2">{value}</span>
    </div>
);


export const TeacherIdCardPrint = React.forwardRef<HTMLDivElement, TeacherIdCardPrintProps>(
  ({ teachers, settings, qrCodes }, ref) => {
    
    const teacherGroups: Teacher[][] = [];
    for (let i = 0; i < teachers.length; i += 3) {
      teacherGroups.push(teachers.slice(i, i + 3));
    }

    return (
      <div ref={ref} className="bg-gray-200">
        {teacherGroups.map((group, pageIndex) => (
          <div key={pageIndex} className="printable-page p-4 flex flex-col justify-around items-center bg-white" style={{ height: '100vh' }}>
            {group.map((teacher) => (
               <IDCard 
                    key={teacher.id}
                    teacher={teacher} 
                    settings={settings}
                    qrCode={qrCodes[teacher.id]}
                />
            ))}
          </div>
        ))}
      </div>
    );
  }
);

TeacherIdCardPrint.displayName = 'TeacherIdCardPrint';
