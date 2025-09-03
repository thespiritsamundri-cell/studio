
'use client';

import React from 'react';
import type { SchoolSettings } from '@/context/settings-context';
import type { Class, TimetableData } from '@/lib/types';
import { School } from 'lucide-react';
import Image from 'next/image';

interface TimetablePrintProps {
  settings: SchoolSettings;
  classInfo: Class;
  timetableData: TimetableData;
  periodHeaders: string[];
  daysOfWeek: string[];
}

export const TimetablePrint = React.forwardRef<HTMLDivElement, TimetablePrintProps>(
  ({ settings, classInfo, timetableData, periodHeaders, daysOfWeek }, ref) => {
    
    const sections = classInfo.sections.length > 0 ? classInfo.sections : [classInfo.name];
    let rowIndex = 0;
    
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
                         {sections.length > 1 && <th style={headerStyle}>Section</th>}
                        {periodHeaders.map(header => <th key={header} style={headerStyle}>{header}</th>)}
                    </tr>
                </thead>
                <tbody>
                     {sections.map(section => (
                        daysOfWeek.map((day, dayIndex) => {
                            const currentRow = rowIndex;
                            rowIndex++;
                             // Special handling for Break
                            const breakIndex = 4; // Assuming 5th period is break
                            const breakCell = <td style={{...cellStyle, writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontWeight: 'bold', fontSize: '20px', backgroundColor: '#374151', color: 'white'}} rowSpan={daysOfWeek.length * sections.length}>BREAK</td>;

                            return (
                                <tr key={`${section}-${day}`}>
                                    {dayIndex === 0 && sections.length > 1 && <td style={{...cellStyle, fontWeight: 'bold'}} rowSpan={daysOfWeek.length}>{section}</td>}
                                    <td style={{...cellStyle, fontWeight: 'bold'}}>{day}</td>
                                    {Array.from({ length: 8 }).map((_, colIndex) => (
                                         colIndex === breakIndex && currentRow === 0 ? breakCell : colIndex !== breakIndex && (
                                            <td key={colIndex} style={cellStyle}>
                                                <div className="whitespace-pre-wrap">{timetableData[currentRow]?.[colIndex] || ''}</div>
                                            </td>
                                         )
                                    ))}
                                </tr>
                            )
                        })
                    ))}
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
