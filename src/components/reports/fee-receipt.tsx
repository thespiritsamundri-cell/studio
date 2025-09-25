
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

const thermalStyles = `
    @media print {
        @page {
            size: 101mm 153mm;
            margin: 5mm;
        }
    }
    .receipt-container {
        width: 101mm;
        height: 153mm;
        font-size: 10px;
        color: #000;
        background-color: #fff;
        padding: 5mm;
        box-sizing: border-box;
    }
    .receipt-container h1 { font-size: 16px; font-weight: bold; }
    .receipt-container h2 { font-size: 14px; font-weight: bold; }
    .receipt-container .paid-stamp-wrapper {
        width: 150px;
        height: 150px;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }
`;

export const FeeReceipt = React.forwardRef<HTMLDivElement, FeeReceiptProps>(
  ({ family, students, fees, totalDues, paidAmount, remainingDues, settings, paymentMethod, printType, receiptId, qrCodeDataUri }, ref) => {
    const date = new Date();

    const isThermal = printType === 'thermal';
    
    if (isThermal) {
        return (
             <div ref={ref} className='receipt-container font-sans relative flex flex-col'>
                <style>{thermalStyles}</style>
                 {paidAmount > 0 && (
                    <div className='paid-stamp-wrapper absolute opacity-10 pointer-events-none'>
                        <PaidStamp
                            schoolName={settings.schoolName}
                            schoolPhone={settings.schoolPhone}
                            paymentDate={date}
                        />
                    </div>
                )}
                <div className="relative z-10">
                    <header className="text-center">
                        {settings.schoolLogo && <Image src={settings.schoolLogo} alt="School Logo" width={50} height={50} className="mx-auto" />}
                        <h1>{settings.schoolName}</h1>
                        <p className="text-[9px]">{settings.schoolAddress}</p>
                        <p className="text-[9px]">Phone: {settings.schoolPhone}</p>
                        <h2 className='mt-1'>Fee Receipt</h2>
                    </header>
                    <hr className="border-t border-dashed border-black my-2" />
                    <section className="text-xs space-y-1">
                        <div className="flex justify-between"><span><strong>Receipt #:</strong> {receiptId}</span> <span><strong>Date:</strong> {format(date, 'dd/MM/yyyy hh:mm a')}</span></div>
                        <div className="flex justify-between"><span><strong>Billed To:</strong> {family.fatherName}</span> <span><strong>Family ID:</strong> {family.id}</span></div>
                        <div><strong>Students:</strong> {students.map(s => s.name).join(', ')}</div>
                        <div><strong>Payment Method:</strong> {paymentMethod}</div>
                    </section>
                    <hr className="border-t border-dashed border-black my-2" />
                    <section>
                        <Table className="text-xs">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="h-auto p-1 text-black font-bold">Description</TableHead>
                                    <TableHead className="h-auto p-1 text-right text-black font-bold">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {fees.map((fee) => (
                                    <TableRow key={fee.id}>
                                        <TableCell className="p-1">{fee.month} {fee.year}</TableCell>
                                        <TableCell className="p-1 text-right">{fee.amount.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </section>
                     <hr className="border-t border-dashed border-black my-2" />
                    <section className="text-xs space-y-1 mt-auto">
                        <div className="flex justify-between">
                            <span>Previous Balance:</span>
                            <span>PKR {totalDues.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Paid Amount:</span>
                            <span>PKR {paidAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-bold text-base">
                            <span>New Balance:</span>
                            <span>PKR {remainingDues.toLocaleString()}</span>
                        </div>
                    </section>
                    <footer className="text-center mt-4">
                        {qrCodeDataUri && (
                            <div className="flex justify-center my-2">
                                <Image src={qrCodeDataUri} alt="Receipt QR Code" width={60} height={60} />
                            </div>
                        )}
                        <p className="text-xs">Thank you for your payment!</p>
                        <p className="text-[9px] text-gray-600">This is a computer-generated receipt.</p>
                    </footer>
                </div>
            </div>
        );
    }


    // Original A4 Receipt
    return (
      <div ref={ref} className='p-8 font-sans bg-white text-black relative'>
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
            <header className='flex items-center justify-between pb-4 border-b border-gray-300'>
            <div className='flex items-center gap-4'>
                {settings.schoolLogo ? (
                <Image src={settings.schoolLogo} alt="School Logo" width={64} height={64} className="object-contain" />
                ) : (
                <School className="w-16 h-16 text-blue-500" />
                )}
                <div>
                <h1 className='text-4xl font-bold text-gray-800'>{settings.schoolName}</h1>
                <p className='text-sm text-gray-500'>{settings.schoolAddress}</p>
                <p className='text-sm text-gray-500'>Phone: {settings.schoolPhone}</p>
                </div>
            </div>
            <div className='text-right'>
                <h2 className='text-2xl font-semibold text-gray-700'>Fee Receipt</h2>
                <p className='text-sm text-gray-500'>Receipt #: {receiptId}</p>
                <p className='text-sm text-gray-500'>Date: {date.toLocaleDateString()}</p>
            </div>
            </header>

            <section className='my-6 grid grid-cols-2 gap-4'>
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
                <div className='text-right'>
                <h3 className='text-lg font-semibold text-gray-700 mb-2'>Payment Details:</h3>
                <p className="text-sm text-gray-600"><span className="font-semibold">Method:</span> {paymentMethod}</p>
                <p className="text-sm text-gray-600"><span className="font-semibold">Status:</span> {paidAmount > 0 ? (remainingDues > 0 ? 'Partially Paid' : 'Paid in Full') : 'Unpaid'}</p>
                </div>
            </section>

            <div className="my-4">
            <h3 className='text-lg font-semibold text-gray-700 mb-2'>Fee Description</h3>
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
