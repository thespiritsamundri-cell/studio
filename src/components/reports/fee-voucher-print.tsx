
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
          </div>
        </div>

        {/* Student Info */}
        <div className="flex justify-between py-1 border-b-2 border-black font-bold">
          <h2>FEE CHALLAN</h2>
          <h2>Family No: {family.id}</h2>
        </div>

        <table className="w-full text-sm border-b-2 border-black">
            <tbody>
                <tr>
                    <td className="font-bold p-1 w-1/4">Name:</td>
                    <td className="p-1">{studentNames}</td>
                </tr>
                 <tr>
                    <td className="font-bold p-1 w-1/4 border-t border-black">Father's Name:</td>
                    <td className="p-1 border-t border-black">{family.fatherName}</td>
                </tr>
                 <tr>
                    <td className="font-bold p-1 w-1/4 border-t border-black">Class:</td>
                    <td className="p-1 border-t border-black">{studentClasses}</td>
                </tr>
            </tbody>
        </table>

        {/* Fee Details */}
        <table className="w-full border-b-2 border-black text-sm">
            <thead className="bg-black text-white font-bold">
                <tr>
                    <th className="p-1 text-left">Description</th>
                    <th className="p-1 text-center">Month</th>
                    <th className="p-1 text-right">Amount</th>
                </tr>
            </thead>
            <tbody>
                {admissionFee > 0 && <tr className="border-b border-black"><td className="font-bold p-1">Admission fee</td><td className="p-1 text-center"></td><td className="p-1 text-right">{admissionFee.toLocaleString()}</td></tr>}
                {monthlyFee > 0 && <tr className="border-b border-black"><td className="font-bold p-1">Monthly Fee</td><td className="p-1 text-center">{feeMonths}</td><td className="p-1 text-right">{monthlyFee.toLocaleString()}</td></tr>}
                {concession > 0 && <tr className="border-b border-black"><td className="font-bold p-1">Concession by Principal</td><td className="p-1 text-center"></td><td className="p-1 text-right text-red-600">-{concession.toLocaleString()}</td></tr>}
                {annualCharges > 0 && <tr className="border-b border-black"><td className="font-bold p-1">Annual Charges</td><td className="p-1 text-center"></td><td className="p-1 text-right">{annualCharges.toLocaleString()}</td></tr>}
                {boardRegFee > 0 && <tr className="border-b border-black"><td className="font-bold p-1">Board Reg Fee / Other</td><td className="p-1 text-center"></td><td className="p-1 text-right">{boardRegFee.toLocaleString()}</td></tr>}
                {pendingDues > 0 && <tr className="border-b-2 border-black"><td className="font-bold p-1">Pending Dues</td><td className="p-1 text-center"></td><td className="p-1 text-right">{pendingDues.toLocaleString()}</td></tr>}

                <tr className="bg-black text-white font-bold">
                <td className="p-1">Grand Total (Due by {format(parsedDueDate, 'dd-MMM')})</td>
                <td className="p-1 text-center"></td>
                <td className="p-1 text-right">{grandTotal.toLocaleString()}</td>
                </tr>
                 <tr className="border-t-2 border-black">
                    <td className="font-bold p-1">Total After Due Date</td>
                    <td className="p-1 text-center"></td>
                    <td className="p-1 text-right font-bold">{(grandTotal + lateFeeFine).toLocaleString()}</td>
                </tr>
            </tbody>
        </table>
        
        <div className="text-[9px] py-1 border-b-2 border-black flex-grow">
          <p className="font-bold">Notes:</p>
          <div className="whitespace-pre-wrap">{voucherData.notes}</div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-end pt-4 mt-auto">
          <p>Received By: __________________</p>
          <div className="bg-black text-white px-4 py-1 text-center font-bold">{copyType}</div>
        </div>
      </div>
    </div>
  );
};


export const FeeVoucherPrint = React.forwardRef<HTMLDivElement, FeeVoucherPrintProps>(
  ({ allVouchersData, settings, copies }, ref) => {
    const copyTypes = ['Admin Office Copy', 'Accounts Office Copy', 'Student Copy'];
    
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
