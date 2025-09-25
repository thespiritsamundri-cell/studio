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
        <div className="relative w-[204px] h-[324px] bg-white text-black shadow-lg rounded-2xl overflow-hidden font-sans border-2 border-primary/20">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'url(/geometric-pattern.svg)', backgroundSize: '300px' }}></div>
            
            {/* Header */}
            <div className="h-28 bg-primary/80 backdrop-blur-sm rounded-b-3xl flex flex-col items-center justify-center p-2 text-center">
                 {settings.schoolLogo && <Image src={settings.schoolLogo} alt="School Logo" width={48} height={48} className="object-contain rounded-full bg-white p-0.5" />}
                 <h1 className="text-[10px] font-extrabold text-white uppercase tracking-wider mt-2">{settings.schoolName}</h1>
            </div>

            <div className="absolute top-20 left-1/2 -translate-x-1/2">
                 <Image
                    src={teacher.photoUrl}
                    alt="Teacher Photo"
                    width={80}
                    height={80}
                    className="object-cover rounded-full border-4 border-white shadow-md"
                    data-ai-hint="teacher photo"
                />
            </div>
            
            <div className="mt-14 text-center">
                 <h2 className="text-lg font-bold text-primary truncate px-2" title={teacher.name}>{teacher.name}</h2>
                 <p className="text-xs text-muted-foreground font-medium">Teacher</p>
            </div>

            <div className="px-3 mt-4 space-y-2 text-xs text-gray-700">
                <InfoRow label="ID" value={teacher.id} />
                <InfoRow label="Father's Name" value={teacher.fatherName} />
                <InfoRow label="Phone" value={teacher.phone} />
                <InfoRow label="Education" value={teacher.education} />
                <InfoRow label="Subjects" value={teacher.assignedSubjects?.join(', ') || 'N/A'} />
            </div>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center">
                {qrCode && <Image src={qrCode} alt="QR Code" width={40} height={40} />}
                <p className="text-[9px] font-semibold text-primary mt-1">
                 {settings.academicYear}
                </p>
            </div>
        </div>
    );
};

const InfoRow = ({ label, value }: { label: string, value: string }) => (
    <div className="flex justify-between border-b pb-0.5">
        <span className="font-bold text-gray-500">{label}:</span>
        <span className="font-medium text-right truncate">{value}</span>
    </div>
);


export const TeacherIdCardPrint = React.forwardRef<HTMLDivElement, TeacherIdCardPrintProps>(
  ({ teachers, settings, qrCodes }, ref) => {
    
    const teacherGroups: Teacher[][] = [];
    for (let i = 0; i < teachers.length; i += 8) {
      teacherGroups.push(teachers.slice(i, i + 8));
    }

    return (
      <div ref={ref} className="bg-gray-200">
        {teacherGroups.map((group, pageIndex) => (
          <div key={pageIndex} className="printable-page p-4 grid grid-cols-4 grid-rows-2 gap-4 bg-white">
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
