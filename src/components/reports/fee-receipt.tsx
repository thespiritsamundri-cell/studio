
'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Family, Student, Fee } from '@/lib/types';
import { School } from 'lucide-react';
import type { SchoolSettings } from '@/context/settings-context';
import Image from 'next/image';
import { PaidStamp } from '../ui/paid-stamp';

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
}

const thermalStyles = `
    @media print {
        @page {
            size: 80mm auto;
            margin: 0;
        }
    }
    .receipt-container {
        width: 80mm;
        font-size: 10px;
        color: #000;
        background-color: #fff;
        padding: 5mm;
        box-sizing: border-box;
    }
    .receipt-container h1 { font-size: 16px; }
    .receipt-container h2 { font-size: 14px; }
    .receipt-container h3 { font-size: 12px; }
    .receipt-container .paid-stamp-wrapper {
        width: 120px;
        height: 120px;
        top: 40%;
        z-index: 0;
    }
    .receipt-container .content-wrapper {
        z-index: 1;
        position: relative;
    }
`;

export const FeeReceipt = React.forwardRef<HTMLDivElement, FeeReceiptProps>(
  ({ family, students, fees, totalDues, paidAmount, remainingDues, settings, paymentMethod, printType }, ref) => {
    const date = new Date();

    const isThermal = printType === 'thermal';

    return (
      <div ref={ref} className={isThermal ? 'receipt-container font-sans relative' : 'p-8 font-sans bg-white text-black relative'}>
        {isThermal && <style>{thermalStyles}</style>}

         {paidAmount > 0 && (
            <div className={isThermal ? 'paid-stamp-wrapper absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 pointer-events-none' : 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-15 pointer-events-none'}>
                <PaidStamp
                    schoolName={settings.schoolName}
                    schoolPhone={settings.schoolPhone}
                    paymentDate={date}
                />
            </div>
        )}

        <div className={isThermal ? 'content-wrapper' : ''}>
            <header className={isThermal ? 'text-center' : 'flex items-center justify-between pb-4 border-b border-gray-300'}>
            <div className={isThermal ? 'flex flex-col items-center gap-1' : 'flex items-center gap-4'}>
                {settings.schoolLogo ? (
                <Image src={settings.schoolLogo} alt="School Logo" width={isThermal ? 40 : 64} height={isThermal ? 40 : 64} className="object-contain" />
                ) : (
                <School className={isThermal ? "w-8 h-8" : "w-16 h-16 text-blue-500"} />
                )}
                <div>
                <h1 className={isThermal ? 'font-bold' : 'text-4xl font-bold text-gray-800'}>{settings.schoolName}</h1>
                <p className={isThermal ? 'text-xs' : 'text-sm text-gray-500'}>{settings.schoolAddress}</p>
                <p className={isThermal ? 'text-xs' : 'text-sm text-gray-500'}>Phone: {settings.schoolPhone}</p>
                </div>
            </div>
            <div className={isThermal ? 'text-center mt-2 border-t pt-1' : 'text-right'}>
                <h2 className={isThermal ? 'font-semibold' : 'text-2xl font-semibold text-gray-700'}>Fee Receipt</h2>
                <p className={isThermal ? 'text-xs' : 'text-sm text-gray-500'}>Receipt #: {`INV-${Date.now()}`}</p>
                <p className={isThermal ? 'text-xs' : 'text-sm text-gray-500'}>Date: {date.toLocaleDateString()}</p>
            </div>
            </header>

            <section className={isThermal ? 'my-2 border-t border-b py-2' : 'my-6 grid grid-cols-2 gap-4'}>
            <div>
                <h3 className={isThermal ? 'font-semibold' : 'text-lg font-semibold text-gray-700 mb-2'}>Billed To:</h3>
                <p className={isThermal ? 'font-bold' : 'font-bold'}>{family.fatherName} (Family ID: {family.id})</p>
                {!isThermal && <p className="text-sm text-gray-600">{family.address}</p>}
                <p className={isThermal ? '' : 'text-sm text-gray-600'}>{family.phone}</p>
                <div className={isThermal ? 'mt-1' : 'mt-2'}>
                    <h4 className="font-semibold">Students:</h4>
                    <p className={isThermal ? '' : 'text-sm text-gray-600'}>{students.map(s => s.name).join(', ')}</p>
                </div>
            </div>
                <div className={isThermal ? 'mt-2' : 'text-right'}>
                <h3 className={isThermal ? 'font-semibold' : 'text-lg font-semibold text-gray-700 mb-2'}>Payment Details:</h3>
                <p className={isThermal ? '' : 'text-sm text-gray-600'}><span className="font-semibold">Method:</span> {paymentMethod}</p>
                <p className={isThermal ? '' : 'text-sm text-gray-600'}><span className="font-semibold">Status:</span> {paidAmount > 0 ? (remainingDues > 0 ? 'Partially Paid' : 'Paid in Full') : 'Unpaid'}</p>
                </div>
            </section>

            <div className="my-4">
            <h3 className={isThermal ? 'font-semibold text-center' : 'text-lg font-semibold text-gray-700 mb-2'}>Fee Description</h3>
            <Table className={isThermal ? 'text-black' : 'text-black'}>
                <TableHeader className={isThermal ? '' : 'bg-gray-100'}>
                    <TableRow>
                    <TableHead className={isThermal ? 'p-1' : 'text-gray-600'}>Description</TableHead>
                    <TableHead className={isThermal ? 'p-1 text-right' : 'text-right text-gray-600'}>Amount (PKR)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {fees.map((fee) => (
                    <TableRow key={fee.id}>
                        <TableCell className={isThermal ? 'p-1 font-medium' : 'font-medium'}>{fee.month} {fee.year}</TableCell>
                        <TableCell className={isThermal ? 'p-1 text-right' : 'text-right'}>{fee.amount.toLocaleString()}</TableCell>
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

            <div className={isThermal ? 'mt-4 border-t pt-2' : 'flex justify-end mt-8'}>
            <div className={isThermal ? 'w-full space-y-1' : 'w-full max-w-xs space-y-2 text-right'}>
                <div className="flex justify-between">
                    <span className="font-semibold">Previous Balance:</span>
                    <span>PKR {totalDues.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                    <span className="font-semibold">Paid Amount:</span>
                    <span>- PKR {paidAmount.toLocaleString()}</span>
                </div>
                <div className={isThermal ? 'flex justify-between font-bold border-t mt-1 pt-1' : 'flex justify-between text-lg font-bold text-red-600 border-t pt-2 mt-2'}>
                    <span className={isThermal ? '' : 'text-gray-800'}>New Balance Due:</span>
                    <span>PKR {remainingDues.toLocaleString()}</span>
                </div>
            </div>
            </div>
            
            <footer className={isThermal ? 'mt-4 pt-2 border-t text-center' : 'mt-12 pt-4 border-t border-gray-300 text-center text-xs text-gray-500'}>
            <p className={isThermal ? 'mb-1' : 'mb-2'}>Thank you for your payment!</p>
            {!isThermal && <p>&copy; {new Date().getFullYear()} {settings.schoolName}. All rights reserved.</p>}
            </footer>
        </div>
      </div>
    );
  }
);

FeeReceipt.displayName = 'FeeReceipt';

