

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
  const { issueDate, dueDate, feeMonths, feeItems, grandTotal, notes } = voucherData;
  const { admissionFee, monthlyFee, annualCharges, boardRegFee, pendingDues, lateFeeFine, concession } = feeItems;

  const student = students[0];
  
  const parsedIssueDate = issueDate ? parseISO(issueDate) : new Date();
  const parsedDueDate = dueDate ? parseISO(dueDate) : new Date();
  
  const FeeRow = ({ label, amount }: { label: string, amount: number }) => (
    <tr>
      <td className="p-1">{label}</td>
      <td className="p-1 text-right font-mono">{amount > 0 ? amount.toLocaleString() : '-'}</td>
    </tr>
  );
  
  const amountAfterDueDate = grandTotal + lateFeeFine;

  return (
      <div className="bg-white text-black text-sm font-sans p-2">
          <header className="text-center mb-2">
              {settings.schoolLogo && <Image src={settings.schoolLogo} alt="School Logo" width={50} height={50} className="object-contain mx-auto" />}
              <h1 className="text-xl font-bold uppercase mt-1">{settings.schoolName}</h1>
              <p className="text-[10px]">{settings.schoolAddress}</p>
              <p className="text-[10px]">Phone: {settings.schoolPhone}</p>
              <h2 className="text-base font-semibold mt-1">Fee Voucher ({copyType})</h2>
          </header>

          <table className="w-full text-xs border-y-2 border-black my-1">
              <tbody>
                  <tr>
                      <td className="font-bold py-0.5 pr-2">Student Name:</td>
                      <td className="py-0.5">{students.map(s => s.name).join(', ')}</td>
                      <td className="font-bold py-0.5 pr-2 text-right">Roll No:</td>
                      <td className="py-0.5 text-right">{students.map(s => s.id).join(', ')}</td>
                  </tr>
                  <tr>
                      <td className="font-bold py-0.5 pr-2">Father's Name:</td>
                      <td className="py-0.5">{family.fatherName}</td>
                       <td className="font-bold py-0.5 pr-2 text-right">Class:</td>
                      <td className="py-0.5 text-right">{students.map(s => s.class).join(', ')}</td>
                  </tr>
                  <tr>
                      <td className="font-bold py-0.5 pr-2">Issue Date:</td>
                      <td className="py-0.5">{format(parsedIssueDate, 'dd-MMM-yy')}</td>
                      <td className="font-bold py-0.5 pr-2 text-right">Due Date:</td>
                      <td className="py-0.5 text-right font-bold text-red-600">{format(parsedDueDate, 'dd-MMM-yy')}</td>
                  </tr>
                   <tr>
                      <td className="font-bold py-0.5 pr-2">Family ID:</td>
                      <td className="py-0.5 font-semibold">{family.id}</td>
                  </tr>
              </tbody>
          </table>

          <table className="w-full text-xs my-1">
              <thead className="border-b-2 border-black">
                  <tr>
                      <th className="p-1 text-left font-bold">Description</th>
                      <th className="p-1 text-right font-bold">Amount (PKR)</th>
                  </tr>
              </thead>
              <tbody>
                  <FeeRow label={`Tuition Fee (${feeMonths})`} amount={monthlyFee} />
                  {admissionFee > 0 && <FeeRow label="Admission Fee" amount={admissionFee} />}
                  {annualCharges > 0 && <FeeRow label="Annual Charges" amount={annualCharges} />}
                  {boardRegFee > 0 && <FeeRow label="Board Reg / Other" amount={boardRegFee} />}
                  {pendingDues > 0 && <FeeRow label="Pending Dues" amount={pendingDues} />}
                  {concession > 0 && <FeeRow label="Concession" amount={-concession} />}
              </tbody>
          </table>
          <div className="grid grid-cols-2 gap-x-4 border-t-2 border-black font-bold text-xs py-1">
              <span>Payable within Due Date</span>
              <span className="text-right font-mono">PKR {grandTotal.toLocaleString()}</span>
              <span>Payable after Due Date</span>
              <span className="text-right font-mono">PKR {amountAfterDueDate.toLocaleString()}</span>
          </div>

           <div className="flex justify-between items-center text-xs mt-2">
                <div className="font-urdu whitespace-pre-wrap text-[9px] border p-1 rounded w-2/3">{notes}</div>
                <div className="flex flex-col items-center">
                    <p className="text-[8px] font-semibold">Scan for live fee status</p>
                    {qrCodeDataUri ? <Image src={qrCodeDataUri} alt="QR Code" width={40} height={40} className="mt-0.5" /> : <div className="w-10 h-10 bg-gray-200 mt-0.5" />}
                </div>
           </div>
      </div>
  );
};


