
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Fee } from '@/lib/types';
import { School } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';

interface IncomePrintReportProps {
  fees: (Fee & { fatherName?: string })[];
  totalIncome: number;
  dateRange?: DateRange;
}

export const IncomePrintReport = React.forwardRef<HTMLDivElement, IncomePrintReportProps>(
  ({ fees, totalIncome, dateRange }, ref) => {
    const getPeriodText = () => {
        if (dateRange?.from && dateRange?.to) {
            return `From: ${format(dateRange.from, 'PPP')} To: ${format(dateRange.to, 'PPP')}`;
        }
        if (dateRange?.from) {
            return `Date: ${format(dateRange.from, 'PPP')}`;
        }
        return `As of: ${format(new Date(), 'PPP')}`;
    }

    return (
      <div ref={ref} className="p-8 font-sans bg-white text-black">
        <header className="flex items-center justify-between pb-4 border-b border-gray-300">
          <div className="flex items-center gap-4">
            <School className="w-16 h-16 text-blue-500" />
            <div>
              <h1 className="text-4xl font-bold text-gray-800">EduCentral</h1>
              <p className="text-sm text-gray-500">123 Education Lane, Knowledge City, Pakistan</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-semibold text-gray-700">Income Report</h2>
            <p className="text-sm text-gray-500">{getPeriodText()}</p>
          </div>
        </header>

        <main className="mt-8">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Challan ID</TableHead>
                <TableHead>Family ID</TableHead>
                <TableHead>Father's Name</TableHead>
                <TableHead>Payment Date</TableHead>
                <TableHead>Month/Year</TableHead>
                <TableHead className="text-right">Amount (PKR)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fees.map((fee) => (
                <TableRow key={fee.id}>
                  <TableCell>{fee.id}</TableCell>
                  <TableCell className="font-medium">{fee.familyId}</TableCell>
                  <TableCell>{fee.fatherName}</TableCell>
                  <TableCell>{format(new Date(fee.paymentDate), 'PPP')}</TableCell>
                  <TableCell>{fee.month}, {fee.year}</TableCell>
                  <TableCell className="text-right font-semibold text-green-600">{fee.amount.toLocaleString()}</TableCell>
                </TableRow>
              ))}
               {fees.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className='text-center py-10'>No income records found for the selected period.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </main>
        
        <div className="flex justify-end mt-8">
            <div className="w-full max-w-xs space-y-2 text-right">
                <div className="flex justify-between text-lg font-bold">
                    <span className="text-gray-800">Total Income:</span>
                    <span>PKR {totalIncome.toLocaleString()}</span>
                </div>
            </div>
        </div>

        <footer className="mt-12 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
          <p>This is a computer-generated report.</p>
          <p>&copy; {new Date().getFullYear()} EduCentral. All rights reserved.</p>
        </footer>
      </div>
    );
  }
);

IncomePrintReport.displayName = 'IncomePrintReport';
