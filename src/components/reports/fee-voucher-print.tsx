
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

  const studentNames = students.map(s => `${s.name} (${s.class})`).join(', ');

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
            {settings.schoolLogo && (
              <Image src={settings.schoolLogo} alt="School Logo" width={40} height={40} className="object-contain" />
            )}
            <div>
              <h1 className="text-base font-bold uppercase">{settings.schoolName}</h1>
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
        
        <div className="flex justify-between py-1 border-b-2 border-black font-bold text-center">
          <h2 className="text-sm">FEE CHALLAN ({feeMonths} {new Date().getFullYear()})</h2>
          <h2 className="text-sm">Due Date: {format(parsedDueDate, 'dd-MM-yyyy')}</h2>
        </div>
        
        {/* Student Info */}
         <table className="w-full text-[10px] my-1">
            <tbody>
                <tr>
                    <td className="font-bold p-0.5 w-1/6">Family No:</td>
                    <td className="p-0.5 border-b w-1/6">{family.id}</td>
                    <td className="font-bold p-0.5 w-1/6">Student(s):</td>
                    <td className="p-0.5 border-b">{studentNames}</td>
                </tr>
                <tr>
                    <td className="font-bold p-0.5">Father's Name:</td>
                    <td className="p-0.5 border-b">{family.fatherName}</td>
                    <td className="font-bold p-0.5"></td>
                    <td className="p-0.5"></td>
                </tr>
            </tbody>
        </table>


        {/* Fees Table */}
        <div className="flex-grow flex">
            <div className="w-2/3 pr-2">
                 <table className="w-full text-xs">
                    <thead className="bg-gray-200 font-bold text-black">
                        <tr><th className="p-1 text-left" colSpan={2}>Fee Description</th></tr>
                    </thead>
                    <tbody>
                        {admissionFee > 0 && <tr className="border-b"><td className="p-1">Admission fee</td><td className="p-1 text-right">{admissionFee.toLocaleString()}</td></tr>}
                        {monthlyFee > 0 && <tr className="border-b"><td className="p-1">Monthly Fee</td><td className="p-1 text-right">{monthlyFee.toLocaleString()}</td></tr>}
                        {annualCharges > 0 && <tr className="border-b"><td className="p-1">Annual Charges</td><td className="p-1 text-right">{annualCharges.toLocaleString()}</td></tr>}
                        {boardRegFee > 0 && <tr className="border-b"><td className="p-1">Board Reg / Other</td><td className="p-1 text-right">{boardRegFee.toLocaleString()}</td></tr>}
                        {pendingDues > 0 && <tr className="border-b"><td className="p-1">Pending Dues</td><td className="p-1 text-right">{pendingDues.toLocaleString()}</td></tr>}
                        {concession > 0 && <tr className="border-b"><td className="p-1">Concession</td><td className="p-1 text-right text-red-600">-{concession.toLocaleString()}</td></tr>}
                    </tbody>
                 </table>
            </div>
             <div className="w-1/3 border-l-2 border-black pl-2">
                 <table className="w-full text-xs">
                    <thead className="bg-gray-200 font-bold text-black">
                        <tr><th className="p-1 text-left" colSpan={2}>Summary</th></tr>
                    </thead>
                     <tbody>
                        <tr className="border-b"><td className="p-1 font-semibold">Payable within Due Date</td><td className="p-1 text-right font-bold">{totalBeforeFine.toLocaleString()}</td></tr>
                        <tr className="border-b"><td className="p-1">Late Fee Fine</td><td className="p-1 text-right">{lateFeeFine.toLocaleString()}</td></tr>
                        <tr className="border-b bg-gray-100"><td className="p-1 font-semibold">Payable after Due Date</td><td className="p-1 text-right font-bold">{totalAfterFine.toLocaleString()}</td></tr>
                     </tbody>
                 </table>
            </div>
        </div>

        <div className="text-[9px] py-1 border-t-2 border-black mt-2">
          <p className="font-bold">Notes:</p>
          <div className="whitespace-pre-wrap">{voucherData.notes}</div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-end pt-1 mt-auto border-t-2 border-black">
          <p className="text-xs">Bank Stamp: _________________</p>
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
                {copyTypes.slice(0, copies).map((copyType, copyIndex) => (
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