export const FeeVoucherPrint = React.forwardRef<HTMLDivElement, FeeVoucherPrintProps>(
  ({ allVouchersData, settings }, ref) => {
    
    return (
      <div ref={ref} data-print-copies="1">
        {allVouchersData.map(({ family, students, voucherData, qrCodeDataUri }) => (
            <div key={family.id} className="voucher-page w-[210mm] h-[297mm] bg-white mx-auto shadow-lg flex flex-col p-4">
                <div className="voucher-wrapper border border-black flex-grow">
                    <VoucherSection 
                        family={family}
                        students={students}
                        settings={settings}
                        voucherData={voucherData}
                        copyType="Student Copy"
                        qrCodeDataUri={qrCodeDataUri}
                    />
                </div>
                 <div className="border-t-2 border-dashed border-black mx-4 my-2 flex items-center gap-2 text-gray-500 text-xs">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.48 5.48c.5-.5 1.3-.5 1.8 0l8.24 8.24c.5.5.5 1.3 0 1.8l-1.8 1.8c-.5.5-1.3.5-1.8 0L7.68 9.08c-.5-.5-.5-1.3 0-1.8Z"/><path d="M19.927 20.437 14.3 14.81l-5.61 5.61c-.5.5-1.3.5-1.8 0l-1.8-1.8c-.5-.5-.5-1.3 0-1.8l5.61-5.61-5.62-5.62c-.5-.5-.5-1.3 0-1.8l1.8-1.8c.5-.5 1.3-.5 1.8 0l5.61 5.61 5.62-5.62c.5-.5 1.3-.5 1.8 0l1.8 1.8c.5.5.5 1.3 0 1.8Z"/></svg>
                    <span>Please cut along the dotted line</span>
                </div>
                <div className="voucher-wrapper border border-black flex-grow">
                     <div className="bg-white text-black text-sm font-sans p-2">
                        <header className="text-center mb-2">
                            {settings.schoolLogo && <Image src={settings.schoolLogo} alt="School Logo" width={50} height={50} className="object-contain mx-auto" />}
                            <h1 className="text-xl font-bold uppercase mt-1">{settings.schoolName}</h1>
                             <h2 className="text-base font-semibold mt-1">Fee Voucher (School Office Copy)</h2>
                        </header>
                         <table className="w-full text-xs border-y-2 border-black my-1">
                            <tbody>
                                <tr>
                                    <td className="font-bold py-0.5 pr-2">Student Name:</td>
                                    <td className="py-0.5">{students[0].name}</td>
                                    <td className="font-bold py-0.5 pr-2 text-right">Family ID:</td>
                                    <td className="py-0.5 text-right font-bold">{family.id}</td>
                                </tr>
                                <tr>
                                    <td className="font-bold py-0.5 pr-2">Class:</td>
                                    <td className="py-0.5">{students[0].class}</td>
                                    <td className="font-bold py-0.5 pr-2 text-right">Due Date:</td>
                                    <td className="py-0.5 text-right">{format(parseISO(voucherData.dueDate), 'dd-MMM-yy')}</td>
                                </tr>
                            </tbody>
                        </table>
                        <table className="w-full text-xs my-1">
                            <thead className="border-b-2 border-black">
                                <tr>
                                    <th className="p-1 text-left font-bold">Description</th>
                                    <th className="p-1 text-right font-bold">Amount (PKR)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="p-1">{`Tuition Fee (${voucherData.feeMonths})`}</td>
                                    <td className="p-1 text-right">{voucherData.feeItems.monthlyFee.toLocaleString()}</td>
                                </tr>
                                 {voucherData.feeItems.pendingDues > 0 && (
                                     <tr><td className="p-1">Pending Dues</td><td className="p-1 text-right">{voucherData.feeItems.pendingDues.toLocaleString()}</td></tr>
                                 )}
                            </tbody>
                            <tfoot className="border-t-2 border-black font-bold">
                                <tr>
                                    <td className="p-1 text-left">Total Amount</td>
                                    <td className="p-1 text-right">PKR {voucherData.grandTotal.toLocaleString()}</td>
                                </tr>
                            </tfoot>
                        </table>
                        <p className="text-[8px] text-center mt-4">Copyright &copy; {new Date().getFullYear()} {settings.schoolName}. Developed by SchoolUP.</p>
                    </div>
                </div>
            </div>
        ))}
      </div>
    );
  }
);

FeeVoucherPrint.displayName = 'FeeVoucherPrint';

    
