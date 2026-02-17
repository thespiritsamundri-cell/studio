
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

const VoucherSection = ({ family, students, settings, voucherData, copyType, qrCodeDataUri }: { family: Family, students: Student[], settings: SchoolSettings, voucherData: VoucherData, copyType: string, qrCodeDataUri: string }) => {
  const { issueDate, dueDate, feeMonths, feeItems, grandTotal } = voucherData;
  const { admissionFee, monthlyFee, annualCharges, boardRegFee, pendingDues, lateFeeFine, concession } = feeItems;

  const student = students[0]; // Assume the first student for primary display
  
  const parsedIssueDate = issueDate ? parseISO(issueDate) : new Date();
  const parsedDueDate = dueDate ? parseISO(dueDate) : new Date();
  
  const FeeRow = ({ label, amount }: { label: string, amount: number }) => (
    <tr>
      <td className="p-1.5">{label}</td>
      <td className="p-1.5 text-right font-mono">{amount > 0 ? amount.toLocaleString() : '-'}</td>
    </tr>
  );

  return (
      <div className="bg-white text-black text-sm font-sans p-4">
          <header className="text-center mb-4">
              {settings.schoolLogo && <Image src={settings.schoolLogo} alt="School Logo" width={50} height={50} className="object-contain mx-auto" />}
              <h1 className="text-2xl font-bold uppercase mt-2">{settings.schoolName}</h1>
              <p className="text-xs">{settings.schoolAddress}</p>
              <p className="text-xs">Phone: {settings.schoolPhone}</p>
              <h2 className="text-base font-semibold mt-2">Fee Voucher ({copyType})</h2>
          </header>

          <table className="w-full text-xs border-y-2 border-black my-2">
              <tbody>
                  <tr>
                      <td className="font-bold py-1 pr-2">Student Name:</td>
                      <td className="py-1">{student.name}</td>
                      <td className="font-bold py-1 pr-2 text-right">Roll No:</td>
                      <td className="py-1 text-right">{student.id}</td>
                  </tr>
                  <tr>
                      <td className="font-bold py-1 pr-2">Father's Name:</td>
                      <td className="py-1">{student.fatherName}</td>
                       <td className="font-bold py-1 pr-2 text-right">Class:</td>
                      <td className="py-1 text-right">{student.class} {student.section}</td>
                  </tr>
                  <tr>
                      <td className="font-bold py-1 pr-2">Issue Date:</td>
                      <td className="py-1">{format(parsedIssueDate, 'MMMM do, yyyy')}</td>
                      <td className="font-bold py-1 pr-2 text-right">Due Date:</td>
                      <td className="py-1 text-right">{format(parsedDueDate, 'MMMM do, yyyy')}</td>
                  </tr>
                   <tr>
                      <td className="font-bold py-1 pr-2">Family ID:</td>
                      <td className="py-1 font-semibold">{family.id}</td>
                  </tr>
              </tbody>
          </table>

          <table className="w-full text-xs my-2">
              <thead className="border-y-2 border-black">
                  <tr>
                      <th className="p-1.5 text-left font-bold">Description</th>
                      <th className="p-1.5 text-right font-bold">Amount (PKR)</th>
                  </tr>
              </thead>
              <tbody>
                  <FeeRow label="Tuition Fee" amount={monthlyFee} />
                  {admissionFee > 0 && <FeeRow label="Admission Fee" amount={admissionFee} />}
                  {annualCharges > 0 && <FeeRow label="Annual Charges" amount={annualCharges} />}
                  {boardRegFee > 0 && <FeeRow label="Board Reg / Other" amount={boardRegFee} />}
                  {pendingDues > 0 && <FeeRow label="Pending Dues" amount={pendingDues} />}
                  {concession > 0 && <FeeRow label="Concession" amount={-concession} />}
              </tbody>
              <tfoot className="border-t-2 border-black font-bold">
                  <tr>
                      <td className="p-1.5 text-left">Total Amount Due</td>
                      <td className="p-1.5 text-right font-mono">{grandTotal.toLocaleString()}</td>
                  </tr>
              </tfoot>
          </table>

           <div className="text-center my-4">
                <p className="text-xs font-semibold">Scan for live fee status</p>
                {qrCodeDataUri ? <Image src={qrCodeDataUri} alt="QR Code" width={80} height={80} className="mx-auto mt-1" /> : <div className="w-20 h-20 bg-gray-200 mx-auto mt-1 animate-pulse" />}
           </div>
      </div>
  );
};


export const FeeVoucherPrint = React.forwardRef<HTMLDivElement, FeeVoucherPrintProps>(
  ({ allVouchersData, settings }, ref) => {
    
    return (
      <div ref={ref}>
        {allVouchersData.map(({ family, students, voucherData, qrCodeDataUri }) => (
            <div key={family.id} className="printable-page w-[210mm] h-[297mm] bg-white mx-auto shadow-lg">
                <div className="h-full flex flex-col justify-between">
                    <VoucherSection 
                        family={family}
                        students={students}
                        settings={settings}
                        voucherData={voucherData}
                        copyType="Student Copy"
                        qrCodeDataUri={qrCodeDataUri}
                    />
                    <div className="border-t-2 border-dashed border-black mx-4 my-2 flex items-center gap-2 text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.48 5.48c.5-.5 1.3-.5 1.8 0l8.24 8.24c.5.5.5 1.3 0 1.8l-1.8 1.8c-.5.5-1.3.5-1.8 0L7.68 9.08c-.5-.5-.5-1.3 0-1.8Z"/><path d="M19.927 20.437 14.3 14.81l-5.61 5.61c-.5.5-1.3.5-1.8 0l-1.8-1.8c-.5-.5-.5-1.3 0-1.8l5.61-5.61-5.62-5.62c-.5-.5-.5-1.3 0-1.8l1.8-1.8c.5-.5 1.3-.5 1.8 0l5.61 5.61 5.62-5.62c.5-.5 1.3-.5 1.8 0l1.8 1.8c.5.5.5 1.3 0 1.8Z"/></svg>
                        <span>Please cut along the dotted line</span>
                    </div>
                     <div className="bg-white text-black text-xs font-sans p-4 border-2 border-black m-4 mt-0">
                        <h3 className="font-bold text-center text-base mb-2">School Office Copy</h3>
                         <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                            <p><span className="font-semibold">Student:</span> {students[0].name} ({students[0].id})</p>
                            <p><span className="font-semibold">Class:</span> {students[0].class}</p>
                            <p><span className="font-semibold">Father's Name:</span> {students[0].fatherName}</p>
                            <p><span className="font-semibold">Amount:</span> PKR {voucherData.grandTotal.toLocaleString()}</p>
                            <p><span className="font-semibold">Due Date:</span> {format(parseISO(voucherData.dueDate), 'MMMM do, yyyy')}</p>
                         </div>
                    </div>
                    <p className="text-center text-gray-500 text-xs pb-2">Copyright &copy; {new Date().getFullYear()} {settings.schoolName}. Developed by SchoolUP.</p>
                </div>
            </div>
        ))}
      </div>
    );
  }
);

FeeVoucherPrint.displayName = 'FeeVoucherPrint';

    