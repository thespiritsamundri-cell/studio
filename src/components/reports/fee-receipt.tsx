
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Family, Student, Fee } from '@/lib/types';
import { School } from 'lucide-react';

interface FeeReceiptProps {
    family: Family;
    students: Student[];
    fees: Fee[];
    totalDues: number;
    paidAmount: number;
    remainingDues: number;
}

export const FeeReceipt = React.forwardRef<HTMLDivElement, FeeReceiptProps>(
  ({ family, students, fees, totalDues, paidAmount, remainingDues }, ref) => {
    const date = new Date();

    return (
      <div ref={ref} className="p-8 font-sans bg-white text-black">
        <header className="flex items-center justify-between pb-4 border-b border-gray-300">
          <div className="flex items-center gap-4">
            <School className="w-16 h-16 text-blue-500" />
            <div>
              <h1 className="text-4xl font-bold text-gray-800">EduCentral</h1>
              <p className="text-sm text-gray-500">123 Education Lane, Knowledge City, Pakistan</p>
              <p className="text-sm text-gray-500">Phone: +92 300 1234567</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-semibold text-gray-700">Fee Receipt</h2>
            <p className="text-sm text-gray-500">Receipt #: {`INV-${Date.now()}`}</p>
            <p className="text-sm text-gray-500">Date: {date.toLocaleDateString()}</p>
          </div>
        </header>
        
        <section className="my-6 grid grid-cols-2 gap-4">
           <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Billed To:</h3>
              <p className="font-bold">{family.fatherName} (Family ID: {family.id})</p>
              <p className="text-sm text-gray-600">{family.address}</p>
              <p className="text-sm text-gray-600">{family.phone}</p>
           </div>
            <div className="text-right">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Payment Details:</h3>
              <p className="text-sm text-gray-600"><span className="font-semibold">Payment Method:</span> Cash/Bank</p>
              <p className="text-sm text-gray-600"><span className="font-semibold">Status:</span> {remainingDues > 0 ? 'Partially Paid' : 'Paid in Full'}</p>
            </div>
        </section>

        <div className="my-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Fee Description</h3>
          <Table className="text-black">
              <TableHeader className="bg-gray-100">
                  <TableRow>
                  <TableHead className="text-gray-600">Description</TableHead>
                  <TableHead className="text-right text-gray-600">Amount (PKR)</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                  {fees.map((fee) => (
                  <TableRow key={fee.id}>
                      <TableCell className="font-medium">Tuition Fee for {fee.month}, {fee.year}</TableCell>
                      <TableCell className="text-right">{fee.amount.toLocaleString()}</TableCell>
                  </TableRow>
                  ))}
                  {fees.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={2} className="text-center">No fees being paid with this transaction.</TableCell>
                    </TableRow>
                  )}
              </TableBody>
          </Table>
        </div>

         <div className="flex justify-end mt-8">
          <div className="w-full max-w-xs space-y-2 text-right">
              <div className="flex justify-between">
                  <span className="font-semibold text-gray-600">Subtotal:</span>
                  <span>PKR {totalDues.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                  <span className="font-semibold text-gray-600">Paid Amount:</span>
                  <span>PKR {paidAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-red-600">
                  <span className="text-gray-800">Balance Due:</span>
                  <span>PKR {remainingDues.toLocaleString()}</span>
              </div>
          </div>
        </div>
        
        <footer className="mt-12 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
          <p className="mb-2">Thank you for your payment! For any inquiries, please contact the accounts office.</p>
          <p>&copy; {new Date().getFullYear()} EduCentral. All rights reserved.</p>
        </footer>
      </div>
    );
  }
);

FeeReceipt.displayName = 'FeeReceipt';
