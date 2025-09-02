
'use client';

import React from 'react';
import type { Student, Family } from '@/lib/types';
import { School } from 'lucide-react';
import Image from 'next/image';
import type { SchoolSettings } from '@/context/settings-context';
import { format } from 'date-fns';

interface VoucherData {
  issueDate: string;
  dueDate: string;
  feeMonths: string;
  feeItems: {
    admissionFee: number;
    monthlyFee: number;
    concession: number;
    annualCharges: number;
    boardRegFee: number;
    pendingDues: number;
    lateFeeFine: number;
  };
  grandTotal: number;
  notes: string;
}

interface FeeVoucherPrintProps {
  family: Family;
  students: Student[];
  settings: SchoolSettings;
  voucherData: VoucherData;
  copies: number;
}

const VoucherCopy = ({ family, students, settings, voucherData, copyType }: { family: Family, students: Student[], settings: SchoolSettings, voucherData: VoucherData, copyType: string }) => {
  const { issueDate, dueDate, feeMonths, feeItems, grandTotal, notes } = voucherData;
  const { admissionFee, monthlyFee, concession, annualCharges, boardRegFee, pendingDues, lateFeeFine } = feeItems;

  const studentNames = students.map(s => s.name).join(', ');
  const studentClasses = students.map(s => s.class).join(', ');

  return (
    <div className="voucher-container w-[21cm] mx-auto bg-white text-black text-xs font-sans">
      <div className="border-2 border-black p-2">
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
              <p>Issue Date: {format(new Date(issueDate), 'dd/MM/yyyy')}</p>
            </div>
          </div>
        </div>

        {/* Student Info */}
        <div className="flex justify-between py-1 border-b-2 border-black font-bold">
          <h2>FEE CHALLAN</h2>
          <h2>Family No: {family.id}</h2>
        </div>

        <div className="grid grid-cols-[auto,1fr] text-sm">
          <div className="font-bold border-r border-black p-1">Name:</div>
          <div className="p-1">{studentNames}</div>
          <div className="font-bold border-t border-r border-black p-1">Father's Name:</div>
          <div className="border-t border-black p-1">{family.fatherName}</div>
          <div className="font-bold border-t border-r border-black p-1">Class:</div>
          <div className="border-t border-black p-1">{studentClasses}</div>
        </div>

        {/* Fee Details */}
        <table className="w-full border-t-2 border-black text-sm">
          <tbody>
            <tr className="border-b border-black">
              <td className="font-bold p-1">Admission fee</td>
              <td className="p-1 text-center" colSpan={2}>{admissionFee}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="font-bold p-1">Monthly Fee</td>
              <td className="p-1 text-center">{feeMonths}</td>
              <td className="p-1 text-center">{monthlyFee}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="font-bold p-1">Concession by Principal</td>
              <td className="p-1 text-center" colSpan={2}>{concession > 0 ? -concession : 0}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="font-bold p-1">Annual Charges</td>
              <td className="p-1 text-center" colSpan={2}>{annualCharges}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="font-bold p-1">Late fee Fine</td>
              <td className="p-1 text-center">{lateFeeFine}</td>
              <td className="p-1 text-center"></td>
            </tr>
            <tr className="border-b border-black">
              <td className="font-bold p-1">Board Reg Fee / Summer Pack</td>
              <td className="p-1 text-center" colSpan={2}>{boardRegFee}</td>
            </tr>
             <tr className="border-b-2 border-black">
              <td className="font-bold p-1">Pending Dues</td>
              <td className="p-1 text-center" colSpan={2}>{pendingDues}</td>
            </tr>
            <tr className="bg-black text-white font-bold">
              <td className="p-1">Grand Total</td>
              <td className="p-1 text-center" colSpan={2}>{grandTotal}</td>
            </tr>
          </tbody>
        </table>

        {/* Due Date & Notes */}
        <div className="flex justify-between py-1 border-b-2 border-black font-bold">
          <p>Due Date: {format(new Date(dueDate), 'dd/MM/yyyy')}</p>
        </div>
        <div className="text-[9px] py-1 border-b-2 border-black">
          <p className="font-bold">Notes:</p>
          <div className="whitespace-pre-wrap">{notes}</div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-end pt-4">
          <p>Received By: __________________</p>
          <div className="bg-black text-white px-4 py-1 text-center font-bold">{copyType}</div>
        </div>
      </div>
    </div>
  );
};


export const FeeVoucherPrint = React.forwardRef<HTMLDivElement, FeeVoucherPrintProps>(
  ({ family, students, settings, voucherData, copies }, ref) => {
    const copyTypes = ['Admin Office Copy', 'Accounts Office Copy', 'Student Copy'];
    const vouchersToRender = Array.from({ length: 3 }, (_, i) => (
      <VoucherCopy 
        key={i}
        family={family} 
        students={students} 
        settings={settings} 
        voucherData={voucherData}
        copyType={copyTypes[i]} 
      />
    ));
    
    if (copies === 1) {
        return (
             <div ref={ref} className="p-4 bg-gray-200 space-y-4">
                {vouchersToRender.map((voucher, index) => (
                   <React.Fragment key={index}>
                        {voucher}
                        {index < vouchersToRender.length - 1 && <div className="page-break"></div>}
                   </React.Fragment>
                ))}
             </div>
        )
    }

    if (copies === 2) {
       return (
            <div ref={ref} className="p-4 bg-gray-200">
                <div className="flex gap-4">
                    {vouchersToRender[0]}
                    {vouchersToRender[1]}
                </div>
                <div className="page-break"></div>
                 <div className="flex gap-4">
                    {vouchersToRender[2]}
                </div>
            </div>
       )
    }
    
    return (
      <div ref={ref} className="p-4 bg-gray-200">
        <div className="grid grid-cols-3 gap-4">
            {vouchersToRender}
        </div>
      </div>
    );
  }
);

FeeVoucherPrint.displayName = 'FeeVoucherPrint';
