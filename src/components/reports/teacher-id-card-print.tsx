
'use client';

import React from 'react';
import type { Teacher } from '@/lib/types';
import type { SchoolSettings } from '@/context/settings-context';
import Image from 'next/image';
import { Phone, GraduationCap } from "lucide-react";

interface TeacherIdCardPrintProps {
  teachers: Teacher[];
  settings: SchoolSettings;
  qrCodes: Record<string, string>;
}

export const IDCard = ({ teacher, settings, qrCode }: { teacher: Teacher, settings: SchoolSettings, qrCode?: string }) => {
  return (
    <div className="w-[336px] h-[480px] bg-white shadow-lg rounded-2xl overflow-hidden font-sans relative flex flex-col">
      {/* Header */}
      <div className="relative h-32 bg-gradient-to-r from-blue-800 to-blue-500 flex-shrink-0">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative flex items-center gap-3 p-4 text-white">
          {settings.schoolLogo ? (
            <Image src={settings.schoolLogo} alt="logo" width={56} height={56} className="object-contain bg-white rounded-full p-1 shadow" />
          ) : (
            <div className="w-14 h-14 bg-white/30 rounded-full" />
          )}
          <div className="text-2xl font-bold tracking-wide whitespace-normal leading-snug">
            {settings.schoolName}
          </div>
        </div>
      </div>

      {/* Teacher Photo */}
      <div className="flex justify-center -mt-16 flex-shrink-0">
        <div className="w-36 h-36 rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-200">
          {teacher.photoUrl ? (
            <Image src={teacher.photoUrl} alt="teacher photo" width={144} height={144} className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">Photo</div>
          )}
        </div>
      </div>

      {/* Name & designation */}
      <div className="mt-4 text-center px-4 flex-shrink-0">
        <div className="text-2xl font-extrabold text-gray-900 tracking-wide leading-snug">
          {teacher.name}
        </div>
        <div className="text-base text-gray-600 mt-1">{teacher.assignedSubjects?.join(', ') || 'Teacher'}</div>
      </div>

      {/* Contact Info & QR */}
      <div className="mt-6 px-6 flex-grow flex flex-col justify-between">
         <div className="space-y-3 text-[14px] text-gray-700">
            <div className="flex items-center gap-2"><GraduationCap size={16}/> <span>{teacher.education}</span></div>
            <div className="flex items-center gap-2"><Phone size={16}/> <span>{teacher.phone}</span></div>
        </div>
        
        {qrCode && (
            <div className="mt-4 flex justify-center">
              <Image src={qrCode} alt="QR code" className="w-24 h-24 object-contain" />
            </div>
        )}
      </div>


      {/* Footer */}
      <div className="p-3 bg-blue-700 text-[12px] text-white text-center tracking-wide font-medium flex-shrink-0">
        {settings.schoolAddress}
      </div>
    </div>
  );
};


export const TeacherIdCardPrint = React.forwardRef<HTMLDivElement, TeacherIdCardPrintProps>(
  ({ teachers, settings, qrCodes }, ref) => {
    
    const teacherGroups: Teacher[][] = [];
    for (let i = 0; i < teachers.length; i += 2) {
      teacherGroups.push(teachers.slice(i, i + 2));
    }

    return (
      <div ref={ref} className="bg-gray-200">
        {teacherGroups.map((group, pageIndex) => (
          <div key={pageIndex} className="printable-page p-4 flex justify-center items-center gap-8 bg-white" style={{ height: '297mm', width: '210mm' }}>
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
