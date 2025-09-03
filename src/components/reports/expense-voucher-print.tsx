
'use client';

import React from 'react';
import type { Expense } from '@/lib/types';
import type { SchoolSettings } from '@/context/settings-context';
import { School } from 'lucide-react';
import Image from 'next/image';
import { format, parseISO } from 'date-fns';

interface ExpenseVoucherPrintProps {
  expense: Expense;
  settings: SchoolSettings;
}

const DetailRow = ({ label, value }: { label: string; value: string | number | undefined }) => (
    <div className="flex justify-between py-1 border-b">
        <span className="font-semibold text-gray-600">{label}:</span>
        <span className="font-medium text-gray-800">{value}</span>
    </div>
);

export const ExpenseVoucherPrint = React.forwardRef<HTMLDivElement, ExpenseVoucherPrintProps>(
  ({ expense, settings }, ref) => {
    return (
      <div ref={ref} className="p-8 font-sans bg-white text-black max-w-2xl mx-auto">
        <header className="flex items-center justify-between pb-4 border-b-2 border-black">
          <div className="flex items-center gap-4">
             {settings.schoolLogo ? (
              <Image src={settings.schoolLogo} alt="School Logo" width={64} height={64} className="object-contain" />
            ) : (
              <School className="w-16 h-16 text-blue-500" />
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{settings.schoolName}</h1>
              <p className="text-sm text-gray-500">{settings.schoolAddress}</p>
              <p className="text-sm text-gray-500">Phone: {settings.schoolPhone}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-gray-700">EXPENSE VOUCHER</h2>
            <p className="text-sm text-gray-500">Voucher ID: {expense.id}</p>
          </div>
        </header>

        <main className="mt-8">
            <div className="grid grid-cols-2 gap-8 mb-8">
                <DetailRow label="Date" value={format(parseISO(expense.date), 'PPP')} />
                <DetailRow label="Category" value={expense.category} />
                <DetailRow label="Payee / Vendor" value={expense.vendor || 'N/A'} />
            </div>

            <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-600">Description:</h3>
                <p className="p-2 min-h-16 text-gray-800">{expense.description}</p>
            </div>

            <div className="flex justify-end mt-8">
                <div className="w-full max-w-xs space-y-4">
                     <div className="flex justify-between items-center bg-gray-100 p-2 rounded">
                        <span className="text-lg font-bold text-gray-800">Total Amount:</span>
                        <span className="text-lg font-bold text-red-600">PKR {expense.amount.toLocaleString()}</span>
                    </div>
                </div>
            </div>
        </main>

        <div className="grid grid-cols-2 gap-16 mt-24 pt-4 border-t border-dashed">
            <div className="text-center">
                <div className="border-b-2 border-black h-12"></div>
                <p className="mt-2 font-semibold">Prepared By</p>
            </div>
            <div className="text-center">
                <div className="border-b-2 border-black h-12"></div>
                <p className="mt-2 font-semibold">Approved By</p>
            </div>
        </div>
        
        <footer className="mt-12 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
          <p>This is a computer-generated voucher.</p>
          <p>&copy; {new Date().getFullYear()} {settings.schoolName}. All rights reserved.</p>
        </footer>
      </div>
    );
  }
);
ExpenseVoucherPrint.displayName = 'ExpenseVoucherPrint';
