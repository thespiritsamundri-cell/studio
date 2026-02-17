
'use client';

import React from 'react';
import type { Student, Family } from '@/lib/types';
import { School } from 'lucide-react';
import Image from 'next/image';
import type { SchoolSettings } from '@/context/settings-context';
import { format } from 'date-fns';

interface StudentDetailsPrintProps {
  student: Student;
  family: Family;
  settings: SchoolSettings;
  familyQrCodeDataUri?: string;
}

const DetailItem = ({ label, value }: { label: string; value: string | undefined }) => (
  <div className="py-2 border-b">
    <p className="text-xs font-medium text-gray-500">{label}</p>
    <p className="text-sm font-semibold text-gray-800">{value || 'N/A'}</p>
  </div>
);


export const StudentDetailsPrint = React.forwardRef<HTMLDivElement, StudentDetailsPrintProps>(
  ({ student, family, settings, familyQrCodeDataUri }, ref) => {
    return (
      <div ref={ref} className="p-6 font-sans bg-white text-black max-w-4xl mx-auto border-4 border-double border-black">
        <header className="flex items-start justify-between pb-4">
          <div className="flex items-center gap-4">
             {settings.schoolLogo ? (
              <Image src={settings.schoolLogo} alt="School Logo" width={72} height={72} className="object-contain rounded-full" />
            ) : (
              <School className="w-16 h-16 text-blue-500" />
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{settings.schoolName}</h1>
              <p className="text-xs text-gray-500">{settings.schoolAddress}</p>
              <p className="text-xs text-gray-500">Phone: {settings.schoolPhone}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-semibold text-gray-700">Student Profile</h2>
            <p className="text-xs text-gray-500">Print Date: {format(new Date(), 'dd-MMM-yyyy')}</p>
          </div>
        </header>

        <main className="mt-6">
          <section className="flex items-start gap-6 p-4 rounded-lg bg-gray-50 border">
            <Image
              alt="Student image"
              className="rounded-lg object-cover border-2 border-white shadow-md"
              height="140"
              src={student.photoUrl}
              width="140"
              data-ai-hint="student photo"
            />
            <div className="flex-grow space-y-2">
              <h2 className="text-3xl font-bold text-gray-800">{student.name}</h2>
              <div className="grid grid-cols-3 gap-x-6 gap-y-2 text-sm">
                  <p><span className='font-semibold text-gray-600'>Student ID:</span> {student.id}</p>
                  <p><span className='font-semibold text-gray-600'>Class:</span> {student.class}</p>
                  <p><span className='font-semibold text-gray-600'>Status:</span> <span className={`font-bold ${student.status === 'Active' ? 'text-green-600' : 'text-red-600'}`}>{student.status}</span></p>
                  <p><span className='font-semibold text-gray-600'>Admission:</span> {student.admissionDate}</p>
                  <p><span className='font-semibold text-gray-600'>D.O.B:</span> {student.dob}</p>
                   <p><span className='font-semibold text-gray-600'>Gender:</span> {student.gender}</p>
              </div>
            </div>
          </section>

          <div className="mt-6 grid grid-cols-2 gap-8">
              <div>
                  <h3 className="text-lg font-semibold mb-2 border-b-2 border-gray-200 pb-1 text-gray-700">Personal Information</h3>
                  <div className="space-y-1">
                      <DetailItem label="Contact Number" value={student.phone} />
                      <DetailItem label="Alternate Contact" value={student.alternatePhone} />
                      <DetailItem label="Student CNIC / B-Form" value={student.cnic} />
                      <DetailItem label="Address" value={student.address} />
                  </div>
              </div>

              <div>
                  <h3 className="text-lg font-semibold mb-2 border-b-2 border-gray-200 pb-1 text-gray-700">Family Information</h3>
                  <div className="space-y-1">
                      <DetailItem label="Family ID" value={student.familyId} />
                      <DetailItem label="Father's Name" value={family?.fatherName} />
                      <DetailItem label="Father's Profession" value={family?.profession} />
                      <DetailItem label="Father's CNIC" value={family?.cnic} />
                  </div>
              </div>
          </div>

        </main>
        
        <footer className="mt-12 pt-4 border-t-2 border-dashed border-gray-400 flex justify-between items-end text-xs text-gray-500">
            <div>
              <p>&copy; {new Date().getFullYear()} {settings.schoolName}. All rights reserved.</p>
              <p>Developed by SchoolUP</p>
            </div>
            {familyQrCodeDataUri && (
                <div className="text-center">
                    <Image src={familyQrCodeDataUri} alt="Family QR Code" width={72} height={72} />
                    <p className="text-[10px] font-semibold">Scan for Family Profile</p>
                </div>
            )}
        </footer>
      </div>
    );
  }
);
StudentDetailsPrint.displayName = 'StudentDetailsPrint';
