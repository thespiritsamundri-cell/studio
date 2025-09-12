
'use client';

import React from 'react';
import type { SchoolSettings } from '@/context/settings-context';
import type { Class, Teacher, TimetableData } from '@/lib/types';
import Image from 'next/image';

interface MasterTimetablePrintProps {
  settings: SchoolSettings;
  classes: Class[];
  teachers: Teacher[];
  masterTimetableData: Record<string, TimetableData>;
  timeSlots: string[];
  breakAfterPeriod: number;
  breakDuration: string;
  numPeriods: number;
}

export const MasterTimetablePrint = React.forwardRef<HTMLDivElement, MasterTimetablePrintProps>(
  ({ settings, classes, teachers, masterTimetableData, timeSlots, breakAfterPeriod, breakDuration, numPeriods }, ref) => {
    
    const cellStyle: React.CSSProperties = {
        border: '1px solid #000',
        padding: '2px',
        height: '40px',
        textAlign: 'center',
        fontSize: '9px',
        wordBreak: 'break-word',
    };
    
    const headerStyle: React.CSSProperties = {
        ...cellStyle,
        fontWeight: 'bold',
        height: 'auto',
        backgroundColor: '#e5e7eb' // gray-200
    };

    const breakStyle: React.CSSProperties = {
        ...headerStyle,
        backgroundColor: '#d1fae5', // green-200
        writingMode: 'vertical-rl',
        transform: 'rotate(180deg)',
    };
    
    const sortedClasses = [...classes].sort((a,b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

    return (
      <div ref={ref} className="p-4 font-sans bg-white text-black">
        <header className="flex items-center justify-between pb-2 border-b-2 border-black">
          <div className="flex items-center gap-4">
            {settings.schoolLogo && <Image src={settings.schoolLogo} alt="School Logo" width={60} height={60} className="object-contain" />}
            <div>
              <h1 className="text-2xl font-bold">{settings.schoolName}</h1>
              <p className="text-xs">{settings.schoolAddress}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-semibold">MASTER TIMETABLE</h2>
            <p className="text-xs">{settings.academicYear}</p>
          </div>
        </header>

        <main className="mt-4">
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                 <colgroup>
                    <col style={{ width: '10%'}} />
                    {Array.from({ length: numPeriods }).map((_, i) => (
                        <col key={i} style={{ width: `${85 / numPeriods}%`}} />
                    ))}
                    <col style={{ width: '5%'}} />
                 </colgroup>
                <thead>
                    <tr>
                        <th style={{...headerStyle, width: '10%'}}>Class</th>
                         {Array.from({ length: numPeriods }).map((_, periodIndex) => (
                             <React.Fragment key={`header-frag-${periodIndex}`}>
                                <th style={headerStyle}>
                                    {`P-${periodIndex + 1}`}<br/>({timeSlots[periodIndex] || 'N/A'})
                                </th>
                                {(periodIndex + 1) === breakAfterPeriod && (
                                    <th key="break-header" style={breakStyle} rowSpan={sortedClasses.length + 1}>
                                        BREAK ({breakDuration})
                                    </th>
                                )}
                             </React.Fragment>
                         ))}
                    </tr>
                </thead>
                <tbody>
                    {sortedClasses.map((cls, classIndex) => (
                        <tr key={cls.id}>
                            <td style={{...cellStyle, fontWeight: 'bold'}}>{cls.name}</td>
                            {Array.from({ length: numPeriods }).map((_, periodIndex) => {
                                const totalCells = numPeriods + 1;
                                const cascadeStart = Math.floor(sortedClasses.length / 2) + 2;
                                if (classIndex >= cascadeStart && periodIndex > (totalCells - (classIndex - cascadeStart) - 1 )) {
                                    return null;
                                }
                                
                                const cell = masterTimetableData[cls.id]?.[periodIndex];
                                const teacher = teachers.find(t => t.id === cell?.teacherId);
                                return (
                                    <td key={periodIndex} style={cellStyle}>
                                        {cell?.subject ? (
                                            <div>
                                                <p className="font-bold">{teacher?.name || ''}</p>
                                                <p>{cell.subject}</p>
                                            </div>
                                        ) : null}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </main>
      </div>
    );
  }
);
MasterTimetablePrint.displayName = 'MasterTimetablePrint';
