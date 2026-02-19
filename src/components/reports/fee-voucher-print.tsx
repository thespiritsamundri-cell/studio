
'use client';

import React from 'react';
import type { Student, Family } from '@/lib/types';
import { School } from 'lucide-react';
import Image from 'next/image';
import type { SchoolSettings } from '@/context/settings-context';
import { format, parseISO } from 'date-fns';
import type { VoucherData } from '@/app/(dashboard)/vouchers/page';

interface FeeVoucherPrintProps {
  allVouchersData: { family: Family; students: Student[]; voucherData: VoucherData, qrCodeDataUri: string }[];
  settings: SchoolSettings;
}

const VoucherSlip = ({ family, students, settings, voucherData, copyType, qrCodeDataUri }: { family: Family, students: Student[], settings: SchoolSettings, voucherData: VoucherData, copyType: string, qrCodeDataUri: string }) => {
  const { issueDate, dueDate, feeMonths, feeItems, grandTotal } = voucherData;
  const { admissionFee, monthlyFee, annualCharges, boardRegFee, pendingDues, lateFeeFine, concession } = feeItems;

  const student = students[0];
  const parsedIssueDate = issueDate ? parseISO(issueDate) : new Date();
  const parsedDueDate = dueDate ? parseISO(dueDate) : new Date();
  
  const amountAfterDueDate = grandTotal + lateFeeFine;

  const FeeRow = ({ label, amount }: { label: string, amount: number }) => (
    (amount !== 0) && ( // Also show concession if it's negative
        <tr>
            <td className="p-1">{label}</td>
            <td className="p-1 text-right font-mono">{amount.toLocaleString()}</td>
        </tr>
    )
  );

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
                      <td className="py-0">{voucherData.voucherId}</td>
                      <td className="font-bold py-0 pl-4 pr-2 text-left">Fee Month</td>
                      <td className="py-0 text-left" colSpan={3}>{feeMonths || format(parsedIssueDate, 'MMMM')}</td>
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
                      <td className="py-0" colSpan={3}>{student.name}</td>
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
                  <FeeRow label="Tuition Fee" amount={monthlyFee} />
                  <FeeRow label="Admission Fee" amount={admissionFee} />
                  <FeeRow label="Annual Charges" amount={annualCharges} />
                  <FeeRow label="Board Reg / Other" amount={boardRegFee} />
                  <FeeRow label="Pending Dues" amount={pendingDues} />
                  <FeeRow label="Concession" amount={-concession} />
              </tbody>
          </table>
          <div className="text-sm py-1 border-t-2 border-black space-y-1">
              <div className="flex justify-between items-center font-bold">
                  <span>Payable within Due Date</span>
                  <span className="font-mono">PKR {grandTotal.toLocaleString()}</span>
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
        {allVouchersData.map(({ family, students, voucherData, qrCodeDataUri }) => (
            <div key={family.id} className="voucher-page w-[210mm] h-[297mm] bg-white mx-auto p-4 flex flex-col justify-around">
                <VoucherSlip 
                    family={family}
                    students={students}
                    settings={settings}
                    voucherData={voucherData}
                    copyType="Student Copy"
                    qrCodeDataUri={qrCodeDataUri}
                />
                <VoucherSlip 
                    family={family}
                    students={students}
                    settings={settings}
                    voucherData={voucherData}
                    copyType="School Office Copy"
                    qrCodeDataUri={qrCodeDataUri}
                />
            </div>
        ))}
      </div>
    );
  }
);

FeeVoucherPrint.displayName = 'FeeVoucherPrint';
