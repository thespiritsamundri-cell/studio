
'use client';

import React from 'react';
import type { SchoolSettings } from '@/context/settings-context';
import type { Class, TimetableData, TimetableCell } from '@/lib/types';
import { School } from 'lucide-react';
import Image from 'next/image';
import { useData } from '@/context/data-context';

interface TimetablePrintProps {
  settings: SchoolSettings;
  classInfo: Class;
  timetableData: TimetableData;
  timeSlots: string[];
  daysOfWeek: string[];
}

export const TimetablePrint = React.forwardRef<HTMLDivElement, TimetablePrintProps>(
  ({ settings, classInfo, timetableData, timeSlots, daysOfWeek }, ref) => {
    
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
      <div ref={ref} className="p-4 font-sans bg-white text-black">
        <header className="flex items-center justify-between pb-4 border-b-2 border-black">
          <div className="flex items-center gap-4">
            {settings.schoolLogo && <Image src={settings.schoolLogo} alt="School Logo" width={80} height={80} className="object-contain" />}
            <div>
              <h1 className="text-4xl font-bold">{settings.schoolName}</h1>
              <p className="text-sm">{settings.schoolAddress}</p>
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
                        {periodHeaders.map((header, index) => <th key={header} style={headerStyle}>{header}<br/>{timeSlots[index]}</th>)}
                    </tr>
                </thead>
                <tbody>
                     {daysOfWeek.map((day, dayIndex) => {
                         const breakIndex = 4;
                         const breakCell = <td style={{...cellStyle, writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontWeight: 'bold', fontSize: '20px', backgroundColor: '#374151', color: 'white'}} rowSpan={daysOfWeek.length}>BREAK</td>;

                         return (
                             <tr key={`${day}`}>
                                 <td style={{...cellStyle, fontWeight: 'bold'}}>{day}</td>
                                 {Array.from({ length: 8 }).map((_, colIndex) => {
                                      if (colIndex === breakIndex) {
                                        return dayIndex === 0 ? breakCell : null;
                                      }
                                      const cell = timetableData[dayIndex]?.[colIndex];
                                      const teacher = teachers.find(t => t.id === cell?.teacherId);
                                      return (
                                        <td key={colIndex} style={cellStyle}>
                                            <div className="whitespace-pre-wrap">
                                                {cell ? (
                                                  <>
                                                    <p className="font-bold">{cell.subject}</p>
                                                    <p className="text-muted-foreground">{teacher?.name}</p>
                                                  </>
                                                ): ''}
                                            </div>
                                        </td>
                                      )
                                 })}
                             </tr>
                         )
                     })}
                </tbody>
            </table>
        </main>
        
        <footer className="flex justify-between items-center mt-24 pt-4 border-t-2 border-black">
            <div className="w-1/3 text-center">
                <p className="border-t-2 border-black pt-1">Principal Signature</p>
            </div>
            <div className="w-1/3 text-center">
                <p>&copy; {new Date().getFullYear()} {settings.schoolName}</p>
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
