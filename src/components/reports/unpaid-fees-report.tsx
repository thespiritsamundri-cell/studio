
'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Family, Student, Fee } from '@/lib/types';
import { School } from 'lucide-react';
import type { SchoolSettings } from '@/context/settings-context';
import Image from 'next/image';
import { format } from 'date-fns';

interface UnpaidFamilyData {
  family: Family;
  students: Student[];
  unpaidFees: Fee[];
  totalDue: number;
}

interface UnpaidFeesPrintReportProps {
  data: UnpaidFamilyData[];
  date: Date | null;
  settings: SchoolSettings;
  grandTotal: number;
}

export const UnpaidFeesPrintReport = React.forwardRef<HTMLDivElement, UnpaidFeesPrintReportProps>(
  ({ data, date, settings, grandTotal }, ref) => {
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
            <h2 className="text-2xl font-semibold text-gray-700">Unpaid Dues Report</h2>
            <p className="text-sm text-gray-500">Date: {date ? format(date, 'PPP') : ''}</p>
          </div>
        </header>

        <main className="mt-8">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Family ID</TableHead>
                <TableHead>Father's Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Unpaid Months</TableHead>
                <TableHead className="text-right">Total Due (PKR)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(({ family, students, unpaidFees, totalDue }) => (
                <TableRow key={family.id}>
                  <TableCell>{family.id}</TableCell>
                  <TableCell className="font-medium">{family.fatherName}</TableCell>
                  <TableCell>{family.phone}</TableCell>
                  <TableCell>
                      {students.map(s => <div key={s.id}>{s.name} ({s.class})</div>)}
                  </TableCell>
                  <TableCell>
                      {unpaidFees.map(f => <div key={f.id}>{f.month} {f.year}</div>)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-red-600">{totalDue.toLocaleString()}</TableCell>
                </TableRow>
              ))}
               {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No families with unpaid dues found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </main>
        
        <div className="flex justify-end mt-4">
            <div className="w-full max-w-sm border-t-2 border-black pt-2">
                <div className="flex justify-between text-lg font-bold text-gray-800">
                    <span>Grand Total Due:</span>
                    <span>PKR {grandTotal.toLocaleString()}</span>
                </div>
            </div>
        </div>

        <footer className="mt-12 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
          <p>This is a computer-generated report.</p>
          <p>&copy; {new Date().getFullYear()} {settings.schoolName}. All rights reserved.</p>
        </footer>
      </div>
    );
  }
);

UnpaidFeesPrintReport.displayName = 'UnpaidFeesPrintReport';
