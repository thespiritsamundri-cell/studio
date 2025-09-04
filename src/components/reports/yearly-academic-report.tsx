
'use client';

import React from 'react';
import type { SchoolSettings } from '@/context/settings-context';
import { School, Medal, Percent, FileSignature } from 'lucide-react';
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '../ui/badge';

interface YearlyAcademicReportProps {
  settings: SchoolSettings;
  title: string;
  data: {
    classResults: { [className: string]: { pass: number, fail: number, total: number } };
    topStudents: { id: string, name: string, class: string, percentage: number }[];
    classAttendance: { name: string, rate: number }[];
  };
}

export const YearlyAcademicPrintReport = React.forwardRef<HTMLDivElement, YearlyAcademicReportProps>(
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
            <h2 className="text-2xl font-semibold text-gray-700">Academic Report</h2>
            <p className="text-sm text-gray-500">{title}</p>
          </div>
        </header>

        <main className="mt-8 space-y-8">
            <div className="grid grid-cols-2 gap-8">
                <div>
                    <h3 className="text-xl font-bold mb-2 flex items-center gap-2"><Percent /> Attendance Rate by Class</h3>
                    <Table>
                        <TableHeader><TableRow><TableHead>Class</TableHead><TableHead className="text-right">Rate</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {data.classAttendance.map(c => (<TableRow key={c.name}><TableCell>{c.name}</TableCell><TableCell className="text-right font-semibold">{c.rate.toFixed(1)}%</TableCell></TableRow>))}
                        </TableBody>
                    </Table>
                </div>
                 <div>
                    <h3 className="text-xl font-bold mb-2 flex items-center gap-2"><FileSignature /> Pass/Fail Rate by Class</h3>
                    <Table>
                        <TableHeader><TableRow><TableHead>Class</TableHead><TableHead className="text-center">Pass</TableHead><TableHead className="text-center">Fail</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {Object.entries(data.classResults).map(([className, results]) => (<TableRow key={className}><TableCell>{className}</TableCell><TableCell className="text-center font-semibold text-green-600">{results.pass}</TableCell><TableCell className="text-center font-semibold text-red-600">{results.fail}</TableCell></TableRow>))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <div>
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2"><Medal /> Top Performing Students</h3>
                <Table>
                    <TableHeader><TableRow><TableHead>Rank</TableHead><TableHead>Student Name</TableHead><TableHead>Class</TableHead><TableHead className="text-right">Percentage</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {data.topStudents.map((s, index) => (<TableRow key={s.id}><TableCell><Badge>{index + 1}</Badge></TableCell><TableCell>{s.name}</TableCell><TableCell>{s.class}</TableCell><TableCell className="text-right font-semibold">{s.percentage.toFixed(2)}%</TableCell></TableRow>))}
                    </TableBody>
                </Table>
            </div>
        </main>
        
        <footer className="mt-12 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
          <p>This is a computer-generated report.</p>
        </footer>
      </div>
    );
  }
);
YearlyAcademicPrintReport.displayName = 'YearlyAcademicPrintReport';
