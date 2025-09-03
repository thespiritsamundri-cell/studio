
'use client';

import React from 'react';
import type { SchoolSettings } from '@/context/settings-context';
import { School } from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface FinancialsPrintReportProps {
  date: Date;
  incomeData: { name: string; amount: number }[];
  expenseData: { name: string; amount: number }[];
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  settings: SchoolSettings;
}

export const FinancialsPrintReport = React.forwardRef<HTMLDivElement, FinancialsPrintReportProps>(
  ({ date, incomeData, expenseData, totalIncome, totalExpenses, netProfit, settings }, ref) => {
    
    const trialBalanceLength = Math.max(incomeData.length, expenseData.length);
    const trialBalanceRows = Array.from({ length: trialBalanceLength }, (_, i) => ({
        income: incomeData[i],
        expense: expenseData[i]
    }));

    const cellStyle: React.CSSProperties = {
        border: '1px solid #ddd',
        padding: '8px',
    };
     const headerCellStyle: React.CSSProperties = {
        ...cellStyle,
        fontWeight: 'bold',
        backgroundColor: '#f9fafb'
    };

    return (
      <div ref={ref} className="p-8 font-sans bg-white text-black">
        <header className="flex items-center justify-between pb-4 border-b border-gray-300">
          <div className="flex items-center gap-4">
             {settings.schoolLogo ? (
              <Image src={settings.schoolLogo} alt="School Logo" width={64} height={64} className="object-contain" />
            ) : (
              <School className="w-16 h-16 text-blue-500" />
            )}
            <div>
              <h1 className="text-4xl font-bold text-gray-800">{settings.schoolName}</h1>
              <p className="text-sm text-gray-500">{settings.schoolAddress}</p>
              <p className="text-sm text-gray-500">Phone: {settings.schoolPhone}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-semibold text-gray-700">Financial Report</h2>
            <p className="text-sm text-gray-500">For the Month of: {format(date, 'MMMM yyyy')}</p>
          </div>
        </header>

        <main className="mt-8">
          <h3 className="text-xl font-bold text-center mb-4">Profit & Loss Statement</h3>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-lg text-center text-green-700 mb-2">Income</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse'}}>
                <thead style={{ backgroundColor: '#f9fafb'}}>
                    <tr>
                        <th style={headerCellStyle}>Category</th>
                        <th style={headerCellStyle} className="text-right">Amount (PKR)</th>
                    </tr>
                </thead>
                <tbody>
                    {incomeData.map(item => (
                        <tr key={item.name}><td style={cellStyle}>{item.name}</td><td style={cellStyle} className="text-right">{item.amount.toLocaleString()}</td></tr>
                    ))}
                </tbody>
                 <tfoot style={{fontWeight: 'bold', backgroundColor: '#f9fafb'}}>
                    <tr>
                        <td style={cellStyle}>Total Income</td>
                        <td style={cellStyle} className="text-right">{totalIncome.toLocaleString()}</td>
                    </tr>
                </tfoot>
              </table>
            </div>
            <div>
              <h4 className="font-semibold text-lg text-center text-red-700 mb-2">Expenses</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse'}}>
                <thead style={{ backgroundColor: '#f9fafb'}}>
                    <tr>
                        <th style={headerCellStyle}>Category</th>
                        <th style={headerCellStyle} className="text-right">Amount (PKR)</th>
                    </tr>
                </thead>
                <tbody>
                    {expenseData.map(item => (
                        <tr key={item.name}><td style={cellStyle}>{item.name}</td><td style={cellStyle} className="text-right">{item.amount.toLocaleString()}</td></tr>
                    ))}
                </tbody>
                 <tfoot style={{fontWeight: 'bold', backgroundColor: '#f9fafb'}}>
                    <tr>
                        <td style={cellStyle}>Total Expenses</td>
                        <td style={cellStyle} className="text-right">{totalExpenses.toLocaleString()}</td>
                    </tr>
                </tfoot>
              </table>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
             <div className="w-1/2 text-right border-t-2 border-black pt-2">
                <p className="text-lg font-bold">Net Profit / Loss: PKR {netProfit.toLocaleString()}</p>
             </div>
          </div>
          
           <h3 className="text-xl font-bold text-center mt-12 mb-4">Trial Balance</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th style={headerCellStyle}>Debits (Expenses)</th>
                        <th style={headerCellStyle} className="text-right">Amount</th>
                        <th style={{...headerCellStyle, borderLeft: '2px solid black' }}>Credits (Income)</th>
                        <th style={headerCellStyle} className="text-right">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    {trialBalanceRows.map((row, index) => (
                        <tr key={index}>
                            <td style={cellStyle}>{row.expense?.name || ''}</td>
                            <td style={cellStyle} className="text-right">{row.expense?.amount.toLocaleString() || ''}</td>
                            <td style={{...cellStyle, borderLeft: '2px solid black'}}>{row.income?.name || ''}</td>
                            <td style={cellStyle} className="text-right">{row.income?.amount.toLocaleString() || ''}</td>
                        </tr>
                    ))}
                </tbody>
                 <tfoot style={{fontWeight: 'bold', backgroundColor: '#f9fafb'}}>
                    <tr>
                        <td style={cellStyle}>Total Debits</td>
                        <td style={cellStyle} className="text-right">{totalExpenses.toLocaleString()}</td>
                        <td style={{...cellStyle, borderLeft: '2px solid black'}}>Total Credits</td>
                        <td style={cellStyle} className="text-right">{totalIncome.toLocaleString()}</td>
                    </tr>
                </tfoot>
            </table>
            
        </main>
        
        <footer className="mt-12 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
          <p>This is a computer-generated report.</p>
          <p>&copy; {new Date().getFullYear()} {settings.schoolName}. All rights reserved.</p>
        </footer>
      </div>
    );
  }
);
FinancialsPrintReport.displayName = 'FinancialsPrintReport';

