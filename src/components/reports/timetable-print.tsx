
'use client';

import React from 'react';
import type { Class, TimetableData } from '@/lib/types';
import { School } from 'lucide-react';
import Image from 'next/image';
import { useData } from '@/context/data-context';
import type { SchoolSettings } from '@/context/settings-context';


interface TimetablePrintProps {
  classInfo: Class;
  timetableData: TimetableData;
  timeSlots: string[];
  daysOfWeek: string[];
  breakAfterPeriod: number;
  breakDuration: string;
}

export const TimetablePrint = React.forwardRef<HTMLDivElement, TimetablePrintProps>(
  ({ classInfo, timetableData, timeSlots, daysOfWeek, breakAfterPeriod, breakDuration }, ref) => {
    
    const { teachers } = useData();
    const periodHeaders = Array.from({ length: 8 }, (_, i) => `Period ${i + 1}`);

    const cellStyle: React.CSSProperties = {
        border: '1px solid #000',
        padding: '4px',
        height: '60px',
        textAlign: 'center',
        fontSize: '10px'
    };
    
    const headerStyle: React.CSSProperties = {
        ...cellStyle,
        fontWeight: 'bold',
        height: 'auto',
        backgroundColor: '#e5e7eb' // gray-200
    };

    return (
      <div ref={ref} className="p-4 font-sans bg-white text-black landscape">
        <header className="flex items-center justify-between pb-4 border-b-2 border-black">
          <div className="flex items-center gap-4">
            {classInfo.schoolLogo && <Image src={classInfo.schoolLogo} alt="School Logo" width={80} height={80} className="object-contain" />}
            <div>
              <h1 className="text-4xl font-bold">{classInfo.schoolName}</h1>
              <p className="text-sm">{classInfo.schoolAddress}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-semibold">CLASS TIMETABLE</h2>
          </div>
        </header>

        <main className="mt-6">
            <h3 className="text-2xl font-bold text-center mb-4">Class: {classInfo.name}</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th style={headerStyle}>Day</th>
                        {periodHeaders.map((header, index) => {
                            const periodNumber = index < breakAfterPeriod ? index + 1 : index;
                            if (index === breakAfterPeriod) {
                                return (
                                    <React.Fragment key={header}>
                                        <th style={headerStyle}>{`Period ${periodNumber}`}<br/>({timeSlots[index]})</th>
                                        <th style={{...headerStyle, backgroundColor: '#d1fae5', writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: '20px' }} rowSpan={daysOfWeek.length + 1}>
                                            BREAK ({breakDuration})
                                        </th>
                                    </React.Fragment>
                                )
                            }
                            return <th key={header} style={headerStyle}>{`Period ${periodNumber}`}<br/>({timeSlots[index]})</th>
                        })}
                    </tr>
                </thead>
                <tbody>
                     {daysOfWeek.map((day) => (
                         <tr key={day}>
                             <td style={{...cellStyle, fontWeight: 'bold'}}>{day}</td>
                             {Array.from({ length: 8 }).map((_, colIndex) => {
                                  if (colIndex === breakAfterPeriod) return null; // Don't render cell for break column
                                  const cell = timetableData[colIndex];
                                  const teacher = teachers.find(t => t.id === cell?.teacherId);
                                  return (
                                    <td key={colIndex} style={cellStyle}>
                                        <div className="whitespace-pre-wrap">
                                            {cell ? (
                                              <>
                                                <p className="font-bold">{cell.subject}</p>
                                                <p className="text-gray-600">{teacher?.name}</p>
                                              </>
                                            ): ''}
                                        </div>
                                    </td>
                                  )
                             })}
                         </tr>
                     ))}
                </tbody>
            </table>
        </main>
        
        <footer className="flex justify-between items-center mt-24 pt-4 border-t-2 border-black">
            <div className="w-1/3 text-center">
                <p className="border-t-2 border-black pt-1">Principal Signature</p>
            </div>
            <div className="w-1/3 text-center">
                <p>&copy; {new Date().getFullYear()} {classInfo.schoolName}</p>
            </div>
            <div className="w-1/3 text-center">
                 <p className="border-t-2 border-black pt-1">Director's Signature</p>
            </div>
        </footer>
      </div>
    );
  }
);
TimetablePrint.displayName = 'TimetablePrint';
