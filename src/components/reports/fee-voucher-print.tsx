
'use client';

import React from 'react';
import type { Student, Family } from '@/lib/types';
import { School } from 'lucide-react';
import Image from 'next/image';
import type { SchoolSettings } from '@/context/settings-context';
import { format, parseISO } from 'date-fns';
import type { VoucherData } from '@/app/(dashboard)/vouchers/page';

interface FeeVoucherPrintProps {
  allVouchersData: { family: Family; students: Student[]; voucherData: VoucherData }[];
  settings: SchoolSettings;
  copies: number;
}

const VoucherCopy = ({ family, students, settings, voucherData, copyType }: { family: Family, students: Student[], settings: SchoolSettings, voucherData: VoucherData, copyType: string }) => {
  const { issueDate, dueDate, feeMonths, feeItems, grandTotal } = voucherData;
  const { admissionFee, monthlyFee, concession, annualCharges, boardRegFee, pendingDues, lateFeeFine } = feeItems;

  const studentNames = students.map(s => s.name).join(', ');
  const studentClasses = students.map(s => s.class).join(', ');

  // Safely parse dates, assuming they are in 'yyyy-MM-dd' format from the input[type=date]
  const parsedIssueDate = issueDate ? parseISO(issueDate) : new Date();
  const parsedDueDate = dueDate ? parseISO(dueDate) : new Date();

  const totalBeforeFine = grandTotal - lateFeeFine;
  const totalAfterFine = grandTotal;


  return (
    <div className="voucher-container w-full mx-auto bg-white text-black text-xs font-sans">
      <div className="border-2 border-black p-2 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-1 border-b-2 border-black">
          <div className="flex items-center gap-2">
            {settings.schoolLogo ? (
              <Image src={settings.schoolLogo} alt="School Logo" width={40} height={40} className="object-contain" />
            ) : (
              <School className="w-10 h-10 text-black" />
            )}
            <div>
              <h1 className="text-xl font-bold uppercase">{settings.schoolName}</h1>
              <p className="text-[10px]">{settings.schoolAddress}</p>
            </div>
          </div>
          <div className="text-right text-[10px]">
            <p>Ph. {settings.schoolPhone}</p>
            <div className="border-t border-b border-black mt-1 px-2">
              <p>Issue Date: {format(parsedIssueDate, 'dd-MM-yyyy')}</p>
            </div>
             <p className="font-bold">{copyType}</p>
          </div>
        </div>
        
        <div className="flex justify-between py-1 border-b-2 border-black font-bold">
          <h2>FEE CHALLAN ({feeMonths} {new Date().getFullYear()})</h2>
          <h2>Due Date: {format(parsedDueDate, 'dd-MM-yyyy')}</h2>
        </div>

        <div className="flex-grow grid grid-cols-2 gap-2 py-1">
            {/* Left Column */}
            <div className="border-r-2 border-black pr-2">
                 <table className="w-full text-sm">
                    <tbody>
                        <tr>
                            <td className="font-bold p-1 w-1/3">Family No:</td>
                            <td className="p-1">{family.id}</td>
                        </tr>
                        <tr>
                            <td className="font-bold p-1 border-t border-gray-300">Father's Name:</td>
                            <td className="p-1 border-t border-gray-300">{family.fatherName}</td>
                        </tr>
                        <tr>
                            <td className="font-bold p-1 border-t border-gray-300">Student(s):</td>
                            <td className="p-1 border-t border-gray-300">{studentNames}</td>
                        </tr>
                        <tr>
                            <td className="font-bold p-1 border-t border-gray-300">Class(es):</td>
                            <td className="p-1 border-t border-gray-300">{studentClasses}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Right Column */}
            <div>
                 <table className="w-full text-sm">
                    <thead className="bg-gray-200 font-bold">
                        <tr>
                            <th className="p-1 text-left">Description</th>
                            <th className="p-1 text-right">Amount (PKR)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {admissionFee > 0 && <tr className="border-b border-gray-300"><td className="p-1">Admission fee</td><td className="p-1 text-right">{admissionFee.toLocaleString()}</td></tr>}
                        {monthlyFee > 0 && <tr className="border-b border-gray-300"><td className="p-1">Monthly Fee</td><td className="p-1 text-right">{monthlyFee.toLocaleString()}</td></tr>}
                        {concession > 0 && <tr className="border-b border-gray-300"><td className="p-1">Concession</td><td className="p-1 text-right text-red-600">-{concession.toLocaleString()}</td></tr>}
                        {annualCharges > 0 && <tr className="border-b border-gray-300"><td className="p-1">Annual Charges</td><td className="p-1 text-right">{annualCharges.toLocaleString()}</td></tr>}
                        {boardRegFee > 0 && <tr className="border-b border-gray-300"><td className="p-1">Board Reg Fee / Other</td><td className="p-1 text-right">{boardRegFee.toLocaleString()}</td></tr>}
                        {pendingDues > 0 && <tr className="border-b-2 border-black"><td className="p-1">Pending Dues</td><td className="p-1 text-right">{pendingDues.toLocaleString()}</td></tr>}

                        <tr className="font-bold bg-gray-200">
                            <td className="p-1">Total Before Due Date</td>
                            <td className="p-1 text-right">{totalBeforeFine.toLocaleString()}</td>
                        </tr>
                        <tr className="border-t-2 border-black">
                            <td className="p-1">Late Fee Fine</td>
                            <td className="p-1 text-right">{lateFeeFine.toLocaleString()}</td>
                        </tr>
                        <tr className="font-bold bg-gray-200">
                            <td className="p-1">Total After Due Date</td>
                            <td className="p-1 text-right">{totalAfterFine.toLocaleString()}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div className="text-[9px] py-1 border-t-2 border-black flex-grow">
          <p className="font-bold">Notes:</p>
          <div className="whitespace-pre-wrap">{voucherData.notes}</div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-end pt-1 mt-auto">
          <p>Bank Stamp: __________________</p>
          <div className="bg-black text-white px-4 py-1 text-center font-bold">Signature</div>
        </div>
      </div>
    </div>
  );
};


export const FeeVoucherPrint = React.forwardRef<HTMLDivElement, FeeVoucherPrintProps>(
  ({ allVouchersData, settings, copies }, ref) => {
    const copyTypes = ['Office Copy', 'Student Copy', 'Bank Copy'];
    
    return (
      <div ref={ref} className="bg-gray-200" data-print-copies={copies}>
        {allVouchersData.map(({ family, students, voucherData }) => (
            <div key={family.id} className="voucher-page">
                {copyTypes.map((copyType, copyIndex) => (
                    <div key={copyIndex} className="voucher-wrapper">
                        <VoucherCopy 
                            family={family}
                            students={students}
                            settings={settings}
                            voucherData={voucherData}
                            copyType={copyType}
                        />
                    </div>
                ))}
            </div>
        ))}
      </div>
    );
  }
);

FeeVoucherPrint.displayName = 'FeeVoucherPrint';
