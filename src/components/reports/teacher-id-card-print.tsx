
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
    // Standard CR80 size: 85.6mm x 54mm. In pixels at 300dpi: ~1011px x 638px.
    // For web display, we use a smaller size with the same aspect ratio.
    // Let's use a width of 324px (3.375in * 96dpi) and height of 204px.
    // The design is PORTRAIT, so we swap width and height. 54mm x 85.6mm -> ~204px x 324px
    return (
        <div className="relative w-[204px] h-[324px] bg-white text-black shadow-lg rounded-lg overflow-hidden font-sans flex flex-col">
            {/* Header */}
            <div className="h-24 bg-gray-800 flex flex-col items-center justify-center p-2 text-center text-white">
                {settings.schoolLogo && <Image src={settings.schoolLogo} alt="School Logo" width={32} height={32} className="object-contain" />}
                <h1 className="text-xs font-bold uppercase tracking-wider mt-1">{settings.schoolName}</h1>
                <p className="text-[7px] opacity-80">{settings.schoolAddress}</p>
            </div>

            {/* Blue accent line */}
            <div className="h-1.5 bg-cyan-400"></div>

            {/* Main Content */}
            <div className="flex-grow flex flex-col items-center pt-10 relative">
                {/* Profile Picture */}
                 <div className="absolute -top-10 w-20 h-20 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow-lg">
                    <Image
                        src={teacher.photoUrl}
                        alt="Teacher Photo"
                        width={80}
                        height={80}
                        className="object-cover w-full h-full"
                        data-ai-hint="teacher photo"
                    />
                </div>

                 <div className="text-center mt-2">
                    <h2 className="text-lg font-bold text-gray-800 leading-tight">{teacher.name}</h2>
                    <p className="text-xs font-medium text-cyan-600">Teacher</p>
                </div>

                <div className="w-full px-4 mt-3 space-y-1 text-[10px] text-gray-600">
                    <InfoRow label="ID" value={teacher.id} />
                    <InfoRow label="Valid Through" value={settings.academicYear.split('-')[1]} />
                    <InfoRow label="Contact" value={teacher.phone} />
                </div>
                
                 {qrCode && 
                    <div className="mt-2">
                      <Image src={qrCode} alt="QR Code" width={50} height={50} />
                    </div>
                }

            </div>

             {/* Footer */}
            <div className="h-8 bg-cyan-400 flex items-center justify-center text-center p-2 text-white">
                 <p className="text-xs font-bold">ID# {teacher.id}</p>
            </div>
        </div>
    );
};

const InfoRow = ({ label, value }: { label: string, value?: string }) => (
    <div className="flex justify-between border-b pb-0.5">
        <span className="font-bold">{label}:</span>
        <span className="font-medium ml-2">{value || 'N/A'}</span>
    </div>
);


export const TeacherIdCardPrint = React.forwardRef<HTMLDivElement, TeacherIdCardPrintProps>(
  ({ teachers, settings, qrCodes }, ref) => {
    
    // 3 cards per A4 page in portrait layout
    const teacherGroups: Teacher[][] = [];
    for (let i = 0; i < teachers.length; i += 3) {
      teacherGroups.push(teachers.slice(i, i + 3));
    }

    return (
      <div ref={ref} className="bg-gray-200">
        {teacherGroups.map((group, pageIndex) => (
          <div key={pageIndex} className="printable-page p-4 flex flex-col justify-around items-center bg-white" style={{ height: '297mm', width: '210mm' }}>
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
