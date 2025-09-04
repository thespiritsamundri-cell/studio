
'use client';

import React from 'react';
import type { SchoolSettings } from '@/context/settings-context';
import { School, BarChart3, PieChart } from 'lucide-react';
import Image from 'next/image';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Pie, Cell, ResponsiveContainer } from 'recharts';

interface YearlyAdmissionsReportProps {
  settings: SchoolSettings;
  title: string;
  data: {
    totalAdmissions: number;
    monthlyAdmissions: { name: string, count: number }[];
    classDistributionChartData: { name: string, value: number, fill: string }[];
  };
}

export const YearlyAdmissionsPrintReport = React.forwardRef<HTMLDivElement, YearlyAdmissionsReportProps>(
  ({ settings, title, data }, ref) => {
    
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
            <h2 className="text-2xl font-semibold text-gray-700">Admissions Report</h2>
            <p className="text-sm text-gray-500">{title}</p>
          </div>
        </header>

        <main className="mt-8 space-y-8">
            <div className="bg-gray-100 p-4 rounded-lg text-center">
                <h3 className="text-gray-600 font-semibold">Total New Admissions</h3>
                <p className="text-4xl font-bold text-gray-800">{data.totalAdmissions}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-8">
                <div>
                    <h3 className="text-xl font-bold mb-2 flex items-center gap-2"><BarChart3 /> Monthly Admissions</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data.monthlyAdmissions}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false}/>
                            <Tooltip />
                            <Bar dataKey="count" fill="#8884d8" name="Admissions" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                 <div>
                    <h3 className="text-xl font-bold mb-2 flex items-center gap-2"><PieChart /> Admissions by Class</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                             <Tooltip />
                            <Pie data={data.classDistributionChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                {data.classDistributionChartData.map((entry) => (<Cell key={`cell-${entry.name}`} fill={entry.fill} />))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </main>
        
        <footer className="mt-12 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
          <p>This is a computer-generated report.</p>
        </footer>
      </div>
    );
  }
);
YearlyAdmissionsPrintReport.displayName = 'YearlyAdmissionsPrintReport';
