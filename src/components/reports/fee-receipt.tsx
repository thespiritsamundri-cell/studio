
'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Family, Student, Fee } from '@/lib/types';
import { School } from 'lucide-react';
import type { SchoolSettings } from '@/context/settings-context';
import Image from 'next/image';
import { PaidStamp } from '../ui/paid-stamp';
import { format } from 'date-fns';

type PrintType = 'normal' | 'thermal';

interface FeeReceiptProps {
    family: Family;
    students: Student[];
    fees: Fee[]; // These are the fees included in THIS transaction
    totalDues: number; // The total dues BEFORE this transaction
    paidAmount: number; // The amount paid in THIS transaction
    remainingDues: number; // The remaining dues AFTER this transaction
    settings: SchoolSettings;
    paymentMethod: string;
    printType: PrintType;
    receiptId: string;
    qrCodeDataUri?: string;
}

const thermalContainerStyle: React.CSSProperties = {
    width: '80mm',
    height: '6in',
    fontSize: '10px',
    color: '#000',
    backgroundColor: '#fff',
    padding: '4mm',
    boxSizing: 'border-box',
};


export const FeeReceipt = React.forwardRef<HTMLDivElement, FeeReceiptProps>(
  ({ family, students, fees, totalDues, paidAmount, remainingDues, settings, paymentMethod, printType, receiptId, qrCodeDataUri }, ref) => {
    const date = new Date();

    const isThermal = printType === 'thermal';
    
    if (isThermal) {
        return (
             <div ref={ref} style={thermalContainerStyle} className='receipt-container font-sans flex flex-col p-4 bg-white text-black relative'>
                {paidAmount > 0 && (
                    <div className='absolute inset-0 flex items-center justify-center z-0'>
                        <div className="opacity-15 pointer-events-none">
                            <PaidStamp
                                schoolName={settings.schoolName}
                                schoolPhone={settings.schoolPhone}
                                paymentDate={date}
                            />
                        </div>
                    </div>
                )}
                <div className="relative z-10 flex flex-col h-full">
                    <header className="text-center">
                        {settings.schoolLogo ? <Image src={settings.schoolLogo} alt="School Logo" width={50} height={50} className="mx-auto text-black" /> : <School className="w-12 h-12 text-black mx-auto" />}
                        <h1 className="text-lg font-bold mt-1">{settings.schoolName}</h1>
                        <p className="text-[10px]">{settings.schoolAddress}</p>
                        <p className="text-[10px]">Phone: {settings.schoolPhone}</p>
                    </header>
                    
                    <div className='text-center my-2'>
                        <h2 className='text-sm font-bold underline'>Fee Receipt</h2>
                        <p className="text-xs text-gray-700 font-bold">Receipt #: {receiptId}</p>
                        <p className="text-xs text-gray-700 font-bold">Date: {format(date, 'dd/MM/yyyy')}</p>
                    </div>

                    <hr className="border-t border-dashed border-black my-2" />

                    <section className="text-xs space-y-1">
                        <div className="mt-2">
                            <p className="font-bold">Billed To:</p>
                            <p>{family.fatherName} (Family ID: {family.id})</p>
                            <p>{family.phone}</p>
                        </div>
                        <div className="mt-2">
                            <p className="font-bold">Students:</p>
                            <p>{students.map(s => `${s.name} (${s.class})`).join(', ')}</p>
                        </div>
                        <div className="mt-2">
                            <p className="font-bold">Payment Details:</p>
                            <p>Method: {paymentMethod}</p>
                            <p>Status: {paidAmount > 0 ? (remainingDues > 0 ? 'Partially Paid' : 'Paid in Full') : 'Unpaid'}</p>
                        </div>
                    </section>
                    
                    <hr className="border-t border-dashed border-black my-2" />
                    
                    <section className="flex-grow">
                        <h3 className='font-bold text-center text-sm mb-1'>Fee Description</h3>
                        <div className="flex justify-between font-bold border-b border-black pb-1">
                            <span>Description</span>
                            <span>Amount (PKR)</span>
                        </div>
                        <div className="space-y-1 mt-1 text-xs">
                            {fees.map(fee => (
                                <div key={fee.id} className="flex justify-between">
                                    <span>{fee.month} {fee.year}</span>
                                    <span>{fee.amount.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                    
                    <hr className="border-t border-dashed border-black my-2" />
                    
                    <section className="text-xs space-y-1 text-right">
                        <div className="flex justify-between">
                            <span>Previous Balance:</span>
                            <span>PKR {totalDues.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Paid Amount:</span>
                            <span>- PKR {paidAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-bold text-sm">
                            <span>New Balance Due:</span>
                            <span>PKR {remainingDues.toLocaleString()}</span>
                        </div>
                    </section>
                    
                    <footer className="text-center mt-auto text-xs">
                        {qrCodeDataUri && (
                            <div className="flex justify-center mb-2">
                                <Image src={qrCodeDataUri} alt="Receipt QR Code" width={40} height={40} />
                            </div>
                        )}
                        <p className="font-semibold">Thank you for your payment!</p>
                        <p className="text-[9px] text-gray-800 font-bold mt-1">&copy; {new Date().getFullYear()} {settings.schoolName}. All rights reserved.</p>
                    </footer>
                </div>
            </div>
        );
    }


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
            <header className='flex flex-col sm:flex-row items-center justify-between pb-4 border-b border-gray-300 gap-4'>
            <div className='flex items-center gap-4'>
                {settings.schoolLogo ? (
                <Image src={settings.schoolLogo} alt="School Logo" width={64} height={64} className="object-contain" />
                ) : (
                  <School className="w-16 h-16 text-gray-800" />
                )}
                <div>
                <h1 className='text-3xl md:text-4xl font-bold text-gray-800'>{settings.schoolName}</h1>
                <p className='text-xs sm:text-sm text-gray-500'>{settings.schoolAddress}</p>
                <p className='text-xs sm:text-sm text-gray-500'>Phone: {settings.schoolPhone}</p>
                </div>
            </div>
            <div className='text-left sm:text-right w-full sm:w-auto'>
                <h2 className='text-xl sm:text-2xl font-semibold text-gray-700'>Fee Receipt</h2>
                <p className='text-xs sm:text-sm text-gray-500'>Receipt #: {receiptId}</p>
                <p className='text-xs sm:text-sm text-gray-500'>Date: {date.toLocaleDateString()}</p>
            </div>
            </header>

            <section className='my-6 grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
                <h3 className='text-lg font-semibold text-gray-700 mb-2'>Billed To:</h3>
                <p className="font-bold">{family.fatherName} (Family ID: {family.id})</p>
                <p className="text-sm text-gray-600">{family.address}</p>
                <p className='text-sm text-gray-600'>{family.phone}</p>
                <div className='mt-2'>
                    <h4 className="font-semibold">Students:</h4>
                    <p className="text-sm text-gray-600">{students.map(s => s.name).join(', ')}</p>
                </div>
            </div>
                <div className='text-left md:text-right'>
                <h3 className='text-lg font-semibold text-gray-700 mb-2'>Payment Details:</h3>
                <p className="text-sm text-gray-600"><span className="font-semibold">Method:</span> {paymentMethod}</p>
                <p className="text-sm text-gray-600"><span className="font-semibold">Status:</span> {paidAmount > 0 ? (remainingDues > 0 ? 'Partially Paid' : 'Paid in Full') : 'Unpaid'}</p>
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
                              <TableCell colSpan={2} className="text-center p-1">No fees being paid with this transaction.</TableCell>
                          </TableRow>
                      )}
                  </TableBody>
              </Table>
            </div>
            </div>

            <div className='flex justify-end mt-8'>
            <div className='w-full max-w-xs space-y-2 text-right'>
                <div className="flex justify-between">
                    <span className="font-semibold">Previous Balance:</span>
                    <span>PKR {totalDues.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                    <span className="font-semibold">Paid Amount:</span>
                    <span>- PKR {paidAmount.toLocaleString()}</span>
                </div>
                <div className='flex justify-between text-lg font-bold text-red-600 border-t pt-2 mt-2'>
                    <span className='text-gray-800'>New Balance Due:</span>
                    <span>PKR {remainingDues.toLocaleString()}</span>
                </div>
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
