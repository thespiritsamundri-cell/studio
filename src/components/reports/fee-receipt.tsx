
'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Family, Student, Fee } from '@/lib/types';
import { School } from 'lucide-react';
import type { SchoolSettings } from '@/context/settings-context';
import Image from 'next/image';
import { PaidStamp } from '../ui/paid-stamp';
import { format } from 'date-fns';

interface FeeReceiptProps {
    family: Family;
    students: Student[];
    fees: Fee[]; // These are the fees included in THIS transaction
    totalDues: number; // The total dues BEFORE this transaction
    paidAmount: number; // The amount paid in THIS transaction
    remainingDues: number; // The remaining dues AFTER this transaction
    settings: SchoolSettings;
    paymentMethod: string;
    receiptId: string;
    qrCodeDataUri?: string;
}

export const FeeReceipt = React.forwardRef<HTMLDivElement, FeeReceiptProps>(
  ({ family, students, fees, totalDues, paidAmount, remainingDues, settings, paymentMethod, receiptId, qrCodeDataUri }, ref) => {
    const date = new Date();
    const student = students[0];
    
    // Original A4 Receipt (Now Responsive)
    return (
      <div ref={ref} className='p-4 sm:p-8 font-sans bg-white text-black relative'>
         {paidAmount > 0 && (
            <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-15 pointer-events-none'>
                <PaidStamp
                    schoolName={settings.schoolName}
                    schoolPhone={settings.schoolPhone}
                    paymentDate={date}
                />
            </div>
        )}

        <div className="relative z-10">
            <header className="text-center mb-4">
                {settings.schoolLogo && <Image src={settings.schoolLogo} alt="School Logo" width={60} height={60} className="object-contain mx-auto" />}
                <h1 className='text-3xl md:text-4xl font-bold text-gray-800 mt-2'>{settings.schoolName}</h1>
                <p className='text-xs sm:text-sm text-gray-500'>{settings.schoolAddress}</p>
                <p className='text-xs sm:text-sm text-gray-500'>Phone: {settings.schoolPhone}</p>
                 <h2 className='text-xl sm:text-2xl font-semibold text-gray-700 mt-2'>PAID FEE RECEIPT</h2>
            </header>

            <section className='my-6 text-sm'>
                <div className="grid grid-cols-2 gap-x-4 border-y-2 border-black py-2">
                    <p><span className="font-bold">Receipt #:</span> {receiptId}</p>
                    <p className="text-right"><span className="font-bold">Date:</span> {date.toLocaleDateString()}</p>
                    <p><span className="font-bold">Student Name:</span> {student.name}</p>
                    <p className="text-right"><span className="font-bold">Roll No:</span> {student.id}</p>
                    <p><span className="font-bold">Father's Name:</span> {family.fatherName}</p>
                    <p className="text-right"><span className="font-bold">Class:</span> {student.class}</p>
                    <p><span className="font-bold">Family ID:</span> {family.id}</p>
                </div>
            </section>

            <div className="my-4">
            <h3 className='text-lg font-semibold text-gray-700 mb-2'>Fee Description</h3>
            <div className="w-full overflow-x-auto">
              <Table>
                  <TableHeader className='bg-gray-100'>
                      <TableRow>
                      <TableHead className='text-gray-600'>Description</TableHead>
                      <TableHead className='text-right text-gray-600'>Amount (PKR)</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {fees.map((fee) => (
                      <TableRow key={fee.id}>
                          <TableCell className="font-medium">{fee.month} {fee.year}</TableCell>
                          <TableCell className="text-right">{fee.amount.toLocaleString()}</TableCell>
                      </TableRow>
                      ))}
                      {fees.length === 0 && (
                          <TableRow>
                              <TableCell colSpan={2} className="text-center p-1">No fees were paid with this transaction.</TableCell>
                          </TableRow>
                      )}
                  </TableBody>
                  <tfoot className="font-bold border-t-2 border-black">
                      <tr>
                        <td className="p-2 text-left">Total Paid Amount</td>
                        <td className="p-2 text-right">PKR {paidAmount.toLocaleString()}</td>
                      </tr>
                  </tfoot>
              </Table>
            </div>
            </div>
            
            <footer className='mt-12 pt-4 border-t border-gray-300 text-center text-xs text-gray-500'>
                {qrCodeDataUri && (
                    <div className="flex justify-center my-2">
                        <Image src={qrCodeDataUri} alt="Receipt QR Code" width={60} height={60} />
                    </div>
                )}
                <p className="mb-2">Thank you for your payment!</p>
                <p>&copy; {new Date().getFullYear()} {settings.schoolName}. All rights reserved.</p>
            </footer>
        </div>
      </div>
    );
  }
);

FeeReceipt.displayName = 'FeeReceipt';

    