
'use client';

import React from 'react';
import type { Student, Family } from '@/lib/types';
import { School } from 'lucide-react';
import Image from 'next/image';
import { useSettings } from '@/context/settings-context';

interface StudentDetailsPrintProps {
  student: Student;
  family: Family;
}

const DetailItem = ({ label, value }: { label: string; value: string | undefined }) => (
  <div>
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <p className="text-base font-semibold text-gray-800">{value || 'N/A'}</p>
  </div>
);


export const StudentDetailsPrint = React.forwardRef<HTMLDivElement, StudentDetailsPrintProps>(
  ({ student, family }, ref) => {
    const { settings } = useSettings();

    return (
      <div ref={ref} className="p-8 font-sans bg-white text-black">
        <header className="flex items-center justify-between pb-4 border-b border-gray-300">
          <div className="flex items-center gap-4">
             {settings.schoolLogo ? (
              <Image src={settings.schoolLogo} alt="School Logo" width={64} height={64} className="object-contain" />
            ) : (
              <School className="w-16 h-16 text-blue-500" />
            )}
            <div>
              <h1 className="text-4xl font-bold text-gray-800">{settings.schoolName}</h1>
              <p className="text-sm text-gray-500">{settings.schoolAddress}</p>
              <p className="text-sm text-gray-500">Phone: {settings.schoolPhone}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-semibold text-gray-700">Student Profile</h2>
            <p className="text-sm text-gray-500">Date: {new Date().toLocaleDateString()}</p>
          </div>
        </header>

        <main className="mt-8">
          <section className="flex items-start gap-8">
            <Image
              alt="Student image"
              className="aspect-square rounded-lg object-cover border-2 border-gray-200"
              height="150"
              src={student.photoUrl}
              width="150"
              data-ai-hint="student photo"
            />
            <div className="flex-grow">
              <h2 className="text-3xl font-bold text-gray-800">{student.name}</h2>
              <div className="grid grid-cols-3 gap-x-8 gap-y-4 mt-4 text-sm">
                  <p><span className='font-semibold'>Student ID:</span> {student.id}</p>
                  <p><span className='font-semibold'>Class:</span> {student.class}</p>
                  <p><span className='font-semibold'>Status:</span> <span className={`font-bold ${student.status === 'Active' ? 'text-green-600' : 'text-red-600'}`}>{student.status}</span></p>
                  <p><span className='font-semibold'>Admission Date:</span> {student.admissionDate}</p>
                  <p><span className='font-semibold'>Date of Birth:</span> {student.dob}</p>
              </div>
            </div>
          </section>

          <div className="mt-10 space-y-8">
              <div>
                  <h3 className="text-xl font-semibold mb-4 border-b border-gray-300 pb-2 text-gray-700">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <DetailItem label="Contact Number" value={student.phone} />
                      <div className="md:col-span-2">
                       <DetailItem label="Address" value={student.address} />
                      </div>
                  </div>
              </div>

              <div>
                  <h3 className="text-xl font-semibold mb-4 border-b border-gray-300 pb-2 text-gray-700">Family Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <DetailItem label="Family ID" value={student.familyId} />
                      <DetailItem label="Father's Name" value={family?.fatherName} />
                      <DetailItem label="Family Contact" value={family?.phone} />
                      <div className="md:col-span-2">
                          <DetailItem label="Family Address" value={family?.address} />
                      </div>
                  </div>
              </div>
          </div>

        </main>
        
        <footer className="mt-12 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
          <p>This is a computer-generated report.</p>
          <p>&copy; {new Date().getFullYear()} {settings.schoolName}. All rights reserved.</p>
        </footer>
      </div>
    );
  }
);
StudentDetailsPrint.displayName = 'StudentDetailsPrint';
