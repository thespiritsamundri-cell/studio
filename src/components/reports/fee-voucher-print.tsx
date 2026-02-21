'use client';

import React from 'react';
import type { Student, Family, Fee } from '@/lib/types';
import { School } from 'lucide-react';
import Image from 'next/image';
import type { SchoolSettings } from '@/context/settings-context';
import { format, parseISO } from 'date-fns';

interface FeeVoucherPrintProps {
  allVouchersData: {
    family: Family;
    students: Student[];
    fees: Fee[];
    totalAmount: number;
    voucherId: string;
    issueDate: string;
    dueDate: string;
    lateFee: number;
    qrCodeDataUri: string;
  }[];
  settings: SchoolSettings;
}

const VoucherSlip = ({ 
    family, 
    students, 
    settings, 
    fees, 
    totalAmount,
    voucherId,
    issueDate,
    dueDate,
    lateFee,
    copyType,
    qrCodeDataUri 
}: { 
    family: Family, 
    students: Student[], 
    settings: SchoolSettings,
    fees: Fee[],
    totalAmount: number,
    voucherId: string,
    issueDate: string,
    dueDate: string,
    lateFee: number,
    copyType: string, 
    qrCodeDataUri: string 
}) => {

  const student = students[0];
  const parsedIssueDate = parseISO(issueDate);
  const parsedDueDate = parseISO(dueDate);
  const amountAfterDueDate = totalAmount + lateFee;

  return (
      <div className="bg-white text-black text-sm font-sans p-2 border-2 border-black">
          <header className="flex justify-between items-start text-center mb-2">
            <div className="w-1/4 flex flex-col items-center justify-start pt-2 pl-2">
               {qrCodeDataUri && <Image src={qrCodeDataUri} alt="QR Code" width={70} height={70} />}
               <p className="text-[9px] text-center mt-1">Scan for Live Fee Status</p>
            </div>
            <div className="w-1/2">
              {settings.schoolLogo && <Image src={settings.schoolLogo} alt="School Logo" width={50} height={50} className="object-contain mx-auto" />}
              <h1 className="text-xl font-bold uppercase">{settings.schoolName}</h1>
              <p className="text-[10px]">{settings.schoolAddress}</p>
              <p className="text-[10px]">{settings.schoolPhone}</p>
            </div>
            <div className="w-1/4"></div>
          </header>
          
           <div className="text-center border-y-2 border-black py-0.5 my-2">
              <h2 className="text-xs font-semibold">FEE VOUCHER ({copyType})</h2>
           </div>

          <table className="w-full text-xs my-2">
              <tbody>
                  <tr>
                      <td className="font-bold py-0 pr-2">Voucher #</td>
                      <td className="py-0">{voucherId}</td>
                      <td className="font-bold py-0 pl-4 pr-2 text-left">Fee Month(s)</td>
                      <td className="py-0 text-left" colSpan={3}>{fees.map(f => f.month).join(', ')}</td>
                  </tr>
                   <tr>
                      <td className="font-bold py-0 pr-2">Issue Date</td>
                      <td className="py-0">{format(parsedIssueDate, 'dd-MMM-yyyy')}</td>
                      <td className="font-bold py-0 pl-4 pr-2 text-left">Due Date</td>
                      <td className="py-0 text-left font-bold">{format(parsedDueDate, 'dd-MMM-yyyy')}</td>
                  </tr>
                  <tr>
                      <td className="font-bold py-0 pr-2">Student ID</td>
                      <td className="py-0">{student.id}</td>
                       <td className="font-bold py-0 pl-4 pr-2 text-left">Family ID</td>
                      <td className="py-0 text-left">{family.id}</td>
                  </tr>
                   <tr>
                      <td className="font-bold py-0 pr-2">Student Name</td>
                      <td className="py-0" colSpan={3}>{students.map(s => `${s.name} (${s.class})`).join(', ')}</td>
                  </tr>
                   <tr>
                      <td className="font-bold py-0 pr-2">Father's Name</td>
                      <td className="py-0" colSpan={3}>{family.fatherName}</td>
                  </tr>
              </tbody>
          </table>

          <table className="w-full text-xs my-2">
              <thead className="border-y-2 border-black">
                  <tr>
                      <th className="p-1 text-left font-bold">Particulars</th>
                      <th className="p-1 text-right font-bold">Amount</th>
                  </tr>
              </thead>
              <tbody>
                  {fees.map(fee => (
                      <tr key={fee.id}>
                        <td className="p-1">{fee.month} {fee.year}</td>
                        <td className="p-1 text-right font-mono">{fee.amount.toLocaleString()}</td>
                      </tr>
                  ))}
              </tbody>
          </table>
          <div className="text-sm py-1 border-t-2 border-black space-y-1">
              <div className="flex justify-between items-center font-bold">
                  <span>Payable within Due Date</span>
                  <span className="font-mono">PKR {totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                  <span>Payable after Due Date</span>
                  <span className="font-mono">PKR {amountAfterDueDate.toLocaleString()}</span>
              </div>
          </div>
          <div className="text-[10px] text-center font-semibold mt-2">
            © {new Date().getFullYear()} {settings.schoolName} | Developed by SchoolUP
          </div>
      </div>
  );
};


export const FeeVoucherPrint = React.forwardRef<HTMLDivElement, FeeVoucherPrintProps>(
  ({ allVouchersData, settings }, ref) => {
    
    return (
      <div ref={ref}>
        {allVouchersData.map((voucher) => (
            <div key={voucher.voucherId} className="voucher-page w-[210mm] h-[297mm] bg-white mx-auto p-4 flex flex-col justify-around">
                <VoucherSlip {...voucher} copyType="Student Copy" />
                <VoucherSlip {...voucher} copyType="School Office Copy" />
            </div>
        ))}
      </div>
    );
  }
);

FeeVoucherPrint.displayName = 'FeeVoucherPrint';
