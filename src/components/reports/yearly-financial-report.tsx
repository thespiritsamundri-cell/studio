
'use client';

import React from 'react';
import type { SchoolSettings } from '@/context/settings-context';
import { School, BarChart3, TrendingUp, TrendingDown, Scale } from 'lucide-react';
import Image from 'next/image';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface YearlyFinancialPrintReportProps {
  settings: SchoolSettings;
  title: string;
  data: {
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    monthlyBreakdown: { name: string, income: number, expenses: number }[];
  };
  isMonthView: boolean;
}

export const YearlyFinancialPrintReport = React.forwardRef<HTMLDivElement, YearlyFinancialPrintReportProps>(
  ({ settings, title, data, isMonthView }, ref) => {
    
    return (
      <div ref={ref} className="p-8 font-sans bg-white text-black">
        <header className="flex items-center justify-between pb-4 border-b border-gray-300">
          <div className="flex items-center gap-4">
             {settings.schoolLogo && <Image src={settings.schoolLogo} alt="School Logo" width={64} height={64} className="object-contain" />}
            <div>
              <h1 className="text-4xl font-bold text-gray-800">{settings.schoolName}</h1>
              <p className="text-sm text-gray-500">{settings.schoolAddress}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-semibold text-gray-700">Financial Report</h2>
            <p className="text-sm text-gray-500">{title}</p>
          </div>
        </header>

        <main className="mt-8 space-y-8">
            <div className="grid grid-cols-3 gap-8">
                <div className="p-4 bg-green-100 border border-green-300 rounded-lg text-center">
                    <h3 className="font-semibold text-green-800 flex items-center justify-center gap-2"><TrendingUp/>Total Income</h3>
                    <p className="text-2xl font-bold text-green-700">PKR {data.totalIncome.toLocaleString()}</p>
                </div>
                 <div className="p-4 bg-red-100 border border-red-300 rounded-lg text-center">
                    <h3 className="font-semibold text-red-800 flex items-center justify-center gap-2"><TrendingDown/>Total Expenses</h3>
                    <p className="text-2xl font-bold text-red-700">PKR {data.totalExpenses.toLocaleString()}</p>
                </div>
                 <div className="p-4 bg-blue-100 border border-blue-300 rounded-lg text-center">
                    <h3 className="font-semibold text-blue-800 flex items-center justify-center gap-2"><Scale/>Net Profit / Loss</h3>
                    <p className="text-2xl font-bold text-blue-700">PKR {data.netProfit.toLocaleString()}</p>
                </div>
            </div>
            
            {!isMonthView && (
                <div>
                    <h3 className="text-xl font-bold mb-2 flex items-center gap-2"><BarChart3 /> Monthly Summary</h3>
                     <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data.monthlyBreakdown}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value) => `PKR ${value.toLocaleString()}`} />
                            <Legend />
                            <Bar dataKey="income" fill="#82ca9d" name="Income" />
                            <Bar dataKey="expenses" fill="#ff6b6b" name="Expenses" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </main>
        
        <footer className="mt-12 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
          <p>This is a computer-generated report.</p>
        </footer>
      </div>
    );
  }
);
YearlyFinancialPrintReport.displayName = 'YearlyFinancialPrintReport';
