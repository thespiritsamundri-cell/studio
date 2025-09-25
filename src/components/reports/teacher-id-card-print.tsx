
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
    // CR80 Card: 85.6mm x 54mm. In Tailwind, we approximate this with pixels.
    // At 96 DPI, this is roughly 323px x 204px. We will use a vertical layout: 204px x 323px
    // The design is based on the user-provided JSX component.
    return (
        <div className="w-[204px] h-[323px] bg-white shadow-lg rounded-2xl overflow-hidden border border-gray-200 font-sans flex flex-col">
            {/* Header with logo and school name */}
            <div className="bg-blue-600 text-white p-3 flex items-center gap-2 flex-shrink-0">
                {settings.schoolLogo ? (
                    <Image src={settings.schoolLogo} alt="logo" width={32} height={32} className="object-contain bg-white rounded-full p-0.5" />
                ) : (
                    <div className="w-8 h-8 bg-white/20 rounded-full" />
                )}
                <div className="text-lg font-bold leading-tight">{settings.schoolName}</div>
            </div>

            {/* Photo and Name */}
            <div className="p-4 flex flex-col items-center text-center flex-shrink-0">
                <div className="w-24 h-24 rounded-full border-4 border-blue-600 overflow-hidden flex items-center justify-center -mt-12 bg-white shadow-md">
                    {teacher.photoUrl ? (
                        <Image src={teacher.photoUrl} alt="photo" width={96} height={96} className="w-full h-full object-cover" />
                    ) : (
                        <div className="text-xs text-gray-400">Photo</div>
                    )}
                </div>
                <div className="mt-2 text-base font-bold text-gray-800 leading-tight">{teacher.name}</div>
                <div className="text-xs text-gray-600">Teacher</div>
            </div>

            {/* Details and QR Code */}
            <div className="px-3 text-[10px] text-gray-700 flex-grow flex items-center">
                 <div className="w-full grid grid-cols-2 gap-x-2 items-center">
                    <div className="space-y-1">
                        <div><span className="font-medium">ID:</span> {teacher.id}</div>
                        <div><span className="font-medium">Education:</span> {teacher.education}</div>
                        <div><span className="font-medium">Phone:</span> {teacher.phone}</div>
                        <div><span className="font-medium">Subjects:</span> {teacher.assignedSubjects?.join(', ')}</div>
                    </div>
                    {qrCode && (
                        <div className="flex justify-center items-center">
                           <Image src={qrCode} alt="QR Code" width={64} height={64} />
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="p-2 bg-red-600 text-[9px] text-white text-center font-medium flex-shrink-0">
                {settings.schoolAddress}
            </div>
        </div>
    );
};

export const TeacherIdCardPrint = React.forwardRef<HTMLDivElement, TeacherIdCardPrintProps>(
  ({ teachers, settings, qrCodes }, ref) => {
    
    // Fit up to 8 cards per A4 portrait page
    const teacherGroups: Teacher[][] = [];
    for (let i = 0; i < teachers.length; i += 8) {
      teacherGroups.push(teachers.slice(i, i + 8));
    }

    return (
      <div ref={ref} className="bg-gray-200">
        {teacherGroups.map((group, pageIndex) => (
          <div key={pageIndex} className="printable-page p-4 grid grid-cols-4 grid-rows-2 gap-4 bg-white" style={{ height: '297mm', width: '210mm' }}>
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
