
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

export const IDCard = ({ teacher, settings, qrCode }: { teacher: Teacher, settings: SchoolSettings, qrCode?: string }) => {
    // CR80 Card: 85.6mm x 54mm. At 96 DPI, that's approx 323px x 204px.
    // We'll use these dimensions and scale up for printing.
    return (
        <div className="relative w-[323px] h-[204px] bg-white text-black shadow-lg rounded-xl overflow-hidden font-sans flex flex-col">
            
            {/* Header SVG */}
            <div className="absolute top-0 left-0 right-0 h-[70px] z-0">
                <svg viewBox="0 0 323 70" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                    <path d="M0 0H323V50C323 50 250 70 161.5 70C73 70 0 50 0 50V0Z" fill="#2563EB"/>
                </svg>
            </div>

             {/* Footer SVG */}
            <div className="absolute bottom-0 left-0 right-0 h-[30px] z-0">
                 <svg viewBox="0 0 323 30" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                    <path d="M0 10C0 10 73 0 161.5 0C250 0 323 10 323 10V30H0V10Z" fill="#DC2626"/>
                </svg>
            </div>

            <div className="relative z-10 p-3 flex flex-col h-full">
                {/* School Info */}
                <div className="flex items-center gap-2 mb-2">
                    {settings.schoolLogo && <Image src={settings.schoolLogo} alt="School Logo" width={32} height={32} className="object-contain rounded-full bg-white/80 p-0.5" />}
                    <h1 className="text-white font-bold text-sm uppercase">{settings.schoolName}</h1>
                </div>

                {/* Profile Picture */}
                <div className="absolute top-[40px] left-1/2 -translate-x-1/2 w-20 h-20 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow-md">
                     <Image
                        src={teacher.photoUrl}
                        alt="Teacher Photo"
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                        data-ai-hint="teacher photo"
                    />
                </div>

                {/* Main Content */}
                <div className="flex-grow mt-14 text-center">
                    <h2 className="text-lg font-bold text-gray-800 leading-tight">{teacher.name}</h2>
                    <p className="text-xs font-medium text-gray-500">Teacher</p>
                </div>
                
                <div className="flex justify-between items-end text-[9px] leading-snug">
                    {/* Left Details */}
                    <div className="w-1/2 space-y-0.5">
                        <p><span className="font-bold">Contact No:</span> {teacher.phone}</p>
                        <p><span className="font-bold">Education:</span> {teacher.education}</p>
                        <p><span className="font-bold">Subjects:</span> {teacher.assignedSubjects?.join(', ')}</p>
                    </div>

                    {/* Right QR/ID */}
                    <div className="flex items-center gap-2">
                        {qrCode && <Image src={qrCode} alt="QR Code" width={45} height={45} />}
                        <div className="text-center">
                            <p className="font-bold">ID No.</p>
                            <p>{teacher.id}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Website in footer */}
            <div className="absolute bottom-1 left-0 right-0 z-10 text-center">
                 <p className="text-white text-[9px] font-semibold">www.thespiritschool.edu.pk</p>
            </div>
        </div>
    );
};

export const TeacherIdCardPrint = React.forwardRef<HTMLDivElement, TeacherIdCardPrintProps>(
  ({ teachers, settings, qrCodes }, ref) => {
    
    // 3 cards per A4 portrait page
    const teacherGroups: Teacher[][] = [];
    for (let i = 0; i < teachers.length; i += 3) {
      teacherGroups.push(teachers.slice(i, i + 3));
    }

    return (
      <div ref={ref} className="bg-gray-200">
        {teacherGroups.map((group, pageIndex) => (
          <div key={pageIndex} className="printable-page p-8 flex flex-col justify-around items-center bg-white" style={{ height: '297mm', width: '210mm' }}>
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
