
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
    // CR80 Portrait size: 54mm x 85.6mm.
    // At 96 DPI for web, this is approx. 204px x 324px.
    return (
        <div className="relative w-[204px] h-[324px] bg-white text-black shadow-xl rounded-xl overflow-hidden font-sans flex flex-col border border-gray-200">
            {/* Header */}
            <div className="h-24 bg-gray-800 flex flex-col items-center justify-center p-2 text-center text-white relative">
                 <div className="absolute inset-0 bg-primary/10 opacity-20"></div>
                 {settings.schoolLogo && <Image src={settings.schoolLogo} alt="School Logo" width={40} height={40} className="object-contain rounded-full border-2 border-white/50" />}
                <h1 className="text-sm font-bold uppercase tracking-wider mt-2">{settings.schoolName}</h1>
            </div>

            {/* Main Content */}
            <div className="flex-grow flex flex-col items-center pt-12 relative bg-gray-50">
                {/* Profile Picture */}
                 <div className="absolute -top-12 w-24 h-24 rounded-full border-4 border-white bg-gray-200 overflow-hidden shadow-lg">
                    <Image
                        src={teacher.photoUrl}
                        alt="Teacher Photo"
                        width={96}
                        height={96}
                        className="object-cover w-full h-full"
                        data-ai-hint="teacher photo"
                    />
                </div>

                 <div className="text-center mt-2">
                    <h2 className="text-xl font-bold text-gray-800 leading-tight">{teacher.name}</h2>
                    <p className="text-sm font-medium text-primary">Teacher</p>
                </div>

                <div className="w-full px-4 mt-4 space-y-2 text-xs text-gray-700">
                    <InfoRow label="ID" value={teacher.id} />
                    <InfoRow label="Contact" value={teacher.phone} />
                    <InfoRow label="Subjects" value={teacher.assignedSubjects?.join(', ')} />
                </div>
            </div>

             {/* Footer */}
            <div className="h-16 bg-white flex items-center justify-between p-2">
                <div className="text-left">
                    {qrCode && <Image src={qrCode} alt="QR Code" width={50} height={50} />}
                </div>
                <div className="text-right">
                    {settings.principalSignature ? (
                        <Image src={settings.principalSignature} alt="Signature" width={80} height={30} className="object-contain" />
                    ) : <div className="h-[30px]"></div>}
                    <p className="text-[8px] border-t border-gray-400 pt-0.5 mt-0.5">Principal's Signature</p>
                </div>
            </div>
        </div>
    );
};

const InfoRow = ({ label, value }: { label: string, value?: string }) => (
    <div className="flex justify-between border-b pb-1">
        <span className="font-bold text-gray-500">{label}:</span>
        <span className="font-semibold ml-2 text-right">{value || 'N/A'}</span>
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
